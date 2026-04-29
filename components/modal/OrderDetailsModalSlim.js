// // components/modal/OrderDetailsModalSlim.js
// import React, { useState, useMemo } from "react";
// import {
//   useReactTable,
//   getCoreRowModel,
//   getSortedRowModel,
//   getFilteredRowModel,
//   getPaginationRowModel,
//   flexRender,
// } from "@tanstack/react-table";
// import Modal from "react-bootstrap/Modal";
// import { formatCurrency } from "utils/formatCurrency";
// import downloadExcel from "utils/exporttoexcel";

// const MOBILE_BP = 768;

// const useIsMobile = () => {
//   const [isMobile, setIsMobile] = React.useState(
//     typeof window !== "undefined" ? window.innerWidth < MOBILE_BP : false
//   );
//   React.useEffect(() => {
//     const handler = () => setIsMobile(window.innerWidth < MOBILE_BP);
//     window.addEventListener("resize", handler);
//     return () => window.removeEventListener("resize", handler);
//   }, []);
//   return isMobile;
// };

// const STYLES = `
//   .slim-modal .modal-dialog { max-width: 95vw !important; margin: 0.5rem auto; }
//   .slim-modal .modal-content {
//     border-radius: 16px; overflow: hidden; border: none;
//     box-shadow: 0 25px 60px rgba(0,0,0,0.35);
//     display: flex; flex-direction: column;
//   }
//   .slim-header {
//     background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%);
//     padding: 14px 18px;
//     border-bottom: 1px solid rgba(243,156,18,0.3);
//     flex-shrink: 0;
//   }
//   .slim-title {
//     font-family: Georgia, serif; color: #F39C12;
//     font-size: 1.05rem; font-weight: 700; margin: 0 0 10px 0;
//     letter-spacing: 0.02em;
//   }
//   .slim-header-row { display: flex; gap: 8px; align-items: center; }
//   .slim-search {
//     flex: 1; min-width: 0;
//     background: rgba(255,255,255,0.09) !important;
//     border: 1px solid rgba(243,156,18,0.4) !important;
//     border-radius: 8px !important; color: #fff !important;
//     font-size: 0.83rem !important; padding: 7px 12px !important;
//     outline: none;
//   }
//   .slim-search::placeholder { color: rgba(255,255,255,0.4) !important; }
//   .slim-search:focus { box-shadow: 0 0 0 2px rgba(243,156,18,0.35) !important; }
//   .slim-export-btn {
//     background: linear-gradient(135deg, #1a7a4a, #27ae60);
//     color: #fff; border: none; padding: 7px 14px;
//     border-radius: 8px; font-size: 0.78rem; font-weight: 600;
//     cursor: pointer; white-space: nowrap; transition: opacity 0.15s;
//   }
//   .slim-export-btn:hover { opacity: 0.85; }
//   .slim-close-btn {
//     background: rgba(255,255,255,0.1); color: #fff;
//     border: 1px solid rgba(255,255,255,0.2);
//     width: 34px; height: 34px; border-radius: 8px;
//     font-size: 1rem; cursor: pointer; flex-shrink: 0;
//     display: flex; align-items: center; justify-content: center;
//     transition: background 0.15s;
//   }
//   .slim-close-btn:hover { background: rgba(255,255,255,0.22); }

