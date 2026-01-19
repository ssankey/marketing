

// pages/api/target-analytics/quarterly-analysis.js
import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  try {
    const { year, slpCode, region, state } = req.query;

    console.log("📊 API Request Params:", { year, slpCode, region, state });

    // Build WHERE clauses
    const whereClauses = ["T0.CANCELED = 'N'", "T0.[IssReason] <> '4'"];

    // Filter by year if provided and not "Complete" or empty
    if (year && year !== "Complete" && year !== "") {
      // Extract fiscal year from format "FY 2025-26"
      const yearMatch = year.match(/FY\s*(\d{4})-(\d{2})/i);
      
      if (yearMatch) {
        const fyStartYear = parseInt(yearMatch[1]);
        const fyEndYear = parseInt(yearMatch[2]);
        const fullEndYear = fyEndYear < 50 ? 2000 + fyEndYear : 1900 + fyEndYear;
        
        console.log("📅 Parsed fiscal year:", { fyStartYear, fullEndYear });
        
        // Financial year: Apr of fyStartYear to Mar of fullEndYear
        whereClauses.push(
          `((YEAR(T0.DocDate) = ${fyStartYear} AND MONTH(T0.DocDate) >= 4) OR ` +
          `(YEAR(T0.DocDate) = ${fullEndYear} AND MONTH(T0.DocDate) <= 3))`
        );
        console.log("✅ Year filter applied for FY", fyStartYear + "-" + fyEndYear);
      } else {
        console.warn("⚠️ Could not parse year format:", year);
      }
    } else {
      console.log("ℹ️ No year filter applied (showing all years)");
    }

    // Filter by salesperson (line-level first, fallback to header)
    if (slpCode && slpCode !== "") {
      const salesCode = parseInt(slpCode);
      if (!isNaN(salesCode)) {
         whereClauses.push(`T0.SlpCode = ${salesCode}`);
        console.log("👤 Salesperson filter applied:", salesCode);
      } else {
        console.warn("⚠️ Invalid slpCode:", slpCode);
      }
    }

    // Build region/state filter
    let regionStateJoin = "";
    let regionStateFilter = "";
    
    if (region || state) {
      regionStateJoin = `
        LEFT JOIN OCRD C ON T0.CardCode = C.CardCode
        OUTER APPLY (
          SELECT TOP 1 State, Country
          FROM CRD1 
          WHERE CardCode = C.CardCode AND AdresType = 'B'
          ORDER BY Address
        ) AS C1
      `;

      if (region && region !== "") {
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
          console.log("🌍 Region filter applied:", region);
        }
      }

      if (state && state !== "") {
        if (state === "Overseas") {
          regionStateFilter = "ISNULL(C1.Country, '') <> 'IN'";
          console.log("🌏 State filter applied: Overseas");
        } else {
          const stateCodeMapping = {
            "Telangana": "TE", "Maharashtra": "MH", "Tamil Nadu": "TN",
            "Uttar Pradesh": "UP", "Gujarat": "GJ", "Karnataka": "KT",
            "Madhya Pradesh": "MP", "West Bengal": "WB", "Delhi": "DL",
            "Goa": "GO", "Andhra Pradesh": "AP", "Punjab": "PU",
            "Haryana": "HR", "Rajasthan": "RJ", "Jharkhand": "JH",
            "Kerala": "KL", "Uttarakhand": "UT", "Assam": "AS",
            "Himachal Pradesh": "HP", "Chandigarh": "CH", "Puducherry": "PC"
          };
          
          if (stateCodeMapping[state]) {
            regionStateFilter = `C1.State = '${stateCodeMapping[state]}'`;
            console.log("📍 State filter applied:", state, "->", stateCodeMapping[state]);
          }
        }
      }

      if (regionStateFilter) {
        whereClauses.push(regionStateFilter);
      }
    }

    const whereSQL = whereClauses.join(" AND ");

    console.log("🔍 Final WHERE clause:", whereSQL);
    console.log("🔍 Total WHERE conditions:", whereClauses.length);

    // ⭐ FIX #1: Order by Year ASC, MonthNumber ASC for oldest first
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
      ORDER BY Year ASC, MonthNumber ASC
    `;

    console.log("🔍 Executing query with joins:", regionStateJoin ? "YES" : "NO");

    const results = await queryDatabase(query, []);

    console.log("✅ Query returned", results.length, "rows");
    
    // Log unique years in results to verify filtering
    const uniqueYears = [...new Set(results.map(r => r.Year))];
    console.log("📊 Years in results:", uniqueYears.sort());

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

    console.log("📦 Returning", transformedResults.length, "pivoted rows");

    return res.status(200).json({ data: transformedResults });
  } catch (error) {
    console.error("❌ API handler error:", error);
    console.error("❌ Stack trace:", error.stack);
    return res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}