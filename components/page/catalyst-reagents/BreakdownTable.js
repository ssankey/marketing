// components/page/catalyst-reagents/BreakdownTable.js
// The sequence-picker + recursive category/CAS/item/customer breakdown
// table + Excel export, extracted so it can be used both inside
// DrillDownModal.js (one clicked month) and inline below the Sales chart
// (a whole date range, defaulting to the current month) — both are just
// "give me a breakdown for this date range", the only difference is where
// the date range comes from and whether it's shown in a Modal.

import React, { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Spinner } from 'react-bootstrap';
import downloadExcel from 'utils/exporttoexcel';
import { formatCurrency } from 'utils/formatCurrency';

const ALL_DIMENSIONS = ['category', 'cas', 'item', 'customer'];
const DEFAULT_SEQUENCE = ['category', 'cas', 'item', 'customer'];
const DIMENSION_LABELS = { category: 'Category', cas: 'CAS No.', item: 'CAT No.', customer: 'Customer' };

const fetchJson = async (url) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Request failed');
  return data;
};

const pathKey = (filters) =>
  Object.entries(filters).map(([k, v]) => `${k}:${v}`).join('|') || '__root__';

const indentClass = (depth) => (depth === 0 ? '' : `cr-indent-${Math.min(depth, 3)}`);

function SequencePicker({ sequence, onChange }) {
  const handleChange = (levelIdx, value) => {
    if (value === '') {
      onChange(sequence.slice(0, levelIdx));
      return;
    }
    const used = sequence.slice(0, levelIdx);
    const newSeq = [...used, value];
    DEFAULT_SEQUENCE.forEach((d) => { if (!newSeq.includes(d)) newSeq.push(d); });
    onChange(newSeq);
  };

  const slots = [];
  for (let i = 0; i < 4; i++) {
    if (i > 0 && sequence[i - 1] === undefined) break;
    const usedBefore = sequence.slice(0, i);
    const options = ALL_DIMENSIONS.filter((d) => !usedBefore.includes(d));
    slots.push(
      <div className="cr-field" key={i}>
        <label>Level {i + 1}</label>
        <select className="cr-select" value={sequence[i] || ''} onChange={(e) => handleChange(i, e.target.value)}>
          {i > 0 && <option value="">— Stop here —</option>}
          {options.map((d) => (
            <option key={d} value={d}>{DIMENSION_LABELS[d]}</option>
          ))}
        </select>
      </div>
    );
  }
  return <div className="d-flex flex-wrap align-items-end gap-2 mb-3">{slots}</div>;
}