//   /* Table */
//   .slim-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
//   .slim-table-wrap { flex: 1; overflow: auto; }
//   .slim-tbl { width: 100%; border-collapse: collapse; }
//   .slim-tbl thead th {
//     background: #1a1a2e; color: #F39C12;
//     font-family: Georgia, serif; font-size: 0.76rem;
//     font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
//     padding: 10px 14px; border-bottom: 2px solid rgba(243,156,18,0.35);
//     white-space: nowrap; cursor: pointer; user-select: none;
//     transition: background 0.15s; position: sticky; top: 0; z-index: 1;
//   }
//   .slim-tbl thead th:hover { background: #0f3460; }
//   .slim-sort { display: inline-block; margin-left: 5px; font-size: 0.65rem; opacity: 0.4; }
//   .slim-sort.on { opacity: 1; color: #F39C12; }
//   .slim-tbl tbody tr { border-bottom: 1px solid rgba(0,0,0,0.055); transition: background 0.1s; }
//   .slim-tbl tbody tr:nth-child(even) { background: rgba(26,26,46,0.025); }
//   .slim-tbl tbody tr:hover { background: rgba(243,156,18,0.06) !important; }
//   .slim-tbl tbody td {
//     padding: 9px 14px; font-size: 0.82rem;
//     color: #2d2d2d; white-space: nowrap; border: none; vertical-align: middle;
//   }
//   .slim-tbl td.c-price { font-family: 'Courier New', monospace; font-weight: 600; color: #1a7a4a; }
//   .slim-tbl td.c-total { font-family: 'Courier New', monospace; font-weight: 700; color: #0f3460; }
//   .slim-empty { text-align: center; padding: 48px 20px; color: #bbb; font-size: 0.88rem; }

//   /* Pagination */
//   .slim-pager {
//     flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
//     padding: 9px 16px; background: #f8f9fa; border-top: 1px solid #e9ecef;
//     flex-wrap: wrap; gap: 6px;
//   }
//   .slim-pager-info { font-size: 0.76rem; color: #777; }
//   .slim-pager-btns { display: flex; align-items: center; gap: 4px; }
//   .slim-pbtn {
//     padding: 4px 9px; font-size: 0.76rem; border-radius: 6px;
//     border: 1px solid #dee2e6; background: white; cursor: pointer;
//     color: #495057; transition: all 0.12s;
//   }
//   .slim-pbtn:disabled { opacity: 0.38; cursor: not-allowed; }
//   .slim-pbtn:not(:disabled):hover { background: #F39C12; color: #fff; border-color: #F39C12; }
//   .slim-pager select {
//     font-size: 0.76rem; padding: 3px 6px;
//     border-radius: 6px; border: 1px solid #dee2e6;
//   }

//   /* Mobile cards */
//   .slim-cards { flex: 1; overflow-y: auto; padding: 12px; background: #f2f3f7; }
//   .slim-card {
//     background: #fff; border-radius: 12px; padding: 14px 16px;
//     margin-bottom: 10px; border-left: 4px solid #F39C12;
//     box-shadow: 0 2px 8px rgba(0,0,0,0.07);
//     animation: slimIn 0.18s ease forwards;
//   }
//   @keyframes slimIn {
//     from { opacity:0; transform: translateY(5px); }
//     to   { opacity:1; transform: translateY(0); }
//   }
//   .slim-card-name { font-family: Georgia, serif; font-size: 0.95rem; font-weight: 700; color: #1a1a2e; }
//   .slim-card-sub  { font-size: 0.73rem; color: #999; margin: 2px 0 8px; }
//   .slim-card-hr   { height: 1px; background: rgba(243,156,18,0.18); margin: 8px 0; }
//   .slim-card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px 14px; }
//   .slim-card-f label { font-size: 0.63rem; text-transform: uppercase; letter-spacing: 0.07em; color: #bbb; display: block; margin-bottom: 1px; font-weight: 700; }
//   .slim-card-f span { font-size: 0.81rem; color: #333; font-weight: 500; word-break: break-word; }
//   .slim-card-f span.p { color: #1a7a4a; font-family: 'Courier New', monospace; font-weight: 700; }
//   .slim-card-f span.t { color: #0f3460; font-family: 'Courier New', monospace; font-weight: 700; font-size: 0.88rem; }
//   .slim-card-total-row { display: flex; justify-content: space-between; align-items: center; }
//   .slim-card-total-row .lbl { font-size: 0.63rem; text-transform: uppercase; letter-spacing: 0.07em; color: #bbb; font-weight: 700; }

//   @media (max-width: 767px) {
//     .slim-modal .modal-dialog { margin: 0 !important; max-width: 100vw !important; }
//     .slim-modal .modal-content { border-radius: 0; min-height: 100dvh; }
//     .slim-header { padding: 12px 14px; }
//     .slim-title { font-size: 0.9rem; margin-bottom: 8px; }
//   }
// `;

