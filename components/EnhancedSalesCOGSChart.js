
// // src/components/EnhancedSalesCOGSChart.js
// import React, { useState, useEffect, useRef } from 'react';
// import { Bar } from 'react-chartjs-2';
// import { Card, Table, Spinner, Dropdown } from 'react-bootstrap';
// import AllFilter from "components/AllFilters.js";
// import Select from "react-select";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   LineElement,
//   PointElement,
//   LineController
// } from 'chart.js';
// import ChartDataLabels from 'chartjs-plugin-datalabels';
// import { formatCurrency } from 'utils/formatCurrency';
// import { useAuth } from '../contexts/AuthContext';

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   LineElement,
//   PointElement,
//   Title,
//   Tooltip,
//   Legend,
//   LineController,
//   ChartDataLabels
// );

// // ─────────────────────────────────────────────
// // Financial Year Helpers (self-contained here)
// // ─────────────────────────────────────────────

// /**
//  * Returns the current FY string, e.g. "2025-2026".
//  * April 1 is the start of a new FY.
//  */
// const getCurrentFinancialYear = () => {
//   const now = new Date();
//   const month = now.getMonth() + 1; // 1-based
//   const year = now.getFullYear();
//   const startYear = month >= 4 ? year : year - 1;
//   return `${startYear}-${startYear + 1}`;
// };

// /**
//  * Builds FY list from the calendar years returned by the API.
//  * ALSO ensures the current FY is always included, even if the DB
//  * has no invoices yet for the new FY's start year.
//  *
//  * @param {number[]} calendarYears - years from availableYears API response
//  * @returns {string[]} sorted descending, e.g. ["2025-2026", "2024-2025", ...]
//  */
// const buildFinancialYears = (calendarYears) => {
//   const fySet = new Set();

//   // Add FYs derived from DB years
//   (calendarYears || []).forEach((year) => {
//     fySet.add(`${year - 1}-${year}`);
//     fySet.add(`${year}-${year + 1}`);
//   });

//   // Always ensure the current FY is present, even with zero data
//   fySet.add(getCurrentFinancialYear());

//   return Array.from(fySet).sort((a, b) => {
//     const aStart = parseInt(a.split('-')[0], 10);
//     const bStart = parseInt(b.split('-')[0], 10);
//     return bStart - aStart; // descending
//   });
// };

// /**
//  * Filters the flat monthly data array to only rows within the given FY.
//  * FY runs April (month 4) of startYear → March (month 3) of endYear.
//  */
// const filterDataByFY = (data, fy) => {
//   if (!fy || !data) return data;
//   const [startYear, endYear] = fy.split('-').map(Number);

//   return data.filter(({ year, monthNumber }) => {
//     if (monthNumber >= 4) return year === startYear;   // Apr–Dec belongs to startYear
//     return year === endYear;                            // Jan–Mar belongs to endYear
//   });
// };

// // ─────────────────────────────────────────────
// // Component
// // ─────────────────────────────────────────────

// const EnhancedSalesCOGSChart = () => {
//   const [salesData, setSalesData] = useState([]);
//   const [availableYears, setAvailableYears] = useState([]);
//   const [financialYears, setFinancialYears] = useState([]);
//   const [selectedFY, setSelectedFY] = useState(getCurrentFinancialYear);
//   const { user } = useAuth();
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const tableContainerRef = useRef(null);

//   const [filters, setFilters] = useState({
//     salesPerson: null,
//     contactPerson: null,
//     category: null,
//     product: null,
//     customer: null,
//   });

//   const isAdmin = user?.role === 'admin';
//   const isSalesPerson = user?.role === 'sales_person';
//   const is3ASenrise = user?.role === '3ASenrise';
//   const shouldShowGMAndCOGS = isAdmin || isSalesPerson || is3ASenrise;

//   // ── Fetch ──────────────────────────────────
//   const fetchSalesData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const queryParams = new URLSearchParams();
//       if (filters.salesPerson?.value)   queryParams.append('slpCode', filters.salesPerson.value);
//       if (filters.category?.value)      queryParams.append('itmsGrpCod', filters.category.value);
//       if (filters.product?.value)       queryParams.append('itemCode', filters.product.value);
//       if (filters.contactPerson?.value) queryParams.append('cntctCode', filters.contactPerson.value);
//       if (filters.customer?.value)      queryParams.append('cardCode', filters.customer.value);

//       const token = localStorage.getItem('token');
//       const response = await fetch(`/api/sales-cogs?${queryParams}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData?.error || `Failed to fetch data: ${response.status}`);
//       }

//       const { data, availableYears: years } = await response.json();

//       const sortedData = [...data].sort((a, b) =>
//         a.year !== b.year ? a.year - b.year : a.monthNumber - b.monthNumber
//       );

//       setSalesData(sortedData);
//       setAvailableYears(years);

//       // Rebuild FY list, always including current FY
//       const fyList = buildFinancialYears(years);
//       setFinancialYears(fyList);

