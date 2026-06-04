// // components/open-partial-chart/OpenClosedOrdersChartArray.js
// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import { Bar } from "react-chartjs-2";
// import Select from "react-select";
// import AsyncSelect from "react-select/async";
// import { formatCurrency } from "utils/formatCurrency";
// import downloadExcel from "utils/exporttoexcel";
// import OrderDetailsModalSlim from "../modal/OrderDetailsModalSlim";
// import { useAuth } from "contexts/AuthContext";
// import {
//   Chart as ChartJS, CategoryScale, LinearScale,
//   BarElement, Title, Tooltip, Legend,
// } from "chart.js";

// ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// /* ── FY helpers ── */
// const getCurrentFY = () => {
//   const now = new Date();
//   const m = now.getMonth() + 1;
//   const y = now.getFullYear();
//   const s = m >= 4 ? y : y - 1;
//   return `${s}-${s + 1}`;
// };

// /* ── Select styles ── */
// const msStyles = {
//   control: (b, s) => ({
//     ...b, minHeight: 34, fontSize: 12, borderRadius: 6,
//     borderColor: s.isFocused ? "#86b7fe" : "#dee2e6",
//     boxShadow: s.isFocused ? "0 0 0 3px rgba(13,110,253,.15)" : "none",
//     "&:hover": { borderColor: "#adb5bd" },
//   }),
//   menu:        (b) => ({ ...b, fontSize: 12, zIndex: 9999 }),
//   placeholder: (b) => ({ ...b, color: "#adb5bd", fontSize: 12 }),
//   option: (b, s) => ({
//     ...b,
//     backgroundColor: s.isSelected ? "#0d6efd" : s.isFocused ? "#f0f4ff" : "white",
//     color: s.isSelected ? "white" : "#212529", fontSize: 12,
//   }),
// };

// const lbl = {
//   display: "block", fontSize: 11, fontWeight: 500,
//   color: "#6c757d", marginBottom: 3, letterSpacing: "0.02em",
// };

// const vals = (arr) => (arr || []).map(o => o.value);

// /* ════════════════════════════════════════════════════════ */
// const OpenPartialOrdersChart = () => {
//   const { user } = useAuth();
//   const isAdmin  = user?.role === "admin";
//   const isSales  = user?.role === "sales_person";

//   /* ── state ── */
//   const [chartRows,    setChartRows]    = useState([]);
//   const [availableFYs, setAvailableFYs] = useState([]);
//   const [selectedFY,   setSelectedFY]   = useState(""); // set from API response
//   const [loading,      setLoading]      = useState(false);
//   const [exporting,    setExporting]    = useState(false);
//   const [error,        setError]        = useState(null);

//   const [modalData,    setModalData]    = useState(null);
//   const [modalTitle,   setModalTitle]   = useState("");
//   const [barSummary,   setBarSummary]   = useState(null);
//   const [loadingModal, setLoadingModal] = useState(false);

//   /* ── filter state ── */
//   const [filters, setFilters] = useState({
//     salesPersons:   [],
//     contactPersons: [],
//     categories:     [],
//     products:       [],
//     customers:      [],
//   });

//   /* ── dropdown options ── */
//   const [opts, setOpts] = useState({
//     salesPersons: [], contactPersons: [], categories: [], customers: [],
//   });

//   /* load static options */
//   useEffect(() => {
//     (async () => {
//       try {
//         const [sp, cp, cat, cust] = await Promise.all([
//           fetch("/api/unique/salespersons").then(r => r.json()),
//           fetch("/api/unique/contact-persons").then(r => r.json()),
//           fetch("/api/unique/categories").then(r => r.json()),
//           fetch("/api/unique/customers").then(r => r.json()),
//         ]);
//         setOpts({
//           salesPersons:   sp.data?.map(s => ({ value: s.SlpCode,   label: s.SlpName }))       || [],
//           contactPersons: cp.data?.map(c => ({ value: c.CntctCode, label: c.ContactPerson })) || [],
//           categories:     cat.data?.map(c => ({ value: c.ItmsGrpNam, label: c.ItmsGrpNam })) || [],
//           customers:      cust.data?.map(c => ({ value: c.CardCode,  label: c.CardName }))    || [],
//         });
//       } catch (e) { console.error("Filter options error:", e); }
//     })();
//   }, []);

//   /* async product search */
//   const loadProducts = useCallback(async (input) => {
//     if (!input || input.trim().length < 2) return [];
//     try {
//       const res  = await fetch(`/api/unique/products?search=${encodeURIComponent(input.trim())}`);
//       const data = await res.json();
//       return data.data?.map(p => ({
//         value: p.ItemCode,
//         label: `${p.ItemCode}: ${p.ItemName}${p.CasNo ? " · " + p.CasNo : ""}`,
//       })) || [];
//     } catch { return []; }
//   }, []);

//   /* ── build query params ── */
//   const buildParams = useCallback((extraFY) => {
//     const p = new URLSearchParams();
//     const fy = extraFY || selectedFY;
//     if (fy) p.set("fy", fy);
//     if (isAdmin && filters.salesPersons.length)
//       vals(filters.salesPersons).forEach(v => p.append("slpCode", v));
//     if (filters.contactPersons.length)
//       vals(filters.contactPersons).forEach(v => p.append("cntctCode", v));
//     if (filters.categories.length)
//       vals(filters.categories).forEach(v => p.append("itmsGrpNam", v));
//     if (filters.products.length)
//       vals(filters.products).forEach(v => p.append("itemCode", v));
//     if (filters.customers.length)
//       vals(filters.customers).forEach(v => p.append("cardCode", v));
//     return p;
//   }, [selectedFY, filters, isAdmin]);

