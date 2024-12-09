import { queryDatabase } from "../db"; // Replace this with your database query function

export async function getAllQuotations() {
  try {
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
      WHERE 1=1
      ORDER BY T0.DocNum DESC
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
      WHERE 1=1
      ORDER BY T0.CardName ASC
    `;
    const results = await queryDatabase(query);
    return results;
  } catch (error) {
    console.error("Error fetching all quotations:", error);
    throw error;
  }
}


export async function getAllProducts() {
  try {
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
      WHERE 1=1
      ORDER BY ItemCode ASC
    `;
    const results = await queryDatabase(query);
    return results;
  } catch (error) {
    console.error("Error fetching all quotations:", error);
    throw error;
  }
}


export async function getAllInvoices() {
  try {
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
      WHERE 1=1
      ORDER BY T0.DocDate DESC
    `;
    const results = await queryDatabase(query);
    return results;
  } catch (error) {
    console.error("Error fetching all quotations:", error);
    throw error;
  }
}


export async function getAllOrders() {
  try {
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
  WHERE 1=1
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
    ORDER BY T0.DocDate DESC
    `;
    const results = await queryDatabase(query);
    return results;
  } catch (error) {
    console.error("Error fetching all quotations:", error);
    throw error;
  }
}

export async function getAllOpenOrders() {
  try {
    const query = `
     SELECT 
        T0.DocEntry,
        T0.DocNum,
        T0.DocDate,
        T0.CardName,
        T1.ItemCode,
        T1.Dscription AS ItemName,
        T1.Quantity,
        T1.OpenQty,
        T3.OnHand AS Stock,
        CASE 
          WHEN T3.OnHand >= T1.OpenQty THEN 'In Stock'
          ELSE 'Out of Stock'
        END AS StockStatus,
        T1.Price,
        T0.DocTotal,
        T1.Currency,
        (T1.OpenQty * T1.Price) AS OpenAmount,
        T0.DocCur,
        T0.DocRate,
        T1.ShipDate AS DeliveryDate,
        T5.SlpName AS SalesEmployee
      FROM ORDR T0  
      INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry 
      LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
      INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      WHERE 1=1
      ORDER BY T0.DocDate DESC
    `;
    const results = await queryDatabase(query);
    return results;
  } catch (error) {
    console.error("Error fetching all quotations:", error);
    throw error;
  }
}