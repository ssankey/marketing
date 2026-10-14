// components/waybill/UpdateEwaybill.js
import { useState } from "react";
import s from "./UpdateEwaybill.module.css";

const TODAY = new Date().toISOString().split("T")[0];

export default function UpdateEwaybill() {
  const [form, setForm] = useState({
    awbNo: "", eWaybillNumber: "", invoiceNumber: "",
    invoiceDate: TODAY, eWaybillDate: TODAY,
    sellerGSTNo: "", totalValue: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setResult(null); setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setResult(null); setError("");
    try {
      const res  = await fetch("/api/bluedart/update-ewaybill", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setResult(data);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <h3 className={s.cardTitle}>🔄 Update E-Waybill Number</h3>
      </div>
      <div className={s.cardBody}>
        <div className={s.infoBox}>
          <span>ℹ️</span>
          <p className={s.infoText}>
            Link your <strong>GST E-Waybill number</strong> (generated from the GST portal)
            to a Blue Dart waybill. This is required for shipments above ₹50,000 as per GST regulations.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={s.formGrid2}>
            <div className={s.fieldGroup}>
              <label className={s.fieldLabel}>Blue Dart AWB No <span className={s.required}>*</span></label>
              <input name="awbNo" className={s.fieldInput} placeholder="e.g. 58129200356" value={form.awbNo} onChange={handleChange} required />
            </div>
            <div className={s.fieldGroup}>
              <label className={s.fieldLabel}>E-Waybill Number <span className={s.required}>*</span></label>
              <input name="eWaybillNumber" className={s.fieldInput} placeholder="e.g. 125478547851" value={form.eWaybillNumber} onChange={handleChange} required />
            </div>
          </div>

          <div className={s.formGrid2}>
            <div className={s.fieldGroup}>
              <label className={s.fieldLabel}>Invoice Number <span className={s.required}>*</span></label>
              <input name="invoiceNumber" className={s.fieldInput} placeholder="e.g. INV-2026-001" value={form.invoiceNumber} onChange={handleChange} required />
            </div>
            <div className={s.fieldGroup}>
              <label className={s.fieldLabel}>Total Invoice Value (₹)</label>
              <input type="number" name="totalValue" className={s.fieldInput} placeholder="e.g. 75000" value={form.totalValue} onChange={handleChange} />
            </div>
          </div>

          <div className={s.formGrid3}>
            <div className={s.fieldGroup}>
              <label className={s.fieldLabel}>Invoice Date <span className={s.required}>*</span></label>
              <input type="date" name="invoiceDate" className={s.fieldInput} value={form.invoiceDate} onChange={handleChange} required />
            </div>
            <div className={s.fieldGroup}>
              <label className={s.fieldLabel}>E-Waybill Date <span className={s.required}>*</span></label>
              <input type="date" name="eWaybillDate" className={s.fieldInput} value={form.eWaybillDate} onChange={handleChange} required />
            </div>
            <div className={s.fieldGroup}>
              <label className={s.fieldLabel}>Seller GST Number <span className={s.required}>*</span></label>
              <input name="sellerGSTNo" className={s.fieldInput} placeholder="e.g. 09XXXXX1234F1Z5" value={form.sellerGSTNo} onChange={handleChange} required />
            </div>
          </div>

          {error  && <div className={s.alertDanger}><span>⚠️</span><div><p className={s.alertTitle}>Error</p><p className={s.alertBody}>{error}</p></div></div>}
          {result && <div className={s.alertSuccess}><span>✅</span><div><p className={s.alertTitle}>Updated successfully!</p><p className={s.alertBody}>{result.StatusInformation || "E-Waybill number has been linked to your Blue Dart waybill."}</p></div></div>}

          <div className={s.footer}>
            <button type="submit" className={s.submitBtn} disabled={submitting}>
              {submitting ? "⏳ Updating..." : "🔄 Update E-Waybill"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}