
// components/openOrders/openOrdersFunctions.js
import { useState, useEffect, useMemo, useCallback } from "react";
import { debounce } from "lodash";
import downloadExcel from "utils/exporttoexcel";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";

// export const useOpenOrdersData = (orders, initialStatus, initialPage, pageSize) => {
//   const [allData, setAllData] = useState(orders);
//   const [currentPage, setCurrentPage] = useState(initialPage);
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
//   const [statusFilter, setStatusFilter] = useState(initialStatus);
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");

//   // Add debounced search with proper cleanup
//   const debouncedSearch = useMemo(
//     () => debounce((searchTerm) => {
//       setDebouncedGlobalFilter(searchTerm);
//     }, 300),
//     []
//   );

//   useEffect(() => {
//     debouncedSearch(globalFilter);
//     return () => {
//       debouncedSearch.cancel();
//     };
//   }, [globalFilter, debouncedSearch]);

//   useEffect(() => {
//     setAllData(orders);
//   }, [orders]);

//   const filteredData = useMemo(() => {
//     let filtered = [...allData];

//     // Status filter
//     if (statusFilter !== "all") {
//       filtered = filtered.filter(order => 
//         statusFilter === "instock" 
//           ? order.StockStatus === "In Stock"
//           : order.StockStatus === "Out of Stock"
//       );
//     }

//     // Global search filter - Enhanced with better null checking
//     if (debouncedGlobalFilter) {
//       const searchTerm = debouncedGlobalFilter.toLowerCase().trim();
//       filtered = filtered.filter(order => {
//         // Helper function to safely check if a value contains the search term
//         const containsSearchTerm = (value) => {
//           if (value === null || value === undefined) return false;
//           return value.toString().toLowerCase().includes(searchTerm);
//         };

//         return (
//           containsSearchTerm(order.DocumentNumber) ||
//           containsSearchTerm(order.CustomerVendorName) ||
//           containsSearchTerm(order.ItemNo) ||
//           containsSearchTerm(order.ItemName) ||
//           containsSearchTerm(order.CasNo) ||
//           containsSearchTerm(order.MfrCatalogNo) ||
//           containsSearchTerm(order.UOMName) ||
//           containsSearchTerm(order.ContactPerson) ||
//           containsSearchTerm(order.Timeline) ||
//           containsSearchTerm(order.MktFeedback) ||
//           containsSearchTerm(order.SalesEmployee) ||
//           containsSearchTerm(order.CustomerPONo) ||
//           containsSearchTerm(order.LineStatus)
//         );
//       });
//     }

//     // Date range filter
//     if (fromDate || toDate) {
//       filtered = filtered.filter(order => {
//         if (!order.PostingDate) return false;
        
//         const orderDate = new Date(order.PostingDate);
//         const from = fromDate ? new Date(fromDate) : null;
//         const to = toDate ? new Date(toDate) : null;
        
//         if (from && to) {
//           return orderDate >= from && orderDate <= to;
//         } else if (from) {
//           return orderDate >= from;
//         } else if (to) {
//           return orderDate <= to;
//         }
//         return true;
//       });
//     }

//     return filtered;
//   }, [allData, statusFilter, debouncedGlobalFilter, fromDate, toDate]);

//   const pageCount = Math.ceil(filteredData.length / pageSize);
//   const pageData = useMemo(() => {
//     const start = (currentPage - 1) * pageSize;
//     return filteredData.slice(start, start + pageSize);
//   }, [filteredData, currentPage, pageSize]);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [debouncedGlobalFilter, statusFilter, fromDate, toDate]);

//   const handleReset = () => {
//     setGlobalFilter("");
//     setDebouncedGlobalFilter("");
//     setStatusFilter("all");
//     setFromDate("");
//     setToDate("");
//     setCurrentPage(1);
//   };

//   // Enhanced search handler with immediate feedback
//   const handleSearch = useCallback((searchTerm) => {
//     setGlobalFilter(searchTerm);
//     setCurrentPage(1); // Reset to first page when searching
//   }, []);

