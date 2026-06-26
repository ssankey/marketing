
// pages/api/category/monthlySales.js
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";

const queries = {
  customer: (categoryFilter) => {
    const baseQuery = `
    DECLARE @cols NVARCHAR(MAX);
    DECLARE @cogs_cols NVARCHAR(MAX);
    DECLARE @lines_cols NVARCHAR(MAX);
    
    SELECT @cols = STRING_AGG(QUOTENAME(MonthYear), ',') WITHIN GROUP (ORDER BY MonthDate DESC)
    FROM (
        SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear, MAX(OINV.DocDate) AS MonthDate
        FROM OINV
        WHERE OINV.CANCELED = 'N'
        GROUP BY FORMAT(OINV.DocDate, 'MMM yyyy')
    ) AS MonthList;

    SELECT @cogs_cols = STRING_AGG(QUOTENAME(MonthYear + '_COGS'), ',') WITHIN GROUP (ORDER BY MonthDate DESC),
           @lines_cols = STRING_AGG(QUOTENAME(MonthYear + '_Lines'), ',') WITHIN GROUP (ORDER BY MonthDate DESC)
    FROM (
        SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear, MAX(OINV.DocDate) AS MonthDate
        FROM OINV
        WHERE OINV.CANCELED = 'N'
        GROUP BY FORMAT(OINV.DocDate, 'MMM yyyy')
    ) AS MonthList;

    DECLARE @sql NVARCHAR(MAX) = '
    WITH BaseData AS (
        SELECT OCRD.CardName AS [Customer Name], 
               FORMAT(OINV.DocDate, ''MMM yyyy'') AS MonthYear,
               INV1.LineTotal,
               INV1.GrossBuyPr * INV1.Quantity AS COGS,
               1 AS LineCount
        FROM OINV
        INNER JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
        INNER JOIN OCRD ON OINV.CardCode = OCRD.CardCode
        ${
          categoryFilter
            ? `
        INNER JOIN OITM T3 ON INV1.ItemCode = T3.ItemCode
        INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
        `
            : ""
        }
        WHERE OINV.CANCELED = ''N''
        ${categoryFilter ? `AND T4.ItmsGrpNam = @category` : ""}
    ),
    Aggregated AS (
        SELECT [Customer Name], 
               ROUND(SUM(LineTotal), 0) AS [Total Sales], 
               ROUND(SUM(COGS), 0) AS [Total COGS],
               SUM(LineCount) AS [Total Line Items],
               CASE 
                   WHEN SUM(LineTotal) = 0 THEN 0
                   ELSE ROUND(((SUM(LineTotal) - SUM(COGS)) * 100.0) / SUM(LineTotal), 2)
               END AS [GM%]
        FROM BaseData
        GROUP BY [Customer Name]
    ),
    SalesPivoted AS (
        SELECT * FROM (
            SELECT [Customer Name], MonthYear, ROUND(LineTotal, 0) AS LineTotal FROM BaseData
        ) AS src
        PIVOT (
            SUM(LineTotal) FOR MonthYear IN (' + @cols + ')
        ) AS pvt
    ),
    COGSPivoted AS (
        SELECT * FROM (
            SELECT [Customer Name], MonthYear + ''_COGS'' AS MonthYear, ROUND(COGS, 0) AS COGS FROM BaseData
        ) AS src
        PIVOT (
            SUM(COGS) FOR MonthYear IN (' + @cogs_cols + ')
        ) AS pvt
    ),
    LinesPivoted AS (
        SELECT * FROM (
            SELECT [Customer Name], MonthYear + ''_Lines'' AS MonthYear, LineCount FROM BaseData
        ) AS src
        PIVOT (
            SUM(LineCount) FOR MonthYear IN (' + @lines_cols + ')
        ) AS pvt
    )
    SELECT s.[Customer Name], 
           a.[Total Sales], 
           a.[Total COGS],
           a.[Total Line Items], 
           a.[GM%],' + ISNULL(@cols, '') + ',' + ISNULL(@cogs_cols, '') + ',' + ISNULL(@lines_cols, '') + '
    FROM SalesPivoted s
    JOIN Aggregated a ON s.[Customer Name] = a.[Customer Name]
    LEFT JOIN COGSPivoted c ON s.[Customer Name] = c.[Customer Name]
    LEFT JOIN LinesPivoted l ON s.[Customer Name] = l.[Customer Name]
    ORDER BY a.[Total Sales] DESC';
    `;

    const execQuery = categoryFilter
      ? `${baseQuery}\nEXEC sp_executesql @sql, N'@category NVARCHAR(100)', @category;`
      : `${baseQuery}\nEXEC sp_executesql @sql;`;

    return execQuery;
  },

  salesperson: (categoryFilter) => {
    const baseQuery = `
    DECLARE @cols NVARCHAR(MAX);
    DECLARE @cogs_cols NVARCHAR(MAX);
    DECLARE @lines_cols NVARCHAR(MAX);
    
    SELECT @cols = STRING_AGG(QUOTENAME(MonthYear), ',') WITHIN GROUP (ORDER BY MonthDate DESC)
    FROM (
        SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear, MAX(OINV.DocDate) AS MonthDate
        FROM OINV
        WHERE OINV.CANCELED = 'N'
        GROUP BY FORMAT(OINV.DocDate, 'MMM yyyy')
    ) AS MonthList;

    SELECT @cogs_cols = STRING_AGG(QUOTENAME(MonthYear + '_COGS'), ',') WITHIN GROUP (ORDER BY MonthDate DESC),
           @lines_cols = STRING_AGG(QUOTENAME(MonthYear + '_Lines'), ',') WITHIN GROUP (ORDER BY MonthDate DESC)
    FROM (
        SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear, MAX(OINV.DocDate) AS MonthDate
        FROM OINV
        WHERE OINV.CANCELED = 'N'
        GROUP BY FORMAT(OINV.DocDate, 'MMM yyyy')
    ) AS MonthList;

    DECLARE @sql NVARCHAR(MAX) = '
    WITH BaseData AS (
        SELECT OSLP.SlpName AS [Sales Person Name],
               FORMAT(OINV.DocDate, ''MMM yyyy'') AS MonthYear,
               INV1.LineTotal,
               INV1.GrossBuyPr * INV1.Quantity AS COGS,
               1 AS LineCount
        FROM OINV
        INNER JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
        INNER JOIN OSLP ON OINV.SlpCode = OSLP.SlpCode
        ${
          categoryFilter
            ? `
        INNER JOIN OITM T3 ON INV1.ItemCode = T3.ItemCode
        INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
        `
            : ""
        }
        WHERE OINV.CANCELED = ''N''
        ${categoryFilter ? `AND T4.ItmsGrpNam = @category` : ""}
    ),
    Aggregated AS (
        SELECT [Sales Person Name], 
               ROUND(SUM(LineTotal), 0) AS [Total Sales], 
               ROUND(SUM(COGS), 0) AS [Total COGS],
               SUM(LineCount) AS [Total Line Items],
               CASE 
                   WHEN SUM(LineTotal) = 0 THEN 0
                   ELSE ROUND(((SUM(LineTotal) - SUM(COGS)) * 100.0) / SUM(LineTotal), 2)
               END AS [GM%]
        FROM BaseData
        GROUP BY [Sales Person Name]
    ),
    SalesPivoted AS (
        SELECT * FROM (
            SELECT [Sales Person Name], MonthYear, ROUND(LineTotal, 0) AS LineTotal FROM BaseData
        ) AS src
        PIVOT (
            SUM(LineTotal) FOR MonthYear IN (' + @cols + ')
        ) AS pvt
    ),
    COGSPivoted AS (
        SELECT * FROM (
            SELECT [Sales Person Name], MonthYear + ''_COGS'' AS MonthYear, ROUND(COGS, 0) AS COGS FROM BaseData
        ) AS src
        PIVOT (
            SUM(COGS) FOR MonthYear IN (' + @cogs_cols + ')
        ) AS pvt
    ),
    LinesPivoted AS (
        SELECT * FROM (
            SELECT [Sales Person Name], MonthYear + ''_Lines'' AS MonthYear, LineCount FROM BaseData
        ) AS src
        PIVOT (
            SUM(LineCount) FOR MonthYear IN (' + @lines_cols + ')
        ) AS pvt
    )
    SELECT s.[Sales Person Name], 
           a.[Total Sales], 
           a.[Total COGS],
           a.[Total Line Items], 
           a.[GM%],' + ISNULL(@cols, '') + ',' + ISNULL(@cogs_cols, '') + ',' + ISNULL(@lines_cols, '') + '
    FROM SalesPivoted s
    JOIN Aggregated a ON s.[Sales Person Name] = a.[Sales Person Name]
    LEFT JOIN COGSPivoted c ON s.[Sales Person Name] = c.[Sales Person Name]
    LEFT JOIN LinesPivoted l ON s.[Sales Person Name] = l.[Sales Person Name]
    ORDER BY a.[Total Sales] DESC';
    `;

    return categoryFilter
      ? `${baseQuery}\nEXEC sp_executesql @sql, N'@category NVARCHAR(100)', @category;`
      : `${baseQuery}\nEXEC sp_executesql @sql;`;
  },

  state: (categoryFilter) => {
    const baseQuery = `
    DECLARE @cols NVARCHAR(MAX);
    DECLARE @cogs_cols NVARCHAR(MAX);
    DECLARE @lines_cols NVARCHAR(MAX);
    
    SELECT @cols = STRING_AGG(QUOTENAME(MonthYear), ',') WITHIN GROUP (ORDER BY MonthDate DESC)
    FROM (
        SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear, MAX(OINV.DocDate) AS MonthDate
        FROM OINV
        WHERE OINV.CANCELED = 'N'
        GROUP BY FORMAT(OINV.DocDate, 'MMM yyyy')
    ) AS MonthList;

    SELECT @cogs_cols = STRING_AGG(QUOTENAME(MonthYear + '_COGS'), ',') WITHIN GROUP (ORDER BY MonthDate DESC),
           @lines_cols = STRING_AGG(QUOTENAME(MonthYear + '_Lines'), ',') WITHIN GROUP (ORDER BY MonthDate DESC)
    FROM (
        SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear, MAX(OINV.DocDate) AS MonthDate
        FROM OINV
        WHERE OINV.CANCELED = 'N'
        GROUP BY FORMAT(OINV.DocDate, 'MMM yyyy')
    ) AS MonthList;

    DECLARE @sql NVARCHAR(MAX) = '
    WITH BaseData AS (
        SELECT COALESCE(CRD1.State, ''Unknown'') AS [State], 
               FORMAT(OINV.DocDate, ''MMM yyyy'') AS MonthYear,
               INV1.LineTotal,
               INV1.GrossBuyPr * INV1.Quantity AS COGS,
               1 AS LineCount
        FROM OINV
        INNER JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
        INNER JOIN OCRD ON OINV.CardCode = OCRD.CardCode
        LEFT JOIN CRD1 ON OCRD.CardCode = CRD1.CardCode AND CRD1.AdresType = ''B''
        ${
          categoryFilter
            ? `
        INNER JOIN OITM T3 ON INV1.ItemCode = T3.ItemCode
        INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
        `
            : ""
        }
        WHERE OINV.CANCELED = ''N''
        ${categoryFilter ? `AND T4.ItmsGrpNam = @category` : ""}
    ),
    Aggregated AS (
        SELECT [State], 
               ROUND(SUM(LineTotal), 0) AS [Total Sales], 
               ROUND(SUM(COGS), 0) AS [Total COGS],
               SUM(LineCount) AS [Total Line Items],
               CASE 
                   WHEN SUM(LineTotal) = 0 THEN 0
                   ELSE ROUND(((SUM(LineTotal) - SUM(COGS)) * 100.0) / SUM(LineTotal), 2)
               END AS [GM%]
        FROM BaseData
        GROUP BY [State]
    ),
    SalesPivoted AS (
        SELECT * FROM (
            SELECT [State], MonthYear, ROUND(LineTotal, 0) AS LineTotal FROM BaseData
        ) AS src
        PIVOT (
            SUM(LineTotal) FOR MonthYear IN (' + @cols + ')
        ) AS pvt
    ),
    COGSPivoted AS (
        SELECT * FROM (
            SELECT [State], MonthYear + ''_COGS'' AS MonthYear, ROUND(COGS, 0) AS COGS FROM BaseData
        ) AS src
        PIVOT (
            SUM(COGS) FOR MonthYear IN (' + @cogs_cols + ')
        ) AS pvt
    ),
    LinesPivoted AS (
        SELECT * FROM (
            SELECT [State], MonthYear + ''_Lines'' AS MonthYear, LineCount FROM BaseData
        ) AS src
        PIVOT (
            SUM(LineCount) FOR MonthYear IN (' + @lines_cols + ')
        ) AS pvt
    )
    SELECT s.[State], 
           a.[Total Sales], 
           a.[Total COGS],
           a.[Total Line Items], 
           a.[GM%],' + ISNULL(@cols, '') + ',' + ISNULL(@cogs_cols, '') + ',' + ISNULL(@lines_cols, '') + '
    FROM SalesPivoted s
    JOIN Aggregated a ON s.[State] = a.[State]
    LEFT JOIN COGSPivoted c ON s.[State] = c.[State]
    LEFT JOIN LinesPivoted l ON s.[State] = l.[State]
    ORDER BY a.[Total Sales] DESC';
    `;

    const execQuery = categoryFilter
      ? `${baseQuery}\nEXEC sp_executesql @sql, N'@category NVARCHAR(100)', @category;`
      : `${baseQuery}\nEXEC sp_executesql @sql;`;

    return execQuery;
  },

  category: () => `
    DECLARE @cols NVARCHAR(MAX);
    DECLARE @cogs_cols NVARCHAR(MAX);
    DECLARE @lines_cols NVARCHAR(MAX);
    
    SELECT @cols = STRING_AGG(QUOTENAME(MonthYear), ',') WITHIN GROUP (ORDER BY MonthDate DESC)
    FROM (
        SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear, MAX(OINV.DocDate) AS MonthDate
        FROM OINV
        WHERE OINV.CANCELED = 'N'
        GROUP BY FORMAT(OINV.DocDate, 'MMM yyyy')
    ) AS MonthList;

    SELECT @cogs_cols = STRING_AGG(QUOTENAME(MonthYear + '_COGS'), ',') WITHIN GROUP (ORDER BY MonthDate DESC),
           @lines_cols = STRING_AGG(QUOTENAME(MonthYear + '_Lines'), ',') WITHIN GROUP (ORDER BY MonthDate DESC)
    FROM (
        SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear, MAX(OINV.DocDate) AS MonthDate
        FROM OINV
        WHERE OINV.CANCELED = 'N'
        GROUP BY FORMAT(OINV.DocDate, 'MMM yyyy')
    ) AS MonthList;

    DECLARE @sql NVARCHAR(MAX) = '
    WITH BaseData AS (
        SELECT T4.ItmsGrpNam AS [Category], 
               FORMAT(OINV.DocDate, ''MMM yyyy'') AS MonthYear,
               INV1.LineTotal,
               INV1.GrossBuyPr * INV1.Quantity AS COGS,
               1 AS LineCount
        FROM OINV
        INNER JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
        INNER JOIN OITM T3 ON INV1.ItemCode = T3.ItemCode
        INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
        WHERE OINV.CANCELED = ''N''
    ),
    Aggregated AS (
        SELECT [Category], 
               ROUND(SUM(LineTotal), 0) AS [Total Sales], 
               ROUND(SUM(COGS), 0) AS [Total COGS],
               SUM(LineCount) AS [Total Line Items],
               CASE 
                   WHEN SUM(LineTotal) = 0 THEN 0
                   ELSE ROUND(((SUM(LineTotal) - SUM(COGS)) * 100.0) / SUM(LineTotal), 2)
               END AS [GM%]
        FROM BaseData
        GROUP BY [Category]
    ),
    SalesPivoted AS (
        SELECT * FROM (
            SELECT [Category], MonthYear, ROUND(LineTotal, 0) AS LineTotal FROM BaseData
        ) AS src
        PIVOT (
            SUM(LineTotal) FOR MonthYear IN (' + @cols + ')
        ) AS pvt
    ),
    COGSPivoted AS (
        SELECT * FROM (
            SELECT [Category], MonthYear + ''_COGS'' AS MonthYear, ROUND(COGS, 0) AS COGS FROM BaseData
        ) AS src
        PIVOT (
            SUM(COGS) FOR MonthYear IN (' + @cogs_cols + ')
        ) AS pvt
    ),
    LinesPivoted AS (
        SELECT * FROM (
            SELECT [Category], MonthYear + ''_Lines'' AS MonthYear, LineCount FROM BaseData
        ) AS src
        PIVOT (
            SUM(LineCount) FOR MonthYear IN (' + @lines_cols + ')
        ) AS pvt
    )
    SELECT s.[Category], 
           a.[Total Sales], 
           a.[Total COGS],
           a.[Total Line Items], 
           a.[GM%],' + ISNULL(@cols, '') + ',' + ISNULL(@lines_cols, '') + ',' + ISNULL(@cogs_cols, '') + '
    FROM SalesPivoted s
    JOIN Aggregated a ON s.[Category] = a.[Category]
    LEFT JOIN COGSPivoted c ON s.[Category] = c.[Category]
    LEFT JOIN LinesPivoted l ON s.[Category] = l.[Category]
    ORDER BY a.[Total Sales] DESC';

    EXEC sp_executesql @sql;
  `,
};

export default async function handler(req, res) {
  try {
    const { type = "customer", category } = req.query;

    if (!queries[type]) {
      return res.status(400).json({
        error:
          "Invalid type parameter. Valid types: customer, salesperson, state, category",
      });
    }

    // For category table, ignore category filter
    const sqlQuery =
      type === "category" ? queries[type]() : queries[type](category);

    // Prepare parameters for category filtering
    const params = [];
    if (category && type !== "category") {
      params.push({
        name: "category",
        type: sql.NVarChar,
        value: category,
      });
    }

    const result = await queryDatabase(sqlQuery, params);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error in monthlyLineItems API:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}