// // lib/models/quotation.js

// import { queryDatabase } from "../db";

// export async function getQuotations(customQuery) {
//   const data = await queryDatabase(
//     // "SELECT * FROM oqut t1 inner join qut1 t0 on t0.BaseRef = t1.Docnum "
//     "SELECT * FROM oqut"
//     // "SELECT * FROM qut1"
//     // "SELECT t1.*, t0.ItemCode, t0.Dscription FROM oqut t1 LEFT JOIN qut1 t0 ON t1.DocNum = t0.BaseRef"
//   );
//   return data;
// }

// export async function getQuotationDetail(id) {
//   const data = await queryDatabase(`SELECT * FROM qut1`);
//   return data;
// }

// // Add more functions as needed


// lib/models/quotation.js
import { queryDatabase } from '../db';

export async function getQuotations(customQuery) {
  try {
    const data = await queryDatabase(customQuery); // Execute the provided query
    console.log(customQuery);
    return data;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Failed to fetch quotations');
  }
}

export async function getQuotationDetail(id) {
  const query = `
    SELECT t1.DocNum, t1.DocDate, t1.CardName, t0.ItemCode, t0.Dscription
    FROM oqut t1
    LEFT JOIN qut1 t0 ON t1.DocNum = t0.BaseRef
    WHERE t1.DocNum = ${id};
  `;
  
  const data = await queryDatabase(query);
  return data;
}
