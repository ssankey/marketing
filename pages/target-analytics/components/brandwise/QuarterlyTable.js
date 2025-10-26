


// // pages/target-analytics/components/brandwise/QuarterlyTable.js
// import React from "react";
// import { calculateRowTotal } from "utils/brandwise/dataProcessing";
// import { TARGET_SALES_CR_FY_2025_26 } from "utils/brandwise/targets";

// export default function QuarterlyTable({
//   isMobile,
//   data,
//   categories,
//   onDownloadExcel,
//   targetMargins,
// }) {
//   // Fixed cell width for all data cells - increased to prevent wrapping
//   const CELL_WIDTH = isMobile ? "110px" : "130px";

//   // Convert to crores function - ROUND TO 2 DECIMALS (for ACTUAL SALES ONLY)
//   const toCrores = (value) => {
//     return (value / 10000000).toFixed(2);
//   };

//   // Month key helper (e.g., "2025-04")
//   const toMonthKey = (row) =>
//     `${row.Year}-${String(row.MonthNumber).padStart(2, "0")}`;

//   // ---------- Visible months (only what's shown on the frontend) ----------
//   const monthlyRows = data.filter((r) => !r.isQuarter && r.MonthNumber);
//   const visibleMonthKeys = new Set(
//     monthlyRows.map((r) => toMonthKey(r))
//   );

//   // ---------- Quarter helpers ----------
//   const QUARTER_MAP = {
//     Q1: [4, 5, 6],    // Apr-Jun
//     Q2: [7, 8, 9],    // Jul-Sep
//     Q3: [10, 11, 12], // Oct-Dec
//     Q4: [1, 2, 3],    // Jan-Mar
//   };

//   const getQuarterMonthNumbers = (qLabel) => QUARTER_MAP[qLabel] || [];

//   // Return only the month-keys that are BOTH (a) in that quarter, (b) currently visible
//   const getQuarterVisibleMonthKeys = (qLabel) => {
//     const monthNums = new Set(getQuarterMonthNumbers(qLabel));
//     return monthlyRows
//       .filter((r) => monthNums.has(Number(r.MonthNumber)))
//       .map((r) => toMonthKey(r))
//       .filter((k) => visibleMonthKeys.has(k));
//   };

//   // Sum quarter target (Cr) for one category across visible months
//   const calcQuarterCategoryTarget = (qLabel, category) => {
//     const keys = getQuarterVisibleMonthKeys(qLabel);
//     return keys.reduce(
//       (sum, k) => sum + (TARGET_SALES_CR_FY_2025_26?.[k]?.[category] ?? 0),
//       0
//     );
//   };

//   // Sum quarter target (Cr) for ALL categories across visible months
//   const calcQuarterRowTarget = (qLabel) => {
//     const keys = getQuarterVisibleMonthKeys(qLabel);
//     return keys.reduce((acc, k) => {
//       const rowTargets = categories.reduce(
//         (s, c) => s + (TARGET_SALES_CR_FY_2025_26?.[k]?.[c] ?? 0),
//         0
//       );
//       return acc + rowTargets;
//     }, 0);
//   };

//   // ----- GRAND TOTALS (Actuals + Targets, only visible months) -----
//   const calculateGrandTotals = () => {
//     const totals = {
//       totalSales: 0,         // sum of all actual sales (₹, not Cr)
//       totalTarget: 0,        // sum of all targets (Cr)
//       totalWeightedMargin: 0, // for weighted margin calculation
//       categorySales: {},     // actuals by category (₹, not Cr)
//       categoryTarget: {},    // targets by category (Cr)
//       categoryMargins: {},   // ADDED: weighted margins by category
//     };

//     // init per-category buckets
//     categories.forEach((c) => {
//       totals.categorySales[c] = 0;
//       totals.categoryTarget[c] = 0;
//       totals.categoryMargins[c] = {
//         totalWeightedMargin: 0,
//         totalSales: 0
//       };
//     });

//     // loop through only visible monthly rows
//     monthlyRows.forEach((row) => {
//       // actuals
//       const rowTotals = calculateRowTotal(row, categories);
//       totals.totalSales += rowTotals.totalSales;
//       totals.totalWeightedMargin += rowTotals.totalSales * (rowTotals.avgMargin / 100);
      
//       categories.forEach((cat) => {
//         const sales = row[`${cat}_Sales`] || 0;
//         const margin = row[`${cat}_Margin`] || 0;
        
//         totals.categorySales[cat] += sales;
//         totals.categoryMargins[cat].totalWeightedMargin += sales * (margin / 100);
//         totals.categoryMargins[cat].totalSales += sales;
//       });

//       // targets (Cr)
//       const mKey = toMonthKey(row);
//       let rowTarget = 0;
//       categories.forEach((cat) => {
//         const t = TARGET_SALES_CR_FY_2025_26?.[mKey]?.[cat] ?? 0;
//         totals.categoryTarget[cat] += t;
//         rowTarget += t;
//       });
//       totals.totalTarget += rowTarget;
//     });

