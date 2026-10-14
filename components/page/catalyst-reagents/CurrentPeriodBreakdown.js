// components/page/catalyst-reagents/CurrentPeriodBreakdown.js
// The same Category/CAS/CAT No./Customer breakdown as the click-to-open
// drill-down modal, but shown inline below the Sales chart — no click
// needed, just scroll. Has its OWN date scope (independent of the Sales
// chart's own FY/Custom Range picker above it), defaulting to the current
// month (since presentations are usually "how's this month looking"), with
// a header line naming whichever period is currently showing.

import { useState, useMemo } from 'react';
import { fyToDateRange, todayLocalISO } from 'utils/fiscalYear';
import BreakdownTable from './BreakdownTable';

const firstOfMonthISO = () => {
  const d = new Date();
  return todayLocalISO(new Date(d.getFullYear(), d.getMonth(), 1));
};
const currentMonthLabel = () =>
  new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

export default function CurrentPeriodBreakdown({ categories, fyOpts }) {
  const [dateMode, setDateMode] = useState('custom'); // 'fy' | 'custom' — defaults to custom = current month
  const [selectedFY, setSelectedFY] = useState(() => fyOpts?.[0]?.value || '');
  const [customStart, setCustomStart] = useState(firstOfMonthISO);
  const [customEnd, setCustomEnd] = useState(todayLocalISO);

  const isDefaultCurrentMonth = dateMode === 'custom' && customStart === firstOfMonthISO() && customEnd === todayLocalISO();

  const resolvedRange = useMemo(() => {
    if (dateMode === 'fy') return fyToDateRange(selectedFY);
    return { startDate: customStart, endDate: customEnd };
  }, [dateMode, selectedFY, customStart, customEnd]);

  const periodLabel = isDefaultCurrentMonth
    ? `Current Month (${currentMonthLabel()})`
    : dateMode === 'fy'
      ? fyOpts?.find((o) => o.value === selectedFY)?.label || selectedFY
      : `${resolvedRange.startDate} → ${resolvedRange.endDate}`;

  return (
    <div className="cr-table-card" style={{ padding: 16, marginTop: 16 }}>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <div>
          <div className="cr-header-desc" style={{ fontWeight: 700, color: 'var(--text)' }}>Breakdown</div>
          <div className="cr-header-desc">Showing: {periodLabel}</div>
        </div>
        <div className="d-flex flex-wrap align-items-end gap-2">
          <div className="cr-field">
            <label>Date Scope</label>
            <div className="cr-mode-toggle">
              <button type="button" className={`cr-mode-btn ${dateMode === 'custom' ? 'active' : ''}`} onClick={() => setDateMode('custom')}>Custom Range</button>
              <button type="button" className={`cr-mode-btn ${dateMode === 'fy' ? 'active' : ''}`} onClick={() => setDateMode('fy')}>Financial Year</button>
            </div>
          </div>
          {dateMode === 'fy' ? (
            <div className="cr-field">
              <label>&nbsp;</label>
              <select className="cr-select" value={selectedFY} onChange={(e) => setSelectedFY(e.target.value)}>
                {(fyOpts || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
        </div>
      </div>

      <BreakdownTable
        categories={categories}
        startDate={resolvedRange.startDate}
        endDate={resolvedRange.endDate}
        exportFileName={`Catalyst_Reagents_Breakdown_${resolvedRange.startDate}_to_${resolvedRange.endDate}`}
      />
    </div>
  );
}
