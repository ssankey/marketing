


// // pages/invoices/pendingDispatch.js
// import { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/router";
// import { Spinner } from "react-bootstrap";
// import { useAuth } from "hooks/useAuth";
// import InvoicesTable from "components/HeaderInvoiceTable"; // Changed to use HeaderInvoiceTable


//   import downloadExcel from "utils/exporttoexcel";
//   import { Printer } from "react-bootstrap-icons";
//   import StatusBadge from "components/StatusBadge";
//   import { formatDate } from "utils/formatDate";
//   import Link from "next/link";
//   import { formatCurrency } from "utils/formatCurrency";

//   const columns = [
//     {
//       field: "DocNum",
//       label: "Invoice#",
//       render: (value, row) => (
//         <>
//           <Link
//             href={`/invoicedetails?d=${value}&e=${row.DocEntry}`}
//             className="text-blue-600 hover:text-blue-800"
//           >
//             {value}
//           </Link>
         
//         </>
//       ),
//       sortable: true,
//     },
//     {
//       field: "DocStatusDisplay",
//       label: "Status",
//       render: (value) => (
//         <span
//           className={`badge ${
//             value === "Closed"
//               ? "bg-success"
//               : value === "Cancelled"
//               ? "bg-warning"
//               : "bg-danger"
//           }`}
//         >
//           {value}
//         </span>
//       ),
//     },
//     {
//       field: "LineItemCount",
//       label: "Items",
//       render: (value) => value ?? 0,
//     },
//     {
//       field: "DocDate",
//       label: "Invoice Date",
//       render: (value) => formatDate(value),
//       sortable: true,
//     },
//     {
//       field: "DocDueDate",
//       label: "Due Date",
//       render: (value) => formatDate(value),
//       sortable: true,
//     },
//     {
//       field: "U_DispatchDate",
//       label: "Dispatch Date",
//       render: (value) => (value ? formatDate(value) : "Pending"),
//     },
//     {
//       field: "CardCode",
//       label: "Customer Code",
//       render: (value) => value || "N/A",
//     },
//     {
//       field: "CardName",
//       label: "Customer Name",
//       render: (value) => value || "N/A",
//       sortable: true,
//     },
//     // {
//     //   field: "CustomerGroup",
//     //   label: "Customer Group",
//     //   render: (value) => value || "N/A",
//     // },
//     //   {
//     //     field: "NumAtCard",
//     //     label: "Customer PO#",
//     //     render: (value) => value || "N/A"
//     //   },
//     {
//       field: "DocTotal",
//       label: "Total Amount",
//       render: (value) => formatCurrency(value),
//       sortable: true,
//     },
//     {
//       field: "DocCur",
//       label: "Currency",
//       render: (value) => value || "N/A",
//     },
//     {
//       field: "VatSum",
//       label: "Tax Amount",
//       render: (value) => formatCurrency(value),
//     },
//     {
//       field: "TaxDate",
//       label: "Tax Date",
//       render: (value) => formatDate(value),
//     },
//     //   {
//     //     field: "U_DispatchDate",
//     //     label: "Dispatch Date",
//     //     render: (value) => (value ? formatDate(value) : "Pending")
//     //   },
//     {
//       field: "TrackNo",
//       label: "Tracking #",
//       render: (value) => value || "N/A",
//     },
//     {
//       field: "TransportName",
//       label: "Transport",
//       render: (value) => value || "N/A",
//     },
//     {
//       field: "PaymentGroup",
//       label: "Payment Terms",
//       render: (value) => value || "N/A",
//     },
//     {
//       field: "Country",
//       label: "Country",
//       render: (value) => value || "N/A",
//     },
//     {
//       field: "SalesEmployee",
//       label: "Sales Person",
//       render: (value) => value || "N/A",
//     },
//     {
//       field: "ContactPerson",
//       label: "Contact Person",
//       render: (value) => value || "N/A",
//     },
//   ];

// export default function PendingDispatchInvoicesPage() {
//   const router = useRouter();
//   const { isAuthenticated, isLoading: authLoading } = useAuth();

//   const [invoices, setInvoices] = useState([]);
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
//     sortField = "DocDate",
//     sortDir = "desc",
//     fromDate,
//     toDate,
//   } = router.query;

//   // Fetch all pending dispatch invoices for Excel export
//   const fetchAllInvoices = async () => {
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

//     const response = await fetch(`/api/invoices/pendingDispatch?${queryParams}`, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`Failed to fetch invoices. Status: ${response.status}`);
//     }

//     const data = await response.json();
//     return data.invoices || [];
//   };

//   const fetchInvoices = useCallback(async () => {
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

//     const response = await fetch(`/api/invoices/pendingDispatch?${queryParams}`, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`Failed to fetch invoices. Status: ${response.status}`);
//     }

//     return response.json();
//   }, [page, search, status, sortField, sortDir, fromDate, toDate]);

// //   const handleExcelDownload = useCallback(async () => {
// //     try {
// //       const token = localStorage.getItem("token");
// //       if (!token) {
// //         console.error("No token found");
// //         return;
// //       }

// //       // Build query params with getAll=true
// //       const queryParams = {
// //         status: router.query.status || "all",
// //         search: router.query.search || "",
// //         sortField: router.query.sortField || "DocDate",
// //         sortDir: router.query.sortDir || "desc",
// //         fromDate: router.query.fromDate || "",
// //         toDate: router.query.toDate || "",
// //         getAll: "true",
// //       };

// //       const url = `/api/invoices/pendingDispatch?${new URLSearchParams(
// //         queryParams
// //       )}`;

// //       const response = await fetch(url, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });

