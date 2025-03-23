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




export async function getSalesByCategory(cardCode) {
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
    GROUP BY T4.ItmsGrpNam
    ORDER BY Sales DESC
  `;

  const params = [{ name: "CardCode", type: sql.NVarChar, value: cardCode }];

  return await queryDatabase(query, params);
}


export async function getCustomerOutstanding(cardCode) {
  const query = `
    SELECT DISTINCT(T0.[DocNum]) AS 'SO#', 
           T0.[CardCode],
           T0.[CardName], 
           T0.[DocDate] AS 'SO Date',  
           T3.[DocNum] AS 'Delivery#',
           T3.[DocDate] AS 'Delivery Date',
           DATEDIFF(D, T0.[DocDate], T3.[DocDate]) AS 'SO to Delivery Days',
           T13.[DocNum] AS 'Invoice No.',
           T13.[DocDate] AS 'AR Invoice Date',
           T13.[DocTotal] AS 'Invoice Total',
           (T13.[DocTotal] - T13.[PaidToDate]) AS 'Balance Due', 
           T13.[NumAtCard],
           DATEDIFF(D, T13.[DocDueDate], GETDATE()) AS 'Overdue Days',
           T15.[PymntGroup]
    FROM ORDR T0  
    INNER JOIN RDR1 T1 ON T0.[DocEntry] = T1.[DocEntry] 
    INNER JOIN DLN1 T2 ON T1.[DocEntry] = T2.[BaseEntry] 
                        AND T1.[ItemCode] = T2.[ItemCode] 
                        AND T2.[BaseLine] = T1.[LineNum]
    INNER JOIN ODLN T3 ON T3.[DocEntry] = T2.[DocEntry]
    INNER JOIN INV1 T12 ON T2.[DocEntry] = T12.[BaseEntry] 
                          AND T2.[ItemCode] = T12.[ItemCode] 
                          AND T12.[BaseLine] = T2.[LineNum]
    INNER JOIN OINV T13 ON T13.[DocEntry] = T12.[DocEntry]
    INNER JOIN OITM T10 ON T10.[ItemCode] = T1.[ItemCode]
    INNER JOIN OITB T11 ON T11.[ItmsGrpCod] = T10.[ItmsGrpCod]
    INNER JOIN OCRD T14 ON T13.[CardCode] = T14.[CardCode]
    INNER JOIN OCTG T15 ON T14.[GroupNum] = T15.[GroupNum]
    LEFT JOIN OSLP T50 ON T50.[SlpCode] = T13.[SlpCode]
    WHERE T0.[CardCode] = @cardCode
    ORDER BY T0.[DocDate] DESC;
  `;

  try {
    const result = await queryDatabase(query, [
      { name: "cardCode", type: sql.NVarChar, value: cardCode },
    ]);

    return result;
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    throw new Error("Failed to fetch customer orders");
  }
}