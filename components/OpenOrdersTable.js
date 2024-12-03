import React from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import GenericTable from './GenericTable';
import TableFilters from './TableFilters';
import TablePagination from './TablePagination';
import { formatCurrency } from 'utils/formatCurrency';
import Link from 'next/link';
import StatusBadge from './StatusBadge';
import { formatDate } from 'utils/formatDate';
import usePagination from 'hooks/usePagination';
import useTableFilters from 'hooks/useFilteredData';
import { truncateText } from 'utils/truncateText';
import downloadExcel from "utils/exporttoexcel";

const OpenOrdersTable = ({ orders, totalItems, isLoading = false }) => {
  
  const ITEMS_PER_PAGE = 20;
  const { currentPage, totalPages, onPageChange } = usePagination(
    totalItems,
    ITEMS_PER_PAGE
  );
  const {
    searchTerm,
    fromDate,
    toDate,
    statusFilter,
    sortField,
    sortDirection,
    handleSearch,
    handleDateFilterChange,
    handleStatusChange,
    handleSort,
  } = useTableFilters();

  const columns = [
    {
      field: "DocNum",
      label: "Order#",
      render: (value, row) => (
        <Link
          href={`/orderdetails?d=${value}&e=${row.DocEntry}`}
          className="text-blue-600 hover:text-blue-800"
        >
          {value}
        </Link>
      ),
    },
    {
      field: "CardName",
      label: "Customer",
      render: (value) => truncateText(value, 20),
    },
    {
      field: "DocDate",
      label: "Order Date",
      render: (value) => formatDate(value),
    },
    {
      field: "DeliveryDate",
      label: "Delivery Date",
      render: (value) => formatDate(value),
    },
    {
      field: "ItemCode",
      label: "Item Code",
      render: (value) => value || "N/A",
    },
    {
      field: "ItemName",
      label: "Item Name",
      render: (value) => truncateText(value, 30),
    },
    {
      field: "OpenQty",
      label: "Open Quantity",
      render: (value) => value || "0",
    },
    {
      field: "Stock",
      label: "In Stock",
      render: (value) => value || "0",
    },
    {
      field: "StockStatus",
      label: "Stock Status",
      render: (value) => (
        <span
          className={`badge ${
            value === "In Stock" ? "bg-success" : "bg-danger"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      field: "DocTotal",
      label: "Total Amount",
      render: (value, row) => {
        const amountInINR = row.DocCur === "INR" ? value : value * row.DocRate;
        return formatCurrency(amountInINR);
      },
    },
    {
      field: "SalesEmployee",
      label: "Sales Employee",
      render: (value) => value || "N/A",
    },
  ];
  

  const handleExcelDownload = () => {
    downloadExcel(orders, "Open Orders");
  };

  return (
    <Container fluid>
      <TableFilters
        searchConfig={{
          enabled: true,
          placeholder: "Search open orders...",
          fields: ["DocNum", "CardName"], // Searchable fields
        }}
        onSearch={handleSearch}
        searchTerm={searchTerm}
        statusFilter={{
          enabled: true,
          options: [
            { value: "open", label: "In Stock" },
            { value: "closed", label: "Out Of Stock" },
          ],
          value: statusFilter,
          label: "StockStatus",
        }}
        onStatusChange={handleStatusChange}
        fromDate={fromDate}
        toDate={toDate}
        onDateFilterChange={handleDateFilterChange}
        totalItems={totalItems}
        totalItemsLabel="Total Open Orders"
      />
      {isLoading ? (
        <div className="relative min-h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Spinner className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading open orders...</p>
          </div>
        </div>
      ) : (
        <>
          <GenericTable
            columns={columns}
            data={orders}
            onSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
            onExcelDownload={handleExcelDownload}
          />
          {orders.length === 0 && (
            <div className="text-center py-4">No open orders found.</div>
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

export default OpenOrdersTable;
