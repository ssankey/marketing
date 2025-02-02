//components/OpenOrdersTable.js



import React from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import GenericTable from "./GenericTable";
import TableFilters from "./TableFilters";
import TablePagination from "./TablePagination";
import { formatCurrency } from "utils/formatCurrency";
import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { formatDate } from "utils/formatDate";
import usePagination from "hooks/usePagination";
import useTableFilters from "hooks/useFilteredData";
import { truncateText } from "utils/truncateText";
import downloadExcel from "utils/exporttoexcel";

const OpenOrdersTable = ({
  orders,
  totalItems,
  currentPage,
  isLoading = false,
}) => {
  const ITEMS_PER_PAGE = 20;

  const { totalPages, onPageChange } = usePagination(
    totalItems,
    ITEMS_PER_PAGE
  );

  const {
    searchTerm,
    fromDate,
    toDate,
    statusFilter,
    sortField,
    sortDirection,
    statusFilter,
    handleSearch,
    handleStatusChange,
    handleDateFilterChange,
    handleStatusChange,
    handleSort,
    handleReset,
  } = useTableFilters();

  
  
  // const handleExcelDownload = async () => {
  //   try {
  //     const constructedUrl = `/api/excel/getOpenOrders?status=${statusFilter}search=${searchTerm}&sortField=${sortField}&sortDir=${sortDirection}&fromDate=${
  //       fromDate || ""
  //     }&toDate=${toDate || ""}`;
  //     console.log("Constructed API URL:", constructedUrl);

  //     const response = await fetch(constructedUrl);

  //     if (!response.ok) {
  //       console.error("API Response Error:", response.statusText);
  //       throw new Error(`API request failed with status ${response.status}`);
  //     }

  //     const filteredOpenOrders = await response.json();
  //     console.log("Fetched Data:", filteredOpenOrders);

  //     if (filteredOpenOrders && filteredOpenOrders.length > 0) {

  //       const formatDate = (date) => {
  //         if (!date) return "NoDate";
  //         const [year, month, day] = date.split("-");
  //         return `${day}-${month}-${year}`;
  //       };

  //       const startDate = formatDate(fromDate);
  //       const endDate = formatDate(toDate);
  //       const fileName = `OpenOrders_${startDate}_to_${endDate}.xlsx`;

  //       downloadExcel(filteredOpenOrders, fileName);
  //     } else {
  //       alert("No data available to export.");
  //     }
  //   } catch (error) {
  //     console.error("Error during Excel export:", error.message);
  //     alert(`Failed to export data. Error: ${error.message}`);
  //   }
  // };


  const handleExcelDownload = async () => {
    try {

       // Get token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

      const url = `/api/excel/getOpenOrders?status=${statusFilter}&search=${searchTerm}&sortField=${sortField}&sortDir=${sortDirection}&fromDate=${
        fromDate || ""
      }&toDate=${toDate || ""}`;

      // const constructedUrl = `/api/excel/getOpenOrders?status=${statusFilter}&search=${searchTerm}&sortField=${sortField}&sortDir=${sortDirection}&fromDate=${
      //   fromDate || ""
      // }&toDate=${toDate || ""}`;
      // console.log("Constructed API URL:", constructedUrl);

      const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

      

      if (!response.ok) {
        console.error("API Response Error:", response.statusText);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const filteredOpenOrders = await response.json();
      console.log("Fetched Data:", filteredOpenOrders);

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
      console.error("Error during Excel export:", error.message);
      alert(`Failed to export data. Error: ${error.message}`);
    }
  };


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
      field: "DeliveryDate",
      label: "Delivery Date",
      render: (value) => formatDate(value),
    },
    {
      field: "ItemCode",
      label: "Item Code",
      render: (value) => value || "N/A",
    },
    {
      field: "ItemName",
      label: "Item Name",
      render: (value) => truncateText(value, 30),
    },
    {
      field: "OpenQty",
      label: "Open Quantity",
      render: (value) => value || "0",
    },
    {
      field: "Stock",
      label: "In Stock",
      render: (value) => value || "0",
    },
  
    {
      field: "TotalAmount",
      label: "Total Amount",
      render: (value, row) => {
        const amountInINR = row.DocCur === "INR" ? value : value * row.DocRate;
        return formatCurrency(amountInINR);
      },
    },
    {
      field: "SalesEmployee",
      label: "Sales Employee",
      render: (value) => value || "N/A",
    },
  ];

  return (
    <Container fluid>
      {/* Display Stock Status Counts */}
      <Row className="mb-3">
        <Col className="d-flex justify-content-start align-items-center">
          <Badge bg="success" className="me-2">
            In Stock: {inStockCount}
          </Badge>
          <Badge bg="danger">
            Out of Stock: {outOfStockCount}
          </Badge>
        </Col>
      </Row>

      {/* Table Filters */}
      <TableFilters
        searchConfig={{
          enabled: true,
          placeholder: "Search open orders...",
          fields: ["DocNum", "CardName"],
        }}
        onSearch={handleSearch}
        searchTerm={searchTerm}
        // statusFilter={{
        //   enabled: false, // Only open orders
        // }}
        statusFilter={{
          enabled: true,
          options: [
            // { value: "all", label: "All" },
            { value: "inStock", label: "In Stock" },
            { value: "outOfStock", label: "Out of Stock" },
          ],
          value: statusFilter,
          
        }}
        onStatusChange={handleStatusChange}
        fromDate={fromDate}
        toDate={toDate}
        onReset={handleReset}
        onStatusChange={handleStatusChange}
        onDateFilterChange={handleDateFilterChange}
        totalItems={totalItems}
        totalItemsLabel="Total Open Orders"
      />

      {/* Loading Spinner */}
      {isLoading ? (
        <div className="relative min-h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Spinner className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading open orders...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Generic Table */}
          <GenericTable
            columns={columns}
            data={orders || []}
            onSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
            onExcelDownload={handleExcelDownload}
          />

          {/* No Orders Found Message */}
          {orders.length === 0 && (
            <div className="text-center py-4">No open orders found.</div>
          )}
        </>
      )}

      {/* Pagination Controls */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      {/* Page Indicator */}
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