// const SortIcon = ({ s }) => <span className={`slim-sort${s ? " on" : ""}`}>{!s ? "⇅" : s === "asc" ? "↑" : "↓"}</span>;

// const OrderDetailsModalSlim = ({ orderData, onClose, title = "Order Details" }) => {
//   const isMobile = useIsMobile();
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 12 });
//   const [sorting, setSorting] = useState([]);

//   // Exact order: Customer, Unit Price, Quantity, Total Price, Category, Item Name, Sales Person, Contact Person
//   const columns = useMemo(() => [
//     {
//       accessorKey: "Customer",
//       header: "Customer",
//       cell: ({ getValue }) => getValue() || "—",
//     },
//     {
//       accessorKey: "Unit_Price",
//       header: "Unit Price",
//       cell: ({ getValue }) => getValue() != null ? formatCurrency(getValue()) : "—",
//       sortingFn: (a, b) => (parseFloat(a.original.Unit_Price) || 0) - (parseFloat(b.original.Unit_Price) || 0),
//     },
//     {
//       accessorKey: "Quantity",
//       header: "Quantity",
//       cell: ({ getValue }) => getValue() != null ? getValue() : "—",
//     },
//     {
//       accessorKey: "Total_Price",
//       header: "Total Price",
//       cell: ({ getValue }) => getValue() != null ? formatCurrency(getValue()) : "—",
//       sortingFn: (a, b) => (parseFloat(a.original.Total_Price) || 0) - (parseFloat(b.original.Total_Price) || 0),
//     },
//     {
//       accessorKey: "Category",
//       header: "Category",
//       cell: ({ getValue }) => getValue() || "—",
//     },
//     {
//       accessorKey: "Item_Service_Description",
//       header: "Item Name",
//       cell: ({ getValue }) => getValue() || "—",
//     },
//     {
//       accessorKey: "Sales_Person",
//       header: "Sales Person",
//       cell: ({ getValue }) => getValue() || "—",
//     },
//     {
//       accessorKey: "Contact_Person",
//       header: "Contact Person",
//       cell: ({ getValue }) => getValue() || "—",
//     },
//   ], []);

//   const table = useReactTable({
//     data: orderData || [],
//     columns,
//     state: { globalFilter, pagination, sorting },
//     onGlobalFilterChange: setGlobalFilter,
//     onPaginationChange: setPagination,
//     onSortingChange: setSorting,
//     getCoreRowModel: getCoreRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),
//     getPaginationRowModel: getPaginationRowModel(),
//     globalFilterFn: (row, _, filterValue) => {
//       const s = filterValue.toLowerCase();
//       return Object.values(row.original).some(v => String(v ?? "").toLowerCase().includes(s));
//     },
//     enableSorting: true,
//     enableMultiSort: false,
//   });

//   const rows = table.getRowModel().rows;
//   const totalFiltered = table.getFilteredRowModel().rows.length;

//   const handleExport = () => {
//     const data = (orderData || []).map(r => ({
//       "Customer": r.Customer || "—",
//       "Unit Price": r.Unit_Price != null ? formatCurrency(r.Unit_Price) : "—",
//       "Quantity": r.Quantity ?? "—",
//       "Total Price": r.Total_Price != null ? formatCurrency(r.Total_Price) : "—",
//       "Category": r.Category || "—",
//       "Item Name": r.Item_Service_Description || "—",
//       "Sales Person": r.Sales_Person || "—",
//       "Contact Person": r.Contact_Person || "—",
//     }));
//     downloadExcel(data, "Order_Details");
//   };

//   return (
//     <>
//       <style>{STYLES}</style>
//       <Modal
//         show={true}
//         onHide={onClose}
//         size="xl"
//         centered={!isMobile}
//         dialogClassName="slim-modal"
//         fullscreen={isMobile ? true : undefined}
//       >
//         {/* Header */}
//         <div className="slim-header">
//           <div className="d-flex align-items-center gap-1 mb-1">
//             <h5 className="slim-title flex-grow-1">{title}</h5>
//             <button className="slim-close-btn" onClick={onClose}>✕</button>
//           </div>
//           <div className="slim-header-row">
//             <input
//               type="text"
//               className="slim-search"
//               placeholder="Search orders…"
//               value={globalFilter}
//               onChange={e => setGlobalFilter(e.target.value)}
//             />
//             <button className="slim-export-btn" onClick={handleExport}>↓ Excel</button>
//           </div>
//         </div>

