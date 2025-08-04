
// components/orders/ordersFunctions.js
import { useState, useEffect, useMemo, useCallback } from "react";
import { debounce } from "lodash";
import downloadExcel from "utils/exporttoexcel";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";




export const useOrdersData = (orders, initialStatus, initialPage, pageSize) => {
  const [allData, setAllData] = useState(orders);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selectedMonth, setSelectedMonth] = useState(""); // Added missing state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortField, setSortField] = useState("DocDate");
  const [sortDirection, setSortDirection] = useState("desc");
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
        order.DocStatus.toLowerCase() === statusFilter.toLowerCase()
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
          containsSearchTerm(order.DocNum) ||
          containsSearchTerm(order.CardName) ||
          containsSearchTerm(order.CustomerPONo) ||
          containsSearchTerm(order.SalesEmployee) ||
          containsSearchTerm(order.ContactPerson)
        );
      });
    }

    // Month filter - Added missing month filtering logic
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const filterYear = parseInt(year);
      const filterMonth = parseInt(month);
      
      filtered = filtered.filter(order => {
        if (!order.DocDate) return false;
        
        const orderDate = new Date(order.DocDate);
        const orderYear = orderDate.getFullYear();
        const orderMonth = orderDate.getMonth() + 1; // getMonth() returns 0-11
        
        return orderYear === filterYear && orderMonth === filterMonth;
      });
    }

    // Date range filter
    if (fromDate || toDate) {
      filtered = filtered.filter(order => {
        if (!order.DocDate) return false;
        
        const orderDate = new Date(order.DocDate);
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

    // Sorting logic
    if (sortField) {
      filtered.sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (sortField === "DocTotal") {
          valA = a.DocCur === "INR" ? valA : valA * (a.ExchangeRate || 1);
          valB = b.DocCur === "INR" ? valB : valB * (b.ExchangeRate || 1);
        }

        if (sortField === "DocDate" || sortField === "DeliveryDate") {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [allData, statusFilter, debouncedGlobalFilter, selectedMonth, fromDate, toDate, sortField, sortDirection]);

  const pageCount = Math.ceil(filteredData.length / pageSize);
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedGlobalFilter, statusFilter, selectedMonth, fromDate, toDate, sortField, sortDirection]);

  const handleReset = () => {
    setGlobalFilter("");
    setDebouncedGlobalFilter("");
    setStatusFilter("all");
    setSelectedMonth(""); // Reset month filter
    setFromDate("");
    setToDate("");
    setSortField("DocDate");
    setSortDirection("desc");
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

  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
    setFiltersChanged(true);
  }, [sortField, sortDirection]);

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
    sortField,
    sortDirection,
    handleSort,
    handleReset,
    setAllData,
    debouncedGlobalFilter,
    filtersChanged,
    setFiltersChanged
  };
};

// export const useExportHandler = () => {
//   const handleExportExcel = (filteredData, columns) => {
//     const currencyFields = new Set(["DocTotal"]);
//     const dateFields = new Set(["DocDate", "DeliveryDate", "EmailSentDT"]);

//     const exportData = filteredData.map((row) => {
//       const formattedRow = {};
      
//       columns.forEach((column) => {
//         const value = row[column.accessorKey];
        
//         if (currencyFields.has(column.accessorKey)) {
//           const amt = row.DocCur === "INR" ? value : value * (row.ExchangeRate || 1);
//           formattedRow[column.header] = formatCurrency(amt).slice(1);
//         } else if (dateFields.has(column.accessorKey)) {
//           formattedRow[column.header] = formatDate(value);
//         } else if (column.accessorKey === "EmailSentDT") {
//           if (value) {
//             const dt = new Date(value);
//             const hasTime = row.EmailSentTM !== null && row.EmailSentTM !== undefined;
//             const h = hasTime ? Math.floor(row.EmailSentTM / 60) : dt.getHours();
//             const m = hasTime ? row.EmailSentTM % 60 : dt.getMinutes();
//             const day = String(dt.getDate()).padStart(2, "0");
//             const month = String(dt.getMonth() + 1).padStart(2, "0");
//             const year = dt.getFullYear();
//             formattedRow[column.header] = `${day}/${month}/${year} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
//           } else {
//             formattedRow[column.header] = "Not Sent";
//           }
//         } else if (column.accessorKey === "DocNum" && column.header === "Details") {
//           return;
//         } else {
//           formattedRow[column.header] = value || "N/A";
//         }
//       });
      
//       return formattedRow;
//     });

//     const columnStyles = columns
//       .filter(column => !(column.accessorKey === "DocNum" && column.header === "Details"))
//       .map(column => {
//         const style = {};
        
//         if (currencyFields.has(column.accessorKey)) {
//           style.cellFormat = '#,##0.00;[Red]-#,##0.00';
//         } else if (dateFields.has(column.accessorKey)) {
//           style.cellFormat = 'dd/mm/yyyy';
//         }
        
//         return style;
//       });

//     downloadExcel(
//       exportData, 
//       "Orders_Report",
//       columnStyles
//     );
//   };

//   return { handleExportExcel };
// };

// Update just your useExportHandler function with this version:

export const useExportHandler = () => {
  const handleExportExcel = (filteredData, columns) => {
    const currencyFields = new Set(["DocTotal"]);
    const dateFields = new Set(["DocDate", "DeliveryDate"]);

    const exportData = filteredData.map((row) => {
      const formattedRow = {};
      
      columns.forEach((column) => {
        // Skip the Details column
        if (column.accessorKey === "DocNum" && column.header === "Details") {
          return;
        }

        const value = row[column.accessorKey];
        
        if (currencyFields.has(column.accessorKey)) {
          // Convert to number and round to 2 decimal places
          const amt = row.DocCur === "INR" ? value : value * (row.ExchangeRate || 1);
          const cleanNumber = Math.round((Number(amt) || 0) * 100) / 100;
          
          // Force Excel to recognize as number by ensuring it's a proper number
          formattedRow[column.header] = +cleanNumber; // The + operator ensures it's a number
          
        } else if (dateFields.has(column.accessorKey)) {
          // Convert to Excel-friendly date format
          if (value) {
            const date = new Date(value);
            // Use Excel's preferred format: MM/DD/YYYY  
            formattedRow[column.header] = date.toLocaleDateString('en-US');
          } else {
            formattedRow[column.header] = "";
          }
        } else if (column.accessorKey === "EmailSentDT") {
          if (value) {
            const dt = new Date(value);
            const hasTime = row.EmailSentTM !== null && row.EmailSentTM !== undefined;
            const h = hasTime ? Math.floor(row.EmailSentTM / 60) : dt.getHours();
            const m = hasTime ? row.EmailSentTM % 60 : dt.getMinutes();
            
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

    // Simple approach - let Excel auto-detect the formats
    const today = new Date().toISOString().split('T')[0];
    const fileName = `Orders_Report_${today}`;

    // Call downloadExcel without complex formatting - Excel should auto-detect numbers
    downloadExcel(exportData, fileName);
  };

  return { handleExportExcel };
};
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

export const useEmailHandler = (setTableData) => {
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

      setTableData((prev) =>
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