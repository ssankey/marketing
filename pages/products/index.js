

// pages/products/index.js
import { useState, useEffect } from "react";
import LoadingSpinner from "components/LoadingSpinner";
import ProductsTable from "components/ProductsTable";
import { useRouter } from "next/router";

export default function ProductsPage({
  products: initialProducts,
  totalItems: initialTotalItems,
}) {
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

// export async function getServerSideProps(context) {
//   const { page = 1, search = "", sortField = "ItemCode", sortDir = "asc" } = context.query;

//   const protocol = context.req.headers["x-forwarded-proto"] || "http";
//   const host = context.req.headers.host || "localhost:3000";
//   const apiUrl = `${protocol}://${host}/api/products`;

//   const res = await fetch(`${apiUrl}?page=${page}&search=${search}&sortField=${sortField}&sortDir=${sortDir}`);
//   const data = await res.json();

//   const products = Array.isArray(data.products) ? data.products : [];
//   const totalItems = data.totalItems || 0;

//   return {
//     props: {
//       products,
//       totalItems,
//       currentPage: parseInt(page, 10),
//     },
//   };
// }

export async function getServerSideProps(context) {
  const {
    page = 1,
    search = "",
    sortField = "ItemCode",
    sortDir = "asc",
  } = context.query;

  const protocol = context.req.headers["x-forwarded-proto"] || "http";
  const host = context.req.headers.host || "localhost:3000";
  const apiUrl = `${protocol}://${host}/api/products`;

  const res = await fetch(
    `${apiUrl}?page=${page}&search=${search}&sortField=${sortField}&sortDir=${sortDir}`
  );
  const data = await res.json();

  const products = Array.isArray(data.products) ? data.products : [];
  const totalItems = data.totalItems || 0;

  return {
    props: {
      products,
      totalItems,
      currentPage: parseInt(page, 10),
    },
  };
}
