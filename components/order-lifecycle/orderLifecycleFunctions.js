
// // components/order-lifecycle/orderLifecycleFunctions.js
// import { useState, useEffect, useMemo, useCallback } from "react";
// import { debounce } from "lodash";
// import downloadExcel from "utils/exporttoexcel";

// export const useOrderLifecycleData = (data, initialPage, pageSize) => {
//   const [allData, setAllData] = useState(data);
//   const [currentPage, setCurrentPage] = useState(initialPage);
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");

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
//     setAllData(data);
//   }, [data]);

//   const filteredData = useMemo(() => {
//     let filtered = [...allData];

//     // Global search filter - search by Reference No, Item Code, Sales Person, PO No, Customer
//     if (debouncedGlobalFilter) {
//       const searchTerm = debouncedGlobalFilter.toLowerCase().trim();
//       filtered = filtered.filter(item => {
//         const containsSearchTerm = (value) => {
//           if (value === null || value === undefined) return false;
//           return value.toString().toLowerCase().includes(searchTerm);
//         };

//         return (
//           containsSearchTerm(item.CustomerRefNo) ||    // Reference No
//           containsSearchTerm(item.Item_No) ||          // Item Code
//           containsSearchTerm(item.Sales_Person) ||     // Sales Person
//           containsSearchTerm(item.PO_No) ||            // PO No
//           containsSearchTerm(item.Customer)            // Customer Name
//         );
//       });
//     }

//     return filtered;
//   }, [allData, debouncedGlobalFilter]);

//   const pageCount = Math.ceil(filteredData.length / pageSize);
//   const pageData = useMemo(() => {
//     const start = (currentPage - 1) * pageSize;
//     return filteredData.slice(start, start + pageSize);
//   }, [filteredData, currentPage, pageSize]);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [debouncedGlobalFilter]);

//   const handleReset = () => {
//     setGlobalFilter("");
//     setDebouncedGlobalFilter("");
//     setCurrentPage(1);
//   };

//   const handleSearch = useCallback((searchTerm) => {
//     setGlobalFilter(searchTerm);
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
//     setGlobalFilter: handleSearch,
//     handleReset,
//     setAllData,
//     debouncedGlobalFilter,
//   };
// };

// export const useExportHandler = () => {
//   const handleExportExcel = (filteredData, columns) => {
//     const exportData = filteredData.map((row) => {
//       const formattedRow = {};
      
//       columns.forEach((column) => {
//         const value = row[column.accessorKey];
//         formattedRow[column.header] = value || "N/A";
//       });
      
//       return formattedRow;
//     });

//     // Generate filename with current date
//     const today = new Date().toISOString().split('T')[0];
//     const fileName = `OrderLifecycle_Report_${today}`;

//     downloadExcel(exportData, fileName);
//   };

//   return { handleExportExcel };
// };
// components/order-lifecycle/orderLifecycleFunctions.js
import { useState, useEffect, useMemo, useCallback } from "react";
import { debounce } from "lodash";
import downloadExcel from "utils/exporttoexcel";

export const useOrderLifecycleData = (data, initialPage, pageSize) => {
  const [allData, setAllData] = useState(data);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
  
  // Days filters state
  const [daysFilters, setDaysFilters] = useState({
    PO_to_GRN_Days: { after: '', before: '' },
    GRN_to_Invoice_Days: { after: '', before: '' },
    Invoice_to_Dispatch_Days: { after: '', before: '' }
  });

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
    setAllData(data);
  }, [data]);

  const filteredData = useMemo(() => {
    let filtered = [...allData];

    // Global search filter - search by Reference No, Item Code, Sales Person, PO No, Customer
    if (debouncedGlobalFilter) {
      const searchTerm = debouncedGlobalFilter.toLowerCase().trim();
      filtered = filtered.filter(item => {
        const containsSearchTerm = (value) => {
          if (value === null || value === undefined) return false;
          return value.toString().toLowerCase().includes(searchTerm);
        };

        return (
          containsSearchTerm(item.CustomerRefNo) ||    // Reference No
          containsSearchTerm(item.Item_No) ||          // Item Code
          containsSearchTerm(item.Sales_Person) ||     // Sales Person
          containsSearchTerm(item.PO_No) ||            // PO No
          containsSearchTerm(item.Customer)            // Customer Name
        );
      });
    }

    // Days filters
    filtered = filtered.filter(item => {
      // Check each days column filter
      for (const [columnKey, filters] of Object.entries(daysFilters)) {
        const value = item[columnKey];
        
        // Skip if value is null, undefined, or empty
        if (value === null || value === undefined || value === '') {
          continue;
        }

        const numericValue = parseFloat(value);
        
        // Skip if value is not a valid number
        if (isNaN(numericValue)) {
          continue;
        }

        // Check "after" filter
        if (filters.after !== '' && filters.after !== null && filters.after !== undefined) {
          const afterValue = parseFloat(filters.after);
          if (!isNaN(afterValue) && numericValue <= afterValue) {
            return false; // Exclude this item
          }
        }

        // Check "before" filter
        if (filters.before !== '' && filters.before !== null && filters.before !== undefined) {
          const beforeValue = parseFloat(filters.before);
          if (!isNaN(beforeValue) && numericValue >= beforeValue) {
            return false; // Exclude this item
          }
        }
      }
      
      return true; // Include this item
    });

    return filtered;
  }, [allData, debouncedGlobalFilter, daysFilters]);

  const pageCount = Math.ceil(filteredData.length / pageSize);
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedGlobalFilter, daysFilters]);

  const handleReset = () => {
    setGlobalFilter("");
    setDebouncedGlobalFilter("");
    setDaysFilters({
      PO_to_GRN_Days: { after: '', before: '' },
      GRN_to_Invoice_Days: { after: '', before: '' },
      Invoice_to_Dispatch_Days: { after: '', before: '' }
    });
    setCurrentPage(1);
  };

  const handleSearch = useCallback((searchTerm) => {
    setGlobalFilter(searchTerm);
    setCurrentPage(1);
  }, []);

  const handleDaysFilterChange = useCallback((columnKey, filterType, value) => {
    setDaysFilters(prev => ({
      ...prev,
      [columnKey]: {
        ...prev[columnKey],
        [filterType]: value
      }
    }));
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
    handleReset,
    setAllData,
    debouncedGlobalFilter,
    daysFilters,
    handleDaysFilterChange,
  };
};

export const useExportHandler = () => {
  const handleExportExcel = (filteredData, columns) => {
    const exportData = filteredData.map((row) => {
      const formattedRow = {};
      
      columns.forEach((column) => {
        const value = row[column.accessorKey];
        formattedRow[column.header] = value || "N/A";
      });
      
      return formattedRow;
    });

    // Generate filename with current date
    const today = new Date().toISOString().split('T')[0];
    const fileName = `OrderLifecycle_Report_${today}`;

    downloadExcel(exportData, fileName);
  };

  return { handleExportExcel };
};