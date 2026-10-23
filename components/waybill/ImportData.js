// components/waybill/ImportData.js
import { useState, useRef } from "react";
import s from "./ImportData.module.css";

const TEMPLATE_HEADERS = [
  "docEntry","docNum","consigneeName","consigneeAddress1","consigneeAddress2",
  "consigneePincode","consigneeMobile","consigneeEmail","productCode",
  "productType","pieceCount","actualWeight","declaredValue",
  "pickupDate","pickupTime","subProductCode","commodityDetail1",
  "dimLength","dimBreadth","dimHeight",
];

function downloadTemplate() {
  const sample = [
    "12345","26211788","R V CHEMICALS","Plot No 45 GIDC","Phase 2 Vatva",
    "382445","9998887776","info@rvchemicals.com","A",
    "1","1","0.50","45000",
    new Date().toISOString().split("T")[0],"1000","P","Chemical reagents",
    "30","20","10",
  ];
  const csv  = [TEMPLATE_HEADERS.join(","), sample.join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "bluedart_import_template.csv"; a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) throw new Error("CSV must have header row + at least 1 data row");
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
    return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i] || "" }), {});
  });
}

export default function ImportData() {
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState([]);
  const [dragging, setDragging]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState("");
  const inputRef                  = useRef();

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  const handleFile = (f) => {
    if (!f) return;
    setFile(f); setResult(null); setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try { setPreview(parseCSV(e.target.result).slice(0, 5)); }
      catch (err) { setError(err.message); }
    };
    reader.readAsText(f);
  };

  const handleSubmit = async () => {
    if (!file) { setError("Please upload a CSV file first."); return; }
    setSubmitting(true); setError(""); setResult(null);
    try {
      const text      = await file.text();
      const shipments = parseCSV(text);
      const res       = await fetch("/api/bluedart/import-waybill", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shipments }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult(data);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const previewCols = preview.length > 0 ? Object.keys(preview[0]).slice(0, 7) : [];

  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <h3 className={s.cardTitle}>📤 Import Data — Bulk Waybill Generation</h3>
      </div>
      <div className={s.cardBody}>
        <div className={s.infoBox}>
          <span>ℹ️</span>
          <p className={s.infoText}>
            Generate multiple waybills at once. Download the template CSV, fill in one shipment per row
            with all required details, then upload it here. All waybills will be generated and
            SAP invoices updated automatically.
          </p>
        </div>

        <button className={s.templateBtn} onClick={downloadTemplate}>
          ⬇️ Download CSV Template
        </button>

        {/* Drop zone */}
        <div
          className={`${s.dropZone} ${dragging ? s.dropZoneActive : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
          onClick={() => inputRef.current?.click()}
        >
          <span className={s.dropIcon}>📂</span>
          <p className={s.dropTitle}>Drag & drop your CSV file here</p>
          <p className={s.dropSubtitle}>or click to browse from your computer</p>
          <span className={s.browseBtn}>Browse File</span>
          <input ref={inputRef} type="file" accept=".csv" style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files?.[0])} />
        </div>

        {/* File loaded indicator */}
        {file && (
          <div className={s.fileLoaded}>
            <span className={s.fileIcon}>📄</span>
            <div>
              <div className={s.fileName}>{file.name}</div>
              <div className={s.fileCount}>{preview.length} rows loaded in preview</div>
            </div>
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <>
            <p className={s.previewLabel}>Preview — first 5 rows</p>
            <table className={s.previewTable}>
              <thead>
                <tr>
                  {previewCols.map((h) => <th key={h}>{h}</th>)}
                  <th>...</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>
                    {previewCols.map((h) => <td key={h}>{row[h]}</td>)}
                    <td>...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {error  && <div className={s.alertDanger}>⚠️ {error}</div>}

        {result && (
          <div className={s.resultCard}>
            <p className={s.resultTitle}>✅ Import Complete!</p>
            <div className={s.resultStats}>
              <div className={s.statItem}>
                <div className={`${s.statNum} ${s.statSuccess}`}>{result.summary?.successful}</div>
                <div className={s.statLabel}>Successful</div>
              </div>
              <div className={s.statItem}>
                <div className={`${s.statNum} ${s.statFail}`}>{result.summary?.failed}</div>
                <div className={s.statLabel}>Failed</div>
              </div>
              <div className={s.statItem}>
                <div className={s.statNum}>{result.summary?.total}</div>
                <div className={s.statLabel}>Total</div>
              </div>
            </div>
          </div>
        )}

        <div className={s.footer}>
          <span className={s.footerNote}>Accepts .csv files only</span>
          <button className={s.uploadBtn} onClick={handleSubmit} disabled={submitting || !file}>
            {submitting ? "⏳ Uploading..." : "📤 Upload & Generate Waybills"}
          </button>
        </div>
      </div>
    </div>
  );
}