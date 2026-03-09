
// // components/pendingDispatch/pendingDispatchFunctions.js
// import { useState, useEffect, useMemo ,useCallback } from "react";
// import downloadExcel from "utils/exporttoexcel";
// import { formatCurrency } from "utils/formatCurrency";
// import { formatDate } from "utils/formatDate";


// export const usePendingDispatchData = (invoices, initialStatus, initialPage, pageSize) => {
//   const [allData, setAllData] = useState(invoices);
//   const [currentPage, setCurrentPage] = useState(initialPage);
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
//   const [statusFilter, setStatusFilter] = useState(initialStatus);
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [selectedMonth, setSelectedMonth] = useState("");
//   const [filtersChanged, setFiltersChanged] = useState(false);

//   // Add debounce effect for the search input
//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedGlobalFilter(globalFilter);
//     }, 500); // 500ms debounce delay

//     return () => {
//       clearTimeout(handler);
//     };
//   }, [globalFilter]);

//   useEffect(() => {
//     setAllData(invoices);
//   }, [invoices]);

//   // Pre-process data for efficient searching
//   const searchOptimizedData = useMemo(() => {
//     return allData.map(invoice => {
//       // Create a search string that combines all searchable fields
//       const searchString = [
//         invoice.DocNum,
//         invoice.CardName,
//         invoice.CardCode,
//         invoice.TrackNo,
//         invoice.DocStatusDisplay,
//         invoice.LineItemCount,
//         invoice.DocDate,
//         invoice.DocDueDate,
//         invoice.U_DispatchDate,
//         invoice.DocCur,
//         invoice.VatSum,
//         invoice.TaxDate,
//         invoice.TransportName,
//         invoice.PaymentGroup,
//         invoice.Country,
//         invoice.SalesEmployee,
//         invoice.ContactPerson,
//         invoice.DocTotal,
//         formatDate(invoice.DocDate),
//         formatDate(invoice.U_DispatchDate),
//         formatDate(invoice.DocDueDate),
//         formatCurrency(invoice.DocTotal),
//         formatCurrency(invoice.VatSum)
//       ]
//       .map(field => field ? field.toString().toLowerCase() : '')
//       .join('|');

//       return {
//         ...invoice,
//         _searchString: searchString,
//         _docDate: new Date(invoice.DocDate) // Pre-compute date for filtering
//       };
//     });
//   }, [allData]);

//   const filteredData = useMemo(() => {
//     let filtered = [...searchOptimizedData];

//     // Status filter
//     if (statusFilter !== "all") {
//       filtered = filtered.filter(invoice => 
//         statusFilter === "open" 
//           ? invoice.DocStatusDisplay === "Open"
//           : statusFilter === "closed"
//           ? invoice.DocStatusDisplay === "Closed"
//           : true
//       );
//     }

//     // Optimized search using pre-computed search string
//     if (debouncedGlobalFilter) {
//       const searchTerm = debouncedGlobalFilter.toLowerCase();
//       filtered = filtered.filter(invoice => 
//         invoice._searchString.includes(searchTerm)
//       );
//     }

//     // Month filter
//     if (selectedMonth) {
//       const [year, month] = selectedMonth.split('-');
//       const filterYear = parseInt(year);
//       const filterMonth = parseInt(month);
      
//       filtered = filtered.filter(invoice => {
//         if (!invoice.DocDate) return false;
        
//         const orderDate = new Date(invoice.DocDate);
//         const orderYear = orderDate.getFullYear();
//         const orderMonth = orderDate.getMonth() + 1; // getMonth() returns 0-11
        
//         return orderYear === filterYear && orderMonth === filterMonth;
//       });
//     }

//     // Date range filter
//     if (fromDate || toDate) {
//       const from = fromDate ? new Date(fromDate) : null;
//       const to = toDate ? new Date(toDate) : null;
      
//       filtered = filtered.filter(invoice => {
//         if (from && to) {
//           return invoice._docDate >= from && invoice._docDate <= to;
//         } else if (from) {
//           return invoice._docDate >= from;
//         } else if (to) {
//           return invoice._docDate <= to;
//         }
//         return true;
//       });
//     }

