// components/waybill/UpdateDeliveryDate.js
// Warehouse-driven manual backfill for OINV.U_DeliveryDate — almost nothing
// in this app sets it automatically, so it's left empty until someone fills
// it in. Flow: upload an Excel of {Waybill Number, Delivery Date} -> parsed
// in the browser only, nothing saved server-side -> "Check What Will
// Update" runs a dry run against the DB and shows exactly which invoices
// would change -> "Confirm & Update" commits it.
//
// Strict Excel format on purpose (per the request this was built from):
// exactly two columns, headers "Waybill Number" and "Delivery Date" only —
// anything else is rejected outright.

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import s from "./UpdateDeliveryDate.module.css";

const ID_HEADER = "waybill number";
const DATE_HEADER = "delivery date";

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["Waybill Number", "Delivery Date"],
    ["TS07UJ4376", new Date()],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "Delivery Dates");
  XLSX.writeFile(wb, "delivery_date_update_template.xlsx");
}

// Every parsed date is normalized to a clean UTC midnight of the intended
// calendar day — never a local-time Date — and always read back with the
// UTC getters below. Two independent timezone bugs were found by mixing
// local and UTC at different points (one server-side, since fixed in
// update-delivery-date.js; one here, from the xlsx library's own serial->
// Date conversion landing a few seconds before UTC midnight of the PREVIOUS
// day due to floating-point rounding — confirmed directly against the real
// library). Anchoring everything to UTC and rounding real Excel-date cells
// to the nearest day boundary neutralizes both at once.
const pad2 = (n) => String(n).padStart(2, "0");
// Wire format sent to the API (update-delivery-date.js expects YYYY-MM-DD) —
// internal only, never shown to the user.
const toISODate = (d) => `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
// Display format shown in this UI — matches the one input format accepted.
const toDMYDate = (d) => `${pad2(d.getUTCDate())}-${pad2(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`;
const isoToDMY = (isoStr) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoStr || "");
  return m ? `${m[3]}-${m[2]}-${m[1]}` : isoStr;
};

const DMY_DASH_RE = /^(\d{2})-(\d{2})-(\d{4})$/;  // DD-MM-YYYY — the only accepted text format
const DAY_MS = 86400000;

const isValidYMD = (y, m, d) => {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};

// Excel date cells come through as JS Date objects (XLSX.read with
// cellDates:true) — that's the recommended path and needs no typed format
// at all, but the xlsx library's serial->Date conversion can land a few
// seconds off true UTC midnight, which reading the wrong day boundary off
// of would misread as the previous day — round to the nearest day first.
// A plain typed-text cell is only accepted as "DD-MM-YYYY" (the one format
// this team uses), parsed by hand rather than handed to JS's generic Date
// parser — any other text (ISO, slashes, anything mixed) is rejected on
// purpose, so there's exactly one format to teach and no silent guessing.
function parseDateCell(raw) {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return new Date(Math.round(raw.getTime() / DAY_MS) * DAY_MS);
  }
  if (typeof raw !== "string") return null;
  const m = DMY_DASH_RE.exec(raw.trim());
  if (!m) return null;
  const [, d, mo, y] = m.map(Number);
  return isValidYMD(y, mo, d) ? new Date(Date.UTC(y, mo - 1, d)) : null;
}

// Reads the sheet and validates its shape. Returns { rows, error }.
function parseWorkbook(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });

  if (aoa.length < 2) {
    return { error: "The uploaded file has no data rows." };
  }

  const headerRow = aoa[0].map((h) => String(h ?? "").trim());
  if (headerRow.length !== 2) {
    return { error: `The file must have exactly 2 columns — found ${headerRow.length}. Download the template and use it as-is.` };
  }

  const normalized = headerRow.map((h) => h.toLowerCase());
  const idIdx = normalized.indexOf(ID_HEADER);
  const dateIdx = normalized.indexOf(DATE_HEADER);

  if (idIdx === -1 || dateIdx === -1) {
    return {
      error: `Column names didn't match. Expected "Waybill Number" and "Delivery Date" — got "${headerRow[0]}" and "${headerRow[1]}".`,
    };
  }

  const rows = aoa
    .slice(1)
    .filter((r) => r.some((c) => c !== "" && c != null))
    .map((r, i) => {
      const waybillNo = String(r[idIdx] ?? "").trim();
      const dateObj = parseDateCell(r[dateIdx]);
      return {
        rowNum: i + 2,
        waybillNo,
        dateObj,
        dateDisplay: dateObj ? toDMYDate(dateObj) : String(r[dateIdx] ?? ""),
        valid: !!waybillNo && !!dateObj,
      };
    });

  if (rows.length === 0) {
    return { error: "No usable rows found in the file." };
  }

  return { rows };
}

