// components/page/catalyst-reagents/CatalystReagentsDashboard.js
// Orchestrator for the Catalyst, Fine Chemical & Reagent dashboard: category
// toggle, 4 KPI cards (Stock Value undated; Sales/GM%/Order Value scoped by
// the FY-or-custom-range date filter), the Sales/COGS chart+table, and the
// drill-down modal.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { formatCurrency } from 'utils/formatCurrency';
import { getCurrentFY, buildFYList, fyToDateRange, todayLocalISO } from 'utils/fiscalYear';
import CatalystReagentsChart from './CatalystReagentsChart';
import DrillDownModal from './DrillDownModal';
import AgingReportView from './AgingReportView';
import CurrentPeriodBreakdown from './CurrentPeriodBreakdown';
import TABLE_PAGE_STYLES from './tableStyles';

// The 3 categories this page cares about are matched against the real
// category list (see /api/products/categories) rather than hardcoded — exact
// OITB.ItmsGrpNam spelling in the DB isn't something to guess at. This is an
// EXACT (case/whitespace-normalized) match, not a substring one — the live
// category list also has "Catalyst and Ligand", "Deuterated Reagent" and
// "Stable Isotope reagents", which are distinct, more specific categories
// that a loose substring match would incorrectly pull in alongside the
// plain "Catalyst" / "Fine Chemicals" / "Reagent" buckets this page wants.
const CATEGORY_NAME_VARIANTS = [
  ['catalyst'],
  ['fine chemical', 'fine chemicals'],
  ['reagent', 'reagents'],
];
const normalize = (s) => (s || '').trim().toLowerCase();

