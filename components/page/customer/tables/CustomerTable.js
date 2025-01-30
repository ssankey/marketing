import React from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import GenericTable from "components/tabel/GenericTable";
import TableFilters from "components/tabel/TableFilters";
import TablePagination from "components/tabel/TablePagination";
import Link from "next/link";
import usePagination from "hooks/usePagination";
import useTableFilters from "hooks/useFilteredData";
import downloadExcel from "utils/exportToExcel";

const CustomerTable = ({ customers, totalItems, isLoading = false }) => {
  const ITEMS_PER_PAGE = 20;
  const { currentPage, totalPages, onPageChange } = usePagination(
    totalItems,
    ITEMS_PER_PAGE
  );
  const { searchTerm, sortField, sortDirection, handleSearch, handleSort } =
    useTableFilters();

  const columns = [
    {
      field: "CustomerCode",
      label: "Customer Code",
      render: (value) => (
        <Link
          href={`/customers/${value}`}
          className="text-blue-600 hover:text-blue-800"
        >
          {value}
        </Link>
      ),
    },
    {
      field: "CustomerName",
      label: "Customer Name",
      render: (value) => value || "N/A",
    },
    {
      field: "Phone",
      label: "Phone Number",
      render: (value) => value || "N/A",
    },
    {
      field: "Email",
      label: "Email",
      render: (value) => value || "N/A",
    },
  ];
  // Define handleExcelDownload function
  // const handleExcelDownload = () => {
  //   downloadExcel(customers, "Customers");
  // };
  const handleExcelDownload = async () => {
    try {
      const response = await fetch("api/excel/getAllCustomers");
      const allCustomers = await response.json();
      if (allCustomers && allCustomers.length > 0) {
        downloadExcel(allCustomers, "Customers");
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
          placeholder: "Search customers...",
          fields: ["CustomerCode", "CustomerName", "Phone", "Email"],
        }}
        dateFilter={{ enabled: false }}
        onSearch={handleSearch}
        searchTerm={searchTerm}
        totalItems={totalItems}
        totalItemsLabel="Total Customers"
      />
      {isLoading ? (
        <div className="relative min-h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="text-gray-600 mt-2">Loading customers...</p>
          </div>
        </div>
      ) : (
        <>
          <GenericTable
            columns={columns}
            data={customers}
            onSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
            onExcelDownload={handleExcelDownload}
          />
          {customers.length === 0 && (
            <div className="text-center py-4">No customers found.</div>
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

export default CustomerTable;
