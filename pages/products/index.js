// pages/products.js

import { useState, useEffect } from "react";
import LoadingSpinner from "components/LoadingSpinner";
import ProductsTable from "components/ProductsTable";
import { getProducts } from "lib/models/products";
import { useRouter } from "next/router";
import sql from 'mssql'; // Import sql for parameter types
export default function ProductsPage({
  products,
  totalItems,
  currentPage,
  search,
  sortField,
  sortDir,
  error, // New prop for error handling
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Handle loading state for client-side transitions
  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  if (router.isFallback) {
    return <LoadingSpinner />;
  }

  return (
    <ProductsTable
      products={products}
      totalItems={totalItems}
      currentPage={currentPage}
      search={search}
      sortField={sortField}
      sortDir={sortDir}
      isLoading={isLoading}
      error={error} // Pass error prop
    />
  );
}

// Static SEO properties for ProductsPage
ProductsPage.seo = {
  title: "Products | Density",
  description: "View and manage all your products.",
  keywords: "products, density",
};

export async function getServerSideProps(context) {
  try {
    const {
      page = "1",
      search = "",
      sortField = "T0.[ItemCode]",
      sortDir = "asc",
    } = context.query;

    const ITEMS_PER_PAGE = 20;
    const pageNumber = parseInt(page, 10);
    const validPageNumber = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
    const offset = (validPageNumber - 1) * ITEMS_PER_PAGE;

    let whereClause = "1=1";
    
    // Parameters for countQuery
    const countParams = [];
    
    // Parameters for dataQuery
    const dataParams = [];

    if (search) {
      whereClause += ` AND (
        T0.[ItemCode] LIKE @search OR 
        T0.[ItemName] LIKE @search
      )`;
      
      // Add parameters to both countParams and dataParams
      const searchParam = { name: 'search', type: sql.VarChar, value: `%${search}%` };
      countParams.push(searchParam);
      dataParams.push(searchParam);
    }

    // Count Query with alias
    const countQuery = `
      SELECT COUNT(*) as total
      FROM [dbo].[OITM] T0
      WHERE ${whereClause};
    `;

    // Data Query with parameters
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
        T4.[U_Quantity],
        T4.[U_UOM],
        T4.[U_Price],
        T4.[U_PriceUSD],
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
      INNER JOIN [dbo].[@PRICING_H] T3 ON T0.[ItemCode] = T3.[U_Code]
      INNER JOIN [dbo].[@PRICING_R] T4 ON T3.[DocEntry] = T4.[DocEntry] AND T3.[U_Code] = T4.[U_Code]
      LEFT JOIN [dbo].[OBTN] T5 ON T0.[ItemCode] = T5.[ItemCode]
      WHERE ${whereClause}
      ORDER BY ${sortField} ${sortDir}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY;
    `;

    // Add pagination parameters to dataParams
    dataParams.push(
      { name: 'offset', type: sql.Int, value: offset },
      { name: 'limit', type: sql.Int, value: ITEMS_PER_PAGE }
    );

    // Execute both queries in parallel
    const [totalResult, rawProducts] = await Promise.all([
      getProducts(countQuery, countParams),
      getProducts(dataQuery, dataParams),
    ]);

    const totalItems = parseInt(totalResult[0]?.total || "0", 10);
    const products = rawProducts.map((product) => ({
      ...product,
      CreateDate: product.CreateDate
        ? new Date(product.CreateDate).toISOString()
        : null,
      UpdateDate: product.UpdateDate
        ? new Date(product.UpdateDate).toISOString()
        : null,
    }));

    return {
      props: {
        products: Array.isArray(products) ? products : [],
        totalItems,
        currentPage: validPageNumber,
      },
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      props: {
        products: [],
        totalItems: 0,
        currentPage: 1,
        error: "Failed to fetch products"
      },
    };
  }
}