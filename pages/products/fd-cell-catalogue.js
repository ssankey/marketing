// pages/products/fd-cell-catalogue.js
import { useState, useEffect, useMemo } from "react";
import downloadExcel from "utils/exporttoexcel";

const PAGE_SIZE = 20;

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  return Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
}

export default function FdCellCatalogue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | found | notFound
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token") || document.cookie.match(/token=([^;]+)/)?.[1];
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch("/api/products/fd-cell-catalogue", { headers });
        if (!res.ok) throw new Error("Failed to fetch FD Cell Catalogue data");
        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        console.error("Error fetching FD Cell Catalogue:", err);
        setError(err.message || "Failed to load FD Cell Catalogue data");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    const term = searchInput.trim().toLowerCase();
    let rows = items;

    if (statusFilter === "found") rows = rows.filter((r) => r.foundInSap);
    else if (statusFilter === "notFound") rows = rows.filter((r) => !r.foundInSap);

    if (term) {
      rows = rows.filter(
        (r) =>
          (r.ItemCode || "").toLowerCase().includes(term) ||
          (r.ItemName || "").toLowerCase().includes(term) ||
          (r.U_CasNo || "").toLowerCase().includes(term)
      );
    }

    return rows;
  }, [items, searchInput, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchInput, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const visibleItems = filteredItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const rangeStart = filteredItems.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filteredItems.length);

  const foundCount = items.filter((r) => r.foundInSap).length;
  const notFoundCount = items.length - foundCount;

  const handleExport = () => {
    if (!filteredItems.length) return;
    setIsExporting(true);
    try {
      const data = filteredItems.map((r) => ({
        "Cat No": r.ItemCode,
        "Item Name": r.ItemName || "N/A",
        "CAS No": r.U_CasNo || "N/A",
        Category: r.Category || "N/A",
        Status: r.foundInSap ? "Found" : "Not Found",
        Stock: r.foundInSap ? r.OnHand : "-",
        "Price (₹)": r.foundInSap ? r.WebPrice : "-",
        "Units Sold": r.foundInSap ? r.UnitsSold : "-",
        "No. of Customers": r.foundInSap ? r.NumberOfCustomers : "-",
      }));
      downloadExcel(data, "FD_Cell_Catalogue");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fc">
      <style>{PAGE_STYLES}</style>

      <div className="fc-card">
        <div className="fc-header">
          <h1>FD Cell Catalogue</h1>
          <p className="fc-header-desc">
            Fixed catalogue of {items.length} Cat Nos, checked live against SAP for stock, price, and sales.
          </p>
        </div>

        <div className="fc-controls">
          <div className="fc-field" style={{ width: 320 }}>
            <label>Search</label>
            <input
              className="fc-input"
              style={{ width: "100%" }}
              type="text"
              placeholder="Cat No, Item Name, or CAS No…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="fc-field">
            <label>Status</label>
            <div className="fc-mode-toggle">
              <button type="button" className={`fc-mode-btn ${statusFilter === "all" ? "active" : ""}`} onClick={() => setStatusFilter("all")}>
                All
              </button>
              <button type="button" className={`fc-mode-btn ${statusFilter === "found" ? "active" : ""}`} onClick={() => setStatusFilter("found")}>
                Found in SAP
              </button>
              <button type="button" className={`fc-mode-btn ${statusFilter === "notFound" ? "active" : ""}`} onClick={() => setStatusFilter("notFound")}>
                Not Found
              </button>
            </div>
          </div>

          <div className="fc-spacer" />

          <div className="fc-total-pill">
            {foundCount} found · {notFoundCount} not found · {items.length} total
          </div>

          <div className="fc-field">
            <label>&nbsp;</label>
            <button className="fc-export-btn" onClick={handleExport} disabled={isExporting || !filteredItems.length}>
              {isExporting ? "Exporting…" : "Export Excel"}
            </button>
          </div>
        </div>

        {error && <div className="fc-error">{error}</div>}

        <div className="fc-table-card">
          {loading ? (
            <div className="fc-loading">
              <div className="fc-spinner" />
              <span>Loading catalogue…</span>
            </div>
          ) : !visibleItems.length ? (
            <div className="fc-empty">No matching Cat Nos.</div>
          ) : (
            <>
              <div className="fc-table-scroll">
                <table className="fc-table">
                  <thead>
                    <tr>
                      <th className="fc-th-left">Cat No.</th>
                      <th className="fc-th-left">Item Name</th>
                      <th className="fc-th-left">CAS No.</th>
                      <th className="fc-th-left">Category</th>
                      <th className="fc-th-left">Status</th>
                      <th className="fc-th-right">Stock</th>
                      <th className="fc-th-right">Price (₹)</th>
                      <th className="fc-th-right">Units Sold</th>
                      <th className="fc-th-right">No. of Customers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleItems.map((row) => (
                      <tr key={row.ItemCode}>
                        <td className="fc-catno">{row.ItemCode}</td>
                        <td className="fc-desc" title={row.ItemName || ""}>{row.ItemName || <span className="fc-dash">—</span>}</td>
                        <td>{row.U_CasNo || <span className="fc-dash">—</span>}</td>
                        <td>{row.Category || <span className="fc-dash">—</span>}</td>
                        <td>
                          <span className={`fc-badge ${row.foundInSap ? "good" : "bad"}`}>
                            {row.foundInSap ? "Found" : "Not Found"}
                          </span>
                        </td>
                        <td className="fc-num">{row.foundInSap ? row.OnHand : <span className="fc-dash">-</span>}</td>
                        <td className="fc-num">{row.foundInSap ? Number(row.WebPrice).toLocaleString("en-IN") : <span className="fc-dash">-</span>}</td>
                        <td className="fc-num">{row.foundInSap ? row.UnitsSold : <span className="fc-dash">-</span>}</td>
                        <td className="fc-num">{row.foundInSap ? row.NumberOfCustomers : <span className="fc-dash">-</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="fc-pagination">
                <div className="fc-pagination-info">
                  {filteredItems.length === 0 ? "Showing 0 of 0" : `Showing ${rangeStart}–${rangeEnd} of ${filteredItems.length}`}
                </div>
                <div className="fc-pagination-controls">
                  <button className="fc-page-btn" disabled={safePage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Prev</button>
                  {getPageNumbers(safePage, totalPages).map((p, idx, arr) => (
                    <span key={p} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="fc-page-ellipsis">…</span>}
                      <button className={`fc-page-btn ${p === safePage ? "active" : ""}`} onClick={() => setCurrentPage(p)}>{p}</button>
                    </span>
                  ))}
                  <button className="fc-page-btn" disabled={safePage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

FdCellCatalogue.seo = {
  title: "FD Cell Catalogue | Density",
  description: "Fixed FD Cell catalogue checked live against SAP.",
  keywords: "fd cell, catalogue, products, density",
};

const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

  .fc {
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
  }

  .fc-card {
    width: 100%;
    max-width: 1500px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: 0 14px 34px rgba(31, 41, 55, 0.10), 0 2px 8px rgba(31, 41, 55, 0.06);
    padding: 24px 32px 32px;
    margin: 0 auto;
  }

  .fc-header { border-bottom: 1px solid var(--border); padding-bottom: 18px; margin-bottom: 20px; }
  .fc-header h1 { font-family: 'IBM Plex Mono', monospace; font-size: 24px; font-weight: 700; margin: 0 0 6px; }
  .fc-header-desc { font-size: 13.5px; color: var(--muted); margin: 0; }

  .fc-controls {
    position: sticky;
    top: 12px;
    z-index: 50;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 18px 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    align-items: flex-end;
    margin-bottom: 20px;
    box-shadow: 0 6px 16px rgba(31, 41, 55, 0.12);
  }

  .fc-field { display: flex; flex-direction: column; gap: 6px; }
  .fc-field label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    font-weight: 600;
    color: var(--muted);
  }

  .fc-input {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 8px 10px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13.5px;
    color: var(--text);
    outline: none;
  }
  .fc-input:focus { border-color: var(--accent); }

  .fc-mode-toggle { display: flex; border: 1px solid var(--border); border-radius: 999px; overflow: hidden; }
  .fc-mode-btn {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    background: var(--surface);
    color: var(--muted);
    border: none;
    padding: 8px 14px;
    cursor: pointer;
    white-space: nowrap;
  }
  .fc-mode-btn.active { background: var(--accent); color: #ffffff; }

  .fc-spacer { flex: 1 1 auto; }

  .fc-total-pill {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12.5px;
    color: var(--muted);
    align-self: center;
    white-space: nowrap;
  }

  .fc-export-btn {
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
  .fc-export-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .fc-error {
    background: #fdecea;
    border: 1px solid var(--bad);
    color: var(--bad);
    border-radius: 6px;
    padding: 10px 14px;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .fc-table-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }

  .fc-loading, .fc-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 60px 0;
    color: var(--muted);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
  }
  .fc-spinner {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    animation: fc-spin 0.8s linear infinite;
  }
  @keyframes fc-spin { to { transform: rotate(360deg); } }

  .fc-table-scroll { overflow-x: auto; }
  .fc-table { width: 100%; border-collapse: collapse; }
  .fc-table th {
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
  }
  .fc-table th:last-child { border-right: none; }
  .fc-th-left { text-align: left; }
  .fc-th-right { text-align: right; }

  .fc-table td {
    padding: 10px 14px;
    font-size: 13px;
    border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--border);
    white-space: nowrap;
  }
  .fc-table td:last-child { border-right: none; }
  .fc-table tbody tr:last-child td { border-bottom: none; }
  .fc-table tbody tr:hover { background: var(--surface2); }
  .fc-num { text-align: right; font-family: 'IBM Plex Mono', monospace; }
  .fc-desc { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 280px; cursor: help; }
  .fc-catno { color: var(--accent); font-weight: 600; font-family: 'IBM Plex Mono', monospace; }
  .fc-dash { color: var(--muted); }

  .fc-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 20px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    font-weight: 700;
  }
  .fc-badge.good { color: var(--good); background: var(--surface-green); }
  .fc-badge.bad { color: var(--bad); background: #fdecea; }

  .fc-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-top: 1px solid var(--border);
    flex-wrap: wrap;
    gap: 10px;
  }
  .fc-pagination-info { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--muted); }
  .fc-pagination-controls { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .fc-page-btn {
    background: var(--surface2);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 6px 11px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    cursor: pointer;
  }
  .fc-page-btn.active { background: var(--accent); color: #ffffff; border-color: var(--accent); font-weight: 700; }
  .fc-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .fc-page-ellipsis { color: var(--muted); font-family: 'IBM Plex Mono', monospace; font-size: 12px; }
`;
