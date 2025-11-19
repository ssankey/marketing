
// // components/orders/ordersFunctions.js
// import { useState, useEffect, useMemo, useCallback } from "react";
// import { debounce } from "lodash";
// import downloadExcel from "utils/exporttoexcel";
// import { formatCurrency } from "utils/formatCurrency";
// import { formatDate } from "utils/formatDate";




// export const useOrdersData = (orders, initialStatus, initialPage, pageSize) => {
//   const [allData, setAllData] = useState(orders);
//   const [currentPage, setCurrentPage] = useState(initialPage);
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
//   const [statusFilter, setStatusFilter] = useState(initialStatus);
//   const [selectedMonth, setSelectedMonth] = useState(""); // Added missing state
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [sortField, setSortField] = useState("DocDate");
//   const [sortDirection, setSortDirection] = useState("desc");
//   const [filtersChanged, setFiltersChanged] = useState(false);

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
//         order.DocStatus.toLowerCase() === statusFilter.toLowerCase()
//       );
//     }

//     // Global search filter
//     if (debouncedGlobalFilter) {
//       const searchTerm = debouncedGlobalFilter.toLowerCase().trim();
//       filtered = filtered.filter(order => {
//         const containsSearchTerm = (value) => {
//           if (value === null || value === undefined) return false;
//           return value.toString().toLowerCase().includes(searchTerm);
//         };

//         return (
//           containsSearchTerm(order.DocNum) ||
//           containsSearchTerm(order.CardName) ||
//           containsSearchTerm(order.CustomerPONo) ||
//           containsSearchTerm(order.SalesEmployee) ||
//           containsSearchTerm(order.ContactPerson)
//         );
//       });
//     }

//     // Month filter - Added missing month filtering logic
//     if (selectedMonth) {
//       const [year, month] = selectedMonth.split('-');
//       const filterYear = parseInt(year);
//       const filterMonth = parseInt(month);
      
//       filtered = filtered.filter(order => {
//         if (!order.DocDate) return false;
        
//         const orderDate = new Date(order.DocDate);
//         const orderYear = orderDate.getFullYear();
//         const orderMonth = orderDate.getMonth() + 1; // getMonth() returns 0-11
        
//         return orderYear === filterYear && orderMonth === filterMonth;
//       });
//     }

//     // Date range filter
//     if (fromDate || toDate) {
//       filtered = filtered.filter(order => {
//         if (!order.DocDate) return false;
        
//         const orderDate = new Date(order.DocDate);
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

//     // Sorting logic
//     if (sortField) {
//       filtered.sort((a, b) => {
//         let valA = a[sortField];
//         let valB = b[sortField];

//         if (sortField === "DocTotal") {
//           valA = a.DocCur === "INR" ? valA : valA * (a.ExchangeRate || 1);
//           valB = b.DocCur === "INR" ? valB : valB * (b.ExchangeRate || 1);
//         }

//         if (sortField === "DocDate" || sortField === "DeliveryDate") {
//           valA = new Date(valA).getTime();
//           valB = new Date(valB).getTime();
//           return sortDirection === "asc" ? valA - valB : valB - valA;
//         }

//         if (typeof valA === 'string') valA = valA.toLowerCase();
//         if (typeof valB === 'string') valB = valB.toLowerCase();

//         if (valA < valB) return sortDirection === "asc" ? -1 : 1;
//         if (valA > valB) return sortDirection === "asc" ? 1 : -1;
//         return 0;
//       });
//     }

//     return filtered;
//   }, [allData, statusFilter, debouncedGlobalFilter, selectedMonth, fromDate, toDate, sortField, sortDirection]);

//   const pageCount = Math.ceil(filteredData.length / pageSize);
//   const pageData = useMemo(() => {
//     const start = (currentPage - 1) * pageSize;
//     return filteredData.slice(start, start + pageSize);
//   }, [filteredData, currentPage, pageSize]);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [debouncedGlobalFilter, statusFilter, selectedMonth, fromDate, toDate, sortField, sortDirection]);