//   /* ── fetch available FYs on mount (once) ── */
//   useEffect(() => {
//     if (!user) return;
//     (async () => {
//       try {
//         const res = await fetch("/api/open-partial/chart?fyOnly=true");
//         if (!res.ok) return;
//         const { availableFYs: fys } = await res.json();
//         if (fys && fys.length > 0) {
//           setAvailableFYs(fys);
//           setSelectedFY(fys[0]); // default to most recent FY with data
//         }
//       } catch (e) { console.error("FY load error:", e); }
//     })();
//   }, [user]);

//   /* ── fetch chart data ── */
//   const fetchChart = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       // If no FY selected yet, fetch without FY to get available FYs first
//       const res = await fetch(`/api/open-partial/chart?${buildParams()}`);
//       if (!res.ok) throw new Error("Failed to fetch chart data");
//       const { data, availableFYs: fys } = await res.json();
//       setChartRows(data || []);
//       setAvailableFYs(fys || []);
//       // Auto-select first FY from API (most recent with data) if none selected yet
//       setSelectedFY(prev => {
//         if (prev) return prev; // keep user selection
//         return fys && fys.length > 0 ? fys[0] : getCurrentFY();
//       });
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setLoading(false);
//     }
//   }, [buildParams]);

//   useEffect(() => { if (user && selectedFY) fetchChart(); }, [user, filters, selectedFY]);

//   /* ── bar click → fetch modal ── */
//   const handleBarClick = async (year, monthNumber, monthName, status) => {
//     try {
//       setLoadingModal(true);
//       const p = buildParams();
//       p.set("year",   year);
//       p.set("month",  monthNumber);
//       p.set("status", status);
//       const res = await fetch(`/api/open-partial/modal?${p}`);
//       if (!res.ok) throw new Error("Failed to fetch modal data");
//       const records = await res.json();

//       const totalValue = records.reduce((s, r) => s + (parseFloat(r.Total_Price) || 0), 0);
//       const soSet      = new Set(records.map(r => r.SO_No));
//       setBarSummary({ orderCount: soSet.size, totalValue });
//       setModalData(records);
//       setModalTitle(`${status} Orders — ${monthName} ${year}`);
//     } catch (e) {
//       console.error("Modal fetch error:", e);
//       alert("Failed to load order details. Please try again.");
//     } finally {
//       setLoadingModal(false);
//     }
//   };

//   /* ── export ── */
//   const handleExport = async () => {
//     try {
//       setExporting(true);
//       // Export always downloads all data regardless of selected FY
//       // Build params without FY — only keep role-scoped filters
//       const exportParams = new URLSearchParams();
//       if (isAdmin && filters.salesPersons.length)
//         vals(filters.salesPersons).forEach(v => exportParams.append("slpCode", v));
//       if (filters.contactPersons.length)
//         vals(filters.contactPersons).forEach(v => exportParams.append("cntctCode", v));
//       if (filters.categories.length)
//         vals(filters.categories).forEach(v => exportParams.append("itmsGrpNam", v));
//       if (filters.products.length)
//         vals(filters.products).forEach(v => exportParams.append("itemCode", v));
//       if (filters.customers.length)
//         vals(filters.customers).forEach(v => exportParams.append("cardCode", v));
//       const res = await fetch(`/api/open-partial/export?${exportParams}`);
//       if (!res.ok) throw new Error("Export failed");
//       const data = await res.json();
//       downloadExcel(data, "Open_Partial_Orders");
//     } catch (e) {
//       console.error("Export error:", e);
//       alert("Export failed. Please try again.");
//     } finally {
//       setExporting(false);
//     }
//   };

//   /* ── derived chart data ── */
//   const monthMap = useMemo(() => {
//     const m = {};
//     chartRows.forEach(r => {
//       const key = `${r.Year}-${r.MonthNumber}`;
//       if (!m[key]) m[key] = { year: r.Year, monthNumber: r.MonthNumber, monthName: r.MonthName, open: { orders: 0, lines: 0, value: 0 }, partial: { orders: 0, lines: 0, value: 0 } };
//       if (r.HeaderStatus === "Open") {
//         m[key].open.orders += r.OrderCount || 0;
//         m[key].open.lines  += r.LineCount  || 0;
//         m[key].open.value  += parseFloat(r.OpenValue) || 0;
//       } else {
//         m[key].partial.orders += r.OrderCount || 0;
//         m[key].partial.lines  += r.LineCount  || 0;
//         m[key].partial.value  += parseFloat(r.OpenValue) || 0;
//       }
//     });
//     return Object.values(m).sort((a, b) =>
//       a.year !== b.year ? a.year - b.year : a.monthNumber - b.monthNumber
//     );
//   }, [chartRows]);

//   const labels = monthMap.map(d => `${d.monthName.slice(0,3)} ${String(d.year).slice(-2)}`);

//   const chartData = {
//     labels,
//     datasets: [
//       { label: "Open Orders",    data: monthMap.map(d => d.open.orders),    backgroundColor: "#0d6efd", borderWidth: 1 },
//       { label: "Partial Orders", data: monthMap.map(d => d.partial.orders), backgroundColor: "#ffc107", borderWidth: 1 },
//     ],
//   };

//   const chartOptions = {
//     responsive: true, maintainAspectRatio: false,
//     plugins: {
//       datalabels: { display: false },
//       legend: { position: "top", labels: { font: { size: 12 }, padding: 14, boxWidth: 12 } },
//       tooltip: {
//         callbacks: {
//           label: (ctx) => {
//             const d = monthMap[ctx.dataIndex];
//             const isOpen = ctx.datasetIndex === 0;
//             const src = isOpen ? d.open : d.partial;
//             return [
//               `${isOpen ? "Open" : "Partial"} Orders: ${src.orders}`,
//               `Line Items: ${src.lines}`,
//               `Value: ${formatCurrency(src.value)}`,
//             ];
//           },
//         },
//       },
//     },
//     scales: {
//       x: { grid: { display: false }, ticks: { font: { size: 11 } } },
//       y: { beginAtZero: true, ticks: { font: { size: 11 } }, grid: { color: "rgba(0,0,0,0.04)" } },
//     },
//     onClick: (_, elements) => {
//       if (!elements.length) return;
//       const { index, datasetIndex } = elements[0];
//       const d      = monthMap[index];
//       const status = datasetIndex === 0 ? "Open" : "Partial";
//       handleBarClick(d.year, d.monthNumber, d.monthName, status);
//     },
//     onHover: (e, els) => {
//       const t = e.native?.target;
//       if (t) t.style.cursor = els.length ? "pointer" : "default";
//     },
//   };

