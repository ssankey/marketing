


import { queryDatabase } from "../db";
import sql from "mssql"; // Required for specifying parameter data types

// Fetch last 10 quotations for a customer
export const getLastTenQuotations = async (customerCode) => {
  const query = `
    SELECT 
      Q.DocNum AS QuotationNumber, 
      Q.DocEntry AS DocEntry,
      Q.DocDate AS QuotationDate , 
      Q.DocDueDate AS DeliveryDate, 
      Q.DocStatus AS QuotationStatus, 
      Q.DocTotal AS Total
    FROM OQUT Q
    INNER JOIN OCRD C ON Q.CardCode = C.CardCode
    WHERE Q.CardCode = @CardCode
    ORDER BY Q.DocDate DESC
    OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY;
  `;

  try {
    const params = [
      { name: "CardCode", type: sql.VarChar, value: customerCode },
    ];

    const quotations = await queryDatabase(query, params);
    return quotations;
  } catch (error) {
    console.error(
      `Error fetching last 10 quotations for customer ${customerCode}:`,
      error
    );
    throw new Error("Could not fetch last 10 quotations.");
  }
};

// Fetch last 10 orders for a customer
export const getLastTenOrders = async (customerCode) => {
  const query = `
    SELECT 
      o.DocNum AS OrderNumber,
      o.DocDate AS OrderDate,
      o.DocEntry AS DocEntry,
      o.DocDueDate AS DeliveryDate,
      o.DocStatus AS OrderStatus
    FROM ORDR o
    INNER JOIN OCRD c ON o.CardCode = c.CardCode
    WHERE o.CardCode = @CardCode
    ORDER BY o.DocDate DESC
    OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY;
  `;

  try {
    const params = [
      { name: "CardCode", type: sql.VarChar, value: customerCode },
    ];

    const orders = await queryDatabase(query, params);
    return orders;
  } catch (error) {
    console.error(
      `Error fetching last 10 orders for customer ${customerCode}:`,
      error
    );
    throw new Error("Could not fetch last 10 orders.");
  }
};

// Fetch last 10 invoices for a customer
export const getLastTenInvoices = async (customerCode) => {
  const query = `
    SELECT 
      OINV.DocNum AS InvoiceNumber,
      OINV.DocDate AS InvoiceDate, 
      OINV.DocEntry AS DocEntry,
      OINV.DocDueDate AS DeliveryDate,
      OINV.DocTotal AS NetAmount,
      OINV.DocStatus AS InvoiceStatus
    FROM OINV
    INNER JOIN OCRD ON OINV.CardCode = OCRD.CardCode
    WHERE OINV.CardCode = @CardCode
    ORDER BY OINV.DocDate DESC
    OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY;
  `;

  try {
    const params = [
      { name: "CardCode", type: sql.VarChar, value: customerCode },
    ];

    const invoices = await queryDatabase(query, params);
    return invoices;
  } catch (error) {
    console.error(
      `Error fetching last 10 invoices for customer ${customerCode}:`,
      error
    );
    throw new Error("Could not fetch last 10 invoices.");
  }
};





