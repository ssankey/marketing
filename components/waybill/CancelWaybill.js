// components/waybill/CancelWaybill.js
import { useState } from "react";
import s from "./CancelWaybill.module.css";

export default function CancelWaybill() {
  const [awbNo, setAwbNo]           = useState("");
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
        body: JSON.stringify({ awbNo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancellation failed");
      setResult(data);
      setAwbNo(""); setConfirmed(false);
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
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={s.fieldGroup} style={{marginBottom:"1rem"}}>
            <label className={s.fieldLabel}>
              Blue Dart Waybill Number (AWB) <span className={s.required}>*</span>
            </label>
            <input
              className={s.fieldInput}
              placeholder="e.g. 53452130443"
              value={awbNo}
              onChange={(e) => { setAwbNo(e.target.value); setResult(null); setError(""); }}
              required
            />
            <span className={s.fieldHint}>Enter the AWB number you want to cancel</span>
          </div>

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
            </label>
          </div>

          {error && (
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
                  AWB <strong>{result.AWBNo}</strong> has been cancelled. {result.StatusInformation}
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