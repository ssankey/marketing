
// pages/api/category/monthlySales.js
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";

// Indian financial year: April of fyStartYear through March of fyStartYear+1.
function buildFyCondition(dateExpr, fyStartYear) {
  return `((YEAR(${dateExpr}) = ${fyStartYear} AND MONTH(${dateExpr}) >= 4) OR (YEAR(${dateExpr}) = ${fyStartYear + 1} AND MONTH(${dateExpr}) <= 3))`;
}

const queries = {
  customer: (categoryFilter, fyStartYear) => {
    const baseQuery = `
    DECLARE @cols NVARCHAR(MAX);
    DECLARE @cogs_cols NVARCHAR(MAX);
    DECLARE @lines_cols NVARCHAR(MAX);

    SELECT @cols = STRING_AGG(QUOTENAME(MonthYear), ',') WITHIN GROUP (ORDER BY MonthDate DESC)
    FROM (
        SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear, MAX(OINV.DocDate) AS MonthDate
        FROM OINV
        WHERE OINV.CANCELED <> 'Y' AND OINV.CANCELED <> 'C' AND ${buildFyCondition('OINV.DocDate', fyStartYear)}
        GROUP BY FORMAT(OINV.DocDate, 'MMM yyyy')
    ) AS MonthList;

    SELECT @cogs_cols = STRING_AGG(QUOTENAME(MonthYear + '_COGS'), ',') WITHIN GROUP (ORDER BY MonthDate DESC),
           @lines_cols = STRING_AGG(QUOTENAME(MonthYear + '_Lines'), ',') WITHIN GROUP (ORDER BY MonthDate DESC)
    FROM (
        SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear, MAX(OINV.DocDate) AS MonthDate
        FROM OINV
        WHERE OINV.CANCELED <> 'Y' AND OINV.CANCELED <> 'C' AND ${buildFyCondition('OINV.DocDate', fyStartYear)}
        GROUP BY FORMAT(OINV.DocDate, 'MMM yyyy')
    ) AS MonthList;

    DECLARE @sql NVARCHAR(MAX) = '
    IF OBJECT_ID(''tempdb..#BaseData'') IS NOT NULL DROP TABLE #BaseData;

    SELECT [Customer Name], MonthYear, LineTotal, COGS, LineCount
    INTO #BaseData
    FROM (
        SELECT OCRD.CardName AS [Customer Name],
               FORMAT(OINV.DocDate, ''MMM yyyy'') AS MonthYear,
               INV1.LineTotal,
               (CASE WHEN IC.ParsedItemCost IS NOT NULL AND IC.ParsedItemCost <> 0 THEN IC.ParsedItemCost ELSE INV1.GrossBuyPr END) * INV1.Quantity AS COGS,
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
        CROSS APPLY (SELECT TRY_CAST(NULLIF(LTRIM(RTRIM(INV1.U_ItemCost)), '''') AS FLOAT) AS ParsedItemCost) IC
        WHERE OINV.CANCELED <> ''Y'' AND OINV.CANCELED <> ''C'' AND ${buildFyCondition('OINV.DocDate', fyStartYear)}
        ${categoryFilter ? `AND T4.ItmsGrpNam = @category` : ""}

        UNION ALL

        SELECT OCRD.CardName AS [Customer Name],
               FORMAT(ORIN.DocDate, ''MMM yyyy'') AS MonthYear,
               -RIN1.LineTotal AS LineTotal,
               -((CASE WHEN IC.ParsedItemCost IS NOT NULL AND IC.ParsedItemCost <> 0 THEN IC.ParsedItemCost ELSE RIN1.GrossBuyPr END) * RIN1.Quantity) AS COGS,
               0 AS LineCount
        FROM ORIN
        INNER JOIN RIN1 ON ORIN.DocEntry = RIN1.DocEntry
        INNER JOIN OCRD ON ORIN.CardCode = OCRD.CardCode
        ${
          categoryFilter
            ? `
        INNER JOIN OITM T3 ON RIN1.ItemCode = T3.ItemCode
        INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
        `
            : ""
        }
        CROSS APPLY (SELECT TRY_CAST(NULLIF(LTRIM(RTRIM(RIN1.U_ItemCost)), '''') AS FLOAT) AS ParsedItemCost) IC
        WHERE ORIN.CANCELED <> ''Y'' AND ORIN.CANCELED <> ''C'' AND ${buildFyCondition('ORIN.DocDate', fyStartYear)}
        ${categoryFilter ? `AND T4.ItmsGrpNam = @category` : ""}
    ) AS BD;

    CREATE NONCLUSTERED INDEX IX_BaseData_Key ON #BaseData ([Customer Name], MonthYear);

    ;WITH Aggregated AS (
        SELECT [Customer Name],
               ROUND(SUM(LineTotal), 0) AS [Total Sales],
               ROUND(SUM(COGS), 0) AS [Total COGS],
               SUM(LineCount) AS [Total Line Items],
               CASE
                   WHEN SUM(LineTotal) = 0 THEN 0
                   ELSE ROUND(((SUM(LineTotal) - SUM(COGS)) * 100.0) / SUM(LineTotal), 2)
               END AS [GM%]
        FROM #BaseData
        GROUP BY [Customer Name]
    ),
    SalesPivoted AS (
        SELECT * FROM (
            SELECT [Customer Name], MonthYear, ROUND(LineTotal, 0) AS LineTotal FROM #BaseData
        ) AS src
        PIVOT (
            SUM(LineTotal) FOR MonthYear IN (' + @cols + ')
        ) AS pvt
    ),
    COGSPivoted AS (
        SELECT * FROM (
            SELECT [Customer Name], MonthYear + ''_COGS'' AS MonthYear, ROUND(COGS, 0) AS COGS FROM #BaseData
        ) AS src
        PIVOT (
            SUM(COGS) FOR MonthYear IN (' + @cogs_cols + ')
        ) AS pvt
    ),
    LinesPivoted AS (
        SELECT * FROM (
            SELECT [Customer Name], MonthYear + ''_Lines'' AS MonthYear, LineCount FROM #BaseData
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
    ORDER BY a.[Total Sales] DESC;

    DROP TABLE #BaseData;';
    `;

    const execQuery = categoryFilter
      ? `${baseQuery}\nEXEC sp_executesql @sql, N'@category NVARCHAR(100)', @category;`
      : `${baseQuery}\nEXEC sp_executesql @sql;`;

    return execQuery;
  },

  salesperson: (categoryFilter, fyStartYear) => {
    const baseQuery = `
    DECLARE @cols NVARCHAR(MAX);
    DECLARE @cogs_cols NVARCHAR(MAX);
    DECLARE @lines_cols NVARCHAR(MAX);

    SELECT @cols = STRING_AGG(QUOTENAME(MonthYear), ',') WITHIN GROUP (ORDER BY MonthDate DESC)
    FROM (
        SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear, MAX(OINV.DocDate) AS MonthDate
        FROM OINV
        WHERE OINV.CANCELED <> 'Y' AND OINV.CANCELED <> 'C' AND ${buildFyCondition('OINV.DocDate', fyStartYear)}
        GROUP BY FORMAT(OINV.DocDate, 'MMM yyyy')
    ) AS MonthList;

    SELECT @cogs_cols = STRING_AGG(QUOTENAME(MonthYear + '_COGS'), ',') WITHIN GROUP (ORDER BY MonthDate DESC),
           @lines_cols = STRING_AGG(QUOTENAME(MonthYear + '_Lines'), ',') WITHIN GROUP (ORDER BY MonthDate DESC)
    FROM (
        SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear, MAX(OINV.DocDate) AS MonthDate
        FROM OINV
        WHERE OINV.CANCELED <> 'Y' AND OINV.CANCELED <> 'C' AND ${buildFyCondition('OINV.DocDate', fyStartYear)}
        GROUP BY FORMAT(OINV.DocDate, 'MMM yyyy')
    ) AS MonthList;

    DECLARE @sql NVARCHAR(MAX) = '
    IF OBJECT_ID(''tempdb..#BaseData'') IS NOT NULL DROP TABLE #BaseData;

    SELECT [Sales Person Name], MonthYear, LineTotal, COGS, LineCount
    INTO #BaseData
    FROM (
        SELECT OSLP.SlpName AS [Sales Person Name],
               FORMAT(OINV.DocDate, ''MMM yyyy'') AS MonthYear,
               INV1.LineTotal,
               (CASE WHEN IC.ParsedItemCost IS NOT NULL AND IC.ParsedItemCost <> 0 THEN IC.ParsedItemCost ELSE INV1.GrossBuyPr END) * INV1.Quantity AS COGS,
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
        CROSS APPLY (SELECT TRY_CAST(NULLIF(LTRIM(RTRIM(INV1.U_ItemCost)), '''') AS FLOAT) AS ParsedItemCost) IC
        WHERE OINV.CANCELED <> ''Y'' AND OINV.CANCELED <> ''C'' AND ${buildFyCondition('OINV.DocDate', fyStartYear)}
        ${categoryFilter ? `AND T4.ItmsGrpNam = @category` : ""}

        UNION ALL

        SELECT OSLP.SlpName AS [Sales Person Name],
               FORMAT(ORIN.DocDate, ''MMM yyyy'') AS MonthYear,
               -RIN1.LineTotal AS LineTotal,
               -((CASE WHEN IC.ParsedItemCost IS NOT NULL AND IC.ParsedItemCost <> 0 THEN IC.ParsedItemCost ELSE RIN1.GrossBuyPr END) * RIN1.Quantity) AS COGS,
               0 AS LineCount
        FROM ORIN
        INNER JOIN RIN1 ON ORIN.DocEntry = RIN1.DocEntry
        INNER JOIN OSLP ON ORIN.SlpCode = OSLP.SlpCode
        ${
          categoryFilter
            ? `
        INNER JOIN OITM T3 ON RIN1.ItemCode = T3.ItemCode
        INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
        `
            : ""
        }
        CROSS APPLY (SELECT TRY_CAST(NULLIF(LTRIM(RTRIM(RIN1.U_ItemCost)), '''') AS FLOAT) AS ParsedItemCost) IC
        WHERE ORIN.CANCELED <> ''Y'' AND ORIN.CANCELED <> ''C'' AND ${buildFyCondition('ORIN.DocDate', fyStartYear)}
        ${categoryFilter ? `AND T4.ItmsGrpNam = @category` : ""}
    ) AS BD;

    CREATE NONCLUSTERED INDEX IX_BaseData_Key ON #BaseData ([Sales Person Name], MonthYear);

    ;WITH Aggregated AS (
        SELECT [Sales Person Name],
               ROUND(SUM(LineTotal), 0) AS [Total Sales],
               ROUND(SUM(COGS), 0) AS [Total COGS],
               SUM(LineCount) AS [Total Line Items],
               CASE
                   WHEN SUM(LineTotal) = 0 THEN 0
                   ELSE ROUND(((SUM(LineTotal) - SUM(COGS)) * 100.0) / SUM(LineTotal), 2)
               END AS [GM%]
        FROM #BaseData
        GROUP BY [Sales Person Name]
    ),
    SalesPivoted AS (
        SELECT * FROM (
            SELECT [Sales Person Name], MonthYear, ROUND(LineTotal, 0) AS LineTotal FROM #BaseData
        ) AS src
        PIVOT (
            SUM(LineTotal) FOR MonthYear IN (' + @cols + ')
        ) AS pvt
    ),
    COGSPivoted AS (
        SELECT * FROM (
            SELECT [Sales Person Name], MonthYear + ''_COGS'' AS MonthYear, ROUND(COGS, 0) AS COGS FROM #BaseData
        ) AS src
        PIVOT (
            SUM(COGS) FOR MonthYear IN (' + @cogs_cols + ')
        ) AS pvt
    ),
    LinesPivoted AS (
        SELECT * FROM (
            SELECT [Sales Person Name], MonthYear + ''_Lines'' AS MonthYear, LineCount FROM #BaseData
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
    ORDER BY a.[Total Sales] DESC;

    DROP TABLE #BaseData;';
    `;

    return categoryFilter
      ? `${baseQuery}\nEXEC sp_executesql @sql, N'@category NVARCHAR(100)', @category;`
      : `${baseQuery}\nEXEC sp_executesql @sql;`;
  },

  state: (categoryFilter, fyStartYear) => {
    const baseQuery = `
    DECLARE @cols NVARCHAR(MAX);
    DECLARE @cogs_cols NVARCHAR(MAX);
    DECLARE @lines_cols NVARCHAR(MAX);

    SELECT @cols = STRING_AGG(QUOTENAME(MonthYear), ',') WITHIN GROUP (ORDER BY MonthDate DESC)
    FROM (
        SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear, MAX(OINV.DocDate) AS MonthDate
        FROM OINV
        WHERE OINV.CANCELED <> 'Y' AND OINV.CANCELED <> 'C' AND ${buildFyCondition('OINV.DocDate', fyStartYear)}
        GROUP BY FORMAT(OINV.DocDate, 'MMM yyyy')
    ) AS MonthList;

    SELECT @cogs_cols = STRING_AGG(QUOTENAME(MonthYear + '_COGS'), ',') WITHIN GROUP (ORDER BY MonthDate DESC),
           @lines_cols = STRING_AGG(QUOTENAME(MonthYear + '_Lines'), ',') WITHIN GROUP (ORDER BY MonthDate DESC)
    FROM (
        SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear, MAX(OINV.DocDate) AS MonthDate
        FROM OINV
        WHERE OINV.CANCELED <> 'Y' AND OINV.CANCELED <> 'C' AND ${buildFyCondition('OINV.DocDate', fyStartYear)}
        GROUP BY FORMAT(OINV.DocDate, 'MMM yyyy')
    ) AS MonthList;

    DECLARE @sql NVARCHAR(MAX) = '
    IF OBJECT_ID(''tempdb..#BaseData'') IS NOT NULL DROP TABLE #BaseData;

    SELECT [State], MonthYear, LineTotal, COGS, LineCount
    INTO #BaseData
    FROM (
        SELECT COALESCE(CRD1.State, ''Unknown'') AS [State],
               FORMAT(OINV.DocDate, ''MMM yyyy'') AS MonthYear,
               INV1.LineTotal,
               (CASE WHEN IC.ParsedItemCost IS NOT NULL AND IC.ParsedItemCost <> 0 THEN IC.ParsedItemCost ELSE INV1.GrossBuyPr END) * INV1.Quantity AS COGS,
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
        CROSS APPLY (SELECT TRY_CAST(NULLIF(LTRIM(RTRIM(INV1.U_ItemCost)), '''') AS FLOAT) AS ParsedItemCost) IC
        WHERE OINV.CANCELED <> ''Y'' AND OINV.CANCELED <> ''C'' AND ${buildFyCondition('OINV.DocDate', fyStartYear)}
        ${categoryFilter ? `AND T4.ItmsGrpNam = @category` : ""}

        UNION ALL

        SELECT COALESCE(CRD1.State, ''Unknown'') AS [State],
               FORMAT(ORIN.DocDate, ''MMM yyyy'') AS MonthYear,
               -RIN1.LineTotal AS LineTotal,
               -((CASE WHEN IC.ParsedItemCost IS NOT NULL AND IC.ParsedItemCost <> 0 THEN IC.ParsedItemCost ELSE RIN1.GrossBuyPr END) * RIN1.Quantity) AS COGS,
               0 AS LineCount
        FROM ORIN
        INNER JOIN RIN1 ON ORIN.DocEntry = RIN1.DocEntry
        INNER JOIN OCRD ON ORIN.CardCode = OCRD.CardCode
        LEFT JOIN CRD1 ON OCRD.CardCode = CRD1.CardCode AND CRD1.AdresType = ''B''
        ${
          categoryFilter
            ? `
        INNER JOIN OITM T3 ON RIN1.ItemCode = T3.ItemCode
        INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
        `
            : ""
        }
        CROSS APPLY (SELECT TRY_CAST(NULLIF(LTRIM(RTRIM(RIN1.U_ItemCost)), '''') AS FLOAT) AS ParsedItemCost) IC
        WHERE ORIN.CANCELED <> ''Y'' AND ORIN.CANCELED <> ''C'' AND ${buildFyCondition('ORIN.DocDate', fyStartYear)}
        ${categoryFilter ? `AND T4.ItmsGrpNam = @category` : ""}
    ) AS BD;

    CREATE NONCLUSTERED INDEX IX_BaseData_Key ON #BaseData ([State], MonthYear);

    ;WITH Aggregated AS (
        SELECT [State],
               ROUND(SUM(LineTotal), 0) AS [Total Sales],
               ROUND(SUM(COGS), 0) AS [Total COGS],
               SUM(LineCount) AS [Total Line Items],
               CASE
                   WHEN SUM(LineTotal) = 0 THEN 0
                   ELSE ROUND(((SUM(LineTotal) - SUM(COGS)) * 100.0) / SUM(LineTotal), 2)
               END AS [GM%]
        FROM #BaseData
        GROUP BY [State]
    ),
    SalesPivoted AS (
        SELECT * FROM (
            SELECT [State], MonthYear, ROUND(LineTotal, 0) AS LineTotal FROM #BaseData
        ) AS src
        PIVOT (
            SUM(LineTotal) FOR MonthYear IN (' + @cols + ')
        ) AS pvt
    ),
    COGSPivoted AS (
        SELECT * FROM (
            SELECT [State], MonthYear + ''_COGS'' AS MonthYear, ROUND(COGS, 0) AS COGS FROM #BaseData
        ) AS src
        PIVOT (
            SUM(COGS) FOR MonthYear IN (' + @cogs_cols + ')
        ) AS pvt
    ),
    LinesPivoted AS (
        SELECT * FROM (
            SELECT [State], MonthYear + ''_Lines'' AS MonthYear, LineCount FROM #BaseData
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
    ORDER BY a.[Total Sales] DESC;

    DROP TABLE #BaseData;';
    `;

    const execQuery = categoryFilter
      ? `${baseQuery}\nEXEC sp_executesql @sql, N'@category NVARCHAR(100)', @category;`
      : `${baseQuery}\nEXEC sp_executesql @sql;`;

    return execQuery;
  },

  category: (fyStartYear) => `
    DECLARE @cols NVARCHAR(MAX);
    DECLARE @cogs_cols NVARCHAR(MAX);
    DECLARE @lines_cols NVARCHAR(MAX);

    SELECT @cols = STRING_AGG(QUOTENAME(MonthYear), ',') WITHIN GROUP (ORDER BY MonthDate DESC)
    FROM (
        SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear, MAX(OINV.DocDate) AS MonthDate
        FROM OINV
        WHERE OINV.CANCELED <> 'Y' AND OINV.CANCELED <> 'C' AND ${buildFyCondition('OINV.DocDate', fyStartYear)}
        GROUP BY FORMAT(OINV.DocDate, 'MMM yyyy')
    ) AS MonthList;

    SELECT @cogs_cols = STRING_AGG(QUOTENAME(MonthYear + '_COGS'), ',') WITHIN GROUP (ORDER BY MonthDate DESC),
           @lines_cols = STRING_AGG(QUOTENAME(MonthYear + '_Lines'), ',') WITHIN GROUP (ORDER BY MonthDate DESC)
    FROM (
        SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear, MAX(OINV.DocDate) AS MonthDate
        FROM OINV
        WHERE OINV.CANCELED <> 'Y' AND OINV.CANCELED <> 'C' AND ${buildFyCondition('OINV.DocDate', fyStartYear)}
        GROUP BY FORMAT(OINV.DocDate, 'MMM yyyy')
    ) AS MonthList;

    DECLARE @sql NVARCHAR(MAX) = '
    IF OBJECT_ID(''tempdb..#BaseData'') IS NOT NULL DROP TABLE #BaseData;

    SELECT [Category], MonthYear, LineTotal, COGS, LineCount
    INTO #BaseData
    FROM (
        SELECT T4.ItmsGrpNam AS [Category],
               FORMAT(OINV.DocDate, ''MMM yyyy'') AS MonthYear,
               INV1.LineTotal,
               (CASE WHEN IC.ParsedItemCost IS NOT NULL AND IC.ParsedItemCost <> 0 THEN IC.ParsedItemCost ELSE INV1.GrossBuyPr END) * INV1.Quantity AS COGS,
               1 AS LineCount
        FROM OINV
        INNER JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
        INNER JOIN OITM T3 ON INV1.ItemCode = T3.ItemCode
        INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
        CROSS APPLY (SELECT TRY_CAST(NULLIF(LTRIM(RTRIM(INV1.U_ItemCost)), '''') AS FLOAT) AS ParsedItemCost) IC
        WHERE OINV.CANCELED <> ''Y'' AND OINV.CANCELED <> ''C'' AND ${buildFyCondition('OINV.DocDate', fyStartYear)}

        UNION ALL

        SELECT T4.ItmsGrpNam AS [Category],
               FORMAT(ORIN.DocDate, ''MMM yyyy'') AS MonthYear,
               -RIN1.LineTotal AS LineTotal,
               -((CASE WHEN IC.ParsedItemCost IS NOT NULL AND IC.ParsedItemCost <> 0 THEN IC.ParsedItemCost ELSE RIN1.GrossBuyPr END) * RIN1.Quantity) AS COGS,
               0 AS LineCount
        FROM ORIN
        INNER JOIN RIN1 ON ORIN.DocEntry = RIN1.DocEntry
        INNER JOIN OITM T3 ON RIN1.ItemCode = T3.ItemCode
        INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
        CROSS APPLY (SELECT TRY_CAST(NULLIF(LTRIM(RTRIM(RIN1.U_ItemCost)), '''') AS FLOAT) AS ParsedItemCost) IC
        WHERE ORIN.CANCELED <> ''Y'' AND ORIN.CANCELED <> ''C'' AND ${buildFyCondition('ORIN.DocDate', fyStartYear)}
    ) AS BD;

    CREATE NONCLUSTERED INDEX IX_BaseData_Key ON #BaseData ([Category], MonthYear);

    ;WITH Aggregated AS (
        SELECT [Category],
               ROUND(SUM(LineTotal), 0) AS [Total Sales],
               ROUND(SUM(COGS), 0) AS [Total COGS],
               SUM(LineCount) AS [Total Line Items],
               CASE
                   WHEN SUM(LineTotal) = 0 THEN 0
                   ELSE ROUND(((SUM(LineTotal) - SUM(COGS)) * 100.0) / SUM(LineTotal), 2)
               END AS [GM%]
        FROM #BaseData
        GROUP BY [Category]
    ),
    SalesPivoted AS (
        SELECT * FROM (
            SELECT [Category], MonthYear, ROUND(LineTotal, 0) AS LineTotal FROM #BaseData
        ) AS src
        PIVOT (
            SUM(LineTotal) FOR MonthYear IN (' + @cols + ')
        ) AS pvt
    ),
    COGSPivoted AS (
        SELECT * FROM (
            SELECT [Category], MonthYear + ''_COGS'' AS MonthYear, ROUND(COGS, 0) AS COGS FROM #BaseData
        ) AS src
        PIVOT (
            SUM(COGS) FOR MonthYear IN (' + @cogs_cols + ')
        ) AS pvt
    ),
    LinesPivoted AS (
        SELECT * FROM (
            SELECT [Category], MonthYear + ''_Lines'' AS MonthYear, LineCount FROM #BaseData
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
    ORDER BY a.[Total Sales] DESC;

    DROP TABLE #BaseData;';

    EXEC sp_executesql @sql;
  `,
};

