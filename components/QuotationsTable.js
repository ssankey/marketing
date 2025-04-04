// components/QuotationsTable.js
import React, { useState, useEffect } from "react";
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

const QuotationTable = ({ quotations, totalItems, isLoading = false, fetchAllQuotations }) => {
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

  // Track both the initial load and subsequent data fetches
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [dataState, setDataState] = useState({
    isLoading: true,
    hasData: false,
    hasError: false
  });

  useEffect(() => {
    // If we're getting new data or loading state changes
    if (isLoading) {
      setDataState(prev => ({ ...prev, isLoading: true }));
    } else {
      // Data has arrived
      setDataState({
        isLoading: false,
        hasData: quotations.length > 0,
        hasError: false
      });
      setIsInitialLoad(false);
    }
  }, [isLoading, quotations]);

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
      // render: (value) => <StatusBadge status={value} />,
      render: (value) => (
        // <span
        //   className={`badge ${
        //     value === "Closed" ? "bg-success" : "bg-danger"
        //   }`}
        // >
         <span
          className={`badge ${
            value === "Closed" ? "bg-success" : value === "Open" ? "bg-danger" : "bg-warning"
          }`}
        >
          {value}
        </span>
      ),
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

  // const handleExcelDownload = async () => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     if (!token) {
  //       console.error("No token found");
  //       return;
  //     }

  //     const url = `/api/excel/getAllQuotations?status=${statusFilter}&search=${searchTerm}&sortField=${sortField}&sortDir=${sortDirection}&fromDate=${fromDate || ""}&toDate=${toDate || ""}`;

  //     const response = await fetch(url, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     const filteredQuotations = await response.json(); 

  //     if (filteredQuotations && filteredQuotations.length > 0) {
  //       downloadExcel(filteredQuotations, `Quotations_${statusFilter}`);
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
    const fullData = await fetchAllQuotations();
    if (!fullData || fullData.length === 0) {
      alert("No data available to export.");
      return;
    }

    // Format and structure data according to visible columns
    const formattedData = fullData.map(row => {
      return {
        "Quotation#": row.DocNum,
        "Status": row.DocStatus,
        "Quotation Date": row.DocDate ? formatDate(row.DocDate) : "",
        "Customer PO No": row.CustomerPONo || "N/A",
        "Customer": row.CardName || "N/A",
        "Delivery Date": row.DeliveryDate ? formatDate(row.DeliveryDate) : "",
        "Total Amount": formatCurrency(row.DocCur === "INR" ? row.DocTotal : row.DocTotal * row.DocRate),
        "Currency": row.DocCur || "N/A",
        "Sales Person": row.SalesEmployee || "N/A"
      };
    });

    downloadExcel(formattedData, `Quotations_${statusFilter}`);
  } catch (error) {
    console.error("Download failed:", error);
    alert("Failed to export data. Please try again.");
  }
};


  

  const renderContent = () => {
    if (isLoading && (!quotations || quotations.length === 0)) {
      return (
        <div className="relative min-h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Spinner className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading quotations...</p>
          </div>
        </div>
      );
    }

    return (
      <>
        <GenericTable
          columns={columns}
          data={quotations}
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
          onExcelDownload={handleExcelDownload}
        />
        {!isLoading && (!quotations || quotations.length === 0) && (
          <div className="text-center py-4">No quotations found.</div>
        )}
      </>
    );
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

      {renderContent()}

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