// components/QuotationsTable.js

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
import downloadExcel from "utils/exporttoexcel";


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
    handleReset,
  } = useTableFilters();

  const columns = [
    {
      field: "DocNum",
      label: "Quotation#",
      render: (value, row) => (
        <Link
          href={`/quotationdetails?d=${value}&e=${row.DocEntry}`}
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
      label: "Quotation Date",
      render: (value) => formatDate(value),
    },
    {
      field: "CustomerPONo",
      label: "Customer PO No",
      render: (value) => value || "N/A",
    },
    {
      field: "CardName",
      label: "Customer",
      render: (value) => value || "N/A",
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
        const amountInINR = row.DocCur === "INR" ? value : value * row.DocRate;
        return formatCurrency(amountInINR);
      },
    },
    {
      field: "DocCur",
      label: "Currency",
      render: (value) => value || "N/A",
    },
    {
      field: "SalesEmployee",
      label: "Sales Person",
      render: (value) => value || "N/A",
    },
  ];
 

  const handleExcelDownload = async () => {
    try {
      const response = await fetch(
        `/api/excel/getAllQuotations?status=${statusFilter}&search=${searchTerm}&sortField=${sortField}&sortDir=${sortDirection}&fromDate=${
          fromDate || ""
        }&toDate=${toDate || ""}`
      );
      const filteredQuotations = await response.json();
  
      if (filteredQuotations && filteredQuotations.length > 0) {
        downloadExcel(filteredQuotations, `Quotations_${statusFilter}`);
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
            { value: "canceled", label: "Cancelled" },
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
            onExcelDownload={handleExcelDownload} // Passing the function as a prop
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
