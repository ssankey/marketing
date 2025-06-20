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

const OpenOrdersTable = ({
  orders,
  totalItems,
  isLoading = false,
  status,
  searchTerm,
  fromDate,
  toDate,
  sortField,
  sortDirection
}) => {

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
    searchTerm: filterSearchTerm,
    fromDate: filterFromDate,
    toDate: filterToDate,
    sortField: filterSortField,
    sortDirection: filterSortDirection,
    statusFilter,
    handleSearch,
    handleStatusChange,
    handleDateFilterChange,
    handleSort,
    handleReset,
  } = useTableFilters();

  useEffect(() => {
    setDisplayState(prev => ({
      hasData: orders.length > 0,
      showLoading: isLoading && !prev.hasData
    }));
  }, [isLoading, orders]);

  // const columns = [
  //   {
  //     field: "DocumentNumber",
  //     label: "Order#",
  //     render: (value, row) => (
  //       <Link
  //         href={`/orderdetails?d=${value}&e=${row.DocEntry}`}
  //         className="text-blue-600 hover:text-blue-800"
  //       >
  //         {value}
  //       </Link>
  //     ),
  //   },
  //   {
  //     field: "PostingDate",
  //     label: "Posting Date",
  //     render: (value) => formatDate(value),
  //   },
  //   {
  //     field: "CustomerPONo",
  //     label: "Customer PO No",
  //     render: (value) => value || "N/A",
  //   },
  //   {
  //     field: "PODate",
  //     label: "PO Date",
  //     render: (value) => formatDate(value),
  //   },
  //   {
  //     field: "CustomerVendorName",
  //     label: "Customer/Vendor",
  //     render: (value) => truncateText(value, 20),
  //   },
  //   {
  //     field: "ItemGroup",
  //     label: "Item Group",
  //     render: (value) => value || "N/A",
  //   },
  //   {
  //     field: "ItemNo",
  //     label: "Item No.",
  //     render: (value) => value || "N/A",
  //   },
  //   {
  //     field: "MfrCatalogNo",
  //     label: "Mfr Catalog No.",
  //     render: (value) => value || "N/A",
  //   },
  //   {
  //     field: "ItemName",
  //     label: "Item Name",
  //     render: (value) => truncateText(value, 25),
  //   },
  //   {
  //     field: "CasNo",
  //     label: "CAS No",
  //     render: (value) => value || "N/A",
  //   },
  //   {
  //     field: "LineStatus",
  //     label: "Line Status",
  //     render: (value) => (
  //       <span className={`badge ${value === "Open" ? "bg-primary" : value === "Closed" ? "bg-secondary" : "bg-info"}`}>
  //         {value}
  //       </span>
  //     ),
  //   },
  //   {
  //     field: "Quantity",
  //     label: "Quantity",
  //     render: (value) => value || "0",
  //   },
  //   {
  //     field: "UOMName",
  //     label: "UOM",
  //     render: (value) => value || "N/A",
  //   },
  //   {
  //     field: "OpenQty",
  //     label: "Open Qty",
  //     render: (value) => value || "0",
  //   },
  //   {
  //     field: "StockStatus",
  //     label: "Stock Status",
  //     render: (value) => (
  //       <span className={`badge ${value === "In Stock" ? "bg-success" : "bg-danger"}`}>
  //         {value}
  //       </span>
  //     ),
  //   },
  //   {
  //     field: "Timeline",
  //     label: "Timeline",
  //     render: (value) => value || "N/A",
  //   },
  //   {
  //     field: "MktFeedback",
  //     label: "Mkt Feedback",
  //     render: (value) => value || "N/A",
  //   },
  //   {
  //     field: "DeliveredQuantity",
  //     label: "Delivered Qty",
  //     render: (value) => value || "0",
  //   },
  //   {
  //     field: "DeliveryDate",
  //     label: "Delivery Date",
  //     render: (value) => formatDate(value),
  //   },
  //   {
  //     field: "PlantLocation",
  //     label: "Plant Location",
  //     render: (value) => value || "N/A",
  //   },
  //   {
  //     field: "Price",
  //     label: "Price",
  //     render: (value, row) => formatCurrency(value, row.PriceCurrency),
  //   },
  //   {
  //     field: "PriceCurrency",
  //     label: "Currency",
  //     render: (value) => value || "N/A",
  //   },
  //   {
  //     field: "OpenAmount",
  //     label: "Open Amount",
  //     render: (value, row) => formatCurrency(value, row.PriceCurrency),
  //   },

  //   {
  //     field: "SalesEmployee",
  //     label: "Sales Employee",
  //     render: (value) => value || "N/A",
  //   },
  //   {
  //     field: "ContactPerson",
  //     label: "Contact Person",
  //     render: (value) => value || "N/A",
  //   },
  // ];


  const columns = [
  {
    field: "LineStatus",
    label: "Document Status",
    render: (value) => (
      <span className={`badge ${value === "Open" ? "bg-primary" : value === "Closed" ? "bg-secondary" : "bg-info"}`}>
        {value}
      </span>
    ),
  },
  {
    field: "DocumentNumber",
    label: "SO Number Date",
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
    label: "Customer/Vendor Name",
    render: (value) => truncateText(value, 20),
  },
  {
    field: "ContactPerson",
    label: "Contact Person",
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
    field: "UOMName",
    label: "PKZ",
    render: (value) => value || "N/A",
  },
  {
    field: "ItemName",
    label: "Item Name",
    render: (value) => truncateText(value, 25),
  },
  {
    field: "CasNo",
    label: "Cas No",
    render: (value) => value || "N/A",
  },
  {
    field: "Quantity",
    label: "Quantity Order",
    render: (value) => value || "0",
  },
  {
    field: "OpenQty",
    label: "Open Qty",
    render: (value) => value || "0",
  },
  {
    field: "DeliveredQuantity",
    label: "Delivered Quantity",
    render: (value) => value || "0",
  },
  {
    field: "StockStatus",
    label: "Stock Status-In hyd",
    render: (value) => (
      <span className={`badge ${value === "In Stock" ? "bg-success" : "bg-danger"}`}>
        {value}
      </span>
    ),
  },
  {
    field: "DeliveryDate",
    label: "Delivery Date",
    render: (value) => formatDate(value),
  },
  {
    field: "Timeline",
    label: "Timeline",
    render: (value) => value || "N/A",
  },
  {
    field: "MktFeedback",
    label: "Mkt_Feedback",
    render: (value) => value || "N/A",
  },
  {
    field: "Price",
    label: "Price",
    render: (value, row) => formatCurrency(value, row.PriceCurrency),
  },
  {
    field: "OpenAmount",
    label: "OPEN AMOUNT",
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
  
      const queryParams = new URLSearchParams({
        search: filterSearchTerm,
        status,
        sortField: filterSortField,
        sortDir: filterSortDirection,
        fromDate: filterFromDate || "",
        toDate: filterToDate || "",
        getAll: "true",
      });
  
      const response = await fetch(`/api/open-orders?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
  
      const { orders: filteredOrders } = await response.json();
  
      if (filteredOrders && filteredOrders.length > 0) {
        const formatDateLocal = (date) => {
          if (!date) return "NoDate";
          const [year, month, day] = date.split("-");
          return `${day}-${month}-${year}`;
        };
  
        const startDate = formatDateLocal(filterFromDate);
        const endDate = formatDateLocal(filterToDate);
        const fileName = `OpenOrders_${startDate}_to_${endDate}.xlsx`;
  
        // Convert data to match the column headers and sequence
        const excelData = filteredOrders.map((row) => {
          const formattedRow = {};
          columns.forEach((col) => {
            let value = row[col.field];
  
            // Format date fields to exclude timestamps
            if (["PostingDate", "PODate", "DeliveryDate"].includes(col.field)) {
              value = formatDate(value); // Use the existing formatDate utility
            } else if (typeof col.render === "function") {
              // Handle other rendered fields (e.g., badges, currency)
              value = col.render(value, row);
              // Clean up any HTML tags or components for Excel
              if (typeof value === "object" && value.props) {
                value = value.props.children || "N/A";
              }
            }
  
            formattedRow[col.label] = value ?? "N/A"; // Use nullish coalescing for cleaner fallback
          });
          return formattedRow;
        });
  
        downloadExcel(excelData, fileName);
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
          sortField={filterSortField}
          sortDirection={filterSortDirection}
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
        searchTerm={filterSearchTerm}
        statusFilter={{
          enabled: true,
          options: [
            { value: "inStock", label: "In Stock" },
            { value: "outOfStock", label: "Out of Stock" },
          ],
          value: statusFilter,
        }}
        fromDate={filterFromDate}
        toDate={filterToDate}
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
