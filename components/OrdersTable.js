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

const OrdersTable = ({ orders, totalItems, currentPage, isLoading = false }) => {
  console.log(orders);

  const ITEMS_PER_PAGE = 20;
  const { totalPages, onPageChange } = usePagination(
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
      field: "ProductCount",
      label: "Product Count",
      render: (value) => value || "0",
    },
    {
      field: "DeliveryDate",
      label: "Delivery Date",
      render: (value) => formatDate(value),
    },
    {
      field: "DocTotal",
      label: "Total Amount",
      render: (value, row) => {
        const amountInINR = row.DocCur === "INR" ? value : value * row.ExchangeRate;
        return formatCurrency(amountInINR);
      },
    },
    {
      field: "DocCur",
      label: "Currency",
      render: (value) => value || "0",
    },
    {
      field: "DocStatus",
      label: "Order Status",
      render: (value) => <StatusBadge status={value.toLowerCase()} />,
    },
    {
      field: "InvoiceNum",
      label: "Invoice#",
      render: (value, row) => (
        value ? (
          <Link
            href={`/invoicedetails?d=${row.InvoiceNum}&e=${row.InvoiceDocEntry}`}
            className="text-green-600 hover:text-green-800"
          >
            {value}
          </Link>
        ) : (
          "0"
        )
      ),
    },
    {
      field: "InvoiceDate",
      label: "Invoice Date",
      render: (value) => value ? formatDate(value) : "0",
    },
    {
      field: "InvoiceTotal",
      label: "Invoice Amount",
      render: (value) => formatCurrency(value || 0),
    },
    {
      field: "InvoiceStatus",
      label: "Invoice Status",
      render: (value) => value ? <StatusBadge status={value.toLowerCase()} /> : "0",
    },
    {
      field: "SalesEmployee",
      label: "Sales Employee",
      render: (value) => value || "0",
    }
  ];
  
  const handleExcelDownload = () => {
    downloadExcel(orders, "Orders");
  };

  return (
    <Container fluid>
      <TableFilters
        searchConfig={{
          enabled: true,
          placeholder: "Search orders...",
          fields: ["DocNum", "CardName", "ItemCode", "ItemDescription","InvoiceNum"], // Updated field names
        }}
        onSearch={handleSearch}
        searchTerm={searchTerm}
        statusFilter={{
          enabled: true,
          options: [
            { value: "open", label: "Open" },
            { value: "closed", label: "Closed" },
          ],
          value: statusFilter,
          label: "Status",
        }}
        onStatusChange={handleStatusChange}
        fromDate={fromDate}
        toDate={toDate}
        onDateFilterChange={handleDateFilterChange}
        totalItems={totalItems}
        totalItemsLabel="Total Orders"
      />
      {isLoading ? (
        <div className="relative min-h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Spinner className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading orders...</p>
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
            <div className="text-center py-4">No orders found.</div>
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

export default OrdersTable;