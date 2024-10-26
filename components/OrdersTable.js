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

const OrdersTable = ({ orders, totalItems, isLoading = false }) => {
  const ITEMS_PER_PAGE = 20;
  const { currentPage, totalPages, onPageChange } = usePagination(totalItems, ITEMS_PER_PAGE);
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
      field: 'DocNum',
      label: 'Order#',
      render: (value) => (
        <Link href={`/orders/${value}`} className="text-blue-600 hover:text-blue-800">
          {value}
        </Link>
      ),
    },
    {
      field: 'DocStatus',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      field: 'DocDate',
      label: 'Date',
      render: (value) => formatDate(value),
    },
    {
      field: 'CustomerPONo',
      label: 'Customer PO No',
      render: (value) => value || 'N/A',
    },
    {
      field: 'PODate',
      label: 'PO Date',
      render: (value) => formatDate(value),
    },
    {
      field: 'CardName',
      label: 'Customer',
      render: (value) => value || 'N/A',
    },
    {
      field: 'ItemGroup',
      label: 'Item Group',
      render: (value) => value || 'N/A',
    },
    {
      field: 'ItemCode',
      label: 'Cat No.',
      render: (value) => value || 'N/A',
    },
    {
      field: 'ItemName',
      label: 'Compound',
      render: (value) => value || 'N/A',
    },
    {
      field: 'Quantity',
      label: 'Qty',
      render: (value) => (value != null ? value.toFixed(2) : '0.00'),
    },
    {
      field: 'UOMName',
      label: 'UOM',
      render: (value) => value || 'N/A',
    },
    {
      field: 'OpenQty',
      label: 'Open Qty',
      render: (value) => (value != null ? value.toFixed(2) : '0.00'),
    },
    {
      field: 'StockStatus',
      label: 'Stock',
      render: (value) => (value != null ? value.toFixed(2) : '0.00'),
    },
    {
      field: 'U_timeline',
      label: 'Timeline',
      render: (value) => value || 'N/A',
    },
    {
      field: 'suppcatnum',
      label: 'Supplier Cat#',
      render: (value) => value || 'N/A',
    },
    {
      field: 'DelivrdQty',
      label: 'Delivered Qty',
      render: (value) => (value != null ? value.toFixed(2) : '0.00'),
    },
    {
      field: 'DeliveryDate',
      label: 'Delivery Date',
      render: (value) => formatDate(value),
    },
    {
      field: 'PlantLocation',
      label: 'Plant Location',
      render: (value) => value || 'N/A',
    },
    {
      field: 'Price',
      label: 'Price',
      render: (value) => (value != null ? value.toFixed(3) : '0.000'),
    },
    {
      field: 'Currency',
      label: 'Currency',
      render: (value) => value || 'N/A',
    },
    {
      field: 'OpenAmount',
      label: 'Open Amount',
      render: (value, row) => formatCurrency(value, row.Currency),
    },
    {
      field: 'SalesEmployee',
      label: 'Sales Employee',
      render: (value) => value || 'N/A',
    },
  ];
  return (
    <Container fluid>
      <TableFilters
        searchConfig={{
          enabled: true,
          placeholder: 'Search orders...',
          fields: ['DocNum', 'CardName', 'ItemCode', 'ItemName'],
        }}
        onSearch={handleSearch}
        searchTerm={searchTerm}
        statusFilter={{
          enabled: true,
          options: [
            { value: 'open', label: 'Open' },
            { value: 'closed', label: 'Closed' },
            { value: 'cancel', label: 'Cancelled' },
          ],
          value: statusFilter,
          label: 'Status',
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

      <Row className="mb-2 ">
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
