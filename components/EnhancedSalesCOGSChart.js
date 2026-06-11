

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, Table, Spinner } from 'react-bootstrap';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, LineElement, PointElement, LineController,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { formatCurrency } from 'utils/formatCurrency';
import { useAuth } from '../contexts/AuthContext';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  Title, Tooltip, Legend, LineController, ChartDataLabels
);

/* ── FY helpers (unchanged) ── */
const getCurrentFY = () => {
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  const s = m >= 4 ? y : y - 1;
  return `${s}-${s + 1}`;
};
const buildFYList = (calendarYears) => {
  const set = new Set();
  (calendarYears || []).forEach(y => { set.add(`${y-1}-${y}`); set.add(`${y}-${y+1}`); });
  set.add(getCurrentFY());
  return Array.from(set).sort((a, b) => parseInt(b) - parseInt(a));
};
const filterByFY = (data, fy) => {
  if (!fy || !data) return data;
  const [sy, ey] = fy.split('-').map(Number);
  return data.filter(({ year, monthNumber }) =>
    monthNumber >= 4 ? year === sy : year === ey
  );
};

/* ── Multi-select styles ── */
const msStyles = {
  control: (b, s) => ({
    ...b, minHeight: 34, fontSize: 12, borderRadius: 6,
    borderColor: s.isFocused ? '#86b7fe' : '#dee2e6',
    boxShadow: s.isFocused ? '0 0 0 3px rgba(13,110,253,.15)' : 'none',
    '&:hover': { borderColor: '#adb5bd' },
  }),
  menu:        (b) => ({ ...b, fontSize: 12, zIndex: 9999 }),
  placeholder: (b) => ({ ...b, color: '#adb5bd', fontSize: 12 }),
  multiValue:  (b) => ({ ...b, background: '#e7f0ff', borderRadius: 4 }),
  multiValueLabel:  (b) => ({ ...b, color: '#0d47a1', fontSize: 11, padding: '1px 4px' }),
  multiValueRemove: (b) => ({ ...b, color: '#0d47a1', '&:hover': { background: '#cfe2ff', color: '#0d47a1' } }),
  option: (b, s) => ({
    ...b,
    backgroundColor: s.isSelected ? '#0d6efd' : s.isFocused ? '#f0f4ff' : 'white',
    color: s.isSelected ? 'white' : '#212529',
    fontSize: 12,
  }),
  valueContainer: (b) => ({ ...b, maxHeight: 60, overflowY: 'auto' }),
};

/* helper: extract values array from multi-select state */
const vals = (arr) => (arr || []).map(o => o.value);

