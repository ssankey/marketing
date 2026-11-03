// components/page/catalyst-reagents/CatalystReagentsChart.js
// Same Bar+GM%-line chart and monthly breakdown table as
// components/EnhancedSalesCOGSChart.js, forked so the data/date-range/
// category scope is driven entirely by the parent dashboard (its own
// category toggle + FY-or-custom-range picker) instead of this component's
// own internal fetch/filters. Table cells are clickable to open the
// drill-down modal. EnhancedSalesCOGSChart.js itself is left untouched.

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, Spinner } from 'react-bootstrap';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, LineElement, PointElement, LineController,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { formatCurrency } from 'utils/formatCurrency';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  Title, Tooltip, Legend, LineController, ChartDataLabels
);

const C = { sales: '#124f94', cogs: '#3bac4e', gm: '#3bac4e', order: '#F39C12', lines: '#219cba' };

const thStyle = { fontSize: 13, fontWeight: 600, padding: '8px 12px', background: '#f8f9fa', whiteSpace: 'nowrap', color: '#495057' };
const tdStyle = { fontSize: 13, padding: '7px 12px', whiteSpace: 'nowrap', cursor: 'pointer' };
const tdLabelStyle = { ...tdStyle, cursor: 'default', fontWeight: 600, background: '#f8f9fa', color: '#495057', minWidth: 90 };
const tdTotalStyle = { ...tdStyle, cursor: 'default', fontWeight: 700, background: '#f0f4ff', color: '#0d47a1' };

