// pages/products/[id].js
import { useRouter } from "next/router";
import { Spinner } from "react-bootstrap";
import { getProductDetail, getProductKPIs } from "../../lib/models/products";
import { useAuth } from '../../hooks/useAuth';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto'; // Required for Chart.js 3.x and above
import { formatDate } from "utils/formatDate";
import { formatCurrency } from "utils/formatCurrency";
import { useState, useEffect, useMemo, useRef } from "react";
import downloadExcel from "utils/exporttoexcel";

const PAGE_SIZE = 20;

// Indian financial year: April -> March. Returns the FY start year for a given
// calendar year/month (e.g. Jan 2026 -> FY start 2025; Jul 2026 -> FY start 2026).
function fyStartYear(year, month) {
  return month >= 4 ? year : year - 1;
}

function fyLabel(startYear) {
  return `FY ${startYear}-${String(startYear + 1).slice(-2)}`;
}

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  return Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
}

const Pager = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="pd-pagination-controls">
      <button className="pd-page-btn" disabled={page <= 1} onClick={() => onChange(Math.max(1, page - 1))}>Prev</button>
      {getPageNumbers(page, totalPages).map((p, idx, arr) => (
        <span key={p} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {idx > 0 && arr[idx - 1] !== p - 1 && <span className="pd-page-ellipsis">…</span>}
          <button className={`pd-page-btn ${p === page ? "active" : ""}`} onClick={() => onChange(p)}>{p}</button>
        </span>
      ))}
      <button className="pd-page-btn" disabled={page >= totalPages} onClick={() => onChange(Math.min(totalPages, page + 1))}>Next</button>
    </div>
  );
};

