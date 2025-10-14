

// // pages/target-analytics/components/PercentageAnalysis.js
// import React, { useState, useEffect, useRef } from "react";
// import * as Chart from "chart.js";
// import * as XLSX from "xlsx";

// const { Chart: ChartJS, ArcElement, Tooltip, Legend } = Chart;
// ChartJS.register(ArcElement, Tooltip, Legend);

// export default function PercentageAnalysis() {
//   const [selectedType, setSelectedType] = useState("category");
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);
//   const canvasRef = useRef(null);
//   const chartRef = useRef(null);

//   const typeOptions = [
//     { value: "category", label: "Category" },
//     { value: "state", label: "State" },
//     { value: "region", label: "Region" },
//     { value: "salesperson", label: "Sales Person" },
//   ];

//   // Check for mobile viewport
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768);
//     };
    
//     checkMobile();
//     window.addEventListener("resize", checkMobile);
    
//     return () => window.removeEventListener("resize", checkMobile);
//   }, []);

//   useEffect(() => {
//     fetchData();
//   }, [selectedType]);

//   useEffect(() => {
//     if (data.length > 0 && canvasRef.current) {
//       renderChart();
//     }
//     return () => {
//       if (chartRef.current) {
//         chartRef.current.destroy();
//       }
//     };
//   }, [data, isMobile]);

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const token = localStorage.getItem("token");
//       const response = await fetch(
//         `/api/target-analytics/percentage-analysis?type=${selectedType}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );
//       const result = await response.json();
//       setData(result.data || []);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       setData([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderChart = () => {
//     if (chartRef.current) {
//       chartRef.current.destroy();
//     }

//     if (!canvasRef.current) return;

//     const ctx = canvasRef.current.getContext("2d");
//     const colors = [
//       "#15803d", "#16a34a", "#22c55e", "#4ade80", "#86efac",
//       "#bbf7d0", "#dcfce7", "#059669", "#10b981", "#34d399",
//       "#6ee7b7", "#a7f3d0", "#d1fae5", "#14532d", "#166534",
//       "#047857", "#065f46", "#064e3b", "#052e16", "#84cc16",
//     ];

//     chartRef.current = new ChartJS(ctx, {
//       type: "pie",
//       data: {
//         labels: data.map((d) => d.Field),
//         datasets: [
//           {
//             data: data.map((d) => d.PercentageSales),
//             backgroundColor: colors,
//             borderColor: "#ffffff",
//             borderWidth: 2,
//           },
//         ],
//       },
//       options: {
//         responsive: true,
//         maintainAspectRatio: true,
//         plugins: {
//           datalabels: {
//             display: false,
//           },
//           legend: {
//             position: isMobile ? "bottom" : "bottom",
//             labels: {
//               padding: isMobile ? 8 : 10,
//               font: { size: isMobile ? 9 : 10 },
//               boxWidth: isMobile ? 12 : 15,
//             },
//           },
//           tooltip: {
//             callbacks: {
//               label: function (context) {
//                 return context.label + ": " + context.parsed + "%";
//               },
//             },
//           },
//         },
//       },
//     });
//   };

//   const exportToExcel = () => {
//     if (data.length === 0) {
//       alert("No data to export");
//       return;
//     }

//     const exportData = data.map((row) => {
//       const baseData = {
//         Field: row.Field,
//         "% Sales": row.PercentageSales,
//         Target: "-",
//         Sales: row.Sales,
//         "GM %": row.GrossMarginPct,
//       };

//       if (selectedType === "category") {
//         baseData["India Sales"] = row.IndiaSales;
//         baseData["Overseas Sales"] = row.OverseasSales;
//       }

//       return baseData;
//     });

//     // Add total row
//     const totals = {
//       Field: "TOTAL",
//       "% Sales": 100.0,
//       Target: "-",
//       Sales: data.reduce((sum, row) => sum + (row.Sales || 0), 0),
//       "GM %": "-",
//     };

//     if (selectedType === "category") {
//       totals["India Sales"] = data.reduce(
//         (sum, row) => sum + (row.IndiaSales || 0),
//         0
//       );
//       totals["Overseas Sales"] = data.reduce(
//         (sum, row) => sum + (row.OverseasSales || 0),
//         0
//       );
//     }

//     exportData.push(totals);

