
// // import React, { useState, useEffect, useRef } from "react";
// // import * as Chart from "chart.js";
// // import * as XLSX from "xlsx";
// // import InvoiceFilterModal from "../../../components/modal/TargetInvoiceDetailsModal";

// // const { Chart: ChartJS, ArcElement, Tooltip, Legend } = Chart;
// // ChartJS.register(ArcElement, Tooltip, Legend);

// // export default function PercentageAnalysis() {
// //   const [selectedType, setSelectedType] = useState("region");
// //   const [selectedYear, setSelectedYear] = useState("FY 2025-26");
// //   const [data, setData] = useState([]);
// //   const [loading, setLoading] = useState(false);
// //   const [isMobile, setIsMobile] = useState(false);
// //   const canvasRef = useRef(null);
// //   const chartRef = useRef(null);

// //   const [showInvoiceFilter, setShowInvoiceFilter] = useState(false);
// // const [selectedFieldForInvoice, setSelectedFieldForInvoice] = useState(null);

// //   const categoryMapping = {
// //     Items: "Trading",
// //     "3A Chemicals": "3A Chemicals",
// //     Catalyst: "Density",
// //     Solvent: "Density",
// //     Polymer: "Density",
// //     "Fine Chemicals": "Density",
// //     Reagent: "Density",
// //     "Biological Buffers": "Life Science",
// //     Intermediates: "Density",
// //     API: "CATO",
// //     "Stable Isotope reagents": "Deutero",
// //     "Building Blocks": "Density",
// //     Membranes: "Life Science",
// //     "Laboratory Containers & Storage": "FD Cell",
// //     Enzyme: "Life Science",
// //     Biochemicals: "Life Science",
// //     "Reference Materials": "KANTO",
// //     "Secondary Standards": "KANTO",
// //     Instruments: "BIKAI",
// //     Services: "NULL",
// //     "Analytical Standards": "KANTO",
// //     "Nucleosides and Nucleotides": "Life Science",
// //     Nitrosamine: "CATO",
// //     "Pesticide Standards": "CATO",
// //     Trading: "Trading",
// //     Carbohydrates: "Life Science",
// //     "USP Standards": "CATO",
// //     "EP Standards": "CATO",
// //     "Indian pharmacopoeia": "CATO",
// //     "British Pharmacopoeia": "CATO",
// //     Impurity: "CATO",
// //     "NMR Solvents": "Deutero",
// //     "Stable isotopes": "Deutero",
// //     Glucuronides: "CATO",
// //     Metabolites: "CATO",
// //     Capricorn: "Capricorn",
// //     "Analytical Instruments": "BIKAI",
// //     "Lab Consumables": "FD Cell",
// //     "Equipment and Instruments": "BIKAI",
// //     Ultrapur: "KANTO",
// //     Dyes: "Density",
// //     "New Life Biologics": "Life Science",
// //     "Food Grade": "Life Science",
// //     "Lab Systems & Fixtures": "BIKAI",
// //     Peptides: "Life Science",
// //     "Ultrapur-100": "KANTO",
// //     "Amino Acids": "Life Science",
// //     "Cell Culture": "Life Science",
// //     "Natural Products": "Life Science",
// //     "Multiple Pharmacopoeia": "CATO",
// //     "Metal Standard Solutions": "KANTO",
// //     "High Purity Acids": "KANTO",
// //     "HPLC consumables": "BIKAI",
// //     "HPLC configurations": "BIKAI",
// //     VOLAB: "VOLAB",
// //     "Life science": "Life Science",
// //     Kanto: "KANTO",
// //     "Meatls&materials": "Density",
// //   };

// //   const regionTargets = {
// //     Central: 10.9,
// //     "West 1": 5.4,
// //     North: 5.4,
// //     South: 7.2,
// //     "West 2": 5.4,
// //     East: 1.8,
// //   };

// //   const categoryTargetsSplit = {
// //     Trading: { total: 20, india: 0, overseas: 20 },
// //     Density: { total: 6.8, india: 3.8, overseas: 3.0 },
// //     "3A Chemicals": { total: 8.7, india: 8.7, overseas: 0 },
// //     Deutero: { total: 17, india: 6, overseas: 11 },
// //     BIKAI: { total: 5.3, india: 5.3, overseas: 0 },
// //     "Life Science": { total: 0, india: 0, overseas: 0 },
// //     CATO: { total: 4.15, india: 4.15, overseas: 0 },
// //     Capricorn: { total: 0.86, india: 0.86, overseas: 0 },
// //     "FD Cell": { total: 3.46, india: 3.46, overseas: 0 },
// //     KANTO: { total: 1.4, india: 1.4, overseas: 0 },
// //   };

// //   const toCrores = (value) => (value / 10000000).toFixed(2);

// //   const shouldShowTargets = selectedYear === "FY 2025-26";

// //   const mergePercentageCategories = (rawData) => {
// //     const mergedData = {};

// //     rawData.forEach((row) => {
// //       const targetCategory = categoryMapping[row.Field] || "Other";
// //       if (targetCategory === "NULL") return;

// //       if (!mergedData[targetCategory]) {
// //         mergedData[targetCategory] = {
// //           Field: targetCategory,
// //           IndiaSales: 0,
// //           OverseasSales: 0,
// //           TotalSales: 0,
// //           GrossProfit: 0,
// //         };
// //       }

// //       mergedData[targetCategory].IndiaSales += row.IndiaSales || 0;
// //       mergedData[targetCategory].OverseasSales += row.OverseasSales || 0;
// //       mergedData[targetCategory].TotalSales += row.Sales || 0;

// //       const gp = row.GrossProfit || 0;
// //       if (gp > 0) {
// //         mergedData[targetCategory].GrossProfit += gp;
// //       } else {
// //         const marginPct = row.GrossMarginPct || 0;
// //         const sales = row.Sales || 0;
// //         mergedData[targetCategory].GrossProfit += sales * (marginPct / 100);
// //       }
// //     });

// //     const finalData = Object.values(mergedData);
// //     const grandTotalSales = finalData.reduce((s, r) => s + r.TotalSales, 0);

// //     const processedData = finalData.map((row) => {
// //       const marginValue =
// //         row.TotalSales > 0 ? (row.GrossProfit / row.TotalSales) * 100 : 0;

// //       const split = categoryTargetsSplit[row.Field] || {
// //         total: 0,
// //         india: 0,
// //         overseas: 0,
// //       };

// //       return {
// //         Field: row.Field,
// //         PercentageSales:
// //           grandTotalSales > 0
// //             ? Number(((row.TotalSales / grandTotalSales) * 100).toFixed(2))
// //             : 0,
// //         Sales: row.TotalSales,
// //         GrossMarginPct: Number(marginValue.toFixed(2)),
// //         GrossProfit: row.GrossProfit,
// //         IndiaSales: row.IndiaSales,
// //         OverseasSales: row.OverseasSales,
// //         Target: split.total,
// //         TargetIndia: split.india,
// //         TargetOverseas: split.overseas,
// //       };
// //     });

// //     processedData.sort((a, b) => b.Sales - a.Sales);
// //     return processedData;
// //   };

// //   const handleCheckSales = (fieldValue) => {
// //   setSelectedFieldForInvoice(fieldValue);
// //   setShowInvoiceFilter(true);
// // };


// //   const processAllTypesData = (rawData) => {
// //     if (!rawData || rawData.length === 0) return [];
// //     const grandTotalSales = rawData.reduce((s, r) => s + (r.Sales || 0), 0);

// //     const processedData = rawData.map((row) => {
// //       let grossProfit = row.GrossProfit || 0;
// //       if (grossProfit === 0 && row.GrossMarginPct && row.Sales) {
// //         grossProfit = (row.Sales || 0) * ((row.GrossMarginPct || 0) / 100);
// //       }

// //       const apiTarget = typeof row.Target === "number" ? row.Target : 0;
// //       const mappedTarget =
// //         selectedType === "region" ? regionTargets[row.Field] ?? 0 : 0;

// //       return {
// //         Field: row.Field,
// //         PercentageSales:
// //           grandTotalSales > 0
// //             ? Number((((row.Sales || 0) / grandTotalSales) * 100).toFixed(2))
// //             : 0,
// //         Sales: row.Sales || 0,
// //         GrossMarginPct: row.GrossMarginPct || 0,
// //         GrossProfit: grossProfit,
// //         IndiaSales: row.IndiaSales || 0,
// //         OverseasSales: row.OverseasSales || 0,
// //         Target: apiTarget || mappedTarget,
// //       };
// //     });

// //     processedData.sort((a, b) => b.Sales - a.Sales);
// //     return processedData;
// //   };

// //   const calculateTotalMargin = (d) => {
// //     if (!d || d.length === 0) return 0;
// //     const totalSales = d.reduce((s, r) => s + (r.Sales || 0), 0);
// //     const totalGP = d.reduce((s, r) => s + (r.GrossProfit || 0), 0);
// //     return totalSales > 0 ? Number(((totalGP / totalSales) * 100).toFixed(2)) : 0;
// //   };

// //   const ProgressBar = ({ current, target, label, compact = false }) => {
// //     const currentCr = typeof current === "number" ? current / 10000000 : 0;
// //     const targetCr = typeof target === "number" ? target : 0;
// //     const percentage = targetCr > 0 ? Math.min((currentCr / targetCr) * 100, 100) : 0;

// //     const getColor = (pct) => {
// //       if (pct >= 80) return "#15803d";
// //       if (pct >= 60) return "#22c55e";
// //       if (pct >= 40) return "#f59e0b";
// //       return "#dc2626";
// //     };

// //     return (
// //       <div style={{ width: "100%", minWidth: compact ? "140px" : "200px", padding: compact ? "6px" : "8px" }}>
// //         <div style={{
// //           display: "flex", justifyContent: "space-between", alignItems: "center",
// //           marginBottom: "6px", fontSize: compact ? "12px" : "13px",
// //           fontWeight: "700", color: "#1f2937"
// //         }}>
// //           {label && <span>{label}</span>}
// //           <span style={{ color: getColor(percentage), fontSize: compact ? "13px" : "14px", marginLeft: label ? "8px" : 0 }}>
// //             {percentage.toFixed(1)}%
// //           </span>
// //         </div>

// //         <div style={{
// //           width: "100%", height: compact ? "24px" : "28px", backgroundColor: "#f3f4f6",
// //           borderRadius: "10px", overflow: "hidden", position: "relative",
// //           border: "1.5px solid #e5e7eb", boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
// //         }}>
// //           <div style={{
// //             width: `${percentage}%`, height: "100%", backgroundColor: getColor(percentage),
// //             transition: "width 0.4s ease", borderRadius: "10px",
// //             boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)"
// //           }} />
// //           <div style={{
// //             position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
// //             fontSize: compact ? "11px" : "12px", fontWeight: "700",
// //             color: percentage > 40 ? "white" : "#1f2937",
// //             textShadow: percentage > 40 ? "0 1px 3px rgba(0,0,0,0.4)" : "none",
// //             whiteSpace: "nowrap", letterSpacing: "0.3px"
// //           }}>
// //             ₹{currentCr.toFixed(2)} / ₹{targetCr.toFixed(2)} Cr
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   };

