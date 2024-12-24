
// // lib/models/products.js
// import { queryDatabase } from "../db"; // Import the query function from db.js
// import sql from "mssql";


// export async function getProductsFromDatabase({
//   search,
//   sortField,
//   sortDir,
//   offset,
//   ITEMS_PER_PAGE,
// }) {
//   let whereClause = "1=1";

//   if (search) {
//     whereClause += ` AND (
//       T0.ItemCode LIKE '%${search}%' OR 
//       T0.ItemName LIKE '%${search}%'
//     )`;
//   }

//   // Total count query (no pagination)
//   const countQuery = `
//     SELECT COUNT(*) as total
//     FROM [dbo].[OITM] T0
//     INNER JOIN [dbo].[OITB] T1 ON T0.[ItmsGrpCod] = T1.[ItmsGrpCod]
//     INNER JOIN [dbo].[OITW] T2 ON T0.[ItemCode] = T2.[ItemCode]
//     LEFT JOIN [dbo].[OBTN] T5 ON T0.[ItemCode] = T5.[ItemCode]
//     WHERE ${whereClause};
//   `;

//   // Paginated data query
//   const dataQuery = `
//     SELECT
//       T0.ItemCode,
//       T0.ItemName,
//       T0.ItemType,
//       T0.validFor,
//       T0.validFrom,
//       T0.validTo,
//       T0.CreateDate,
//       T0.UpdateDate,
//       T0.U_CasNo,
//       T0.U_IUPACName,
//       T0.U_Synonyms,
//       T0.U_MolucularFormula,
//       T0.U_MolucularWeight,
//       T0.U_Applications,
//       T0.U_Structure
//     FROM [dbo].[OITM] T0
//     INNER JOIN [dbo].[OITB] T1 ON T0.[ItmsGrpCod] = T1.[ItmsGrpCod]
//     INNER JOIN [dbo].[OITW] T2 ON T0.[ItemCode] = T2.[ItemCode]
//     LEFT JOIN [dbo].[OBTN] T5 ON T0.[ItemCode] = T5.[ItemCode]
//     WHERE ${whereClause}
//     ORDER BY ${sortField} ${sortDir}
//     OFFSET @offset ROWS
//     FETCH NEXT @ITEMS_PER_PAGE ROWS ONLY;
//   `;

//   try {
//     const [totalResult, rawProducts] = await Promise.all([
//       queryDatabase(countQuery),
//       queryDatabase(dataQuery, [
//         { name: "offset", type: sql.Int, value: offset },
//         { name: "ITEMS_PER_PAGE", type: sql.Int, value: ITEMS_PER_PAGE },
//       ]),
//     ]);

//     const totalItems = totalResult[0]?.total || 0;
//     const products = rawProducts.map((product) => ({
//       ...product,
//       CreateDate: product.CreateDate ? product.CreateDate.toISOString() : null,
//       UpdateDate: product.UpdateDate ? product.UpdateDate.toISOString() : null,
//     }));

//     return { products, totalItems: totalResult[0].total };
//   } catch (error) {
//     console.error("SQL Query Error:", error.message);
//     throw new Error("Error executing SQL queries");
//   }
// }



// export async function getProductDetail(id) {
//   const query = `
//     SELECT
//       ItemCode,
//       ItemName,
//       ItemType,
//       validFor,
//       validFrom,
//       validTo,
//       CreateDate,
//       UpdateDate,
//       U_CasNo,
//       U_IUPACName,
//       U_Synonyms,
//       U_MolucularFormula,
//       U_MolucularWeight,
//       U_Applications,
//       U_Structure
//     FROM OITM
//     WHERE ItemCode = @itemCode;
//   `;

//   const params = [
//     {
//       name: "itemCode",
//       type: sql.NVarChar,
//       value: id, // Use exact match since ItemCode is unique
//     },
//   ];

//   const data = await queryDatabase(query, params);
//   return data[0];
// }

// // Updated function to fetch KPI data for the product, including inventory and pricing history
// export async function getProductKPIs(id) {
//   const kpiQuery = `
//     SELECT
//       SUM(Invoice.Total) AS TotalRevenue,
//       SUM(Invoice.Quantity) AS UnitsSold,
//       COUNT(DISTINCT Invoice.CustomerCode) AS NumberOfCustomers
//     FROM
//       (
//         SELECT
//           INV1.ItemCode,
//           INV1.Quantity,
//           CASE 
//             WHEN OINV.DocCur = 'USD' THEN INV1.LineTotal * OINV.DocRate 
//             ELSE INV1.LineTotal 
//           END AS Total,
//           OINV.CardCode AS CustomerCode,
//           OINV.DocDate
//         FROM INV1
//         INNER JOIN OINV ON INV1.DocEntry = OINV.DocEntry
//         WHERE INV1.ItemCode = @itemCode
//       ) AS Invoice
//   `;

//   const salesTrendQuery = `
//     SELECT
//       FORMAT(OINV.DocDate, 'yyyy-MM') AS Month,
//       SUM(CASE 
//             WHEN OINV.DocCur = 'USD' THEN INV1.LineTotal * OINV.DocRate 
//             ELSE INV1.LineTotal 
//           END) AS MonthlyRevenue,
//       SUM(INV1.Quantity) AS MonthlyUnitsSold
//     FROM INV1
//     INNER JOIN OINV ON INV1.DocEntry = OINV.DocEntry
//     WHERE INV1.ItemCode = @itemCode
//     GROUP BY FORMAT(OINV.DocDate, 'yyyy-MM')
//     ORDER BY Month
//   `;

