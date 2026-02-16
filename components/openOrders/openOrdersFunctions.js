
// components/openOrders/openOrdersFunctions.js
import { useState, useEffect, useMemo, useCallback } from "react";
import { debounce } from "lodash";
import downloadExcel from "utils/exporttoexcel";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";

export const useOpenOrdersData = (initialStatus = "all", initialPage = 1, pageSize = 20) => {
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
  const [sortField, setSortField] = useState("PostingDate");
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
        sortField: params.sortField || sortField || "PostingDate",
        sortDir: params.sortDir || sortDirection || "desc",
        ...(params.month && { month: params.month }),
        ...(params.fromDate && { fromDate: params.fromDate }),
        ...(params.toDate && { toDate: params.toDate }),
        ...(params.getAll && { getAll: "true" })
      });

      const response = await fetch(`/api/open-orders?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch open orders: ${response.status}`);
      }

      const data = await response.json();
      
      if (params.getAll) {
        return data.orders;
      }
      
      setOrders(data.orders || []);
      setTotalItems(data.totalItems || 0);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error("Error fetching open orders:", error);
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
      
      const response = await fetch(`/api/open-orders?getAll=true&fields=PostingDate`, {
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
        sortField: sortField || "PostingDate",
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
      sortField: sortField || "PostingDate",
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
    setSortField("PostingDate");
    setSortDirection("desc");
    setCurrentPage(1);
    
    fetchOrders({
      page: 1,
      search: "",
      status: "all",
      month: "",
      fromDate: "",
      toDate: "",
      sortField: "PostingDate",
      sortDir: "desc"
    });
  }, [fetchOrders]);

  // Export function that fetches all data
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
        sortField: sortField || "PostingDate",
        sortDir: sortDirection || "desc"
      });

      if (!allFilteredOrders || allFilteredOrders.length === 0) {
        setError("No data available for export");
        return;
      }

      const numberFields = new Set(["Price", "OpenAmount"]);
      const dateFields = new Set(["PostingDate", "PODate", "DeliveryDate"]);

      const exportData = allFilteredOrders.map((row) => {
        const formattedRow = {};
        
        columns.forEach((column) => {
          const value = row[column.accessorKey];
          
          if (numberFields.has(column.accessorKey)) {
            const numericValue = Number(value) || 0;
            formattedRow[column.header] = +numericValue.toFixed(2);
          } else if (dateFields.has(column.accessorKey)) {
            if (value) {
              const date = new Date(value);
              formattedRow[column.header] = date.toLocaleDateString('en-US');
            } else {
              formattedRow[column.header] = "";
            }
          } else if (column.accessorKey === "CustomerVendorName" || column.accessorKey === "ItemName") {
            formattedRow[column.header] = value || "N/A";
          } else {
            formattedRow[column.header] = value || "N/A";
          }
        });
        
        return formattedRow;
      });

      const today = new Date().toISOString().split('T')[0];
      const fileName = `OpenOrders_Report_${today}`;

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

// Keep existing useExportHandler for backward compatibility
export const useExportHandler = () => {
  const handleExportExcel = () => {
    console.warn("useExportHandler is deprecated. Use handleExportExcel from useOpenOrdersData instead.");
  };

  return { handleExportExcel };
};

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