// lib/models/order.js
import { queryDatabase } from '../db';

export async function getOrders(customQuery) {
  try {
    const data = await queryDatabase(customQuery); // Execute the provided query
    console.log(customQuery);
    
    return data;
  } catch (error) {    
    console.error('Database query error:', error);
    throw new Error('Failed to fetch orders');
  }
}

export async function getOrderDetail(id) {
  
  const query = `
    SELECT * 
    FROM rdr1 t0 
    INNER JOIN ordr t1 ON t1.DocNum = t0.BaseRef 
    WHERE t1.DocNum = ${id};
  `;
  
  const data = await queryDatabase(query);
  return data;
}
