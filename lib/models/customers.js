// lib/models/customers.js
import sql from "mssql";
import { queryDatabase } from "../db";
import { getAllTableFieldsAndSamples } from "./check-table-fileds/table-field"; // Importing the new function

export async function getCustomers(customQuery) {
  try {
    const data = await queryDatabase(customQuery); // Execute the provided query
    return data;
  } catch (error) {
    console.error("Database query error:", error);
    throw new Error("Failed to fetch quotations");
  }
}

export async function getCustomerDetail(id) {
  // Query to fetch customer details with additional columns
  const customerQuery = `
    SELECT
      T0.CardCode AS CustomerCode,
      T0.CardName AS CustomerName,
      T0.CardType,
      T0.GroupCode,
      T0.Address AS BillingAddress,
      T0.ZipCode,
      T0.MailAddres AS MailingAddress,
      T0.MailZipCod AS MailingZipCode,
      T0.Phone1 AS Phone,
      T0.Phone2 AS SecondaryPhone,
      T0.Fax,
      T0.CntctPrsn AS ContactPerson,
      T0.Notes,
      T0.Balance,
      T0.Currency,
      T0.ValidFor AS IsActive,
      T0.ValidUntil,
      T0.City,
      T0.County,
      T0.Country,
      T0.E_Mail AS Email,
      T0.Industry,
      T0.Territory,
      T0.IntrntSite AS Website,
      T0.LangCode AS LanguageCode,
      T0.AliasName,
      T0.Building,
      T0.BillToDef,
      T0.ShipToDef,
      T0.CreditLine,
      T5.SlpName AS SalesEmployeeName
    FROM OCRD T0
    
    LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    WHERE T0.CardCode = @CardCode;
  `;

  // Parameters array
  const params = [{ name: "CardCode", type: sql.NVarChar, value: id }];

  // Execute customer query
  const customerData = await queryDatabase(customerQuery, params);

  // Query to fetch customer addresses
  const addressQuery = `
    SELECT
      Address AS AddressName,
      AdresType AS AddressType,
      Street,
      Block,
      ZipCode,
      City,
      County,
      Country,
      State
    FROM CRD1
    WHERE CardCode = @CardCode;
  `;

  // Execute address query
  const addresses = await queryDatabase(addressQuery, params);

  // Combine customer data with addresses
  if (customerData.length > 0) {
    customerData[0].Addresses = addresses;
  }

  return customerData;
}

export async function getCustomersForDropdown() {
  try {
    const query = `
      SELECT 
        T0.CardCode AS CustomerCode,
        T0.CardName AS CustomerName
      FROM OCRD T0
      WHERE T0.CardType = 'C'
      ORDER BY T0.CardName ASC;
    `;

    const data = await queryDatabase(query);
    return data;
  } catch (error) {
    console.error("Database query error:", error);
    throw new Error("Failed to fetch customers for dropdown");
  }
}

// Example: Call getAllOCRDFields in the same file
async function logTABLEFields() {
  await getAllTableFieldsAndSamples();
}

// Call it for debugging
logTABLEFields();

// export async function getSalesByCategory(cardCode, salesPerson) {
//   const query = `
//     SELECT 
//       T4.ItmsGrpNam AS Category,
//       SUM(T1.Quantity) AS Quantity,
//       SUM(T1.LineTotal) AS Sales
//     FROM OINV T0
//     INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
//     INNER JOIN OCRD T2 ON T0.CardCode = T2.CardCode
//     LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
//     LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
//     WHERE T0.CardCode = @CardCode
//     ${salesPerson ? "AND T0.SlpCode = @SalesPerson" : ""}
//     GROUP BY T4.ItmsGrpNam
//     ORDER BY Sales DESC
//   `;

//   const params = [{ name: "CardCode", type: sql.NVarChar, value: cardCode }];

//    if (salesPerson) {
//      params.push({
//        name: "SalesPerson",
//        type: sql.Int,
//        value: parseInt(salesPerson, 10),
//      });
//    }

//   return await queryDatabase(query, params);
// }

// Fixed backend function for models/customers.js
export async function getSalesByCategory(cardCode, salesPerson) {
  // Console log to debug parameter values
  console.log("getSalesByCategory called with:", { cardCode, salesPerson });

  const query = `
    SELECT 
      T4.ItmsGrpNam AS Category,
      SUM(T1.Quantity) AS Quantity,
      SUM(T1.LineTotal) AS Sales
    FROM OINV T0
    INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
    INNER JOIN OCRD T2 ON T0.CardCode = T2.CardCode
    LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
    LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
    WHERE T0.CardCode = @CardCode
    ${salesPerson ? "AND T0.SlpCode = @SalesPerson" : ""}
    GROUP BY T4.ItmsGrpNam
    ORDER BY Sales DESC
  `;

  const params = [{ name: "CardCode", type: sql.NVarChar, value: cardCode }];

  // Only add salesPerson parameter if it's provided and valid
  if (salesPerson) {
    const salesPersonValue = parseInt(salesPerson, 10);
    
    // Check if it's a valid integer
    if (!isNaN(salesPersonValue)) {
      params.push({
        name: "SalesPerson",
        type: sql.Int,
        value: salesPersonValue
      });
      console.log("Added salesPerson parameter:", salesPersonValue);
    } else {
      console.warn("Invalid salesPerson parameter:", salesPerson);
    }
  }

  // Log the final query and parameters for debugging
  console.log("Executing query with params:", params);
  
  return await queryDatabase(query, params);
}