//     // Calculate grand total margin (weighted average)
//     totals.grandTotalMargin = totals.totalSales > 0 
//       ? Number(((totals.totalWeightedMargin / totals.totalSales) * 100).toFixed(2))
//       : 0;

//     // Calculate individual category margins
//     categories.forEach(cat => {
//       const marginData = totals.categoryMargins[cat];
//       totals.categoryMargins[cat].finalMargin = marginData.totalSales > 0 ?
//         Number(((marginData.totalWeightedMargin / marginData.totalSales) * 100).toFixed(2)) : 0;
//     });

//     return totals;
//   };

//   const grandTotals = calculateGrandTotals();

//   // ----- RENDER HELPERS -----

//   // header helper
//   const getTargetMargin = (category) =>
//     targetMargins[category] || targetMargins["Other"] || 20;

//   // individual category cell block for a row
//   const renderCategoryColumns = (row, category, isFirstCategory, categoryIndex) => {
//     const sales = row[`${category}_Sales`] || 0;
//     const margin = row[`${category}_Margin`] || 0;

//     const isDarkCategory = categoryIndex % 2 === 0;
//     const bgColor = row.isQuarter
//       ? "#86efac"
//       : isDarkCategory
//       ? "#f0fdf4"
//       : "transparent";

//     // Target cell value (Cr). For quarter rows, sum visible months in that quarter.
//     let targetDisplay = "-";
//     if (row.isQuarter) {
//       const qLabel = String(row.Month || "").toUpperCase(); // "Q1","Q2","Q3","Q4"
//       const qCatTargetCr = calcQuarterCategoryTarget(qLabel, category);
//       targetDisplay = `₹${Number(qCatTargetCr).toFixed(2)} Cr`;
//     } else if (row.MonthNumber) {
//       const mKey = toMonthKey(row);
//       const targetCr = TARGET_SALES_CR_FY_2025_26?.[mKey]?.[category] ?? 0;
//       targetDisplay = `₹${Number(targetCr).toFixed(2)} Cr`;
//     }

//     return (
//       <React.Fragment key={category}>
//         {/* Target (Cr) */}
//         <td
//           style={{
//             padding: isMobile ? "8px 6px" : "12px 8px",
//             border: "1px solid #e5e7eb",
//             textAlign: "right",
//             fontSize: isMobile ? "11px" : "12px",
//             backgroundColor: bgColor,
//             fontWeight: row.isQuarter ? "600" : "400",
//             borderLeft: isFirstCategory ? "1px solid #e5e7eb" : "2px solid #d1d5db",
//             color: row.isQuarter ? "#065f46" : "#374151",
//             width: CELL_WIDTH,
//             minWidth: CELL_WIDTH,
//             maxWidth: CELL_WIDTH,
//             whiteSpace: "nowrap",
//             overflow: "hidden",
//             textOverflow: "ellipsis",
//           }}
//         >
//           {targetDisplay}
//         </td>

//         {/* Sales (Cr) */}
//         <td
//           style={{
//             padding: isMobile ? "8px 6px" : "12px 8px",
//             border: "1px solid #e5e7eb",
//             textAlign: "right",
//             fontSize: isMobile ? "11px" : "12px",
//             backgroundColor: bgColor,
//             fontWeight: row.isQuarter ? "600" : "400",
//             width: CELL_WIDTH,
//             minWidth: CELL_WIDTH,
//             maxWidth: CELL_WIDTH,
//             whiteSpace: "nowrap",
//             overflow: "hidden",
//             textOverflow: "ellipsis",
//           }}
//         >
//           ₹{toCrores(sales)} Cr
//         </td>

//         {/* Margin % */}
//         <td
//           style={{
//             padding: isMobile ? "8px 6px" : "12px 8px",
//             border: "1px solid #e5e7eb",
//             textAlign: "right",
//             fontSize: isMobile ? "11px" : "12px",
//             color:
//               margin >= 25
//                 ? "#15803d"
//                 : margin >= 15
//                 ? "#f59e0b"
//                 : "#dc2626",
//             fontWeight: "700",
//             backgroundColor: bgColor,
//             width: CELL_WIDTH,
//             minWidth: CELL_WIDTH,
//             maxWidth: CELL_WIDTH,
//             whiteSpace: "nowrap",
//             overflow: "hidden",
//             textOverflow: "ellipsis",
//           }}
//         >
//           {margin}%
//         </td>
//       </React.Fragment>
//     );
//   };

//   // bottom-grand-total: per-category cells
//   const renderTotalRowCategoryColumns = (category, isFirstCategory) => {
//     const categorySales = grandTotals.categorySales[category] || 0;
//     const categoryTargetCr = grandTotals.categoryTarget[category] || 0;
//     const categoryMargin = grandTotals.categoryMargins[category]?.finalMargin || 0;

