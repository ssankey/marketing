// components/CustomersTable.js
import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import downloadExcel from "utils/exporttoexcel";

const PAGE_SIZE = 20;

// Same 8-region bucket set the backend computes from OCRD.State1 (see
// pages/api/customers/index.js's REGION_EXPR / lib/energySeal/regionMapping.js).
const REGION_OPTIONS = ["North", "South", "East", "West 1", "West 2", "Central", "Overseas", "Unknown"];

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  return Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
}

export default function CustomersTable() {
  const router = useRouter();
  const ITEMS_PER_PAGE = PAGE_SIZE;
  const DEBOUNCE_DELAY = 500;

  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Hydrate every filter/pagination value from the URL on mount (not hardcoded
  // defaults) so returning via the browser back button from a customer detail
  // page — or a hard refresh — lands back on the exact same page/search/sort/
  // filters instead of silently resetting.
  const [currentPage, setCurrentPage] = useState(() => parseInt(router.query.page, 10) || 1);
  const [sortField, setSortField] = useState(() => router.query.sortField || "CustomerName");
  const [sortDirection, setSortDirection] = useState(() => router.query.sortDir || "asc");
  const [searchTerm, setSearchTerm] = useState(() => router.query.search || "");
  const [searchInput, setSearchInput] = useState(() => router.query.search || "");
  const [status, setStatus] = useState(() => router.query.status || "all");
  const [salesPerson, setSalesPerson] = useState(() => router.query.salesPerson || "");
  const [region, setRegion] = useState(() => router.query.region || "");

  const [salespersons, setSalespersons] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Full-screen overlay shown the instant a customer row is clicked — the
  // detail page's own data fetch can take a few seconds, and without this
  // there's a blank gap where nothing visibly happens.
  const [isNavigating, setIsNavigating] = useState(false);
  useEffect(() => {
    const handleStart = (url) => {
      if (url.startsWith("/customers/") && url !== router.asPath) {
        setIsNavigating(true);
      }
    };
    const handleDone = () => setIsNavigating(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleDone);
    router.events.on("routeChangeError", handleDone);
    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleDone);
      router.events.off("routeChangeError", handleDone);
    };
  }, [router]);

  useEffect(() => {
    const fetchSalespersons = async () => {
      try {
        const res = await fetch("/api/unique/salespersons");
        if (!res.ok) throw new Error("Failed to fetch salespersons");
        const data = await res.json();
        setSalespersons(data.data || []);
      } catch (error) {
        console.error("Error fetching salespersons:", error);
        setSalespersons([]);
      }
    };
    fetchSalespersons();
  }, []);

  const fetchParams = useMemo(() => ({
    page: currentPage,
    itemsPerPage: ITEMS_PER_PAGE,
    search: searchTerm,
    status,
    salesPerson,
    region,
    sortField,
    sortDir: sortDirection,
  }), [currentPage, searchTerm, status, salesPerson, region, sortField, sortDirection]);

  const fetchCustomers = async (params = fetchParams) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setIsFetching(true);
      const query = new URLSearchParams(params);
      const res = await fetch(`/api/customers?${query.toString()}`, {
        signal: abortControllerRef.current.signal,
      });
      if (!res.ok) throw new Error("Failed to fetch customers");

      const data = await res.json();
      setCustomers(data.customers || []);
      setTotalItems(data.totalItems || 0);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error fetching customers:", error);
      setCustomers([]);
      setTotalItems(0);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchParams]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const pushQuery = (updates) => {
    const newQuery = { ...router.query, ...updates };
    Object.keys(newQuery).forEach((key) => {
      if (newQuery[key] === "" || newQuery[key] === "all" || newQuery[key] == null) {
        delete newQuery[key];
      }
    });
    router.replace({ pathname: "/customers", query: newQuery }, undefined, { shallow: true });
  };

  const handleSearchInput = (value) => {
    setSearchInput(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(value);
      setCurrentPage(1);
      pushQuery({ search: value || undefined, page: 1 });
    }, DEBOUNCE_DELAY);
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    setCurrentPage(1);
    pushQuery({ status: value, page: 1 });
  };

  const handleSalesPersonChange = (value) => {
    setSalesPerson(value);
    setCurrentPage(1);
    pushQuery({ salesPerson: value || undefined, page: 1 });
  };

  const handleRegionChange = (value) => {
    setRegion(value);
    setCurrentPage(1);
    pushQuery({ region: value || undefined, page: 1 });
  };

  const handleSortInternal = (field) => {
    let direction = "asc";
    if (sortField === field) {
      direction = sortDirection === "asc" ? "desc" : "asc";
    }
    setSortField(field);
    setSortDirection(direction);
    setCurrentPage(1);
    pushQuery({ sortField: field, sortDir: direction, page: 1 });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    pushQuery({ page });
  };

  const handleReset = () => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setSearchInput("");
    setSearchTerm("");
    setStatus("all");
    setSalesPerson("");
    setRegion("");
    setSortField("CustomerName");
    setSortDirection("asc");
    setCurrentPage(1);
    router.replace({ pathname: "/customers", query: { page: 1 } }, undefined, { shallow: true });
  };

  const handleExcelDownload = async () => {
    try {
      setIsExporting(true);
      const query = new URLSearchParams({
        search: searchTerm,
        status,
        salesPerson,
        region,
        sortField,
        sortDir: sortDirection,
        getAll: "true",
      });
      const res = await fetch(`/api/customers?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch data for Excel export");
      const data = await res.json();
      const customersForExport = data.customers || [];

      const formattedData = customersForExport.map((c) => ({
        "Customer Code": c.CustomerCode || "N/A",
        "Customer Name": c.CustomerName || "N/A",
        "City": c.City || "N/A",
        "State": c.State || "N/A",
        "Region": c.Region || "N/A",
        "Country": c.Country || "N/A",
        "Sales Employee": c.SalesEmployeeName || "N/A",
        "Phone": c.Phone || "N/A",
        "Email": c.Email || "N/A",
        "Balance": c.Balance || 0,
        "Credit Line": c.CreditLine || 0,
        "Currency": c.Currency || "N/A",
        "Status": c.IsActive ? "Active" : "Inactive",
      }));

      downloadExcel(formattedData, `Customers_${status}`);
    } catch (error) {
      console.error("Failed to fetch data for Excel export:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const rangeEnd = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  const SortHeader = ({ label, field, className }) => (
    <th className={className} onClick={() => handleSortInternal(field)} title="Click to sort">
      {label} {sortField === field ? (sortDirection === "asc" ? "▲" : "▼") : ""}
    </th>
  );

  return (
    <div className="ct">
      <style>{PAGE_STYLES}</style>

      {isNavigating && (
        <div className="ct-nav-overlay">
          <div className="ct-spinner" />
          <span>Loading customer…</span>
        </div>
      )}

      <div className="ct-card">
        <div className="ct-header">
          <h1>Customers</h1>
          <p className="ct-header-desc">Browse the full customer list — contacts, region, and sales ownership.</p>
        </div>

        <div className="ct-controls">
          <div className="ct-field" style={{ width: 280 }}>
            <label>Search</label>
            <input
              className="ct-input"
              type="text"
              style={{ width: "100%" }}
              placeholder="Code, name, city, state, sales employee…"
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
            />
          </div>

          <div className="ct-field">
            <label>Status</label>
            <div className="ct-mode-toggle">
              <button type="button" className={`ct-mode-btn ${status === "all" ? "active" : ""}`} onClick={() => handleStatusChange("all")}>All</button>
              <button type="button" className={`ct-mode-btn ${status === "active" ? "active" : ""}`} onClick={() => handleStatusChange("active")}>Active</button>
              <button type="button" className={`ct-mode-btn ${status === "inactive" ? "active" : ""}`} onClick={() => handleStatusChange("inactive")}>Inactive</button>
            </div>
          </div>

          <div className="ct-field" style={{ width: 190 }}>
            <label>Sales Employee</label>
            <select className="ct-input" style={{ width: "100%" }} value={salesPerson} onChange={(e) => handleSalesPersonChange(e.target.value)}>
              <option value="">All</option>
              {salespersons.map((s) => (
                <option key={s.SlpCode} value={s.SlpCode}>{s.SlpName}</option>
              ))}
            </select>
          </div>

          <div className="ct-field" style={{ width: 150 }}>
            <label>Region</label>
            <select className="ct-input" style={{ width: "100%" }} value={region} onChange={(e) => handleRegionChange(e.target.value)}>
              <option value="">All</option>
              {REGION_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="ct-field">
            <label>&nbsp;</label>
            <button type="button" className="ct-reset-btn" onClick={handleReset}>Reset</button>
          </div>

          <div className="ct-spacer" />

          <div className="ct-total-pill">Total Customers: {totalItems}</div>

          <div className="ct-field">
            <label>&nbsp;</label>
            <button className="ct-export-btn" onClick={handleExcelDownload} disabled={isExporting || !customers.length}>
              {isExporting ? "Exporting…" : "Export Excel"}
            </button>
          </div>
        </div>

        <div className="ct-table-card">
          {isFetching && !customers.length ? (
            <div className="ct-loading">
              <div className="ct-spinner" />
              <span>Loading customers…</span>
            </div>
          ) : !customers.length ? (
            <div className="ct-empty">No customers found.</div>
          ) : (
            <>
              <div className="ct-table-scroll">
                <table className="ct-table">
                  <thead>
                    <tr>
                      <SortHeader label="Customer Code" field="CustomerCode" className="ct-th-left ct-th-sticky" />
                      <SortHeader label="Customer Name" field="CustomerName" className="ct-th-left" />
                      <SortHeader label="City" field="City" className="ct-th-left" />
                      <SortHeader label="State" field="State" className="ct-th-left" />
                      <SortHeader label="Region" field="Region" className="ct-th-left" />
                      <SortHeader label="Country" field="Country" className="ct-th-left" />
                      <SortHeader label="Sales Employee" field="SalesEmployeeName" className="ct-th-left" />
                      <SortHeader label="Phone" field="Phone" className="ct-th-left" />
                      <SortHeader label="Email" field="Email" className="ct-th-left" />
                      <SortHeader label="Balance" field="Balance" className="ct-th-right" />
                      <th className="ct-th-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.CustomerCode}>
                        <td className="ct-td-sticky">
                          <Link href={`/customers/${c.CustomerCode}`} className="ct-catno">
                            {c.CustomerCode}
                          </Link>
                        </td>
                        <td className="ct-desc" title={c.CustomerName}>{c.CustomerName || "N/A"}</td>
                        <td>{c.City || <span className="ct-dash">N/A</span>}</td>
                        <td>{c.State || <span className="ct-dash">N/A</span>}</td>
                        <td>
                          <span className={`ct-badge ${c.Region && c.Region !== "Unknown" ? "good" : "bad"}`}>
                            {c.Region || "Unknown"}
                          </span>
                        </td>
                        <td>{c.Country || <span className="ct-dash">N/A</span>}</td>
                        <td>
                          <span className={`ct-badge ${c.SalesEmployeeName ? "good" : "bad"}`}>
                            {c.SalesEmployeeName || "Unassigned"}
                          </span>
                        </td>
                        <td className="ct-mono">{c.Phone || <span className="ct-dash">N/A</span>}</td>
                        <td>
                          {c.Email ? (
                            <a href={`mailto:${c.Email}`} className="ct-email-link">{c.Email}</a>
                          ) : (
                            <span className="ct-dash">N/A</span>
                          )}
                        </td>
                        <td className="ct-num">{Number(c.Balance || 0).toLocaleString("en-IN")}</td>
                        <td>
                          <span className={`ct-badge ${c.IsActive ? "good" : "bad"}`}>
                            {c.IsActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="ct-pagination">
                <div className="ct-pagination-info">
                  {totalItems === 0 ? "Showing 0 of 0" : `Showing ${rangeStart}–${rangeEnd} of ${totalItems}`}
                </div>
                <div className="ct-pagination-controls">
                  <button
                    className="ct-page-btn"
                    disabled={currentPage <= 1 || isFetching}
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  >
                    Prev
                  </button>
                  {getPageNumbers(currentPage, totalPages).map((p, idx, arr) => (
                    <span key={p} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="ct-page-ellipsis">…</span>}
                      <button
                        className={`ct-page-btn ${p === currentPage ? "active" : ""}`}
                        disabled={isFetching}
                        onClick={() => handlePageChange(p)}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                  <button
                    className="ct-page-btn"
                    disabled={currentPage >= totalPages || isFetching}
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

  .ct {
    --page-bg: #e4ebf1;
    --surface: #ffffff;
    --surface2: #e0edf9;
    --surface-green: #dcf3e8;
    --border: #c5d2dc;
    --text: #10151c;
    --muted: #52606d;
    --accent: #1f68bf;
    --good: #21875a;
    --bad: #c0402f;

    background: var(--page-bg);
    color: var(--text);
    font-family: 'IBM Plex Sans', sans-serif;
    min-height: 100vh;
    padding: 28px;
    position: relative;
  }

  .ct-nav-overlay {
    position: fixed;
    inset: 0;
    background: rgba(16, 21, 28, 0.35);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    z-index: 1000;
    color: #ffffff;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13.5px;
  }
  .ct-nav-overlay .ct-spinner {
    width: 32px;
    height: 32px;
    border-width: 3px;
    border-color: rgba(255,255,255,0.3);
    border-top-color: #ffffff;
  }

  .ct-card {
    width: 100%;
    max-width: 1600px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: 0 14px 34px rgba(31, 41, 55, 0.10), 0 2px 8px rgba(31, 41, 55, 0.06);
    padding: 28px 32px 32px;
    margin: 0 auto;
  }

  .ct-header { border-bottom: 1px solid var(--border); padding-bottom: 20px; margin-bottom: 20px; }
  .ct-header h1 { font-family: 'IBM Plex Mono', monospace; font-size: 24px; font-weight: 700; margin: 0 0 6px; }
  .ct-header-desc { font-size: 13.5px; color: var(--muted); margin: 0; }

  .ct-controls {
    position: sticky;
    top: 12px;
    z-index: 50;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px 18px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px 12px;
    align-items: flex-end;
    margin-bottom: 20px;
    box-shadow: 0 6px 16px rgba(31, 41, 55, 0.12);
  }

  .ct-field { display: flex; flex-direction: column; gap: 6px; position: relative; }
  .ct-field label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    font-weight: 600;
    color: var(--muted);
  }

  .ct-input {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 8px 10px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13.5px;
    color: var(--text);
    outline: none;
    transition: border-color 0.15s ease;
  }
  .ct-input:focus { border-color: var(--accent); }

  .ct-mode-toggle { display: flex; border: 1px solid var(--border); border-radius: 999px; overflow: hidden; }
  .ct-mode-btn {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11.5px;
    font-weight: 600;
    background: var(--surface);
    color: var(--muted);
    border: none;
    padding: 7px 10px;
    cursor: pointer;
    white-space: nowrap;
  }
  .ct-mode-btn.active { background: var(--accent); color: #ffffff; }

  .ct-reset-btn {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 8px 14px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
  }
  .ct-reset-btn:hover { background: var(--surface2); }

  .ct-spacer { flex: 1 1 auto; }

  .ct-total-pill { font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: var(--muted); align-self: center; }

  .ct-export-btn {
    background: var(--good);
    color: #ffffff;
    border: none;
    border-radius: 5px;
    padding: 8px 16px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
  .ct-export-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .ct-table-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }

  .ct-loading, .ct-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 60px 0;
    color: var(--muted);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
  }
  .ct-spinner {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    animation: ct-spin 0.8s linear infinite;
  }
  @keyframes ct-spin { to { transform: rotate(360deg); } }

  .ct-table-scroll { overflow-x: auto; }

  .ct-table { width: 100%; border-collapse: collapse; }
  .ct-table th {
    background: var(--surface2);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    color: var(--muted);
    border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--border);
    padding: 10px 12px;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
  }
  .ct-table th:last-child { border-right: none; }
  .ct-table th:hover { color: var(--text); }
  .ct-th-left { text-align: left; }
  .ct-th-right { text-align: right; }
  .ct-th-sticky { position: sticky; left: 0; z-index: 2; background: var(--surface2); }

  .ct-table td {
    padding: 11px 14px;
    font-size: 13px;
    border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--border);
    white-space: nowrap;
  }
  .ct-table td:last-child { border-right: none; }
  .ct-table tbody tr:last-child td { border-bottom: none; }
  .ct-table tbody tr:hover { background: var(--surface2); }
  .ct-td-sticky { position: sticky; left: 0; z-index: 1; background: var(--surface); }
  .ct-table tbody tr:hover .ct-td-sticky { background: var(--surface2); }
  .ct-num { text-align: right; font-family: 'IBM Plex Mono', monospace; }
  .ct-mono { font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; }
  .ct-desc {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 260px;
    cursor: help;
  }
  .ct-catno {
    color: var(--accent);
    font-weight: 600;
    font-family: 'IBM Plex Mono', monospace;
    text-decoration: none;
  }
  .ct-catno:hover { text-decoration: underline; }
  .ct-email-link { color: var(--accent); font-size: 12.5px; text-decoration: none; }
  .ct-email-link:hover { text-decoration: underline; }
  .ct-dash { color: var(--muted); }

  .ct-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 20px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    font-weight: 700;
  }
  .ct-badge.good { color: var(--good); background: var(--surface-green); }
  .ct-badge.bad { color: var(--bad); background: #fdecea; }

  .ct-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-top: 1px solid var(--border);
    flex-wrap: wrap;
    gap: 10px;
  }
  .ct-pagination-info { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--muted); }
  .ct-pagination-controls { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .ct-page-btn {
    background: var(--surface2);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 6px 11px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    cursor: pointer;
  }
  .ct-page-btn.active { background: var(--accent); color: #ffffff; border-color: var(--accent); font-weight: 700; }
  .ct-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .ct-page-ellipsis { color: var(--muted); font-family: 'IBM Plex Mono', monospace; font-size: 12px; }
`;