//       // Keep selectedFY if it's still valid; otherwise default to current FY
//       setSelectedFY((prev) => {
//         const currentFY = getCurrentFinancialYear();
//         if (fyList.includes(prev)) return prev;
//         return fyList.includes(currentFY) ? currentFY : fyList[0];
//       });

//     } catch (err) {
//       console.error('Error fetching sales data:', err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (!user) return;
//     if (localStorage.getItem('token')) fetchSalesData();
//   }, [user, filters]);

//   // ── Derived data ───────────────────────────
//   const filteredSalesData = filterDataByFY(salesData, selectedFY);

//   // Scroll table to the right when data changes
//   useEffect(() => {
//     if (tableContainerRef.current && filteredSalesData.length > 0) {
//       tableContainerRef.current.scrollLeft = tableContainerRef.current.scrollWidth;
//     }
//   }, [filteredSalesData]);

//   const labels      = filteredSalesData.map((d) => d.monthYear);
//   const totalSales  = filteredSalesData.reduce((a, c) => a + (c.totalSales || 0), 0);
//   const totalCOGS   = filteredSalesData.reduce((a, c) => a + (c.totalCogs || 0), 0);
//   const averageGM   = totalSales > 0 ? ((totalSales - totalCOGS) / totalSales) * 100 : 0;

//   // ── Chart datasets ─────────────────────────
//   const colorPalette = {
//     salesBarColor:    '#124f94',
//     cogsBarColor:     '#3bac4e',
//     gmLineColor:      '#3bac4e',
//     orderValueColor:  '#F39C12',
//   };

//   const salesDataset = {
//     label: 'Sales',
//     data: filteredSalesData.map((d) => d.totalSales || 0),
//     backgroundColor: colorPalette.salesBarColor,
//     borderWidth: 1,
//   };

//   const orderValueDataset = {
//     label: 'Order Value',
//     data: filteredSalesData.map((d) => d.orderValue || 0),
//     backgroundColor: colorPalette.orderValueColor,
//     borderWidth: 1,
//   };

//   const cogsDataset = {
//     label: 'COGS',
//     data: filteredSalesData.map((d) => d.totalCogs || 0),
//     backgroundColor: colorPalette.cogsBarColor,
//     borderWidth: 1,
//   };

//   const invoiceCountDataset = {
//     label: 'Lines',
//     data: filteredSalesData.map((d) => d.invoiceCount || 0),
//     borderWidth: 1,
//     backgroundColor: '#219cba',
//     yAxisID: 'y2',
//   };

//   const gmPercentDataset = {
//     label: 'GM%',
//     data: filteredSalesData.map((d) => d.grossMarginPct || 0),
//     type: 'line',
//     borderColor: colorPalette.gmLineColor,
//     backgroundColor: colorPalette.gmLineColor,
//     borderWidth: 2,
//     fill: false,
//     yAxisID: 'y1',
//     tension: 0.4,
//     pointRadius: 4,
//     pointHoverRadius: 6,
//   };

//   const finalDatasets = shouldShowGMAndCOGS
//     ? [invoiceCountDataset, salesDataset, orderValueDataset, cogsDataset, gmPercentDataset]
//     : [salesDataset, orderValueDataset, invoiceCountDataset];

//   const chartData = { labels, datasets: finalDatasets };

//   const chartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     layout: { padding: { left: 20, right: 20 } },
//     plugins: {
//       datalabels: { display: false },
//       tooltip: {
//         callbacks: {
//           label: (context) => {
//             const { label: dsLabel, raw } = { label: context.dataset.label, raw: context.raw };
//             if (dsLabel === 'GM%')   return `GM%: ${raw.toFixed(2)}%`;
//             if (dsLabel === 'Lines') return `Lines: ${raw}`;
//             return `${dsLabel}: ${formatCurrency(raw)}`;
//           },
//         },
//       },
//       legend: {
//         position: 'top',
//         labels: { font: { family: "'Inter', sans-serif", size: 13 }, padding: 20 },
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         min: 0,
//         ticks: {
//           callback: (v) => formatCurrency(v),
//           font: { family: "'Inter', sans-serif", size: 12 },
//         },
//         grid: { color: 'rgba(0,0,0,0.05)' },
//       },
//       y1: {
//         position: 'right',
//         beginAtZero: true,
//         min: 0,
//         ticks: {
//           callback: (v) => `${v}%`,
//           font: { family: "'Inter', sans-serif", size: 12 },
//         },
//         grid: { drawOnChartArea: false },
//       },
//       y2: {
//         position: 'right',
//         beginAtZero: true,
//         min: 0,
//         offset: false,
//         ticks: { callback: (v) => v },
//         grid: { drawOnChartArea: false },
//       },
//       x: {
//         grid: { display: false },
//         ticks: { font: { family: "'Inter', sans-serif", size: 12 } },
//         barPercentage: 0.8,
//         categoryPercentage: 0.9,
//       },
//     },
//   };

//   // ── FY Select options ──────────────────────
//   const fySelectOptions = financialYears.map((fy) => {
//     const [s, e] = fy.split('-');
//     return { value: fy, label: `FY ${s}-${String(e).slice(-2)}` };  // e.g. "FY 2025-26"
//   });