//         {/* Body */}
//         <Modal.Body style={{ padding: 0, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
//           <div className="slim-body">

//             {isMobile ? (
//               /* ── Mobile: card list ── */
//               <div className="slim-cards">
//                 {rows.length > 0 ? rows.map((row, i) => {
//                   const d = row.original;
//                   return (
//                     <div className="slim-card" key={row.id} style={{ animationDelay: `${i * 0.025}s` }}>
//                       <div className="slim-card-name">{d.Customer || "—"}</div>
//                       <div className="slim-card-sub">
//                         {[d.Sales_Person, d.Contact_Person].filter(Boolean).map((s, idx) => (
//                           <span key={idx}>{idx > 0 ? " · " : ""}{s}</span>
//                         ))}
//                       </div>
//                       <div className="slim-card-grid">
//                         <div className="slim-card-f" style={{ gridColumn: "1 / -1" }}>
//                           <label>Item Name</label>
//                           <span>{d.Item_Service_Description || "—"}</span>
//                         </div>
//                         <div className="slim-card-f">
//                           <label>Category</label>
//                           <span>{d.Category || "—"}</span>
//                         </div>
//                         <div className="slim-card-f">
//                           <label>Quantity</label>
//                           <span>{d.Quantity ?? "—"}</span>
//                         </div>
//                         <div className="slim-card-f">
//                           <label>Unit Price</label>
//                           <span className="p">{d.Unit_Price != null ? formatCurrency(d.Unit_Price) : "—"}</span>
//                         </div>
//                       </div>
//                       <div className="slim-card-hr" />
//                       <div className="slim-card-total-row">
//                         <span className="lbl">Total Price</span>
//                         <span className="slim-card-f"><span className="t">{d.Total_Price != null ? formatCurrency(d.Total_Price) : "—"}</span></span>
//                       </div>
//                     </div>
//                   );
//                 }) : (
//                   <div className="slim-empty">No orders found</div>
//                 )}
//               </div>
//             ) : (
//               /* ── Desktop: table ── */
//               <div className="slim-table-wrap">
//                 <table className="slim-tbl">
//                   <thead>
//                     {table.getHeaderGroups().map(hg => (
//                       <tr key={hg.id}>
//                         {hg.headers.map(header => (
//                           <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
//                             {flexRender(header.column.columnDef.header, header.getContext())}
//                             <SortIcon s={header.column.getIsSorted()} />
//                           </th>
//                         ))}
//                       </tr>
//                     ))}
//                   </thead>
//                   <tbody>
//                     {rows.length > 0 ? rows.map(row => (
//                       <tr key={row.id}>
//                         {row.getVisibleCells().map(cell => {
//                           const id = cell.column.id;
//                           const cls = id === "Unit_Price" ? "c-price" : id === "Total_Price" ? "c-total" : "";
//                           return (
//                             <td key={cell.id} className={cls}>
//                               {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                             </td>
//                           );
//                         })}
//                       </tr>
//                     )) : (
//                       <tr><td colSpan={columns.length} className="slim-empty">No order data available</td></tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             )}

//             {/* Pagination */}
//             <div className="slim-pager">
//               <span className="slim-pager-info">{rows.length} of {totalFiltered} rows</span>
//               <div className="slim-pager-btns">
//                 <button className="slim-pbtn" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>«</button>
//                 <button className="slim-pbtn" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>‹</button>
//                 <span className="slim-pager-info" style={{ padding: "0 6px" }}>
//                   <strong>{table.getState().pagination.pageIndex + 1}</strong> / {table.getPageCount()}
//                 </span>
//                 <button className="slim-pbtn" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>›</button>
//                 <button className="slim-pbtn" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>»</button>
//               </div>
//               <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
//                 <span className="slim-pager-info">Per page:</span>
//                 <select value={table.getState().pagination.pageSize} onChange={e => table.setPageSize(Number(e.target.value))} className="slim-pager">
//                   {[12, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
//                 </select>
//               </div>
//             </div>

