import { verify } from 'jsonwebtoken';
import sql from 'mssql';
import { queryDatabase } from 'lib/db';
import { setCorsHeaders } from 'lib/cors';

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

    let decoded;
    try { decoded = verify(authHeader.split(' ')[1], process.env.JWT_SECRET); }
    catch { return res.status(401).json({ error: 'Invalid token' }); }

    const { itemCode } = req.query;
    if (!itemCode) return res.status(400).json({ error: 'itemCode is required' });

    const params = [{ name: 'itemCode', type: sql.NVarChar, value: itemCode }];

    // ── Product info ──────────────────────────────────────
    const productQuery = `
      SELECT
        T0.ItemCode                   AS itemCode,
        T0.ItemName                   AS itemName,
        T0.U_CasNo                    AS casNo,
        T0.U_MolucularFormula         AS molecularFormula,
        T0.U_MolucularWeight          AS molecularWeight,
        T0.U_IUPACName                AS iupacName,
        T0.U_Synonyms                 AS synonyms,
        T0.U_Applications             AS applications,
        T0.CreateDate                 AS createdDate,
        T0.UpdateDate                 AS updatedDate,
        T1.ItmsGrpNam                 AS category,
        COALESCE(W.TotalOnHand, 0)    AS stockQty,
        CASE WHEN COALESCE(W.TotalOnHand, 0) > 0
          THEN 'In Stock' ELSE 'Out of Stock'
        END AS stockStatus
      FROM OITM T0
      INNER JOIN OITB T1 ON T0.ItmsGrpCod = T1.ItmsGrpCod
      LEFT JOIN (
        SELECT ItemCode, SUM(COALESCE(OnHand, 0)) AS TotalOnHand
        FROM OITW GROUP BY ItemCode
      ) W ON W.ItemCode = T0.ItemCode
      WHERE T0.ItemCode = @itemCode;
    `;

    // ── Batches ──────────────────────────────────────────
    // ✅ Key insight from SSMS testing:
    // - Join OIBT (batch master) with OITW (warehouse) on ItemCode only
    // - Use OIBT.Quantity > 0 to filter active batches
    // - Use DISTINCT to avoid any edge-case duplicates
    // - NO IBT1 join — that table has one row per transaction = duplicates
    const batchesQuery = `
      SELECT DISTINCT
        W.WhsCode                                         AS location,
        WH.WhsName                                        AS warehouseName,
        B.BatchNum                                        AS batchNo,
        ISNULL(B.U_vendorbatchno, '')                     AS vendorBatchNo,
        B.Quantity                                        AS qty,
        CAST(B.U_COA AS NVARCHAR(MAX))                    AS localCoaFilename,
        CASE
          WHEN B.U_COA IS NOT NULL
            AND LTRIM(RTRIM(CAST(B.U_COA AS NVARCHAR(MAX)))) <> ''
            THEN ''
          WHEN ISNULL(B.U_vendorbatchno, '') <> ''
            THEN 'https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/' +
                 LEFT(@itemCode, CHARINDEX('-', @itemCode + '-') - 1) + '_' + B.U_vendorbatchno + '.pdf'
          ELSE ''
        END AS energyCoaUrl,
        CASE
          WHEN B.U_COA IS NOT NULL
            AND LTRIM(RTRIM(CAST(B.U_COA AS NVARCHAR(MAX)))) <> '' THEN 'LOCAL'
          WHEN ISNULL(B.U_vendorbatchno, '') <> ''                  THEN 'ENERGY'
          ELSE 'NONE'
        END AS coaSource
      FROM OIBT B
      LEFT JOIN OITW W  ON B.ItemCode = W.ItemCode
                        AND W.OnHand   > 0
      LEFT JOIN OWHS WH ON W.WhsCode  = WH.WhsCode
      WHERE B.ItemCode = @itemCode
        AND B.Quantity  > 0
      ORDER BY B.Quantity DESC, B.U_vendorbatchno;
    `;

    const [productRows, batchRows] = await Promise.all([
      queryDatabase(productQuery, params),
      queryDatabase(batchesQuery, params),
    ]);

    if (!productRows.length) return res.status(404).json({ error: 'Product not found' });

    const p = productRows[0];
    const product = {
      itemCode:         p.itemCode         || '',
      itemName:         p.itemName         || '',
      casNo:            p.casNo            || null,
      molecularFormula: p.molecularFormula || null,
      molecularWeight:  p.molecularWeight  || null,
      iupacName:        p.iupacName        || null,
      synonyms:         p.synonyms         || null,
      applications:     p.applications     || null,
      createdDate:      p.createdDate      ? new Date(p.createdDate).toISOString().split('T')[0] : null,
      updatedDate:      p.updatedDate      ? new Date(p.updatedDate).toISOString().split('T')[0] : null,
      category:         p.category         || null,
      stockQty:         parseFloat(p.stockQty) || 0,
      stockStatus:      p.stockStatus      || 'Out of Stock',
      batches: batchRows.map(b => ({
        location:         b.location         || null,
        warehouseName:    b.warehouseName    || null,
        qty:              parseFloat(b.qty)  || 0,
        batchNo:          b.batchNo          || null,
        vendorBatchNo:    b.vendorBatchNo    || null,
        localCoaFilename: b.localCoaFilename || null,
        energyCoaUrl:     b.energyCoaUrl     || null,
        coaSource:        b.coaSource        || 'NONE',
      })),
    };

    return res.status(200).json({ product });

  } catch (error) {
    console.error('products/detail error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}