// //   const typeOptions = [
// //     { value: "category", label: "Category" },
// //     { value: "state", label: "State" },
// //     { value: "region", label: "Region" },
// //     { value: "salesperson", label: "Sales Person" },
// //   ];

// //   const yearOptions = ["FY 2025-26", "FY 2024-25", "Complete"];

// //   useEffect(() => {
// //     const onResize = () => setIsMobile(window.innerWidth < 768);
// //     onResize();
// //     window.addEventListener("resize", onResize);
// //     return () => window.removeEventListener("resize", onResize);
// //   }, []);

// //   useEffect(() => {
// //     fetchData();
// //   }, [selectedType, selectedYear]);

// //   useEffect(() => {
// //     if (data.length > 0 && canvasRef.current) renderChart();
// //     return () => {
// //       if (chartRef.current) chartRef.current.destroy();
// //     };
// //   }, [data, isMobile]);

// //   const fetchData = async () => {
// //     setLoading(true);
// //     try {
// //       const token = localStorage.getItem("token");
// //       const response = await fetch(
// //         `/api/target-analytics/percentage-analysis?type=${selectedType}&year=${selectedYear}`,
// //         { headers: { Authorization: `Bearer ${token}` } }
// //       );
// //       const result = await response.json();

// //       let processed = [];
// //       if (result.data) {
// //         processed =
// //           selectedType === "category"
// //             ? mergePercentageCategories(result.data)
// //             : processAllTypesData(result.data);
// //       }
// //       setData(processed);
// //     } catch (e) {
// //       console.error("Error fetching data:", e);
// //       setData([]);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const renderChart = () => {
// //     if (chartRef.current) chartRef.current.destroy();
// //     if (!canvasRef.current) return;

// //     const ctx = canvasRef.current.getContext("2d");
// //     const colors = [
// //       "#15803d", "#16a34a", "#22c55e", "#4ade80", "#86efac",
// //       "#bbf7d0", "#dcfce7", "#059669", "#10b981", "#34d399",
// //       "#6ee7b7", "#a7f3d0", "#d1fae5", "#14532d", "#166534",
// //       "#047857", "#065f46", "#064e3b", "#052e16", "#84cc16",
// //     ];

// //     chartRef.current = new ChartJS(ctx, {
// //       type: "pie",
// //       data: {
// //         labels: data.map((d) => d.Field),
// //         datasets: [
// //           {
// //             data: data.map((d) => d.PercentageSales),
// //             backgroundColor: colors,
// //             borderColor: "#ffffff",
// //             borderWidth: 2,
// //           },
// //         ],
// //       },
// //       options: {
// //         responsive: true,
// //         maintainAspectRatio: true,
// //         plugins: {
// //           datalabels: { display: false },
// //           legend: {
// //             position: "bottom",
// //             labels: {
// //               padding: isMobile ? 8 : 10,
// //               font: { size: isMobile ? 9 : 10 },
// //               boxWidth: isMobile ? 12 : 15,
// //             },
// //           },
// //           tooltip: {
// //             callbacks: {
// //               label: (ctx) => `${ctx.label}: ${ctx.parsed}%`,
// //             },
// //           },
// //         },
// //       },
// //     });
// //   };

// //   const exportToExcel = () => {
// //     if (data.length === 0) {
// //       alert("No data to export");
// //       return;
// //     }

// //     const totalMargin = calculateTotalMargin(data);
// //     const isCategory = selectedType === "category";
// //     const showTarget = shouldShowTargets && (isCategory || selectedType === "region");

// //     const exportData = data.map((row) => {
// //       const base = {
// //         Field: row.Field,
// //         "Sales (Cr)": toCrores(row.Sales),
// //         "% Sales": row.PercentageSales,
// //         "GM %": row.GrossMarginPct,
// //       };

// //       if (showTarget) {
// //         base["Target (Cr)"] = (row.Target || 0).toFixed(2);
// //         const currentCr = parseFloat(toCrores(row.Sales));
// //         const targetCr = row.Target || 0;
// //         base["Achievement %"] = targetCr > 0 ? ((currentCr / targetCr) * 100).toFixed(1) : "0.0";
// //       }
// //       if (isCategory) {
// //         base["India Sales (Cr)"] = toCrores(row.IndiaSales);
// //         base["Overseas Sales (Cr)"] = toCrores(row.OverseasSales);
// //         if (shouldShowTargets) {
// //           base["India Target (Cr)"] = Number(row.TargetIndia || 0).toFixed(2);
// //           base["Overseas Target (Cr)"] = Number(row.TargetOverseas || 0).toFixed(2);

// //           const indiaCurrentCr = parseFloat(toCrores(row.IndiaSales));
// //           const indiaTargetCr = row.TargetIndia || 0;
// //           base["India Achievement %"] =
// //             indiaTargetCr > 0 ? ((indiaCurrentCr / indiaTargetCr) * 100).toFixed(1) : "0.0";

// //           const overseasCurrentCr = parseFloat(toCrores(row.OverseasSales));
// //           const overseasTargetCr = row.TargetOverseas || 0;
// //           base["Overseas Achievement %"] =
// //             overseasTargetCr > 0 ? ((overseasCurrentCr / overseasTargetCr) * 100).toFixed(1) : "0.0";
// //         }
// //       }
// //       return base;
// //     });

// //     const totals = {
// //       Field: "TOTAL",
// //       "Sales (Cr)": toCrores(data.reduce((s, r) => s + (r.Sales || 0), 0)),
// //       "% Sales": 100.0,
// //       "GM %": totalMargin,
// //     };

// //     if (showTarget) {
// //       const totalTargets = data.reduce((s, r) => s + (r.Target || 0), 0);
// //       totals["Target (Cr)"] = totalTargets.toFixed(2);
// //       const totalSalesCr = parseFloat(toCrores(data.reduce((s, r) => s + (r.Sales || 0), 0)));
// //       totals["Achievement %"] = totalTargets > 0 ? ((totalSalesCr / totalTargets) * 100).toFixed(1) : "0.0";
// //     }
// //     if (isCategory) {
// //       totals["India Sales (Cr)"] = toCrores(data.reduce((s, r) => s + (r.IndiaSales || 0), 0));
// //       totals["Overseas Sales (Cr)"] = toCrores(data.reduce((s, r) => s + (r.OverseasSales || 0), 0));
// //       if (shouldShowTargets) {
// //         const totalIndiaTarget = data.reduce((s, r) => s + (r.TargetIndia || 0), 0);
// //         const totalOverseasTarget = data.reduce((s, r) => s + (r.TargetOverseas || 0), 0);
// //         totals["India Target (Cr)"] = totalIndiaTarget.toFixed(2);
// //         totals["Overseas Target (Cr)"] = totalOverseasTarget.toFixed(2);

// //         const totalIndiaSalesCr = parseFloat(
// //           toCrores(data.reduce((s, r) => s + (r.IndiaSales || 0), 0))
// //         );
// //         totals["India Achievement %"] =
// //           totalIndiaTarget > 0 ? ((totalIndiaSalesCr / totalIndiaTarget) * 100).toFixed(1) : "0.0";

// //         const totalOverseasSalesCr = parseFloat(
// //           toCrores(data.reduce((s, r) => s + (r.OverseasSales || 0), 0))
// //         );
// //         totals["Overseas Achievement %"] =
// //           totalOverseasTarget > 0 ? ((totalOverseasSalesCr / totalOverseasTarget) * 100).toFixed(1) : "0.0";
// //       }
// //     }

// //     exportData.push(totals);

// //     const ws = XLSX.utils.json_to_sheet(exportData);
// //     const wb = XLSX.utils.book_new();
// //     XLSX.utils.book_append_sheet(wb, ws, "Percentage Analysis");
// //     XLSX.writeFile(
// //       wb,
// //       `Percentage_Analysis_${selectedType}_${selectedYear}_${new Date().toISOString().split("T")[0]}.xlsx`
// //     );
// //   };

// //   const getFieldLabel = () => {
// //     const opt = typeOptions.find((o) => o.value === selectedType);
// //     return opt ? opt.label : "Field";
// //   };

// //   if (loading) {
// //     return (
// //       <div
// //         style={{
// //           padding: isMobile ? "24px" : "48px",
// //           textAlign: "center",
// //           color: "#15803d",
// //           fontSize: isMobile ? "14px" : "16px",
// //         }}
// //       >
// //         <div
// //           style={{
// //             display: "inline-block",
// //             width: isMobile ? "32px" : "40px",
// //             height: isMobile ? "32px" : "40px",
// //             border: "4px solid #dcfce7",
// //             borderTopColor: "#15803d",
// //             borderRadius: "50%",
// //             animation: "spin 1s linear infinite",
// //           }}
// //         />
// //         <p style={{ marginTop: "16px" }}>Loading data...</p>
// //         <style jsx>{`
// //           @keyframes spin {
// //             to {
// //               transform: rotate(360deg);
// //             }
// //           }
// //         `}</style>
// //       </div>
// //     );
// //   }

// //   const totalMargin = calculateTotalMargin(data);
// //   const isCategory = selectedType === "category";
// //   const showTarget = shouldShowTargets && (selectedType === "category" || selectedType === "region");

// //   const totalTargets = showTarget ? data.reduce((s, r) => s + (r.Target || 0), 0) : 0;
// //   const totalIndiaTarget = showTarget && isCategory
// //     ? data.reduce((s, r) => s + (r.TargetIndia || 0), 0)
// //     : 0;
// //   const totalOverseasTarget = showTarget && isCategory
// //     ? data.reduce((s, r) => s + (r.TargetOverseas || 0), 0)
// //     : 0;

// //   return (
// //     <div style={{ padding: isMobile ? "12px" : "24px" }}>
// //       {/* Header */}
// //       <div
// //         style={{
// //           display: "flex",
// //           flexDirection: isMobile ? "column" : "row",
// //           justifyContent: "space-between",
// //           alignItems: isMobile ? "stretch" : "center",
// //           marginBottom: isMobile ? "16px" : "24px",
// //           gap: isMobile ? "12px" : "16px",
// //         }}
// //       >
// //         <h3
// //           style={{
// //             color: "#15803d",
// //             margin: 0,
// //             fontSize: isMobile ? "18px" : "22px",
// //             textAlign: isMobile ? "center" : "left",
// //           }}
// //         >
// //           Percentage Analysis - {getFieldLabel()}
// //         </h3>

