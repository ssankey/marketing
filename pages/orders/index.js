// import { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/router";
// import { Spinner } from "react-bootstrap";
// import { useAuth } from "hooks/useAuth";
// import OrdersTable from "components/OrdersTable";
// import downloadExcel from "utils/exporttoexcel";
// import { formatDate } from "utils/formatDate";
// import { formatCurrency } from "utils/formatCurrency";
// import { truncateText } from "utils/truncateText";

// // Add these helper functions at the top of the file
// const CLIENT_CACHE_TTL = 0; // 5 minutes

// function getClientCacheKey(query, userId) {
//   return `orders:${userId}:${JSON.stringify(query)}`;
// }

// function saveToClientCache(key, data) {
//   try {
//     const cacheEntry = {
//       timestamp: Date.now(),
//       data
//     };
//     localStorage.setItem(key, JSON.stringify(cacheEntry));
//   } catch (error) {
//     console.error('LocalStorage write error:', error);
//   }
// }

// function readFromClientCache(key) {
//   try {
//     const cached = localStorage.getItem(key);
//     if (!cached) return null;

//     const { timestamp, data } = JSON.parse(cached);

//     if (Date.now() - timestamp > CLIENT_CACHE_TTL) {
//       localStorage.removeItem(key);
//       return null;
//     }

//     return data;
//   } catch (error) {
//     console.error('LocalStorage read error:', error);
//     return null;
//   }
// }

// export default function OrdersPage() {
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

//   // Memoize fetchOrders to prevent unnecessary recreations
//   const fetchOrders = useCallback(async (getAllRecords = false) => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       throw new Error("No token found in localStorage");
//     }

//     const queryParams = {
//       page,
//       search,
//       status,
//       sortField,
//       sortDir,
//       fromDate,
//       toDate,
//       getAll: getAllRecords.toString() // Convert to string for API
//     };

//     if (!getAllRecords) {
//       const cacheKey = getClientCacheKey(queryParams);
//       const cached = readFromClientCache(cacheKey);
//       if (cached) {
//         return cached;
//       }
//     }

//     const response = await fetch(`/api/orders?${new URLSearchParams(queryParams)}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     if (!response.ok) {
//       throw new Error(`Failed to fetch orders. Status: ${response.status}`);
//     }

//     const { orders: newOrders, totalItems: newTotalItems } = await response.json();

//     if (!getAllRecords) {
//       const cacheKey = getClientCacheKey(queryParams);
//       saveToClientCache(cacheKey, { orders: newOrders, totalItems: newTotalItems });
//     }

//     return { orders: newOrders, totalItems: newTotalItems };
//   }, [page, search, status, sortField, sortDir, fromDate, toDate]);

//   // const handleExcelDownload = async () => {
//   //   try {
//   //     // Fetch all records with the same filters
//   //     const { orders: allOrders } = await fetchOrders(true);

//   //     // Prepare data for Excel export
//   //     if (allOrders && allOrders.length > 0) {
//   //       // Map the orders to match the table columns exactly
//   //       const excelData = allOrders.map(order => ({
//   //         "Order#": order.DocNum,
//   //         "Order Status": order.DocStatus,
//   //         "Customer PONo": order.CustomerPONo || "N/A",
//   //         "Customer": truncateText(order.CardName, 20),
//   //         "Order Date": formatDate(order.DocDate), // Format to date only
//   //         "Product Count": order.ProductCount || "N/A",
//   //         "Delivery Date": formatDate(order.DeliveryDate), // Format to date only
//   //         "Total Amount": formatCurrency(
//   //           order.DocCur === "INR" ? order.DocTotal : order.DocTotal * order.ExchangeRate
//   //         ),
//   //         "Currency": order.DocCur || "N/A",
//   //         "Sales Employee": order.SalesEmployee || "N/A",
//   //         "Contact Person": order.ContactPerson || "N/A"
//   //       }));

//   //       downloadExcel(excelData, `Orders_${status}`);
//   //     } else {
//   //       alert("No data available to export.");
//   //     }
//   //   } catch (error) {
//   //     console.error("Failed to fetch data for Excel export:", error);
//   //     alert("Failed to export data. Please try again.");
//   //   }
//   // };
//   const handleExcelDownload = async () => {
//   try {
//     const { orders: allOrders } = await fetchOrders(true);

