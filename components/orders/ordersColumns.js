
// components/orders/ordersColumns.js
import Link from "next/link";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import { formatTime  } from "../../utils/formatTime";
import { truncateText } from "utils/truncateText";
import { Badge } from "react-bootstrap";

export const tableColumns = (handlers) => [
  {
    accessorKey: "DocNum",
    header: "Order#",
    cell: ({ getValue, row }) => (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          handlers.handleOrderNoClick(getValue(), e);
        }}
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
      if (value === "Open") cls = "bg-danger";
      if (value === "Partial") cls = "bg-warning";
      if (value === "Closed") cls = "bg-success";
      if (value === "Cancelled") cls = "bg-secondary";
      return <Badge className={cls}>{value || 'N/A'}</Badge>;
    },
  },
  {
    accessorKey: "CustomerPONo",
    header: "Customer PO No",
    cell: ({ getValue, row }) => (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          handlers.handleCustomerPONoClick(getValue(), e);
        }}
        className="text-primary fw-semibold"
        style={{ userSelect: "text", textDecoration: "none", cursor: "pointer" }}
      >
        {getValue() || 'N/A'}
      </a>
    ),
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
      const amt = row.original.DocCur === "INR" ? getValue() : getValue() * (row.original.ExchangeRate || 1);
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
      if (getValue()) {
        const dt = new Date(getValue());
        const hasTime = row.original.EmailSentTM !== null && row.original.EmailSentTM !== undefined;
        const h = hasTime ? Math.floor(row.original.EmailSentTM / 60) : dt.getHours();
        const m = hasTime ? row.original.EmailSentTM % 60 : dt.getMinutes();
        const day = String(dt.getDate()).padStart(2, "0");
        const month = String(dt.getMonth() + 1).padStart(2, "0");
        const year = dt.getFullYear();

        return `${day}/${month}/${year} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      }
      return (
        <button
          className="btn btn-sm btn-primary"
          onClick={() => handlers.sendMail(row.original)}
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
      <Link 
        href={`/orderdetails?d=${getValue()}&e=${row.original.DocEntry}`}
        className="text-blue-600 hover:text-blue-800"
      >
        View Details
      </Link>
    )
  }
];