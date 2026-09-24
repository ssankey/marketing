import React, { useState, useRef } from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import GenericTable from "components/GenericTable";
import TableFilters from "components/TableFilters";
import TablePagination from "components/TablePagination";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";

const CustomerBalanceTable = ({
  balances,
  totalItems,
  isLoading = false,
  currentPage,
  totalPages,
  onPageChange,
  onSearch,
  onStatusChange,
  onDateFilterChange,
  onSort,
  onReset,
  onExcelDownload,
}) => {
  const ITEMS_PER_PAGE = 20;

  // Local state for filter values
  const [filterValues, setFilterValues] = useState({
    searchTerm: "",
    status: "all",
    fromDate: "",
    toDate: "",
    sortField: "SO Date",
    sortDirection: "desc",
  });

  const tableRef = useRef(null);

  const columns = [
    {
      field: "Invoice No.",
      label: "Inv No.",
    },
    {
      field: "AR Invoice Date", // Assuming this is the AR Invoice Number
      // ; adjust if you have a specific field
      label: "AR Invoice Date",
      render: (value) => formatDate(value), // Adjust if this is a number, not a date
    },
    {
      field: "SO#",
      label: "SO#",
    },
    {
      field: "SO Date",
      label: "SO Date",
      render: (value) => formatDate(value),
    },
    {
      field: "Customer Name",
      label: "Customer/Vendor Name",
    },
    {
      field: "Contact Person",
      label: "Contact Person",
    },
    {
      field: "BP Reference No.",
      label: "Customer Ref no",
    },

    // {
    //   field: "BP Reference No.",
    //   label: "Customer Ref no",
    // },
    {
      field: "Invoice Total",
      label: "Invoice Total",
      render: (value) => formatCurrency(value),
    },

    {
      field: "Balance Due",
      label: "Balance Due",
      render: (value) => formatCurrency(value),
    },
    {
      field: "Country",
      label: "Country",
    },
    {
      field: "State",
      label: "State",
    },
    {
      field: "Overdue Days",
      label: "Overdue Days",
    },
    {
      field: "Payment Terms",
      label: "Payment Group",
    },
    {
      field: "TrackingNo", // New field; ensure it exists in data
      label: "Tracking no",
      render: (value) => value || "N/A",
    },
    {
      field: "Dispatch Date",
      label: "Dispatch Date",
      render: (value) => formatDate(value),
    },
    {
      field: "AirlineName", // New field; ensure it exists in data
      label: "Airline Name",
      render: (value) => value || "N/A",
    },

    // {
    //   field: "Delivery Date",
    //   label: "Delivery Date",
    //   render: (value) => formatDate(value),
    // },

    // {
    //   field: "SOToDeliveryDays", // New field; ensure it exists in data
    //   label: "so to Delivery Days",
    //   render: (value) => value || "N/A",
    // },

    {
      field: "Sales Person",
      label: "Sales Person",
    },
  ];

  const statusOptions = [
    { value: "30", label: "Overdue 0-30 days" },
    { value: "60", label: "Overdue 31-60 days" },
    { value: "90", label: "Overdue 61-90 days" },
    { value: "90+", label: "Overdue 90+ days" },
  ];

  // Handle search with debounce
  const handleSearch = (term) => {
    setFilterValues((prev) => ({ ...prev, searchTerm: term }));
    if (onSearch) {
      onSearch(term);
    }
  };

  const handleStatusChange = (status) => {
    setFilterValues((prev) => ({ ...prev, status }));
    if (onStatusChange) {
      onStatusChange(status);
    }
  };

  const handleDateFilterChange = ({ fromDate, toDate }) => {
    setFilterValues((prev) => ({ ...prev, fromDate, toDate }));
    if (onDateFilterChange) {
      onDateFilterChange({ fromDate, toDate });
    }
  };

  const handleSort = (field, direction) => {
    setFilterValues((prev) => ({ ...prev, sortField: field, sortDirection: direction }));
    if (onSort) {
      onSort(field, direction);
    }
  };

  const handleReset = () => {
    const resetValues = {
      searchTerm: "",
      status: "all",
      fromDate: "",
      toDate: "",
      sortField: "SO Date",
      sortDirection: "desc",
    };
    setFilterValues(resetValues);
    if (onReset) {
      onReset();
    }
  };

  return (
    <Container fluid>
      <TableFilters
        searchConfig={{
          enabled: true,
          placeholder: "Search by customer name, code or SO#...",
          value: filterValues.searchTerm,
        }}
        searchTerm={filterValues.searchTerm}
        onSearch={handleSearch}
        statusFilter={{
          enabled: true,
          options: statusOptions,
          value: filterValues.status,
          label: "Overdue Status",
        }}
        onStatusChange={handleStatusChange}
        dateFilter={{
          enabled: true,
          fromDate: filterValues.fromDate,
          toDate: filterValues.toDate,
          label: "SO Date Range",
        }}
        onDateFilterChange={handleDateFilterChange}
        totalItems={totalItems}
        onReset={handleReset}
        totalItemsLabel="Total Customer Orders"
      />

      <div ref={tableRef}>
        {isLoading ? (
          <div className="relative min-h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Spinner className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading customer data...</p>
            </div>
          </div>
        ) : (
          <>
            <GenericTable
              columns={columns}
              data={balances || []}
              onSort={handleSort}
              sortField={filterValues.sortField}
              sortDirection={filterValues.sortDirection}
              onExcelDownload={onExcelDownload}
            />
            {balances.length === 0 && (
              <div className="text-center py-4">No customer orders found.</div>
            )}
          </>
        )}
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <Row className="mb-2">
        <Col className="text-center">
          <h5>
            Page {currentPage} of {totalPages || 1}
          </h5>
        </Col>
      </Row>
    </Container>
  );
};

export default CustomerBalanceTable;