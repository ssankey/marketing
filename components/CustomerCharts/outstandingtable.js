

// components/CustomerCharts/outstandingtable.js
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Spinner, Dropdown } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import TablePagination from "components/TablePagination";
import TableFilters from "components/TableFilters";

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
    field: "Contact Person",
    label: "Contact Person",
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
    className: (value) => (value > 0 ? "text-danger fw-bold" : "text-success"),
  },
  {
    field: "Country",
    label: "Country",
  },
  {
    field: "State",
    label: "State",
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

const CustomerOutstandingTable = ({
  customerOutstandings,
  totalItems,
  isLoading,
  customerCode,
  onFilterChange,
  onExcelDownload,
  currentPage,
  onPageChange,
  itemsPerPage = 5,
  filterType, // Add filter type prop
  onFilterTypeChange, // Add filter type change handler
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Apply filter based on current filter type
  const filteredData = customerOutstandings?.filter((item) => {
    if (filterType === "Payment Pending") return item["Balance Due"] > 0;
    if (filterType === "Payment Done") return item["Balance Due"] <= 0;
    return true;
  });

  return (
    <Container fluid id="customer-outstanding-filters">
      <TableFilters
        // onFilterChange={onFilterChange}
        onExcelDownload={onExcelDownload}
        totalItems={totalItems}
        totalItemsLabel="Total Outstanding"
        dateFilter={{ enabled: false }}
        searchConfig={{ enabled: false }} // Disable search
        // Removed date filter by not passing dateConfig prop
        onReset={undefined}
      />
      <style jsx global>{`
        #customer-outstanding-filters .btn-outline-secondary {
          display: none !important; /* hides the Reset button */
        }
      `}</style>

      {isLoading ? (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-bordered">
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
                    {columns.map((col) => {
                      const cellValue = col.render
                        ? col.render(item[col.field])
                        : item[col.field];
                      const cellClass = col.className
                        ? col.className(item[col.field])
                        : "";
                      return (
                        <td key={col.field} className={cellClass}>
                          {cellValue || ""}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="text-center">
                    No{" "}
                    {filterType === "Payment Pending"
                      ? "pending payments"
                      : "completed payments"}{" "}
                    found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </Container>
  );
};

export default CustomerOutstandingTable;