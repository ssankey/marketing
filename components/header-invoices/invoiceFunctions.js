
// components/header-invoices/invoiceFunctions.js
import { useState, useEffect, useMemo, useCallback } from "react";
import { debounce } from "lodash";
import downloadExcel from "utils/exporttoexcel";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import { useRouter } from "next/router";

// export const useInvoiceData = (invoices, initialStatus, initialPage, pageSize) => {
//   const router = useRouter();
//   const [allData, setAllData] = useState(invoices);
//   const [currentPage, setCurrentPage] = useState(initialPage);
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [statusFilter, setStatusFilter] = useState(initialStatus);
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");

//   useEffect(() => {
//     setAllData(invoices);
//   }, [invoices]);

//   // Create a debounced search function
//   const debouncedSearch = useCallback(
//     debounce((searchTerm, callback) => {
//       callback(searchTerm);
//     }, 300),
//     []
//   );

//   // State for the actual filter value used in filtering
//   const [activeGlobalFilter, setActiveGlobalFilter] = useState("");

//   // Handle search input changes
//   const handleGlobalFilterChange = useCallback((value) => {
//     setGlobalFilter(value);
    
//     // For immediate feedback, set active filter right away if clearing
//     if (value === "") {
//       setActiveGlobalFilter("");
//       return;
//     }

//     // For non-empty searches, debounce the actual filtering
//     debouncedSearch(value, (debouncedValue) => {
//       setActiveGlobalFilter(debouncedValue);
//     });
//   }, [debouncedSearch]);

//   const filteredData = useMemo(() => {
//     let filtered = [...allData];

//     // Status filter
//      if (statusFilter !== "all") {
//     filtered = filtered.filter(invoice => 
//       statusFilter === "open" 
//         ? invoice.DocStatusDisplay === "Open" || invoice.DocStatusDisplay === "Partially Open"
//         : invoice.DocStatusDisplay === "Closed"
//     );
//   }

   

//      // Global search filter
//   if (activeGlobalFilter) {
//     const searchTerm = activeGlobalFilter.toLowerCase().trim();
//     if (searchTerm) {
//       filtered = filtered.filter(invoice => {
//         return (
//           (invoice.DocNum?.toString().toLowerCase().includes(searchTerm)) ||
//           (invoice.CardName?.toLowerCase().includes(searchTerm)) ||
//           (invoice.CardCode?.toLowerCase().includes(searchTerm)) ||
//           (invoice.NumAtCard?.toLowerCase().includes(searchTerm)) ||
//           (invoice.TrackNo?.toLowerCase().includes(searchTerm)) ||
//           (invoice.TransportName?.toLowerCase().includes(searchTerm)) ||
//           (invoice.ContactPerson?.toLowerCase().includes(searchTerm)) ||
//           (invoice.SalesEmployee?.toLowerCase().includes(searchTerm)) ||
//           (invoice.DocCur?.toLowerCase().includes(searchTerm)) ||
//           (invoice.DocStatusDisplay?.toLowerCase().includes(searchTerm)) ||
//           (invoice.LineItemCount?.toString().includes(searchTerm)) ||
//           (invoice.DocTotal?.toString().includes(searchTerm)) ||
//           (invoice.Comments?.toLowerCase().includes(searchTerm)) ||
//           (invoice.SeriesName?.toLowerCase().includes(searchTerm)) ||
//           (invoice.PaymentStatus?.toLowerCase().includes(searchTerm)) ||
//           (invoice.CustomerGroup?.toLowerCase().includes(searchTerm)) ||
//           (invoice.GSTIN?.toLowerCase().includes(searchTerm)) ||
//           (invoice.Country?.toLowerCase().includes(searchTerm)) ||
//           (invoice.State?.toLowerCase().includes(searchTerm))
//         );
//       });
//     }
//   }

//     // Date range filter
//     if (fromDate || toDate) {
//       filtered = filtered.filter(invoice => {
//         const invoiceDate = new Date(invoice.DocDate);
//         const from = fromDate ? new Date(fromDate) : null;
//         const to = toDate ? new Date(toDate) : null;
        
