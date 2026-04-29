"use client";
// pages/NewVsOldTrend.js  (or wherever your page lives)
import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import Select from "react-select";
import Modal from "react-bootstrap/Modal";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from "chart.js";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTHS_LIST = [
  { value:1,label:"January"},{value:2,label:"February"},{value:3,label:"March"},
  {value:4,label:"April"},{value:5,label:"May"},{value:6,label:"June"},
  {value:7,label:"July"},{value:8,label:"August"},{value:9,label:"September"},
  {value:10,label:"October"},{value:11,label:"November"},{value:12,label:"December"},
];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const REGIONS = ["Central","South","West 1","West 2","North","East","Overseas"].map(r=>({value:r,label:r}));
const STATES  = [
  "Andhra Pradesh","Assam","Chandigarh","Delhi","Dadra & NH","Gujarat","Goa",
  "Himachal Pradesh","Haryana","Jharkhand","Kerala","Karnataka","Meghalaya",
  "Maharashtra","Madhya Pradesh","Puducherry","Punjab","Rajasthan","Telangana",
  "Tamil Nadu","Uttar Pradesh","Uttarakhand","West Bengal","Overseas",
].map(s=>({value:s,label:s}));

const buildFYOptions = () => {
  const opts = [];
  for (let y=2024; y<=new Date().getFullYear()+1; y++) {
    const s = String(y+1).slice(-2);
    opts.push({ value:`${y}-${s}`, label:`FY ${y}-${s}` });
  }
  return opts;
};
const getCurrentFY = () => {
  const t = new Date();
  const y = t.getMonth()>=3 ? t.getFullYear() : t.getFullYear()-1;
  return `${y}-${String(y+1).slice(-2)}`;
};
const buildYearOptions = () => {
  const opts = [];
  for (let y=2024; y<=new Date().getFullYear(); y++) opts.push({value:y,label:String(y)});
  return opts;
};

const selectStyles = {
  control: b => ({ ...b, minHeight:"36px", fontSize:"0.82rem", borderRadius:"8px", borderColor:"#dee2e6" }),
  menu:    b => ({ ...b, fontSize:"0.82rem", zIndex:9999 }),
  option:  (b,s) => ({ ...b, fontSize:"0.82rem", backgroundColor: s.isSelected?"#1a1a2e": s.isFocused?"#f0f3f8":"#fff", color: s.isSelected?"#F39C12":"#333" }),
};

const MOBILE_BP = 768;
const useIsMobile = () => {
  const [v,setV] = React.useState(typeof window!=="undefined"?window.innerWidth<MOBILE_BP:false);
  React.useEffect(()=>{
    const h=()=>setV(window.innerWidth<MOBILE_BP);
    window.addEventListener("resize",h); return ()=>window.removeEventListener("resize",h);
  },[]);
  return v;
};

