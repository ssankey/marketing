// pages/in-bound-shipments/index.js
import React, { useState } from "react";
import ImportExportTable from "./ImportExportTable";
import FetchRecords from "./FetchRecords";

const IndexPage = () => {
  const [mode, setMode] = useState("");

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eff6ff 100%)", padding: "24px" }}>
      <div style={{ width: "100%" }}>
        <div style={{ backgroundColor: "white", borderRadius: "16px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", border: "1px solid #dbeafe" }}>
          
          {/* Header */}
          <div style={{ padding: "32px", borderBottom: "1px solid #93c5fd", background: "linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)", borderRadius: "16px 16px 0 0" }}>
            <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#1e40af", margin: 0 }}>Inbound Shipment Document Portal</h2>
            <p style={{ fontSize: "16px", color: "#2563eb", marginTop: "8px" }}>Choose Create or Fetch existing records</p>
          </div>

          {/* Mode Selector */}
          <div style={{ padding: "24px", borderBottom: "1px solid #dbeafe" }}>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              style={{
                padding: "12px 16px",
                border: "1px solid #93c5fd",
                borderRadius: "8px",
                fontSize: "14px",
                flex: "0 0 200px",
                background: "white",
              }}
            >
              <option value="">Select Option</option>
              <option value="create">Create</option>
              <option value="fetch">Fetch</option>
            </select>
          </div>

          {/* Render Content */}
          {mode === "create" && <ImportExportTable />}
          {mode === "fetch" && <FetchRecords />}
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