//     // After all filtering is done, add sorting:
//     filtered = filtered.sort((a, b) => {
//       const dateA = new Date(a.DocDate);
//       const dateB = new Date(b.DocDate);
//       return dateB - dateA; // Descending order (newest first)
//     });

//     return filtered;
//   }, [searchOptimizedData, statusFilter, debouncedGlobalFilter, selectedMonth, fromDate, toDate]);

//   const pageCount = Math.ceil(filteredData.length / pageSize);
//   const pageData = useMemo(() => {
//     const start = (currentPage - 1) * pageSize;
//     return filteredData.slice(start, start + pageSize);
//   }, [filteredData, currentPage, pageSize]);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [debouncedGlobalFilter, statusFilter, selectedMonth, fromDate, toDate]);

//   const handleReset = () => {
//     setGlobalFilter("");
//     setDebouncedGlobalFilter("");
//     setStatusFilter("all");
//     setSelectedMonth("");
//     setFromDate("");
//     setToDate("");
//     setCurrentPage(1);
//     setFiltersChanged(false);
//   };

//   const setSelectedMonthWrapper = useCallback((month) => {
//     setSelectedMonth(month);
//     setFiltersChanged(true);
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
//     selectedMonth,
//     setSelectedMonth: setSelectedMonthWrapper,
//     handleReset,
//     setAllData,
//     filtersChanged,
//     setFiltersChanged
//   };
// };

// // export const useExportHandler = () => {
// //   const handleExportExcel = (filteredData, columns) => {
// //     const exportData = filteredData.map((row) => {
// //       const formattedRow = {};
      
// //       columns.forEach((column) => {
// //         const value = row[column.accessorKey];
        
// //         if (column.accessorKey === "DocTotal" || column.accessorKey === "VatSum") {
// //           formattedRow[column.header] = formatCurrency(value).slice(1);
// //         } else if (column.accessorKey.includes("Date")) {
// //           formattedRow[column.header] = formatDate(value);
// //         } else {
// //           formattedRow[column.header] = value || "N/A";
// //         }
// //       });
      
// //       return formattedRow;
// //     });
    
// //     downloadExcel(exportData, "PendingDispatch_Report");
// //   };

// //   return { handleExportExcel };
// // };


// export const useExportHandler = () => {
//   const handleExportExcel = useMemo(() => (filteredData, columns) => {
//     const currencyFields = new Set(["DocTotal", "VatSum"]);
//     const dateFields = new Set(["DocDate", "DocDueDate", "U_DispatchDate", "TaxDate"]);
    
//     const exportData = filteredData.map((row) => {
//       const formattedRow = {};
      
//       columns.forEach((column) => {
//         // Get the key - either accessorKey or id
//         const key = column.accessorKey || column.id;
        
//         // Get the value using accessorFn if available, otherwise use the key
//         const value = column.accessorFn ? column.accessorFn(row) : row[key];
        
//         if (currencyFields.has(key)) {
//           // Convert to number and round to 2 decimal places
//           const cleanNumber = Math.round((Number(value) || 0) * 100) / 100;
          
//           // Force Excel to recognize as number by ensuring it's a proper number
//           formattedRow[column.header] = +cleanNumber; // The + operator ensures it's a number
          
//         } else if (dateFields.has(key)) {
//           // Convert to Excel-friendly date format
//           if (value) {
//             const date = new Date(value);
//             // Use Excel's preferred format: MM/DD/YYYY  
//             formattedRow[column.header] = date.toLocaleDateString('en-US');
//           } else {
//             formattedRow[column.header] = "";
//           }
//         } else if (key === "U_EmailSentDT") {
//           // Special handling for email sent datetime
//           if (value) {
//             const dt = new Date(value);
//             const hasTime = row.U_EmailSentTM !== null && row.U_EmailSentTM !== undefined;
//             const h = hasTime ? Math.floor(row.U_EmailSentTM / 60) : dt.getHours();
//             const m = hasTime ? row.U_EmailSentTM % 60 : dt.getMinutes();
            
