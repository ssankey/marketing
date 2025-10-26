
// pages/api/target-analytics/quarterly-analysis.js
import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  try {
    const { year, slpCode, region, state } = req.query;

    // Build WHERE clauses
    const whereClauses = ["T0.CANCELED = 'N'", "T0.[IssReason] <> '4'"];

    // Filter by year if provided and not "Complete"
    if (year && year !== "Complete") {
      const fyYear = parseInt(year.split(" ")[1].split("-")[0]);
      whereClauses.push(
        `((YEAR(T0.DocDate) = ${fyYear} AND MONTH(T0.DocDate) >= 4) OR (YEAR(T0.DocDate) = ${fyYear + 1} AND MONTH(T0.DocDate) <= 3))`
      );
    }

    // // Filter by sales person
    // if (slpCode) {
    //   whereClauses.push(`T0.SlpCode = ${parseInt(slpCode)}`);
    // }

    // Filter by salesperson (line-level first, fallback to header)
if (slpCode) {
  whereClauses.push(`ISNULL(T1.SlpCode, T0.SlpCode) = ${parseInt(slpCode)}`);
}


    // Build region/state filter
    let regionStateJoin = "";
    let regionStateFilter = "";
    
    if (region || state) {
      regionStateJoin = `
        JOIN OCRD C ON T0.CardCode = C.CardCode
        OUTER APPLY (
          SELECT TOP 1 State, Country
          FROM CRD1 
          WHERE CardCode = C.CardCode AND AdresType = 'B'
          ORDER BY Address
        ) AS C1
      `;

      if (region) {
        const regionStateMapping = {
          "Overseas": "ISNULL(C1.Country, '') <> 'IN'",
          "Central": "C1.State IN ('AP', 'TE')",
          "South": "C1.State IN ('KL', 'KT', 'TN', 'PC')",
          "West 1": "C1.State IN ('MH', 'GO', 'DN')",
          "West 2": "C1.State = 'GJ'",
          "North": "C1.State IN ('DL', 'HR', 'HP', 'PU', 'RJ', 'UP', 'UT', 'MP', 'CH')",
          "East": "C1.State IN ('WB', 'JH', 'AS', 'ME')"
        };
        
        if (regionStateMapping[region]) {
          regionStateFilter = regionStateMapping[region];
        }
      }

      if (state) {
        if (state === "Overseas") {
          regionStateFilter = "ISNULL(C1.Country, '') <> 'IN'";
        } else {
          const stateCodeMapping = {
            "Telangana": "TE", "Maharashtra": "MH", "Tamil Nadu": "TN",
            "Uttar Pradesh": "UP", "Gujarat": "GJ", "Karnataka": "KT",
            "Madhya Pradesh": "MP", "West Bengal": "WB", "Delhi": "DL",
            "Goa": "GO", "Andhra Pradesh": "AP", "Punjab": "PU",
            "Haryana": "HR", "Rajasthan": "RJ", "Jharkhand": "JH",
            "Kerala": "KL", "Uttarakhand": "UT", "Assam": "AS",
            "Himachal Pradesh": "HP", "Chandigarh": "CH"
          };
          
          if (stateCodeMapping[state]) {
            regionStateFilter = `C1.State = '${stateCodeMapping[state]}'`;
          }
        }
      }

      if (regionStateFilter) {
        whereClauses.push(regionStateFilter);
      }
    }

    const whereSQL = whereClauses.join(" AND ");

    // Simple query that returns flat data
    const query = `
      SELECT 
        YEAR(T0.DocDate) AS Year,
        MONTH(T0.DocDate) AS MonthNumber,
        DATENAME(MONTH, T0.DocDate) AS Month,
        T6.ItmsGrpNam AS Category,
        SUM(T1.LineTotal) AS Sales,
        CASE 
          WHEN SUM(T1.LineTotal) = 0 THEN 0
          ELSE ROUND(
            ((SUM(T1.LineTotal) - SUM(T1.GrossBuyPr * T1.Quantity)) * 100.0) / SUM(T1.LineTotal),
            2
          )
        END AS Margin
      FROM OINV T0
      JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
      JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
      ${regionStateJoin}
      WHERE ${whereSQL}
      GROUP BY YEAR(T0.DocDate), MONTH(T0.DocDate), DATENAME(MONTH, T0.DocDate), T6.ItmsGrpNam
      ORDER BY Year DESC, MonthNumber DESC
    `;

    const results = await queryDatabase(query, []);

    // Pivot the data in JavaScript
    const pivotedData = {};
    
    results.forEach(row => {
      const key = `${row.Year}-${row.MonthNumber}`;
      if (!pivotedData[key]) {
        pivotedData[key] = {
          Year: row.Year,
          Month: row.Month,
          MonthNumber: row.MonthNumber
        };
      }
      
      // Add category sales and margin
      pivotedData[key][`${row.Category}_Sales`] = row.Sales || 0;
      pivotedData[key][`${row.Category}_Margin`] = row.Margin || 0;
    });

    // Convert to array
    const transformedResults = Object.values(pivotedData);

    return res.status(200).json({ data: transformedResults });
  } catch (error) {
    console.error("API handler error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}