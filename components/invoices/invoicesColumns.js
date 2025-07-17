// components/invoices/invoicesColumns.js
import Link from "next/link";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import { Badge } from "react-bootstrap";

export const tableColumns = [
  {
    accessorKey: "DocNum",
    header: "Inv#",
    cell: ({ getValue, row }) => (
      <Link
        href={`/invoicedetails?d=${getValue()}&e=${row.original.DocEntry}`}
        className="text-blue-600 hover:text-blue-800"
      >
        {getValue() || 'N/A'}
      </Link>
    ),
  },
 {
    id: "Invoice Posting Dt.",
    header: "Invoice Posting Dt.",
    accessorFn: row => row["Invoice Posting Dt."],
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
    accessorKey: "Customer/Vendor Name",
    header: "Customer",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "ContactPerson",
    header: "Contact Person",
    cell: ({ getValue }) => getValue() || "N/A",
  },
//   {
//     accessorKey: "Item No.",
//     header: "Item No.",
//     cell: ({ getValue }) => getValue() || "N/A",
//   },
 {
    id: "Item No.",
    header: "Item No.",
    accessorFn: row => row["Item No."],
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
//   {
//     accessorKey: "Vendor Catalog No.",
//     header: "Vendor Catalog No.",
//     cell: ({ getValue }) => getValue() || "N/A",
//   },
{
    id: "Vendor Catalog No.",
    header: "Vendor Catalog No.",
    accessorFn: row => row["Vendor Catalog No."],
    cell: ({ getValue }) => getValue() ?? "N/A",
  },
  {
    accessorKey: "Packsize",
    header: "PKZ",
    cell: ({ getValue }) => getValue() || "N/A",
  },
//   {
//     accessorKey: "Qty.",
//     header: "Qty",
//     cell: ({ getValue }) => (getValue() != null ? getValue() : "N/A"),
//   },
{
    id: "Qty.",
    header: "Qty",
    accessorFn: row => row["Qty."],
    cell: ({ getValue }) => getValue() != null ? getValue() : "N/A",
  },
 {
  accessorKey: "Document Status",
  header: "STATUS",
  cell: ({ getValue }) => (
    <Badge bg={getValue() === 'Closed' ? 'success' : 'danger'}>
      {getValue() || 'N/A'}
    </Badge>
  ),
},
  {
    accessorKey: "Tracking Number",
    header: "Tracking Number",
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
];