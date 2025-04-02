// pages/invoices/index.js
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Spinner } from "react-bootstrap";
import { useAuth } from "hooks/useAuth";
import InvoicesTable from "components/InvoicesTable";
import downloadExcel from "utils/exporttoexcel";

// Client-side caching helpers
const CLIENT_CACHE_TTL = 0; // 5 minutes

const getClientCacheKey = (query) => `invoices:${JSON.stringify(query)}`;

const saveToClientCache = (key, data) => {
  try {
    const cacheEntry = {
      timestamp: Date.now(),
      data
    };
    localStorage.setItem(key, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error('LocalStorage write error:', error);
  }
};

const readFromClientCache = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { timestamp, data } = JSON.parse(cached);

    if (Date.now() - timestamp > CLIENT_CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error('LocalStorage read error:', error);
    return null;
  }
};

export default function InvoicesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [fetchState, setFetchState] = useState({
    isInitialLoad: true,
    isLoading: false,
    error: null
  });

  // Extract query params from router
  const { page = 1, search = "", status = "all", sortField = "DocDate", sortDir = "desc", fromDate, toDate } = router.query;

  // Memoize fetchInvoices to prevent unnecessary recreations
  const fetchInvoices = useCallback(async (getAll = false) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const queryParams = {
      page,
      search,
      status,
      sortField,
      sortDir,
      fromDate,
      toDate,
      getAll: getAll.toString()
    };

    if (getAll) {
      const res = await fetch(`/api/invoices?${new URLSearchParams(queryParams)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed to fetch. Status: ${res.status}`);

      const { invoices: allInvoices } = await res.json();
      return allInvoices;
    }

    // Check client cache first
    const cacheKey = getClientCacheKey(queryParams);
    const cached = readFromClientCache(cacheKey);
    if (cached) return cached;

    // Use API route that handles Redis on the server side
    const res = await fetch(`/api/invoices?${new URLSearchParams(queryParams)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Failed to fetch. Status: ${res.status}`);

    const { invoices: newInvoices, totalItems: newTotalItems } = await res.json();

    // Save to client cache
    saveToClientCache(cacheKey, { invoices: newInvoices, totalItems: newTotalItems });

    return { invoices: newInvoices, totalItems: newTotalItems };
  }, [page, search, status, sortField, sortDir, fromDate, toDate]);

   const handleExcelDownload = useCallback(async () => {
    try {
      // Fetch all invoices with the same filters
      const allInvoices = await fetchInvoices(true);

      if (allInvoices && allInvoices.length > 0) {
        // Use the existing downloadExcel utility
        downloadExcel(allInvoices, `Invoices_${status}`);
      } else {
        alert("No data available to export.");
      }
    } catch (error) {
      console.error("Failed to fetch data for Excel export:", error);
      alert("Failed to export data. Please try again.");
    }
  }, [fetchInvoices, status]);

  // Handle data fetching
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // Only show loading on initial load or if we have no data
      setFetchState(prev => ({
        ...prev,
        isLoading: prev.isInitialLoad || invoices.length === 0,
        error: null
      }));

      try {
        const { invoices: newInvoices, totalItems: newTotalItems } = await fetchInvoices();

        if (isMounted) {
          setInvoices(newInvoices || []);
          setTotalItems(newTotalItems || 0);
          setFetchState({
            isInitialLoad: false,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        if (isMounted) {
          setFetchState({
            isInitialLoad: false,
            isLoading: false,
            error: error.message
          });
        }
      }
    };

    if (isAuthenticated) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, fetchInvoices]);

  // Handle route changes
  useEffect(() => {
    const handleRouteStart = () => {
      // Only show loading if we don't have data
      if (invoices.length === 0) {
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
  }, [router, invoices.length]);

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
        <p className="text-red-600">Error loading invoices: {fetchState.error}</p>
      </div>
    );
  }

  return (
    <InvoicesTable
      invoices={invoices}
      totalItems={totalItems}
      isLoading={fetchState.isInitialLoad || fetchState.isLoading}
      status={status}
    />
  );
}

InvoicesPage.seo = {
  title: "Invoices | Density",
  description: "View and manage all your invoices.",
  keywords: "invoices, billing, management, density",
};