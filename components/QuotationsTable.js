import React from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import GenericTable from "./GenericTable";
import TableFilters from "./TableFilters";
import TablePagination from "./TablePagination";
import { formatCurrency } from "utils/formatCurrency";
import Link from "next/link";
import { formatDate } from "utils/formatDate";
import usePagination from "hooks/usePagination";
import useTableFilters from "hooks/useFilteredData";
import StatusBadge from "./StatusBadge";

const QuotationTable = ({ quotations, totalItems, isLoading = false }) => {
  const ITEMS_PER_PAGE = 20;
  const { currentPage, totalPages, onPageChange } = usePagination(
    totalItems,
    ITEMS_PER_PAGE
  );
  const {
    searchTerm,
    statusFilter,
    fromDate,
    toDate,
    sortField,
    sortDirection,
    handleSearch,
    handleStatusChange,
    handleDateFilterChange,
    handleSort,
  } = useTableFilters();

  const columns = [
    {
      field: "DocNum",
      label: "Quotation#",
      render: (value) => (
        <Link
          href={`/quotations/${value}`}
          className="text-blue-600 hover:text-blue-800"
        >
          {value}
        </Link>
      ),
    },
    {
      field: "DocStatus",
      label: "Status",
      render: (value) => <StatusBadge status={value} />,
    },
    {
      field: "DocDate",
      label: "Date",
      render: (value) => formatDate(value),
    },
    {
      field: "CardName",
      label: "Customer",
      render: (value) => value || "N/A",
    },
    {
      field: "ItemCode",
      label: "Item Code",
      render: (value) => value || "N/A",
    },
    {
      field: "Dscription",
      label: "Description",
      render: (value) => value || "N/A",
    },
  ];

  return (
    <Container fluid>
      <TableFilters
        searchConfig={{
          enabled: true,
          placeholder: "Search quotations...",
          fields: ["DocNum", "CardName", "ItemCode", "Dscription"],
        }}
        onSearch={handleSearch}
        searchTerm={searchTerm}
        statusFilter={{
          enabled: true,
          options: [
            { value: "open", label: "Open" },
            { value: "closed", label: "Closed" },
            { value: "cancel", label: "Cancelled" },
          ],
          value: statusFilter,
          label: "Status",
        }}
        onStatusChange={handleStatusChange}
        fromDate={fromDate}
        toDate={toDate}
        onDateFilterChange={handleDateFilterChange}
        totalItems={totalItems}
        totalItemsLabel="Total Quotations"
      />
      {isLoading ? (
        <div className="relative min-h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Spinner className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading quotations...</p>
          </div>
        </div>
      ) : (
        <>
          <GenericTable
            columns={columns}
            data={quotations}
            onSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
          />
          {quotations.length === 0 && (
            <div className="text-center py-4">No quotations found.</div>
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
            Page {currentPage} of {totalPages}
          </h5>
        </Col>
      </Row>
    </Container>
  );
};

export default QuotationTable;