//   /* ── FY select ── */
//   const fyOpts = availableFYs.map(fy => {
//     const [s, e] = fy.split("-");
//     return { value: fy, label: `FY ${s}-${String(e).slice(-2)}` };
//   });
//   const fyVal  = fyOpts.find(o => o.value === selectedFY) ?? null;
//   const active = Object.values(filters).filter(a => a.length > 0).length;
//   const setF   = (key, val) => setFilters(prev => ({ ...prev, [key]: val || [] }));
//   const reset  = () => setFilters({ salesPersons: [], contactPersons: [], categories: [], products: [], customers: [] });

//   /* ── summary table styles ── */
//   const thS = { fontSize: 11, fontWeight: 600, padding: "6px 10px", background: "#f8f9fa", whiteSpace: "nowrap", color: "#495057" };
//   const tdS = { fontSize: 11, padding: "5px 10px", whiteSpace: "nowrap" };
//   const tdL = { ...tdS, fontWeight: 600, background: "#f8f9fa", color: "#495057", minWidth: 90 };
//   const tdT = { ...tdS, fontWeight: 700, background: "#f0f4ff", color: "#0d47a1" };

//   const totalOpen    = monthMap.reduce((s, d) => s + d.open.orders,    0);
//   const totalPartial = monthMap.reduce((s, d) => s + d.partial.orders, 0);
//   const totalOpenVal = monthMap.reduce((s, d) => s + d.open.value,     0);
//   const totalPartVal = monthMap.reduce((s, d) => s + d.partial.value,  0);

//   return (
//     <div className="card shadow-sm border-0 mb-4">
//       {/* ── Header ── */}
//       <div className="card-header bg-white py-2 px-3">
//         <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
//           <h5 className="mb-0 fw-bold" style={{ color: "#212529", fontSize: "1.05rem" }}>
//             Monthly Orders (Open &amp; Partial)
//           </h5>
//           <div className="d-flex align-items-center gap-2 flex-wrap">
//             {/* FY picker */}
//             <div style={{ minWidth: 130 }}>
//               <Select options={fyOpts} value={fyVal}
//                 onChange={o => o && setSelectedFY(o.value)}
//                 placeholder="FY" isClearable={false} styles={msStyles} />
//             </div>
//             {/* Export */}
//             <button className="btn btn-sm btn-success d-flex align-items-center gap-1"
//               onClick={handleExport} disabled={exporting}
//               style={{ borderRadius: 6, fontSize: 12 }}>
//               {exporting
//                 ? <><span className="spinner-border spinner-border-sm me-1" />Exporting…</>
//                 : <><i className="bi bi-file-excel me-1" />Export All</>}
//             </button>
//             {/* Reset */}
//             <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
//               onClick={reset} disabled={active === 0}
//               style={{ borderRadius: 6, fontSize: 12, opacity: active ? 1 : 0.45 }}>
//               <i className="bi bi-arrow-counterclockwise" />
//               Reset All {active > 0 && <span className="badge bg-danger ms-1" style={{ fontSize: 10 }}>{active}</span>}
//             </button>
//           </div>
//         </div>

//         {/* ── Filter dropdowns ── */}
//         <div className="row g-2">
//           {/* Sales Person — admin only */}
//           {isAdmin && (
//             <div className="col-12 col-sm-6 col-md-4 col-xl-2">
//               <label style={lbl}>Sales Person</label>
//               <Select isMulti options={opts.salesPersons} value={filters.salesPersons}
//                 onChange={v => setF("salesPersons", v)} placeholder="All"
//                 isClearable styles={msStyles} closeMenuOnSelect={false} />
//             </div>
//           )}
//           <div className="col-12 col-sm-6 col-md-4 col-xl-2">
//             <label style={lbl}>Contact Person</label>
//             <Select isMulti options={opts.contactPersons} value={filters.contactPersons}
//               onChange={v => setF("contactPersons", v)} placeholder="All"
//               isClearable styles={msStyles} closeMenuOnSelect={false} />
//           </div>
//           <div className="col-12 col-sm-6 col-md-4 col-xl-2">
//             <label style={lbl}>Category</label>
//             <Select isMulti options={opts.categories} value={filters.categories}
//               onChange={v => setF("categories", v)} placeholder="All"
//               isClearable styles={msStyles} closeMenuOnSelect={false} />
//           </div>
//           <div className="col-12 col-sm-6 col-md-4 col-xl-2">
//             <label style={lbl}>Product <span style={{ color: "#adb5bd", fontSize: 10 }}>(2+ chars)</span></label>
//             <AsyncSelect isMulti cacheOptions loadOptions={loadProducts}
//               value={filters.products} onChange={v => setF("products", v)}
//               placeholder="Search…" isClearable styles={msStyles}
//               closeMenuOnSelect={false}
//               noOptionsMessage={({ inputValue }) =>
//                 !inputValue || inputValue.length < 2 ? "Type at least 2 characters…" : "No products found"
//               } />
//           </div>
//           <div className="col-12 col-sm-6 col-md-4 col-xl-2">
//             <label style={lbl}>Customer</label>
//             <Select isMulti options={opts.customers} value={filters.customers}
//               onChange={v => setF("customers", v)} placeholder="All"
//               isClearable styles={msStyles} closeMenuOnSelect={false} />
//           </div>
//         </div>
//       </div>

//       {/* ── Body ── */}
//       <div className="card-body p-3">
//         {error && <p className="text-danger small mb-2">Error: {error}</p>}