// hideExportButton: when the host (e.g. DrillDownModal) wants to place the
// Export button itself (in a header row, alongside the title) instead of
// this component's own default row, it passes hideExportButton and calls
// the export action via the forwarded ref's exportData().
const BreakdownTable = forwardRef(function BreakdownTable(
  { categories, startDate, endDate, exportFileName = 'Breakdown', hideExportButton = false, onExportReadyChange },
  ref
) {
  const [sequence, setSequence] = useState(DEFAULT_SEQUENCE);
  const [levelCache, setLevelCache] = useState({});
  const [expandedPaths, setExpandedPaths] = useState(new Set());

  const buildParams = useCallback((dim, filters) => {
    const p = new URLSearchParams({ startDate: startDate || '', endDate: endDate || '', groupBy: dim });
    (categories || []).forEach((c) => p.append('itmsGrpNam', c));
    Object.entries(filters).forEach(([k, v]) => p.append(`filter_${k}`, v));
    return p;
  }, [categories, startDate, endDate]);

  const loadLevel = useCallback(async (depth, filters) => {
    const key = pathKey(filters);
    setLevelCache((prev) => ({ ...prev, [key]: { loading: true, rows: [] } }));
    try {
      const { data } = await fetchJson(`/api/catalyst-reagents/drilldown/breakdown?${buildParams(sequence[depth], filters)}`);
      setLevelCache((prev) => ({ ...prev, [key]: { loading: false, rows: data } }));
    } catch (e) {
      setLevelCache((prev) => ({ ...prev, [key]: { loading: false, rows: [], error: e.message } }));
    }
  }, [sequence, buildParams]);

  useEffect(() => {
    if (!startDate || !endDate || !categories || categories.length === 0) return;
    setLevelCache({});
    setExpandedPaths(new Set());
    loadLevel(0, {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, categories, sequence]);

  const toggleExpand = (depth, filters, rowKey) => {
    const childFilters = { ...filters, [sequence[depth]]: rowKey };
    const childPath = pathKey(childFilters);
    const next = new Set(expandedPaths);
    if (next.has(childPath)) {
      next.delete(childPath);
      setExpandedPaths(next);
      return;
    }
    next.add(childPath);
    setExpandedPaths(next);
    if (depth + 1 < sequence.length && !levelCache[childPath]) {
      loadLevel(depth + 1, childFilters);
    }
  };

  const renderLevel = (depth, filters) => {
    const key = pathKey(filters);
    const state = levelCache[key];
    if (!state) return null;
    if (state.loading) {
      return <tr><td colSpan={6} className={indentClass(depth)}>Loading {DIMENSION_LABELS[sequence[depth]]}…</td></tr>;
    }
    if (state.error) {
      return <tr><td colSpan={6} className={indentClass(depth)} style={{ color: 'var(--bad)' }}>{state.error}</td></tr>;
    }
    if (state.rows.length === 0) {
      return <tr><td colSpan={6} className={indentClass(depth)} style={{ color: 'var(--muted)' }}>No data.</td></tr>;
    }
    return state.rows.map((row) => {
      const childFilters = { ...filters, [sequence[depth]]: row.key };
      const childPath = pathKey(childFilters);
      const isExpanded = expandedPaths.has(childPath);
      const canExpand = depth + 1 < sequence.length;
      return (
        <React.Fragment key={row.key}>
          <tr className={canExpand ? 'cr-row-clickable' : ''} onClick={canExpand ? () => toggleExpand(depth, filters, row.key) : undefined}>
            <td className={indentClass(depth)}>
              {canExpand && (
                <button className="cr-expand-toggle" type="button" onClick={(e) => { e.stopPropagation(); toggleExpand(depth, filters, row.key); }}>
                  {isExpanded ? '−' : '+'}
                </button>
              )}
              <span className="cr-truncate" title={row.label}>{row.label}</span>
            </td>
            <td className="cr-num">{formatCurrency(row.sales)}</td>
            <td className="cr-num">{formatCurrency(row.cogs)}</td>
            <td className="cr-num">{row.grossMarginPct.toFixed(1)}%</td>
            <td className="cr-num">{formatCurrency(row.orderValue)}</td>
            <td className="cr-num">{row.lineItems}</td>
          </tr>
          {isExpanded && renderLevel(depth + 1, childFilters)}
        </React.Fragment>
      );
    });
  };

  const handleExport = () => {
    const flat = [];
    const walk = (depth, filters, pathLabels) => {
      const state = levelCache[pathKey(filters)];
      if (!state?.rows) return;
      state.rows.forEach((row) => {
        const rowPathLabels = [...pathLabels, `${DIMENSION_LABELS[sequence[depth]]}: ${row.label}`];
        flat.push({
          Level: DIMENSION_LABELS[sequence[depth]],
          Path: rowPathLabels.join(' > '),
          Sales: row.sales,
          COGS: row.cogs,
          'GM %': row.grossMarginPct,
          'Order Value': row.orderValue,
          'Line Items': row.lineItems,
        });
        const childFilters = { ...filters, [sequence[depth]]: row.key };
        if (expandedPaths.has(pathKey(childFilters)) && depth + 1 < sequence.length) {
          walk(depth + 1, childFilters, rowPathLabels);
        }
      });
    };
    walk(0, {}, []);
    if (flat.length === 0) { alert('No data to export'); return; }
    downloadExcel(flat, `${exportFileName}.xlsx`, {
      Sales: { type: 'currency' }, COGS: { type: 'currency' }, 'Order Value': { type: 'currency' },
    });
  };

  const rootState = levelCache['__root__'];
  const sequenceLabel = useMemo(() => sequence.map((d) => DIMENSION_LABELS[d]).join(' → '), [sequence]);
  const exportDisabled = !rootState || rootState.loading || (rootState.rows || []).length === 0;

  useImperativeHandle(ref, () => ({ exportData: handleExport }), [handleExport]);
  useEffect(() => {
    onExportReadyChange?.(!exportDisabled);
  }, [exportDisabled, onExportReadyChange]);

  return (
    <div>
      <SequencePicker sequence={sequence} onChange={setSequence} />

      {!hideExportButton && (
        <div className="d-flex justify-content-end mb-2">
          <button className="cr-export-btn" onClick={handleExport} disabled={exportDisabled}>
            Export Excel
          </button>
        </div>
      )}

      {rootState?.loading ? (
        <div className="cr-loading">
          <Spinner animation="border" size="sm" />
          <span>Loading breakdown…</span>
        </div>
      ) : rootState?.error ? (
        <div className="cr-empty" style={{ color: 'var(--bad)' }}>{rootState.error}</div>
      ) : (rootState?.rows || []).length === 0 ? (
        <div className="cr-empty">No sales in this period for the selected categories.</div>
      ) : (
        <div className="cr-table-card">
          <div className="cr-table-scroll">
            <table className="cr-table">
              <thead>
                <tr>
                  <th className="cr-th-left">{sequenceLabel}</th>
                  <th className="cr-th-right">Sales</th>
                  <th className="cr-th-right">COGS</th>
                  <th className="cr-th-right">GM %</th>
                  <th className="cr-th-right">Order Value</th>
                  <th className="cr-th-right">Line Items</th>
                </tr>
              </thead>
              <tbody>{renderLevel(0, {})}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});

export default BreakdownTable;