//   const handleReset = () => {
//     setGlobalFilter("");
//     setDebouncedGlobalFilter("");
//     setStatusFilter("all");
//     setSelectedMonth(""); // Reset month filter
//     setFromDate("");
//     setToDate("");
//     setSortField("DocDate");
//     setSortDirection("desc");
//     setCurrentPage(1);
//     setFiltersChanged(false);
//   };

//   const handleSearch = useCallback((searchTerm) => {
//     setGlobalFilter(searchTerm);
//     setCurrentPage(1);
//     setFiltersChanged(true);
//   }, []);

//   const setStatusFilterWrapper = useCallback((status) => {
//     setStatusFilter(status);
//     setFiltersChanged(true);
//   }, []);

//   const setSelectedMonthWrapper = useCallback((month) => {
//     setSelectedMonth(month);
//     setFiltersChanged(true);
//   }, []);

//   const setFromDateWrapper = useCallback((date) => {
//     setFromDate(date);
//     setFiltersChanged(true);
//   }, []);

//   const setToDateWrapper = useCallback((date) => {
//     setToDate(date);
//     setFiltersChanged(true);
//   }, []);

//   const handleSort = useCallback((field) => {
//     if (sortField === field) {
//       setSortDirection(sortDirection === "asc" ? "desc" : "asc");
//     } else {
//       setSortField(field);
//       setSortDirection("asc");
//     }
//     setCurrentPage(1);
//     setFiltersChanged(true);
//   }, [sortField, sortDirection]);

//   return {
//     allData,
//     filteredData,
//     pageData,
//     pageCount,
//     currentPage,
//     setCurrentPage,
//     globalFilter,
//     setGlobalFilter: handleSearch,
//     statusFilter,
//     setStatusFilter: setStatusFilterWrapper,
//     selectedMonth, // Added to return
//     setSelectedMonth: setSelectedMonthWrapper, // Added to return
//     fromDate,
//     setFromDate: setFromDateWrapper,
//     toDate,
//     setToDate: setToDateWrapper,
//     sortField,
//     sortDirection,
//     handleSort,
//     handleReset,
//     setAllData,
//     debouncedGlobalFilter,
//     filtersChanged,
//     setFiltersChanged
//   };
// };


// export const useExportHandler = () => {
//   const handleExportExcel = (filteredData, columns) => {
//     const currencyFields = new Set(["DocTotal"]);
//     const dateFields = new Set(["DocDate", "DeliveryDate"]);

//     const exportData = filteredData.map((row) => {
//       const formattedRow = {};
      
//       columns.forEach((column) => {
//         // Skip the Details column
//         if (column.accessorKey === "DocNum" && column.header === "Details") {
//           return;
//         }

//         const value = row[column.accessorKey];
        
//         if (currencyFields.has(column.accessorKey)) {
//           // Convert to number and round to 2 decimal places
//           const amt = row.DocCur === "INR" ? value : value * (row.ExchangeRate || 1);
//           const cleanNumber = Math.round((Number(amt) || 0) * 100) / 100;
          
//           // Force Excel to recognize as number by ensuring it's a proper number
//           formattedRow[column.header] = +cleanNumber; // The + operator ensures it's a number
          
//         } else if (dateFields.has(column.accessorKey)) {
//           // Convert to Excel-friendly date format
//           if (value) {
//             const date = new Date(value);
//             // Use Excel's preferred format: MM/DD/YYYY  
//             formattedRow[column.header] = date.toLocaleDateString('en-US');
//           } else {
//             formattedRow[column.header] = "";
//           }
//         } else if (column.accessorKey === "EmailSentDT") {
//           if (value) {
//             const dt = new Date(value);
//             const hasTime = row.EmailSentTM !== null && row.EmailSentTM !== undefined;
//             const h = hasTime ? Math.floor(row.EmailSentTM / 60) : dt.getHours();
//             const m = hasTime ? row.EmailSentTM % 60 : dt.getMinutes();
            
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

//     // Simple approach - let Excel auto-detect the formats
//     const today = new Date().toISOString().split('T')[0];
//     const fileName = `Orders_Report_${today}`;

//     // Call downloadExcel without complex formatting - Excel should auto-detect numbers
//     downloadExcel(exportData, fileName);
//   };