export async function getCustomerOutstanding(cardCode, options = {}) {
  const {
    getAll = false,
    page = 1,
    itemsPerPage = 20,
    filterType = "Payment Pending",
  } = options;

  const offset = (page - 1) * itemsPerPage;

  // Determine the balance due condition based on filterType
  let balanceCondition = "";
  if (filterType === "Payment Pending") {
    balanceCondition = "AND (T13.DocTotal - T13.PaidToDate) > 0";
  } else if (filterType === "Payment Done") {
    balanceCondition = "AND (T13.DocTotal - T13.PaidToDate) <= 0";
  }
  // If neither, don't filter by balance (show all)

  /* ------------------ main query ------------------ */
  let query = `
    ;WITH cte AS (
      SELECT
        T0.DocNum                           AS [SO#],
        T0.CardCode                         AS [Customer Code],
        T0.CardName                         AS [Customer Name],
        T0.NumAtCard AS 'CustomerPONo',
        (SELECT TOP 1 NumAtCard FROM ORDR WHERE DocEntry = T1.BaseEntry) AS 'SO Customer Ref. No',
        T0.DocDate                          AS [SO Date],
        T3.DocNum                           AS [Delivery#],
        T3.DocDate                          AS [Delivery Date],
        DATEDIFF(DAY,T0.DocDate,T3.DocDate) AS [SO to Delivery Days],
        T13.DocNum                          AS [Invoice No.],
        T13.DocDate                         AS [AR Invoice Date],
        T13.DocTotal                        AS [Invoice Total],
        (T13.DocTotal - T13.PaidToDate)     AS [Balance Due],
        T13.NumAtCard                       AS [BP Reference No.],
        DATEDIFF(DAY,T13.DocDueDate,GETDATE()) AS [Overdue Days],
        T15.PymntGroup                      AS [Payment Terms],
         T16.[Name] AS 'Contact Person',
          T50.SlpName AS 'SalesEmployee',
          T50.Email AS 'SalesEmployeeMail',
          T14.[Country] AS 'Country',
          T17.[State] As 'State',
           T13.TrackNo AS 'Tracking no',
      T13.TaxDate AS 'Dispatch Date',
        T50.SlpName,
        ROW_NUMBER() OVER (PARTITION BY T13.DocNum
                           ORDER BY T13.DocDate DESC) AS rn
      FROM ORDR  T0
      
      JOIN RDR1  T1  ON T1.DocEntry   = T0.DocEntry
      JOIN DLN1  T2  ON T2.BaseEntry  = T1.DocEntry
                    AND T2.BaseLine   = T1.LineNum
                    AND T2.ItemCode   = T1.ItemCode
      JOIN ODLN  T3  ON T3.DocEntry   = T2.DocEntry
      JOIN INV1  T12 ON T12.BaseEntry = T2.DocEntry
                    AND T12.BaseLine  = T2.LineNum
                    AND T12.ItemCode  = T2.ItemCode
      JOIN OINV  T13 ON T13.DocEntry  = T12.DocEntry
      JOIN OITM  T10 ON T10.ItemCode  = T1.ItemCode
      JOIN OITB  T11 ON T11.ItmsGrpCod= T10.ItmsGrpCod
      JOIN OCRD  T14 ON T14.CardCode  = T13.CardCode
      INNER JOIN CRD1 T17 ON T14.CardCode= T17.CardCode
      INNER JOIN OCPR T16 ON T14.Cardcode = T16.CardCode
      JOIN OCTG  T15 ON T15.GroupNum  = T14.GroupNum
      LEFT JOIN OSLP T50 ON T50.SlpCode = T13.SlpCode
      WHERE T0.CardCode = @cardCode
      ${balanceCondition}
    )
    SELECT *
    FROM   cte
    WHERE  rn = 1
    ORDER BY [Overdue Days] ASC
    ${
      getAll ? "" : `OFFSET ${offset} ROWS FETCH NEXT ${itemsPerPage} ROWS ONLY`
    };
  `;

  /* ------------- count query (one per invoice) -------------- */
  let countQuery = `
    SELECT COUNT(*) AS total
    FROM (
      SELECT DISTINCT T13.DocNum
      FROM ORDR  T0
      JOIN RDR1  T1  ON T1.DocEntry   = T0.DocEntry
      JOIN DLN1  T2  ON T2.BaseEntry  = T1.DocEntry
                    AND T2.BaseLine   = T1.LineNum
                    AND T2.ItemCode   = T1.ItemCode
      JOIN INV1  T12 ON T12.BaseEntry = T2.DocEntry
                    AND T12.BaseLine  = T2.LineNum
                    AND T12.ItemCode  = T2.ItemCode
      JOIN OINV  T13 ON T13.DocEntry  = T12.DocEntry
      WHERE T0.CardCode = @cardCode
      ${balanceCondition}
    ) x;
  `;

  const parameters = [
    { name: "cardCode", type: sql.NVarChar, value: cardCode },
  ];

  const [rows, total] = await Promise.all([
    queryDatabase(query, parameters),
    queryDatabase(countQuery, parameters),
  ]);

  return {
    results: rows,
    totalItems: total[0]?.total ?? 0,
  };
}