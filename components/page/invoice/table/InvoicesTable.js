//components/invoiesTable.js
import React from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import GenericTable from "components/tabel/GenericTable";
import TableFilters from "components/tabel/TableFilters";
import TablePagination from "components/tabel/TablePagination";
import { formatCurrency } from 'utils/formatCurrency';
import Link from 'next/link';
import StatusBadge from '../../../ui-module/badge/StatusBadge';
import { formatDate } from 'utils/formatDate';
import usePagination from 'hooks/usePagination';
import useTableFilters from 'hooks/useFilteredData';
import downloadExcel from "utils/exportToExcel";
import { Printer } from 'react-bootstrap-icons';
const InvoicesTable = ({ invoices, totalItems, isLoading = false, status }) => {
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
    handleReset,
  } = useTableFilters();

  const columns = [
    {
      field: "DocNum",
      label: "Invoice#",
      render: (value, row) => (
        <>
          <Link
            href={`/invoicedetails?d=${value}&e=${row.DocEntry}`}
            className="text-blue-600 hover:text-blue-800"
          >
            {value}
          </Link>
          &nbsp;
          <Link
            href={`/printInvoice?d=${value}&e=${row.DocEntry}`}
            className="text-blue-600 hover:text-blue-800"
            target="_blank"
          >
            <Printer />
          </Link>
        </>
      ),
    },
    {
      field: "DocStatus",
      label: "Status",
      render: (value) => <StatusBadge status={value} />,
    },
    {
      field: "DocDate",
      label: "Invoice Date",
      render: (value) => formatDate(value),
    },
    {
      field: "PODate",
      label: "PO Date",
      render: (value) => formatDate(value),
    },
    {
      field: "CardName",
      label: "Customer",
      render: (value) => value || "N/A",
    },
    {
      field: "DocDueDate",
      label: "Due Date",
      render: (value) => formatDate(value),
    },
    {
      field: "TradeType",
      label: "Trade Type",
      render: (value) => value || "N/A",
    },
    {
      field: "LineTotal",
      label: "Line Total",
      render: (value) => formatCurrency(value),
    },
    {
      field: "TaxAmount",
      label: "Tax Amount",
      render: (value) => formatCurrency(value),
    },
    {
      field: "InvoiceTotal",
      label: "Invoice Total",
      render: (value) => formatCurrency(value),
    },
    {
      field: "DocCur",
      label: "Currency",
      render: (value) => value || "N/A",
    },
    {
      field: "SalesEmployee",
      label: "Sales Employee",
      render: (value) => value || "N/A",
    },
  ];

  // Define handleExcelDownload function
  // const handleExcelDownload = () => {
  //   downloadExcel(invoices, "Invoices");
  // };

  // const handleExcelDownload = async () => {
  //   try {
  //     const response = await fetch("api/excel/getAllInvoices");
  //     const allInvoices = await response.json();
  //     if (allInvoices && allInvoices.length > 0) {
  //       downloadExcel(allInvoices, "Invoices");
  //     } else {
  //       alert("No data available to export.");
  //     }
  //   } catch (error) {
  //     console.error("Failed to fetch data for Excel export:", error);
  //     alert("Failed to export data. Please try again.");
  //   }
  // };

  const handleExcelDownload = async () => {
    try {
      const response = await fetch(
        `/api/excel/getAllInvoices?status=${statusFilter}&search=${searchTerm}&sortField=${sortField}&sortDir=${sortDirection}&fromDate=${fromDate || ""}&toDate=${toDate || ""}`
      );
      const filteredInvoices = await response.json();

      if (filteredInvoices && filteredInvoices.length > 0) {
        downloadExcel(filteredInvoices, `Invoices_${statusFilter}`);
      } else {
        alert("No data available to export.");
      }
    } catch (error) {
      console.error("Failed to fetch data for Excel export:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  return (
    <Container fluid>
      <TableFilters
        searchConfig={{
          enabled: true,
          placeholder: "Search invoices...",
          fields: ["DocNum", "CardName", "ItemCode", "ItemName"],
        }}
        onSearch={handleSearch}
        searchTerm={searchTerm}
        statusFilter={{
          enabled: true,
          options: [
            { value: "open", label: "Open" },
            { value: "closed", label: "Closed" },
            { value: "canceled", label: "Canceled" },
          ],
          value: statusFilter,
          label: "Status",
        }}
        onStatusChange={handleStatusChange}
        fromDate={fromDate}
        toDate={toDate}
        onDateFilterChange={handleDateFilterChange}
        totalItems={totalItems}
        onReset={handleReset}
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
            onExcelDownload={handleExcelDownload} // Passing the function as a prop
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
