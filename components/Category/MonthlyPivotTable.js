// components/Category/MonthlyPivotTable.js
import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import downloadExcel from "utils/exporttoexcel";
import { formatNumberWithIndianCommas } from "utils/formatNumberWithIndianCommas";
import DailySalesModal from "./DailySalesModal";

export default function MonthlyLineItemsTable({ 
  data = [], 
  columns: initialColumns,
  type,
  categoryFilter
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;
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

  const pageCount = Math.ceil((filteredData.length || 0) / pageSize);

  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  const transformedColumns = useMemo(() => {
    if (!initialColumns || initialColumns.length === 0) return [];

    const nameColumn = {
      ...initialColumns[0],
      cell: ({ row }) => (
        <div className="font-medium text-gray-900 px-3 py-4 whitespace-nowrap">
          {row.original[initialColumns[0].accessorKey]}
        </div>
      )
    };
    const transformedCols = [nameColumn];

    // Get all month columns and sort them in reverse chronological order
    const allMonthColumns = [];
    const allKeys = new Set();
    safeData.forEach(row => {
      Object.keys(row).forEach(key => allKeys.add(key));
    });
    
    Array.from(allKeys).forEach(key => {
      if (key.match(/^[A-Za-z]{3} \d{4}$/) && !key.includes('_')) {
        allMonthColumns.push(key);
      }
    });

    // Sort months in descending order (newest first)
    allMonthColumns.sort((a, b) => {
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      const dateA = new Date(`${monthA} 1, ${yearA}`);
      const dateB = new Date(`${monthB} 1, ${yearB}`);
      return dateB - dateA; // Reverse order for descending
    });

    // Add Total column (will appear after the name column)
    transformedCols.push({
      id: 'total',
      header: 'Total',
      cell: ({ row }) => {
        const sales = row.original['Total Sales'] || 0;
        const cogs = row.original['Total COGS'] || 0;
        const lines = row.original['Total Line Items'] || 0;
        const gm = row.original['GM%'] || 0;

        return (
          <div className="w-full h-full flex flex-col border-l border-black">
            <div 
              className="flex-1 px-3 py-2 text-center text-xs font-medium border-b border-black"
              style={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
            >
              ₹{formatNumberWithIndianCommas(sales)}
            </div>
            <div 
              className="flex-1 px-3 py-2 text-center text-xs font-medium border-b border-black"
              style={{ backgroundColor: '#e8f5e8', color: '#2e7d32' }}
            >
              {formatNumberWithIndianCommas(lines)} Lines
            </div>
            <div 
              className="flex-1 px-3 py-2 text-center text-xs font-medium border-b border-black"
              style={{ backgroundColor: '#f3e5f5', color: '#7b1fa2' }}
            >
              {gm}% GM
            </div>
            <div 
              className="flex-1 px-3 py-2 text-center text-xs font-medium"
              style={{ backgroundColor: '#ffebee', color: '#d32f2f' }}
            >
              ₹{formatNumberWithIndianCommas(cogs)}
            </div>
          </div>
        );
      },
      isTotal: true
    });

    // Add monthly columns (newest first)
    allMonthColumns.forEach(monthKey => {
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
              className="w-full h-full flex flex-col border-l border-black cursor-pointer hover:opacity-80"
              onClick={() => handleCellClick(monthKey, row.original, sales)}
              title="Click to view daily breakdown"
            >
              <div 
                className="flex-1 px-3 py-2 text-center text-xs font-medium border-b border-black"
                style={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
              >
                ₹{formatNumberWithIndianCommas(sales)}
              </div>
              <div 
                className="flex-1 px-3 py-2 text-center text-xs font-medium border-b border-black"
                style={{ backgroundColor: '#e8f5e8', color: '#2e7d32' }}
              >
                {formatNumberWithIndianCommas(lines)}
              </div>
              <div 
                className="flex-1 px-3 py-2 text-center text-xs font-medium border-b border-black"
                style={{ backgroundColor: '#f3e5f5', color: '#7b1fa2' }}
              >
                {gm}%
              </div>
              <div 
                className="flex-1 px-3 py-2 text-center text-xs font-medium"
                style={{ backgroundColor: '#ffebee', color: '#d32f2f' }}
              >
                ₹{formatNumberWithIndianCommas(cogs)}
              </div>
            </div>
          );
        },
        monthKey: monthKey,
        isMonthly: true
      });
    });

    return transformedCols;
  }, [initialColumns, safeData]);

  const table = useReactTable({
    data: pagedData,
    columns: transformedColumns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleCellClick = (monthHeader, rowData, value) => {
    if (typeof value === 'number' && value > 0) {
      try {
        const monthName = String(monthHeader).split(' ')[0];
        const year = parseInt(String(monthHeader).split(' ')[1]);
        
        if (!monthName || !year) return;
        
        const monthNumber = new Date(`${monthName} 1, ${year}`).getMonth() + 1;
        
        let filterValue = '';
        
        if (type === 'category' && rowData.Category) {
          filterValue = rowData.Category;
        } else if (type === 'customer' && rowData['Customer Name']) {
          filterValue = rowData['Customer Name'];
        } else if (type === 'salesperson' && rowData['Sales Person Name']) {
          filterValue = rowData['Sales Person Name'];
        } else if (type === 'state' && rowData['State']) {
          filterValue = rowData['State'];
        }
        
        setSelectedCell({
          month: monthNumber,
          year,
          monthName,
          type,
          filterValue,
          rowData,
          categoryFilter
        });
        
        setShowModal(true);
      } catch (error) {
        console.error('Error handling cell click:', error);
      }
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map((row) => {
      const formatted = {};
      
      const nameKey = Object.keys(row).find(key => 
        ['Category', 'Customer Name', 'Sales Person Name', 'State'].includes(key)
      );
      if (nameKey) {
        formatted[nameKey] = row[nameKey];
      }
      
      formatted['Total Sales'] = row['Total Sales'] || 0;
      formatted['Total COGS'] = row['Total COGS'] || 0;
      formatted['Total Line Items'] = row['Total Line Items'] || 0;
      formatted['GM%'] = row['GM%'] || 0;
      
      Object.keys(row).forEach(key => {
        if (key.match(/^[A-Za-z]{3} \d{4}$/) && !key.includes('_')) {
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

  return (
    <div className="w-full mb-6">
      <div className="mb-4 flex justify-between items-center gap-4">
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
          className="px-3 py-2 border border-black rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-black flex-grow"
          style={{ maxWidth: "300px" }}
        />
        <button 
          onClick={handleExportExcel} 
          className="bg-green-800 hover:bg-green-900 text-white font-medium py-2 px-4 rounded shadow-sm transition-colors duration-200"
        >
          Excel
        </button>
      </div>

      

      {/* Container with fixed header and first column */}
      <div className="relative w-full max-w-[calc(100vw-32px)] mx-auto">
        {/* Horizontal scroll container */}
        <div className="overflow-x-auto">
          {/* Vertical scroll container */}
          <div 
            className="border border-black rounded-lg bg-white shadow-sm"
            style={{ 
              height: '70vh',
              overflowY: 'auto',
              position: 'relative'
            }}
          >
            <table className="w-full border-collapse">
              {/* Fixed header */}
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header, headerIndex) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-center font-semibold text-sm text-white border border-black"
                        style={{
                          backgroundColor: '#4caf50',
                          minWidth: header.column.columnDef.isTotal || header.column.columnDef.isMonthly ? "140px" : "auto",
                          whiteSpace: 'nowrap',
                          position: 'sticky',
                          top: 0,
                          zIndex: headerIndex === 0 ? 30 : 20, // First column header gets highest z-index
                          left: headerIndex === 0 ? 0 : 'auto', // Only first column is sticky horizontally
                        }}
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
              <tbody className="bg-white">
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border border-black">
                      {row.getVisibleCells().map((cell, cellIndex) => (
                        <td
                          key={cell.id}
                          className={`
                            ${cellIndex === 0 ? 
                              "text-left px-4 py-3 bg-white border border-black" : 
                              "text-center p-0 bg-white border border-black"}
                          `}
                          style={{
                            minWidth: cell.column.columnDef.isTotal || cell.column.columnDef.isMonthly ? "140px" : "auto",
                            verticalAlign: "top",
                            height: cell.column.columnDef.isTotal || cell.column.columnDef.isMonthly ? "120px" : "auto",
                            whiteSpace: 'nowrap',
                            position: cellIndex === 0 ? 'sticky' : 'static',
                            left: cellIndex === 0 ? 0 : 'auto',
                            zIndex: cellIndex === 0 ? 10 : 'auto',
                            backgroundColor: cellIndex === 0 ? 'white' : 'transparent'
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={transformedColumns.length} className="p-8 text-center text-gray-500 bg-white border border-black">
                      No data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center items-center gap-2">
        <button
          onClick={() => setPage(1)}
          disabled={page === 1}
          className="px-3 py-1 text-sm border border-black rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          First
        </button>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 text-sm border border-black rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Prev
        </button>
        <span className="px-4 py-1 text-sm text-gray-700">
          Page {page} of {pageCount} ({filteredData.length} total)
        </span>
        <button
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          disabled={page === pageCount}
          className="px-3 py-1 text-sm border border-black rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
        <button
          onClick={() => setPage(pageCount)}
          disabled={page === pageCount}
          className="px-3 py-1 text-sm border border-black rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Last
        </button>
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