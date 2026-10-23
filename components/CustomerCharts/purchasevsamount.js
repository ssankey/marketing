// components/CustomerCharts/purchasevsamount.js
// "Orders & Invoices — Monthly" — rebuilt onto the same `.cd-`-style design
// system as the Order Fulfillment Lifecycle chart (ordertodelievery.js) and
// Customer Balance Report (customeragingreport.js), replacing the raw
// react-bootstrap Card/Table/stat-cards. Bar colors switched from the old
// pastel set to the same darker, saturated palette used on the Order →
// Invoice Performance chart.
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import { Spinner, Dropdown, Button } from "react-bootstrap";
import Select from "react-select";
import debounce from "lodash/debounce";
import { formatCurrency } from "utils/formatCurrency";
import { fyStartYear, fyLabel } from "utils/financialYear";
import ChartDataLabels from "chartjs-plugin-datalabels";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  ChartDataLabels
);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Matches the main dashboard's Sales/COGS chart (components/EnhancedSalesCOGSChart.js's
// `C` palette) wherever the two charts share a concept, so the same thing
// reads as the same color everywhere: Invoice Total here *is* Sales there
// (#124f94), Orders Total *is* Order Value there (#F39C12), and Line Items
// *is* Lines there (#219cba). Orders Count has no equivalent on that chart,
// so it gets its own distinct color.
const SERIES_COLORS = {
  ordersCount: "#7c3aed",
  ordersTotal: "#F39C12",
  lineItems: "#219cba",
  invoiceTotal: "#124f94",
};

