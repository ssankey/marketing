// components/ordersLine/ordersLineFunctions.js
import { useState, useEffect, useMemo, useCallback } from "react";
import { debounce } from "lodash";
import downloadExcel from "utils/exporttoexcel";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";

export const useOrdersLineData = (initialStatus = "all", initialPage = 1, pageSize = 20) => {
  const [ordersLine, setOrdersLine] = useState([]);
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
  const [allOrdersLineForFilters, setAllOrdersLineForFilters] = useState([]);
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

  const fetchOrdersLine = useCallback(async (params = {}) => {
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

      const response = await fetch(`/api/orders-line?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch order lines: ${response.status}`);
      }

      const data = await response.json();
      
      if (params.getAll) {
        return data.ordersLine;
      }
      
      setOrdersLine(data.ordersLine || []);
      setTotalItems(data.totalItems || 0);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error("Error fetching order lines:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllOrdersLineForFilters = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const response = await fetch(`/api/orders-line?getAll=true&fields=PostingDate`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAllOrdersLineForFilters(data.ordersLine || []);
      }
    } catch (error) {
      console.error("Error fetching order lines for filters:", error);
    }
  }, []);

  useEffect(() => {
    fetchOrdersLine();
    fetchAllOrdersLineForFilters();
  }, []);

  useEffect(() => {
    if (globalFilter !== debouncedGlobalFilter) return;
    
    if (shouldResetPage) {
      fetchOrdersLine({
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

  useEffect(() => {
    if (shouldResetPage || ordersLine.length === 0) return;
    
    fetchOrdersLine({ 
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
    
    fetchOrdersLine({
      page: 1,
      search: "",
      status: "all",
      month: "",
      fromDate: "",
      toDate: "",
      sortField: "PostingDate",
      sortDir: "desc"
    });
  }, [fetchOrdersLine]);

  const handleExportExcel = useCallback(async (columns) => {
    try {
      setLoading(true);
      
      const allFilteredOrdersLine = await fetchOrdersLine({
        getAll: true,
        search: debouncedGlobalFilter || "",
        status: statusFilter || "all",
        month: selectedMonth || "",
        fromDate: fromDate || "",
        toDate: toDate || "",
        sortField: sortField || "PostingDate",
        sortDir: sortDirection || "desc"
      });

      if (!allFilteredOrdersLine || allFilteredOrdersLine.length === 0) {
        setError("No data available for export");
        return;
      }

      const currencyFields = new Set(["Price", "OpenAmount"]);
      const dateFields = new Set(["PostingDate", "PODate", "DeliveryDate"]);

      const exportData = allFilteredOrdersLine.map((row) => {
        const formattedRow = {};
        
        columns.forEach((column) => {
          const key = column.accessorKey;
          const value = row[key];
          
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
      const fileName = `Orders_Line_${today}`;

      downloadExcel(exportData, fileName);
    } catch (error) {
      console.error("Export failed:", error);
      setError("Failed to export order lines: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [fetchOrdersLine, debouncedGlobalFilter, statusFilter, selectedMonth, fromDate, toDate, sortField, sortDirection]);

  return {
    ordersLine,
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
    allOrdersLineForFilters,
    setGlobalFilter: handleSearch,
    setStatusFilter: setStatusFilterWrapper,
    setSelectedMonth: setSelectedMonthWrapper,
    setFromDate: setFromDateWrapper,
    setToDate: setToDateWrapper,
    handleSort,
    handleReset,
    handlePageChange,
    handleExportExcel,
    setError
  };
};