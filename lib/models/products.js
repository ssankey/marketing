// lib/models/products.js

import { queryDatabase } from "../db";
import sql from 'mssql'
export async function getProducts(customQuery) {
  try {
    const data = await queryDatabase(customQuery); // Execute the provided query
    console.log(customQuery);
    return data;
  } catch (error) {
    console.error("Database query error:", error);
    throw new Error("Failed to fetch products");
  }
}

export async function getProductDetail(id) {
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
    WHERE ItemCode LIKE @itemCode;
  `;

  const params = [
    {
      name: 'itemCode',
      type: sql.NVarChar,
      value: `%${id}%`,
    },
  ];

  const data = await queryDatabase(query, params);
  return data[0];// Assuming you want the first result
}
