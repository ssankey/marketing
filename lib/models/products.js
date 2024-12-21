
// lib/models/products.js
import { queryDatabase } from "../db"; // Import the query function from db.js

export async function getProductsFromDatabase({ search, sortField, sortDir, offset, ITEMS_PER_PAGE }) {
  let whereClause = "1=1";

  if (search) {
    whereClause += ` AND (
      ItemCode LIKE '%${search}%' OR 
      ItemName LIKE '%${search}%'
    )`;
  }

  const countQuery = `
    SELECT COUNT(*) as total
    FROM OITM
    WHERE ${whereClause};
  `;

  const dataQuery = `
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
    WHERE ${whereClause}
    ORDER BY ${sortField} ${sortDir}
    OFFSET ${offset} ROWS
    FETCH NEXT ${ITEMS_PER_PAGE} ROWS ONLY;
  `;

  try {
    const [totalResult, rawProducts] = await Promise.all([
      queryDatabase(countQuery),
      queryDatabase(dataQuery),
    ]);

    const totalItems = totalResult[0]?.total || 0;
    const products = rawProducts.map((product) => ({
      ...product,
      CreateDate: product.CreateDate ? product.CreateDate.toISOString() : null,
      UpdateDate: product.UpdateDate ? product.UpdateDate.toISOString() : null,
    }));

    return { products, totalItems };
  } catch (error) {
    throw new Error("Error executing SQL queries");
  }
}
