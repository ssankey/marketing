// pages/api/target-analytics/percentage-analysis.js
import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  try {
    const { type = "category", year = "FY 2025-26" } = req.query;

    const whereClauses = ["T0.CANCELED = 'N'", "T0.[IssReason] <> '4'"];

    // Filter by year if provided and not "Complete"
    if (year && year !== "Complete") {
      const fyYear = parseInt(year.split(" ")[1].split("-")[0]);
      whereClauses.push(
        `((YEAR(T0.DocDate) = ${fyYear} AND MONTH(T0.DocDate) >= 4) OR (YEAR(T0.DocDate) = ${fyYear + 1} AND MONTH(T0.DocDate) <= 3))`
      );
    }

    const whereSQL = whereClauses.join(" AND ");

    let query = "";

    switch (type) {
      case "category":
        query = `
          WITH CategoryData AS (
            SELECT 
              T6.ItmsGrpNam AS [Field],
              SUM(CASE WHEN ISNULL(C1.Country, '') = 'IN' THEN T1.LineTotal ELSE 0 END) AS [IndiaSales],
              SUM(CASE WHEN ISNULL(C1.Country, '') <> 'IN' THEN T1.LineTotal ELSE 0 END) AS [OverseasSales],
              SUM(T1.LineTotal) AS [TotalSales],
              SUM(T1.GrossBuyPr * T1.Quantity) AS [TotalCOGS],
              SUM(T1.LineTotal - (T1.GrossBuyPr * T1.Quantity)) AS [GrossProfit]
            FROM OINV T0
            JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
            JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
            JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
            JOIN OCRD C ON T0.CardCode = C.CardCode
            OUTER APPLY (
              SELECT TOP 1 Country
              FROM CRD1 
              WHERE CardCode = C.CardCode AND AdresType = 'B'
              ORDER BY Address
            ) AS C1
            WHERE ${whereSQL}
            GROUP BY T6.ItmsGrpNam
          ),
          Total AS (
            SELECT SUM(TotalSales) AS GrandTotalSales FROM CategoryData
          )
          SELECT 
            CD.Field,
            ROUND((CD.TotalSales / T.GrandTotalSales) * 100, 2) AS [PercentageSales],
            0 AS [Target],
            ROUND(CD.TotalSales, 2) AS [Sales],
            CASE 
              WHEN CD.TotalSales = 0 THEN 0
              ELSE ROUND((CD.GrossProfit * 100.0) / CD.TotalSales, 2)
            END AS [GrossMarginPct],
            ROUND(CD.IndiaSales, 2) AS [IndiaSales],
            ROUND(CD.OverseasSales, 2) AS [OverseasSales]
          FROM CategoryData CD
          CROSS JOIN Total T
          ORDER BY [Sales] DESC;
        `;
        break;

      case "state":
        query = `
          WITH StateData AS (
            SELECT 
              CASE 
                WHEN ISNULL(C1.Country, '') <> 'IN' THEN 'Overseas'
                WHEN ISNULL(C1.State, '') = '' THEN 'Unknown'
                WHEN C1.State = 'AP' THEN 'Andhra Pradesh'
                WHEN C1.State = 'AS' THEN 'Assam'
                WHEN C1.State = 'CH' THEN 'Chandigarh'
                WHEN C1.State = 'DL' THEN 'Delhi'
                WHEN C1.State = 'DN' THEN 'Dadra & Nagar Haveli and Daman & Diu'
                WHEN C1.State = 'GJ' THEN 'Gujarat'
                WHEN C1.State = 'GO' THEN 'Goa'
                WHEN C1.State = 'HP' THEN 'Himachal Pradesh'
                WHEN C1.State = 'HR' THEN 'Haryana'
                WHEN C1.State = 'JH' THEN 'Jharkhand'
                WHEN C1.State = 'KL' THEN 'Kerala'
                WHEN C1.State = 'KT' THEN 'Karnataka'
                WHEN C1.State = 'ME' THEN 'Meghalaya'
                WHEN C1.State = 'MH' THEN 'Maharashtra'
                WHEN C1.State = 'MP' THEN 'Madhya Pradesh'
                WHEN C1.State = 'PC' THEN 'Puducherry'
                WHEN C1.State = 'PU' THEN 'Punjab'
                WHEN C1.State = 'RJ' THEN 'Rajasthan'
                WHEN C1.State = 'TE' THEN 'Telangana'
                WHEN C1.State = 'TN' THEN 'Tamil Nadu'
                WHEN C1.State = 'UP' THEN 'Uttar Pradesh'
                WHEN C1.State = 'UT' THEN 'Uttarakhand'
                WHEN C1.State = 'WB' THEN 'West Bengal'
                ELSE 'Unknown'
              END AS [Field],
              SUM(T1.LineTotal) AS [TotalSales],
              SUM(T1.GrossBuyPr * T1.Quantity) AS [TotalCOGS],
              SUM(T1.LineTotal - (T1.GrossBuyPr * T1.Quantity)) AS [GrossProfit]
            FROM OINV T0
            JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
            JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
            JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
            JOIN OCRD C ON T0.CardCode = C.CardCode
            OUTER APPLY (
              SELECT TOP 1 State, Country
              FROM CRD1 
              WHERE CardCode = C.CardCode AND AdresType = 'B'
              ORDER BY Address
            ) AS C1
            WHERE ${whereSQL}
            GROUP BY 
              CASE 
                WHEN ISNULL(C1.Country, '') <> 'IN' THEN 'Overseas'
                WHEN ISNULL(C1.State, '') = '' THEN 'Unknown'
                WHEN C1.State = 'AP' THEN 'Andhra Pradesh'
                WHEN C1.State = 'AS' THEN 'Assam'
                WHEN C1.State = 'CH' THEN 'Chandigarh'
                WHEN C1.State = 'DL' THEN 'Delhi'
                WHEN C1.State = 'DN' THEN 'Dadra & Nagar Haveli and Daman & Diu'
                WHEN C1.State = 'GJ' THEN 'Gujarat'
                WHEN C1.State = 'GO' THEN 'Goa'
                WHEN C1.State = 'HP' THEN 'Himachal Pradesh'
                WHEN C1.State = 'HR' THEN 'Haryana'
                WHEN C1.State = 'JH' THEN 'Jharkhand'
                WHEN C1.State = 'KL' THEN 'Kerala'
                WHEN C1.State = 'KT' THEN 'Karnataka'
                WHEN C1.State = 'ME' THEN 'Meghalaya'
                WHEN C1.State = 'MH' THEN 'Maharashtra'
                WHEN C1.State = 'MP' THEN 'Madhya Pradesh'
                WHEN C1.State = 'PC' THEN 'Puducherry'
                WHEN C1.State = 'PU' THEN 'Punjab'
                WHEN C1.State = 'RJ' THEN 'Rajasthan'
                WHEN C1.State = 'TE' THEN 'Telangana'
                WHEN C1.State = 'TN' THEN 'Tamil Nadu'
                WHEN C1.State = 'UP' THEN 'Uttar Pradesh'
                WHEN C1.State = 'UT' THEN 'Uttarakhand'
                WHEN C1.State = 'WB' THEN 'West Bengal'
                ELSE 'Unknown'
              END
          ),
          Total AS (
            SELECT SUM(TotalSales) AS GrandTotalSales FROM StateData
          )
          SELECT 
            SD.Field,
            ROUND((SD.TotalSales / T.GrandTotalSales) * 100, 2) AS [PercentageSales],
            0 AS [Target],
            ROUND(SD.TotalSales, 2) AS [Sales],
            CASE 
              WHEN SD.TotalSales = 0 THEN 0
              ELSE ROUND((SD.GrossProfit * 100.0) / SD.TotalSales, 2)
            END AS [GrossMarginPct]
          FROM StateData SD
          CROSS JOIN Total T
          ORDER BY [Sales] DESC;
        `;
        break;

      case "region":
        query = `
          WITH RegionData AS (
            SELECT 
              CASE 
                WHEN ISNULL(C1.Country, '') <> 'IN' THEN 'Overseas'
                WHEN ISNULL(C1.State, '') = '' THEN 'Unknown'
                WHEN C1.State = 'AP' THEN 'Central'
                WHEN C1.State = 'AS' THEN 'East'
                WHEN C1.State = 'CH' THEN 'North'
                WHEN C1.State = 'DL' THEN 'North'
                WHEN C1.State = 'DN' THEN 'West 1'
                WHEN C1.State = 'GJ' THEN 'West 2'
                WHEN C1.State = 'GO' THEN 'West 1'
                WHEN C1.State = 'HP' THEN 'North'
                WHEN C1.State = 'HR' THEN 'North'
                WHEN C1.State = 'JH' THEN 'East'
                WHEN C1.State = 'KL' THEN 'South'
                WHEN C1.State = 'KT' THEN 'South'
                WHEN C1.State = 'ME' THEN 'East'
                WHEN C1.State = 'MH' THEN 'West 1'
                WHEN C1.State = 'MP' THEN 'North'
                WHEN C1.State = 'PC' THEN 'South'
                WHEN C1.State = 'PU' THEN 'North'
                WHEN C1.State = 'RJ' THEN 'North'
                WHEN C1.State = 'TE' THEN 'Central'
                WHEN C1.State = 'TN' THEN 'South'
                WHEN C1.State = 'UP' THEN 'North'
                WHEN C1.State = 'UT' THEN 'North'
                WHEN C1.State = 'WB' THEN 'East'
                ELSE 'Unknown'
              END AS [Field],
              SUM(T1.LineTotal) AS [TotalSales],
              SUM(T1.GrossBuyPr * T1.Quantity) AS [TotalCOGS],
              SUM(T1.LineTotal - (T1.GrossBuyPr * T1.Quantity)) AS [GrossProfit]
            FROM OINV T0
            JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
            JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
            JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
            JOIN OCRD C ON T0.CardCode = C.CardCode
            OUTER APPLY (
              SELECT TOP 1 State, Country
              FROM CRD1 
              WHERE CardCode = C.CardCode AND AdresType = 'B'
              ORDER BY Address
            ) AS C1
            WHERE ${whereSQL}
            GROUP BY 
              CASE 
                WHEN ISNULL(C1.Country, '') <> 'IN' THEN 'Overseas'
                WHEN ISNULL(C1.State, '') = '' THEN 'Unknown'
                WHEN C1.State = 'AP' THEN 'Central'
                WHEN C1.State = 'AS' THEN 'East'
                WHEN C1.State = 'CH' THEN 'North'
                WHEN C1.State = 'DL' THEN 'North'
                WHEN C1.State = 'DN' THEN 'West 1'
                WHEN C1.State = 'GJ' THEN 'West 2'
                WHEN C1.State = 'GO' THEN 'West 1'
                WHEN C1.State = 'HP' THEN 'North'
                WHEN C1.State = 'HR' THEN 'North'
                WHEN C1.State = 'JH' THEN 'East'
                WHEN C1.State = 'KL' THEN 'South'
                WHEN C1.State = 'KT' THEN 'South'
                WHEN C1.State = 'ME' THEN 'East'
                WHEN C1.State = 'MH' THEN 'West 1'
                WHEN C1.State = 'MP' THEN 'North'
                WHEN C1.State = 'PC' THEN 'South'
                WHEN C1.State = 'PU' THEN 'North'
                WHEN C1.State = 'RJ' THEN 'North'
                WHEN C1.State = 'TE' THEN 'Central'
                WHEN C1.State = 'TN' THEN 'South'
                WHEN C1.State = 'UP' THEN 'North'
                WHEN C1.State = 'UT' THEN 'North'
                WHEN C1.State = 'WB' THEN 'East'
                ELSE 'Unknown'
              END
          ),
          Total AS (
            SELECT SUM(TotalSales) AS GrandTotalSales FROM RegionData
          )
          SELECT 
            RD.Field,
            ROUND((RD.TotalSales / T.GrandTotalSales) * 100, 2) AS [PercentageSales],
            0 AS [Target],
            ROUND(RD.TotalSales, 2) AS [Sales],
            CASE 
              WHEN RD.TotalSales = 0 THEN 0
              ELSE ROUND((RD.GrossProfit * 100.0) / RD.TotalSales, 2)
            END AS [GrossMarginPct]
          FROM RegionData RD
          CROSS JOIN Total T
          ORDER BY [Sales] DESC;
        `;
        break;

      case "salesperson":
        query = `
          WITH SalespersonData AS (
            SELECT 
              S.SlpName AS [Field],
              SUM(T1.LineTotal) AS [TotalSales],
              SUM(T1.GrossBuyPr * T1.Quantity) AS [TotalCOGS],
              SUM(T1.LineTotal - (T1.GrossBuyPr * T1.Quantity)) AS [GrossProfit]
            FROM OINV T0
            JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
            JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
            JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
            JOIN OSLP S ON T0.SlpCode = S.SlpCode
            WHERE ${whereSQL}
            GROUP BY S.SlpName
          ),
          Total AS (
            SELECT SUM(TotalSales) AS GrandTotalSales FROM SalespersonData
          )
          SELECT 
            SD.Field,
            ROUND((SD.TotalSales / T.GrandTotalSales) * 100, 2) AS [PercentageSales],
            0 AS [Target],
            ROUND(SD.TotalSales, 2) AS [Sales],
            CASE 
              WHEN SD.TotalSales = 0 THEN 0
              ELSE ROUND((SD.GrossProfit * 100.0) / SD.TotalSales, 2)
            END AS [GrossMarginPct]
          FROM SalespersonData SD
          CROSS JOIN Total T
          ORDER BY [Sales] DESC;
        `;
        break;

      default:
        return res.status(400).json({ error: "Invalid type parameter" });
    }

    const results = await queryDatabase(query, []);

    return res.status(200).json({ data: results, type });
  } catch (error) {
    console.error("API handler error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}