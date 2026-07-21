
// components/waybill/AllWaybills.js
import { useState, useEffect } from "react";
import s from "./AllWaybills.module.css";

const PAGE_SIZE = 20;

// Status color mapping
function getStatusStyle(statusType) {
  const map = {
    "DL": { bg: "#d1fae5", color: "#065f46", label: "Delivered" },
    "UD": { bg: "#dbeafe", color: "#1d4ed8", label: "In Transit" },
    "PU": { bg: "#fef3c7", color: "#92400e", label: "Picked Up" },
    "OD": { bg: "#ede9fe", color: "#6d28d9", label: "Out for Delivery" },
    "RT": { bg: "#fee2e2", color: "#991b1b", label: "Returned" },
  };
  return map[statusType] || { bg: "#f1f5f9", color: "#475569", label: statusType || "Unknown" };
}

async function downloadPdf(awbNo, token) {
  try {
    const res = await fetch(`/api/bluedart/download-waybill-pdf?awbNo=${awbNo}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { alert("PDF not found for this waybill"); return; }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `BlueDart_AWB_${awbNo}.pdf`;
    link.click(); URL.revokeObjectURL(url);
  } catch (e) { alert("Failed to download PDF"); }
}

async function downloadNonHazPdfFile(awbNo, token) {
  try {
    const res = await fetch(`/api/bluedart/non-haz-pdf?awbNo=${awbNo}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 409) {
      const data = await res.json().catch(() => ({}));
      return { needsPieceCount: true, message: data.error };
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.error || "Failed to generate Non-Haz PDF" };
    }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `NonHaz_${awbNo}.pdf`;
    link.click(); URL.revokeObjectURL(url);
    return { success: true };
  } catch (e) {
    return { error: "Failed to download Non-Haz PDF" };
  }
}

async function savePieceCount(waybillNo, pieceCount, token) {
  const res = await fetch(`/api/bluedart/save-piece-count`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ waybillNo, pieceCount }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to save piece count");
  return data;
}

