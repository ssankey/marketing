// pages/quotation/index.js

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "hooks/useAuth";
import { Spinner } from "react-bootstrap";
import LoadingSpinner from "components/LoadingSpinner";
import QuotationsTable from "components/QuotationsTable";

export default function QuotationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Local state for quotations, total items, and loading
  const [quotations, setQuotations] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Extract query params from router
  const {
    page = 1,
    search = "",
    status = "all",
    sortField = "DocNum",
    sortDir = "desc",
    fromDate,
    toDate,
  } = router.query;

  /**
   * Handle client-side route transitions (e.g., when user navigates or changes query)
   * This is optional but helps show a spinner during route changes.
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
   * Fetch quotations using the JWT token from localStorage.
   */
  useEffect(() => {
    async function fetchQuotations() {
      try {
        setIsLoading(true);

        // 1) Get token from localStorage
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found in localStorage");
          return;
        }

        // 2) Build query string from current router query
        const queryParams = new URLSearchParams({
          page,
          search,
          status,
          sortField,
          sortDir,
        });

        // Only include fromDate/toDate if they exist
        if (fromDate) queryParams.append("fromDate", fromDate);
        if (toDate) queryParams.append("toDate", toDate);

        // 3) Make the request to /api/quotations
        const response = await fetch(`/api/quotations?${queryParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch quotations from API");
        }

        // 4) Parse JSON
        const { quotations, totalItems } = await response.json();
        setQuotations(quotations || []);
        setTotalItems(totalItems || 0);
      } catch (error) {
        console.error("Error fetching quotations:", error);
      } finally {
        setIsLoading(false);
      }
    }

    // Fetch only if user is authenticated
    if (isAuthenticated) {
      fetchQuotations();
    }
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
   * Show a loader while checking authentication (from useAuth).
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
   * If not authenticated, return null (or redirect, etc.)
   */
  if (!isAuthenticated) {
    return null;
  }

  /**
   * Otherwise, render the table with the fetched quotations
   */
  return (
    <QuotationsTable
      quotations={quotations}
      totalItems={totalItems}
      isLoading={isLoading}
    />
  );
}

/** SEO properties for the page (Next.js Head tags, etc.) */
QuotationsPage.seo = {
  title: "Quotations | Density",
  description: "View and manage all your quotations.",
  keywords: "quotations, density",
};
