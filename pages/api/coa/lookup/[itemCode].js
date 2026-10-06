// pages/api/coa/lookup/[itemCode].js
// Given a pack-size item code, returns every batch's COA source info — mirrors
// the CoaSource/LocalCOAFilename/EnergyCoaUrl logic already used by the product
// detail page's inventory query (lib/models/products.js), just scoped to COA
// fields only. Used to drive the "lot no" dropdown for 3A COA (ENERGY source,
// keyed by vendor batch no) and Density COA (LOCAL source, our own SAP attachment).
import { queryDatabase } from "../../../../lib/db";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { itemCode } = req.query;
  if (!itemCode || !itemCode.trim()) {
    return res.status(400).json({ message: "itemCode is required" });
  }

  try {
    const results = await queryDatabase(
      `
      SELECT DISTINCT
        B.BatchNum                                        AS BatchNum,
        ISNULL(B.U_vendorbatchno, '')                     AS VendorBatchNum,
        EC.EffectiveCOA                                    AS LocalCOAFilename,
        CASE
            WHEN EC.EffectiveCOA IS NOT NULL
                THEN 'LOCAL'
            WHEN ISNULL(B.U_vendorbatchno, '') <> ''
                THEN 'ENERGY'
            ELSE 'NONE'
        END AS CoaSource
      FROM OIBT B
      -- Same batch number is sometimes only attached to the "-SPEC" item code instead
      -- of the specific pack-size item code, so fall back to that variant's COA.
      LEFT JOIN OIBT SPEC_B
        ON SPEC_B.ItemCode = LEFT(B.ItemCode, CHARINDEX('-', B.ItemCode + '-') - 1) + '-SPEC'
       AND SPEC_B.BatchNum = B.BatchNum
      CROSS APPLY (
        SELECT COALESCE(
          NULLIF(LTRIM(RTRIM(CAST(B.U_COA AS NVARCHAR(MAX)))), ''),
          NULLIF(LTRIM(RTRIM(CAST(SPEC_B.U_COA AS NVARCHAR(MAX)))), '')
        ) AS EffectiveCOA
      ) EC
      WHERE B.ItemCode = @itemCode
        AND (EC.EffectiveCOA IS NOT NULL OR ISNULL(B.U_vendorbatchno, '') <> '')
      ORDER BY VendorBatchNum, BatchNum
      `,
      [{ name: "itemCode", type: sql.NVarChar, value: itemCode.trim() }]
    );

    return res.status(200).json({ batches: results });
  } catch (err) {
    console.error("COA lookup error:", err);
    return res.status(500).json({ message: "Failed to fetch COA batch info", error: err.message });
  }
}
