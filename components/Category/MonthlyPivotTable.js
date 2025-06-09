// components/Category/MonthlyLineItemsTable.js
import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import downloadExcel from "utils/exporttoexcel";
import { formatNumberWithIndianCommas } from "utils/formatNumberWithIndianCommas";

export default function MonthlyLineItemsTable({ data = [], columns: initialColumns }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : [];

  // Keep original data without formatting for filtering and export
  const filteredData = useMemo(() => {
    if (!globalFilter) return safeData;
    return safeData.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(globalFilter.toLowerCase())
      )
    );
  }, [safeData, globalFilter]);

  const pageCount = Math.ceil((filteredData.length || 0) / pageSize);

  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  const columns = useMemo(() => initialColumns, [initialColumns]);

  const table = useReactTable({
    data: pagedData,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleExportExcel = () => {
    const exportData = filteredData.map((row) => {
      const formatted = {};
      columns.forEach((col) => {
        const raw = row[col.accessorKey];
        formatted[col.header] =
          raw === null || raw === undefined || raw === "" ? "-" : raw;
      });
      return formatted;
    });
    downloadExcel(exportData, "Monthly_Line_Items_Report");
  };

  // Helper function to format cell values
  const formatCellValue = (value, columnDef) => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }
    
    // Check if the column should be formatted as a number
    if (columnDef.isNumeric && (typeof value === 'number' || !isNaN(Number(value)))) {
      return formatNumberWithIndianCommas(Number(value));
    }
    
    return value;
  };

  return (
    <div className="w-full mb-6">
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
          className="form-control me-2"
          style={{ maxWidth: "300px" }}
        />
        <button onClick={handleExportExcel} className="btn btn-success">
          Export Excel
        </button>
      </div>

      <div className="border rounded overflow-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 sticky top-0">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  //   <th key={header.id} className="border px-2 py-1 text-center">
                  //     {flexRender(
                  //       header.column.columnDef.header,
                  //       header.getContext()
                  //     )}
                  //   </th>
                  <th
                    key={header.id}
                    className="border px-2 py-1 text-center"
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      //   textOverflow: "ellipsis",
                    }}
                    title={String(header.column.columnDef.header)}
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
                    // <td
                    //   key={cell.id}
                    //   className="border px-2 py-1 text-sm text-center"
                    //   style={{
                    //     whiteSpace: "nowrap", // Prevent line break
                    //     overflow: "hidden", // Hide overflow
                    //     // textOverflow: "ellipsis", // Show ellipsis if text is too long

                    //   }}
                    //   title={String(cell.getValue())} // Optional: full value on hover
                    // >
                    //   {formatCellValue(cell.getValue(), cell.column.columnDef)}
                    // </td>
                    <td
                      key={cell.id}
                      className={`border px-2 py-1 text-sm ${cell.column.id === table.getAllColumns()[0].id ? "text-start" : "text-center"}`}
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                      }}
                      title={String(cell.getValue())}
                    >
                      {formatCellValue(cell.getValue(), cell.column.columnDef)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-4 text-center">
                  No data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 d-flex justify-content-center align-items-center gap-3">
        <button
          onClick={() => setPage(1)}
          disabled={page === 1}
          className="btn btn-outline-secondary"
        >
          First
        </button>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="btn btn-outline-secondary"
        >
          Prev
        </button>
        <span>
          Page {page} of {pageCount} ({filteredData.length} total)
        </span>
        <button
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          disabled={page === pageCount}
          className="btn btn-outline-secondary"
        >
          Next
        </button>
        <button
          onClick={() => setPage(pageCount)}
          disabled={page === pageCount}
          className="btn btn-outline-secondary"
        >
          Last
        </button>
      </div>
    </div>
  );
}