// Plain (non-pivoted, non-dynamic-SQL) all-time totals, run as a separate
// query and merged in by key. Kept deliberately simple/static — folding this
// into the dynamic PIVOT string above made the batch long enough to trip a
// tedious/mssql driver quirk that silently mangled the sp_executesql text.
const allTimeQueries = {
  customer: (categoryFilter) => `
    SELECT [Customer Name],
           SUM(LineTotal) AS [All Time Sales],
           SUM(COGS) AS [All Time COGS],
           SUM(LineCount) AS [All Time Lines],
           CASE WHEN SUM(LineTotal) = 0 THEN 0 ELSE ROUND(((SUM(LineTotal) - SUM(COGS)) * 100.0) / SUM(LineTotal), 2) END AS [All Time GM%]
    FROM (
        SELECT OCRD.CardName AS [Customer Name],
               INV1.LineTotal,
               (CASE WHEN IC.ParsedItemCost IS NOT NULL AND IC.ParsedItemCost <> 0 THEN IC.ParsedItemCost ELSE INV1.GrossBuyPr END) * INV1.Quantity AS COGS,
               1 AS LineCount
        FROM OINV
        INNER JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
        INNER JOIN OCRD ON OINV.CardCode = OCRD.CardCode
        CROSS APPLY (SELECT TRY_CAST(NULLIF(LTRIM(RTRIM(INV1.U_ItemCost)), '') AS FLOAT) AS ParsedItemCost) IC
        ${categoryFilter ? `
        INNER JOIN OITM T3 ON INV1.ItemCode = T3.ItemCode
        INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
        ` : ""}
        WHERE OINV.CANCELED <> 'Y' AND OINV.CANCELED <> 'C'
        ${categoryFilter ? `AND T4.ItmsGrpNam = @category` : ""}

        UNION ALL

        SELECT OCRD.CardName AS [Customer Name],
               -RIN1.LineTotal AS LineTotal,
               -((CASE WHEN IC.ParsedItemCost IS NOT NULL AND IC.ParsedItemCost <> 0 THEN IC.ParsedItemCost ELSE RIN1.GrossBuyPr END) * RIN1.Quantity) AS COGS,
               0 AS LineCount
        FROM ORIN
        INNER JOIN RIN1 ON ORIN.DocEntry = RIN1.DocEntry
        INNER JOIN OCRD ON ORIN.CardCode = OCRD.CardCode
        CROSS APPLY (SELECT TRY_CAST(NULLIF(LTRIM(RTRIM(RIN1.U_ItemCost)), '') AS FLOAT) AS ParsedItemCost) IC
        ${categoryFilter ? `
        INNER JOIN OITM T3 ON RIN1.ItemCode = T3.ItemCode
        INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
        ` : ""}
        WHERE ORIN.CANCELED <> 'Y' AND ORIN.CANCELED <> 'C'
        ${categoryFilter ? `AND T4.ItmsGrpNam = @category` : ""}
    ) AS ATD
    GROUP BY [Customer Name];
  `,

  salesperson: (categoryFilter) => `
    SELECT [Sales Person Name],
           SUM(LineTotal) AS [All Time Sales],
           SUM(COGS) AS [All Time COGS],
           SUM(LineCount) AS [All Time Lines],
           CASE WHEN SUM(LineTotal) = 0 THEN 0 ELSE ROUND(((SUM(LineTotal) - SUM(COGS)) * 100.0) / SUM(LineTotal), 2) END AS [All Time GM%]
    FROM (
        SELECT OSLP.SlpName AS [Sales Person Name],
               INV1.LineTotal,
               (CASE WHEN IC.ParsedItemCost IS NOT NULL AND IC.ParsedItemCost <> 0 THEN IC.ParsedItemCost ELSE INV1.GrossBuyPr END) * INV1.Quantity AS COGS,
               1 AS LineCount
        FROM OINV
        INNER JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
        INNER JOIN OSLP ON OINV.SlpCode = OSLP.SlpCode
        CROSS APPLY (SELECT TRY_CAST(NULLIF(LTRIM(RTRIM(INV1.U_ItemCost)), '') AS FLOAT) AS ParsedItemCost) IC
        ${categoryFilter ? `
        INNER JOIN OITM T3 ON INV1.ItemCode = T3.ItemCode
        INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
        ` : ""}
        WHERE OINV.CANCELED <> 'Y' AND OINV.CANCELED <> 'C'
        ${categoryFilter ? `AND T4.ItmsGrpNam = @category` : ""}

        UNION ALL

        SELECT OSLP.SlpName AS [Sales Person Name],
               -RIN1.LineTotal AS LineTotal,
               -((CASE WHEN IC.ParsedItemCost IS NOT NULL AND IC.ParsedItemCost <> 0 THEN IC.ParsedItemCost ELSE RIN1.GrossBuyPr END) * RIN1.Quantity) AS COGS,
               0 AS LineCount
        FROM ORIN
        INNER JOIN RIN1 ON ORIN.DocEntry = RIN1.DocEntry
        INNER JOIN OSLP ON ORIN.SlpCode = OSLP.SlpCode
        CROSS APPLY (SELECT TRY_CAST(NULLIF(LTRIM(RTRIM(RIN1.U_ItemCost)), '') AS FLOAT) AS ParsedItemCost) IC
        ${categoryFilter ? `
        INNER JOIN OITM T3 ON RIN1.ItemCode = T3.ItemCode
        INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
        ` : ""}
        WHERE ORIN.CANCELED <> 'Y' AND ORIN.CANCELED <> 'C'
        ${categoryFilter ? `AND T4.ItmsGrpNam = @category` : ""}
    ) AS ATD
    GROUP BY [Sales Person Name];
  `,

  state: (categoryFilter) => `
    SELECT [State],
           SUM(LineTotal) AS [All Time Sales],
           SUM(COGS) AS [All Time COGS],
           SUM(LineCount) AS [All Time Lines],
           CASE WHEN SUM(LineTotal) = 0 THEN 0 ELSE ROUND(((SUM(LineTotal) - SUM(COGS)) * 100.0) / SUM(LineTotal), 2) END AS [All Time GM%]
    FROM (
        SELECT COALESCE(CRD1.State, 'Unknown') AS [State],
               INV1.LineTotal,
               (CASE WHEN IC.ParsedItemCost IS NOT NULL AND IC.ParsedItemCost <> 0 THEN IC.ParsedItemCost ELSE INV1.GrossBuyPr END) * INV1.Quantity AS COGS,
               1 AS LineCount
        FROM OINV
        INNER JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
        INNER JOIN OCRD ON OINV.CardCode = OCRD.CardCode
        LEFT JOIN CRD1 ON OCRD.CardCode = CRD1.CardCode AND CRD1.AdresType = 'B'
        CROSS APPLY (SELECT TRY_CAST(NULLIF(LTRIM(RTRIM(INV1.U_ItemCost)), '') AS FLOAT) AS ParsedItemCost) IC
        ${categoryFilter ? `
        INNER JOIN OITM T3 ON INV1.ItemCode = T3.ItemCode
        INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
        ` : ""}
        WHERE OINV.CANCELED <> 'Y' AND OINV.CANCELED <> 'C'
        ${categoryFilter ? `AND T4.ItmsGrpNam = @category` : ""}

        UNION ALL

        SELECT COALESCE(CRD1.State, 'Unknown') AS [State],
               -RIN1.LineTotal AS LineTotal,
               -((CASE WHEN IC.ParsedItemCost IS NOT NULL AND IC.ParsedItemCost <> 0 THEN IC.ParsedItemCost ELSE RIN1.GrossBuyPr END) * RIN1.Quantity) AS COGS,
               0 AS LineCount
        FROM ORIN
        INNER JOIN RIN1 ON ORIN.DocEntry = RIN1.DocEntry
        INNER JOIN OCRD ON ORIN.CardCode = OCRD.CardCode
        LEFT JOIN CRD1 ON OCRD.CardCode = CRD1.CardCode AND CRD1.AdresType = 'B'
        CROSS APPLY (SELECT TRY_CAST(NULLIF(LTRIM(RTRIM(RIN1.U_ItemCost)), '') AS FLOAT) AS ParsedItemCost) IC
        ${categoryFilter ? `
        INNER JOIN OITM T3 ON RIN1.ItemCode = T3.ItemCode
        INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
        ` : ""}
        WHERE ORIN.CANCELED <> 'Y' AND ORIN.CANCELED <> 'C'
        ${categoryFilter ? `AND T4.ItmsGrpNam = @category` : ""}
    ) AS ATD
    GROUP BY [State];
  `,

  category: () => `
    SELECT [Category],
           SUM(LineTotal) AS [All Time Sales],
           SUM(COGS) AS [All Time COGS],
           SUM(LineCount) AS [All Time Lines],
           CASE WHEN SUM(LineTotal) = 0 THEN 0 ELSE ROUND(((SUM(LineTotal) - SUM(COGS)) * 100.0) / SUM(LineTotal), 2) END AS [All Time GM%]
    FROM (
        SELECT T4.ItmsGrpNam AS [Category],
               INV1.LineTotal,
               (CASE WHEN IC.ParsedItemCost IS NOT NULL AND IC.ParsedItemCost <> 0 THEN IC.ParsedItemCost ELSE INV1.GrossBuyPr END) * INV1.Quantity AS COGS,
               1 AS LineCount
        FROM OINV
        INNER JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
        INNER JOIN OITM T3 ON INV1.ItemCode = T3.ItemCode
        INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
        CROSS APPLY (SELECT TRY_CAST(NULLIF(LTRIM(RTRIM(INV1.U_ItemCost)), '') AS FLOAT) AS ParsedItemCost) IC
        WHERE OINV.CANCELED <> 'Y' AND OINV.CANCELED <> 'C'

        UNION ALL

        SELECT T4.ItmsGrpNam AS [Category],
               -RIN1.LineTotal AS LineTotal,
               -((CASE WHEN IC.ParsedItemCost IS NOT NULL AND IC.ParsedItemCost <> 0 THEN IC.ParsedItemCost ELSE RIN1.GrossBuyPr END) * RIN1.Quantity) AS COGS,
               0 AS LineCount
        FROM ORIN
        INNER JOIN RIN1 ON ORIN.DocEntry = RIN1.DocEntry
        INNER JOIN OITM T3 ON RIN1.ItemCode = T3.ItemCode
        INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
        CROSS APPLY (SELECT TRY_CAST(NULLIF(LTRIM(RTRIM(RIN1.U_ItemCost)), '') AS FLOAT) AS ParsedItemCost) IC
        WHERE ORIN.CANCELED <> 'Y' AND ORIN.CANCELED <> 'C'
    ) AS ATD
    GROUP BY [Category];
  `,
};