//     const worksheet = XLSX.utils.json_to_sheet(exportData);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Percentage Analysis");
//     XLSX.writeFile(
//       workbook,
//       `Percentage_Analysis_${selectedType}_${
//         new Date().toISOString().split("T")[0]
//       }.xlsx`
//     );
//   };

//   const getFieldLabel = () => {
//     const option = typeOptions.find((opt) => opt.value === selectedType);
//     return option ? option.label : "Field";
//   };

//   if (loading) {
//     return (
//       <div
//         style={{
//           padding: isMobile ? "24px" : "48px",
//           textAlign: "center",
//           color: "#15803d",
//           fontSize: isMobile ? "14px" : "16px",
//         }}
//       >
//         <div
//           style={{
//             display: "inline-block",
//             width: isMobile ? "32px" : "40px",
//             height: isMobile ? "32px" : "40px",
//             border: "4px solid #dcfce7",
//             borderTopColor: "#15803d",
//             borderRadius: "50%",
//             animation: "spin 1s linear infinite",
//           }}
//         />
//         <p style={{ marginTop: "16px" }}>Loading data...</p>
//         <style jsx>{`
//           @keyframes spin {
//             to {
//               transform: rotate(360deg);
//             }
//           }
//         `}</style>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: isMobile ? "12px" : "24px" }}>
//       {/* Header with Dropdowns */}
//       <div
//         style={{
//           display: "flex",
//           flexDirection: isMobile ? "column" : "row",
//           justifyContent: "space-between",
//           alignItems: isMobile ? "stretch" : "center",
//           marginBottom: isMobile ? "16px" : "24px",
//           gap: isMobile ? "12px" : "16px",
//         }}
//       >
//         <h3
//           style={{
//             color: "#15803d",
//             margin: 0,
//             fontSize: isMobile ? "18px" : "22px",
//             textAlign: isMobile ? "center" : "left",
//           }}
//         >
//           Percentage Analysis - {getFieldLabel()}
//         </h3>

//         <div
//           style={{
//             display: "flex",
//             flexDirection: isMobile ? "column" : "row",
//             gap: "12px",
//             alignItems: isMobile ? "stretch" : "center",
//           }}
//         >
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: "8px",
//               justifyContent: isMobile ? "space-between" : "flex-start",
//             }}
//           >
//             <label
//               style={{
//                 color: "#15803d",
//                 fontWeight: "600",
//                 fontSize: isMobile ? "13px" : "14px",
//                 whiteSpace: "nowrap",
//               }}
//             >
//               Analysis By:
//             </label>
//             <select
//               value={selectedType}
//               onChange={(e) => setSelectedType(e.target.value)}
//               style={{
//                 padding: isMobile ? "8px 10px" : "10px 14px",
//                 borderRadius: "6px",
//                 border: "2px solid #a7f3d0",
//                 backgroundColor: "white",
//                 color: "#15803d",
//                 cursor: "pointer",
//                 fontSize: isMobile ? "13px" : "14px",
//                 fontWeight: "500",
//                 outline: "none",
//                 transition: "all 0.2s ease",
//                 flex: isMobile ? "1" : "auto",
//               }}
//               onFocus={(e) => (e.target.style.borderColor = "#15803d")}
//               onBlur={(e) => (e.target.style.borderColor = "#a7f3d0")}
//             >
//               {typeOptions.map((option) => (
//                 <option key={option.value} value={option.value}>
//                   {option.label}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <button
//             onClick={exportToExcel}
//             disabled={data.length === 0}
//             style={{
//               padding: isMobile ? "8px 14px" : "10px 18px",
//               borderRadius: "6px",
//               border: "2px solid #15803d",
//               backgroundColor: data.length === 0 ? "#d1fae5" : "#15803d",
//               color: data.length === 0 ? "#6b7280" : "white",
//               cursor: data.length === 0 ? "not-allowed" : "pointer",
//               fontSize: isMobile ? "13px" : "14px",
//               fontWeight: "600",
//               transition: "all 0.2s ease",
//               boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
//               whiteSpace: "nowrap",
//             }}
//             onMouseOver={(e) => {
//               if (data.length > 0) {
//                 e.target.style.backgroundColor = "#166534";
//                 e.target.style.transform = "translateY(-1px)";
//                 e.target.style.boxShadow = "0 4px 6px rgba(0,0,0,0.15)";
//               }
//             }}
//             onMouseOut={(e) => {
//               if (data.length > 0) {
//                 e.target.style.backgroundColor = "#15803d";
//                 e.target.style.transform = "translateY(0)";
//                 e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
//               }
//             }}
//           >
//             📥 Export to Excel
//           </button>
//         </div>
//       </div>

