// components/CustomerCharts/ordertodelievery.js
// Order Fulfillment Lifecycle — a 3-way switchable view (Order → Invoice /
// Invoice → Dispatch / Dispatch → Delivery) over the same chart+table shape,
// with user-configurable day-range buckets and a click-through drill-down
// modal. Each mode fetches ONE raw-row array (one row per line, carrying
// both milestone dates, their day-diff, and item details) and does all
// bucketing/charting/drilling client-side — see pages/api/customers/[id]/
// delivery-performance.js's header comment for why (no SQL-side hardcoded
// buckets, and the same fetched rows back the drill-down modal with no
// second network call).
//
// Rebuilt in the `.cd-` design system (pages/customers/[id].js's PAGE_STYLES,
// the only page this is rendered on today) for the new chart/table/toolbar;
// the existing Sales Person/Category/Customer/Contact Person filter picker
// keeps its original react-bootstrap Dropdown+Select implementation
// unchanged, same as before this rebuild.
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { Spinner, Button, Dropdown } from "react-bootstrap";
import Select from "react-select";
import debounce from "lodash/debounce";
import { useAuth } from 'contexts/AuthContext';
import { fyStartYear, fyLabel, parseMonthAbbrLabel } from "utils/financialYear";
import { formatDate } from "utils/formatDate";
import LifecycleDrilldownModal from "./LifecycleDrilldownModal";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_ENDPOINTS = {
  salesPerson: "/api/dashboard/sales-person/distinct-salesperson",
  category: "/api/products/categories",
  customer: "/api/customers/distinct-customer",
  contactPerson: "/api/dashboard/contact-person/distinct-contact-person",
};

const DEFAULT_CUTOFFS = [3, 5, 8, 10];
const BUCKET_PALETTE = ["#21875a", "#d4a017", "#c0763a", "#c0402f", "#7c3aed", "#0891b2", "#be185d", "#525252"];

const itemDetailsRender = (value, row) =>
  value ? `${value}${row.itemDescription ? ` — ${row.itemDescription}` : ""}` : (row.itemDescription || "N/A");

// One static title regardless of which of the 3 stages is selected — the
// mode toggle itself already says which stage you're on.
const LIFECYCLE_TITLE = "Order Fulfillment Lifecycle";

const extraDetailColumns = [
  { key: "category", header: "Category" },
  { key: "salesPerson", header: "Sales Person" },
  { key: "customer", header: "Customer" },
  { key: "contactPerson", header: "Contact Person" },
];

const MODES = {
  orderToInvoice: {
    label: "Order → Invoice",
    perCustomerPath: (id) => `/api/customers/${id}/delivery-performance`,
    allPath: "/api/customers/all-delivery-performance",
    note: null,
    drillColumns: [
      { key: "orderNo", header: "Order No" },
      { key: "orderDate", header: "Order Date", render: (v) => formatDate(v) },
      { key: "invoiceDate", header: "Invoice Date", render: (v) => formatDate(v) },
      { key: "invoiceNo", header: "Invoice No" },
      { key: "itemCode", header: "Item Details", render: itemDetailsRender },
      ...extraDetailColumns,
    ],
  },
  invoiceToDispatch: {
    label: "Invoice → Dispatch",
    perCustomerPath: (id) => `/api/customers/${id}/invoice-to-dispatch`,
    allPath: "/api/customers/all-invoice-to-dispatch",
    note: null,
    drillColumns: [
      { key: "invoiceNo", header: "Invoice No" },
      { key: "invoiceDate", header: "Invoice Date", render: (v) => formatDate(v) },
      { key: "dispatchDate", header: "Dispatch Date", render: (v) => formatDate(v) },
      { key: "itemCode", header: "Item Details", render: itemDetailsRender },
      ...extraDetailColumns,
    ],
  },
  dispatchToDelivery: {
    label: "Dispatch → Delivery",
    perCustomerPath: (id) => `/api/customers/${id}/dispatch-to-delivery`,
    allPath: "/api/customers/all-dispatch-to-delivery",
    note: null,
    drillColumns: [
      { key: "invoiceNo", header: "Invoice No" },
      { key: "dispatchDate", header: "Dispatch Date", render: (v) => formatDate(v) },
      { key: "deliveryDate", header: "Delivery Date", render: (v) => formatDate(v) },
      { key: "itemCode", header: "Item Details", render: itemDetailsRender },
      ...extraDetailColumns,
    ],
  },
};

