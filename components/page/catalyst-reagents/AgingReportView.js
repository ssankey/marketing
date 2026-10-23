// components/page/catalyst-reagents/AgingReportView.js
// Stock aging snapshot for the selected categories — 4 KPI cards, a grouped
// bar chart (Stock Value + Quantity per age bucket) next to a "Stock Value
// by Category" donut, and a category x bucket breakdown table. Layout
// follows the reference mockup the user provided.

import React, { useState, useEffect, useMemo } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import { formatCurrency } from 'utils/formatCurrency';
import downloadExcel from 'utils/exporttoexcel';
import { todayLocalISO } from 'utils/fiscalYear';
import AgingItemsModal from './AgingItemsModal';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const BUCKETS = ['0-30', '30-60', '60-90', '90-120', '120+'];
const BUCKET_LABELS = { '0-30': '0 - 30 Days', '30-60': '30 - 60 Days', '60-90': '60 - 90 Days', '90-120': '90 - 120 Days', '120+': '120+ Days' };
const CATEGORY_COLORS = ['#1f68bf', '#21875a', '#F39C12', '#c0402f', '#6f42c1'];

export default function AgingReportView({ categories }) {
  const [asOfDate, setAsOfDate] = useState(todayLocalISO);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itemsModal, setItemsModal] = useState(null); // { category, bucket, title } | null

  const openItems = (category, bucket, title) => setItemsModal({ category, bucket, title });

  useEffect(() => {
    if (!categories || categories.length === 0) {
      setData(null);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ asOfDate });
        categories.forEach((c) => params.append('itmsGrpNam', c));
        const res = await fetch(`/api/catalyst-reagents/aging?${params}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load aging report');
        setData(json);
      } catch (e) {
        setError(e.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [categories, asOfDate]);

  const rows = data?.byCategoryBucket || [];

  // bucket -> { qty, value } summed across all selected categories
  const bucketTotals = useMemo(() => {
    const map = Object.fromEntries(BUCKETS.map((b) => [b, { qty: 0, value: 0 }]));
    rows.forEach((r) => { map[r.bucket].qty += r.qty; map[r.bucket].value += r.value; });
    return map;
  }, [rows]);

  // category -> total value (for the donut)
  const categoryTotals = useMemo(() => {
    const map = {};
    rows.forEach((r) => { map[r.category] = (map[r.category] || 0) + r.value; });
    return map;
  }, [rows]);

  const categoryNames = Object.keys(categoryTotals);

  // category x bucket lookup for the table
  const matrix = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      map[r.category] = map[r.category] || {};
      map[r.category][r.bucket] = { qty: r.qty, value: r.value };
    });
    return map;
  }, [rows]);

  const barData = {
    labels: BUCKETS.map((b) => BUCKET_LABELS[b]),
    datasets: [
      { label: 'Stock Value (₹)', data: BUCKETS.map((b) => bucketTotals[b].value), backgroundColor: '#1f68bf', yAxisID: 'y' },
      { label: 'Quantity', data: BUCKETS.map((b) => bucketTotals[b].qty), backgroundColor: '#21875a', yAxisID: 'y1' },
    ],
  };
  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      datalabels: { display: false },
      legend: { position: 'top' },
      tooltip: { callbacks: { label: (ctx) => ctx.dataset.label === 'Stock Value (₹)' ? `Stock Value: ${formatCurrency(ctx.raw)}` : `Quantity: ${ctx.raw.toLocaleString('en-IN')}` } },
    },
    scales: {
      y: { position: 'left', beginAtZero: true, ticks: { callback: (v) => formatCurrency(v) } },
      y1: { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false }, ticks: { callback: (v) => v.toLocaleString('en-IN') } },
    },
  };

  const doughnutData = {
    labels: categoryNames,
    datasets: [{ data: categoryNames.map((c) => categoryTotals[c]), backgroundColor: CATEGORY_COLORS }],
  };
  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      datalabels: { display: false },
      legend: {
        position: 'right',
        labels: {
          generateLabels: (chart) => {
            const cd = chart.data;
            return cd.labels.map((label, i) => ({
              text: `${label}: ${formatCurrency(cd.datasets[0].data[i])}`,
              fillStyle: cd.datasets[0].backgroundColor[i],
              strokeStyle: cd.datasets[0].backgroundColor[i],
              index: i,
            }));
          },
        },
      },
      tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.raw)}` } },
    },
  };

  const totalStockValue = data?.totals?.stockValue || 0;

  const handleDownload = () => {
    if (categoryNames.length === 0) { alert('No data to export'); return; }
    const exportRows = categoryNames.map((cat) => {
      const row = { Category: cat };
      let totalQty = 0, totalValue = 0;
      BUCKETS.forEach((b) => {
        const cell = matrix[cat]?.[b] || { qty: 0, value: 0 };
        row[`${BUCKET_LABELS[b]} Qty`] = cell.qty;
        row[`${BUCKET_LABELS[b]} Value`] = cell.value;
        totalQty += cell.qty;
        totalValue += cell.value;
      });
      row['Total Qty'] = totalQty;
      row['Total Value'] = totalValue;
      return row;
    });
    const currencyFormats = {};
    BUCKETS.forEach((b) => { currencyFormats[`${BUCKET_LABELS[b]} Value`] = { type: 'currency' }; });
    currencyFormats['Total Value'] = { type: 'currency' };
    downloadExcel(exportRows, `Stock_Aging_${asOfDate}.xlsx`, currencyFormats);
  };

  return (
    <div>
      <div className="cr-controls">
        <div className="cr-field">
          <label>As On</label>
          <input type="date" className="cr-input" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} max={todayLocalISO()} />
        </div>
        <div className="cr-spacer" />
        <div className="cr-field">
          <label>&nbsp;</label>
          <button className="cr-export-btn" onClick={handleDownload} disabled={loading || rows.length === 0}>
            Download
          </button>
        </div>
      </div>

      {error && <div className="cr-empty" style={{ color: 'var(--bad)' }}>{error}</div>}

      {loading ? (
        <div className="cr-loading"><div className="cr-spinner" /><span>Loading aging report…</span></div>
      ) : rows.length === 0 ? (
        <div className="cr-empty">No stock found for the selected categories.</div>
      ) : (
        <>
          <div className="cr-kpi-row">
            <div className="cr-kpi-card">
              <div className="cr-kpi-label">Total Stock Value</div>
              <div className="cr-kpi-value">{formatCurrency(totalStockValue)}</div>
              <div className="cr-kpi-sub">Across selected categories</div>
            </div>
            <div className="cr-kpi-card">
              <div className="cr-kpi-label">Total Quantity</div>
              <div className="cr-kpi-value">{(data.totals.quantity || 0).toLocaleString('en-IN')}</div>
              <div className="cr-kpi-sub">Total stock quantity</div>
            </div>
            <div className="cr-kpi-card">
              <div className="cr-kpi-label">Total Items</div>
              <div className="cr-kpi-value">{(data.totals.items || 0).toLocaleString('en-IN')}</div>
              <div className="cr-kpi-sub">Unique items</div>
            </div>
            <div className="cr-kpi-card">
              <div className="cr-kpi-label">GRN Transactions</div>
              <div className="cr-kpi-value">{(data.totals.lots || 0).toLocaleString('en-IN')}</div>
              <div className="cr-kpi-sub">Distinct stock lots</div>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-3 mb-3" style={{ alignItems: 'stretch' }}>
            <div className="cr-table-card" style={{ flex: '1 1 480px', padding: 16 }}>
              <div className="cr-header-desc" style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Aging Summary</div>
              <div style={{ height: 300 }}>
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
            <div className="cr-table-card" style={{ flex: '1 1 360px', padding: 16 }}>
              <div className="cr-header-desc" style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Stock Value by Category</div>
              <div style={{ height: 300, position: 'relative' }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div style={{
                  position: 'absolute', top: '50%', left: '38%', transform: 'translate(-50%, -50%)',
                  textAlign: 'center', pointerEvents: 'none',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Total</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 14 }}>{formatCurrency(totalStockValue)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="cr-table-card">
            <div className="cr-table-scroll">
              <table className="cr-table">
                <thead>
                  <tr>
                    <th className="cr-th-left" rowSpan={2}>Category</th>
                    {BUCKETS.map((b) => <th key={b} className="cr-th-right" colSpan={2}>{BUCKET_LABELS[b]}</th>)}
                    <th className="cr-th-right" colSpan={2}>Total</th>
                  </tr>
                  <tr>
                    {BUCKETS.map((b) => (
                      <React.Fragment key={b}>
                        <th className="cr-th-right">Qty</th>
                        <th className="cr-th-right">Value</th>
                      </React.Fragment>
                    ))}
                    <th className="cr-th-right">Qty</th>
                    <th className="cr-th-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryNames.map((cat) => {
                    let rowQty = 0, rowValue = 0;
                    return (
                      <tr key={cat}>
                        <td>{cat}</td>
                        {BUCKETS.map((b) => {
                          const cell = matrix[cat]?.[b] || { qty: 0, value: 0 };
                          rowQty += cell.qty; rowValue += cell.value;
                          const cellTitle = `${cat} · ${BUCKET_LABELS[b]}`;
                          return (
                            <React.Fragment key={b}>
                              <td className="cr-num cr-cell-clickable" onClick={() => openItems(cat, b, cellTitle)} title="Click to see items">{cell.qty.toLocaleString('en-IN')}</td>
                              <td className="cr-num cr-cell-clickable" onClick={() => openItems(cat, b, cellTitle)} title="Click to see items">{formatCurrency(cell.value)}</td>
                            </React.Fragment>
                          );
                        })}
                        <td className="cr-num cr-cell-clickable" style={{ fontWeight: 700 }} onClick={() => openItems(cat, 'ALL', `${cat} · All Ages`)} title="Click to see items">{rowQty.toLocaleString('en-IN')}</td>
                        <td className="cr-num cr-cell-clickable" style={{ fontWeight: 700 }} onClick={() => openItems(cat, 'ALL', `${cat} · All Ages`)} title="Click to see items">{formatCurrency(rowValue)}</td>
                      </tr>
                    );
                  })}
                  <tr className="cr-total-row">
                    <td>Total</td>
                    {BUCKETS.map((b) => (
                      <React.Fragment key={b}>
                        <td className="cr-num cr-cell-clickable" onClick={() => openItems('ALL', b, `All Categories · ${BUCKET_LABELS[b]}`)} title="Click to see items">{bucketTotals[b].qty.toLocaleString('en-IN')}</td>
                        <td className="cr-num cr-cell-clickable" onClick={() => openItems('ALL', b, `All Categories · ${BUCKET_LABELS[b]}`)} title="Click to see items">{formatCurrency(bucketTotals[b].value)}</td>
                      </React.Fragment>
                    ))}
                    <td className="cr-num cr-cell-clickable" onClick={() => openItems('ALL', 'ALL', 'All Categories · All Ages')} title="Click to see items">{(data.totals.quantity || 0).toLocaleString('en-IN')}</td>
                    <td className="cr-num cr-cell-clickable" onClick={() => openItems('ALL', 'ALL', 'All Categories · All Ages')} title="Click to see items">{formatCurrency(totalStockValue)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="cr-header-desc" style={{ marginTop: 12, fontSize: 12.5 }}>
            Aging is calculated based on GRN date. Items are grouped into aging buckets based on the number of days between the batch&apos;s inward date and the &quot;as on&quot; date.
            {' '}0-30 Days (0 to 30), 30-60 Days (31 to 60), 60-90 Days (61 to 90), 90-120 Days (91 to 120), 120+ Days (more than 120 days).
            {' '}Click on any cell in the table above (including the Total row and Total column) to see the individual items.
          </div>
        </>
      )}

      <AgingItemsModal
        show={!!itemsModal}
        onHide={() => setItemsModal(null)}
        categories={categories}
        asOfDate={asOfDate}
        category={itemsModal?.category}
        bucket={itemsModal?.bucket}
        title={itemsModal?.title || ''}
      />
    </div>
  );
}
