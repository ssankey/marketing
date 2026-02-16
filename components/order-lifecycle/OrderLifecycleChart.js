
// components/order-lifecycle/OrderLifecycleChart.js
import React from "react";

const OrderLifecycleChart = ({ chartData, dayRanges, loading }) => {
  // Convert "2025-05" to "May 2025"
  const formatMonthYear = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const renderStackedBar = (monthData) => {
    const total = Object.values(monthData.buckets).reduce((sum, b) => sum + b.count, 0);
    
    return (
      <div key={monthData.month} style={{ marginBottom: "16px" }}>
        <div style={{
          position: "relative",
          height: "36px",
          borderRadius: "6px",
          overflow: "hidden",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          display: "flex"
        }}>
          {/* Month Label - Left Side */}
          <div style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "13px",
            fontWeight: "600",
            color: "#1f2937",
            zIndex: 10,
            pointerEvents: "none",
            textShadow: "0 0 4px rgba(255,255,255,0.9), 0 0 4px rgba(255,255,255,0.9)"
          }}>
            {formatMonthYear(monthData.month)}
          </div>

          {/* Total - Right Side */}
          <div style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "13px",
            fontWeight: "600",
            color: "#6b7280",
            zIndex: 10,
            pointerEvents: "none",
            textShadow: "0 0 4px rgba(255,255,255,0.9), 0 0 4px rgba(255,255,255,0.9)"
          }}>
            Total: {total}
          </div>

          {/* Stacked Bars */}
          {dayRanges.map((range, idx) => {
            const bucket = monthData.buckets[range.label];
            const percentage = bucket ? bucket.percentage : 0;
            
            if (percentage === 0) return null;
            
            return (
              <div
                key={idx}
                style={{
                  width: `${percentage}%`,
                  backgroundColor: range.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "11px",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                  position: "relative",
                  cursor: "pointer",
                  opacity: 0.85
                }}
                title={`${range.label}: ${bucket.count} orders (${percentage.toFixed(1)}%)`}
                onMouseEnter={(e) => e.target.style.opacity = "1"}
                onMouseLeave={(e) => e.target.style.opacity = "0.85"}
              >
                {percentage > 10 && `${percentage.toFixed(1)}%`}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
        <div style={{ fontSize: "24px", marginBottom: "12px" }}>⏳</div>
        <div>Loading data...</div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📊</div>
        <div style={{ fontSize: "16px", fontWeight: "500", marginBottom: "8px" }}>No data available</div>
        <div style={{ fontSize: "14px" }}>Try adjusting your filters or select a different tab</div>
      </div>
    );
  }

  return (
    <div style={{ maxHeight: "600px", overflowY: "auto", paddingRight: "8px" }}>
      {chartData.map(monthData => renderStackedBar(monthData))}
    </div>
  );
};

export default OrderLifecycleChart;