// components/modal/OrderDetailsModal.js
import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

const OrderDetailsModal = ({ orderData, onClose, title = "Order Details" }) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 12,
  });

  const columns = useMemo(
    () => [
      {
        accessorFn: row => row["SO No"],
        header: "SO No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["SO Date"],
        header: "SO Date",
        cell: ({ getValue }) => formatDate(getValue()) || "-",
      },
      {
        accessorFn: row => row["Customer Ref. No"],
        header: "Customer Ref. No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Contact Person"],
        header: "Contact Person",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Item No."],
        header: "Item No.",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Item/Service Description"],
        header: "Description",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Cas No"],
        header: "Cas No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["CategoryName"],
        header: "CategoryName",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Vendor Catalog No."],
        header: "Vendor Cat. No.",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["PKZ"],
        header: "PKZ",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Qty"],
        header: "Qty",
        cell: ({ getValue }) => getValue() !== null ? getValue() : "-",
      },
      {
        accessorFn: row => row["STATUS"],
        header: "Status",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Inv#"],
        header: "Invoice No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Invoice Posting Dt."],
        header: "Invoice Date",
        cell: ({ getValue }) => formatDate(getValue()) || "-",
      },
      {
        accessorFn: row => row["Tracking Number"],
        header: "Tracking No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Dispatch Date"],
        header: "Dispatch Date",
        cell: ({ getValue }) => formatDate(getValue()) || "-",
      },
      {
        accessorFn: row => row["DELIVER DATE"],
        header: "Delivery Date",
        cell: ({ getValue }) => formatDate(getValue()) || "-",
      },
      {
        accessorFn: row => row["Unit Sales Price"],
        header: "Unit Price",
        cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
      },
      {
        accessorFn: row => row["Total Sales Price/Open Value"],
        header: "Total Value",
        cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
      },
      {
        accessorFn: row => row["BatchNum"],
        header: "Batch No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Mkt_Feedback"],
        header: "Mkt Feedback",
        cell: ({ getValue }) => getValue() || "-",
      },
    ],
    []
  );

  const table = useReactTable({
    data: orderData || [],
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
    const exportData = (orderData || []).map((row) => {
      const formattedRow = {};
      columns.forEach((column) => {
        const header = column.header;
        const value = column.accessorFn(row);

        if (header.includes("Date")) {
          formattedRow[header] = value ? formatDate(value) : "N/A";
        } else if (header === "Unit Price" || header === "Total Value") {
          formattedRow[header] = value !== null ? formatCurrency(value).slice(1) : "-";
        } else {
          formattedRow[header] = value || "-";
        }
      });
      return formattedRow;
    });

    downloadExcel(exportData, "Order_Details");
  };

  return (
    <Modal show={true} onHide={onClose} size="xl" centered dialogClassName="modal-95w">
      <Modal.Header className="py-3 px-4 bg-dark">
        <div className="d-flex align-items-center justify-content-between w-100">
          <Modal.Title className="fs-4 m-0 text-white">
            {title}
          </Modal.Title>
          <div className="d-flex align-items-center gap-3">
            <Form.Control
              type="text"
              placeholder="Search order details..."
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
                    No data available
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

export default OrderDetailsModal;