const PurchasesAmountChart = ({ customerId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_ENDPOINTS = {
    salesPerson: "/api/dashboard/sales-person/distinct-salesperson",
    category: "/api/products/categories",
  };

  const [searchType, setSearchType] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const selectRef = useRef(null);
  const cache = useRef({});

  const [filters, setFilters] = useState({ salesPerson: null, category: null });

  const currentFyStart = fyStartYear(new Date().getFullYear(), new Date().getMonth() + 1);
  const [selectedFy, setSelectedFy] = useState(currentFyStart);
  const fyOptions = [];
  for (let y = 2024; y <= currentFyStart; y++) fyOptions.push(y);

  const fetchCustomerData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.salesPerson) params.append("salesPerson", filters.salesPerson.value);
      if (filters.category) params.append("category", filters.category.value);

      const response = await fetch(`/api/customers/${customerId}/metrics?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch data");
      setData(await response.json());
    } catch (error) {
      console.error("Error fetching customer data:", error);
    } finally {
      setLoading(false);
    }
  }, [customerId, filters]);

  useEffect(() => { fetchCustomerData(); }, [fetchCustomerData]);

  const handleSearchTypeSelect = async (type) => {
    setSearchType(type);
    setSelectedValue(null);
    setInputValue("");
    setSuggestions([]);
    if (type === "salesPerson" || type === "category") await fetchSuggestions("", true);
  };

  const debouncedFetchSuggestions = useCallback(debounce(async (query) => { await fetchSuggestions(query); }, 500), [searchType]);

  const fetchSuggestions = async (query = "", initialLoad = false) => {
    if (!searchType) return;
    if (!initialLoad && !query) return;

    const cacheKey = `${searchType}_${query}`;
    if (cache.current[cacheKey]) { setSuggestions(cache.current[cacheKey]); return; }

    setLoadingSuggestions(true);
    try {
      const response = await fetch(`${API_ENDPOINTS[searchType]}?search=${encodeURIComponent(query)}&page=1&limit=50`);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const result = await response.json();

      let formatted = [];
      if (searchType === "salesPerson") {
        formatted = result.salesEmployees?.map((emp) => ({ value: emp.value, label: `${emp.value} - ${emp.label}` })) || [];
      } else if (searchType === "category") {
        formatted = result.categories?.map((cat) => ({ value: cat, label: cat })) || [];
      }
      cache.current[cacheKey] = formatted;
      setSuggestions(formatted);
    } catch (error) {
      console.error(`Error fetching ${searchType} suggestions:`, error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleInputChange = (val, { action }) => {
    if (action === "input-change") { setInputValue(val); debouncedFetchSuggestions(val); }
  };

  const handleFocus = () => { if (searchType) fetchSuggestions(inputValue, true); };

  const handleOptionSelect = (option) => {
    setSelectedValue(option);
    setFilters((prev) => ({ ...prev, [searchType]: option ? { value: option.value, label: option.label } : null }));
  };

  const handleReset = () => {
    setSearchType(null);
    setSelectedValue(null);
    setInputValue("");
    setFilters({ salesPerson: null, category: null });
  };

  const fyData = data.filter((item) => fyStartYear(item.Year, item.Month) === selectedFy);
  const filteredData = fyData.filter(
    (item) => item.InvoiceAmount > 0 || item.OrderAmount > 0 || item.InvoiceCount > 0 || item.OrderCount > 0
  );

  const chartLabels = filteredData.map((item) => {
    const date = new Date(item.Date);
    return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  });

  const totals = fyData.reduce(
    (acc, item) => ({
      totalOrderAmount: acc.totalOrderAmount + (item.OrderAmount || 0),
      totalOrderCount: acc.totalOrderCount + (item.OrderCount || 0),
      totalLineItems: acc.totalLineItems + (item.InvoiceCount || 0),
      totalInvoiceAmount: acc.totalInvoiceAmount + (item.InvoiceAmount || 0),
    }),
    { totalOrderAmount: 0, totalOrderCount: 0, totalLineItems: 0, totalInvoiceAmount: 0 }
  );

  const chartData = {
    labels: chartLabels,
    datasets: [
      { label: "Orders Count", data: filteredData.map((i) => i.OrderCount), backgroundColor: SERIES_COLORS.ordersCount, borderRadius: 4, yAxisID: "y1", barPercentage: 0.9, categoryPercentage: 0.8 },
      { label: "Orders Total (₹)", data: filteredData.map((i) => i.OrderAmount), backgroundColor: SERIES_COLORS.ordersTotal, borderRadius: 4, yAxisID: "y", barPercentage: 0.9, categoryPercentage: 0.8 },
      { label: "Line Items", data: filteredData.map((i) => i.InvoiceCount), backgroundColor: SERIES_COLORS.lineItems, borderRadius: 4, yAxisID: "y1", barPercentage: 0.9, categoryPercentage: 0.8 },
      { label: "Invoice Total (₹)", data: filteredData.map((i) => i.InvoiceAmount), backgroundColor: SERIES_COLORS.invoiceTotal, borderRadius: 4, yAxisID: "y", barPercentage: 0.9, categoryPercentage: 0.8 },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: true, position: "top", labels: { font: { family: "'IBM Plex Mono', monospace", size: 11 }, boxWidth: 12 } },
      tooltip: {
        backgroundColor: "#10151c",
        titleFont: { size: 13, weight: "600" },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 6,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || "";
            const value = context.raw;
            return label.includes("Total") ? `${label}: ${formatCurrency(value)}` : `${label}: ${value}`;
          },
          title: (items) => items[0].label,
        },
      },
      datalabels: { display: false },
    },
    scales: {
      x: { stacked: false, grid: { display: false }, ticks: { font: { family: "'IBM Plex Mono', monospace", size: 11 } } },
      y: {
        type: "linear", position: "left", beginAtZero: true,
        grid: { color: "#e0edf9" }, border: { display: false },
        title: { display: true, text: "Amount (₹)", font: { family: "'IBM Plex Mono', monospace", size: 11 } },
        ticks: { callback: (v) => formatCurrency(v), font: { family: "'IBM Plex Mono', monospace", size: 11 } },
      },
      y1: {
        type: "linear", position: "right", beginAtZero: true,
        grid: { drawOnChartArea: false },
        title: { display: true, text: "Count", font: { family: "'IBM Plex Mono', monospace", size: 11 } },
        ticks: { font: { family: "'IBM Plex Mono', monospace", size: 11 } },
      },
    },
  };

  return (
    <div className="pam">
      <style>{PAM_STYLES}</style>

      <div className="pam-toolbar">
        <div className="pam-stats">
          <div className="pam-stat">
            <div className="pam-stat-label">Total Orders</div>
            <div className="pam-stat-value">{totals.totalOrderCount}</div>
          </div>
          <div className="pam-stat">
            <div className="pam-stat-label">Order Amount</div>
            <div className="pam-stat-value">{formatCurrency(totals.totalOrderAmount)}</div>
          </div>
          <div className="pam-stat">
            <div className="pam-stat-label">Line Items</div>
            <div className="pam-stat-value">{totals.totalLineItems}</div>
          </div>
          <div className="pam-stat">
            <div className="pam-stat-label">Invoice Amount</div>
            <div className="pam-stat-value">{formatCurrency(totals.totalInvoiceAmount)}</div>
          </div>
        </div>

        <div className="pam-toolbar-right">
          <Dropdown onSelect={(val) => setSelectedFy(parseInt(val, 10))}>
            <Dropdown.Toggle variant="outline-dark" id="fy-filter-purchases" size="sm">
              {fyLabel(selectedFy)}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {[...fyOptions].reverse().map((y) => (
                <Dropdown.Item key={y} eventKey={y} active={y === selectedFy}>{fyLabel(y)}</Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown onSelect={handleSearchTypeSelect}>
            <Dropdown.Toggle variant="outline-secondary" id="search-dropdown-pam">
              {searchType ? (searchType === "salesPerson" ? "Sales Person" : "Category") : "Filter By"}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item eventKey="salesPerson">Sales Person</Dropdown.Item>
              <Dropdown.Item eventKey="category">Category</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <div style={{ width: 260 }}>
            <Select
              ref={selectRef}
              value={selectedValue}
              inputValue={inputValue}
              onChange={handleOptionSelect}
              onInputChange={handleInputChange}
              onFocus={handleFocus}
              options={suggestions}
              isLoading={loadingSuggestions}
              isClearable
              isDisabled={!searchType}
              placeholder={searchType ? `Search ${searchType === "salesPerson" ? "Sales Person" : "Category"}` : "Select filter type"}
              noOptionsMessage={() => (loadingSuggestions ? "Loading..." : "No results found")}
              styles={{ control: (base, state) => ({ ...base, minHeight: 34, fontSize: 13, borderColor: state.isFocused ? "#1f68bf" : "#c5d2dc" }) }}
            />
          </div>

          <Button variant="primary" onClick={handleReset} disabled={!searchType && !filters.salesPerson && !filters.category}>
            Reset
          </Button>
        </div>
      </div>

      <div className="pam-card">
        {loading ? (
          <div className="pam-loading"><Spinner animation="border" size="sm" /><span>Loading…</span></div>
        ) : fyData.length === 0 ? (
          <div className="pam-empty">No purchase data in {fyLabel(selectedFy)}.</div>
        ) : (
          <>
            <div style={{ height: 380 }}>
              <Bar data={chartData} options={chartOptions} />
            </div>

            {filteredData.length > 0 && (
              <div className="pam-table-scroll mt-3">
                <table className="pam-table">
                  <thead>
                    <tr>
                      <th className="pam-th-left">Metric</th>
                      {filteredData.map((item, i) => {
                        const date = new Date(item.Date);
                        return <th key={i} className="pam-th-right">{MONTHS[date.getMonth()]} {date.getFullYear()}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="pam-swatch" style={{ background: SERIES_COLORS.ordersCount }} />Orders Count</td>
                      {filteredData.map((item, i) => <td key={i} className="pam-num">{item.OrderCount}</td>)}
                    </tr>
                    <tr>
                      <td><span className="pam-swatch" style={{ background: SERIES_COLORS.ordersTotal }} />Orders Total (₹)</td>
                      {filteredData.map((item, i) => <td key={i} className="pam-num">{formatCurrency(item.OrderAmount)}</td>)}
                    </tr>
                    <tr>
                      <td><span className="pam-swatch" style={{ background: SERIES_COLORS.lineItems }} />Line Items</td>
                      {filteredData.map((item, i) => <td key={i} className="pam-num">{item.InvoiceCount}</td>)}
                    </tr>
                    <tr>
                      <td><span className="pam-swatch" style={{ background: SERIES_COLORS.invoiceTotal }} />Invoice Total (₹)</td>
                      {filteredData.map((item, i) => <td key={i} className="pam-num">{formatCurrency(item.InvoiceAmount)}</td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PurchasesAmountChart;

// Self-contained tokens (same values as the `.cd-`/`.ofl-`/`.car-` systems
// elsewhere on the customer detail page) — not relying on inheriting from
// an ancestor, since this component is reusable on its own.
const PAM_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

  .pam {
    --surface: #ffffff;
    --surface2: #e0edf9;
    --border: #c5d2dc;
    --text: #10151c;
    --muted: #52606d;
    --accent: #1f68bf;
    font-family: 'IBM Plex Sans', sans-serif;
    color: var(--text);
  }

  .pam-toolbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
  .pam-stats { display: flex; gap: 10px; flex-wrap: wrap; }
  .pam-stat {
    background: var(--surface2); border: 1px solid var(--border); border-radius: 8px;
    padding: 10px 16px; min-width: 130px;
  }
  .pam-stat-label {
    font-family: 'IBM Plex Mono', monospace; font-size: 10px; text-transform: uppercase;
    letter-spacing: 0.5px; color: var(--muted); margin-bottom: 4px;
  }
  .pam-stat-value { font-family: 'IBM Plex Mono', monospace; font-size: 16px; font-weight: 700; color: var(--accent); }

  .pam-toolbar-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

  .pam-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 18px; }

  .pam-loading, .pam-empty {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 60px 0; color: var(--muted); font-family: 'IBM Plex Mono', monospace; font-size: 13px;
  }

  .pam-table-scroll { overflow-x: auto; }
  .pam-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .pam-table th {
    background: var(--surface2); font-family: 'IBM Plex Mono', monospace; font-size: 10.5px;
    text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; color: var(--muted);
    border-bottom: 1px solid var(--border); padding: 8px 12px; white-space: nowrap;
  }
  .pam-th-left { text-align: left; }
  .pam-th-right { text-align: right; }
  .pam-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); color: var(--text); white-space: nowrap; }
  .pam-table tbody tr:last-child td { border-bottom: none; }
  .pam-table tbody tr:hover { background: var(--surface2); }
  .pam-num { text-align: right; font-family: 'IBM Plex Mono', monospace; }
  .pam-swatch { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 8px; }
`;