//   return {
//     allData,
//     filteredData,
//     pageData,
//     pageCount,
//     currentPage,
//     setCurrentPage,
//     globalFilter,
//     setGlobalFilter: handleSearch, // Use the enhanced search handler
//     statusFilter,
//     setStatusFilter,
//     fromDate,
//     setFromDate,
//     toDate,
//     setToDate,
//     handleReset,
//     setAllData,
//     debouncedGlobalFilter // Expose this for debugging
//   };
// };

export const useOpenOrdersData = (orders, initialStatus, initialPage, pageSize) => {
  const [allData, setAllData] = useState(orders);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selectedMonth, setSelectedMonth] = useState(""); // Added month filter state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filtersChanged, setFiltersChanged] = useState(false);

  const debouncedSearch = useMemo(
    () => debounce((searchTerm) => {
      setDebouncedGlobalFilter(searchTerm);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(globalFilter);
    return () => {
      debouncedSearch.cancel();
    };
  }, [globalFilter, debouncedSearch]);

  useEffect(() => {
    setAllData(orders);
  }, [orders]);

  const filteredData = useMemo(() => {
    let filtered = [...allData];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => 
        statusFilter === "instock" 
          ? order.StockStatus === "In Stock"
          : order.StockStatus === "Out of Stock"
      );
    }

    // Global search filter
    if (debouncedGlobalFilter) {
      const searchTerm = debouncedGlobalFilter.toLowerCase().trim();
      filtered = filtered.filter(order => {
        const containsSearchTerm = (value) => {
          if (value === null || value === undefined) return false;
          return value.toString().toLowerCase().includes(searchTerm);
        };

        return (
          containsSearchTerm(order.DocumentNumber) ||
          containsSearchTerm(order.CustomerVendorName) ||
          containsSearchTerm(order.ItemNo) ||
          containsSearchTerm(order.ItemName) ||
          containsSearchTerm(order.CasNo) ||
          containsSearchTerm(order.MfrCatalogNo) ||
          containsSearchTerm(order.UOMName) ||
          containsSearchTerm(order.ContactPerson) ||
          containsSearchTerm(order.Timeline) ||
          containsSearchTerm(order.MktFeedback) ||
          containsSearchTerm(order.SalesEmployee) ||
          containsSearchTerm(order.CustomerPONo) ||
          containsSearchTerm(order.LineStatus)
        );
      });
    }

    // Month filter - Added month filtering logic
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const filterYear = parseInt(year);
      const filterMonth = parseInt(month);
      
      filtered = filtered.filter(order => {
        if (!order.PostingDate) return false;
        
        const orderDate = new Date(order.PostingDate);
        const orderYear = orderDate.getFullYear();
        const orderMonth = orderDate.getMonth() + 1;
        
        return orderYear === filterYear && orderMonth === filterMonth;
      });
    }

    // Date range filter
    if (fromDate || toDate) {
      filtered = filtered.filter(order => {
        if (!order.PostingDate) return false;
        
        const orderDate = new Date(order.PostingDate);
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;
        
        if (from && to) {
          return orderDate >= from && orderDate <= to;
        } else if (from) {
          return orderDate >= from;
        } else if (to) {
          return orderDate <= to;
        }
        return true;
      });
    }

    return filtered;
  }, [allData, statusFilter, debouncedGlobalFilter, selectedMonth, fromDate, toDate]);

  const pageCount = Math.ceil(filteredData.length / pageSize);
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedGlobalFilter, statusFilter, selectedMonth, fromDate, toDate]);

  const handleReset = () => {
    setGlobalFilter("");
    setDebouncedGlobalFilter("");
    setStatusFilter("all");
    setSelectedMonth("");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
    setFiltersChanged(false);
  };

  const handleSearch = useCallback((searchTerm) => {
    setGlobalFilter(searchTerm);
    setCurrentPage(1);
    setFiltersChanged(true);
  }, []);

  const setStatusFilterWrapper = useCallback((status) => {
    setStatusFilter(status);
    setFiltersChanged(true);
  }, []);

  const setSelectedMonthWrapper = useCallback((month) => {
    setSelectedMonth(month);
    setFiltersChanged(true);
  }, []);

  const setFromDateWrapper = useCallback((date) => {
    setFromDate(date);
    setFiltersChanged(true);
  }, []);

  const setToDateWrapper = useCallback((date) => {
    setToDate(date);
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
    setGlobalFilter: handleSearch,
    statusFilter,
    setStatusFilter: setStatusFilterWrapper,
    selectedMonth, // Added to return
    setSelectedMonth: setSelectedMonthWrapper, // Added to return
    fromDate,
    setFromDate: setFromDateWrapper,
    toDate,
    setToDate: setToDateWrapper,
    handleReset,
    setAllData,
    debouncedGlobalFilter,
    filtersChanged,
    setFiltersChanged
  };
};

