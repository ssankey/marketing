

// import { useState, useEffect, useMemo } from "react";
// import downloadExcel from "utils/exporttoexcel";
// import { formatCurrency } from "utils/formatCurrency";
// import { formatDate } from "utils/formatDate";



// export const useInvoicesData = (invoices, initialStatus, initialPage, pageSize) => {
//   const [allData, setAllData] = useState(invoices);
//   const [currentPage, setCurrentPage] = useState(initialPage);
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
//   const [statusFilter, setStatusFilter] = useState(initialStatus);
//   const [selectedMonth, setSelectedMonth] = useState(""); // Added month filter state
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");

//   // Optimized debounce implementation
//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedGlobalFilter(globalFilter);
//     }, 200);

//     return () => clearTimeout(handler);
//   }, [globalFilter]);

//   useEffect(() => {
//     setAllData(invoices);
//   }, [invoices]);

//   // Pre-process data for efficient searching
//   const searchOptimizedData = useMemo(() => {
//     return allData.map(invoice => {
//       // Parse invoice posting date
//       const dateValue = invoice["Invoice Posting Dt."];
//       let postingDate = null;
      
//       if (dateValue) {
//         if (dateValue instanceof Date) {
//           postingDate = dateValue;
//         } else if (typeof dateValue === 'string') {
//           postingDate = new Date(dateValue);
//           if (isNaN(postingDate.getTime())) {
//             // Try parsing different formats if needed
//             const dateParts = dateValue.split(/[-/]/);
//             if (dateParts.length === 3) {
//               const formats = [
//                 new Date(dateParts[2], dateParts[1] - 1, dateParts[0]), // DD/MM/YYYY
//                 new Date(dateParts[2], dateParts[0] - 1, dateParts[1]), // MM/DD/YYYY
//                 new Date(dateParts[0], dateParts[1] - 1, dateParts[2])  // YYYY/MM/DD
//               ];
              
//               for (const format of formats) {
//                 if (!isNaN(format.getTime())) {
//                   postingDate = format;
//                   break;
//                 }
//               }
//             }
//           }
//         } else if (typeof dateValue === 'number') {
//           postingDate = new Date(dateValue);
//         }
//       }

//       // Create a search string that combines all searchable fields
//       const searchString = [
//         invoice.DocNum,
//         invoice["SO No"],
//         invoice["Customer ref no"],
//         invoice["Item No."],
//         invoice["Item/Service Description"],
//         invoice["Cas No"],
//         invoice["Vendor Catalog No."],
//         invoice.ContactPerson,
//         invoice.BatchNum,
//         invoice["Tracking Number"],
//         invoice["Invoice Posting Dt."],
//         invoice["SO Date"],
//         invoice["Dispatch Date"],
//         invoice["Mkt_Feedback"]
//       ]
//       .map(field => field ? field.toString().toLowerCase() : '')
//       .join('|');

//       return {
//         ...invoice,
//         _searchString: searchString,
//         _postingDate: postingDate
//       };
//     });
//   }, [allData]);

//   const filteredData = useMemo(() => {
//     let filtered = [...searchOptimizedData];

//     // Status filter
//     if (statusFilter !== "all") {
//       filtered = filtered.filter(invoice => 
//         invoice["Document Status"]?.toLowerCase() === statusFilter
//       );
//     }

//     // Month filter
//     if (selectedMonth) {
//       const [year, month] = selectedMonth.split('-');
//       const filterYear = parseInt(year);
//       const filterMonth = parseInt(month);
      
//       filtered = filtered.filter(invoice => {
//         if (!invoice._postingDate) return false;
        
//         const orderYear = invoice._postingDate.getFullYear();
//         const orderMonth = invoice._postingDate.getMonth() + 1;
        
//         return orderYear === filterYear && orderMonth === filterMonth;
//       });
//     }

//     // Optimized search using pre-computed search string
//     if (debouncedGlobalFilter) {
//       const searchTerm = debouncedGlobalFilter.toLowerCase();
//       filtered = filtered.filter(invoice => 
//         invoice._searchString.includes(searchTerm)
//       );
//     }