//   return { handleExportExcel };
// };
// export const useOrderDetails = () => {
//   const [showDetailsModal, setShowDetailsModal] = useState(false);
//   const [orderDetails, setOrderDetails] = useState([]);
//   const [loadingDetails, setLoadingDetails] = useState(false);
//   const [selectedOrder, setSelectedOrder] = useState(null);
//   const [error, setError] = useState(null);

//   const fetchOrderDetails = async (orderNo, customerPONo) => {
//     setLoadingDetails(true);
//     setError(null);
    
//     try {
//       const params = new URLSearchParams();
//       if (orderNo) params.append('orderNo', orderNo);
//       if (customerPONo) params.append('customerPONo', customerPONo);
      
//       const url = `/api/modal/orderDetails?${params.toString()}`;
      
//       const response = await fetch(url);
      
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || `HTTP ${response.status}`);
//       }
      
//       const data = await response.json();
      
//       if (!Array.isArray(data)) {
//         throw new Error('Invalid response format - expected array');
//       }
      
//       if (data.length === 0) {
//         setError('No records found for the selected criteria');
//       }
      
//       setOrderDetails(data);
//       setShowDetailsModal(true);
      
//     } catch (error) {
//       console.error("Error fetching order details:", error);
//       setError(`Failed to load order details: ${error.message}`);
//     } finally {
//       setLoadingDetails(false);
//     }
//   };

//   const handleOrderNoClick = (orderNo, e) => {
//     e.preventDefault();
//     if (!orderNo) {
//       setError('Order number is required');
//       return;
//     }
    
//     setSelectedOrder({ type: 'orderNo', value: orderNo });
//     fetchOrderDetails(orderNo, null);
//   };

//   const handleCustomerPONoClick = (customerPONo, e) => {
//     e.preventDefault();
//     if (!customerPONo) {
//       setError('Customer PO number is required');
//       return;
//     }
    
//     setSelectedOrder({ type: 'customerPONo', value: customerPONo });
//     fetchOrderDetails(null, customerPONo);
//   };

//   const closeModal = () => {
//     setShowDetailsModal(false);
//     setError(null);
//   };

//   return {
//     showDetailsModal,
//     orderDetails,
//     loadingDetails,
//     selectedOrder,
//     error,
//     setError,
//     handleOrderNoClick,
//     handleCustomerPONoClick,
//     closeModal
//   };
// };

// export const useEmailHandler = (setTableData) => {
//   const sendMail = async (row) => {
//     try {
//       const res = await fetch("/api/email/sendOrderEmail", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ docEntry: row.DocEntry, docNum: row.DocNum }),
//       });

//       const data = await res.json();

//       if (!data.success) {
//         alert(data.message || "Email sending failed.");
//         return;
//       }

//       setTableData((prev) =>
//         prev.map((r) =>
//           r.DocEntry === row.DocEntry
//             ? {
//                 ...r,
//                 EmailSentDT: data.EmailSentDT,
//                 EmailSentTM: data.EmailSentTM,
//               }
//             : r
//         )
//       );

//       alert("Order confirmation email sent successfully!");
//     } catch (e) {
//       console.error(e);
//       alert("Failed to send email: " + e.message);
//     }
//   };

//   return { sendMail };
// };


// components/orders/ordersFunctions.js
import { useState, useEffect, useMemo, useCallback } from "react";
import { debounce } from "lodash";
import downloadExcel from "utils/exporttoexcel";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import { formatTime } from "utils/formatTime";