//     return (
//       <React.Fragment key={category}>
//         {/* Target total (Cr) */}
//         <td
//           style={{
//             padding: isMobile ? "8px 6px" : "12px 8px",
//             border: "1px solid #ffffff",
//             textAlign: "right",
//             fontSize: isMobile ? "11px" : "12px",
//             backgroundColor: "#15803d",
//             fontWeight: "600",
//             borderLeft: isFirstCategory ? "1px solid #ffffff" : "2px solid #ffffff",
//             color: "#fef3c7",
//             width: CELL_WIDTH,
//             minWidth: CELL_WIDTH,
//             maxWidth: CELL_WIDTH,
//             whiteSpace: "nowrap",
//             overflow: "hidden",
//             textOverflow: "ellipsis",
//           }}
//         >
//           ₹{Number(categoryTargetCr).toFixed(2)} Cr
//         </td>

//         {/* Sales total (Cr) */}
//         <td
//           style={{
//             padding: isMobile ? "8px 6px" : "12px 8px",
//             border: "1px solid #ffffff",
//             textAlign: "right",
//             fontSize: isMobile ? "11px" : "12px",
//             backgroundColor: "#15803d",
//             fontWeight: "600",
//             color: "#fef3c7",
//             width: CELL_WIDTH,
//             minWidth: CELL_WIDTH,
//             maxWidth: CELL_WIDTH,
//             whiteSpace: "nowrap",
//             overflow: "hidden",
//             textOverflow: "ellipsis",
//           }}
//         >
//           ₹{toCrores(categorySales)} Cr
//         </td>

//         {/* Margin total - NOW CALCULATED */}
//         <td
//           style={{
//             padding: isMobile ? "8px 6px" : "12px 8px",
//             border: "1px solid #ffffff",
//             textAlign: "right",
//             fontSize: isMobile ? "11px" : "12px",
//             color:
//               categoryMargin >= 25
//                 ? "#86efac"
//                 : categoryMargin >= 15
//                 ? "#fef3c7"
//                 : "#fca5a5",
//             fontWeight: "600",
//             backgroundColor: "#15803d",
//             width: CELL_WIDTH,
//             minWidth: CELL_WIDTH,
//             maxWidth: CELL_WIDTH,
//             whiteSpace: "nowrap",
//             overflow: "hidden",
//             textOverflow: "ellipsis",
//           }}
//         >
//           {categoryMargin}%
//         </td>
//       </React.Fragment>
//     );
//   };

//   return (
//     <div>
//       {/* Header with Download Button */}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           marginBottom: "16px",
//           flexWrap: "wrap",
//           gap: "12px",
//         }}
//       >
//         <h3
//           style={{
//             color: "#15803d",
//             margin: 0,
//             fontSize: isMobile ? "16px" : "18px",
//             fontWeight: "700",
//           }}
//         >
//           Quarterly Performance Analysis
//         </h3>
//         <button
//           onClick={onDownloadExcel}
//           style={{
//             padding: isMobile ? "8px 14px" : "10px 18px",
//             backgroundColor: "#15803d",
//             color: "white",
//             border: "none",
//             borderRadius: "6px",
//             fontSize: isMobile ? "12px" : "14px",
//             fontWeight: "600",
//             cursor: "pointer",
//             display: "flex",
//             alignItems: "center",
//             gap: "6px",
//             boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
//             transition: "background-color 0.2s",
//           }}
//           onMouseOver={(e) => (e.target.style.backgroundColor = "#166534")}
//           onMouseOut={(e) => (e.target.style.backgroundColor = "#15803d")}
//         >
//           📥 Download Excel
//         </button>
//       </div>

