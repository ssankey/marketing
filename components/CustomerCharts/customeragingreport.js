// components/CustomerCharts/customeragingreport.js
// Customer Balance Report — now reads /api/customers/[id]/aging.js's
// corrected OINV-based buckets (see that file's header comment) and is
// restyled to match the same visual language as the main Customer Balance
// page's chart (components/page/customer-balance/chart/CustomerBalanceChart.js's
// `.cbc-` design), scoped here under its own `.car-` tokens (same values)
// since this component is also usable on its own, outside that page's `.cd`
// wrapper. Filter logic (Sales Person / Category dropdown + react-select
// search) is unchanged from before — only the chart/table presentation and
// the data source changed.
import React, { useState, useRef, useCallback } from "react";
import { Spinner, Button, Dropdown } from "react-bootstrap";
import Select from "react-select";
import debounce from "lodash/debounce";
import { formatCurrency } from "utils/formatCurrency";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BUCKET_ORDER = ["0-30 Days", "31-60 Days", "61-90 Days", "91+ Days"];
const BUCKET_COLORS = {
  "0-30 Days": "#21875a",
  "31-60 Days": "#d4a017",
  "61-90 Days": "#c0763a",
  "91+ Days": "#c0402f",
};
const COUNT_KEY = {
  "0-30 Days": "0-30 Count",
  "31-60 Days": "31-60 Count",
  "61-90 Days": "61-90 Count",
  "91+ Days": "91+ Count",
};

const EMPTY_DATA = {
  "0-30 Days": 0,
  "31-60 Days": 0,
  "61-90 Days": 0,
  "91+ Days": 0,
  "Total Balance": 0,
  "0-30 Count": 0,
  "31-60 Count": 0,
  "61-90 Count": 0,
  "91+ Count": 0,
  "Total Count": 0,
};

const API_ENDPOINTS = {
  salesPerson: "/api/dashboard/sales-person/distinct-salesperson",
  category: "/api/products/categories",
};