//           </div>
//         </Modal.Body>
//       </Modal>
//     </>
//   );
// };

// export default OrderDetailsModalSlim;


// components/modal/OrderDetailsModalSlim.js
import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import Modal from "react-bootstrap/Modal";
import { formatCurrency } from "utils/formatCurrency";
import downloadExcel from "utils/exporttoexcel";

const MOBILE_BP = 768;

const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < MOBILE_BP : false
  );
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < MOBILE_BP);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

// Sort options shown in the mobile sort bar
const SORT_OPTIONS = [
  { label: "Unit Price ↑",  field: "Unit_Price",  desc: false },
  { label: "Unit Price ↓",  field: "Unit_Price",  desc: true  },
  { label: "Total Price ↑", field: "Total_Price", desc: false },
  { label: "Total Price ↓", field: "Total_Price", desc: true  },
  { label: "Customer A–Z",  field: "Customer",    desc: false },
  { label: "Customer Z–A",  field: "Customer",    desc: true  },
];

const STYLES = `
  .slim-modal .modal-dialog { max-width: 95vw !important; margin: 0.5rem auto; }
  .slim-modal .modal-content {
    border-radius: 16px; overflow: hidden; border: none;
    box-shadow: 0 25px 60px rgba(0,0,0,0.35);
    display: flex; flex-direction: column;
  }
  .slim-header {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%);
    padding: 14px 18px;
    border-bottom: 1px solid rgba(243,156,18,0.3);
    flex-shrink: 0;
  }
  .slim-title {
    font-family: Georgia, serif; color: #F39C12;
    font-size: 1.05rem; font-weight: 700; margin: 0 0 10px 0;
    letter-spacing: 0.02em;
  }
  .slim-header-row { display: flex; gap: 8px; align-items: center; }
  .slim-search {
    flex: 1; min-width: 0;
    background: rgba(255,255,255,0.09) !important;
    border: 1px solid rgba(243,156,18,0.4) !important;
    border-radius: 8px !important; color: #fff !important;
    font-size: 0.83rem !important; padding: 7px 12px !important;
    outline: none;
  }
  .slim-search::placeholder { color: rgba(255,255,255,0.4) !important; }
  .slim-search:focus { box-shadow: 0 0 0 2px rgba(243,156,18,0.35) !important; }
  .slim-export-btn {
    background: linear-gradient(135deg, #1a7a4a, #27ae60);
    color: #fff; border: none; padding: 7px 14px;
    border-radius: 8px; font-size: 0.78rem; font-weight: 600;
    cursor: pointer; white-space: nowrap; transition: opacity 0.15s;
  }
  .slim-export-btn:hover { opacity: 0.85; }
  .slim-close-btn {
    background: rgba(255,255,255,0.1); color: #fff;
    border: 1px solid rgba(255,255,255,0.2);
    width: 34px; height: 34px; border-radius: 8px;
    font-size: 1rem; cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
  }
  .slim-close-btn:hover { background: rgba(255,255,255,0.22); }

  /* Mobile sort bar */
  .slim-sort-bar {
    display: flex; align-items: center; gap: 0;
    padding: 8px 12px 6px; background: #f2f3f7;
    border-bottom: 1px solid #e2e4ea;
    overflow-x: auto; flex-shrink: 0;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .slim-sort-bar::-webkit-scrollbar { display: none; }
  .slim-sort-bar-label {
    font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.07em; color: #aaa; white-space: nowrap;
    margin-right: 8px; flex-shrink: 0;
  }
  .slim-sort-chip {
    flex-shrink: 0; padding: 5px 11px; border-radius: 20px;
    font-size: 0.74rem; font-weight: 600; cursor: pointer;
    border: 1.5px solid #dde0e8; background: #fff; color: #555;
    margin-right: 6px; white-space: nowrap;
    transition: all 0.15s ease;
  }
  .slim-sort-chip.active {
    background: #F39C12; color: #fff; border-color: #F39C12;
    box-shadow: 0 2px 6px rgba(243,156,18,0.35);
  }

  /* Table */
  .slim-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
  .slim-table-wrap { flex: 1; overflow: auto; }
  .slim-tbl { width: 100%; border-collapse: collapse; }
  .slim-tbl thead th {
    background: #1a1a2e; color: #F39C12;
    font-family: Georgia, serif; font-size: 0.76rem;
    font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
    padding: 10px 14px; border-bottom: 2px solid rgba(243,156,18,0.35);
    white-space: nowrap; cursor: pointer; user-select: none;
    transition: background 0.15s; position: sticky; top: 0; z-index: 1;
  }
  .slim-tbl thead th:hover { background: #0f3460; }
  .slim-sort { display: inline-block; margin-left: 5px; font-size: 0.65rem; opacity: 0.4; }
  .slim-sort.on { opacity: 1; color: #F39C12; }
  .slim-tbl tbody tr { border-bottom: 1px solid rgba(0,0,0,0.055); transition: background 0.1s; }
  .slim-tbl tbody tr:nth-child(even) { background: rgba(26,26,46,0.025); }
  .slim-tbl tbody tr:hover { background: rgba(243,156,18,0.06) !important; }
  .slim-tbl tbody td {
    padding: 9px 14px; font-size: 0.82rem;
    color: #2d2d2d; white-space: nowrap; border: none; vertical-align: middle;
  }
  .slim-tbl td.c-price { font-family: 'Courier New', monospace; font-weight: 600; color: #1a7a4a; }
  .slim-tbl td.c-total { font-family: 'Courier New', monospace; font-weight: 700; color: #0f3460; }
  .slim-empty { text-align: center; padding: 48px 20px; color: #bbb; font-size: 0.88rem; }

  /* Pagination */
  .slim-pager {
    flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
    padding: 9px 16px; background: #f8f9fa; border-top: 1px solid #e9ecef;
    flex-wrap: wrap; gap: 6px;
  }
  .slim-pager-info { font-size: 0.76rem; color: #777; }
  .slim-pager-btns { display: flex; align-items: center; gap: 4px; }
  .slim-pbtn {
    padding: 4px 9px; font-size: 0.76rem; border-radius: 6px;
    border: 1px solid #dee2e6; background: white; cursor: pointer;
    color: #495057; transition: all 0.12s;
  }
  .slim-pbtn:disabled { opacity: 0.38; cursor: not-allowed; }
  .slim-pbtn:not(:disabled):hover { background: #F39C12; color: #fff; border-color: #F39C12; }

  /* Mobile cards */
  .slim-cards { flex: 1; overflow-y: auto; padding: 12px; background: #f2f3f7; }
  .slim-card {
    background: #fff; border-radius: 12px; padding: 14px 16px;
    margin-bottom: 10px; border-left: 4px solid #F39C12;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    animation: slimIn 0.18s ease forwards;
  }
  @keyframes slimIn {
    from { opacity:0; transform: translateY(5px); }
    to   { opacity:1; transform: translateY(0); }
  }
  .slim-card-name { font-family: Georgia, serif; font-size: 0.95rem; font-weight: 700; color: #1a1a2e; }
  .slim-card-sub  { font-size: 0.73rem; color: #999; margin: 2px 0 8px; }
  .slim-card-hr   { height: 1px; background: rgba(243,156,18,0.18); margin: 8px 0; }
  .slim-card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px 14px; }
  .slim-card-f label { font-size: 0.63rem; text-transform: uppercase; letter-spacing: 0.07em; color: #bbb; display: block; margin-bottom: 1px; font-weight: 700; }
  .slim-card-f span { font-size: 0.81rem; color: #333; font-weight: 500; word-break: break-word; }
  .slim-card-f span.p { color: #1a7a4a; font-family: 'Courier New', monospace; font-weight: 700; }
  .slim-card-f span.t { color: #0f3460; font-family: 'Courier New', monospace; font-weight: 700; font-size: 0.88rem; }
  .slim-card-total-row { display: flex; justify-content: space-between; align-items: center; }
  .slim-card-total-row .lbl { font-size: 0.63rem; text-transform: uppercase; letter-spacing: 0.07em; color: #bbb; font-weight: 700; }

  @media (max-width: 767px) {
    .slim-modal .modal-dialog { margin: 0 !important; max-width: 100vw !important; }
    .slim-modal .modal-content { border-radius: 0; min-height: 100dvh; }
    .slim-header { padding: 12px 14px; }
    .slim-title { font-size: 0.9rem; margin-bottom: 8px; }
  }
`;