//       {/* Scrollable Table Container */}
//       <div
//         style={{
//           overflowX: "auto",
//           boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
//           borderRadius: "8px",
//         }}
//       >
//         <table
//           style={{
//             width: "100%",
//             borderCollapse: "separate",
//             borderSpacing: 0,
//             backgroundColor: "white",
//             tableLayout: "fixed",
//           }}
//         >
//           <colgroup>
//             <col style={{ width: isMobile ? "60px" : "70px" }} />
//             <col style={{ width: isMobile ? "70px" : "80px" }} />
//             {[...categories, "Total"].map((cat, idx) => (
//               <React.Fragment key={`colgroup-${cat}-${idx}`}>
//                 <col style={{ width: CELL_WIDTH }} />
//                 <col style={{ width: CELL_WIDTH }} />
//                 <col style={{ width: CELL_WIDTH }} />
//               </React.Fragment>
//             ))}
//           </colgroup>
//           <thead>
//             <tr style={{ backgroundColor: "#15803d" }}>
//               <th
//                 rowSpan="2"
//                 style={{
//                   padding: isMobile ? "10px 8px" : "14px 10px",
//                   border: "2px solid #ffffff",
//                   color: "white",
//                   textAlign: "center",
//                   position: "sticky",
//                   left: 0,
//                   backgroundColor: "#15803d",
//                   zIndex: 3,
//                   fontSize: isMobile ? "11px" : "13px",
//                   fontWeight: "600",
//                 }}
//               >
//                 Year
//               </th>
//               <th
//                 rowSpan="2"
//                 style={{
//                   padding: isMobile ? "10px 8px" : "14px 10px",
//                   border: "2px solid #ffffff",
//                   color: "white",
//                   textAlign: "center",
//                   position: "sticky",
//                   left: isMobile ? 60 : 70,
//                   backgroundColor: "#15803d",
//                   zIndex: 3,
//                   fontSize: isMobile ? "11px" : "13px",
//                   fontWeight: "600",
//                 }}
//               >
//                 Month
//               </th>
//               {categories.map((category) => (
//                 <th
//                   key={category}
//                   colSpan="3"
//                   style={{
//                     padding: isMobile ? "10px 6px" : "14px 8px",
//                     border: "2px solid #ffffff",
//                     color: "white",
//                     textAlign: "center",
//                     fontSize: isMobile ? "11px" : "13px",
//                     fontWeight: "600",
//                   }}
//                 >
//                   {category}
//                 </th>
//               ))}
//               <th
//                 colSpan="3"
//                 style={{
//                   padding: isMobile ? "10px 6px" : "14px 8px",
//                   border: "2px solid #ffffff",
//                   color: "#fef3c7",
//                   textAlign: "center",
//                   fontSize: isMobile ? "11px" : "13px",
//                   fontWeight: "700",
//                   backgroundColor: "#166534",
//                 }}
//               >
//                 Total
//               </th>
//             </tr>
//             <tr style={{ backgroundColor: "#86efac" }}>
//               {categories.map((category) => (
//                 <React.Fragment key={`${category}-headers`}>
//                   <th
//                     style={{
//                       padding: isMobile ? "8px 4px" : "10px 6px",
//                       border: "1px solid #ffffff",
//                       color: "#15803d",
//                       textAlign: "center",
//                       fontSize: isMobile ? "10px" : "11px",
//                       fontWeight: "600",
//                       backgroundColor: "#dcfce7",
//                       width: CELL_WIDTH,
//                     }}
//                   >
//                     Target ({getTargetMargin(category)}%)
//                   </th>
//                   <th
//                     style={{
//                       padding: isMobile ? "8px 4px" : "10px 6px",
//                       border: "1px solid #ffffff",
//                       color: "#15803d",
//                       textAlign: "center",
//                       fontSize: isMobile ? "10px" : "11px",
//                       fontWeight: "600",
//                       backgroundColor: "#dcfce7",
//                       width: CELL_WIDTH,
//                     }}
//                   >
//                     Sales (Cr)
//                   </th>
//                   <th
//                     style={{
//                       padding: isMobile ? "8px 4px" : "10px 6px",
//                       border: "1px solid #ffffff",
//                       color: "#15803d",
//                       textAlign: "center",
//                       fontSize: isMobile ? "10px" : "11px",
//                       fontWeight: "600",
//                       backgroundColor: "#dcfce7",
//                       width: CELL_WIDTH,
//                     }}
//                   >
//                     Margin %
//                   </th>
//                 </React.Fragment>
//               ))}
//               {/* Total column headers */}
//               <th
//                 style={{
//                   padding: isMobile ? "8px 4px" : "10px 6px",
//                   border: "1px solid #ffffff",
//                   color: "#15803d",
//                   textAlign: "center",
//                   fontSize: isMobile ? "10px" : "11px",
//                   fontWeight: "600",
//                   backgroundColor: "#dcfce7",
//                   width: CELL_WIDTH,
//                 }}
//               >
//                 Target (Cr)
//               </th>
//               <th
//                 style={{
//                   padding: isMobile ? "8px 4px" : "10px 6px",
//                   border: "1px solid #ffffff",
//                   color: "#15803d",
//                   textAlign: "center",
//                   fontSize: isMobile ? "10px" : "11px",
//                   fontWeight: "600",
//                   backgroundColor: "#dcfce7",
//                   width: CELL_WIDTH,
//                 }}
//               >
//                 Sales (Cr)
//               </th>
//               <th
//                 style={{
//                   padding: isMobile ? "8px 4px" : "10px 6px",
//                   border: "1px solid #ffffff",
//                   color: "#15803d",
//                   textAlign: "center",
//                   fontSize: isMobile ? "10px" : "11px",
//                   fontWeight: "600",
//                   backgroundColor: "#dcfce7",
//                   width: CELL_WIDTH,
//                 }}
//               >
//                 Margin %
//               </th>
//             </tr>
//           </thead>

//           <tbody>
//             {data.map((row, index) => {
//               const totals = calculateRowTotal(row, categories);