export const useOrdersData = (initialStatus = "all", initialPage = 1, pageSize = 20) => {
  const [orders, setOrders] = useState([]);
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
  const [allOrdersForFilters, setAllOrdersForFilters] = useState([]);
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

  // Fetch orders from API
  const fetchOrders = useCallback(async (params = {}) => {
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

      const response = await fetch(`/api/orders?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data = await response.json();
      
      if (params.getAll) {
        return data.orders;
      }
      
      setOrders(data.orders || []);
      setTotalItems(data.totalItems || 0);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all orders for month dropdown
  const fetchAllOrdersForFilters = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const response = await fetch(`/api/orders?getAll=true&fields=DocDate`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAllOrdersForFilters(data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders for filters:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchOrders();
    fetchAllOrdersForFilters();
  }, []);

  // Handle filter changes - reset to page 1
  useEffect(() => {
    if (globalFilter !== debouncedGlobalFilter) return;
    
    if (shouldResetPage) {
      fetchOrders({
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
    if (shouldResetPage || orders.length === 0) return;
    
    fetchOrders({ 
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
    
    fetchOrders({
      page: 1,
      search: "",
      status: "all",
      month: "",
      fromDate: "",
      toDate: "",
      sortField: "DocDate",
      sortDir: "desc"
    });
  }, [fetchOrders]);

  // // Export function that fetches all data
  // const handleExportExcel = useCallback(async (columns) => {
  //   try {
  //     setLoading(true);
      
  //     const allFilteredOrders = await fetchOrders({
  //       getAll: true,
  //       search: debouncedGlobalFilter || "",
  //       status: statusFilter || "all",
  //       month: selectedMonth || "",
  //       fromDate: fromDate || "",
  //       toDate: toDate || "",
  //       sortField: sortField || "DocDate",
  //       sortDir: sortDirection || "desc"
  //     });

  //     if (!allFilteredOrders || allFilteredOrders.length === 0) {
  //       setError("No data available for export");
  //       return;
  //     }

  //     const currencyFields = new Set(["DocTotal"]);
  //     const dateFields = new Set(["DocDate", "DeliveryDate"]);

  //     const exportData = allFilteredOrders.map((row) => {
  //       const formattedRow = {};
        
  //       columns.forEach((column) => {
  //         if (column.accessorKey === "DocNum" && column.header === "Details") {
  //           return;
  //         }

  //         const value = row[column.accessorKey];
          
  //         if (currencyFields.has(column.accessorKey)) {
  //           const amt = row.DocCur === "INR" ? value : value * (row.ExchangeRate || 1);
  //           const cleanNumber = Math.round((Number(amt) || 0) * 100) / 100;
  //           formattedRow[column.header] = +cleanNumber;
  //         } else if (dateFields.has(column.accessorKey)) {
  //           if (value) {
  //             const date = new Date(value);
  //             formattedRow[column.header] = date.toLocaleDateString('en-US');
  //           } else {
  //             formattedRow[column.header] = "";
  //           }
  //         } else if (column.accessorKey === "EmailSentDT") {
  //           if (value) {
  //             const dt = new Date(value);
  //             const hasTime = row.EmailSentTM !== null && row.EmailSentTM !== undefined;
  //             const h = hasTime ? Math.floor(row.EmailSentTM / 60) : dt.getHours();
  //             const m = hasTime ? row.EmailSentTM % 60 : dt.getMinutes();
              
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

  //     const today = new Date().toISOString().split('T')[0];
  //     const fileName = `Orders_Report_${today}`;

  //     downloadExcel(exportData, fileName);
  //   } catch (error) {
  //     console.error("Export failed:", error);
  //     setError("Failed to export orders: " + error.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [fetchOrders, debouncedGlobalFilter, statusFilter, selectedMonth, fromDate, toDate, sortField, sortDirection]);

  const handleExportExcel = useCallback(async (columns) => {
  try {
    setLoading(true);
    
    const allFilteredOrders = await fetchOrders({
      getAll: true,
      search: debouncedGlobalFilter || "",
      status: statusFilter || "all",
      month: selectedMonth || "",
      fromDate: fromDate || "",
      toDate: toDate || "",
      sortField: sortField || "DocDate",
      sortDir: sortDirection || "desc"
    });

    if (!allFilteredOrders || allFilteredOrders.length === 0) {
      setError("No data available for export");
      return;
    }

    const currencyFields = new Set(["DocTotal"]);
    const dateFields = new Set(["DocDate", "DeliveryDate"]);
    const timeFields = new Set(["CreateTs"]); // Add this line

    const exportData = allFilteredOrders.map((row) => {
      const formattedRow = {};
      
      columns.forEach((column) => {
        if (column.accessorKey === "DocNum" && column.header === "Details") {
          return;
        }

        const value = row[column.accessorKey];
        
        if (currencyFields.has(column.accessorKey)) {
          const amt = row.DocCur === "INR" ? value : value * (row.ExchangeRate || 1);
          const cleanNumber = Math.round((Number(amt) || 0) * 100) / 100;
          formattedRow[column.header] = +cleanNumber;
        } else if (dateFields.has(column.accessorKey)) {
          if (value) {
            const date = new Date(value);
            formattedRow[column.header] = date.toLocaleDateString('en-US');
          } else {
            formattedRow[column.header] = "";
          }
        } else if (timeFields.has(column.accessorKey)) {
          // Debug the raw value to understand the format
          console.log(`Debug ${column.accessorKey}:`, value, 'formatted:', formatTime(value));
          
          if (value !== null && value !== undefined) {
            formattedRow[column.header] = formatTime(value);
          } else {
            formattedRow[column.header] = "";
          }
        } else if (column.accessorKey === "EmailSentDT") {
          if (value) {
            const dt = new Date(value);
            const hasTime = row.EmailSentTM !== null && row.EmailSentTM !== undefined;
            const h = hasTime ? Math.floor(row.EmailSentTM / 60) : dt.getHours();
            const m = hasTime ? row.EmailSentTM % 60 : dt.getMinutes();
            
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

    const today = new Date().toISOString().split('T')[0];
    const fileName = `Orders_Report_${today}`;

    downloadExcel(exportData, fileName);
  } catch (error) {
    console.error("Export failed:", error);
    setError("Failed to export orders: " + error.message);
  } finally {
    setLoading(false);
  }
}, [fetchOrders, debouncedGlobalFilter, statusFilter, selectedMonth, fromDate, toDate, sortField, sortDirection]);
  
  return {
    orders,
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
    allOrdersForFilters,
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
    setOrders
  };
};

// Keep the existing useOrderDetails and useEmailHandler hooks unchanged
export const useOrderDetails = () => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState(null);

  const fetchOrderDetails = async (orderNo, customerPONo) => {
    setLoadingDetails(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (orderNo) params.append('orderNo', orderNo);
      if (customerPONo) params.append('customerPONo', customerPONo);
      
      const url = `/api/modal/orderDetails?${params.toString()}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format - expected array');
      }
      
      if (data.length === 0) {
        setError('No records found for the selected criteria');
      }
      
      setOrderDetails(data);
      setShowDetailsModal(true);
      
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError(`Failed to load order details: ${error.message}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOrderNoClick = (orderNo, e) => {
    e.preventDefault();
    if (!orderNo) {
      setError('Order number is required');
      return;
    }
    
    setSelectedOrder({ type: 'orderNo', value: orderNo });
    fetchOrderDetails(orderNo, null);
  };

  const handleCustomerPONoClick = (customerPONo, e) => {
    e.preventDefault();
    if (!customerPONo) {
      setError('Customer PO number is required');
      return;
    }
    
    setSelectedOrder({ type: 'customerPONo', value: customerPONo });
    fetchOrderDetails(null, customerPONo);
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setError(null);
  };

  return {
    showDetailsModal,
    orderDetails,
    loadingDetails,
    selectedOrder,
    error,
    setError,
    handleOrderNoClick,
    handleCustomerPONoClick,
    closeModal
  };
};

export const useEmailHandler = (setOrders) => {
  const sendMail = async (row) => {
    try {
      const res = await fetch("/api/email/sendOrderEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docEntry: row.DocEntry, docNum: row.DocNum }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Email sending failed.");
        return;
      }

      setOrders((prev) =>
        prev.map((r) =>
          r.DocEntry === row.DocEntry
            ? {
                ...r,
                EmailSentDT: data.EmailSentDT,
                EmailSentTM: data.EmailSentTM,
              }
            : r
        )
      );

      alert("Order confirmation email sent successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to send email: " + e.message);
    }
  };

  return { sendMail };
};

export const useExportHandler = () => {
  const handleExportExcel = () => {
    console.warn("useExportHandler is deprecated. Use handleExportExcel from useOrdersData instead.");
  };

  return { handleExportExcel };
};