export const useExportHandler = () => {
  const handleExportExcel = (filteredData, columns) => {
    // Define which fields should be treated as currency/number fields
    const numberFields = new Set(["Price", "OpenAmount"]);
    const dateFields = new Set(["DueDate", "DocDate"]); // Add all date fields here

    const exportData = filteredData.map((row) => {
      const formattedRow = {};
      
      columns.forEach((column) => {
        const value = row[column.accessorKey];
        
        if (numberFields.has(column.accessorKey)) {
          // Convert to number and ensure Excel recognizes it as numeric
          const numericValue = Number(value) || 0;
          formattedRow[column.header] = +numericValue.toFixed(2); // The + ensures it's a number
          
        } else if (dateFields.has(column.accessorKey)) {
          // Convert to Excel-friendly date format
          if (value) {
            const date = new Date(value);
            // Use Excel's preferred format: MM/DD/YYYY
            formattedRow[column.header] = date.toLocaleDateString('en-US');
          } else {
            formattedRow[column.header] = "";
          }
        } else if (column.accessorKey === "CustomerVendorName" || column.accessorKey === "ItemName") {
          formattedRow[column.header] = value || "N/A"; // Don't truncate in Excel
        } else {
          formattedRow[column.header] = value || "N/A";
        }
      });
      
      return formattedRow;
    });

    // Generate filename with current date
    const today = new Date().toISOString().split('T')[0];
    const fileName = `OpenOrders_Report_${today}`;

    // Call downloadExcel - numbers should now be properly formatted
    downloadExcel(exportData, fileName);
  };

  return { handleExportExcel };
};

// export const useExportHandler = () => {
//   const handleExportExcel = (filteredData, columns) => {
//     const exportData = filteredData.map((row) => {
//       const formattedRow = {};
      
//       columns.forEach((column) => {
//         const value = row[column.accessorKey];
        
//         if (column.accessorKey === "Price" || column.accessorKey === "OpenAmount") {
//           formattedRow[column.header] = formatCurrency(value, row.PriceCurrency).slice(1);
//         } else if (column.accessorKey.includes("Date")) {
//           formattedRow[column.header] = formatDate(value);
//         } else if (column.accessorKey === "CustomerVendorName" || column.accessorKey === "ItemName") {
//           formattedRow[column.header] = value || "N/A"; // Don't truncate in Excel
//         } else {
//           formattedRow[column.header] = value || "N/A";
//         }
//       });
      
//       return formattedRow;
//     });
    
//     downloadExcel(exportData, "OpenOrders_Report");
//   };

//   return { handleExportExcel };
// };

// Debug helper function - you can use this to check your data
export const debugSearchData = (orders, searchTerm) => {
  console.log("=== Search Debug Info ===");
  console.log("Search term:", searchTerm);
  console.log("Total orders:", orders.length);
  
  const sampleOrder = orders[0];
  if (sampleOrder) {
    console.log("Sample order MktFeedback:", sampleOrder.MktFeedback);
    console.log("MktFeedback type:", typeof sampleOrder.MktFeedback);
    console.log("MktFeedback null/undefined:", sampleOrder.MktFeedback === null || sampleOrder.MktFeedback === undefined);
  }
  
  const ordersWithMktFeedback = orders.filter(order => 
    order.MktFeedback && order.MktFeedback.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  console.log("Orders with matching MktFeedback:", ordersWithMktFeedback.length);
  if (ordersWithMktFeedback.length > 0) {
    console.log("First matching order:", ordersWithMktFeedback[0]);
  }
  
  return ordersWithMktFeedback;
};