//         if (from && to) {
//           return invoiceDate >= from && invoiceDate <= to;
//         } else if (from) {
//           return invoiceDate >= from;
//         } else if (to) {
//           return invoiceDate <= to;
//         }
//         return true;
//       });
//     }

//     // Sort by date (newest first)
//     filtered = filtered.sort((a, b) => {
//       const dateA = new Date(a["DocDate"]);
//       const dateB = new Date(b["DocDate"]);
//       return dateB - dateA;
//     });

//     return filtered;
//   }, [allData, statusFilter, activeGlobalFilter, fromDate, toDate]);

//   const pageCount = Math.ceil(filteredData.length / pageSize);
  
//   const pageData = useMemo(() => {
//     const start = (currentPage - 1) * pageSize;
//     return filteredData.slice(start, start + pageSize);
//   }, [filteredData, currentPage, pageSize]);

//   // Reset to first page when filters change
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [activeGlobalFilter, statusFilter, fromDate, toDate]);

//   const handleReset = useCallback(() => {
//     setGlobalFilter("");
//     setActiveGlobalFilter("");
//     setStatusFilter("all");
//     setFromDate("");
//     setToDate("");
//     setCurrentPage(1);
//   }, []);

//   return {
//     allData,
//     filteredData,
//     pageData,
//     pageCount,
//     currentPage,
//     setCurrentPage,
//     globalFilter,
//     setGlobalFilter: handleGlobalFilterChange,
//     statusFilter,
//     setStatusFilter,
//     fromDate,
//     setFromDate,
//     toDate,
//     setToDate,
//     handleReset,
//     setAllData 
//   };
// };

// export const useInvoiceData = (invoices, initialStatus, initialPage, pageSize) => {
//   const router = useRouter();
//   const [allData, setAllData] = useState(invoices);
//   const [currentPage, setCurrentPage] = useState(initialPage);
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
//   const [statusFilter, setStatusFilter] = useState(initialStatus);
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");

//   // Initialize data and set up debouncing
//   useEffect(() => {
//     setAllData(invoices);
//   }, [invoices]);

//   // Debounce the global filter
//   useEffect(() => {
//     const handler = debounce(() => {
//       setDebouncedGlobalFilter(globalFilter);
//     }, 300);
    
//     handler();
    
//     return () => {
//       handler.cancel();
//     };
//   }, [globalFilter]);

//   const filteredData = useMemo(() => {
//     if (!allData || allData.length === 0) return [];
    
//     let filtered = [...allData];

//     // Status filter
//     if (statusFilter !== "all") {
//       filtered = filtered.filter(invoice => 
//         statusFilter === "open" 
//           ? invoice.DocStatusDisplay === "Open" || invoice.DocStatusDisplay === "Partially Open"
//           : invoice.DocStatusDisplay === "Closed"
//       );
//     }

//     // Global search filter
//     if (debouncedGlobalFilter) {
//       const searchTerm = debouncedGlobalFilter.toLowerCase().trim();
//       filtered = filtered.filter(invoice => {
//         return (
//           (invoice.DocNum?.toString().toLowerCase().includes(searchTerm)) ||
//           (invoice.CardName?.toLowerCase().includes(searchTerm)) ||
//           (invoice.CardCode?.toLowerCase().includes(searchTerm)) ||
//           (invoice.NumAtCard?.toLowerCase().includes(searchTerm)) ||
//           (invoice.TrackNo?.toLowerCase().includes(searchTerm)) ||
//           (invoice.TransportName?.toLowerCase().includes(searchTerm)) ||
//           (invoice.ContactPerson?.toLowerCase().includes(searchTerm)) ||
//           (invoice.SalesEmployee?.toLowerCase().includes(searchTerm)) ||
//           (invoice.DocCur?.toLowerCase().includes(searchTerm)) ||
//           (invoice.DocStatusDisplay?.toLowerCase().includes(searchTerm)) ||
//           (invoice.LineItemCount?.toString().includes(searchTerm)) ||
//           (invoice.DocTotal?.toString().includes(searchTerm)) ||
//           (invoice.Comments?.toLowerCase().includes(searchTerm)) ||
//           (invoice.SeriesName?.toLowerCase().includes(searchTerm)) ||
//           (invoice.PaymentStatus?.toLowerCase().includes(searchTerm)) ||
//           (invoice.CustomerGroup?.toLowerCase().includes(searchTerm)) ||
//           (invoice.GSTIN?.toLowerCase().includes(searchTerm)) ||
//           (invoice.Country?.toLowerCase().includes(searchTerm)) ||
//           (invoice.State?.toLowerCase().includes(searchTerm))
//         );
//       });
//     }