//         {loading ? (
//           <div className="d-flex justify-content-center align-items-center" style={{ height: 280 }}>
//             <span className="spinner-border spinner-border-sm me-2" />
//             <span className="text-muted small">Loading…</span>
//           </div>
//         ) : !monthMap.length ? (
//           <p className="text-center text-muted small mt-4">No data for selected filters / financial year.</p>
//         ) : (
//           <>
//             {/* Chart */}
//             <div style={{ height: 300 }}>
//               <Bar data={chartData} options={chartOptions} />
//             </div>

//             {/* Summary table — months as columns, metrics as rows */}
//             <div className="mt-3" style={{ overflowX: "auto" }}>
//               <table className="table table-bordered mb-0" style={{ minWidth: "100%", borderColor: "#e9ecef" }}>
//                 <thead>
//                   <tr>
//                     <th style={{ ...thS, minWidth: 110 }}>Metric</th>
//                     {monthMap.map((d, i) => (
//                       <th key={i} style={thS}>{d.monthName.slice(0,3)} {String(d.year).slice(-2)}</th>
//                     ))}
//                     <th style={{ ...thS, background: "#e8eeff", color: "#0d47a1" }}>Total</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   <tr>
//                     <td style={{ ...tdL, color: "#0d6efd" }}>Open Orders</td>
//                     {monthMap.map((d, i) => (
//                       <td key={i} style={{ ...tdS, color: "#0d6efd", fontWeight: 600 }}>{d.open.orders}</td>
//                     ))}
//                     <td style={{ ...tdT, color: "#0d6efd" }}>{totalOpen}</td>
//                   </tr>
//                   <tr>
//                     <td style={tdL}>Open Value</td>
//                     {monthMap.map((d, i) => (
//                       <td key={i} style={tdS}>{formatCurrency(d.open.value)}</td>
//                     ))}
//                     <td style={tdT}>{formatCurrency(totalOpenVal)}</td>
//                   </tr>
//                   <tr>
//                     <td style={{ ...tdL, color: "#d97706" }}>Partial Orders</td>
//                     {monthMap.map((d, i) => (
//                       <td key={i} style={{ ...tdS, color: "#d97706", fontWeight: 600 }}>{d.partial.orders}</td>
//                     ))}
//                     <td style={{ ...tdT, color: "#d97706" }}>{totalPartial}</td>
//                   </tr>
//                   <tr>
//                     <td style={tdL}>Partial Value</td>
//                     {monthMap.map((d, i) => (
//                       <td key={i} style={tdS}>{formatCurrency(d.partial.value)}</td>
//                     ))}
//                     <td style={tdT}>{formatCurrency(totalPartVal)}</td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           </>
//         )}
//       </div>

//       {/* Modal */}
//       {modalData && (
//         <OrderDetailsModalSlim
//           orderData={modalData}
//           onClose={() => { setModalData(null); setBarSummary(null); }}
//           title={modalTitle}
//           barSummary={barSummary}
//         />
//       )}

//       {/* Loading overlay for modal */}
//       {loadingModal && (
//         <div style={{
//           position: "fixed", inset: 0,
//           background: "rgba(0,0,0,0.45)",
//           display: "flex", alignItems: "center", justifyContent: "center",
//           zIndex: 9999,
//         }}>
//           <div className="spinner-border text-light" role="status">
//             <span className="visually-hidden">Loading…</span>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default OpenPartialOrdersChart;

// components/open-partial-chart/OpenClosedOrdersChartArray.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Bar } from "react-chartjs-2";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { formatCurrency } from "utils/formatCurrency";
import downloadExcel from "utils/exporttoexcel";
import OrderDetailsModalSlim from "../modal/OrderDetailsModalSlim";
import { useAuth } from "contexts/AuthContext";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/* ── FY helpers ── */
const getCurrentFY = () => {
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  const s = m >= 4 ? y : y - 1;
  return `${s}-${s + 1}`;
};

/* ── Select styles ── */
const msStyles = {
  control: (b, s) => ({
    ...b, minHeight: 34, fontSize: 12, borderRadius: 6,
    borderColor: s.isFocused ? "#86b7fe" : "#dee2e6",
    boxShadow: s.isFocused ? "0 0 0 3px rgba(13,110,253,.15)" : "none",
    "&:hover": { borderColor: "#adb5bd" },
  }),
  menu:        (b) => ({ ...b, fontSize: 12, zIndex: 9999 }),
  placeholder: (b) => ({ ...b, color: "#adb5bd", fontSize: 12 }),
  option: (b, s) => ({
    ...b,
    backgroundColor: s.isSelected ? "#0d6efd" : s.isFocused ? "#f0f4ff" : "white",
    color: s.isSelected ? "white" : "#212529", fontSize: 12,
  }),
};

const lbl = {
  display: "block", fontSize: 11, fontWeight: 500,
  color: "#6c757d", marginBottom: 3, letterSpacing: "0.02em",
};

const vals = (arr) => (arr || []).map(o => o.value);

