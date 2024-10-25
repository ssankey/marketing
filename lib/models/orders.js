// lib/models/order.js
import { queryDatabase } from '../db';

export async function getOrders() {
    const data = await queryDatabase('SELECT * FROM ordr t1 inner join rdr1 t0 on t0.BaseRef = t1.Docnum  ');
    return data;
}

export async function getOrderDetail(id) {
  const data = await queryDatabase(`SELECT * FROM rdr1 t0 inner join ordr t1 on t1.Docnum = t0.BaseRef WHERE BaseRef = ${id}  `);
  return data;
}

// Add more functions as needed
