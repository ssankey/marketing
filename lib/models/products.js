// lib/models/products.js
import { queryDatabase } from "../db"; // Import the query function from db.js
import sql from "mssql";


export async function getProductsFromDatabase({
  search,
  category,
  sortField,
  sortDir,
  offset,
  ITEMS_PER_PAGE,
  status,
  getAll = false
}) {
  let whereClause = "1=1";
  const params = [];

  // Parameterize search to prevent SQL injection
  if (search) {
    whereClause += ` AND (T0.ItemCode LIKE @search OR T0.ItemName LIKE @search)`;
    params.push({ name: "search", type: sql.NVarChar, value: `%${search}%` });
  }

  // Parameterize category
  if (category) {
    whereClause += ` AND T1.ItmsGrpNam = @category`;
    params.push({ name: "category", type: sql.NVarChar, value: category });
  }

  console.log('status', status);
  
  // Stock status filter - now applied consistently in both queries
  let stockFilter = "";
  if (status === "inStock") {
    stockFilter = "HAVING SUM(COALESCE(T2.OnHand, 0)) > 0";
  } else if (status === "outOfStock") {
    stockFilter = "HAVING SUM(COALESCE(T2.OnHand, 0)) = 0"; 
  }

  // Determine the sort column
  let sortColumn = "T0.ItemCode";
  if (sortField === "ItemName") sortColumn = "T0.ItemName";
  else if (sortField === "Category") sortColumn = "T1.ItmsGrpNam";
  else if (sortField === "CreateDate") sortColumn = "T0.CreateDate";
  else if (sortField === "UpdateDate") sortColumn = "T0.UpdateDate";
  else if (sortField === "OnHand" || sortField === "stockStatus") sortColumn = "SUM_OnHand";

  // Updated count query with proper grouping and filtering
  const countQuery = `
    SELECT COUNT(*) as total FROM (
      SELECT 
        T0.ItemCode,
        SUM(COALESCE(T2.OnHand, 0)) AS TotalOnHand
      FROM [dbo].[OITM] T0
      INNER JOIN [dbo].[OITB] T1 ON T0.[ItmsGrpCod] = T1.[ItmsGrpCod]
      LEFT JOIN [dbo].[OITW] T2 ON T0.[ItemCode] = T2.[ItemCode]
      LEFT JOIN [dbo].[OBTN] T5 ON T0.[ItemCode] = T5.[ItemCode]
      WHERE ${whereClause}
      GROUP BY T0.ItemCode
      ${stockFilter}
    ) AS FilteredProducts;
  `;

  // Main data query using a derived table with consistent filtering
  const dataQuery = `
    SELECT 
        T0.ItemCode,
        T0.ItemName,
        T0.ItemType,
        T0.validFor,
        T0.validFrom,
        T0.validTo,
        T0.CreateDate,
        T0.UpdateDate,
        T0.U_CasNo,
        T0.U_IUPACName,
        T0.U_Synonyms,
        T0.U_Applications,
        T0.U_MolucularFormula,
        T0.U_MolucularWeight,
        T0.U_Structure,
        DerivedTable.SUM_OnHand AS OnHand,
        DerivedTable.Category
    FROM (
        SELECT 
            T0.ItemCode,
            T1.ItmsGrpNam AS Category,
            SUM(COALESCE(T2.OnHand, 0)) AS SUM_OnHand
        FROM [dbo].[OITM] T0
        INNER JOIN [dbo].[OITB] T1 ON T0.[ItmsGrpCod] = T1.[ItmsGrpCod]
        LEFT JOIN [dbo].[OITW] T2 ON T0.[ItemCode] = T2.[ItemCode]
        LEFT JOIN [dbo].[OBTN] T5 ON T0.[ItemCode] = T5.[ItemCode]
        WHERE ${whereClause}
        GROUP BY T0.ItemCode, T1.ItmsGrpNam
        ${stockFilter}
    ) AS DerivedTable
    INNER JOIN [dbo].[OITM] T0 ON DerivedTable.ItemCode = T0.ItemCode
    ORDER BY 
        ${sortColumn === "SUM_OnHand" ? "DerivedTable.SUM_OnHand" : 
          sortColumn === "Category" ? "DerivedTable.Category" : sortColumn} ${sortDir}
    ${getAll ? '' : `OFFSET @offset ROWS FETCH NEXT @ITEMS_PER_PAGE ROWS ONLY`};
  `;

  try {
    // Add pagination parameters if not getting all records
    if (!getAll) {
      params.push(
        { name: "offset", type: sql.Int, value: offset },
        { name: "ITEMS_PER_PAGE", type: sql.Int, value: ITEMS_PER_PAGE }
      );
    }

    console.log('Count Query:', countQuery);
    console.log('Data Query:', dataQuery);

    const [totalResult, rawProducts] = await Promise.all([
      queryDatabase(countQuery, params),
      queryDatabase(dataQuery, params),
    ]);

    const totalItems = totalResult[0]?.total || 0;
    const products = rawProducts.map((product) => ({
      ...product,
      CreateDate: product.CreateDate ? product.CreateDate.toISOString() : null,
      UpdateDate: product.UpdateDate ? product.UpdateDate.toISOString() : null,
      stockStatus: product.OnHand > 0 ? "In Stock" : "Out of Stock",
    }));

    return {
      products,
      totalItems,
    };
  } catch (error) {
    console.error("SQL Query Error:", error.message);
    throw new Error("Error executing SQL queries");
  }
}

