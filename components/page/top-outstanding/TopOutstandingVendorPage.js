// components/page/top-outstanding/TopOutstandingVendorPage.js
// Ported from the Spring Boot + React "Top Outstanding Vendor" report — a
// name-search tab plus Local/Overseas vendor tabs, with a click-through
// invoice modal per vendor. Styled to match the Product Master / Catalyst
// Pricing table UI (see tableStyles.js); the invoice modal reuses the same
// react-bootstrap Modal pattern as ProductsTable's customers drill-down.

import { useState, useRef, useEffect } from "react";
import { Modal, Spinner } from "react-bootstrap";
import downloadExcel from "utils/exporttoexcel";
import TABLE_PAGE_STYLES from "./tableStyles";

const TABS = [
  { key: "search", label: "Top Outstanding" },
  { key: "local", label: "Local Vendor" },
  { key: "overseas", label: "Overseas Vendor" },
];

const formatCurrency = (v) =>
  "₹" + (v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (d) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

async function fetchVendors(password, search = "") {
  const params = new URLSearchParams({ password, search });
  const res = await fetch(`/api/top-outstanding/vendors?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to load vendors");
  return data;
}

async function fetchVendorInvoices(password, vendorCode) {
  const params = new URLSearchParams({ password, vendorCode });
  const res = await fetch(`/api/top-outstanding/vendor-invoices?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to load invoices");
  return data;
}

const overdueBadgeClass = (days) => {
  if (days === 0) return "good";
  if (days <= 30) return "warn";
  return "bad";
};

// ── Invoice Modal — opens on row click, shows a vendor's AP invoices ──
function InvoiceModal({ password, vendor, onClose }) {
  const [allInvoices, setAllInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [displayInvoices, setDisplayInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPage = 20;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchVendorInvoices(password, vendor.vendorCode);
        setAllInvoices(data);
      } catch {
        setError("Failed to load invoices");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let filtered = [...allInvoices];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (inv) =>
          inv.invoiceNo?.toString().includes(term) ||
          inv.vendorRefNo?.toLowerCase().includes(term) ||
          inv.contactPerson?.toLowerCase().includes(term) ||
          inv.paymentTerms?.toLowerCase().includes(term) ||
          inv.salesPerson?.toLowerCase().includes(term) ||
          inv.region?.toLowerCase().includes(term) ||
          inv.balanceDue?.toString().includes(term) ||
          inv.overdueDays?.toString().includes(term)
      );
    }
    setFilteredInvoices(filtered);
    const start = currentPage * itemsPerPage;
    setDisplayInvoices(filtered.slice(start, start + itemsPerPage));
  }, [allInvoices, searchTerm, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage));

  const handleExport = () => {
    const exportData = filteredInvoices.map((inv) => ({
      "Invoice No": inv.invoiceNo,
      "Invoice Date": inv.invoiceDate,
      "Vendor Ref No": inv.vendorRefNo,
      "Vendor Code": inv.vendorCode,
      "Vendor Name": inv.vendorName,
      "Contact Person": inv.contactPerson,
      "Invoice Total": inv.invoiceTotal,
      "Balance Due": inv.balanceDue,
      Country: inv.country,
      State: inv.state,
      Region: inv.region,
      "Overdue Days": inv.overdueDays,
      "Payment Terms": inv.paymentTerms,
      "Supply Date": inv.supplyDate,
      "Sales Person": inv.salesPerson,
      "Master Sales Person": inv.masterSalesPerson,
      "Payment Status": inv.paymentStatus,
    }));
    downloadExcel(exportData, `invoices_${vendor.vendorName.replace(/\s+/g, "_")}.xlsx`, {
      "Invoice Total": { type: "currency" },
      "Balance Due": { type: "currency" },
    });
  };

  return (
    <Modal show onHide={onClose} centered scrollable size="xl">
      <div className="ot-modal">
        <style>{TABLE_PAGE_STYLES}</style>
        <Modal.Header closeButton>
          <Modal.Title as="div">
            <div className="ot-modal-title">{vendor.vendorName}</div>
            <div className="ot-modal-subtitle">Code: {vendor.vendorCode} &nbsp;|&nbsp; Region: {vendor.region || "Unknown"}</div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="ot-modal-filters">
            <div className="ot-field" style={{ width: 260 }}>
              <input
                className="ot-input"
                style={{ width: "100%" }}
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
              />
            </div>
            <button className="ot-export-btn" onClick={handleExport} disabled={filteredInvoices.length === 0} type="button">
              Export Excel
            </button>
            {!loading && (
              <div className="ot-total-pill">{filteredInvoices.length} record{filteredInvoices.length !== 1 ? "s" : ""}</div>
            )}
          </div>

          {loading && (
            <div className="ot-loading">
              <Spinner animation="border" size="sm" />
              <span>Loading invoices…</span>
            </div>
          )}
          {error && <div className="ot-empty" style={{ color: "var(--bad)" }}>{error}</div>}

          {!loading && !error && (
            <div className="ot-table-card">
              <div className="ot-table-scroll">
                <table className="ot-table">
                  <thead>
                    <tr>
                      <th className="ot-th-left">Invoice No.</th>
                      <th className="ot-th-left">Invoice Date</th>
                      <th className="ot-th-left">Vendor Ref No</th>
                      <th className="ot-th-left">Contact Person</th>
                      <th className="ot-th-right">Invoice Total</th>
                      <th className="ot-th-right">Balance Due</th>
                      <th className="ot-th-left">Region</th>
                      <th className="ot-th-left">Overdue Days</th>
                      <th className="ot-th-left">Payment Terms</th>
                      <th className="ot-th-left">Supply Date</th>
                      <th className="ot-th-left">Sales Person</th>
                      <th className="ot-th-left">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayInvoices.length > 0 ? (
                      displayInvoices.map((inv, i) => (
                        <tr key={`${inv.invoiceNo}-${i}`}>
                          <td>{inv.invoiceNo}</td>
                          <td>{formatDate(inv.invoiceDate)}</td>
                          <td>{inv.vendorRefNo || <span className="ot-dash">N/A</span>}</td>
                          <td>{inv.contactPerson || <span className="ot-dash">N/A</span>}</td>
                          <td className="ot-num">{formatCurrency(inv.invoiceTotal)}</td>
                          <td className="ot-num" style={{ color: inv.balanceDue > 0 ? "var(--bad)" : "var(--good)", fontWeight: 700 }}>
                            {formatCurrency(inv.balanceDue)}
                          </td>
                          <td>{inv.region || "Unknown"}</td>
                          <td><span className={`ot-badge ${overdueBadgeClass(inv.overdueDays)}`}>{inv.overdueDays} days</span></td>
                          <td>{inv.paymentTerms}</td>
                          <td>{formatDate(inv.supplyDate)}</td>
                          <td>{inv.salesPerson || <span className="ot-dash">N/A</span>}</td>
                          <td>
                            <span className={`ot-badge ${inv.paymentStatus === "Received" ? "good" : "warn"}`}>{inv.paymentStatus}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="12" style={{ textAlign: "center", padding: 40 }}>No invoices found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredInvoices.length > itemsPerPage && (
                <div className="ot-pagination">
                  <div className="ot-pagination-info">
                    Showing {currentPage * itemsPerPage + 1}–{Math.min((currentPage + 1) * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length}
                  </div>
                  <div className="ot-pagination-controls">
                    <button className="ot-page-btn" disabled={currentPage === 0} onClick={() => setCurrentPage(0)}>First</button>
                    <button className="ot-page-btn" disabled={currentPage === 0} onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}>Prev</button>
                    <span className="ot-pagination-info">{currentPage + 1} / {totalPages}</span>
                    <button className="ot-page-btn" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}>Next</button>
                    <button className="ot-page-btn" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(totalPages - 1)}>Last</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
      </div>
    </Modal>
  );
}

// ── Vendor table — shared by the search tab and the Local/Overseas tabs ──
function VendorTable({ vendors, onRowClick }) {
  return (
    <div className="ot-table-scroll">
      <table className="ot-table">
        <thead>
          <tr>
            <th className="ot-th-left">#</th>
            <th className="ot-th-left">Vendor</th>
            <th className="ot-th-left">Country</th>
            <th className="ot-th-left">State</th>
            <th className="ot-th-left">Region</th>
            <th className="ot-th-right">Overdue</th>
            <th className="ot-th-right">Total Outstanding</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((v, index) => (
            <tr key={`${v.vendorCode}-${index}`} className="ot-row-clickable" onClick={() => onRowClick(v)} title="Click to view invoices">
              <td className="ot-rank">#{index + 1}</td>
              <td>
                <div className="ot-name-cell">{v.vendorName}</div>
                <div className="ot-code-cell">{v.vendorCode}</div>
              </td>
              <td>{v.country || <span className="ot-dash">N/A</span>}</td>
              <td>{v.state || <span className="ot-dash">N/A</span>}</td>
              <td><span className={`ot-badge ${v.region ? "info" : "muted"}`}>{v.region || "Unknown"}</span></td>
              <td className="ot-num">
                {(v.overdueAmount || 0) > 0 ? (
                  <span style={{ color: "var(--bad)", fontWeight: 700 }}>{formatCurrency(v.overdueAmount)}</span>
                ) : (
                  formatCurrency(0)
                )}
              </td>
              <td className="ot-num" style={{ fontWeight: 700 }}>{formatCurrency(v.totalOutstanding)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── VendorList — used by Local & Overseas tabs ──
function VendorList({ password, type }) {
  const [allVendors, setAllVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVendor, setModalVendor] = useState(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        setSearchTerm("");
        const data = await fetchVendors(password, "");
        const filtered = type === "local" ? data.filter((v) => v.country === "IN") : data.filter((v) => v.country !== "IN");
        setAllVendors(filtered);
        setFilteredVendors(filtered);
      } catch {
        setError("Failed to load vendors");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVendors(allVendors);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredVendors(
        allVendors.filter(
          (v) =>
            v.vendorName?.toLowerCase().includes(term) ||
            v.vendorCode?.toLowerCase().includes(term) ||
            v.state?.toLowerCase().includes(term) ||
            v.region?.toLowerCase().includes(term)
        )
      );
    }
  }, [allVendors, searchTerm]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!searchTerm.trim()) { setSuggestions([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(() => {
      const term = searchTerm.toLowerCase();
      const matched = allVendors.filter((v) => v.vendorName?.toLowerCase().includes(term)).slice(0, 10);
      setSuggestions(matched);
      setShowDropdown(matched.length > 0);
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, allVendors]);

  const handleSuggestionSelect = (v) => {
    setSearchTerm(v.vendorName);
    setShowDropdown(false);
    setSuggestions([]);
  };

  const handleExportExcel = () => {
    if (filteredVendors.length === 0) { alert("No data to export"); return; }
    const exportData = filteredVendors.map((v, i) => ({
      Rank: i + 1,
      "Vendor Code": v.vendorCode,
      "Vendor Name": v.vendorName,
      Country: v.country,
      State: v.state,
      Region: v.region || "Unknown",
      "Total Outstanding": v.totalOutstanding,
      "Overdue Amount": v.overdueAmount,
    }));
    downloadExcel(exportData, `${type}_vendor_outstanding.xlsx`, {
      "Total Outstanding": { type: "currency" },
      "Overdue Amount": { type: "currency" },
    });
  };

  const totalOutstanding = filteredVendors.reduce((sum, v) => sum + v.totalOutstanding, 0);
  const totalOverdue = filteredVendors.reduce((sum, v) => sum + (v.overdueAmount || 0), 0);

  return (
    <>
      <div className="ot-controls">
        <div className="ot-field" style={{ width: 280 }} ref={dropdownRef}>
          <label>Search Vendor</label>
          <input
            className="ot-input"
            style={{ width: "100%" }}
            type="text"
            placeholder="Type to filter vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            disabled={loading}
          />
          {searchTerm && (
            <button className="ot-clear-x" onClick={() => { setSearchTerm(""); setShowDropdown(false); }} type="button">×</button>
          )}
          {showDropdown && suggestions.length > 0 && (
            <div className="ot-suggestions">
              {suggestions.map((sug) => (
                <div key={sug.vendorCode} onClick={() => handleSuggestionSelect(sug)} className="ot-suggestion-item">
                  <div className="ot-suggestion-name">{sug.vendorName}</div>
                  <div className="ot-suggestion-code">Code: {sug.vendorCode}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ot-spacer" />

        {!loading && allVendors.length > 0 && (
          <div className="ot-total-pill">
            {searchTerm ? (
              <>Found <strong>{filteredVendors.length}</strong> of <strong>{allVendors.length}</strong></>
            ) : (
              <>Found <strong>{allVendors.length}</strong> vendor{allVendors.length !== 1 ? "s" : ""}</>
            )}
            {" "}· Overdue <span className="ot-amount-red">{formatCurrency(totalOverdue)}</span>
            {" "}· Balance <span className="ot-amount-dark">{formatCurrency(totalOutstanding)}</span>
          </div>
        )}

        <div className="ot-field">
          <label>&nbsp;</label>
          <button className="ot-export-btn" onClick={handleExportExcel} disabled={loading || filteredVendors.length === 0}>Export Excel</button>
        </div>
      </div>

      <div className="ot-table-card">
        {error && <div className="ot-empty" style={{ color: "var(--bad)" }}>{error}</div>}

        {loading && !error && (
          <div className="ot-loading">
            <div className="ot-spinner" />
            <span>Loading {type} vendors…</span>
          </div>
        )}

        {!loading && !error && filteredVendors.length === 0 && (
          <div className="ot-empty">
            <div className="ot-empty-icon">{type === "local" ? "🏭" : "🌍"}</div>
            <div className="ot-empty-title">No Vendors Found</div>
            <span>{searchTerm ? "No vendors match your search" : `No ${type} vendors with outstanding balance`}</span>
          </div>
        )}

        {!loading && !error && filteredVendors.length > 0 && (
          <VendorTable vendors={filteredVendors} onRowClick={setModalVendor} />
        )}
      </div>

      {modalVendor && <InvoiceModal password={password} vendor={modalVendor} onClose={() => setModalVendor(null)} />}
    </>
  );
}

// ── Main Component ──
export default function TopOutstandingVendorPage({ password }) {
  const [activeTab, setActiveTab] = useState("search");

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [modalVendor, setModalVendor] = useState(null);

  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchTerm.trim() || selectedVendor) { setSuggestions([]); setShowDropdown(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setSuggestionsLoading(true);
        const data = await fetchVendors(password, searchTerm.trim());
        const unique = [];
        const seen = new Set();
        data.forEach((v) => { if (!seen.has(v.vendorCode)) { seen.add(v.vendorCode); unique.push(v); } });
        setSuggestions(unique.slice(0, 10));
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, selectedVendor, password]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setSelectedVendor(null);
    setVendors([]);
    setHasSearched(false);
  };

  const fetchOutstanding = async (name) => {
    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      const data = await fetchVendors(password, name);
      setVendors(data);
    } catch {
      setError("Failed to fetch vendor data");
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = async (suggestion) => {
    setSearchTerm(suggestion.vendorName);
    setSelectedVendor(suggestion);
    setShowDropdown(false);
    setSuggestions([]);
    await fetchOutstanding(suggestion.vendorName);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setShowDropdown(false);
    await fetchOutstanding(searchTerm.trim());
  };

  const handleClear = () => {
    setSearchTerm(""); setSelectedVendor(null); setVendors([]);
    setSuggestions([]); setHasSearched(false); setError(null); setShowDropdown(false);
  };

  const handleExportExcel = () => {
    if (vendors.length === 0) { alert("No data to export"); return; }
    const exportData = vendors.map((v, i) => ({
      Rank: i + 1,
      "Vendor Code": v.vendorCode,
      "Vendor Name": v.vendorName,
      Country: v.country,
      State: v.state,
      Region: v.region || "Unknown",
      "Total Outstanding": v.totalOutstanding,
      "Overdue Amount": v.overdueAmount,
    }));
    downloadExcel(exportData, `vendor_outstanding_${searchTerm.replace(/\s+/g, "_")}.xlsx`, {
      "Total Outstanding": { type: "currency" },
      "Overdue Amount": { type: "currency" },
    });
  };

  const totalOutstanding = vendors.reduce((sum, v) => sum + v.totalOutstanding, 0);
  const totalOverdue = vendors.reduce((sum, v) => sum + (v.overdueAmount || 0), 0);

  return (
    <div className="ot">
      <style>{TABLE_PAGE_STYLES}</style>

      <div className="ot-card">
        <div className="ot-header">
          <h1>Top Outstanding Vendors</h1>
          <p className="ot-header-desc">Search a vendor by name, or browse Local / Overseas vendors ranked by outstanding balance.</p>
        </div>

        <div className="ot-tabs">
          {TABS.map((tab) => (
            <button key={tab.key} type="button" className={`ot-tab-btn ${activeTab === tab.key ? "active" : ""}`} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "search" && (
          <>
            <div className="ot-controls">
              <div className="ot-field" style={{ width: 280 }} ref={dropdownRef}>
                <label>Vendor Name</label>
                <input
                  className="ot-input"
                  style={{ width: "100%" }}
                  type="text"
                  placeholder="Type vendor name..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  disabled={loading}
                />
                {searchTerm && (
                  <button className="ot-clear-x" onClick={handleClear} type="button">×</button>
                )}
                {showDropdown && (
                  <div className="ot-suggestions">
                    {suggestionsLoading && <div className="ot-suggestion-loading">Searching...</div>}
                    {!suggestionsLoading && suggestions.map((sug) => (
                      <div
                        key={sug.vendorCode}
                        onClick={() => handleSuggestionSelect(sug)}
                        className={`ot-suggestion-item ${selectedVendor?.vendorCode === sug.vendorCode ? "active" : ""}`}
                      >
                        <div className="ot-suggestion-name">{sug.vendorName}</div>
                        <div className="ot-suggestion-code">Code: {sug.vendorCode}</div>
                      </div>
                    ))}
                    {!suggestionsLoading && suggestions.length === 0 && searchTerm && (
                      <div className="ot-suggestion-empty">No vendors found</div>
                    )}
                  </div>
                )}
              </div>

              <div className="ot-field">
                <label>&nbsp;</label>
                <button className="ot-search-btn" onClick={handleSearch} disabled={loading || !searchTerm.trim()}>Search</button>
              </div>

              <div className="ot-spacer" />

              {vendors.length > 0 && (
                <div className="ot-total-pill">
                  Found <strong>{vendors.length}</strong> vendor{vendors.length !== 1 ? "s" : ""}
                  {" "}· Overdue <span className="ot-amount-red">{formatCurrency(totalOverdue)}</span>
                  {" "}· Balance <span className="ot-amount-dark">{formatCurrency(totalOutstanding)}</span>
                </div>
              )}

              {vendors.length > 0 && (
                <div className="ot-field">
                  <label>&nbsp;</label>
                  <button className="ot-export-btn" onClick={handleExportExcel} disabled={loading}>Export Excel</button>
                </div>
              )}
            </div>

            <div className="ot-table-card">
              {error && <div className="ot-empty" style={{ color: "var(--bad)" }}>{error}</div>}

              {loading && !error && (
                <div className="ot-loading">
                  <div className="ot-spinner" />
                  <span>Searching vendors…</span>
                </div>
              )}

              {!loading && !error && !hasSearched && (
                <div className="ot-empty">
                  <div className="ot-empty-icon">🏢</div>
                  <div className="ot-empty-title">Search for a Vendor</div>
                  <span>Type a vendor name above to view outstanding balance details.</span>
                </div>
              )}

              {!loading && !error && hasSearched && vendors.length === 0 && (
                <div className="ot-empty">
                  <div className="ot-empty-icon">📊</div>
                  <div className="ot-empty-title">No Vendors Found</div>
                  <span>No vendors match your search term.</span>
                </div>
              )}

              {!loading && !error && vendors.length > 0 && (
                <VendorTable vendors={vendors} onRowClick={setModalVendor} />
              )}
            </div>

            {modalVendor && <InvoiceModal password={password} vendor={modalVendor} onClose={() => setModalVendor(null)} />}
          </>
        )}

        {activeTab === "local" && <VendorList password={password} type="local" />}
        {activeTab === "overseas" && <VendorList password={password} type="overseas" />}
      </div>
    </div>
  );
}