// //         <div
// //           style={{
// //             display: "flex",
// //             flexDirection: isMobile ? "column" : "row",
// //             gap: "12px",
// //             alignItems: isMobile ? "stretch" : "center",
// //           }}
// //         >
// //           <div
// //             style={{
// //               display: "flex",
// //               alignItems: "center",
// //               gap: "8px",
// //               justifyContent: isMobile ? "space-between" : "flex-start",
// //             }}
// //           >
// //             <label
// //               style={{
// //                 color: "#15803d",
// //                 fontWeight: "600",
// //                 fontSize: isMobile ? "13px" : "14px",
// //                 whiteSpace: "nowrap",
// //               }}
// //             >
// //               Financial Year:
// //             </label>
// //             <select
// //               value={selectedYear}
// //               onChange={(e) => setSelectedYear(e.target.value)}
// //               style={{
// //                 padding: isMobile ? "8px 10px" : "10px 14px",
// //                 borderRadius: "6px",
// //                 border: "2px solid #a7f3d0",
// //                 backgroundColor: "white",
// //                 color: "#15803d",
// //                 cursor: "pointer",
// //                 fontSize: isMobile ? "13px" : "14px",
// //                 fontWeight: "500",
// //                 outline: "none",
// //                 transition: "all 0.2s ease",
// //                 flex: isMobile ? "1" : "auto",
// //               }}
// //               onFocus={(e) => (e.target.style.borderColor = "#15803d")}
// //               onBlur={(e) => (e.target.style.borderColor = "#a7f3d0")}
// //             >
// //               {yearOptions.map((y) => (
// //                 <option key={y} value={y}>
// //                   {y}
// //                 </option>
// //               ))}
// //             </select>
// //           </div>

// //           <div
// //             style={{
// //               display: "flex",
// //               alignItems: "center",
// //               gap: "8px",
// //               justifyContent: isMobile ? "space-between" : "flex-start",
// //             }}
// //           >
// //             <label
// //               style={{
// //                 color: "#15803d",
// //                 fontWeight: "600",
// //                 fontSize: isMobile ? "13px" : "14px",
// //                 whiteSpace: "nowrap",
// //               }}
// //             >
// //               Analysis By:
// //             </label>
// //             <select
// //               value={selectedType}
// //               onChange={(e) => setSelectedType(e.target.value)}
// //               style={{
// //                 padding: isMobile ? "8px 10px" : "10px 14px",
// //                 borderRadius: "6px",
// //                 border: "2px solid #a7f3d0",
// //                 backgroundColor: "white",
// //                 color: "#15803d",
// //                 cursor: "pointer",
// //                 fontSize: isMobile ? "13px" : "14px",
// //                 fontWeight: "500",
// //                 outline: "none",
// //                 transition: "all 0.2s ease",
// //                 flex: isMobile ? "1" : "auto",
// //               }}
// //               onFocus={(e) => (e.target.style.borderColor = "#15803d")}
// //               onBlur={(e) => (e.target.style.borderColor = "#a7f3d0")}
// //             >
// //               {typeOptions.map((o) => (
// //                 <option key={o.value} value={o.value}>
// //                   {o.label}
// //                 </option>
// //               ))}
// //             </select>
// //           </div>

// //           <button
// //             onClick={exportToExcel}
// //             disabled={data.length === 0}
// //             style={{
// //               padding: isMobile ? "8px 14px" : "10px 18px",
// //               borderRadius: "6px",
// //               border: "2px solid #15803d",
// //               backgroundColor: data.length === 0 ? "#d1fae5" : "#15803d",
// //               color: data.length === 0 ? "#6b7280" : "white",
// //               cursor: data.length === 0 ? "not-allowed" : "pointer",
// //               fontSize: isMobile ? "13px" : "14px",
// //               fontWeight: "600",
// //               transition: "all 0.2s ease",
// //               boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
// //               whiteSpace: "nowrap",
// //             }}
// //             onMouseOver={(e) => {
// //               if (data.length > 0) {
// //                 e.target.style.backgroundColor = "#166534";
// //                 e.target.style.transform = "translateY(-1px)";
// //                 e.target.style.boxShadow = "0 4px 6px rgba(0,0,0,0.15)";
// //               }
// //             }}
// //             onMouseOut={(e) => {
// //               if (data.length > 0) {
// //                 e.target.style.backgroundColor = "#15803d";
// //                 e.target.style.transform = "translateY(0)";
// //                 e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
// //               }
// //             }}
// //           >
// //             📥 Export to Excel
// //           </button>
// //         </div>
// //       </div>

// //       {data.length === 0 ? (
// //         <div
// //           style={{
// //             padding: isMobile ? "32px 16px" : "48px",
// //             textAlign: "center",
// //             backgroundColor: "#f0fdf4",
// //             borderRadius: "12px",
// //             border: "2px dashed #a7f3d0",
// //           }}
// //         >
// //           <p style={{ color: "#15803d", fontSize: isMobile ? "14px" : "16px", margin: 0 }}>
// //             No data available for the selected filters.
// //           </p>
// //         </div>
// //       ) : (
// //         <div
// //           style={{
// //             display: "flex",
// //             flexDirection: isMobile ? "column" : "row",
// //             gap: isMobile ? "16px" : "24px",
// //             alignItems: "flex-start",
// //           }}
// //         >
// //           {/* Pie */}
// //           {/* <div
// //             style={{
// //               flex: isMobile ? "1" : "0 0 400px",
// //               width: isMobile ? "100%" : "auto",
// //               minWidth: isMobile ? "100%" : "300px",
// //               padding: isMobile ? "12px" : "16px",
// //               backgroundColor: "#f9fafb",
// //               borderRadius: "12px",
// //               border: "1px solid #e5e7eb",
// //             }}
// //           >
// //             <canvas ref={canvasRef}></canvas>
// //           </div> */}

// //           {/* Table */}
// //           <div
// //             style={{
// //               flex: "1",
// //               width: isMobile ? "100%" : "auto",
// //               minWidth: isMobile ? "100%" : "900px",
// //               overflowX: "auto",
// //             }}
// //           >
// //             <table
// //               style={{
// //                 width: "100%",
// //                 borderCollapse: "collapse",
// //                 fontSize: isMobile ? "11px" : "13px",
// //                 boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
// //                 borderRadius: "8px",
// //                 overflow: "hidden",
// //               }}
// //             >
// //               <thead>
// //                 <tr style={{ backgroundColor: "#dcfce7" }}>
// //                   <th
// //                     style={{
// //                       padding: isMobile ? "8px 6px" : "12px",
// //                       border: "1px solid #a7f3d0",
// //                       color: "#15803d",
// //                       textAlign: "left",
// //                       fontWeight: "700",
// //                       fontSize: isMobile ? "11px" : "13px",
// //                       position: "sticky",
// //                       left: 0,
// //                       backgroundColor: "#dcfce7",
// //                       zIndex: 1,
// //                     }}
// //                   >
// //                     {getFieldLabel()}
// //                   </th>
                  
// //                   {/* MOVED: Total columns first */}
// //                   <th style={thRight}>Sales (Cr)</th>
// //                   <th style={thRight}>% Sales</th>
                  
// //                   {showTarget && (
// //                     <th style={{ ...thRight, minWidth: "220px" }}>Target Achievement</th>
// //                   )}
                  
// //                   <th style={thRight}>GM %</th>

// //                   {/* Category-specific columns */}
// //                   {isCategory && (
// //                     <>
// //                       {shouldShowTargets ? (
// //                         <>
// //                           <th style={{ ...thRight, minWidth: "220px" }}>India Target Achievement</th>
// //                           <th style={{ ...thRight, minWidth: "220px" }}>Overseas Target Achievement</th>
// //                         </>
// //                       ) : (
// //                         <>
// //                           <th style={thRight}>India Sales (Cr)</th>
// //                           <th style={thRight}>Overseas Sales (Cr)</th>
// //                         </>
// //                       )}
// //                     </>
// //                   )}
// //                 </tr>
// //               </thead>
// //               <tbody>
// //                 {data.map((row, idx) => (
// //                   <tr
// //                     key={idx}
// //                     style={{
// //                       backgroundColor: idx % 2 === 0 ? "white" : "#f0fdf4",
// //                       transition: "background-color 0.2s ease",
// //                     }}
// //                     onMouseOver={(e) => {
// //                       if (!isMobile) e.currentTarget.style.backgroundColor = "#e0f2fe";
// //                     }}
// //                     onMouseOut={(e) => {
// //                       if (!isMobile)
// //                         e.currentTarget.style.backgroundColor =
// //                           idx % 2 === 0 ? "white" : "#f0fdf4";
// //                     }}
// //                   >
// //                     <td style={tdStickyLeft(idx)}>{row.Field}</td>
                    
// //                     {/* MOVED: Total columns first */}
// //                     <td style={tdRight}>₹{toCrores(row.Sales)} Cr</td>
// //                     <td style={tdRightGreen}>{row.PercentageSales}%</td>

// //                     {showTarget && (
// //                       <td style={{ ...tdRight, padding: "8px" }}>
// //                         <ProgressBar
// //                           current={row.Sales}
// //                           target={row.Target}
// //                           label=" "
// //                           compact={isMobile}
// //                         />
// //                       </td>
// //                     )}

// //                     <td
// //                       style={{
// //                         ...tdRight,
// //                         color:
// //                           row.GrossMarginPct >= 25
// //                             ? "#15803d"
// //                             : row.GrossMarginPct >= 15
// //                             ? "#f59e0b"
// //                             : "#dc2626",
// //                         fontWeight: 700,
// //                       }}
// //                     >
// //                       {row.GrossMarginPct}%
// //                     </td>

// //                     {isCategory && (
// //                       <>
// //                         {shouldShowTargets ? (
// //                           <>
// //                             <td style={{ ...tdRight, padding: "8px" }}>
// //                               <ProgressBar
// //                                 current={row.IndiaSales}
// //                                 target={row.TargetIndia}
// //                                 label="India"
// //                                 compact={isMobile}
// //                               />
// //                             </td>
// //                             <td style={{ ...tdRight, padding: "8px" }}>
// //                               <ProgressBar
// //                                 current={row.OverseasSales}
// //                                 target={row.TargetOverseas}
// //                                 label="Overseas"
// //                                 compact={isMobile}
// //                               />
// //                             </td>
// //                           </>
// //                         ) : (
// //                           <>
// //                             <td style={tdRight}>₹{toCrores(row.IndiaSales)} Cr</td>
// //                             <td style={tdRight}>₹{toCrores(row.OverseasSales)} Cr</td>
// //                           </>
// //                         )}
// //                       </>
// //                     )}
// //                   </tr>
// //                 ))}

// //                 {data.length > 0 && (
// //                   <tr style={{ backgroundColor: "#dcfce7", fontWeight: 700 }}>
// //                     <td style={tdStickyTotal}>TOTAL</td>
                    
// //                     {/* MOVED: Total row - totals first */}
// //                     <td style={tdRightGreen}>
// //                       ₹{toCrores(data.reduce((s, r) => s + (r.Sales || 0), 0))} Cr
// //                     </td>
// //                     <td style={tdRightGreen}>100.00%</td>

// //                     {showTarget && (
// //                       <td style={{ ...tdRightGreen, padding: "8px" }}>
// //                         <ProgressBar
// //                           current={data.reduce((s, r) => s + (r.Sales || 0), 0)}
// //                           target={totalTargets}
// //                           label=" "
// //                           compact={isMobile}
// //                         />
// //                       </td>
// //                     )}

// //                     <td
// //                       style={{
// //                         ...tdRightGreen,
// //                         color:
// //                           totalMargin >= 25
// //                             ? "#15803d"
// //                             : totalMargin >= 15
// //                             ? "#f59e0b"
// //                             : "#dc2626",
// //                         fontWeight: 700,
// //                       }}
// //                     >
// //                       {totalMargin}%
// //                     </td>

