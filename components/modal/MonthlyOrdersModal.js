// components/modal/MonthlyOrdersModal.js
import React, { useState, useEffect, useMemo } from "react";
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
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";

const MonthlyOrdersModal = ({ onClose, year, month, status, filters }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 12,
  });

  const columns = useMemo(
    () => [
      {
        accessorKey: "SO No",
        header: "SO No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "SO Date",
        header: "SO Date",
        cell: ({ getValue }) => formatDate(getValue()) || "-",
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.original["SO Date"]);
          const dateB = new Date(rowB.original["SO Date"]);
          return dateA - dateB;
        },
      },
      {
        accessorKey: "Customer Name",
        header: "Customer Name",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Customer Ref No",
        header: "Customer Ref. No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Contact Person",
        header: "Contact Person",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Sales Person",
        header: "Sales Person",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Item No",
        header: "Item No.",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Description",
        header: "Description",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Cas No",
        header: "Cas No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Vendor Cat No",
        header: "Vendor Cat. No.",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "PKZ",
        header: "PKZ",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Qty",
        header: "Qty",
        cell: ({ getValue }) => getValue() !== null ? getValue() : "-",
      },
      {
        accessorKey: "Status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue();
          let variant = "secondary";
          
          switch (status) {
            case "Open":
              variant = "danger";
              break;
            case "Closed":
              variant = "success";
              break;
            case "Cancelled":
              variant = "danger";
              break;
            case "Partial":
              variant = "warning";
              break;
            default:
              variant = "secondary";
          }
          
          return (
            <Badge bg={variant} className="fw-normal">
              {status || "-"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "Unit Price",
        header: "Unit Price",
        cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
        sortingFn: (rowA, rowB) => {
          const priceA = parseFloat(rowA.original["Unit Price"]) || 0;
          const priceB = parseFloat(rowB.original["Unit Price"]) || 0;
          return priceA - priceB;
        },
      },
      {
        accessorKey: "Total Value",
        header: "Total Value",
        cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
        sortingFn: (rowA, rowB) => {
          const totalA = parseFloat(rowA.original["Total Value"]) || 0;
          const totalB = parseFloat(rowB.original["Total Value"]) || 0;
          return totalA - totalB;
        },
      },
      {
        accessorKey: "Batch No",
        header: "Batch No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Mkt Feedback",
        header: "Mkt Feedback",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Invoice No",
        header: "Invoice No",
        cell: ({ getValue }) => getValue() || "-",
      },
    ],
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem("token");
        const queryParams = new URLSearchParams();
        
        queryParams.append("year", year);
        queryParams.append("month", month);
        queryParams.append("status", status === "open" ? "Open" : "Partial");
        
        // Add filters if they exist
        if (filters.salesPerson?.value) {
          queryParams.append("slpCode", filters.salesPerson.value);
        }
        if (filters.contactPerson?.value) {
          queryParams.append("contactPerson", filters.contactPerson.value);
        }
        if (filters.category?.value) {
          queryParams.append("itmsGrpCod", filters.category.value);
        }
        if (filters.product?.value) {
          queryParams.append("itemCode", filters.product.value);
        }
        if (filters.customer?.value) {
          queryParams.append("cardCode", filters.customer.value);
        }

        const response = await fetch(`/api/monthly-orders-details?${queryParams}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch order details");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError(err.message);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, month, status, filters]);

  const table = useReactTable({
    data: data || [],
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
    // Enable sorting for all columns
    enableSorting: true,
    // Default sort state - you can set initial sorting here if needed
    initialState: {
      sorting: [
        { id: 'SO Date', desc: true } // Default sort by SO Date descending (newest first)
      ]
    }
  });

  const handleExport = () => {
    const exportData = (data || []).map((item) => {
      const formattedRow = {};
      columns.forEach((column) => {
        const header = column.header;
        const value = item[column.accessorKey];

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

    downloadExcel(exportData, `${status}_orders_${month}_${year}`);
  };

  const statusText = status === 'open' ? 'Open' : 'Partial';
  const modalTitle = `${statusText} Orders - ${month} ${year}`;

  return (
    <Modal show onHide={onClose} size="xl" centered dialogClassName="modal-95w">
      <Modal.Header className="py-3 px-4 bg-dark">
        <div className="d-flex align-items-center justify-content-between w-100">
          <Modal.Title className="fs-4 m-0 text-white">
            {modalTitle}
          </Modal.Title>
          <div className="d-flex align-items-center gap-3">
            <Form.Control
              type="text"
              placeholder="Search orders..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              style={{ width: "300px" }}
              size="lg"
              className="border-0"
            />
            <Button 
              variant="success" 
              size="lg" 
              onClick={handleExport}
              className="px-4"
              disabled={loading || data.length === 0}
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
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: "65vh" }}>
            <div className="text-center">
              <Spinner animation="border" size="lg" />
              <p className="mt-3">Loading order details...</p>
            </div>
          </div>
        ) : error ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: "65vh" }}>
            <div className="alert alert-danger">
              {error}
            </div>
          </div>
        ) : (
          <>
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
                          <div className="d-flex align-items-center">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <span className="ms-2">↑</span>,
                              desc: <span className="ms-2">↓</span>,
                            }[header.column.getIsSorted()] ?? null}
                          </div>
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
                        {globalFilter ? "No matching records found" : "No order details available"}
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
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default MonthlyOrdersModal;