import React from "react";
import { calculateRowTotal } from "utils/brandwise/dataProcessing";

export default function QuarterlyTable({
  isMobile,
  data,
  categories,
  onDownloadExcel,
}) {
  // Fixed cell width for all data cells - increased to prevent wrapping
  const CELL_WIDTH = isMobile ? "110px" : "130px";
  
  const renderCategoryColumns = (row, category, isFirstCategory, categoryIndex) => {
    const sales = row[`${category}_Sales`] || 0;
    const margin = row[`${category}_Margin`] || 0;

    const isDarkCategory = categoryIndex % 2 === 0;
    const bgColor = row.isQuarter
      ? "#86efac"
      : isDarkCategory
      ? "#f0fdf4"
      : "transparent";

    return (
      <React.Fragment key={category}>
        <td
          style={{
            padding: isMobile ? "8px 6px" : "12px 8px",
            border: "1px solid #e5e7eb",
            textAlign: "right",
            fontSize: isMobile ? "11px" : "12px",
            backgroundColor: bgColor,
            fontWeight: row.isQuarter ? "600" : "400",
            borderLeft: isFirstCategory ? "1px solid #e5e7eb" : "2px solid #d1d5db",
            color: "#9ca3af",
            width: CELL_WIDTH,
            minWidth: CELL_WIDTH,
            maxWidth: CELL_WIDTH,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          -
        </td>
        <td
          style={{
            padding: isMobile ? "8px 6px" : "12px 8px",
            border: "1px solid #e5e7eb",
            textAlign: "right",
            fontSize: isMobile ? "11px" : "12px",
            backgroundColor: bgColor,
            fontWeight: row.isQuarter ? "600" : "400",
            width: CELL_WIDTH,
            minWidth: CELL_WIDTH,
            maxWidth: CELL_WIDTH,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          ₹
          {sales.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </td>
        <td
          style={{
            padding: isMobile ? "8px 6px" : "12px 8px",
            border: "1px solid #e5e7eb",
            textAlign: "right",
            fontSize: isMobile ? "11px" : "12px",
            color:
              margin >= 25
                ? "#15803d"
                : margin >= 15
                ? "#f59e0b"
                : "#dc2626",
            fontWeight: "700",
            backgroundColor: bgColor,
            width: CELL_WIDTH,
            minWidth: CELL_WIDTH,
            maxWidth: CELL_WIDTH,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {margin}%
        </td>
      </React.Fragment>
    );
  };

  return (
    <div>
      {/* Header with Download Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <h3
          style={{
            color: "#15803d",
            margin: 0,
            fontSize: isMobile ? "16px" : "18px",
            fontWeight: "700",
          }}
        >
          Quarterly Performance Analysis
        </h3>
        <button
          onClick={onDownloadExcel}
          style={{
            padding: isMobile ? "8px 14px" : "10px 18px",
            backgroundColor: "#15803d",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: isMobile ? "12px" : "14px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#166534")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#15803d")}
        >
          📥 Download Excel
        </button>
      </div>

      {/* Scrollable Table Container */}
      <div
        style={{
          overflowX: "auto",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          borderRadius: "8px",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            backgroundColor: "white",
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: isMobile ? "60px" : "70px" }} />
            <col style={{ width: isMobile ? "70px" : "80px" }} />
            {[...categories, "Total"].map((cat, idx) => (
              <React.Fragment key={`colgroup-${cat}-${idx}`}>
                <col style={{ width: CELL_WIDTH }} />
                <col style={{ width: CELL_WIDTH }} />
                <col style={{ width: CELL_WIDTH }} />
              </React.Fragment>
            ))}
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: "#15803d" }}>
              <th
                rowSpan="2"
                style={{
                  padding: isMobile ? "10px 8px" : "14px 10px",
                  border: "2px solid #ffffff",
                  color: "white",
                  textAlign: "center",
                  position: "sticky",
                  left: 0,
                  backgroundColor: "#15803d",
                  zIndex: 3,
                  fontSize: isMobile ? "11px" : "13px",
                  fontWeight: "600",
                }}
              >
                Year
              </th>
              <th
                rowSpan="2"
                style={{
                  padding: isMobile ? "10px 8px" : "14px 10px",
                  border: "2px solid #ffffff",
                  color: "white",
                  textAlign: "center",
                  position: "sticky",
                  left: isMobile ? 60 : 70,
                  backgroundColor: "#15803d",
                  zIndex: 3,
                  fontSize: isMobile ? "11px" : "13px",
                  fontWeight: "600",
                }}
              >
                Month
              </th>
              {categories.map((category) => (
                <th
                  key={category}
                  colSpan="3"
                  style={{
                    padding: isMobile ? "10px 6px" : "14px 8px",
                    border: "2px solid #ffffff",
                    color: "white",
                    textAlign: "center",
                    fontSize: isMobile ? "11px" : "13px",
                    fontWeight: "600",
                  }}
                >
                  {category}
                </th>
              ))}
              <th
                colSpan="3"
                style={{
                  padding: isMobile ? "10px 6px" : "14px 8px",
                  border: "2px solid #ffffff",
                  color: "#fef3c7",
                  textAlign: "center",
                  fontSize: isMobile ? "11px" : "13px",
                  fontWeight: "700",
                  backgroundColor: "#166534",
                }}
              >
                Total
              </th>
            </tr>
            <tr style={{ backgroundColor: "#86efac" }}>
              {[...categories, "Total"].map((category) => (
                <React.Fragment key={`${category}-headers`}>
                  <th
                    style={{
                      padding: isMobile ? "8px 4px" : "10px 6px",
                      border: "1px solid #ffffff",
                      color: "#15803d",
                      textAlign: "center",
                      fontSize: isMobile ? "10px" : "11px",
                      fontWeight: "600",
                      backgroundColor: "#dcfce7",
                      width: CELL_WIDTH,
                    }}
                  >
                    Target
                  </th>
                  <th
                    style={{
                      padding: isMobile ? "8px 4px" : "10px 6px",
                      border: "1px solid #ffffff",
                      color: "#15803d",
                      textAlign: "center",
                      fontSize: isMobile ? "10px" : "11px",
                      fontWeight: "600",
                      backgroundColor: "#dcfce7",
                      width: CELL_WIDTH,
                    }}
                  >
                    Sales
                  </th>
                  <th
                    style={{
                      padding: isMobile ? "8px 4px" : "10px 6px",
                      border: "1px solid #ffffff",
                      color: "#15803d",
                      textAlign: "center",
                      fontSize: isMobile ? "10px" : "11px",
                      fontWeight: "600",
                      backgroundColor: "#dcfce7",
                      width: CELL_WIDTH,
                    }}
                  >
                    Margin %
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const totals = calculateRowTotal(row, categories);
              return (
                <tr
                  key={`${row.Year}-${row.Month}-${index}`}
                  style={{
                    backgroundColor: row.isQuarter
                      ? "#86efac"
                      : index % 2 === 0
                      ? "#ffffff"
                      : "#f9fafb",
                    fontWeight: row.isQuarter ? "600" : "400",
                    borderBottom: row.isQuarter
                      ? "3px solid #15803d"
                      : "1px solid #e5e7eb",
                  }}
                >
                  <td
                    style={{
                      padding: isMobile ? "8px 6px" : "12px 10px",
                      border: "1px solid #e5e7eb",
                      textAlign: "center",
                      fontSize: isMobile ? "11px" : "13px",
                      position: "sticky",
                      left: 0,
                      backgroundColor: row.isQuarter
                        ? "#a7f3d0"
                        : index % 2 === 0
                        ? "#ffffff"
                        : "#f9fafb",
                      zIndex: 2,
                      fontWeight: "500",
                    }}
                  >
                    {row.Year}
                  </td>
                  <td
                    style={{
                      padding: isMobile ? "8px 6px" : "12px 10px",
                      border: "1px solid #e5e7eb",
                      textAlign: "center",
                      fontSize: isMobile ? "11px" : "13px",
                      fontWeight: row.isQuarter ? "700" : "600",
                      color: row.isQuarter ? "#15803d" : "#374151",
                      position: "sticky",
                      left: isMobile ? 60 : 70,
                      backgroundColor: row.isQuarter
                        ? "#86efac"
                        : index % 2 === 0
                        ? "#ffffff"
                        : "#f9fafb",
                      zIndex: 2,
                      borderRight: "2px solid #d1d5db",
                    }}
                  >
                    {row.Month}
                  </td>
                  {categories.map((cat, idx) =>
                    renderCategoryColumns(row, cat, idx === 0, idx)
                  )}
                  {/* Total columns */}
                  <td
                    style={{
                      padding: isMobile ? "8px 6px" : "12px 8px",
                      border: "1px solid #e5e7eb",
                      textAlign: "right",
                      fontSize: isMobile ? "11px" : "13px",
                      fontWeight: "700",
                      backgroundColor: row.isQuarter ? "#86efac" : "#f0fdf4",
                      borderLeft: "2px solid #d1d5db",
                      color: "#9ca3af",
                      width: CELL_WIDTH,
                      minWidth: CELL_WIDTH,
                      maxWidth: CELL_WIDTH,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    -
                  </td>
                  <td
                    style={{
                      padding: isMobile ? "8px 6px" : "12px 8px",
                      border: "1px solid #e5e7eb",
                      textAlign: "right",
                      fontSize: isMobile ? "11px" : "13px",
                      fontWeight: "700",
                      backgroundColor: row.isQuarter ? "#86efac" : "#f0fdf4",
                      width: CELL_WIDTH,
                      minWidth: CELL_WIDTH,
                      maxWidth: CELL_WIDTH,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    ₹
                    {totals.totalSales.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td
                    style={{
                      padding: isMobile ? "8px 6px" : "12px 8px",
                      border: "1px solid #e5e7eb",
                      textAlign: "right",
                      fontSize: isMobile ? "11px" : "13px",
                      fontWeight: "700",
                      color:
                        totals.avgMargin >= 25
                          ? "#15803d"
                          : totals.avgMargin >= 15
                          ? "#f59e0b"
                          : "#dc2626",
                      backgroundColor: row.isQuarter ? "#86efac" : "#f0fdf4",
                      width: CELL_WIDTH,
                      minWidth: CELL_WIDTH,
                      maxWidth: CELL_WIDTH,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {totals.avgMargin}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}