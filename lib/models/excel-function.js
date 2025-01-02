import { queryDatabase } from "../db"; // Replace this with your database query function

export async function getAllQuotations({
  status,
  search,
  sortField,
  sortDir,
  fromDate,
  toDate,
}) {
  try {

     let whereClause = "1=1";

     if (search) {
       whereClause += ` AND (
      T0.DocNum LIKE '%${search}%' OR 
      T0.CardName LIKE '%${search}%' OR 
      T0.NumAtCard LIKE '%${search}%'
    )`;
     }

     if (status !== "all") {
       if (status.toLowerCase() === "open") {
         whereClause += " AND T0.DocStatus='O' ";
       } else if (status.toLowerCase() === "closed") {
         whereClause += " AND T0.DocStatus='C' AND T0.CANCELED='N' ";
       } else if (status.toLowerCase() === "canceled") {
         whereClause += "AND T0.DocStatus='C' AND T0.CANCELED='Y' ";
       }
     }

     if (fromDate) {
       whereClause += ` AND T0.DocDate >= '${fromDate}'`;
     }
     if (toDate) {
       whereClause += ` AND T0.DocDate <= '${toDate}'`;
     }


    const query = `
      SELECT 
        CASE 
          WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'N') THEN 'Closed'
          WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'Y') THEN 'Cancelled'
          WHEN T0.DocStatus = 'O' THEN 'Open'
          ELSE 'NA' 
        END AS DocStatus,
        T0.DocEntry,
        T0.DocNum,
        T0.DocDate,
        T0.NumAtCard AS CustomerPONo,
        T0.DocDueDate AS DeliveryDate,
        T0.CardName,
        T0.DocTotal,
        T0.DocCur,
        T5.SlpName AS SalesEmployee
      FROM OQUT T0  
      INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      WHERE ${whereClause}
      ORDER BY ${sortField} ${sortDir}
    `;
    const results = await queryDatabase(query);
    return results;
  } catch (error) {
    console.error("Error fetching all quotations:", error);
    throw error;
  }
}


export async function getAllCustomers() {
  try {

    
    const query = `
      SELECT
        T0.CardCode AS CustomerCode,
        T0.CardName AS CustomerName,
        T0.Phone1 AS Phone,
        T0.E_Mail AS Email,
        T0.Address AS BillingAddress,
        T0.Balance,
        T0.Currency,
        T0.ValidFor AS IsActive,
        T0.CreditLine,
        T5.SlpName AS SalesEmployeeName
      FROM OCRD T0
      LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      WHERE 1=1 AND T0.CardType = 'C'
      ORDER BY T0.CardName ASC
    `;
    const results = await queryDatabase(query);
    return results;
  } catch (error) {
    console.error("Error fetching all quotations:", error);
    throw error;
  }
}




export async function getAllProducts({
  status,
  search,
  category = "",
  sortField,
  sortDir,
}) {
  try {
    let whereClause = "1=1"; // Default condition to ensure the query is valid

    // Apply filters based on the status
    if (status === "inStock") {
      whereClause += " AND T2.OnHand > 0"; // Assuming T2.OnHand > 0 means In Stock
    } else if (status === "outOfStock") {
      whereClause += " AND T2.OnHand = 0"; // Assuming T2.OnHand = 0 means Out of Stock
    }

    // Apply search filter
    if (search) {
      whereClause += ` AND (T0.ItemCode LIKE '%${search}%' OR T0.ItemName LIKE '%${search}%')`;
    }

    if (category) {
      // Assuming T1.ItmsGrpNam stores category name
      whereClause += ` AND T1.ItmsGrpNam = '${category}'`;
    }


    // Build the query dynamically
    const query = `
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
        T2.OnHand ,
        T1.ItmsGrpNam AS Category,
        CASE
          WHEN T2.OnHand > 0 THEN 'In Stock'
          ELSE 'Out of Stock'
        END AS stockStatus -- Add stockStatus dynamically
      FROM [dbo].[OITM] T0
      INNER JOIN [dbo].[OITB] T1 ON T0.[ItmsGrpCod] = T1.[ItmsGrpCod]
      INNER JOIN [dbo].[OITW] T2 ON T0.[ItemCode] = T2.[ItemCode]
      LEFT JOIN [dbo].[OBTN] T5 ON T0.[ItemCode] = T5.[ItemCode]
      WHERE ${whereClause}
      ORDER BY ${sortField} ${sortDir}
    `;

    const results = await queryDatabase(query); // Execute the query

    // Map results to include stockStatus like in getProductsFromDatabase
    return results.map((product) => ({
      ...product,
      stockStatus: product.OnHand > 0 ? "In Stock" : "Out of Stock",
    }));
  } catch (error) {
    console.error("Error fetching filtered products:", error);
    throw error;
  }
}