/* ════════════════════════════════════════════════════════ */
const EnhancedSalesCOGSChart = () => {
  const { user } = useAuth();
  const isAdmin     = user?.role === 'admin';
  const isSales     = user?.role === 'sales_person';
  const is3ASenrise = user?.role === '3ASenrise';
  const showGM      = isAdmin || isSales || is3ASenrise;

  /* ── data state ── */
  const [salesData,  setSalesData]  = useState([]);
  const [fyList,     setFyList]     = useState([]);
  const [selectedFY, setSelectedFY] = useState(getCurrentFY);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const tableRef = useRef(null);

  /* ── filter state — all multi ── */
  const [filters, setFilters] = useState({
    salesPersons:   [],   // array of {value,label}
    contactPersons: [],
    categories:     [],
    products:       [],
    customers:      [],
  });

  /* ── dropdown options ── */
  const [opts, setOpts] = useState({
    salesPersons: [], contactPersons: [], categories: [], customers: [],
  });

  /* load static options once */
  useEffect(() => {
    if (is3ASenrise) return;
    (async () => {
      try {
        const [sp, cp, cat, cust] = await Promise.all([
          fetch('/api/unique/salespersons').then(r => r.json()),
          fetch('/api/unique/contact-persons').then(r => r.json()),
          fetch('/api/unique/categories').then(r => r.json()),
          fetch('/api/unique/customers').then(r => r.json()),
        ]);
        setOpts({
          salesPersons:   sp.data?.map(s => ({ value: s.SlpCode,    label: s.SlpName }))       || [],
          contactPersons: cp.data?.map(c => ({ value: c.CntctCode,  label: c.ContactPerson })) || [],
          categories:     cat.data?.map(c => ({ value: c.ItmsGrpNam, label: c.ItmsGrpNam }))  || [],
          customers:      cust.data?.map(c => ({ value: c.CardCode,  label: c.CardName }))     || [],
        });
      } catch (e) { console.error('Filter load error:', e); }
    })();
  }, [is3ASenrise]);

  /* ── product async — server-side search, min 2 chars ── */
  const loadProducts = useCallback(async (input) => {
    if (!input || input.trim().length < 2) return [];
    try {
      const res  = await fetch(`/api/unique/products?search=${encodeURIComponent(input.trim())}`);
      const data = await res.json();
      return data.data?.map(p => ({
        value: p.ItemCode,
        label: `${p.ItemCode}: ${p.ItemName}${p.CasNo ? ' · ' + p.CasNo : ''}`,
      })) || [];
    } catch { return []; }
  }, []);

  /* ── fetch chart data ── */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const p = new URLSearchParams();

      // sales_person: scoped by token; admin can multi-select
      if (isAdmin && filters.salesPersons.length)
        vals(filters.salesPersons).forEach(v => p.append('slpCode', v));
      if (filters.contactPersons.length)
        vals(filters.contactPersons).forEach(v => p.append('cntctCode', v));
      if (filters.categories.length)
        vals(filters.categories).forEach(v => p.append('itmsGrpNam', v));   // ← name not code
      if (filters.products.length)
        vals(filters.products).forEach(v => p.append('itemCode', v));
      if (filters.customers.length)
        vals(filters.customers).forEach(v => p.append('cardCode', v));

      const res = await fetch(`/api/sales-cogs?${p}`);
      if (!res.ok) { const e = await res.json(); throw new Error(e?.error || res.status); }

      const { data, availableYears } = await res.json();
      const sorted = [...data].sort((a, b) =>
        a.year !== b.year ? a.year - b.year : a.monthNumber - b.monthNumber
      );
      setSalesData(sorted);
      const fys = buildFYList(availableYears);
      setFyList(fys);
      setSelectedFY(prev => {
        const cur = getCurrentFY();
        if (fys.includes(prev)) return prev;
        return fys.includes(cur) ? cur : fys[0];
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchData(); }, [user, filters]);

  /* ── derived ── */
  const rows       = filterByFY(salesData, selectedFY);
  const labels     = rows.map(d => d.monthYear);
  const totalSales = rows.reduce((a, c) => a + (c.totalSales || 0), 0);
  const totalCOGS  = rows.reduce((a, c) => a + (c.totalCogs  || 0), 0);
  const avgGM      = totalSales > 0 ? ((totalSales - totalCOGS) / totalSales) * 100 : 0;

  useEffect(() => {
    if (tableRef.current && rows.length)
      tableRef.current.scrollLeft = tableRef.current.scrollWidth;
  }, [rows]);

  /* ── chart ── */
  const C = { sales: '#124f94', cogs: '#3bac4e', gm: '#3bac4e', order: '#F39C12', lines: '#219cba' };
  const datasets = showGM ? [
    { label: 'Lines',       data: rows.map(d => d.invoiceCount    || 0), backgroundColor: C.lines, borderWidth: 1, yAxisID: 'y2' },
    { label: 'Sales',       data: rows.map(d => d.totalSales      || 0), backgroundColor: C.sales, borderWidth: 1 },
    { label: 'Order Value', data: rows.map(d => d.orderValue      || 0), backgroundColor: C.order, borderWidth: 1 },
    { label: 'COGS',        data: rows.map(d => d.totalCogs       || 0), backgroundColor: C.cogs,  borderWidth: 1 },
    { label: 'GM%',         data: rows.map(d => d.grossMarginPct  || 0), type: 'line', borderColor: C.gm, backgroundColor: C.gm, borderWidth: 2, fill: false, yAxisID: 'y1', tension: 0.4, pointRadius: 3 },
  ] : [
    { label: 'Sales',       data: rows.map(d => d.totalSales      || 0), backgroundColor: C.sales, borderWidth: 1 },
    { label: 'Order Value', data: rows.map(d => d.orderValue      || 0), backgroundColor: C.order, borderWidth: 1 },
    { label: 'Lines',       data: rows.map(d => d.invoiceCount    || 0), backgroundColor: C.lines, borderWidth: 1, yAxisID: 'y2' },
  ];

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    layout: { padding: { left: 10, right: 10 } },
    plugins: {
      datalabels: { display: false },
      tooltip: { callbacks: { label: (ctx) => {
        const { label: l, raw } = { label: ctx.dataset.label, raw: ctx.raw };
        if (l === 'GM%')   return `GM%: ${raw.toFixed(2)}%`;
        if (l === 'Lines') return `Lines: ${raw}`;
        return `${l}: ${formatCurrency(raw)}`;
      }}},
      legend: { position: 'top', labels: { font: { size: 12 }, padding: 16, boxWidth: 12 } },
    },
    scales: {
      y:  { beginAtZero: true, ticks: { callback: v => formatCurrency(v), font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
      y1: { position: 'right', beginAtZero: true, ticks: { callback: v => `${v}%`, font: { size: 11 } }, grid: { drawOnChartArea: false } },
      y2: { position: 'right', beginAtZero: true, ticks: { callback: v => v, font: { size: 11 } }, grid: { drawOnChartArea: false } },
      x:  { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  };

  const fyOpts  = fyList.map(fy => { const [s,e] = fy.split('-'); return { value: fy, label: `FY ${s}-${String(e).slice(-2)}` }; });
  const fyVal   = fyOpts.find(o => o.value === selectedFY) ?? null;
  const active  = Object.values(filters).filter(a => a.length > 0).length;

  const setF = (key, val) => setFilters(prev => ({ ...prev, [key]: val || [] }));
  const reset = () => setFilters({ salesPersons: [], contactPersons: [], categories: [], products: [], customers: [] });

  /* ── table styles ── */
  const thStyle = { fontSize: 13, fontWeight: 600, padding: '8px 12px', background: '#f8f9fa', whiteSpace: 'nowrap', color: '#495057' };
  const tdStyle = { fontSize: 13, padding: '7px 12px', whiteSpace: 'nowrap' };
  const tdLabelStyle = { ...tdStyle, fontWeight: 600, background: '#f8f9fa', color: '#495057', minWidth: 90 };
  const tdTotalStyle = { ...tdStyle, fontWeight: 700, background: '#f0f4ff', color: '#0d47a1' };

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-white py-2 px-3">

        {/* ── Row 1: Title + controls ── */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
          <h5 className="mb-0 fw-bold" style={{ color: '#212529', fontSize: '1.05rem' }}>Sales</h5>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* FY picker */}
            <div style={{ minWidth: 130 }}>
              <Select options={fyOpts} value={fyVal} onChange={o => o && setSelectedFY(o.value)}
                placeholder="FY" isClearable={false} styles={msStyles} />
            </div>

            {/* Reset */}
            {!is3ASenrise && (
              <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                onClick={reset} style={{ borderRadius: 6, fontSize: 12, opacity: active ? 1 : 0.45 }}
                disabled={active === 0}>
                <i className="bi bi-arrow-counterclockwise" />
                Reset All {active > 0 && <span className="badge bg-danger ms-1" style={{ fontSize: 10 }}>{active}</span>}
              </button>
            )}
          </div>
        </div>

        {/* ── Row 2: Filter dropdowns ── */}
        {!is3ASenrise && (
          <div className="row g-2">

            {isAdmin && (
              <div className="col-12 col-sm-6 col-md-4 col-xl-2">
                <label style={lbl}>Sales Person</label>
                <Select isMulti options={opts.salesPersons} value={filters.salesPersons}
                  onChange={v => setF('salesPersons', v)} placeholder="All" isClearable
                  styles={msStyles} closeMenuOnSelect={false} />
              </div>
            )}

            <div className="col-12 col-sm-6 col-md-4 col-xl-2">
              <label style={lbl}>Contact Person</label>
              <Select isMulti options={opts.contactPersons} value={filters.contactPersons}
                onChange={v => setF('contactPersons', v)} placeholder="All" isClearable
                styles={msStyles} closeMenuOnSelect={false} />
            </div>

            <div className="col-12 col-sm-6 col-md-4 col-xl-2">
              <label style={lbl}>Category</label>
              <Select isMulti options={opts.categories} value={filters.categories}
                onChange={v => setF('categories', v)} placeholder="All" isClearable
                styles={msStyles} closeMenuOnSelect={false} />
            </div>

            <div className="col-12 col-sm-6 col-md-4 col-xl-2">
              <label style={lbl}>Product <span style={{ color: '#adb5bd', fontSize: 10 }}>(type 2+ chars)</span></label>
              <AsyncSelect isMulti cacheOptions loadOptions={loadProducts}
                value={filters.products} onChange={v => setF('products', v)}
                placeholder="Search..." isClearable styles={msStyles}
                closeMenuOnSelect={false}
                noOptionsMessage={({ inputValue }) =>
                  !inputValue || inputValue.length < 2 ? 'Type at least 2 characters…' : 'No products found'
                } />
            </div>

            <div className="col-12 col-sm-6 col-md-4 col-xl-2">
              <label style={lbl}>Customer</label>
              <Select isMulti options={opts.customers} value={filters.customers}
                onChange={v => setF('customers', v)} placeholder="All" isClearable
                styles={msStyles} closeMenuOnSelect={false} />
            </div>

          </div>
        )}
      </Card.Header>

      <Card.Body className="p-3">
        {error && <p className="text-danger small mb-2">Error: {error}</p>}

        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: 480 }}>
            <Spinner animation="border" size="sm" className="me-2" />
            <span className="text-muted small">Loading…</span>
          </div>
        ) : !rows.length ? (
          <p className="text-center text-muted small mt-4">No data for selected filters / financial year.</p>
        ) : (
          <>
            {/* ── Chart — reduced height ── */}
            <div style={{ height: 320 }}>
              <Bar data={{ labels, datasets }} options={chartOptions} />
            </div>

            {/* ── Compact table ── */}
            <div className="mt-3" ref={tableRef} style={{ overflowX: 'auto' }}>
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
                    {rows.map((d, i) => <td key={i} style={tdStyle}>{formatCurrency(d.totalSales || 0)}</td>)}
                    <td style={tdTotalStyle}>{formatCurrency(totalSales)}</td>
                  </tr>
                  {showGM && (
                    <>
                      <tr>
                        <td style={tdLabelStyle}>COGS</td>
                        {rows.map((d, i) => <td key={i} style={tdStyle}>{formatCurrency(d.totalCogs || 0)}</td>)}
                        <td style={tdTotalStyle}>{formatCurrency(totalCOGS)}</td>
                      </tr>
                      <tr>
                        <td style={tdLabelStyle}>GM %</td>
                        {rows.map((d, i) => <td key={i} style={{ ...tdStyle, color: (d.grossMarginPct || 0) > 0 ? '#198754' : '#dc3545', fontWeight: 600 }}>{`${(d.grossMarginPct || 0).toFixed(1)}%`}</td>)}
                        <td style={{ ...tdTotalStyle, color: avgGM > 0 ? '#198754' : '#dc3545' }}>{`${avgGM.toFixed(1)}%`}</td>
                      </tr>
                    </>
                  )}
                  <tr>
                    <td style={tdLabelStyle}>Lines</td>
                    {rows.map((d, i) => <td key={i} style={tdStyle}>{d.invoiceCount || 0}</td>)}
                    <td style={tdTotalStyle}>{rows.reduce((s, d) => s + (d.invoiceCount || 0), 0)}</td>
                  </tr>
                  <tr>
                    <td style={tdLabelStyle}>Order Value</td>
                    {rows.map((d, i) => <td key={i} style={tdStyle}>{formatCurrency(d.orderValue || 0)}</td>)}
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

const lbl = { display: 'block', fontSize: 11, fontWeight: 500, color: '#6c757d', marginBottom: 3, letterSpacing: '0.02em' };

export default EnhancedSalesCOGSChart;