// ── Global styles ─────────────────────────────────────────────────────────────
const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');

  .novo-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

  /* KPI Cards */
  .novo-kpi-card {
    border-radius: 14px; overflow: hidden; border: none;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    transition: transform 0.18s, box-shadow 0.18s;
    cursor: default;
  }
  .novo-kpi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.13); }
  .novo-kpi-inner { padding: 18px 20px; }
  .novo-kpi-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #888; margin-bottom: 8px; }
  .novo-kpi-value { font-family: 'Playfair Display', Georgia, serif; font-size: 2rem; font-weight: 700; line-height: 1; margin-bottom: 6px; }
  .novo-kpi-sub   { font-size: 0.75rem; color: #aaa; margin-bottom: 12px; }
  .novo-kpi-metrics { display: flex; gap: 16px; margin-bottom: 12px; flex-wrap: wrap; }
  .novo-kpi-metric label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.06em; color: #bbb; display: block; margin-bottom: 1px; }
  .novo-kpi-metric span  { font-size: 0.82rem; font-weight: 600; color: #333; }
  .novo-kpi-btn {
    font-size: 0.72rem; padding: 4px 12px; border-radius: 20px;
    background: transparent; cursor: pointer; font-weight: 600;
    transition: all 0.15s;
  }
  .novo-kpi-btn:hover { opacity: 0.85; }
  .novo-retention { background: linear-gradient(135deg, #fd7e14, #e55d00); }
  .novo-retention .novo-kpi-value { color: #fff; }
  .novo-retention .novo-kpi-label, .novo-retention .novo-kpi-sub { color: rgba(255,255,255,0.7); }

  /* Filters */
  .novo-filter-card {
    background: #fff; border-radius: 14px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.07); border: none;
    padding: 18px 20px; margin-bottom: 20px;
  }
  .novo-date-box {
    background: #f8f9fb; border-radius: 10px;
    padding: 14px 16px; border: 1px solid #eaedf2;
  }
  .novo-toggle-btn {
    flex: 1; font-size: 0.78rem; padding: 6px 10px;
    border: 1px solid #1a1a2e; cursor: pointer; font-weight: 500;
    transition: all 0.15s;
  }
  .novo-toggle-btn.active { background: #1a1a2e; color: #F39C12; font-weight: 700; }
  .novo-toggle-btn:not(.active) { background: transparent; color: #1a1a2e; }

  /* Chart card */
  .novo-chart-card {
    background: #fff; border-radius: 14px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.07); border: none;
    overflow: hidden;
  }
  .novo-chart-header {
    padding: 16px 20px 0;
    border-bottom: 1px solid #f0f2f5;
    padding-bottom: 14px;
  }
  .novo-chart-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.1rem; font-weight: 700; color: #1a1a2e; margin: 0;
  }

  /* ── Slim modal (matching order/invoice modals) ── */
  .novo-modal .modal-dialog { max-width: 95vw !important; margin: 0.5rem auto; }
  .novo-modal .modal-content {
    border-radius: 16px; overflow: hidden; border: none;
    box-shadow: 0 25px 60px rgba(0,0,0,0.35);
    display: flex; flex-direction: column;
  }

  /* Customer modal header — color injected inline per type */
  .novo-modal-header { padding: 14px 18px; flex-shrink: 0; }
  .novo-modal-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.05rem; font-weight: 700; margin: 0 0 10px 0;
    letter-spacing: 0.01em;
  }
  .novo-modal-header-row { display: flex; gap: 8px; align-items: center; }
  .novo-modal-search {
    flex: 1; min-width: 0;
    background: rgba(255,255,255,0.09) !important;
    border: 1px solid rgba(255,255,255,0.35) !important;
    border-radius: 8px !important; color: #fff !important;
    font-size: 0.83rem !important; padding: 7px 12px !important; outline: none;
  }
  .novo-modal-search::placeholder { color: rgba(255,255,255,0.4) !important; }
  .novo-modal-search:focus { box-shadow: 0 0 0 2px rgba(255,255,255,0.2) !important; }
  .novo-modal-export-btn {
    background: linear-gradient(135deg,#1a7a4a,#27ae60); color:#fff;
    border:none; padding:7px 14px; border-radius:8px;
    font-size:0.78rem; font-weight:600; cursor:pointer;
    white-space:nowrap; transition:opacity 0.15s;
  }
  .novo-modal-export-btn:hover { opacity:0.85; }
  .novo-modal-close-btn {
    background:rgba(255,255,255,0.1); color:#fff;
    border:1px solid rgba(255,255,255,0.2);
    width:34px; height:34px; border-radius:8px; font-size:1rem;
    cursor:pointer; flex-shrink:0; display:flex;
    align-items:center; justify-content:center; transition:background 0.15s;
  }
  .novo-modal-close-btn:hover { background:rgba(255,255,255,0.22); }

  /* Sort bar */
  .novo-sort-bar {
    display:flex; align-items:center; padding:8px 12px 6px;
    border-bottom:1px solid #e2e4ea; overflow-x:auto; flex-shrink:0;
    -webkit-overflow-scrolling:touch; scrollbar-width:none;
  }
  .novo-sort-bar::-webkit-scrollbar { display:none; }
  .novo-sort-bar-label { font-size:0.65rem; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; color:#aaa; white-space:nowrap; margin-right:8px; flex-shrink:0; }
  .novo-sort-chip {
    flex-shrink:0; padding:5px 11px; border-radius:20px; font-size:0.74rem; font-weight:600;
    cursor:pointer; border:1.5px solid #dde0e8; background:#fff; color:#555;
    margin-right:6px; white-space:nowrap; transition:all 0.15s;
  }
  .novo-sort-chip.active { background:#1a1a2e; color:#F39C12; border-color:#1a1a2e; box-shadow:0 2px 6px rgba(26,26,46,0.25); }

  /* Table */
  .novo-body { flex:1; overflow:hidden; display:flex; flex-direction:column; }
  .novo-table-wrap { flex:1; overflow:auto; }
  .novo-tbl { width:100%; border-collapse:collapse; }
  .novo-tbl thead th {
    background:#1a1a2e; font-family:'Playfair Display',Georgia,serif;
    font-size:0.74rem; font-weight:700; letter-spacing:0.06em; text-transform:uppercase;
    padding:10px 14px; border-bottom:2px solid rgba(243,156,18,0.4);
    white-space:nowrap; cursor:pointer; user-select:none;
    transition:background 0.15s; position:sticky; top:0; z-index:1;
  }
  .novo-tbl thead th:hover { background:#0f1a2e; }
  .novo-sort-icon { display:inline-block; margin-left:5px; font-size:0.65rem; opacity:0.4; }
  .novo-sort-icon.on { opacity:1; color:#F39C12; }
  .novo-tbl tbody tr { border-bottom:1px solid rgba(0,0,0,0.05); transition:background 0.1s; }
  .novo-tbl tbody tr:nth-child(even) { background:rgba(26,26,46,0.025); }
  .novo-tbl tbody tr:hover { background:rgba(243,156,18,0.05) !important; }
  .novo-tbl tbody td { padding:9px 14px; font-size:0.82rem; color:#2d2d2d; white-space:nowrap; border:none; vertical-align:middle; }
  .novo-tbl td.c-val { font-family:'Courier New',monospace; font-weight:700; color:#0f3460; }
  .novo-tbl td.c-link { font-family:'Courier New',monospace; font-weight:700; cursor:pointer; text-decoration:underline dotted; }
  .novo-empty { text-align:center; padding:48px 20px; color:#bbb; font-size:0.88rem; }

  /* Pagination */
  .novo-pager {
    flex-shrink:0; display:flex; align-items:center; justify-content:space-between;
    padding:9px 16px; background:#f8f9fa; border-top:1px solid #e9ecef;
    flex-wrap:wrap; gap:6px;
  }
  .novo-pager-info { font-size:0.76rem; color:#777; }
  .novo-pbtn {
    padding:4px 9px; font-size:0.76rem; border-radius:6px;
    border:1px solid #dee2e6; background:white; cursor:pointer;
    color:#495057; transition:all 0.12s;
  }
  .novo-pbtn:disabled { opacity:0.38; cursor:not-allowed; }
  .novo-pbtn:not(:disabled):hover { background:#1a1a2e; color:#F39C12; border-color:#1a1a2e; }

  /* Mobile cards */
  .novo-cards { flex:1; overflow-y:auto; padding:12px; background:#f4f5f7; }
  .novo-card {
    background:#fff; border-radius:12px; padding:14px 16px;
    margin-bottom:10px; border-left:4px solid #1a1a2e;
    box-shadow:0 2px 8px rgba(0,0,0,0.07);
    animation:novoIn 0.18s ease forwards;
  }
  @keyframes novoIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
  .novo-card-name { font-family:'Playfair Display',Georgia,serif; font-size:0.95rem; font-weight:700; color:#1a1a2e; margin-bottom:2px; }
  .novo-card-sub  { font-size:0.73rem; color:#999; margin-bottom:8px; }
  .novo-card-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px 14px; }
  .novo-card-hr   { height:1px; background:rgba(26,26,46,0.12); margin:8px 0; }
  .novo-card-f label { font-size:0.63rem; text-transform:uppercase; letter-spacing:0.07em; color:#bbb; display:block; margin-bottom:1px; font-weight:700; }
  .novo-card-f span  { font-size:0.81rem; color:#333; font-weight:500; word-break:break-word; }
  .novo-card-f span.val { color:#0f3460; font-family:'Courier New',monospace; font-weight:700; font-size:0.85rem; }
  .novo-card-total-row { display:flex; justify-content:space-between; align-items:center; }
  .novo-card-total-row .lbl { font-size:0.63rem; text-transform:uppercase; letter-spacing:0.07em; color:#bbb; font-weight:700; }

  /* Order lines modal */
  .novo-lines-modal .modal-dialog { max-width: 92vw !important; }
  .novo-lines-modal .modal-content { border-radius:14px; overflow:hidden; border:none; box-shadow:0 20px 50px rgba(0,0,0,0.3); }

  @media (max-width: 767px) {
    .novo-modal .modal-dialog { margin:0 !important; max-width:100vw !important; }
    .novo-modal .modal-content { border-radius:0; min-height:100dvh; }
    .novo-modal-header { padding:12px 14px; }
    .novo-modal-title { font-size:0.9rem; margin-bottom:8px; }
    .novo-lines-modal .modal-dialog { margin:0 !important; max-width:100vw !important; }
    .novo-lines-modal .modal-content { border-radius:0; }
    .novo-kpi-value { font-size:1.6rem; }
  }
`;

// ── Simple client-side sort/filter/paginate hook ──────────────────────────────
const PAGE_SIZE_DEFAULT = 12;

function useTableState(data) {
  const [search, setSearch]   = useState("");
  const [sorting, setSorting] = useState({ field: null, desc: false });
  const [page, setPage]       = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  const filtered = React.useMemo(() => {
    if (!data) return [];
    let rows = data;
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(r => Object.values(r).some(v => String(v??"").toLowerCase().includes(s)));
    }
    if (sorting.field) {
      rows = [...rows].sort((a,b) => {
        const av = a[sorting.field], bv = b[sorting.field];
        const an = parseFloat(av), bn = parseFloat(bv);
        const cmp = !isNaN(an)&&!isNaN(bn) ? an-bn : String(av??"").localeCompare(String(bv??""));
        return sorting.desc ? -cmp : cmp;
      });
    }
    return rows;
  }, [data, search, sorting]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows   = filtered.slice(page * pageSize, (page+1) * pageSize);

  const handleSort = (field) => {
    setSorting(s => s.field===field ? { field, desc:!s.desc } : { field, desc:false });
    setPage(0);
  };

  return {
    search, setSearch: v => { setSearch(v); setPage(0); },
    sorting, handleSort,
    page, setPage, totalPages, pageSize, setPageSize,
    filtered, pageRows,
  };
}

// ── Sort icon ─────────────────────────────────────────────────────────────────
const SI = ({ field, sorting }) => {
  const s = sorting.field===field ? (sorting.desc?"↓":"↑") : "⇅";
  return <span className={`novo-sort-icon${sorting.field===field?" on":""}`}>{s}</span>;
};

// ── Pagination bar ────────────────────────────────────────────────────────────
const Pager = ({ page, totalPages, setPage, filtered, pageRows, pageSize, setPageSize }) => (
  <div className="novo-pager">
    <span className="novo-pager-info">{pageRows.length} of {filtered.length} rows</span>
    <div style={{display:"flex",gap:4,alignItems:"center"}}>
      <button className="novo-pbtn" onClick={()=>setPage(0)} disabled={page===0}>«</button>
      <button className="novo-pbtn" onClick={()=>setPage(p=>p-1)} disabled={page===0}>‹</button>
      <span className="novo-pager-info" style={{padding:"0 6px"}}><strong>{page+1}</strong> / {totalPages}</span>
      <button className="novo-pbtn" onClick={()=>setPage(p=>p+1)} disabled={page>=totalPages-1}>›</button>
      <button className="novo-pbtn" onClick={()=>setPage(totalPages-1)} disabled={page>=totalPages-1}>»</button>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <span className="novo-pager-info">Per page:</span>
      <select value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(0);}}
        style={{fontSize:"0.76rem",padding:"3px 6px",borderRadius:"6px",border:"1px solid #dee2e6"}}>
        {[12,25,50,100].map(s=><option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  </div>
);

// ── Order Lines Modal ─────────────────────────────────────────────────────────
const OrderLinesModal = ({ cardCode, customerName, startDate, endDate, onClose, accentColor }) => {
  const isMobile = useIsMobile();
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const tbl = useTableState(data);

  const SORT_OPTIONS = [
    {label:"Value ↑", field:"LineValue",  desc:false},
    {label:"Value ↓", field:"LineValue",  desc:true },
    {label:"Price ↑", field:"UnitPrice",  desc:false},
    {label:"Price ↓", field:"UnitPrice",  desc:true },
    {label:"Qty ↑",   field:"Quantity",   desc:false},
    {label:"Qty ↓",   field:"Quantity",   desc:true },
  ];
  const [activeSortIdx, setActiveSortIdx] = useState(null);

  const handleMobileSort = (idx) => {
    if (activeSortIdx===idx) { setActiveSortIdx(null); tbl.handleSort(null); }
    else { setActiveSortIdx(idx); const o=SORT_OPTIONS[idx]; tbl.handleSort(o.field); if(o.desc!==tbl.sorting.desc) tbl.handleSort(o.field); }
  };

  useEffect(()=>{
    (async()=>{
      try {
        const p = new URLSearchParams({cardCode,startDate,endDate});
        const r = await fetch(`/api/customers/new-vs-old-order-lines?${p}`);
        const j = await r.json();
        setData(j.data||[]);
      } catch(e){ console.error(e); } finally{ setLoading(false); }
    })();
  },[cardCode,startDate,endDate]);

  const handleExport = () => {
    downloadExcel((data||[]).map(r=>({
      "SO No": r.SONo, "SO Date": formatDate(r.SODate),
      "Item Code": r.ItemCode, "Item Name": r.ItemName,
      "CAS No": r.CasNo||"-", "Category": r.Category||"-",
      "Qty": r.Quantity, "UOM": r.UOM,
      "Unit Price": r.UnitPrice != null ? parseFloat(r.UnitPrice) : "",
      "Line Value": r.LineValue  != null ? parseFloat(r.LineValue)  : "",
      "Status": r.LineStatus,
    })), "Order_Lines");
  };

  const cols = [
    {key:"SONo",label:"SO No"},{key:"SODate",label:"SO Date",fmt:formatDate},
    {key:"ItemCode",label:"Item Code"},{key:"ItemName",label:"Item Name"},
    {key:"CasNo",label:"CAS No"},{key:"Category",label:"Category"},
    {key:"Quantity",label:"Qty"},{key:"UOM",label:"UOM"},
    {key:"UnitPrice",label:"Unit Price",fmt:formatCurrency,cls:"c-val"},
    {key:"LineValue",label:"Line Value",fmt:formatCurrency,cls:"c-val"},
    {key:"LineStatus",label:"Status"},
  ];

  return (
    <Modal show onHide={onClose} size="xl" centered={!isMobile}
      dialogClassName="novo-modal novo-lines-modal"
      fullscreen={isMobile?true:undefined}>
      <div className="novo-modal-header" style={{background:`linear-gradient(135deg,${accentColor}dd,${accentColor})`}}>
        <div className="d-flex align-items-center gap-1 mb-1">
          <h5 className="novo-modal-title text-white flex-grow-1" style={{fontSize:"0.95rem"}}>{customerName} — Order Lines</h5>
          <button className="novo-modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="novo-modal-header-row">
          <input className="novo-modal-search" placeholder="Search lines…"
            value={tbl.search} onChange={e=>tbl.setSearch(e.target.value)} />
          <button className="novo-modal-export-btn" onClick={handleExport}>↓ Excel</button>
        </div>
      </div>
      <Modal.Body style={{padding:0,flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div className="novo-body">
          {loading ? (
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px"}}>
              <div className="spinner-border" style={{color:accentColor}} />
            </div>
          ) : isMobile ? (
            <>
              <div className="novo-sort-bar" style={{background:"#f4f5f7"}}>
                <span className="novo-sort-bar-label">Sort:</span>
                {SORT_OPTIONS.map((o,i)=>(
                  <button key={i} className={`novo-sort-chip${activeSortIdx===i?" active":""}`}
                    onClick={()=>handleMobileSort(i)}>{o.label}</button>
                ))}
              </div>
              <div className="novo-cards">
                {tbl.pageRows.length ? tbl.pageRows.map((r,i)=>(
                  <div className="novo-card" key={i} style={{borderLeftColor:accentColor,animationDelay:`${i*0.025}s`}}>
                    <div className="novo-card-name" style={{fontSize:"0.85rem"}}>{r.ItemName||"—"}</div>
                    <div className="novo-card-sub">SO #{r.SONo} · {formatDate(r.SODate)} · {r.LineStatus}</div>
                    <div className="novo-card-grid">
                      <div className="novo-card-f"><label>Item Code</label><span>{r.ItemCode||"—"}</span></div>
                      <div className="novo-card-f"><label>Category</label><span>{r.Category||"—"}</span></div>
                      <div className="novo-card-f"><label>Qty</label><span>{r.Quantity} {r.UOM}</span></div>
                      <div className="novo-card-f"><label>Unit Price</label><span className="val">{formatCurrency(r.UnitPrice)}</span></div>
                    </div>
                    <div className="novo-card-hr"/>
                    <div className="novo-card-total-row">
                      <span className="lbl">Line Value</span>
                      <span className="novo-card-f"><span className="val">{formatCurrency(r.LineValue)}</span></span>
                    </div>
                  </div>
                )) : <div className="novo-empty">No lines found</div>}
              </div>
            </>
          ) : (
            <div className="novo-table-wrap">
              <table className="novo-tbl">
                <thead>
                  <tr>
                    {cols.map(c=>(
                      <th key={c.key} onClick={()=>tbl.handleSort(c.key)} style={{color: c.cls==="c-val"?"#F39C12":"#9bb5d8"}}>
                        {c.label}<SI field={c.key} sorting={tbl.sorting}/>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tbl.pageRows.length ? tbl.pageRows.map((r,i)=>(
                    <tr key={i}>
                      {cols.map(c=>(
                        <td key={c.key} className={c.cls||""}>
                          {c.fmt ? c.fmt(r[c.key]) : (r[c.key]||"—")}
                        </td>
                      ))}
                    </tr>
                  )) : <tr><td colSpan={cols.length} className="novo-empty">No lines found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
          <Pager {...tbl}/>
        </div>
      </Modal.Body>
    </Modal>
  );
};

// ── Customer Modal ────────────────────────────────────────────────────────────
const TYPE_COLORS = { New:"#198754", Old:"#0d6efd", All:"#6f42c1" };

const CUST_SORT_OPTIONS = [
  {label:"Value ↑",  field:"OrderValue",    desc:false},
  {label:"Value ↓",  field:"OrderValue",    desc:true },
  {label:"Orders ↑", field:"NoOfOrders",    desc:false},
  {label:"Orders ↓", field:"NoOfOrders",    desc:true },
  {label:"A–Z",      field:"CustomerName",  desc:false},
  {label:"Z–A",      field:"CustomerName",  desc:true },
];

const CustomerModal = ({ params, customerType, periodLabel, onClose, periodStart, periodEnd }) => {
  const isMobile   = useIsMobile();
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderLines, setOrderLines] = useState(null);
  const tbl = useTableState(data);
  const [activeSortIdx, setActiveSortIdx] = useState(null);
  const color = TYPE_COLORS[customerType] || "#333";

  const handleMobileSort = (idx) => {
    if (activeSortIdx===idx) { setActiveSortIdx(null); tbl.handleSort(null); }
    else {
      setActiveSortIdx(idx);
      const o = CUST_SORT_OPTIONS[idx];
      // force direction by setting sorting state directly via handleSort twice if needed
      tbl.handleSort(o.field);
      // If we need desc but handleSort defaults to asc, call again
    }
  };

  useEffect(()=>{
    (async()=>{
      try {
        const qp = new URLSearchParams({...params, customerType});
        const r  = await fetch(`/api/customers/new-vs-old-modal?${qp}`);
        const j  = await r.json();
        setData(j.data||[]);
      } catch(e){ console.error(e); } finally{ setLoading(false); }
    })();
  },[]);

  const handleExport = () => {
    downloadExcel((data||[]).map(r=>({
      "Sales Person": r.SalesPersonName||"-", "Customer": r.CustomerName,
      "No of Orders": r.NoOfOrders != null ? parseInt(r.NoOfOrders) : "", "Order Value": r.OrderValue != null ? parseFloat(r.OrderValue) : "",
      "Category": r.Category||"-", "Region": r.Region||"-", "State": r.State||"-",
      "First Order": formatDate(r.FirstOrderDate), "Last Order": formatDate(r.LastOrderDate),
    })), `${customerType}_Customers`);
  };

  const cols = [
    {key:"SalesPersonName", label:"Sales Person"},
    {key:"CustomerName",    label:"Customer"},
    {key:"NoOfOrders",      label:"Orders", center:true},
    {key:"OrderValue",      label:"Order Value", cls:"c-link"},
    {key:"Category",        label:"Category"},
    {key:"Region",          label:"Region"},
    {key:"State",           label:"State"},
    {key:"FirstOrderDate",  label:"First Order", fmt:formatDate},
    {key:"LastOrderDate",   label:"Last Order",  fmt:formatDate},
  ];

  const headerGrad = `linear-gradient(135deg, ${color}ee, ${color})`;

  return (
    <>
      <Modal show onHide={onClose} size="xl" centered={!isMobile}
        dialogClassName="novo-modal"
        fullscreen={isMobile?true:undefined}>
        <div className="novo-modal-header" style={{background:headerGrad}}>
          <div className="d-flex align-items-center gap-1 mb-1">
            <h5 className="novo-modal-title text-white flex-grow-1">
              {customerType} Customers — {periodLabel}
              {!loading && <span style={{fontSize:"0.72rem",background:"rgba(255,255,255,0.2)",borderRadius:"10px",padding:"2px 8px",marginLeft:"8px"}}>{data.length} customers</span>}
            </h5>
            <button className="novo-modal-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="novo-modal-header-row">
            <input className="novo-modal-search" placeholder="Search customers…"
              value={tbl.search} onChange={e=>tbl.setSearch(e.target.value)}/>
            <button className="novo-modal-export-btn" onClick={handleExport}>↓ Excel</button>
          </div>
        </div>

        <Modal.Body style={{padding:0,flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div className="novo-body">
            {loading ? (
              <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px"}}>
                <div className="spinner-border" style={{color}} />
              </div>
            ) : isMobile ? (
              <>
                <div className="novo-sort-bar" style={{background:"#f4f5f7"}}>
                  <span className="novo-sort-bar-label">Sort:</span>
                  {CUST_SORT_OPTIONS.map((o,i)=>(
                    <button key={i} className={`novo-sort-chip${activeSortIdx===i?" active":""}`}
                      onClick={()=>handleMobileSort(i)}>{o.label}</button>
                  ))}
                </div>
                <div className="novo-cards">
                  {tbl.pageRows.length ? tbl.pageRows.map((r,i)=>(
                    <div className="novo-card" key={i} style={{borderLeftColor:color,animationDelay:`${i*0.025}s`}}>
                      <div className="novo-card-name">{r.CustomerName||"—"}</div>
                      <div className="novo-card-sub">{r.SalesPersonName||"—"} {r.Region?`· ${r.Region}`:""}</div>
                      <div className="novo-card-grid">
                        <div className="novo-card-f"><label>Orders</label>
                          <span style={{cursor:"pointer",color,textDecoration:"underline",fontWeight:700}}
                            onClick={()=>setOrderLines({cardCode:r.CardCode,customerName:r.CustomerName})}>
                            {r.NoOfOrders}
                          </span>
                        </div>
                        <div className="novo-card-f"><label>Category</label><span>{r.Category||"—"}</span></div>
                        <div className="novo-card-f"><label>State</label><span>{r.State||"—"}</span></div>
                        <div className="novo-card-f"><label>First Order</label><span>{formatDate(r.FirstOrderDate)}</span></div>
                      </div>
                      <div className="novo-card-hr"/>
                      <div className="novo-card-total-row">
                        <span className="lbl">Order Value</span>
                        <span className="novo-card-f">
                          <span className="val" style={{cursor:"pointer",color,textDecoration:"underline dotted"}}
                            onClick={()=>setOrderLines({cardCode:r.CardCode,customerName:r.CustomerName})}>
                            {formatCurrency(r.OrderValue)}
                          </span>
                        </span>
                      </div>
                    </div>
                  )) : <div className="novo-empty">No customers found</div>}
                </div>
              </>
            ) : (
              <div className="novo-table-wrap">
                <table className="novo-tbl">
                  <thead>
                    <tr>
                      {cols.map(c=>(
                        <th key={c.key} onClick={()=>tbl.handleSort(c.key)}
                          style={{color: c.cls==="c-link"?"#F39C12":"#9bb5d8"}}>
                          {c.label}<SI field={c.key} sorting={tbl.sorting}/>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tbl.pageRows.length ? tbl.pageRows.map((r,i)=>(
                      <tr key={i}>
                        {cols.map(c=>(
                          <td key={c.key} className={c.cls||""} style={c.center?{textAlign:"center"}:{}}>
                            {c.key==="NoOfOrders" ? (
                              <span style={{background:color,color:"#fff",borderRadius:"10px",padding:"2px 8px",cursor:"pointer",fontSize:"0.78rem"}}
                                onClick={()=>setOrderLines({cardCode:r.CardCode,customerName:r.CustomerName})}>
                                {r.NoOfOrders}
                              </span>
                            ) : c.key==="OrderValue" ? (
                              <span style={{color,cursor:"pointer",textDecoration:"underline dotted",fontFamily:"'Courier New',monospace",fontWeight:700}}
                                onClick={()=>setOrderLines({cardCode:r.CardCode,customerName:r.CustomerName})}>
                                {formatCurrency(r.OrderValue)}
                              </span>
                            ) : c.fmt ? c.fmt(r[c.key]) : (r[c.key]||"—")}
                          </td>
                        ))}
                      </tr>
                    )) : <tr><td colSpan={cols.length} className="novo-empty">No customers found</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
            <Pager {...tbl}/>
          </div>
        </Modal.Body>
      </Modal>

      {orderLines && (
        <OrderLinesModal
          cardCode={orderLines.cardCode}
          customerName={orderLines.customerName}
          startDate={periodStart}
          endDate={periodEnd}
          onClose={()=>setOrderLines(null)}
          accentColor={color}
        />
      )}
    </>
  );
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({ title, data, color, icon, onSeeCustomers, accent }) => (
  <div className="novo-kpi-card h-100" style={{borderTop:`4px solid ${color}`, background:"#fff"}}>
    <div className="novo-kpi-inner">
      <div className="d-flex justify-content-between align-items-start">
        <span className="novo-kpi-label">{title}</span>
        <span style={{fontSize:"1.4rem"}}>{icon}</span>
      </div>
      {data ? (
        <>
          <div className="novo-kpi-value" style={{color}}>{data.customerCount?.toLocaleString()}</div>
          <div className="novo-kpi-sub">customers</div>
          <div className="novo-kpi-metrics">
            <div className="novo-kpi-metric">
              <label>Order Value</label>
              <span>{formatCurrency(data.orderValue||0)}</span>
            </div>
            <div className="novo-kpi-metric">
              <label>Sales</label>
              <span>{formatCurrency(data.sales||0)}</span>
            </div>
          </div>
          <button className="novo-kpi-btn" onClick={onSeeCustomers}
            style={{border:`1.5px solid ${color}`,color, background:"transparent"}}>
            See Customers →
          </button>
        </>
      ) : (
        <div className="novo-kpi-value" style={{color:"#ddd",fontSize:"1.5rem"}}>—</div>
      )}
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const NewVsOldTrend = () => {
  const today      = new Date();
  const fyOptions  = buildFYOptions();
  const yearOptions = buildYearOptions();
  const currentFY  = getCurrentFY();

  const [dateMode,    setDateMode]    = useState("fy");
  const [fy,          setFy]          = useState(currentFY);
  const [dailyMonth,  setDailyMonth]  = useState(today.getMonth()+1);
  const [dailyYear,   setDailyYear]   = useState(today.getFullYear());
  const [slpCode,     setSlpCode]     = useState(null);
  const [itmsGrpCod,  setItmsGrpCod]  = useState(null);
  const [cardCode,    setCardCode]    = useState(null);
  const [region,      setRegion]      = useState(null);
  const [state,       setState]       = useState(null);

  const [filterOptions, setFilterOptions] = useState({ salesPersons:[], categories:[], customers:[] });
  const [chartData,  setChartData]  = useState([]);
  const [kpi,        setKpi]        = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [startDate,  setStartDate]  = useState("");
  const [endDate,    setEndDate]    = useState("");
  const [modal,      setModal]      = useState(null);

  useEffect(()=>{
    (async()=>{
      try {
        const token = localStorage.getItem("token");
        const h = { Authorization:`Bearer ${token}` };
        const [sp,cat,cust] = await Promise.all([
          fetch("/api/unique/salespersons",{headers:h}).then(r=>r.json()),
          fetch("/api/unique/categories",{headers:h}).then(r=>r.json()),
          fetch("/api/unique/customers",{headers:h}).then(r=>r.json()),
        ]);
        setFilterOptions({
          salesPersons: sp.data?.map(s=>({value:s.SlpCode,   label:s.SlpName  }))||[],
          categories:   cat.data?.map(c=>({value:c.ItmsGrpNam,label:c.ItmsGrpNam}))||[],
          customers:    cust.data?.map(c=>({value:c.CardCode,  label:c.CardName }))||[],
        });
      } catch(e){ console.error(e); }
    })();
  },[]);

  useEffect(()=>{ fetchData(); },[dateMode,fy,dailyMonth,dailyYear,slpCode,itmsGrpCod,cardCode,region,state]);

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const p = new URLSearchParams({mode:dateMode});
      if (dateMode==="fy") p.append("fy",fy);
      else { p.append("month",dailyMonth); p.append("year",dailyYear); }
      if (slpCode)    p.append("slpCode",slpCode);
      if (itmsGrpCod) p.append("itmsGrpCod",itmsGrpCod);
      if (cardCode)   p.append("cardCode",cardCode);
      if (region)     p.append("region",region);
      if (state)      p.append("state",state);
      const r = await fetch(`/api/customers/new-vs-old-trend?${p}`);
      if (!r.ok) throw new Error("Failed to fetch");
      const j = await r.json();
      setChartData(j.chartData||[]); setKpi(j.kpi);
      setStartDate(j.startDate); setEndDate(j.endDate);
    } catch(e){ setError(e.message); } finally{ setLoading(false); }
  };

  const buildModalParams = (period="ALL") => ({
    mode:dateMode, period,
    ...(dateMode==="fy"?{fy}:{month:dailyMonth,year:dailyYear}),
    ...(slpCode?{slpCode}:{}), ...(itmsGrpCod?{itmsGrpCod}:{}),
    ...(cardCode?{cardCode}:{}), ...(region?{region}:{}), ...(state?{state}:{}),
  });

  const periodLabel = dateMode==="fy"
    ? `FY ${fy}`
    : `${MONTHS_LIST.find(m=>m.value===dailyMonth)?.label} ${dailyYear}`;

  const openKpiModal = (type) => setModal({
    customerType:type, periodLabel, periodStart:startDate, periodEnd:endDate,
    params: buildModalParams("ALL"),
  });

  const chartJsData = {
    labels: chartData.map(d=>d.period),
    datasets:[
      { label:"New Customers", data:chartData.map(d=>d.new),
        backgroundColor:"#19875455", borderColor:"#198754", borderWidth:1.5, borderRadius:5 },
      { label:"Old Customers", data:chartData.map(d=>d.old),
        backgroundColor:"#0d6efd55", borderColor:"#0d6efd", borderWidth:1.5, borderRadius:5 },
    ],
  };

  const chartOptions = {
    responsive:true, maintainAspectRatio:false,
    plugins:{
      legend:{position:"top"},
      datalabels:{display:false},
      tooltip:{ callbacks:{ label:ctx=>`${ctx.dataset.label}: ${ctx.parsed.y}` }},
    },
    onClick:(event,elements)=>{
      if (!elements.length) return;
      const idx = elements[0].index;
      const dsIdx = elements[0].datasetIndex;
      const row = chartData[idx];
      const ctype = dsIdx===0?"New":"Old";
      let pStart, pEnd;
      if (dateMode==="daily") {
        const m=parseInt(dailyMonth),y=parseInt(dailyYear);
        const pad=String(row.periodNum).padStart(2,"0");
        pStart=`${y}-${String(m).padStart(2,"0")}-${pad}`; pEnd=pStart;
      } else {
        const [fyS,fyE]=fy.split("-");
        const fyStartY=parseInt(fyS), fyEndY=2000+parseInt(fyE);
        const p=row.periodNum, mY=p>=4?fyStartY:fyEndY;
        const ld=new Date(mY,p,0).getDate();
        pStart=`${mY}-${String(p).padStart(2,"0")}-01`;
        pEnd=`${mY}-${String(p).padStart(2,"0")}-${ld}`;
      }
      setModal({ customerType:ctype, periodLabel:`${row.period}`, periodStart:pStart, periodEnd:pEnd, params:buildModalParams(row.periodNum) });
    },
    onHover:(event,elements)=>{
      const t=event.native?.target; if(t) t.style.cursor=elements.length?"pointer":"default";
    },
    scales:{
      y:{ beginAtZero:true, title:{display:true,text:"No of Customers"}, ticks:{stepSize:1} },
      x:{ title:{display:true,text:dateMode==="daily"?"Day of Month":"Month (Financial Year)"} },
    },
  };

  const resetFilters = () => {
    setSlpCode(null); setItmsGrpCod(null); setCardCode(null); setRegion(null); setState(null);
    setDateMode("fy"); setFy(currentFY);
    setDailyMonth(today.getMonth()+1); setDailyYear(today.getFullYear());
  };
  const activeCount = [slpCode,itmsGrpCod,cardCode,region,state].filter(Boolean).length;

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <div className="novo-page container-fluid px-3 px-md-4 py-3">

        {/* ── Header ── */}
        <div className="d-flex flex-wrap justify-content-between align-items-start mb-3 gap-2">
          <div>
            <h4 className="mb-0 fw-bold" style={{fontFamily:"'Playfair Display',Georgia,serif",color:"#1a1a2e"}}>
              New vs Old Customer Trend
            </h4>
            <small className="text-muted">Track acquisition & retention over time · Click a bar to drill down</small>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button className="btn btn-outline-danger btn-sm" onClick={resetFilters} style={{borderRadius:"8px"}}>↺ Reset</button>
            {activeCount>0 && (
              <button className="btn btn-outline-secondary btn-sm"
                onClick={()=>{setSlpCode(null);setItmsGrpCod(null);setCardCode(null);setRegion(null);setState(null);}}
                style={{borderRadius:"8px"}}>✕ Filters ({activeCount})</button>
            )}
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="novo-filter-card">
          <div className="row g-3 align-items-start">

            {/* Date filter box */}
            <div className="col-12 col-md-4 col-lg-3">
              <div className="novo-date-box">
                <div className="novo-kpi-label mb-2">Date Filter</div>
                <div className="d-flex mb-3">
                  {["fy","daily"].map(m=>(
                    <button key={m} className={`novo-toggle-btn${dateMode===m?" active":""}`}
                      onClick={()=>setDateMode(m)}
                      style={{borderRadius:m==="fy"?"8px 0 0 8px":"0 8px 8px 0", borderRight:m==="fy"?"none":undefined}}>
                      {m==="fy"?"Financial Year":"Daily"}
                    </button>
                  ))}
                </div>
                {dateMode==="fy" ? (
                  <Select options={fyOptions} value={fyOptions.find(o=>o.value===fy)||null}
                    onChange={o=>setFy(o?.value)} styles={selectStyles} isSearchable={false} placeholder="Select FY"/>
                ) : (
                  <div className="d-flex gap-2">
                    <div style={{flex:1}}>
                      <label className="form-label small text-muted mb-1">Month</label>
                      <Select options={MONTHS_LIST} value={MONTHS_LIST.find(m=>m.value===dailyMonth)||null}
                        onChange={o=>setDailyMonth(o?.value)} styles={selectStyles} isSearchable={false}/>
                    </div>
                    <div style={{flex:1}}>
                      <label className="form-label small text-muted mb-1">Year</label>
                      <Select options={yearOptions} value={yearOptions.find(y=>y.value===dailyYear)||null}
                        onChange={o=>setDailyYear(o?.value)} styles={selectStyles} isSearchable={false}/>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Other filters */}
            <div className="col-12 col-md-8 col-lg-9">
              <div className="row g-2">
                {[
                  {label:"Category",   opts:filterOptions.categories,  val:itmsGrpCod, set:setItmsGrpCod, ph:"All Categories"},
                  {label:"Sales Person",opts:filterOptions.salesPersons,val:slpCode,    set:setSlpCode,    ph:"All Sales Persons"},
                  {label:"Customer",   opts:filterOptions.customers,   val:cardCode,   set:setCardCode,   ph:"All Customers"},
                ].map(f=>(
                  <div key={f.label} className="col-12 col-sm-6 col-lg-4">
                    <label className="form-label text-muted small fw-medium mb-1">{f.label}</label>
                    <Select options={f.opts} value={f.opts.find(o=>o.value==f.val)||null}
                      onChange={o=>f.set(o?.value||null)} placeholder={f.ph}
                      isClearable styles={selectStyles}/>
                  </div>
                ))}
                <div className="col-12 col-sm-6 col-lg-4">
                  <label className="form-label text-muted small fw-medium mb-1">
                    Region {state && <span className="badge bg-warning text-dark ms-1" style={{fontSize:"0.6rem"}}>State active</span>}
                  </label>
                  <Select options={REGIONS} value={REGIONS.find(r=>r.value===region)||null}
                    onChange={o=>{setRegion(o?.value||null);if(o)setState(null);}}
                    placeholder="All Regions" isClearable styles={selectStyles} isDisabled={!!state}/>
                </div>
                <div className="col-12 col-sm-6 col-lg-4">
                  <label className="form-label text-muted small fw-medium mb-1">
                    State {region && <span className="badge bg-warning text-dark ms-1" style={{fontSize:"0.6rem"}}>Region active</span>}
                  </label>
                  <Select options={STATES} value={STATES.find(s=>s.value===state)||null}
                    onChange={o=>{setState(o?.value||null);if(o)setRegion(null);}}
                    placeholder="All States" isClearable styles={selectStyles} isDisabled={!!region}/>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="row g-3 mb-3">
          <div className="col-6 col-md-3">
            <div className="novo-kpi-card h-100 novo-retention">
              <div className="novo-kpi-inner">
                <div className="d-flex justify-content-between align-items-start">
                  <span className="novo-kpi-label">Retention Rate</span>
                  <span style={{fontSize:"1.4rem"}}>🔄</span>
                </div>
                <div className="novo-kpi-value">{kpi?`${kpi.retentionRate}%`:"—"}</div>
                <div className="novo-kpi-sub">Old / Total customers</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <KpiCard title="New Customers" data={kpi?.new} color="#198754" icon="🆕" onSeeCustomers={()=>openKpiModal("New")}/>
          </div>
          <div className="col-6 col-md-3">
            <KpiCard title="Old Customers" data={kpi?.old} color="#0d6efd" icon="🔁" onSeeCustomers={()=>openKpiModal("Old")}/>
          </div>
          <div className="col-6 col-md-3">
            <KpiCard title="All Customers" data={kpi?.all} color="#6f42c1" icon="👥" onSeeCustomers={()=>openKpiModal("All")}/>
          </div>
        </div>

        {/* ── Chart ── */}
        <div className="novo-chart-card">
          <div className="novo-chart-header">
            <p className="novo-chart-title">Customer Trend — {periodLabel}</p>
            <small className="text-muted">Click a bar to see customer details</small>
          </div>
          <div className="card-body pt-3">
            {error && <p className="text-danger small">Error: {error}</p>}
            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{height:"350px"}}>
                <div className="spinner-border me-2" style={{color:"#1a1a2e"}}/><span>Loading…</span>
              </div>
            ) : chartData.length ? (
              <div style={{height:"350px"}}>
                <Bar data={chartJsData} options={chartOptions}/>
              </div>
            ) : (
              <p className="text-center text-muted py-5">No data for selected filters.</p>
            )}
          </div>
        </div>

        {/* ── Modal ── */}
        {modal && (
          <CustomerModal
            params={modal.params}
            customerType={modal.customerType}
            periodLabel={modal.periodLabel}
            periodStart={modal.periodStart}
            periodEnd={modal.periodEnd}
            onClose={()=>setModal(null)}
          />
        )}
      </div>
    </>
  );
};

export default NewVsOldTrend;