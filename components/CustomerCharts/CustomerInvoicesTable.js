// components/CustomerCharts/CustomerInvoicesTable.js
// Line-level Invoices table scoped to one customer, embedded on
// pages/customers/[id].js above Payment Outstanding. Same search+status
// filter pattern as components/invoices/InvoicesFilters.js /
// invoicesFunctions.js, minus Month/Export/Reset, plus a Canceled status
// button (the app-wide table only exposes All/Open/Closed). UI matches the
// "cd-" design system used throughout pages/customers/[id].js (same as
// pages/products/[id].js's "pd-" table) instead of the plain Bootstrap
// table the app-wide Invoices list uses.

import { useState, useEffect, useMemo, useCallback } from "react";
import { debounce } from "lodash";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { tableColumns } from "./customerInvoicesColumns";
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";

const PAGE_SIZE = 10;

export default function CustomerInvoicesTable({ customerCode }) {
  const [invoices, setInvoices] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

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
      const res = await fetch(`/api/customers/${customerCode}/invoices-list?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load invoices");
      setInvoices(data.invoices || []);
      setTotalItems(data.totalItems || 0);
      setTotalPages(data.totalPages || 0);
    } catch (e) {
      setError(e.message);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerCode, debouncedFilter, statusFilter]);

  useEffect(() => { setCurrentPage(1); fetchData(1); }, [customerCode, debouncedFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (currentPage !== 1) fetchData(currentPage); }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = async () => {
    if (!customerCode) return;
    try {
      setExporting(true);
      const params = new URLSearchParams({ getAll: "true", search: debouncedFilter, status: statusFilter });
      const res = await fetch(`/api/customers/${customerCode}/invoices-list?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load invoices for export");
      const rows = (data.invoices || []).map((r) => ({
        "INV#": r.DocNum,
        Type: r.Type || "IN",
        "Credit Note No": r.Type === "CN" ? r["Credit Note No"] : "",
        "Invoice Posting Dt.": formatDate(r["Invoice Posting Dt."]),
        "SO No": r["SO No"],
        "SO Date": formatDate(r["SO Date"]),
        "SO Customer Ref. No": r["Customer ref no"],
        "Contact Person": r.ContactPerson,
        "Item No.": r["Item No."],
        "Item/Service Description": r["Item/Service Description"],
        "Cas No": r["Cas No"],
        Category: r.Category,
        "Vendor Catalog No.": r["Vendor Catalog No."],
        PKZ: r.Packsize,
        Qty: r["Qty."],
        Status: r["Document Status"],
        "Tracking Number": r["Tracking Number"],
        "Courier Service": r["Courier Service"],
        "Dispatch Date": formatDate(r["Dispatch Date"]),
        "Unit Sales Price": Number(r["Unit Sales Price"]) || 0,
        "Total Sales Price/Open Value": Number(r["Total Sales Price"]) || 0,
        BatchNum: r.BatchNum,
        Mkt_Feedback: r.Mkt_Feedback,
      }));
      downloadExcel(rows, `Invoice_Lines_${customerCode}`, {
        "Unit Sales Price": { type: "currency" },
        "Total Sales Price/Open Value": { type: "currency" },
      });
    } catch (e) {
      console.error("Invoice lines export failed:", e);
      alert("Failed to export invoice lines. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const columns = useMemo(() => tableColumns, []);
  const table = useReactTable({ data: invoices, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div>
      {error && <div className="cd-error">{error}</div>}

      <div className="cd-section-controls mb-3" style={{ justifyContent: "space-between", width: "100%" }}>
        <div className="cd-mode-toggle">
          {["All", "Open", "Closed", "Canceled"].map((s) => {
            const val = s === "All" ? "all" : s.toLowerCase();
            return (
              <button key={s} type="button" className={`cd-mode-btn ${statusFilter === val ? "active" : ""}`} onClick={() => setStatusFilter(val)}>
                {s}
              </button>
            );
          })}
        </div>
        <div className="cd-field" style={{ width: 280 }}>
          <input
            className="cd-input"
            style={{ width: "100%" }}
            placeholder="Search invoices…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
        <div className="cd-pagination-info">{totalItems} line{totalItems !== 1 ? "s" : ""}</div>
        <button type="button" className="cd-export-btn" onClick={handleExport} disabled={exporting || totalItems === 0}>
          {exporting ? "Exporting…" : "Export Excel"}
        </button>
      </div>

      <div className="cd-table-card">
        <div className="cd-table-scroll" style={{ maxHeight: 460 }}>
          <table className="cd-table">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} className={h.column.columnDef.align === "right" ? "cd-th-right" : "cd-th-left"}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className="cd-empty">Loading…</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={columns.length} className="cd-empty">No invoices found.</td></tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={cell.column.columnDef.align === "right" ? "cd-num" : ""}>
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
          <div className="cd-pagination">
            <div className="cd-pagination-info">Page {currentPage} of {totalPages}</div>
            <div className="cd-pagination-controls">
              <button className="cd-page-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>Prev</button>
              <button className="cd-page-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
