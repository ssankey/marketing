// components/openOrders/openOrdersColumns.js
import Link from "next/link";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import { truncateText } from "utils/truncateText";
import { Badge } from "react-bootstrap";

export const tableColumns = (handlers) => [
  {
    accessorKey: "LineStatus",
    header: "Document Status",
    cell: ({ getValue }) => {
      const value = getValue();
      let cls = "bg-danger";
      if (value === "Closed") cls = "bg-secondary";
      return <Badge className={cls}>{value || 'N/A'}</Badge>;
    },
  },
  {
    accessorKey: "DocumentNumber",
    header: "SO Number",
    cell: ({ getValue, row }) => (
      <Link
        href={`/orderdetails?d=${getValue()}&e=${row.original.DocEntry}`}
        className="text-blue-600 hover:text-blue-800"
      >
        {getValue() || 'N/A'}
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
    accessorKey: "CustomerVendorName",
    header: "Customer/Vendor Name",
    cell: ({ getValue }) => truncateText(getValue(), 20),
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
    accessorKey: "Quantity",
    header: "Quantity Order",
    cell: ({ getValue }) => getValue() || "0",
  },
  
  {
    accessorKey: "OpenQty",
    header: "Open Qty",
    cell: ({ getValue }) => getValue() || "0",
  },
  {
    accessorKey: "DeliveredQuantity",
    header: "Delivered Quantity",
    cell: ({ getValue }) => getValue() || "0",
  },
  {
    accessorKey: "StockStatus",
    header: "Stock Status-In hyd",
    cell: ({ getValue }) => {
      const value = getValue();
      return <Badge className={value === "In Stock" ? "bg-success" : "bg-danger"}>{value}</Badge>;
    },
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
    accessorKey: "MktFeedback",
    header: "Mkt_Feedback",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "Price",
    header: "Price",
    cell: ({ getValue, row }) => formatCurrency(getValue(), row.original.PriceCurrency),
  },
  {
    accessorKey: "OpenAmount",
    header: "OPEN AMOUNT",
    cell: ({ getValue, row }) => formatCurrency(getValue(), row.original.PriceCurrency),
  },
  {
    accessorKey: "SalesEmployee",
    header: "Sales Employee",
    cell: ({ getValue }) => getValue() || "N/A",
  },
];