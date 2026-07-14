// pages/catalyst-pricing.js
import { useState, useEffect, useMemo } from "react";
import { formatNumberWithIndianCommas } from "utils/formatNumberWithIndianCommas";

const MODE_DEFAULT_MARGIN = {
  standard: 33,
  aragen: 10,
};

const PAGE_SIZE_OPTIONS = [25, 50, 100, "all"];

const num = (v) => (v === null || v === undefined || v === "" || isNaN(v) ? null : parseFloat(v));

function computeRow(item, { metalPrice, handlingPct, targetMarginPct, discountGuidancePct, overrides }) {
  const override = overrides[item.ItemCode] || {};

  const pdPercent = num(item.PdPercent) ?? num(override.pdPercent);
  const fabCharge = num(item.FabCharge) ?? num(override.fabCharge);
  const pdIsManual = num(item.PdPercent) === null && num(override.pdPercent) !== null;
  const fabIsManual = num(item.FabCharge) === null && num(override.fabCharge) !== null;

  const qty = num(item.QTY) || 0;
  const currentPrice = num(item.WebPrice);

  // Total Metal used = QTY x %Pd
  const totalMetalUsed = pdPercent !== null ? qty * (pdPercent / 100) : null;
  // Metal Cost = Total Metal used x Metal price/g
  const metalCost = totalMetalUsed !== null ? totalMetalUsed * metalPrice : null;
  // Fibrication charges = Fibrication charges/gram x QTY
  const fabricationCharges = fabCharge !== null ? fabCharge * qty : null;
  // COGS = Metal Cost + Fibrication charges
  const cogs = metalCost !== null && fabricationCharges !== null ? metalCost + fabricationCharges : null;

  // Landed cost = COGS x (1 + Handling%)
  const landedCost = cogs !== null ? cogs * (1 + handlingPct / 100) : null;
  // New price = Landed cost x (1 + Target Margin%)
  const newPrice = landedCost !== null ? landedCost * (1 + targetMarginPct / 100) : null;

  const difference = newPrice !== null && currentPrice !== null ? newPrice - currentPrice : null;

  const discountPct =
    newPrice !== null && currentPrice ? ((currentPrice - newPrice) / currentPrice) * 100 : null;

  const marginPct = newPrice !== null && cogs !== null && newPrice !== 0 ? ((newPrice - cogs) / newPrice) * 100 : null;

  let status = "No list price";
  if (!currentPrice) {
    status = "No list price";
  } else if (discountPct === null) {
    status = "Needs input";
  } else if (Math.abs(discountPct - discountGuidancePct) > 5) {
    status = "Off guidance";
  } else {
    status = "On guidance";
  }

  return {
    ...item,
    pdPercent,
    fabCharge,
    pdIsManual,
    fabIsManual,
    qty,
    currentPrice,
    totalMetalUsed,
    metalCost,
    fabricationCharges,
    cogs,
    landedCost,
    newPrice,
    difference,
    discountPct,
    marginPct,
    status,
  };
}

const STATUS_CLASS = {
  "On guidance": "good",
  "Off guidance": "bad",
  "No list price": "muted",
  "Needs input": "muted",
};

const fmt = (v, decimals = 2) =>
  v === null || v === undefined || isNaN(v) ? null : formatNumberWithIndianCommas(v.toFixed(decimals));

const Cell = ({ value, decimals = 2 }) => {
  const formatted = fmt(value, decimals);
  return formatted === null ? <span className="cc-dash">—</span> : <>{formatted}</>;
};

// Accounting-style: negative values in parentheses, matching the source sheet
const DiffCell = ({ value }) => {
  if (value === null || value === undefined || isNaN(value)) return <span className="cc-dash">—</span>;
  const formatted = formatNumberWithIndianCommas(Math.abs(value).toFixed(0));
  return value < 0 ? <span className="cc-diff-neg">({formatted})</span> : <>{formatted}</>;
};

