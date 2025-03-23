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
import { truncateText } from 'utils/truncateText';
import downloadExcel from "utils/exporttoexcel";
import { Printer } from 'react-bootstrap-icons';

const OpenOrdersTable = ({ orders, totalItems, isLoading = false, status }) => {
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
    fromDate,
    toDate,
    sortField,
    sortDirection,
    statusFilter,
    handleSearch,
    handleStatusChange,
    handleDateFilterChange,
    handleSort,
    handleReset,
  } = useTableFilters();

  // Update display state based on props
  useEffect(() => {
    setDisplayState(prev => ({
      hasData: orders.length > 0,
      showLoading: isLoading && !prev.hasData
    }));
  }, [isLoading, orders]);

  const columns = [
    // {
    //   field: "DocumentStatus",
    //   label: "Document Status",
    //   render: (value) => (
    //     <span
    //       className={`badge ${
    //         value === "Open" ? "bg-success" : 
    //         value === "Closed" ? "bg-secondary" : 
    //         value === "Cancel" ? "bg-danger" : "bg-info"
    //       }`}
    //     >
    //       {value}
    //     </span>
    //   ),
    // },
    // {
    //   field: "DocEntry",
    //   label: "Doc Entry",
    //   render: (value) => value || "N/A",
    // },
    {
      field: "DocumentNumber",
      label: "Order#",
      render: (value, row) => (
        <>
          <Link
            href={`/orderdetails?d=${value}&e=${row.DocEntry}`}
            className="text-blue-600 hover:text-blue-800"
          >
            {value}
          </Link>
        </>
      ),
    },
    {
      field: "PostingDate",
      label: "Posting Date",
      render: (value) => formatDate(value),
    },
    {
      field: "CustomerPONo",
      label: "Customer PO No",
      render: (value) => value || "N/A",
    },
    {
      field: "PODate",
      label: "PO Date",
      render: (value) => formatDate(value),
    },
    {
      field: "CustomerVendorName",
      label: "Customer/Vendor",
      render: (value) => truncateText(value, 20),
    },
    {
      field: "ItemGroup",
      label: "Item Group",
      render: (value) => value || "N/A",
    },
    {
      field: "ItemNo",
      label: "Item No.",
      render: (value) => value || "N/A",
    },
    {
      field: "MfrCatalogNo",
      label: "Mfr Catalog No.",
      render: (value) => value || "N/A",
    },
    {
      field: "ItemName",
      label: "Item Name",
      render: (value) => truncateText(value, 25),
    },
    {
      field: "CasNo",
      label: "CAS No",
      render: (value) => value || "N/A",
    },
    {
      field: "LineStatus",
      label: "Line Status",
      render: (value) => (
        <span
          className={`badge ${
            value === "Open" ? "bg-primary" : 
            value === "Closed" ? "bg-secondary" : "bg-info"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      field: "Quantity",
      label: "Quantity",
      render: (value) => value || "0",
    },
    {
      field: "UOMName",
      label: "UOM",
      render: (value) => value || "N/A",
    },
    {
      field: "OpenQty",
      label: "Open Qty",
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
      field: "Timeline",
      label: "Timeline",
      render: (value) => value || "N/A",
    },
    {
      field: "MktFeedback",
      label: "Mkt Feedback",
      render: (value) => value || "N/A",
    },
    {
      field: "DeliveredQuantity",
      label: "Delivered Qty",
      render: (value) => value || "0",
    },
    {
      field: "DeliveryDate",
      label: "Delivery Date",
      render: (value) => formatDate(value),
    },
    {
      field: "PlantLocation",
      label: "Plant Location",
      render: (value) => value || "N/A",
    },
    {
      field: "Price",
      label: "Price",
      render: (value, row) => formatCurrency(value, row.PriceCurrency),
    },
    {
      field: "PriceCurrency",
      label: "Currency",
      render: (value) => value || "N/A",
    },
    {
      field: "OpenAmount",
      label: "Open Amount",
      render: (value, row) => formatCurrency(value, row.PriceCurrency),
    },
    {
      field: "SalesEmployee",
      label: "Sales Employee",
      render: (value) => value || "N/A",
    },
  ];

  const handleExcelDownload = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const url = `/api/excel/getOpenOrders?status=${statusFilter}&search=${searchTerm}&sortField=${sortField}&sortDir=${sortDirection}&fromDate=${fromDate || ""}&toDate=${toDate || ""}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const filteredOpenOrders = await response.json();

      if (filteredOpenOrders && filteredOpenOrders.length > 0) {
        const formatDate = (date) => {
          if (!date) return "NoDate";
          const [year, month, day] = date.split("-");
          return `${day}-${month}-${year}`;
        };

        const startDate = formatDate(fromDate);
        const endDate = formatDate(toDate);
        const fileName = `OpenOrders_${startDate}_to_${endDate}.xlsx`;

        downloadExcel(filteredOpenOrders, fileName);
      } else {
        alert("No data available to export.");
      }
    } catch (error) {
      console.error("Error during Excel export:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  const renderContent = () => {
    if (displayState.showLoading) {
      return (
        <div className="relative min-h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Spinner className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading open orders...</p>
          </div>
        </div>
      );
    }

    return (
      <>
        <GenericTable
          columns={columns}
          data={orders || []}
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
          onExcelDownload={handleExcelDownload}
        />
        {!isLoading && orders.length === 0 && (
          <div className="text-center py-4">No open orders found.</div>
        )}
      </>
    );
  };

  return (
    <Container fluid>
      <TableFilters
        searchConfig={{
          enabled: true,
          placeholder: "Search open orders...",
          fields: ["DocumentNumber", "CustomerVendorName", "ItemNo", "ItemName", "CasNo", "MfrCatalogNo"],
        }}
        onSearch={handleSearch}
        searchTerm={searchTerm}
        statusFilter={{
          enabled: true,
          options: [
            { value: "inStock", label: "In Stock" },
            { value: "outOfStock", label: "Out of Stock" },
            
          ],
          value: statusFilter,
        }}
        fromDate={fromDate}
        toDate={toDate}
        onReset={handleReset}
        onStatusChange={handleStatusChange}
        onDateFilterChange={handleDateFilterChange}
        totalItems={totalItems}
        totalItemsLabel="Total Open Orders"
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

export default OpenOrdersTable;