// //                     {isCategory && (
// //                       <>
// //                         {shouldShowTargets ? (
// //                           <>
// //                             <td style={{ ...tdRightGreen, padding: "8px" }}>
// //                               <ProgressBar
// //                                 current={data.reduce((s, r) => s + (r.IndiaSales || 0), 0)}
// //                                 target={totalIndiaTarget}
// //                                 label="India Total"
// //                                 compact={isMobile}
// //                               />
// //                             </td>
// //                             <td style={{ ...tdRightGreen, padding: "8px" }}>
// //                               <ProgressBar
// //                                 current={data.reduce((s, r) => s + (r.OverseasSales || 0), 0)}
// //                                 target={totalOverseasTarget}
// //                                 label="Overseas Total"
// //                                 compact={isMobile}
// //                               />
// //                             </td>
// //                           </>
// //                         ) : (
// //                           <>
// //                             <td style={tdRightGreen}>
// //                               ₹{toCrores(
// //                                 data.reduce((s, r) => s + (r.IndiaSales || 0), 0)
// //                               )}{" "}
// //                               Cr
// //                             </td>
// //                             <td style={tdRightGreen}>
// //                               ₹{toCrores(
// //                                 data.reduce((s, r) => s + (r.OverseasSales || 0), 0)
// //                               )}{" "}
// //                               Cr
// //                             </td>
// //                           </>
// //                         )}
// //                       </>
// //                     )}
// //                   </tr>
// //                 )}
// //               </tbody>
// //             </table>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // /* ---------- small style helpers ---------- */
// // const thRight = {
// //   padding: "12px",
// //   border: "1px solid #a7f3d0",
// //   color: "#15803d",
// //   textAlign: "right",
// //   fontWeight: "700",
// //   fontSize: "13px",
// //   whiteSpace: "nowrap",
// // };
// // const tdRight = {
// //   padding: "12px",
// //   border: "1px solid #a7f3d0",
// //   textAlign: "right",
// //   fontWeight: "500",
// //   whiteSpace: "nowrap",
// // };
// // const tdRightGreen = {
// //   ...tdRight,
// //   color: "#15803d",
// // };
// // const tdStickyLeft = (idx) => ({
// //   padding: "12px",
// //   border: "1px solid #a7f3d0",
// //   fontWeight: 600,
// //   color: "#1f2937",
// //   position: "sticky",
// //   left: 0,
// //   backgroundColor: idx % 2 === 0 ? "white" : "#f0fdf4",
// //   zIndex: 1,
// //   fontSize: "13px",
// // });
// // const tdStickyTotal = {
// //   padding: "12px",
// //   border: "1px solid #a7f3d0",
// //   color: "#15803d",
// //   position: "sticky",
// //   left: 0,
// //   backgroundColor: "#dcfce7",
// //   zIndex: 1,
// // };

// import React, { useState, useEffect, useRef } from "react";
// import * as Chart from "chart.js";
// import * as XLSX from "xlsx";
// import InvoiceFilterModal from "../../../components/modal/TargetInvoiceDetailsModal";

// const { Chart: ChartJS, ArcElement, Tooltip, Legend } = Chart;
// ChartJS.register(ArcElement, Tooltip, Legend);

// export default function PercentageAnalysis() {
//   const [selectedType, setSelectedType] = useState("region");
//   const [selectedYear, setSelectedYear] = useState("FY 2025-26");
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);
//   const canvasRef = useRef(null);
//   const chartRef = useRef(null);

//   // Invoice Filter Modal States
//   const [showInvoiceFilter, setShowInvoiceFilter] = useState(false);
//   const [selectedFieldForInvoice, setSelectedFieldForInvoice] = useState(null);

//   const categoryMapping = {
//     Items: "Trading",
//     "3A Chemicals": "3A Chemicals",
//     Catalyst: "Density",
//     Solvent: "Density",
//     Polymer: "Density",
//     "Fine Chemicals": "Density",
//     Reagent: "Density",
//     "Biological Buffers": "Life Science",
//     Intermediates: "Density",
//     API: "CATO",
//     "Stable Isotope reagents": "Deutero",
//     "Building Blocks": "Density",
//     Membranes: "Life Science",
//     "Laboratory Containers & Storage": "FD Cell",
//     Enzyme: "Life Science",
//     Biochemicals: "Life Science",
//     "Reference Materials": "KANTO",
//     "Secondary Standards": "KANTO",
//     Instruments: "BIKAI",
//     Services: "NULL",
//     "Analytical Standards": "KANTO",
//     "Nucleosides and Nucleotides": "Life Science",
//     Nitrosamine: "CATO",
//     "Pesticide Standards": "CATO",
//     Trading: "Trading",
//     Carbohydrates: "Life Science",
//     "USP Standards": "CATO",
//     "EP Standards": "CATO",
//     "Indian pharmacopoeia": "CATO",
//     "British Pharmacopoeia": "CATO",
//     Impurity: "CATO",
//     "NMR Solvents": "Deutero",
//     "Stable isotopes": "Deutero",
//     Glucuronides: "CATO",
//     Metabolites: "CATO",
//     Capricorn: "Capricorn",
//     "Analytical Instruments": "BIKAI",
//     "Lab Consumables": "FD Cell",
//     "Equipment and Instruments": "BIKAI",
//     Ultrapur: "KANTO",
//     Dyes: "Density",
//     "New Life Biologics": "Life Science",
//     "Food Grade": "Life Science",
//     "Lab Systems & Fixtures": "BIKAI",
//     Peptides: "Life Science",
//     "Ultrapur-100": "KANTO",
//     "Amino Acids": "Life Science",
//     "Cell Culture": "Life Science",
//     "Natural Products": "Life Science",
//     "Multiple Pharmacopoeia": "CATO",
//     "Metal Standard Solutions": "KANTO",
//     "High Purity Acids": "KANTO",
//     "HPLC consumables": "BIKAI",
//     "HPLC configurations": "BIKAI",
//     VOLAB: "VOLAB",
//     "Life science": "Life Science",
//     Kanto: "KANTO",
//     "Meatls&materials": "Density",
//   };

//   const regionTargets = {
//     Central: 10.9,
//     "West 1": 5.4,
//     North: 5.4,
//     South: 7.2,
//     "West 2": 5.4,
//     East: 1.8,
//   };

//   const categoryTargetsSplit = {
//     Trading: { total: 20, india: 0, overseas: 20 },
//     Density: { total: 6.8, india: 3.8, overseas: 3.0 },
//     "3A Chemicals": { total: 8.7, india: 8.7, overseas: 0 },
//     Deutero: { total: 17, india: 6, overseas: 11 },
//     BIKAI: { total: 5.3, india: 5.3, overseas: 0 },
//     "Life Science": { total: 0, india: 0, overseas: 0 },
//     CATO: { total: 4.15, india: 4.15, overseas: 0 },
//     Capricorn: { total: 0.86, india: 0.86, overseas: 0 },
//     "FD Cell": { total: 3.46, india: 3.46, overseas: 0 },
//     KANTO: { total: 1.4, india: 1.4, overseas: 0 },
//   };

//   const toCrores = (value) => (value / 10000000).toFixed(2);

//   const shouldShowTargets = selectedYear === "FY 2025-26";

//   const mergePercentageCategories = (rawData) => {
//     const mergedData = {};

//     rawData.forEach((row) => {
//       const targetCategory = categoryMapping[row.Field] || "Other";
//       if (targetCategory === "NULL") return;

//       if (!mergedData[targetCategory]) {
//         mergedData[targetCategory] = {
//           Field: targetCategory,
//           IndiaSales: 0,
//           OverseasSales: 0,
//           TotalSales: 0,
//           GrossProfit: 0,
//         };
//       }

//       mergedData[targetCategory].IndiaSales += row.IndiaSales || 0;
//       mergedData[targetCategory].OverseasSales += row.OverseasSales || 0;
//       mergedData[targetCategory].TotalSales += row.Sales || 0;

//       const gp = row.GrossProfit || 0;
//       if (gp > 0) {
//         mergedData[targetCategory].GrossProfit += gp;
//       } else {
//         const marginPct = row.GrossMarginPct || 0;
//         const sales = row.Sales || 0;
//         mergedData[targetCategory].GrossProfit += sales * (marginPct / 100);
//       }
//     });

//     const finalData = Object.values(mergedData);
//     const grandTotalSales = finalData.reduce((s, r) => s + r.TotalSales, 0);

//     const processedData = finalData.map((row) => {
//       const marginValue =
//         row.TotalSales > 0 ? (row.GrossProfit / row.TotalSales) * 100 : 0;

//       const split = categoryTargetsSplit[row.Field] || {
//         total: 0,
//         india: 0,
//         overseas: 0,
//       };

//       return {
//         Field: row.Field,
//         PercentageSales:
//           grandTotalSales > 0
//             ? Number(((row.TotalSales / grandTotalSales) * 100).toFixed(2))
//             : 0,
//         Sales: row.TotalSales,
//         GrossMarginPct: Number(marginValue.toFixed(2)),
//         GrossProfit: row.GrossProfit,
//         IndiaSales: row.IndiaSales,
//         OverseasSales: row.OverseasSales,
//         Target: split.total,
//         TargetIndia: split.india,
//         TargetOverseas: split.overseas,
//       };
//     });

//     processedData.sort((a, b) => b.Sales - a.Sales);
//     return processedData;
//   };

//   const handleCheckSales = (fieldValue) => {
//     setSelectedFieldForInvoice(fieldValue);
//     setShowInvoiceFilter(true);
//   };

//   const processAllTypesData = (rawData) => {
//     if (!rawData || rawData.length === 0) return [];
//     const grandTotalSales = rawData.reduce((s, r) => s + (r.Sales || 0), 0);

//     const processedData = rawData.map((row) => {
//       let grossProfit = row.GrossProfit || 0;
//       if (grossProfit === 0 && row.GrossMarginPct && row.Sales) {
//         grossProfit = (row.Sales || 0) * ((row.GrossMarginPct || 0) / 100);
//       }

//       const apiTarget = typeof row.Target === "number" ? row.Target : 0;
//       const mappedTarget =
//         selectedType === "region" ? regionTargets[row.Field] ?? 0 : 0;

//       return {
//         Field: row.Field,
//         PercentageSales:
//           grandTotalSales > 0
//             ? Number((((row.Sales || 0) / grandTotalSales) * 100).toFixed(2))
//             : 0,
//         Sales: row.Sales || 0,
//         GrossMarginPct: row.GrossMarginPct || 0,
//         GrossProfit: grossProfit,
//         IndiaSales: row.IndiaSales || 0,
//         OverseasSales: row.OverseasSales || 0,
//         Target: apiTarget || mappedTarget,
//       };
//     });

//     processedData.sort((a, b) => b.Sales - a.Sales);
//     return processedData;
//   };