//     // Date range filter
//     if (fromDate || toDate) {
//       filtered = filtered.filter(invoice => {
//         const invoiceDate = new Date(invoice.DocDate);
//         const from = fromDate ? new Date(fromDate) : null;
//         const to = toDate ? new Date(toDate) : null;
        
//         if (from && to) {
//           return invoiceDate >= from && invoiceDate <= to;
//         } else if (from) {
//           return invoiceDate >= from;
//         } else if (to) {
//           return invoiceDate <= to;
//         }
//         return true;
//       });
//     }

//     // Sort by date (newest first)
//     return filtered.sort((a, b) => {
//       const dateA = new Date(a.DocDate);
//       const dateB = new Date(b.DocDate);
//       return dateB - dateA;
//     });
//   }, [allData, statusFilter, debouncedGlobalFilter, fromDate, toDate]);

//   const pageCount = Math.ceil(filteredData.length / pageSize);
  
//   const pageData = useMemo(() => {
//     const start = (currentPage - 1) * pageSize;
//     return filteredData.slice(start, start + pageSize);
//   }, [filteredData, currentPage, pageSize]);

//   // Reset to first page when filters change
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [debouncedGlobalFilter, statusFilter, fromDate, toDate]);

//   const handleReset = useCallback(() => {
//     setGlobalFilter("");
//     setDebouncedGlobalFilter("");
//     setStatusFilter("all");
//     setFromDate("");
//     setToDate("");
//     setCurrentPage(1);
//   }, []);

//   return {
//     allData,
//     filteredData,
//     pageData,
//     pageCount,
//     currentPage,
//     setCurrentPage,
//     globalFilter,
//     setGlobalFilter,
//     statusFilter,
//     setStatusFilter,
//     fromDate,
//     setFromDate,
//     toDate,
//     setToDate,
//     handleReset,
//     setAllData 
//   };
// };