const COLUMNS = [
  { field: "ItemCode", label: "Cat/Size (Item Code)" },
  { field: "Description", label: "Description" },
  { field: "CatNo", label: "Cat No" },
  { field: "CAS", label: "CAS" },
  { field: "Category", label: "Category" },
  { field: "WebsiteDisplay", label: "Website Display" },
  { field: "StockInIndia", label: "Stock In India" },
  { field: "currentPrice", label: "Present WEBPRICE" },
  { field: "PKZ", label: "PKZ" },
  { field: "qty", label: "QTY" },
  { field: "UOM", label: "UOM" },
  { field: "pdPercent", label: "% of Pd Metal incl. loss" },
  { field: "totalMetalUsed", label: "Total Metal Used" },
  { field: "metalPriceCol", label: "Metal Price/g" },
  { field: "metalCost", label: "Metal Cost" },
  { field: "fabCharge", label: "Fibrication charges/gram on product" },
  { field: "fabricationCharges", label: "Fibrication charges" },
  { field: "cogs", label: "COGS-Metal+FAB" },
  { field: "handlingPctCol", label: "Handling %", title: "Source sheet column: Density -GM %" },
  { field: "landedCost", label: "Landed Cost", title: "Source sheet column: Density - GM % (COGS x (1 + Handling%))" },
  { field: "newPrice", label: "New WEBPRICE", title: "Source sheet column: NEW WEBPRICE-GM 50%" },
  { field: "difference", label: "Difference" },
  { field: "discountPct", label: "Discount %" },
  { field: "marginPct", label: "Margin %" },
  { field: "status", label: "Status" },
];

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  return Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
}

