// pages/msme-report/index.js
// Gated by a shared password (not the main login) since this report is
// restricted to a smaller audience than the rest of the dashboard.

import { useState } from "react";
import MsmeReportPage from "components/page/msme/MsmeReportPage";

const MSME_PASSWORD = "msme2526report";

export default function MsmeReportEntry() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");

  const handleUnlock = () => {
    if (password === MSME_PASSWORD) {
      setUnlocked(true);
      setError("");
    } else {
      setError("Incorrect password");
    }
  };

  if (!unlocked) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
        <div style={{ width: 360, padding: 28, border: "1px solid #dee2e6", borderRadius: 12, background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
          <h5 style={{ marginBottom: 4 }}>🔒 MSME Report</h5>
          <p style={{ fontSize: 13, color: "#6c757d", marginBottom: 16 }}>
            This report is restricted. Enter the access password to continue.
          </p>
          <input
            type="password"
            autoFocus
            placeholder="Enter password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleUnlock()}
            style={{ width: "100%", padding: "8px 10px", fontSize: 14, border: "1px solid #cbd5e1", borderRadius: 6, marginBottom: 8 }}
          />
          {error && <div style={{ color: "#b91c1c", fontSize: 12.5, marginBottom: 8 }}>{error}</div>}
          <button
            onClick={handleUnlock}
            style={{ width: "100%", padding: "9px 0", background: "#0d6efd", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return <MsmeReportPage password={password} />;
}