export async function getAllInvoices({ status, search, sortField, sortDir,fromDate,toDate }) {
  try {
    let whereClause = "1=1";

    if (search) {
      whereClause += ` AND (
      T0.DocNum LIKE '%${search}%' OR 
      T0.CardName LIKE '%${search}%' OR 
      T0.NumAtCard LIKE '%${search}%'
    )`;
    }

    if (status !== "all") {
      if (status.toLowerCase() === "open") {
        whereClause += " AND T0.DocStatus='O' ";
      } else if (status.toLowerCase() === "closed") {
        whereClause += " AND T0.DocStatus='C' AND T0.CANCELED='N' ";
      } else if (status.toLowerCase() === "canceled") {
        whereClause += "AND T0.DocStatus='C' AND T0.CANCELED='Y' ";
      }

    }

    if (fromDate) {
      whereClause += ` AND T0.DocDate >= '${fromDate}'`;
    }
    if (toDate) {
      whereClause += ` AND T0.DocDate <= '${toDate}'`;
    }


    const query = `
     SELECT 
    CASE 
      WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
      WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Canceled'
      WHEN T0.DocStatus='O' THEN 'Open' 
      ELSE 'NA' 
    END AS DocStatus,
    T0.DocEntry,
    T0.DocNum,
    T0.DocDate,
    T0.NumAtCard AS CustomerPONo,
    T0.TaxDate AS PODate,
    T0.DocDueDate,
    T0.CardName,
    -- Calculate InvoiceTotal based on the logic for Invoice or Credit Note
    CASE 
      WHEN T0.CurSource='L' AND T0.DpmAmnt <> 0 THEN (T0.DpmAmnt + T0.DpmVat) 
      ELSE T0.DocTotal 
    END AS InvoiceTotal,
    T0.DocCur,
    T0.DocRate,
    T5.SlpName AS SalesEmployee,
    CASE 
      WHEN T1.Country = 'IN' THEN 'Domestic' 
      ELSE 'Export' 
    END AS TradeType,
    T1.GroupCode,
    (SELECT GroupName FROM OCRG WHERE GroupCode = T1.GroupCode) AS [CustomerGroup],
    T0.ShipToCode,
    (SELECT TOP 1 GSTRegnNo FROM CRD1 WHERE CardCode = T0.CardCode AND AdresType='S' AND Address = T0.ShipToCode) AS GSTIN,
    T0.Comments
  FROM OINV T0
  INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
  INNER JOIN OCRD T1 ON T0.CardCode = T1.CardCode
      WHERE ${whereClause}
      ORDER BY ${sortField} ${sortDir}
    `;
    const results = await queryDatabase(query);
    return results;
  } catch (error) {
    console.error("Error fetching all quotations:", error);
    throw error;
  }
}


export async function getAllOrders({
  status,
  search,
  sortField,
  sortDir,
  fromDate,
  toDate,
}) {
  try {
    let whereClause = "1=1";

    if (search) {
      whereClause += ` AND (
      T0.DocNum LIKE '%${search}%' OR 
      T0.CardName LIKE '%${search}%' OR 
      T0.NumAtCard LIKE '%${search}%'
    )`;
    }

    if (status !== "all") {
      if (status.toLowerCase() === "open") {
        whereClause += " AND T0.DocStatus='O' ";
      } else if (status.toLowerCase() === "closed") {
        whereClause += " AND T0.DocStatus='C' AND T0.CANCELED='N' ";
      } else if (status.toLowerCase() === "canceled") {
        whereClause += "AND T0.DocStatus='C' AND T0.CANCELED='Y' ";
      }
    }

    if (fromDate) {
      whereClause += ` AND T0.DocDate >= '${fromDate}'`;
    }
    if (toDate) {
      whereClause += ` AND T0.DocDate <= '${toDate}'`;
    }

    const query = `
     SELECT 
    CASE 
      WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
      WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
      WHEN T0.DocStatus='O' THEN 'Open' 
      ELSE 'NA' 
    END AS DocStatus,
    T0.DocEntry,
    T0.DocNum,
    T0.DocDate,
    T0.NumAtCard AS CustomerPONo,
    T0.TaxDate AS PODate,
    T0.DocDueDate AS DeliveryDate,
    T0.CardName,
    T0.DocTotal,
    T0.DocCur,
    T0.DocRate,
    T5.SlpName AS SalesEmployee,
    COUNT(DISTINCT T1.ItemCode) AS ProductCount -- Count of unique products in the order
  FROM ORDR T0
  INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
  INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry -- Join to get product details
  WHERE ${whereClause}
  GROUP BY 
    T0.DocStatus,
    T0.CANCELED,
    T0.DocEntry,
    T0.DocNum,
    T0.DocDate,
    T0.NumAtCard,
    T0.TaxDate,
    T0.DocDueDate,
    T0.CardName,
    T0.DocTotal,
    T0.DocCur,
    T0.DocRate,
    T5.SlpName
    ORDER BY ${sortField} ${sortDir}
    `;
    const results = await queryDatabase(query);
    return results;
  } catch (error) {
    console.error("Error fetching all quotations:", error);
    throw error;
  }
}




