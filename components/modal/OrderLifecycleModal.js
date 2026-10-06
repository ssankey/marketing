// components/OrderLifecycleModal.js
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
import Badge from "react-bootstrap/Badge";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";

const OrderLifecycleModal = ({ orderData, onClose, title = "Order Lifecycle Details" }) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 12,
  });

  // Initial sorting state - sort by SO_Date in descending order (latest first)
  const [sorting, setSorting] = useState([
    {
      id: "SO_Date",
      desc: true,
    },
  ]);

  const columns = useMemo(
    () => [
      // Customer & Reference Information
      {
        accessorKey: "CustomerRefNo",
        header: "Customer Ref No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Customer",
        header: "Customer",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "CardCode",
        header: "Card Code",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Contact_Person",
        header: "Contact Person",
        cell: ({ getValue }) => getValue() || "-",
      },
      
      // Sales Information
      {
        accessorKey: "Sales_Person",
        header: "Sales Person",
        cell: ({ getValue }) => getValue() || "-",
      },
    //   {
    //     accessorKey: "SlpCode",
    //     header: "Sales Code",
    //     cell: ({ getValue }) => getValue() || "-",
    //   },

      // SO Information
      {
        accessorKey: "SO_No",
        header: "SO No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "SO_Date",
        header: "SO Date",
        cell: ({ getValue }) => formatDate(getValue()) || "-",
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.getValue("SO_Date"));
          const dateB = new Date(rowB.getValue("SO_Date"));
          return dateA.getTime() - dateB.getTime();
        },
      },

      // Item Information
      {
        accessorKey: "Item_No",
        header: "Item No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Item_Service_Description",
        header: "Item Description",
        cell: ({ getValue }) => (
          <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {getValue() || "-"}
          </div>
        ),
      },
      {
        accessorKey: "Vendor_Catalog_No",
        header: "Vendor Catalog No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "PKZ",
        header: "Unit",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Category",
        header: "Category",
        cell: ({ getValue }) => getValue() || "-",
      },

      // Chemical Information
      {
        accessorKey: "Cas_No",
        header: "CAS No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Batch_No",
        header: "Batch No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "VendorBatchNum",
        header: "Vendor Batch",
        cell: ({ getValue }) => getValue() || "-",
      },

      // Vendor Information
      {
        accessorKey: "Vendor_Name",
        header: "Vendor Name",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Vendor_Code",
        header: "Vendor Code",
        cell: ({ getValue }) => getValue() || "-",
      },

      // PO Information
      {
        accessorKey: "PO_No",
        header: "PO No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "PO_Date",
        header: "PO Date",
        cell: ({ getValue }) => formatDate(getValue()) || "-",
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.getValue("PO_Date"));
          const dateB = new Date(rowB.getValue("PO_Date"));
          return dateA.getTime() - dateB.getTime();
        },
      },

      // GRN Information
      {
        accessorKey: "GRN_No",
        header: "GRN No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "GRN_Date",
        header: "GRN Date",
        cell: ({ getValue }) => formatDate(getValue()) || "-",
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.getValue("GRN_Date"));
          const dateB = new Date(rowB.getValue("GRN_Date"));
          return dateA.getTime() - dateB.getTime();
        },
      },

      // Invoice Information
      {
        accessorKey: "Invoice_No",
        header: "Invoice No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Invoice_Date",
        header: "Invoice Date",
        cell: ({ getValue }) => formatDate(getValue()) || "-",
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.getValue("Invoice_Date"));
          const dateB = new Date(rowB.getValue("Invoice_Date"));
          return dateA.getTime() - dateB.getTime();
        },
      },

      // Pricing & Quantity
      {
        accessorKey: "Quantity",
        header: "Quantity",
        cell: ({ getValue }) => getValue() !== null ? getValue() : "-",
      },
      {
        accessorKey: "Unit_Price",
        header: "Unit Price",
        cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
        sortingFn: (rowA, rowB) => {
          const priceA = parseFloat(rowA.original["Unit_Price"]) || 0;
          const priceB = parseFloat(rowB.original["Unit_Price"]) || 0;
          return priceA - priceB;
        },
      },
      {
        accessorKey: "Total_Price",
        header: "Total Price",
        cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
        sortingFn: (rowA, rowB) => {
          const totalA = parseFloat(rowA.original["Total_Price"]) || 0;
          const totalB = parseFloat(rowB.original["Total_Price"]) || 0;
          return totalA - totalB;
        },
      },
      {
        accessorKey: "VatSum",
        header: "VAT Amount",
        cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
      },
      {
        accessorKey: "Grand_Total",
        header: "Grand Total",
        cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
        sortingFn: (rowA, rowB) => {
          const totalA = parseFloat(rowA.original["Grand_Total"]) || 0;
          const totalB = parseFloat(rowB.original["Grand_Total"]) || 0;
          return totalA - totalB;
        },
      },

      // Dispatch & Transport
      {
        accessorKey: "Dispatch_Date",
        header: "Dispatch Date",
        cell: ({ getValue }) => formatDate(getValue()) || "-",
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.getValue("Dispatch_Date"));
          const dateB = new Date(rowB.getValue("Dispatch_Date"));
          return dateA.getTime() - dateB.getTime();
        },
      },
      {
        accessorKey: "Transport",
        header: "Transport",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Tracking_No",
        header: "Tracking No",
        cell: ({ getValue }) => getValue() || "-",
      },

      // Timeline Analysis
      {
        accessorKey: "PO_to_GRN_Days",
        header: "PO→GRN Days",
        cell: ({ getValue }) => {
          const days = getValue();
          if (days === null || days === undefined) return "-";
          
          let badgeColor = "secondary";
          if (days <= 7) badgeColor = "success";
          else if (days <= 14) badgeColor = "warning";
          else badgeColor = "danger";
          
          return <Badge bg={badgeColor}>{days}</Badge>;
        },
      },
      {
        accessorKey: "GRN_to_Invoice_Days",
        header: "GRN→Invoice Days",
        cell: ({ getValue }) => {
          const days = getValue();
          if (days === null || days === undefined) return "-";
          
          let badgeColor = "secondary";
          if (days <= 3) badgeColor = "success";
          else if (days <= 7) badgeColor = "warning";
          else badgeColor = "danger";
          
          return <Badge bg={badgeColor}>{days}</Badge>;
        },
      },
      {
        accessorKey: "Invoice_to_Dispatch_Days",
        header: "Invoice→Dispatch Days",
        cell: ({ getValue }) => {
          const days = getValue();
          if (days === null || days === undefined) return "-";
          
          let badgeColor = "secondary";
          if (days <= 2) badgeColor = "success";
          else if (days <= 5) badgeColor = "warning";
          else badgeColor = "danger";
          
          return <Badge bg={badgeColor}>{days}</Badge>;
        },
      },

      // Marketing
      {
        accessorKey: "MKT_Feedback",
        header: "Marketing Feedback",
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
        String(value).toLowerCase().includes(searchValue)
      );
    },
    enableSorting: true,
    initialState: {
      sorting: [
        { id: 'SO_Date', desc: true }
      ]
    }
  });

  const handleExportExcel = () => {
    const exportData = (orderData || []).map((row) => {
      const formattedRow = {};
      columns.forEach((column) => {
        const header = column.header;
        const value = row[column.accessorKey];

        if (header.includes("Date")) {
          formattedRow[header] = value ? formatDate(value) : "-";
        } else if (header.includes("Price") || header.includes("Total") || header === "VAT Amount") {
          formattedRow[header] = value !== null ? formatCurrency(value).slice(1) : "-";
        } else {
          formattedRow[header] = value || "-";
        }
      });
      return formattedRow;
    });

    downloadExcel(exportData, "Order_Lifecycle_Details");
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!orderData || orderData.length === 0) return null;

    const totalOrders = orderData.length;
    const totalValue = orderData.reduce((sum, order) => sum + (parseFloat(order.Grand_Total) || 0), 0);
    const avgOrderValue = totalValue / totalOrders;

    const completedOrders = orderData.filter(order => order.Dispatch_Date).length;
    const completionRate = (completedOrders / totalOrders) * 100;

    const avgPOtoGRN = orderData
      .filter(order => order.PO_to_GRN_Days !== null)
      .reduce((sum, order) => sum + order.PO_to_GRN_Days, 0) / 
      orderData.filter(order => order.PO_to_GRN_Days !== null).length || 0;

    return {
      totalOrders,
      totalValue,
      avgOrderValue,
      completedOrders,
      completionRate,
      avgPOtoGRN: Math.round(avgPOtoGRN)
    };
  }, [orderData]);

  return (
    <Modal show={true} onHide={onClose} size="xl" centered dialogClassName="modal-98w">
      <Modal.Header className="py-3 px-4 bg-dark">
        <div className="d-flex align-items-center justify-content-between w-100">
          <Modal.Title className="fs-4 m-0 text-white">
            {title}
          </Modal.Title>
          <div className="d-flex align-items-center gap-3">
            <Form.Control
              type="text"
              placeholder="Search order lifecycle..."
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

      {/* Summary Statistics */}
      {/* {summaryStats && (
        <div className="bg-light border-bottom p-3">
          <div className="row text-center">
            <div className="col-md-2">
              <div className="fw-bold text-primary fs-5">{summaryStats.totalOrders}</div>
              <small className="text-muted">Total Orders</small>
            </div>
            <div className="col-md-2">
              <div className="fw-bold text-success fs-5">{formatCurrency(summaryStats.totalValue)}</div>
              <small className="text-muted">Total Value</small>
            </div>
            <div className="col-md-2">
              <div className="fw-bold text-info fs-5">{formatCurrency(summaryStats.avgOrderValue)}</div>
              <small className="text-muted">Avg Order Value</small>
            </div>
            <div className="col-md-2">
              <div className="fw-bold text-warning fs-5">{summaryStats.completedOrders}</div>
              <small className="text-muted">Completed Orders</small>
            </div>
            <div className="col-md-2">
              <div className="fw-bold text-secondary fs-5">{summaryStats.completionRate.toFixed(1)}%</div>
              <small className="text-muted">Completion Rate</small>
            </div>
            <div className="col-md-2">
              <div className="fw-bold text-dark fs-5">{summaryStats.avgPOtoGRN}d</div>
              <small className="text-muted">Avg PO→GRN</small>
            </div>
          </div>
        </div>
      )} */}

      <Modal.Body style={{ margin: "0" }}>
        <div className="border rounded overflow-auto" style={{ height: "68vh" }}>
          <table className="table table-striped table-hover mb-0">
            <thead className="table-dark sticky-top">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-3 text-nowrap"
                      style={{
                        cursor: header.column.getCanSort() ? "pointer" : "default",
                        userSelect: "none",
                        backgroundColor: '#343a40',
                        color: 'white',
                        fontSize: '0.9rem',
                        minWidth: '120px'
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
                  <tr key={row.id} className="align-middle">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2 text-nowrap" style={{ fontSize: '0.9rem' }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="p-4 text-center text-muted">
                    No order lifecycle data available
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
              {table.getFilteredRowModel().rows.length} entries
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

export default OrderLifecycleModal;