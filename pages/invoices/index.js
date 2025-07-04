// // pages/invoices/index.js
// import { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/router";
// import { Spinner } from "react-bootstrap";
// import { useAuth } from "hooks/useAuth";
// import InvoicesTable from "components/InvoicesTable";
// import downloadExcel from "utils/exporttoexcel";
// import { Printer } from "react-bootstrap-icons";
// import StatusBadge from "components/StatusBadge";
// import { formatDate } from "utils/formatDate";
// import Link from "next/link";
// import { formatCurrency } from "utils/formatCurrency";

// import { Download, FileText, Shield } from "lucide-react";

// // Client-side caching helpers
// const CLIENT_CACHE_TTL = 300000; // 5 minutes

// // const CLIENT_CACHE_TTL = 0; // 5 minutes
//  const columns = [
//    {
//     field: "DocNum",
//     label: "Inv#",
//     render: (value, row) => (
//       <Link href={`/invoicedetails?d=${value}&e=${row.DocEntry}`} className="text-blue-600 hover:text-blue-800">
//         {value}
//       </Link>
//     ),
//   },
//   { field: "Invoice Posting Dt.", label: "Invoice Posting Dt.", render: (v) => formatDate(v) },
//   { field: "SO No", label: "SO No", render: (v) => v || "N/A" },
//   { field: "SO Date", label: "SO Date", render: (v) => formatDate(v) },
//   { field: "Customer ref no", label: "SO Customer Ref. No", render: (v) => v || "N/A" },
//   { field: "ContactPerson", label: "Contact Person", render: (v) => v || "N/A" },
//   { field: "Item No.", label: "Item No.", render: (v) => v || "N/A" },
//   { field: "Item/Service Description", label: "Item/Service Description", render: (v) => v || "N/A" },
//   { field: "Cas No", label: "Cas No", render: (v) => v || "N/A" },
//   { field: "Vendor Catalog No.", label: "Vendor Catalog No.", render: (v) => v || "N/A" },
//   { field: "Packsize", label: "PKZ", render: (v) => v || "N/A" },
//   { field: "Qty.", label: "Qty", render: (v) => (v != null ? v : "N/A") },
//   { field: "Document Status", label: "STATUS", render: (v) => v || "N/A" },
//   { field: "Tracking Number", label: "Tracking Number", render: (v) => v || "N/A" },
//   { field: "Dispatch Date", label: "Dispatch Date", render: (v) => formatDate(v) },
//   { field: "Unit Sales Price", label: "Unit Sales Price", render: (v) => formatCurrency(v) },
//   { field: "Total Sales Price", label: "Total Sales Price/Open Value", render: (v) => formatCurrency(v) },
//   { field: "BatchNum", label: "BatchNum", render: (v) => v || "N/A" },
//   { field: "Mkt_Feedback", label: "Mkt_Feedback", render: (v) => v || "N/A" },

//  ];
// const getClientCacheKey = (query) => `invoices:${JSON.stringify(query)}`;

// const saveToClientCache = (key, data) => {
//   try {
//     const cacheEntry = {
//       timestamp: Date.now(),
//       data
//     };
//     localStorage.setItem(key, JSON.stringify(cacheEntry));
//   } catch (error) {
//     console.error('LocalStorage write error:', error);
//   }
// };

// const readFromClientCache = (key) => {
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
// };

// export default function InvoicesPage() {
//   const router = useRouter();
//   const { isAuthenticated, isLoading: authLoading } = useAuth();

//   const [invoices, setInvoices] = useState([]);
//   const [totalItems, setTotalItems] = useState(0);
//   const [fetchState, setFetchState] = useState({
//     isInitialLoad: true,
//     isLoading: false,
//     error: null,
//   });

//   // Extract query params from router
//   const {
//     page = 1,
//     search = "",
//     status = "all",
//     sortField = "DocDate",
//     sortDir = "desc",
//     fromDate,
//     toDate,
//   } = router.query;

//   // Memoize fetchInvoices to prevent unnecessary recreations
//   const fetchInvoices = useCallback(
//     async (getAll = false) => {
//       const token = localStorage.getItem("token");
//       if (!token) throw new Error("No token found");

//       const queryParams = {
//         page,
//         search,
//         status,
//         sortField,
//         sortDir,
//         fromDate,
//         toDate,
//         getAll: getAll.toString(),
//       };

//       const queryStr = new URLSearchParams(queryParams).toString();
//       const cacheKey = getClientCacheKey(queryParams);

//       if (getAll) {
//         const res = await fetch(
//           `/api/invoices?${new URLSearchParams(queryParams)}`,
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );

//         if (!res.ok) throw new Error(`Failed to fetch. Status: ${res.status}`);

//         const { invoices: allInvoices } = await res.json();
//         return allInvoices;
//       }

