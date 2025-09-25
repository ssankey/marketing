
// components/pendingDispatch/pendingDispatchFunctions.js
import { useState, useEffect, useMemo ,useCallback } from "react";
import downloadExcel from "utils/exporttoexcel";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";

// export const usePendingDispatchData = (invoices, initialStatus, initialPage, pageSize) => {
//   const [allData, setAllData] = useState(invoices);
//   const [currentPage, setCurrentPage] = useState(initialPage);
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
//   const [statusFilter, setStatusFilter] = useState(initialStatus);
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");

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
//         formatDate(invoice.DocDate), // Include formatted dates for better searching
//         formatDate(invoice.U_DispatchDate),
//         formatDate(invoice.DocDueDate),
//         formatCurrency(invoice.DocTotal), // Include formatted currency
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

//     // Date filter using pre-computed date
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
//   }, [searchOptimizedData, statusFilter, debouncedGlobalFilter, fromDate, toDate]);

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

export const usePendingDispatchData = (invoices, initialStatus, initialPage, pageSize) => {
  const [allData, setAllData] = useState(invoices);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [filtersChanged, setFiltersChanged] = useState(false);

  // Add debounce effect for the search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [globalFilter]);

  useEffect(() => {
    setAllData(invoices);
  }, [invoices]);

  // Pre-process data for efficient searching
  const searchOptimizedData = useMemo(() => {
    return allData.map(invoice => {
      // Create a search string that combines all searchable fields
      const searchString = [
        invoice.DocNum,
        invoice.CardName,
        invoice.CardCode,
        invoice.TrackNo,
        invoice.DocStatusDisplay,
        invoice.LineItemCount,
        invoice.DocDate,
        invoice.DocDueDate,
        invoice.U_DispatchDate,
        invoice.DocCur,
        invoice.VatSum,
        invoice.TaxDate,
        invoice.TransportName,
        invoice.PaymentGroup,
        invoice.Country,
        invoice.SalesEmployee,
        invoice.ContactPerson,
        invoice.DocTotal,
        formatDate(invoice.DocDate),
        formatDate(invoice.U_DispatchDate),
        formatDate(invoice.DocDueDate),
        formatCurrency(invoice.DocTotal),
        formatCurrency(invoice.VatSum)
      ]
      .map(field => field ? field.toString().toLowerCase() : '')
      .join('|');

      return {
        ...invoice,
        _searchString: searchString,
        _docDate: new Date(invoice.DocDate) // Pre-compute date for filtering
      };
    });
  }, [allData]);

  const filteredData = useMemo(() => {
    let filtered = [...searchOptimizedData];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(invoice => 
        statusFilter === "open" 
          ? invoice.DocStatusDisplay === "Open"
          : statusFilter === "closed"
          ? invoice.DocStatusDisplay === "Closed"
          : true
      );
    }

    // Optimized search using pre-computed search string
    if (debouncedGlobalFilter) {
      const searchTerm = debouncedGlobalFilter.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice._searchString.includes(searchTerm)
      );
    }

    // Month filter
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const filterYear = parseInt(year);
      const filterMonth = parseInt(month);
      
      filtered = filtered.filter(invoice => {
        if (!invoice.DocDate) return false;
        
        const orderDate = new Date(invoice.DocDate);
        const orderYear = orderDate.getFullYear();
        const orderMonth = orderDate.getMonth() + 1; // getMonth() returns 0-11
        
        return orderYear === filterYear && orderMonth === filterMonth;
      });
    }

    // Date range filter
    if (fromDate || toDate) {
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;
      
      filtered = filtered.filter(invoice => {
        if (from && to) {
          return invoice._docDate >= from && invoice._docDate <= to;
        } else if (from) {
          return invoice._docDate >= from;
        } else if (to) {
          return invoice._docDate <= to;
        }
        return true;
      });
    }

    // After all filtering is done, add sorting:
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.DocDate);
      const dateB = new Date(b.DocDate);
      return dateB - dateA; // Descending order (newest first)
    });

    return filtered;
  }, [searchOptimizedData, statusFilter, debouncedGlobalFilter, selectedMonth, fromDate, toDate]);

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
    setAllData,
    filtersChanged,
    setFiltersChanged
  };
};

// export const useExportHandler = () => {
//   const handleExportExcel = (filteredData, columns) => {
//     const exportData = filteredData.map((row) => {
//       const formattedRow = {};
      
//       columns.forEach((column) => {
//         const value = row[column.accessorKey];
        
//         if (column.accessorKey === "DocTotal" || column.accessorKey === "VatSum") {
//           formattedRow[column.header] = formatCurrency(value).slice(1);
//         } else if (column.accessorKey.includes("Date")) {
//           formattedRow[column.header] = formatDate(value);
//         } else {
//           formattedRow[column.header] = value || "N/A";
//         }
//       });
      
//       return formattedRow;
//     });
    
//     downloadExcel(exportData, "PendingDispatch_Report");
//   };

//   return { handleExportExcel };
// };


export const useExportHandler = () => {
  const handleExportExcel = useMemo(() => (filteredData, columns) => {
    const currencyFields = new Set(["DocTotal", "VatSum"]);
    const dateFields = new Set(["DocDate", "DocDueDate", "U_DispatchDate", "TaxDate"]);
    
    const exportData = filteredData.map((row) => {
      const formattedRow = {};
      
      columns.forEach((column) => {
        // Get the key - either accessorKey or id
        const key = column.accessorKey || column.id;
        
        // Get the value using accessorFn if available, otherwise use the key
        const value = column.accessorFn ? column.accessorFn(row) : row[key];
        
        if (currencyFields.has(key)) {
          // Convert to number and round to 2 decimal places
          const cleanNumber = Math.round((Number(value) || 0) * 100) / 100;
          
          // Force Excel to recognize as number by ensuring it's a proper number
          formattedRow[column.header] = +cleanNumber; // The + operator ensures it's a number
          
        } else if (dateFields.has(key)) {
          // Convert to Excel-friendly date format
          if (value) {
            const date = new Date(value);
            // Use Excel's preferred format: MM/DD/YYYY  
            formattedRow[column.header] = date.toLocaleDateString('en-US');
          } else {
            formattedRow[column.header] = "";
          }
        } else if (key === "U_EmailSentDT") {
          // Special handling for email sent datetime
          if (value) {
            const dt = new Date(value);
            const hasTime = row.U_EmailSentTM !== null && row.U_EmailSentTM !== undefined;
            const h = hasTime ? Math.floor(row.U_EmailSentTM / 60) : dt.getHours();
            const m = hasTime ? row.U_EmailSentTM % 60 : dt.getMinutes();
            
            // Format as MM/DD/YYYY HH:MM
            const dateStr = dt.toLocaleDateString('en-US');
            const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            formattedRow[column.header] = `${dateStr} ${timeStr}`;
          } else {
            formattedRow[column.header] = "Not Sent";
          }
        } else {
          formattedRow[column.header] = value || "N/A";
        }
      });
      
      return formattedRow;
    });
    
    downloadExcel(exportData, "PendingDispatch_Report");
  }, []);

  return { handleExportExcel };
};