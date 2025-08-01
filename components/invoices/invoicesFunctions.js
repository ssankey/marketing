

import { useState, useEffect, useMemo } from "react";
import downloadExcel from "utils/exporttoexcel";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";

// export const useInvoicesData = (invoices, initialStatus, initialPage, pageSize) => {
//   const [allData, setAllData] = useState(invoices);
//   const [currentPage, setCurrentPage] = useState(initialPage);
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
//   const [statusFilter, setStatusFilter] = useState(initialStatus);
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");

//   // Optimized debounce implementation
//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedGlobalFilter(globalFilter);
//     }, 200); // Reduced debounce time for better responsiveness

//     return () => clearTimeout(handler);
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
//         invoice["SO No"],
//         invoice["Customer ref no"],
//         invoice["Item No."],
//         invoice["Item/Service Description"],
//         invoice["Cas No"],
//         invoice["Vendor Catalog No."],
//         invoice.ContactPerson,
//         invoice.BatchNum,
//         invoice["Tracking Number"],
//         invoice["Invoice Posting Dt."], // Raw date value
//         invoice["SO Date"], // Raw date value
//         invoice["Dispatch Date"], // Raw date value
//         invoice["Mkt_Feedback"]
//       ]
//       .map(field => field ? field.toString().toLowerCase() : '')
//       .join('|'); // Separator to prevent false matches

//       return {
//         ...invoice,
//         _searchString: searchString,
//         _docDate: new Date(invoice["Invoice Posting Dt."]) // Pre-compute date
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

//     return filtered;
//   }, [searchOptimizedData, statusFilter, debouncedGlobalFilter, fromDate, toDate]);

//   const pageCount = Math.ceil(filteredData.length / pageSize);
  
//   const pageData = useMemo(() => {
//     const start = (currentPage - 1) * pageSize;
//     return filteredData.slice(start, start + pageSize);
//   }, [filteredData, currentPage, pageSize]);

//   // Reset to page 1 when filters change
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

export const useInvoicesData = (invoices, initialStatus, initialPage, pageSize) => {
  const [allData, setAllData] = useState(invoices);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selectedMonth, setSelectedMonth] = useState(""); // Added month filter state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Optimized debounce implementation
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
    }, 200);

    return () => clearTimeout(handler);
  }, [globalFilter]);

  useEffect(() => {
    setAllData(invoices);
  }, [invoices]);

  // Pre-process data for efficient searching
  const searchOptimizedData = useMemo(() => {
    return allData.map(invoice => {
      // Parse invoice posting date
      const dateValue = invoice["Invoice Posting Dt."];
      let postingDate = null;
      
      if (dateValue) {
        if (dateValue instanceof Date) {
          postingDate = dateValue;
        } else if (typeof dateValue === 'string') {
          postingDate = new Date(dateValue);
          if (isNaN(postingDate.getTime())) {
            // Try parsing different formats if needed
            const dateParts = dateValue.split(/[-/]/);
            if (dateParts.length === 3) {
              const formats = [
                new Date(dateParts[2], dateParts[1] - 1, dateParts[0]), // DD/MM/YYYY
                new Date(dateParts[2], dateParts[0] - 1, dateParts[1]), // MM/DD/YYYY
                new Date(dateParts[0], dateParts[1] - 1, dateParts[2])  // YYYY/MM/DD
              ];
              
              for (const format of formats) {
                if (!isNaN(format.getTime())) {
                  postingDate = format;
                  break;
                }
              }
            }
          }
        } else if (typeof dateValue === 'number') {
          postingDate = new Date(dateValue);
        }
      }

      // Create a search string that combines all searchable fields
      const searchString = [
        invoice.DocNum,
        invoice["SO No"],
        invoice["Customer ref no"],
        invoice["Item No."],
        invoice["Item/Service Description"],
        invoice["Cas No"],
        invoice["Vendor Catalog No."],
        invoice.ContactPerson,
        invoice.BatchNum,
        invoice["Tracking Number"],
        invoice["Invoice Posting Dt."],
        invoice["SO Date"],
        invoice["Dispatch Date"],
        invoice["Mkt_Feedback"]
      ]
      .map(field => field ? field.toString().toLowerCase() : '')
      .join('|');

      return {
        ...invoice,
        _searchString: searchString,
        _postingDate: postingDate
      };
    });
  }, [allData]);

  const filteredData = useMemo(() => {
    let filtered = [...searchOptimizedData];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(invoice => 
        invoice["Document Status"]?.toLowerCase() === statusFilter
      );
    }

    // Month filter
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const filterYear = parseInt(year);
      const filterMonth = parseInt(month);
      
      filtered = filtered.filter(invoice => {
        if (!invoice._postingDate) return false;
        
        const orderYear = invoice._postingDate.getFullYear();
        const orderMonth = invoice._postingDate.getMonth() + 1;
        
        return orderYear === filterYear && orderMonth === filterMonth;
      });
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
        if (!invoice._postingDate) return false;
        
        if (from && to) {
          return invoice._postingDate >= from && invoice._postingDate <= to;
        } else if (from) {
          return invoice._postingDate >= from;
        } else if (to) {
          return invoice._postingDate <= to;
        }
        return true;
      });
    }

    return filtered;
  }, [searchOptimizedData, statusFilter, selectedMonth, debouncedGlobalFilter, fromDate, toDate]);

  const pageCount = Math.ceil(filteredData.length / pageSize);
  
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Reset to page 1 when filters change
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
    selectedMonth,
    setSelectedMonth,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    handleReset,
    setAllData 
  };
};
// export const useExportHandler = () => {
//   const handleExportExcel = useMemo(() => (filteredData, columns) => {
//     const exportData = filteredData.map((row) => {
//       const formattedRow = {};
      
//       columns.forEach((column) => {
//         const value = row[column.accessorKey];
        
//         if (column.accessorKey === "Unit Sales Price" || column.accessorKey === "Total Sales Price") {
//           formattedRow[column.header] = formatCurrency(value).slice(1);
//         } else if (column.accessorKey.includes("Date") || column.accessorKey.includes("Dt.")) {
//           formattedRow[column.header] = formatDate(value);
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



export const useExportHandler = () => {
  const handleExportExcel = useMemo(() => (filteredData, columns) => {
    const exportData = filteredData.map((row) => {
      const formattedRow = {};
      
      columns.forEach((column) => {
        // Get the key - either accessorKey or id
        const key = column.accessorKey || column.id;
        
        // Get the value using accessorFn if available, otherwise use the key
        const value = column.accessorFn ? column.accessorFn(row) : row[key];
        
        if (key === "Unit Sales Price" || key === "Total Sales Price") {
          formattedRow[column.header] = formatCurrency(value).slice(1);
        } else if (key && (key.includes("Date") || key.includes("Dt."))) {
          formattedRow[column.header] = formatDate(value);
        } else {
          formattedRow[column.header] = value || "N/A";
        }
      });
      
      return formattedRow;
    });
    
    downloadExcel(exportData, "Invoices_Report");
  }, []);

  return { handleExportExcel };
};