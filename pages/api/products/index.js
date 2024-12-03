// pages/api/products/index.js

import { getProducts } from "../../../lib/models/products";
import sql from 'mssql';
import cache from "../../../lib/cache"; // Import the cache instance
import compression from 'compression';

// Middleware to apply compression
const applyMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export default async function handler(req, res) {
  // Apply compression middleware
  await applyMiddleware(req, res, compression());

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { page = "1", search = "", sortField = "T0.[ItemCode]", sortDir = "asc" } = req.query;

    const ITEMS_PER_PAGE = 100;
    const pageNumber = parseInt(page, 10);
    const validPageNumber = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
    const offset = (validPageNumber - 1) * ITEMS_PER_PAGE;

    // Generate a unique cache key based on query parameters
    const cacheKey = `products:${page}:${search}:${sortField}:${sortDir}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    let whereClause = "1=1";
    const countParams = [];
    const dataParams = [];

    if (search) {
      // Optimize LIKE usage without leading wildcard
      whereClause += ` AND (
        T0.[ItemCode] LIKE @search OR 
        T0.[ItemName] LIKE @search
      )`;
      
      // Use 'search%' instead of '%search%' to leverage indexes
      const searchParam = { name: 'search', type: sql.VarChar, value: `${search}%` };
      countParams.push(searchParam);
      dataParams.push(searchParam);
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM [dbo].[OITM] T0
      INNER JOIN [dbo].[OITB] T1 ON T0.[ItmsGrpCod] = T1.[ItmsGrpCod]
      INNER JOIN [dbo].[OITW] T2 ON T0.[ItemCode] = T2.[ItemCode]
      LEFT JOIN [dbo].[OBTN] T5 ON T0.[ItemCode] = T5.[ItemCode]
      WHERE ${whereClause};
    `;

    const dataQuery = `
      SELECT 
        T0.[ItemCode] AS Cat_size_main,
        T0.[ItemName] AS english,
        T0.[U_ALTCAT] AS Cat_No,
        T0.[U_CasNo] AS Cas,
        T0.[U_MolucularFormula],
        T0.[U_MolucularWeight],
        T0.[U_MSDS],
        T5.[U_COA],
        T0.[U_Purity],
        T0.[U_Smiles],
        T1.[ItmsGrpNam],
        T0.[U_WebsiteDisplay],
        T0.[U_MeltingPoint],
        T0.[U_BoilingPoint],
        T0.[U_Appearance],
        T0.[U_UNNumber],
        T2.[OnHand] AS Stock_In_India,
        T0.U_ChinaStock AS Stock_In_China,
        -- Removed columns from T4 (@PRICING_R)
        T0.[ItemType],
        T0.[validFor],
        T0.[validFrom],
        T0.[validTo],
        T0.[CreateDate],
        T0.[UpdateDate],
        T0.[U_IUPACName],
        T0.[U_Synonyms],
        T0.[U_Applications],
        T0.[U_Structure]
      FROM [dbo].[OITM] T0
      INNER JOIN [dbo].[OITB] T1 ON T0.[ItmsGrpCod] = T1.[ItmsGrpCod]
      INNER JOIN [dbo].[OITW] T2 ON T0.[ItemCode] = T2.[ItemCode]
      LEFT JOIN [dbo].[OBTN] T5 ON T0.[ItemCode] = T5.[ItemCode]
      WHERE ${whereClause}
      ORDER BY ${sortField} ${sortDir}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY;
    `;

    dataParams.push(
      { name: 'offset', type: sql.Int, value: offset },
      { name: 'limit', type: sql.Int, value: ITEMS_PER_PAGE }
    );

    const [totalResult, rawProducts] = await Promise.all([
      getProducts(countQuery, countParams),
      getProducts(dataQuery, dataParams),
    ]);

    const totalItems = parseInt(totalResult[0]?.total || "0", 10);
    const products = rawProducts.map((product) => ({
      ...product,
      CreateDate: product.CreateDate ? new Date(product.CreateDate).toISOString() : null,
      UpdateDate: product.UpdateDate ? new Date(product.UpdateDate).toISOString() : null,
    }));

    const responseData = {
      products: Array.isArray(products) ? products : [],
      totalItems,
      currentPage: validPageNumber,
    };

    // Store the response data in cache
    cache.set(cacheKey, responseData);

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      products: [],
      totalItems: 0,
      currentPage: 1,
      error: "Failed to fetch products",
    });
  }
}
