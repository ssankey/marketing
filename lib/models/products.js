// lib/models/products.js

import { queryDatabase } from "../db";

export async function getProducts(customQuery) {
  try {
    const data = await queryDatabase(customQuery); // Execute the provided query
    console.log(customQuery);
    return data;
  } catch (error) {
    console.error("Database query error:", error);
    throw new Error("Failed to fetch quotations");
  }
}

export async function getProductDetail(id) {
  const query = `
    SELECT t1.DocNum, t1.DocDate, t1.CardName, t0.ItemCode, t0.Dscription
    FROM oqut t1
    LEFT JOIN qut1 t0 ON t1.DocNum = t0.BaseRef
    WHERE t1.DocNum = ${id};
  `;

  const data = await queryDatabase(query);
  return data;
}
