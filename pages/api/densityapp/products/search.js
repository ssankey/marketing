// pages/api/densityapp/products/search.js
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

    const { q = '', limit = '7' } = req.query;
    const term = q.trim();

    if (!term) return res.status(200).json({ suggestions: [], results: [] });

    const maxRows = Math.min(parseInt(limit) || 7, 20);
    const escaped = term.replace(/'/g, "''");

    // Search by: CAS no, item code (cat no), item name
    const searchQuery = `
      SELECT TOP ${maxRows}
        T0.ItemCode                                       AS itemCode,
        T0.ItemName                                       AS itemName,
        T0.U_CasNo                                        AS casNo,
        T0.U_MolucularFormula                             AS molecularFormula,
        T0.U_MolucularWeight                              AS molecularWeight,
        T1.ItmsGrpNam                                     AS category,
        T0.CreateDate                                     AS createdDate,
        T0.UpdateDate                                     AS updatedDate,
        COALESCE(W.TotalOnHand, 0)                        AS stockQty,
        CASE WHEN COALESCE(W.TotalOnHand, 0) > 0
          THEN 'In Stock' ELSE 'Out of Stock'
        END AS stockStatus
      FROM OITM T0
      INNER JOIN OITB T1 ON T0.ItmsGrpCod = T1.ItmsGrpCod
      LEFT JOIN (
        SELECT ItemCode, SUM(COALESCE(OnHand, 0)) AS TotalOnHand
        FROM OITW GROUP BY ItemCode
      ) W ON W.ItemCode = T0.ItemCode
      WHERE
        T0.ItemCode LIKE '%${escaped}%'
        OR T0.ItemName LIKE '%${escaped}%'
        OR T0.U_CasNo  LIKE '%${escaped}%'
      ORDER BY T0.ItemName ASC;
    `;

    const rows = await queryDatabase(searchQuery, []);

    const results = rows.map(r => ({
      itemCode:         r.itemCode        || '',
      itemName:         r.itemName        || '',
      casNo:            r.casNo           || null,
      molecularFormula: r.molecularFormula || null,
      molecularWeight:  r.molecularWeight  || null,
      category:         r.category         || null,
      createdDate:      r.createdDate      ? new Date(r.createdDate).toISOString().split('T')[0] : null,
      updatedDate:      r.updatedDate      ? new Date(r.updatedDate).toISOString().split('T')[0] : null,
      stockQty:         parseFloat(r.stockQty) || 0,
      stockStatus:      r.stockStatus      || 'Out of Stock',
    }));

    const suggestions = results.map(r => ({
      label:    `${r.itemCode} · ${r.itemName}${r.casNo ? ' · CAS: ' + r.casNo : ''}`,
      itemCode: r.itemCode,
    }));

    return res.status(200).json({ suggestions, results });

  } catch (error) {
    console.error('products/search error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}