export default function ProductDetails({ initialProduct, initialKpiData, initialSalesTrendData, initialTopCustomersData, initialInventoryData }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // State for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Jump-to-product type-ahead suggestions
  const [jumpSuggestions, setJumpSuggestions] = useState([]);
  const [showJumpSuggestions, setShowJumpSuggestions] = useState(false);
  const jumpSearchBoxRef = useRef(null);
  const jumpSuggestionTimeoutRef = useRef(null);

  // State for product data (initially from props, then updated via search)
  const [product, setProduct] = useState(initialProduct);
  const [kpiData, setKpiData] = useState(initialKpiData);
  const [salesTrendData, setSalesTrendData] = useState(initialSalesTrendData);
  const [topCustomersData, setTopCustomersData] = useState(initialTopCustomersData);
  const [inventoryData, setInventoryData] = useState(initialInventoryData);

  // Financial-year filter for Sales Trend
  const now = new Date();
  const currentFyStart = fyStartYear(now.getFullYear(), now.getMonth() + 1);
  const [selectedFy, setSelectedFy] = useState(currentFyStart);

  // Top Customers — search + pagination
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerPage, setCustomerPage] = useState(1);

  // COA / Inventory — search + pagination
  const [coaSearch, setCoaSearch] = useState("");
  const [coaPage, setCoaPage] = useState(1);

  // Initialize search query with current product code
  useEffect(() => {
    if (product) {
      setSearchQuery(product.ItemCode);
    }
  }, []);

  // Close jump-to-product suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (jumpSearchBoxRef.current && !jumpSearchBoxRef.current.contains(event.target)) {
        setShowJumpSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Type-ahead suggestions for the "jump to another product" search box —
  // reuses the existing /api/products search endpoint (CAT No / Item Name / CAS No
  // already matched server-side), just previews the first few matches.
  useEffect(() => {
    if (jumpSuggestionTimeoutRef.current) {
      clearTimeout(jumpSuggestionTimeoutRef.current);
    }

    const term = searchQuery.trim();
    if (!term) {
      setJumpSuggestions([]);
      return;
    }

    jumpSuggestionTimeoutRef.current = setTimeout(async () => {
      try {
        const query = new URLSearchParams({ page: 1, search: term, status: "all", category: "", sortField: "ItemCode", sortDir: "asc" });
        const res = await fetch(`/api/products?${query.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        setJumpSuggestions((data.products || []).slice(0, 8));
      } catch (err) {
        console.error("Error fetching product suggestions:", err);
      }
    }, 300);

    return () => clearTimeout(jumpSuggestionTimeoutRef.current);
  }, [searchQuery]);

  // These must run on every render regardless of the early returns below
  // (Rules of Hooks — hooks can't be called conditionally/after a return).
  const fyOptions = useMemo(() => {
    const opts = [];
    for (let y = 2024; y <= currentFyStart; y++) opts.push(y);
    return opts;
  }, [currentFyStart]);

  const fySalesTrend = useMemo(() => {
    return salesTrendData.filter((row) => fyStartYear(row.Year, row.Month) === selectedFy);
  }, [salesTrendData, selectedFy]);

  const filteredCustomers = useMemo(() => {
    const term = customerSearch.trim().toLowerCase();
    if (!term) return topCustomersData;
    return topCustomersData.filter(
      (c) =>
        (c.CustomerCode || "").toLowerCase().includes(term) ||
        (c.CustomerName || "").toLowerCase().includes(term)
    );
  }, [topCustomersData, customerSearch]);

  const filteredInventory = useMemo(() => {
    const term = coaSearch.trim().toLowerCase();
    if (!term) return inventoryData;
    return inventoryData.filter(
      (item) =>
        (item.Location || "").toLowerCase().includes(term) ||
        (item.WhsName || "").toLowerCase().includes(term) ||
        (item.BatchNum || "").toLowerCase().includes(term) ||
        (item.VendorBatchNum || "").toLowerCase().includes(term)
    );
  }, [inventoryData, coaSearch]);

  if (!isAuthenticated) {
    return (
      <div className="pd">
        <style>{PAGE_STYLES}</style>
        <div className="pd-card"><div className="pd-empty">You need to be authenticated to view this page.</div></div>
      </div>
    );
  }

  // Function to handle product search
  const handleSearch = async (itemCode) => {
    if (!itemCode.trim()) {
      setSearchError('Please enter a product code');
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      const productResponse = await fetch(`/api/products/${encodeURIComponent(itemCode.trim())}`);

      if (!productResponse.ok) {
        throw new Error('Product not found');
      }

      const productData = await productResponse.json();

      const kpiResponse = await fetch(`/api/products/${encodeURIComponent(itemCode.trim())}/kpis`);
      let kpiResult = null;

      if (kpiResponse.ok) {
        kpiResult = await kpiResponse.json();
      }

      setProduct(productData);
      setKpiData(kpiResult?.kpiData || null);
      setSalesTrendData(kpiResult?.salesTrendData || []);
      setTopCustomersData(kpiResult?.topCustomersData || []);
      setInventoryData(kpiResult?.inventoryData || []);
      setCustomerPage(1);
      setCoaPage(1);
      setCustomerSearch("");
      setCoaSearch("");

      router.replace(`/products/${encodeURIComponent(itemCode.trim())}`, undefined, { shallow: true });
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Product not found. Please check the product code and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(searchQuery);
    }
  };

  const handleJumpSuggestionClick = (itemCode) => {
    setShowJumpSuggestions(false);
    setSearchQuery(itemCode);
    handleSearch(itemCode);
  };

  if (!product) {
    return (
      <div className="pd">
        <style>{PAGE_STYLES}</style>
        <div className="pd-card"><div className="pd-empty">Product not found</div></div>
      </div>
    );
  }

  const generateCoaUrl = (item) => {
    const baseUrl = window.location.origin;
    const { CoaSource, LocalCOAFilename, EnergyCoaUrl, ItemCode, VendorBatchNum } = item;

    switch (CoaSource) {
      case 'LOCAL':
        if (LocalCOAFilename && LocalCOAFilename.trim() !== '') {
          let filename = LocalCOAFilename.trim();

          if (filename.includes('\\')) {
            const pathParts = filename.split('\\');
            filename = pathParts[pathParts.length - 1];
          }

          if (filename.includes('/')) {
            const pathParts = filename.split('/');
            filename = pathParts[pathParts.length - 1];
          }

          const encodedFilename = encodeURIComponent(filename);
          return {
            url: `${baseUrl}/api/coa/download/${encodedFilename}`,
            type: 'local'
          };
        }
        break;

      case 'ENERGY':
        if (ItemCode && VendorBatchNum && VendorBatchNum.trim() !== '' && VendorBatchNum !== 'N/A') {
          return {
            url: `${baseUrl}/api/coa/download-energy/${encodeURIComponent(ItemCode)}/${encodeURIComponent(VendorBatchNum.trim())}`,
            type: 'energy'
          };
        }
        break;

      case 'NONE':
      default:
        return null;
    }

    return null;
  };

  const checkCoaAvailability = async (coaInfo) => {
    if (!coaInfo) return false;

    try {
      const response = await fetch(coaInfo.url, {
        method: 'HEAD',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        const getResponse = await fetch(coaInfo.url, {
          method: 'GET',
          headers: { 'Range': 'bytes=0-1', 'Cache-Control': 'no-cache' }
        });

        return getResponse.ok || getResponse.status === 206;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return false;
      }

      return response.ok;
    } catch (error) {
      console.error('Error checking COA availability:', error);
      return false;
    }
  };

  const handleCoaDownload = (item) => {
    const coaInfo = generateCoaUrl(item);
    if (coaInfo) {
      const link = document.createElement('a');
      link.href = coaInfo.url;
      link.target = '_blank';
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('COA not available for this item');
    }
  };

  const CoaCell = ({ item }) => {
    const [isAvailable, setIsAvailable] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const checkAvailability = async () => {
        setIsLoading(true);
        const coaInfo = generateCoaUrl(item);

        if (coaInfo) {
          try {
            const available = await checkCoaAvailability(coaInfo);
            setIsAvailable(available);
          } catch (error) {
            console.error('Error checking COA availability:', error);
            setIsAvailable(false);
          }
        } else {
          setIsAvailable(false);
        }

        setIsLoading(false);
      };

      checkAvailability();
    }, [item]);

    if (isLoading) {
      return <Spinner animation="border" size="sm" />;
    }

    if (isAvailable) {
      return (
        <button className="pd-coa-link" onClick={() => handleCoaDownload(item)} title={`Download COA (${item.CoaSource})`}>
          COA
        </button>
      );
    }

    return <span className="pd-dash">N/A</span>;
  };

  // ── Sales Trend: FY-filtered (fyOptions/fySalesTrend computed above, near the other hooks) ──
  const salesTrendLabels = fySalesTrend.map(item => item.MonthName);
  const salesTrendRevenue = fySalesTrend.map(item => Number(item.MonthlyRevenue));
  const salesTrendUnits = fySalesTrend.map(item => Number(item.MonthlyUnitsSold));

  const salesTrendChartData = {
    labels: salesTrendLabels,
    datasets: [
      {
        label: 'Sales Revenue',
        data: salesTrendRevenue,
        backgroundColor: 'rgba(31, 104, 191, 0.7)',
        borderColor: '#1f68bf',
        borderWidth: 1,
      },
    ],
  };

  const salesTrendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      // `false` fully disables the globally-registered chartjs-plugin-datalabels
      // for this chart instance — `{ display: false }` only hides the labels but
      // still runs the plugin's beforeUpdate/afterDatasetsDraw hooks against this
      // chart's dataset, which crashes when the dataset shape doesn't match what
      // the plugin expects (Cannot read properties of undefined reading '_labels').
      datalabels: false,
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: function (context) {
            const index = context.dataIndex;
            const sales = salesTrendRevenue[index].toLocaleString('en-IN', {
              style: 'currency', currency: 'INR', maximumFractionDigits: 0
            });
            const units = salesTrendUnits[index].toLocaleString();
            return [`Sales: ${sales}`, `Units Sold: ${units}`];
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Sales Revenue (₹)' }, ticks: { callback: (v) => '₹' + v.toLocaleString() } },
      x: { title: { display: true, text: 'Month' } }
    }
  };

  const handleExportSalesTrend = () => {
    if (!fySalesTrend.length) return;
    const data = fySalesTrend.map((row) => ({
      Month: row.MonthName,
      "Sales (₹)": Number(row.MonthlyRevenue) || 0,
      "Units Sold": Number(row.MonthlyUnitsSold) || 0,
    }));
    downloadExcel(data, `${product.ItemCode}_SalesTrend_${fyLabel(selectedFy).replace(/\s/g, "")}`, {
      "Sales (₹)": { type: "currency" },
    });
  };

  // ── Top Customers: search + pagination (filteredCustomers computed above, near the other hooks) ──
  const customerTotalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const customerSafePage = Math.min(customerPage, customerTotalPages);
  const visibleCustomers = filteredCustomers.slice((customerSafePage - 1) * PAGE_SIZE, customerSafePage * PAGE_SIZE);

  const handleExportCustomers = () => {
    if (!filteredCustomers.length) return;
    const data = filteredCustomers.map((c) => ({
      "Customer Code": c.CustomerCode,
      "Customer Name": c.CustomerName,
      "Total Spent (₹)": Number(c.TotalSpent) || 0,
    }));
    downloadExcel(data, `${product.ItemCode}_TopCustomers`, { "Total Spent (₹)": { type: "currency" } });
  };

  // ── COA / Inventory: search + pagination (filteredInventory computed above, near the other hooks) ──
  const coaTotalPages = Math.max(1, Math.ceil(filteredInventory.length / PAGE_SIZE));
  const coaSafePage = Math.min(coaPage, coaTotalPages);
  const visibleInventory = filteredInventory.slice((coaSafePage - 1) * PAGE_SIZE, coaSafePage * PAGE_SIZE);

  const handleExportInventory = () => {
    if (!filteredInventory.length) return;
    const data = filteredInventory.map((item) => ({
      Location: item.Location,
      "Warehouse Name": item.WhsName || "N/A",
      Quantity: Number(item.Quantity) || 0,
      "Batch Number": item.BatchNum || "N/A",
      "Vendor Batch": item.VendorBatchNum || "N/A",
    }));
    downloadExcel(data, `${product.ItemCode}_Inventory`);
  };

  return (
    <div className="pd">
      <style>{PAGE_STYLES}</style>

      <div className="pd-card">
        {/* Top back button */}
        <button className="pd-back-btn" onClick={() => router.back()}>
          ← Back to Products
        </button>

        <div className="pd-header">
          <h1>{product.ItemName}</h1>
          <p className="pd-header-desc">{product.ItemCode}</p>
        </div>

        {/* Search */}
        <div className="pd-search-card">
          <form onSubmit={handleSearchSubmit} className="pd-search-form">
            <div className="pd-field" style={{ flex: 1, minWidth: 260 }} ref={jumpSearchBoxRef}>
              <label>Jump to another product</label>
              <input
                className="pd-input"
                style={{ width: "100%" }}
                type="text"
                placeholder="Enter Product Code, Item Name, or CAS No…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowJumpSuggestions(true); }}
                onFocus={() => setShowJumpSuggestions(true)}
                onKeyPress={handleKeyPress}
                disabled={isSearching}
              />
              {showJumpSuggestions && searchQuery.trim() && jumpSuggestions.length > 0 && (
                <div className="pd-suggestions">
                  {jumpSuggestions.map((p) => (
                    <div key={p.ItemCode} className="pd-suggestion-item" onClick={() => handleJumpSuggestionClick(p.ItemCode)}>
                      <span className="pd-suggestion-cat">{p.ItemCode}</span>
                      <span className="pd-suggestion-desc">{p.ItemName}</span>
                      {p.U_CasNo && <span className="pd-suggestion-cas">{p.U_CasNo}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="pd-export-btn" disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? "Searching…" : "Search"}
            </button>
          </form>
          {searchError && <div className="pd-error">{searchError}</div>}
        </div>

        {/* Basic Info + KPI Summary */}
        <div className="pd-grid-2">
          <div className="pd-panel">
            <div className="pd-panel-title">Basic Information</div>
            <table className="pd-kv-table">
              <tbody>
                <tr><th>Item Code</th><td>{product.ItemCode}</td></tr>
                <tr><th>Item Name</th><td>{product.ItemName}</td></tr>
                <tr><th>Item Type</th><td>{product.ItemType}</td></tr>
                <tr><th>CAS No</th><td>{product.U_CasNo || "N/A"}</td></tr>
                <tr><th>Molecular Weight</th><td>{product.U_MolucularWeight || "N/A"}</td></tr>
                <tr><th>Created Date</th><td>{formatDate(product.CreateDate)}</td></tr>
                <tr><th>Updated Date</th><td>{formatDate(product.UpdateDate)}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="pd-panel">
            <div className="pd-panel-title">KPI Summary</div>
            <table className="pd-kv-table">
              <tbody>
                <tr><th>Total Revenue Generated</th><td>₹{kpiData ? Number(kpiData.TotalRevenue).toLocaleString() : 'N/A'}</td></tr>
                <tr><th>Units Sold</th><td>{kpiData ? Number(kpiData.UnitsSold).toLocaleString() : 'N/A'}</td></tr>
                <tr><th>Number of Customers</th><td>{kpiData ? Number(kpiData.NumberOfCustomers).toLocaleString() : 'N/A'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales Trend */}
        <div className="pd-section">
          <div className="pd-section-header">
            <div className="pd-section-title">Sales Trend</div>
            <div className="pd-section-controls">
              <div className="pd-field">
                <label>Financial Year</label>
                <select className="pd-input" value={selectedFy} onChange={(e) => setSelectedFy(parseInt(e.target.value, 10))}>
                  {fyOptions.map((y) => (
                    <option key={y} value={y}>{fyLabel(y)}</option>
                  ))}
                </select>
              </div>
              <button className="pd-export-btn" onClick={handleExportSalesTrend} disabled={!fySalesTrend.length}>
                Export Excel
              </button>
            </div>
          </div>

          {fySalesTrend.length > 0 ? (
            <>
              <div className="pd-chart-card">
                <Bar
                  key={`${product.ItemCode}-${selectedFy}`}
                  data={salesTrendChartData}
                  options={salesTrendChartOptions}
                />
              </div>
              <div className="pd-table-card">
                <div className="pd-table-scroll">
                  <table className="pd-table">
                    <tbody>
                      <tr>
                        <th className="pd-th-left">Month</th>
                        {fySalesTrend.map((row) => (
                          <td key={row.MonthName} className="pd-num">{row.MonthName}</td>
                        ))}
                      </tr>
                      <tr>
                        <th className="pd-th-left">Sales (₹)</th>
                        {fySalesTrend.map((row) => (
                          <td key={row.MonthName} className="pd-num">{formatCurrency(row.MonthlyRevenue)}</td>
                        ))}
                      </tr>
                      <tr>
                        <th className="pd-th-left">Units Sold</th>
                        {fySalesTrend.map((row) => (
                          <td key={row.MonthName} className="pd-num">{Number(row.MonthlyUnitsSold).toLocaleString()}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="pd-table-card"><div className="pd-empty">No sales in {fyLabel(selectedFy)}.</div></div>
          )}
        </div>

        {/* Top Customers */}
        <div className="pd-section">
          <div className="pd-section-header">
            <div className="pd-section-title">Top Customers</div>
            <div className="pd-section-controls">
              <div className="pd-field" style={{ width: 320 }}>
                <label>Search</label>
                <input
                  className="pd-input"
                  style={{ width: "100%" }}
                  placeholder="Customer code or name…"
                  value={customerSearch}
                  onChange={(e) => { setCustomerSearch(e.target.value); setCustomerPage(1); }}
                />
              </div>
              <button className="pd-export-btn" onClick={handleExportCustomers} disabled={!filteredCustomers.length}>
                Export Excel
              </button>
            </div>
          </div>

          <div className="pd-table-card">
            {visibleCustomers.length ? (
              <>
                <div className="pd-table-scroll">
                  <table className="pd-table">
                    <thead>
                      <tr>
                        <th className="pd-th-left">Customer Code</th>
                        <th className="pd-th-left">Customer Name</th>
                        <th className="pd-th-right">Total Spent (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleCustomers.map((customer) => (
                        <tr key={customer.CustomerCode}>
                          <td>{customer.CustomerCode}</td>
                          <td>{customer.CustomerName}</td>
                          <td className="pd-num">{formatCurrency(customer.TotalSpent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="pd-pagination">
                  <div className="pd-pagination-info">
                    Showing {(customerSafePage - 1) * PAGE_SIZE + 1}–{Math.min(customerSafePage * PAGE_SIZE, filteredCustomers.length)} of {filteredCustomers.length}
                  </div>
                  <Pager page={customerSafePage} totalPages={customerTotalPages} onChange={setCustomerPage} />
                </div>
              </>
            ) : (
              <div className="pd-empty">No customer data available.</div>
            )}
          </div>
        </div>

        {/* Inventory / COA */}
        <div className="pd-section">
          <div className="pd-section-header">
            <div className="pd-section-title">Inventory &amp; COA</div>
            <div className="pd-section-controls">
              <div className="pd-field" style={{ width: 320 }}>
                <label>Search</label>
                <input
                  className="pd-input"
                  style={{ width: "100%" }}
                  placeholder="Location, warehouse, batch…"
                  value={coaSearch}
                  onChange={(e) => { setCoaSearch(e.target.value); setCoaPage(1); }}
                />
              </div>
              <button className="pd-export-btn" onClick={handleExportInventory} disabled={!filteredInventory.length}>
                Export Excel
              </button>
            </div>
          </div>

          <div className="pd-table-card">
            {visibleInventory.length ? (
              <>
                <div className="pd-table-scroll">
                  <table className="pd-table">
                    <thead>
                      <tr>
                        <th className="pd-th-left">Location</th>
                        <th className="pd-th-left">Warehouse Name</th>
                        <th className="pd-th-right">Quantity</th>
                        <th className="pd-th-left">Batch Number</th>
                        <th className="pd-th-left">Vendor Batch</th>
                        <th className="pd-th-left">COA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleInventory.map((item, index) => {
                        const enhancedItem = { ...item, ItemCode: product.ItemCode };
                        return (
                          <tr key={index}>
                            <td>{item.Location}</td>
                            <td>{item.WhsName || "N/A"}</td>
                            <td className="pd-num">{Number(item.Quantity).toLocaleString()}</td>
                            <td>{item.BatchNum || "N/A"}</td>
                            <td>{item.VendorBatchNum || "N/A"}</td>
                            <td><CoaCell item={enhancedItem} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="pd-pagination">
                  <div className="pd-pagination-info">
                    Showing {(coaSafePage - 1) * PAGE_SIZE + 1}–{Math.min(coaSafePage * PAGE_SIZE, filteredInventory.length)} of {filteredInventory.length}
                  </div>
                  <Pager page={coaSafePage} totalPages={coaTotalPages} onChange={setCoaPage} />
                </div>
              </>
            ) : (
              <div className="pd-empty">No inventory data available.</div>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="pd-section">
          <div className="pd-section-title" style={{ marginBottom: 12 }}>Additional Information</div>
          <div className="pd-panel">
            <p><strong>IUPAC Name:</strong> {product.U_IUPACName || "N/A"}</p>
            <p><strong>Synonyms:</strong> {product.U_Synonyms || "N/A"}</p>
            <p><strong>Molecular Formula:</strong> {product.U_MolucularFormula || "N/A"}</p>
            <p><strong>Applications:</strong> {product.U_Applications || "N/A"}</p>
            <p style={{ marginBottom: 0 }}>
              <strong>Structure:</strong> {product.U_Structure ? <a href={product.U_Structure} target="_blank" rel="noopener noreferrer">View Structure</a> : "N/A"}
            </p>
          </div>
        </div>

        <button className="pd-back-btn" onClick={() => router.back()} style={{ marginTop: 8 }}>
          ← Back to Products
        </button>
      </div>
    </div>
  );
}

const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

  .pd {
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

  .pd-card {
    width: 100%;
    max-width: 1400px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: 0 14px 34px rgba(31, 41, 55, 0.10), 0 2px 8px rgba(31, 41, 55, 0.06);
    padding: 24px 32px 32px;
    margin: 0 auto;
  }

  .pd-back-btn {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 7px 14px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
    margin-bottom: 16px;
  }
  .pd-back-btn:hover { background: var(--border); }

  .pd-header { border-bottom: 1px solid var(--border); padding-bottom: 18px; margin-bottom: 18px; }
  .pd-header h1 { font-family: 'IBM Plex Mono', monospace; font-size: 22px; font-weight: 700; margin: 0 0 4px; }
  .pd-header-desc { font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: var(--muted); margin: 0; }

  .pd-search-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 22px;
  }
  .pd-search-form { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }

  .pd-field { display: flex; flex-direction: column; gap: 6px; position: relative; }
  .pd-field label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    font-weight: 600;
    color: var(--muted);
  }

  .pd-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: 0 8px 20px rgba(31, 41, 55, 0.15);
    max-height: 260px;
    overflow-y: auto;
    z-index: 60;
  }
  .pd-suggestion-item {
    padding: 8px 12px;
    cursor: pointer;
    font-size: 13px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .pd-suggestion-item:hover { background: var(--surface2); }
  .pd-suggestion-cat {
    font-family: 'IBM Plex Mono', monospace;
    color: var(--accent);
    font-weight: 600;
    white-space: nowrap;
  }
  .pd-suggestion-desc {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pd-suggestion-cas {
    color: var(--muted);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11.5px;
    white-space: nowrap;
  }

  .pd-input {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 8px 10px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13.5px;
    color: var(--text);
    outline: none;
  }
  .pd-input:focus { border-color: var(--accent); }

  .pd-export-btn {
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
  .pd-export-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .pd-error {
    margin-top: 10px;
    background: #fdecea;
    border: 1px solid var(--bad);
    color: var(--bad);
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 13px;
  }

  .pd-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 26px;
  }
  @media (max-width: 900px) {
    .pd-grid-2 { grid-template-columns: 1fr; }
  }

  .pd-panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px 18px;
  }
  .pd-panel p { font-size: 13.5px; margin-bottom: 10px; }
  .pd-panel-title {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 12px;
  }

  .pd-kv-table { width: 100%; border-collapse: collapse; }
  .pd-kv-table th {
    text-align: left;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11.5px;
    color: var(--muted);
    font-weight: 600;
    padding: 7px 10px 7px 0;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }
  .pd-kv-table td {
    text-align: right;
    font-size: 13px;
    padding: 7px 0;
    border-bottom: 1px solid var(--border);
  }
  .pd-kv-table tr:last-child th, .pd-kv-table tr:last-child td { border-bottom: none; }

  .pd-section { margin-bottom: 28px; }
  .pd-section-header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }
  .pd-section-title {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 15px;
    font-weight: 700;
  }
  .pd-section-controls { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }

  .pd-chart-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px;
    height: 340px;
    margin-bottom: 14px;
  }

  .pd-table-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }
  .pd-table-scroll { overflow-x: auto; }
  .pd-table { width: 100%; border-collapse: collapse; }
  .pd-table th {
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
  .pd-table th:last-child { border-right: none; }
  .pd-th-left { text-align: left; }
  .pd-th-right { text-align: right; }
  .pd-table td {
    padding: 10px 14px;
    font-size: 13px;
    border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--border);
    white-space: nowrap;
  }
  .pd-table td:last-child { border-right: none; }
  .pd-table tbody tr:last-child td { border-bottom: none; }
  .pd-table tbody tr:hover { background: var(--surface2); }
  .pd-num { text-align: right; font-family: 'IBM Plex Mono', monospace; }
  .pd-dash { color: var(--muted); }

  .pd-coa-link {
    background: none;
    border: none;
    color: var(--accent);
    font-weight: 600;
    font-size: 12.5px;
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
  }

  .pd-empty {
    text-align: center;
    color: var(--muted);
    padding: 40px 0;
    font-size: 13px;
    font-family: 'IBM Plex Mono', monospace;
  }

  .pd-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    flex-wrap: wrap;
    gap: 10px;
  }
  .pd-pagination-info { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--muted); }
  .pd-pagination-controls { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .pd-page-btn {
    background: var(--surface2);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 6px 11px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    cursor: pointer;
  }
  .pd-page-btn.active { background: var(--accent); color: #ffffff; border-color: var(--accent); font-weight: 700; }
  .pd-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .pd-page-ellipsis { color: var(--muted); font-family: 'IBM Plex Mono', monospace; font-size: 12px; }
`;

export async function getServerSideProps(context) {
  const { id } = context.params;

  function serializeDates(obj) {
    const serializedObj = { ...obj };
    for (const key in serializedObj) {
      if (serializedObj[key] instanceof Date) {
        serializedObj[key] = serializedObj[key].toISOString();
      }
    }
    return serializedObj;
  }

  try {
    const product = await getProductDetail(id);

    if (!product) {
      return {
        props: {
          initialProduct: null,
        },
      };
    }

    const serializedProduct = serializeDates(product);

    const { kpiData, salesTrendData, topCustomersData, inventoryData } = await getProductKPIs(id);

    const serializedKPIData = kpiData ? serializeDates(kpiData) : null;

    const serializedSalesTrendData = salesTrendData ? salesTrendData.map(item => serializeDates(item)) : [];
    const serializedTopCustomersData = topCustomersData ? topCustomersData.map(item => serializeDates(item)) : [];
    const serializedInventoryData = inventoryData ? inventoryData.map(item => serializeDates(item)) : [];

    return {
      props: {
        initialProduct: serializedProduct,
        initialKpiData: serializedKPIData,
        initialSalesTrendData: serializedSalesTrendData,
        initialTopCustomersData: serializedTopCustomersData,
        initialInventoryData: serializedInventoryData,
      },
    };
  } catch (error) {
    console.error("Error fetching product data:", error);
    return {
      props: {
        initialProduct: null,
      },
    };
  }
}
