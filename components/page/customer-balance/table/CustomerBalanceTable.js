//components/CustomerBalanceTable.js
import React from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import GenericTable from "components/GenericTable";
import TableFilters from "components/TableFilters";
import TablePagination from "components/TablePagination";
import { formatCurrency } from "utils/formatCurrency";
import Link from "next/link";
import { formatDate } from "utils/formatDate";
import usePagination from "hooks/usePagination";
import useTableFilters from "hooks/useFilteredData";
import downloadExcel from "utils/exportToExcel";

const CustBalanceTable = ({ balances, totalItems, isLoading = false}) => {
  const ITEMS_PER_PAGE = 20;
  console.log("inside table ",balances[0]);

  const { currentPage, totalPages, onPageChange } = usePagination(
    totalItems,
    ITEMS_PER_PAGE
  );
  const {
    searchTerm,
    sortField,
    sortDirection,
    handleSearch,
    handleDateFilterChange,
    handleSort,
    handleReset,
  } = useTableFilters();

  // const columns = [
  //   {
  //     field: "cardcode",
  //     label: " CardCode#",
  //     render: (value, row) => (
  //       <>
  //         <Link
  //           href={`/customers?d=${value}&e=${row.DocEntry}`}
  //           className="text-blue-600 hover:text-blue-800"
  //         >
  //           {value}
  //         </Link>
  //       </>
  //     ),
  //   },
  //   {
  //     field: "cardname",
  //     label: "Customer",
  //     render: (value) => value || "N/A",
  //   },
  //   {
  //     field: "Balance",
  //     label: "Balance",
  //     render: (value) => formatCurrency(value),
  //   },

  //   // {
  //   //   field: "duedate",
  //   //   label: "Due Date",
  //   //   render: (value) => formatDate(value),
  //   // },
  // ];

   const columns = [
    {
      field: "SO#",
      label: "SO#",
    },
    {
      field: "CardCode",
      label: "Card Code",
    },
    {
      field: "CardName",
      label: "Customer",
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
      field: "SO Date",
      label: "SO Date",
      render: (value) => formatDate(value),
    },
    {
      field: "Delivery#",
      label: "Delivery#",
    },
    {
      field: "Delivery Date",
      label: "Delivery Date",
      render: (value) => formatDate(value),
    },
    {
      field: "SO to Delivery Days",
      label: "SO to Delivery Days",
    },
    {
      field: "Invoice No.",
      label: "Invoice No.",
    },
    {
      field: "AR Invoice Date",
      label: "Invoice Date",
      render: (value) => formatDate(value),
    },
    // {
    //   field: "Invoice Total",
    //   label: "Invoice Total",
    //   render: (value) => formatCurrency(value),
    // },
    // {
    //   field: "BalanceDue",
    //   label: "Balance Due",
    //   render: (value) => formatCurrency(value),
    // },
    {
      field: "Overdue Days",
      label: "Overdue Days",
    },
    {
      field: "PymntGroup",
      label: "Payment Group",
    },
  ];

//   const handleExcelDownload = async () => {
//     try {
//       const response = await fetch(
//         `/api/excel/getAllInvoices?status=${statusFilter}&search=${searchTerm}&sortField=${sortField}&sortDir=${sortDirection}&fromDate=${
//           fromDate || ""
//         }&toDate=${toDate || ""}`
//       );
//       const filteredInvoices = await response.json();

//       if (filteredInvoices && filteredInvoices.length > 0) {
//         downloadExcel(filteredInvoices, `Invoices_${statusFilter}`);
//       } else {
//         alert("No data available to export.");
//       }
//     } catch (error) {
//       console.error("Failed to fetch data for Excel export:", error);
//       alert("Failed to export data. Please try again.");
//     }
//   };

  return (
    <Container fluid>
      {/* <TableFilters>
        searchConfig={{
          enabled: true,
          placeholder: "Search Customer...",
          fields: ["cardcode", "cardname"],
        }}
        onSearch={handleSearch}
        searchTerm={searchTerm}
        statusFilter={{
          enabled: false,
        }}
        fromDate={fromDate}
        toDate={toDate}
        onDateFilterChange={handleDateFilterChange}
        totalItems={totalItems}
        onReset={handleReset}
        totalItemsLabel="Total Customer Balances"
      </TableFilters> */}
      <TableFilters
        searchConfig={{
          enabled: true,
          placeholder: "Search Customer...",
          //   fields: ["cardcode", "cardname"],
          fields: ["CardCode", "CardName"],
        }}
        onSearch={handleSearch}
        searchTerm={searchTerm}
        statusFilter={{
          enabled: false,
        }}
        // fromDate={fromDate}
        // toDate={toDate}
        dateFilter={{ enabled: false }}
        onDateFilterChange={handleDateFilterChange}
        totalItems={totalItems}
        onReset={handleReset}
        totalItemsLabel="Total Customer Balances"
      />

      {isLoading ? (
        <div className="relative min-h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Spinner className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading ...</p>
          </div>
        </div>
      ) : (
        <>
          <GenericTable
            columns={columns}
            data={balances || []}
            onSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
            // onExcelDownload={handleExcelDownload} // Passing the function as a prop
          />
          {/* {balances.length === 0 && (
            <div className="text-center py-4">No Balances found.</div>
          )} */}
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

export default CustBalanceTable;
