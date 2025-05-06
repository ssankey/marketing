

// components/CustomerCharts/outstandingtable.js
import React from "react";
import { Container, Spinner } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import TablePagination from "components/TablePagination";
import TableFilters from "components/TableFilters";

const columns = [
  { field: "Invoice No.", label: "Invoice No." },
  {
    field: "AR Invoice Date",
    label: "Invoice Date",
    render: (value) => formatDate(value),
  },
  { field: "SO#", label: "SO#" },
  { field: "SO Date", label: "SO Date", render: (value) => formatDate(value) },
  // { field: "Customer Code", label: "Customer Code" },
  { field: "Customer Name", label: "Customer Name" },
  { field: "Contact Person", label: "Contact Person" },
  { field: "SO Customer Ref. No", label: "SO Customer Ref. No" },
  // { field: "SO Date", label: "SO Date", render: (value) => formatDate(value) },
  // { field: "Delivery#", label: "Delivery#" },
  // {
  //   field: "Delivery Date",
  //   label: "Delivery Date",
  //   render: (value) => formatDate(value),
  // },
  // { field: "Invoice No.", label: "Invoice No." },
  // { field: "AR Invoice Date", label: "Invoice Date", render: (value) => formatDate(value) },
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
  { field: "Country", label: "Country" },
  { field: "State", label: "State" },
  // { field: "BP Reference No.", label: "BP Reference" },
  { field: "Overdue Days", label: "Overdue Days" },
  { field: "Payment Terms", label: "Payment Terms" },
  { field: "Tracking no", label: "Tracking no" },
  // {
  //   field: "Delivery Date",
  //   label: "Delivery Date",
  //   render: (value) => formatDate(value),
  // },
  {
    field: "Dispatch Date",
    label: "Dispatch Date",
    render: (value) => formatDate(value),
  },

  { field: "SalesEmployee", label: "Sales Person" },
];

const CustomerOutstandingTable = ({
  customerOutstandings = [],
  totalItems = 0,
  isLoading = false,
  customerCode,
  onFilterChange,
  onExcelDownload,
  currentPage,
  onPageChange,
  itemsPerPage = 5,
  filterType,
  onFilterTypeChange,
  selectedRows = [],
  setSelectedRows,
  isAllSelected,
  onSelectAll,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // const filteredData = customerOutstandings?.filter((item) => {
  //   if (filterType === "Payment Pending") return item["Balance Due"] > 0;
  //   if (filterType === "Payment Done") return item["Balance Due"] <= 0;
  //   return true;
  // });
  const filteredData = customerOutstandings;

  const toggleRow = (invoiceNo) => {
    setSelectedRows((prev) =>
      prev.includes(invoiceNo)
        ? prev.filter((id) => id !== invoiceNo)
        : [...prev, invoiceNo]
    );
  };

  return (
    <Container fluid id="customer-outstanding-filters">
      <TableFilters
        onExcelDownload={onExcelDownload}
        totalItems={totalItems}
        totalItemsLabel="Total"
        dateFilter={{ enabled: false }}
        searchConfig={{ enabled: false }}
        onReset={undefined}
      />

      <style jsx global>{`
        #customer-outstanding-filters .btn-outline-secondary {
          display: none !important;
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
                <th>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={onSelectAll}
                  />
                </th>
                {columns.map((col) => (
                  <th key={col.field}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData?.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(item["Invoice No."])}
                        onChange={() => toggleRow(item["Invoice No."])}
                      />
                    </td>
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
                  <td colSpan={columns.length + 1} className="text-center">
                    No {filterType === "Payment Pending" ? "pending payments" : "completed payments"} found
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
