import React, { useState, useEffect } from 'react';
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
import downloadExcel from "utils/exporttoexcel";
import { Printer } from 'react-bootstrap-icons';

const InvoicesTable = ({ invoices, totalItems, isLoading = false, status, fetchAllInvoices  }) => {
  const ITEMS_PER_PAGE = 20;
  const [displayState, setDisplayState] = useState({
    hasData: false,
    showLoading: true
  });

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

  useEffect(() => {
    setDisplayState(prev => ({
      hasData: invoices.length > 0,
      showLoading: isLoading && !prev.hasData
    }));
  }, [isLoading, invoices]);

  // 1) Flatten data: each line item becomes its own row
  const flattenedData = invoices.flatMap(inv => {
    if (!inv.lineItems || inv.lineItems.length === 0) {
      return [inv];
    }
    return inv.lineItems.map(item => ({
      ...inv,
      ...item,
    }));
  });

  // 2) Define columns for both invoice and line-item data
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
      label: "Invoice Date",
      render: (value) => formatDate(value),
    },
    {
      field: "CardName",
      label: "Customer",
      render: (value) => value || "N/A",
    },
    // ... any other invoice-level columns you want

    // Now item-level columns
    {
      field: "ItemCode",
      label: "Item Code",
      render: (value) => value || "N/A",
    },
    {
      field: "ItemName",
      label: "Item Name",
      render: (value) => value || "N/A",
    },
    {
      field: "u_Casno",
      label: "CAS No",
      render: (value) => value || "N/A",
    },
    {
      field: "Quantity",
      label: "Qty",
      render: (value) => (value != null ? value : "N/A"),
    },
    {
      field: "Price",
      label: "Price",
      render: (value) => formatCurrency(value),
    },
    {
      field: "LineTotal",
      label: "Line Total",
      render: (value) => formatCurrency(value),
    },
    {
      field: "PaymentStatus",
      label: "Payment Status",
      render: (value) => (
        <span
          className={`badge ${
            value === "Paid" ? "bg-success" : value === "Partially Paid" ? "bg-warning" : "bg-danger"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
    field: "U_DispatchDate", // Add this field
    label: "Dispatch Date",
    render: (value) => (value ? formatDate(value) : "N/A"), // Format the date
  },
  ];

  // const handleExcelDownload = async () => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     if (!token) {
  //       console.error("No token found");
  //       return;
  //     }

  //     const url = `/api/excel/getAllInvoices?status=${statusFilter}&search=${searchTerm}&sortField=${sortField}&sortDir=${sortDirection}&fromDate=${fromDate || ""}&toDate=${toDate || ""}`;
      
  //     const response = await fetch(url, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     const filteredInvoices = await response.json();

  //     if (filteredInvoices && filteredInvoices.length > 0) {
  //       downloadExcel(filteredInvoices, `Invoices_${statusFilter}`);
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
      const fullData = await fetchAllInvoices();
      if (!fullData || fullData.length === 0) {
        alert("No data available to export.");
        return;
      }

      // Format and structure data according to visible columns
      const formattedData = fullData.map(row => {
        return {
          "Invoice#": row.DocNum,
          "Status": row.DocStatus,
          "Invoice Date": row.DocDate ? formatDate(row.DocDate) : "",
          "Customer": row.CardName || "N/A",
          "Item Code": row.ItemCode || "N/A",
          "Item Name": row.ItemName || "N/A",
          "CAS No": row.u_Casno || "N/A",
          "Qty": row.Quantity != null ? row.Quantity : "N/A",
          "Price": formatCurrency(row.Price),
          "Line Total": formatCurrency(row.LineTotal),
          "Payment Status": row.PaymentStatus,
          "Dispatch Date": row.U_DispatchDate ? formatDate(row.U_DispatchDate) : "N/A",
        };
      });

      downloadExcel(formattedData, `Invoices_${statusFilter}`);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  const renderContent = () => {
    if (displayState.showLoading) {
      return (
        <div className="relative min-h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Spinner className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading invoices...</p>
          </div>
        </div>
      );
    }

    return (
      <>
        <GenericTable
          columns={columns}
          data={flattenedData}  // <-- flattened data
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
          onExcelDownload={handleExcelDownload}
        />
        {!isLoading && flattenedData.length === 0 && (
          <div className="text-center py-4">No invoices found.</div>
        )}
      </>
    );
  };

  return (
    <Container fluid>
      <TableFilters
        searchConfig={{
          enabled: true,
          placeholder: "Search invoices...",
          fields: ["DocNum", "CardName", "ItemCode", "ItemName","u_Casno","CustomerPONo"],
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

export default InvoicesTable;
