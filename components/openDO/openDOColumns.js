// components/openDO/openDOColumns.js
// Columns for the "Open DO" (Delivery Order) line-level table, on its own
// page (pages/open-do/index.js). Order: SO No, SO Date, then the delivery
// cluster (Delivery Status, Delivery Number, Delivery Date, Pick Slip),
// then the remaining reference/line columns.
//
// The Pick Slip column adds a bulk-select/print checkbox next to the
// existing per-row download button, but only in the "Open" status tab
// (Closed/Canceled just show the plain download button, no checkbox) —
// selection is keyed by DeliveryNo, not row id, since one delivery can span
// several line-item rows and they all need to move together: checking/
// unchecking one row's box checks/unchecks every row that shares its
// DeliveryNo. OpenDOTable.js owns the actual selection state and passes it
// in here as `handlers`.

import { useRef, useEffect } from "react";
import { formatDate } from "utils/formatDate";
import { Badge } from "react-bootstrap";
import PickSlipButton from "components/shared/PickSlipButton";

const CHECKBOX_STYLE = { width: 18, height: 18, cursor: "pointer" };

const SelectAllCheckbox = ({ checked, indeterminate, onChange, title }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} title={title} style={CHECKBOX_STYLE} />;
};

export const tableColumns = (handlers = {}) => {
  const {
    statusFilter,
    selectedDeliveryNos = new Set(),
    allPageSelected = false,
    somePageSelected = false,
    selectedCount = 0,
    printing = false,
    onToggleSelectAllPage,
    onToggleDelivery,
    onPrintSelected,
  } = handlers;

  const selectionMode = statusFilter === "open";

  return [
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
      header: () => {
        if (!selectionMode) return "Pick Slip";
        return (
          <div className="d-flex align-items-center gap-2" style={{ textTransform: "none" }} onClick={(e) => e.stopPropagation()}>
            <SelectAllCheckbox
              checked={allPageSelected}
              indeterminate={!allPageSelected && somePageSelected}
              onChange={onToggleSelectAllPage}
              title="Select all pick slips on this page"
            />
            <span>Pick Slip</span>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={onPrintSelected}
              disabled={printing || selectedCount === 0}
            >
              {printing ? "…" : `Print${selectedCount ? ` (${selectedCount})` : ""}`}
            </button>
          </div>
        );
      },
      cell: ({ row }) => {
        if (!selectionMode) {
          return <PickSlipButton deliveryNo={row.original.DeliveryNo} />;
        }
        return (
          <div className="d-flex align-items-center gap-2">
            <input
              type="checkbox"
              checked={selectedDeliveryNos.has(row.original.DeliveryNo)}
              onChange={() => onToggleDelivery(row.original.DeliveryNo)}
              style={CHECKBOX_STYLE}
            />
            <PickSlipButton deliveryNo={row.original.DeliveryNo} />
          </div>
        );
      },
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
};