const BADGE = {
  pending:     { cls: "badgePending",    label: "Will update" },
  updated:     { cls: "badgeUpdated",    label: "Updated" },
  already_set: { cls: "badgeAlreadySet", label: "Already set" },
  not_found:   { cls: "badgeNotFound",   label: "Not found" },
  error:       { cls: "badgeError",      label: "Error" },
};

export default function UpdateDeliveryDate() {
  const [parsedRows, setParsedRows] = useState([]);
  const [fileName, setFileName]   = useState("");
  const [dragging, setDragging]   = useState(false);
  const [parseError, setParseError] = useState("");
  const [checking, setChecking]   = useState(false);
  const [committing, setCommitting] = useState(false);
  const [preview, setPreview]     = useState(null); // dry-run API response
  const [final, setFinal]         = useState(null); // committed API response
  const inputRef                  = useRef();

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  const reset = () => {
    setParsedRows([]); setFileName(""); setParseError("");
    setPreview(null); setFinal(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = (file) => {
    if (!file) return;
    reset();
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const { rows, error } = parseWorkbook(e.target.result);
      if (error) { setParseError(error); return; }
      setParsedRows(rows);
    };
    reader.readAsArrayBuffer(file);
  };

  const callApi = async (commit) => {
    const validRows = parsedRows.filter((r) => r.valid);
    const res = await fetch("/api/bluedart/update-delivery-date", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        commit,
        rows: validRows.map((r) => ({ waybillNo: r.waybillNo, date: toISODate(r.dateObj) })),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  };

  const handleCheck = async () => {
    setChecking(true); setParseError(""); setPreview(null); setFinal(null);
    try { setPreview(await callApi(false)); }
    catch (e) { setParseError(e.message); }
    finally { setChecking(false); }
  };

  const handleConfirm = async () => {
    setCommitting(true); setParseError("");
    try { setFinal(await callApi(true)); }
    catch (e) { setParseError(e.message); }
    finally { setCommitting(false); }
  };

  const invalidCount = parsedRows.filter((r) => !r.valid).length;
  const canCheck = parsedRows.length > 0 && parsedRows.some((r) => r.valid) && !preview;
  const canConfirm = preview && !final && preview.summary.updated > 0;
  const displayResults = final?.results || preview?.results;
  const displaySummary = final?.summary || preview?.summary;

  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <h3 className={s.cardTitle}>📅 Update Delivery Date</h3>
      </div>
      <div className={s.cardBody}>
        <div className={s.infoBox}>
          <span>ℹ️</span>
          <p className={s.infoText}>
            Upload an Excel file with exactly two columns — <code>Waybill Number</code> and{" "}
            <code>Delivery Date</code> — to fill in the Delivery Date for every invoice under that
            waybill number. Nothing is saved on the server; the file is read in your browser only.
            <br />
            <strong>Date format:</strong> format the Delivery Date column as an actual Excel date
            (recommended — this is what the template below uses), or type it as plain text in{" "}
            <code>DD-MM-YYYY</code> form only, e.g. <code>29-07-2026</code>. No other text format
            (<code>YYYY-MM-DD</code>, slashes, etc.) is accepted — a row with an unrecognized date
            is skipped rather than guessed at, so check the "row(s) read / invalid" count after
            uploading.
          </p>
        </div>

        <div className={s.warnBox}>
          <span>⚠️</span>
          <p className={s.warnText}>
            The same waybill number is reused across many unrelated invoices over time, so this only
            ever fills in invoices that don't already have a Delivery Date — it never overwrites one
            that's already recorded. Any format other than the exact two columns above is rejected.
          </p>
        </div>

        <button className={s.templateBtn} onClick={downloadTemplate}>
          ⬇️ Download Excel Template
        </button>

        {!fileName && (
          <div
            className={`${s.dropZone} ${dragging ? s.dropZoneActive : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
            onClick={() => inputRef.current?.click()}
          >
            <span className={s.dropIcon}>📂</span>
            <p className={s.dropTitle}>Drag & drop your Excel file here</p>
            <p className={s.dropSubtitle}>.xlsx or .xls — two columns only</p>
            <span className={s.browseBtn}>Browse File</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files?.[0])} />

        {fileName && (
          <div className={s.fileLoaded}>
            <div className={s.fileLoadedInfo}>
              <span className={s.fileIcon}>📄</span>
              <div>
                <div className={s.fileName}>{fileName}</div>
                {parsedRows.length > 0 && (
                  <div className={s.fileCount}>
                    {parsedRows.length} row(s) read{invalidCount > 0 ? `, ${invalidCount} invalid` : ""}
                  </div>
                )}
              </div>
            </div>
            <button className={s.clearBtn} onClick={reset}>Remove</button>
          </div>
        )}

        {parseError && <div className={s.alertDanger}>⚠️ {parseError}</div>}

        {invalidCount > 0 && !displayResults && (
          <div className={s.alertDanger}>
            ⚠️ {invalidCount} of {parsedRows.length} row(s) have a missing waybill number or a date
            that didn't match <code>DD-MM-YYYY</code> — row(s){" "}
            {parsedRows.filter((r) => !r.valid).map((r) => r.rowNum).join(", ")} will be{" "}
            <strong>skipped entirely</strong> (not sent, not updated). Fix those rows in the Excel
            and re-upload if they also need updating.
          </div>
        )}

        {parsedRows.length > 0 && !displayResults && (
          <>
            <p className={s.sectionLabel}>Preview — first 5 rows</p>
            <table className={s.table}>
              <thead>
                <tr><th>Row</th><th>Waybill Number</th><th>Delivery Date (DD-MM-YYYY)</th></tr>
              </thead>
              <tbody>
                {parsedRows.slice(0, 5).map((r) => (
                  <tr key={r.rowNum} className={r.valid ? "" : s.rowInvalid}>
                    <td>{r.rowNum}</td>
                    <td>{r.waybillNo || <em>missing</em>}</td>
                    <td>{r.dateDisplay || <em>invalid date</em>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {displaySummary && (
          <>
            <p className={s.sectionLabel}>{final ? "✅ Update Complete" : "Preview — nothing written yet"}</p>
            <div className={s.summaryBar}>
              <div className={s.statItem}>
                <div className={`${s.statNum} ${final ? s.statUpdated : s.statPending}`}>{displaySummary.updated}</div>
                <div className={s.statLabel}>{final ? "Updated" : "Will update"}</div>
              </div>
              <div className={s.statItem}>
                <div className={s.statNum}>{displaySummary.alreadySet}</div>
                <div className={s.statLabel}>Already set</div>
              </div>
              <div className={s.statItem}>
                <div className={`${s.statNum} ${s.statFail}`}>{displaySummary.notFound}</div>
                <div className={s.statLabel}>Not found</div>
              </div>
              <div className={s.statItem}>
                <div className={`${s.statNum} ${s.statFail}`}>{displaySummary.failed}</div>
                <div className={s.statLabel}>Errors</div>
              </div>
            </div>

            <table className={s.table}>
              <thead>
                <tr><th>Waybill Number</th><th>Delivery Date</th><th>Status</th><th>Invoices</th></tr>
              </thead>
              <tbody>
                {displayResults.map((r, i) => {
                  const badge = BADGE[r.status] || BADGE.error;
                  return (
                    <tr key={i}>
                      <td>{r.waybillNo}</td>
                      <td>{isoToDMY(r.date)}</td>
                      <td><span className={`${s.badge} ${s[badge.cls]}`}>{badge.label}</span></td>
                      <td className={s.docNums}>
                        {r.docNums?.length ? r.docNums.join(", ") : r.message}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {final && (
          <div className={s.alertSuccess}>
            ✅ Done. {final.summary.updated} invoice-group(s) updated. You can upload another file below.
          </div>
        )}

        <div className={s.footer}>
          <span className={s.footerNote}>Accepts .xlsx / .xls only — exactly 2 columns</span>
          <div className={s.btnGroup}>
            {(parsedRows.length > 0 || preview || final) && (
              <button className={s.secondaryBtn} onClick={reset}>Start Over</button>
            )}
            {canCheck && (
              <button className={s.primaryBtn} onClick={handleCheck} disabled={checking}>
                {checking ? "⏳ Checking..." : "🔍 Check What Will Update"}
              </button>
            )}
            {canConfirm && (
              <button className={s.confirmBtn} onClick={handleConfirm} disabled={committing}>
                {committing ? "⏳ Updating..." : `✅ Confirm & Update ${preview.summary.updated} Invoice-Group(s)`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