// //       if (!response.ok) {
// //         throw new Error(`Failed to fetch: ${response.status}`);
// //       }

// //       const { invoices: allInvoices } = await response.json();

// //       if (allInvoices && allInvoices.length > 0) {
// //         // Prepare data for Excel export matching the table columns
// //         // const excelData = allInvoices.map((invoice) => {
// //         //   const row = {};

// //         //   columns.forEach((column) => {
// //         //     const value = invoice[column.field];
// //         //     row[column.label] = value || "N/A";
// //         //   });

// //         //   return row;
// //         // });
// //         const excelData = allInvoices.map((invoice) => {
// //   const row = {};

// //   columns.forEach((column) => {
// //     const rawValue = invoice[column.field];
// //     const label = column.label.toLowerCase();

// //     if (
// //       label.includes("amount") ||
// //       label.includes("price") ||
// //       label.includes("total") ||
// //       label.includes("tax")
// //     ) {
// //       row[column.label] = formatCurrency(rawValue || 0);
// //     } else if (
// //       label.includes("date") ||
// //       column.field.toLowerCase().includes("date")
// //     ) {
// //       row[column.label] = rawValue ? formatDate(rawValue) : "N/A";
// //     } else {
// //       row[column.label] = rawValue ?? "N/A";
// //     }
// //   });

// //   return row;
// // });


// //         downloadExcel(excelData, `Invoices_${queryParams.status}`);
// //       } else {
// //         alert("No data available to export.");
// //       }
// //     } catch (error) {
// //       console.error("Failed to export to Excel:", error);
// //       alert("Failed to export data. Please try again.");
// //     }
// //   }, [router.query]);

//   const handleExcelDownload = useCallback(async () => {
//   try {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       console.error("No token found");
//       return;
//     }

//     // Define which fields are currency and which are dates
//     const currencyFields = new Set(["DocTotal", "VatSum"]);
//     const dateFields = new Set(["DocDate", "DocDueDate", "U_DispatchDate", "TaxDate"]);

//     // Build query params with getAll=true
//     const queryParams = {
//       status: router.query.status || "all",
//       search: router.query.search || "",
//       sortField: router.query.sortField || "DocDate",
//       sortDir: router.query.sortDir || "desc",
//       fromDate: router.query.fromDate || "",
//       toDate: router.query.toDate || "",
//       getAll: "true",
//     };

//     const url = `/api/invoices/pendingDispatch?${new URLSearchParams(queryParams)}`;

//     const response = await fetch(url, {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     if (!response.ok) {
//       throw new Error(`Failed to fetch: ${response.status}`);
//     }

//     const { invoices: allInvoices } = await response.json();

//     if (allInvoices && allInvoices.length > 0) {
//       // Prepare data for Excel export matching the table columns
//       const excelData = allInvoices.map((invoice) => {
//         const row = {};

//         columns.forEach((column) => {
//           const value = invoice[column.field];
          
//           // Apply formatting based on field type
//           if (currencyFields.has(column.field) && value) {
//             row[column.label] = formatCurrency(value);
//           } else if (dateFields.has(column.field) && value) {
//             row[column.label] = formatDate(value);
//           } else {
//             row[column.label] = value || "N/A";
//           }
//         });

//         return row;
//       });

//       // Define column styles for Excel
//       const columnStyles = columns.map(column => {
//         const style = {};
        
//         if (currencyFields.has(column.field)) {
//           style.cellFormat = '#,##0.00;[Red]-#,##0.00'; // Excel currency format
//         } else if (dateFields.has(column.field)) {
//           style.cellFormat = 'dd/mm/yyyy'; // Excel date format
//         }
        
//         return style;
//       });

//       // Download with formatting
//       downloadExcel(
//         excelData, 
//         `PendingDispatchInvoices`,
//         columnStyles
//       );
//     } else {
//       alert("No data available to export.");
//     }
//   } catch (error) {
//     console.error("Failed to export to Excel:", error);
//     alert("Failed to export data. Please try again.");
//   }
// }, [router.query]);

//   useEffect(() => {
//     let isMounted = true;

//     const loadData = async () => {
//       setFetchState((prev) => ({
//         ...prev,
//         isLoading: prev.isInitialLoad || invoices.length === 0,
//         error: null,
//       }));

//       try {
//         const { invoices: newInvoices, totalItems: newTotalItems } = await fetchInvoices();
        
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

//   useEffect(() => {
//     const handleRouteStart = () => {
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
//         <p className="text-red-600">Error loading invoices: {fetchState.error}</p>
//       </div>
//     );
//   }

//   return (
//     <InvoicesTable
//       invoices={invoices}
//       totalItems={totalItems}
//       isLoading={fetchState.isInitialLoad || fetchState.isLoading}
//       status={status}
//       fetchAllInvoices={fetchAllInvoices}
//       onExcelDownload={handleExcelDownload}
//       columns={columns}
//     />
//   );
// }

// PendingDispatchInvoicesPage.seo = {
//   title: "Pending Dispatch Invoices | Density",
//   description: "View and manage invoices pending dispatch.",
//   keywords: "invoices, pending dispatch, density",
// };


import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Spinner } from "react-bootstrap";
import { useAuth } from "hooks/useAuth";
import PendingDispatchTable from "components/pendingDispatch/PendingDispatchTable";

export default function PendingDispatchInvoicesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`/api/invoices/pendingDispatch?getAll=true`, {
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
    <PendingDispatchTable
      invoices={invoices}
      isLoading={loading}
    />
  );
}

PendingDispatchInvoicesPage.seo = {
  title: "Pending Dispatch Invoices | Density",
  description: "View and manage all your pending dispatch invoices.",
  keywords: "invoices, pending dispatch, sales management",
};