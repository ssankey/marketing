import React from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import GenericTable from "components/GenericTable";
import TableFilters from "components/TableFilters";
import TablePagination from "components/TablePagination";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";

const CustomerBalanceTable = ({
  balances,
  totalItems,
  isLoading = false,
  currentPage,
  searchTerm,
  status,
  fromDate,
  toDate,
  sortField,
  sortDirection,
  onPageChange,
  onSearch,
  onStatusChange,
  onDateFilterChange,
  onSort,
  onReset
}) => {
  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const columns = [
    {
      field: "SO#",
      label: "SO#",
    },
    {
      field: "Customer/Vendor Code",
      label: "Customer Code",
    },
    {
      field: "Customer/Vendor Name",
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
      field: "BalanceDue",
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
      field: "Payment Terms Code",
      label: "Payment Terms",
    },
    {
      field: "Remarks",
      label: "Remarks",
    },
  ];

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "30", label: "Overdue 0-30 days" },
    { value: "60", label: "Overdue 31-60 days" },
    { value: "90", label: "Overdue 61-90 days" },
    { value: "90+", label: "Overdue 90+ days" },
  ];

  return (
    <Container fluid>
      <TableFilters
        searchConfig={{
          enabled: true,
          placeholder: "Search by customer name, code or invoice#...",
          value: searchTerm,
        }}
        onSearch={onSearch}
        statusFilter={{
          enabled: true,
          options: statusOptions,
          value: status,
          label: "Overdue Status",
        }}
        onStatusChange={onStatusChange}
        dateFilter={{
          enabled: true,
          fromDate: fromDate,
          toDate: toDate,
          label: "Invoice Date Range", // Updated to reflect AR Invoice Date
        }}
        onDateFilterChange={onDateFilterChange}
        totalItems={totalItems}
        onReset={onReset}
        totalItemsLabel="Total Customer Invoices"
      />

      {isLoading ? (
        <div className="relative min-h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Spinner className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading customer data...</p>
          </div>
        </div>
      ) : (
        <>
          <GenericTable
            columns={columns}
            data={balances || []}
            onSort={onSort}
            sortField={sortField}
            sortDirection={sortDirection}
          />
          {balances.length === 0 && (
            <div className="text-center py-4">No customer invoices found.</div>
          )}
        </>
      )}

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <Row className="mb-2">
        <Col className="text-center">
          <h5>
            Page {currentPage} of {totalPages || 1}
          </h5>
        </Col>
      </Row>
    </Container>
  );
};

export default CustomerBalanceTable;