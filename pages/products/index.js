// pages/products.js

import { useState, useEffect } from "react";
import LoadingSpinner from "components/LoadingSpinner";
import ProductsTable from "components/ProductsTable";
import { useRouter } from "next/router";

export default function ProductsPage({
  products,
  totalItems,
  currentPage,
  search,
  sortField,
  sortDir,
  error,
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
    const { query } = context;
    const { page = "1", search = "", sortField = "T0.[ItemCode]", sortDir = "asc" } = query;

    // Construct the absolute URL for the API endpoint
    const protocol = context.req.headers['x-forwarded-proto'] || 'http';
    const host = context.req.headers['host'];
    const baseUrl = `${protocol}://${host}`;

    const params = new URLSearchParams({
      page,
      search,
      sortField,
      sortDir,
    });

    const response = await fetch(`${baseUrl}/api/products?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const data = await response.json();

    return {
      props: {
        products: data.products || [],
        totalItems: data.totalItems || 0,
        currentPage: data.currentPage || 1,
        search,
        sortField,
        sortDir,
        error: data.error || null,
      },
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      props: {
        products: [],
        totalItems: 0,
        currentPage: 1,
        search: "",
        sortField: "T0.[ItemCode]",
        sortDir: "asc",
        error: "Failed to fetch products",
      },
    };
  }
}