export default function CatalystReagentsDashboard() {
  // ── category list + selection ──
  const [allCategories, setAllCategories] = useState([]);
  const [matchedCategories, setMatchedCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);

  // ── view mode ──
  const [viewMode, setViewMode] = useState('sales'); // 'sales' | 'aging'

  // ── date scope ──
  const [dateMode, setDateMode] = useState('fy'); // 'fy' | 'custom'
  const [selectedFY, setSelectedFY] = useState(getCurrentFY);
  const [fyList, setFyList] = useState(buildFYList([]));
  const [customStart, setCustomStart] = useState(() => fyToDateRange(getCurrentFY()).startDate);
  const [customEnd, setCustomEnd] = useState(todayLocalISO);

  // ── summary (date-scoped) ──
  const [summaryData, setSummaryData] = useState([]);
  const [totals, setTotals] = useState({ totalSales: 0, totalCogs: 0, grossMarginPct: 0, orderValue: 0 });
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  // ── drill-down modal ──
  const [modalContext, setModalContext] = useState(null);

  const resolvedRange = useMemo(() => {
    if (dateMode === 'fy') return fyToDateRange(selectedFY);
    return { startDate: customStart, endDate: customEnd };
  }, [dateMode, selectedFY, customStart, customEnd]);

  // ── load + match categories once ──
  useEffect(() => {
    (async () => {
      try {
        setCategoriesLoading(true);
        const res = await fetch('/api/products/categories');
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load categories');
        const all = data.categories || [];
        const matched = all.filter((cat) =>
          CATEGORY_NAME_VARIANTS.some((variants) => variants.includes(normalize(cat)))
        );
        setAllCategories(all);
        setMatchedCategories(matched);
        setSelectedCategories(matched);
        if (matched.length === 0) {
          setCategoriesError('No categories matching Catalyst / Fine Chemical / Reagent were found.');
        }
      } catch (e) {
        setCategoriesError(e.message);
      } finally {
        setCategoriesLoading(false);
      }
    })();
  }, []);

  const buildCatParams = useCallback((extra) => {
    const p = new URLSearchParams(extra);
    selectedCategories.forEach((c) => p.append('itmsGrpNam', c));
    return p;
  }, [selectedCategories]);

  // ── fetch summary whenever categories or date range change (Sales mode only) ──
  useEffect(() => {
    if (viewMode !== 'sales') return;
    if (selectedCategories.length === 0) {
      setSummaryData([]);
      setTotals({ totalSales: 0, totalCogs: 0, grossMarginPct: 0, orderValue: 0 });
      setSummaryLoading(false);
      return;
    }
    (async () => {
      try {
        setSummaryLoading(true);
        setSummaryError(null);
        const params = buildCatParams({ startDate: resolvedRange.startDate, endDate: resolvedRange.endDate });
        const res = await fetch(`/api/catalyst-reagents/summary?${params}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load summary');
        setSummaryData(json.data || []);
        setTotals(json.totals || { totalSales: 0, totalCogs: 0, grossMarginPct: 0, orderValue: 0 });
        const fys = buildFYList(json.availableYears);
        setFyList(fys);
        setSelectedFY((prev) => (fys.includes(prev) ? prev : (fys.includes(getCurrentFY()) ? getCurrentFY() : fys[0])));
      } catch (e) {
        setSummaryError(e.message);
        setSummaryData([]);
      } finally {
        setSummaryLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selectedCategories, resolvedRange.startDate, resolvedRange.endDate]);

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const fyOpts = fyList.map((fy) => {
    const [s, e] = fy.split('-');
    return { value: fy, label: `FY ${s}-${String(e).slice(-2)}` };
  });

  return (
    <div className="cr">
      <style>{TABLE_PAGE_STYLES}</style>

      <div className="cr-card">
        <div className="cr-header">
          <h1>Catalyst, Fine Chemical &amp; Reagent</h1>
          <p className="cr-header-desc">Stock value, sales, margin and order value across Catalyst, Fine Chemical and Reagent — click any month below to see what drove it.</p>
        </div>

        {categoriesError && <div className="cr-empty" style={{ color: 'var(--bad)' }}>{categoriesError}</div>}

        {!categoriesLoading && matchedCategories.length > 0 && (
          <>
            <div className="cr-controls">
              <div className="cr-field">
                <label>Categories</label>
                <div className="cr-checkbox-group">
                  {matchedCategories.map((cat) => (
                    <label key={cat} className="cr-checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                      />
                      {cat}
                    </label>
                  ))}
                </div>
              </div>

              <div className="cr-spacer" />

              <div className="cr-field">
                <label>View</label>
                <div className="cr-mode-toggle">
                  <button type="button" className={`cr-mode-btn ${viewMode === 'sales' ? 'active' : ''}`} onClick={() => setViewMode('sales')}>Check Sales</button>
                  <button type="button" className={`cr-mode-btn ${viewMode === 'aging' ? 'active' : ''}`} onClick={() => setViewMode('aging')}>Check Aging Report</button>
                </div>
              </div>

              {viewMode === 'sales' && (
                <>
                  <div className="cr-field">
                    <label>Date Scope</label>
                    <div className="cr-mode-toggle">
                      <button type="button" className={`cr-mode-btn ${dateMode === 'fy' ? 'active' : ''}`} onClick={() => setDateMode('fy')}>Financial Year</button>
                      <button type="button" className={`cr-mode-btn ${dateMode === 'custom' ? 'active' : ''}`} onClick={() => setDateMode('custom')}>Custom Range</button>
                    </div>
                  </div>

                  {dateMode === 'fy' ? (
                    <div className="cr-field">
                      <label>&nbsp;</label>
                      <select className="cr-select" value={selectedFY} onChange={(e) => setSelectedFY(e.target.value)}>
                        {fyOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div className="cr-field">
                        <label>From</label>
                        <input type="date" className="cr-input" value={customStart} onChange={(e) => setCustomStart(e.target.value)} max={customEnd} />
                      </div>
                      <div className="cr-field">
                        <label>To</label>
                        <input type="date" className="cr-input" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} min={customStart} max={todayLocalISO()} />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {viewMode === 'sales' ? (
              <>
                <div className="cr-kpi-row">
                  <div className="cr-kpi-card">
                    <div className="cr-kpi-label">Sales</div>
                    <div className="cr-kpi-value">{summaryLoading ? '…' : formatCurrency(totals.totalSales)}</div>
                    <div className="cr-kpi-sub">{dateMode === 'fy' ? fyOpts.find((o) => o.value === selectedFY)?.label : `${resolvedRange.startDate} → ${resolvedRange.endDate}`}</div>
                  </div>
                  <div className="cr-kpi-card">
                    <div className="cr-kpi-label">COGS</div>
                    <div className="cr-kpi-value">{summaryLoading ? '…' : formatCurrency(totals.totalCogs)}</div>
                  </div>
                  <div className="cr-kpi-card">
                    <div className="cr-kpi-label">Gross Margin</div>
                    <div className={`cr-kpi-value ${totals.grossMarginPct >= 0 ? 'good' : 'bad'}`}>
                      {summaryLoading ? '…' : `${totals.grossMarginPct.toFixed(1)}%`}
                    </div>
                    <div className="cr-kpi-sub">(Sales − COGS) / Sales</div>
                  </div>
                  <div className="cr-kpi-card">
                    <div className="cr-kpi-label">Order Value</div>
                    <div className="cr-kpi-value">{summaryLoading ? '…' : formatCurrency(totals.orderValue)}</div>
                  </div>
                </div>

                {summaryError && <div className="cr-empty" style={{ color: 'var(--bad)' }}>{summaryError}</div>}

                <CatalystReagentsChart
                  data={summaryData}
                  loading={summaryLoading}
                  onCellClick={setModalContext}
                />

                <CurrentPeriodBreakdown categories={selectedCategories} fyOpts={fyOpts} />
              </>
            ) : (
              <AgingReportView categories={selectedCategories} />
            )}
          </>
        )}
      </div>

      {viewMode === 'sales' && (
        <DrillDownModal
          show={!!modalContext}
          onHide={() => setModalContext(null)}
          context={modalContext}
          categories={selectedCategories}
        />
      )}
    </div>
  );
}
