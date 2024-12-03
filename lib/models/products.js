// lib/models/products.js

import { queryDatabase } from "../db";
import sql from 'mssql';

export async function getProducts(customQuery, params = []) { // Accept params
  try {
    const data = await queryDatabase(customQuery, params); // Pass params
    return data;
  } catch (error) {
    console.error("Database query error:", error);
    throw new Error("Failed to fetch products");
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
      name: 'itemCode',
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
      name: 'itemCode',
      type: sql.NVarChar,
      value: id,
    },
  ];

  try {
    const [kpiData, salesTrendData, topCustomersData, inventoryData] = await Promise.all([
      queryDatabase(kpiQuery, params),
      queryDatabase(salesTrendQuery, params),
      queryDatabase(topCustomersQuery, params),
      queryDatabase(inventoryQuery, params),
    ]);

    return {
      kpiData: kpiData[0], // TotalRevenue (INR), UnitsSold, NumberOfCustomers
      salesTrendData,      // Array of monthly sales data (Revenue in INR)
      topCustomersData,    // Array of top customers with TotalSpent in INR
      inventoryData,       // Array of inventory levels per location
      // pricingHistoryData: [], // If you decide to include pricing history later
    };
  } catch (error) {
    console.error("Error fetching KPI data:", error);
    throw error;
  }
}