//   const topCustomersQuery = `
//     SELECT TOP 5
//       OINV.CardCode AS CustomerCode,
//       OCRD.CardName AS CustomerName,
//       SUM(
//         CASE 
//           WHEN OINV.DocCur = 'USD' THEN INV1.LineTotal * OINV.DocRate 
//           ELSE INV1.LineTotal 
//         END
//       ) AS TotalSpent
//     FROM INV1
//     INNER JOIN OINV ON INV1.DocEntry = OINV.DocEntry
//     INNER JOIN OCRD ON OINV.CardCode = OCRD.CardCode
//     WHERE INV1.ItemCode = @itemCode
//     GROUP BY OINV.CardCode, OCRD.CardName
//     ORDER BY TotalSpent DESC
//   `;

//   const inventoryQuery = `
//     SELECT
//       OITW.WhsCode AS Location,
//       OITW.OnHand AS Quantity
//     FROM OITW
//     WHERE OITW.ItemCode = @itemCode
//   `;

//   const params = [
//     {
//       name: "itemCode",
//       type: sql.NVarChar,
//       value: id,
//     },
//   ];

//   try {
//     const [kpiData, salesTrendData, topCustomersData, inventoryData] =
//       await Promise.all([
//         queryDatabase(kpiQuery, params),
//         queryDatabase(salesTrendQuery, params),
//         queryDatabase(topCustomersQuery, params),
//         queryDatabase(inventoryQuery, params),
//       ]);

//     return {
//       kpiData: kpiData[0], // TotalRevenue (INR), UnitsSold, NumberOfCustomers
//       salesTrendData, // Array of monthly sales data (Revenue in INR)
//       topCustomersData, // Array of top customers with TotalSpent in INR
//       inventoryData, // Array of inventory levels per location
//       // pricingHistoryData: [], // If you decide to include pricing history later
//     };
//   } catch (error) {
//     console.error("Error fetching KPI data:", error);
//     throw error;
//   }
// }



// lib/models/products.js
import { queryDatabase } from "../db"; // Import the query function from db.js
import sql from "mssql";


export async function getProductsFromDatabase({
  search,
  sortField,
  sortDir,
  offset,
  ITEMS_PER_PAGE,
  status
}) {
  let whereClause = "1=1";

  if (search) {
    whereClause += ` AND (
      T0.ItemCode LIKE '%${search}%' OR 
      T0.ItemName LIKE '%${search}%'
    )`;
  }

  // Stock status filter
  if (status === "inStock") {
    whereClause += " AND T2.OnHand > 0"; // In stock items
  } else if (status === "outOfStock") {
    whereClause += " AND T2.OnHand = 0"; // Out of stock items
  }

  // Total count query (no pagination)
  const countQuery = `
    SELECT COUNT(*) as total
    FROM [dbo].[OITM] T0
    INNER JOIN [dbo].[OITB] T1 ON T0.[ItmsGrpCod] = T1.[ItmsGrpCod]
    INNER JOIN [dbo].[OITW] T2 ON T0.[ItemCode] = T2.[ItemCode]
    LEFT JOIN [dbo].[OBTN] T5 ON T0.[ItemCode] = T5.[ItemCode]
    WHERE ${whereClause};
  `;

  // Paginated data query
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
      T0.U_MolucularFormula,
      T0.U_MolucularWeight,
      T0.U_Applications,
      T0.U_Structure,
      T0.OnHand
    FROM [dbo].[OITM] T0
    INNER JOIN [dbo].[OITB] T1 ON T0.[ItmsGrpCod] = T1.[ItmsGrpCod]
    INNER JOIN [dbo].[OITW] T2 ON T0.[ItemCode] = T2.[ItemCode]
    LEFT JOIN [dbo].[OBTN] T5 ON T0.[ItemCode] = T5.[ItemCode]
    WHERE ${whereClause}
    ORDER BY ${sortField} ${sortDir}
    OFFSET @offset ROWS
    FETCH NEXT @ITEMS_PER_PAGE ROWS ONLY;
  `;

  try {
    const [totalResult, rawProducts] = await Promise.all([
      queryDatabase(countQuery),
      queryDatabase(dataQuery, [
        { name: "offset", type: sql.Int, value: offset },
        { name: "ITEMS_PER_PAGE", type: sql.Int, value: ITEMS_PER_PAGE },
      ]),
    ]);

    const totalItems = totalResult[0]?.total || 0;
    const products = rawProducts.map((product) => ({
      ...product,
      CreateDate: product.CreateDate ? product.CreateDate.toISOString() : null,
      UpdateDate: product.UpdateDate ? product.UpdateDate.toISOString() : null,
    }));

    // return { products, totalItems: totalResult[0].total };
    return {
      products: rawProducts.map((product) => ({
        ...product,
        stockStatus: product.OnHand > 0 ? "In Stock" : "Out of Stock", // Add stockStatus
      })),
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
