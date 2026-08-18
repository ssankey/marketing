// pages/api/products/energy-seal-line-items.js
import sql from "mssql";
import { queryDatabase } from "../../../lib/db";
import { ENERGY_SEAL_ITEM_CODES, ENERGY_SEAL_CAS_BY_CODE } from "../../../utils/energySeal/constants";
import { getGroupBySql } from "../../../lib/energySeal/regionMapping";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { month, groupBy = "salesperson", field } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: "month must be in YYYY-MM format" });
    }
    if (!["salesperson", "region"].includes(groupBy)) {
      return res.status(400).json({ error: "groupBy must be 'salesperson' or 'region'" });
    }
    if (!field) {
      return res.status(400).json({ error: "field is required" });
    }

    const [year, monthNum] = month.split("-").map(Number);
    const { fieldExpr, joinSQL } = getGroupBySql(groupBy);

    const itemList = ENERGY_SEAL_ITEM_CODES
      .map((c) => `'${c.replace(/'/g, "''")}'`)
      .join(",");

    const params = [
      { name: "year", type: sql.Int, value: year },
      { name: "month", type: sql.Int, value: monthNum },
      { name: "field", type: sql.NVarChar, value: field },
    ];

    // Line-item level detail behind a table row — same OINV/INV1 base as
    // energy-seal-sales.js's sales/line-item query, just unaggregated.
    const query = `
      SELECT
        T0.DocNum AS InvoiceNo,
        T1.ItemCode AS ItemCode,
        T1.Dscription AS ItemName,
        T1.Quantity AS Qty,
        T1.Price AS UnitPrice,
        T1.LineTotal AS TotalPrice
      FROM OINV T0
      JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      ${joinSQL}
      WHERE T0.CANCELED <> 'Y' AND T0.CANCELED <> 'C'
        AND T1.ItemCode IN (${itemList})
        AND YEAR(T0.DocDate) = @year
        AND MONTH(T0.DocDate) = @month
        AND (${fieldExpr}) = @field
      ORDER BY T0.DocDate DESC;
    `;

    const rows = await queryDatabase(query, params);

    const data = rows.map((r) => ({
      invoiceNo: r.InvoiceNo,
      itemCode: r.ItemCode,
      itemName: r.ItemName,
      cas: ENERGY_SEAL_CAS_BY_CODE[r.ItemCode] || "-",
      unitPrice: parseFloat(r.UnitPrice) || 0,
      qty: parseFloat(r.Qty) || 0,
      totalPrice: parseFloat(r.TotalPrice) || 0,
    }));

    return res.status(200).json({ data, field, month, groupBy });
  } catch (error) {
    console.error("[energy-seal-line-items] error:", error.message);
    return res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
