import React from "react";

export default function LoadingState({ isMobile }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: isMobile ? "40px 20px" : "60px 40px",
        backgroundColor: "white",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          display: "inline-block",
          width: isMobile ? "40px" : "50px",
          height: isMobile ? "40px" : "50px",
          border: "4px solid #dcfce7",
          borderTopColor: "#15803d",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <p
        style={{
          marginTop: "16px",
          color: "#15803d",
          fontSize: isMobile ? "14px" : "16px",
        }}
      >
        Loading data...
      </p>
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}