export default function CatalystPricingConsole() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formulasOpen, setFormulasOpen] = useState(false);

  const [metalPrice, setMetalPrice] = useState(2850);
  const [handlingPct, setHandlingPct] = useState(25);
  const [mode, setMode] = useState("standard");
  const [targetMarginPct, setTargetMarginPct] = useState(MODE_DEFAULT_MARGIN.standard);
  const [discountGuidancePct, setDiscountGuidancePct] = useState(45);
  const [search, setSearch] = useState("");

  const [sortField, setSortField] = useState("ItemCode");
  const [sortDir, setSortDir] = useState("asc");

  const [overrides, setOverrides] = useState({}); // { [ItemCode]: { pdPercent, fabCharge } }
  const [bulkPdPercent, setBulkPdPercent] = useState("");
  const [bulkFabCharge, setBulkFabCharge] = useState("");

  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token") || document.cookie.match(/token=([^;]+)/)?.[1];
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch("/api/catalyst/pricing", { headers });
        if (!res.ok) throw new Error("Failed to fetch catalyst pricing data");
        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        console.error("Error fetching catalyst pricing:", err);
        setError(err.message || "Failed to load catalyst pricing data");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setTargetMarginPct(MODE_DEFAULT_MARGIN[newMode]);
  };

  const handleOverride = (itemCode, field, value) => {
    setOverrides((prev) => ({
      ...prev,
      [itemCode]: { ...prev[itemCode], [field]: value },
    }));
  };

  // Seeds every row's override with the bulk value; per-row edits made afterward
  // still take precedence since handleOverride only touches that one row's entry.
  const applyBulkPd = () => {
    if (bulkPdPercent === "") return;
    setOverrides((prev) => {
      const next = { ...prev };
      items.forEach((it) => {
        next[it.ItemCode] = { ...next[it.ItemCode], pdPercent: bulkPdPercent };
      });
      return next;
    });
  };

  const applyBulkFab = () => {
    if (bulkFabCharge === "") return;
    setOverrides((prev) => {
      const next = { ...prev };
      items.forEach((it) => {
        next[it.ItemCode] = { ...next[it.ItemCode], fabCharge: bulkFabCharge };
      });
      return next;
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const computedRows = useMemo(() => {
    const settings = { metalPrice, handlingPct, targetMarginPct, discountGuidancePct, overrides };
    return items.map((item) => computeRow(item, settings));
  }, [items, metalPrice, handlingPct, targetMarginPct, discountGuidancePct, overrides]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    let rows = computedRows;
    if (term) {
      rows = rows.filter(
        (r) =>
          (r.CatNo || "").toLowerCase().includes(term) ||
          (r.CAS || "").toLowerCase().includes(term) ||
          (r.Description || "").toLowerCase().includes(term)
      );
    }

    const sorted = [...rows].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });

    return sorted;
  }, [computedRows, search, sortField, sortDir]);

  // Reset to page 1 whenever the underlying result set or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortField, sortDir, pageSize]);

  const totalRows = filteredRows.length;
  const totalPages = pageSize === "all" ? 1 : Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const visibleRows = useMemo(() => {
    if (pageSize === "all") return filteredRows;
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, pageSize, safePage]);

  const rangeStart = totalRows === 0 ? 0 : pageSize === "all" ? 1 : (safePage - 1) * pageSize + 1;
  const rangeEnd = pageSize === "all" ? totalRows : Math.min(safePage * pageSize, totalRows);

  const stats = useMemo(() => {
    const withMargin = computedRows.filter((r) => r.marginPct !== null);
    const withDiscount = computedRows.filter((r) => r.discountPct !== null);
    const offGuidance = computedRows.filter((r) => r.status === "Off guidance");

    const avg = (arr, field) => (arr.length ? arr.reduce((s, r) => s + r[field], 0) / arr.length : null);

    return {
      totalSkus: items.length,
      avgMargin: avg(withMargin, "marginPct"),
      avgDiscount: avg(withDiscount, "discountPct"),
      offGuidanceCount: offGuidance.length,
    };
  }, [computedRows, items.length]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const XLSX = await import("xlsx");

      const dataRows = filteredRows.map((r) => ({
        "Cat/Size (Item Code)": r.ItemCode || "",
        Description: r.Description || "",
        "Cat No": r.CatNo || "",
        CAS: r.CAS || "",
        Category: r.Category || "",
        "Website Display": r.WebsiteDisplay ?? "",
        "Stock In India": r.StockInIndia,
        "Present WEBPRICE": r.currentPrice,
        PKZ: r.PKZ || "",
        QTY: r.qty,
        UOM: r.UOM || "",
        "% of Pd Metal incl. loss": r.pdPercent,
        "Total Metal Used": r.totalMetalUsed,
        "Metal Price/g": metalPrice,
        "Metal Cost": r.metalCost,
        "Fibrication charges/gram on product": r.fabCharge,
        "Fibrication charges": r.fabricationCharges,
        "COGS-Metal+FAB": r.cogs,
        "Handling %": handlingPct,
        "Landed Cost": r.landedCost,
        "New WEBPRICE": r.newPrice,
        Difference: r.difference,
        "Discount %": r.discountPct,
        "Margin %": r.marginPct,
        Status: r.status,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataRows);
      XLSX.utils.book_append_sheet(wb, ws, "Catalyst Pricing");

      const assumptions = [
        { Setting: "Metal Price (₹/g)", Value: metalPrice },
        { Setting: "Handling Add-on %", Value: handlingPct },
        { Setting: "Pricing Mode", Value: mode === "standard" ? "Standard List" : "Aragen Target" },
        { Setting: "Target Gross Margin %", Value: targetMarginPct },
        { Setting: "Discount Guidance %", Value: discountGuidancePct },
        { Setting: "Exported On", Value: new Date().toLocaleString() },
      ];
      const wsAssumptions = XLSX.utils.json_to_sheet(assumptions);
      XLSX.utils.book_append_sheet(wb, wsAssumptions, "Assumptions");

      const dateStr = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `catalyst-pricing-${dateStr}.xlsx`);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export to Excel.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="cc">
      <style>{PAGE_STYLES}</style>

      <div className="cc-card">

      {/* Header */}
      <div className="cc-header">
        <div className="cc-element-card">
          <div className="cc-element-num">46</div>
          <div className="cc-element-sym">Pd</div>
          <div className="cc-element-wt">106.42</div>
        </div>
        <div className="cc-header-text">
          <h1>Catalyst Pricing Console</h1>
          <p className="cc-header-desc">
            Live pricing for the Pd catalyst range — replaces the manual Excel workflow.
          </p>
        </div>
      </div>

      {/* Formula reference panel */}
      <div className="cc-formula-panel">
        <button
          type="button"
          className="cc-formula-header"
          onClick={() => setFormulasOpen((v) => !v)}
          aria-expanded={formulasOpen}
        >
          <span className="cc-formula-title">Formulas used in this table</span>
          <span className={`cc-formula-chevron ${formulasOpen ? "open" : ""}`}>▸</span>
        </button>

        {formulasOpen && (
          <>
            <div className="cc-formula-grid">
              <div className="cc-formula-row">
                <span className="cc-formula-name">Total Metal Used</span>
                <span className="cc-formula-expr">QTY × (% Pd ÷ 100)</span>
              </div>
              <div className="cc-formula-row">
                <span className="cc-formula-name">Metal Cost</span>
                <span className="cc-formula-expr">Total Metal Used × Metal Price/g</span>
              </div>
              <div className="cc-formula-row">
                <span className="cc-formula-name">Fibrication charges</span>
                <span className="cc-formula-expr">Fibrication charges/gram × QTY</span>
              </div>
              <div className="cc-formula-row">
                <span className="cc-formula-name">COGS</span>
                <span className="cc-formula-expr">Metal Cost + Fibrication charges</span>
              </div>
              <div className="cc-formula-row">
                <span className="cc-formula-name">Landed Cost</span>
                <span className="cc-formula-expr">COGS × (1 + Handling%)</span>
              </div>
              <div className="cc-formula-row">
                <span className="cc-formula-name">New WEBPRICE</span>
                <span className="cc-formula-expr">Landed Cost × (1 + Target Margin%)</span>
              </div>
              <div className="cc-formula-row">
                <span className="cc-formula-name">Difference</span>
                <span className="cc-formula-expr">New WEBPRICE − Present WEBPRICE</span>
              </div>
              <div className="cc-formula-row">
                <span className="cc-formula-name">Discount %</span>
                <span className="cc-formula-expr">(Present WEBPRICE − New WEBPRICE) ÷ Present WEBPRICE × 100</span>
              </div>
              <div className="cc-formula-row">
                <span className="cc-formula-name">Margin %</span>
                <span className="cc-formula-expr">(New WEBPRICE − COGS) ÷ New WEBPRICE × 100</span>
              </div>
            </div>
            <div className="cc-formula-legend">
              <span className="cc-formula-legend-title">Status:</span>
              <span className="cc-badge good">On guidance</span>
              <span className="cc-formula-legend-text">|Discount% − Discount Guidance%| ≤ 5</span>
              <span className="cc-badge bad">Off guidance</span>
              <span className="cc-formula-legend-text">deviates &gt; 5 points from guidance</span>
              <span className="cc-badge muted">No list price</span>
              <span className="cc-formula-legend-text">no Present WEBPRICE to compare against</span>
              <span className="cc-badge muted">Needs input</span>
              <span className="cc-formula-legend-text">missing % Pd or Fab charge/gram</span>
            </div>
          </>
        )}
      </div>

      {/* Sticky controls */}
      <div className="cc-controls">
        <div className="cc-field">
          <label>Metal Price (₹/g)</label>
          <input
            className="cc-input"
            type="number"
            value={metalPrice}
            onChange={(e) => setMetalPrice(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="cc-field">
          <label>Handling Add-on %</label>
          <input
            className="cc-input"
            type="number"
            value={handlingPct}
            onChange={(e) => setHandlingPct(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="cc-field">
          <label>Pricing Mode</label>
          <div className="cc-mode-toggle">
            <button
              type="button"
              className={`cc-mode-btn ${mode === "standard" ? "active" : ""}`}
              onClick={() => handleModeChange("standard")}
            >
              Standard List
            </button>
            <button
              type="button"
              className={`cc-mode-btn ${mode === "aragen" ? "active" : ""}`}
              onClick={() => handleModeChange("aragen")}
            >
              Aragen Target
            </button>
          </div>
        </div>

        <div className="cc-field">
          <label>Target Gross Margin %</label>
          <input
            className="cc-input"
            type="number"
            value={targetMarginPct}
            onChange={(e) => setTargetMarginPct(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="cc-field">
          <label>Discount Guidance %</label>
          <input
            className="cc-input"
            type="number"
            value={discountGuidancePct}
            onChange={(e) => setDiscountGuidancePct(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="cc-field">
          <label>Set % Pd (all rows)</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              className="cc-input"
              type="number"
              style={{ width: 80 }}
              placeholder="e.g. 16"
              value={bulkPdPercent}
              onChange={(e) => setBulkPdPercent(e.target.value)}
            />
            <button type="button" className="cc-apply-btn" onClick={applyBulkPd}>
              Apply to All
            </button>
          </div>
        </div>

        <div className="cc-field">
          <label>Set Fab ₹/g (all rows)</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              className="cc-input"
              type="number"
              style={{ width: 80 }}
              placeholder="e.g. 55"
              value={bulkFabCharge}
              onChange={(e) => setBulkFabCharge(e.target.value)}
            />
            <button type="button" className="cc-apply-btn" onClick={applyBulkFab}>
              Apply to All
            </button>
          </div>
        </div>

        <div className="cc-field">
          <label>Rows / Page</label>
          <select
            className="cc-input"
            value={pageSize}
            onChange={(e) => {
              const v = e.target.value;
              setPageSize(v === "all" ? "all" : parseInt(v, 10));
            }}
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "all" ? "All" : opt}
              </option>
            ))}
          </select>
        </div>

        <div className="cc-spacer" />

        <div className="cc-field" style={{ width: 300 }}>
          <label>Search</label>
          <input
            className="cc-input"
            type="text"
            style={{ width: "100%" }}
            placeholder="Cat No / CAS / Description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="cc-field">
          <label>&nbsp;</label>
          <button className="cc-export-btn" onClick={handleExport} disabled={exporting || !filteredRows.length}>
            {exporting ? "Exporting…" : "Export to Excel"}
          </button>
        </div>
      </div>

      {error && <div className="cc-error">{error}</div>}

      {/* Stat cards */}
      <div className="cc-stats">
        <div className="cc-stat-card">
          <div className="cc-stat-label">Total SKUs Loaded</div>
          <div className="cc-stat-value">{stats.totalSkus}</div>
          <div className="cc-stat-caption">Count of items, Category = Catalyst</div>
        </div>
        <div className="cc-stat-card">
          <div className="cc-stat-label">Avg True Gross Margin</div>
          <div className={`cc-stat-value ${stats.avgMargin !== null && stats.avgMargin >= targetMarginPct ? "good" : "bad"}`}>
            {fmt(stats.avgMargin) ?? "—"}%
          </div>
          <div className="cc-stat-caption">Avg of (New WEBPRICE − COGS) ÷ New WEBPRICE × 100</div>
        </div>
        <div className="cc-stat-card">
          <div className="cc-stat-label">Avg Discount vs List Price</div>
          <div className="cc-stat-value">{fmt(stats.avgDiscount) ?? "—"}%</div>
          <div className="cc-stat-caption">Avg of (Present WEBPRICE − New WEBPRICE) ÷ Present WEBPRICE × 100</div>
        </div>
        <div className="cc-stat-card">
          <div className="cc-stat-label">SKUs Off Guidance</div>
          <div className={`cc-stat-value ${stats.offGuidanceCount > 0 ? "bad" : "good"}`}>
            {stats.offGuidanceCount}
          </div>
          <div className="cc-stat-caption">Count where |Discount% − Guidance%| &gt; 5</div>
        </div>
      </div>

      {/* Table */}
      <div className="cc-table-card">
        {loading ? (
          <div className="cc-loading">
            <div className="cc-spinner" />
            <span>Loading catalyst data…</span>
          </div>
        ) : (
          <>
            <div className="cc-table-scroll">
              <table className="cc-table">
                <thead>
                  <tr>
                    {COLUMNS.map((col) => (
                      <th
                        key={col.field}
                        onClick={() => handleSort(col.field)}
                        className={col.field === "Description" ? "cc-th-left" : "cc-th-right"}
                        title={col.title}
                      >
                        {col.label} {sortField === col.field ? (sortDir === "asc" ? "▲" : "▼") : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={row.ItemCode}>
                      <td className="cc-num cc-catno">{row.ItemCode}</td>
                      <td className="cc-desc" title={row.Description}>{row.Description}</td>
                      <td className="cc-num">{row.CatNo || <span className="cc-dash">—</span>}</td>
                      <td className="cc-num">{row.CAS || <span className="cc-dash">—</span>}</td>
                      <td className="cc-num">{row.Category || <span className="cc-dash">—</span>}</td>
                      <td className="cc-num">{row.WebsiteDisplay ?? <span className="cc-dash">—</span>}</td>
                      <td className="cc-num">
                        <Cell value={row.StockInIndia} decimals={0} />
                      </td>
                      <td className="cc-num">
                        {row.currentPrice ? <Cell value={row.currentPrice} /> : <span className="cc-dash">—</span>}
                      </td>
                      <td className="cc-num">{row.PKZ || <span className="cc-dash">—</span>}</td>
                      <td className="cc-num">
                        <Cell value={row.qty} />
                      </td>
                      <td className="cc-num">{row.UOM || <span className="cc-dash">—</span>}</td>
                      <td className={`cc-num ${row.pdIsManual ? "cc-manual" : ""}`}>
                        <input
                          className="cc-input cc-cell-input"
                          type="number"
                          placeholder="confirm"
                          value={row.pdPercent === null ? "" : row.pdPercent}
                          onChange={(e) => handleOverride(row.ItemCode, "pdPercent", e.target.value)}
                        />
                      </td>
                      <td className="cc-num">
                        <Cell value={row.totalMetalUsed} decimals={4} />
                      </td>
                      <td className="cc-num">
                        <Cell value={metalPrice} />
                      </td>
                      <td className="cc-num">
                        <Cell value={row.metalCost} />
                      </td>
                      <td className={`cc-num ${row.fabIsManual ? "cc-manual" : ""}`}>
                        <input
                          className="cc-input cc-cell-input"
                          type="number"
                          placeholder="confirm"
                          value={row.fabCharge === null ? "" : row.fabCharge}
                          onChange={(e) => handleOverride(row.ItemCode, "fabCharge", e.target.value)}
                        />
                      </td>
                      <td className="cc-num">
                        <Cell value={row.fabricationCharges} />
                      </td>
                      <td className="cc-num">
                        <Cell value={row.cogs} />
                      </td>
                      <td className="cc-num">
                        <Cell value={handlingPct} />
                      </td>
                      <td className="cc-num">
                        <Cell value={row.landedCost} />
                      </td>
                      <td className="cc-num cc-newprice">
                        <Cell value={row.newPrice} />
                      </td>
                      <td className="cc-num">
                        <DiffCell value={row.difference} />
                      </td>
                      <td className="cc-num">
                        {row.discountPct === null ? (
                          <span className="cc-dash">—</span>
                        ) : (
                          <>{fmt(row.discountPct)}%</>
                        )}
                      </td>
                      <td className="cc-num">
                        {row.marginPct === null ? <span className="cc-dash">—</span> : <>{fmt(row.marginPct)}%</>}
                      </td>
                      <td className="cc-num">
                        <span className={`cc-badge ${STATUS_CLASS[row.status]}`}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!visibleRows.length && <div className="cc-empty">No catalyst items found.</div>}
            </div>

            {/* Pagination footer */}
            <div className="cc-pagination">
              <div className="cc-pagination-info">
                {totalRows === 0
                  ? "Showing 0 of 0"
                  : `Showing ${rangeStart}–${rangeEnd} of ${totalRows}`}
              </div>
              <div className="cc-pagination-controls">
                <button
                  className="cc-page-btn"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                {pageSize !== "all" &&
                  getPageNumbers(safePage, totalPages).map((p, idx, arr) => (
                    <span key={p} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="cc-page-ellipsis">…</span>}
                      <button
                        className={`cc-page-btn ${p === safePage ? "active" : ""}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  className="cc-page-btn"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
            <div className="cc-formula-summary">
              COGS = Metal Cost (Total Metal Used × Metal Price/g) + Fibrication charges (rate/g × QTY).
              Landed Cost = COGS × (1 + Handling%). New WEBPRICE = Landed Cost × (1 + Target Margin%).
              Rows with an amber left border use a manually entered value — confirm against SAP.
            </div>
          </>
        )}
      </div>

      </div>
    </div>
  );
}

CatalystPricingConsole.seo = {
  title: "Catalyst Pricing Console | Density",
  description: "Live pricing dashboard for the Pd catalyst range.",
  keywords: "catalyst, pricing, palladium, density",
};

const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

  .cc {
    --page-bg: #eef3f7;
    --surface: #ffffff;
    --surface2: #eaf4fb;
    --surface-green: #eaf8f1;
    --border: #dde5ec;
    --text: #1f2937;
    --muted: #6b7684;
    --accent: #2f7dd1;
    --accent-dim: #bcdcf7;
    --good: #2f9e63;
    --bad: #d1554a;

    background: var(--page-bg);
    color: var(--text);
    font-family: 'IBM Plex Sans', sans-serif;
    min-height: 100vh;
    padding: 28px;
    display: flex;
    justify-content: center;
  }

  .cc-card {
    width: 100%;
    max-width: 1500px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: 0 14px 34px rgba(31, 41, 55, 0.10), 0 2px 8px rgba(31, 41, 55, 0.06);
    padding: 28px 32px 32px;
    margin: 0 auto;
  }

  .cc-header {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    border-bottom: 1px solid var(--border);
    padding-bottom: 24px;
    margin-bottom: 20px;
  }

  .cc-element-card {
    flex: none;
    width: 88px;
    height: 88px;
    border: 2px solid var(--accent);
    border-radius: 6px;
    background: linear-gradient(135deg, rgba(47, 125, 209, 0.10), var(--surface-green));
    font-family: 'IBM Plex Mono', monospace;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 6px 8px;
  }
  .cc-element-num { font-size: 11px; color: var(--muted); }
  .cc-element-sym { font-size: 34px; font-weight: 700; color: var(--accent); text-align: center; line-height: 1; }
  .cc-element-wt { font-size: 10px; color: var(--muted); text-align: center; }

  .cc-header-text h1 {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 26px;
    font-weight: 700;
    margin: 0 0 6px;
    color: var(--text);
  }
  .cc-header-desc {
    font-size: 13.5px;
    color: var(--muted);
    margin: 0 0 10px;
  }
  .cc-formula-panel {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: 8px;
    padding: 4px 18px;
    margin-bottom: 20px;
  }
  .cc-formula-header {
    width: 100%;
    background: none;
    border: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0;
    cursor: pointer;
  }
  .cc-formula-title {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    font-weight: 700;
    color: var(--muted);
  }
  .cc-formula-chevron {
    color: var(--accent);
    font-size: 12px;
    transition: transform 0.15s ease;
    transform: rotate(0deg);
  }
  .cc-formula-chevron.open {
    transform: rotate(90deg);
  }
  .cc-formula-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px 24px;
    margin-bottom: 12px;
    padding-top: 4px;
  }
  .cc-formula-row {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11.5px;
    border-bottom: 1px dashed var(--border);
    padding-bottom: 4px;
  }
  .cc-formula-name {
    color: var(--text);
    font-weight: 600;
    white-space: nowrap;
  }
  .cc-formula-expr {
    color: var(--muted);
    text-align: right;
  }
  .cc-formula-legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding-top: 10px;
    padding-bottom: 12px;
    border-top: 1px solid var(--border);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
  }
  .cc-formula-legend-title {
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 10.5px;
  }
  .cc-formula-legend-text {
    color: var(--muted);
    margin-right: 10px;
  }

  .cc-controls {
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

  .cc-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .cc-apply-btn {
    background: var(--surface);
    color: var(--accent);
    border: 1px solid var(--accent);
    border-radius: 5px;
    padding: 8px 10px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11.5px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
  .cc-apply-btn:hover {
    background: var(--surface2);
  }
  .cc-field label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    font-weight: 600;
    color: var(--muted);
  }

  .cc-input {
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
  .cc-input:focus {
    border-color: var(--accent);
  }
  .cc-input::placeholder {
    color: var(--muted);
  }

  .cc-mode-toggle {
    display: flex;
    border: 1px solid var(--border);
    border-radius: 999px;
    overflow: hidden;
  }
  .cc-mode-btn {
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
  .cc-mode-btn.active {
    background: var(--accent);
    color: #ffffff;
  }

  .cc-spacer {
    flex: 1 1 auto;
  }

  .cc-export-btn {
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
  .cc-export-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .cc-error {
    background: #fdecea;
    border: 1px solid var(--bad);
    color: var(--bad);
    border-radius: 6px;
    padding: 10px 14px;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .cc-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 20px;
  }
  .cc-stat-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px 18px;
  }
  .cc-stat-card:nth-child(even) {
    background: var(--surface-green);
  }
  .cc-stat-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--muted);
    margin-bottom: 8px;
  }
  .cc-stat-value {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 24px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 6px;
  }
  .cc-stat-value.good { color: var(--good); }
  .cc-stat-value.bad { color: var(--bad); }
  .cc-stat-caption {
    font-size: 11.5px;
    color: var(--muted);
  }

  .cc-table-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }

  .cc-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 60px 0;
    color: var(--muted);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
  }
  .cc-spinner {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    animation: cc-spin 0.8s linear infinite;
  }
  @keyframes cc-spin {
    to { transform: rotate(360deg); }
  }

  .cc-table-scroll {
    overflow-x: auto;
  }

  .cc-table {
    width: 100%;
    border-collapse: collapse;
  }
  .cc-table th {
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
  .cc-table th:last-child { border-right: none; }
  .cc-table th:hover {
    color: var(--text);
  }
  .cc-th-right { text-align: right; }
  .cc-th-left { text-align: left; }

  .cc-table td {
    padding: 11px 14px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12.5px;
    border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--border);
    white-space: nowrap;
  }
  .cc-table td:last-child { border-right: none; }
  .cc-table tbody tr:last-child td {
    border-bottom: none;
  }
  .cc-table tbody tr:hover {
    background: var(--surface2);
  }
  .cc-num { text-align: right; }
  .cc-desc {
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 12.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 220px;
    text-align: left;
    cursor: help;
  }
  .cc-catno { color: var(--accent); font-weight: 600; }
  .cc-newprice { color: var(--accent); font-weight: 700; }
  .cc-dash { color: var(--muted); }
  .cc-manual { border-left: 3px solid #f0ad4e; }
  .cc-diff-neg { color: var(--bad); }

  .cc-cell-input {
    width: 90px;
    padding: 5px 8px;
    font-size: 12.5px;
    text-align: right;
  }

  .cc-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 20px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    font-weight: 700;
  }
  .cc-badge.good { color: var(--good); background: var(--surface-green); }
  .cc-badge.bad { color: var(--bad); background: #fdecea; }
  .cc-badge.muted { color: var(--muted); background: #f1f3f5; }

  .cc-empty {
    text-align: center;
    color: var(--muted);
    padding: 40px 0;
    font-size: 13px;
  }

  .cc-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-top: 1px solid var(--border);
    flex-wrap: wrap;
    gap: 10px;
  }
  .cc-pagination-info {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    color: var(--muted);
  }
  .cc-pagination-controls {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .cc-page-btn {
    background: var(--surface2);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 6px 11px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    cursor: pointer;
  }
  .cc-page-btn.active {
    background: var(--accent);
    color: #ffffff;
    border-color: var(--accent);
    font-weight: 700;
  }
  .cc-page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .cc-page-ellipsis {
    color: var(--muted);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
  }

  .cc-formula-summary {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11.5px;
    color: var(--muted);
    padding-bottom: 14px;
  }
`;
