

import React, { useMemo, useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";

export default function CustomerBalTable({
  data = [],
  page,
  onPageChange,
  pageSize = 10,
}) {
  const safeData = Array.isArray(data) ? data : [];

  // filter inputs
  const [globalFilter, setGlobalFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [overdueFilter, setOverdueFilter] = useState("All");

  // parse date strings for comparison
  function parseDateForFilter(dateString) {
    if (!dateString) return null;
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? null : d;
  }

  // Filter data based on all criteria
  const filteredData = useMemo(() => {
    return safeData.filter((row) => {
      // text search
      if (
        globalFilter &&
        !Object.values(row).some((v) =>
          String(v).toLowerCase().includes(globalFilter.toLowerCase())
        )
      ) {
        return false;
      }

      // date range
      const invDate = parseDateForFilter(row["AR Invoice Date"]);
      if (fromDate && invDate < parseDateForFilter(fromDate)) return false;
      if (toDate && invDate > parseDateForFilter(toDate)) return false;

      // overdue days filter
      const overdueDays = row["OverdueDays"] || 0;
      switch (overdueFilter) {
        case "0-30":
          if (overdueDays < 0 || overdueDays > 30) return false;
          break;
        case "31-60":
          if (overdueDays < 31 || overdueDays > 60) return false;
          break;
        case "61-90":
          if (overdueDays < 61 || overdueDays > 90) return false;
          break;
        case "90+":
          if (overdueDays < 90) return false;
          break;
        case "All":
        default:
          break;
      }

      return true;
    });
  }, [safeData, globalFilter, fromDate, toDate, overdueFilter]);

  // Dedupe by invoice number
  const uniqueData = useMemo(() => {
    const seen = new Set();
    return filteredData.filter((r) => {
      const inv = r["Invoice No"];
      if (seen.has(inv)) return false;
      seen.add(inv);
      return true;
    });
  }, [filteredData]);

  // Paging calculations
  const pageCount = Math.ceil(uniqueData.length / pageSize);
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return uniqueData.slice(start, start + pageSize);
  }, [uniqueData, page, pageSize]);

  // Column definitions
  const columns = useMemo(
    () => [
      { accessorKey: "Invoice No", header: "Invoice No." },
      {
        accessorKey: "AR Invoice Date",
        header: "Invoice Date",
        cell: ({ getValue }) => formatDate(getValue()),
      },
      { accessorKey: "SO#", header: "SO#" },
      {
        accessorKey: "SO Date",
        header: "SO Date",
        cell: ({ getValue }) => formatDate(getValue()),
      },
      { accessorKey: "CardName", header: "Customer Name" },
      { accessorKey: "Contact Person", header: "Contact Person" },
      { accessorKey: "CustomerPONo", header: "Cust Ref no" },
      {
        accessorKey: "Invoice Total",
        header: "Invoice Total",
        cell: ({ getValue }) => formatCurrency(getValue()),
      },
      {
        accessorKey: "BalanceDue",
        header: "Balance Due",
        cell: ({ getValue }) => formatCurrency(getValue()),
      },
      { accessorKey: "Country", header: "Country" },
      { accessorKey: "State", header: "State" },
      { accessorKey: "OverdueDays", header: "Overdue Days" },
      { accessorKey: "AirlineName", header: "Airline" },
      { accessorKey: "TrackingNo", header: "TrackingNo" },
      { accessorKey: "PymntGroup", header: "Payment Group" },
      {
        accessorKey: "Dispatch Date",
        header: "Dispatch Date",
        cell: ({ getValue }) => formatDate(getValue()),
      },
      { accessorKey: "SlpName", header: "Sales Person - Invoice" },
      { accessorKey: "MasterSalesPerson", header: "Sales Person - customer master" },
    ],
    []
  );

  const table = useReactTable({
    data: pageData,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });



useEffect(() => {
  // Whenever any filter (globalFilter, fromDate, toDate, overdueFilter) changes,
  // if we're not on page 1, jump back to page 1.
  if (page !== 1) {
    onPageChange(1);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [globalFilter, fromDate, toDate, overdueFilter]);

const handleExportExcel = () => {
  // Helper function to convert formatted currency/number string to actual number
  const parseFormattedNumber = (value) => {
    if (!value && value !== 0) return 0;
    // Remove currency symbols, commas, and convert to number
    return parseFloat(value.toString().replace(/[$₹,\s]/g, '')) || 0;
  };

  const exportData = uniqueData.map((row) => {
    const formattedRow = {};

    columns.forEach((column) => {
      const value = row[column.accessorKey];

      if (
        column.accessorKey.includes("Date") ||
        column.accessorKey === "Dispatch Date"
      ) {
        formattedRow[column.header] = formatDate(value);
      } else if (column.accessorKey === "BalanceDue") {
        // Convert to numeric value instead of formatted string
        formattedRow[column.header] = parseFormattedNumber(value);
      } else if (
        // Add other numeric columns that should be treated as numbers
        column.accessorKey.includes("Total") ||
        column.accessorKey.includes("Amount") ||
        column.accessorKey.includes("Price") ||
        column.accessorKey.includes("Value")
      ) {
        formattedRow[column.header] = parseFormattedNumber(value);
      } else {
        formattedRow[column.header] = value;
      }
    });

    return formattedRow;
  });

  downloadExcel(exportData, "Customer_Balance_Report");
};


// const handleExportExcel = () => {
//   const exportData = uniqueData.map((row) => {
//     const formattedRow = {};

//     columns.forEach((column) => {
//       const value = row[column.accessorKey];

//       if (
//         column.accessorKey.includes("Date") ||
//         column.accessorKey === "Dispatch Date"
//       ) {
//         formattedRow[column.header] = formatDate(value);
//       } else if (column.accessorKey === "BalanceDue") {
//         formattedRow[column.header] = formatCurrency(value).slice(1); // remove currency symbol
//       } else {
//         formattedRow[column.header] = value;
//       }
//     });

//     return formattedRow;
//   });

//   downloadExcel(exportData, "Customer_Balance_Report");
// };

  // Reset all filters
  const handleReset = () => {
    setGlobalFilter("");
    setFromDate("");
    setToDate("");
    setOverdueFilter("All");
    onPageChange(1);
  };

  // Same numbered-pager pattern as Product Master / Catalyst Pricing
  function getPageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
    return Array.from(pages)
      .filter((p) => p >= 1 && p <= total)
      .sort((a, b) => a - b);
  }
  const safePageCount = Math.max(1, pageCount);

  return (
    <div className="cbt">
      <style>{PAGE_STYLES}</style>

      <div className="cbt-controls">
        <div className="cbt-field" style={{ width: 320 }}>
          <label>Search</label>
          <input
            className="cbt-input"
            type="text"
            style={{ width: "100%" }}
            placeholder="Customer, sales person, invoice no, SO no, PO no, tracking no…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>

        <div className="cbt-field">
          <label>Overdue</label>
          <div className="cbt-mode-toggle">
            {[
              { value: "All", label: "All" },
              { value: "0-30", label: "0-30" },
              { value: "31-60", label: "31-60" },
              { value: "61-90", label: "61-90" },
              { value: "90+", label: "90+" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`cbt-mode-btn ${overdueFilter === opt.value ? "active" : ""}`}
                onClick={() => setOverdueFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="cbt-field">
          <label>From</label>
          <input
            className="cbt-input"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="cbt-field">
          <label>To</label>
          <input
            className="cbt-input"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div className="cbt-field">
          <label>&nbsp;</label>
          <button type="button" className="cbt-reset-btn" onClick={handleReset}>
            Reset
          </button>
        </div>

        <div className="cbt-spacer" />

        <div className="cbt-total-pill">Total Records: {uniqueData.length}</div>

        <div className="cbt-field">
          <label>&nbsp;</label>
          <button className="cbt-export-btn" onClick={handleExportExcel} disabled={!uniqueData.length}>
            Export Excel
          </button>
        </div>
      </div>

      <div className="cbt-table-card">
        {!pageData.length ? (
          <div className="cbt-empty">No data available.</div>
        ) : (
          <>
            <div className="cbt-table-scroll">
              <table className="cbt-table">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((header) => (
                        <th key={header.id} className="cbt-th-left">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="cbt-pagination">
              <div className="cbt-pagination-info">
                Page {page} of {safePageCount} ({uniqueData.length} total)
              </div>
              <div className="cbt-pagination-controls">
                <button
                  className="cbt-page-btn"
                  disabled={page <= 1}
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                >
                  Prev
                </button>
                {getPageNumbers(page, safePageCount).map((p, idx, arr) => (
                  <span key={p} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="cbt-page-ellipsis">…</span>}
                    <button
                      className={`cbt-page-btn ${p === page ? "active" : ""}`}
                      onClick={() => onPageChange(p)}
                    >
                      {p}
                    </button>
                  </span>
                ))}
                <button
                  className="cbt-page-btn"
                  disabled={page >= safePageCount}
                  onClick={() => onPageChange(Math.min(safePageCount, page + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Visual language matched to components/ProductsTable.js (Product Master) — same
// tokens/spacing/typography, scoped under .cbt so it doesn't leak into other pages.
const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

  .cbt {
    --page-bg: #e4ebf1;
    --surface: #ffffff;
    --surface2: #e0edf9;
    --surface-green: #dcf3e8;
    --border: #c5d2dc;
    --text: #10151c;
    --muted: #52606d;
    --accent: #1f68bf;
    --good: #21875a;
    --bad: #c0402f;

    font-family: 'IBM Plex Sans', sans-serif;
    color: var(--text);
  }

  .cbt-controls {
    position: sticky;
    top: 12px;
    z-index: 50;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px 18px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px 12px;
    align-items: flex-end;
    margin-bottom: 20px;
    box-shadow: 0 6px 16px rgba(31, 41, 55, 0.12);
  }

  .cbt-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: relative;
  }
  .cbt-field label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    font-weight: 600;
    color: var(--muted);
  }

  .cbt-input {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 8px 10px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13.5px;
    color: var(--text);
    outline: none;
    transition: border-color 0.15s ease;
  }
  .cbt-input:focus { border-color: var(--accent); }

  .cbt-mode-toggle {
    display: flex;
    border: 1px solid var(--border);
    border-radius: 999px;
    overflow: hidden;
  }
  .cbt-mode-btn {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11.5px;
    font-weight: 600;
    background: var(--surface);
    color: var(--muted);
    border: none;
    padding: 7px 10px;
    cursor: pointer;
    white-space: nowrap;
  }
  .cbt-mode-btn.active { background: var(--accent); color: #ffffff; }

  .cbt-reset-btn {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 8px 14px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
  }
  .cbt-reset-btn:hover { background: var(--surface2); }

  .cbt-spacer { flex: 1 1 auto; }

  .cbt-total-pill {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    color: var(--muted);
    align-self: center;
  }

  .cbt-export-btn {
    background: var(--good);
    color: #ffffff;
    border: none;
    border-radius: 5px;
    padding: 8px 16px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
  .cbt-export-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .cbt-table-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }

  .cbt-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
    color: var(--muted);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
  }

  .cbt-table-scroll { overflow-x: auto; }

  .cbt-table { width: 100%; border-collapse: collapse; }
  .cbt-table th {
    background: var(--surface2);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    color: var(--muted);
    border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--border);
    padding: 10px 12px;
    white-space: nowrap;
  }
  .cbt-table th:last-child { border-right: none; }
  .cbt-th-left { text-align: left; }

  .cbt-table td {
    padding: 11px 14px;
    font-size: 13px;
    border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--border);
    white-space: nowrap;
  }
  .cbt-table td:last-child { border-right: none; }
  .cbt-table tbody tr:last-child td { border-bottom: none; }
  .cbt-table tbody tr:hover { background: var(--surface2); }

  .cbt-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-top: 1px solid var(--border);
    flex-wrap: wrap;
    gap: 10px;
  }
  .cbt-pagination-info {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    color: var(--muted);
  }
  .cbt-pagination-controls { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .cbt-page-btn {
    background: var(--surface2);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 6px 11px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    cursor: pointer;
  }
  .cbt-page-btn.active { background: var(--accent); color: #ffffff; border-color: var(--accent); font-weight: 700; }
  .cbt-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .cbt-page-ellipsis { color: var(--muted); font-family: 'IBM Plex Mono', monospace; font-size: 12px; }
`;