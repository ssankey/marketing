// components/waybill/CancelWaybill.js
import { useState } from "react";
import s from "./CancelWaybill.module.css";

export default function CancelWaybill() {
  const [awbNo, setAwbNo]           = useState("");
  const [docEntry, setDocEntry]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed]   = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirmed) { setError("Please check the confirmation box before cancelling."); return; }
    setSubmitting(true); setResult(null); setError("");
    try {
      const res  = await fetch("/api/bluedart/cancel-waybill", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ awbNo, docEntry: docEntry || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancellation failed");
      setResult(data);
      setAwbNo(""); setDocEntry(""); setConfirmed(false);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <h3 className={s.cardTitle}>❌ Cancel Waybill</h3>
      </div>
      <div className={s.cardBody}>
        <div className={s.warningBox}>
          <span className={s.warningIcon}>⚠️</span>
          <div>
            <p className={s.warningTitle}>Important — Read before cancelling</p>
            <p className={s.warningText}>
              A waybill can only be cancelled <strong>before</strong> the shipment is picked up
              and in-scanned by Blue Dart. Once cancelled, this action <strong>cannot be undone</strong>.
              The tracking number in the SAP invoice will also be automatically cleared.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={s.formRow}>
            <div className={s.fieldGroup}>
              <label className={s.fieldLabel}>
                Blue Dart Waybill Number (AWB) <span className={s.required}>*</span>
              </label>
              <input
                className={s.fieldInput}
                placeholder="e.g. 58129200356"
                value={awbNo}
                onChange={(e) => { setAwbNo(e.target.value); setResult(null); setError(""); }}
                required
              />
              <span className={s.fieldHint}>Enter the AWB number you want to cancel</span>
            </div>
            <div className={s.fieldGroup}>
              <label className={s.fieldLabel}>
                SAP Invoice DocEntry <span className={s.optional}>(optional but recommended)</span>
              </label>
              <input
                type="number"
                className={s.fieldInput}
                placeholder="e.g. 11513"
                value={docEntry}
                onChange={(e) => setDocEntry(e.target.value)}
              />
              <span className={s.fieldHint}>
                Providing this ensures the correct SAP invoice TrackNo is cleared
              </span>
            </div>
          </div>

          {/* Confirmation checkbox */}
          <div className={s.confirmRow} onClick={() => setConfirmed(!confirmed)}>
            <input
              type="checkbox"
              className={s.confirmCheckbox}
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
            <label className={s.confirmLabel}>
              I understand this cancellation is permanent and cannot be reversed.
              The waybill and SAP tracking number will both be cleared.
            </label>
          </div>

          {error  && (
            <div className={s.alertDanger}>
              <span className={s.alertIcon}>⚠️</span>
              <div><p className={s.alertTitle}>Error</p><p className={s.alertBody}>{error}</p></div>
            </div>
          )}
          {result && (
            <div className={s.alertSuccess}>
              <span className={s.alertIcon}>✅</span>
              <div>
                <p className={s.alertTitle}>Waybill Cancelled Successfully</p>
                <p className={s.alertBody}>
                  AWB <strong>{result.AWBNo}</strong> has been cancelled.
                  {" "}{result.StatusInformation} SAP invoice TrackNo has been cleared.
                </p>
              </div>
            </div>
          )}

          <div className={s.footer}>
            <button type="submit" className={s.cancelBtn} disabled={submitting || !awbNo}>
              {submitting ? "⏳ Cancelling..." : "❌ Cancel Waybill"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}