//       {data.length === 0 ? (
//         <div
//           style={{
//             padding: isMobile ? "32px 16px" : "48px",
//             textAlign: "center",
//             backgroundColor: "#f0fdf4",
//             borderRadius: "12px",
//             border: "2px dashed #a7f3d0",
//           }}
//         >
//           <p
//             style={{
//               color: "#15803d",
//               fontSize: isMobile ? "14px" : "16px",
//               margin: 0,
//             }}
//           >
//             No data available for the selected analysis type.
//           </p>
//         </div>
//       ) : (
//         <div
//           style={{
//             display: "flex",
//             flexDirection: isMobile ? "column" : "row",
//             gap: isMobile ? "16px" : "24px",
//             alignItems: "flex-start",
//           }}
//         >
//           {/* Pie Chart */}
//           <div
//             style={{
//               flex: isMobile ? "1" : "0 0 400px",
//               width: isMobile ? "100%" : "auto",
//               minWidth: isMobile ? "100%" : "300px",
//               padding: isMobile ? "12px" : "16px",
//               backgroundColor: "#f9fafb",
//               borderRadius: "12px",
//               border: "1px solid #e5e7eb",
//             }}
//           >
//             <canvas ref={canvasRef}></canvas>
//           </div>

//           {/* Table */}
//           <div
//             style={{
//               flex: "1",
//               width: isMobile ? "100%" : "auto",
//               minWidth: isMobile ? "100%" : "500px",
//               overflowX: "auto",
//             }}
//           >
//             <table
//               style={{
//                 width: "100%",
//                 borderCollapse: "collapse",
//                 fontSize: isMobile ? "11px" : "13px",
//                 boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
//                 borderRadius: "8px",
//                 overflow: "hidden",
//               }}
//             >
//               <thead>
//                 <tr style={{ backgroundColor: "#dcfce7" }}>
//                   <th
//                     style={{
//                       padding: isMobile ? "8px 6px" : "12px",
//                       border: "1px solid #a7f3d0",
//                       color: "#15803d",
//                       textAlign: "left",
//                       fontWeight: "700",
//                       fontSize: isMobile ? "11px" : "13px",
//                       position: "sticky",
//                       left: 0,
//                       backgroundColor: "#dcfce7",
//                       zIndex: 1,
//                     }}
//                   >
//                     {getFieldLabel()}
//                   </th>
//                   <th
//                     style={{
//                       padding: isMobile ? "8px 6px" : "12px",
//                       border: "1px solid #a7f3d0",
//                       color: "#15803d",
//                       textAlign: "right",
//                       fontWeight: "700",
//                       fontSize: isMobile ? "11px" : "13px",
//                       whiteSpace: "nowrap",
//                     }}
//                   >
//                     % Sales
//                   </th>
//                   <th
//                     style={{
//                       padding: isMobile ? "8px 6px" : "12px",
//                       border: "1px solid #a7f3d0",
//                       color: "#15803d",
//                       textAlign: "right",
//                       fontWeight: "700",
//                       fontSize: isMobile ? "11px" : "13px",
//                     }}
//                   >
//                     Target
//                   </th>
//                   <th
//                     style={{
//                       padding: isMobile ? "8px 6px" : "12px",
//                       border: "1px solid #a7f3d0",
//                       color: "#15803d",
//                       textAlign: "right",
//                       fontWeight: "700",
//                       fontSize: isMobile ? "11px" : "13px",
//                     }}
//                   >
//                     Sales
//                   </th>
//                   <th
//                     style={{
//                       padding: isMobile ? "8px 6px" : "12px",
//                       border: "1px solid #a7f3d0",
//                       color: "#15803d",
//                       textAlign: "right",
//                       fontWeight: "700",
//                       fontSize: isMobile ? "11px" : "13px",
//                     }}
//                   >
//                     GM %
//                   </th>
//                   {selectedType === "category" && (
//                     <>
//                       <th
//                         style={{
//                           padding: isMobile ? "8px 6px" : "12px",
//                           border: "1px solid #a7f3d0",
//                           color: "#15803d",
//                           textAlign: "right",
//                           fontWeight: "700",
//                           fontSize: isMobile ? "11px" : "13px",
//                           whiteSpace: "nowrap",
//                         }}
//                       >
//                         India Sales
//                       </th>
//                       <th
//                         style={{
//                           padding: isMobile ? "8px 6px" : "12px",
//                           border: "1px solid #a7f3d0",
//                           color: "#15803d",
//                           textAlign: "right",
//                           fontWeight: "700",
//                           fontSize: isMobile ? "11px" : "13px",
//                           whiteSpace: "nowrap",
//                         }}
//                       >
//                         Overseas Sales
//                       </th>
//                     </>
//                   )}
//                 </tr>
//               </thead>
//               <tbody>
//                 {data.map((row, index) => (
//                   <tr
//                     key={index}
//                     style={{
//                       backgroundColor: index % 2 === 0 ? "white" : "#f0fdf4",
//                       transition: "background-color 0.2s ease",
//                     }}
//                     onMouseOver={(e) => {
//                       if (!isMobile) {
//                         e.currentTarget.style.backgroundColor = "#e0f2fe";
//                       }
//                     }}
//                     onMouseOut={(e) => {
//                       if (!isMobile) {
//                         e.currentTarget.style.backgroundColor =
//                           index % 2 === 0 ? "white" : "#f0fdf4";
//                       }
//                     }}
//                   >
//                     <td
//                       style={{
//                         padding: isMobile ? "8px 6px" : "12px",
//                         border: "1px solid #a7f3d0",
//                         fontWeight: "600",
//                         color: "#1f2937",
//                         position: "sticky",
//                         left: 0,
//                         backgroundColor:
//                           index % 2 === 0 ? "white" : "#f0fdf4",
//                         zIndex: 1,
//                         fontSize: isMobile ? "11px" : "13px",
//                       }}
//                     >
//                       {row.Field}
//                     </td>
//                     <td
//                       style={{
//                         padding: isMobile ? "8px 6px" : "12px",
//                         border: "1px solid #a7f3d0",
//                         textAlign: "right",
//                         fontWeight: "500",
//                         color: "#15803d",
//                       }}
//                     >
//                       {row.PercentageSales}%
//                     </td>
//                     <td
//                       style={{
//                         padding: isMobile ? "8px 6px" : "12px",
//                         border: "1px solid #a7f3d0",
//                         textAlign: "right",
//                         color: "#9ca3af",
//                       }}
//                     >
//                       -
//                     </td>
//                     <td
//                       style={{
//                         padding: isMobile ? "8px 6px" : "12px",
//                         border: "1px solid #a7f3d0",
//                         textAlign: "right",
//                         fontWeight: "500",
//                         whiteSpace: "nowrap",
//                       }}
//                     >
//                       ₹{row.Sales?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                     <td
//                       style={{
//                         padding: isMobile ? "8px 6px" : "12px",
//                         border: "1px solid #a7f3d0",
//                         textAlign: "right",
//                         color:
//                           row.GrossMarginPct >= 25
//                             ? "#15803d"
//                             : row.GrossMarginPct >= 15
//                             ? "#f59e0b"
//                             : "#dc2626",
//                         fontWeight: "700",
//                       }}
//                     >
//                       {row.GrossMarginPct}%
//                     </td>
//                     {selectedType === "category" && (
//                       <>
//                         <td
//                           style={{
//                             padding: isMobile ? "8px 6px" : "12px",
//                             border: "1px solid #a7f3d0",
//                             textAlign: "right",
//                             fontWeight: "500",
//                             whiteSpace: "nowrap",
//                           }}
//                         >
//                           ₹{row.IndiaSales?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                         </td>
//                         <td
//                           style={{
//                             padding: isMobile ? "8px 6px" : "12px",
//                             border: "1px solid #a7f3d0",
//                             textAlign: "right",
//                             fontWeight: "500",
//                             whiteSpace: "nowrap",
//                           }}
//                         >
//                           ₹{row.OverseasSales?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                         </td>
//                       </>
//                     )}
//                   </tr>
//                 ))}
//                 {/* Total Row */}
//                 {data.length > 0 && (
//                   <tr
//                     style={{
//                       backgroundColor: "#dcfce7",
//                       fontWeight: "700",
//                     }}
//                   >
//                     <td
//                       style={{
//                         padding: isMobile ? "8px 6px" : "12px",
//                         border: "1px solid #a7f3d0",
//                         color: "#15803d",
//                         position: "sticky",
//                         left: 0,
//                         backgroundColor: "#dcfce7",
//                         zIndex: 1,
//                       }}
//                     >
//                       TOTAL
//                     </td>
//                     <td
//                       style={{
//                         padding: isMobile ? "8px 6px" : "12px",
//                         border: "1px solid #a7f3d0",
//                         textAlign: "right",
//                         color: "#15803d",
//                       }}
//                     >
//                       100.00%
//                     </td>
//                     <td
//                       style={{
//                         padding: isMobile ? "8px 6px" : "12px",
//                         border: "1px solid #a7f3d0",
//                         textAlign: "right",
//                         color: "#9ca3af",
//                       }}
//                     >
//                       -
//                     </td>
//                     <td
//                       style={{
//                         padding: isMobile ? "8px 6px" : "12px",
//                         border: "1px solid #a7f3d0",
//                         textAlign: "right",
//                         color: "#15803d",
//                         whiteSpace: "nowrap",
//                       }}
//                     >
//                       ₹{data.reduce((sum, row) => sum + (row.Sales || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                     <td
//                       style={{
//                         padding: isMobile ? "8px 6px" : "12px",
//                         border: "1px solid #a7f3d0",
//                         textAlign: "right",
//                         color: "#9ca3af",
//                       }}
//                     >
//                       -
//                     </td>
//                     {selectedType === "category" && (
//                       <>
//                         <td
//                           style={{
//                             padding: isMobile ? "8px 6px" : "12px",
//                             border: "1px solid #a7f3d0",
//                             textAlign: "right",
//                             color: "#15803d",
//                             whiteSpace: "nowrap",
//                           }}
//                         >
//                           ₹{data.reduce((sum, row) => sum + (row.IndiaSales || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                         </td>
//                         <td
//                           style={{
//                             padding: isMobile ? "8px 6px" : "12px",
//                             border: "1px solid #a7f3d0",
//                             textAlign: "right",
//                             color: "#15803d",
//                             whiteSpace: "nowrap",
//                           }}
//                         >
//                           ₹{data.reduce((sum, row) => sum + (row.OverseasSales || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                         </td>
//                       </>
//                     )}
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