/* ════════════════════════════════════════════════════════ */
const OpenPartialOrdersChart = () => {
  const { user } = useAuth();
  const isAdmin  = user?.role === "admin";
  const isSales  = user?.role === "sales_person";

  /* ── view toggle ── */
  const [view, setView] = useState("chart"); // "chart" | "customer"
  const [custPage, setCustPage] = useState(0);
  const CUST_PAGE_SIZE = 10;

  /* ── state ── */
  const [chartRows,    setChartRows]    = useState([]);
  const [availableFYs, setAvailableFYs] = useState([]);
  const [selectedFY,   setSelectedFY]   = useState(""); // set from API response
  const [loading,      setLoading]      = useState(false);
  const [exporting,    setExporting]    = useState(false);
  const [error,        setError]        = useState(null);

  const [modalData,    setModalData]    = useState(null);
  const [modalTitle,   setModalTitle]   = useState("");
  const [barSummary,   setBarSummary]   = useState(null);
  const [loadingModal,  setLoadingModal]  = useState(false);
  const [customerData,  setCustomerData]  = useState([]);
  const [loadingCust,   setLoadingCust]   = useState(false);

  /* ── filter state ── */
  const [filters, setFilters] = useState({
    salesPersons:   [],
    contactPersons: [],
    categories:     [],
    products:       [],
    customers:      [],
  });

  /* ── dropdown options ── */
  const [opts, setOpts] = useState({
    salesPersons: [], contactPersons: [], categories: [], customers: [],
  });

  /* load static options */
  useEffect(() => {
    (async () => {
      try {
        const [sp, cp, cat, cust] = await Promise.all([
          fetch("/api/unique/salespersons").then(r => r.json()),
          fetch("/api/unique/contact-persons").then(r => r.json()),
          fetch("/api/unique/categories").then(r => r.json()),
          fetch("/api/unique/customers").then(r => r.json()),
        ]);
        setOpts({
          salesPersons:   sp.data?.map(s => ({ value: s.SlpCode,   label: s.SlpName }))       || [],
          contactPersons: cp.data?.map(c => ({ value: c.CntctCode, label: c.ContactPerson })) || [],
          categories:     cat.data?.map(c => ({ value: c.ItmsGrpNam, label: c.ItmsGrpNam })) || [],
          customers:      cust.data?.map(c => ({ value: c.CardCode,  label: c.CardName }))    || [],
        });
      } catch (e) { console.error("Filter options error:", e); }
    })();
  }, []);

  /* async product search */
  const loadProducts = useCallback(async (input) => {
    if (!input || input.trim().length < 2) return [];
    try {
      const res  = await fetch(`/api/unique/products?search=${encodeURIComponent(input.trim())}`);
      const data = await res.json();
      return data.data?.map(p => ({
        value: p.ItemCode,
        label: `${p.ItemCode}: ${p.ItemName}${p.CasNo ? " · " + p.CasNo : ""}`,
      })) || [];
    } catch { return []; }
  }, []);

  /* ── build query params ── */
  const buildParams = useCallback((extraFY) => {
    const p = new URLSearchParams();
    const fy = extraFY || selectedFY;
    if (fy) p.set("fy", fy);
    if (isAdmin && filters.salesPersons.length)
      vals(filters.salesPersons).forEach(v => p.append("slpCode", v));
    if (filters.contactPersons.length)
      vals(filters.contactPersons).forEach(v => p.append("cntctCode", v));
    if (filters.categories.length)
      vals(filters.categories).forEach(v => p.append("itmsGrpNam", v));
    if (filters.products.length)
      vals(filters.products).forEach(v => p.append("itemCode", v));
    if (filters.customers.length)
      vals(filters.customers).forEach(v => p.append("cardCode", v));
    return p;
  }, [selectedFY, filters, isAdmin]);

  /* ── fetch available FYs on mount (once) ── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch("/api/open-partial/chart?fyOnly=true");
        if (!res.ok) return;
        const { availableFYs: fys } = await res.json();
        if (fys && fys.length > 0) {
          setAvailableFYs(fys);
          setSelectedFY(fys[0]); // default to most recent FY with data
        }
      } catch (e) { console.error("FY load error:", e); }
    })();
  }, [user]);

  /* ── fetch chart data ── */
  const fetchChart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // If no FY selected yet, fetch without FY to get available FYs first
      const res = await fetch(`/api/open-partial/chart?${buildParams()}`);
      if (!res.ok) throw new Error("Failed to fetch chart data");
      const { data, availableFYs: fys } = await res.json();
      setChartRows(data || []);
      setAvailableFYs(fys || []);
      // Auto-select first FY from API (most recent with data) if none selected yet
      setSelectedFY(prev => {
        if (prev) return prev; // keep user selection
        return fys && fys.length > 0 ? fys[0] : getCurrentFY();
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { if (user && selectedFY) fetchChart(); }, [user, filters, selectedFY]);

  /* ── bar click → fetch modal ── */
  const handleBarClick = async (year, monthNumber, monthName, status) => {
    try {
      setLoadingModal(true);
      const p = buildParams();
      p.set("year",   year);
      p.set("month",  monthNumber);
      p.set("status", status);
      const res = await fetch(`/api/open-partial/modal?${p}`);
      if (!res.ok) throw new Error("Failed to fetch modal data");
      const records = await res.json();

      const totalValue = records.reduce((s, r) => s + (parseFloat(r.Total_Price) || 0), 0);
      const soSet      = new Set(records.map(r => r.SO_No));
      setBarSummary({ orderCount: soSet.size, totalValue });
      setModalData(records);
      setModalTitle(`${status} Orders — ${monthName} ${year}`);
    } catch (e) {
      console.error("Modal fetch error:", e);
      alert("Failed to load order details. Please try again.");
    } finally {
      setLoadingModal(false);
    }
  };

  /* ── export ── */
  const handleExport = async () => {
    try {
      setExporting(true);
      // Export always downloads all data regardless of selected FY
      // Build params without FY — only keep role-scoped filters
      const exportParams = new URLSearchParams();
      if (isAdmin && filters.salesPersons.length)
        vals(filters.salesPersons).forEach(v => exportParams.append("slpCode", v));
      if (filters.contactPersons.length)
        vals(filters.contactPersons).forEach(v => exportParams.append("cntctCode", v));
      if (filters.categories.length)
        vals(filters.categories).forEach(v => exportParams.append("itmsGrpNam", v));
      if (filters.products.length)
        vals(filters.products).forEach(v => exportParams.append("itemCode", v));
      if (filters.customers.length)
        vals(filters.customers).forEach(v => exportParams.append("cardCode", v));
      const res = await fetch(`/api/open-partial/export?${exportParams}`);
      if (!res.ok) throw new Error("Export failed");
      const data = await res.json();
      downloadExcel(data, "Open_Partial_Orders");
    } catch (e) {
      console.error("Export error:", e);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  /* ── derived chart data ── */
  const monthMap = useMemo(() => {
    const m = {};
    chartRows.forEach(r => {
      const key = `${r.Year}-${r.MonthNumber}`;
      if (!m[key]) m[key] = { year: r.Year, monthNumber: r.MonthNumber, monthName: r.MonthName, open: { orders: 0, lines: 0, value: 0 }, partial: { orders: 0, lines: 0, value: 0 } };
      if (r.HeaderStatus === "Open") {
        m[key].open.orders += r.OrderCount || 0;
        m[key].open.lines  += r.LineCount  || 0;
        m[key].open.value  += parseFloat(r.OpenValue) || 0;
      } else {
        m[key].partial.orders += r.OrderCount || 0;
        m[key].partial.lines  += r.LineCount  || 0;
        m[key].partial.value  += parseFloat(r.OpenValue) || 0;
      }
    });
    return Object.values(m).sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.monthNumber - b.monthNumber
    );
  }, [chartRows]);

  const labels = monthMap.map(d => `${d.monthName.slice(0,3)} ${String(d.year).slice(-2)}`);

  /* ── customer-wise fetch — all time, no FY filter ── */
  const buildCustomerParams = useCallback(() => {
    const p = new URLSearchParams();
    // no FY — all time
    if (isAdmin && filters.salesPersons.length)
      vals(filters.salesPersons).forEach(v => p.append("slpCode", v));
    if (filters.contactPersons.length)
      vals(filters.contactPersons).forEach(v => p.append("cntctCode", v));
    if (filters.categories.length)
      vals(filters.categories).forEach(v => p.append("itmsGrpNam", v));
    if (filters.products.length)
      vals(filters.products).forEach(v => p.append("itemCode", v));
    if (filters.customers.length)
      vals(filters.customers).forEach(v => p.append("cardCode", v));
    return p;
  }, [filters, isAdmin]);

  const fetchCustomerData = useCallback(async () => {
    try {
      setLoadingCust(true);
      const res = await fetch(`/api/open-partial/customers?${buildCustomerParams()}`);
      if (!res.ok) throw new Error("Failed to fetch customer data");
      const data = await res.json();
      setCustomerData(data || []);
      setCustPage(0);
    } catch (e) {
      console.error("Customer fetch error:", e);
    } finally {
      setLoadingCust(false);
    }
  }, [buildCustomerParams]);

  // Fetch customer data when switching to customer view or when filters change
  useEffect(() => {
    if (user && view === "customer") fetchCustomerData();
  }, [user, view, filters]);

  const custTotalPages = Math.ceil(customerData.length / CUST_PAGE_SIZE);
  const custPageData   = customerData.slice(custPage * CUST_PAGE_SIZE, (custPage + 1) * CUST_PAGE_SIZE);

  const handleExportCustomer = () => {
    const data = customerData.map((r, i) => ({
      "Rank":             i + 1,
      "Customer":         r.customer,
      "Card Code":        r.cardCode,
      "Open Order Value": r.openValue,
      "Line Items":       r.lineItems,
    }));
    downloadExcel(data, "Customer_Wise_Open_Orders");
  };

  const chartData = {
    labels,
    datasets: [
      { label: "Open Orders",    data: monthMap.map(d => d.open.orders),    backgroundColor: "#0d6efd", borderWidth: 1 },
      { label: "Partial Orders", data: monthMap.map(d => d.partial.orders), backgroundColor: "#ffc107", borderWidth: 1 },
    ],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      datalabels: { display: false },
      legend: { position: "top", labels: { font: { size: 12 }, padding: 14, boxWidth: 12 } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const d = monthMap[ctx.dataIndex];
            const isOpen = ctx.datasetIndex === 0;
            const src = isOpen ? d.open : d.partial;
            return [
              `${isOpen ? "Open" : "Partial"} Orders: ${src.orders}`,
              `Line Items: ${src.lines}`,
              `Value: ${formatCurrency(src.value)}`,
            ];
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { beginAtZero: true, ticks: { font: { size: 11 } }, grid: { color: "rgba(0,0,0,0.04)" } },
    },
    onClick: (_, elements) => {
      if (!elements.length) return;
      const { index, datasetIndex } = elements[0];
      const d      = monthMap[index];
      const status = datasetIndex === 0 ? "Open" : "Partial";
      handleBarClick(d.year, d.monthNumber, d.monthName, status);
    },
    onHover: (e, els) => {
      const t = e.native?.target;
      if (t) t.style.cursor = els.length ? "pointer" : "default";
    },
  };

  /* ── FY select ── */
  const fyOpts = availableFYs.map(fy => {
    const [s, e] = fy.split("-");
    return { value: fy, label: `FY ${s}-${String(e).slice(-2)}` };
  });
  const fyVal  = fyOpts.find(o => o.value === selectedFY) ?? null;
  const active = Object.values(filters).filter(a => a.length > 0).length;
  const setF   = (key, val) => setFilters(prev => ({ ...prev, [key]: val || [] }));
  const reset  = () => setFilters({ salesPersons: [], contactPersons: [], categories: [], products: [], customers: [] });

  /* ── summary table styles ── */
  const thS = { fontSize: 11, fontWeight: 600, padding: "6px 10px", background: "#f8f9fa", whiteSpace: "nowrap", color: "#495057" };
  const tdS = { fontSize: 11, padding: "5px 10px", whiteSpace: "nowrap" };
  const tdL = { ...tdS, fontWeight: 600, background: "#f8f9fa", color: "#495057", minWidth: 90 };
  const tdT = { ...tdS, fontWeight: 700, background: "#f0f4ff", color: "#0d47a1" };

  const totalOpen    = monthMap.reduce((s, d) => s + d.open.orders,    0);
  const totalPartial = monthMap.reduce((s, d) => s + d.partial.orders, 0);
  const totalOpenVal = monthMap.reduce((s, d) => s + d.open.value,     0);
  const totalPartVal = monthMap.reduce((s, d) => s + d.partial.value,  0);

  return (
    <div className="card shadow-sm border-0 mb-4">
      {/* ── Header ── */}
      <div className="card-header bg-white py-2 px-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
          {/* ── View toggle ── */}
          <div style={toggleWrap}>
            <button
              style={{ ...toggleBtn, ...(view === "chart" ? toggleBtnActive : {}) }}
              onClick={() => { setView("chart"); setCustPage(0); }}
            >
              📊 Monthly Orders (Open &amp; Partial)
            </button>
            <button
              style={{ ...toggleBtn, ...(view === "customer" ? toggleBtnActive : {}) }}
              onClick={() => { setView("customer"); setCustPage(0); }}
            >
              👥 Customer Wise
            </button>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* FY picker — always visible */}
            <div style={{ minWidth: 130 }}>
              <Select options={fyOpts} value={fyVal}
                onChange={o => o && setSelectedFY(o.value)}
                placeholder="FY" isClearable={false} styles={msStyles} />
            </div>
            {/* Export — changes based on view */}
            {view === "chart" ? (
              <button className="btn btn-sm btn-success d-flex align-items-center gap-1"
                onClick={handleExport} disabled={exporting}
                style={{ borderRadius: 6, fontSize: 12 }}>
                {exporting
                  ? <><span className="spinner-border spinner-border-sm me-1" />Exporting…</>
                  : <><i className="bi bi-file-excel me-1" />Export All</>}
              </button>
            ) : (
              <button className="btn btn-sm btn-success d-flex align-items-center gap-1"
                onClick={handleExportCustomer}
                style={{ borderRadius: 6, fontSize: 12 }}>
                <i className="bi bi-file-excel me-1" />Export
              </button>
            )}
            {/* Reset */}
            <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              onClick={reset} disabled={active === 0}
              style={{ borderRadius: 6, fontSize: 12, opacity: active ? 1 : 0.45 }}>
              <i className="bi bi-arrow-counterclockwise" />
              Reset All {active > 0 && <span className="badge bg-danger ms-1" style={{ fontSize: 10 }}>{active}</span>}
            </button>
          </div>
        </div>

        {/* ── Filter dropdowns ── */}
        <div className="row g-2">
          {/* Sales Person — admin only */}
          {isAdmin && (
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">
              <label style={lbl}>Sales Person</label>
              <Select isMulti options={opts.salesPersons} value={filters.salesPersons}
                onChange={v => setF("salesPersons", v)} placeholder="All"
                isClearable styles={msStyles} closeMenuOnSelect={false} />
            </div>
          )}
          <div className="col-12 col-sm-6 col-md-4 col-xl-2">
            <label style={lbl}>Contact Person</label>
            <Select isMulti options={opts.contactPersons} value={filters.contactPersons}
              onChange={v => setF("contactPersons", v)} placeholder="All"
              isClearable styles={msStyles} closeMenuOnSelect={false} />
          </div>
          <div className="col-12 col-sm-6 col-md-4 col-xl-2">
            <label style={lbl}>Category</label>
            <Select isMulti options={opts.categories} value={filters.categories}
              onChange={v => setF("categories", v)} placeholder="All"
              isClearable styles={msStyles} closeMenuOnSelect={false} />
          </div>
          <div className="col-12 col-sm-6 col-md-4 col-xl-2">
            <label style={lbl}>Product <span style={{ color: "#adb5bd", fontSize: 10 }}>(2+ chars)</span></label>
            <AsyncSelect isMulti cacheOptions loadOptions={loadProducts}
              value={filters.products} onChange={v => setF("products", v)}
              placeholder="Search…" isClearable styles={msStyles}
              closeMenuOnSelect={false}
              noOptionsMessage={({ inputValue }) =>
                !inputValue || inputValue.length < 2 ? "Type at least 2 characters…" : "No products found"
              } />
          </div>
          <div className="col-12 col-sm-6 col-md-4 col-xl-2">
            <label style={lbl}>Customer</label>
            <Select isMulti options={opts.customers} value={filters.customers}
              onChange={v => setF("customers", v)} placeholder="All"
              isClearable styles={msStyles} closeMenuOnSelect={false} />
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="card-body p-3" style={{ minHeight: 420 }}>
        {error && <p className="text-danger small mb-2">Error: {error}</p>}

        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: 380 }}>
            <span className="spinner-border spinner-border-sm me-2" />
            <span className="text-muted small">Loading…</span>
          </div>
        ) : (

          /* ── animated view switcher ── */
          <div style={{ position: "relative", overflow: "hidden" }}>

            {/* ── CHART VIEW ── */}
            <div style={{
              ...viewPanel,
              opacity:    view === "chart" ? 1 : 0,
              transform:  view === "chart" ? "translateX(0)" : "translateX(-30px)",
              pointerEvents: view === "chart" ? "auto" : "none",
              position:   view === "chart" ? "relative" : "absolute",
              top: 0, left: 0, width: "100%",
            }}>
              {!monthMap.length ? (
                <p className="text-center text-muted small mt-4">No data for selected filters / financial year.</p>
              ) : (
                <>
                  <div style={{ height: 300 }}>
                    <Bar data={chartData} options={chartOptions} />
                  </div>
                  <div className="mt-3" style={{ overflowX: "auto" }}>
                    <table className="table table-bordered mb-0" style={{ minWidth: "100%", borderColor: "#e9ecef" }}>
                      <thead>
                        <tr>
                          <th style={{ ...thS, minWidth: 110 }}>Metric</th>
                          {monthMap.map((d, i) => (
                            <th key={i} style={thS}>{d.monthName.slice(0,3)} {String(d.year).slice(-2)}</th>
                          ))}
                          <th style={{ ...thS, background: "#e8eeff", color: "#0d47a1" }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ ...tdL, color: "#0d6efd" }}>Open Orders</td>
                          {monthMap.map((d, i) => <td key={i} style={{ ...tdS, color: "#0d6efd", fontWeight: 600 }}>{d.open.orders}</td>)}
                          <td style={{ ...tdT, color: "#0d6efd" }}>{totalOpen}</td>
                        </tr>
                        <tr>
                          <td style={tdL}>Open Value</td>
                          {monthMap.map((d, i) => <td key={i} style={tdS}>{formatCurrency(d.open.value)}</td>)}
                          <td style={tdT}>{formatCurrency(totalOpenVal)}</td>
                        </tr>
                        <tr>
                          <td style={{ ...tdL, color: "#d97706" }}>Partial Orders</td>
                          {monthMap.map((d, i) => <td key={i} style={{ ...tdS, color: "#d97706", fontWeight: 600 }}>{d.partial.orders}</td>)}
                          <td style={{ ...tdT, color: "#d97706" }}>{totalPartial}</td>
                        </tr>
                        <tr>
                          <td style={tdL}>Partial Value</td>
                          {monthMap.map((d, i) => <td key={i} style={tdS}>{formatCurrency(d.partial.value)}</td>)}
                          <td style={tdT}>{formatCurrency(totalPartVal)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* ── CUSTOMER VIEW ── */}
            <div style={{
              ...viewPanel,
              opacity:    view === "customer" ? 1 : 0,
              transform:  view === "customer" ? "translateX(0)" : "translateX(30px)",
              pointerEvents: view === "customer" ? "auto" : "none",
              position:   view === "customer" ? "relative" : "absolute",
              top: 0, left: 0, width: "100%",
            }}>
              {loadingCust ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
                  <span className="spinner-border spinner-border-sm me-2" />
                  <span className="text-muted small">Loading customers…</span>
                </div>
              ) : !customerData.length ? (
                <p className="text-center text-muted small mt-4">No customer data available.</p>
              ) : (
                <>
                  <div style={{ overflowX: "auto" }}>
                    <table className="table table-bordered mb-0" style={{ borderColor: "#e9ecef" }}>
                      <thead>
                        <tr>
                          <th style={{ ...thS, width: 40 }}>#</th>
                          <th style={{ ...thS, minWidth: 200 }}>Customer</th>
                          <th style={thS}>Open Order Value</th>
                          <th style={thS}>Line Items</th>
                        </tr>
                      </thead>
                      <tbody>
                        {custPageData.map((r, i) => (
                          <tr key={r.cardCode || i}>
                            <td style={{ ...tdS, color: "#adb5bd", fontWeight: 600 }}>
                              {custPage * CUST_PAGE_SIZE + i + 1}
                            </td>
                            <td style={{ ...tdL, minWidth: 200 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#212529" }}>{r.customer}</div>
                              {r.cardCode && <div style={{ fontSize: 10, color: "#adb5bd" }}>{r.cardCode}</div>}
                            </td>
                            <td style={{ ...tdS, color: "#0d6efd", fontWeight: 700 }}>
                              {formatCurrency(r.openValue)}
                            </td>
                            <td style={{ ...tdS, fontWeight: 600 }}>{r.lineItems}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={2} style={tdT}>Total ({customerData.length} customers)</td>
                          <td style={{ ...tdT, color: "#0d6efd" }}>
                            {formatCurrency(customerData.reduce((s, r) => s + r.openValue, 0))}
                          </td>
                          <td style={tdT}>
                            {customerData.reduce((s, r) => s + r.lineItems, 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Pagination */}
                  {custTotalPages > 1 && (
                    <div className="d-flex align-items-center justify-content-between mt-2 px-1">
                      <span style={{ fontSize: 11, color: "#6c757d" }}>
                        {custPage * CUST_PAGE_SIZE + 1}–{Math.min((custPage + 1) * CUST_PAGE_SIZE, customerData.length)} of {customerData.length}
                      </span>
                      <div className="d-flex gap-1">
                        <button style={pgBtn} onClick={() => setCustPage(0)} disabled={custPage === 0}>«</button>
                        <button style={pgBtn} onClick={() => setCustPage(p => p - 1)} disabled={custPage === 0}>‹</button>
                        <span style={{ fontSize: 11, padding: "4px 8px", color: "#495057" }}>
                          <strong>{custPage + 1}</strong> / {custTotalPages}
                        </span>
                        <button style={pgBtn} onClick={() => setCustPage(p => p + 1)} disabled={custPage >= custTotalPages - 1}>›</button>
                        <button style={pgBtn} onClick={() => setCustPage(custTotalPages - 1)} disabled={custPage >= custTotalPages - 1}>»</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Modal */}
      {modalData && (
        <OrderDetailsModalSlim
          orderData={modalData}
          onClose={() => { setModalData(null); setBarSummary(null); }}
          title={modalTitle}
          barSummary={barSummary}
        />
      )}

      {/* Loading overlay for modal */}
      {loadingModal && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999,
        }}>
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Toggle styles ── */
const toggleWrap = {
  display: "flex",
  background: "#f1f3f5",
  borderRadius: 8,
  padding: 3,
  gap: 2,
};
const toggleBtn = {
  padding: "5px 12px",
  borderRadius: 6,
  border: "none",
  background: "transparent",
  fontSize: 12,
  fontWeight: 500,
  color: "#6c757d",
  cursor: "pointer",
  transition: "all 0.2s ease",
  whiteSpace: "nowrap",
};
const toggleBtnActive = {
  background: "#fff",
  color: "#212529",
  fontWeight: 600,
  boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
};
const viewPanel = {
  transition: "opacity 0.25s ease, transform 0.25s ease",
};
const pgBtn = {
  padding: "3px 8px",
  fontSize: 11,
  borderRadius: 5,
  border: "1px solid #dee2e6",
  background: "#fff",
  cursor: "pointer",
  color: "#495057",
  transition: "all 0.12s",
};

export default OpenPartialOrdersChart;