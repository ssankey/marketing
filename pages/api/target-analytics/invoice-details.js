
// pages/api/target-analytics/invoice-details.js
import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { year, filterType, filterValue } = req.query;

  if (!year || !filterType || !filterValue) {
    return res.status(400).json({
      message: "Missing required parameters: year, filterType, and filterValue are required",
    });
  }

  try {
    // Determine date range based on financial year
    let startDate, endDate;

    if (year === "Complete") {
      // No date filter for complete data
      startDate = "1900-01-01";
      endDate = "2099-12-31";
    } else {
      // Parse FY format (e.g., "FY 2025-26")
      const fyMatch = year.match(/FY (\d{4})-(\d{2})/);
      if (fyMatch) {
        const startYear = parseInt(fyMatch[1]);
        const endYearShort = parseInt(fyMatch[2]);
        const endYear = 2000 + endYearShort;

        // Financial year in India: April 1 to March 31
        startDate = `${startYear}-04-01`;
        endDate = `${endYear}-03-31`;
      } else {
        return res.status(400).json({ message: "Invalid year format" });
      }
    }

    // Base query - WITHOUT BATCH FIELDS to prevent duplicates
    let query = `
      SELECT 
        -- Invoice Info
        T0.DocNum AS [Invoice No],
        T0.DocDate AS [Invoice Posting Date],
        YEAR(T0.DocDate) AS [Year],
        DATENAME(MONTH, T0.DocDate) AS [Month],

        -- Customer & Sales Info
        T0.CardCode AS [Customer Code],
        T0.CardName AS [Customer Name],
        T0.SlpCode AS [Sales Employee Code],
        T5.SlpName AS [Sales Employee],

        -- Region Logic with Full State Names
        C1.State AS [State Code],
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
        END AS [State],
        C1.Country AS [Country],
        CASE 
          WHEN ISNULL(C1.Country, '') <> 'IN' THEN 'Overseas'
          WHEN C1.State IN ('AP', 'TE') THEN 'Central'
          WHEN C1.State IN ('KL', 'KT', 'TN', 'PC') THEN 'South'
          WHEN C1.State IN ('MH', 'GO', 'DN') THEN 'West 1'
          WHEN C1.State = 'GJ' THEN 'West 2'
          WHEN C1.State IN ('DL','HR','HP','PU','RJ','UP','UT','MP','CH') THEN 'North'
          WHEN C1.State IN ('WB','JH','AS','ME') THEN 'East'
          ELSE 'Unknown'
        END AS [Region],

        -- Status
        CASE 
          WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
          WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
          WHEN (T0.DocStatus='O' AND T0.PaidToDate > 0 AND T0.DocTotal > T0.PaidToDate) THEN 'Partially Open'
          WHEN (T0.DocStatus='O') THEN 'Open'
          ELSE 'N/A'
        END AS [Status],

        -- Line Item Info
        T1.ItemCode AS [Item Code],
        T1.Dscription AS [Description],
        ITM.U_CasNo AS [CAS No],
        ITM.SuppCatNum AS [Vendor Catalog No.],
        ISNULL(T4.U_Quantity, 0) AS [Pack Size],

        -- Stock status
        CASE 
          WHEN ITM.OnHand >= T1.OpenQty THEN 'In Stock'
          ELSE 'Out of Stock'
        END AS [Stock Status (Hyd)],

        -- Feedback
        ISNULL(T1.U_Mkt_feedback,'N/A') AS [Mkt Feedback],

        -- Pricing
        T1.PriceBefDi AS [Unit Price],
        ROUND(T1.LineTotal,2) AS [Line Total],
        T1.DiscPrcnt AS [Discount %],
        T1.VatPrcnt AS [Tax %],
        T1.Currency AS [Currency],

        -- Category - Using U_SubGroup1 instead of ItmsGrpNam
        ITMGRP.U_SubGroup1 AS [Category Name],
        ITMGRP.U_SubGroup1 AS [Sub Group 1],

        -- Summary
        (T0.DocTotal - T0.VatSum - T0.TotalExpns + T0.DiscSum) AS [Subtotal]

      FROM OINV T0
      INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      LEFT JOIN OCTG T10 ON T0.GroupNum = T10.GroupNum

      -- Customer region info
      LEFT JOIN OCRD C ON T0.CardCode = C.CardCode
      OUTER APPLY (
        SELECT TOP 1 State, Country 
        FROM CRD1 
        WHERE CardCode = C.CardCode AND AdresType = 'B'
        ORDER BY Address
      ) AS C1

      -- Item + Category
      LEFT JOIN OITM ITM ON T1.ItemCode = ITM.ItemCode
      LEFT JOIN OITB ITMGRP ON ITM.ItmsGrpCod = ITMGRP.ItmsGrpCod

      -- Pricing (pick only ONE row to avoid duplicates)
      OUTER APPLY (
        SELECT TOP 1 R.U_Quantity
        FROM [@PRICING_H] H
        JOIN [@PRICING_R] R ON H.DocEntry = R.DocEntry
        WHERE H.U_Code = ITM.ItemCode
        ORDER BY H.DocEntry DESC, R.U_Quantity
      ) AS T4

      WHERE T0.DocDate BETWEEN '${startDate}' AND '${endDate}'
    `;

    // Add filter condition based on filterType
    const escapedValue = filterValue.replace(/'/g, "''");

    switch (filterType) {
      case "region":
        query += ` 
          AND (
            CASE 
              WHEN ISNULL(C1.Country, '') <> 'IN' THEN 'Overseas'
              WHEN C1.State IN ('AP', 'TE') THEN 'Central'
              WHEN C1.State IN ('KL', 'KT', 'TN', 'PC') THEN 'South'
              WHEN C1.State IN ('MH', 'GO', 'DN') THEN 'West 1'
              WHEN C1.State = 'GJ' THEN 'West 2'
              WHEN C1.State IN ('DL','HR','HP','PU','RJ','UP','UT','MP','CH') THEN 'North'
              WHEN C1.State IN ('WB','JH','AS','ME') THEN 'East'
              ELSE 'Unknown'
            END = '${escapedValue}'
          )
        `;
        break;

      case "state":
        // Match against full state name
        query += ` 
          AND (
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
            END = '${escapedValue}'
          )
        `;
        break;

      case "salesperson":
        query += ` AND T5.SlpName = '${escapedValue}'`;
        break;

      case "category":
        // Filter by U_SubGroup1 instead of ItmsGrpNam
        query += ` AND ITMGRP.U_SubGroup1 = '${escapedValue}'`;
        break;

      default:
        return res.status(400).json({ message: "Invalid filterType" });
    }

    query += ` ORDER BY T0.DocDate DESC, T1.LineNum ASC`;

    const results = await queryDatabase(query);

    if (results.length === 0) {
      return res.status(404).json({
        message: "No invoices found for the selected filters",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });

  } catch (error) {
    console.error("Error fetching invoice details:", error);
    res.status(500).json({
      message: "Error fetching invoice details",
      error: error.message,
    });
  }
}