//   const fySelectValue = fySelectOptions.find((o) => o.value === selectedFY) ?? null;

//   // ── Render ─────────────────────────────────
//   return (
//     <Card className="shadow-sm border-0 mb-4">
//       <Card.Header className="bg-white py-3">
//         <div className="d-flex justify-content-between align-items-center">
//           <h4
//             className="mb-3 mb-md-0"
//             style={{ fontWeight: 600, color: '#212529', fontSize: '1.25rem' }}
//           >
//             Sales
//           </h4>

//           <div className="d-flex align-items-center gap-3">
//             {/* Financial Year Dropdown */}
//             <div style={{ minWidth: '150px' }}>
//               <Select
//                 options={fySelectOptions}
//                 value={fySelectValue}
//                 onChange={(opt) => opt && setSelectedFY(opt.value)}
//                 placeholder="Select FY"
//                 isClearable={false}
//                 styles={{
//                   control: (base) => ({ ...base, minHeight: '38px', fontSize: '14px', borderRadius: '6px' }),
//                   menu:    (base) => ({ ...base, fontSize: '14px' }),
//                 }}
//               />
//             </div>

//             {/* AllFilter — hidden for 3ASenrise */}
//             {!is3ASenrise && (
//               <AllFilter
//                 allowedTypes={['sales-person', 'contact-person', 'product', 'category', 'customer']}
//                 searchQuery={searchQuery}
//                 setSearchQuery={(value) => {
//                   if (value) {
//                     setFilters((prev) => ({
//                       ...prev,
//                       [value.type === 'sales-person'
//                         ? 'salesPerson'
//                         : value.type === 'contact-person'
//                         ? 'contactPerson'
//                         : value.type]: { value: value.value, label: value.label },
//                     }));
//                   } else {
//                     setFilters({ salesPerson: null, contactPerson: null, category: null, product: null, customer: null });
//                   }
//                 }}
//               />
//             )}
//           </div>
//         </div>
//       </Card.Header>

//       <Card.Body>
//         {error && <p className="text-center mt-4 text-danger">Error: {error}</p>}

//         {loading ? (
//           <div className="d-flex justify-content-center align-items-center" style={{ height: '500px' }}>
//             <Spinner animation="border" role="status" className="me-2">
//               <span className="visually-hidden">Loading...</span>
//             </Spinner>
//             <span>Loading chart data...</span>
//           </div>
//         ) : filteredSalesData.length ? (
//           <>
//             <div className="chart-container" style={{ height: '500px', width: '100%', overflow: 'visible' }}>
//               <Bar data={chartData} options={chartOptions} />
//             </div>

//             {/* Table */}
//             <div className="mt-4">
//               <div ref={tableContainerRef} style={{ overflowX: 'auto', direction: 'rtl' }}>
//                 <Table
//                   striped
//                   bordered
//                   hover
//                   responsive={false}
//                   style={{ direction: 'ltr', minWidth: '100%', whiteSpace: 'nowrap' }}
//                 >
//                   <thead>
//                     <tr>
//                       <th>Metric</th>
//                       {labels.map((label, idx) => <th key={idx}>{label}</th>)}
//                       <th>Total</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     <tr>
//                       <td>Sales</td>
//                       {filteredSalesData.map((d, i) => <td key={i}>{formatCurrency(d.totalSales || 0)}</td>)}
//                       <td>{formatCurrency(totalSales)}</td>
//                     </tr>

//                     {shouldShowGMAndCOGS && (
//                       <>
//                         <tr>
//                           <td>COGS</td>
//                           {filteredSalesData.map((d, i) => <td key={i}>{formatCurrency(d.totalCogs || 0)}</td>)}
//                           <td>{formatCurrency(totalCOGS)}</td>
//                         </tr>
//                         <tr>
//                           <td>GM %</td>
//                           {filteredSalesData.map((d, i) => (
//                             <td key={i}>{`${(d.grossMarginPct || 0).toFixed(2)}%`}</td>
//                           ))}
//                           <td>{`${averageGM.toFixed(2)}%`}</td>
//                         </tr>
//                       </>
//                     )}

//                     <tr>
//                       <td>Lines</td>
//                       {filteredSalesData.map((d, i) => <td key={i}>{d.invoiceCount || 0}</td>)}
//                       <td>{filteredSalesData.reduce((s, d) => s + (d.invoiceCount || 0), 0)}</td>
//                     </tr>
//                     <tr>
//                       <td>Order Value</td>
//                       {filteredSalesData.map((d, i) => <td key={i}>{formatCurrency(d.orderValue || 0)}</td>)}
//                       <td>{formatCurrency(filteredSalesData.reduce((s, d) => s + (d.orderValue || 0), 0))}</td>
//                     </tr>
//                   </tbody>
//                 </Table>
//               </div>
//             </div>
//           </>
//         ) : (
//           <p className="text-center mt-4">No data available for the selected financial year.</p>
//         )}
//       </Card.Body>
//     </Card>
//   );
// };

// export default EnhancedSalesCOGSChart;


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