const CatalystReagentsChart = ({ data = [], loading = false, showGM = true, onCellClick }) => {
  const rows = data;
  const labels = rows.map((d) => d.monthYear);
  const totalSales = rows.reduce((a, c) => a + (c.totalSales || 0), 0);
  const totalCOGS = rows.reduce((a, c) => a + (c.totalCogs || 0), 0);
  const avgGM = totalSales > 0 ? ((totalSales - totalCOGS) / totalSales) * 100 : 0;

  const datasets = showGM ? [
    { label: 'Lines', data: rows.map((d) => d.invoiceCount || 0), backgroundColor: C.lines, borderWidth: 1, yAxisID: 'y2' },
    { label: 'Sales', data: rows.map((d) => d.totalSales || 0), backgroundColor: C.sales, borderWidth: 1 },
    { label: 'Order Value', data: rows.map((d) => d.orderValue || 0), backgroundColor: C.order, borderWidth: 1 },
    { label: 'COGS', data: rows.map((d) => d.totalCogs || 0), backgroundColor: C.cogs, borderWidth: 1 },
    { label: 'GM%', data: rows.map((d) => d.grossMarginPct || 0), type: 'line', borderColor: C.gm, backgroundColor: C.gm, borderWidth: 2, fill: false, yAxisID: 'y1', tension: 0.4, pointRadius: 3 },
  ] : [
    { label: 'Sales', data: rows.map((d) => d.totalSales || 0), backgroundColor: C.sales, borderWidth: 1 },
    { label: 'Order Value', data: rows.map((d) => d.orderValue || 0), backgroundColor: C.order, borderWidth: 1 },
    { label: 'Lines', data: rows.map((d) => d.invoiceCount || 0), backgroundColor: C.lines, borderWidth: 1, yAxisID: 'y2' },
  ];

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    layout: { padding: { left: 10, right: 10 } },
    plugins: {
      datalabels: { display: false },
      tooltip: { callbacks: { label: (ctx) => {
        const { label: l, raw } = { label: ctx.dataset.label, raw: ctx.raw };
        if (l === 'GM%') return `GM%: ${raw.toFixed(2)}%`;
        if (l === 'Lines') return `Lines: ${raw}`;
        return `${l}: ${formatCurrency(raw)}`;
      } } },
      legend: { position: 'top', labels: { font: { size: 12 }, padding: 16, boxWidth: 12 } },
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v) => formatCurrency(v), font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
      y1: { position: 'right', beginAtZero: true, ticks: { callback: (v) => `${v}%`, font: { size: 11 } }, grid: { drawOnChartArea: false } },
      y2: { position: 'right', beginAtZero: true, ticks: { callback: (v) => v, font: { size: 11 } }, grid: { drawOnChartArea: false } },
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  };

  const handleCellClick = (row) => {
    if (onCellClick) onCellClick({ year: row.year, monthNumber: row.monthNumber, monthYear: row.monthYear });
  };

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-white py-2 px-3">
        <h5 className="mb-0 fw-bold" style={{ color: '#212529', fontSize: '1.05rem' }}>Sales</h5>
      </Card.Header>
      <Card.Body className="p-3">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: 480 }}>
            <Spinner animation="border" size="sm" className="me-2" />
            <span className="text-muted small">Loading…</span>
          </div>
        ) : !rows.length ? (
          <p className="text-center text-muted small mt-4">No data for the selected categories / date range.</p>
        ) : (
          <>
            <div style={{ height: 320 }}>
              <Bar data={{ labels, datasets }} options={chartOptions} />
            </div>

            <p className="text-muted small mt-3 mb-1">Click any month's value below to see what made it up.</p>
            <div className="mt-1" style={{ overflowX: 'auto' }}>
              <table className="table table-bordered mb-0" style={{ minWidth: '100%', borderColor: '#e9ecef' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Metric</th>
                    {labels.map((l, i) => <th key={i} style={thStyle}>{l}</th>)}
                    <th style={{ ...thStyle, background: '#e8eeff', color: '#0d47a1' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={tdLabelStyle}>Sales</td>
                    {rows.map((d, i) => (
                      <td key={i} style={tdStyle} onClick={() => handleCellClick(d)} title="Click for breakdown">
                        {formatCurrency(d.totalSales || 0)}
                      </td>
                    ))}
                    <td style={tdTotalStyle}>{formatCurrency(totalSales)}</td>
                  </tr>
                  {showGM && (
                    <>
                      <tr>
                        <td style={tdLabelStyle}>COGS</td>
                        {rows.map((d, i) => (
                          <td key={i} style={tdStyle} onClick={() => handleCellClick(d)} title="Click for breakdown">
                            {formatCurrency(d.totalCogs || 0)}
                          </td>
                        ))}
                        <td style={tdTotalStyle}>{formatCurrency(totalCOGS)}</td>
                      </tr>
                      <tr>
                        <td style={tdLabelStyle}>GM %</td>
                        {rows.map((d, i) => (
                          <td
                            key={i}
                            style={{ ...tdStyle, color: (d.grossMarginPct || 0) > 0 ? '#198754' : '#dc3545', fontWeight: 600 }}
                            onClick={() => handleCellClick(d)}
                            title="Click for breakdown"
                          >
                            {`${(d.grossMarginPct || 0).toFixed(1)}%`}
                          </td>
                        ))}
                        <td style={{ ...tdTotalStyle, color: avgGM > 0 ? '#198754' : '#dc3545' }}>{`${avgGM.toFixed(1)}%`}</td>
                      </tr>
                    </>
                  )}
                  <tr>
                    <td style={tdLabelStyle}>Lines</td>
                    {rows.map((d, i) => (
                      <td key={i} style={tdStyle} onClick={() => handleCellClick(d)} title="Click for breakdown">
                        {d.invoiceCount || 0}
                      </td>
                    ))}
                    <td style={tdTotalStyle}>{rows.reduce((s, d) => s + (d.invoiceCount || 0), 0)}</td>
                  </tr>
                  <tr>
                    <td style={tdLabelStyle}>Order Value</td>
                    {rows.map((d, i) => (
                      <td key={i} style={tdStyle} onClick={() => handleCellClick(d)} title="Click for breakdown">
                        {formatCurrency(d.orderValue || 0)}
                      </td>
                    ))}
                    <td style={tdTotalStyle}>{formatCurrency(rows.reduce((s, d) => s + (d.orderValue || 0), 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default CatalystReagentsChart;
