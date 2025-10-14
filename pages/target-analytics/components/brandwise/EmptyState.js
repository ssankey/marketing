import React from "react";

export default function EmptyState({ isMobile }) {
  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "8px",
        padding: isMobile ? "16px" : "20px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        minHeight: "400px",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: isMobile ? "40px 20px" : "60px 40px",
          color: "#9ca3af",
        }}
      >
        <div
          style={{
            fontSize: isMobile ? "48px" : "64px",
            marginBottom: "16px",
          }}
        >
          📊
        </div>
        <h4
          style={{
            color: "#6b7280",
            fontSize: isMobile ? "16px" : "18px",
            fontWeight: "600",
            marginBottom: "8px",
          }}
        >
          No Data Available
        </h4>
        <p
          style={{
            color: "#9ca3af",
            fontSize: isMobile ? "13px" : "14px",
            margin: 0,
          }}
        >
          Select filters and click "Apply" to load data
        </p>
      </div>
    </div>
  );
}