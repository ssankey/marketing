// components/CustomerCharts/customerInvoicesColumns.js
// Same invoice-line columns as components/invoices/invoicesColumns.js, same
// order, minus columns that are internal-only or redundant once already
// scoped to this one customer's own page: Sales Employee (internal),
// Customer/Vendor Name (redundant). The COA column is replaced entirely by
// a single "Invoice PDF" action column (credit-note rows get no button —
// they have no invoice PDF of their own).

import Link from "next/link";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import { Badge, Button } from "react-bootstrap";
import { useState } from "react";
import { openPrintWindow } from "utils/printBlob";

const InvoicePdfButton = ({ docNum }) => {
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/download-pdf/${docNum}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      openPrintWindow(blob, `Invoice_${docNum}`);
    } catch (error) {
      console.error("Error printing invoice PDF:", error);
      alert("Failed to load invoice PDF for printing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline-primary" size="sm" onClick={handlePrint} disabled={loading}>
      {loading ? "…" : "Invoice PDF"}
    </Button>
  );
};

export const tableColumns = [
  {
    accessorKey: "DocNum",
    header: "INV#",
    cell: ({ getValue, row }) =>
      row.original.Type === "CN" ? (
        <span>{getValue() || "N/A"}</span>
      ) : (
        <Link href={`/invoicedetails?d=${getValue()}&e=${row.original.DocEntry}`} className="text-blue-600 hover:text-blue-800">
          {getValue() || "N/A"}
        </Link>
      ),
  },
  {
    id: "Type",
    header: "Type",
    cell: ({ row }) => <Badge bg={row.original.Type === "CN" ? "danger" : "primary"}>{row.original.Type || "IN"}</Badge>,
  },
  {
    id: "Credit Note No",
    header: "Credit note",
    cell: ({ row }) => (row.original.Type === "CN" ? <span>{row.original["Credit Note No"] || "N/A"}</span> : ""),
  },
  {
    id: "Invoice Posting Dt.",
    header: "Invoice Posting Dt.",
    accessorFn: (row) => row["Invoice Posting Dt."],
    cell: ({ getValue }) => formatDate(getValue()),
  },
  {
    accessorKey: "SO No",
    header: "SO No",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "SO Date",
    header: "SO Date",
    cell: ({ getValue }) => formatDate(getValue()),
  },
  {
    accessorKey: "Customer ref no",
    header: "SO Customer Ref. No",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "ContactPerson",
    header: "Contact Person",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    id: "Item No.",
    header: "Item No.",
    accessorFn: (row) => row["Item No."],
    cell: ({ getValue }) => getValue() ?? "N/A",
  },
  {
    accessorKey: "Item/Service Description",
    header: "Item/Service Description",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "Cas No",
    header: "Cas No",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "Category",
    header: "Category",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    id: "Vendor Catalog No.",
    header: "Vendor Catalog No.",
    accessorFn: (row) => row["Vendor Catalog No."],
    cell: ({ getValue }) => getValue() ?? "N/A",
  },
  {
    accessorKey: "Packsize",
    header: "PKZ",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    id: "Qty.",
    header: "Qty",
    accessorFn: (row) => row["Qty."],
    cell: ({ getValue }) => (getValue() != null ? getValue() : "N/A"),
  },
  {
    accessorKey: "Document Status",
    header: "STATUS",
    cell: ({ getValue }) => {
      const value = getValue();
      const bg = value === "Closed" ? "success" : value === "Canceled" ? "secondary" : value === "Partially Open" ? "warning" : "danger";
      return <Badge bg={bg}>{value || "N/A"}</Badge>;
    },
  },
  {
    accessorKey: "Tracking Number",
    header: "Tracking Number",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "Courier Service",
    header: "Courier Service",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "Dispatch Date",
    header: "Dispatch Date",
    cell: ({ getValue }) => formatDate(getValue()),
  },
  {
    accessorKey: "Unit Sales Price",
    header: "Unit Sales Price",
    cell: ({ getValue }) => formatCurrency(getValue()),
  },
  {
    accessorKey: "Total Sales Price",
    header: "Total Sales Price/Open Value",
    cell: ({ getValue }) => formatCurrency(getValue()),
  },
  {
    accessorKey: "BatchNum",
    header: "BatchNum",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "Mkt_Feedback",
    header: "Mkt_Feedback",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    id: "Invoice PDF",
    header: "Invoice PDF",
    cell: ({ row }) => (row.original.Type === "CN" ? <span className="text-muted">—</span> : <InvoicePdfButton docNum={row.original.DocNum} />),
  },
];
