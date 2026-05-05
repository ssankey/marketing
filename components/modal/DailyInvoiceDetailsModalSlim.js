// components/modal/DailyInvoiceDetailsModalSlim.js
import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import Modal from "react-bootstrap/Modal";
import { formatCurrency } from "utils/formatCurrency";
import downloadExcel from "utils/exporttoexcel";

const MOBILE_BP = 768;

const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < MOBILE_BP : false
  );
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < MOBILE_BP);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

const SORT_OPTIONS = [
  { label: "Unit Price ↑",  field: "Unit Sales Price",             desc: false },
  { label: "Unit Price ↓",  field: "Unit Sales Price",             desc: true  },
  { label: "Total Price ↑", field: "Total Sales Price/Open Value", desc: false },
  { label: "Total Price ↓", field: "Total Sales Price/Open Value", desc: true  },
  { label: "Customer A–Z",  field: "Customer",                     desc: false },
  { label: "Customer Z–A",  field: "Customer",                     desc: true  },
];

const STYLES = `
  .slim-inv-modal .modal-dialog { max-width: 95vw !important; margin: 0.5rem auto; }
  .slim-inv-modal .modal-content {
    border-radius: 16px; overflow: hidden; border: none;
    box-shadow: 0 25px 60px rgba(0,0,0,0.35);
    display: flex; flex-direction: column;
  }
  .slim-inv-header {
    background: linear-gradient(135deg, #0d1b2a 0%, #1b2a3b 60%, #124f94 100%);
    padding: 14px 18px;
    border-bottom: 1px solid rgba(18,79,148,0.5);
    flex-shrink: 0;
  }
  .slim-inv-title {
    font-family: Georgia, serif; color: #5ba4f5;
    font-size: 1.05rem; font-weight: 700; margin: 0 0 4px 0;
    letter-spacing: 0.02em;
  }
  .slim-inv-summary {
    display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;
  }
  .slim-inv-summary-chip {
    background: rgba(91,164,245,0.15);
    border: 1px solid rgba(91,164,245,0.35);
    color: #a8d0ff; font-size: 0.75rem; font-weight: 600;
    padding: 3px 10px; border-radius: 20px;
    white-space: nowrap; letter-spacing: 0.02em;
  }
  .slim-inv-header-row { display: flex; gap: 8px; align-items: center; margin-top: 10px; }
  .slim-inv-search {
    flex: 1; min-width: 0;
    background: rgba(255,255,255,0.09) !important;
    border: 1px solid rgba(91,164,245,0.45) !important;
    border-radius: 8px !important; color: #fff !important;
    font-size: 0.83rem !important; padding: 7px 12px !important;
    outline: none;
  }
  .slim-inv-search::placeholder { color: rgba(255,255,255,0.4) !important; }
  .slim-inv-search:focus { box-shadow: 0 0 0 2px rgba(91,164,245,0.35) !important; }
  .slim-inv-export-btn {
    background: linear-gradient(135deg, #1a7a4a, #27ae60);
    color: #fff; border: none; padding: 7px 14px;
    border-radius: 8px; font-size: 0.78rem; font-weight: 600;
    cursor: pointer; white-space: nowrap; transition: opacity 0.15s;
  }
  .slim-inv-export-btn:hover { opacity: 0.85; }
  .slim-inv-close-btn {
    background: rgba(255,255,255,0.1); color: #fff;
    border: 1px solid rgba(255,255,255,0.2);
    width: 34px; height: 34px; border-radius: 8px;
    font-size: 1rem; cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
  }
  .slim-inv-close-btn:hover { background: rgba(255,255,255,0.22); }

  .slim-inv-sort-bar {
    display: flex; align-items: center;
    padding: 8px 12px 6px; background: #f0f3f8;
    border-bottom: 1px solid #dce2ed;
    overflow-x: auto; flex-shrink: 0;
    -webkit-overflow-scrolling: touch; scrollbar-width: none;
  }
  .slim-inv-sort-bar::-webkit-scrollbar { display: none; }
  .slim-inv-sort-bar-label {
    font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.07em; color: #aaa; white-space: nowrap;
    margin-right: 8px; flex-shrink: 0;
  }
  .slim-inv-sort-chip {
    flex-shrink: 0; padding: 5px 11px; border-radius: 20px;
    font-size: 0.74rem; font-weight: 600; cursor: pointer;
    border: 1.5px solid #dde0e8; background: #fff; color: #555;
    margin-right: 6px; white-space: nowrap; transition: all 0.15s ease;
  }
  .slim-inv-sort-chip.active {
    background: #124f94; color: #fff; border-color: #124f94;
    box-shadow: 0 2px 6px rgba(18,79,148,0.35);
  }

  .slim-inv-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
  .slim-inv-table-wrap { flex: 1; overflow: auto; }
  .slim-inv-tbl { width: 100%; border-collapse: collapse; }
  .slim-inv-tbl thead th {
    background: #0d1b2a; color: #5ba4f5;
    font-family: Georgia, serif; font-size: 0.76rem;
    font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
    padding: 10px 14px; border-bottom: 2px solid rgba(91,164,245,0.35);
    white-space: nowrap; cursor: pointer; user-select: none;
    transition: background 0.15s; position: sticky; top: 0; z-index: 1;
  }
  .slim-inv-tbl thead th:hover { background: #124f94; }
  .slim-inv-sort { display: inline-block; margin-left: 5px; font-size: 0.65rem; opacity: 0.4; }
  .slim-inv-sort.on { opacity: 1; color: #5ba4f5; }
  .slim-inv-tbl tbody tr { border-bottom: 1px solid rgba(0,0,0,0.055); transition: background 0.1s; }
  .slim-inv-tbl tbody tr:nth-child(even) { background: rgba(18,79,148,0.03); }
  .slim-inv-tbl tbody tr:hover { background: rgba(91,164,245,0.07) !important; }
  .slim-inv-tbl tbody td {
    padding: 9px 14px; font-size: 0.82rem;
    color: #2d2d2d; white-space: nowrap; border: none; vertical-align: middle;
  }
  .slim-inv-tbl td.c-inv   { font-weight: 700; color: #124f94; }
  .slim-inv-tbl td.c-cat   {  font-weight: 700; color: #01060b;  }
  .slim-inv-tbl td.c-price { font-family: 'Courier New', monospace; font-weight: 600; color: #1a7a4a; }
  .slim-inv-tbl td.c-total { font-family: 'Courier New', monospace; font-weight: 700; color: #0f3460; }
  .slim-inv-empty { text-align: center; padding: 48px 20px; color: #bbb; font-size: 0.88rem; }

  .slim-inv-pager {
    flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
    padding: 9px 16px; background: #f8f9fa; border-top: 1px solid #e9ecef;
    flex-wrap: wrap; gap: 6px;
  }
  .slim-inv-pager-info { font-size: 0.76rem; color: #777; }
  .slim-inv-pager-btns { display: flex; align-items: center; gap: 4px; }
  .slim-inv-pbtn {
    padding: 4px 9px; font-size: 0.76rem; border-radius: 6px;
    border: 1px solid #dee2e6; background: white; cursor: pointer;
    color: #495057; transition: all 0.12s;
  }
  .slim-inv-pbtn:disabled { opacity: 0.38; cursor: not-allowed; }
  .slim-inv-pbtn:not(:disabled):hover { background: #124f94; color: #fff; border-color: #124f94; }

  .slim-inv-cards { flex: 1; overflow-y: auto; padding: 12px; background: #f0f3f8; }
  .slim-inv-card {
    background: #fff; border-radius: 12px; padding: 14px 16px;
    margin-bottom: 10px; border-left: 4px solid #124f94;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    animation: slimInvIn 0.18s ease forwards;
  }
  @keyframes slimInvIn {
    from { opacity:0; transform: translateY(5px); }
    to   { opacity:1; transform: translateY(0); }
  }
  .slim-inv-card-inv  { font-size: 0.7rem; font-weight: 700; color: #124f94; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 2px; }
  .slim-inv-card-name { font-family: Georgia, serif; font-size: 0.95rem; font-weight: 700; color: #0d1b2a; }
  .slim-inv-card-sub  { font-size: 0.73rem; color: #999; margin: 2px 0 8px; }
  .slim-inv-card-hr   { height: 1px; background: rgba(18,79,148,0.15); margin: 8px 0; }
  .slim-inv-card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px 14px; }
  .slim-inv-card-f label { font-size: 0.63rem; text-transform: uppercase; letter-spacing: 0.07em; color: #bbb; display: block; margin-bottom: 1px; font-weight: 700; }
  .slim-inv-card-f span { font-size: 0.81rem; color: #333; font-weight: 500; word-break: break-word; }
  .slim-inv-card-f span.cat { font-size: 0.75rem; color: #666; font-family: 'Courier New', monospace; font-weight: 600; }
  .slim-inv-card-f span.p { color: #1a7a4a; font-family: 'Courier New', monospace; font-weight: 700; }
  .slim-inv-card-f span.t { color: #0f3460; font-family: 'Courier New', monospace; font-weight: 700; font-size: 0.88rem; }
  .slim-inv-card-total-row { display: flex; justify-content: space-between; align-items: center; }
  .slim-inv-card-total-row .lbl { font-size: 0.63rem; text-transform: uppercase; letter-spacing: 0.07em; color: #bbb; font-weight: 700; }

  @media (max-width: 767px) {
    .slim-inv-modal .modal-dialog { margin: 0 !important; max-width: 100vw !important; }
    .slim-inv-modal .modal-content { border-radius: 0; min-height: 100dvh; }
    .slim-inv-header { padding: 12px 14px; }
    .slim-inv-title { font-size: 0.9rem; margin-bottom: 4px; }
  }
`;

