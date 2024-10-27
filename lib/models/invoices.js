// lib/models/invoice.js
import { queryDatabase } from '../db';

export async function getInvoices(customQuery) {
  try {
    const data = await queryDatabase(customQuery); // Execute the provided query
    console.log(customQuery);
    
    return data;
  } catch (error) {    
    console.error('Database query error:', error);
    throw new Error('Failed to fetch invoices');
  }
}

export async function getInvoiceDetail(id) {
  
  const query = `
    SELECT * 
    FROM INV1 t0 
    INNER JOIN OINV t1 ON t0.DocEntry = t1.DocEntry
    WHERE t1.DocNum = ${id};
  `;
  
  const data = await queryDatabase(query);
  return data;
}
