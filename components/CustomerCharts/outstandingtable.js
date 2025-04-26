// components/CustomerCharts/outstandingtable.js

import React from "react";
import { Table } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";

const columns = [
  {
    field: "SO#",
    label: "SO#",
  },
  {
    field: "Customer Code",
    label: "Customer Code",
  },
  {
    field: "Customer Name",
    label: "Customer Name",
  },
  {
    field: "SO Date",
    label: "SO Date",
    render: (value) => formatDate(value),
  },
  {
    field: "Delivery#",
    label: "Delivery#",
  },
  {
    field: "Delivery Date",
    label: "Delivery Date",
    render: (value) => formatDate(value),
  },
  {
    field: "Invoice No.",
    label: "Invoice No.",
  },
  {
    field: "AR Invoice Date",
    label: "Invoice Date",
    render: (value) => formatDate(value),
  },
  {
    field: "Invoice Total",
    label: "Invoice Total",
    render: (value) => formatCurrency(value),
  },
  {
    field: "Balance Due",
    label: "Balance Due",
    render: (value) => formatCurrency(value),
  },
  {
    field: "BP Reference No.",
    label: "BP Reference",
  },
  {
    field: "Overdue Days",
    label: "Overdue Days",
  },
  {
    field: "Payment Terms",
    label: "Payment Terms",
  },
];

const CustomerOrdersTable = ({ customerOutstandings, filter, onExcelDownload }) => {
  const handleDownload = () => {
    const filtered = customerOutstandings?.filter((item) => {
      if (filter === "Payment Pending") return item["Balance Due"] > 0;
      if (filter === "Payment Done") return item["Balance Due"] === 0;
      return true;
    });

    const excelData = filtered.map((item) => {
      const row = {};
      columns.forEach((col) => {
        const value = item[col.field];
        row[col.label] = col.render ? col.render(value) : value;
      });
      return row;
    });

    downloadExcel(excelData, `Customer_Outstanding_${filter}`);
  };

  const filteredData = customerOutstandings?.filter((item) => {
    if (filter === "Payment Pending") {
      return item["Balance Due"] > 0;
    } else if (filter === "Payment Done") {
      return item["Balance Due"] === 0;
    }
    return true;
  });

  return (
    <>
      <Table
        striped
        bordered
        hover
        responsive
        style={{ width: "100%", whiteSpace: "nowrap" }}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.field}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData?.length > 0 ? (
            filteredData.map((item, index) => (
              <tr key={index}>
                {columns.map((col) => (
                  <td
                    key={col.field}
                    className={
                      col.field === "Balance Due" && item["Balance Due"] > 0
                        ? "text-danger fw-bold"
                        : col.field === "Balance Due" && item["Balance Due"] === 0
                        ? "text-success"
                        : ""
                    }
                  >
                    {col.render
                      ? col.render(item[col.field])
                      : item[col.field] || ""}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center">
                No{" "}
                {filter === "Payment Pending"
                  ? "pending payments"
                  : "completed payments"}{" "}
                found
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </>
  );
};

export default CustomerOrdersTable;