// pages/target-analytics/components/PercentageAnalysis.js
import React, { useState, useEffect, useRef } from "react";
import * as Chart from "chart.js";
import * as XLSX from "xlsx";

const { Chart: ChartJS, ArcElement, Tooltip, Legend } = Chart;
ChartJS.register(ArcElement, Tooltip, Legend);

export default function PercentageAnalysis() {
  const [selectedType, setSelectedType] = useState("category");
  const [selectedYear, setSelectedYear] = useState("FY 2025-26");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const typeOptions = [
    { value: "category", label: "Category" },
    { value: "state", label: "State" },
    { value: "region", label: "Region" },
    { value: "salesperson", label: "Sales Person" },
  ];

  const yearOptions = ["FY 2025-26", "FY 2024-25", "Complete"];

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedType, selectedYear]);

  useEffect(() => {
    if (data.length > 0 && canvasRef.current) {
      renderChart();
    }
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, isMobile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/target-analytics/percentage-analysis?type=${selectedType}&year=${selectedYear}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      setData(result.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    const colors = [
      "#15803d", "#16a34a", "#22c55e", "#4ade80", "#86efac",
      "#bbf7d0", "#dcfce7", "#059669", "#10b981", "#34d399",
      "#6ee7b7", "#a7f3d0", "#d1fae5", "#14532d", "#166534",
      "#047857", "#065f46", "#064e3b", "#052e16", "#84cc16",
    ];

    chartRef.current = new ChartJS(ctx, {
      type: "pie",
      data: {
        labels: data.map((d) => d.Field),
        datasets: [
          {
            data: data.map((d) => d.PercentageSales),
            backgroundColor: colors,
            borderColor: "#ffffff",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          datalabels: {
            display: false,
          },
          legend: {
            position: isMobile ? "bottom" : "bottom",
            labels: {
              padding: isMobile ? 8 : 10,
              font: { size: isMobile ? 9 : 10 },
              boxWidth: isMobile ? 12 : 15,
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return context.label + ": " + context.parsed + "%";
              },
            },
          },
        },
      },
    });
  };

  const exportToExcel = () => {
    if (data.length === 0) {
      alert("No data to export");
      return;
    }

    const exportData = data.map((row) => {
      const baseData = {
        Field: row.Field,
        "% Sales": row.PercentageSales,
        Target: "-",
        Sales: row.Sales,
        "GM %": row.GrossMarginPct,
      };

      if (selectedType === "category") {
        baseData["India Sales"] = row.IndiaSales;
        baseData["Overseas Sales"] = row.OverseasSales;
      }

      return baseData;
    });

    // Add total row
    const totals = {
      Field: "TOTAL",
      "% Sales": 100.0,
      Target: "-",
      Sales: data.reduce((sum, row) => sum + (row.Sales || 0), 0),
      "GM %": "-",
    };

    if (selectedType === "category") {
      totals["India Sales"] = data.reduce(
        (sum, row) => sum + (row.IndiaSales || 0),
        0
      );
      totals["Overseas Sales"] = data.reduce(
        (sum, row) => sum + (row.OverseasSales || 0),
        0
      );
    }

    exportData.push(totals);

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Percentage Analysis");
    XLSX.writeFile(
      workbook,
      `Percentage_Analysis_${selectedType}_${selectedYear}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );
  };

  const getFieldLabel = () => {
    const option = typeOptions.find((opt) => opt.value === selectedType);
    return option ? option.label : "Field";
  };

  if (loading) {
    return (
      <div
        style={{
          padding: isMobile ? "24px" : "48px",
          textAlign: "center",
          color: "#15803d",
          fontSize: isMobile ? "14px" : "16px",
        }}
      >
        <div
          style={{
            display: "inline-block",
            width: isMobile ? "32px" : "40px",
            height: isMobile ? "32px" : "40px",
            border: "4px solid #dcfce7",
            borderTopColor: "#15803d",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ marginTop: "16px" }}>Loading data...</p>
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

  return (
    <div style={{ padding: isMobile ? "12px" : "24px" }}>
      {/* Header with Dropdowns */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          marginBottom: isMobile ? "16px" : "24px",
          gap: isMobile ? "12px" : "16px",
        }}
      >
        <h3
          style={{
            color: "#15803d",
            margin: 0,
            fontSize: isMobile ? "18px" : "22px",
            textAlign: isMobile ? "center" : "left",
          }}
        >
          Percentage Analysis - {getFieldLabel()}
        </h3>

        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: "12px",
            alignItems: isMobile ? "stretch" : "center",
          }}
        >
          {/* Financial Year Dropdown */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: isMobile ? "space-between" : "flex-start",
            }}
          >
            <label
              style={{
                color: "#15803d",
                fontWeight: "600",
                fontSize: isMobile ? "13px" : "14px",
                whiteSpace: "nowrap",
              }}
            >
              Financial Year:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                padding: isMobile ? "8px 10px" : "10px 14px",
                borderRadius: "6px",
                border: "2px solid #a7f3d0",
                backgroundColor: "white",
                color: "#15803d",
                cursor: "pointer",
                fontSize: isMobile ? "13px" : "14px",
                fontWeight: "500",
                outline: "none",
                transition: "all 0.2s ease",
                flex: isMobile ? "1" : "auto",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#15803d")}
              onBlur={(e) => (e.target.style.borderColor = "#a7f3d0")}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Analysis By Dropdown */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: isMobile ? "space-between" : "flex-start",
            }}
          >
            <label
              style={{
                color: "#15803d",
                fontWeight: "600",
                fontSize: isMobile ? "13px" : "14px",
                whiteSpace: "nowrap",
              }}
            >
              Analysis By:
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                padding: isMobile ? "8px 10px" : "10px 14px",
                borderRadius: "6px",
                border: "2px solid #a7f3d0",
                backgroundColor: "white",
                color: "#15803d",
                cursor: "pointer",
                fontSize: isMobile ? "13px" : "14px",
                fontWeight: "500",
                outline: "none",
                transition: "all 0.2s ease",
                flex: isMobile ? "1" : "auto",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#15803d")}
              onBlur={(e) => (e.target.style.borderColor = "#a7f3d0")}
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={exportToExcel}
            disabled={data.length === 0}
            style={{
              padding: isMobile ? "8px 14px" : "10px 18px",
              borderRadius: "6px",
              border: "2px solid #15803d",
              backgroundColor: data.length === 0 ? "#d1fae5" : "#15803d",
              color: data.length === 0 ? "#6b7280" : "white",
              cursor: data.length === 0 ? "not-allowed" : "pointer",
              fontSize: isMobile ? "13px" : "14px",
              fontWeight: "600",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              whiteSpace: "nowrap",
            }}
            onMouseOver={(e) => {
              if (data.length > 0) {
                e.target.style.backgroundColor = "#166534";
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 6px rgba(0,0,0,0.15)";
              }
            }}
            onMouseOut={(e) => {
              if (data.length > 0) {
                e.target.style.backgroundColor = "#15803d";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
              }
            }}
          >
            📥 Export to Excel
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div
          style={{
            padding: isMobile ? "32px 16px" : "48px",
            textAlign: "center",
            backgroundColor: "#f0fdf4",
            borderRadius: "12px",
            border: "2px dashed #a7f3d0",
          }}
        >
          <p
            style={{
              color: "#15803d",
              fontSize: isMobile ? "14px" : "16px",
              margin: 0,
            }}
          >
            No data available for the selected filters.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? "16px" : "24px",
            alignItems: "flex-start",
          }}
        >
          {/* Pie Chart */}
          <div
            style={{
              flex: isMobile ? "1" : "0 0 400px",
              width: isMobile ? "100%" : "auto",
              minWidth: isMobile ? "100%" : "300px",
              padding: isMobile ? "12px" : "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
            }}
          >
            <canvas ref={canvasRef}></canvas>
          </div>

          {/* Table - keeping the same as before */}
          <div
            style={{
              flex: "1",
              width: isMobile ? "100%" : "auto",
              minWidth: isMobile ? "100%" : "500px",
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: isMobile ? "11px" : "13px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#dcfce7" }}>
                  <th
                    style={{
                      padding: isMobile ? "8px 6px" : "12px",
                      border: "1px solid #a7f3d0",
                      color: "#15803d",
                      textAlign: "left",
                      fontWeight: "700",
                      fontSize: isMobile ? "11px" : "13px",
                      position: "sticky",
                      left: 0,
                      backgroundColor: "#dcfce7",
                      zIndex: 1,
                    }}
                  >
                    {getFieldLabel()}
                  </th>
                  <th
                    style={{
                      padding: isMobile ? "8px 6px" : "12px",
                      border: "1px solid #a7f3d0",
                      color: "#15803d",
                      textAlign: "right",
                      fontWeight: "700",
                      fontSize: isMobile ? "11px" : "13px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    % Sales
                  </th>
                  <th
                    style={{
                      padding: isMobile ? "8px 6px" : "12px",
                      border: "1px solid #a7f3d0",
                      color: "#15803d",
                      textAlign: "right",
                      fontWeight: "700",
                      fontSize: isMobile ? "11px" : "13px",
                    }}
                  >
                    Target
                  </th>
                  <th
                    style={{
                      padding: isMobile ? "8px 6px" : "12px",
                      border: "1px solid #a7f3d0",
                      color: "#15803d",
                      textAlign: "right",
                      fontWeight: "700",
                      fontSize: isMobile ? "11px" : "13px",
                    }}
                  >
                    Sales
                  </th>
                  <th
                    style={{
                      padding: isMobile ? "8px 6px" : "12px",
                      border: "1px solid #a7f3d0",
                      color: "#15803d",
                      textAlign: "right",
                      fontWeight: "700",
                      fontSize: isMobile ? "11px" : "13px",
                    }}
                  >
                    GM %
                  </th>
                  {selectedType === "category" && (
                    <>
                      <th
                        style={{
                          padding: isMobile ? "8px 6px" : "12px",
                          border: "1px solid #a7f3d0",
                          color: "#15803d",
                          textAlign: "right",
                          fontWeight: "700",
                          fontSize: isMobile ? "11px" : "13px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        India Sales
                      </th>
                      <th
                        style={{
                          padding: isMobile ? "8px 6px" : "12px",
                          border: "1px solid #a7f3d0",
                          color: "#15803d",
                          textAlign: "right",
                          fontWeight: "700",
                          fontSize: isMobile ? "11px" : "13px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Overseas Sales
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr
                    key={index}
                    style={{
                      backgroundColor: index % 2 === 0 ? "white" : "#f0fdf4",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseOver={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.backgroundColor = "#e0f2fe";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.backgroundColor =
                          index % 2 === 0 ? "white" : "#f0fdf4";
                      }
                    }}
                  >
                    <td
                      style={{
                        padding: isMobile ? "8px 6px" : "12px",
                        border: "1px solid #a7f3d0",
                        fontWeight: "600",
                        color: "#1f2937",
                        position: "sticky",
                        left: 0,
                        backgroundColor:
                          index % 2 === 0 ? "white" : "#f0fdf4",
                        zIndex: 1,
                        fontSize: isMobile ? "11px" : "13px",
                      }}
                    >
                      {row.Field}
                    </td>
                    <td
                      style={{
                        padding: isMobile ? "8px 6px" : "12px",
                        border: "1px solid #a7f3d0",
                        textAlign: "right",
                        fontWeight: "500",
                        color: "#15803d",
                      }}
                    >
                      {row.PercentageSales}%
                    </td>
                    <td
                      style={{
                        padding: isMobile ? "8px 6px" : "12px",
                        border: "1px solid #a7f3d0",
                        textAlign: "right",
                        color: "#9ca3af",
                      }}
                    >
                      -
                    </td>
                    <td
                      style={{
                        padding: isMobile ? "8px 6px" : "12px",
                        border: "1px solid #a7f3d0",
                        textAlign: "right",
                        fontWeight: "500",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ₹{row.Sales?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td
                      style={{
                        padding: isMobile ? "8px 6px" : "12px",
                        border: "1px solid #a7f3d0",
                        textAlign: "right",
                        color:
                          row.GrossMarginPct >= 25
                            ? "#15803d"
                            : row.GrossMarginPct >= 15
                            ? "#f59e0b"
                            : "#dc2626",
                        fontWeight: "700",
                      }}
                    >
                      {row.GrossMarginPct}%
                    </td>
                    {selectedType === "category" && (
                      <>
                        <td
                          style={{
                            padding: isMobile ? "8px 6px" : "12px",
                            border: "1px solid #a7f3d0",
                            textAlign: "right",
                            fontWeight: "500",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ₹{row.IndiaSales?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td
                          style={{
                            padding: isMobile ? "8px 6px" : "12px",
                            border: "1px solid #a7f3d0",
                            textAlign: "right",
                            fontWeight: "500",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ₹{row.OverseasSales?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {/* Total Row */}
                {data.length > 0 && (
                  <tr
                    style={{
                      backgroundColor: "#dcfce7",
                      fontWeight: "700",
                    }}
                  >
                    <td
                      style={{
                        padding: isMobile ? "8px 6px" : "12px",
                        border: "1px solid #a7f3d0",
                        color: "#15803d",
                        position: "sticky",
                        left: 0,
                        backgroundColor: "#dcfce7",
                        zIndex: 1,
                      }}
                    >
                      TOTAL
                    </td>
                    <td
                      style={{
                        padding: isMobile ? "8px 6px" : "12px",
                        border: "1px solid #a7f3d0",
                        textAlign: "right",
                        color: "#15803d",
                      }}
                    >
                      100.00%
                    </td>
                    <td
                      style={{
                        padding: isMobile ? "8px 6px" : "12px",
                        border: "1px solid #a7f3d0",
                        textAlign: "right",
                        color: "#9ca3af",
                      }}
                    >
                      -
                    </td>
                    <td
                      style={{
                        padding: isMobile ? "8px 6px" : "12px",
                        border: "1px solid #a7f3d0",
                        textAlign: "right",
                        color: "#15803d",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ₹{data.reduce((sum, row) => sum + (row.Sales || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td
                      style={{
                        padding: isMobile ? "8px 6px" : "12px",
                        border: "1px solid #a7f3d0",
                        textAlign: "right",
                        color: "#9ca3af",
                      }}
                    >
                      -
                    </td>
                    {selectedType === "category" && (
                      <>
                        <td
                          style={{
                            padding: isMobile ? "8px 6px" : "12px",
                            border: "1px solid #a7f3d0",
                            textAlign: "right",
                            color: "#15803d",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ₹{data.reduce((sum, row) => sum + (row.IndiaSales || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td
                          style={{
                            padding: isMobile ? "8px 6px" : "12px",
                            border: "1px solid #a7f3d0",
                            textAlign: "right",
                            color: "#15803d",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ₹{data.reduce((sum, row) => sum + (row.OverseasSales || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </>
                    )}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}