//   const calculateTotalMargin = (d) => {
//     if (!d || d.length === 0) return 0;
//     const totalSales = d.reduce((s, r) => s + (r.Sales || 0), 0);
//     const totalGP = d.reduce((s, r) => s + (r.GrossProfit || 0), 0);
//     return totalSales > 0 ? Number(((totalGP / totalSales) * 100).toFixed(2)) : 0;
//   };

//   const ProgressBar = ({ current, target, label, compact = false }) => {
//     const currentCr = typeof current === "number" ? current / 10000000 : 0;
//     const targetCr = typeof target === "number" ? target : 0;
//     const percentage = targetCr > 0 ? Math.min((currentCr / targetCr) * 100, 100) : 0;

//     const getColor = (pct) => {
//       if (pct >= 80) return "#15803d";
//       if (pct >= 60) return "#22c55e";
//       if (pct >= 40) return "#f59e0b";
//       return "#dc2626";
//     };

//     return (
//       <div style={{ width: "100%", minWidth: compact ? "140px" : "200px", padding: compact ? "6px" : "8px" }}>
//         <div style={{
//           display: "flex", justifyContent: "space-between", alignItems: "center",
//           marginBottom: "6px", fontSize: compact ? "12px" : "13px",
//           fontWeight: "700", color: "#1f2937"
//         }}>
//           {label && <span>{label}</span>}
//           <span style={{ color: getColor(percentage), fontSize: compact ? "13px" : "14px", marginLeft: label ? "8px" : 0 }}>
//             {percentage.toFixed(1)}%
//           </span>
//         </div>

//         <div style={{
//           width: "100%", height: compact ? "24px" : "28px", backgroundColor: "#f3f4f6",
//           borderRadius: "10px", overflow: "hidden", position: "relative",
//           border: "1.5px solid #e5e7eb", boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
//         }}>
//           <div style={{
//             width: `${percentage}%`, height: "100%", backgroundColor: getColor(percentage),
//             transition: "width 0.4s ease", borderRadius: "10px",
//             boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)"
//           }} />
//           <div style={{
//             position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
//             fontSize: compact ? "11px" : "12px", fontWeight: "700",
//             color: percentage > 40 ? "white" : "#1f2937",
//             textShadow: percentage > 40 ? "0 1px 3px rgba(0,0,0,0.4)" : "none",
//             whiteSpace: "nowrap", letterSpacing: "0.3px"
//           }}>
//             ₹{currentCr.toFixed(2)} / ₹{targetCr.toFixed(2)} Cr
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const typeOptions = [
//     { value: "category", label: "Category" },
//     { value: "state", label: "State" },
//     { value: "region", label: "Region" },
//     { value: "salesperson", label: "Sales Person" },
//   ];

//   const yearOptions = ["FY 2025-26", "FY 2024-25", "Complete"];

//   useEffect(() => {
//     const onResize = () => setIsMobile(window.innerWidth < 768);
//     onResize();
//     window.addEventListener("resize", onResize);
//     return () => window.removeEventListener("resize", onResize);
//   }, []);

//   useEffect(() => {
//     fetchData();
//   }, [selectedType, selectedYear]);

//   useEffect(() => {
//     if (data.length > 0 && canvasRef.current) renderChart();
//     return () => {
//       if (chartRef.current) chartRef.current.destroy();
//     };
//   }, [data, isMobile]);

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const token = localStorage.getItem("token");
//       const response = await fetch(
//         `/api/target-analytics/percentage-analysis?type=${selectedType}&year=${selectedYear}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       const result = await response.json();

//       let processed = [];
//       if (result.data) {
//         processed =
//           selectedType === "category"
//             ? mergePercentageCategories(result.data)
//             : processAllTypesData(result.data);
//       }
//       setData(processed);
//     } catch (e) {
//       console.error("Error fetching data:", e);
//       setData([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderChart = () => {
//     if (chartRef.current) chartRef.current.destroy();
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
//           datalabels: { display: false },
//           legend: {
//             position: "bottom",
//             labels: {
//               padding: isMobile ? 8 : 10,
//               font: { size: isMobile ? 9 : 10 },
//               boxWidth: isMobile ? 12 : 15,
//             },
//           },
//           tooltip: {
//             callbacks: {
//               label: (ctx) => `${ctx.label}: ${ctx.parsed}%`,
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

//     const totalMargin = calculateTotalMargin(data);
//     const isCategory = selectedType === "category";
//     const showTarget = shouldShowTargets && (isCategory || selectedType === "region");

//     const exportData = data.map((row) => {
//       const base = {
//         Field: row.Field,
//         "Sales (Cr)": toCrores(row.Sales),
//         "% Sales": row.PercentageSales,
//         "GM %": row.GrossMarginPct,
//       };

//       if (showTarget) {
//         base["Target (Cr)"] = (row.Target || 0).toFixed(2);
//         const currentCr = parseFloat(toCrores(row.Sales));
//         const targetCr = row.Target || 0;
//         base["Achievement %"] = targetCr > 0 ? ((currentCr / targetCr) * 100).toFixed(1) : "0.0";
//       }
//       if (isCategory) {
//         base["India Sales (Cr)"] = toCrores(row.IndiaSales);
//         base["Overseas Sales (Cr)"] = toCrores(row.OverseasSales);
//         if (shouldShowTargets) {
//           base["India Target (Cr)"] = Number(row.TargetIndia || 0).toFixed(2);
//           base["Overseas Target (Cr)"] = Number(row.TargetOverseas || 0).toFixed(2);

//           const indiaCurrentCr = parseFloat(toCrores(row.IndiaSales));
//           const indiaTargetCr = row.TargetIndia || 0;
//           base["India Achievement %"] =
//             indiaTargetCr > 0 ? ((indiaCurrentCr / indiaTargetCr) * 100).toFixed(1) : "0.0";

//           const overseasCurrentCr = parseFloat(toCrores(row.OverseasSales));
//           const overseasTargetCr = row.TargetOverseas || 0;
//           base["Overseas Achievement %"] =
//             overseasTargetCr > 0 ? ((overseasCurrentCr / overseasTargetCr) * 100).toFixed(1) : "0.0";
//         }
//       }
//       return base;
//     });

//     const totals = {
//       Field: "TOTAL",
//       "Sales (Cr)": toCrores(data.reduce((s, r) => s + (r.Sales || 0), 0)),
//       "% Sales": 100.0,
//       "GM %": totalMargin,
//     };

//     if (showTarget) {
//       const totalTargets = data.reduce((s, r) => s + (r.Target || 0), 0);
//       totals["Target (Cr)"] = totalTargets.toFixed(2);
//       const totalSalesCr = parseFloat(toCrores(data.reduce((s, r) => s + (r.Sales || 0), 0)));
//       totals["Achievement %"] = totalTargets > 0 ? ((totalSalesCr / totalTargets) * 100).toFixed(1) : "0.0";
//     }
//     if (isCategory) {
//       totals["India Sales (Cr)"] = toCrores(data.reduce((s, r) => s + (r.IndiaSales || 0), 0));
//       totals["Overseas Sales (Cr)"] = toCrores(data.reduce((s, r) => s + (r.OverseasSales || 0), 0));
//       if (shouldShowTargets) {
//         const totalIndiaTarget = data.reduce((s, r) => s + (r.TargetIndia || 0), 0);
//         const totalOverseasTarget = data.reduce((s, r) => s + (r.TargetOverseas || 0), 0);
//         totals["India Target (Cr)"] = totalIndiaTarget.toFixed(2);
//         totals["Overseas Target (Cr)"] = totalOverseasTarget.toFixed(2);

//         const totalIndiaSalesCr = parseFloat(
//           toCrores(data.reduce((s, r) => s + (r.IndiaSales || 0), 0))
//         );
//         totals["India Achievement %"] =
//           totalIndiaTarget > 0 ? ((totalIndiaSalesCr / totalIndiaTarget) * 100).toFixed(1) : "0.0";

//         const totalOverseasSalesCr = parseFloat(
//           toCrores(data.reduce((s, r) => s + (r.OverseasSales || 0), 0))
//         );
//         totals["Overseas Achievement %"] =
//           totalOverseasTarget > 0 ? ((totalOverseasSalesCr / totalOverseasTarget) * 100).toFixed(1) : "0.0";
//       }
//     }

//     exportData.push(totals);

//     const ws = XLSX.utils.json_to_sheet(exportData);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Percentage Analysis");
//     XLSX.writeFile(
//       wb,
//       `Percentage_Analysis_${selectedType}_${selectedYear}_${new Date().toISOString().split("T")[0]}.xlsx`
//     );
//   };

//   const getFieldLabel = () => {
//     const opt = typeOptions.find((o) => o.value === selectedType);
//     return opt ? opt.label : "Field";
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

//   const totalMargin = calculateTotalMargin(data);
//   const isCategory = selectedType === "category";
//   const showTarget = shouldShowTargets && (selectedType === "category" || selectedType === "region");

//   const totalTargets = showTarget ? data.reduce((s, r) => s + (r.Target || 0), 0) : 0;
//   const totalIndiaTarget = showTarget && isCategory
//     ? data.reduce((s, r) => s + (r.TargetIndia || 0), 0)
//     : 0;
//   const totalOverseasTarget = showTarget && isCategory
//     ? data.reduce((s, r) => s + (r.TargetOverseas || 0), 0)
//     : 0;

//   return (
//     <div style={{ padding: isMobile ? "12px" : "24px" }}>
//       {/* Header */}
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
//               Financial Year:
//             </label>
//             <select
//               value={selectedYear}
//               onChange={(e) => setSelectedYear(e.target.value)}
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
//               {yearOptions.map((y) => (
//                 <option key={y} value={y}>
//                   {y}
//                 </option>
//               ))}
//             </select>
//           </div>

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
//               {typeOptions.map((o) => (
//                 <option key={o.value} value={o.value}>
//                   {o.label}
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
//           <p style={{ color: "#15803d", fontSize: isMobile ? "14px" : "16px", margin: 0 }}>
//             No data available for the selected filters.
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
//           {/* Pie Chart - Commented out as per original */}
//           {/* <div
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
//           </div> */}

//           {/* Table */}
//           <div
//             style={{
//               flex: "1",
//               width: isMobile ? "100%" : "auto",
//               minWidth: isMobile ? "100%" : "900px",
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
//               <thead
//                 style={{
//                   backgroundColor: "#dcfce7",
//                   position: "sticky",
//                   top: 0,
//                   zIndex: 2,
//                 }}
//               >
//                 <tr>
//                   <th
//                     style={{
//                       padding: "12px",
//                       border: "1px solid #a7f3d0",
//                       color: "#15803d",
//                       textAlign: "left",
//                       fontWeight: "700",
//                       fontSize: "13px",
//                       position: "sticky",
//                       left: 0,
//                       backgroundColor: "#dcfce7",
//                       zIndex: 3,
//                       whiteSpace: "nowrap",
//                     }}
//                   >
//                     {getFieldLabel()}
//                   </th>

//                   {/* Check Sales Column Header */}
//                   <th
//                     style={{
//                       padding: "12px",
//                       border: "1px solid #a7f3d0",
//                       color: "#15803d",
//                       textAlign: "center",
//                       fontWeight: "700",
//                       fontSize: "13px",
//                       whiteSpace: "nowrap",
//                     }}
//                   >
//                     Actions
//                   </th>

//                   {/* MOVED: Total columns first */}
//                   <th style={thRight}>Sales (Cr)</th>
//                   <th style={thRight}>% Sales</th>

//                   {showTarget && (
//                     <th style={{ ...thRight, minWidth: "220px" }}>Target Achievement</th>
//                   )}

//                   <th style={thRight}>GM %</th>

//                   {/* Category-specific columns */}
//                   {isCategory && (
//                     <>
//                       {shouldShowTargets ? (
//                         <>
//                           <th style={{ ...thRight, minWidth: "220px" }}>India Target Achievement</th>
//                           <th style={{ ...thRight, minWidth: "220px" }}>Overseas Target Achievement</th>
//                         </>
//                       ) : (
//                         <>
//                           <th style={thRight}>India Sales (Cr)</th>
//                           <th style={thRight}>Overseas Sales (Cr)</th>
//                         </>
//                       )}
//                     </>
//                   )}
//                 </tr>
//               </thead>
//               <tbody>
//                 {data.map((row, idx) => (
//                   <tr
//                     key={idx}
//                     style={{
//                       backgroundColor: idx % 2 === 0 ? "white" : "#f0fdf4",
//                       transition: "background-color 0.2s ease",
//                     }}
//                     onMouseOver={(e) => {
//                       if (!isMobile) e.currentTarget.style.backgroundColor = "#e0f2fe";
//                     }}
//                     onMouseOut={(e) => {
//                       if (!isMobile)
//                         e.currentTarget.style.backgroundColor =
//                           idx % 2 === 0 ? "white" : "#f0fdf4";
//                     }}
//                   >
//                     {/* Field Name Column - Sticky */}
//                     <td style={tdStickyLeft(idx)}>{row.Field}</td>

//                     {/* Check Sales Button Column */}
//                     <td
//                       style={{
//                         padding: "12px",
//                         border: "1px solid #a7f3d0",
//                         textAlign: "center",
//                       }}
//                     >
//                       <button
//                         onClick={() => handleCheckSales(row.Field)}
//                         style={{
//                           backgroundColor: "#15803d",
//                           color: "white",
//                           border: "none",
//                           borderRadius: "6px",
//                           padding: "6px 12px",
//                           fontSize: "12px",
//                           fontWeight: 600,
//                           cursor: "pointer",
//                           transition: "all 0.2s ease",
//                           boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
//                         }}
//                         onMouseOver={(e) => {
//                           e.target.style.backgroundColor = "#166534";
//                           e.target.style.transform = "translateY(-1px)";
//                           e.target.style.boxShadow = "0 4px 6px rgba(0,0,0,0.15)";
//                         }}
//                         onMouseOut={(e) => {
//                           e.target.style.backgroundColor = "#15803d";
//                           e.target.style.transform = "translateY(0)";
//                           e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
//                         }}
//                       >
//                         📊 Check Sales
//                       </button>
//                     </td>

//                     {/* MOVED: Total columns first */}
//                     <td style={tdRight}>₹{toCrores(row.Sales)} Cr</td>
//                     <td style={tdRightGreen}>{row.PercentageSales}%</td>

//                     {showTarget && (
//                       <td style={{ ...tdRight, padding: "8px" }}>
//                         <ProgressBar
//                           current={row.Sales}
//                           target={row.Target}
//                           label=" "
//                           compact={isMobile}
//                         />
//                       </td>
//                     )}

//                     <td
//                       style={{
//                         ...tdRight,
//                         color:
//                           row.GrossMarginPct >= 25
//                             ? "#15803d"
//                             : row.GrossMarginPct >= 15
//                             ? "#f59e0b"
//                             : "#dc2626",
//                         fontWeight: 700,
//                       }}
//                     >
//                       {row.GrossMarginPct}%
//                     </td>

//                     {isCategory && (
//                       <>
//                         {shouldShowTargets ? (
//                           <>
//                             <td style={{ ...tdRight, padding: "8px" }}>
//                               <ProgressBar
//                                 current={row.IndiaSales}
//                                 target={row.TargetIndia}
//                                 label="India"
//                                 compact={isMobile}
//                               />
//                             </td>
//                             <td style={{ ...tdRight, padding: "8px" }}>
//                               <ProgressBar
//                                 current={row.OverseasSales}
//                                 target={row.TargetOverseas}
//                                 label="Overseas"
//                                 compact={isMobile}
//                               />
//                             </td>
//                           </>
//                         ) : (
//                           <>
//                             <td style={tdRight}>₹{toCrores(row.IndiaSales)} Cr</td>
//                             <td style={tdRight}>₹{toCrores(row.OverseasSales)} Cr</td>
//                           </>
//                         )}
//                       </>
//                     )}
//                   </tr>
//                 ))}

//                 {data.length > 0 && (
//                   <tr style={{ backgroundColor: "#dcfce7", fontWeight: 700 }}>
//                     <td style={tdStickyTotal}>TOTAL</td>

//                     {/* Empty cell for Check Sales column */}
//                     <td style={{ padding: "12px", border: "1px solid #a7f3d0" }}></td>

//                     {/* MOVED: Total row - totals first */}
//                     <td style={tdRightGreen}>
//                       ₹{toCrores(data.reduce((s, r) => s + (r.Sales || 0), 0))} Cr
//                     </td>
//                     <td style={tdRightGreen}>100.00%</td>

//                     {showTarget && (
//                       <td style={{ ...tdRightGreen, padding: "8px" }}>
//                         <ProgressBar
//                           current={data.reduce((s, r) => s + (r.Sales || 0), 0)}
//                           target={totalTargets}
//                           label=" "
//                           compact={isMobile}
//                         />
//                       </td>
//                     )}

//                     <td
//                       style={{
//                         ...tdRightGreen,
//                         color:
//                           totalMargin >= 25
//                             ? "#15803d"
//                             : totalMargin >= 15
//                             ? "#f59e0b"
//                             : "#dc2626",
//                         fontWeight: 700,
//                       }}
//                     >
//                       {totalMargin}%
//                     </td>

//                     {isCategory && (
//                       <>
//                         {shouldShowTargets ? (
//                           <>
//                             <td style={{ ...tdRightGreen, padding: "8px" }}>
//                               <ProgressBar
//                                 current={data.reduce((s, r) => s + (r.IndiaSales || 0), 0)}
//                                 target={totalIndiaTarget}
//                                 label="India Total"
//                                 compact={isMobile}
//                               />
//                             </td>
//                             <td style={{ ...tdRightGreen, padding: "8px" }}>
//                               <ProgressBar
//                                 current={data.reduce((s, r) => s + (r.OverseasSales || 0), 0)}
//                                 target={totalOverseasTarget}
//                                 label="Overseas Total"
//                                 compact={isMobile}
//                               />
//                             </td>
//                           </>
//                         ) : (
//                           <>
//                             <td style={tdRightGreen}>
//                               ₹{toCrores(
//                                 data.reduce((s, r) => s + (r.IndiaSales || 0), 0)
//                               )}{" "}
//                               Cr
//                             </td>
//                             <td style={tdRightGreen}>
//                               ₹{toCrores(
//                                 data.reduce((s, r) => s + (r.OverseasSales || 0), 0)
//                               )}{" "}
//                               Cr
//                             </td>
//                           </>
//                         )}
//                       </>
//                     )}
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}