export const useInvoiceData = (invoices, initialStatus, initialPage, pageSize) => {
  const router = useRouter();
  const [allData, setAllData] = useState(invoices);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [filtersChanged, setFiltersChanged] = useState(false);

  // Initialize data and set up debouncing
  useEffect(() => {
    setAllData(invoices);
  }, [invoices]);

  // Debounce the global filter
  useEffect(() => {
    const handler = debounce(() => {
      setDebouncedGlobalFilter(globalFilter);
    }, 300);
    
    handler();
    
    return () => {
      handler.cancel();
    };
  }, [globalFilter]);

  const filteredData = useMemo(() => {
    if (!allData || allData.length === 0) return [];
    
    let filtered = [...allData];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(invoice => 
        statusFilter === "open" 
          ? invoice.DocStatusDisplay === "Open" || invoice.DocStatusDisplay === "Partially Open"
          : invoice.DocStatusDisplay === "Closed"
      );
    }

    // Global search filter
    if (debouncedGlobalFilter) {
      const searchTerm = debouncedGlobalFilter.toLowerCase().trim();
      filtered = filtered.filter(invoice => {
        return (
          (invoice.DocNum?.toString().toLowerCase().includes(searchTerm)) ||
          (invoice.CardName?.toLowerCase().includes(searchTerm)) ||
          (invoice.CardCode?.toLowerCase().includes(searchTerm)) ||
          (invoice.NumAtCard?.toLowerCase().includes(searchTerm)) ||
          (invoice.TrackNo?.toLowerCase().includes(searchTerm)) ||
          (invoice.TransportName?.toLowerCase().includes(searchTerm)) ||
          (invoice.ContactPerson?.toLowerCase().includes(searchTerm)) ||
          (invoice.SalesEmployee?.toLowerCase().includes(searchTerm)) ||
          (invoice.DocCur?.toLowerCase().includes(searchTerm)) ||
          (invoice.DocStatusDisplay?.toLowerCase().includes(searchTerm)) ||
          (invoice.LineItemCount?.toString().includes(searchTerm)) ||
          (invoice.DocTotal?.toString().includes(searchTerm)) ||
          (invoice.Comments?.toLowerCase().includes(searchTerm)) ||
          (invoice.SeriesName?.toLowerCase().includes(searchTerm)) ||
          (invoice.PaymentStatus?.toLowerCase().includes(searchTerm)) ||
          (invoice.CustomerGroup?.toLowerCase().includes(searchTerm)) ||
          (invoice.GSTIN?.toLowerCase().includes(searchTerm)) ||
          (invoice.Country?.toLowerCase().includes(searchTerm)) ||
          (invoice.State?.toLowerCase().includes(searchTerm))
        );
      });
    }

    // Month filter
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const filterYear = parseInt(year);
      const filterMonth = parseInt(month);
      
      filtered = filtered.filter(invoice => {
        if (!invoice.DocDate) return false;
        
        const invoiceDate = new Date(invoice.DocDate);
        const invoiceYear = invoiceDate.getFullYear();
        const invoiceMonth = invoiceDate.getMonth() + 1; // getMonth() returns 0-11
        
        return invoiceYear === filterYear && invoiceMonth === filterMonth;
      });
    }

    // Date range filter
    if (fromDate || toDate) {
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.DocDate);
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;
        
        if (from && to) {
          return invoiceDate >= from && invoiceDate <= to;
        } else if (from) {
          return invoiceDate >= from;
        } else if (to) {
          return invoiceDate <= to;
        }
        return true;
      });
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.DocDate);
      const dateB = new Date(b.DocDate);
      return dateB - dateA;
    });
  }, [allData, statusFilter, debouncedGlobalFilter, selectedMonth, fromDate, toDate]);

  const pageCount = Math.ceil(filteredData.length / pageSize);
  
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedGlobalFilter, statusFilter, selectedMonth, fromDate, toDate]);

  const handleReset = useCallback(() => {
    setGlobalFilter("");
    setDebouncedGlobalFilter("");
    setStatusFilter("all");
    setSelectedMonth("");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
    setFiltersChanged(false);
  }, []);

  const setSelectedMonthWrapper = useCallback((month) => {
    setSelectedMonth(month);
    setFiltersChanged(true);
  }, []);

  return {
    allData,
    filteredData,
    pageData,
    pageCount,
    currentPage,
    setCurrentPage,
    globalFilter,
    setGlobalFilter,
    statusFilter,
    setStatusFilter,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    selectedMonth,
    setSelectedMonth: setSelectedMonthWrapper,
    handleReset,
    setAllData 
  };
};

