// pages/orders/index.js
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Spinner } from "react-bootstrap";
import { useAuth } from "hooks/useAuth";
import OrdersTable from "components/OrdersTable";
import downloadExcel from "utils/exporttoexcel";

// Add these helper functions at the top of the file
const CLIENT_CACHE_TTL = 0; // 5 minutes

function getClientCacheKey(query) {
  return `orders:${JSON.stringify(query)}`;
}

function saveToClientCache(key, data) {
  try {
    const cacheEntry = {
      timestamp: Date.now(),
      data
    };
    localStorage.setItem(key, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error('LocalStorage write error:', error);
  }
}

function readFromClientCache(key) {
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
}

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
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
    sortDir = "asc",
    fromDate,
    toDate,
  } = router.query;

  // Memoize fetchOrders to prevent unnecessary recreations
  const fetchOrders = useCallback(async (getAllRecords = false) => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const queryParams = {
      page,
      search,
      status,
      sortField,
      sortDir,
      fromDate,
      toDate,
      getAll: getAllRecords.toString() // Convert to string for API
    };

    // Check client cache first
    // const cacheKey = getClientCacheKey(queryParams);
    // const cached = readFromClientCache(cacheKey);
    // if (cached) {
    //   return cached;
    // }
    if (!getAllRecords) {
      const cacheKey = getClientCacheKey(queryParams);
      const cached = readFromClientCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const response = await fetch(`/api/orders?${new URLSearchParams(queryParams)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch orders. Status: ${response.status}`);
    }

    const { orders: newOrders, totalItems: newTotalItems } = await response.json();

    // Save to client cache
    // saveToClientCache(cacheKey, { orders: newOrders, totalItems: newTotalItems });

    if (!getAllRecords) {
      const cacheKey = getClientCacheKey(queryParams);
      saveToClientCache(cacheKey, { orders: newOrders, totalItems: newTotalItems });
    }


    return { orders: newOrders, totalItems: newTotalItems };
  }, [page, search, status, sortField, sortDir, fromDate, toDate]);

  const handleExcelDownload = async () => {
    try {
      // Fetch all records with the same filters
      const { orders: allOrders } = await fetchOrders(true);

      // Prepare data for Excel export
      if (allOrders && allOrders.length > 0) {
        // Map the orders to match the table columns exactly
        const excelData = allOrders.map(order => ({
          DocNum: order.DocNum,
          DocStatus: order.DocStatus,
          CustomerPONo: order.CustomerPONo || 'N/A',
          CardName: order.CardName,
          DocDate: order.DocDate,
          ProductCount: order.ProductCount || 'N/A',
          DeliveryDate: order.DeliveryDate,
          DocTotal: order.DocTotal,
          DocCur: order.DocCur,
          SalesEmployee: order.SalesEmployee || 'N/A'
        }));

        downloadExcel(excelData, `Orders_${status}`);
      } else {
        alert("No data available to export.");
      }
    } catch (error) {
      console.error("Failed to fetch data for Excel export:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  // Handle data fetching
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // Only show loading on initial load or if we have no data
      setFetchState(prev => ({
        ...prev,
        isLoading: prev.isInitialLoad || orders.length === 0,
        error: null
      }));

      try {
        const { orders: newOrders, totalItems: newTotalItems } = await fetchOrders();
        
        if (isMounted) {
          setOrders(newOrders || []);
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
  }, [isAuthenticated, fetchOrders]);

  // Handle route changes
  useEffect(() => {
    const handleRouteStart = () => {
      // Only show loading if we don't have data
      if (orders.length === 0) {
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
  }, [router, orders.length]);

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
        <p className="text-red-600">Error loading orders: {fetchState.error}</p>
      </div>
    );
  }

  return (
    <OrdersTable
      orders={orders}
      totalItems={totalItems}
      isLoading={fetchState.isInitialLoad || fetchState.isLoading}
      status={status}
      onExcelDownload={handleExcelDownload} 
    />
  );
}

OrdersPage.seo = {
  title: "Orders | Density",
  description: "View and manage all your orders.",
  keywords: "orders, density",
};
