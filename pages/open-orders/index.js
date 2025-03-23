// import { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/router";
// import { Spinner } from "react-bootstrap";
// import { useAuth } from "hooks/useAuth";
// import OpenOrdersTable from "components/OpenOrdersTable";

// export default function OpenOrdersPage() {
//   const router = useRouter();
//   const { isAuthenticated, isLoading: authLoading } = useAuth();

//   const [orders, setOrders] = useState([]);
//   const [totalItems, setTotalItems] = useState(0);
//   const [fetchState, setFetchState] = useState({
//     isInitialLoad: true,
//     isLoading: false,
//     error: null
//   });

//   // Extract query params from router
//   const {
//     page = 1,
//     search = "",
//     status = "all",
//     sortField = "DocNum",
//     sortDir = "asc",
//     fromDate,
//     toDate,
//   } = router.query;

//   // Memoize fetchOpenOrders to prevent unnecessary recreations
//   const fetchOpenOrders = useCallback(async () => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       throw new Error("No token found in localStorage");
//     }

//     const queryParams = new URLSearchParams({
//       page,
//       search,
//       status,
//       sortField,
//       sortDir,
//     });
//     if (fromDate) queryParams.set("fromDate", fromDate);
//     if (toDate) queryParams.set("toDate", toDate);

//     const response = await fetch(`/api/open-orders?${queryParams}`, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`Failed to fetch open orders. Status: ${response.status}`);
//     }

//     return response.json();
//   }, [page, search, status, sortField, sortDir, fromDate, toDate]);

//   // Handle data fetching
//   useEffect(() => {
//     let isMounted = true;

//     const loadData = async () => {
//       setFetchState(prev => ({
//         ...prev,
//         isLoading: prev.isInitialLoad || orders.length === 0,
//         error: null
//       }));

//       try {
//         const { orders: newOrders, totalItems: newTotalItems } = await fetchOpenOrders();
        
//         if (isMounted) {
//           setOrders(newOrders || []);
//           setTotalItems(newTotalItems || 0);
//           setFetchState({
//             isInitialLoad: false,
//             isLoading: false,
//             error: null
//           });
//         }
//       } catch (error) {
//         if (isMounted) {
//           setFetchState({
//             isInitialLoad: false,
//             isLoading: false,
//             error: error.message
//           });
//         }
//       }
//     };

//     if (isAuthenticated) {
//       loadData();
//     }

//     return () => {
//       isMounted = false;
//     };
//   }, [isAuthenticated, fetchOpenOrders]);

//   // Handle route changes
//   useEffect(() => {
//     const handleRouteStart = () => {
//       if (orders.length === 0) {
//         setFetchState(prev => ({ ...prev, isLoading: true }));
//       }
//     };

//     const handleRouteEnd = () => {
//       setFetchState(prev => ({ ...prev, isLoading: false }));
//     };

//     router.events.on("routeChangeStart", handleRouteStart);
//     router.events.on("routeChangeComplete", handleRouteEnd);
//     router.events.on("routeChangeError", handleRouteEnd);

//     return () => {
//       router.events.off("routeChangeStart", handleRouteStart);
//       router.events.off("routeChangeComplete", handleRouteEnd);
//       router.events.off("routeChangeError", handleRouteEnd);
//     };
//   }, [router, orders.length]);

//   if (authLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <Spinner animation="border" role="status" variant="primary" />
//         <span className="ml-3">Checking authentication...</span>
//       </div>
//     );
//   }

//   if (!isAuthenticated) {
//     return null;
//   }

//   if (fetchState.error) {
//     return (
//       <div className="text-center py-8">
//         <p className="text-red-600">Error loading open orders: {fetchState.error}</p>
//       </div>
//     );
//   }

//   return (
//     <OpenOrdersTable
//       orders={orders}
//       totalItems={totalItems}
//       isLoading={fetchState.isInitialLoad || fetchState.isLoading}
//       status={status}
//     />
//   );
// }

// OpenOrdersPage.seo = {
//   title: "Open Orders | Density",
//   description: "View and manage all your open orders with stock details.",
//   keywords: "open orders, sales, stock management",
// };


// pages/open-orders/index.js
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Spinner } from "react-bootstrap";
import { useAuth } from "hooks/useAuth";
import OpenOrdersTable from "components/OpenOrdersTable";

export default function OpenOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [fetchState, setFetchState] = useState({
    isInitialLoad: true,
    isLoading: false,
    error: null,
  });

  const {
    page = 1,
    search = "",
    status = "all",
    sortField = "DocNum",
    sortDir = "asc",
    fromDate,
    toDate,
  } = router.query;

  const fetchAllOpenOrders = async () => {
    const token = localStorage.getItem("token");
    const queryParams = new URLSearchParams({
      page: 1,
      search,
      status,
      sortField,
      sortDir,
      fromDate: fromDate || "",
      toDate: toDate || "",
      getAll: true, // <-- add this to support full fetch
    });

    const response = await fetch(`/api/open-orders?${queryParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    return data.orders || [];
  };

  const fetchOpenOrders = useCallback(async () => {
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
    if (fromDate) queryParams.set("fromDate", fromDate);
    if (toDate) queryParams.set("toDate", toDate);

    const response = await fetch(`/api/open-orders?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch open orders. Status: ${response.status}`);
    }

    return response.json();
  }, [page, search, status, sortField, sortDir, fromDate, toDate]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setFetchState((prev) => ({
        ...prev,
        isLoading: prev.isInitialLoad || orders.length === 0,
        error: null,
      }));

      try {
        const { orders: newOrders, totalItems: newTotalItems } = await fetchOpenOrders();

        if (isMounted) {
          setOrders(newOrders || []);
          setTotalItems(newTotalItems || 0);
          setFetchState({
            isInitialLoad: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        if (isMounted) {
          setFetchState({
            isInitialLoad: false,
            isLoading: false,
            error: error.message,
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
  }, [isAuthenticated, fetchOpenOrders]);

  useEffect(() => {
    const handleRouteStart = () => {
      if (orders.length === 0) {
        setFetchState((prev) => ({ ...prev, isLoading: true }));
      }
    };

    const handleRouteEnd = () => {
      setFetchState((prev) => ({ ...prev, isLoading: false }));
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
        <p className="text-red-600">Error loading open orders: {fetchState.error}</p>
      </div>
    );
  }

  return (
    <OpenOrdersTable
      orders={orders}
      totalItems={totalItems}
      isLoading={fetchState.isInitialLoad || fetchState.isLoading}
      status={status}
      fetchAllOpenOrders={fetchAllOpenOrders} // pass as prop
    />
  );
}