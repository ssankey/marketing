// components/CustomerCharts/LifecycleDrilldownModal.js
// Click-through drill-down for the Order Fulfillment Lifecycle chart/table
// (components/CustomerCharts/ordertodelievery.js) — shows the underlying
// rows behind whichever (month, bucket) cell was clicked. `rows` is already
// filtered client-side from the one raw-row array the parent fetched, so
// this never makes its own network call.
//
// Same robust modal layout just established for the Outstanding Vendor
// invoice modal (components/page/top-outstanding/TopOutstandingVendorPage.js's
// InvoiceModal): a genuinely wide dialog, a table region that scrolls
// independently in both directions with forced min-width + visible
// scrollbars, and a pagination footer that's always rendered (not gated on
// row count) and pinned below the scroll area rather than buried inside a
// vertically-scrolling modal body. Styled with this page's `.cd-` tokens
// (not the `.ot-` ones, since this lives on the customer detail page) but
// the CSS structure is copied, not reinvented.
import { useState, useMemo } from "react";
import { Modal } from "react-bootstrap";
import downloadExcel from "utils/exporttoexcel";

const ITEMS_PER_PAGE = 20;

export default function LifecycleDrilldownModal({ show, onClose, title, subtitle, rows = [], columns = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => String(row[col.key] ?? "").toLowerCase().includes(term))
    );
  }, [rows, columns, searchTerm]);

  // Click a header to sort by it ascending; click again for descending. Only
  // meaningful for numeric columns in practice (amounts, counts), but works
  // generically — text columns sort alphabetically.
  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;
    const col = columns.find((c) => c.key === sortKey);
    const arr = [...filteredRows];
    arr.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = col?.numeric
        ? (parseFloat(av) || 0) - (parseFloat(bv) || 0)
        : String(av ?? "").localeCompare(String(bv ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filteredRows, sortKey, sortDir, columns]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / ITEMS_PER_PAGE));
  const displayRows = sortedRows.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0);
  };

  const handleExport = () => {
    const exportData = sortedRows.map((row) => {
      const out = {};
      columns.forEach((col) => { out[col.header] = row[col.key] ?? ""; });
      return out;
    });
    downloadExcel(exportData, `lifecycle_drilldown_${Date.now()}`);
  };

  if (!show) return null;

  return (
    <Modal show onHide={onClose} centered size="xl" dialogClassName="ldm-modal">
      <div className="ldm">
        <style>{LDM_STYLES}</style>
        <Modal.Header closeButton>
          <Modal.Title as="div">
            <div className="ldm-title">{title}</div>
            {subtitle && <div className="ldm-subtitle">{subtitle}</div>}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="ldm-body">
          <div className="ldm-filters">
            <input
              className="ldm-input"
              type="text"
              placeholder="Search…"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <button className="ldm-export-btn" onClick={handleExport} disabled={filteredRows.length === 0} type="button">
              Export Excel
            </button>
            <div className="ldm-total-pill">{filteredRows.length} record{filteredRows.length !== 1 ? "s" : ""}</div>
          </div>

          <div className="ldm-table-region">
            <div className="ldm-table-scroll">
              <table className="ldm-table">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className={`${col.numeric ? "ldm-th-right" : "ldm-th-left"} ldm-th-sortable`}
                        onClick={() => handleSort(col.key)}
                      >
                        {col.header}
                        <span className="ldm-sort-arrow">{sortKey === col.key ? (sortDir === "asc" ? "▲" : "▼") : ""}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.length > 0 ? (
                    displayRows.map((row, i) => (
                      <tr key={i}>
                        {columns.map((col) => (
                          <td key={col.key} className={col.numeric ? "ldm-num" : ""}>
                            {col.render ? col.render(row[col.key], row) : (row[col.key] ?? <span className="ldm-dash">N/A</span>)}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} style={{ textAlign: "center", padding: 40 }}>No records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="ldm-pagination">
              <div className="ldm-pagination-info">
                {filteredRows.length === 0
                  ? "No records"
                  : `Showing ${currentPage * ITEMS_PER_PAGE + 1}–${Math.min((currentPage + 1) * ITEMS_PER_PAGE, filteredRows.length)} of ${filteredRows.length}`}
              </div>
              <div className="ldm-pagination-controls">
                <button className="ldm-page-btn" disabled={currentPage === 0} onClick={() => setCurrentPage(0)}>First</button>
                <button className="ldm-page-btn" disabled={currentPage === 0} onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}>Prev</button>
                <span className="ldm-pagination-info">Page {currentPage + 1} of {totalPages}</span>
                <button className="ldm-page-btn" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}>Next</button>
                <button className="ldm-page-btn" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(totalPages - 1)}>Last</button>
              </div>
            </div>
          </div>
        </Modal.Body>
      </div>
    </Modal>
  );
}

const LDM_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

  .ldm {
    --surface: #ffffff;
    --surface2: #e0edf9;
    --border: #c5d2dc;
    --text: #10151c;
    --muted: #52606d;
    --accent: #1f68bf;
    --good: #21875a;
    font-family: 'IBM Plex Sans', sans-serif;
    color: var(--text);
  }
  .ldm-title { font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-size: 16px; }
  .ldm-subtitle { font-size: 12.5px; color: var(--muted); margin-top: 2px; }

  .ldm-modal { max-width: 96vw; width: 96vw; }
  .ldm-body { display: flex; flex-direction: column; max-height: 76vh; }
  .ldm-filters {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    padding: 12px 0 16px; border-bottom: 1px solid var(--border); margin-bottom: 12px;
  }
  .ldm-input {
    background: var(--surface); border: 1px solid var(--border); border-radius: 5px;
    padding: 8px 10px; font-family: 'IBM Plex Mono', monospace; font-size: 13.5px;
    color: var(--text); outline: none; width: 240px;
  }
  .ldm-input:focus { border-color: var(--accent); }
  .ldm-export-btn {
    background: var(--good); color: #ffffff; border: none; border-radius: 5px;
    padding: 8px 16px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;
    font-weight: 600; cursor: pointer; white-space: nowrap;
  }
  .ldm-export-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .ldm-total-pill { font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: var(--muted); align-self: center; }

  .ldm-table-region {
    display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0;
    background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden;
  }
  .ldm-table-scroll {
    flex: 1 1 auto; min-height: 0; overflow: auto;
    scrollbar-width: auto; scrollbar-color: var(--muted) var(--surface2);
  }
  .ldm-table-scroll::-webkit-scrollbar { width: 12px; height: 12px; }
  .ldm-table-scroll::-webkit-scrollbar-track { background: var(--surface2); }
  .ldm-table-scroll::-webkit-scrollbar-thumb { background: var(--muted); border-radius: 6px; border: 3px solid var(--surface2); }
  .ldm-table-scroll::-webkit-scrollbar-thumb:hover { background: var(--text); }

  .ldm-table { width: 100%; min-width: 900px; border-collapse: collapse; font-size: 13px; }
  .ldm-table th {
    background: var(--surface2); font-family: 'IBM Plex Mono', monospace; font-size: 10.5px;
    text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; color: var(--muted);
    border-bottom: 1px solid var(--border); border-right: 1px solid var(--border);
    padding: 10px 12px; white-space: nowrap; position: sticky; top: 0; z-index: 1;
  }
  .ldm-table th:last-child { border-right: none; }
  .ldm-th-left { text-align: left; }
  .ldm-th-right { text-align: right; }
  .ldm-th-sortable { cursor: pointer; user-select: none; }
  .ldm-th-sortable:hover { color: var(--text); }
  .ldm-sort-arrow { display: inline-block; margin-left: 4px; font-size: 9px; color: var(--accent); }
  .ldm-table td {
    padding: 10px 14px; font-size: 13px; border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--border); white-space: nowrap;
  }
  .ldm-table td:last-child { border-right: none; }
  .ldm-table tbody tr:last-child td { border-bottom: none; }
  .ldm-table tbody tr:hover { background: var(--surface2); }
  .ldm-num { text-align: right; font-family: 'IBM Plex Mono', monospace; }
  .ldm-dash { color: var(--muted); }

  .ldm-pagination {
    flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; border-top: 1px solid var(--border); background: var(--surface2);
    flex-wrap: wrap; gap: 10px;
  }
  .ldm-pagination-info { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--muted); }
  .ldm-pagination-controls { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .ldm-page-btn {
    background: var(--surface); color: var(--text); border: 1px solid var(--border); border-radius: 5px;
    padding: 6px 11px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; cursor: pointer;
  }
  .ldm-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
`;
