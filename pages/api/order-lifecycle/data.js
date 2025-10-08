

// pages/api/order-lifecycle/data.js
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { type, ranges, slpCode, cardCode, cntctCode, itmsGrpCod } = req.query;

    // Parse ranges
    const dayRanges = ranges
      ? JSON.parse(ranges)
      : [
          { min: 0, max: 3, label: "0-3 days" },
          { min: 4, max: 5, label: "4-5 days" },
          { min: 6, max: 8, label: "6-8 days" },
          { min: 9, max: 10, label: "9-10 days" },
          { min: 11, max: 999, label: "10+ days" },
        ];

    const typeMapping = {
      "po-to-grn": "PO to GRN",
      "grn-to-invoice": "GRN to Invoice",
      "invoice-to-dispatch": "Invoice to Dispatch",
    };
    const dbType = typeMapping[type] || "PO to GRN";

    // Build CASE statement for date ranges
    const buildCaseStatement = (d1, d2) => {
      let c = "CASE\n";
      for (const r of dayRanges) {
        if (r.max === 999 || r.max === null || typeof r.max === "undefined") {
          c += `  WHEN DATEDIFF(DAY, ${d1}, ${d2}) >= ${r.min} THEN '${r.label}'\n`;
        } else {
          c += `  WHEN DATEDIFF(DAY, ${d1}, ${d2}) BETWEEN ${r.min} AND ${r.max} THEN '${r.label}'\n`;
        }
      }
      c += "  ELSE 'Unknown'\nEND";
      return c;
    };

    // Prepare filter parameters
    const whereParts = [];
    const params = [];

    const addFilterParam = (name, type, value) => {
      params.push({ name, type, value });
    };

    // Build query based on type
    let query = "";

    if (dbType === "PO to GRN") {
      const caseStmt = buildCaseStatement("PO.DocDate", "OPDN.DocDate");

      query = `
        WITH PO_GRN AS (
          SELECT
            'PO to GRN' AS Type,
            FORMAT(PO.DocDate, 'yyyy-MM') AS Month,
            ${caseStmt} AS Bucket,
            YEAR(PO.DocDate) AS Year,
            MONTH(PO.DocDate) AS MonthNumber
          FROM OPOR PO
          JOIN POR1 ON PO.DocEntry = POR1.DocEntry
          JOIN PDN1 ON POR1.DocEntry = PDN1.BaseEntry 
               AND POR1.LineNum = PDN1.BaseLine
          JOIN OPDN ON PDN1.DocEntry = OPDN.DocEntry
          WHERE OPDN.CANCELED = 'N'
        ),
        BucketCounts AS (
          SELECT 
            Type, Month, Bucket, Year, MonthNumber, 
            COUNT(*) AS TotalCount
          FROM PO_GRN 
          GROUP BY Type, Month, Bucket, Year, MonthNumber
        ),
        BucketPercents AS (
          SELECT
            Type, Month, Bucket, Year, MonthNumber, TotalCount,
            CAST(100.0 * TotalCount / SUM(TotalCount) OVER (PARTITION BY Type, Month) AS DECIMAL(5,2)) AS Percentage
          FROM BucketCounts
        )
        SELECT Type, Month, Year, MonthNumber, Bucket, TotalCount, Percentage
        FROM BucketPercents
        ORDER BY Year, MonthNumber, Bucket;
      `;

    } else if (dbType === "GRN to Invoice") {
      const caseStmt = buildCaseStatement("OPDN.DocDate", "OINV.DocDate");

      // Build WHERE clause for filters
      const filterConditions = ["OINV.CANCELED = 'N'"];
      
      if (slpCode) {
        filterConditions.push("OINV.SlpCode = @slpCode");
        addFilterParam("slpCode", sql.Int, parseInt(slpCode, 10));
      }
      if (cardCode) {
        filterConditions.push("OINV.CardCode = @cardCode");
        addFilterParam("cardCode", sql.VarChar, cardCode);
      }
      if (cntctCode) {
        filterConditions.push("OINV.CntctCode = @cntctCode");
        addFilterParam("cntctCode", sql.Int, parseInt(cntctCode, 10));
      }
      if (itmsGrpCod) {
        filterConditions.push("OITM.ItmsGrpCod = @itmsGrpCod");
        addFilterParam("itmsGrpCod", sql.Int, parseInt(itmsGrpCod, 10));
      }

      const whereSQL = filterConditions.join(" AND ");

      query = `
        WITH GRN_INV AS (
          SELECT
            'GRN to Invoice' AS Type,
            FORMAT(OPDN.DocDate, 'yyyy-MM') AS Month,
            ${caseStmt} AS Bucket,
            YEAR(OPDN.DocDate) AS Year,
            MONTH(OPDN.DocDate) AS MonthNumber
          FROM OPDN
          JOIN PDN1 ON OPDN.DocEntry = PDN1.DocEntry
          JOIN INV1 ON PDN1.DocEntry = INV1.BaseEntry 
               AND PDN1.LineNum = INV1.BaseLine
          JOIN OINV ON INV1.DocEntry = OINV.DocEntry
          LEFT JOIN OITM ON INV1.ItemCode = OITM.ItemCode
          WHERE ${whereSQL}
        ),
        BucketCounts AS (
          SELECT 
            Type, Month, Bucket, Year, MonthNumber, 
            COUNT(*) AS TotalCount
          FROM GRN_INV 
          GROUP BY Type, Month, Bucket, Year, MonthNumber
        ),
        BucketPercents AS (
          SELECT
            Type, Month, Bucket, Year, MonthNumber, TotalCount,
            CAST(100.0 * TotalCount / SUM(TotalCount) OVER (PARTITION BY Type, Month) AS DECIMAL(5,2)) AS Percentage
          FROM BucketCounts
        )
        SELECT Type, Month, Year, MonthNumber, Bucket, TotalCount, Percentage
        FROM BucketPercents
        ORDER BY Year, MonthNumber, Bucket;
      `;

    } else if (dbType === "Invoice to Dispatch") {
      const caseStmt = buildCaseStatement("OINV.DocDate", "OINV.U_DispatchDate");

      const filterConditions = [
        "OINV.CANCELED = 'N'",
        "OINV.U_DispatchDate IS NOT NULL"
      ];
      
      if (slpCode) {
        filterConditions.push("OINV.SlpCode = @slpCode");
        addFilterParam("slpCode", sql.Int, parseInt(slpCode, 10));
      }
      if (cardCode) {
        filterConditions.push("OINV.CardCode = @cardCode");
        addFilterParam("cardCode", sql.VarChar, cardCode);
      }
      if (cntctCode) {
        filterConditions.push("OINV.CntctCode = @cntctCode");
        addFilterParam("cntctCode", sql.Int, parseInt(cntctCode, 10));
      }
      if (itmsGrpCod) {
        filterConditions.push("OITM.ItmsGrpCod = @itmsGrpCod");
        addFilterParam("itmsGrpCod", sql.Int, parseInt(itmsGrpCod, 10));
      }

      const whereSQL = filterConditions.join(" AND ");

      query = `
        WITH INV_DISP AS (
          SELECT
            'Invoice to Dispatch' AS Type,
            FORMAT(OINV.DocDate, 'yyyy-MM') AS Month,
            ${caseStmt} AS Bucket,
            YEAR(OINV.DocDate) AS Year,
            MONTH(OINV.DocDate) AS MonthNumber
          FROM OINV
          JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
          LEFT JOIN OITM ON INV1.ItemCode = OITM.ItemCode
          WHERE ${whereSQL}
        ),
        BucketCounts AS (
          SELECT 
            Type, Month, Bucket, Year, MonthNumber, 
            COUNT(*) AS TotalCount
          FROM INV_DISP 
          GROUP BY Type, Month, Bucket, Year, MonthNumber
        ),
        BucketPercents AS (
          SELECT
            Type, Month, Bucket, Year, MonthNumber, TotalCount,
            CAST(100.0 * TotalCount / SUM(TotalCount) OVER (PARTITION BY Type, Month) AS DECIMAL(5,2)) AS Percentage
          FROM BucketCounts
        )
        SELECT Type, Month, Year, MonthNumber, Bucket, TotalCount, Percentage
        FROM BucketPercents
        ORDER BY Year, MonthNumber, Bucket;
      `;
    }

    const results = await queryDatabase(query, params);
    
    // Ensure data is properly formatted
    const formattedResults = (results || []).map(row => ({
      Type: row.Type,
      Month: row.Month,
      Year: parseInt(row.Year),
      MonthNumber: parseInt(row.MonthNumber),
      Bucket: row.Bucket,
      TotalCount: parseInt(row.TotalCount) || 0,
      Percentage: parseFloat(row.Percentage) || 0
    }));

    res.status(200).json({ 
      success: true, 
      data: formattedResults,
      debug: {
        type: dbType,
        filters: { slpCode, cardCode, cntctCode, itmsGrpCod },
        recordCount: formattedResults.length
      }
    });

  } catch (error) {
    console.error("Error fetching order lifecycle data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch order lifecycle data",
      message: error.message,
    });
  }
}