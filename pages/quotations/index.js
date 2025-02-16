// pages/quotation/index.js
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useAuth } from "hooks/useAuth";
import { Spinner } from "react-bootstrap";
import QuotationsTable from "components/QuotationsTable";

export default function QuotationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // Separate states for data and loading
  const [quotations, setQuotations] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [fetchState, setFetchState] = useState({
    isInitialLoad: true,
    isLoading: false,
    error: null
  });

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

  // Memoize fetchQuotations to prevent unnecessary recreations
  const fetchQuotations = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found in localStorage");
      }

      const queryParams = new URLSearchParams({
        page,
        search,
        status,
        sortField,
        sortDir,
      });

      if (fromDate) queryParams.append("fromDate", fromDate);
      if (toDate) queryParams.append("toDate", toDate);

      const response = await fetch(`/api/quotations?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch quotations");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }, [page, search, status, sortField, sortDir, fromDate, toDate]);

  // Handle data fetching
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // Don't set loading true if we already have data (prevents table flicker)
      setFetchState(prev => ({
        ...prev,
        isLoading: prev.isInitialLoad,
        error: null
      }));

      try {
        const { quotations: newQuotations, totalItems: newTotalItems } = await fetchQuotations();
        
        if (isMounted) {
          setQuotations(newQuotations || []);
          setTotalItems(newTotalItems || 0);
          setFetchState(prev => ({
            isInitialLoad: false,
            isLoading: false,
            error: null
          }));
        }
      } catch (error) {
        if (isMounted) {
          setFetchState(prev => ({
            ...prev,
            isInitialLoad: false,
            isLoading: false,
            error: error.message
          }));
        }
      }
    };

    if (isAuthenticated) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, fetchQuotations]);

  // Handle route changes separately
  useEffect(() => {
    const handleRouteStart = () => {
      // Only show loading if we don't have data yet
      if (quotations.length === 0) {
        setFetchState(prev => ({ ...prev, isLoading: true }));
      }
    };

    const handleRouteEnd = () => {
      setFetchState(prev => ({ ...prev, isLoading: false }));
    };

    router.events.on("routeChangeStart", handleRouteStart);
    router.events.on("routeChangeComplete", handleRouteEnd);
    router.events.on("routeChangeError", handleRouteEnd);

    return () => {
      router.events.off("routeChangeStart", handleRouteStart);
      router.events.off("routeChangeComplete", handleRouteEnd);
      router.events.off("routeChangeError", handleRouteEnd);
    };
  }, [router, quotations.length]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner animation="border" role="status" variant="primary" />
        <span className="ml-3">Checking authentication...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (fetchState.error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading quotations: {fetchState.error}</p>
      </div>
    );
  }

  return (
    <QuotationsTable
      quotations={quotations}
      totalItems={totalItems}
      isLoading={fetchState.isInitialLoad || fetchState.isLoading}
    />
  );
}

QuotationsPage.seo = {
  title: "Quotations | Density",
  description: "View and manage all your quotations.",
  keywords: "quotations, density",
};