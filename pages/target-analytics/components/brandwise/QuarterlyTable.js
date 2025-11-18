

// pages/target-analytics/components/brandwise/QuarterlyTable.js
import React from "react";
import { calculateRowTotal } from "utils/brandwise/dataProcessing";
import { TARGET_SALES_CR_FY_2025_26 } from "utils/brandwise/targets";

export default function QuarterlyTable({
  isMobile,
  data,
  categories,
  onDownloadExcel,
  targetMargins,
}) {
  const CELL_WIDTH = isMobile ? "110px" : "130px";

  const toCrores = (value) => {
    return (value / 10000000).toFixed(2);
  };

  const toMonthKey = (row) =>
    `${row.Year}-${String(row.MonthNumber).padStart(2, "0")}`;

  const monthlyRows = data.filter((r) => !r.isQuarter && r.MonthNumber);

  const QUARTER_MAP = {
    Q1: [4, 5, 6],
    Q2: [7, 8, 9],
    Q3: [10, 11, 12],
    Q4: [1, 2, 3],
  };

  const getQuarterMonthNumbers = (qLabel) => QUARTER_MAP[qLabel] || [];

  // Fiscal-year aware: Q4 row's Year is next calendar year, but FY start is previous year
  const getFiscalYearFromRow = (row) => {
    const yearMatch = row.Year?.toString().match(/(\d{4})/);
    if (!yearMatch) return null;
    const rowYear = parseInt(yearMatch[1], 10);
    const monthLabel = String(row.Month || "").toUpperCase();

    if (monthLabel === "Q4") {
      // For Q4 summary row (label "Q4"), fiscal year is rowYear - 1
      return rowYear - 1;
    }

    return rowYear;
  };

  const getQuarterVisibleMonthKeys = (qLabel, row) => {
    const monthNums = new Set(getQuarterMonthNumbers(qLabel));
    const fiscalYear = getFiscalYearFromRow(row);

    if (!fiscalYear) return [];

    return monthlyRows
      .filter((r) => {
        const monthNum = Number(r.MonthNumber);
        if (!monthNums.has(monthNum)) return false;

        // For Q4 months (Jan–Mar) the calendar year is FY+1
        if (qLabel === "Q4" && [1, 2, 3].includes(monthNum)) {
          return r.Year === fiscalYear + 1;
        } else {
          // Q1–Q3 months (Apr–Dec) year = FY
          return r.Year === fiscalYear;
        }
      })
      .map((r) => toMonthKey(r));
  };

  const calcQuarterCategoryTarget = (qLabel, category, row) => {
    const keys = getQuarterVisibleMonthKeys(qLabel, row);
    return keys.reduce(
      (sum, k) => sum + (TARGET_SALES_CR_FY_2025_26?.[k]?.[category] ?? 0),
      0
    );
  };

  const calcQuarterRowTarget = (qLabel, row) => {
    const keys = getQuarterVisibleMonthKeys(qLabel, row);
    return keys.reduce((acc, k) => {
      const rowTargets = categories.reduce(
        (s, c) => s + (TARGET_SALES_CR_FY_2025_26?.[k]?.[c] ?? 0),
        0
      );
      return acc + rowTargets;
    }, 0);
  };

  const calculateGrandTotals = () => {
    const totals = {
      totalSales: 0,
      totalTarget: 0,
      totalWeightedMargin: 0,
      categorySales: {},
      categoryTarget: {},
      categoryMargins: {},
    };

    categories.forEach((c) => {
      totals.categorySales[c] = 0;
      totals.categoryTarget[c] = 0;
      totals.categoryMargins[c] = {
        totalWeightedMargin: 0,
        totalSales: 0,
      };
    });

    monthlyRows.forEach((row) => {
      const rowTotals = calculateRowTotal(row, categories);
      totals.totalSales += rowTotals.totalSales;
      totals.totalWeightedMargin +=
        rowTotals.totalSales * (rowTotals.avgMargin / 100);

      categories.forEach((cat) => {
        const sales = row[`${cat}_Sales`] || 0;
        const margin = row[`${cat}_Margin`] || 0;

        totals.categorySales[cat] += sales;
        totals.categoryMargins[cat].totalWeightedMargin +=
          sales * (margin / 100);
        totals.categoryMargins[cat].totalSales += sales;
      });

      const mKey = toMonthKey(row);
      let rowTarget = 0;
      categories.forEach((cat) => {
        const t = TARGET_SALES_CR_FY_2025_26?.[mKey]?.[cat] ?? 0;
        totals.categoryTarget[cat] += t;
        rowTarget += t;
      });
      totals.totalTarget += rowTarget;
    });

    totals.grandTotalMargin =
      totals.totalSales > 0
        ? Number(
            ((totals.totalWeightedMargin / totals.totalSales) * 100).toFixed(2)
          )
        : 0;

    categories.forEach((cat) => {
      const marginData = totals.categoryMargins[cat];
      totals.categoryMargins[cat].finalMargin =
        marginData.totalSales > 0
          ? Number(
              (
                (marginData.totalWeightedMargin / marginData.totalSales) *
                100
              ).toFixed(2)
            )
          : 0;
    });

    return totals;
  };

  const grandTotals = calculateGrandTotals();

  const getTargetMargin = (category) =>
    targetMargins[category] || targetMargins["Other"] || 20;

  const OVERALL_TARGET_MARGIN =
    targetMargins["Overall"] || targetMargins["Other"] || 20;

  const baseCellStyle = {
    padding: isMobile ? "8px 6px" : "12px 8px",
    border: "1px solid #e5e7eb",
    textAlign: "right",
    fontSize: isMobile ? "11px" : "12px",
    width: CELL_WIDTH,
    minWidth: CELL_WIDTH,
    maxWidth: CELL_WIDTH,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const renderCategoryColumns = (row, category, isFirstCategory, categoryIndex) => {
    const sales = row[`${category}_Sales`] || 0;
    const margin = row[`${category}_Margin`] || 0;

    const isDarkCategory = categoryIndex % 2 === 0;
    const bgColor = row.isQuarter
      ? "#86efac"
      : isDarkCategory
      ? "#f0fdf4"
      : "transparent";

    // Target in Cr (number)
    let targetCr = 0;
    if (row.isQuarter) {
      const qLabel = String(row.Month || "").toUpperCase();
      targetCr = calcQuarterCategoryTarget(qLabel, category, row) || 0;
    } else if (row.MonthNumber) {
      const mKey = toMonthKey(row);
      targetCr = TARGET_SALES_CR_FY_2025_26?.[mKey]?.[category] ?? 0;
    }

    const salesCr = Number(toCrores(sales));
    const achievedPct =
      targetCr > 0 ? Number(((salesCr / targetCr) * 100).toFixed(2)) : null;

    const targetGM = getTargetMargin(category);
    const gmColor = margin >= targetGM ? "#15803d" : "#dc2626";

    return (
      <React.Fragment key={category}>
        {/* Achieved % */}
        <td
          style={{
            ...baseCellStyle,
            backgroundColor: bgColor,
            borderLeft: isFirstCategory
              ? "1px solid #e5e7eb"
              : "2px solid #d1d5db",
            color: row.isQuarter ? "#065f46" : "#374151",
          }}
        >
          {achievedPct != null ? `${achievedPct}%` : "-"}
        </td>

        {/* Target (Cr) */}
        <td
          style={{
            ...baseCellStyle,
            backgroundColor: bgColor,
          }}
        >
          ₹{Number(targetCr).toFixed(2)} Cr
        </td>

        {/* Sales (Cr) */}
        <td
          style={{
            ...baseCellStyle,
            backgroundColor: bgColor,
          }}
        >
          ₹{salesCr} Cr
        </td>

        {/* GM % with colour vs target GM% */}
        <td
          style={{
            ...baseCellStyle,
            backgroundColor: bgColor,
            color: gmColor,
            fontWeight: "700",
          }}
        >
          {margin}%
        </td>
      </React.Fragment>
    );
  };

  const renderTotalRowCategoryColumns = (category, isFirstCategory) => {
    const categorySales = grandTotals.categorySales[category] || 0;
    const categoryTargetCr = grandTotals.categoryTarget[category] || 0;
    const categoryMargin =
      grandTotals.categoryMargins[category]?.finalMargin || 0;

    const categorySalesCr = Number(toCrores(categorySales));
    const categoryAchievedPct =
      categoryTargetCr > 0
        ? Number(((categorySalesCr / categoryTargetCr) * 100).toFixed(2))
        : null;

    const targetGM = getTargetMargin(category);
    const gmColor = categoryMargin >= targetGM ? "#86efac" : "#fca5a5";

    return (
      <React.Fragment key={category}>
        {/* Achieved % */}
        <td
          style={{
            padding: isMobile ? "8px 6px" : "12px 8px",
            border: "1px solid #ffffff",
            textAlign: "right",
            fontSize: isMobile ? "11px" : "12px",
            backgroundColor: "#15803d",
            fontWeight: "600",
            borderLeft: isFirstCategory
              ? "1px solid #ffffff"
              : "2px solid #ffffff",
            color: "#fef3c7",
            width: CELL_WIDTH,
            minWidth: CELL_WIDTH,
            maxWidth: CELL_WIDTH,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {categoryAchievedPct != null ? `${categoryAchievedPct}%` : "-"}
        </td>

        {/* Target (Cr) */}
        <td
          style={{
            padding: isMobile ? "8px 6px" : "12px 8px",
            border: "1px solid #ffffff",
            textAlign: "right",
            fontSize: isMobile ? "11px" : "12px",
            backgroundColor: "#15803d",
            fontWeight: "600",
            color: "#fef3c7",
            width: CELL_WIDTH,
            minWidth: CELL_WIDTH,
            maxWidth: CELL_WIDTH,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          ₹{Number(categoryTargetCr).toFixed(2)} Cr
        </td>

        {/* Sales (Cr) */}
        <td
          style={{
            padding: isMobile ? "8px 6px" : "12px 8px",
            border: "1px solid #ffffff",
            textAlign: "right",
            fontSize: isMobile ? "11px" : "12px",
            backgroundColor: "#15803d",
            fontWeight: "600",
            color: "#fef3c7",
            width: CELL_WIDTH,
            minWidth: CELL_WIDTH,
            maxWidth: CELL_WIDTH,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          ₹{categorySalesCr} Cr
        </td>

        {/* GM % vs target GM% */}
        <td
          style={{
            padding: isMobile ? "8px 6px" : "12px 8px",
            border: "1px solid #ffffff",
            textAlign: "right",
            fontSize: isMobile ? "11px" : "12px",
            color: gmColor,
            fontWeight: "600",
            backgroundColor: "#15803d",
            width: CELL_WIDTH,
            minWidth: CELL_WIDTH,
            maxWidth: CELL_WIDTH,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {categoryMargin}%
        </td>
      </React.Fragment>
    );
  };

  // Grand totals for TOTAL columns
  const totalSalesCr = Number(toCrores(grandTotals.totalSales));
  const totalTargetCr = Number(grandTotals.totalTarget);
  const totalAchievedPct =
    totalTargetCr > 0
      ? Number(((totalSalesCr / totalTargetCr) * 100).toFixed(2))
      : null;

  return (
    <div>
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
            {/* Total column group (4 cols: Achieved, Target, Sales, GM) */}
            <col style={{ width: CELL_WIDTH }} />
            <col style={{ width: CELL_WIDTH }} />
            <col style={{ width: CELL_WIDTH }} />
            <col style={{ width: CELL_WIDTH }} />
            {/* Category column groups (4 cols each) */}
            {categories.map((cat, idx) => (
              <React.Fragment key={`colgroup-${cat}-${idx}`}>
                <col style={{ width: CELL_WIDTH }} />
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
              {/* Total header */}
              <th
                colSpan="4"
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
              {/* Category headers */}
              {categories.map((category) => (
                <th
                  key={category}
                  colSpan="4"
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
            </tr>
            <tr style={{ backgroundColor: "#86efac" }}>
              {/* Total column sub-headers */}
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
                Achieved %
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
                Target (Cr)
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
                Sales (Cr)
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
                GM %
              </th>
              {/* Category sub-headers */}
              {categories.map((category) => (
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
                    Achieved %
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
                    Target ({getTargetMargin(category)}%)
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
                    Sales (Cr)
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
                    GM %
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, index) => {
              const totals = calculateRowTotal(row, categories);

              let rowTargetCr = null;
              if (row.isQuarter) {
                const qLabel = String(row.Month || "").toUpperCase();
                rowTargetCr = calcQuarterRowTarget(qLabel, row);
              } else if (row.MonthNumber) {
                const mKey = toMonthKey(row);
                const sum = categories.reduce(
                  (acc, c) =>
                    acc + (TARGET_SALES_CR_FY_2025_26?.[mKey]?.[c] ?? 0),
                  0
                );
                rowTargetCr = sum;
              }

              const totalSalesCr = Number(toCrores(totals.totalSales));
              const rowAchievedPct =
                rowTargetCr && rowTargetCr > 0
                  ? Number(((totalSalesCr / rowTargetCr) * 100).toFixed(2))
                  : null;

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

                  {/* TOTAL columns: Achieved %, Target, Sales, GM */}
                  {/* Achieved % */}
                  <td
                    style={{
                      ...baseCellStyle,
                      fontWeight: "700",
                      backgroundColor: row.isQuarter ? "#86efac" : "#f0fdf4",
                      borderLeft: "2px solid #d1d5db",
                      color: "#065f46",
                    }}
                  >
                    {rowAchievedPct != null ? `${rowAchievedPct}%` : "-"}
                  </td>

                  {/* Target (Cr) */}
                  <td
                    style={{
                      ...baseCellStyle,
                      fontWeight: "700",
                      backgroundColor: row.isQuarter ? "#86efac" : "#f0fdf4",
                      color: "#065f46",
                    }}
                  >
                    {rowTargetCr == null
                      ? "-"
                      : `₹${Number(rowTargetCr).toFixed(2)} Cr`}
                  </td>

                  {/* Sales (Cr) */}
                  <td
                    style={{
                      ...baseCellStyle,
                      fontWeight: "700",
                      backgroundColor: row.isQuarter ? "#86efac" : "#f0fdf4",
                    }}
                  >
                    ₹{totalSalesCr} Cr
                  </td>

                  {/* GM % vs OVERALL_TARGET_MARGIN */}
                  <td
                    style={{
                      ...baseCellStyle,
                      fontWeight: "700",
                      color:
                        totals.avgMargin >= OVERALL_TARGET_MARGIN
                          ? "#15803d"
                          : "#dc2626",
                      backgroundColor: row.isQuarter ? "#86efac" : "#f0fdf4",
                      borderRight: "2px solid #d1d5db",
                    }}
                  >
                    {totals.avgMargin}%
                  </td>

                  {/* Category columns */}
                  {categories.map((cat, idx) =>
                    renderCategoryColumns(row, cat, idx === 0, idx)
                  )}
                </tr>
              );
            })}

            {/* Grand Total Row */}
            <tr
              style={{
                backgroundColor: "#15803d",
                fontWeight: "700",
                borderTop: "3px solid #166534",
              }}
            >
              <td
                style={{
                  padding: isMobile ? "10px 6px" : "14px 10px",
                  border: "2px solid #ffffff",
                  color: "white",
                  textAlign: "center",
                  fontSize: isMobile ? "12px" : "14px",
                  position: "sticky",
                  left: 0,
                  backgroundColor: "#15803d",
                  zIndex: 2,
                }}
              >
                Total
              </td>
              <td
                style={{
                  padding: isMobile ? "10px 6px" : "14px 10px",
                  border: "2px solid #ffffff",
                  color: "white",
                  textAlign: "center",
                  fontSize: isMobile ? "12px" : "14px",
                  position: "sticky",
                  left: isMobile ? 60 : 70,
                  backgroundColor: "#15803d",
                  zIndex: 2,
                  borderRight: "2px solid #ffffff",
                }}
              >
                -
              </td>

              {/* TOTAL Achieved %, Target, Sales, GM */}
              {/* Achieved % */}
              <td
                style={{
                  padding: isMobile ? "10px 6px" : "14px 8px",
                  border: "2px solid #ffffff",
                  textAlign: "right",
                  fontSize: isMobile ? "12px" : "14px",
                  fontWeight: "700",
                  backgroundColor: "#15803d",
                  borderLeft: "2px solid #ffffff",
                  color: "#fef3c7",
                }}
              >
                {totalAchievedPct != null ? `${totalAchievedPct}%` : "-"}
              </td>

              {/* Target (Cr) */}
              <td
                style={{
                  padding: isMobile ? "10px 6px" : "14px 8px",
                  border: "2px solid #ffffff",
                  textAlign: "right",
                  fontSize: isMobile ? "12px" : "14px",
                  fontWeight: "700",
                  backgroundColor: "#15803d",
                  color: "#fef3c7",
                }}
              >
                ₹{totalTargetCr.toFixed(2)} Cr
              </td>

              {/* Sales (Cr) */}
              <td
                style={{
                  padding: isMobile ? "10px 6px" : "14px 8px",
                  border: "2px solid #ffffff",
                  textAlign: "right",
                  fontSize: isMobile ? "12px" : "14px",
                  fontWeight: "700",
                  backgroundColor: "#15803d",
                  color: "#fef3c7",
                }}
              >
                ₹{totalSalesCr} Cr
              </td>

              {/* GM % vs OVERALL_TARGET_MARGIN */}
              <td
                style={{
                  padding: isMobile ? "10px 6px" : "14px 8px",
                  border: "2px solid #ffffff",
                  textAlign: "right",
                  fontSize: isMobile ? "12px" : "14px",
                  fontWeight: "700",
                  color:
                    grandTotals.grandTotalMargin >= OVERALL_TARGET_MARGIN
                      ? "#86efac"
                      : "#fca5a5",
                  backgroundColor: "#15803d",
                  borderRight: "2px solid #ffffff",
                }}
              >
                {grandTotals.grandTotalMargin}%
              </td>

              {/* Category totals */}
              {categories.map((category, idx) =>
                renderTotalRowCategoryColumns(category, idx === 0)
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
