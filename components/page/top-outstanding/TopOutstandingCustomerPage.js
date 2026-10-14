// components/page/top-outstanding/TopOutstandingCustomerPage.js
// Ported from the Spring Boot + React "Top Outstanding" customer report —
// same salesperson (regional manager) picker, region filter, top-N cutoff,
// overdue/outstanding sort, and Excel export. Styled to match the Product
// Master / Catalyst Pricing table UI (see tableStyles.js).

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import downloadExcel from "utils/exporttoexcel";
import TABLE_PAGE_STYLES from "./tableStyles";

const TOP_COUNT_OPTIONS = [10, 20, 30, 40, 50, 100];

const formatCurrency = (amount) =>
  "₹" + (amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function TopOutstandingCustomerPage({ password }) {
  const [salesPersons, setSalesPersons] = useState([]);
  const [selectedSlpCode, setSelectedSlpCode] = useState("");
  const [selectedSlpName, setSelectedSlpName] = useState("");
  const [allCustomers, setAllCustomers] = useState([]);
  const [topCount, setTopCount] = useState(20);
  const [sortBy, setSortBy] = useState("overdue"); // 'overdue' or 'outstanding'
  const [loading, setLoading] = useState(false);
  const [salesLoading, setSalesLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSalesPersons = useCallback(async () => {
    setSalesLoading(true);
    try {
      const params = new URLSearchParams({ password });
      const res = await fetch(`/api/top-outstanding/sales-persons?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load sales persons");
      setSalesPersons(data);
    } catch (err) {
      setError("Failed to load sales persons");
      console.error(err);
    } finally {
      setSalesLoading(false);
    }
  }, [password]);

  useEffect(() => { fetchSalesPersons(); }, [fetchSalesPersons]);

  const filteredSalesPersons = useMemo(() => {
    if (!searchTerm.trim()) return salesPersons;
    return salesPersons.filter((sp) => sp.SlpName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, salesPersons]);

  const availableRegions = useMemo(() => {
    const regions = new Set(allCustomers.map((c) => c.region).filter(Boolean));
    return ["all", ...Array.from(regions).sort()];
  }, [allCustomers]);

  const regionFilteredCustomers = useMemo(() => {
    if (selectedRegion === "all") return allCustomers;
    return allCustomers.filter((c) => c.region === selectedRegion);
  }, [allCustomers, selectedRegion]);

  const sortedCustomers = useMemo(() => {
    const customers = [...regionFilteredCustomers];
    if (sortBy === "overdue") {
      return customers.sort((a, b) => (b.overdueAmount || 0) - (a.overdueAmount || 0));
    }
    return customers.sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  }, [regionFilteredCustomers, sortBy]);

  const nonZeroCustomers = useMemo(
    () => sortedCustomers.filter((c) => c.totalOutstanding > 0),
    [sortedCustomers]
  );

  const topNonZeroCustomers = useMemo(() => {
    const topN = Math.min(10, nonZeroCustomers.length);
    return nonZeroCustomers.slice(0, topN).map((c) => `${c.cardCode}-${c.region || "no-region"}`);
  }, [nonZeroCustomers]);

  const displayedCustomers = useMemo(() => sortedCustomers.slice(0, topCount), [sortedCustomers, topCount]);

  const fetchTopOutstanding = async (slpCode, slpName) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ password, slpCode });
      const res = await fetch(`/api/top-outstanding/customers?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load top outstanding customers");
      setAllCustomers(data);
      setSelectedSlpName(slpName);
    } catch (err) {
      setError("Failed to load top outstanding customers");
      console.error(err);
      setAllCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSalesPersonSelect = (sp) => {
    setSelectedSlpCode(sp.SlpCode);
    setSearchTerm(sp.SlpName);
    setShowDropdown(false);
    setSelectedRegion("all");
    fetchTopOutstanding(sp.SlpCode, sp.SlpName);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    if (selectedSlpCode) {
      setSelectedSlpCode("");
      setAllCustomers([]);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSelectedSlpCode("");
    setSelectedSlpName("");
    setAllCustomers([]);
    setSelectedRegion("all");
    setShowDropdown(false);
  };

  const handleExportExcel = () => {
    if (displayedCustomers.length === 0) {
      alert("No data to export");
      return;
    }
    const exportData = displayedCustomers.map((customer, index) => ({
      Rank: index + 1,
      "Sales Employee": selectedSlpName,
      Customer: customer.customerName,
      "Customer Code": customer.cardCode,
      Region: customer.region || "Not Specified",
      Overdue: customer.overdueAmount || 0,
      "Total Outstanding": customer.totalOutstanding,
    }));
    const sortLabel = sortBy === "overdue" ? "Overdue" : "Outstanding";
    const regionLabel = selectedRegion === "all" ? "All" : selectedRegion;
    downloadExcel(
      exportData,
      `Top_Outstanding_${selectedSlpName.replace(/\s+/g, "_")}_Region_${regionLabel}_SortBy_${sortLabel}.xlsx`,
      { Overdue: { type: "currency" }, "Total Outstanding": { type: "currency" } }
    );
  };

  const shouldHighlight = (customer) => {
    const key = `${customer.cardCode}-${customer.region || "no-region"}`;
    return topNonZeroCustomers.includes(key);
  };

  return (
    <div className="ot">
      <style>{TABLE_PAGE_STYLES}</style>

      <div className="ot-card">
        <div className="ot-header">
          <h1>Top Outstanding Customers</h1>
          <p className="ot-header-desc">Pick a regional manager to see their customers ranked by overdue or total outstanding balance.</p>
        </div>

        <div className="ot-controls">
          <div className="ot-field" style={{ width: 260 }} ref={dropdownRef}>
            <label>Sales Person</label>
            <input
              className="ot-input"
              style={{ width: "100%" }}
              type="text"
              placeholder="Search sales person..."
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setShowDropdown(true)}
              disabled={salesLoading}
            />
            {searchTerm && (
              <button className="ot-clear-x" onClick={handleClearSearch} title="Clear search" type="button">×</button>
            )}
            {showDropdown && filteredSalesPersons.length > 0 && (
              <div className="ot-suggestions">
                {filteredSalesPersons.map((sp) => (
                  <div
                    key={sp.SlpCode}
                    onClick={() => handleSalesPersonSelect(sp)}
                    className={`ot-suggestion-item ${sp.SlpCode === selectedSlpCode ? "active" : ""}`}
                  >
                    <div className="ot-suggestion-name">{sp.SlpName}</div>
                    <div className="ot-suggestion-code">Code: {sp.SlpCode}</div>
                  </div>
                ))}
              </div>
            )}
            {showDropdown && searchTerm && filteredSalesPersons.length === 0 && (
              <div className="ot-suggestions">
                <div className="ot-suggestion-empty">No sales person found</div>
              </div>
            )}
          </div>

          {selectedSlpCode && allCustomers.length > 0 && (
            <>
              <div className="ot-field">
                <label>Sort By</label>
                <div className="ot-mode-toggle">
                  <button type="button" className={`ot-mode-btn ${sortBy === "overdue" ? "active" : ""}`} onClick={() => setSortBy("overdue")}>Overdue</button>
                  <button type="button" className={`ot-mode-btn ${sortBy === "outstanding" ? "active" : ""}`} onClick={() => setSortBy("outstanding")}>Outstanding</button>
                </div>
              </div>

              <div className="ot-field">
                <label>Show Top</label>
                <select className="ot-select" value={topCount} onChange={(e) => setTopCount(parseInt(e.target.value))}>
                  {TOP_COUNT_OPTIONS.map((count) => (
                    <option key={count} value={count}>{count}</option>
                  ))}
                </select>
              </div>

              <div className="ot-field">
                <label>Region</label>
                <select className="ot-select" value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
                  {availableRegions.map((region) => (
                    <option key={region} value={region}>{region === "all" ? "All Regions" : region}</option>
                  ))}
                </select>
              </div>

              <div className="ot-spacer" />

              <div className="ot-total-pill">
                Showing <strong>{displayedCustomers.length}</strong> of{" "}
                <strong>{selectedRegion === "all" ? allCustomers.length : regionFilteredCustomers.length}</strong> ·
                {" "}Overdue <span className="ot-amount-red">{formatCurrency(displayedCustomers.reduce((sum, c) => sum + (c.overdueAmount || 0), 0))}</span>
                {" "}· Balance <span className="ot-amount-dark">{formatCurrency(displayedCustomers.reduce((sum, c) => sum + c.totalOutstanding, 0))}</span>
              </div>

              <div className="ot-field">
                <label>&nbsp;</label>
                <button className="ot-export-btn" onClick={handleExportExcel} disabled={loading}>Export Excel</button>
              </div>
            </>
          )}
        </div>

        <div className="ot-table-card">
          {error && <div className="ot-empty" style={{ color: "var(--bad)" }}>{error}</div>}

          {(loading || salesLoading) && !error && (
            <div className="ot-loading">
              <div className="ot-spinner" />
              <span>Loading data…</span>
            </div>
          )}

          {!loading && !salesLoading && !error && !selectedSlpCode && (
            <div className="ot-empty">
              <div className="ot-empty-icon">👤</div>
              <div className="ot-empty-title">Select a Sales Person</div>
              <span>Search and select a sales person above to view their top outstanding customers.</span>
            </div>
          )}

          {!loading && !error && selectedSlpCode && allCustomers.length === 0 && (
            <div className="ot-empty">
              <div className="ot-empty-icon">📊</div>
              <div className="ot-empty-title">No Outstanding Balances</div>
              <span>This sales person has no customers with outstanding balances.</span>
            </div>
          )}

          {!loading && !error && displayedCustomers.length > 0 && (
            <div className="ot-table-scroll">
              <table className="ot-table">
                <thead>
                  <tr>
                    <th className="ot-th-left">#</th>
                    <th className="ot-th-left">Customer</th>
                    <th className="ot-th-left">Region</th>
                    <th className="ot-th-right">Overdue</th>
                    <th className="ot-th-right">Total Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedCustomers.map((customer, index) => {
                    const hasZeroBalance = customer.totalOutstanding === 0;
                    const isHighlighted = shouldHighlight(customer);
                    return (
                      <tr
                        key={`${customer.cardCode}-${customer.region || "no-region"}-${index}`}
                        className={isHighlighted ? "ot-highlight-row" : ""}
                        style={hasZeroBalance ? { opacity: 0.55 } : undefined}
                      >
                        <td className="ot-rank">#{index + 1}</td>
                        <td>
                          <div className="ot-name-cell">{customer.customerName}</div>
                          <div className="ot-code-cell">{customer.cardCode}</div>
                        </td>
                        <td>
                          <span className={`ot-badge ${customer.region ? "info" : "muted"}`}>{customer.region || "No Region"}</span>
                        </td>
                        <td className="ot-num">
                          {(customer.overdueAmount || 0) > 0 ? (
                            <span style={{ color: "var(--bad)", fontWeight: 700 }}>{formatCurrency(customer.overdueAmount)}</span>
                          ) : (
                            formatCurrency(0)
                          )}
                        </td>
                        <td className="ot-num" style={{ fontWeight: 700 }}>{formatCurrency(customer.totalOutstanding)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
