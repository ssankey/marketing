// components/GenericTable.js

import React from "react";
import SortableTableHeader from "./SortableTableHeader";
import { Table, Button } from "react-bootstrap";
// Removed icon as per your previous request to use text
// import { FaFileExcel } from "react-icons/fa"; // Excel icon from react-icons

const GenericTable = ({
  columns,
  data,
  onSort,
  sortField,
  sortDirection,
  onExcelDownload,
}) => (
  <div style={{ width: "100%" }}>
    {/* Header Section with Export Button */}
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: "10px",
      }}
    >
      <Button
        variant="success"
        size="sm"
        onClick={onExcelDownload}
        style={{
          padding: "6px 12px",
          fontSize: "14px",
          borderRadius: "4px",
          border: "none",
          backgroundColor: "#28a745",
          boxShadow: "none",
          display: "flex",
          alignItems: "center",
          gap: "5px", // Space between icon and text if you include it
        }}
        aria-label="Export table data to Excel"
      >
        {/* If you decide to include the Excel icon, uncomment the next line */}
        {/* <FaFileExcel size={16} color="white" /> */}
        Export Excel
      </Button>
    </div>

    {/* Scrollable Table Container */}
    <div style={{ overflowX: "auto" }}>
      <Table striped hover responsive className="text-nowrap">
        <thead>
          <tr>
            {columns.map((col) => (
              <SortableTableHeader
                key={col.field}
                label={col.label}
                field={col.field}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={onSort}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              {columns.map((col) => (
                <td key={col.field}>
                  {col.render ? col.render(row[col.field], row) : row[col.field]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  </div>
);

export default GenericTable;