const SortIcon = ({ s }) => (
  <span className={`slim-sort${s ? " on" : ""}`}>{!s ? "⇅" : s === "asc" ? "↑" : "↓"}</span>
);

const OrderDetailsModalSlim = ({ orderData, onClose, title = "Order Details" }) => {
  const isMobile = useIsMobile();
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 12 });
  const [sorting, setSorting] = useState([]);
  // Track which sort chip is active on mobile (index into SORT_OPTIONS, or null)
  const [activeSortIdx, setActiveSortIdx] = useState(null);

  const handleMobileSort = (idx) => {
    if (activeSortIdx === idx) {
      // Tap again → clear sort
      setActiveSortIdx(null);
      setSorting([]);
    } else {
      setActiveSortIdx(idx);
      const opt = SORT_OPTIONS[idx];
      setSorting([{ id: opt.field, desc: opt.desc }]);
    }
  };

  // Column order: Customer, Unit Price, Quantity, Total Price, Category, Item Name, Sales Person, Contact Person
  const columns = useMemo(() => [
    {
      accessorKey: "Customer",
      header: "Customer",
      cell: ({ getValue }) => getValue() || "—",
    },
    {
      accessorKey: "Unit_Price",
      header: "Unit Price",
      cell: ({ getValue }) => getValue() != null ? formatCurrency(getValue()) : "—",
      sortingFn: (a, b) => (parseFloat(a.original.Unit_Price) || 0) - (parseFloat(b.original.Unit_Price) || 0),
    },
    {
      accessorKey: "Quantity",
      header: "Quantity",
      cell: ({ getValue }) => getValue() != null ? getValue() : "—",
    },
    {
      accessorKey: "Total_Price",
      header: "Total Price",
      cell: ({ getValue }) => getValue() != null ? formatCurrency(getValue()) : "—",
      sortingFn: (a, b) => (parseFloat(a.original.Total_Price) || 0) - (parseFloat(b.original.Total_Price) || 0),
    },
    {
      accessorKey: "Category",
      header: "Category",
      cell: ({ getValue }) => getValue() || "—",
    },
    {
      accessorKey: "Item_Service_Description",
      header: "Item Name",
      cell: ({ getValue }) => getValue() || "—",
    },
    {
      accessorKey: "Sales_Person",
      header: "Sales Person",
      cell: ({ getValue }) => getValue() || "—",
    },
    {
      accessorKey: "Contact_Person",
      header: "Contact Person",
      cell: ({ getValue }) => getValue() || "—",
    },
  ], []);

  const table = useReactTable({
    data: orderData || [],
    columns,
    state: { globalFilter, pagination, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _, filterValue) => {
      const s = filterValue.toLowerCase();
      return Object.values(row.original).some(v => String(v ?? "").toLowerCase().includes(s));
    },
    enableSorting: true,
    enableMultiSort: false,
  });

  const rows = table.getRowModel().rows;
  const totalFiltered = table.getFilteredRowModel().rows.length;

  const handleExport = () => {
    const data = (orderData || []).map(r => ({
      "Customer":       r.Customer || "—",
      "Unit Price":     r.Unit_Price != null ? parseFloat(r.Unit_Price) : "",
      "Quantity":       r.Quantity ?? "—",
      "Total Price":    r.Total_Price != null ? parseFloat(r.Total_Price) : "",
      "Category":       r.Category || "—",
      "Item Name":      r.Item_Service_Description || "—",
      "Sales Person":   r.Sales_Person || "—",
      "Contact Person": r.Contact_Person || "—",
    }));
    downloadExcel(data, "Order_Details");
  };

  return (
    <>
      <style>{STYLES}</style>
      <Modal
        show={true}
        onHide={onClose}
        size="xl"
        centered={!isMobile}
        dialogClassName="slim-modal"
        fullscreen={isMobile ? true : undefined}
      >
        {/* Header */}
        <div className="slim-header">
          <div className="d-flex align-items-center gap-1 mb-1">
            <h5 className="slim-title flex-grow-1">{title}</h5>
            <button className="slim-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="slim-header-row">
            <input
              type="text"
              className="slim-search"
              placeholder="Search orders…"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
            <button className="slim-export-btn" onClick={handleExport}>↓ Excel</button>
          </div>
        </div>

        {/* Body */}
        <Modal.Body style={{ padding: 0, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div className="slim-body">

            {isMobile ? (
              <>
                {/* ── Mobile sort chips ── */}
                <div className="slim-sort-bar">
                  <span className="slim-sort-bar-label">Sort:</span>
                  {SORT_OPTIONS.map((opt, idx) => (
                    <button
                      key={idx}
                      className={`slim-sort-chip${activeSortIdx === idx ? " active" : ""}`}
                      onClick={() => handleMobileSort(idx)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* ── Mobile card list ── */}
                <div className="slim-cards">
                  {rows.length > 0 ? rows.map((row, i) => {
                    const d = row.original;
                    return (
                      <div className="slim-card" key={row.id} style={{ animationDelay: `${i * 0.025}s` }}>
                        <div className="slim-card-name">{d.Customer || "—"}</div>
                        <div className="slim-card-sub">
                          {[d.Sales_Person, d.Contact_Person].filter(Boolean).map((s, idx) => (
                            <span key={idx}>{idx > 0 ? " · " : ""}{s}</span>
                          ))}
                        </div>
                        <div className="slim-card-grid">
                          <div className="slim-card-f" style={{ gridColumn: "1 / -1" }}>
                            <label>Item Name</label>
                            <span>{d.Item_Service_Description || "—"}</span>
                          </div>
                          <div className="slim-card-f">
                            <label>Category</label>
                            <span>{d.Category || "—"}</span>
                          </div>
                          <div className="slim-card-f">
                            <label>Quantity</label>
                            <span>{d.Quantity ?? "—"}</span>
                          </div>
                          <div className="slim-card-f">
                            <label>Unit Price</label>
                            <span className="p">{d.Unit_Price != null ? formatCurrency(d.Unit_Price) : "—"}</span>
                          </div>
                        </div>
                        <div className="slim-card-hr" />
                        <div className="slim-card-total-row">
                          <span className="lbl">Total Price</span>
                          <span className="slim-card-f">
                            <span className="t">{d.Total_Price != null ? formatCurrency(d.Total_Price) : "—"}</span>
                          </span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="slim-empty">No orders found</div>
                  )}
                </div>
              </>
            ) : (
              /* ── Desktop table ── */
              <div className="slim-table-wrap">
                <table className="slim-tbl">
                  <thead>
                    {table.getHeaderGroups().map(hg => (
                      <tr key={hg.id}>
                        {hg.headers.map(header => (
                          <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <SortIcon s={header.column.getIsSorted()} />
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {rows.length > 0 ? rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => {
                          const id = cell.column.id;
                          const cls = id === "Unit_Price" ? "c-price" : id === "Total_Price" ? "c-total" : "";
                          return (
                            <td key={cell.id} className={cls}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          );
                        })}
                      </tr>
                    )) : (
                      <tr><td colSpan={columns.length} className="slim-empty">No order data available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="slim-pager">
              <span className="slim-pager-info">{rows.length} of {totalFiltered} rows</span>
              <div className="slim-pager-btns">
                <button className="slim-pbtn" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>«</button>
                <button className="slim-pbtn" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>‹</button>
                <span className="slim-pager-info" style={{ padding: "0 6px" }}>
                  <strong>{table.getState().pagination.pageIndex + 1}</strong> / {table.getPageCount()}
                </span>
                <button className="slim-pbtn" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>›</button>
                <button className="slim-pbtn" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>»</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="slim-pager-info">Per page:</span>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={e => table.setPageSize(Number(e.target.value))}
                  style={{ fontSize: "0.76rem", padding: "3px 6px", borderRadius: "6px", border: "1px solid #dee2e6" }}
                >
                  {[12, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default OrderDetailsModalSlim;