//               // right-side Target (Cr) per row:
//               let rowTargetCr = "-";
//               if (row.isQuarter) {
//                 const qLabel = String(row.Month || "").toUpperCase();
//                 rowTargetCr = Number(calcQuarterRowTarget(qLabel)).toFixed(2);
//               } else if (row.MonthNumber) {
//                 const mKey = toMonthKey(row);
//                 const sum = categories.reduce(
//                   (acc, c) => acc + (TARGET_SALES_CR_FY_2025_26?.[mKey]?.[c] ?? 0),
//                   0
//                 );
//                 rowTargetCr = Number(sum).toFixed(2);
//               }

//               return (
//                 <tr
//                   key={`${row.Year}-${row.Month}-${index}`}
//                   style={{
//                     backgroundColor: row.isQuarter
//                       ? "#86efac"
//                       : index % 2 === 0
//                       ? "#ffffff"
//                       : "#f9fafb",
//                     fontWeight: row.isQuarter ? "600" : "400",
//                     borderBottom: row.isQuarter
//                       ? "3px solid #15803d"
//                       : "1px solid #e5e7eb",
//                   }}
//                 >
//                   {/* Year */}
//                   <td
//                     style={{
//                       padding: isMobile ? "8px 6px" : "12px 10px",
//                       border: "1px solid #e5e7eb",
//                       textAlign: "center",
//                       fontSize: isMobile ? "11px" : "13px",
//                       position: "sticky",
//                       left: 0,
//                       backgroundColor: row.isQuarter
//                         ? "#a7f3d0"
//                         : index % 2 === 0
//                         ? "#ffffff"
//                         : "#f9fafb",
//                       zIndex: 2,
//                       fontWeight: "500",
//                     }}
//                   >
//                     {row.Year}
//                   </td>

//                   {/* Month (or Quarter label) */}
//                   <td
//                     style={{
//                       padding: isMobile ? "8px 6px" : "12px 10px",
//                       border: "1px solid #e5e7eb",
//                       textAlign: "center",
//                       fontSize: isMobile ? "11px" : "13px",
//                       fontWeight: row.isQuarter ? "700" : "600",
//                       color: row.isQuarter ? "#15803d" : "#374151",
//                       position: "sticky",
//                       left: isMobile ? 60 : 70,
//                       backgroundColor: row.isQuarter
//                         ? "#86efac"
//                         : index % 2 === 0
//                         ? "#ffffff"
//                         : "#f9fafb",
//                       zIndex: 2,
//                       borderRight: "2px solid #d1d5db",
//                     }}
//                   >
//                     {row.Month}
//                   </td>

//                   {/* Category blocks: Target (Cr) | Sales (Cr) | Margin % */}
//                   {categories.map((cat, idx) =>
//                     renderCategoryColumns(row, cat, idx === 0, idx)
//                   )}

//                   {/* Row total: Target (Cr) | Sales (Cr) | Avg Margin % */}
//                   <td
//                     style={{
//                       padding: isMobile ? "8px 6px" : "12px 8px",
//                       border: "1px solid #e5e7eb",
//                       textAlign: "right",
//                       fontSize: isMobile ? "11px" : "13px",
//                       fontWeight: "700",
//                       backgroundColor: row.isQuarter ? "#86efac" : "#f0fdf4",
//                       borderLeft: "2px solid #d1d5db",
//                       color: "#065f46",
//                       width: CELL_WIDTH,
//                       minWidth: CELL_WIDTH,
//                       maxWidth: CELL_WIDTH,
//                       whiteSpace: "nowrap",
//                       overflow: "hidden",
//                       textOverflow: "ellipsis",
//                     }}
//                   >
//                     {rowTargetCr === "-" ? "-" : `₹${rowTargetCr} Cr`}
//                   </td>
//                   <td
//                     style={{
//                       padding: isMobile ? "8px 6px" : "12px 8px",
//                       border: "1px solid #e5e7eb",
//                       textAlign: "right",
//                       fontSize: isMobile ? "11px" : "13px",
//                       fontWeight: "700",
//                       backgroundColor: row.isQuarter ? "#86efac" : "#f0fdf4",
//                       width: CELL_WIDTH,
//                       minWidth: CELL_WIDTH,
//                       maxWidth: CELL_WIDTH,
//                       whiteSpace: "nowrap",
//                       overflow: "hidden",
//                       textOverflow: "ellipsis",
//                     }}
//                   >
//                     ₹{toCrores(totals.totalSales)} Cr
//                   </td>
//                   <td
//                     style={{
//                       padding: isMobile ? "8px 6px" : "12px 8px",
//                       border: "1px solid #e5e7eb",
//                       textAlign: "right",
//                       fontSize: isMobile ? "11px" : "13px",
//                       fontWeight: "700",
//                       color:
//                         totals.avgMargin >= 25
//                           ? "#15803d"
//                           : totals.avgMargin >= 15
//                           ? "#f59e0b"
//                           : "#dc2626",
//                       backgroundColor: row.isQuarter ? "#86efac" : "#f0fdf4",
//                       width: CELL_WIDTH,
//                       minWidth: CELL_WIDTH,
//                       maxWidth: CELL_WIDTH,
//                       whiteSpace: "nowrap",
//                       overflow: "hidden",
//                       textOverflow: "ellipsis",
//                     }}
//                   >
//                     {totals.avgMargin}%
//                   </td>
//                 </tr>
//               );
//             })}

