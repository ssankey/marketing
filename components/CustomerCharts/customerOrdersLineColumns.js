// components/CustomerCharts/customerOrdersLineColumns.js
// Same order-line columns as components/ordersLine/ordersLineColumns.js,
// same order, minus columns that are internal-only or redundant once
// already scoped to this one customer's own page: CustomerVendorName
// (redundant), SalesEmployee (internal), MktFeedback (internal note),
// StockStatus (internal warehouse status).

import Link from "next/link";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import { truncateText } from "utils/truncateText";
import { Badge } from "react-bootstrap";

export const tableColumns = () => [
  {
    accessorKey: "LineStatus",
    header: "Line Status",
    cell: ({ getValue }) => {
      const value = getValue();
      return <Badge bg={value === "Closed" ? "success" : "danger"}>{value || "N/A"}</Badge>;
    },
  },
  {
    accessorKey: "DocumentNumber",
    header: "SO Number",
    cell: ({ getValue, row }) => (
      <Link href={`/orderdetails?d=${getValue()}&e=${row.original.DocEntry}`} className="text-blue-600 hover:text-blue-800">
        {getValue() || "N/A"}
      </Link>
    ),
  },
  {
    accessorKey: "PostingDate",
    header: "Posting Date",
    cell: ({ getValue }) => formatDate(getValue()),
  },
  {
    accessorKey: "CustomerPONo",
    header: "Customer PO No",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "PODate",
    header: "PO Date",
    cell: ({ getValue }) => formatDate(getValue()),
  },
  {
    accessorKey: "ContactPerson",
    header: "Contact Person",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "ItemNo",
    header: "Item No.",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "MfrCatalogNo",
    header: "Mfr Catalog No.",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "UOMName",
    header: "PKZ",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "ItemName",
    header: "Item Name",
    cell: ({ getValue }) => truncateText(getValue(), 25),
  },
  {
    accessorKey: "CasNo",
    header: "Cas No",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "ItemGroup",
    header: "Category",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "DeliveryDate",
    header: "Delivery Date",
    cell: ({ getValue }) => formatDate(getValue()),
  },
  {
    accessorKey: "Timeline",
    header: "Timeline",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "PriceCurrency",
    header: "Currency",
    cell: ({ getValue }) => getValue() || "INR",
  },
  {
    accessorKey: "UnitPriceOrig",
    header: "Unit Price",
    cell: ({ getValue }) => getValue() || "0",
  },
  {
    accessorKey: "ExchangeRate",
    header: "Conversion Rate",
    cell: ({ getValue }) => getValue() || 1,
  },
  {
    accessorKey: "Price",
    header: "Unit Price INR",
    cell: ({ getValue }) => formatCurrency(getValue() || 0),
  },
  {
    accessorKey: "OpenQty",
    header: "Open Qty",
    cell: ({ getValue }) => getValue() || "0",
  },
  {
    accessorKey: "OpenAmount",
    header: "Open Amount INR",
    cell: ({ getValue }) => formatCurrency(getValue() || 0),
  },
  {
    accessorKey: "DeliveredQuantity",
    header: "Delivered Qty",
    cell: ({ getValue }) => getValue() || "0",
  },
  {
    accessorKey: "Quantity",
    header: "Order Qty",
    cell: ({ getValue }) => getValue() || "0",
  },
  {
    accessorKey: "LineTotalCurrency",
    header: "Line Total (Currency)",
    cell: ({ getValue }) => getValue() || "0",
  },
  {
    accessorKey: "LineTotalINR",
    header: "Line Total INR",
    cell: ({ getValue }) => formatCurrency(getValue() || 0),
  },
];
