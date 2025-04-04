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

const InvoicesTable = ({ invoices, totalItems, isLoading = false, status }) => {
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


  const columns = [
    {
      field: "DocNum",
      label: "Invoice#",
      render: (value, row) => (
        <>
          <Link
            href={`/invoicedetails?d=${value}&e=${row.DocEntry}`}
            className="text-blue-600 hover:text-blue-800"
            prefetch
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
      field: "Document Status",
      label: "Status",
      render: (value) => (
        <span className={`badge ${value === "Closed" ? "bg-success" : value === "Cancelled" ? "bg-warning" : "bg-danger"}`}>
          {value}
        </span>
      ),
    },
    {
      field: "Invoice Posting Dt.",
      label: "Invoice Date",
      render: (value) => formatDate(value),
    },
    // {
    //   field: "Series Name",
    //   label: "Series",
    //   render: (value) => value || "N/A",
    // },
    {
      field: "Vendor Catalog No.",
      label: "Vendor Cat. No.",
      render: (value) => value || "N/A",
    },  
    {
      field: "Cust Code",
      label: "Customer Code",
      render: (value) => value || "N/A",
    },
    {
      field: "Customer/Vendor Name",
      label: "Customer Name",
      render: (value) => value || "N/A",
    },
    {
      field: "SO No",
      label: "Sales Order No.",
      render: (value) => value || "N/A",
    },
    {
      field: "SO Date",
      label: "SO Date",
      render: (value) => formatDate(value),
    },
    {
      field: "Customer ref no",
      label: "Customer Ref",
      render: (value) => value || "N/A",
    },
    {
      field: "SO Customer Ref. No",
      label: "SO Customer Ref",
      render: (value) => value || "N/A",
    },
    {
      field: "Tracking Number",
      label: "Tracking No.",
      render: (value) => value || "N/A",
    },
    // {
    //   field: "Delivery Date",
    //   label: "Delivery Date",
    //   render: (value) => formatDate(value),
    // },
    {
      field: "Dispatch Date",
      label: "Dispatch Date",
      render: (value) => formatDate(value),
    },
    {
      field: "Item No.",
      label: "Item No.",
      render: (value) => value || "N/A",
    },
   
    {
      field: "Item/Service Description",
      label: "Description",
      render: (value) => value || "N/A",
    },
    {
      field: "Group Name",
      label: "Group",
      render: (value) => value || "N/A",
    },
    {
      field: "BatchNum",
      label: "Batch No.",
      render: (value) => value || "N/A",
    },
    {
      field: "Qty.",
      label: "Quantity",
      render: (value) => (value != null ? value : "N/A"),
    },
    {
      field: "Unit",
      label: "UoM",
      render: (value) => value || "N/A",
    },
    {
      field: "Packsize",
      label: "Pack Size",
      render: (value) => value || "N/A",
    },
    {
      field: "Cas No",
      label: "CAS No.",
      render: (value) => value || "N/A",
    },
    {
      field: "Unit Sales Price",
      label: "Unit Price",
      render: (value) => formatCurrency(value),
    },
    {
      field: "Total Sales Price",
      label: "Total",
      render: (value) => formatCurrency(value),
    },
    {
      field: "Document Currency",
      label: "Currency",
      render: (value) => value || "N/A",
    },
    {
      field: "Country",
      label: "Country",
      render: (value) => value || "N/A",
    },
    {
      field: "State",
      label: "State",
      render: (value) => value || "N/A",
    },
    {
      field: "Pymnt Group",
      label: "Payment Terms",
      render: (value) => value || "N/A",
    },
    // {
    //   field: "Payment Status",
    //   label: "Payment Status",
    //   render: (value) => (
    //     <span className={`badge ${value === "Paid" ? "bg-success" : value === "Partially Paid" ? "bg-warning" : "bg-danger"}`}>
    //       {value}
    //     </span>
    //   ),
    // },
    {
      field: "Exchange Rate",
      label: "Exch. Rate",
      render: (value) => value || "N/A",
    },
    {
      field: "Sales Employee",
      label: "Sales Employee",
      render: (value) => value || "N/A",
    },
    {
      field: "Transport Name",
      label: "Transport",
      render: (value) => value || "N/A",
    },
    {
      field: "Tax Amount",
      label: "Tax Amount",
      render: (value) => formatCurrency(value),
    },
    {
      field: "GSTIN",
      label: "GSTIN",
      render: (value) => value || "N/A",
    },
  //   {
  //   field: "U_DispatchDate", // Add this field
  //   label: "Dispatch Date",
  //   render: (value) => (value ? formatDate(value) : "N/A"), // Format the date
  // },
  ];

  
const handleExcelDownload = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    const url = `/api/header-invoice?status=${statusFilter}&search=${searchTerm}&sortField=${sortField}&sortDir=${sortDirection}&fromDate=${fromDate || ""}&toDate=${toDate || ""}&getAll=true`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    const filteredInvoices = result.invoices || [];

    if (filteredInvoices.length === 0) {
      alert("No data available to export.");
      return;
    }

    // 🔥 Use the columns array for header and key mapping
    const excelColumns = columns
      .filter(col => col.field !== "actions") // Exclude actions if needed
      .map(col => ({
        header: col.label,
        key: col.field,
      }));

    // 🧠 Optionally format data as per renderers if needed
    const formattedData = filteredInvoices.map(row => {
      const formattedRow = {};
      excelColumns.forEach(col => {
        let value = row[col.key];

        // Format date if needed
        if (col.key === "DocDate" || col.key === "U_DispatchDate") {
          value = value ? new Date(value).toISOString().split("T")[0] : "N/A";
        }

        formattedRow[col.header] = value;
      });
      return formattedRow;
    });

    downloadExcel(formattedData, `Invoices_${statusFilter}`);
  } catch (error) {
    console.error("Failed to fetch data for Excel export:", error);
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
          data={flattenedData}  // flattened data with merged invoice and line-item details
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
          // Expanded search fields to cover comprehensive data points
          fields: [
            "DocNum", 
            "Cust Code", 
            "Customer/Vendor Name", 
            "SO No", 
            "Customer ref no", 
            "Tracking Number", 
            "Item No.", 
            "Item/Service Description", 
            "BatchNum",
            "Cas No",
            "Vendor Catalog No.",
            "Pymnt Group"
          ],
        }}
        onSearch={handleSearch}
        searchTerm={searchTerm}
        statusFilter={{
          enabled: true,
          options: [
          
            { value: "Open", label: "Open" },
            { value: "Closed", label: "Closed" },
            { value: "Canceled", label: "Canceled" },
            { value: "Partially Open", label: "Partially Open" }
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