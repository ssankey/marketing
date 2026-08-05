// components/pendingDispatch/pendingDispatchColumns.js
import Link from "next/link";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";

export const tableColumns = [
  {
    accessorKey: "DocNum",
    header: "Invoice#",
    cell: ({ getValue, row }) => (
      <Link
        href={`/invoicedetails?d=${getValue()}&e=${row.original.DocEntry}`}
        className="text-blue-600 hover:text-blue-800"
      >
        {getValue()}
      </Link>
    ),
    sortable: true,
  },
  {
    accessorKey: "DocStatusDisplay",
    header: "Status",
    cell: ({ getValue }) => (
      <span
        className={`badge ${
          getValue() === "Closed"
            ? "bg-success"
            : getValue() === "Cancelled"
            ? "bg-warning"
            : "bg-danger"
        }`}
      >
        {getValue()}
      </span>
    ),
  },
  {
    accessorKey: "LineItemCount",
    header: "Items",
    cell: ({ getValue }) => getValue() ?? 0,
  },
  {
    accessorKey: "DocDate",
    header: "Invoice Date",
    cell: ({ getValue }) => formatDate(getValue()),
    sortable: true,
  },
  {
    accessorKey: "DocDueDate",
    header: "Due Date",
    cell: ({ getValue }) => formatDate(getValue()),
    sortable: true,
  },
  {
    accessorKey: "U_DispatchDate",
    header: "Dispatch Date",
    cell: ({ getValue }) => (getValue() ? formatDate(getValue()) : "Pending"),
  },
  {
    accessorKey: "CardCode",
    header: "Customer Code",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "CardName",
    header: "Customer Name",
    cell: ({ getValue }) => getValue() || "N/A",
    sortable: true,
  },
  {
    accessorKey: "DocTotal",
    header: "Total Amount",
    cell: ({ getValue }) => formatCurrency(getValue()),
    sortable: true,
  },
  {
    accessorKey: "DocCur",
    header: "Currency",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "VatSum",
    header: "Tax Amount",
    cell: ({ getValue }) => formatCurrency(getValue()),
  },
  {
    accessorKey: "TaxDate",
    header: "Tax Date",
    cell: ({ getValue }) => formatDate(getValue()),
  },
  {
    accessorKey: "TrackNo",
    header: "Tracking #",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "TransportName",
    header: "Transport",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "PaymentGroup",
    header: "Payment Terms",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "Country",
    header: "Country",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "SalesEmployee",
    header: "Sales Person",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "ContactPerson",
    header: "Contact Person",
    cell: ({ getValue }) => getValue() || "N/A",
  },
];