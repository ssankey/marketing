// pages/api/catalyst/pricing.js
import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // NOTE: OnHand is aggregated across warehouses the same way lib/models/products.js does it.
    // NOTE: Pricing is pulled via the same [@PRICING_H]/[@PRICING_R] join used in
    // pages/api/stock-check/items.js. OUTER APPLY + TOP 1 is used to guarantee one price
    // row per item even if a catalyst item has multiple price-list rows (e.g. different pack
    // sizes) — currently just takes the first one found. Adjust the ORDER BY inside the APPLY
    // if a different pack size/tier should be treated as the "current" list price.
    //
    // TODO: confirm UDF field name with SAP admin — "% of Pd Metal including loss" and
    // "Fibrication charges/gram on product" are not confirmed to exist on OITM yet.
    // Until confirmed, both are selected as NULL so the frontend falls back to a
    // manually-editable value per row instead of silently defaulting to 0.
    const query = `
      SELECT
        T0.ItemCode,                      -- full SKU, e.g. DP00001-10g (cat_size_main)
        T0.U_CasNo AS CAS,
        T0.U_ALTCAT AS CatNo,              -- base cat no, e.g. DP00001
        T0.ItemName AS [Description],
        T1.ItmsGrpNam AS Category,
        T0.U_WebsiteDisplay AS WebsiteDisplay,
        ISNULL(W.TotalOnHand, 0) AS StockInIndia,
        ISNULL(P.U_Price, 0) AS WebPrice,
        P.U_UOM AS PKZ,                     -- pack-size label, e.g. "10g"
        ISNULL(P.U_Quantity, 0) AS QTY,     -- pack size in grams, e.g. 10.00
        'GMS' AS UOM,                       -- base unit of measure (constant for this range)
        NULL AS PdPercent,   -- TODO: confirm UDF field name with SAP admin (e.g. U_PdPercent)
        NULL AS FabCharge    -- TODO: confirm UDF field name with SAP admin (e.g. U_FabCharge)
      FROM OITM T0
      INNER JOIN OITB T1 ON T0.ItmsGrpCod = T1.ItmsGrpCod
      LEFT JOIN (
        SELECT ItemCode, SUM(COALESCE(OnHand, 0)) AS TotalOnHand
        FROM OITW
        GROUP BY ItemCode
      ) W ON W.ItemCode = T0.ItemCode
      OUTER APPLY (
        -- No ORDER BY here on purpose: we don't know @PRICING_R's row-ordering column
        -- (e.g. LineNum) for certain. If a catalyst item has multiple price rows, this
        -- picks an arbitrary one — verify against a known multi-price-row item before relying on it.
        SELECT TOP 1 R.U_UOM, R.U_Quantity, R.U_Price
        FROM [@PRICING_H] H
        INNER JOIN [@PRICING_R] R ON H.DocEntry = R.DocEntry
        WHERE H.U_Code = T0.ItemCode
      ) P
      WHERE T1.ItmsGrpNam = 'Catalyst'
      ORDER BY T0.ItemCode;
    `;

    const items = await queryDatabase(query);
    res.status(200).json({ items });
  } catch (error) {
    console.error("Error fetching catalyst pricing data:", error);
    res.status(500).json({
      message: "Failed to fetch catalyst pricing data",
      error: error.message,
    });
  }
}