const CustomerAgingChart = ({ cardCode }) => {
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  const [searchType, setSearchType] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const selectRef = useRef(null);
  const cache = useRef({});

  const [filters, setFilters] = useState({ salesPerson: null, category: null });

  const fetchAgingData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.salesPerson) params.append("salesPerson", filters.salesPerson.value);
      if (filters.category) params.append("category", filters.category.value);

      const response = await fetch(`/api/customers/${cardCode}/aging?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch aging data");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching customer aging data:", error);
      setData(EMPTY_DATA);
    } finally {
      setLoading(false);
    }
  }, [cardCode, filters]);

  React.useEffect(() => {
    if (cardCode) fetchAgingData();
  }, [cardCode, fetchAgingData]);

  const handleSearchTypeSelect = async (type) => {
    setSearchType(type);
    setSelectedValue(null);
    setInputValue("");
    setSuggestions([]);
    if (type === "salesPerson" || type === "category") {
      await fetchSuggestions("", true);
    }
  };

  const fetchSuggestions = async (query = "", initialLoad = false) => {
    if (!searchType) return;
    if (!initialLoad && !query) return;

    const cacheKey = `${searchType}_${query}`;
    if (cache.current[cacheKey]) {
      setSuggestions(cache.current[cacheKey]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const url = `${API_ENDPOINTS[searchType]}?search=${encodeURIComponent(query)}&page=1&limit=50`;
      const response = await fetch(url);
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

  const debouncedFetchSuggestions = useCallback(
    debounce(async (query) => { await fetchSuggestions(query); }, 500),
    [searchType]
  );

  const handleInputChange = (val, { action }) => {
    if (action === "input-change") {
      setInputValue(val);
      debouncedFetchSuggestions(val);
    }
  };

  const handleFocus = () => {
    if (searchType) fetchSuggestions(inputValue, true);
  };

  const handleOptionSelect = (option) => {
    setSelectedValue(option);
    setFilters((prev) => ({
      ...prev,
      [searchType]: option ? { value: option.value, label: option.label } : null,
    }));
  };

  const handleReset = () => {
    setSearchType(null);
    setSelectedValue(null);
    setInputValue("");
    setFilters({ salesPerson: null, category: null });
  };

  const chartData = {
    labels: BUCKET_ORDER,
    datasets: [
      {
        label: "Outstanding Amount",
        data: BUCKET_ORDER.map((b) => data[b] || 0),
        backgroundColor: BUCKET_ORDER.map((b) => BUCKET_COLORS[b]),
        borderWidth: 0,
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 88,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      // chartjs-plugin-datalabels is registered globally by sibling charts
      // on this same page (e.g. components/CustomerCharts/purchasevsamount.js)
      // — Chart.js plugin registration is process-wide, not per-chart, so
      // without this it silently turns on here too and stamps the raw
      // value directly onto each bar.
      datalabels: { display: false },
      tooltip: {
        backgroundColor: "#10151c",
        padding: 12,
        cornerRadius: 6,
        titleFont: { weight: "600" },
        callbacks: {
          label: (ctx) => {
            const bucket = BUCKET_ORDER[ctx.dataIndex];
            const count = data[COUNT_KEY[bucket]] || 0;
            return [`Amount: ${formatCurrency(ctx.parsed.y || 0)}`, `Invoices: ${count}`];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: "#c5d2dc" },
        ticks: { color: "#52606d", font: { family: "'IBM Plex Mono', monospace", size: 11, weight: "500" } },
      },
      y: {
        grid: { color: "#e0edf9" },
        border: { display: false },
        ticks: { color: "#52606d", font: { family: "'IBM Plex Mono', monospace", size: 11 }, callback: (v) => formatCurrency(v) },
        beginAtZero: true,
      },
    },
  };

  const totalBalance = data["Total Balance"] || 0;
  const anyActive = Boolean(filters.salesPerson || filters.category);

  return (
    <div className="car">
      <style>{CAR_STYLES}</style>

      <div className="car-toolbar">
        <div className="car-title">Overdue Balance by Aging</div>
        <div className="car-filters">
          <Dropdown onSelect={handleSearchTypeSelect}>
            <Dropdown.Toggle variant="outline-secondary" id="aging-search-dropdown" size="sm">
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
              noOptionsMessage={() => (loadingSuggestions ? "Loading..." : "No results")}
              styles={{
                control: (base, state) => ({ ...base, minHeight: 34, fontSize: 13, borderColor: state.isFocused ? "#1f68bf" : "#c5d2dc" }),
              }}
            />
          </div>

          <Button variant="outline-secondary" size="sm" onClick={handleReset} disabled={!searchType && !anyActive}>
            Reset
          </Button>
        </div>
      </div>

      <div className="car-card">
        {loading ? (
          <div className="car-loading">
            <Spinner animation="border" size="sm" />
            <span>Loading…</span>
          </div>
        ) : totalBalance <= 0 ? (
          <div className="car-empty">No outstanding balance for the current filter.</div>
        ) : (
          <>
            <div style={{ height: 280 }}>
              <Bar data={chartData} options={chartOptions} />
            </div>

            <div className="car-table-scroll mt-3">
              <table className="car-table">
                <thead>
                  <tr>
                    <th className="car-th-left">Aging Range</th>
                    <th className="car-th-right">Amount</th>
                    <th className="car-th-right">Invoices</th>
                    <th className="car-th-right">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {BUCKET_ORDER.map((b) => {
                    const amount = data[b] || 0;
                    const count = data[COUNT_KEY[b]] || 0;
                    const pct = totalBalance > 0 ? (amount / totalBalance) * 100 : 0;
                    return (
                      <tr key={b}>
                        <td>
                          <span className="car-swatch" style={{ backgroundColor: BUCKET_COLORS[b] }} />
                          {b}
                        </td>
                        <td className="car-num">{formatCurrency(amount)}</td>
                        <td className="car-num">{count}</td>
                        <td className="car-num">{pct.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td className="car-num">{formatCurrency(totalBalance)}</td>
                    <td className="car-num">{data["Total Count"] || 0}</td>
                    <td className="car-num">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerAgingChart;

// Same tokens/typography as pages/customers/[id].js's `.cd-` system and
// components/page/customer-balance/chart/CustomerBalanceChart.js's `.cbc-`
// system — kept self-contained here (not relying on an ancestor `.cd`
// wrapper) since this component is also usable on its own.
const CAR_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

  .car {
    --surface: #ffffff;
    --surface2: #e0edf9;
    --border: #c5d2dc;
    --text: #10151c;
    --muted: #52606d;
    --accent: #1f68bf;
    font-family: 'IBM Plex Sans', sans-serif;
    color: var(--text);
  }

  .car-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; flex-wrap: wrap; margin-bottom: 14px;
  }
  .car-title {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.5px; color: var(--text);
  }
  .car-filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

  .car-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 18px;
  }

  .car-loading, .car-empty {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 50px 0; color: var(--muted);
    font-family: 'IBM Plex Mono', monospace; font-size: 13px;
  }

  .car-table-scroll { overflow-x: auto; }
  .car-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .car-table th {
    background: var(--surface2);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;
    font-weight: 600; color: var(--muted);
    border-bottom: 1px solid var(--border);
    padding: 8px 12px; white-space: nowrap;
  }
  .car-th-left { text-align: left; }
  .car-th-right { text-align: right; }
  .car-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); color: var(--text); }
  .car-table tbody tr:hover { background: var(--surface2); }
  .car-table tbody tr:last-child td { border-bottom: none; }
  .car-num { text-align: right; font-family: 'IBM Plex Mono', monospace; }
  .car-table tfoot td { font-weight: 700; border-top: 2px solid var(--border); border-bottom: none; background: #f0f4ff; color: var(--accent); }
  .car-swatch { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 8px; }
`;