//       {/* Invoice Filter Modal */}
//       {showInvoiceFilter && (
//         <InvoiceFilterModal
//           show={showInvoiceFilter}
//           onClose={() => {
//             setShowInvoiceFilter(false);
//             setSelectedFieldForInvoice(null);
//           }}
//           preSelectedField={selectedFieldForInvoice}
//           selectedFilterType={selectedType}
//           selectedYear={selectedYear}
//         />
//       )}
//     </div>
//   );
// }

// /* ---------- small style helpers ---------- */
// const thRight = {
//   padding: "12px",
//   border: "1px solid #a7f3d0",
//   color: "#15803d",
//   textAlign: "right",
//   fontWeight: "700",
//   fontSize: "13px",
//   whiteSpace: "nowrap",
// };
// const tdRight = {
//   padding: "12px",
//   border: "1px solid #a7f3d0",
//   textAlign: "right",
//   fontWeight: "500",
//   whiteSpace: "nowrap",
// };
// const tdRightGreen = {
//   ...tdRight,
//   color: "#15803d",
// };
// const tdStickyLeft = (idx) => ({
//   padding: "12px",
//   border: "1px solid #a7f3d0",
//   fontWeight: 600,
//   color: "#1f2937",
//   position: "sticky",
//   left: 0,
//   backgroundColor: idx % 2 === 0 ? "white" : "#f0fdf4",
//   zIndex: 1,
//   fontSize: "13px",
// });
// const tdStickyTotal = {
//   padding: "12px",
//   border: "1px solid #a7f3d0",
//   color: "#15803d",
//   position: "sticky",
//   left: 0,
//   backgroundColor: "#dcfce7",
//   zIndex: 1,
// };


import React, { useState, useEffect, useRef } from "react";
import * as Chart from "chart.js";
import * as XLSX from "xlsx";
import InvoiceFilterModal from "../../../components/modal/TargetInvoiceDetailsModal";

const { Chart: ChartJS, ArcElement, Tooltip, Legend } = Chart;
ChartJS.register(ArcElement, Tooltip, Legend);

