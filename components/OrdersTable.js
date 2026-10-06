

import React, { useMemo, useState, useEffect } from "react";
import { 
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { 
  Container, 
  Row, 
  Col, 
  Spinner, 
  Button, 
  Alert,
  Badge,
  ButtonGroup
} from "react-bootstrap";
import Link from "next/link";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import { truncateText } from "utils/truncateText";
import OrderDetailsModal from "./modal/OrderDetailsModal";
import downloadExcel from "utils/exporttoexcel";

const OrdersTable = ({
  orders = [],
  isLoading = false,
  initialStatus = "all",
  initialPage = 1,
  pageSize = 20,
}) => {
  const [allData, setAllData] = useState(orders);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState(null);
  
  // Filters state
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Store complete dataset when parent data changes
  useEffect(() => {
    setAllData(orders);
  }, [orders]);

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    let filtered = [...allData];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.DocStatus === statusFilter);
    }

    // Apply global search filter
    if (globalFilter) {
      const searchTerm = globalFilter.toLowerCase();
      filtered = filtered.filter(order => {
        return (
          (order.DocNum?.toString().toLowerCase().includes(searchTerm)) ||
          (order.DocStatus?.toLowerCase().includes(searchTerm)) ||
          (order.CustomerPONo?.toLowerCase().includes(searchTerm)) ||
          (order.CardName?.toLowerCase().includes(searchTerm)) ||
          (order.SalesEmployee?.toLowerCase().includes(searchTerm)) ||
          (order.ContactPerson?.toLowerCase().includes(searchTerm)) ||
          (formatDate(order.DocDate)?.toLowerCase().includes(searchTerm)) ||
          (formatDate(order.DeliveryDate)?.toLowerCase().includes(searchTerm))
        );
      });
    }

    // Apply date range filter
    if (fromDate || toDate) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.DocDate);
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;
        
        if (from && to) {
          return orderDate >= from && orderDate <= to;
        } else if (from) {
          return orderDate >= from;
        } else if (to) {
          return orderDate <= to;
        }
        return true;
      });
    }

    return filtered;
  }, [allData, statusFilter, globalFilter, fromDate, toDate]);

  // Pagination calculations
  const pageCount = Math.ceil(filteredData.length / pageSize);
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [globalFilter, statusFilter, fromDate, toDate]);

  const fetchOrderDetails = async (orderNo, customerPONo) => {
    setLoadingDetails(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (orderNo) params.append('orderNo', orderNo);
      if (customerPONo) params.append('customerPONo', customerPONo);
      
      const url = `/api/modal/orderDetails?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format - expected array');
      }
      
      if (data.length === 0) {
        setError('No records found for the selected criteria');
      }
      
      setOrderDetails(data);
      setShowDetailsModal(true);
      
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError(`Failed to load order details: ${error.message}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOrderNoClick = (orderNo, e) => {
    e.preventDefault();
    if (!orderNo) {
      setError('Order number is required');
      return;
    }
    
    setSelectedOrder({ type: 'orderNo', value: orderNo });
    fetchOrderDetails(orderNo, null);
  };

  const handleCustomerPONoClick = (customerPONo, e) => {
    e.preventDefault();
    if (!customerPONo) {
      setError('Customer PO number is required');
      return;
    }
    
    setSelectedOrder({ type: 'customerPONo', value: customerPONo });
    fetchOrderDetails(null, customerPONo);
  };

  const sendMail = async (row) => {
    try {
      const res = await fetch("/api/email/sendOrderEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docEntry: row.DocEntry, docNum: row.DocNum }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Email sending failed.");
        return;
      }

      setAllData(prev => 
        prev.map(r =>
          r.DocEntry === row.DocEntry
            ? {
                ...r,
                EmailSentDT: data.EmailSentDT,
                EmailSentTM: data.EmailSentTM,
              }
            : r
        )
      );

      alert("Order confirmation email sent successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to send email: " + e.message);
    }
  };

  // Column definitions
  const tableColumns = useMemo(() => [
    {
      accessorKey: "DocNum",
      header: "Order#",
      cell: ({ getValue, row }) => (
        <a
          href="#"
          onClick={(e) => handleOrderNoClick(getValue(), e)}
          className="text-primary fw-semibold"
          style={{ userSelect: "text", textDecoration: "none", cursor: "pointer" }}
        >
          {getValue() || 'N/A'}
        </a>
      ),
    },
    {
      accessorKey: "DocStatus",
      header: "Order Status",
      cell: ({ getValue }) => {
        const value = getValue();
        let cls = "bg-danger";
        if (value === "Open") cls = "bg-primary";
        if (value === "Partial") cls = "bg-warning";
        if (value === "Closed") cls = "bg-success";
        if (value === "Cancelled") cls = "bg-secondary";
        return <Badge className={cls}>{value || 'N/A'}</Badge>;
      },
    },
    {
      accessorKey: "CustomerPONo",
      header: "Customer PONo",
      cell: ({ getValue, row }) => {
        const value = getValue();
        return value ? (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleCustomerPONoClick(value, e);
            }}
            className="text-primary fw-semibold"
            style={{ userSelect: "text", textDecoration: "none", cursor: "pointer" }}
          >
            {value}
          </a>
        ) : "N/A";
      },
    },
    {
      accessorKey: "CardName",
      header: "Customer",
      cell: ({ getValue }) => truncateText(getValue() || 'N/A', 20),
    },
    {
      accessorKey: "DocDate",
      header: "Order Date",
      cell: ({ getValue }) => formatDate(getValue()),
    },
    {
      accessorKey: "DeliveryDate",
      header: "Delivery Date",
      cell: ({ getValue }) => formatDate(getValue()),
    },
    {
      accessorKey: "DocTotal",
      header: "Total Amount",
      cell: ({ getValue, row }) => {
        const value = getValue();
        const rowData = row.original;
        const amt = rowData.DocCur === "INR" ? value : value * (rowData.ExchangeRate || 1);
        return formatCurrency(amt || 0);
      },
    },
    {
      accessorKey: "SalesEmployee",
      header: "Sales Employee",
      cell: ({ getValue }) => getValue() || "N/A",
    },
    {
      accessorKey: "ContactPerson",
      header: "Contact Person",
      cell: ({ getValue }) => getValue() || "N/A",
    },
    {
      accessorKey: "EmailSentDT",
      header: "Mail Sent",
      cell: ({ getValue, row }) => {
        const rowData = row.original;
        if (rowData.EmailSentDT) {
          const dt = new Date(rowData.EmailSentDT);
          const hasTime = rowData.EmailSentTM !== null && rowData.EmailSentTM !== undefined;
          const h = hasTime ? Math.floor(rowData.EmailSentTM / 60) : dt.getHours();
          const m = hasTime ? rowData.EmailSentTM % 60 : dt.getMinutes();
          const day = String(dt.getDate()).padStart(2, "0");
          const month = String(dt.getMonth() + 1).padStart(2, "0");
          const year = dt.getFullYear();

          return (
            <>
              {`${day}/${month}/${year} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`}
            </>
          );
        }

        return (
          <button
            className="btn btn-sm btn-primary"
            onClick={() => sendMail(rowData)}
          >
            Send Mail
          </button>
        );
      },
    },
    {
      accessorKey: "DocNum",
      header: "Details",
      cell: ({ getValue, row }) => (
        <Link href={`/orderdetails?d=${getValue()}&e=${row.original.DocEntry}`}>
          View Details
        </Link>
      )
    }
  ], []);

  // Initialize the table
  const table = useReactTable({
    data: pageData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount,
    state: {
      globalFilter,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const handleReset = () => {
    setGlobalFilter("");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const handleStatusChange = (status) => {
    setStatusFilter(status);
  };

  const handleSearch = (e) => {
    setGlobalFilter(e.target.value);
  };

  const handleDateChange = (type, value) => {
    if (type === "from") {
      setFromDate(value);
    } else {
      setToDate(value);
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map((row) => {
      const formattedRow = {};

      tableColumns.forEach((column) => {
        const value = row[column.accessorKey];

        if (column.accessorKey === "DocTotal") {
          const amt = row.DocCur === "INR" ? value : value * (row.ExchangeRate || 1);
          formattedRow[column.header] = formatCurrency(amt).slice(1);
        } else if (column.accessorKey.includes("Date") || column.accessorKey === "EmailSentDT") {
          formattedRow[column.header] = formatDate(value);
        } else if (column.accessorKey === "CardName") {
          formattedRow[column.header] = value || "N/A";
        } else if (column.accessorKey === "EmailSentDT" && value) {
          const dt = new Date(value);
          const hasTime = row.EmailSentTM !== null && row.EmailSentTM !== undefined;
          const h = hasTime ? Math.floor(row.EmailSentTM / 60) : dt.getHours();
          const m = hasTime ? row.EmailSentTM % 60 : dt.getMinutes();
          const day = String(dt.getDate()).padStart(2, "0");
          const month = String(dt.getMonth() + 1).padStart(2, "0");
          const year = dt.getFullYear();
          formattedRow[column.header] = `${day}/${month}/${year} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        } else if (column.header !== "Details") {
          formattedRow[column.header] = value || "N/A";
        }
      });

      return formattedRow;
    });

    downloadExcel(exportData, "Orders_Report");
  };

  return (
    <Container fluid>
      {/* Error Alert */}
      {error && (
        <Alert 
          variant="danger" 
          dismissible 
          onClose={() => setError(null)}
          className="mb-3"
        >
          {error}
        </Alert>
      )}

      {/* Filters Row */}
      <div className="mt-3 mb-4">
        <Row className="align-items-center g-3">
          <Col md={6} className="d-flex align-items-center gap-2">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={handleReset}
            >
              Reset
            </button>

            <ButtonGroup size="sm">
              <Button
                variant={statusFilter === 'all' ? 'primary' : 'outline-primary'}
                onClick={() => handleStatusChange('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'Open' ? 'primary' : 'outline-primary'}
                onClick={() => handleStatusChange('Open')}
              >
                Open
              </Button>
              <Button
                variant={statusFilter === 'Partial' ? 'primary' : 'outline-primary'}
                onClick={() => handleStatusChange('Partial')}
              >
                Partial
              </Button>
              <Button
                variant={statusFilter === 'Closed' ? 'primary' : 'outline-primary'}
                onClick={() => handleStatusChange('Closed')}
              >
                Closed
              </Button>
            </ButtonGroup>
          </Col>

          <Col md={6} className="d-flex align-items-center justify-content-end gap-2">
            <div className="input-group" style={{ maxWidth: "250px" }}>
              <input
                type="text"
                value={globalFilter}
                onChange={handleSearch}
                placeholder="Search all columns..."
                className="form-control form-control-sm"
              />
            </div>

            <div className="d-flex align-items-center gap-1">
              <label className="mb-0 small">From:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => handleDateChange("from", e.target.value)}
                className="form-control form-control-sm"
                style={{ width: "130px" }}
              />
            </div>

            <div className="d-flex align-items-center gap-1">
              <label className="mb-0 small">To:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => handleDateChange("to", e.target.value)}
                className="form-control form-control-sm"
                style={{ width: "130px" }}
              />
            </div>

            <button 
              onClick={handleExportExcel}
              className="btn btn-success btn-sm"
            >
              Export Excel
            </button>
          </Col>
        </Row>
      </div>

      {/* Table */}
      <div className="border rounded overflow-auto" style={{ maxHeight: "70vh" }}>
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 sticky top-0">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="border px-2 py-2 text-left font-medium"
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
                      className="border px-2 py-2 text-sm"
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
                <td colSpan={tableColumns.length} className="p-4 text-center">
                  {isLoading ? "Loading orders..." : "No orders found matching your criteria"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 d-flex justify-content-center">
        <div className="d-flex align-items-center gap-3">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="btn btn-outline-primary btn-sm"
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="btn btn-outline-primary btn-sm"
          >
            Prev
          </button>
          <span className="px-3 py-1 bg-light rounded">
            Page {currentPage} of {pageCount} ({filteredData.length} filtered)
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))}
            disabled={currentPage === pageCount}
            className="btn btn-outline-primary btn-sm"
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(pageCount)}
            disabled={currentPage === pageCount}
            className="btn btn-outline-primary btn-sm"
          >
            Last
          </button>
        </div>
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && (
        <OrderDetailsModal
          orderData={orderDetails}
          onClose={() => {
            setShowDetailsModal(false);
            setError(null);
          }}
          title={selectedOrder?.type === 'orderNo' 
            ? `Order # ${selectedOrder.value} Details` 
            : `Customer PO # ${selectedOrder?.value} Details`}
        />
      )}

      {/* Loading Spinner for Details */}
      {loadingDetails && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50" style={{zIndex: 1050}}>
          <div className="bg-white p-4 rounded shadow">
            <Spinner animation="border" variant="primary" />
            <span className="ms-2">Loading order details...</span>
          </div>
        </div>
      )}
    </Container>
  );
};

export default OrdersTable;