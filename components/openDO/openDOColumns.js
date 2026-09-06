// components/openDO/openDOColumns.js
// Columns for the "Open DO" (Delivery Order) line-level table, on its own
// page (pages/open-do/index.js). Order: SO No, SO Date, then the delivery
// cluster (Delivery Status, Delivery Number, Delivery Date, Pick Slip),
// then the remaining reference/line columns.

import { formatDate } from "utils/formatDate";
import { Badge } from "react-bootstrap";
import PickSlipButton from "components/shared/PickSlipButton";

export const tableColumns = () => [
  {
    accessorKey: "SONo",
    header: "SO No",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "SODate",
    header: "SO Date",
    cell: ({ getValue }) => formatDate(getValue()),
  },
  {
    accessorKey: "LineStatus",
    header: "Delivery Status",
    cell: ({ getValue }) => {
      const value = getValue();
      const cls = value === "Closed" ? "bg-secondary" : value === "Open" ? "bg-success" : "bg-danger";
      return <Badge className={cls}>{value || "N/A"}</Badge>;
    },
  },
  {
    accessorKey: "DeliveryNo",
    header: "Delivery Number",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "DeliveryDate",
    header: "Delivery Date",
    cell: ({ getValue }) => formatDate(getValue()),
  },
  {
    id: "PickSlip",
    header: "Pick Slip",
    cell: ({ row }) => <PickSlipButton deliveryNo={row.original.DeliveryNo} />,
  },
  {
    accessorKey: "CustomerRefNo",
    header: "Customer Ref No",
    cell: ({ getValue }) => getValue() || "N/A",
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
  },
  {
    accessorKey: "LineNum",
    header: "Line No",
    cell: ({ getValue }) => getValue() ?? "N/A",
  },
  {
    accessorKey: "ItemCode",
    header: "Item Code",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "ItemName",
    header: "Item Name",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "Quantity",
    header: "DO Quantity",
    cell: ({ getValue }) => getValue() ?? "0",
  },
  {
    accessorKey: "UOM",
    header: "UOM",
    cell: ({ getValue }) => getValue() || "N/A",
  },
];
