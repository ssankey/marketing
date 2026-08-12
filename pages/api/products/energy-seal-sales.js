// pages/api/products/energy-seal-sales.js
import sql from "mssql";
import { queryDatabase } from "../../../lib/db";
import { ENERGY_SEAL_ITEM_CODES } from "../../../utils/energySeal/constants";
import { getGroupBySql } from "../../../lib/energySeal/regionMapping";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { month, groupBy = "salesperson" } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: "month must be in YYYY-MM format" });
    }
    if (!["salesperson", "region"].includes(groupBy)) {
      return res.status(400).json({ error: "groupBy must be 'salesperson' or 'region'" });
    }

    const [year, monthNum] = month.split("-").map(Number);

    const { fieldExpr, joinSQL } = getGroupBySql(groupBy);

    const itemList = ENERGY_SEAL_ITEM_CODES
      .map((c) => `'${c.replace(/'/g, "''")}'`)
      .join(",");

    const params = [
      { name: "year", type: sql.Int, value: year },
      { name: "month", type: sql.Int, value: monthNum },
    ];

    // Sales value + line-item count come from invoices (OINV/INV1), net of
    // credit notes (ORIN/RIN1) for the same scope — mirrors pages/api/sales-cogs.js's
    // TotalSales / InvoiceCount queries.
    const salesQuery = `
      SELECT Field, SUM(SalesValue) AS SalesValue, SUM(LineItems) AS LineItems
      FROM (
        SELECT
          ${fieldExpr} AS Field,
          T1.LineTotal AS SalesValue,
          1 AS LineItems
        FROM OINV T0
        JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
        ${joinSQL}
        WHERE T0.CANCELED = 'N'
          AND T0.[IssReason] <> '4'
          AND T1.ItemCode IN (${itemList})
          AND YEAR(T0.DocDate) = @year
          AND MONTH(T0.DocDate) = @month

        UNION ALL

        SELECT
          ${fieldExpr} AS Field,
          -T1.LineTotal AS SalesValue,
          -1 AS LineItems
        FROM ORIN T0
        JOIN RIN1 T1 ON T0.DocEntry = T1.DocEntry
        ${joinSQL}
        WHERE T0.CANCELED = 'N'
          AND T1.ItemCode IN (${itemList})
          AND YEAR(T0.DocDate) = @year
          AND MONTH(T0.DocDate) = @month
      ) AS Combined
      GROUP BY Field;
    `;

    // Order value comes from open sales orders (ORDR/RDR1) — a separate
    // pipeline stage from invoiced sales, same as sales-cogs.js's orderValueQuery.
    const orderQuery = `
      SELECT
        ${fieldExpr} AS Field,
        SUM(T1.LineTotal) AS OrderValue
      FROM ORDR T0
      JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
      ${joinSQL}
      WHERE T0.CANCELED = 'N'
        AND T1.ItemCode IN (${itemList})
        AND YEAR(T0.DocDate) = @year
        AND MONTH(T0.DocDate) = @month
      GROUP BY ${fieldExpr};
    `;

    const [salesRows, orderRows] = await Promise.all([
      queryDatabase(salesQuery, params),
      queryDatabase(orderQuery, params),
    ]);

    const map = {};
    salesRows.forEach((r) => {
      map[r.Field] = {
        field: r.Field,
        salesValue: parseFloat(r.SalesValue) || 0,
        lineItems: parseInt(r.LineItems, 10) || 0,
        orderValue: 0,
      };
    });
    orderRows.forEach((r) => {
      if (!map[r.Field]) {
        map[r.Field] = { field: r.Field, salesValue: 0, lineItems: 0, orderValue: 0 };
      }
      map[r.Field].orderValue = parseFloat(r.OrderValue) || 0;
    });

    const data = Object.values(map).sort((a, b) => b.salesValue - a.salesValue);

    return res.status(200).json({ data, month, groupBy });
  } catch (error) {
    console.error("[energy-seal-sales] error:", error.message);
    return res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