const SortIcon = ({ s }) => (
  <span className={`slim-inv-sort${s ? " on" : ""}`}>{!s ? "⇅" : s === "asc" ? "↑" : "↓"}</span>
);

const DailyInvoiceDetailsModalSlim = ({ invoiceData, onClose, title = "Invoice Details" }) => {
  const isMobile = useIsMobile();
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 12 });
  const [sorting, setSorting] = useState([]);
  const [activeSortIdx, setActiveSortIdx] = useState(null);

  const handleMobileSort = (idx) => {
    if (activeSortIdx === idx) {
      setActiveSortIdx(null);
      setSorting([]);
    } else {
      setActiveSortIdx(idx);
      const opt = SORT_OPTIONS[idx];
      setSorting([{ id: opt.field, desc: opt.desc }]);
    }
  };

  const columns = useMemo(() => [
    {
      accessorFn: row => row["Inv#"],
      id: "Inv#",
      header: "Invoice No",
      cell: ({ getValue }) => getValue() || "—",
    },
    {
      accessorFn: row => row["Customer"],
      id: "Customer",
      header: "Customer",
      cell: ({ getValue }) => getValue() || "—",
    },
    {
      accessorFn: row => row["Unit Sales Price"],
      id: "Unit Sales Price",
      header: "Unit Price",
      cell: ({ getValue }) => getValue() != null ? formatCurrency(getValue()) : "—",
      sortingFn: (a, b) => (parseFloat(a.original["Unit Sales Price"]) || 0) - (parseFloat(b.original["Unit Sales Price"]) || 0),
    },
    {
      accessorFn: row => row["Qty"],
      id: "Qty",
      header: "Quantity",
      cell: ({ getValue }) => getValue() != null ? getValue() : "—",
    },
    {
      accessorFn: row => row["Total Sales Price/Open Value"],
      id: "Total Sales Price/Open Value",
      header: "Total Price",
      cell: ({ getValue }) => getValue() != null ? formatCurrency(getValue()) : "—",
      sortingFn: (a, b) => (parseFloat(a.original["Total Sales Price/Open Value"]) || 0) - (parseFloat(b.original["Total Sales Price/Open Value"]) || 0),
    },
    {
      accessorFn: row => row["Category"],
      id: "Category",
      header: "Category",
      cell: ({ getValue }) => getValue() || "—",
    },
    {
      accessorFn: row => row["ItemCode"],
      id: "ItemCode",
      header: "CAT #",
      cell: ({ getValue }) => getValue() || "—",
    },
    {
      accessorFn: row => row["Item/Service Description"],
      id: "Item/Service Description",
      header: "Item Name",
      cell: ({ getValue }) => getValue() || "—",
    },
    {
      accessorFn: row => row["Sales_Person"],
      id: "Sales_Person",
      header: "Sales Person",
      cell: ({ getValue }) => getValue() || "—",
    },
    {
      accessorFn: row => row["Contact Person"],
      id: "Contact Person",
      header: "Contact Person",
      cell: ({ getValue }) => getValue() || "—",
    },
  ], []);

  const table = useReactTable({
    data: invoiceData || [],
    columns,
    state: { globalFilter, pagination, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _, filterValue) => {
      const s = filterValue.toLowerCase();
      return Object.values(row.original).some(v => String(v ?? "").toLowerCase().includes(s));
    },
    enableSorting: true,
    enableMultiSort: false,
  });

  const rows = table.getRowModel().rows;
  const totalFiltered = table.getFilteredRowModel().rows.length;

  const handleExport = () => {
    const data = (invoiceData || []).map(r => ({
      "Invoice No":     r["Inv#"] || "—",
      "Customer":       r["Customer"] || "—",
      "Unit Price":     r["Unit Sales Price"] != null ? parseFloat(r["Unit Sales Price"]) : "",
      "Quantity":       r["Qty"] ?? "—",
      "Total Price":    r["Total Sales Price/Open Value"] != null ? parseFloat(r["Total Sales Price/Open Value"]) : "",
      "Category":       r["Category"] || "—",
      "CAT #":          r["ItemCode"] || "—",
      "Item Name":      r["Item/Service Description"] || "—",
      "Sales Person":   r["Sales_Person"] || "—",
      "Contact Person": r["Contact Person"] || "—",
    }));
    downloadExcel(data, "Invoice_Details");
  };

  return (
    <>
      <style>{STYLES}</style>
      <Modal
        show={true}
        onHide={onClose}
        size="xl"
        centered={!isMobile}
        dialogClassName="slim-inv-modal"
        fullscreen={isMobile ? true : undefined}
      >
        {/* Header */}
        <div className="slim-inv-header">
          <div className="d-flex align-items-center gap-1">
            <div className="flex-grow-1">
              <h5 className="slim-inv-title">{title}</h5>
              <div className="slim-inv-summary">
                <span className="slim-inv-summary-chip">
                  🧾 {invoiceData?.length ?? 0} Invoice{invoiceData?.length !== 1 ? "s" : ""}
                </span>
                <span className="slim-inv-summary-chip">
                  💰 {formatCurrency(
                    (invoiceData || []).reduce((sum, r) => sum + (parseFloat(r["Total Sales Price/Open Value"]) || 0), 0)
                  )}
                </span>
              </div>
            </div>
            <button className="slim-inv-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="slim-inv-header-row">
            <input
              type="text"
              className="slim-inv-search"
              placeholder="Search invoices…"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
            <button className="slim-inv-export-btn" onClick={handleExport}>↓ Excel</button>
          </div>
        </div>

        {/* Body */}
        <Modal.Body style={{ padding: 0, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div className="slim-inv-body">

            {isMobile ? (
              <>
                <div className="slim-inv-sort-bar">
                  <span className="slim-inv-sort-bar-label">Sort:</span>
                  {SORT_OPTIONS.map((opt, idx) => (
                    <button
                      key={idx}
                      className={`slim-inv-sort-chip${activeSortIdx === idx ? " active" : ""}`}
                      onClick={() => handleMobileSort(idx)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="slim-inv-cards">
                  {rows.length > 0 ? rows.map((row, i) => {
                    const d = row.original;
                    return (
                      <div className="slim-inv-card" key={row.id} style={{ animationDelay: `${i * 0.025}s` }}>
                        <div className="slim-inv-card-inv">#{d["Inv#"] || "—"}</div>
                        <div className="slim-inv-card-name">{d["Customer"] || "—"}</div>
                        <div className="slim-inv-card-sub">
                          {[d["Sales_Person"], d["Contact Person"]].filter(Boolean).map((s, idx) => (
                            <span key={idx}>{idx > 0 ? " · " : ""}{s}</span>
                          ))}
                        </div>
                        <div className="slim-inv-card-grid">
                          <div className="slim-inv-card-f">
                            <label>CAT #</label>
                            <span className="cat">{d["ItemCode"] || "—"}</span>
                          </div>
                          <div className="slim-inv-card-f">
                            <label>Category</label>
                            <span>{d["Category"] || "—"}</span>
                          </div>
                          <div className="slim-inv-card-f" style={{ gridColumn: "1 / -1" }}>
                            <label>Item Name</label>
                            <span>{d["Item/Service Description"] || "—"}</span>
                          </div>
                          <div className="slim-inv-card-f">
                            <label>Quantity</label>
                            <span>{d["Qty"] ?? "—"}</span>
                          </div>
                          <div className="slim-inv-card-f">
                            <label>Unit Price</label>
                            <span className="p">{d["Unit Sales Price"] != null ? formatCurrency(d["Unit Sales Price"]) : "—"}</span>
                          </div>
                        </div>
                        <div className="slim-inv-card-hr" />
                        <div className="slim-inv-card-total-row">
                          <span className="lbl">Total Price</span>
                          <span className="slim-inv-card-f">
                            <span className="t">{d["Total Sales Price/Open Value"] != null ? formatCurrency(d["Total Sales Price/Open Value"]) : "—"}</span>
                          </span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="slim-inv-empty">No invoices found</div>
                  )}
                </div>
              </>
            ) : (
              <div className="slim-inv-table-wrap">
                <table className="slim-inv-tbl">
                  <thead>
                    {table.getHeaderGroups().map(hg => (
                      <tr key={hg.id}>
                        {hg.headers.map(header => (
                          <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <SortIcon s={header.column.getIsSorted()} />
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {rows.length > 0 ? rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => {
                          const id = cell.column.id;
                          const cls =
                            id === "Inv#"                            ? "c-inv"   :
                            id === "ItemCode"                        ? "c-cat"   :
                            id === "Unit Sales Price"                ? "c-price" :
                            id === "Total Sales Price/Open Value"    ? "c-total" : "";
                          return (
                            <td key={cell.id} className={cls}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          );
                        })}
                      </tr>
                    )) : (
                      <tr><td colSpan={columns.length} className="slim-inv-empty">No invoice data available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="slim-inv-pager">
              <span className="slim-inv-pager-info">{rows.length} of {totalFiltered} rows</span>
              <div className="slim-inv-pager-btns">
                <button className="slim-inv-pbtn" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>«</button>
                <button className="slim-inv-pbtn" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>‹</button>
                <span className="slim-inv-pager-info" style={{ padding: "0 6px" }}>
                  <strong>{table.getState().pagination.pageIndex + 1}</strong> / {table.getPageCount()}
                </span>
                <button className="slim-inv-pbtn" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>›</button>
                <button className="slim-inv-pbtn" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>»</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="slim-inv-pager-info">Per page:</span>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={e => table.setPageSize(Number(e.target.value))}
                  style={{ fontSize: "0.76rem", padding: "3px 6px", borderRadius: "6px", border: "1px solid #dee2e6" }}
                >
                  {[12, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default DailyInvoiceDetailsModalSlim;