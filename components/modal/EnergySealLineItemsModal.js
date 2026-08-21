// components/modal/EnergySealLineItemsModal.js
import React, { useEffect, useMemo, useState } from "react";
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
import downloadExcel from "utils/exporttoexcel";

const BLUE = "#2a78d6";
const BLUE_SOFT = "#eaf2fc";
const BLUE_BORDER = "#cde2fb";
const INK = "#1e293b";
const PAGE_SIZE = 20;

const EnergySealLineItemsModal = ({ show, onClose, month, groupBy, field, fieldLabel }) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZE });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!show || !field) return;
    let cancelled = false;

    const fetchLineItems = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/products/energy-seal-line-items?month=${month}&groupBy=${groupBy}&field=${encodeURIComponent(field)}`
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load line items");
        if (!cancelled) setRows(json.data || []);
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchLineItems();
    return () => {
      cancelled = true;
    };
  }, [show, month, groupBy, field]);

  useEffect(() => {
    setGlobalFilter("");
    setPagination({ pageIndex: 0, pageSize: PAGE_SIZE });
  }, [show, field]);

  const columns = useMemo(
    () => [
      { accessorKey: "invoiceNo", header: "Invoice No" },
      { accessorKey: "itemCode", header: "Item Code" },
      { accessorKey: "itemName", header: "Item Name" },
      { accessorKey: "cas", header: "CAS" },
      {
        accessorKey: "unitPrice",
        header: "Unit Price",
        cell: ({ getValue }) => formatCurrency(getValue()),
      },
      { accessorKey: "qty", header: "Qty" },
      {
        accessorKey: "totalPrice",
        header: "Total Price",
        cell: ({ getValue }) => formatCurrency(getValue()),
      },
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { globalFilter, pagination },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase();
      return Object.values(row.original).some((value) =>
        String(value).toLowerCase().includes(searchValue)
      );
    },
  });

  const handleExportExcel = () => {
    const exportData = rows.map((r) => ({
      "Invoice No": r.invoiceNo,
      "Item Code": r.itemCode,
      "Item Name": r.itemName,
      CAS: r.cas,
      "Unit Price": r.unitPrice,
      Qty: r.qty,
      "Total Price": r.totalPrice,
    }));
    downloadExcel(exportData, `Energy_Seal_Line_Items_${field}_${month}`, {
      "Unit Price": { type: "currency" },
      "Total Price": { type: "currency" },
    });
  };

  return (
    <Modal show={show} onHide={onClose} size="xl" centered backdrop="static" style={{ maxWidth: "95vw", margin: "auto" }}>
      <Modal.Header
        closeButton
        style={{ background: BLUE_SOFT, color: INK, borderBottom: `2px solid ${BLUE_BORDER}` }}
      >
        <Modal.Title style={{ fontWeight: 700, fontSize: "1.25rem", color: BLUE }}>
          Energy Seal Line Items — {fieldLabel}: {field}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: "75vh", overflowY: "auto", padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
          <Form.Control
            type="text"
            placeholder="Search items..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            style={{ width: "300px", border: `2px solid ${BLUE_BORDER}` }}
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <Button
              onClick={handleExportExcel}
              disabled={rows.length === 0}
              style={{ fontWeight: 600, padding: "0.5rem 1.5rem", backgroundColor: BLUE, borderColor: BLUE }}
            >
              📥 Export to Excel
            </Button>
            <Button variant="outline-secondary" onClick={onClose} style={{ fontWeight: 600, padding: "0.5rem 1.5rem" }}>
              ✕ Close
            </Button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: BLUE }}>Loading…</div>
        ) : error ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#dc2626" }}>{error}</div>
        ) : (
          <>
            <div style={{ overflowX: "auto", border: `1px solid ${BLUE_BORDER}`, borderRadius: "8px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead style={{ backgroundColor: BLUE_SOFT, position: "sticky", top: 0, zIndex: 10 }}>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: 700,
                            color: BLUE,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            borderBottom: `2px solid ${BLUE_BORDER}`,
                          }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{ asc: " ▲", desc: " ▼" }[header.column.getIsSorted()] || ""}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} style={{ backgroundColor: row.index % 2 === 0 ? "white" : "#f8fafc" }}>
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} style={{ padding: "12px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap", color: INK }}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontStyle: "italic" }}>
                        No line items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ fontSize: "0.875rem", color: "#64748b" }}>
                Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} items
              </div>

              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <Button variant="outline-primary" size="sm" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                  ≪
                </Button>
                <Button variant="outline-primary" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                  Previous
                </Button>
                <span style={{ padding: "0 1rem", fontSize: "0.875rem" }}>
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
                </span>
                <Button variant="outline-primary" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                  Next
                </Button>
                <Button variant="outline-primary" size="sm" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                  ≫
                </Button>
              </div>

              <div style={{ fontSize: "0.875rem", color: "#64748b" }}>{PAGE_SIZE} items per page</div>
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default EnergySealLineItemsModal;