// ── Tracking Modal ────────────────────────────────────────────────────────────
function TrackingModal({ awbNo, token, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState(null);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!awbNo) return;
    setLoading(true); setError("");
    fetch(`/api/bluedart/track-waybill?awbNo=${awbNo}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [awbNo]);

  const statusStyle = data ? getStatusStyle(data.statusType) : null;

 

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={s.modalHeader}>
          <div>
            <div className={s.modalTitle}>Shipment Tracking</div>
            <div className={s.modalAwb}>AWB # {awbNo}</div>
          </div>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={s.modalBody}>
          {loading && (
            <div className={s.trackLoading}>
              <div className={s.spinner} />
              <span>Fetching tracking details...</span>
            </div>
          )}

          {error && (
            <div className={s.trackError}>
              ⚠️ {error}
            </div>
          )}

          {data && !loading && (
            <>
              {/* Status Banner */}
              <div className={s.statusBanner} style={{ background: statusStyle.bg, borderColor: statusStyle.color + "44" }}>
                <div className={s.statusDot} style={{ background: statusStyle.color }} />
                <div>
                  <div className={s.statusLabel} style={{ color: statusStyle.color }}>{data.status}</div>
                  <div className={s.statusMeta}>{data.statusDate} {data.statusTime && `at ${data.statusTime}`}</div>
                </div>
                {data.receivedBy && <div className={s.receivedBy}>Received by: <strong>{data.receivedBy}</strong></div>}
              </div>

              {/* Shipment Info */}
              <div className={s.infoGrid}>
                <div className={s.infoItem}><span className={s.infoLabel}>Service</span><span className={s.infoValue}>{data.service || "—"}</span></div>
                <div className={s.infoItem}><span className={s.infoLabel}>Origin</span><span className={s.infoValue}>{data.origin || "—"}</span></div>
                <div className={s.infoItem}><span className={s.infoLabel}>Destination</span><span className={s.infoValue}>{data.destination || "—"}</span></div>
                <div className={s.infoItem}><span className={s.infoLabel}>Weight</span><span className={s.infoValue}>{data.weight ? `${data.weight} kg` : "—"}</span></div>
                <div className={s.infoItem}><span className={s.infoLabel}>Pickup Date</span><span className={s.infoValue}>{data.pickupDate || "—"}</span></div>
                <div className={s.infoItem}><span className={s.infoLabel}>Expected Delivery</span><span className={s.infoValue}>{data.expectedDel || "—"}</span></div>
              </div>

              {/* Scan Timeline */}
              {data.scans?.length > 0 && (
                <div className={s.timeline}>
                  <div className={s.timelineTitle}>Scan History</div>
                  {data.scans.map((scan, i) => (
                    <div key={i} className={`${s.timelineItem} ${i === 0 ? s.timelineItemFirst : ""}`}>
                      <div className={s.timelineDot} />
                      <div className={s.timelineContent}>
                        <div className={s.timelineScan}>{scan.scan}</div>
                        <div className={s.timelineMeta}>
                          {scan.scannedLocation && <span>{scan.scannedLocation}</span>}
                          {scan.scanDate && <span>{scan.scanDate} {scan.scanTime && `at ${scan.scanTime}`}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Piece Count Modal ─────────────────────────────────────────────────────────
function PieceCountModal({ awbNo, token, onClose, onSaved }) {
  const [pieceCount, setPieceCount] = useState("");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  const handleSave = async () => {
    const pc = parseInt(pieceCount);
    if (!pc || pc <= 0) { setError("Enter a valid piece count"); return; }
    setSaving(true); setError("");
    try {
      await savePieceCount(awbNo, pc, token);
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div className={s.modalHeader}>
          <div>
            <div className={s.modalTitle}>Piece Count Required</div>
            <div className={s.modalAwb}>AWB # {awbNo}</div>
          </div>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={s.modalBody}>
          <p style={{ fontSize: 13, color: "#475569", marginBottom: 12 }}>
            This waybill isn't one we generated, so we don't have a piece count for it.
            Enter it once below — it'll be saved for next time.
          </p>
          <input
            type="number"
            min="1"
            autoFocus
            placeholder="e.g. 1"
            value={pieceCount}
            onChange={e => { setPieceCount(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            style={{
              width: "100%", padding: "8px 10px", fontSize: 14,
              border: "1px solid #cbd5e1", borderRadius: 6, marginBottom: 8,
            }}
          />
          {error && <div style={{ color: "#b91c1c", fontSize: 12.5, marginBottom: 8 }}>{error}</div>}
          <button
            className={s.trackBtn}
            disabled={saving}
            onClick={handleSave}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {saving ? "Saving..." : "Save & Download"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AllWaybills() {
  const [waybills, setWaybills] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate]     = useState("");
  const [product, setProduct]   = useState("");
  const [trackingAwb, setTrackingAwb] = useState(null);
  const [pieceCountAwb, setPieceCountAwb] = useState(null);

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
          <input className={s.filterInput} placeholder="🔍  Search by AWB no, invoice no, customer..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} />
          <select className={s.filterSelect} value={product} onChange={e => setProduct(e.target.value)}>
            <option value="">All products</option>
            <option value="BY AIR">✈️ By Air</option>
            <option value="BY ROAD">🚛 By Road</option>
          </select>
          <input className={s.filterInput} type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <input className={s.filterInput} type="date" value={toDate}   onChange={e => setToDate(e.target.value)} />
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
                    <th>Non-Haz PDF</th>
                    <th>Invoice No</th>
                    <th>Customer Name</th>
                    <th>Product</th>
                    <th>Invoice Amount</th>
                    <th>Invoice Date</th>
                    <th>Track</th>
                  </tr>
                </thead>
                <tbody>
                  {waybills.map((w) => (
                    <tr key={w.DocEntry}>
                      {/* <td><span className={s.awbNo}>{w.AWBNo}</span></td> */}
                      <td>
                          <div style={{display:"flex", alignItems:"center", gap:"6px"}}>
                            <span className={s.awbNo}>{w.AWBNo}</span>
                            <button
                              className={s.pdfBtn}
                              title="Download Waybill PDF"
                              onClick={() => downloadPdf(w.AWBNo, token)}
                            >
                              📄
                            </button>
                          </div>
                      </td>
                      <td>
                             <button
                               className={s.pdfBtn}
                               title="Download Non-Hazardous Cargo Certificate"
                               onClick={async () => {
                                 const result = await downloadNonHazPdfFile(w.AWBNo, token);
                                 if (result.needsPieceCount) {
                                   setPieceCountAwb(w.AWBNo);
                                 } else if (result.error) {
                                   alert(result.error);
                                 }
                               }}
                             >
                                 📄 Non-Haz
                            </button>
                      </td>
                      <td><span className={s.invoiceNo}>#{w.DocNum}</span></td>
                      <td className={s.customerName}>{w.CardName}</td>
                      <td>
                        <span className={`${s.badge} ${w.ProductType === "BY AIR" ? s.badgeAir : s.badgeRoad}`}>
                          {w.ProductType === "BY AIR" ? "✈️ By Air" : "🚛 By Road"}
                        </span>
                      </td>
                      <td>₹{w.DocTotal?.toLocaleString("en-IN")}</td>
                      <td>{w.DocDate ? new Date(w.DocDate).toLocaleDateString("en-IN") : "—"}</td>
                      <td>
                        <button
                          className={s.trackBtn}
                          onClick={() => setTrackingAwb(w.AWBNo)}
                        >
                          🔍 Track
                        </button>
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
                  <button className={s.pageBtn} disabled={page === 1} onClick={() => { setPage(page - 1); fetchWaybills(page - 1); }}>‹</button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                    <button key={i + 1} className={`${s.pageBtn} ${page === i + 1 ? s.pageBtnActive : ""}`} onClick={() => { setPage(i + 1); fetchWaybills(i + 1); }}>{i + 1}</button>
                  ))}
                  <button className={s.pageBtn} disabled={page === totalPages} onClick={() => { setPage(page + 1); fetchWaybills(page + 1); }}>›</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Tracking Modal */}
      {trackingAwb && (
        <TrackingModal
          awbNo={trackingAwb}
          token={token}
          onClose={() => setTrackingAwb(null)}
        />
      )}

      {/* Piece Count Modal */}
      {pieceCountAwb && (
        <PieceCountModal
          awbNo={pieceCountAwb}
          token={token}
          onClose={() => setPieceCountAwb(null)}
          onSaved={async () => {
            setPieceCountAwb(null);
            const result = await downloadNonHazPdfFile(pieceCountAwb, token);
            if (result.error) alert(result.error);
          }}
        />
      )}
    </div>
  );
}