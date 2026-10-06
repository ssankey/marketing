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

const DailyInvoiceDetailsModal = ({ invoiceData, onClose, title = "Invoice Details" }) => {
    console.log("Modal data received:", invoiceData?.[0]);  // ← add this line
  console.log("Total rows:", invoiceData?.length);
  
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "Invoice Posting Dt.", desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 12 });

  // COA link — renders inline, no async availability check needed
   const CoaCell = ({ row }) => {
  const coaPath     = row["COA Filename"]      || "";
  const itemNo      = row["Item No."]          || "";
  const batchNum    = row["BatchNum"]           || "";
  const vendorBatch = row["U_vendorbatchno"]    || "";

  let url = null;

  if (coaPath.trim() !== "") {
    let filename = coaPath.trim();
    if (filename.includes("\\")) filename = filename.split("\\").pop();
    if (filename.includes("/"))  filename = filename.split("/").pop();
    url = `${window.location.origin}/api/coa/download/${encodeURIComponent(filename)}`;
  } else if (itemNo && vendorBatch.trim() !== "") {
    const itemPrefix = itemNo.includes("-") ? itemNo.split("-")[0] : itemNo;
    url = `${window.location.origin}/api/coa/download-energy/${encodeURIComponent(itemPrefix)}/${encodeURIComponent(vendorBatch.trim())}`;
  } else if (itemNo && batchNum.trim() !== "") {
    const itemPrefix = itemNo.includes("-") ? itemNo.split("-")[0] : itemNo;
    url = `${window.location.origin}/api/coa/download-energy/${encodeURIComponent(itemPrefix)}/${encodeURIComponent(batchNum.trim())}`;
  }

  if (!url) return <span style={{ fontSize: "0.75rem", color: "#6c757d" }}>N/A</span>;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      style={{ fontSize: "0.875rem", color: "#007bff" }}
    >
      COA
    </a>
  );
};

  const columns = useMemo(() => [
    {
      accessorFn: row => row["Inv#"],
      id: "Inv#",
      header: "Invoice No",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorFn: row => row["Invoice Posting Dt."],
      id: "Invoice Posting Dt.",
      header: "Invoice Date",
      cell: ({ getValue }) => formatDate(getValue()) || "-",
      sortingFn: (rowA, rowB) => {
        const a = new Date(rowA.getValue("Invoice Posting Dt."));
        const b = new Date(rowB.getValue("Invoice Posting Dt."));
        return a.getTime() - b.getTime();
      },
    },
    {
      accessorFn: row => row["SO No"],
      id: "SO No",
      header: "SO No",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorFn: row => row["SO Date"],
      id: "SO Date",
      header: "SO Date",
      cell: ({ getValue }) => formatDate(getValue()) || "-",
    },
    {
      accessorFn: row => row["SO Customer Ref. No"],
      id: "SO Customer Ref. No",
      header: "Customer Ref. No",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorFn: row => row["Contact Person"],
      id: "Contact Person",
      header: "Contact Person",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorFn: row => row["Item No."],
      id: "Item No.",
      header: "Item No.",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorFn: row => row["Item/Service Description"],
      id: "Item/Service Description",
      header: "Description",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorFn: row => row["Cas No"],
      id: "Cas No",
      header: "Cas No",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorFn: row => row["COA Filename"],
      id: "COA Filename",
      header: "COA",
      cell: ({ row }) => <CoaCell row={row.original} />,
      enableSorting: false,
    },
    {
      accessorFn: row => row["Vendor Catalog No."],
      id: "Vendor Catalog No.",
      header: "Vendor Cat. No.",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorFn: row => row["PKZ"],
      id: "PKZ",
      header: "PKZ",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorFn: row => row["Qty"],
      id: "Qty",
      header: "Qty",
      cell: ({ getValue }) => getValue() ?? "-",
    },
    {
      accessorFn: row => row["STATUS"],
      id: "STATUS",
      header: "Status",
      cell: ({ getValue }) => getValue() || "-",
    },
    // Add after "Contact Person" column
    {
    accessorFn: row => row["Sales_Person"],
    id: "Sales_Person",
    header: "Sales Person",
    cell: ({ getValue }) => getValue() || "-",
    },
    {
    accessorFn: row => row["Category"],
    id: "Category",
    header: "Category",
    cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorFn: row => row["Tracking Number"],
      id: "Tracking Number",
      header: "Tracking No",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorFn: row => row["Dispatch Date"],
      id: "Dispatch Date",
      header: "Dispatch Date",
      cell: ({ getValue }) => formatDate(getValue()) || "-",
    },
    {
      accessorFn: row => row["DELIVER DATE"],
      id: "DELIVER DATE",
      header: "Delivery Date",
      cell: ({ getValue }) => formatDate(getValue()) || "-",
    },
    {
      accessorFn: row => row["Unit Sales Price"],
      id: "Unit Sales Price",
      header: "Unit Price",
      cell: ({ getValue }) => getValue() != null ? formatCurrency(getValue()) : "-",
      sortingFn: (rowA, rowB) => {
        const a = parseFloat(rowA.original["Unit Sales Price"]) || 0;
        const b = parseFloat(rowB.original["Unit Sales Price"]) || 0;
        return a - b;
      },
    },
    {
      accessorFn: row => row["Total Sales Price/Open Value"],
      id: "Total Sales Price/Open Value",
      header: "Total Value",
      cell: ({ getValue }) => getValue() != null ? formatCurrency(getValue()) : "-",
      sortingFn: (rowA, rowB) => {
        const a = parseFloat(rowA.original["Total Sales Price/Open Value"]) || 0;
        const b = parseFloat(rowB.original["Total Sales Price/Open Value"]) || 0;
        return a - b;
      },
    },
    {
      accessorFn: row => row["BatchNum"],
      id: "BatchNum",
      header: "Batch No",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorFn: row => row["Mkt_Feedback"],
      id: "Mkt_Feedback",
      header: "Mkt Feedback",
      cell: ({ getValue }) => getValue() || "-",
    },
  ], []);

  const table = useReactTable({
    data: invoiceData || [],
    columns,
    state: { globalFilter, pagination, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSorting: true,
    globalFilterFn: (row, columnId, filterValue) => {
      const search = filterValue.toLowerCase();
      return Object.values(row.original).some(val =>
        String(val).toLowerCase().includes(search)
      );
    },
  });

  const handleExportExcel = () => {
  const exportData = (invoiceData || []).map(row => ({
    "Invoice No":         row["Inv#"]                                                                          || "-",
    "Invoice Date":       row["Invoice Posting Dt."]         ? formatDate(row["Invoice Posting Dt."])         : "-",
    "SO No":              row["SO No"]                                                                         || "-",
    "SO Date":            row["SO Date"]                     ? formatDate(row["SO Date"])                      : "-",
    "Customer Ref. No":   row["SO Customer Ref. No"]                                                           || "-",
    "Contact Person":     row["Contact Person"]                                                                || "-",
    "Item No.":           row["Item No."]                                                                      || "-",
    "Description":        row["Item/Service Description"]                                                      || "-",
    "Cas No":             row["Cas No"]                                                                        || "-",
    "Vendor Cat. No.":    row["Vendor Catalog No."]                                                            || "-",
    "PKZ":                row["PKZ"]                                                                           || "-",
    "Qty":                row["Qty"]                                                                           ?? "-",
    "Status":             row["STATUS"]                                                                        || "-",
    "Sales Person":       row["Sales_Person"]                                                                  || "-",
    "Category":           row["Category"]                                                                      || "-",
    "Tracking No":        row["Tracking Number"]                                                               || "-",
    "Dispatch Date":      row["Dispatch Date"]               ? formatDate(row["Dispatch Date"])                : "-",
    "Delivery Date":      row["DELIVER DATE"]                ? formatDate(row["DELIVER DATE"])                 : "-",
    "Unit Price":         row["Unit Sales Price"]            != null ? formatCurrency(row["Unit Sales Price"]).slice(1)                        : "-",
    "Total Value":        row["Total Sales Price/Open Value"] != null ? formatCurrency(row["Total Sales Price/Open Value"]).slice(1)           : "-",
    "Batch No":           row["BatchNum"]                                                                      || "-",
    "Mkt Feedback":       row["Mkt_Feedback"]                                                                  || "-",
  }));

  downloadExcel(exportData, "Daily_Invoice_Details");
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
              placeholder="Search invoices..."
              value={globalFilter ?? ""}
              onChange={e => setGlobalFilter(e.target.value)}
              style={{ width: "300px" }}
              size="lg"
              className="border-0"
            />
            <Button variant="success" size="lg" onClick={handleExportExcel} className="px-4">
              Export to Excel
            </Button>
            <Button variant="light" size="lg" onClick={onClose} className="px-3">
              ✕
            </Button>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body style={{ margin: "0" }}>
        <div className="border rounded overflow-auto" style={{ height: "65vh" }}>
          <table className="table table-striped table-hover mb-0">
            <thead className="sticky-top">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-nowrap"
                      style={{
                        cursor: header.column.getCanSort() ? "pointer" : "default",
                        userSelect: "none",
                        backgroundColor: '#343a40',
                        color: "white",
                        fontSize: "0.95rem",
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="d-flex align-items-center">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: <span className="ms-2">↑</span>, desc: <span className="ms-2">↓</span> }[header.column.getIsSorted()] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-2 text-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="p-4 text-center">
                    No invoice data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="d-flex justify-content-between align-items-center mt-3 px-3">
          <span className="text-muted">
            Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} rows
          </span>

          <div className="d-flex align-items-center gap-3">
            <Button variant="outline-secondary" size="sm" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} title="First Page">≪</Button>
            <Button variant="outline-secondary" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
            <span className="mx-2">
              Page <strong>{table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</strong>
            </span>
            <Button variant="outline-secondary" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
            <Button variant="outline-secondary" size="sm" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} title="Last Page">≫</Button>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">Rows per page:</span>
            <Form.Select
              value={table.getState().pagination.pageSize}
              onChange={e => table.setPageSize(Number(e.target.value))}
              size="sm"
              style={{ width: "80px" }}
            >
              {[12, 25, 50, 100].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </Form.Select>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default DailyInvoiceDetailsModal;