// components/CustomerCharts/CustomerOrdersLineTable.js
// Line-level Orders table scoped to one customer, embedded on
// pages/customers/[id].js above Payment Outstanding. Same search+status
// filter pattern as components/ordersLine/OrdersLineFilters.js /
// ordersLineFunctions.js, minus the Month/Export/Reset controls that don't
// apply to a single-customer view.

import { useState, useEffect, useMemo, useCallback } from "react";
import { debounce } from "lodash";
import { Button, ButtonGroup, InputGroup, Form, Spinner, Alert } from "react-bootstrap";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { tableColumns } from "./customerOrdersLineColumns";

const PAGE_SIZE = 10;

export default function CustomerOrdersLineTable({ customerCode }) {
  const [ordersLine, setOrdersLine] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const debouncedSearch = useMemo(() => debounce((v) => setDebouncedFilter(v || ""), 300), []);
  useEffect(() => {
    debouncedSearch(globalFilter);
    return () => debouncedSearch.cancel();
  }, [globalFilter, debouncedSearch]);

  const fetchData = useCallback(async (page) => {
    if (!customerCode) return;
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        search: debouncedFilter,
        status: statusFilter,
      });
      const res = await fetch(`/api/customers/${customerCode}/orders-list?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load orders");
      setOrdersLine(data.ordersLine || []);
      setTotalItems(data.totalItems || 0);
      setTotalPages(data.totalPages || 0);
    } catch (e) {
      setError(e.message);
      setOrdersLine([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerCode, debouncedFilter, statusFilter]);

  useEffect(() => { setCurrentPage(1); fetchData(1); }, [customerCode, debouncedFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (currentPage !== 1) fetchData(currentPage); }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const columns = useMemo(() => tableColumns(), []);
  const table = useReactTable({ data: ordersLine, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div>
      {error && <Alert variant="danger" className="mb-2">{error}</Alert>}

      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
        <ButtonGroup size="sm">
          {["All", "Open", "Closed"].map((s) => {
            const val = s === "All" ? "all" : s.toLowerCase();
            return (
              <Button key={s} variant={statusFilter === val ? "dark" : "outline-secondary"} onClick={() => setStatusFilter(val)}>
                {s}
              </Button>
            );
          })}
        </ButtonGroup>
        <InputGroup size="sm" style={{ maxWidth: 300 }}>
          <Form.Control placeholder="Search order lines…" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
        </InputGroup>
        <div className="text-muted small ms-auto">{totalItems} line{totalItems !== 1 ? "s" : ""}</div>
      </div>

      <div style={{ overflowX: "auto", maxHeight: 420 }}>
        <table className="table table-sm table-hover mb-0">
          <thead className="table-dark" style={{ position: "sticky", top: 0 }}>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} style={{ whiteSpace: "nowrap", fontSize: 12 }}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="text-center py-4"><Spinner animation="border" size="sm" /></td></tr>
            ) : ordersLine.length === 0 ? (
              <tr><td colSpan={columns.length} className="text-center text-muted py-4">No order lines found.</td></tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={{ fontSize: 13, whiteSpace: "nowrap" }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-2">
          <span className="text-muted small">Page {currentPage} of {totalPages}</span>
          <div className="d-flex gap-1">
            <Button size="sm" variant="outline-secondary" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>Prev</Button>
            <Button size="sm" variant="outline-secondary" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
