
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
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";
import InvoiceDetailsModal from "components/modal/InvoiceDetailsModal";

const SalesModal = ({ salesData, onClose, dateFilter, startDate, endDate }) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 12,
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [error, setError] = useState(null);

  // Initial sorting state - sort by DocDate in descending order (latest first)
  const [sorting, setSorting] = useState([
    {
      id: "DocDate",
      desc: true, // true for descending (latest first)
    },
  ]);

  const fetchInvoiceDetails = async (invoiceNo) => {
    setLoadingDetails(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found in localStorage");
      }

      const response = await fetch(`/api/modal/invoiceDetails?invoiceNo=${invoiceNo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format - expected array');
      }
      
      if (data.length === 0) {
        setError('No records found for this invoice');
      }
      
      setInvoiceDetails(data);
      setShowDetailsModal(true);
      
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      setError(`Failed to load invoice details: ${error.message}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleInvoiceClick = (invoiceNo) => {
    if (!invoiceNo) {
      setError('Invoice number is required');
      return;
    }
    
    setSelectedInvoice(invoiceNo);
    fetchInvoiceDetails(invoiceNo);
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "DocNum",
        header: "Invoice#",
        cell: ({ getValue }) => (
          <span 
            className="text-primary cursor-pointer"
            style={{ 
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'none'
            }
          }}
            onClick={() => handleInvoiceClick(getValue())}
          >
            {getValue() || "-"}
          </span>
        ),
      },
      {
        accessorKey: "DocDate",
        header: "Invoice Date",
        cell: ({ getValue }) => formatDate(getValue()),
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.getValue("DocDate"));
          const dateB = new Date(rowB.getValue("DocDate"));
          return dateA.getTime() - dateB.getTime();
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
        cell: ({ getValue }) => formatDate(getValue()) || "-",
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.getValue("DocDueDate"));
          const dateB = new Date(rowB.getValue("DocDueDate"));
          return dateA.getTime() - dateB.getTime();
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
        sortingFn: (rowA, rowB) => {
          const totalA = parseFloat(rowA.original["DocTotal"]) || 0;
          const totalB = parseFloat(rowB.original["DocTotal"]) || 0;
          return totalA - totalB;
        },
      },
      {
        accessorKey: "Document Currency",
        header: "Currency",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Dispatch Date",
        header: "Dispatch Date",
        cell: ({ getValue }) => formatDate(getValue()) || "-",
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.getValue("Dispatch Date"));
          const dateB = new Date(rowB.getValue("Dispatch Date"));
          return dateA.getTime() - dateB.getTime();
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
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
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
    // Default sort state - sort by DocDate descending (newest first)
    initialState: {
      sorting: [
        { id: 'DocDate', desc: true }
      ]
    }
  });

  // const handleExportExcel = () => {
  //   const exportData = (salesData || []).map((row) => {
  //     const formattedRow = {};
  //     columns.forEach((column) => {
  //       const header = column.header;
  //       const value = row[column.accessorKey];

  //       if (header.includes("Date")) {
  //         formattedRow[header] = value ? formatDate(value) : "-";
  //       } else if (header === "Total Amount") {
  //         formattedRow[header] = value !== null ? formatCurrency(value).slice(1) : "-";
  //       } else {
  //         formattedRow[header] = value || "-";
  //       }
  //     });
  //     return formattedRow;
  //   });

  //   const dateRange = getDateRangeText();
  //   downloadExcel(exportData, `Sales_Invoice_${dateRange}`);
  // };

  const handleExportExcel = () => {
  const exportData = (salesData || []).map((row) => {
    const formattedRow = {};
    columns.forEach((column) => {
      const header = column.header;
      const value = row[column.accessorKey];

      if (header.includes("Date")) {
        formattedRow[header] = value ? formatDate(value) : "-";
      } else if (header === "Total Amount") {
        // Export as raw number for Excel calculations
        formattedRow[header] = value !== null ? parseFloat(value) : 0;
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

      {/* Invoice Details Modal */}
      {showDetailsModal && (
        <InvoiceDetailsModal
          invoiceData={invoiceDetails}
          onClose={() => {
            setShowDetailsModal(false);
            setError(null);
          }}
          title={`Invoice #${selectedInvoice} Details`}
        />
      )}

      {loadingDetails && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50" style={{zIndex: 1050}}>
          <div className="bg-white p-4 rounded shadow">
            <Spinner animation="border" variant="primary" />
            <span className="ms-2">Loading invoice details...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="position-fixed top-20 end-20 z-50">
          <Alert 
            variant="danger" 
            dismissible 
            onClose={() => setError(null)}
            className="mb-3"
          >
            {error}
          </Alert>
        </div>
      )}
    </Modal>
  );
};

export default SalesModal;