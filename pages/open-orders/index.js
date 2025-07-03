// // import { useState, useEffect, useCallback } from "react";
// // import { useRouter } from "next/router";
// // import { Spinner } from "react-bootstrap";
// // import { useAuth } from "hooks/useAuth";
// // import OpenOrdersTable from "components/OpenOrdersTable";

// // export default function OpenOrdersPage() {
// //   const router = useRouter();
// //   const { isAuthenticated, isLoading: authLoading } = useAuth();

// //   const [orders, setOrders] = useState([]);
// //   const [totalItems, setTotalItems] = useState(0);
// //   const [fetchState, setFetchState] = useState({
// //     isInitialLoad: true,
// //     isLoading: false,
// //     error: null
// //   });

// //   // Extract query params from router
// //   const {
// //     page = 1,
// //     search = "",
// //     status = "all",
// //     sortField = "DocNum",
// //     sortDir = "asc",
// //     fromDate,
// //     toDate,
// //   } = router.query;

// //   // Memoize fetchOpenOrders to prevent unnecessary recreations
// //   const fetchOpenOrders = useCallback(async () => {
// //     const token = localStorage.getItem("token");
// //     if (!token) {
// //       throw new Error("No token found in localStorage");
// //     }

// //     const queryParams = new URLSearchParams({
// //       page,
// //       search,
// //       status,
// //       sortField,
// //       sortDir,
// //     });
// //     if (fromDate) queryParams.set("fromDate", fromDate);
// //     if (toDate) queryParams.set("toDate", toDate);

// //     const response = await fetch(`/api/open-orders?${queryParams}`, {
// //       headers: {
// //         Authorization: `Bearer ${token}`,
// //       },
// //     });

// //     if (!response.ok) {
// //       throw new Error(`Failed to fetch open orders. Status: ${response.status}`);
// //     }

// //     return response.json();
// //   }, [page, search, status, sortField, sortDir, fromDate, toDate]);

// //   // Handle data fetching
// //   useEffect(() => {
// //     let isMounted = true;

// //     const loadData = async () => {
// //       setFetchState(prev => ({
// //         ...prev,
// //         isLoading: prev.isInitialLoad || orders.length === 0,
// //         error: null
// //       }));

// //       try {
// //         const { orders: newOrders, totalItems: newTotalItems } = await fetchOpenOrders();
        
// //         if (isMounted) {
// //           setOrders(newOrders || []);
// //           setTotalItems(newTotalItems || 0);
// //           setFetchState({
// //             isInitialLoad: false,
// //             isLoading: false,
// //             error: null
// //           });
// //         }
// //       } catch (error) {
// //         if (isMounted) {
// //           setFetchState({
// //             isInitialLoad: false,
// //             isLoading: false,
// //             error: error.message
// //           });
// //         }
// //       }
// //     };

// //     if (isAuthenticated) {
// //       loadData();
// //     }

// //     return () => {
// //       isMounted = false;
// //     };
// //   }, [isAuthenticated, fetchOpenOrders]);

// //   // Handle route changes
// //   useEffect(() => {
// //     const handleRouteStart = () => {
// //       if (orders.length === 0) {
// //         setFetchState(prev => ({ ...prev, isLoading: true }));
// //       }
// //     };

// //     const handleRouteEnd = () => {
// //       setFetchState(prev => ({ ...prev, isLoading: false }));
// //     };

// //     router.events.on("routeChangeStart", handleRouteStart);
// //     router.events.on("routeChangeComplete", handleRouteEnd);
// //     router.events.on("routeChangeError", handleRouteEnd);

// //     return () => {
// //       router.events.off("routeChangeStart", handleRouteStart);
// //       router.events.off("routeChangeComplete", handleRouteEnd);
// //       router.events.off("routeChangeError", handleRouteEnd);
// //     };
// //   }, [router, orders.length]);

// //   if (authLoading) {
// //     return (
// //       <div className="flex items-center justify-center min-h-screen">
// //         <Spinner animation="border" role="status" variant="primary" />
// //         <span className="ml-3">Checking authentication...</span>
// //       </div>
// //     );
// //   }

// //   if (!isAuthenticated) {
// //     return null;
// //   }

// //   if (fetchState.error) {
// //     return (
// //       <div className="text-center py-8">
// //         <p className="text-red-600">Error loading open orders: {fetchState.error}</p>
// //       </div>
// //     );
// //   }

// //   return (
// //     <OpenOrdersTable
// //       orders={orders}
// //       totalItems={totalItems}
// //       isLoading={fetchState.isInitialLoad || fetchState.isLoading}
// //       status={status}
// //       searchTerm={search}
// //       fromDate={fromDate}
// //       toDate={toDate}
// //       sortField={sortField}
// //       sortDirection={sortDir}
// //     />
// //   );
// // }

// // OpenOrdersPage.seo = {
// //   title: "Open Orders | Density",
// //   description: "View and manage all your open orders with stock details.",
// //   keywords: "open orders, sales, stock management",
// // };

