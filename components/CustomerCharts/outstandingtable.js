

import React, { useEffect, useState } from "react";
import { Container, Spinner } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import TablePagination from "components/TablePagination";
import TableFilters from "components/TableFilters";

const columns = [
  { field: "Invoice No.", label: "Invoice No." },
  {
    field: "AR Invoice Date",
    label: "Invoice Date",
    render: (value) => formatDate(value),
  },
  { field: "SO#", label: "SO#" },
  { field: "SO Date", label: "SO Date", render: (value) => formatDate(value) },
  { field: "Customer Name", label: "Customer Name" },
  { field: "Contact Person", label: "Contact Person" },
  { field: "CustomerPONo", label: "SO Customer Ref. No" },
  {
    field: "Invoice Total",
    label: "Invoice Total",
    render: (value) => formatCurrency(value),
  },
  {
    field: "Balance Due",
    label: "Balance Due",
    render: (value) => formatCurrency(value),
    className: (value) => (value > 0 ? "text-danger fw-bold" : "text-success"),
  },
  { field: "Country", label: "Country" },
  { field: "State", label: "State" },
  { field: "Overdue Days", label: "Overdue Days" },
  { field: "Payment Terms", label: "Payment Terms" },
  { field: "Tracking no", label: "Tracking no" },
  {
    field: "Dispatch Date",
    label: "Dispatch Date",
    render: (value) => formatDate(value),
  },
  { field: "SalesEmployee", label: "Sales Person" },
];

const CustomerOutstandingTable = ({
  customerOutstandings = [],
  totalItems = 0,
  isLoading = false,
  customerCode,
  onFilterChange,
  onExcelDownload,
  currentPage,
  onPageChange,
  itemsPerPage = 5,
  filterType,
  onFilterTypeChange,
  selectedRows = [],
  setSelectedRows,
  isAllSelected,
  onSelectAll,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const filteredData = customerOutstandings;
  const [totalOutstandingAmount, setTotalOutstandingAmount] = useState(0);

  // Fetch the total outstanding amount from all pages
  useEffect(() => {
    const fetchTotalOutstanding = async () => {
      try {
        // Get all records (not paginated) to calculate the total
        const response = await fetch(
          `/api/customers/${customerCode}/outstanding?getAll=true&filterType=${filterType}`
        );

        if (response.ok) {
          const data = await response.json();

          // Calculate the total outstanding amount from all records
          const total = data.customerOutstandings.reduce((sum, item) => {
            const balanceDue = item["Balance Due"] || 0;
            return sum + balanceDue;
          }, 0);

          setTotalOutstandingAmount(total);
        }
      } catch (error) {
        console.error("Error fetching total outstanding amount:", error);
      }
    };

    if (customerCode) {
      fetchTotalOutstanding();
    }
  }, [customerCode, filterType]);

  const toggleRow = (invoiceNo) => {
    setSelectedRows((prev) =>
      prev.includes(invoiceNo)
        ? prev.filter((id) => id !== invoiceNo)
        : [...prev, invoiceNo]
    );
  };

  return (
    <Container fluid id="customer-outstanding-filters">
      <TableFilters
        onExcelDownload={onExcelDownload}
        totalItems={totalItems}
        totalItemsLabel="Total"
        dateFilter={{ enabled: false }}
        searchConfig={{ enabled: false }}
        onReset={undefined}
      />

      <style jsx global>{`
        #customer-outstanding-filters .btn-outline-secondary {
          display: none !important;
        }
      `}</style>

      <div className="px-3 py-2">
        <div className="card border-0 bg-light shadow-sm">
          <div className="card-body p-2 text-center">
            <h6 className="text-muted mb-1">Total Outstanding Amount</h6>
            <h4 className="mb-0 text-primary fw-bold">
              {formatCurrency(totalOutstandingAmount)}
            </h4>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={onSelectAll}
                  />
                </th>
                {columns.map((col) => (
                  <th key={col.field}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData?.length > 0 ? (
                filteredData.map((item, index) => {
                  // Calculate the displayed value for each row
                  const balanceDue = item["Balance Due"] || 0;
                  const displayedBalanceDue =
                    Math.round(balanceDue * 100) / 100;

                  return (
                    <tr key={index}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(item["Invoice No."])}
                          onChange={() => toggleRow(item["Invoice No."])}
                        />
                      </td>
                      {columns.map((col) => {
                        const rawValue = item[col.field];
                        let cellValue = rawValue;

                        if (col.field === "Balance Due") {
                          cellValue = formatCurrency(displayedBalanceDue);
                        } else if (col.render) {
                          cellValue = col.render(rawValue);
                        }

                        const cellClass = col.className
                          ? col.className(rawValue)
                          : "";

                        return (
                          <td key={col.field} className={cellClass}>
                            {cellValue || ""}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center">
                    No{" "}
                    {filterType === "Payment Pending"
                      ? "pending payments"
                      : "completed payments"}{" "}
                    found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </Container>
  );
};

export default CustomerOutstandingTable;