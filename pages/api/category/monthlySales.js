// pages/api/category/monthlySales.js
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";

const queries = {
  customer: (categoryFilter) => {
    const baseQuery = `
    DECLARE @cols NVARCHAR(MAX);
    SELECT @cols = STRING_AGG(QUOTENAME(MonthYear), ',') WITHIN GROUP (ORDER BY MonthDate DESC)
    FROM (
        SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear, MAX(OINV.DocDate) AS MonthDate
        FROM OINV
        WHERE OINV.CANCELED = 'N'
        GROUP BY FORMAT(OINV.DocDate, 'MMM yyyy')
    ) AS MonthList;

    DECLARE @sql NVARCHAR(MAX) = '
    WITH BaseData AS (
        SELECT OCRD.CardName AS [Customer Name], FORMAT(OINV.DocDate, ''MMM yyyy'') AS MonthYear,
        INV1.LineTotal, 1 AS LineCount
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
        SELECT [Customer Name], ROUND(SUM(LineTotal), 0) AS [Total Sales], SUM(LineCount) AS [Total Line Items]
        FROM BaseData
        GROUP BY [Customer Name]
    ),
    Pivoted AS (
        SELECT * FROM (
            SELECT [Customer Name], MonthYear, ROUND(LineTotal, 0) AS LineTotal FROM BaseData
        ) AS src
        PIVOT (
            SUM(LineTotal) FOR MonthYear IN (' + @cols + ')
        ) AS pvt
    )
    SELECT p.[Customer Name], a.[Total Sales], a.[Total Line Items],' + @cols + '
    FROM Pivoted p
    JOIN Aggregated a ON p.[Customer Name] = a.[Customer Name]
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
  /* Build month list e.g. [May 2025],[Apr 2025] … */
  SELECT @cols = STRING_AGG(QUOTENAME(MonthYear), ',')
                 WITHIN GROUP (ORDER BY MonthDate DESC)
  FROM (
      SELECT DISTINCT
             FORMAT(OINV.DocDate,'MMM yyyy') AS MonthYear,
             MAX(OINV.DocDate)               AS MonthDate
      FROM OINV
      WHERE OINV.CANCELED = 'N'
      GROUP BY FORMAT(OINV.DocDate,'MMM yyyy')
  ) AS MonthList;

  /* Dynamic pivot query */
  DECLARE @sql NVARCHAR(MAX) = '
  WITH BaseData AS (
      SELECT  OSLP.SlpName                       AS [Sales Person Name],
              FORMAT(OINV.DocDate,''MMM yyyy'')  AS MonthYear,
              ROUND(INV1.LineTotal,0)            AS LineTotal,
              1                                  AS LineCount
      FROM    OINV
      INNER JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
      INNER JOIN OSLP ON OINV.SlpCode  = OSLP.SlpCode
      ${
        categoryFilter
          ? `
      INNER JOIN OITM T3 ON INV1.ItemCode = T3.ItemCode
      INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
      `
          : ""
      }
      WHERE   OINV.CANCELED = ''N''
      ${categoryFilter ? `AND T4.ItmsGrpNam = @category` : ""}
  ),
  Aggregated AS (
      SELECT  [Sales Person Name],
              ROUND(SUM(LineTotal),0) AS [Total Sales],
              SUM(LineCount)          AS [Total Line Items]
      FROM    BaseData
      GROUP BY [Sales Person Name]
  ),
  Pivoted AS (
      SELECT * FROM (
          SELECT  [Sales Person Name], MonthYear, LineTotal
          FROM    BaseData
      ) src
      PIVOT (
          SUM(LineTotal) FOR MonthYear IN (' + @cols + ')
      ) pvt
  )
  SELECT  p.[Sales Person Name],
          a.[Total Sales],
          a.[Total Line Items],' + @cols + '
  FROM    Pivoted  p
  JOIN    Aggregated a
        ON a.[Sales Person Name] = p.[Sales Person Name]
  ORDER BY a.[Total Sales] DESC';
  `;

    return categoryFilter
      ? `${baseQuery}\nEXEC sp_executesql @sql, N'@category NVARCHAR(100)', @category;`
      : `${baseQuery}\nEXEC sp_executesql @sql;`;
  },

  state: (categoryFilter) => {
    const baseQuery = `
    DECLARE @cols NVARCHAR(MAX);
    SELECT @cols = STRING_AGG(QUOTENAME(MonthYear), ',') WITHIN GROUP (ORDER BY MonthDate DESC)
    FROM (
        SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear, MAX(OINV.DocDate) AS MonthDate
        FROM OINV
        WHERE OINV.CANCELED = 'N'
        GROUP BY FORMAT(OINV.DocDate, 'MMM yyyy')
    ) AS MonthList;

    DECLARE @sql NVARCHAR(MAX) = '
    WITH BaseData AS (
        SELECT COALESCE(CRD1.State, ''Unknown'') AS [State], FORMAT(OINV.DocDate, ''MMM yyyy'') AS MonthYear,
        INV1.LineTotal, 1 AS LineCount
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
        SELECT [State], ROUND(SUM(LineTotal), 0) AS [Total Sales], SUM(LineCount) AS [Total Line Items]
        FROM BaseData
        GROUP BY [State]
    ),
    Pivoted AS (
        SELECT * FROM (
            SELECT [State], MonthYear, ROUND(LineTotal, 0) AS LineTotal FROM BaseData
        ) AS src
        PIVOT (
            SUM(LineTotal) FOR MonthYear IN (' + @cols + ')
        ) AS pvt
    )
    SELECT p.[State], a.[Total Sales], a.[Total Line Items],' + @cols + '
    FROM Pivoted p
    JOIN Aggregated a ON p.[State] = a.[State]
    ORDER BY a.[Total Sales] DESC';
    `;

    const execQuery = categoryFilter
      ? `${baseQuery}\nEXEC sp_executesql @sql, N'@category NVARCHAR(100)', @category;`
      : `${baseQuery}\nEXEC sp_executesql @sql;`;

    return execQuery;
  },

  category: () => `
    DECLARE @cols NVARCHAR(MAX);
    SELECT @cols = STRING_AGG(QUOTENAME(MonthYear), ',') WITHIN GROUP (ORDER BY MonthDate DESC)
    FROM (
        SELECT DISTINCT FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthYear, MAX(OINV.DocDate) AS MonthDate
        FROM OINV
        WHERE OINV.CANCELED = 'N'
        GROUP BY FORMAT(OINV.DocDate, 'MMM yyyy')
    ) AS MonthList;

    DECLARE @sql NVARCHAR(MAX) = '
    WITH BaseData AS (
        SELECT 
            T4.ItmsGrpNam AS [Category], 
            FORMAT(OINV.DocDate, ''MMM yyyy'') AS MonthYear,
            INV1.LineTotal, 
            1 AS LineCount
        FROM OINV
        INNER JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
        INNER JOIN OITM T3 ON INV1.ItemCode = T3.ItemCode
        INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
        WHERE OINV.CANCELED = ''N''
    ),
    Aggregated AS (
        SELECT 
            [Category], 
            ROUND(SUM(LineTotal), 0) AS [Total Sales],
            SUM(LineCount) AS [Total Line Items]
        FROM BaseData
        GROUP BY [Category]
    ),
    Pivoted AS (
        SELECT * FROM (
            SELECT [Category], MonthYear, ROUND(LineTotal, 0) AS LineTotal FROM BaseData
        ) AS src
        PIVOT (
            SUM(LineTotal) FOR MonthYear IN (' + @cols + ')
        ) AS pvt
    )
    SELECT 
        p.[Category], 
        a.[Total Sales], 
        a.[Total Line Items],' + @cols + '
    FROM Pivoted p
    JOIN Aggregated a ON p.[Category] = a.[Category]
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