//             {/* Grand Total Row */}
//             <tr
//               style={{
//                 backgroundColor: "#15803d",
//                 fontWeight: "700",
//                 borderTop: "3px solid #166534",
//               }}
//             >
//               <td
//                 style={{
//                   padding: isMobile ? "10px 6px" : "14px 10px",
//                   border: "2px solid #ffffff",
//                   color: "white",
//                   textAlign: "center",
//                   fontSize: isMobile ? "12px" : "14px",
//                   position: "sticky",
//                   left: 0,
//                   backgroundColor: "#15803d",
//                   zIndex: 2,
//                 }}
//               >
//                 Total
//               </td>
//               <td
//                 style={{
//                   padding: isMobile ? "10px 6px" : "14px 10px",
//                   border: "2px solid #ffffff",
//                   color: "white",
//                   textAlign: "center",
//                   fontSize: isMobile ? "12px" : "14px",
//                   position: "sticky",
//                   left: isMobile ? 60 : 70,
//                   backgroundColor: "#15803d",
//                   zIndex: 2,
//                   borderRight: "2px solid #ffffff",
//                 }}
//               >
//                 -
//               </td>

//               {/* Category totals across all visible months */}
//               {categories.map((category, idx) =>
//                 renderTotalRowCategoryColumns(category, idx === 0)
//               )}