const bucketLabels = (cutoffs) =>
  cutoffs.map((c, i) => (i === 0 ? `0–${c} Days` : `${cutoffs[i - 1] + 1}–${c} Days`)).concat(`>${cutoffs[cutoffs.length - 1]} Days`);

const bucketIndexFor = (dayDiff, cutoffs) => {
  const d = Math.max(0, dayDiff ?? 0);
  for (let i = 0; i < cutoffs.length; i++) {
    if (d <= cutoffs[i]) return i;
  }
  return cutoffs.length;
};

export default function DeliveryPerformanceChart({ customerId }) {
  const { user } = useAuth();
  const [mode, setMode] = useState("orderToInvoice");
  const [rawRows, setRawRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isCustomer = user?.role === "contact_person";

  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLS] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const cache = useRef({});

  const [searchType, setSearchType] = useState(null);
  const [filters, setFilters] = useState({ salesPerson: null, category: null, customer: null, contactPerson: null });

  const allowedTypes = customerId
    ? ["salesPerson", "category", "contactPerson"]
    : ["salesPerson", "category", "customer", "contactPerson"];

  const currentFyStart = fyStartYear(new Date().getFullYear(), new Date().getMonth() + 1);
  const [selectedFy, setSelectedFy] = useState(currentFyStart);
  const fyOptions = [];
  for (let y = 2024; y <= currentFyStart; y++) fyOptions.push(y);

  // Range config — shared across all 3 modes, default matches the original
  // fixed 5-bucket scheme (0–3 / 4–5 / 6–8 / 9–10 / >10 days). Component
  // state only: resets to default on reload, no persistence. draftCutoffs
  // is edited as a structured list of "to" values (one per range, each
  // range's "from" is derived, not editable) rather than free text, so a
  // layperson can't accidentally produce overlapping/backwards ranges —
  // validateDraft() below is the single source of truth for what's allowed.
  const [cutoffs, setCutoffs] = useState(DEFAULT_CUTOFFS);
  const [draftCutoffs, setDraftCutoffs] = useState(DEFAULT_CUTOFFS);
  const [showRangeEditor, setShowRangeEditor] = useState(false);

  const [drilldown, setDrilldown] = useState(null); // { month, bucketIndex } | null

  useEffect(() => {
    if (!isCustomer && searchType && !allowedTypes.includes(searchType)) {
      setSearchType(null);
      setSelectedValue(null);
      setInputValue("");
    }
  }, [searchType, allowedTypes, isCustomer]);

  const fetchData = useCallback(async (activeFilters, activeMode) => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (isCustomer) {
        if (activeFilters.contactPerson) params.append("contactPerson", activeFilters.contactPerson);
      } else {
        if (activeFilters.salesPerson) params.append("salesPerson", activeFilters.salesPerson);
        if (activeFilters.category) params.append("category", activeFilters.category);
        if (!customerId && activeFilters.customer) params.append("customer", activeFilters.customer);
        if (activeFilters.contactPerson) params.append("contactPerson", activeFilters.contactPerson);
      }

      const modeConfig = MODES[activeMode];
      const endpoint = customerId ? modeConfig.perCustomerPath(customerId) : modeConfig.allPath;

      const response = await fetch(`${endpoint}?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      setRawRows(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Error fetching lifecycle data:", err);
      setError(err.message);
      setRawRows([]);
    } finally {
      setLoading(false);
    }
  }, [customerId, user, isCustomer]);

  useEffect(() => {
    fetchData(filters, mode);
  }, [customerId, filters, user, mode, fetchData]);

  const getSuggestions = async (q = "", initial = false) => {
    if (!q && !initial) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const type = isCustomer ? "contactPerson" : searchType;
    if (!type) return;

    const key = `${type}_${q}`;
    if (cache.current[key]) return setSuggestions(cache.current[key]);

    setLS(true);
    try {
      const res = await fetch(`${API_ENDPOINTS[type]}?search=${encodeURIComponent(q)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      let opts = [];
      switch (type) {
        case "salesPerson":
          opts = json.salesEmployees?.map((e) => ({ value: e.value, label: `${e.value} - ${e.label}` })) ?? [];
          break;
        case "category":
          opts = json.categories?.map((c) => ({ value: c.value ?? c, label: c.label ?? c })) ?? [];
          break;
        case "customer":
          opts = json.customers?.map((c) => ({ value: c.value, label: c.label })) ?? [];
          break;
        case "contactPerson":
          opts = json.contactPersons?.map((c) => ({ value: c.value, label: c.label })) ?? [];
          break;
        default:
          break;
      }
      cache.current[key] = opts;
      setSuggestions(opts);
    } catch (err) {
      console.error("suggestion error:", err);
      setSuggestions([]);
    } finally {
      setLS(false);
    }
  };

  const debouncedFetch = useCallback(debounce(getSuggestions, 500), [isCustomer, searchType]);

  const chooseOption = (opt) => {
    setSelectedValue(opt);
    setInputValue(opt ? opt.label : "");
    if (isCustomer) {
      setFilters((prev) => ({ ...prev, contactPerson: opt ? opt.value : null }));
    } else {
      setFilters((prev) => ({ ...prev, [searchType]: opt ? opt.value : null }));
    }
  };

  const chooseType = async (type) => {
    if (!allowedTypes.includes(type)) return;
    setSearchType(type);
    setSelectedValue(null);
    setInputValue("");
    setSuggestions([]);
    await getSuggestions("", true);
  };

  const resetAll = () => {
    if (isCustomer) {
      setSelectedValue(null);
      setInputValue("");
      setFilters({ contactPerson: null });
    } else {
      setSearchType(null);
      setSelectedValue(null);
      setInputValue("");
      setFilters({ salesPerson: null, category: null, customer: null, contactPerson: null });
    }
  };

  const handleInputChange = (val, actionMeta) => {
    if (actionMeta.action === 'input-change') {
      setInputValue(val);
      debouncedFetch(val);
    }
  };

  // ── FY-scoped rows + chronologically-sorted month list ──
  const fyRows = useMemo(() => {
    return rawRows.filter((r) => {
      const parsed = parseMonthAbbrLabel(r.month, "-");
      return parsed && fyStartYear(parsed.year, parsed.month) === selectedFy;
    });
  }, [rawRows, selectedFy]);

  const months = useMemo(() => {
    const unique = Array.from(new Set(fyRows.map((r) => r.month)));
    return unique.sort((a, b) => {
      const pa = parseMonthAbbrLabel(a, "-");
      const pb = parseMonthAbbrLabel(b, "-");
      return pa.year - pb.year || pa.month - pb.month;
    });
  }, [fyRows]);

  const labels = useMemo(() => bucketLabels(cutoffs), [cutoffs]);

  // monthBucketCounts[monthIdx][bucketIdx] = count
  const monthBucketCounts = useMemo(() => {
    const grid = months.map(() => new Array(labels.length).fill(0));
    fyRows.forEach((r) => {
      const mi = months.indexOf(r.month);
      if (mi === -1) return;
      const bi = bucketIndexFor(r.dayDiff, cutoffs);
      grid[mi][bi] += 1;
    });
    return grid;
  }, [fyRows, months, cutoffs, labels.length]);

  const chartData = {
    labels: months,
    datasets: labels.map((lbl, bi) => ({
      label: lbl,
      backgroundColor: BUCKET_PALETTE[bi % BUCKET_PALETTE.length],
      data: months.map((_, mi) => monthBucketCounts[mi][bi]),
    })),
  };

  const openDrilldown = (monthIdx, bucketIdx) => {
    setDrilldown({ month: months[monthIdx], bucketIndex: bucketIdx });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    onClick: (evt, elements, chart) => {
      if (!elements || elements.length === 0) return;
      const el = elements[0];
      openDrilldown(el.index, el.datasetIndex);
    },
    plugins: {
      datalabels: { display: false },
      tooltip: { mode: "index", intersect: false, padding: 12, titleFont: { size: 14, weight: "bold" }, bodyFont: { size: 13 } },
      legend: { position: "top", labels: { font: { family: "'IBM Plex Mono', monospace", size: 11 } } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: "'IBM Plex Mono', monospace", size: 11 } } },
      y: { beginAtZero: true, title: { display: true, text: "Number of Invoices" }, ticks: { font: { family: "'IBM Plex Mono', monospace", size: 11 } } },
    },
  };

  const labelMap = { salesPerson: "Sales Person", category: "Category", customer: "Customer", contactPerson: "Contact Person" };
  const anyActive = isCustomer ? filters.contactPerson !== null : Object.values(filters).some(Boolean);

  // Each row's "to" must be a whole number strictly greater than the
  // previous row's "to" — this is the only rule that matters, since it's
  // exactly what guarantees ranges stay contiguous and never overlap
  // (row i's "from" is always row i-1's "to" + 1, computed, never typed).
  const validateDraft = (arr) => {
    for (let i = 0; i < arr.length; i++) {
      if (!Number.isFinite(arr[i]) || arr[i] < 0) return `Range ${i + 1}: enter a whole number.`;
      if (i > 0 && arr[i] <= arr[i - 1]) return `Range ${i + 1}: must be greater than Range ${i}'s cutoff (${arr[i - 1]}).`;
    }
    return "";
  };

  const draftError = showRangeEditor ? validateDraft(draftCutoffs) : "";

  const openRangeEditor = () => {
    if (!showRangeEditor) setDraftCutoffs(cutoffs);
    setShowRangeEditor((v) => !v);
  };

  const updateDraftCutoff = (index, rawValue) => {
    const num = rawValue === "" ? NaN : parseInt(rawValue, 10);
    setDraftCutoffs((prev) => prev.map((v, i) => (i === index ? num : v)));
  };

  const addRange = () => {
    setDraftCutoffs((prev) => [...prev, (Number.isFinite(prev[prev.length - 1]) ? prev[prev.length - 1] : 0) + 5]);
  };

  const removeRange = (index) => {
    setDraftCutoffs((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const applyRanges = () => {
    if (validateDraft(draftCutoffs)) return;
    setCutoffs(draftCutoffs);
    setShowRangeEditor(false);
  };

  const resetRanges = () => {
    setCutoffs(DEFAULT_CUTOFFS);
    setDraftCutoffs(DEFAULT_CUTOFFS);
    setShowRangeEditor(false);
  };

  const drilldownRows = useMemo(() => {
    if (!drilldown) return [];
    return fyRows.filter((r) => r.month === drilldown.month && bucketIndexFor(r.dayDiff, cutoffs) === drilldown.bucketIndex);
  }, [drilldown, fyRows, cutoffs]);

  if (!user) return null;

  return (
    <div className="ofl">
      <style>{OFL_STYLES}</style>

      <div className="ofl-card">
        <div className="ofl-title-row">
          <div className="ofl-title">{LIFECYCLE_TITLE}</div>
          {MODES[mode].note && <div className="ofl-note">{MODES[mode].note}</div>}
        </div>

        <div className="ofl-toolbar">
          <div className="ofl-mode-toggle">
            {Object.entries(MODES).map(([key, cfg]) => (
              <button key={key} type="button" className={`ofl-mode-btn ${mode === key ? "active" : ""}`} onClick={() => setMode(key)}>
                {cfg.label}
              </button>
            ))}
          </div>

          <div className="ofl-toolbar-right">
            <Dropdown onSelect={(val) => setSelectedFy(parseInt(val, 10))}>
              <Dropdown.Toggle variant="outline-dark" id="fy-filter-lifecycle" size="sm">
                {fyLabel(selectedFy)}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {[...fyOptions].reverse().map((y) => (
                  <Dropdown.Item key={y} eventKey={y} active={y === selectedFy}>{fyLabel(y)}</Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>

            <div className="ofl-range-wrap">
              <button type="button" className="ofl-range-btn" onClick={openRangeEditor}>
                Configure Ranges
              </button>
              {showRangeEditor && (
                <div className="ofl-range-editor">
                  <label>Day Ranges</label>
                  <div className="ofl-range-rows">
                    {draftCutoffs.map((cutoff, i) => {
                      const fromVal = i === 0 ? 0 : draftCutoffs[i - 1];
                      const rowInvalid = Number.isFinite(cutoff) ? (i > 0 && cutoff <= draftCutoffs[i - 1]) || cutoff < 0 : true;
                      return (
                        <div className={`ofl-range-row ${rowInvalid ? "invalid" : ""}`} key={i}>
                          <span className="ofl-range-no">R{i + 1}</span>
                          <span className="ofl-range-from">{i === 0 ? 0 : fromVal + 1}</span>
                          <span className="ofl-range-sep">to</span>
                          <input
                            type="number"
                            className="ofl-range-num-input"
                            value={Number.isFinite(cutoff) ? cutoff : ""}
                            onChange={(e) => updateDraftCutoff(i, e.target.value)}
                          />
                          <button
                            type="button"
                            className="ofl-range-remove"
                            onClick={() => removeRange(i)}
                            disabled={draftCutoffs.length <= 1}
                            title="Remove this range"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                    <div className="ofl-range-row ofl-range-row-last">
                      <span className="ofl-range-no">R{draftCutoffs.length + 1}</span>
                      <span className="ofl-range-from">
                        {Number.isFinite(draftCutoffs[draftCutoffs.length - 1]) ? draftCutoffs[draftCutoffs.length - 1] + 1 : "—"}
                      </span>
                      <span className="ofl-range-sep">to</span>
                      <span className="ofl-range-infinity">∞</span>
                    </div>
                  </div>
                  <button type="button" className="ofl-range-add" onClick={addRange}>+ Add Range</button>
                  {draftError && <div className="ofl-range-err">{draftError}</div>}
                  <div className="ofl-range-actions">
                    <button type="button" className="ofl-range-apply" onClick={applyRanges} disabled={Boolean(draftError)}>Apply</button>
                    <button type="button" className="ofl-range-reset" onClick={resetRanges}>Reset to default</button>
                  </div>
                </div>
              )}
            </div>

            <div className="ofl-toolbar-spacer" />

            {isCustomer ? (
              <>
                <Button variant="outline-secondary" disabled style={{ color: "#000", fontWeight: 500 }}>Order Placed By</Button>
                <div style={{ width: 260 }}>
                  <Select
                    value={selectedValue}
                    onChange={chooseOption}
                    onInputChange={(v, { action }) => { if (action === "input-change") debouncedFetch(v); }}
                    onFocus={() => getSuggestions("", true)}
                    options={suggestions}
                    isLoading={loadingSuggestions}
                    isClearable
                    placeholder="Search Contact Person"
                    isSearchable
                    filterOption={null}
                  />
                </div>
              </>
            ) : (
              <>
                <Dropdown onSelect={chooseType}>
                  <Dropdown.Toggle variant="outline-secondary" id="filter-type-lifecycle">
                    {searchType ? labelMap[searchType] : "Order By"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {allowedTypes.includes("salesPerson") && <Dropdown.Item eventKey="salesPerson">Sales Person</Dropdown.Item>}
                    {allowedTypes.includes("category") && <Dropdown.Item eventKey="category">Category</Dropdown.Item>}
                    {allowedTypes.includes("customer") && !customerId && <Dropdown.Item eventKey="customer">Customer</Dropdown.Item>}
                    {allowedTypes.includes("contactPerson") && <Dropdown.Item eventKey="contactPerson">Contact Person</Dropdown.Item>}
                  </Dropdown.Menu>
                </Dropdown>
                <div style={{ width: 260 }}>
                  <Select
                    value={selectedValue}
                    onChange={chooseOption}
                    onInputChange={handleInputChange}
                    onFocus={() => searchType && getSuggestions("", true)}
                    options={suggestions}
                    isLoading={loadingSuggestions}
                    isClearable
                    isDisabled={!searchType}
                    placeholder={searchType ? `Search ${labelMap[searchType]}` : "Select filter type"}
                    isSearchable
                    filterOption={null}
                  />
                </div>
              </>
            )}
            <Button variant="primary" onClick={resetAll} disabled={!anyActive && !searchType}>Reset</Button>
          </div>
        </div>

        {error && <div className="ofl-empty" style={{ color: "var(--bad)" }}>Error: {error}</div>}

        {loading ? (
          <div className="ofl-loading"><Spinner animation="border" size="sm" /><span>Loading…</span></div>
        ) : months.length > 0 ? (
          <>
            <div style={{ height: 420 }}>
              <Bar data={chartData} options={chartOptions} />
            </div>

            <div className="ofl-table-scroll mt-3">
              <table className="ofl-table">
                <thead>
                  <tr>
                    <th className="ofl-th-left">Range / Month</th>
                    {months.map((m) => (<th key={m} className="ofl-th-right">{m}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {labels.map((lbl, bi) => (
                    <tr key={lbl}>
                      <td>
                        <span className="ofl-swatch" style={{ backgroundColor: BUCKET_PALETTE[bi % BUCKET_PALETTE.length] }} />
                        {lbl}
                      </td>
                      {months.map((m, mi) => {
                        const count = monthBucketCounts[mi][bi];
                        return (
                          <td
                            key={m}
                            className={`ofl-num ${count > 0 ? "ofl-cell-clickable" : ""}`}
                            onClick={() => count > 0 && openDrilldown(mi, bi)}
                            title={count > 0 ? "Click to view records" : undefined}
                          >
                            {count}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="ofl-empty">No data in {fyLabel(selectedFy)} for this view.</div>
        )}
      </div>

      {drilldown && (
        <LifecycleDrilldownModal
          show
          onClose={() => setDrilldown(null)}
          title={`${MODES[mode].label}: ${drilldown.month}`}
          subtitle={labels[drilldown.bucketIndex]}
          rows={drilldownRows}
          columns={MODES[mode].drillColumns}
        />
      )}
    </div>
  );
}

const OFL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

  .ofl {
    --surface: #ffffff;
    --surface2: #e0edf9;
    --border: #c5d2dc;
    --text: #10151c;
    --muted: #52606d;
    --accent: #1f68bf;
    --bad: #c0402f;
    font-family: 'IBM Plex Sans', sans-serif;
    color: var(--text);
  }

  .ofl-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 18px; }

  .ofl-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
  .ofl-toolbar-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex: 1 1 auto; min-width: 0; }
  /* Pushes everything after it (the "Order By" filter + its Select + Reset)
     to the far right of the toolbar row, keeping FY/Configure Ranges on the
     left — a plain flex spacer rather than justify-content on the whole
     row, so it degrades to normal wrapped flow on narrow screens instead of
     leaving an awkward full-width gap. */
  .ofl-toolbar-spacer { flex: 1 1 auto; min-width: 12px; }

  .ofl-mode-toggle { display: inline-flex; border: 1px solid var(--border); border-radius: 6px; overflow: hidden; flex-shrink: 0; }
  .ofl-mode-btn {
    background: var(--surface); border: none; border-right: 1px solid var(--border);
    padding: 8px 14px; font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; font-weight: 600;
    color: var(--muted); cursor: pointer; white-space: nowrap;
  }
  .ofl-mode-btn:last-child { border-right: none; }
  .ofl-mode-btn:hover { background: var(--surface2); }
  .ofl-mode-btn.active { background: var(--accent); color: #ffffff; }

  .ofl-range-wrap { position: relative; }
  .ofl-range-btn {
    background: var(--surface2); border: 1px solid var(--border); border-radius: 5px;
    padding: 7px 12px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; font-weight: 600;
    color: var(--text); cursor: pointer; white-space: nowrap;
  }
  .ofl-range-btn:hover { background: var(--border); }
  .ofl-range-editor {
    position: absolute; top: 100%; right: 0; margin-top: 6px; z-index: 40;
    background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
    box-shadow: 0 8px 20px rgba(31,41,55,0.15); padding: 14px; width: 320px;
  }
  .ofl-range-editor label {
    display: block; font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; text-transform: uppercase;
    letter-spacing: 0.5px; color: var(--muted); margin-bottom: 8px;
  }
  .ofl-range-rows { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
  .ofl-range-row {
    display: flex; align-items: center; gap: 6px;
    font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: var(--text);
  }
  .ofl-range-no { color: var(--muted); font-weight: 600; width: 22px; flex-shrink: 0; }
  .ofl-range-from { width: 34px; text-align: right; color: var(--muted); flex-shrink: 0; }
  .ofl-range-sep { color: var(--muted); flex-shrink: 0; }
  .ofl-range-num-input {
    width: 60px; background: var(--surface); border: 1px solid var(--border); border-radius: 5px;
    padding: 5px 7px; font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: var(--text); outline: none;
  }
  .ofl-range-num-input:focus { border-color: var(--accent); }
  .ofl-range-row.invalid .ofl-range-num-input { border-color: var(--bad); color: var(--bad); }
  .ofl-range-infinity { font-weight: 700; color: var(--muted); }
  .ofl-range-remove {
    margin-left: auto; width: 20px; height: 20px; flex-shrink: 0; border: none; background: none;
    color: var(--muted); font-size: 15px; line-height: 1; cursor: pointer; border-radius: 4px;
  }
  .ofl-range-remove:hover:not(:disabled) { background: var(--surface2); color: var(--bad); }
  .ofl-range-remove:disabled { opacity: 0.3; cursor: not-allowed; }
  .ofl-range-row-last { opacity: 0.75; }
  .ofl-range-add {
    width: 100%; background: var(--surface2); border: 1px dashed var(--border); border-radius: 5px;
    padding: 6px 0; font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 600;
    color: var(--accent); cursor: pointer; margin-bottom: 10px;
  }
  .ofl-range-add:hover { background: var(--border); }
  .ofl-range-err {
    font-size: 11.5px; color: var(--bad); margin-bottom: 8px; line-height: 1.4;
  }
  .ofl-range-actions { display: flex; gap: 8px; }
  .ofl-range-apply, .ofl-range-reset {
    flex: 1; border-radius: 5px; padding: 7px 0; font-family: 'IBM Plex Mono', monospace;
    font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid var(--border);
  }
  .ofl-range-apply { background: var(--accent); color: #ffffff; border-color: var(--accent); }
  .ofl-range-apply:disabled { opacity: 0.5; cursor: not-allowed; }
  .ofl-range-reset { background: var(--surface); color: var(--text); }

  .ofl-title-row { margin-bottom: 14px; }
  /* Matches every other dashboard card's title (Daily Orders Report, Daily
     Invoice Report, Category Sales Performance: fontWeight 600, #212529,
     1.25rem, system sans-serif) — this one used to be a smaller IBM Plex
     Mono label sitting below the toolbar instead of a title at the top. */
  .ofl-title {
    font-weight: 600; color: #212529; font-size: 1.25rem;
    /* Bootstrap's default system-font stack, not the IBM Plex Sans .ofl
       sets for the rest of this card — this title specifically needs to
       match the plain Bootstrap <h4> titles used by every other dashboard
       card, which never override the font. */
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }
  .ofl-note { font-size: 12px; color: var(--muted); margin-top: 4px; font-family: 'IBM Plex Mono', monospace; }

  .ofl-loading, .ofl-empty {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 60px 0; color: var(--muted); font-family: 'IBM Plex Mono', monospace; font-size: 13px;
  }

  .ofl-table-scroll { overflow-x: auto; }
  .ofl-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .ofl-table th {
    background: var(--surface2); font-family: 'IBM Plex Mono', monospace; font-size: 10.5px;
    text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; color: var(--muted);
    border-bottom: 1px solid var(--border); padding: 8px 12px; white-space: nowrap;
  }
  .ofl-th-left { text-align: left; }
  .ofl-th-right { text-align: right; }
  .ofl-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); color: var(--text); white-space: nowrap; }
  .ofl-table tbody tr:last-child td { border-bottom: none; }
  .ofl-num { text-align: right; font-family: 'IBM Plex Mono', monospace; }
  .ofl-cell-clickable { cursor: pointer; }
  .ofl-cell-clickable:hover { background: var(--surface2); text-decoration: underline; }
  .ofl-swatch { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 8px; }
`;
