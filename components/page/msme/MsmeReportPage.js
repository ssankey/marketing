// components/page/msme/MsmeReportPage.js
// Upload the MSME vendor list + view/search/export the FY 2025-26 outstanding report.

import { useState, useEffect, useCallback, useRef } from "react";
import { Container } from "react-bootstrap";
import * as XLSX from "xlsx";
import downloadExcel from "utils/exporttoexcel";
import { formatCurrency } from "utils/formatCurrency";
import s from "./MsmeReportPage.module.css";

const PAGE_SIZE = 20;
const EXPECTED_HEADERS = ["Sr No.", "Vendor Name", "MSME Registration Number", "Type of Business"];

const SAMPLE_ROWS = [
  { "Sr No.": 1, "Vendor Name": "ABC Chemicals Pvt Ltd", "MSME Registration Number": "UDYAM-XX-00-0000000", "Type of Business": "Manufacturer" },
  { "Sr No.": 2, "Vendor Name": "XYZ Traders",            "MSME Registration Number": "UDYAM-XX-00-0000001", "Type of Business": "Trader" },
];

const normalizeHeader = (h) => String(h || "").trim().toLowerCase().replace(/\.$/, "");

export default function MsmeReportPage({ password }) {
  const [hasVendorList, setHasVendorList] = useState(true); // assume true until the first fetch says otherwise
  const [rows, setRows]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadErr, setUploadErr] = useState("");
  const fileInputRef = useRef(null);

  const [lastUpload, setLastUpload] = useState({ exists: false, uploadedAt: null });
  const [downloadingLast, setDownloadingLast] = useState(false);

  const fetchLastUpload = useCallback(async () => {
    try {
      const params = new URLSearchParams({ password });
      const res  = await fetch(`/api/msme/vendor-list?${params}`);
      const data = await res.json();
      setLastUpload({ exists: !!data.exists, uploadedAt: data.uploadedAt || null });
    } catch (e) {
      console.error("MSME vendor-list fetch error:", e);
    }
  }, [password]);

  useEffect(() => { fetchLastUpload(); }, [fetchLastUpload]);

  const fetchReport = useCallback(async (p, s) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ password, page: p, pageSize: PAGE_SIZE, search: s });
      const res  = await fetch(`/api/msme/report?${params}`);
      const data = await res.json();
      setHasVendorList(!!data.hasVendorList);
      setRows(data.data || []);
      setTotal(data.totalItems || 0);
    } catch (e) {
      console.error("MSME report fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => { fetchReport(1, ""); }, [fetchReport]);

  const handleSearch = () => { setPage(1); fetchReport(1, search); };
  const handleReset   = () => { setSearch(""); setPage(1); fetchReport(1, ""); };
  const goToPage = (p) => { setPage(p); fetchReport(p, search); };

  const handleDownloadSample = () => downloadExcel(SAMPLE_ROWS, "MSME_Vendor_List_Format.xlsx");

  const handleFile = (file) => {
    if (!file) return;
    setUploadErr(""); setUploadMsg("");

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const wb    = XLSX.read(e.target.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json  = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!json.length) { setUploadErr("The uploaded file is empty."); return; }

        const actualHeaders   = Object.keys(json[0]).map(normalizeHeader);
        const expectedNormal  = EXPECTED_HEADERS.map(normalizeHeader);
        const missing = expectedNormal.filter(h => !actualHeaders.includes(h));
        if (missing.length) {
          setUploadErr(`Invalid file format. Expected columns: ${EXPECTED_HEADERS.join(", ")}`);
          return;
        }

        const keyMap = {};
        Object.keys(json[0]).forEach(k => { keyMap[normalizeHeader(k)] = k; });

        const parsedRows = json
          .map(r => ({
            srNo:           r[keyMap["sr no"]],
            vendorName:     String(r[keyMap["vendor name"]] || "").trim(),
            msmeRegNo:      String(r[keyMap["msme registration number"]] || "").trim(),
            typeOfBusiness: String(r[keyMap["type of business"]] || "").trim(),
          }))
          .filter(r => r.vendorName);

        if (!parsedRows.length) {
          setUploadErr("No valid rows found — every row needs a Vendor Name.");
          return;
        }

        setUploading(true);
        const res = await fetch("/api/msme/upload-vendor-list", {
          method: "POST",
          body: JSON.stringify({ password, rows: parsedRows }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Upload failed");

        setUploadMsg(`Uploaded ${result.count} vendor record(s) successfully.`);
        setPage(1);
        setSearch("");
        fetchReport(1, "");
        fetchLastUpload();
      } catch (err) {
        setUploadErr(err.message || "Failed to process the file");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadLastUpload = async () => {
    setDownloadingLast(true);
    try {
      const params = new URLSearchParams({ password });
      const res  = await fetch(`/api/msme/vendor-list?${params}`);
      const data = await res.json();
      if (!data.exists || !data.rows?.length) { alert("No vendor list has been uploaded yet."); return; }

      const exportRows = data.rows.map(r => ({
        "Sr No.": r.srNo,
        "Vendor Name": r.vendorName,
        "MSME Registration Number": r.msmeRegNo,
        "Type of Business": r.typeOfBusiness,
      }));
      downloadExcel(exportRows, "MSME_Vendor_List_Last_Uploaded.xlsx");
    } catch (e) {
      alert("Failed to download the last uploaded list");
    } finally {
      setDownloadingLast(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ password, all: "true", search });
      const res  = await fetch(`/api/msme/report?${params}`);
      const data = await res.json();
      if (!data.data?.length) { alert("No data to export"); return; }

      const toNum = (v) => { const n = Number(v); return isNaN(n) ? 0 : n; };

      const exportRows = data.data.map(r => ({
        "Vendor Code": r.VendorCode,
        "Vendor Name": r.VendorName,
        "MSME Reg No": r.MsmeRegNo,
        "Type of Business": r.TypeOfBusiness,
        "GST No": r.GSTNo,
        "Invoice No": r.InvoiceNo,
        "Invoice Date": r.InvoiceDate,
        "Invoice Amount": toNum(r.InvoiceAmount),
        "Balance Due": toNum(r.BalanceDue),
        "Last Payment Date": r.LastPaymentDate,
        "Paid within 45 days": toNum(r.PaidWithin45),
        "Paid after 45 days": toNum(r.PaidAfter45),
        "Outstanding within 45 days": toNum(r.OutstandingWithin45),
        "Outstanding after 45 days": toNum(r.OutstandingAfter45),
      }));

      // type: 'currency' forces a plain numeric cell (#,##0.00 format, no ₹ symbol)
      // so the column stays usable for SUM()/formulas in Excel.
      const columnFormats = {
        "Invoice Amount":             { type: "currency" },
        "Balance Due":                { type: "currency" },
        "Paid within 45 days":        { type: "currency" },
        "Paid after 45 days":         { type: "currency" },
        "Outstanding within 45 days": { type: "currency" },
        "Outstanding after 45 days":  { type: "currency" },
      };

      downloadExcel(exportRows, "MSME_Report_FY2025-26.xlsx", columnFormats);
    } catch (e) {
      alert("Export failed");
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Container className="mt-3 mb-5">
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>MSME Report</h1>
        <span className={s.fyBadge}>FY 2025-26</span>
      </div>
      <p className={s.pageSubtitle}>
        Upload the MSME vendor list once — every new upload fully replaces the previous one, and the report below
        always reflects the most recently uploaded list. Only vendors present in this list are shown.
      </p>

      <div className={s.card}>
        <div className={s.cardHeader}>
          <h2 className={s.cardHeaderTitle}>Vendor List</h2>
        </div>
        <div className={s.cardBody}>
          <div className={s.uploadGrid}>
            <div className={s.formatBox}>
              <div className={s.formatLabel}>Expected file format (first row = headers)</div>
              <table className={s.sampleTable}>
                <thead>
                  <tr>{EXPECTED_HEADERS.map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {SAMPLE_ROWS.map((r, i) => (
                    <tr key={i}>{EXPECTED_HEADERS.map(h => <td key={h}>{r[h]}</td>)}</tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className={s.linkBtn} onClick={handleDownloadSample}>
                ⭳ Download this sample format
              </button>
            </div>

            <div className={s.uploadBox}>
              <div className={s.uploadBoxLabel}>Upload vendor list (.xlsx / .xls)</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                disabled={uploading}
                className={s.fileInput}
                onChange={e => handleFile(e.target.files?.[0])}
              />
              {uploading && <div className={`${s.statusMsg} ${s.statusLoading}`}><span className={s.spinner} style={{ width: 14, height: 14, margin: 0 }} /> Uploading...</div>}
              {uploadMsg && <div className={`${s.statusMsg} ${s.statusSuccess}`}>✓ {uploadMsg}</div>}
              {uploadErr && <div className={`${s.statusMsg} ${s.statusError}`}>⚠ {uploadErr}</div>}

              {lastUpload.exists && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f3f5" }}>
                  <button type="button" className={s.linkBtn} onClick={handleDownloadLastUpload} disabled={downloadingLast}>
                    ⭳ {downloadingLast ? "Preparing..." : "Download the last list you submitted"}
                  </button>
                  {lastUpload.uploadedAt && (
                    <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 3 }}>
                      Last uploaded: {new Date(lastUpload.uploadedAt).toLocaleString("en-IN")}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={s.card}>
        <div className={s.cardHeader}>
          <h2 className={s.cardHeaderTitle}>Outstanding Report</h2>
          <div className={s.filterRow}>
            <input
              className={s.searchInput}
              placeholder="🔍 Search vendor name or MSME no..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
            <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={handleSearch}>Search</button>
            <button type="button" className={`${s.btn} ${s.btnOutline}`} onClick={handleReset}>Reset</button>
            <button type="button" className={`${s.btn} ${s.btnSuccess}`} onClick={handleExport} disabled={!hasVendorList || total === 0}>
              ⭳ Export to Excel
            </button>
          </div>
        </div>

        <div className={s.cardBody}>
          {loading ? (
            <div className={s.loadingState}><div className={s.spinner} />Loading report...</div>
          ) : !hasVendorList ? (
            <div className={s.emptyState}>
              📭 No vendor list has been uploaded yet.<br />Upload an Excel file above to generate the report.
            </div>
          ) : rows.length === 0 ? (
            <div className={s.emptyState}>No matching records found.</div>
          ) : (
            <>
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Vendor Code</th>
                      <th>Vendor Name</th>
                      <th>MSME Reg No</th>
                      <th>Type of Business</th>
                      <th>GST No</th>
                      <th>Invoice No</th>
                      <th>Invoice Date</th>
                      <th>Invoice Amount</th>
                      <th>Balance Due</th>
                      <th>Last Payment Date</th>
                      <th>Paid &le;45 days</th>
                      <th>Paid &gt;45 days</th>
                      <th>Outstanding &le;45 days</th>
                      <th>Outstanding &gt;45 days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={`${r.VendorCode}-${r.InvoiceNo}-${i}`}>
                        <td>{r.VendorCode}</td>
                        <td className={s.vendorName}>{r.VendorName}</td>
                        <td>{r.MsmeRegNo ? <span className={s.msmeBadge}>{r.MsmeRegNo}</span> : "—"}</td>
                        <td>{r.TypeOfBusiness || "—"}</td>
                        <td>{r.GSTNo || "—"}</td>
                        <td>{r.InvoiceNo}</td>
                        <td>{r.InvoiceDate ? new Date(r.InvoiceDate).toLocaleDateString("en-IN") : "—"}</td>
                        <td className={s.amount}>{formatCurrency(r.InvoiceAmount)}</td>
                        <td className={s.amount}>{formatCurrency(r.BalanceDue)}</td>
                        <td>{r.LastPaymentDate ? new Date(r.LastPaymentDate).toLocaleDateString("en-IN") : "—"}</td>
                        <td className={s.amount}>{formatCurrency(r.PaidWithin45)}</td>
                        <td className={s.amount}>{formatCurrency(r.PaidAfter45)}</td>
                        <td className={`${s.amount} ${r.OutstandingWithin45 > 0 ? s.amountPositive : s.amountZero}`}>{formatCurrency(r.OutstandingWithin45)}</td>
                        <td className={`${s.amount} ${r.OutstandingAfter45 > 0 ? s.amountPositive : s.amountZero}`}>{formatCurrency(r.OutstandingAfter45)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (() => {
                const WINDOW = 5;
                const windowStart = Math.max(1, Math.min(page - Math.floor(WINDOW / 2), totalPages - WINDOW + 1));
                const windowEnd   = Math.min(totalPages, windowStart + WINDOW - 1);
                const pageNumbers = [];
                for (let p = windowStart; p <= windowEnd; p++) pageNumbers.push(p);

                return (
                  <div className={s.paginationRow}>
                    <span className={s.paginationInfo}>
                      Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} records
                    </span>
                    <div className={s.paginationBtns}>
                      <button type="button" className={s.pageBtn} disabled={page === 1} onClick={() => goToPage(1)} title="First page">«</button>
                      <button type="button" className={s.pageBtn} disabled={page === 1} onClick={() => goToPage(page - 1)}>‹</button>
                      {windowStart > 1 && <span className={s.paginationInfo} style={{ padding: "0 4px" }}>…</span>}
                      {pageNumbers.map((p) => (
                        <button
                          type="button"
                          key={p}
                          className={`${s.pageBtn} ${page === p ? s.pageBtnActive : ""}`}
                          onClick={() => goToPage(p)}
                        >
                          {p}
                        </button>
                      ))}
                      {windowEnd < totalPages && <span className={s.paginationInfo} style={{ padding: "0 4px" }}>…</span>}
                      <button type="button" className={s.pageBtn} disabled={page === totalPages} onClick={() => goToPage(page + 1)}>›</button>
                      <button type="button" className={s.pageBtn} disabled={page === totalPages} onClick={() => goToPage(totalPages)} title="Last page">»</button>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </Container>
  );
}