//               {/* Overall totals (only visible months) */}
//               <td
//                 style={{
//                   padding: isMobile ? "10px 6px" : "14px 8px",
//                   border: "2px solid #ffffff",
//                   textAlign: "right",
//                   fontSize: isMobile ? "12px" : "14px",
//                   fontWeight: "700",
//                   backgroundColor: "#15803d",
//                   borderLeft: "2px solid #ffffff",
//                   color: "#fef3c7",
//                 }}
//               >
//                 ₹{Number(grandTotals.totalTarget).toFixed(2)} Cr
//               </td>
//               <td
//                 style={{
//                   padding: isMobile ? "10px 6px" : "14px 8px",
//                   border: "2px solid #ffffff",
//                   textAlign: "right",
//                   fontSize: isMobile ? "12px" : "14px",
//                   fontWeight: "700",
//                   backgroundColor: "#15803d",
//                   color: "#fef3c7",
//                 }}
//               >
//                 ₹{toCrores(grandTotals.totalSales)} Cr
//               </td>
//               <td
//                 style={{
//                   padding: isMobile ? "10px 6px" : "14px 8px",
//                   border: "2px solid #ffffff",
//                   textAlign: "right",
//                   fontSize: isMobile ? "12px" : "14px",
//                   fontWeight: "700",
//                   color:
//                     grandTotals.grandTotalMargin >= 25
//                       ? "#86efac"
//                       : grandTotals.grandTotalMargin >= 15
//                       ? "#fef3c7"
//                       : "#fca5a5",
//                   backgroundColor: "#15803d",
//                 }}
//               >
//                 {grandTotals.grandTotalMargin}%
//               </td>
//             </tr>
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

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
  // Fixed cell width for all data cells - increased to prevent wrapping
  const CELL_WIDTH = isMobile ? "110px" : "130px";

  // Convert to crores function - ROUND TO 2 DECIMALS (for ACTUAL SALES ONLY)
  const toCrores = (value) => {
    return (value / 10000000).toFixed(2);
  };

  // Month key helper (e.g., "2025-04")
  const toMonthKey = (row) =>
    `${row.Year}-${String(row.MonthNumber).padStart(2, "0")}`;

  // ---------- Visible months (only what's shown on the frontend) ----------
  const monthlyRows = data.filter((r) => !r.isQuarter && r.MonthNumber);

  // ---------- Quarter helpers ----------
  const QUARTER_MAP = {
    Q1: [4, 5, 6],    // Apr-Jun
    Q2: [7, 8, 9],    // Jul-Sep
    Q3: [10, 11, 12], // Oct-Dec
    Q4: [1, 2, 3],    // Jan-Mar
  };

  const getQuarterMonthNumbers = (qLabel) => QUARTER_MAP[qLabel] || [];

  // ⬇️ REVISED: constrain to months of the SAME YEAR as the quarter row
  const getQuarterVisibleMonthKeys = (qLabel, rowYear) => {
    const monthNums = new Set(getQuarterMonthNumbers(qLabel));
    return monthlyRows
      .filter((r) => r.Year === rowYear && monthNums.has(Number(r.MonthNumber)))
      .map((r) => toMonthKey(r));
  };

  // Sum quarter target (Cr) for one category across visible months in SAME YEAR
  const calcQuarterCategoryTarget = (qLabel, category, rowYear) => {
    const keys = getQuarterVisibleMonthKeys(qLabel, rowYear);
    return keys.reduce(
      (sum, k) => sum + (TARGET_SALES_CR_FY_2025_26?.[k]?.[category] ?? 0),
      0
    );
  };

  // Sum quarter target (Cr) for ALL categories across visible months in SAME YEAR
  const calcQuarterRowTarget = (qLabel, rowYear) => {
    const keys = getQuarterVisibleMonthKeys(qLabel, rowYear);
    return keys.reduce((acc, k) => {
      const rowTargets = categories.reduce(
        (s, c) => s + (TARGET_SALES_CR_FY_2025_26?.[k]?.[c] ?? 0),
        0
      );
      return acc + rowTargets;
    }, 0);
  };

  // ----- GRAND TOTALS (Actuals + Targets, only visible months) -----
  const calculateGrandTotals = () => {
    const totals = {
      totalSales: 0,         // sum of all actual sales (₹, not Cr)
      totalTarget: 0,        // sum of all targets (Cr)
      totalWeightedMargin: 0, // for weighted margin calculation
      categorySales: {},     // actuals by category (₹, not Cr)
      categoryTarget: {},    // targets by category (Cr)
      categoryMargins: {},   // weighted margins by category
    };

    // init per-category buckets
    categories.forEach((c) => {
      totals.categorySales[c] = 0;
      totals.categoryTarget[c] = 0;
      totals.categoryMargins[c] = {
        totalWeightedMargin: 0,
        totalSales: 0
      };
    });

    // loop through only visible monthly rows
    monthlyRows.forEach((row) => {
      // actuals
      const rowTotals = calculateRowTotal(row, categories);
      totals.totalSales += rowTotals.totalSales;
      totals.totalWeightedMargin += rowTotals.totalSales * (rowTotals.avgMargin / 100);
      
      categories.forEach((cat) => {
        const sales = row[`${cat}_Sales`] || 0;
        const margin = row[`${cat}_Margin`] || 0;
        
        totals.categorySales[cat] += sales;
        totals.categoryMargins[cat].totalWeightedMargin += sales * (margin / 100);
        totals.categoryMargins[cat].totalSales += sales;
      });

      // targets (Cr)
      const mKey = toMonthKey(row);
      let rowTarget = 0;
      categories.forEach((cat) => {
        const t = TARGET_SALES_CR_FY_2025_26?.[mKey]?.[cat] ?? 0;
        totals.categoryTarget[cat] += t;
        rowTarget += t;
      });
      totals.totalTarget += rowTarget;
    });

    // Calculate grand total margin (weighted average)
    totals.grandTotalMargin = totals.totalSales > 0 
      ? Number(((totals.totalWeightedMargin / totals.totalSales) * 100).toFixed(2))
      : 0;

    // Calculate individual category margins
    categories.forEach(cat => {
      const marginData = totals.categoryMargins[cat];
      totals.categoryMargins[cat].finalMargin = marginData.totalSales > 0 ?
        Number(((marginData.totalWeightedMargin / marginData.totalSales) * 100).toFixed(2)) : 0;
    });

    return totals;
  };

  const grandTotals = calculateGrandTotals();

  // ----- RENDER HELPERS -----

  // header helper
  const getTargetMargin = (category) =>
    targetMargins[category] || targetMargins["Other"] || 20;

  // individual category cell block for a row
  const renderCategoryColumns = (row, category, isFirstCategory, categoryIndex) => {
    const sales = row[`${category}_Sales`] || 0;
    const margin = row[`${category}_Margin`] || 0;

    const isDarkCategory = categoryIndex % 2 === 0;
    const bgColor = row.isQuarter
      ? "#86efac"
      : isDarkCategory
      ? "#f0fdf4"
      : "transparent";

    // Target cell value (Cr). For quarter rows, sum only months in same year.
    let targetDisplay = "-";
    if (row.isQuarter) {
      const qLabel = String(row.Month || "").toUpperCase(); // "Q1","Q2","Q3","Q4"
      const qCatTargetCr = calcQuarterCategoryTarget(qLabel, category, row.Year); // ⬅️ pass row.Year
      targetDisplay = `₹${Number(qCatTargetCr).toFixed(2)} Cr`;
    } else if (row.MonthNumber) {
      const mKey = toMonthKey(row);
      const targetCr = TARGET_SALES_CR_FY_2025_26?.[mKey]?.[category] ?? 0;
      targetDisplay = `₹${Number(targetCr).toFixed(2)} Cr`;
    }

    return (
      <React.Fragment key={category}>
        {/* Target (Cr) */}
        <td
          style={{
            padding: isMobile ? "8px 6px" : "12px 8px",
            border: "1px solid #e5e7eb",
            textAlign: "right",
            fontSize: isMobile ? "11px" : "12px",
            backgroundColor: bgColor,
            fontWeight: row.isQuarter ? "600" : "400",
            borderLeft: isFirstCategory ? "1px solid #e5e7eb" : "2px solid #d1d5db",
            color: row.isQuarter ? "#065f46" : "#374151",
            width: CELL_WIDTH,
            minWidth: CELL_WIDTH,
            maxWidth: CELL_WIDTH,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {targetDisplay}
        </td>

        {/* Sales (Cr) */}
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
          ₹{toCrores(sales)} Cr
        </td>

        {/* Margin % */}
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

  // bottom-grand-total: per-category cells
  const renderTotalRowCategoryColumns = (category, isFirstCategory) => {
    const categorySales = grandTotals.categorySales[category] || 0;
    const categoryTargetCr = grandTotals.categoryTarget[category] || 0;
    const categoryMargin = grandTotals.categoryMargins[category]?.finalMargin || 0;

    return (
      <React.Fragment key={category}>
        {/* Target total (Cr) */}
        <td
          style={{
            padding: isMobile ? "8px 6px" : "12px 8px",
            border: "1px solid #ffffff",
            textAlign: "right",
            fontSize: isMobile ? "11px" : "12px",
            backgroundColor: "#15803d",
            fontWeight: "600",
            borderLeft: isFirstCategory ? "1px solid #ffffff" : "2px solid #ffffff",
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

        {/* Sales total (Cr) */}
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
          ₹{toCrores(categorySales)} Cr
        </td>

        {/* Margin total */}
        <td
          style={{
            padding: isMobile ? "8px 6px" : "12px 8px",
            border: "1px solid #ffffff",
            textAlign: "right",
            fontSize: isMobile ? "11px" : "12px",
            color:
              categoryMargin >= 25
                ? "#86efac"
                : categoryMargin >= 15
                ? "#fef3c7"
                : "#fca5a5",
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
                    Margin %
                  </th>
                </React.Fragment>
              ))}
              {/* Total column headers */}
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
                Margin %
              </th>
            </tr>
          </thead>

          <tbody>
            {data.map((row, index) => {
              const totals = calculateRowTotal(row, categories);

              // right-side Target (Cr) per row:
              let rowTargetCr = "-";
              if (row.isQuarter) {
                const qLabel = String(row.Month || "").toUpperCase();
                rowTargetCr = Number(calcQuarterRowTarget(qLabel, row.Year)).toFixed(2); // ⬅️ pass row.Year
              } else if (row.MonthNumber) {
                const mKey = toMonthKey(row);
                const sum = categories.reduce(
                  (acc, c) => acc + (TARGET_SALES_CR_FY_2025_26?.[mKey]?.[c] ?? 0),
                  0
                );
                rowTargetCr = Number(sum).toFixed(2);
              }

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
                  {/* Year */}
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

                  {/* Month (or Quarter label) */}
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

                  {/* Category blocks: Target (Cr) | Sales (Cr) | Margin % */}
                  {categories.map((cat, idx) =>
                    renderCategoryColumns(row, cat, idx === 0, idx)
                  )}

                  {/* Row total: Target (Cr) | Sales (Cr) | Avg Margin % */}
                  <td
                    style={{
                      padding: isMobile ? "8px 6px" : "12px 8px",
                      border: "1px solid #e5e7eb",
                      textAlign: "right",
                      fontSize: isMobile ? "11px" : "13px",
                      fontWeight: "700",
                      backgroundColor: row.isQuarter ? "#86efac" : "#f0fdf4",
                      borderLeft: "2px solid #d1d5db",
                      color: "#065f46",
                      width: CELL_WIDTH,
                      minWidth: CELL_WIDTH,
                      maxWidth: CELL_WIDTH,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {rowTargetCr === "-" ? "-" : `₹${rowTargetCr} Cr`}
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
                    ₹{toCrores(totals.totalSales)} Cr
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

              {/* Category totals across all visible months */}
              {categories.map((category, idx) =>
                renderTotalRowCategoryColumns(category, idx === 0)
              )}

              {/* Overall totals (only visible months) */}
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
                ₹{Number(grandTotals.totalTarget).toFixed(2)} Cr
              </td>
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
                ₹{toCrores(grandTotals.totalSales)} Cr
              </td>
              <td
                style={{
                  padding: isMobile ? "10px 6px" : "14px 8px",
                  border: "2px solid #ffffff",
                  textAlign: "right",
                  fontSize: isMobile ? "12px" : "14px",
                  fontWeight: "700",
                  color:
                    grandTotals.grandTotalMargin >= 25
                      ? "#86efac"
                      : grandTotals.grandTotalMargin >= 15
                      ? "#fef3c7"
                      : "#fca5a5",
                  backgroundColor: "#15803d",
                }}
              >
                {grandTotals.grandTotalMargin}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