export default function PercentageAnalysis() {
  const [selectedType, setSelectedType] = useState("region");
  const [selectedYear, setSelectedYear] = useState("FY 2025-26");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  // Invoice Filter Modal States
  const [showInvoiceFilter, setShowInvoiceFilter] = useState(false);
  const [selectedFieldForInvoice, setSelectedFieldForInvoice] = useState(null);

  const categoryMapping = {
    Items: "Trading",
    "3A Chemicals": "3A Chemicals",
    Catalyst: "Density",
    Solvent: "Density",
    Polymer: "Density",
    "Fine Chemicals": "Density",
    Reagent: "Density",
    "Biological Buffers": "Life Science",
    Intermediates: "Density",
    API: "CATO",
    "Stable Isotope reagents": "Deutero",
    "Building Blocks": "Density",
    Membranes: "Life Science",
    "Laboratory Containers & Storage": "FD Cell",
    Enzyme: "Life Science",
    Biochemicals: "Life Science",
    "Reference Materials": "KANTO",
    "Secondary Standards": "KANTO",
    Instruments: "BIKAI",
    Services: "NULL",
    "Analytical Standards": "KANTO",
    "Nucleosides and Nucleotides": "Life Science",
    Nitrosamine: "CATO",
    "Pesticide Standards": "CATO",
    Trading: "Trading",
    Carbohydrates: "Life Science",
    "USP Standards": "CATO",
    "EP Standards": "CATO",
    "Indian pharmacopoeia": "CATO",
    "British Pharmacopoeia": "CATO",
    Impurity: "CATO",
    "NMR Solvents": "Deutero",
    "Stable isotopes": "Deutero",
    Glucuronides: "CATO",
    Metabolites: "CATO",
    Capricorn: "Capricorn",
    "Analytical Instruments": "BIKAI",
    "Lab Consumables": "FD Cell",
    "Equipment and Instruments": "BIKAI",
    Ultrapur: "KANTO",
    Dyes: "Density",
    "New Life Biologics": "Life Science",
    "Food Grade": "Life Science",
    "Lab Systems & Fixtures": "BIKAI",
    Peptides: "Life Science",
    "Ultrapur-100": "KANTO",
    "Amino Acids": "Life Science",
    "Cell Culture": "Life Science",
    "Natural Products": "Life Science",
    "Multiple Pharmacopoeia": "CATO",
    "Metal Standard Solutions": "KANTO",
    "High Purity Acids": "KANTO",
    "HPLC consumables": "BIKAI",
    "HPLC configurations": "BIKAI",
    VOLAB: "VOLAB",
    "Life science": "Life Science",
    Kanto: "KANTO",
    "Meatls&materials": "Density",
  };

  const regionTargets = {
    Central: 10.9,
    "West 1": 5.4,
    North: 5.4,
    South: 7.2,
    "West 2": 5.4,
    East: 1.8,
  };

  const categoryTargetsSplit = {
    Trading: { total: 20, india: 0, overseas: 20 },
    Density: { total: 6.8, india: 3.8, overseas: 3.0 },
    "3A Chemicals": { total: 8.7, india: 8.7, overseas: 0 },
    Deutero: { total: 17, india: 6, overseas: 11 },
    BIKAI: { total: 5.3, india: 5.3, overseas: 0 },
    "Life Science": { total: 0, india: 0, overseas: 0 },
    CATO: { total: 4.15, india: 4.15, overseas: 0 },
    Capricorn: { total: 0.86, india: 0.86, overseas: 0 },
    "FD Cell": { total: 3.46, india: 3.46, overseas: 0 },
    KANTO: { total: 1.4, india: 1.4, overseas: 0 },
  };

  const toCrores = (value) => (value / 10000000).toFixed(2);

  const shouldShowTargets = selectedYear === "FY 2025-26";

  const mergePercentageCategories = (rawData) => {
    const mergedData = {};

    rawData.forEach((row) => {
      const targetCategory = categoryMapping[row.Field] || "Other";
      if (targetCategory === "NULL") return;

      if (!mergedData[targetCategory]) {
        mergedData[targetCategory] = {
          Field: targetCategory,
          IndiaSales: 0,
          OverseasSales: 0,
          TotalSales: 0,
          GrossProfit: 0,
        };
      }

      mergedData[targetCategory].IndiaSales += row.IndiaSales || 0;
      mergedData[targetCategory].OverseasSales += row.OverseasSales || 0;
      mergedData[targetCategory].TotalSales += row.Sales || 0;

      const gp = row.GrossProfit || 0;
      if (gp > 0) {
        mergedData[targetCategory].GrossProfit += gp;
      } else {
        const marginPct = row.GrossMarginPct || 0;
        const sales = row.Sales || 0;
        mergedData[targetCategory].GrossProfit += sales * (marginPct / 100);
      }
    });

    const finalData = Object.values(mergedData);
    const grandTotalSales = finalData.reduce((s, r) => s + r.TotalSales, 0);

    const processedData = finalData.map((row) => {
      const marginValue =
        row.TotalSales > 0 ? (row.GrossProfit / row.TotalSales) * 100 : 0;

      const split = categoryTargetsSplit[row.Field] || {
        total: 0,
        india: 0,
        overseas: 0,
      };

      return {
        Field: row.Field,
        PercentageSales:
          grandTotalSales > 0
            ? Number(((row.TotalSales / grandTotalSales) * 100).toFixed(2))
            : 0,
        Sales: row.TotalSales,
        GrossMarginPct: Number(marginValue.toFixed(2)),
        GrossProfit: row.GrossProfit,
        IndiaSales: row.IndiaSales,
        OverseasSales: row.OverseasSales,
        Target: split.total,
        TargetIndia: split.india,
        TargetOverseas: split.overseas,
      };
    });

    processedData.sort((a, b) => b.Sales - a.Sales);
    return processedData;
  };

  const handleCheckSales = (fieldValue) => {
    setSelectedFieldForInvoice(fieldValue);
    setShowInvoiceFilter(true);
  };

  const processAllTypesData = (rawData) => {
    if (!rawData || rawData.length === 0) return [];
    const grandTotalSales = rawData.reduce((s, r) => s + (r.Sales || 0), 0);

    const processedData = rawData.map((row) => {
      let grossProfit = row.GrossProfit || 0;
      if (grossProfit === 0 && row.GrossMarginPct && row.Sales) {
        grossProfit = (row.Sales || 0) * ((row.GrossMarginPct || 0) / 100);
      }

      const apiTarget = typeof row.Target === "number" ? row.Target : 0;
      const mappedTarget =
        selectedType === "region" ? regionTargets[row.Field] ?? 0 : 0;

      return {
        Field: row.Field,
        PercentageSales:
          grandTotalSales > 0
            ? Number((((row.Sales || 0) / grandTotalSales) * 100).toFixed(2))
            : 0,
        Sales: row.Sales || 0,
        GrossMarginPct: row.GrossMarginPct || 0,
        GrossProfit: grossProfit,
        IndiaSales: row.IndiaSales || 0,
        OverseasSales: row.OverseasSales || 0,
        Target: apiTarget || mappedTarget,
      };
    });

    processedData.sort((a, b) => b.Sales - a.Sales);
    return processedData;
  };

  const calculateTotalMargin = (d) => {
    if (!d || d.length === 0) return 0;
    const totalSales = d.reduce((s, r) => s + (r.Sales || 0), 0);
    const totalGP = d.reduce((s, r) => s + (r.GrossProfit || 0), 0);
    return totalSales > 0 ? Number(((totalGP / totalSales) * 100).toFixed(2)) : 0;
  };

  const ProgressBar = ({ current, target, label, compact = false }) => {
    const currentCr = typeof current === "number" ? current / 10000000 : 0;
    const targetCr = typeof target === "number" ? target : 0;
    const percentage = targetCr > 0 ? Math.min((currentCr / targetCr) * 100, 100) : 0;

    const getColor = (pct) => {
      if (pct >= 80) return "#15803d";
      if (pct >= 60) return "#22c55e";
      if (pct >= 40) return "#f59e0b";
      return "#dc2626";
    };

    return (
      <div style={{ width: "100%", minWidth: compact ? "140px" : "200px", padding: compact ? "6px" : "8px" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: "6px", fontSize: compact ? "12px" : "13px",
          fontWeight: "700", color: "#1f2937"
        }}>
          {label && <span>{label}</span>}
          <span style={{ color: getColor(percentage), fontSize: compact ? "13px" : "14px", marginLeft: label ? "8px" : 0 }}>
            {percentage.toFixed(1)}%
          </span>
        </div>

        <div style={{
          width: "100%", height: compact ? "24px" : "28px", backgroundColor: "#f3f4f6",
          borderRadius: "10px", overflow: "hidden", position: "relative",
          border: "1.5px solid #e5e7eb", boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
        }}>
          <div style={{
            width: `${percentage}%`, height: "100%", backgroundColor: getColor(percentage),
            transition: "width 0.4s ease", borderRadius: "10px",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)"
          }} />
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            fontSize: compact ? "11px" : "12px", fontWeight: "700",
            color: percentage > 40 ? "white" : "#1f2937",
            textShadow: percentage > 40 ? "0 1px 3px rgba(0,0,0,0.4)" : "none",
            whiteSpace: "nowrap", letterSpacing: "0.3px"
          }}>
            ₹{currentCr.toFixed(2)} / ₹{targetCr.toFixed(2)} Cr
          </div>
        </div>
      </div>
    );
  };

  const typeOptions = [
    { value: "category", label: "Category" },
    { value: "state", label: "State" },
    { value: "region", label: "Region" },
    { value: "salesperson", label: "Sales Person" },
  ];

  const yearOptions = ["FY 2025-26", "FY 2024-25", "Complete"];

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedType, selectedYear]);

  useEffect(() => {
    if (data.length > 0 && canvasRef.current) renderChart();
    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [data, isMobile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/target-analytics/percentage-analysis?type=${selectedType}&year=${selectedYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await response.json();

      let processed = [];
      if (result.data) {
        processed =
          selectedType === "category"
            ? mergePercentageCategories(result.data)
            : processAllTypesData(result.data);
      }
      setData(processed);
    } catch (e) {
      console.error("Error fetching data:", e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (chartRef.current) chartRef.current.destroy();
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
          datalabels: { display: false },
          legend: {
            position: "bottom",
            labels: {
              padding: isMobile ? 8 : 10,
              font: { size: isMobile ? 9 : 10 },
              boxWidth: isMobile ? 12 : 15,
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${ctx.parsed}%`,
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

    const totalMargin = calculateTotalMargin(data);
    const isCategory = selectedType === "category";
    const showTarget = shouldShowTargets && (isCategory || selectedType === "region");

    const exportData = data.map((row) => {
      const base = {
        Field: row.Field,
        "Sales (Cr)": toCrores(row.Sales),
        "% Sales": row.PercentageSales,
        "GM %": row.GrossMarginPct,
      };

      if (showTarget) {
        base["Target (Cr)"] = (row.Target || 0).toFixed(2);
        const currentCr = parseFloat(toCrores(row.Sales));
        const targetCr = row.Target || 0;
        base["Achievement %"] = targetCr > 0 ? ((currentCr / targetCr) * 100).toFixed(1) : "0.0";
      }
      if (isCategory) {
        base["India Sales (Cr)"] = toCrores(row.IndiaSales);
        base["Overseas Sales (Cr)"] = toCrores(row.OverseasSales);
        if (shouldShowTargets) {
          base["India Target (Cr)"] = Number(row.TargetIndia || 0).toFixed(2);
          base["Overseas Target (Cr)"] = Number(row.TargetOverseas || 0).toFixed(2);

          const indiaCurrentCr = parseFloat(toCrores(row.IndiaSales));
          const indiaTargetCr = row.TargetIndia || 0;
          base["India Achievement %"] =
            indiaTargetCr > 0 ? ((indiaCurrentCr / indiaTargetCr) * 100).toFixed(1) : "0.0";

          const overseasCurrentCr = parseFloat(toCrores(row.OverseasSales));
          const overseasTargetCr = row.TargetOverseas || 0;
          base["Overseas Achievement %"] =
            overseasTargetCr > 0 ? ((overseasCurrentCr / overseasTargetCr) * 100).toFixed(1) : "0.0";
        }
      }
      return base;
    });

    const totals = {
      Field: "TOTAL",
      "Sales (Cr)": toCrores(data.reduce((s, r) => s + (r.Sales || 0), 0)),
      "% Sales": 100.0,
      "GM %": totalMargin,
    };

    if (showTarget) {
      const totalTargets = data.reduce((s, r) => s + (r.Target || 0), 0);
      totals["Target (Cr)"] = totalTargets.toFixed(2);
      const totalSalesCr = parseFloat(toCrores(data.reduce((s, r) => s + (r.Sales || 0), 0)));
      totals["Achievement %"] = totalTargets > 0 ? ((totalSalesCr / totalTargets) * 100).toFixed(1) : "0.0";
    }
    if (isCategory) {
      totals["India Sales (Cr)"] = toCrores(data.reduce((s, r) => s + (r.IndiaSales || 0), 0));
      totals["Overseas Sales (Cr)"] = toCrores(data.reduce((s, r) => s + (r.OverseasSales || 0), 0));
      if (shouldShowTargets) {
        const totalIndiaTarget = data.reduce((s, r) => s + (r.TargetIndia || 0), 0);
        const totalOverseasTarget = data.reduce((s, r) => s + (r.TargetOverseas || 0), 0);
        totals["India Target (Cr)"] = totalIndiaTarget.toFixed(2);
        totals["Overseas Target (Cr)"] = totalOverseasTarget.toFixed(2);

        const totalIndiaSalesCr = parseFloat(
          toCrores(data.reduce((s, r) => s + (r.IndiaSales || 0), 0))
        );
        totals["India Achievement %"] =
          totalIndiaTarget > 0 ? ((totalIndiaSalesCr / totalIndiaTarget) * 100).toFixed(1) : "0.0";

        const totalOverseasSalesCr = parseFloat(
          toCrores(data.reduce((s, r) => s + (r.OverseasSales || 0), 0))
        );
        totals["Overseas Achievement %"] =
          totalOverseasTarget > 0 ? ((totalOverseasSalesCr / totalOverseasTarget) * 100).toFixed(1) : "0.0";
      }
    }

    exportData.push(totals);

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Percentage Analysis");
    XLSX.writeFile(
      wb,
      `Percentage_Analysis_${selectedType}_${selectedYear}_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  const getFieldLabel = () => {
    const opt = typeOptions.find((o) => o.value === selectedType);
    return opt ? opt.label : "Field";
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

  const totalMargin = calculateTotalMargin(data);
  const isCategory = selectedType === "category";
  const showTarget = shouldShowTargets && (selectedType === "category" || selectedType === "region");

  const totalTargets = showTarget ? data.reduce((s, r) => s + (r.Target || 0), 0) : 0;
  const totalIndiaTarget = showTarget && isCategory
    ? data.reduce((s, r) => s + (r.TargetIndia || 0), 0)
    : 0;
  const totalOverseasTarget = showTarget && isCategory
    ? data.reduce((s, r) => s + (r.TargetOverseas || 0), 0)
    : 0;

  return (
    <div style={{ padding: isMobile ? "12px" : "24px" }}>
      {/* Header */}
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
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

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
              {typeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

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
          <p style={{ color: "#15803d", fontSize: isMobile ? "14px" : "16px", margin: 0 }}>
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
          {/* Pie Chart - Commented out as per original */}
          {/* <div
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
          </div> */}

          {/* Table */}
          <div
            style={{
              flex: "1",
              width: isMobile ? "100%" : "auto",
              minWidth: isMobile ? "100%" : "900px",
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
              <thead
                style={{
                  backgroundColor: "#dcfce7",
                  position: "sticky",
                  top: 0,
                  zIndex: 2,
                }}
              >
                <tr>
                  <th
                    style={{
                      padding: "12px",
                      border: "1px solid #a7f3d0",
                      color: "#15803d",
                      textAlign: "left",
                      fontWeight: "700",
                      fontSize: "13px",
                      position: "sticky",
                      left: 0,
                      backgroundColor: "#dcfce7",
                      zIndex: 3,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {getFieldLabel()}
                  </th>

                  {/* Check Sales Column Header */}
                  <th
                    style={{
                      padding: "12px",
                      border: "1px solid #a7f3d0",
                      color: "#15803d",
                      textAlign: "center",
                      fontWeight: "700",
                      fontSize: "13px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Actions
                  </th>

                  {/* MOVED: Total columns first */}
                  <th style={thRight}>Sales (Cr)</th>
                  <th style={thRight}>% Sales</th>

                  {showTarget && (
                    <th style={{ ...thRight, minWidth: "220px" }}>Target Achievement</th>
                  )}

                  <th style={thRight}>GM %</th>

                  {/* Category-specific columns */}
                  {isCategory && (
                    <>
                      {shouldShowTargets ? (
                        <>
                          <th style={{ ...thRight, minWidth: "220px" }}>India Target Achievement</th>
                          <th style={{ ...thRight, minWidth: "220px" }}>Overseas Target Achievement</th>
                        </>
                      ) : (
                        <>
                          <th style={thRight}>India Sales (Cr)</th>
                          <th style={thRight}>Overseas Sales (Cr)</th>
                        </>
                      )}
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr
                    key={idx}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "white" : "#f0fdf4",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseOver={(e) => {
                      if (!isMobile) e.currentTarget.style.backgroundColor = "#e0f2fe";
                    }}
                    onMouseOut={(e) => {
                      if (!isMobile)
                        e.currentTarget.style.backgroundColor =
                          idx % 2 === 0 ? "white" : "#f0fdf4";
                    }}
                  >
                    {/* Field Name Column - Sticky */}
                    <td style={tdStickyLeft(idx)}>{row.Field}</td>

                    {/* Check Sales Button Column */}
                    <td
                      style={{
                        padding: "12px",
                        border: "1px solid #a7f3d0",
                        textAlign: "center",
                      }}
                    >
                      <button
                        onClick={() => handleCheckSales(row.Field)}
                        style={{
                          backgroundColor: "#15803d",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor = "#166534";
                          e.target.style.transform = "translateY(-1px)";
                          e.target.style.boxShadow = "0 4px 6px rgba(0,0,0,0.15)";
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor = "#15803d";
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                        }}
                      >
                        📊 Check Sales
                      </button>
                    </td>

                    {/* MOVED: Total columns first */}
                    <td style={tdRight}>₹{toCrores(row.Sales)} Cr</td>
                    <td style={tdRightGreen}>{row.PercentageSales}%</td>

                    {showTarget && (
                      <td style={{ ...tdRight, padding: "8px" }}>
                        <ProgressBar
                          current={row.Sales}
                          target={row.Target}
                          label=" "
                          compact={isMobile}
                        />
                      </td>
                    )}

                    <td
                      style={{
                        ...tdRight,
                        color:
                          row.GrossMarginPct >= 25
                            ? "#15803d"
                            : row.GrossMarginPct >= 15
                            ? "#f59e0b"
                            : "#dc2626",
                        fontWeight: 700,
                      }}
                    >
                      {row.GrossMarginPct}%
                    </td>

                    {isCategory && (
                      <>
                        {shouldShowTargets ? (
                          <>
                            <td style={{ ...tdRight, padding: "8px" }}>
                              <ProgressBar
                                current={row.IndiaSales}
                                target={row.TargetIndia}
                                label="India"
                                compact={isMobile}
                              />
                            </td>
                            <td style={{ ...tdRight, padding: "8px" }}>
                              <ProgressBar
                                current={row.OverseasSales}
                                target={row.TargetOverseas}
                                label="Overseas"
                                compact={isMobile}
                              />
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={tdRight}>₹{toCrores(row.IndiaSales)} Cr</td>
                            <td style={tdRight}>₹{toCrores(row.OverseasSales)} Cr</td>
                          </>
                        )}
                      </>
                    )}
                  </tr>
                ))}

                {data.length > 0 && (
                  <tr style={{ backgroundColor: "#dcfce7", fontWeight: 700 }}>
                    <td style={tdStickyTotal}>TOTAL</td>

                    {/* Empty cell for Check Sales column */}
                    <td style={{ padding: "12px", border: "1px solid #a7f3d0" }}></td>

                    {/* MOVED: Total row - totals first */}
                    <td style={tdRightGreen}>
                      ₹{toCrores(data.reduce((s, r) => s + (r.Sales || 0), 0))} Cr
                    </td>
                    <td style={tdRightGreen}>100.00%</td>

                    {showTarget && (
                      <td style={{ ...tdRightGreen, padding: "8px" }}>
                        <ProgressBar
                          current={data.reduce((s, r) => s + (r.Sales || 0), 0)}
                          target={totalTargets}
                          label=" "
                          compact={isMobile}
                        />
                      </td>
                    )}

                    <td
                      style={{
                        ...tdRightGreen,
                        color:
                          totalMargin >= 25
                            ? "#15803d"
                            : totalMargin >= 15
                            ? "#f59e0b"
                            : "#dc2626",
                        fontWeight: 700,
                      }}
                    >
                      {totalMargin}%
                    </td>

                    {isCategory && (
                      <>
                        {shouldShowTargets ? (
                          <>
                            <td style={{ ...tdRightGreen, padding: "8px" }}>
                              <ProgressBar
                                current={data.reduce((s, r) => s + (r.IndiaSales || 0), 0)}
                                target={totalIndiaTarget}
                                label="India Total"
                                compact={isMobile}
                              />
                            </td>
                            <td style={{ ...tdRightGreen, padding: "8px" }}>
                              <ProgressBar
                                current={data.reduce((s, r) => s + (r.OverseasSales || 0), 0)}
                                target={totalOverseasTarget}
                                label="Overseas Total"
                                compact={isMobile}
                              />
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={tdRightGreen}>
                              ₹{toCrores(
                                data.reduce((s, r) => s + (r.IndiaSales || 0), 0)
                              )}{" "}
                              Cr
                            </td>
                            <td style={tdRightGreen}>
                              ₹{toCrores(
                                data.reduce((s, r) => s + (r.OverseasSales || 0), 0)
                              )}{" "}
                              Cr
                            </td>
                          </>
                        )}
                      </>
                    )}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Filter Modal */}
      {showInvoiceFilter && (
        <InvoiceFilterModal
          show={showInvoiceFilter}
          onClose={() => {
            setShowInvoiceFilter(false);
            setSelectedFieldForInvoice(null);
          }}
          preSelectedField={selectedFieldForInvoice}
          selectedFilterType={selectedType}
          selectedYear={selectedYear}
        />
      )}
    </div>
  );
}

/* ---------- small style helpers ---------- */
const thRight = {
  padding: "12px",
  border: "1px solid #a7f3d0",
  color: "#15803d",
  textAlign: "right",
  fontWeight: "700",
  fontSize: "13px",
  whiteSpace: "nowrap",
};
const tdRight = {
  padding: "12px",
  border: "1px solid #a7f3d0",
  textAlign: "right",
  fontWeight: "500",
  whiteSpace: "nowrap",
};
const tdRightGreen = {
  ...tdRight,
  color: "#15803d",
};
const tdStickyLeft = (idx) => ({
  padding: "12px",
  border: "1px solid #a7f3d0",
  fontWeight: 600,
  color: "#1f2937",
  position: "sticky",
  left: 0,
  backgroundColor: idx % 2 === 0 ? "white" : "#f0fdf4",
  zIndex: 1,
  fontSize: "13px",
});
const tdStickyTotal = {
  padding: "12px",
  border: "1px solid #a7f3d0",
  color: "#15803d",
  position: "sticky",
  left: 0,
  backgroundColor: "#dcfce7",
  zIndex: 1,
};