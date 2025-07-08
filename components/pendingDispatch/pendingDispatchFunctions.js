// // components/pendingDispatch/pendingDispatchFunctions.js
// import { useState, useEffect, useMemo, useCallback } from "react";
// import { debounce } from "lodash";
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

//    // Add debounce effect for the search input
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

//   const filteredData = useMemo(() => {
//     let filtered = [...allData];

//     // if (statusFilter !== "all") {
//     //   filtered = filtered.filter(invoice => 
//     //     statusFilter === "open" 
//     //       ? invoice.DocStatusDisplay === "Open"
//     //       : invoice.DocStatusDisplay === "Closed"
//     //   );
//     // }
//     if (statusFilter !== "all") {
//         filtered = filtered.filter(invoice => 
//             statusFilter === "open" 
//             ? invoice.DocStatusDisplay === "Open"
//             : statusFilter === "closed"
//             ? invoice.DocStatusDisplay === "Closed"
//             : true // Include all other statuses
//         );
//         }

//     if (debouncedGlobalFilter) {
//       const searchTerm = debouncedGlobalFilter.toLowerCase();
//       filtered = filtered.filter(invoice => {
//         return (
//           (invoice.DocNum?.toString().toLowerCase().includes(searchTerm)) ||
//           (invoice.CardName?.toLowerCase().includes(searchTerm)) ||
//           (invoice.CardCode?.toLowerCase().includes(searchTerm)) ||
//           (invoice.TrackNo?.toLowerCase().includes(searchTerm)) ||
//           (formatDate(invoice.DocDate)?.toLowerCase().includes(searchTerm)) ||
//           (formatDate(invoice.U_DispatchDate)?.toLowerCase().includes(searchTerm))
//         );
//       });
//     }

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
//     // After all filtering is done, add sorting:
//     filtered = filtered.sort((a, b) => {
//     const dateA = new Date(a.DocDate);
//     const dateB = new Date(b.DocDate);
//     return dateB - dateA; // Descending order (newest first)
//     });

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

// components/pendingDispatch/pendingDispatchFunctions.js
import { useState, useEffect, useMemo } from "react";
import downloadExcel from "utils/exporttoexcel";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";

export const usePendingDispatchData = (invoices, initialStatus, initialPage, pageSize) => {
  const [allData, setAllData] = useState(invoices);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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
        formatDate(invoice.DocDate), // Include formatted dates for better searching
        formatDate(invoice.U_DispatchDate),
        formatDate(invoice.DocDueDate),
        formatCurrency(invoice.DocTotal), // Include formatted currency
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

    // Date filter using pre-computed date
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
  }, [searchOptimizedData, statusFilter, debouncedGlobalFilter, fromDate, toDate]);

  const pageCount = Math.ceil(filteredData.length / pageSize);
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedGlobalFilter, statusFilter, fromDate, toDate]);

  const handleReset = () => {
    setGlobalFilter("");
    setDebouncedGlobalFilter("");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

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
    handleReset,
    setAllData 
  };
};

export const useExportHandler = () => {
  const handleExportExcel = (filteredData, columns) => {
    const exportData = filteredData.map((row) => {
      const formattedRow = {};
      
      columns.forEach((column) => {
        const value = row[column.accessorKey];
        
        if (column.accessorKey === "DocTotal" || column.accessorKey === "VatSum") {
          formattedRow[column.header] = formatCurrency(value).slice(1);
        } else if (column.accessorKey.includes("Date")) {
          formattedRow[column.header] = formatDate(value);
        } else {
          formattedRow[column.header] = value || "N/A";
        }
      });
      
      return formattedRow;
    });
    
    downloadExcel(exportData, "PendingDispatch_Report");
  };

  return { handleExportExcel };
};