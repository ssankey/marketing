// import { queryDatabase } from "../db";

// export const getLastTenQuotations = async (customerCode) => {
//     const query = `
//       SELECT 
//         Q.DocNum, 
//         Q.DocDate, 
//         Q.CardCode, 
//         Q.CardName, 
//         Q.DocTotal AS Total
//       FROM OQUT Q
//       INNER JOIN OCRD C ON Q.CardCode = C.CardCode
//       WHERE Q.CardCode = ?
//       ORDER BY Q.DocDate DESC
//       LIMIT 10;
//     `;

    
//   try {
//     const quotations = await queryDatabase(query, [customerCode]);
//     return quotations;
//   } catch (error) {
//     console.error(`Error fetching last 10 quotations ${customerCode}:`, error);
//     throw new Error("Could not fetch last 10 quotations.");
//   }
// };


// export async function getLastTenOrders(customerCode) {
//   try {
//     // Query to get the last 10 orders for the given customer
//     const query = `
//       SELECT 
//         o.DocNum AS OrderNumber,
//         o.DocDate AS OrderDate,
//         o.DeliveryDate AS DeliveryDate,
//         o.OrderStatus AS OrderStatus
//       FROM ORDR o
//       INNER JOIN OCRD c ON o.CardCode = c.CardCode
//       WHERE c.CardCode = ?
//       ORDER BY o.DocDate DESC
//       LIMIT 10;
//     `;

//     // Execute query with parameter substitution
//     const results = await queryDatabase(query, [customerCode]);

//     return results;
//   } catch (error) {
//     console.error("Error fetching last 10 orders:", error);
//     throw error;
//   }
// }





// export async function getLastTenInvoices(customerCode) {
//   try {
//     // Query to get the last 10 orders for the given customer
//     const query = `
//      SELECT 
//         OINV.DocNum AS InvoiceNumber,
//         OINV.DocDate As InvoiceDate, 
//         OINV.DocStatus As InvoiceStatus
//       FROM 
//         OINV
//       INNER JOIN 
//         OCRD ON OINV.CardCode = OCRD.CardCode
//       WHERE 
//         OINV.CardCode =  ?
//       ORDER BY 
//         OINV.DocDate DESC
//       LIMIT 10;
//     `;



//     // Execute query with parameter substitution
//     const results = await queryDatabase(query, [customerCode]);

//     return results;
//   } catch (error) {
//     console.error("Error fetching last 10 invoices:", error);
//     throw error;
//   }
// }


import { queryDatabase } from "../db";
import sql from "mssql"; // Required for specifying parameter data types

// Fetch last 10 quotations for a customer
export const getLastTenQuotations = async (customerCode) => {
  const query = `
    SELECT 
      Q.DocNum AS QuotationNumber, 
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





