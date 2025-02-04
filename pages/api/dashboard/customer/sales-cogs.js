



























import sql from "mssql";
import { queryDatabase } from "../../../../lib/db";

export default async function handler(req, res) {
  try {
    const { year, cardCode  } = req.query;

    if (!cardCode) {
      return res.status(400).json({ error: "Missing CardCode parameter" });
    }

    // Query to fetch sales, COGS, and gross margin data
    const query = `
      SELECT 
        YEAR(T0.DocDate) AS year,
        DATENAME(MONTH, T0.DocDate) AS month,
        MONTH(T0.DocDate) AS monthNumber,
        ROUND(SUM(
          CASE 
            WHEN T1.InvQty = 0 THEN T1.LineTotal
            WHEN T4.Quantity IS NULL THEN T1.LineTotal
            ELSE (T1.LineTotal / T1.InvQty) * ISNULL(T4.Quantity, 0)
          END
        ), 2) AS sales,
        ROUND(SUM(T1.GrossBuyPr * ISNULL(T4.Quantity, 0)), 2) AS cogs,
        ROUND(SUM(
          CASE 
            WHEN T1.InvQty = 0 THEN T1.LineTotal
            WHEN T4.Quantity IS NULL THEN T1.LineTotal
            ELSE (T1.LineTotal / T1.InvQty) * ISNULL(T4.Quantity, 0)
          END
        ) - SUM(T1.GrossBuyPr * ISNULL(T4.Quantity, 0)), 2) AS grossMargin
      FROM OINV T0
      INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      LEFT JOIN IBT1 T4 ON T4.CardCode = T0.CardCode
        AND T4.ItemCode = T1.ItemCode
      WHERE T0.CANCELED = 'N'
        AND T0.CardCode = @cardCode
        ${year ? "AND YEAR(T0.DocDate) = @year" : ""}
      GROUP BY 
        YEAR(T0.DocDate), 
        DATENAME(MONTH, T0.DocDate), 
        MONTH(T0.DocDate)
      ORDER BY MONTH(T0.DocDate);
    `;

    // Parameters for SQL query
    const params = [
      { name: "cardCode", type: sql.VarChar(50), value: cardCode },
      ...(year ? [{ name: "year", type: sql.Int, value: parseInt(year) }] : []),
    ];

    const results = await queryDatabase(query, params);

    const data = results.map((row) => ({
      year: row.year,
      month: row.month,
      sales: parseFloat(row.sales) || 0,
      cogs: parseFloat(row.cogs) || 0,
      grossMargin: parseFloat(row.grossMargin) || 0,
    }));

    // Query to get available years
    const yearsQuery = `
      SELECT DISTINCT YEAR(DocDate) as year
      FROM OINV
      WHERE CANCELED = 'N'
      ORDER BY year DESC;
    `;
    const yearsResult = await queryDatabase(yearsQuery);
    const availableYears = yearsResult.map((row) => row.year);

    return res.status(200).json({ data, availableYears });
  } catch (error) {
    console.error("API handler error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