export async function getProductDetail(id) {
  const query = `
    SELECT
      ItemCode,
      ItemName,
      ItemType,
      validFor,
      validFrom,
      validTo,
      CreateDate,
      UpdateDate,
      U_CasNo,
      U_IUPACName,
      U_Synonyms,
      U_MolucularFormula,
      U_MolucularWeight,
      U_Applications,
      U_Structure
    FROM OITM
    WHERE ItemCode = @itemCode;
  `;

  const params = [
    {
      name: "itemCode",
      type: sql.NVarChar,
      value: id, // Use exact match since ItemCode is unique
    },
  ];

  const data = await queryDatabase(query, params);
  return data[0];
}

// Updated function to fetch KPI data for the product, including inventory and pricing history
export async function getProductKPIs(id) {
  const kpiQuery = `
    SELECT
      SUM(Invoice.Total) AS TotalRevenue,
      SUM(Invoice.Quantity) AS UnitsSold,
      COUNT(DISTINCT Invoice.CustomerCode) AS NumberOfCustomers
    FROM
      (
        SELECT
          INV1.ItemCode,
          INV1.Quantity,
          CASE 
            WHEN OINV.DocCur = 'USD' THEN INV1.LineTotal * OINV.DocRate 
            ELSE INV1.LineTotal 
          END AS Total,
          OINV.CardCode AS CustomerCode,
          OINV.DocDate
        FROM INV1
        INNER JOIN OINV ON INV1.DocEntry = OINV.DocEntry
        WHERE INV1.ItemCode = @itemCode
      ) AS Invoice
  `;

  const salesTrendQuery = `
    SELECT
      FORMAT(OINV.DocDate, 'yyyy-MM') AS Month,
      SUM(CASE 
            WHEN OINV.DocCur = 'USD' THEN INV1.LineTotal * OINV.DocRate 
            ELSE INV1.LineTotal 
          END) AS MonthlyRevenue,
      SUM(INV1.Quantity) AS MonthlyUnitsSold
    FROM INV1
    INNER JOIN OINV ON INV1.DocEntry = OINV.DocEntry
    WHERE INV1.ItemCode = @itemCode
    GROUP BY FORMAT(OINV.DocDate, 'yyyy-MM')
    ORDER BY Month
  `;

  const topCustomersQuery = `
    SELECT TOP 5
      OINV.CardCode AS CustomerCode,
      OCRD.CardName AS CustomerName,
      SUM(
        CASE 
          WHEN OINV.DocCur = 'USD' THEN INV1.LineTotal * OINV.DocRate 
          ELSE INV1.LineTotal 
        END
      ) AS TotalSpent
    FROM INV1
    INNER JOIN OINV ON INV1.DocEntry = OINV.DocEntry
    INNER JOIN OCRD ON OINV.CardCode = OCRD.CardCode
    WHERE INV1.ItemCode = @itemCode
    GROUP BY OINV.CardCode, OCRD.CardName
    ORDER BY TotalSpent DESC
  `;

  const inventoryQuery = `
    SELECT
      OITW.WhsCode AS Location,
      OITW.OnHand AS Quantity
    FROM OITW
    WHERE OITW.ItemCode = @itemCode
  `;

  const params = [
    {
      name: "itemCode",
      type: sql.NVarChar,
      value: id,
    },
  ];

  try {
    const [kpiData, salesTrendData, topCustomersData, inventoryData] =
      await Promise.all([
        queryDatabase(kpiQuery, params),
        queryDatabase(salesTrendQuery, params),
        queryDatabase(topCustomersQuery, params),
        queryDatabase(inventoryQuery, params),
      ]);

    return {
      kpiData: kpiData[0], // TotalRevenue (INR), UnitsSold, NumberOfCustomers
      salesTrendData, // Array of monthly sales data (Revenue in INR)
      topCustomersData, // Array of top customers with TotalSpent in INR
      inventoryData, // Array of inventory levels per location
      // pricingHistoryData: [], // If you decide to include pricing history later
    };
  } catch (error) {
    console.error("Error fetching KPI data:", error);
    throw error;
  }
}