//     if (allOrders && allOrders.length > 0) {
//       // These match the columns inside OrdersTable
//       const columns = [
//         { field: "DocNum", label: "Order#" },
//         { field: "DocStatus", label: "Order Status" },
//         { field: "CustomerPONo", label: "Customer PONo" },
//         { field: "CardName", label: "Customer" },
//         { field: "DocDate", label: "Order Date", isDate: true },
//         { field: "DeliveryDate", label: "Delivery Date", isDate: true },
//         { field: "DocTotal", label: "Total Amount", isCurrency: true },
//         { field: "DocCur", label: "Currency" },
//         { field: "SalesEmployee", label: "Sales Employee" },
//         { field: "ContactPerson", label: "Contact Person" },
//         { field: "EmailSentDT", label: "Mail Sent", isDate: true }
//       ];

//       const excelData = allOrders.map(order => {
//         const row = {};
//         columns.forEach(({ field, label, isCurrency, isDate }) => {
//           let value = order[field];

//           if (isCurrency) {
//             value = order.DocCur === "INR"
//               ? order[field]
//               : order[field] * (order.ExchangeRate || 1);
//             row[label] = formatCurrency(value || 0);
//           } else if (isDate) {
//             row[label] = value ? formatDate(value) : "N/A";
//           } else {
//             row[label] = value ?? "N/A";
//           }
//         });
//         return row;
//       });

//       downloadExcel(excelData, `Orders_${status}`);
//     } else {
//       alert("No data available to export.");
//     }
//   } catch (error) {
//     console.error("Failed to fetch data for Excel export:", error);
//     alert("Failed to export data. Please try again.");
//   }
// };


//   // Handle data fetching
//   useEffect(() => {
//     let isMounted = true;

//     const loadData = async () => {
//       // Only show loading on initial load or if we have no data
//       setFetchState(prev => ({
//         ...prev,
//         isLoading: prev.isInitialLoad || orders.length === 0,
//         error: null
//       }));

//       try {
//         const { orders: newOrders, totalItems: newTotalItems } = await fetchOrders();

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
//   }, [isAuthenticated, fetchOrders]);

//   // Handle route changes
//   useEffect(() => {
//     const handleRouteStart = () => {
//       // Only show loading if we don't have data
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
//         <p className="text-red-600">Error loading orders: {fetchState.error}</p>
//       </div>
//     );
//   }

//   return (
//     <OrdersTable
//       orders={orders}
//       totalItems={totalItems}
//       isLoading={fetchState.isInitialLoad || fetchState.isLoading}
//       status={status}
//       onExcelDownload={handleExcelDownload}
//     />
//   );
// }

// OrdersPage.seo = {
//   title: "Orders | Density",
//   description: "View and manage all your orders.",
//   keywords: "orders, density",
// };

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Spinner } from "react-bootstrap";
import { useAuth } from "hooks/useAuth";
import OrdersTable from "components/OrdersTable";
import downloadExcel from "utils/exporttoexcel";
import { formatDate } from "utils/formatDate";
import { formatCurrency } from "utils/formatCurrency";
import { truncateText } from "utils/truncateText";
import Link from "next/link";

// Add these helper functions at the top of the file
const CLIENT_CACHE_TTL = 0; // 5 minutes

