 import sql from "mssql";
 import { queryDatabase } from "../../../../lib/db";

 export default async function handler(req, res) {
   try {
     const { year, SlpCode } = req.query;

     if (!SlpCode) {
       return res.status(400).json({ error: "Missing SlpCode parameter" });
     }

     // Query to fetch order data
     const query = `
      SELECT 
        YEAR(T0.DocDate) AS year,
        DATENAME(MONTH, T0.DocDate) AS month,
        MONTH(T0.DocDate) AS monthNumber,
        SUM(CASE WHEN T0.DocStatus = 'O' THEN 1 ELSE 0 END) AS openOrders,
        SUM(CASE WHEN T0.DocStatus = 'C' THEN 1 ELSE 0 END) AS closedOrders,
        SUM(CASE WHEN T0.DocStatus = 'O' THEN T0.DocTotal ELSE 0 END) AS openSales,
        SUM(CASE WHEN T0.DocStatus = 'C' THEN T0.DocTotal ELSE 0 END) AS closedSales
      FROM ORDR T0
      WHERE T0.CANCELED = 'N' 
        AND T0.SlpCode = @SlpCode
        ${year ? "AND YEAR(T0.DocDate) = @year" : ""}
      GROUP BY 
        YEAR(T0.DocDate), 
        DATENAME(MONTH, T0.DocDate), 
        MONTH(T0.DocDate)
      ORDER BY MONTH(T0.DocDate);
    `;

     // Parameters for SQL query
     const params = [
       { name: "SlpCode", type: sql.VarChar(50), value: SlpCode },
       ...(year
         ? [{ name: "year", type: sql.Int, value: parseInt(year) }]
         : []),
     ];

     const results = await queryDatabase(query, params);

     const data = results.map((row) => ({
       year: row.year,
       month: row.month,
       monthNumber: row.monthNumber,
       openOrders: parseInt(row.openOrders) || 0,
       closedOrders: parseInt(row.closedOrders) || 0,
       openSales: parseFloat(row.openSales) || 0,
       closedSales: parseFloat(row.closedSales) || 0,
     }));

     // Query to get available years
     const yearsQuery = `
      SELECT DISTINCT YEAR(DocDate) as year
      FROM ORDR
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
