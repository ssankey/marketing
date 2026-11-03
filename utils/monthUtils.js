// components/KPI-modal/SalesModal.js
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
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";

const SalesModal = ({ salesData, onClose, dateFilter, startDate, endDate }) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 12,
  });

  const columns = useMemo(
    () => [
      {
        accessorKey: "DocNum",
        header: "Invoice#",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "DocDate",
        header: "Invoice Date",
        cell: ({ getValue }) => {
          const value = getValue();
          // Handle different date formats
          if (!value) return "-";
          
          // If it's already a formatted date string, return it
          if (typeof value === 'string' && value.includes('/')) {
            return value;
          }
          
          // If it's an ISO string or Date object, format it
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              return formatDate(date);
            }
            return value || "-";
          } catch (error) {
            console.error("Error formatting date:", error, "Value:", value);
            return value || "-";
          }
        },
      },
      {
        accessorKey: "ContactPerson",
        header: "Contact Person",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "DocDueDate",
        header: "Due Date",
        cell: ({ getValue }) => {
          const value = getValue();
          if (!value) return "-";
          
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              return formatDate(date);
            }
            return value || "-";
          } catch (error) {
            console.error("Error formatting due date:", error, "Value:", value);
            return value || "-";
          }
        },
      },
      {
        accessorKey: "Cust Code",
        header: "Customer Code",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Customer/Vendor Name",
        header: "Customer Name",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "ProductCount",
        header: "Total Lines",
        cell: ({ getValue }) => getValue() || 0,
      },
      {
        accessorKey: "DocTotal",
        header: "Total Amount",
        cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
      },
      {
        accessorKey: "Document Currency",
        header: "Currency",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Dispatch Date",
        header: "Dispatch Date",
        cell: ({ getValue }) => {
          const value = getValue();
          if (!value) return "-";
          
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              return formatDate(date);
            }
            return value || "-";
          } catch (error) {
            console.error("Error formatting dispatch date:", error, "Value:", value);
            return value || "-";
          }
        },
      },
      {
        accessorKey: "Tracking Number",
        header: "Tracking #",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Transport Name",
        header: "Transport",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Sales Employee",
        header: "Sales Person",
        cell: ({ getValue }) => getValue() || "-",
      },
    ],
    []
  );

  const table = useReactTable({
    data: salesData || [],
    columns,
    state: {
      globalFilter,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase();
      return Object.values(row.original).some(value =>
        String(value).toLowerCase().includes(searchValue))
    },
  });

  const handleExportExcel = () => {
    const exportData = (salesData || []).map((row) => {
      const formattedRow = {};
      columns.forEach((column) => {
        const header = column.header;
        const value = row[column.accessorKey];

        if (header.includes("Date")) {
          if (value) {
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                formattedRow[header] = formatDate(date);
              } else {
                formattedRow[header] = value || "-";
              }
            } catch (error) {
              formattedRow[header] = value || "-";
            }
          } else {
            formattedRow[header] = "-";
          }
        } else if (header === "Total Amount") {
          formattedRow[header] = value !== null ? formatCurrency(value).slice(1) : "-";
        } else {
          formattedRow[header] = value || "-";
        }
      });
      return formattedRow;
    });

    const dateRange = getDateRangeText();
    downloadExcel(exportData, `Sales_Invoice_${dateRange}`);
  };

  const getDateRangeText = () => {
    const today = new Date();
    switch (dateFilter) {
      case "today": return "Today";
      case "thisWeek": return "This_Week";
      case "thisMonth": return "This_Month";
      case "custom": return `${startDate}_to_${endDate}`;
      default: return "Data";
    }
  };

  const getModalTitle = () => {
    const dateRange = getDateRangeText().replace(/_/g, " ");
    return `Sales Invoice Details - ${dateRange}`;
  };

  // Debug: Log the first few rows of salesData to check the structure
  React.useEffect(() => {
    if (salesData && salesData.length > 0) {
      console.log("Sales data sample:", salesData[0]);
      console.log("DocDate value:", salesData[0].DocDate);
      console.log("DocDate type:", typeof salesData[0].DocDate);
    }
  }, [salesData]);

  return (
    <Modal show={true} onHide={onClose} size="xl" centered dialogClassName="modal-95w">
      <Modal.Header className="py-3 px-4 bg-dark">
        <div className="d-flex align-items-center justify-content-between w-100">
          <Modal.Title className="fs-4 m-0 text-white">
            {getModalTitle()}
          </Modal.Title>
          <div className="d-flex align-items-center gap-3">
            <Form.Control
              type="text"
              placeholder="Search invoices..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              style={{ width: "300px" }}
              size="lg"
              className="border-0"
            />
            <Button 
              variant="success" 
              size="lg" 
              onClick={handleExportExcel}
              className="px-4"
            >
              Export to Excel
            </Button>
            <Button 
              variant="light" 
              size="lg" 
              onClick={onClose}
              className="px-3"
            >
              ✕
            </Button>
          </div>
        </div>
      </Modal.Header>
      <Modal.Body style={{ margin: "0" }}>
        <div className="border rounded overflow-auto" style={{ height: "65vh" }}>
          <table className="table table-striped table-hover mb-0">
            <thead className="table-dark sticky-top">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-nowrap"
                      style={{
                        cursor: header.column.getCanSort() ? "pointer" : "default",
                        userSelect: "none",
                        backgroundColor: '#343a40',
                        color: 'white',
                        fontSize: '0.95rem'
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted()] ?? null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2 text-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="p-4 text-center">
                    No sales data available for the selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="d-flex justify-content-between align-items-center mt-3 px-3">
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">
              Showing {table.getRowModel().rows.length} of{' '}
              {table.getFilteredRowModel().rows.length} rows
            </span>
          </div>
          
          <div className="d-flex align-items-center gap-3">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              title="First Page"
            >
              ≪
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            
            <span className="mx-2">
              Page{' '}
              <strong>
                {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
              </strong>
            </span>
            
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              title="Last Page"
            >
              ≫
            </Button>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">Rows per page:</span>
            <Form.Select
              value={table.getState().pagination.pageSize}
              onChange={e => {
                table.setPageSize(Number(e.target.value));
              }}
              size="sm"
              style={{ width: '80px' }}
            >
              {[12, 25, 50, 100].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </Form.Select>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default SalesModal;