function getClientCacheKey(query, userId) {
  return `orders:${userId}:${JSON.stringify(query)}`;
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

// Define columns configuration
const columns = [
  {
    field: "DocNum",
    label: "Order#",
    sortable: true,
    // render function will be added in OrdersTable component
  },
  {
    field: "DocStatus",
    label: "Order Status",
    render: (value) => {
      let cls = "bg-danger";
      if (value === "Open") cls = "bg-primary";
      if (value === "Partial") cls = "bg-warning";
      if (value === "Closed") cls = "bg-success";
      if (value === "Cancelled") cls = "bg-secondary";
      return <span className={`badge ${cls}`}>{value || 'N/A'}</span>;
    },
  },
  {
    field: "CustomerPONo",
    label: "Customer PONo",
    // render function will be added in OrdersTable component
  },
  {
    field: "CardName",
    label: "Customer",
    render: (v) => truncateText(v || 'N/A', 20),
    sortable: true,
  },
  {
    field: "DocDate",
    label: "Order Date",
    render: (v) => formatDate(v),
    sortable: true,
  },
  {
    field: "DeliveryDate",
    label: "Delivery Date",
    render: (v) => formatDate(v),
    sortable: true,
  },
  {
    field: "DocTotal",
    label: "Total Amount",
    render: (value, row) => {
      const amt = row.DocCur === "INR" ? value : value * (row.ExchangeRate || 1);
      return formatCurrency(amt || 0);
    },
    sortable: true,
  },
  {
    field: "SalesEmployee",
    label: "Sales Employee",
    render: (v) => v || "N/A",
  },
  {
    field: "ContactPerson",
    label: "Contact Person",
    render: (v) => v || "N/A",
  },
  {
    field: "EmailSentDT",
    label: "Mail Sent",
    // render function will be added in OrdersTable component
  },
  {
    field: "DocNum",
    label: "Details",
    render: (value, row) => (
      <Link href={`/orderdetails?d=${value}&e=${row.DocEntry}`}>
        View Details
      </Link>
    )
  }
];

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

    if (!getAllRecords) {
      const cacheKey = getClientCacheKey(queryParams);
      saveToClientCache(cacheKey, { orders: newOrders, totalItems: newTotalItems });
    }

    return { orders: newOrders, totalItems: newTotalItems };
  }, [page, search, status, sortField, sortDir, fromDate, toDate]);

  const handleExcelDownload = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      // Define which fields are currency and which are dates
      const currencyFields = new Set(["DocTotal"]);
      const dateFields = new Set(["DocDate", "DeliveryDate", "EmailSentDT"]);

      // Build query params with getAll=true
      const queryParams = {
        status: router.query.status || "all",
        search: router.query.search || "",
        sortField: router.query.sortField || "DocNum",
        sortDir: router.query.sortDir || "asc",
        fromDate: router.query.fromDate || "",
        toDate: router.query.toDate || "",
        getAll: "true",
      };

      const url = `/api/orders?${new URLSearchParams(queryParams)}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const { orders: allOrders } = await response.json();

      if (allOrders && allOrders.length > 0) {
        // Prepare data for Excel export matching the table columns
        const excelData = allOrders.map((order) => {
          const row = {};

          columns.forEach((column) => {
            const value = order[column.field];
            
            // Apply formatting based on field type
            if (currencyFields.has(column.field) && value) {
              // Calculate amount considering exchange rate
              const amt = order.DocCur === "INR" ? value : value * (order.ExchangeRate || 1);
              row[column.label] = formatCurrency(amt);
            } else if (dateFields.has(column.field) && value) {
              row[column.label] = formatDate(value);
            } else if (column.field === "CardName") {
              // Don't truncate in Excel export
              row[column.label] = value || "N/A";
            } else if (column.field === "EmailSentDT") {
              // Handle mail sent field for Excel
              if (order.EmailSentDT) {
                const dt = new Date(order.EmailSentDT);
                const hasTime = order.EmailSentTM !== null && order.EmailSentTM !== undefined;
                const h = hasTime ? Math.floor(order.EmailSentTM / 60) : dt.getHours();
                const m = hasTime ? order.EmailSentTM % 60 : dt.getMinutes();
                const day = String(dt.getDate()).padStart(2, "0");
                const month = String(dt.getMonth() + 1).padStart(2, "0");
                const year = dt.getFullYear();
                row[column.label] = `${day}/${month}/${year} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
              } else {
                row[column.label] = "Not Sent";
              }
            } else if (column.label === "Details") {
              // Skip the Details column in Excel export
              return;
            } else {
              row[column.label] = value || "N/A";
            }
          });

          return row;
        });

        // Define column styles for Excel
        const columnStyles = columns
          .filter(column => column.label !== "Details") // Exclude Details column
          .map(column => {
            const style = {};
            
            if (currencyFields.has(column.field)) {
              style.cellFormat = '#,##0.00;[Red]-#,##0.00'; // Excel currency format
            } else if (dateFields.has(column.field)) {
              style.cellFormat = 'dd/mm/yyyy'; // Excel date format
            }
            
            return style;
          });

        // Download with formatting
        downloadExcel(
          excelData, 
          `Orders_${status}`,
          columnStyles
        );
      } else {
        alert("No data available to export.");
      }
    } catch (error) {
      console.error("Failed to export to Excel:", error);
      alert("Failed to export data. Please try again.");
    }
  }, [router.query, status]);

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
      columns={columns}
      onExcelDownload={handleExcelDownload}
    />
  );
}

OrdersPage.seo = {
  title: "Orders | Density",
  description: "View and manage all your orders.",
  keywords: "orders, density",
};