// export async function getAllOpenOrders(
//   search,
//   sortField = "DocNum",
//   sortDir = "asc",
//   fromDate,
//   toDate
// ) {
//   try {
//     let whereClause = "T0.DocStatus = 'O' AND T1.LineStatus = 'O'";

//     const sanitizedSearch = typeof search === "string" ? search : "";

//     if (sanitizedSearch) {
//       whereClause += ` AND (
//         T0.DocNum LIKE '%${sanitizedSearch}%' OR 
//         T0.CardName LIKE '%${sanitizedSearch}%' OR 
//         T0.NumAtCard LIKE '%${sanitizedSearch}%'
//       )`;
//     }

//     if (fromDate) {
//       whereClause += ` AND T0.DocDate >= '${fromDate}'`;
//     }
//     if (toDate) {
//       whereClause += ` AND T0.DocDate <= '${toDate}'`;
//     }

//     const validSortFields = ["DocDate", "DocNum", "CardName"];
//     if (!validSortFields.includes(sortField)) {
//       sortField = "DocNum";
//     }

//     const sortDirection = sortDir.toLowerCase() === "asc" ? "ASC" : "DESC";

//     const query = `
//       SELECT 
//         T0.DocEntry,
//         T0.DocNum,
//         T0.DocDate,
//         T1.LineTotal,
//         T0.CardName,
//         T0.NumAtCard AS CustomerPONo,
//         T0.TaxDate AS PODate,
//         T4.ItmsGrpNam AS ItemGroup,
//         T1.ItemCode,
//         T1.Dscription AS ItemName,
//         CASE 
//           WHEN T1.LineStatus='C' THEN 'Closed'
//           WHEN T1.LineStatus='O' THEN 'Open'
//           ELSE 'NA' 
//         END AS LineStatus,
//         ROUND(T1.Quantity, 2) AS Quantity,
//         ROUND(T1.OpenQty, 2) AS OpenQty,
//         T1.UnitMsr AS UOMName,
//         T3.OnHand AS Stock,
//         CASE 
//           WHEN T3.OnHand >= T1.OpenQty THEN 'In Stock'
//           ELSE 'Out of Stock'
//         END AS StockStatus,
//         T1.Price,
//         T1.LineTotal,
//         ROUND(T1.Price, 3) AS RoundedPrice,
//         T1.Currency,
//         (T1.OpenQty * T1.Price) AS OpenAmount,
//         T1.U_timeline,
//         T3.SuppCatNum,
//         T1.DelivrdQty,
//         T1.ShipDate AS DeliveryDate,
//         T2.Location AS PlantLocation,
//         T5.SlpName AS SalesEmployee
//       FROM ORDR T0  
//       INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry 
//       INNER JOIN OLCT T2 ON T1.LocCode = T2.Code 
//       LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode 
//       LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
//       INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
//       WHERE ${whereClause}
//       GROUP BY 
//         T0.DocEntry,
//         T0.DocNum,
//         T0.DocDate,
//         T0.CardName,
//         T0.NumAtCard,
//         T0.TaxDate,
//         T4.ItmsGrpNam,
//         T1.ItemCode,
//         T1.LineStatus,
//         T1.Dscription,
//         T1.Quantity,
//         T1.OpenQty,
//         T1.UnitMsr,
//         T3.OnHand,
//         T1.Currency,
//         T1.Price,
//         T1.LineTotal,
//         T1.U_timeline,
//         T3.SuppCatNum,
//         T1.DelivrdQty,
//         T1.ShipDate,
//         T2.Location,
//         T5.SlpName
//       ORDER BY ${sortField} ${sortDirection};
//     `;