export const useInvoiceDetails = () => {
  const [invoiceDetails, setInvoiceDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);

  const fetchInvoiceDetails = async (invoiceNo) => {
    setLoadingDetails(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found in localStorage");
      }

      const response = await fetch(`/api/modal/invoiceDetails?invoiceNo=${invoiceNo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format - expected array');
      }
      
      if (data.length === 0) {
        setError('No records found for this invoice');
      }
      
      setInvoiceDetails(data);
      
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      setError(`Failed to load invoice details: ${error.message}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  return {
    invoiceDetails,
    loadingDetails,
    error,
    fetchInvoiceDetails,
    setError
  };
};

// export const useExportHandler = () => {
//   const router = useRouter();

//   const handleExportExcel = useCallback(async () => {
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

//       const url = `/api/invoices/header-invoice?${new URLSearchParams(queryParams)}`;

//       const response = await fetch(url, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to fetch: ${response.status}`);
//       }

//       const { invoices: allInvoices } = await response.json();

//       if (allInvoices && allInvoices.length > 0) {
//         const dateFields = new Set([
//           "DocDate",
//           "DocDueDate",
//           "U_DispatchDate",
//           "TaxDate",
//         ]);
//         const currencyFields = new Set(["DocTotal", "VatSum"]);

//         const excelData = allInvoices.map((invoice) => {
//           const row = {};
          
//           columns.forEach((column) => {
//             const value = invoice[column.field];
            
//             if (currencyFields.has(column.field) && value) {
//               row[column.label] = formatCurrency(value);
//             } else if (dateFields.has(column.field) && value) {
//               row[column.label] = formatDate(value);
//             } else {
//               row[column.label] = value || "N/A";
//             }
//           });

//           return row;
//         });

//         const columnStyles = columns.map(column => {
//           const style = {};
          
//           if (dateFields.has(column.field)) {
//             style.cellFormat = 'dd/mm/yyyy';
//           } else if (currencyFields.has(column.field)) {
//             style.cellFormat = '#,##0.00;[Red]-#,##0.00';
//           }
          
//           return style;
//         });

//         downloadExcel(
//           excelData, 
//           `Invoices_${queryParams.status}`,
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

//   return { handleExportExcel };
// };

// export const useExportHandler = () => {
//   const router = useRouter();

//   const handleExportExcel = useCallback(async (filteredData, tableColumns) => {
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         console.error("No token found");
//         return;
//       }

//       // Define the columns for Excel export
//       const columns = [
//         { field: "DocNum", label: "Invoice #" },
//         { field: "DocDate", label: "Invoice Date" },
//         { field: "ContactPerson", label: "Contact Person" },
//         { field: "DocDueDate", label: "Due Date" },
//         { field: "CardCode", label: "Customer Code" },
//         { field: "CardName", label: "Customer Name" },
//         { field: "LineItemCount", label: "Total Lines" },
//         { field: "DocTotal", label: "Total Amount" },
//         { field: "DocCur", label: "Currency" },
//         { field: "U_DispatchDate", label: "Dispatch Date" },
//         { field: "TrackNo", label: "Tracking #" },
//         { field: "TransportName", label: "Transport" },
//         { field: "SalesEmployee", label: "Sales Person" },
//         { field: "DocStatusDisplay", label: "Status" }
//       ];

//       // Use filtered data if available, otherwise fetch all data
//       let dataToExport = filteredData;
      
//       if (!dataToExport || dataToExport.length === 0) {
//         const queryParams = {
//           status: router.query.status || "all",
//           search: router.query.search || "",
//           sortField: router.query.sortField || "DocDate",
//           sortDir: router.query.sortDir || "desc",
//           fromDate: router.query.fromDate || "",
//           toDate: router.query.toDate || "",
//           getAll: "true",
//         };

//         const url = `/api/invoices/header-invoice?${new URLSearchParams(queryParams)}`;

//         const response = await fetch(url, {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         if (!response.ok) {
//           throw new Error(`Failed to fetch: ${response.status}`);
//         }

//         const { invoices: allInvoices } = await response.json();
//         dataToExport = allInvoices;
//       }

//       if (dataToExport && dataToExport.length > 0) {
//         const dateFields = new Set([
//           "DocDate",
//           "DocDueDate",
//           "U_DispatchDate",
//           "TaxDate",
//         ]);
//         const currencyFields = new Set(["DocTotal", "VatSum"]);

//         const excelData = dataToExport.map((invoice) => {
//           const row = {};
          
//           columns.forEach((column) => {
//             const value = invoice[column.field];
            
//             if (currencyFields.has(column.field) && value) {
//               row[column.label] = formatCurrency(value);
//             } else if (dateFields.has(column.field) && value) {
//               row[column.label] = formatDate(value);
//             } else {
//               row[column.label] = value || "N/A";
//             }
//           });

//           return row;
//         });

//         const columnStyles = columns.map(column => {
//           const style = {};
          
//           if (dateFields.has(column.field)) {
//             style.cellFormat = 'dd/mm/yyyy';
//           } else if (currencyFields.has(column.field)) {
//             style.cellFormat = '#,##0.00;[Red]-#,##0.00';
//           }
          
//           return style;
//         });

//         const statusParam = router.query.status || "all";
//         downloadExcel(
//           excelData, 
//           `Invoices_${statusParam}`,
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

//   return { handleExportExcel };
// };

export const useExportHandler = () => {
  const router = useRouter();

  const handleExportExcel = useCallback(async (filteredData, tableColumns) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      // Define the columns for Excel export
      const columns = [
        { field: "DocNum", label: "Invoice #" },
        { field: "DocDate", label: "Invoice Date" },
        { field: "ContactPerson", label: "Contact Person" },
        { field: "DocDueDate", label: "Due Date" },
        { field: "CardCode", label: "Customer Code" },
        { field: "CardName", label: "Customer Name" },
        { field: "LineItemCount", label: "Total Lines" },
        { field: "DocTotal", label: "Total Amount" },
        { field: "DocCur", label: "Currency" },
        { field: "U_DispatchDate", label: "Dispatch Date" },
        { field: "TrackNo", label: "Tracking #" },
        { field: "TransportName", label: "Transport" },
        { field: "SalesEmployee", label: "Sales Person" },
        { field: "DocStatusDisplay", label: "Status" }
      ];

      // Use filtered data if available, otherwise fetch all data
      let dataToExport = filteredData;
      
      if (!dataToExport || dataToExport.length === 0) {
        const queryParams = {
          status: router.query.status || "all",
          search: router.query.search || "",
          sortField: router.query.sortField || "DocDate",
          sortDir: router.query.sortDir || "desc",
          fromDate: router.query.fromDate || "",
          toDate: router.query.toDate || "",
          getAll: "true",
        };

        const url = `/api/invoices/header-invoice?${new URLSearchParams(queryParams)}`;

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const { invoices: allInvoices } = await response.json();
        dataToExport = allInvoices;
      }

      if (dataToExport && dataToExport.length > 0) {
        const dateFields = new Set([
          "DocDate",
          "DocDueDate",
          "U_DispatchDate",
          "TaxDate",
        ]);
        const currencyFields = new Set(["DocTotal", "VatSum"]);

        const excelData = dataToExport.map((invoice) => {
          const row = {};
          
          columns.forEach((column) => {
            const value = invoice[column.field];
            
            if (currencyFields.has(column.field) && value) {
              // Remove rupee symbol by slicing the first character
              row[column.label] = formatCurrency(value).slice(1);
            } else if (dateFields.has(column.field) && value) {
              row[column.label] = formatDate(value);
            } else {
              row[column.label] = value || "N/A";
            }
          });

          return row;
        });

        const columnStyles = columns.map(column => {
          const style = {};
          
          if (dateFields.has(column.field)) {
            style.cellFormat = 'dd/mm/yyyy';
          } else if (currencyFields.has(column.field)) {
            style.cellFormat = '#,##0.00;[Red]-#,##0.00';
          }
          
          return style;
        });

        const statusParam = router.query.status || "all";
        downloadExcel(
          excelData, 
          `Invoices_${statusParam}`,
          columnStyles
        );
      } else {
        alert("No data available to export.");
      }
    } catch (error) {
      console.error("Failed to export to Excel:", error);
      alert("Failed to export data. Please try again.");
    }
  }, [router.query]);

  return { handleExportExcel };
};

export const useSendMail = (setInvoices) => {
  const sendInvoiceMail = async (row) => {
    try {
      const res = await fetch("/api/email/sendInvoiceEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docEntry: row.DocEntry, docNum: row.DocNum }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Email sending failed.");
        return;
      }

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.DocEntry === row.DocEntry
            ? {
                ...inv,
                U_EmailSentDT: data.EmailSentDT,
                U_EmailSentTM: data.EmailSentTM,
              }
            : inv
        )
      );

      alert("Email sent successfully!");
    } catch (err) {
      console.error("Error sending invoice email:", err);
      alert("Failed to send invoice email: " + err.message);
    }
  };

  return { sendInvoiceMail };
};