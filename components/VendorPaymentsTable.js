import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import GenericTable from './GenericTable';
import TableFilters from './TableFilters';
import TablePagination from './TablePagination';
import { formatCurrency } from 'utils/formatCurrency';
import Link from 'next/link';
import { formatDate } from 'utils/formatDate';
import downloadExcel from "utils/exporttoexcel";
import { Eye } from 'react-bootstrap-icons';

const VendorPaymentsTable = ({ 
  vendorPayments, 
  totalItems, 
  isLoading = false, 
  status,
  onPageChange,
  onSearch,
  onStatusChange,
  onDateFilterChange,
  onSort,
  onReset
}) => {
  const ITEMS_PER_PAGE = 20;
  const [displayState, setDisplayState] = useState({
    hasData: false,
    showLoading: true
  });
  
  // Add ref for the table section
  const tableRef = useRef(null);
  
  // Track current filter values locally
  const [filterValues, setFilterValues] = useState({
    searchTerm: '',
    statusFilter: 'all',
    fromDate: '',
    toDate: '',
    sortField: 'AR Invoice Date',
    sortDirection: 'desc'
  });

  useEffect(() => {
    setDisplayState(prev => ({
      hasData: vendorPayments.length > 0,
      showLoading: isLoading && !prev.hasData
    }));
  }, [isLoading, vendorPayments]);

  // Handle filters - forward them to parent
  const handleSearch = (value) => {
    setFilterValues(prev => ({ ...prev, searchTerm: value }));
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleStatusChange = (value) => {
    setFilterValues(prev => ({ ...prev, statusFilter: value }));
    if (onStatusChange) {
      onStatusChange(value);
    }
  };

  const handleDateFilterChange = ({ fromDate, toDate }) => {
    setFilterValues(prev => ({ ...prev, fromDate, toDate }));
    if (onDateFilterChange) {
      onDateFilterChange({ fromDate, toDate });
    }
  };

  const handleSort = (field, direction) => {
    setFilterValues(prev => ({ 
      ...prev, 
      sortField: field, 
      sortDirection: direction 
    }));
    if (onSort) {
      onSort(field, direction);
    }
  };

  const handleReset = () => {
    const resetValues = {
      searchTerm: '',
      statusFilter: 'all',
      fromDate: '',
      toDate: '',
      sortField: 'AR Invoice Date',
      sortDirection: 'desc'
    };
    setFilterValues(resetValues);
    if (onReset) {
      onReset();
    }
  };

  // Define columns for vendor payments data
  const columns = [
    {
      field: "Customer/Vendor Code",
      label: "Vendor Code",
      render: (value) => value || "N/A",
    },
    {
      field: "Customer/Vendor Name",
      label: "Vendor Name",
      render: (value) => value || "N/A",
    },
    {
      field: "Invoice No.",
      label: "Invoice No.",
      render: (value) => value || "N/A",
    },
    {
      field: "AR Invoice Date",
      label: "Invoice Date",
      render: (value) => formatDate(value),
    },
    {
      field: "SO#",
      label: "SO Number",
      render: (value) => value || "N/A",
    },
    {
      field: "SO Date",
      label: "SO Date",
      render: (value) => formatDate(value),
    },
    {
      field: "Delivery Date",
      label: "Delivery Date",
      render: (value) => formatDate(value),
    },
    {
      field: "Invoice Total",
      label: "Invoice Total",
      render: (value) => formatCurrency(value),
    },
    {
      field: "BalanceDue",
      label: "Balance Due",
      render: (value) => formatCurrency(value),
    },
    {
      field: "Overdue Days",
      label: "Overdue Days",
      render: (value) => (
        <span className={`badge ${parseInt(value) > 0 ? 'bg-danger' : 'bg-success'}`}>
          {value || 0}
        </span>
      ),
    },
    {
      field: "Payment Terms Code",
      label: "Payment Terms",
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

      const { searchTerm, statusFilter, fromDate, toDate, sortField, sortDirection } = filterValues;
      const url = `/api/excel/getVendorPayments?status=${statusFilter}&search=${searchTerm}&sortField=${sortField}&sortDir=${sortDirection}&fromDate=${fromDate || ""}&toDate=${toDate || ""}`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const filteredPayments = await response.json();

      if (filteredPayments && filteredPayments.length > 0) {
        downloadExcel(filteredPayments, `VendorPayments_${statusFilter}`);
      } else {
        alert("No data available to export.");
      }
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
            <p className="text-gray-600">Loading vendor payments...</p>
          </div>
        </div>
      );
    }

    return (
      <>
        <GenericTable
          columns={columns}
          data={vendorPayments}
          onSort={handleSort}
          sortField={filterValues.sortField}
          sortDirection={filterValues.sortDirection}
          onExcelDownload={handleExcelDownload}
        />
        {!isLoading && vendorPayments.length === 0 && (
          <div className="text-center py-4">No vendor payments found.</div>
        )}
      </>
    );
  };

  // Prepare TableFilters props based on the way the component expects them
  const tableFilterProps = {
    searchConfig: {
      enabled: true,
      placeholder: "Search vendor payments...",
      fields: [
        "Customer/Vendor Code", 
        "Customer/Vendor Name", 
        "Invoice No.", 
        "SO#", 
        "BP Reference No.", 
        "Tracking Number",
        "Payment Terms Code"
      ],
    },
    onSearch: handleSearch,
    searchTerm: filterValues.searchTerm,
    statusFilter: {
      enabled: true,
      options: [
        { value: "all", label: "All" },
        { value: "30", label: "0-30 Days" },
        { value: "60", label: "31-60 Days" },
        { value: "90", label: "61-90 Days" },
        { value: "90+", label: "90+ Days" }
      ],
      value: filterValues.statusFilter,
      label: "Overdue Days",
    },
    onStatusChange: handleStatusChange,
    dateFilter: { enabled: true },
    fromDate: filterValues.fromDate,
    toDate: filterValues.toDate,
    onDateFilterChange: handleDateFilterChange,
    totalItems: totalItems,
    onReset: handleReset,
    totalItemsLabel: "Total Vendor Payments"
  };

  // Add pagination if needed
  // const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <Container fluid>
      <TableFilters {...tableFilterProps} />
      
      <div ref={tableRef}>
        {renderContent()}
      </div>
{/*       
      {totalPages > 1 && (
        <TablePagination
          currentPage={parseInt(filterValues.currentPage) || 1}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )} */}
    </Container>
  );
};

export default VendorPaymentsTable;