

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
      { accessorKey: "SlpName", header: "Sales Person" },
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

  // Reset to page 1 when filters change
  useEffect(() => {
    if (
      (globalFilter || fromDate || toDate || overdueFilter !== "All") &&
      page !== 1
    ) {
      onPageChange(1);
    }
  }, [globalFilter, fromDate, toDate, overdueFilter, onPageChange, page]);

  // Format data for Excel export to match UI exactly
  const handleExportExcel = () => {
    const exportData = pageData.map((row) => {
      const formattedRow = {};

      // Map each column in the exact order and format as shown in UI
      columns.forEach((column) => {
        const value = row[column.accessorKey];

        // Apply formatting based on column type
        if (
          column.accessorKey.includes("Date") ||
          column.accessorKey === "Dispatch Date"
        ) {
          formattedRow[column.header] = formatDate(value);
        } else if (column.accessorKey === "BalanceDue") {
          formattedRow[column.header] = formatCurrency(value).slice(1); // Remove currency symbol
        } else {
          formattedRow[column.header] = value;
        }
      });

      return formattedRow;
    });

    downloadExcel(exportData, "Customer_Balance_Report");
  };

  // Reset all filters
  const handleReset = () => {
    setGlobalFilter("");
    setFromDate("");
    setToDate("");
    setOverdueFilter("All");
    onPageChange(1);
  };

  return (
    <div className="w-full">
      {/* Filters + Reset + Export */}
      {/* <div className="mt-3 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2"> */}
      <div
   className="mt-3 mb-4 d-flex flex-nowrap justify-content-between align-items-center"
   style={{ minHeight:  "64px" }}   // or h-16 / h-20 in Tailwind, or whatever matches your filter row
>
        <button
          className="btn btn-outline-secondary me-2"
          onClick={handleReset}
        >
          Reset
        </button>

        <div className="flex-grow-1 me-2" style={{ minWidth: "300px" }}>
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search by customer, sales person, invoice no, SO no, PO no, tracking no"
            className="form-control"
          />
        </div>

        <div className="me-2">
          <select
            value={overdueFilter}
            onChange={(e) => setOverdueFilter(e.target.value)}
            className="form-select"
            style={{ minWidth: "120px" }}
          >
            <option value="All">All</option>
            <option value="0-30">0-30 days</option>
            <option value="31-60">31-60 days</option>
            <option value="61-90">61-90 days</option>
            <option value="90+">90+ days</option>
          </select>
        </div>

        <div className="d-flex align-items-center me-2">
          <label className="me-2 mb-0">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="form-control"
            style={{ maxWidth: "160px" }}
          />
        </div>

        <div className="d-flex align-items-center me-2">
          <label className="me-2 mb-0">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="form-control"
            style={{ maxWidth: "160px" }}
          />
        </div>

        <button onClick={handleExportExcel} className="btn btn-success">
          Export Excel
        </button>
      </div>

      {/* Table with fixed height */}
      <div className="border rounded overflow-auto h-[60vh]">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 sticky top-0">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="border px-2 py-1 text-left font-medium"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="border px-2 py-1 truncate text-sm"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-4 text-center">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-center space-x-4">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          First
        </button>
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-sm">
          Page {page} of {pageCount} ({uniqueData.length} total)
        </span>
        <button
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={page === pageCount}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
        <button
          onClick={() => onPageChange(pageCount)}
          disabled={page === pageCount}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Last
        </button>
      </div>
    </div>
  );
}