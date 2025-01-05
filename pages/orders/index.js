// pages/orders/index.js

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Spinner } from "react-bootstrap";
import { useAuth } from "hooks/useAuth";
import LoadingSpinner from "components/LoadingSpinner";
import OrdersTable from "components/OrdersTable";

/**
 * OrdersPage: Fetches orders client-side from /api/orders with Bearer token.
 */
export default function OrdersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Local states
  const [orders, setOrders] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Grab query params from URL if you support them: ?page=2, etc.
  const {
    page = 1,
    search = "",
    status = "all",
    sortField = "DocNum",
    sortDir = "asc",
    fromDate,
    toDate,
  } = router.query;

  /**
   * Optional: show spinner during route transitions (page changes).
   */
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

  /**
   * Fetch orders from /api/orders when user is authenticated.
   */
  useEffect(() => {
    async function fetchOrders() {
      try {
        setIsLoading(true);

        // 1) Ensure user is authenticated
        if (!isAuthenticated) {
          return;
        }

        // 2) Get token from localStorage
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found in localStorage");
          return;
        }

        // 3) Build query string from router.query
        const queryParams = new URLSearchParams({
          page,
          search,
          status,
          sortField,
          sortDir,
        });
        if (fromDate) queryParams.append("fromDate", fromDate);
        if (toDate) queryParams.append("toDate", toDate);

        // 4) Make the request, including Authorization header
        const response = await fetch(`/api/orders?${queryParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch orders from API");
        }

        // 5) Parse the JSON result
        const data = await response.json();
        setOrders(data.orders || []);
        setTotalItems(data.totalItems || 0);
        setCurrentPage(data.currentPage || 1);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [
    isAuthenticated,
    page,
    search,
    status,
    sortField,
    sortDir,
    fromDate,
    toDate,
  ]);

  /**
   * If still checking auth, show spinner
   */
  if (authLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <Spinner animation="border" role="status" style={{ color: "#007bff" }}>
          <span className="sr-only">Loading...</span>
        </Spinner>
        <div className="ms-3">Checking authentication...</div>
      </div>
    );
  }

  /**
   * If not authenticated, return null or redirect
   */
  if (!isAuthenticated) {
    return null;
  }

  /**
   * Render OrdersTable with the data
   */
  return (
    <OrdersTable
      orders={orders}
      totalItems={totalItems}
      currentPage={currentPage}
      isLoading={isLoading}
    />
  );
}

// Next.js SEO
OrdersPage.seo = {
  title: "Orders | Density",
  description: "View and manage all your orders.",
  keywords: "orders, density",
};

// Remove or comment out getServerSideProps if you previously used it
/*
export async function getServerSideProps(context) {
  // Not needed anymore if we're fetching token-based data client side
}
*/