//     // Date filter using pre-computed date
//     if (fromDate || toDate) {
//       const from = fromDate ? new Date(fromDate) : null;
//       const to = toDate ? new Date(toDate) : null;
      
//       filtered = filtered.filter(invoice => {
//         if (!invoice._postingDate) return false;
        
//         if (from && to) {
//           return invoice._postingDate >= from && invoice._postingDate <= to;
//         } else if (from) {
//           return invoice._postingDate >= from;
//         } else if (to) {
//           return invoice._postingDate <= to;
//         }
//         return true;
//       });
//     }

//     return filtered;
//   }, [searchOptimizedData, statusFilter, selectedMonth, debouncedGlobalFilter, fromDate, toDate]);

//   const pageCount = Math.ceil(filteredData.length / pageSize);
  
//   const pageData = useMemo(() => {
//     const start = (currentPage - 1) * pageSize;
//     return filteredData.slice(start, start + pageSize);
//   }, [filteredData, currentPage, pageSize]);

//   // Reset to page 1 when filters change
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
//   };

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
//     selectedMonth,
//     setSelectedMonth,
//     fromDate,
//     setFromDate,
//     toDate,
//     setToDate,
//     handleReset,
//     setAllData 
//   };
// };

// export const useExportHandler = () => {
//   const handleExportExcel = useMemo(() => (filteredData, columns) => {
//     const currencyFields = new Set(["Unit Sales Price", "Total Sales Price"]);
    
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
          
//         } else if (key && (key.includes("Date") || key.includes("Dt."))) {
//           // Convert to Excel-friendly date format
//           if (value) {
//             const date = new Date(value);
//             // Use Excel's preferred format: MM/DD/YYYY  
//             formattedRow[column.header] = date.toLocaleDateString('en-US');
//           } else {
//             formattedRow[column.header] = "";
//           }
//         } else {
//           formattedRow[column.header] = value || "N/A";
//         }
//       });
      
//       return formattedRow;
//     });
    
//     downloadExcel(exportData, "Invoices_Report");
//   }, []);

//   return { handleExportExcel };
// };


// components/invoices/invoicesFunctions.js
import { useState, useEffect, useMemo, useCallback } from "react";
import { debounce } from "lodash";
import downloadExcel from "utils/exporttoexcel";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";

export const useInvoicesData = (initialStatus = "all", initialPage = 1, pageSize = 20) => {
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

      const response = await fetch(`/api/invoices?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch invoices: ${response.status}`);
      }

      const data = await response.json();
      
      if (params.getAll) {
        return data.invoices;
      }
      
      setInvoices(data.invoices || []);
      setTotalItems(data.totalItems || 0);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error("Error fetching invoices:", error);
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
      
      const response = await fetch(`/api/invoices?getAll=true&fields=Invoice Posting Dt.`, {
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

      const currencyFields = new Set(["Unit Sales Price", "Total Sales Price"]);
      const dateFields = new Set(["Invoice Posting Dt.", "SO Date", "Dispatch Date"]);

      const exportData = allFilteredInvoices.map((row) => {
        const formattedRow = {};
        
        columns.forEach((column) => {
          const key = column.accessorKey || column.id;
          const value = column.accessorFn ? column.accessorFn(row) : row[key];
          
          if (currencyFields.has(key)) {
            const cleanNumber = Math.round((Number(value) || 0) * 100) / 100;
            formattedRow[column.header] = +cleanNumber;
          } else if (key && (key.includes("Date") || key.includes("Dt."))) {
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
      const fileName = `Invoices_${today}`;

      downloadExcel(exportData, fileName);
    } catch (error) {
      console.error("Export failed:", error);
      setError("Failed to export invoices: " + error.message);
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
    console.warn("useExportHandler is deprecated. Use handleExportExcel from useInvoicesData instead.");
  };

  return { handleExportExcel };
};