//     const results = await queryDatabase(query);
//     return results;
//   } catch (error) {
//     console.error("Error fetching open orders for Excel:", error);
//     throw error;
//   }
// }


export async function getAllOpenOrders({
  search = "",
  status = "all",
  sortField = "DocNum",
  sortDir = "asc",
  fromDate,
  toDate,
}) {
  try {
    let whereClause = "T0.DocStatus = 'O' AND T1.LineStatus = 'O'";

    if (search) {
      whereClause += ` AND (
        T0.DocNum LIKE '%${search}%' OR 
        T0.CardName LIKE '%${search}%' OR 
        T1.ItemCode LIKE '%${search}%'
      )`;
    }

    if (fromDate) {
      whereClause += ` AND T0.DocDate >= '${fromDate}'`;
    }
    if (toDate) {
      whereClause += ` AND T0.DocDate <= '${toDate}'`;
    }

    if (status === "inStock") {
      whereClause += " AND T3.OnHand > 0 AND T3.OnHand >= T1.OpenQty";
    } else if (status === "outOfStock") {
      whereClause += " AND T3.OnHand >= 0 AND T3.OnHand < T1.OpenQty";
    }

    const validSortFields = ["DocDate", "DocNum", "CardName"];
    if (!validSortFields.includes(sortField)) {
      sortField = "DocNum";
    }

    const sortDirection = sortDir.toLowerCase() === "asc" ? "ASC" : "DESC";

    const query = `
      SELECT 
        T0.DocEntry,
        T0.DocNum,
        T0.DocDate,
        ROUND(SUM(T1.LineTotal), 2) AS TotalAmount,
        T0.CardName,
        T0.NumAtCard AS CustomerPONo,
        T0.TaxDate AS PODate,
        T4.ItmsGrpNam AS ItemGroup,
        T1.ItemCode,
        T1.Dscription AS ItemName,
        CASE 
          WHEN T1.LineStatus='C' THEN 'Closed'
          WHEN T1.LineStatus='O' THEN 'Open'
          ELSE 'NA' 
        END AS LineStatus,
        ROUND(T1.Quantity, 2) AS Quantity,
        ROUND(T1.OpenQty, 2) AS OpenQty,
        T1.UnitMsr AS UOMName,
        T3.OnHand AS Stock,
        CASE 
          WHEN T3.OnHand >= T1.OpenQty THEN 'In Stock'
          ELSE 'Out of Stock'
        END AS StockStatus,
        T1.Price,
        T1.LineTotal,
        ROUND(T1.Price, 3) AS RoundedPrice,
        T1.Currency,
        (T1.OpenQty * T1.Price) AS OpenAmount,
        T1.U_timeline,
        T3.SuppCatNum,
        T1.DelivrdQty,
        T1.ShipDate AS DeliveryDate,
        T2.Location AS PlantLocation,
        T5.SlpName AS SalesEmployee
      FROM ORDR T0  
      INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry 
      INNER JOIN OLCT T2 ON T1.LocCode = T2.Code 
      LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode 
      LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
      INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      WHERE ${whereClause}
      GROUP BY 
        T0.DocEntry,
        T0.DocNum,
        T0.DocDate,
        T0.CardName,
        T0.NumAtCard,
        T0.TaxDate,
        T4.ItmsGrpNam,
        T1.ItemCode,
        T1.LineStatus,
        T1.Dscription,
        T1.Quantity,
        T1.OpenQty,
        T1.UnitMsr,
        T3.OnHand,
        T1.Currency,
        T1.Price,
        T1.LineTotal,
        T1.U_timeline,
        T3.SuppCatNum,
        T1.DelivrdQty,
        T1.ShipDate,
        T2.Location,
        T5.SlpName
      ORDER BY ${sortField} ${sortDirection};
    `;

    const results = await queryDatabase(query);
    return results;
  } catch (error) {
    console.error("Error fetching open orders for Excel:", error);
    throw error;
  }
}
