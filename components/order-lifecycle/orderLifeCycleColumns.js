

// components/order-lifecycle/orderLifecycleColumns.js

import { formatDate } from "utils/formatDate";

export const tableColumns = () => [
  {
    accessorKey: "CustomerRefNo",
    header: "Reference No",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "Item_No",
    header: "Item Code",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "PO_Date",
    header: "PO Date",
    cell: ({ getValue }) => formatDate(getValue()),
  },
  {
    accessorKey: "PO_to_GRN_Days",
    header: "PO to GRN (Days)",
    cell: ({ getValue }) =>
      getValue() !== null && getValue() !== undefined ? getValue() : "-",
  },
  {
    accessorKey: "GRN_Date",
    header: "GRN Date",
    cell: ({ getValue }) => formatDate(getValue()),
  },
  {
    accessorKey: "GRN_to_Invoice_Days",
    header: "GRN to Invoice (Days)",
    cell: ({ getValue }) =>
      getValue() !== null && getValue() !== undefined ? getValue() : "-",
  },
  {
    accessorKey: "Invoice_Date",
    header: "Invoice Date",
    cell: ({ getValue }) => formatDate(getValue()),
  },
  {
    accessorKey: "Invoice_to_Dispatch_Days",
    header: "Invoice to Dispatch (Days)",
    cell: ({ getValue }) =>
      getValue() !== null && getValue() !== undefined ? getValue() : "-",
  },
  {
    accessorKey: "Dispatch_Date",
    header: "Dispatch Date",
    cell: ({ getValue }) => formatDate(getValue()),
  },

  // ✅ New columns after Dispatch Date
  {
    accessorKey: "PO_No",
    header: "PO No",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "Sales_Person",
    header: "Sales Person",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "Customer",
    header: "Customer Name",
    cell: ({ getValue }) => getValue() || "N/A",
  },
];
