// pages/products/index.js
import { useState, useEffect } from "react";
import LoadingSpinner from "components/LoadingSpinner";
import ProductsTable from "components/ProductsTable";
import { useRouter } from "next/router";

export default function ProductsPage({
  products: initialProducts,
  totalItems: initialTotalItems,
  currentPage,
  search,
  sortField,
  sortDir,
  error,
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState(initialProducts);
  const [totalItems, setTotalItems] = useState(initialTotalItems);
  const [status, setStatus] = useState("all");

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

  // Fetch products whenever status changes
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const { page = 1, search = "", sortField = "ItemCode", sortDir = "asc" } = router.query;
        // Determine protocol: this example assumes HTTPS
        const host = window.location.host;
        const apiUrl = `https://${host}/api/products`;

        const res = await fetch(
          `${apiUrl}?page=${page}&search=${search}&sortField=${sortField}&sortDir=${sortDir}&status=${status}`
        );

        if (!res.ok) throw new Error("Failed to fetch products");

        const data = await res.json();

        setProducts(data.products);
        setTotalItems(data.totalItems);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [status, router.query]);

  // Update local state when props change
  useEffect(() => {
    setProducts(initialProducts);
    setTotalItems(initialTotalItems);
  }, [initialProducts, initialTotalItems]);

  // Handle status change
  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    // setCurrentPage(1); // Reset pagination when status changes, if needed
  };

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
      status={status}
      onStatusChange={handleStatusChange} // Pass status handler to the table
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
  const {
    page = 1,
    search = "",
    sortField = "ItemCode",
    sortDir = "asc",
    status = "all",
  } = context.query;

  const protocol = context.req.headers["x-forwarded-proto"] || "http";
  const host = context.req.headers.host || "localhost:3000";
  const apiUrl = `${protocol}://${host}/api/products`;

  try {
    const res = await fetch(
      `${apiUrl}?page=${page}&search=${search}&sortField=${sortField}&sortDir=${sortDir}&status=${status}`
    );

    if (!res.ok) throw new Error("Failed to fetch products");

    const data = await res.json();

    const products = Array.isArray(data.products) ? data.products : [];
    const totalItems = data.totalItems || 0;

    return {
      props: {
        products, // will be renamed to initialProducts in the component
        totalItems, // will be renamed to initialTotalItems
        currentPage: parseInt(page, 10),
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return {
      props: {
        products: [],
        totalItems: 0,
        currentPage: 1,
        error: "Failed to fetch products",
      },
    };
  }
}