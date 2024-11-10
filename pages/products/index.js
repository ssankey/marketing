// import { useState, useEffect } from "react";
// import LoadingSpinner from "components/LoadingSpinner";
// import ProductsTable from "components/ProductsTable";
// import { getProducts } from "lib/models/products";
// import { useRouter } from "next/router";
// import { useAuth } from "../../utils/useAuth";

// export default function ProductsPage({
//   products: initialProducts,
//   totalItems: initialTotalItems,
// }) {
//   useAuth(); // Protect the product page

//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(false);
//   const [products, setProducts] = useState(initialProducts);
//   const [totalItems, setTotalItems] = useState(initialTotalItems);

//   // Handle loading state for client-side transitions
//   useEffect(() => {
//     const handleStart = () => setIsLoading(true);
//     const handleComplete = () => setIsLoading(false);

//     router.events.on("routeChangeStart", handleStart);
//     router.events.on("routeChangeComplete", handleComplete);
//     router.events.on("routeChangeError", handleComplete);

//     return () => {
//       router.events.off("routeChangeStart", handleStart);
//       router.events.off("routeChangeComplete", handleComplete);
//       router.events.off("routeChangeError", handleComplete);
//     };
//   }, [router]);

//   // Update local state when props change
//   useEffect(() => {
//     setProducts(initialProducts);
//     setTotalItems(initialTotalItems);
//   }, [initialProducts, initialTotalItems]);

//   if (router.isFallback) {
//     return <LoadingSpinner />;
//   }

//   return (
//     <ProductsTable
//       products={products}
//       totalItems={totalItems}
//       isLoading={isLoading}
//     />
//   );
// }

// // Static SEO properties for ProductsPage
// ProductsPage.seo = {
//   title: "Products | Density",
//   description: "View and manage all your products.",
//   keywords: "products, density",
// };

// export async function getServerSideProps(context) {
//   try {
//     const {
//       page = 1,
//       search = "",
//       sortField = "ItemCode",
//       sortDir = "asc",
//     } = context.query;

//     const ITEMS_PER_PAGE = 20;
//     const offset = (parseInt(page, 10) - 1) * ITEMS_PER_PAGE;

//     let whereClause = "1=1";

//     if (search) {
//       whereClause += ` AND (
//           ItemCode LIKE '%${search}%' OR 
//           ItemName LIKE '%${search}%'
//         )`;
//     }

//     const countQuery = `
//       SELECT COUNT(*) as total
//       FROM OITM
//       WHERE ${whereClause};
//     `;

//     const dataQuery = `
//       SELECT
//         ItemCode,
//         ItemName,
//         ItemType,
//         validFor,
//         validFrom,
//         validTo,
//         CreateDate,
//         UpdateDate,
//         U_CasNo,
//         U_IUPACName,
//         U_Synonyms,
//         U_MolucularFormula,
//         U_MolucularWeight,
//         U_Applications,
//         U_Structure
//       FROM OITM
//       WHERE ${whereClause}
//       ORDER BY ${sortField} ${sortDir}
//       OFFSET ${offset} ROWS
//       FETCH NEXT ${ITEMS_PER_PAGE} ROWS ONLY;
//     `;

//     const [totalResult, rawProducts] = await Promise.all([
//       getProducts(countQuery),
//       getProducts(dataQuery),
//     ]);

//     const totalItems = totalResult[0]?.total || 0;
//     const products = rawProducts.map((product) => ({
//       ...product,
//       CreateDate: product.CreateDate ? product.CreateDate.toISOString() : null,
//       UpdateDate: product.UpdateDate ? product.UpdateDate.toISOString() : null,
//     }));

//     return {
//       props: {
//         products: Array.isArray(products) ? products : [],
//         totalItems,
//         currentPage: parseInt(page, 10),
//       },
//     };
//   } catch (error) {
//     console.error("Error fetching products:", error);
//     return {
//       props: {
//         products: [],
//         totalItems: 0,
//       },
//     };
//   }
// }


import { useState, useEffect } from "react";
import LoadingSpinner from "components/LoadingSpinner";
import ProductsTable from "components/ProductsTable";
import { getProducts } from "lib/models/products";
import { useRouter } from "next/router";
import { useAuth } from "../../utils/useAuth";

export default function ProductsPage({
  products: initialProducts,
  totalItems: initialTotalItems,
}) {
  const isAuthenticated = useAuth(); // Client-side authentication check
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState(initialProducts);
  const [totalItems, setTotalItems] = useState(initialTotalItems);

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

  // Update local state when props change
  useEffect(() => {
    setProducts(initialProducts);
    setTotalItems(initialTotalItems);
  }, [initialProducts, initialTotalItems]);

  if (router.isFallback) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <LoadingSpinner />; // Prevents rendering if not authenticated
  }

  return (
    <ProductsTable
      products={products}
      totalItems={totalItems}
      isLoading={isLoading}
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
  const token = context.req.cookies.token; // Check for token in cookies

  // Redirect to login if no token is found
  if (!token) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  try {
    const {
      page = 1,
      search = "",
      sortField = "ItemCode",
      sortDir = "asc",
    } = context.query;

    const ITEMS_PER_PAGE = 20;
    const offset = (parseInt(page, 10) - 1) * ITEMS_PER_PAGE;

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

    const [totalResult, rawProducts] = await Promise.all([
      getProducts(countQuery),
      getProducts(dataQuery),
    ]);

    const totalItems = totalResult[0]?.total || 0;
    const products = rawProducts.map((product) => ({
      ...product,
      CreateDate: product.CreateDate ? product.CreateDate.toISOString() : null,
      UpdateDate: product.UpdateDate ? product.UpdateDate.toISOString() : null,
    }));

    return {
      props: {
        products: Array.isArray(products) ? products : [],
        totalItems,
        currentPage: parseInt(page, 10),
      },
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      props: {
        products: [],
        totalItems: 0,
      },
    };
  }
}
