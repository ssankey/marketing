// components/openDO/openDOFunctions.js
// Same data-fetching/pagination/export pattern as
// components/openOrders/openOrdersFunctions.js's useOpenOrdersData, adapted
// for delivery order lines: status defaults to "open" (no "all" option —
// this table only ever shows one of Open/Closed/Canceled at a time), and
// there's no fromDate/toDate UI beyond the Month dropdown.

import { useState, useEffect, useMemo, useCallback } from "react";
import { debounce } from "lodash";
import downloadExcel from "utils/exporttoexcel";

export const useOpenDOData = (initialStatus = "open", initialPage = 1, pageSize = 20) => {
  const [deliveryOrdersLine, setDeliveryOrdersLine] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shouldResetPage, setShouldResetPage] = useState(false);

  const debouncedSearch = useMemo(
    () => debounce((searchTerm = "") => setDebouncedGlobalFilter(searchTerm || ""), 300),
    []
  );

  useEffect(() => {
    debouncedSearch(globalFilter || "");
    return () => debouncedSearch.cancel();
  }, [globalFilter, debouncedSearch]);

  const fetchDeliveryOrders = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams({
        page: params.page || currentPage,
        pageSize,
        search: (params.search !== undefined ? params.search : debouncedGlobalFilter) || "",
        status: params.status || statusFilter || "open",
        ...(params.month && { month: params.month }),
        ...(params.getAll && { getAll: "true" }),
      });

      const response = await fetch(`/api/open-do?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`Failed to fetch delivery orders: ${response.status}`);

      const data = await response.json();

      if (params.getAll) {
        return data.deliveryOrdersLine;
      }

      setDeliveryOrdersLine(data.deliveryOrdersLine || []);
      setTotalItems(data.totalItems || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error("Error fetching open delivery orders:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchDeliveryOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (globalFilter !== debouncedGlobalFilter) return;
    if (shouldResetPage) {
      fetchDeliveryOrders({
        page: 1,
        search: debouncedGlobalFilter || "",
        status: statusFilter || "open",
        month: selectedMonth || "",
      });
      setCurrentPage(1);
      setShouldResetPage(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedGlobalFilter, statusFilter, selectedMonth, shouldResetPage]);

  useEffect(() => {
    if (shouldResetPage || deliveryOrdersLine.length === 0) return;
    fetchDeliveryOrders({
      page: currentPage,
      search: debouncedGlobalFilter || "",
      status: statusFilter || "open",
      month: selectedMonth || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleSearch = useCallback((searchTerm = "") => {
    setGlobalFilter(searchTerm || "");
    setShouldResetPage(true);
  }, []);

  const setStatusFilterWrapper = useCallback((status = "open") => {
    setStatusFilter(status || "open");
    setShouldResetPage(true);
  }, []);

  const setSelectedMonthWrapper = useCallback((month = "") => {
    setSelectedMonth(month || "");
    setShouldResetPage(true);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage((prev) => (newPage !== prev ? newPage : prev));
  }, []);

  // Used by the Pick Slip column's "select all" checkbox, which needs every
  // DeliveryNo matching the current filters — not just the current page —
  // so it's a standalone fetch (own try/catch, doesn't touch the shared
  // `loading` flag) rather than reusing fetchDeliveryOrders/getAll, which
  // would otherwise flash the whole table into its loading state just to
  // compute a selection.
  const fetchAllMatchingDeliveryNos = useCallback(async () => {
    const token = localStorage.getItem("token");
    const queryParams = new URLSearchParams({
      page: 1,
      pageSize,
      search: debouncedGlobalFilter || "",
      status: statusFilter || "open",
      getAll: "true",
      ...(selectedMonth && { month: selectedMonth }),
    });
    const response = await fetch(`/api/open-do?${queryParams}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Failed to fetch delivery orders: ${response.status}`);
    const data = await response.json();
    return Array.from(new Set((data.deliveryOrdersLine || []).map((r) => r.DeliveryNo).filter(Boolean)));
  }, [debouncedGlobalFilter, statusFilter, selectedMonth, pageSize]);

  const handleExportExcel = useCallback(async (columns) => {
    try {
      setLoading(true);
      const allRows = await fetchDeliveryOrders({
        getAll: true,
        search: debouncedGlobalFilter || "",
        status: statusFilter || "open",
        month: selectedMonth || "",
      });

      if (!allRows || allRows.length === 0) {
        setError("No data available for export");
        return;
      }

      const dateFields = new Set(["SODate", "DeliveryDate"]);

      const exportData = allRows.map((row) => {
        const formattedRow = {};
        columns.forEach((column) => {
          const key = column.accessorKey;
          if (!key) return; // skip the Pick Slip action column, which has no accessorKey
          const value = row[key];
          if (dateFields.has(key)) {
            formattedRow[column.header] = value ? new Date(value).toLocaleDateString("en-US") : "";
          } else {
            formattedRow[column.header] = value ?? "N/A";
          }
        });
        return formattedRow;
      });

      const today = new Date().toISOString().split("T")[0];
      downloadExcel(exportData, `Open_DO_Report_${today}`);
    } catch (err) {
      console.error("Delivery order export failed:", err);
      setError("Failed to export delivery orders: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchDeliveryOrders, debouncedGlobalFilter, statusFilter, selectedMonth]);

  return {
    deliveryOrdersLine,
    totalItems,
    totalPages,
    currentPage,
    loading,
    error,
    globalFilter,
    statusFilter,
    selectedMonth,
    setGlobalFilter: handleSearch,
    setStatusFilter: setStatusFilterWrapper,
    setSelectedMonth: setSelectedMonthWrapper,
    handlePageChange,
    handleExportExcel,
    fetchAllMatchingDeliveryNos,
    setError,
  };
};
