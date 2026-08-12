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
  webDisplay,
  priceSet,
  getAll = false,
  userRole
}) {
  let whereClause = "1=1";
  const params = [];

  // Force category for 3ASenrise
  if (userRole === "3ASenrise") {
    category = "3A Chemicals";
  }

  // Search (item-level)
  // if (search) {
  //   whereClause += ` AND (T0.ItemCode LIKE @search OR T0.ItemName LIKE @search)`;
  //   params.push({ name: "search", type: sql.NVarChar, value: `%${search}%` });
  // }

  if (search) {
    whereClause += ` AND (T0.ItemCode LIKE @search OR T0.ItemName LIKE @search OR T0.U_CasNo LIKE @search)`;
    params.push({ name: "search", type: sql.NVarChar, value: `%${search}%` });
  }

  // Category (item-level)
  if (category && category !== "all") {
    whereClause += ` AND T1.ItmsGrpNam = @category`;
    params.push({ name: "category", type: sql.NVarChar, value: category });
  }

  // Web Display filter — anything not explicitly Y/YES counts as "No" (blank/NULL included),
  // matching how the Web Display column itself is rendered.
  if (webDisplay === "yes") {
    whereClause += ` AND UPPER(LTRIM(RTRIM(ISNULL(T0.U_WebsiteDisplay, '')))) IN ('YES', 'Y')`;
  } else if (webDisplay === "no") {
    whereClause += ` AND UPPER(LTRIM(RTRIM(ISNULL(T0.U_WebsiteDisplay, '')))) NOT IN ('YES', 'Y')`;
  }

  // Stock status filter will be applied on aggregated stock
  let whereStockFilter = "";
  if (status === "inStock") {
    whereStockFilter = " AND COALESCE(W.TotalOnHand, 0) > 0";
  } else if (status === "outOfStock") {
    whereStockFilter = " AND COALESCE(W.TotalOnHand, 0) = 0";
  }

  // Price Set filter — applied on the resolved web price (see PR join below).
  let wherePriceFilter = "";
  if (priceSet === "yes") {
    wherePriceFilter = " AND ISNULL(PR.U_Price, 0) <> 0";
  } else if (priceSet === "no") {
    wherePriceFilter = " AND ISNULL(PR.U_Price, 0) = 0";
  }

  // Determine sort column (use aggregated alias)
  let sortColumn = "T0.ItemCode";
  if (sortField === "ItemName") sortColumn = "T0.ItemName";
  else if (sortField === "U_CasNo") sortColumn = "T0.U_CasNo";
  else if (sortField === "Category") sortColumn = "T1.ItmsGrpNam";
  else if (sortField === "CreateDate") sortColumn = "T0.CreateDate";
  else if (sortField === "UpdateDate") sortColumn = "T0.UpdateDate";
  else if (sortField === "OnHand" || sortField === "stockStatus") sortColumn = "W.TotalOnHand";

  // Resolves the current web price per item — an item can have more than one
  // [@PRICING_H] document (e.g. an old one with a real price plus a newer one where
  // the price was reset to 0). Take the most recent document (highest DocEntry) as
  // authoritative, and within it prefer a fully-filled-in row (non-null U_UOM) over
  // a blank placeholder line.
  const pricingJoin = `
    LEFT JOIN (
      SELECT U_Code AS ItemCode, U_Price
      FROM (
        SELECT
          H.U_Code,
          R.U_Price,
          ROW_NUMBER() OVER (
            PARTITION BY H.U_Code
            ORDER BY H.DocEntry DESC, CASE WHEN R.U_UOM IS NOT NULL THEN 0 ELSE 1 END ASC, R.LineId ASC
          ) AS rn
        FROM [@PRICING_H] H
        INNER JOIN [@PRICING_R] R ON H.DocEntry = R.DocEntry
      ) ranked
      WHERE rn = 1
    ) PR ON PR.ItemCode = T0.ItemCode
  `;

  // COUNT distinct products (one per ItemCode)
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM [dbo].[OITM] T0
    INNER JOIN [dbo].[OITB] T1 ON T0.[ItmsGrpCod] = T1.[ItmsGrpCod]
    LEFT JOIN (
      SELECT ItemCode, SUM(COALESCE(OnHand, 0)) AS TotalOnHand
      FROM [dbo].[OITW]
      GROUP BY ItemCode
    ) W ON W.ItemCode = T0.ItemCode
    ${pricingJoin}
    WHERE ${whereClause}
      ${whereStockFilter}
      ${wherePriceFilter};
  `;

  // DATA: one row per ItemCode with aggregated stock
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
      T0.U_WebsiteDisplay,
      COALESCE(W.TotalOnHand, 0) AS OnHand,
      T1.ItmsGrpNam AS Category,
      ISNULL(PR.U_Price, 0) AS WebPrice
    FROM [dbo].[OITM] T0
    INNER JOIN [dbo].[OITB] T1 ON T0.[ItmsGrpCod] = T1.[ItmsGrpCod]
    LEFT JOIN (
      SELECT ItemCode, SUM(COALESCE(OnHand, 0)) AS TotalOnHand
      FROM [dbo].[OITW]
      GROUP BY ItemCode
    ) W ON W.ItemCode = T0.ItemCode
    ${pricingJoin}
    WHERE ${whereClause}
      ${whereStockFilter}
      ${wherePriceFilter}
    ORDER BY ${sortColumn} ${sortDir}
    ${getAll ? "" : `OFFSET @offset ROWS FETCH NEXT @ITEMS_PER_PAGE ROWS ONLY`};
  `;

  try {
    if (!getAll) {
      params.push(
        { name: "offset", type: sql.Int, value: offset },
        { name: "ITEMS_PER_PAGE", type: sql.Int, value: ITEMS_PER_PAGE }
      );
    }

    const [totalResult, rawProducts] = await Promise.all([
      queryDatabase(countQuery, params),
      queryDatabase(dataQuery, params),
    ]);

    const totalItems = totalResult[0]?.total || 0;

    // Batched Units Sold / No. of Customers for just this page's items — same
    // unfiltered INV1/OINV aggregation as getProductKPIs (the product detail page),
    // just grouped across the current page's ItemCodes in one query instead of one
    // per row. Skipped for getAll (Excel export) to avoid a huge IN-clause.
    let salesStatsByItemCode = {};
    if (!getAll && rawProducts.length > 0) {
      const itemCodeParams = rawProducts.map((p, i) => ({
        name: `itemCode${i}`,
        type: sql.NVarChar,
        value: p.ItemCode,
      }));
      const inClause = itemCodeParams.map((p) => `@${p.name}`).join(", ");

      const salesStatsQuery = `
        SELECT
          INV1.ItemCode,
          SUM(INV1.Quantity) AS UnitsSold,
          COUNT(DISTINCT OINV.CardCode) AS NumberOfCustomers
        FROM INV1
        INNER JOIN OINV ON INV1.DocEntry = OINV.DocEntry
        WHERE INV1.ItemCode IN (${inClause})
        GROUP BY INV1.ItemCode;
      `;

      const salesStatsRows = await queryDatabase(salesStatsQuery, itemCodeParams);
      salesStatsByItemCode = salesStatsRows.reduce((acc, row) => {
        acc[row.ItemCode] = {
          UnitsSold: row.UnitsSold || 0,
          NumberOfCustomers: row.NumberOfCustomers || 0,
        };
        return acc;
      }, {});
    }

    const products = rawProducts.map((product) => {
      const webDisplayValue = String(product.U_WebsiteDisplay || "").trim().toUpperCase();
      return {
        ...product,
        CreateDate: product.CreateDate ? product.CreateDate.toISOString() : null,
        UpdateDate: product.UpdateDate ? product.UpdateDate.toISOString() : null,
        stockStatus: (product.OnHand ?? 0) > 0 ? "In Stock" : "Out of Stock",
        vendorbatchnum: null, // not selected here
        UnitsSold: salesStatsByItemCode[product.ItemCode]?.UnitsSold ?? 0,
        NumberOfCustomers: salesStatsByItemCode[product.ItemCode]?.NumberOfCustomers ?? 0,
        WebsiteDisplay: webDisplayValue === "YES" || webDisplayValue === "Y" ? "YES" : "NO",
        PriceSet: (product.WebPrice ?? 0) > 0 ? "YES" : "NO",
      };
    });

    return { products, totalItems };
  } catch (error) {
    console.error("SQL Query Error:", error.message);
    console.error("Parameters that caused error:", params);
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

        UNION ALL

        -- Credit notes (ORIN/RIN1) net out returned revenue/quantity for the same item
        SELECT
          RIN1.ItemCode,
          -RIN1.Quantity AS Quantity,
          CASE
            WHEN ORIN.DocCur = 'USD' THEN -RIN1.LineTotal * ORIN.DocRate
            ELSE -RIN1.LineTotal
          END AS Total,
          ORIN.CardCode AS CustomerCode,
          ORIN.DocDate
        FROM RIN1
        INNER JOIN ORIN ON RIN1.DocEntry = ORIN.DocEntry
        WHERE RIN1.ItemCode = @itemCode
      ) AS Invoice
  `;


  const salesTrendQuery = `
  SELECT MonthName, Year, Month,
    SUM(Revenue) AS MonthlyRevenue,
    SUM(UnitsSold) AS MonthlyUnitsSold
  FROM (
    SELECT
      FORMAT(OINV.DocDate, 'MMM yyyy') AS MonthName,
      YEAR(OINV.DocDate) AS Year,
      MONTH(OINV.DocDate) AS Month,
      CASE
        WHEN OINV.DocCur = 'USD'
          THEN INV1.LineTotal * OINV.DocRate
        ELSE INV1.LineTotal
      END AS Revenue,
      INV1.Quantity AS UnitsSold
    FROM INV1
    INNER JOIN OINV
      ON INV1.DocEntry = OINV.DocEntry
    WHERE INV1.ItemCode = @itemCode

    UNION ALL

    SELECT
      FORMAT(ORIN.DocDate, 'MMM yyyy') AS MonthName,
      YEAR(ORIN.DocDate) AS Year,
      MONTH(ORIN.DocDate) AS Month,
      CASE
        WHEN ORIN.DocCur = 'USD'
          THEN -RIN1.LineTotal * ORIN.DocRate
        ELSE -RIN1.LineTotal
      END AS Revenue,
      -RIN1.Quantity AS UnitsSold
    FROM RIN1
    INNER JOIN ORIN
      ON RIN1.DocEntry = ORIN.DocEntry
    WHERE RIN1.ItemCode = @itemCode
  ) AS Combined
  GROUP BY MonthName, Year, Month
  ORDER BY Year, Month
`;
  // Widened from TOP 5 so the Top Customers table has enough rows to paginate
  // (20/page) instead of only ever showing 5.
  const topCustomersQuery = `
    SELECT TOP 500 CustomerCode, CustomerName, SUM(Spent) AS TotalSpent
    FROM (
      SELECT
        OINV.CardCode AS CustomerCode,
        OCRD.CardName AS CustomerName,
        CASE
          WHEN OINV.DocCur = 'USD' THEN INV1.LineTotal * OINV.DocRate
          ELSE INV1.LineTotal
        END AS Spent
      FROM INV1
      INNER JOIN OINV ON INV1.DocEntry = OINV.DocEntry
      INNER JOIN OCRD ON OINV.CardCode = OCRD.CardCode
      WHERE INV1.ItemCode = @itemCode

      UNION ALL

      SELECT
        ORIN.CardCode AS CustomerCode,
        OCRD.CardName AS CustomerName,
        CASE
          WHEN ORIN.DocCur = 'USD' THEN -RIN1.LineTotal * ORIN.DocRate
          ELSE -RIN1.LineTotal
        END AS Spent
      FROM RIN1
      INNER JOIN ORIN ON RIN1.DocEntry = ORIN.DocEntry
      INNER JOIN OCRD ON ORIN.CardCode = OCRD.CardCode
      WHERE RIN1.ItemCode = @itemCode
    ) AS Combined
    GROUP BY CustomerCode, CustomerName
    ORDER BY TotalSpent DESC
  `;

  // const inventoryQuery = `
  //   SELECT
  //     OITW.WhsCode AS Location,
  //     OITW.OnHand AS Quantity
  //   FROM OITW
  //   WHERE OITW.ItemCode = @itemCode
  // `;

  //  const inventoryQuery = `
  //   SELECT
  //     W.WhsCode AS Location,
  //     WH.WhsName,
  //     W.OnHand AS Quantity,
  //     B.BatchNum
  //   FROM OITW W
  //   LEFT JOIN OWHS WH 
  //     ON W.WhsCode = WH.WhsCode
  //   LEFT JOIN OIBT B
  //     ON W.ItemCode = B.ItemCode
  //     AND W.WhsCode = B.WhsCode
  //   WHERE W.ItemCode = @itemCode
  //   ORDER BY W.OnHand DESC, B.BatchNum;
  // `;

//    const inventoryQuery = `
//     SELECT
//     W.WhsCode AS Location,
//     WH.WhsName,
//     W.OnHand AS Quantity,
//     B.BatchNum,
//     CAST(B.U_COA AS NVARCHAR(MAX)) AS LocalCOAFilename,

//     -- Energy URL (fallback COA) - ONLY when no local COA exists
//     CASE 
//         WHEN B.U_COA IS NOT NULL AND LTRIM(RTRIM(CAST(B.U_COA AS NVARCHAR(MAX)))) <> '' 
//             THEN ''  -- No energy URL if local COA exists
//         WHEN ISNULL(B.U_vendorbatchno, '') <> '' AND W.ItemCode <> '' 
//             THEN 'https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/' + 
//                  LEFT(W.ItemCode, CHARINDEX('-', W.ItemCode + '-') - 1) + '_' + B.U_vendorbatchno + '.pdf'
//         ELSE ''
//     END AS EnergyCoaUrl,

//     -- COA Source determination
//     CASE 
//         WHEN B.U_COA IS NOT NULL AND LTRIM(RTRIM(CAST(B.U_COA AS NVARCHAR(MAX)))) <> '' 
//             THEN 'LOCAL'
//         WHEN ISNULL(B.U_vendorbatchno, '') <> '' AND W.ItemCode <> '' 
//             THEN 'ENERGY'
//         ELSE 'NONE'
//     END AS CoaSource

// FROM OITW W
// LEFT JOIN OWHS WH 
//     ON W.WhsCode = WH.WhsCode
// LEFT JOIN OIBT B
//     ON W.ItemCode = B.ItemCode
//     AND W.WhsCode = B.WhsCode
// WHERE W.ItemCode = @itemCode
// ORDER BY W.OnHand DESC, B.BatchNum;

//   `;

//   const inventoryQuery = `
//     SELECT
//         W.WhsCode AS Location,
//         WH.WhsName,
//         W.OnHand AS Quantity,
//         ISNULL(T15.U_vendorbatchno, '') AS VendorBatchNum,
//         CAST(T15.U_COA AS NVARCHAR(MAX)) AS LocalCOAFilename,

//         -- Energy URL (fallback COA) - ONLY when no local COA exists
//         CASE 
//             WHEN T15.U_COA IS NOT NULL AND LTRIM(RTRIM(CAST(T15.U_COA AS NVARCHAR(MAX)))) <> '' 
//                 THEN ''  -- No energy URL if local COA exists
//             WHEN ISNULL(T15.U_vendorbatchno, '') <> '' AND W.ItemCode <> '' 
//                 THEN 'https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/' + 
//                      LEFT(W.ItemCode, CHARINDEX('-', W.ItemCode + '-') - 1) + '_' + T15.U_vendorbatchno + '.pdf'
//             ELSE ''
//         END AS EnergyCoaUrl,

//         -- COA Source determination
//         CASE 
//             WHEN T15.U_COA IS NOT NULL AND LTRIM(RTRIM(CAST(T15.U_COA AS NVARCHAR(MAX)))) <> '' 
//                 THEN 'LOCAL'
//             WHEN ISNULL(T15.U_vendorbatchno, '') <> '' AND W.ItemCode <> '' 
//                 THEN 'ENERGY'
//             ELSE 'NONE'
//         END AS CoaSource

//     FROM OITW W
//     LEFT JOIN OWHS WH 
//         ON W.WhsCode = WH.WhsCode

//     -- Get batch details via IBT1 like in detailQuery
//     LEFT JOIN IBT1 T10 
//         ON T10.ItemCode = W.ItemCode
//         AND T10.WhsCode = W.WhsCode
//         AND T10.Direction = 1

//     LEFT JOIN OIBT T15 
//         ON T10.ItemCode = T15.ItemCode 
//         AND T10.BatchNum = T15.BatchNum

//     WHERE W.ItemCode = @itemCode
//     ORDER BY W.OnHand DESC, VendorBatchNum;
// `;
     const inventoryQuery = `
  SELECT DISTINCT
    B.BatchNum                                        AS BatchNum,
    ISNULL(B.U_vendorbatchno, '')                     AS VendorBatchNum,
    B.Quantity                                        AS Quantity,
    W.WhsCode                                         AS Location,
    WH.WhsName,
    EC.EffectiveCOA                                   AS LocalCOAFilename,
    CASE
        WHEN EC.EffectiveCOA IS NOT NULL
            THEN ''
        WHEN ISNULL(B.U_vendorbatchno, '') <> '' AND W.ItemCode <> ''
            THEN 'https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/' +
                 LEFT(W.ItemCode, CHARINDEX('-', W.ItemCode + '-') - 1) + '_' + B.U_vendorbatchno + '.pdf'
        ELSE ''
    END AS EnergyCoaUrl,
    CASE
        WHEN EC.EffectiveCOA IS NOT NULL
            THEN 'LOCAL'
        WHEN ISNULL(B.U_vendorbatchno, '') <> ''
            THEN 'ENERGY'
        ELSE 'NONE'
    END AS CoaSource
  FROM OIBT B
  LEFT JOIN OITW W  ON B.ItemCode = W.ItemCode
  LEFT JOIN OWHS WH ON W.WhsCode  = WH.WhsCode
  -- Same batch number is sometimes only attached to the "-SPEC" item code instead of
  -- the specific pack-size item code, so fall back to that variant's COA if this
  -- pack size's own U_COA is empty, before falling back further to the Energy URL.
  LEFT JOIN OIBT SPEC_B
    ON SPEC_B.ItemCode = LEFT(B.ItemCode, CHARINDEX('-', B.ItemCode + '-') - 1) + '-SPEC'
   AND SPEC_B.BatchNum = B.BatchNum
  CROSS APPLY (
    SELECT COALESCE(
      NULLIF(LTRIM(RTRIM(CAST(B.U_COA AS NVARCHAR(MAX)))), ''),
      NULLIF(LTRIM(RTRIM(CAST(SPEC_B.U_COA AS NVARCHAR(MAX)))), '')
    ) AS EffectiveCOA
  ) EC
  WHERE B.ItemCode = @itemCode
  ORDER BY B.Quantity DESC, VendorBatchNum;  -- ✅ VendorBatchNum is alias in SELECT
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

// Looks up a fixed, known list of Cat Nos (e.g. the FD Cell Catalogue) against SAP —
// unlike getProductsFromDatabase, this doesn't search/paginate; it drives from the
// literal list of requested item codes so items that don't exist in SAP still show up
// with a "Not Found" status instead of silently disappearing. Reuses the same
// OITM/OITB/OITW/[@PRICING_H]/[@PRICING_R] joins as getProductsFromDatabase, plus the
// same INV1/OINV sales aggregation used for Units Sold / No. of Customers.
export async function getFdCellCatalogueData(itemCodes) {
  const codes = [...new Set((itemCodes || []).map((c) => c.trim()).filter(Boolean))];
  if (codes.length === 0) return [];

  const valuesClause = codes.map((_, i) => `(@ic${i})`).join(", ");
  const params = codes.map((code, i) => ({ name: `ic${i}`, type: sql.NVarChar, value: code }));

  const query = `
    SELECT
      V.RequestedItemCode,
      T0.ItemCode,
      T0.ItemName,
      T0.U_CasNo,
      T1.ItmsGrpNam AS Category,
      COALESCE(W.TotalOnHand, 0) AS OnHand,
      ISNULL(P.U_Price, 0) AS WebPrice,
      COALESCE(SalesAgg.UnitsSold, 0) AS UnitsSold,
      COALESCE(SalesAgg.NumberOfCustomers, 0) AS NumberOfCustomers
    FROM (VALUES ${valuesClause}) AS V(RequestedItemCode)
    LEFT JOIN [dbo].[OITM] T0 ON T0.ItemCode = V.RequestedItemCode
    LEFT JOIN [dbo].[OITB] T1 ON T0.ItmsGrpCod = T1.ItmsGrpCod
    LEFT JOIN (
      SELECT ItemCode, SUM(COALESCE(OnHand, 0)) AS TotalOnHand
      FROM [dbo].[OITW]
      GROUP BY ItemCode
    ) W ON W.ItemCode = T0.ItemCode
    OUTER APPLY (
      SELECT TOP 1 R.U_Price
      FROM [@PRICING_H] H
      INNER JOIN [@PRICING_R] R ON H.DocEntry = R.DocEntry
      WHERE H.U_Code = T0.ItemCode
    ) P
    LEFT JOIN (
      SELECT INV1.ItemCode, SUM(INV1.Quantity) AS UnitsSold, COUNT(DISTINCT OINV.CardCode) AS NumberOfCustomers
      FROM INV1
      INNER JOIN OINV ON INV1.DocEntry = OINV.DocEntry
      GROUP BY INV1.ItemCode
    ) SalesAgg ON SalesAgg.ItemCode = T0.ItemCode
    ORDER BY V.RequestedItemCode;
  `;

  try {
    const rows = await queryDatabase(query, params);
    return rows.map((row) => ({
      ItemCode: row.RequestedItemCode,
      ItemName: row.ItemName || null,
      U_CasNo: row.U_CasNo || null,
      Category: row.Category || null,
      foundInSap: row.ItemCode !== null,
      OnHand: row.ItemCode !== null ? row.OnHand : null,
      WebPrice: row.ItemCode !== null ? row.WebPrice : null,
      UnitsSold: row.ItemCode !== null ? row.UnitsSold : null,
      NumberOfCustomers: row.ItemCode !== null ? row.NumberOfCustomers : null,
    }));
  } catch (error) {
    console.error("Error fetching FD Cell Catalogue data:", error.message);
    throw new Error("Error executing FD Cell Catalogue query");
  }
}
