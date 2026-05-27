// components/waybill/AllWaybills.js
import { useState, useEffect } from "react";
import s from "./AllWaybills.module.css";

const PAGE_SIZE = 20;

export default function AllWaybills() {
  const [waybills, setWaybills] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate]     = useState("");
  const [product, setProduct]   = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  const fetchWaybills = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, pageSize: PAGE_SIZE, search, fromDate, toDate, product });
      const res  = await fetch(`/api/invoices/all-waybills?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setWaybills(data.waybills || []);
      setTotal(data.totalItems || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWaybills(1); }, []);

  const handleSearch = () => { setPage(1); fetchWaybills(1); };
  const handleReset  = () => {
    setSearch(""); setFromDate(""); setToDate(""); setProduct("");
    setPage(1); setTimeout(() => fetchWaybills(1), 100);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <h3 className={s.cardTitle}>
          📋 All Waybills
          <span className={s.totalBadge}>{total} total</span>
        </h3>
      </div>

      <div className={s.cardBody}>
        {/* Filters */}
        <div className={s.filterRow}>
          <input
            className={s.filterInput}
            placeholder="🔍  Search by AWB no, invoice no, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <select className={s.filterSelect} value={product} onChange={(e) => setProduct(e.target.value)}>
            <option value="">All products</option>
            <option value="BY AIR">✈️ By Air</option>
            <option value="BY ROAD">🚛 By Road</option>
          </select>
          <input className={s.filterInput} type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <input className={s.filterInput} type="date" value={toDate}   onChange={(e) => setToDate(e.target.value)} />
          <div className={s.filterBtns}>
            <button className={s.btnSearch} onClick={handleSearch}>Search</button>
            <button className={s.btnReset}  onClick={handleReset}>Reset</button>
          </div>
        </div>

        {loading ? (
          <div className={s.loadingState}>⏳ Loading waybills...</div>
        ) : waybills.length === 0 ? (
          <div className={s.emptyState}>
            <span className={s.emptyIcon}>📭</span>
            <p className={s.emptyTitle}>No waybills found</p>
            <p className={s.emptyDesc}>Generate your first waybill from the Generate Waybill tab</p>
          </div>
        ) : (
          <>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>AWB No</th>
                    <th>Invoice No</th>
                    <th>Customer Name</th>
                    <th>Product</th>
                    <th>Destination</th>
                    <th>Invoice Amount</th>
                    <th>Invoice Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {waybills.map((w) => (
                    <tr key={w.DocEntry}>
                      <td><span className={s.awbNo}>{w.AWBNo}</span></td>
                      <td><span className={s.invoiceNo}>#{w.DocNum}</span></td>
                      <td className={s.customerName}>{w.CardName}</td>
                      <td>
                        <span className={`${s.badge} ${w.ProductType === "BY AIR" ? s.badgeAir : s.badgeRoad}`}>
                          {w.ProductType === "BY AIR" ? "✈️ By Air" : "🚛 By Road"}
                        </span>
                      </td>
                      <td>{w.DestCity || "—"} {w.DestPincode ? `— ${w.DestPincode}` : ""}</td>
                      <td>₹{w.DocTotal?.toLocaleString("en-IN")}</td>
                      <td>{w.DocDate ? new Date(w.DocDate).toLocaleDateString("en-IN") : "—"}</td>
                      <td>
                        <span className={`${s.badge} ${w.DocStatus === "Open" ? s.badgeOpen : s.badgeClosed}`}>
                          {w.DocStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={s.paginationRow}>
                <span className={s.paginationInfo}>
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} waybills
                </span>
                <div className={s.paginationBtns}>
                  <button
                    className={s.pageBtn}
                    disabled={page === 1}
                    onClick={() => { setPage(page - 1); fetchWaybills(page - 1); }}
                  >‹</button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                    <button
                      key={i + 1}
                      className={`${s.pageBtn} ${page === i + 1 ? s.pageBtnActive : ""}`}
                      onClick={() => { setPage(i + 1); fetchWaybills(i + 1); }}
                    >{i + 1}</button>
                  ))}
                  <button
                    className={s.pageBtn}
                    disabled={page === totalPages}
                    onClick={() => { setPage(page + 1); fetchWaybills(page + 1); }}
                  >›</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}