//       // Check client cache first
//       // const cacheKey = getClientCacheKey(queryParams);
//       // const cached = readFromClientCache(cacheKey);
//       // if (cached) return cached;
//       if (!getAll) {
//         const cacheKey = getClientCacheKey(queryParams);

//         const cached = readFromClientCache(cacheKey);

//         // ✅ Now cached is declared before using it
//         const maxPages = Math.ceil((cached?.totalItems || 0) / 20); // assuming 20 items per page
//         if (page > maxPages) {
//           localStorage.removeItem(cacheKey);
//         }

//         if (cached) return cached;
//       }

//       // Use API route that handles Redis on the server side
//       const res = await fetch(
//         `/api/invoices?${new URLSearchParams(queryParams)}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       if (!res.ok) throw new Error(`Failed to fetch. Status: ${res.status}`);

//       const { invoices: newInvoices, totalItems: newTotalItems } =
//         await res.json();

//       // Save to client cache
//       saveToClientCache(cacheKey, {
//         invoices: newInvoices,
//         totalItems: newTotalItems,
//       });

//       return { invoices: newInvoices, totalItems: newTotalItems };
//     },
//     [page, search, status, sortField, sortDir, fromDate, toDate]
//   );

 

//   // Updated handleExcelDownload function with proper formatting
//   const handleExcelDownload = useCallback(async () => {
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         console.error("No token found");
//         return;
//       }

//       const queryParams = {
//         status: router.query.status || "all",
//         search: router.query.search || "",
//         sortField: router.query.sortField || "DocDate",
//         sortDir: router.query.sortDir || "desc",
//         fromDate: router.query.fromDate || "",
//         toDate: router.query.toDate || "",
//         getAll: "true",
//       };

//       const response = await fetch(
//         `/api/invoices?${new URLSearchParams(queryParams)}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

//       const { invoices: allInvoices } = await response.json();

//       if (allInvoices?.length > 0) {
//         const excelData = allInvoices.map((invoice) => {
//           const row = {};

//           columns.forEach((column) => {
//             // Get the column field and value
//             const fieldName = column.field;
//             const value = invoice[fieldName];

//             // Special handling for different field types
//             if (fieldName === "Invoice Posting Dt.") {
//               // Format date properly for Excel
//               row[column.label] = formatDate(value);
//             } else if (fieldName === "SO Date") {
//               row[column.label] = formatDate(value);
//             } else if (fieldName === "Dispatch Date") {
//               row[column.label] = formatDate(value);
//             }
//             // Currency fields need explicit handling
//             else if (fieldName === "Unit Sales Price") {
//               row[column.label] = formatCurrency(value);
//             } else if (fieldName === "Total Sales Price") {
//               row[column.label] = formatCurrency(value);
//             } else if (fieldName === "Tax Amount") {
//               row[column.label] = formatCurrency(value);
//             }
//             // Default case
//             else {
//               row[column.label] = value != null ? value : "N/A";
//             }
//           });

//           return row;
//         });

//         downloadExcel(excelData, `Invoices_${queryParams.status}`);
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
//       // Only show loading on initial load or if we have no data
//       setFetchState((prev) => ({
//         ...prev,
//         isLoading: prev.isInitialLoad || invoices.length === 0,
//         error: null,
//       }));

//       try {
//         const { invoices: newInvoices, totalItems: newTotalItems } =
//           await fetchInvoices();

//         if (isMounted) {
//           setInvoices(newInvoices || []);
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
//   }, [isAuthenticated, fetchInvoices]);

//   // Handle route changes
//   useEffect(() => {
//     const handleRouteStart = () => {
//       // Only show loading if we don't have data
//       if (invoices.length === 0) {
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
//   }, [router, invoices.length]);

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
//         <p className="text-red-600">
//           Error loading invoices: {fetchState.error}
//         </p>
//       </div>
//     );
//   }

//   return (
//     <InvoicesTable
//       invoices={invoices}
//       totalItems={totalItems}
//       isLoading={fetchState.isInitialLoad || fetchState.isLoading}
//       status={status}
//       onExcelDownload={handleExcelDownload}
//       columns={columns}
//     />
//   );
// }

// InvoicesPage.seo = {
//   title: "Invoices | Density",
//   description: "View and manage all your invoices.",
//   keywords: "invoices, billing, management, density",
// };


// pages/invoices.js
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Spinner } from "react-bootstrap";
import { useAuth } from "hooks/useAuth";
import InvoicesTable from "components/invoices/InvoicesTable";

export default function InvoicesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`/api/invoices?getAll=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch invoices: ${response.status}`);
      }

      const { invoices } = await response.json();
      setInvoices(invoices);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchInvoices();
    }
  }, [isAuthenticated, fetchInvoices]);

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
    <InvoicesTable
      invoices={invoices}
      isLoading={loading}
    />
  );
}

InvoicesPage.seo = {
  title: "Invoices | Density",
  description: "View and manage all your invoices.",
  keywords: "invoices, billing, management, density",
};