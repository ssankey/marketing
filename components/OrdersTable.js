
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import { Printer } from "react-bootstrap-icons";
import GenericTable from "./GenericTable";
import TableFilters from "./TableFilters";
import TablePagination from "./TablePagination";
import usePagination from "hooks/usePagination";
import useTableFilters from "hooks/useFilteredData";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import { truncateText } from "utils/truncateText";

const OrdersTable = ({
  orders,
  totalItems,
  isLoading = false,
  onExcelDownload,
}) => {
  // 1) Local copy so we can patch a row
  const [tableData, setTableData] = useState(orders);

  // 2) Reset when parent prop changes
  useEffect(() => {
    setTableData(orders);
  }, [orders]);

  // Pagination & filters
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

  // 3) sendMail patches only the clicked row
  // const sendMail = async (row) => {
  //   try {
  //     const res = await fetch("/api/email/sendOrderEmail", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ docEntry: row.DocEntry, docNum: row.DocNum }),
  //     });
  //     const data = await res.json();
  //     if (!data.success) throw new Error(data.error);

  //     setTableData((prev) =>
  //       prev.map((r) =>
  //         r.DocEntry === row.DocEntry
  //           ? {
  //               ...r,
  //               EmailSentDT: data.EmailSentDT,
  //               EmailSentTM: data.EmailSentTM,
  //             }
  //           : r
  //       )
  //     );
  //   } catch (e) {
  //     console.error(e);
  //     alert("Failed to send email: " + e.message);
  //   }
  // };
  const sendMail = async (row) => {
    try {
      const res = await fetch("/api/email/sendOrderEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docEntry: row.DocEntry, docNum: row.DocNum }),
      });

      const data = await res.json();

      if (!data.success) {
        // Show alert with the specific message from the server
        alert(data.message || "Email sending failed.");
        return;
      }

      // If successful, update table data with sent timestamp
      setTableData((prev) =>
        prev.map((r) =>
          r.DocEntry === row.DocEntry
            ? {
                ...r,
                EmailSentDT: data.EmailSentDT,
                EmailSentTM: data.EmailSentTM,
              }
            : r
        )
      );

      // Optional: Show success message
      alert("Order confirmation email sent successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to send email: " + e.message);
    }
  };

  const columns = [
    {
      field: "DocNum",
      label: "Order#",
      render: (value, row) => (
        <Link href={`/orderdetails?d=${value}&e=${row.DocEntry}`}>{value}</Link>
      ),
    },
    {
      field: "DocStatus",
      label: "Order Status",
      render: (value) => {
        let cls = "bg-danger";
        if (value === "Open") cls = "bg-primary";
        if (value === "Partial") cls = "bg-warning";
        if (value === "Closed") cls = "bg-success";
        if (value === "Cancelled") cls = "bg-secondary";
        return <span className={`badge ${cls}`}>{value}</span>;
      },
    },
    {
      field: "CustomerPONo",
      label: "Customer PONo",
      render: (v) => v || "N/A",
    },
    {
      field: "CardName",
      label: "Customer",
      render: (v) => truncateText(v, 20),
    },
    {
      field: "DocDate",
      label: "Order Date",
      render: (v) => formatDate(v),
    },
    {
      field: "DeliveryDate",
      label: "Delivery Date",
      render: (v) => formatDate(v),
    },
    {
      field: "DocTotal",
      label: "Total Amount",
      render: (value, row) => {
        const amt = row.DocCur === "INR" ? value : value * row.ExchangeRate;
        return formatCurrency(amt);
      },
    },
    {
      field: "SalesEmployee",
      label: "Sales Employee",
      render: (v) => v || "N/A",
    },
    {
      field: "ContactPerson",
      label: "Contact Person",
      render: (v) => v || "N/A",
    },
    {
      field: "EmailSentDT",
      label: "Mail Sent",
      render: (_, row) => {
        if (row.EmailSentDT) {
          const dt = new Date(row.EmailSentDT);

          // Safely handle EmailSentTM or fallback to datetime object
          const hasTime =
            row.EmailSentTM !== null && row.EmailSentTM !== undefined;
          const h = hasTime ? Math.floor(row.EmailSentTM / 60) : dt.getHours();
          const m = hasTime ? row.EmailSentTM % 60 : dt.getMinutes();

          const day = String(dt.getDate()).padStart(2, "0");
          const month = String(dt.getMonth() + 1).padStart(2, "0"); // 0-based
          const year = dt.getFullYear();

          return (
            <>
              {`${day}/${month}/${year} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`}
            </>
          );
        }

        return (
          <button
            className="btn btn-sm btn-primary"
            onClick={() => sendMail(row)}
          >
            Send Mail
          </button>
        );
      },
    },
  ];

  return (
    <Container fluid>
      <TableFilters
        searchConfig={{
          enabled: true,
          placeholder: "Search orders…",
          fields: ["DocNum", "CardName", "NumAtCard", "CustomerPONo"],
        }}
        onSearch={handleSearch}
        searchTerm={searchTerm}
        statusFilter={{
          enabled: true,
          options: [
            { value: "Open", label: "Open" },
            { value: "Partial", label: "Partial" },
            { value: "Closed", label: "Closed" },
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
        totalItemsLabel="Total Orders"
      />

      {isLoading && tableData.length === 0 ? (
        <div className="flex justify-center p-8">
          <Spinner animation="border" />
        </div>
      ) : (
        <GenericTable
          columns={columns}
          data={tableData}
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
          onExcelDownload={onExcelDownload}
        />
      )}

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <Row className="mt-2">
        <Col className="text-center">
          Page {currentPage} of {totalPages}
        </Col>
      </Row>
    </Container>
  );
};

export default OrdersTable;
