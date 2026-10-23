// components/CustomerCharts/outstandingtable.js
// Restyled onto the `.cd-` design system already defined in
// pages/customers/[id].js's PAGE_STYLES (the only page this component is
// ever rendered on) — same `.cd-table`/`.cd-table-card`/`.cd-pagination`
// classes the Addresses table on that same page already uses, instead of
// raw react-bootstrap `table table-striped table-bordered` + a hidden,
// non-functional `TableFilters` Reset button (it was being suppressed via
// a `display: none !important` CSS hack since nothing here ever wired up
// `onReset`). The Mail/Excel/filter-type controls already live in this
// section's own CollapsibleSection `controls` prop on the page, so nothing
// here duplicates them.
import React, { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { formatDate } from "utils/formatDate";
import { formatNumberWithIndianCommas } from "utils/formatNumberWithIndianCommas";

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
    numeric: true,
    render: (value) => formatNumberWithIndianCommas(value),
  },
  {
    field: "Balance Due",
    label: "Balance Due",
    numeric: true,
    render: (value) => formatNumberWithIndianCommas(value),
    style: (value) => ({ color: value > 0 ? "var(--bad)" : "var(--good)", fontWeight: 700 }),
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
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const [totalOutstandingAmount, setTotalOutstandingAmount] = useState(0);

  // Sorts the current page of rows client-side — this table is paginated
  // server-side (10 rows/page), so sorting is scoped to what's currently
  // loaded, same as clicking a column header in a spreadsheet's visible
  // range. Click a header to sort ascending; click again for descending.
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filteredData = React.useMemo(() => {
    if (!sortField) return customerOutstandings;
    const col = columns.find((c) => c.field === sortField);
    const arr = [...customerOutstandings];
    arr.sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      const cmp = col?.numeric
        ? (parseFloat(av) || 0) - (parseFloat(bv) || 0)
        : String(av ?? "").localeCompare(String(bv ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [customerOutstandings, sortField, sortDir]);

  // Fetch the total outstanding amount from all pages
  useEffect(() => {
    const fetchTotalOutstanding = async () => {
      try {
        const response = await fetch(
          `/api/customers/${customerCode}/outstanding?getAll=true&filterType=${filterType}`
        );

        if (response.ok) {
          const data = await response.json();
          const total = data.customerOutstandings.reduce((sum, item) => {
            const balanceDue = item["Balance Due"] || 0;
            return sum + balanceDue;
          }, 0);
          setTotalOutstandingAmount(
            formatNumberWithIndianCommas(Math.round(total * 100) / 100)
          );
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
    <div>
      <div className="cd-panel" style={{ marginBottom: 16, textAlign: "center" }}>
        <div className="cd-panel-title" style={{ marginBottom: 6 }}>Total Outstanding Amount</div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>
          ₹{totalOutstandingAmount}
        </div>
      </div>

      {isLoading ? (
        <div className="cd-empty">
          <Spinner animation="border" size="sm" />
        </div>
      ) : (
        <div className="cd-table-card">
          <div className="cd-table-scroll">
            <table className="cd-table">
              <thead>
                <tr>
                  <th className="cd-th-left">
                    <input type="checkbox" checked={isAllSelected} onChange={onSelectAll} />
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.field}
                      className={`${col.numeric ? "cd-th-right" : "cd-th-left"} cd-th-sortable`}
                      onClick={() => handleSort(col.field)}
                    >
                      {col.label}
                      <span className="cd-sort-arrow">{sortField === col.field ? (sortDir === "asc" ? "▲" : "▼") : ""}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData?.length > 0 ? (
                  filteredData.map((item, index) => (
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
                        const cellValue = col.render ? col.render(rawValue) : rawValue;
                        return (
                          <td
                            key={col.field}
                            className={col.numeric ? "cd-num" : ""}
                            style={col.style ? col.style(rawValue) : undefined}
                          >
                            {cellValue || ""}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length + 1} className="cd-empty" style={{ padding: "28px 0" }}>
                      No {filterType === "Payment Pending" ? "pending payments" : "completed payments"} found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="cd-pagination">
            <div className="cd-pagination-info">
              {totalItems === 0 ? "No records" : `Page ${currentPage} of ${totalPages} · ${totalItems} total`}
            </div>
            <div className="cd-pagination-controls">
              <button className="cd-page-btn" disabled={currentPage <= 1} onClick={() => onPageChange(1)}>First</button>
              <button className="cd-page-btn" disabled={currentPage <= 1} onClick={() => onPageChange(Math.max(1, currentPage - 1))}>Prev</button>
              <button className="cd-page-btn" disabled={currentPage >= totalPages} onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}>Next</button>
              <button className="cd-page-btn" disabled={currentPage >= totalPages} onClick={() => onPageChange(totalPages)}>Last</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOutstandingTable;