const KEY_FIELD_BY_TYPE = {
  customer: "Customer Name",
  salesperson: "Sales Person Name",
  state: "State",
  category: "Category",
};

// Same FY convention as the frontend: April→March, "current" FY starts in
// whichever calendar year we're in if we're past March.
function currentFyStartYear() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return month >= 4 ? year : year - 1;
}

function resolveFyStartYear(fyParam) {
  const parsed = parseInt(fyParam, 10);
  if (!Number.isFinite(parsed) || parsed < 2000 || parsed > 2100) {
    return currentFyStartYear();
  }
  return parsed;
}

export default async function handler(req, res) {
  try {
    const { type = "customer", category, fy } = req.query;

    if (!queries[type]) {
      return res.status(400).json({
        error:
          "Invalid type parameter. Valid types: customer, salesperson, state, category",
      });
    }

    const fyStartYear = resolveFyStartYear(fy);

    // For category table, ignore category filter
    const sqlQuery =
      type === "category"
        ? queries[type](fyStartYear)
        : queries[type](category, fyStartYear);

    // Prepare parameters for category filtering
    const params = [];
    if (category && type !== "category") {
      params.push({
        name: "category",
        type: sql.NVarChar,
        value: category,
      });
    }

    const allTimeQuery =
      type === "category"
        ? allTimeQueries[type]()
        : allTimeQueries[type](category);

    const [result, allTimeResult] = await Promise.all([
      queryDatabase(sqlQuery, params),
      queryDatabase(allTimeQuery, params),
    ]);

    const keyField = KEY_FIELD_BY_TYPE[type];
    const allTimeMap = new Map(allTimeResult.map((r) => [r[keyField], r]));

    const merged = result.map((row) => {
      const at = allTimeMap.get(row[keyField]);
      return {
        [keyField]: row[keyField],
        "All Time Sales": at?.["All Time Sales"] || 0,
        "All Time COGS": at?.["All Time COGS"] || 0,
        "All Time Lines": at?.["All Time Lines"] || 0,
        "All Time GM%": at?.["All Time GM%"] || 0,
        ...row,
      };
    });

    merged.sort((a, b) => (b["All Time Sales"] || 0) - (a["All Time Sales"] || 0));

    res.status(200).json(merged);
  } catch (err) {
    console.error("Error in monthlyLineItems API:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
