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

const InvoicesTable = ({ invoices, totalItems, isLoading = false }) => {
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
            label: 'Invoice#',
            render: (value) => (
                <Link href={`/invoices/${value}`} className="text-blue-600 hover:text-blue-800">
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
            label: 'Invoice Date',
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
            label: 'Item Code',
            render: (value) => value || 'N/A',
        },
        {
            field: 'ItemName',
            label: 'Item Description',
            render: (value) => value || 'N/A',
        },
        {
            field: 'Quantity',
            label: 'Quantity',
            render: (value) => (value != null ? value.toFixed(2) : '0.00'),
        },
        {
            field: 'UOMName',
            label: 'UOM',
            render: (value) => value || 'N/A',
        },
        {
            field: 'Price',
            label: 'Price',
            render: (value) => (value != null ? value.toFixed(3) : '0.000'),
        },
        {
            field: 'LineTotal',
            label: 'Line Total',
            render: (value, row) => formatCurrency(value, row.Currency),
        },
        {
            field: 'Currency',
            label: 'Currency',
            render: (value) => value || 'N/A',
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
            field: 'SuppCatNum',
            label: 'Supplier Cat#',
            render: (value) => value || 'N/A',
        },
        {
            field: 'PlantLocation',
            label: 'Plant Location',
            render: (value) => value || 'N/A',
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
                    placeholder: 'Search invoices...',
                    fields: ['DocNum', 'CardName', 'ItemCode', 'ItemName'],
                }}
                onSearch={handleSearch}
                searchTerm={searchTerm}
                statusFilter={{
                    enabled: true,
                    options: [
                        { value: 'open', label: 'Open' },
                        { value: 'closed', label: 'Closed' },
                        { value: 'canceled', label: 'Canceled' },
                    ],
                    value: statusFilter,
                    label: 'Status',
                }}
                onStatusChange={handleStatusChange}
                fromDate={fromDate}
                toDate={toDate}
                onDateFilterChange={handleDateFilterChange}
                totalItems={totalItems}
                totalItemsLabel="Total Invoices"
            />
            {isLoading ? (
                <div className="relative min-h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                        <Spinner className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                        <p className="text-gray-600">Loading invoices...</p>
                    </div>
                </div>
            ) : (
                <>
                    <GenericTable
                        columns={columns}
                        data={invoices}
                        onSort={handleSort}
                        sortField={sortField}
                        sortDirection={sortDirection}
                    />
                    {invoices.length === 0 && (
                        <div className="text-center py-4">No invoices found.</div>
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

export default InvoicesTable;