//             // Format as MM/DD/YYYY HH:MM
//             const dateStr = dt.toLocaleDateString('en-US');
//             const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
//             formattedRow[column.header] = `${dateStr} ${timeStr}`;
//           } else {
//             formattedRow[column.header] = "Not Sent";
//           }
//         } else {
//           formattedRow[column.header] = value || "N/A";
//         }
//       });
      
//       return formattedRow;
//     });
    
//     downloadExcel(exportData, "PendingDispatch_Report");
//   }, []);

//   return { handleExportExcel };
// };


// components/pendingDispatch/pendingDispatchFunctions.js
import { useState, useEffect, useMemo, useCallback } from "react";
import { debounce } from "lodash";
import downloadExcel from "utils/exporttoexcel";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";

export const usePendingDispatchData = (initialStatus = "all", initialPage = 1, pageSize = 20) => {
  const [invoices, setInvoices] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortField, setSortField] = useState("DocDate");
  const [sortDirection, setSortDirection] = useState("desc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allInvoicesForFilters, setAllInvoicesForFilters] = useState([]);
  const [shouldResetPage, setShouldResetPage] = useState(false);

  const debouncedSearch = useMemo(
    () => debounce((searchTerm = "") => {
      setDebouncedGlobalFilter(searchTerm || "");
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(globalFilter || "");
    return () => {
      debouncedSearch.cancel();
    };
  }, [globalFilter, debouncedSearch]);

  // Fetch invoices from API
  const fetchInvoices = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      
      const queryParams = new URLSearchParams({
        page: params.page || currentPage,
        pageSize: pageSize,
        search: (params.search !== undefined ? params.search : debouncedGlobalFilter) || "",
        status: params.status || statusFilter || "all",
        sortField: params.sortField || sortField || "DocDate",
        sortDir: params.sortDir || sortDirection || "desc",
        ...(params.month && { month: params.month }),
        ...(params.fromDate && { fromDate: params.fromDate }),
        ...(params.toDate && { toDate: params.toDate }),
        ...(params.getAll && { getAll: "true" })
      });

      const response = await fetch(`/api/invoices/pendingDispatch?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pending dispatch invoices: ${response.status}`);
      }

      const data = await response.json();
      
      if (params.getAll) {
        return data.invoices;
      }
      
      setInvoices(data.invoices || []);
      setTotalItems(data.totalItems || 0);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error("Error fetching pending dispatch invoices:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all invoices for month dropdown
  const fetchAllInvoicesForFilters = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const response = await fetch(`/api/invoices/pendingDispatch?getAll=true&fields=DocDate`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAllInvoicesForFilters(data.invoices || []);
      }
    } catch (error) {
      console.error("Error fetching invoices for filters:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchInvoices();
    fetchAllInvoicesForFilters();
  }, []);

  // Handle filter changes - reset to page 1
  useEffect(() => {
    if (globalFilter !== debouncedGlobalFilter) return;
    
    if (shouldResetPage) {
      fetchInvoices({
        page: 1,
        search: debouncedGlobalFilter || "",
        status: statusFilter || "all",
        month: selectedMonth || "",
        fromDate: fromDate || "",
        toDate: toDate || "",
        sortField: sortField || "DocDate",
        sortDir: sortDirection || "desc"
      });
      
      setCurrentPage(1);
      setShouldResetPage(false);
    }
  }, [debouncedGlobalFilter, statusFilter, selectedMonth, fromDate, toDate, sortField, sortDirection, shouldResetPage]);

  // Handle page changes only
  useEffect(() => {
    if (shouldResetPage || invoices.length === 0) return;
    
    fetchInvoices({ 
      page: currentPage,
      search: debouncedGlobalFilter || "",
      status: statusFilter || "all",
      month: selectedMonth || "",
      fromDate: fromDate || "",
      toDate: toDate || "",
      sortField: sortField || "DocDate",
      sortDir: sortDirection || "desc"
    });
  }, [currentPage]);

  const handleSearch = useCallback((searchTerm = "") => {
    setGlobalFilter(searchTerm || "");
    setShouldResetPage(true);
  }, []);

  const setStatusFilterWrapper = useCallback((status = "all") => {
    setStatusFilter(status || "all");
    setShouldResetPage(true);
  }, []);

  const setSelectedMonthWrapper = useCallback((month = "") => {
    setSelectedMonth(month || "");
    setShouldResetPage(true);
  }, []);

  const setFromDateWrapper = useCallback((date = "") => {
    setFromDate(date || "");
    setShouldResetPage(true);
  }, []);

  const setToDateWrapper = useCallback((date = "") => {
    setToDate(date || "");
    setShouldResetPage(true);
  }, []);

  const handleSort = useCallback((field) => {
    const newDirection = sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
    setShouldResetPage(true);
  }, [sortField, sortDirection]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  }, [currentPage]);

  const handleReset = useCallback(() => {
    setGlobalFilter("");
    setDebouncedGlobalFilter("");
    setStatusFilter("all");
    setSelectedMonth("");
    setFromDate("");
    setToDate("");
    setSortField("DocDate");
    setSortDirection("desc");
    setCurrentPage(1);
    
    fetchInvoices({
      page: 1,
      search: "",
      status: "all",
      month: "",
      fromDate: "",
      toDate: "",
      sortField: "DocDate",
      sortDir: "desc"
    });
  }, [fetchInvoices]);

  // Export function that fetches all data
  const handleExportExcel = useCallback(async (columns) => {
    try {
      setLoading(true);
      
      const allFilteredInvoices = await fetchInvoices({
        getAll: true,
        search: debouncedGlobalFilter || "",
        status: statusFilter || "all",
        month: selectedMonth || "",
        fromDate: fromDate || "",
        toDate: toDate || "",
        sortField: sortField || "DocDate",
        sortDir: sortDirection || "desc"
      });

      if (!allFilteredInvoices || allFilteredInvoices.length === 0) {
        setError("No data available for export");
        return;
      }

      const currencyFields = new Set(["DocTotal", "VatSum"]);
      const dateFields = new Set(["DocDate", "DocDueDate", "U_DispatchDate", "TaxDate"]);

      const exportData = allFilteredInvoices.map((row) => {
        const formattedRow = {};
        
        columns.forEach((column) => {
          const key = column.accessorKey || column.id;
          const value = column.accessorFn ? column.accessorFn(row) : row[key];
          
          if (currencyFields.has(key)) {
            const cleanNumber = Math.round((Number(value) || 0) * 100) / 100;
            formattedRow[column.header] = +cleanNumber;
          } else if (dateFields.has(key)) {
            if (value) {
              const date = new Date(value);
              formattedRow[column.header] = date.toLocaleDateString('en-US');
            } else {
              formattedRow[column.header] = "";
            }
          } else {
            formattedRow[column.header] = value || "N/A";
          }
        });
        
        return formattedRow;
      });

      const today = new Date().toISOString().split('T')[0];
      const fileName = `PendingDispatch_${today}`;

      downloadExcel(exportData, fileName);
    } catch (error) {
      console.error("Export failed:", error);
      setError("Failed to export pending dispatch invoices: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [fetchInvoices, debouncedGlobalFilter, statusFilter, selectedMonth, fromDate, toDate, sortField, sortDirection]);

  return {
    invoices,
    totalItems,
    totalPages,
    currentPage,
    loading,
    error,
    globalFilter,
    statusFilter,
    selectedMonth,
    fromDate,
    toDate,
    sortField,
    sortDirection,
    allInvoicesForFilters,
    setGlobalFilter: handleSearch,
    setStatusFilter: setStatusFilterWrapper,
    setSelectedMonth: setSelectedMonthWrapper,
    setFromDate: setFromDateWrapper,
    setToDate: setToDateWrapper,
    handleSort,
    handleReset,
    handlePageChange,
    handleExportExcel,
    setError,
    setInvoices
  };
};

// Backward compatibility
export const useExportHandler = () => {
  const handleExportExcel = () => {
    console.warn("useExportHandler is deprecated. Use handleExportExcel from usePendingDispatchData instead.");
  };

  return { handleExportExcel };
};