// import { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/router";
// import { Spinner } from "react-bootstrap";
// import { useAuth } from "hooks/useAuth";
// import OpenOrdersTable from "components/OpenOrdersTable";
// import downloadExcel from "utils/exporttoexcel";
// import { Printer } from "react-bootstrap-icons";
// import StatusBadge from "components/StatusBadge";
// import { formatDate } from "utils/formatDate";
// import Link from "next/link";
// import { formatCurrency } from "utils/formatCurrency";
// import { truncateText } from "utils/truncateText";

// const columns = [
//   {
//     field: "LineStatus",
//     label: "Document Status",
//     render: (value) => (
//       <span
//         className={`badge ${
//           value === "Open"
//             ? "bg-primary"
//             : value === "Closed"
//             ? "bg-secondary"
//             : "bg-info"
//         }`}
//       >
//         {value}
//       </span>
//     ),
//     sortable: true,
//   },
//   {
//     field: "DocumentNumber",
//     label: "SO Number",
//     render: (value, row) => (
//       <Link
//         href={`/orderdetails?d=${value}&e=${row.DocEntry}`}
//         className="text-blue-600 hover:text-blue-800"
//       >
//         {value}
//       </Link>
//     ),
//     sortable: true,
//   },
//   {
//     field: "PostingDate",
//     label: "Posting Date",
//     render: (value) => formatDate(value),
//     sortable: true,
//   },
//   {
//     field: "CustomerPONo",
//     label: "Customer PO No",
//     render: (value) => value || "N/A",
//   },
//   {
//     field: "PODate",
//     label: "PO Date",
//     render: (value) => formatDate(value),
//     sortable: true,
//   },
//   {
//     field: "CustomerVendorName",
//     label: "Customer/Vendor Name",
//     render: (value) => truncateText(value, 20),
//     sortable: true,
//   },
//   {
//     field: "ContactPerson",
//     label: "Contact Person",
//     render: (value) => value || "N/A",
//   },
//   {
//     field: "ItemNo",
//     label: "Item No.",
//     render: (value) => value || "N/A",
//   },
//   {
//     field: "MfrCatalogNo",
//     label: "Mfr Catalog No.",
//     render: (value) => value || "N/A",
//   },
//   {
//     field: "UOMName",
//     label: "PKZ",
//     render: (value) => value || "N/A",
//   },
//   {
//     field: "ItemName",
//     label: "Item Name",
//     render: (value) => truncateText(value, 25),
//   },
//   {
//     field: "CasNo",
//     label: "Cas No",
//     render: (value) => value || "N/A",
//   },
//   {
//     field: "Quantity",
//     label: "Quantity Order",
//     render: (value) => value || "0",
//   },
//   {
//     field: "OpenQty",
//     label: "Open Qty",
//     render: (value) => value || "0",
//   },
//   {
//     field: "DeliveredQuantity",
//     label: "Delivered Quantity",
//     render: (value) => value || "0",
//   },
//   {
//     field: "StockStatus",
//     label: "Stock Status-In hyd",
//     render: (value) => (
//       <span
//         className={`badge ${
//           value === "In Stock" ? "bg-success" : "bg-danger"
//         }`}
//       >
//         {value}
//       </span>
//     ),
//   },
//   {
//     field: "DeliveryDate",
//     label: "Delivery Date",
//     render: (value) => formatDate(value),
//     sortable: true,
//   },
//   {
//     field: "Timeline",
//     label: "Timeline",
//     render: (value) => value || "N/A",
//   },
//   {
//     field: "MktFeedback",
//     label: "Mkt_Feedback",
//     render: (value) => value || "N/A",
//   },
//   {
//     field: "Price",
//     label: "Price",
//     render: (value, row) => formatCurrency(value, row.PriceCurrency),
//     sortable: true,
//   },
//   {
//     field: "OpenAmount",
//     label: "OPEN AMOUNT",
//     render: (value, row) => formatCurrency(value, row.PriceCurrency),
//     sortable: true,
//   },
//   {
//     field: "SalesEmployee",
//     label: "Sales Employee",
//     render: (value) => value || "N/A",
//   },
// ];

// export default function OpenOrdersPage() {
//   const router = useRouter();
//   const { isAuthenticated, isLoading: authLoading } = useAuth();

//   const [orders, setOrders] = useState([]);
//   const [totalItems, setTotalItems] = useState(0);
//   const [fetchState, setFetchState] = useState({
//     isInitialLoad: true,
//     isLoading: false,
//     error: null,
//   });

//   const {
//     page = 1,
//     search = "",
//     status = "all",
//     sortField = "PostingDate",
//     sortDir = "desc",
//     fromDate,
//     toDate,
//   } = router.query;

//   // Fetch all orders for Excel export
//   const fetchAllOrders = async () => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       throw new Error("No token found in localStorage");
//     }

//     const queryParams = new URLSearchParams({
//       page: 1,
//       search,
//       status,
//       sortField,
//       sortDir,
//       fromDate: fromDate || "",
//       toDate: toDate || "",
//       getAll: "true",
//     });

//     const response = await fetch(`/api/open-orders?${queryParams}`, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`Failed to fetch orders. Status: ${response.status}`);
//     }

