// components/Category/MonthlyPivotTable.js
import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Search, Download } from "lucide-react";
import downloadExcel from "utils/exporttoexcel";
import { formatNumberWithIndianCommas } from "utils/formatNumberWithIndianCommas";
import DailySalesModal from "./DailySalesModal";

const PAGE_SIZE = 8;

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  return Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
}

export default function MonthlyLineItemsTable({
  data = [],
  columns: initialColumns,
  type,
  categoryFilter,
  fyLabel,
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  const safeData = Array.isArray(data) ? data : [];

  const filteredData = useMemo(() => {
    if (!globalFilter) return safeData;
    return safeData.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(globalFilter.toLowerCase())
      )
    );
  }, [safeData, globalFilter]);

  const pageCount = Math.max(1, Math.ceil((filteredData.length || 0) / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);

  const pagedData = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, safePage]);

  const handleCellClick = (monthHeader, rowData, value) => {
    if (typeof value === "number" && value > 0) {
      try {
        const monthName = String(monthHeader).split(" ")[0];
        const year = parseInt(String(monthHeader).split(" ")[1]);

        if (!monthName || !year) return;

        const monthNumber = new Date(`${monthName} 1, ${year}`).getMonth() + 1;

        let filterValue = "";

        if (type === "category" && rowData.Category) {
          filterValue = rowData.Category;
        } else if (type === "customer" && rowData["Customer Name"]) {
          filterValue = rowData["Customer Name"];
        } else if (type === "salesperson" && rowData["Sales Person Name"]) {
          filterValue = rowData["Sales Person Name"];
        } else if (type === "state" && rowData["State"]) {
          filterValue = rowData["State"];
        }

        setSelectedCell({
          month: monthNumber,
          year,
          monthName,
          type,
          filterValue,
          rowData,
          categoryFilter,
        });

        setShowModal(true);
      } catch (error) {
        console.error("Error handling cell click:", error);
      }
    }
  };

  const transformedColumns = useMemo(() => {
    if (!initialColumns || initialColumns.length === 0) return [];

    const nameColumn = {
      ...initialColumns[0],
      cell: ({ row }) => (
        <span className="mpt-rowname" title={row.original[initialColumns[0].accessorKey]}>
          {row.original[initialColumns[0].accessorKey]}
        </span>
      ),
    };
    const transformedCols = [nameColumn];

    // Get all month columns and sort them in reverse chronological order
    const allMonthColumns = [];
    const allKeys = new Set();
    safeData.forEach((row) => {
      Object.keys(row).forEach((key) => allKeys.add(key));
    });

    Array.from(allKeys).forEach((key) => {
      if (key.match(/^[A-Za-z]{3} \d{4}$/) && !key.includes("_")) {
        allMonthColumns.push(key);
      }
    });

    // Sort months in descending order (newest first)
    allMonthColumns.sort((a, b) => {
      const [monthA, yearA] = a.split(" ");
      const [monthB, yearB] = b.split(" ");
      const dateA = new Date(`${monthA} 1, ${yearA}`);
      const dateB = new Date(`${monthB} 1, ${yearB}`);
      return dateB - dateA;
    });

    // Total column
    transformedCols.push({
      id: "total",
      header: fyLabel ? `Total (${fyLabel})` : "Total",
      cell: ({ row }) => {
        const sales = row.original["Total Sales"] || 0;
        const cogs = row.original["Total COGS"] || 0;
        const lines = row.original["Total Line Items"] || 0;
        const gm = row.original["GM%"] || 0;

        return (
          <div className="mpt-cell" title={`COGS: ₹${formatNumberWithIndianCommas(cogs)}`}>
            <div className="mpt-cell-primary mpt-cell-primary-total">
              ₹{formatNumberWithIndianCommas(sales)}
            </div>
            <div className="mpt-cell-secondary">
              <span>{formatNumberWithIndianCommas(lines)} lines</span>
              <span className={`mpt-badge ${gm >= 0 ? "good" : "bad"}`}>{gm}% GM</span>
            </div>
          </div>
        );
      },
      isTotal: true,
    });

    // Monthly columns (newest first)
    allMonthColumns.forEach((monthKey) => {
      transformedCols.push({
        id: `month_${monthKey}`,
        header: monthKey,
        cell: ({ row }) => {
          const sales = row.original[monthKey] || 0;
          const cogs = row.original[`${monthKey}_COGS`] || 0;
          const lines = row.original[`${monthKey}_Lines`] || 0;
          const gm = sales > 0 ? ((sales - cogs) * 100 / sales).toFixed(2) : 0;

          return (
            <div
              className="mpt-cell mpt-cell-clickable"
              onClick={() => handleCellClick(monthKey, row.original, sales)}
              title={`COGS: ₹${formatNumberWithIndianCommas(cogs)} — click to view daily breakdown`}
            >
              <div className="mpt-cell-primary">₹{formatNumberWithIndianCommas(sales)}</div>
              <div className="mpt-cell-secondary">
                <span>{formatNumberWithIndianCommas(lines)} lines</span>
                <span className={`mpt-badge ${gm >= 0 ? "good" : "bad"}`}>{gm}% GM</span>
              </div>
            </div>
          );
        },
        monthKey: monthKey,
        isMonthly: true,
      });
    });

    return transformedCols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialColumns, safeData, fyLabel, type, categoryFilter]);

  const table = useReactTable({
    data: pagedData,
    columns: transformedColumns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleExportExcel = () => {
    const exportData = filteredData.map((row) => {
      const formatted = {};

      const nameKey = Object.keys(row).find((key) =>
        ["Category", "Customer Name", "Sales Person Name", "State"].includes(key)
      );
      if (nameKey) {
        formatted[nameKey] = row[nameKey];
      }

      formatted["Total Sales"] = row["Total Sales"] || 0;
      formatted["Total COGS"] = row["Total COGS"] || 0;
      formatted["Total Line Items"] = row["Total Line Items"] || 0;
      formatted["GM%"] = row["GM%"] || 0;

      Object.keys(row).forEach((key) => {
        if (key.match(/^[A-Za-z]{3} \d{4}$/) && !key.includes("_")) {
          formatted[`${key} Sales`] = row[key] || 0;
          formatted[`${key} COGS`] = row[`${key}_COGS`] || 0;
          formatted[`${key} Lines`] = row[`${key}_Lines`] || 0;
          const sales = row[key] || 0;
          const cogs = row[`${key}_COGS`] || 0;
          const gm = sales > 0 ? ((sales - cogs) * 100 / sales).toFixed(2) : 0;
          formatted[`${key} GM%`] = gm;
        }
      });

      return formatted;
    });

    downloadExcel(exportData, "Monthly_Sales_Report_Detailed");
  };

  const searchLabel = {
    category: "Search by category…",
    customer: "Search by customer…",
    salesperson: "Search by salesperson…",
    state: "Search by state…",
  }[type] || "Search…";

  const totalRows = filteredData.length;
  const rangeStart = totalRows === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, totalRows);

  return (
    <div className="mpt">
      <style>{PAGE_STYLES}</style>

      <div className="mpt-controls">
        <div className="mpt-field" style={{ width: 300 }}>
          <label>Search</label>
          <div className="mpt-search-wrap">
            <Search size={16} className="mpt-search-icon" />
            <input
              className="mpt-input mpt-search-input"
              type="text"
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                setPage(1);
              }}
              placeholder={searchLabel}
            />
          </div>
        </div>

        <div className="mpt-spacer" />

        <div className="mpt-field">
          <label>&nbsp;</label>
          <button className="mpt-export-btn" onClick={handleExportExcel} disabled={!filteredData.length}>
            <Download size={15} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="mpt-table-card">
        {!pagedData.length ? (
          <div className="mpt-empty">No data found.</div>
        ) : (
          <>
            <div className="mpt-table-scroll">
              <table className="mpt-table">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((header, headerIndex) => (
                        <th
                          key={header.id}
                          className={headerIndex === 0 ? "mpt-th-left mpt-th-sticky" : "mpt-th-right"}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell, cellIndex) => (
                        <td
                          key={cell.id}
                          className={cellIndex === 0 ? "mpt-td-sticky" : "mpt-num"}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mpt-pagination">
              <div className="mpt-pagination-info">
                {totalRows === 0 ? "Showing 0 of 0" : `Showing ${rangeStart}–${rangeEnd} of ${totalRows}`}
              </div>
              <div className="mpt-pagination-controls">
                <button
                  className="mpt-page-btn"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                {getPageNumbers(safePage, pageCount).map((p, idx, arr) => (
                  <span key={p} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="mpt-page-ellipsis">…</span>}
                    <button
                      className={`mpt-page-btn ${p === safePage ? "active" : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  </span>
                ))}
                <button
                  className="mpt-page-btn"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedCell && (
        <DailySalesModal
          show={showModal}
          onHide={() => setShowModal(false)}
          month={selectedCell.month}
          year={selectedCell.year}
          monthName={selectedCell.monthName}
          type={selectedCell.type}
          filterValue={selectedCell.filterValue}
          categoryFilter={selectedCell.categoryFilter}
          rowData={selectedCell.rowData}
        />
      )}
    </div>
  );
}

const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

  .mpt {
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

    color: var(--text);
    font-family: 'IBM Plex Sans', sans-serif;
  }

  .mpt-controls {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px 18px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px 12px;
    align-items: flex-end;
    margin-bottom: 16px;
  }

  .mpt-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .mpt-field label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    font-weight: 600;
    color: var(--muted);
  }

  .mpt-search-wrap { position: relative; }
  .mpt-search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted);
    pointer-events: none;
  }

  .mpt-input {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 8px 10px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13.5px;
    color: var(--text);
    outline: none;
    transition: border-color 0.15s ease;
    width: 100%;
  }
  .mpt-input:focus { border-color: var(--accent); }
  .mpt-search-input { padding-left: 34px; }

  .mpt-spacer { flex: 1 1 auto; }

  .mpt-export-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
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
  .mpt-export-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .mpt-table-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }

  .mpt-empty {
    text-align: center;
    color: var(--muted);
    padding: 50px 0;
    font-size: 13px;
    font-family: 'IBM Plex Mono', monospace;
  }

  .mpt-table-scroll { overflow-x: auto; }

  .mpt-table { width: 100%; border-collapse: collapse; }
  .mpt-table th {
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
  .mpt-table th:last-child { border-right: none; }
  .mpt-th-left { text-align: left; }
  .mpt-th-right { text-align: right; min-width: 130px; }
  .mpt-th-sticky {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--surface2);
  }

  .mpt-table td {
    padding: 0;
    font-size: 13px;
    border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--border);
    white-space: nowrap;
  }
  .mpt-table td:last-child { border-right: none; }
  .mpt-table tbody tr:last-child td { border-bottom: none; }
  .mpt-table tbody tr:hover { background: var(--surface2); }

  .mpt-td-sticky {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--surface);
    padding: 11px 14px !important;
  }
  .mpt-table tbody tr:hover .mpt-td-sticky { background: var(--surface2); }

  .mpt-rowname {
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
    max-width: 280px;
    vertical-align: middle;
  }

  .mpt-num { text-align: right; }

  .mpt-cell {
    padding: 9px 14px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
  }
  .mpt-cell-clickable { cursor: pointer; }
  .mpt-cell-clickable:hover { background: var(--surface-green); }

  .mpt-cell-primary {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--text);
  }
  .mpt-cell-primary-total { color: var(--accent); font-weight: 700; }

  .mpt-cell-secondary {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    color: var(--muted);
  }

  .mpt-badge {
    display: inline-block;
    padding: 1px 7px;
    border-radius: 20px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    font-weight: 700;
  }
  .mpt-badge.good { color: var(--good); background: var(--surface-green); }
  .mpt-badge.bad { color: var(--bad); background: #fdecea; }

  .mpt-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-top: 1px solid var(--border);
    flex-wrap: wrap;
    gap: 10px;
  }
  .mpt-pagination-info {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    color: var(--muted);
  }
  .mpt-pagination-controls { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .mpt-page-btn {
    background: var(--surface2);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 6px 11px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    cursor: pointer;
  }
  .mpt-page-btn.active { background: var(--accent); color: #ffffff; border-color: var(--accent); font-weight: 700; }
  .mpt-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .mpt-page-ellipsis { color: var(--muted); font-family: 'IBM Plex Mono', monospace; font-size: 12px; }
`;
