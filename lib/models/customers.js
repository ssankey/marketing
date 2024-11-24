
// lib/models/customers.js
import sql from 'mssql'
import { queryDatabase } from "../db";
import { getAllTableFieldsAndSamples } from "./check-table-fileds/table-field"; // Importing the new function

export async function getCustomers(customQuery) {
  try {
    const data = await queryDatabase(customQuery); // Execute the provided query
    console.log(customQuery);
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
  const params = [
    { name: 'CardCode', type: sql.NVarChar, value: id },
  ];

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








// Example: Call getAllOCRDFields in the same file
async function logTABLEFields() {
  await getAllTableFieldsAndSamples();
}

// Call it for debugging
logTABLEFields();