//     const data = await response.json();
//     return data.orders || [];
//   };

//   const fetchOrders = useCallback(async () => {
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
//       throw new Error(`Failed to fetch orders. Status: ${response.status}`);
//     }

//     return response.json();
//   }, [page, search, status, sortField, sortDir, fromDate, toDate]);

//   const handleExcelDownload = useCallback(async () => {
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         console.error("No token found");
//         return;
//       }

//       // Define which fields are currency and which are dates
//       const currencyFields = new Set(["Price", "OpenAmount"]);
//       const dateFields = new Set(["PostingDate", "PODate", "DeliveryDate"]);

//       // Build query params with getAll=true
//       const queryParams = {
//         status: router.query.status || "all",
//         search: router.query.search || "",
//         sortField: router.query.sortField || "PostingDate",
//         sortDir: router.query.sortDir || "desc",
//         fromDate: router.query.fromDate || "",
//         toDate: router.query.toDate || "",
//         getAll: "true",
//       };

//       const url = `/api/open-orders?${new URLSearchParams(queryParams)}`;

//       const response = await fetch(url, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to fetch: ${response.status}`);
//       }

//       const { orders: allOrders } = await response.json();

//       if (allOrders && allOrders.length > 0) {
//         // Prepare data for Excel export matching the table columns
//         const excelData = allOrders.map((order) => {
//           const row = {};

//           columns.forEach((column) => {
//             const value = order[column.field];
            
//             // Apply formatting based on field type
//             if (currencyFields.has(column.field) && value) {
//               row[column.label] = formatCurrency(value, order.PriceCurrency);
//             } else if (dateFields.has(column.field) && value) {
//               row[column.label] = formatDate(value);
//             } else if (column.field === "CustomerVendorName" && value) {
//               row[column.label] = value; // Don't truncate in Excel
//             } else if (column.field === "ItemName" && value) {
//               row[column.label] = value; // Don't truncate in Excel
//             } else {
//               row[column.label] = value || "N/A";
//             }
//           });

//           return row;
//         });

//         // Define column styles for Excel
//         const columnStyles = columns.map(column => {
//           const style = {};
          
//           if (currencyFields.has(column.field)) {
//             style.cellFormat = '#,##0.00;[Red]-#,##0.00'; // Excel currency format
//           } else if (dateFields.has(column.field)) {
//             style.cellFormat = 'dd/mm/yyyy'; // Excel date format
//           }
          
//           return style;
//         });

//         // Download with formatting
//         downloadExcel(
//           excelData, 
//           `OpenOrders`,
//           columnStyles
//         );
//       } else {
//         alert("No data available to export.");
//       }
//     } catch (error) {
//       console.error("Failed to export to Excel:", error);
//       alert("Failed to export data. Please try again.");
//     }
//   }, [router.query]);

//   useEffect(() => {
//     let isMounted = true;

//     const loadData = async () => {
//       setFetchState((prev) => ({
//         ...prev,
//         isLoading: prev.isInitialLoad || orders.length === 0,
//         error: null,
//       }));

//       try {
//         const { orders: newOrders, totalItems: newTotalItems } = await fetchOrders();
        
//         if (isMounted) {
//           setOrders(newOrders || []);
//           setTotalItems(newTotalItems || 0);
//           setFetchState({
//             isInitialLoad: false,
//             isLoading: false,
//             error: null,
//           });
//         }
//       } catch (error) {
//         if (isMounted) {
//           setFetchState({
//             isInitialLoad: false,
//             isLoading: false,
//             error: error.message,
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

//   useEffect(() => {
//     const handleRouteStart = () => {
//       if (orders.length === 0) {
//         setFetchState((prev) => ({ ...prev, isLoading: true }));
//       }
//     };

//     const handleRouteEnd = () => {
//       setFetchState((prev) => ({ ...prev, isLoading: false }));
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
//     <OpenOrdersTable
//       orders={orders}
//       totalItems={totalItems}
//       isLoading={fetchState.isInitialLoad || fetchState.isLoading}
//       status={status}
//       fetchAllOrders={fetchAllOrders}
//       onExcelDownload={handleExcelDownload}
//       columns={columns}
//     />
//   );
// }

// OpenOrdersPage.seo = {
//   title: "Open Orders | Density",
//   description: "View and manage all your open orders with stock details.",
//   keywords: "open orders, sales, stock management",
// };

// pages/open-orders.js
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Spinner } from "react-bootstrap";
import { useAuth } from "hooks/useAuth";
import OpenOrdersTable from "components/openOrders/OpenOrdersTable";

export default function OpenOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`/api/open-orders?getAll=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch open orders: ${response.status}`);
      }

      const { orders } = await response.json();
      setOrders(orders);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);

  if (authLoading) {
    return <div>Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <OpenOrdersTable
      orders={orders}
      isLoading={loading}
    />
  );
}

OpenOrdersPage.seo = {
  title: "Open Orders | Density",
  description: "View and manage all your open orders with stock details.",
  keywords: "open orders, sales, stock management",
};