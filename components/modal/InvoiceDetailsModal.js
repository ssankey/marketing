 
// components/modal/InvoiceDetailsModal.js
import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import Alert from "react-bootstrap/Alert";

import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

const InvoiceDetailsModal = ({ invoiceData, onClose, title }) => {
  const columns = useMemo(
    () => [
      {
        accessorFn: row => row["SO No"],
        header: "SO No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["SO Date"],
        header: "SO Date",
        cell: ({ getValue }) => formatDate(getValue()) || "-",
      },
      {
        accessorFn: row => row["SO Customer Ref. No"],
        header: "Customer Ref. No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Contact Person"],
        header: "Contact Person",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Item No."],
        header: "Item No.",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Item/Service Description"],
        header: "Description",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Cas No"],
        header: "Cas No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Vendor Catalog No."],
        header: "Vendor Cat. No.",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["PKZ"],
        header: "PKZ",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Qty"],
        header: "Qty",
        cell: ({ getValue }) => getValue() !== null ? getValue() : "-",
      },
      {
        accessorFn: row => row["STATU"],
        header: "Status",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Inv#"],
        header: "Invoice No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Invoice Posting Dt."],
        header: "Invoice Date",
        cell: ({ getValue }) => formatDate(getValue()) || "N/A",
      },
      {
        accessorFn: row => row["Tracking Number"],
        header: "Tracking No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Dispatch Date"],
        header: "Dispatch Date",
        cell: ({ getValue }) => formatDate(getValue()) || "N/A",
      },
      {
        accessorFn: row => row["DELIVER DATE"],
        header: "Delivery Date",
        cell: ({ getValue }) => formatDate(getValue()) || "N/A",
      },
      {
        accessorFn: row => row["Unit Sales Price"],
        header: "Unit Price",
        cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
      },
      {
        accessorFn: row => row["Total Sales Price/Open Value"],
        header: "Total Value",
        cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
      },
      {
        accessorFn: row => row["BatchNum"],
        header: "Batch No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Mkt_Feedback"],
        header: "Mkt Feedback",
        cell: ({ getValue }) => getValue() || "-",
      },
    ],
    []
  );

  const table = useReactTable({
    data: invoiceData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleExportExcel = () => {
    const exportData = invoiceData.map((row) => {
      const formattedRow = {};
      columns.forEach((column) => {
        const header = column.header;
        const value = column.accessorFn(row);

        if (header.includes("Date")) {
          formattedRow[header] = value ? formatDate(value) : "N/A";
        } else if (header === "Unit Price" || header === "Total Value") {
          formattedRow[header] = value !== null ? formatCurrency(value).slice(1) : "-";
        } else {
          formattedRow[header] = value || "-";
        }
      });
      return formattedRow;
    });

    downloadExcel(exportData, "Invoice_Details");
  };

  return (
    <Modal show={true} onHide={onClose} size="xl" centered dialogClassName="modal-95w">
      <Modal.Header className="py-2 px-3 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center justify-content-between w-100">
          {/* <Modal.Title className="fs-5 m-0">{title}</Modal.Title> */}
          <Modal.Title className="fs-5 m-0">
            Invoice #{invoiceData?.[0]?.["Inv#"] || invoiceData?.[0]?.["Invoice No"] || "N/A"} Details
        </Modal.Title>

          <div className="d-flex align-items-center gap-2">
            <Button variant="success" size="sm" onClick={handleExportExcel}>
              Export to Excel
            </Button>
            <Button variant="light" size="sm" onClick={onClose} className="ms-2">
              ✕
            </Button>
          </div>
        </div>
      </Modal.Header>
      <Modal.Body style={{ margin: "0 0" }}>
        <div className="border rounded overflow-auto" style={{ height: "75vh" }}>
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 sticky top-0">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="border px-3 py-2 text-left font-medium text-sm"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="border px-3 py-2 truncate text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="p-4 text-center">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default InvoiceDetailsModal;
 