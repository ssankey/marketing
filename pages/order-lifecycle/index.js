
// // // // // pages/order-lifecycle/index.js
// // // // import React, { useState, useEffect, useRef } from "react";
// // // // import RangeConfiguration from "/components/main-page/order-to-invoice/RangeConfiguration";

// // // // // Default ranges (keep in sync with API)
// // // // const DEFAULT_RANGES = [
// // // //   { id: 1, min: 0, max: 3, label: "0-3 days", color: "#10b981" },
// // // //   { id: 2, min: 4, max: 5, label: "4-5 days", color: "#f59e0b" },
// // // //   { id: 3, min: 6, max: 8, label: "6-8 days", color: "#3b82f6" },
// // // //   { id: 4, min: 9, max: 10, label: "9-10 days", color: "#8b5cf6" },
// // // //   { id: 5, min: 11, max: 999, label: "10+ days", color: "#ef4444" },
// // // // ];

// // // // const OrderLifeCycle = () => {
// // // //   const [activeTab, setActiveTab] = useState("po-to-grn");

// // // //   // Store both display value and actual code
// // // //   const [filters, setFilters] = useState({
// // // //     salesPerson: { code: "", name: "" },
// // // //     customer: { code: "", name: "" },
// // // //     contactPerson: { code: "", name: "" },
// // // //     category: { code: "", name: "" },
// // // //   });

// // // //   // Ranges
// // // //   const [dayRanges, setDayRanges] = useState([...DEFAULT_RANGES]);
// // // //   const [appliedRanges, setAppliedRanges] = useState([...DEFAULT_RANGES]);

// // // //   // Data + loading
// // // //   const [chartData, setChartData] = useState([]);
// // // //   const [loading, setLoading] = useState(false);

// // // //   // Master data for suggestions
// // // //   const [salesPersons, setSalesPersons] = useState([]);
// // // //   const [customers, setCustomers] = useState([]);
// // // //   const [contactPersons, setContactPersons] = useState([]);
// // // //   const [categories, setCategories] = useState([]);

// // // //   // Autocomplete UI state
// // // //   const [showSuggestions, setShowSuggestions] = useState({
// // // //     salesPerson: false,
// // // //     customer: false,
// // // //     contactPerson: false,
// // // //     category: false,
// // // //   });
// // // //   const [filteredSuggestions, setFilteredSuggestions] = useState({
// // // //     salesPerson: [],
// // // //     customer: [],
// // // //     contactPerson: [],
// // // //     category: [],
// // // //   });

// // // //   const dropdownRefs = {
// // // //     salesPerson: useRef(null),
// // // //     customer: useRef(null),
// // // //     contactPerson: useRef(null),
// // // //     category: useRef(null),
// // // //   };

// // // //   // Fetch master lists
// // // //   useEffect(() => {
// // // //     (async () => {
// // // //       await Promise.all([
// // // //         fetchSalesPersons(),
// // // //         fetchCustomers(),
// // // //         fetchContactPersons(),
// // // //         fetchCategories(),
// // // //       ]);
// // // //     })();
// // // //   }, []);

// // // //   // Fetch chart whenever tab or applied ranges or filters change
// // // //   useEffect(() => {
// // // //     fetchChartData();
// // // //     // eslint-disable-next-line react-hooks/exhaustive-deps
// // // //   }, [
// // // //     activeTab, 
// // // //     appliedRanges, 
// // // //     filters.salesPerson.code, 
// // // //     filters.customer.code, 
// // // //     filters.contactPerson.code, 
// // // //     filters.category.code
// // // //   ]);

// // // //   // Close autocompletes on outside click
// // // //   useEffect(() => {
// // // //     const handleClickOutside = (event) => {
// // // //       Object.keys(dropdownRefs).forEach((key) => {
// // // //         if (dropdownRefs[key].current && !dropdownRefs[key].current.contains(event.target)) {
// // // //           setShowSuggestions((prev) => ({ ...prev, [key]: false }));
// // // //         }
// // // //       });
// // // //     };
// // // //     document.addEventListener("mousedown", handleClickOutside);
// // // //     return () => document.removeEventListener("mousedown", handleClickOutside);
// // // //   }, []);

// // // //   // ---- API calls ----
// // // //   const fetchChartData = async () => {
// // // //     setLoading(true);
    
// // // //     console.log("🔵 FETCHING CHART DATA");
// // // //     console.log("Active Tab:", activeTab);
// // // //     console.log("Applied Ranges:", appliedRanges);
// // // //     console.log("Filters:", filters);

// // // //     try {
// // // //       // Map tab to API endpoint
// // // //       const apiEndpoints = {
// // // //         "po-to-grn": "/api/order-lifecycle/po-to-grn",
// // // //         "grn-to-invoice": "/api/order-lifecycle/grn-to-invoice",
// // // //         "invoice-to-dispatch": "/api/order-lifecycle/invoice-to-dispatch",
// // // //       };

// // // //       const endpoint = apiEndpoints[activeTab];
      
// // // //       const params = new URLSearchParams({
// // // //         ranges: JSON.stringify(
// // // //           appliedRanges.map(({ min, max, label }) => ({ min, max, label }))
// // // //         ),
// // // //       });

// // // //       // Send actual codes to API
// // // //       if (filters.salesPerson.code) params.append("slpCode", filters.salesPerson.code);
// // // //       if (filters.customer.code) params.append("cardCode", filters.customer.code);
// // // //       if (filters.contactPerson.code) params.append("cntctCode", filters.contactPerson.code);
// // // //       if (filters.category.code) params.append("itmsGrpCod", filters.category.code);

// // // //       const url = `${endpoint}?${params.toString()}`;
// // // //       console.log("Fetching from:", url);

// // // //       const res = await fetch(url);
// // // //       const data = await res.json();

// // // //       console.log("📊 API Response:", data);
// // // //       console.log("Meta info:", data.meta);
// // // //       console.log("Data rows received:", data.data?.length || 0);

// // // //       if (data.data && data.data.length > 0) {
// // // //         console.log("First 3 data rows:", data.data.slice(0, 3));
// // // //         console.log("Last 3 data rows:", data.data.slice(-3));
// // // //       }

// // // //       const aggregated = aggregateByMonth(data.data || []);
// // // //       console.log("After aggregation:", aggregated);
      
// // // //       setChartData(aggregated);
// // // //     } catch (err) {
// // // //       console.error("❌ Error fetching chart data:", err);
// // // //       setChartData([]);
// // // //     } finally {
// // // //       setLoading(false);
// // // //     }
// // // //   };

// // // //   const fetchSalesPersons = async () => {
// // // //     try {
// // // //       const res = await fetch("/api/unique/salespersons");
// // // //       const data = await res.json();
// // // //       setSalesPersons(data.data || []);
// // // //       setFilteredSuggestions((p) => ({ ...p, salesPerson: data.data || [] }));
// // // //     } catch (e) {
// // // //       console.error("Error fetching salespersons:", e);
// // // //     }
// // // //   };
// // // //   const fetchCustomers = async () => {
// // // //     try {
// // // //       const res = await fetch("/api/unique/customers");
// // // //       const data = await res.json();
// // // //       setCustomers(data.data || []);
// // // //       setFilteredSuggestions((p) => ({ ...p, customer: data.data || [] }));
// // // //     } catch (e) {
// // // //       console.error("Error fetching customers:", e);
// // // //     }
// // // //   };
// // // //   const fetchContactPersons = async () => {
// // // //     try {
// // // //       const res = await fetch("/api/unique/contact-persons");
// // // //       const data = await res.json();
// // // //       setContactPersons(data.data || []);
// // // //       setFilteredSuggestions((p) => ({ ...p, contactPerson: data.data || [] }));
// // // //     } catch (e) {
// // // //       console.error("Error fetching contact persons:", e);
// // // //     }
// // // //   };
// // // //   const fetchCategories = async () => {
// // // //     try {
// // // //       const res = await fetch("/api/unique/categories");
// // // //       const data = await res.json();
// // // //       setCategories(data.data || []);
// // // //       setFilteredSuggestions((p) => ({ ...p, category: data.data || [] }));
// // // //     } catch (e) {
// // // //       console.error("Error fetching categories:", e);
// // // //     }
// // // //   };

// // // //   // ---- Helpers ----
// // // //   const aggregateByMonth = (rows) => {
// // // //     console.log("🔄 Aggregating data by month, input rows:", rows.length);
    
// // // //     const monthMap = {};
// // // //     rows.forEach((row, index) => {
// // // //       const key = row.Month;
// // // //       if (!monthMap[key]) {
// // // //         monthMap[key] = {
// // // //           month: key,
// // // //           year: row.Year,
// // // //           monthNumber: row.MonthNumber,
// // // //           buckets: {},
// // // //         };
// // // //       }
// // // //       monthMap[key].buckets[row.Bucket] = {
// // // //         count: Number(row.TotalCount) || 0,
// // // //         percentage: Number(row.Percentage) || 0,
// // // //       };
      
// // // //       // Log first few for debugging
// // // //       if (index < 3) {
// // // //         console.log(`Row ${index}:`, row);
// // // //       }
// // // //     });

// // // //     // latest first
// // // //     const sorted = Object.values(monthMap).sort((a, b) => {
// // // //       if (a.year !== b.year) return b.year - a.year;
// // // //       return b.monthNumber - a.monthNumber;
// // // //     });
    
// // // //     console.log("✅ Aggregated into", sorted.length, "months");
// // // //     if (sorted.length > 0) {
// // // //       console.log("First month data:", sorted[0]);
// // // //       console.log("Last month data:", sorted[sorted.length - 1]);
// // // //     }
    
// // // //     return sorted;
// // // //   };

// // // //   const formatMonthYear = (monthStr) => {
// // // //     const [year, month] = monthStr.split("-");
// // // //     const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
// // // //     return `${names[parseInt(month, 10) - 1]} ${year}`;
// // // //   };

// // // //   // ---- UI / filter logic ----
// // // //   const handleInputChange = (field, value) => {
// // // //     // Update display value only
// // // //     setFilters((prev) => ({ 
// // // //       ...prev, 
// // // //       [field]: { ...prev[field], name: value } 
// // // //     }));

// // // //     let filtered = [];
// // // //     switch (field) {
// // // //       case "salesPerson":
// // // //         filtered = salesPersons.filter((sp) =>
// // // //           sp.SlpName?.toLowerCase().includes(value.toLowerCase())
// // // //         );
// // // //         break;
// // // //       case "customer":
// // // //         filtered = customers.filter(
// // // //           (c) =>
// // // //             c.CardName?.toLowerCase().includes(value.toLowerCase()) ||
// // // //             c.CardCode?.toLowerCase().includes(value.toLowerCase())
// // // //         );
// // // //         break;
// // // //       case "contactPerson":
// // // //         filtered = contactPersons.filter((cp) =>
// // // //           cp.ContactPerson?.toLowerCase().includes(value.toLowerCase())
// // // //         );
// // // //         break;
// // // //       case "category":
// // // //         filtered = categories.filter((cat) =>
// // // //           cat.ItmsGrpNam?.toLowerCase().includes(value.toLowerCase())
// // // //         );
// // // //         break;
// // // //       default:
// // // //         break;
// // // //     }

// // // //     setFilteredSuggestions((prev) => ({ ...prev, [field]: filtered }));
// // // //     setShowSuggestions((prev) => ({ ...prev, [field]: true }));
// // // //   };

// // // //   const handleSelectSuggestion = (field, item) => {
// // // //     let code = "";
// // // //     let displayValue = "";
    
// // // //     switch (field) {
// // // //       case "salesPerson":
// // // //         code = item.SlpCode;
// // // //         displayValue = item.SlpName;
// // // //         break;
// // // //       case "customer":
// // // //         code = item.CardCode;
// // // //         displayValue = `${item.CardCode} - ${item.CardName}`;
// // // //         break;
// // // //       case "contactPerson":
// // // //         code = item.CntctCode;
// // // //         displayValue = item.ContactPerson;
// // // //         break;
// // // //       case "category":
// // // //         code = item.ItmsGrpCod;
// // // //         displayValue = item.ItmsGrpNam;
// // // //         break;
// // // //       default:
// // // //         break;
// // // //     }
    
// // // //     setFilters((prev) => ({ 
// // // //       ...prev, 
// // // //       [field]: { code, name: displayValue } 
// // // //     }));
// // // //     setShowSuggestions((prev) => ({ ...prev, [field]: false }));
// // // //   };

// // // //   const handleClearFilter = (field) => {
// // // //     setFilters((prev) => ({ 
// // // //       ...prev, 
// // // //       [field]: { code: "", name: "" } 
// // // //     }));
// // // //   };

// // // //   const handleResetAll = () => {
// // // //     console.log("🔄 Resetting all filters and ranges");
// // // //     setFilters({
// // // //       salesPerson: { code: "", name: "" },
// // // //       customer: { code: "", name: "" },
// // // //       contactPerson: { code: "", name: "" },
// // // //       category: { code: "", name: "" },
// // // //     });
// // // //     setDayRanges([...DEFAULT_RANGES]);
// // // //     setAppliedRanges([...DEFAULT_RANGES]);
// // // //   };

// // // //   const tabs = [
// // // //     { id: "po-to-grn", label: "PO to GRN" },
// // // //     { id: "grn-to-invoice", label: "GRN to Invoice" },
// // // //     { id: "invoice-to-dispatch", label: "Invoice to Dispatch" },
// // // //   ];

// // // //   const renderDropdown = (field, placeholder) => (
// // // //     <div
// // // //       style={{ position: "relative", flex: 1, minWidth: 180 }}
// // // //       ref={dropdownRefs[field]}
// // // //     >
// // // //       <input
// // // //         type="text"
// // // //         value={filters[field].name}
// // // //         onChange={(e) => handleInputChange(field, e.target.value)}
// // // //         onFocus={() => setShowSuggestions((p) => ({ ...p, [field]: true }))}
// // // //         placeholder={placeholder}
// // // //         style={{
// // // //           width: "100%",
// // // //           padding: "10px 32px 10px 12px",
// // // //           border: "1px solid #d1d5db",
// // // //           borderRadius: 8,
// // // //           fontSize: 14,
// // // //           outline: "none",
// // // //         }}
// // // //       />

// // // //       {filters[field].name && (
// // // //         <button
// // // //           onClick={() => handleClearFilter(field)}
// // // //           aria-label="Clear"
// // // //           style={{
// // // //             position: "absolute",
// // // //             right: 8,
// // // //             top: "50%",
// // // //             transform: "translateY(-50%)",
// // // //             background: "none",
// // // //             border: "none",
// // // //             cursor: "pointer",
// // // //             fontSize: 18,
// // // //             color: "#9ca3af",
// // // //             padding: 4,
// // // //             lineHeight: 1,
// // // //           }}
// // // //         >
// // // //           ×
// // // //         </button>
// // // //       )}

// // // //       {showSuggestions[field] && filteredSuggestions[field]?.length > 0 && (
// // // //         <div
// // // //           style={{
// // // //             position: "absolute",
// // // //             top: "100%",
// // // //             left: 0,
// // // //             right: 0,
// // // //             marginTop: 4,
// // // //             backgroundColor: "#fff",
// // // //             border: "1px solid #d1d5db",
// // // //             borderRadius: 8,
// // // //             boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
// // // //             maxHeight: 220,
// // // //             overflowY: "auto",
// // // //             zIndex: 1000,
// // // //           }}
// // // //         >
// // // //           {filteredSuggestions[field].map((item, idx) => (
// // // //             <div
// // // //               key={idx}
// // // //               onMouseDown={() => handleSelectSuggestion(field, item)}
// // // //               style={{
// // // //                 padding: "10px 12px",
// // // //                 cursor: "pointer",
// // // //                 fontSize: 14,
// // // //               }}
// // // //               onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
// // // //               onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
// // // //             >
// // // //               {field === "customer" && (
// // // //                 <>
// // // //                   <div style={{ fontWeight: 600, color: "#111827" }}>{item.CardCode}</div>
// // // //                   <div style={{ fontSize: 12, color: "#6b7280" }}>{item.CardName}</div>
// // // //                 </>
// // // //               )}
// // // //               {field === "salesPerson" && item.SlpName}
// // // //               {field === "contactPerson" && item.ContactPerson}
// // // //               {field === "category" && item.ItmsGrpNam}
// // // //             </div>
// // // //           ))}
// // // //         </div>
// // // //       )}
// // // //     </div>
// // // //   );

// // // //   const renderStackedBar = (monthData) => {
// // // //     const total = Object.values(monthData.buckets).reduce((s, b) => s + (b?.count || 0), 0);

// // // //     return (
// // // //       <div key={monthData.month} style={{ marginBottom: 12 }}>
// // // //         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
// // // //           <span style={{ fontSize: 13, fontWeight: 600, color: "#1f2937" }}>
// // // //             {formatMonthYear(monthData.month)}
// // // //           </span>
// // // //           <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>
// // // //             Total: {total}
// // // //           </span>
// // // //         </div>

// // // //         <div
// // // //           style={{
// // // //             height: 36,
// // // //             borderRadius: 6,
// // // //             overflow: "hidden",
// // // //             border: "1px solid #e5e7eb",
// // // //             display: "flex",
// // // //           }}
// // // //         >
// // // //           {appliedRanges.map((range, idx) => {
// // // //             const bucket = monthData.buckets[range.label];
// // // //             const percentage = bucket ? Number(bucket.percentage) : 0;
// // // //             if (!percentage) return null;

// // // //             return (
// // // //               <div
// // // //                 key={idx}
// // // //                 style={{
// // // //                   width: `${percentage}%`,
// // // //                   backgroundColor: range.color,
// // // //                   display: "flex",
// // // //                   alignItems: "center",
// // // //                   justifyContent: "center",
// // // //                   color: "#fff",
// // // //                   fontSize: 11,
// // // //                   fontWeight: 700,
// // // //                   opacity: 0.85,
// // // //                 }}
// // // //                 title={`${range.label}: ${bucket.count} orders (${percentage.toFixed(1)}%)`}
// // // //               >
// // // //                 {percentage > 10 && `${percentage.toFixed(1)}%`}
// // // //               </div>
// // // //             );
// // // //           })}
// // // //         </div>
// // // //       </div>
// // // //     );
// // // //   };

// // // //   const sortedLegend = [...appliedRanges].sort((a, b) => a.min - b.min);

// // // //   return (
// // // //     <div style={{ padding: 24, minHeight: "100vh", backgroundColor: "#f9fafb" }}>
// // // //       <div
// // // //         style={{
// // // //           backgroundColor: "#fff",
// // // //           borderRadius: 12,
// // // //           boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
// // // //           overflow: "hidden",
// // // //         }}
// // // //       >
// // // //         {/* Header */}
// // // //         <div
// // // //           style={{
// // // //             padding: "20px 24px",
// // // //             borderBottom: "1px solid #e5e7eb",
// // // //             background: "linear-gradient(to right, #dbeafe, #bfdbfe)",
// // // //           }}
// // // //         >
// // // //           <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
// // // //             <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1e40af" }}>
// // // //               📊 Order Life Cycle
// // // //             </h2>
// // // //           </div>
// // // //         </div>

// // // //         {/* ALL FILTERS IN ONE LINE */}
// // // //         <div style={{ 
// // // //           padding: "20px 24px", 
// // // //           borderBottom: "1px solid #e5e7eb",
// // // //           display: "flex",
// // // //           alignItems: "center",
// // // //           gap: 12,
// // // //           flexWrap: "wrap"
// // // //         }}>
// // // //           {/* Configure Ranges - First */}
// // // //           <div style={{ minWidth: 220, flexShrink: 0 }}>
// // // //             <RangeConfiguration
// // // //               customRanges={dayRanges}
// // // //               onRangesChange={(updatedRanges) => setDayRanges(updatedRanges)}
// // // //               onApplyRanges={(validatedRanges) => {
// // // //                 console.log("Applying new ranges:", validatedRanges);
// // // //                 const enriched = validatedRanges.map((r, i) => ({
// // // //                   id: r.id ?? i + 1,
// // // //                   color: dayRanges[i]?.color || DEFAULT_RANGES[i]?.color || "#3b82f6",
// // // //                   ...r,
// // // //                 }));
// // // //                 setDayRanges(enriched);
// // // //                 setAppliedRanges(enriched);
// // // //               }}
// // // //             />
// // // //           </div>

// // // //           {/* All 4 Filters */}
// // // //           {renderDropdown("salesPerson", "Sales Person")}
// // // //           {renderDropdown("customer", "Customer")}
// // // //           {renderDropdown("contactPerson", "Contact Person")}
// // // //           {renderDropdown("category", "Category")}

// // // //           {/* Reset All Button - Last */}
// // // //           <button
// // // //             onClick={handleResetAll}
// // // //             style={{
// // // //               padding: "10px 16px",
// // // //               background: "#ef4444",
// // // //               color: "#fff",
// // // //               border: "none",
// // // //               borderRadius: 8,
// // // //               fontSize: 14,
// // // //               fontWeight: 600,
// // // //               cursor: "pointer",
// // // //               minWidth: 100,
// // // //               flexShrink: 0,
// // // //               height: 40,
// // // //               display: "flex",
// // // //               alignItems: "center",
// // // //               justifyContent: "center"
// // // //             }}
// // // //           >
// // // //             Reset All
// // // //           </button>
// // // //         </div>

// // // //         {/* Tabs */}
// // // //         <div
// // // //           style={{
// // // //             display: "flex",
// // // //             gap: 4,
// // // //             borderBottom: "2px solid #e5e7eb",
// // // //             padding: "0 24px",
// // // //           }}
// // // //         >
// // // //           {tabs.map((t) => (
// // // //             <button
// // // //               key={t.id}
// // // //               onClick={() => {
// // // //                 console.log("Tab changed to:", t.id);
// // // //                 setActiveTab(t.id);
// // // //               }}
// // // //               style={{
// // // //                 padding: "12px 20px",
// // // //                 border: "none",
// // // //                 background: "transparent",
// // // //                 color: activeTab === t.id ? "#2563eb" : "#6b7280",
// // // //                 fontWeight: activeTab === t.id ? 700 : 500,
// // // //                 fontSize: 14,
// // // //                 borderBottom: activeTab === t.id ? "2px solid #2563eb" : "2px solid transparent",
// // // //                 marginBottom: -2,
// // // //                 cursor: "pointer",
// // // //               }}
// // // //             >
// // // //               {t.label}
// // // //             </button>
// // // //           ))}
// // // //         </div>

// // // //         {/* Chart */}
// // // //         <div style={{ padding: 24 }}>
// // // //           {loading ? (
// // // //             <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>⏳ Loading data...</div>
// // // //           ) : chartData.length ? (
// // // //             <>
// // // //               <div style={{ maxHeight: 520, overflowY: "auto", paddingRight: 8, marginBottom: 20 }}>
// // // //                 {chartData.map((m) => renderStackedBar(m))}
// // // //               </div>

// // // //               {/* Legend */}
// // // //               <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
// // // //                 <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
// // // //                   Day Range Legend
// // // //                 </div>
// // // //                 <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
// // // //                   {sortedLegend.map((r) => (
// // // //                     <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
// // // //                       <span
// // // //                         style={{
// // // //                           width: 18,
// // // //                           height: 18,
// // // //                           borderRadius: 4,
// // // //                           backgroundColor: r.color,
// // // //                           border: "1px solid rgba(0,0,0,0.1)",
// // // //                         }}
// // // //                       />
// // // //                       <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{r.label}</span>
// // // //                     </div>
// // // //                   ))}
// // // //                 </div>
// // // //               </div>
// // // //             </>
// // // //           ) : (
// // // //             <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
// // // //               <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
// // // //               <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No data available</div>
// // // //               <div style={{ fontSize: 14 }}>Try adjusting filters or pick another tab.</div>
// // // //             </div>
// // // //           )}
// // // //         </div>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default OrderLifeCycle;

// // // // import React, { useState, useEffect, useRef } from "react";
// // // // import RangeConfiguration from "/components/main-page/order-to-invoice/RangeConfiguration";

// // // // const DEFAULT_RANGES = [
// // // //   { id: 1, min: 0, max: 3, label: "0-3 days", color: "#10b981" },
// // // //   { id: 2, min: 4, max: 5, label: "4-5 days", color: "#f59e0b" },
// // // //   { id: 3, min: 6, max: 8, label: "6-8 days", color: "#3b82f6" },
// // // //   { id: 4, min: 9, max: 10, label: "9-10 days", color: "#8b5cf6" },
// // // //   { id: 5, min: 11, max: 999, label: "10+ days", color: "#ef4444" },
// // // // ];

// // // // const OrderLifeCycle = () => {
// // // //   const [activeTab, setActiveTab] = useState("po-to-grn");

// // // //   const [filters, setFilters] = useState({
// // // //     salesPerson: { code: "", name: "" },
// // // //     customer: { code: "", name: "" },
// // // //     contactPerson: { code: "", name: "" },
// // // //     category: { code: "", name: "" },
// // // //   });

// // // //   const [dayRanges, setDayRanges] = useState([...DEFAULT_RANGES]);
// // // //   const [appliedRanges, setAppliedRanges] = useState([...DEFAULT_RANGES]);
// // // //   const [chartData, setChartData] = useState([]);
// // // //   const [loading, setLoading] = useState(false);

// // // //   const [salesPersons, setSalesPersons] = useState([]);
// // // //   const [customers, setCustomers] = useState([]);
// // // //   const [contactPersons, setContactPersons] = useState([]);
// // // //   const [categories, setCategories] = useState([]);

// // // //   const [showSuggestions, setShowSuggestions] = useState({
// // // //     salesPerson: false,
// // // //     customer: false,
// // // //     contactPerson: false,
// // // //     category: false,
// // // //   });
// // // //   const [filteredSuggestions, setFilteredSuggestions] = useState({
// // // //     salesPerson: [],
// // // //     customer: [],
// // // //     contactPerson: [],
// // // //     category: [],
// // // //   });

// // // //   const dropdownRefs = {
// // // //     salesPerson: useRef(null),
// // // //     customer: useRef(null),
// // // //     contactPerson: useRef(null),
// // // //     category: useRef(null),
// // // //   };

// // // //   useEffect(() => {
// // // //     (async () => {
// // // //       await Promise.all([
// // // //         fetchSalesPersons(),
// // // //         fetchCustomers(),
// // // //         fetchContactPersons(),
// // // //         fetchCategories(),
// // // //       ]);
// // // //     })();
// // // //   }, []);

// // // //   useEffect(() => {
// // // //     fetchChartData();
// // // //     // eslint-disable-next-line react-hooks/exhaustive-deps
// // // //   }, [
// // // //     activeTab,
// // // //     appliedRanges,
// // // //     filters.salesPerson.code,
// // // //     filters.customer.code,
// // // //     filters.contactPerson.code,
// // // //     filters.category.code,
// // // //   ]);

// // // //   useEffect(() => {
// // // //     const handleClickOutside = (event) => {
// // // //       Object.keys(dropdownRefs).forEach((key) => {
// // // //         if (dropdownRefs[key].current && !dropdownRefs[key].current.contains(event.target)) {
// // // //           setShowSuggestions((prev) => ({ ...prev, [key]: false }));
// // // //         }
// // // //       });
// // // //     };
// // // //     document.addEventListener("mousedown", handleClickOutside);
// // // //     return () => document.removeEventListener("mousedown", handleClickOutside);
// // // //   }, []);

// // // //   // ==== Fetch chart data ====
// // // //   const fetchChartData = async () => {
// // // //     setLoading(true);
// // // //     try {
// // // //       const apiEndpoints = {
// // // //         "po-to-grn": "/api/order-lifecycle/po-to-grn",
// // // //         "grn-to-invoice": "/api/order-lifecycle/grn-to-invoice",
// // // //         "invoice-to-dispatch": "/api/order-lifecycle/invoice-to-dispatch",
// // // //       };

// // // //       const endpoint = apiEndpoints[activeTab];
// // // //       const params = new URLSearchParams({
// // // //         ranges: JSON.stringify(
// // // //           appliedRanges.map(({ min, max, label }) => ({ min, max, label }))
// // // //         ),
// // // //       });

// // // //       if (filters.salesPerson.code) params.append("slpCode", filters.salesPerson.code);
// // // //       if (filters.customer.code) params.append("cardCode", filters.customer.code);
// // // //       if (filters.contactPerson.code) params.append("cntctCode", filters.contactPerson.code);
// // // //       if (filters.category.code) params.append("itmsGrpCod", filters.category.code);

// // // //       const res = await fetch(endpoint + "?" + params.toString(), {
// // // //         headers: {
// // // //           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
// // // //         },
// // // //       });
// // // //       const data = await res.json();

// // // //       const aggregated = aggregateByMonth(data.data || []);
// // // //       setChartData(aggregated);
// // // //     } catch (err) {
// // // //       console.error("❌ Error fetching chart data:", err);
// // // //       setChartData([]);
// // // //     } finally {
// // // //       setLoading(false);
// // // //     }
// // // //   };

// // // //   // ==== Fetch master data ====
// // // //   const fetchSalesPersons = async () => {
// // // //     const res = await fetch("/api/unique/salespersons");
// // // //     const data = await res.json();
// // // //     setSalesPersons(data.data || []);
// // // //     setFilteredSuggestions((p) => ({ ...p, salesPerson: data.data || [] }));
// // // //   };
// // // //   const fetchCustomers = async () => {
// // // //     const res = await fetch("/api/unique/customers");
// // // //     const data = await res.json();
// // // //     setCustomers(data.data || []);
// // // //     setFilteredSuggestions((p) => ({ ...p, customer: data.data || [] }));
// // // //   };
// // // //   const fetchContactPersons = async () => {
// // // //     const res = await fetch("/api/unique/contact-persons");
// // // //     const data = await res.json();
// // // //     setContactPersons(data.data || []);
// // // //     setFilteredSuggestions((p) => ({ ...p, contactPerson: data.data || [] }));
// // // //   };
// // // //   const fetchCategories = async () => {
// // // //     const res = await fetch("/api/unique/categories");
// // // //     const data = await res.json();
// // // //     setCategories(data.data || []);
// // // //     setFilteredSuggestions((p) => ({ ...p, category: data.data || [] }));
// // // //   };

// // // //   // ==== Aggregation helper ====
// // // //   const aggregateByMonth = (rows) => {
// // // //     const monthMap = {};
// // // //     rows.forEach((r) => {
// // // //       const key = r.Month;
// // // //       if (!monthMap[key]) {
// // // //         monthMap[key] = { month: key, year: r.Year, monthNumber: r.MonthNumber, buckets: {} };
// // // //       }
// // // //       monthMap[key].buckets[r.Bucket] = {
// // // //         count: Number(r.TotalCount) || 0,
// // // //         percentage: Number(r.Percentage) || 0,
// // // //       };
// // // //     });
// // // //     return Object.values(monthMap).sort((a, b) => {
// // // //       if (a.year !== b.year) return b.year - a.year;
// // // //       return b.monthNumber - a.monthNumber;
// // // //     });
// // // //   };

// // // //   const handleInputChange = (field, value) => {
// // // //     setFilters((prev) => ({ ...prev, [field]: { ...prev[field], name: value } }));
// // // //     let filtered = [];
// // // //     switch (field) {
// // // //       case "salesPerson":
// // // //         filtered = salesPersons.filter((sp) =>
// // // //           sp.SlpName?.toLowerCase().includes(value.toLowerCase())
// // // //         );
// // // //         break;
// // // //       case "customer":
// // // //         filtered = customers.filter(
// // // //           (c) =>
// // // //             c.CardName?.toLowerCase().includes(value.toLowerCase()) ||
// // // //             c.CardCode?.toLowerCase().includes(value.toLowerCase())
// // // //         );
// // // //         break;
// // // //       case "contactPerson":
// // // //         filtered = contactPersons.filter((cp) =>
// // // //           cp.ContactPerson?.toLowerCase().includes(value.toLowerCase())
// // // //         );
// // // //         break;
// // // //       case "category":
// // // //         filtered = categories.filter((cat) =>
// // // //           cat.ItmsGrpNam?.toLowerCase().includes(value.toLowerCase())
// // // //         );
// // // //         break;
// // // //       default:
// // // //         break;
// // // //     }
// // // //     setFilteredSuggestions((prev) => ({ ...prev, [field]: filtered }));
// // // //     setShowSuggestions((prev) => ({ ...prev, [field]: true }));
// // // //   };

// // // //   const handleSelectSuggestion = (field, item) => {
// // // //     let code = "";
// // // //     let display = "";
// // // //     switch (field) {
// // // //       case "salesPerson":
// // // //         code = item.SlpCode; display = item.SlpName; break;
// // // //       case "customer":
// // // //         code = item.CardCode; display = `${item.CardCode} - ${item.CardName}`; break;
// // // //       case "contactPerson":
// // // //         code = item.CntctCode; display = item.ContactPerson; break;
// // // //       case "category":
// // // //         code = item.ItmsGrpCod; display = item.ItmsGrpNam; break;
// // // //     }
// // // //     setFilters((p) => ({ ...p, [field]: { code, name: display } }));
// // // //     setShowSuggestions((p) => ({ ...p, [field]: false }));
// // // //   };

// // // //   const handleClearFilter = (field) => {
// // // //     setFilters((p) => ({ ...p, [field]: { code: "", name: "" } }));
// // // //   };

// // // //   const handleResetAll = () => {
// // // //     setFilters({
// // // //       salesPerson: { code: "", name: "" },
// // // //       customer: { code: "", name: "" },
// // // //       contactPerson: { code: "", name: "" },
// // // //       category: { code: "", name: "" },
// // // //     });
// // // //     setDayRanges([...DEFAULT_RANGES]);
// // // //     setAppliedRanges([...DEFAULT_RANGES]);
// // // //   };

// // // //   const tabs = [
// // // //     { id: "po-to-grn", label: "PO to GRN" },
// // // //     { id: "grn-to-invoice", label: "GRN to Invoice" },
// // // //     { id: "invoice-to-dispatch", label: "Invoice to Dispatch" },
// // // //   ];

// // // //   const formatMonthYear = (m) => {
// // // //     const [y, mo] = m.split("-");
// // // //     const n = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
// // // //     return `${n[parseInt(mo) - 1]} ${y}`;
// // // //   };

// // // //   const renderStackedBar = (monthData) => {
// // // //     const total = Object.values(monthData.buckets).reduce((s, b) => s + (b.count || 0), 0);
// // // //     return (
// // // //       <div key={monthData.month} style={{ marginBottom: 12 }}>
// // // //         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
// // // //           <span style={{ fontSize: 13, fontWeight: 600 }}>{formatMonthYear(monthData.month)}</span>
// // // //           <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Total: {total}</span>
// // // //         </div>
// // // //         <div style={{ height: 36, borderRadius: 6, display: "flex", overflow: "hidden", border: "1px solid #e5e7eb" }}>
// // // //           {appliedRanges.map((r, i) => {
// // // //             const bucket = monthData.buckets[r.label];
// // // //             const p = bucket ? bucket.percentage : 0;
// // // //             if (!p) return null;
// // // //             return (
// // // //               <div key={i} style={{
// // // //                 width: `${p}%`, backgroundColor: r.color, color: "#fff", display: "flex",
// // // //                 alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, opacity: 0.85
// // // //               }} title={`${r.label}: ${bucket.count} orders (${p.toFixed(1)}%)`}>
// // // //                 {p > 10 && `${p.toFixed(1)}%`}
// // // //               </div>
// // // //             );
// // // //           })}
// // // //         </div>
// // // //       </div>
// // // //     );
// // // //   };

// // // //   const sortedLegend = [...appliedRanges].sort((a, b) => a.min - b.min);

// // // //   return (
// // // //     <div style={{ padding: 24, minHeight: "100vh", backgroundColor: "#f9fafb" }}>
// // // //       <div style={{ backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
// // // //         <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", background: "linear-gradient(to right, #dbeafe, #bfdbfe)" }}>
// // // //           <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1e40af" }}>📊 Order Life Cycle</h2>
// // // //         </div>

// // // //         <div style={{
// // // //           padding: "20px 24px", borderBottom: "1px solid #e5e7eb",
// // // //           display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap"
// // // //         }}>
// // // //           <div style={{ minWidth: 220, flexShrink: 0 }}>
// // // //             <RangeConfiguration
// // // //               customRanges={dayRanges}
// // // //               onRangesChange={(updatedRanges) => setDayRanges(updatedRanges)}
// // // //               onApplyRanges={(validatedRanges) => {
// // // //                 const enriched = validatedRanges.map((r, i) => ({
// // // //                   id: r.id ?? i + 1,
// // // //                   color: DEFAULT_RANGES[i]?.color || dayRanges[i]?.color || "#3b82f6",
// // // //                   ...r,
// // // //                 }));
// // // //                 setDayRanges(enriched);
// // // //                 setAppliedRanges(enriched);
// // // //               }}
// // // //             />
// // // //           </div>
// // // //           {["salesPerson","customer","contactPerson","category"].map((f) =>
// // // //             <div key={f} ref={dropdownRefs[f]} style={{ position:"relative", flex:1, minWidth:180 }}>
// // // //               <input
// // // //                 value={filters[f].name}
// // // //                 onChange={(e)=>handleInputChange(f,e.target.value)}
// // // //                 placeholder={f.replace(/([A-Z])/g," $1")}
// // // //                 onFocus={()=>setShowSuggestions(p=>({...p,[f]:true}))}
// // // //                 style={{width:"100%",padding:"10px 32px 10px 12px",border:"1px solid #d1d5db",borderRadius:8}}
// // // //               />
// // // //               {filters[f].name && (
// // // //                 <button onClick={()=>handleClearFilter(f)} style={{
// // // //                   position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",
// // // //                   background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#9ca3af"
// // // //                 }}>×</button>
// // // //               )}
// // // //               {showSuggestions[f] && filteredSuggestions[f]?.length>0 && (
// // // //                 <div style={{
// // // //                   position:"absolute",top:"100%",left:0,right:0,marginTop:4,background:"#fff",
// // // //                   border:"1px solid #d1d5db",borderRadius:8,maxHeight:220,overflowY:"auto",zIndex:1000
// // // //                 }}>
// // // //                   {filteredSuggestions[f].map((item,idx)=>(
// // // //                     <div key={idx} onMouseDown={()=>handleSelectSuggestion(f,item)}
// // // //                       style={{padding:"10px 12px",cursor:"pointer",fontSize:14}}>
// // // //                       {f==="customer"&&(<><div style={{fontWeight:600}}>{item.CardCode}</div><div style={{fontSize:12,color:"#6b7280"}}>{item.CardName}</div></>)}
// // // //                       {f==="salesPerson"&&item.SlpName}
// // // //                       {f==="contactPerson"&&item.ContactPerson}
// // // //                       {f==="category"&&item.ItmsGrpNam}
// // // //                     </div>
// // // //                   ))}
// // // //                 </div>
// // // //               )}
// // // //             </div>
// // // //           )}
// // // //           <button onClick={handleResetAll}
// // // //             style={{padding:"10px 16px",background:"#ef4444",color:"#fff",border:"none",borderRadius:8,fontWeight:600}}>
// // // //             Reset All
// // // //           </button>
// // // //         </div>

// // // //         <div style={{display:"flex",gap:4,borderBottom:"2px solid #e5e7eb",padding:"0 24px"}}>
// // // //           {tabs.map((t)=>(
// // // //             <button key={t.id} onClick={()=>setActiveTab(t.id)}
// // // //               style={{
// // // //                 padding:"12px 20px",border:"none",background:"transparent",
// // // //                 color:activeTab===t.id?"#2563eb":"#6b7280",fontWeight:activeTab===t.id?700:500,
// // // //                 borderBottom:activeTab===t.id?"2px solid #2563eb":"2px solid transparent"
// // // //               }}>{t.label}</button>
// // // //           ))}
// // // //         </div>

// // // //         <div style={{padding:24}}>
// // // //           {loading?(
// // // //             <div style={{textAlign:"center",padding:40,color:"#6b7280"}}>⏳ Loading data...</div>
// // // //           ):chartData.length?(
// // // //             <>
// // // //               <div style={{maxHeight:520,overflowY:"auto",marginBottom:20}}>
// // // //                 {chartData.map(m=>renderStackedBar(m))}
// // // //               </div>
// // // //               <div style={{borderTop:"1px solid #e5e7eb",paddingTop:16}}>
// // // //                 <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Day Range Legend</div>
// // // //                 <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
// // // //                   {sortedLegend.map((r)=>(
// // // //                     <div key={r.label} style={{display:"flex",alignItems:"center",gap:8}}>
// // // //                       <span style={{
// // // //                         width:18,height:18,borderRadius:4,backgroundColor:r.color,border:"1px solid rgba(0,0,0,0.1)"
// // // //                       }}/>
// // // //                       <span style={{fontSize:13}}>{r.label}</span>
// // // //                     </div>
// // // //                   ))}
// // // //                 </div>
// // // //               </div>
// // // //             </>
// // // //           ):(
// // // //             <div style={{textAlign:"center",padding:40,color:"#6b7280"}}>
// // // //               <div style={{fontSize:48,marginBottom:16}}>📊</div>
// // // //               <div style={{fontSize:16,fontWeight:600}}>No data available</div>
// // // //               <div style={{fontSize:14}}>Try adjusting filters or pick another tab.</div>
// // // //             </div>
// // // //           )}
// // // //         </div>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // };
// // // // export default OrderLifeCycle;

// // // // pages/order-lifecycle/index.js
// // // import React, { useState, useEffect, useRef } from "react";
// // // import RangeConfiguration from "/components/main-page/order-to-invoice/RangeConfiguration";

// // // // Default ranges (keep in sync with API)
// // // const DEFAULT_RANGES = [
// // //   { id: 1, min: 0, max: 3, label: "0-3 days", color: "#10b981" },
// // //   { id: 2, min: 4, max: 5, label: "4-5 days", color: "#f59e0b" },
// // //   { id: 3, min: 6, max: 8, label: "6-8 days", color: "#3b82f6" },
// // //   { id: 4, min: 9, max: 10, label: "9-10 days", color: "#8b5cf6" },
// // //   { id: 5, min: 11, max: 999, label: "10+ days", color: "#ef4444" },
// // // ];

// // // const OrderLifeCycle = () => {
// // //   const [activeTab, setActiveTab] = useState("po-to-grn");

// // //   // Store both display value and actual code
// // //   const [filters, setFilters] = useState({
// // //     salesPerson: { code: "", name: "" },
// // //     customer: { code: "", name: "" },
// // //     contactPerson: { code: "", name: "" },
// // //     category: { code: "", name: "" },
// // //   });

// // //   // Ranges
// // //   const [dayRanges, setDayRanges] = useState([...DEFAULT_RANGES]);
// // //   const [appliedRanges, setAppliedRanges] = useState([...DEFAULT_RANGES]);

// // //   // Data + loading
// // //   const [chartData, setChartData] = useState([]);
// // //   const [loading, setLoading] = useState(false);

// // //   // Master data for suggestions
// // //   const [salesPersons, setSalesPersons] = useState([]);
// // //   const [customers, setCustomers] = useState([]);
// // //   const [contactPersons, setContactPersons] = useState([]);
// // //   const [categories, setCategories] = useState([]);

// // //   // Autocomplete UI state
// // //   const [showSuggestions, setShowSuggestions] = useState({
// // //     salesPerson: false,
// // //     customer: false,
// // //     contactPerson: false,
// // //     category: false,
// // //   });
// // //   const [filteredSuggestions, setFilteredSuggestions] = useState({
// // //     salesPerson: [],
// // //     customer: [],
// // //     contactPerson: [],
// // //     category: [],
// // //   });

// // //   const dropdownRefs = {
// // //     salesPerson: useRef(null),
// // //     customer: useRef(null),
// // //     contactPerson: useRef(null),
// // //     category: useRef(null),
// // //   };

// // //   // Fetch master lists
// // //   useEffect(() => {
// // //     (async () => {
// // //       await Promise.all([
// // //         fetchSalesPersons(),
// // //         fetchCustomers(),
// // //         fetchContactPersons(),
// // //         fetchCategories(),
// // //       ]);
// // //     })();
// // //   }, []);

// // //   // Fetch chart whenever tab or applied ranges or filters change
// // //   useEffect(() => {
// // //     fetchChartData();
// // //     // eslint-disable-next-line react-hooks/exhaustive-deps
// // //   }, [
// // //     activeTab, 
// // //     appliedRanges, 
// // //     filters.salesPerson.code, 
// // //     filters.customer.code, 
// // //     filters.contactPerson.code, 
// // //     filters.category.code
// // //   ]);

// // //   // Close autocompletes on outside click
// // //   useEffect(() => {
// // //     const handleClickOutside = (event) => {
// // //       Object.keys(dropdownRefs).forEach((key) => {
// // //         if (dropdownRefs[key].current && !dropdownRefs[key].current.contains(event.target)) {
// // //           setShowSuggestions((prev) => ({ ...prev, [key]: false }));
// // //         }
// // //       });
// // //     };
// // //     document.addEventListener("mousedown", handleClickOutside);
// // //     return () => document.removeEventListener("mousedown", handleClickOutside);
// // //   }, []);

// // //   // ---- API calls ----
// // //   const fetchChartData = async () => {
// // //     setLoading(true);
    
// // //     console.log("🔵 FETCHING CHART DATA");
// // //     console.log("Active Tab:", activeTab);
// // //     console.log("Applied Ranges:", appliedRanges);
// // //     console.log("Filters:", filters);

// // //     try {
// // //       // Map tab to API endpoint
// // //       const apiEndpoints = {
// // //         "po-to-grn": "/api/order-lifecycle/po-to-grn",
// // //         "grn-to-invoice": "/api/order-lifecycle/grn-to-invoice",
// // //         "invoice-to-dispatch": "/api/order-lifecycle/invoice-to-dispatch",
// // //       };

// // //       const endpoint = apiEndpoints[activeTab];
      
// // //       const params = new URLSearchParams({
// // //         ranges: JSON.stringify(
// // //           appliedRanges.map(({ min, max, label }) => ({ min, max, label }))
// // //         ),
// // //       });

// // //       // Send actual codes to API
// // //       if (filters.salesPerson.code) params.append("slpCode", filters.salesPerson.code);
// // //       if (filters.customer.code) params.append("cardCode", filters.customer.code);
// // //       if (filters.contactPerson.code) params.append("cntctCode", filters.contactPerson.code);
// // //       if (filters.category.code) params.append("itmsGrpCod", filters.category.code);

// // //       const url = `${endpoint}?${params.toString()}`;
// // //       console.log("Fetching from:", url);

// // //       const res = await fetch(url);
// // //       const data = await res.json();

// // //       console.log("📊 API Response:", data);
// // //       console.log("Meta info:", data.meta);
// // //       console.log("Data rows received:", data.data?.length || 0);

// // //       if (data.data && data.data.length > 0) {
// // //         console.log("First 3 data rows:", data.data.slice(0, 3));
// // //         console.log("Last 3 data rows:", data.data.slice(-3));
// // //       }

// // //       const aggregated = aggregateByMonth(data.data || []);
// // //       console.log("After aggregation:", aggregated);
      
// // //       setChartData(aggregated);
// // //     } catch (err) {
// // //       console.error("❌ Error fetching chart data:", err);
// // //       setChartData([]);
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   const fetchSalesPersons = async () => {
// // //     try {
// // //       const res = await fetch("/api/unique/salespersons");
// // //       const data = await res.json();
// // //       setSalesPersons(data.data || []);
// // //       setFilteredSuggestions((p) => ({ ...p, salesPerson: data.data || [] }));
// // //     } catch (e) {
// // //       console.error("Error fetching salespersons:", e);
// // //     }
// // //   };
// // //   const fetchCustomers = async () => {
// // //     try {
// // //       const res = await fetch("/api/unique/customers");
// // //       const data = await res.json();
// // //       setCustomers(data.data || []);
// // //       setFilteredSuggestions((p) => ({ ...p, customer: data.data || [] }));
// // //     } catch (e) {
// // //       console.error("Error fetching customers:", e);
// // //     }
// // //   };
// // //   const fetchContactPersons = async () => {
// // //     try {
// // //       const res = await fetch("/api/unique/contact-persons");
// // //       const data = await res.json();
// // //       setContactPersons(data.data || []);
// // //       setFilteredSuggestions((p) => ({ ...p, contactPerson: data.data || [] }));
// // //     } catch (e) {
// // //       console.error("Error fetching contact persons:", e);
// // //     }
// // //   };
// // //   const fetchCategories = async () => {
// // //     try {
// // //       const res = await fetch("/api/unique/categories");
// // //       const data = await res.json();
// // //       setCategories(data.data || []);
// // //       setFilteredSuggestions((p) => ({ ...p, category: data.data || [] }));
// // //     } catch (e) {
// // //       console.error("Error fetching categories:", e);
// // //     }
// // //   };

// // //   // ---- Helpers ----
// // //   const aggregateByMonth = (rows) => {
// // //     console.log("🔄 Aggregating data by month, input rows:", rows.length);
    
// // //     const monthMap = {};
// // //     rows.forEach((row, index) => {
// // //       const key = row.Month;
// // //       if (!monthMap[key]) {
// // //         monthMap[key] = {
// // //           month: key,
// // //           year: row.Year,
// // //           monthNumber: row.MonthNumber,
// // //           buckets: {},
// // //         };
// // //       }
// // //       monthMap[key].buckets[row.Bucket] = {
// // //         count: Number(row.TotalCount) || 0,
// // //         percentage: Number(row.Percentage) || 0,
// // //       };
      
// // //       // Log first few for debugging
// // //       if (index < 3) {
// // //         console.log(`Row ${index}:`, row);
// // //       }
// // //     });

// // //     // latest first
// // //     const sorted = Object.values(monthMap).sort((a, b) => {
// // //       if (a.year !== b.year) return b.year - a.year;
// // //       return b.monthNumber - a.monthNumber;
// // //     });
    
// // //     console.log("✅ Aggregated into", sorted.length, "months");
// // //     if (sorted.length > 0) {
// // //       console.log("First month data:", sorted[0]);
// // //       console.log("Last month data:", sorted[sorted.length - 1]);
// // //     }
    
// // //     return sorted;
// // //   };

// // //   const formatMonthYear = (monthStr) => {
// // //     const [year, month] = monthStr.split("-");
// // //     const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
// // //     return `${names[parseInt(month, 10) - 1]} ${year}`;
// // //   };

// // //   // ---- UI / filter logic ----
// // //   const handleInputChange = (field, value) => {
// // //     // Update display value only
// // //     setFilters((prev) => ({ 
// // //       ...prev, 
// // //       [field]: { ...prev[field], name: value } 
// // //     }));

// // //     let filtered = [];
// // //     switch (field) {
// // //       case "salesPerson":
// // //         filtered = salesPersons.filter((sp) =>
// // //           sp.SlpName?.toLowerCase().includes(value.toLowerCase())
// // //         );
// // //         break;
// // //       case "customer":
// // //         filtered = customers.filter(
// // //           (c) =>
// // //             c.CardName?.toLowerCase().includes(value.toLowerCase()) ||
// // //             c.CardCode?.toLowerCase().includes(value.toLowerCase())
// // //         );
// // //         break;
// // //       case "contactPerson":
// // //         filtered = contactPersons.filter((cp) =>
// // //           cp.ContactPerson?.toLowerCase().includes(value.toLowerCase())
// // //         );
// // //         break;
// // //       case "category":
// // //         filtered = categories.filter((cat) =>
// // //           cat.ItmsGrpNam?.toLowerCase().includes(value.toLowerCase())
// // //         );
// // //         break;
// // //       default:
// // //         break;
// // //     }

// // //     setFilteredSuggestions((prev) => ({ ...prev, [field]: filtered }));
// // //     setShowSuggestions((prev) => ({ ...prev, [field]: true }));
// // //   };

// // //   const handleSelectSuggestion = (field, item) => {
// // //     let code = "";
// // //     let displayValue = "";
    
// // //     switch (field) {
// // //       case "salesPerson":
// // //         code = item.SlpName;  // Send NAME for filtering
// // //         displayValue = item.SlpName;
// // //         break;
// // //       case "customer":
// // //         code = item.CardCode;  // Send CardCode
// // //         displayValue = `${item.CardCode} - ${item.CardName}`;
// // //         break;
// // //       case "contactPerson":
// // //         code = item.ContactPerson;  // Send NAME for filtering
// // //         displayValue = item.ContactPerson;
// // //         break;
// // //       case "category":
// // //         code = item.ItmsGrpNam;  // Send NAME for filtering
// // //         displayValue = item.ItmsGrpNam;
// // //         break;
// // //       default:
// // //         break;
// // //     }
    
// // //     setFilters((prev) => ({ 
// // //       ...prev, 
// // //       [field]: { code, name: displayValue } 
// // //     }));
// // //     setShowSuggestions((prev) => ({ ...prev, [field]: false }));
// // //   };

// // //   const handleClearFilter = (field) => {
// // //     setFilters((prev) => ({ 
// // //       ...prev, 
// // //       [field]: { code: "", name: "" } 
// // //     }));
// // //   };

// // //   const handleResetAll = () => {
// // //     console.log("🔄 Resetting all filters and ranges");
// // //     setFilters({
// // //       salesPerson: { code: "", name: "" },
// // //       customer: { code: "", name: "" },
// // //       contactPerson: { code: "", name: "" },
// // //       category: { code: "", name: "" },
// // //     });
// // //     setDayRanges([...DEFAULT_RANGES]);
// // //     setAppliedRanges([...DEFAULT_RANGES]);
// // //   };

// // //   const tabs = [
// // //     { id: "po-to-grn", label: "PO to GRN" },
// // //     { id: "grn-to-invoice", label: "GRN to Invoice" },
// // //     { id: "invoice-to-dispatch", label: "Invoice to Dispatch" },
// // //   ];

// // //   const renderDropdown = (field, placeholder) => (
// // //     <div
// // //       style={{ position: "relative", flex: 1, minWidth: 180 }}
// // //       ref={dropdownRefs[field]}
// // //     >
// // //       <input
// // //         type="text"
// // //         value={filters[field].name}
// // //         onChange={(e) => handleInputChange(field, e.target.value)}
// // //         onFocus={() => setShowSuggestions((p) => ({ ...p, [field]: true }))}
// // //         placeholder={placeholder}
// // //         style={{
// // //           width: "100%",
// // //           padding: "10px 32px 10px 12px",
// // //           border: "1px solid #d1d5db",
// // //           borderRadius: 8,
// // //           fontSize: 14,
// // //           outline: "none",
// // //         }}
// // //       />

// // //       {filters[field].name && (
// // //         <button
// // //           onClick={() => handleClearFilter(field)}
// // //           aria-label="Clear"
// // //           style={{
// // //             position: "absolute",
// // //             right: 8,
// // //             top: "50%",
// // //             transform: "translateY(-50%)",
// // //             background: "none",
// // //             border: "none",
// // //             cursor: "pointer",
// // //             fontSize: 18,
// // //             color: "#9ca3af",
// // //             padding: 4,
// // //             lineHeight: 1,
// // //           }}
// // //         >
// // //           ×
// // //         </button>
// // //       )}

// // //       {showSuggestions[field] && filteredSuggestions[field]?.length > 0 && (
// // //         <div
// // //           style={{
// // //             position: "absolute",
// // //             top: "100%",
// // //             left: 0,
// // //             right: 0,
// // //             marginTop: 4,
// // //             backgroundColor: "#fff",
// // //             border: "1px solid #d1d5db",
// // //             borderRadius: 8,
// // //             boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
// // //             maxHeight: 220,
// // //             overflowY: "auto",
// // //             zIndex: 1000,
// // //           }}
// // //         >
// // //           {filteredSuggestions[field].map((item, idx) => (
// // //             <div
// // //               key={idx}
// // //               onMouseDown={() => handleSelectSuggestion(field, item)}
// // //               style={{
// // //                 padding: "10px 12px",
// // //                 cursor: "pointer",
// // //                 fontSize: 14,
// // //               }}
// // //               onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
// // //               onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
// // //             >
// // //               {field === "customer" && (
// // //                 <>
// // //                   <div style={{ fontWeight: 600, color: "#111827" }}>{item.CardCode}</div>
// // //                   <div style={{ fontSize: 12, color: "#6b7280" }}>{item.CardName}</div>
// // //                 </>
// // //               )}
// // //               {field === "salesPerson" && item.SlpName}
// // //               {field === "contactPerson" && item.ContactPerson}
// // //               {field === "category" && item.ItmsGrpNam}
// // //             </div>
// // //           ))}
// // //         </div>
// // //       )}
// // //     </div>
// // //   );

// // //   const renderStackedBar = (monthData) => {
// // //     const total = Object.values(monthData.buckets).reduce((s, b) => s + (b?.count || 0), 0);

// // //     return (
// // //       <div key={monthData.month} style={{ marginBottom: 12 }}>
// // //         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
// // //           <span style={{ fontSize: 13, fontWeight: 600, color: "#1f2937" }}>
// // //             {formatMonthYear(monthData.month)}
// // //           </span>
// // //           <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>
// // //             Total: {total}
// // //           </span>
// // //         </div>

// // //         <div
// // //           style={{
// // //             height: 36,
// // //             borderRadius: 6,
// // //             overflow: "hidden",
// // //             border: "1px solid #e5e7eb",
// // //             display: "flex",
// // //           }}
// // //         >
// // //           {appliedRanges.map((range, idx) => {
// // //             const bucket = monthData.buckets[range.label];
// // //             const percentage = bucket ? Number(bucket.percentage) : 0;
// // //             if (!percentage) return null;

// // //             return (
// // //               <div
// // //                 key={idx}
// // //                 style={{
// // //                   width: `${percentage}%`,
// // //                   backgroundColor: range.color,
// // //                   display: "flex",
// // //                   alignItems: "center",
// // //                   justifyContent: "center",
// // //                   color: "#fff",
// // //                   fontSize: 11,
// // //                   fontWeight: 700,
// // //                   opacity: 0.85,
// // //                 }}
// // //                 title={`${range.label}: ${bucket.count} orders (${percentage.toFixed(1)}%)`}
// // //               >
// // //                 {percentage > 10 && `${percentage.toFixed(1)}%`}
// // //               </div>
// // //             );
// // //           })}
// // //         </div>
// // //       </div>
// // //     );
// // //   };

// // //   const sortedLegend = [...appliedRanges].sort((a, b) => a.min - b.min);

// // //   return (
// // //     <div style={{ padding: 24, minHeight: "100vh", backgroundColor: "#f9fafb" }}>
// // //       <div
// // //         style={{
// // //           backgroundColor: "#fff",
// // //           borderRadius: 12,
// // //           boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
// // //           overflow: "hidden",
// // //         }}
// // //       >
// // //         {/* Header */}
// // //         <div
// // //           style={{
// // //             padding: "20px 24px",
// // //             borderBottom: "1px solid #e5e7eb",
// // //             background: "linear-gradient(to right, #dbeafe, #bfdbfe)",
// // //           }}
// // //         >
// // //           <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
// // //             <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1e40af" }}>
// // //               📊 Order Life Cycle
// // //             </h2>
// // //           </div>
// // //         </div>

// // //         {/* ALL FILTERS IN ONE LINE */}
// // //         <div style={{ 
// // //           padding: "20px 24px", 
// // //           borderBottom: "1px solid #e5e7eb",
// // //           display: "flex",
// // //           alignItems: "center",
// // //           gap: 12,
// // //           flexWrap: "wrap"
// // //         }}>
// // //           {/* Configure Ranges - First */}
// // //           <div style={{ minWidth: 220, flexShrink: 0 }}>
// // //             <RangeConfiguration
// // //               customRanges={dayRanges}
// // //               onRangesChange={(updatedRanges) => setDayRanges(updatedRanges)}
// // //               onApplyRanges={(validatedRanges) => {
// // //                 console.log("Applying new ranges:", validatedRanges);
// // //                 const enriched = validatedRanges.map((r, i) => ({
// // //                   id: r.id ?? i + 1,
// // //                   color: dayRanges[i]?.color || DEFAULT_RANGES[i]?.color || "#3b82f6",
// // //                   ...r,
// // //                 }));
// // //                 setDayRanges(enriched);
// // //                 setAppliedRanges(enriched);
// // //               }}
// // //             />
// // //           </div>

// // //           {/* All 4 Filters */}
// // //           {renderDropdown("salesPerson", "Sales Person")}
// // //           {renderDropdown("customer", "Customer")}
// // //           {renderDropdown("contactPerson", "Contact Person")}
// // //           {renderDropdown("category", "Category")}

// // //           {/* Reset All Button - Last */}
// // //           <button
// // //             onClick={handleResetAll}
// // //             style={{
// // //               padding: "10px 16px",
// // //               background: "#ef4444",
// // //               color: "#fff",
// // //               border: "none",
// // //               borderRadius: 8,
// // //               fontSize: 14,
// // //               fontWeight: 600,
// // //               cursor: "pointer",
// // //               minWidth: 100,
// // //               flexShrink: 0,
// // //               height: 40,
// // //               display: "flex",
// // //               alignItems: "center",
// // //               justifyContent: "center"
// // //             }}
// // //           >
// // //             Reset All
// // //           </button>
// // //         </div>

// // //         {/* Tabs */}
// // //         <div
// // //           style={{
// // //             display: "flex",
// // //             gap: 4,
// // //             borderBottom: "2px solid #e5e7eb",
// // //             padding: "0 24px",
// // //           }}
// // //         >
// // //           {tabs.map((t) => (
// // //             <button
// // //               key={t.id}
// // //               onClick={() => {
// // //                 console.log("Tab changed to:", t.id);
// // //                 setActiveTab(t.id);
// // //               }}
// // //               style={{
// // //                 padding: "12px 20px",
// // //                 border: "none",
// // //                 background: "transparent",
// // //                 color: activeTab === t.id ? "#2563eb" : "#6b7280",
// // //                 fontWeight: activeTab === t.id ? 700 : 500,
// // //                 fontSize: 14,
// // //                 borderBottom: activeTab === t.id ? "2px solid #2563eb" : "2px solid transparent",
// // //                 marginBottom: -2,
// // //                 cursor: "pointer",
// // //               }}
// // //             >
// // //               {t.label}
// // //             </button>
// // //           ))}
// // //         </div>

// // //         {/* Chart */}
// // //         <div style={{ padding: 24 }}>
// // //           {loading ? (
// // //             <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>⏳ Loading data...</div>
// // //           ) : chartData.length ? (
// // //             <>
// // //               <div style={{ maxHeight: 520, overflowY: "auto", paddingRight: 8, marginBottom: 20 }}>
// // //                 {chartData.map((m) => renderStackedBar(m))}
// // //               </div>

// // //               {/* Legend */}
// // //               <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
// // //                 <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
// // //                   Day Range Legend
// // //                 </div>
// // //                 <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
// // //                   {sortedLegend.map((r) => (
// // //                     <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
// // //                       <span
// // //                         style={{
// // //                           width: 18,
// // //                           height: 18,
// // //                           borderRadius: 4,
// // //                           backgroundColor: r.color,
// // //                           border: "1px solid rgba(0,0,0,0.1)",
// // //                         }}
// // //                       />
// // //                       <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{r.label}</span>
// // //                     </div>
// // //                   ))}
// // //                 </div>
// // //               </div>
// // //             </>
// // //           ) : (
// // //             <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
// // //               <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
// // //               <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No data available</div>
// // //               <div style={{ fontSize: 14 }}>Try adjusting filters or pick another tab.</div>
// // //             </div>
// // //           )}
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default OrderLifeCycle;

// // // pages/order-lifecycle/index.js
// // import React, { useState, useEffect, useRef } from "react";

// // const DEFAULT_RANGES = [
// //   { id: 1, min: 0, max: 3, label: "0-3 days", color: "#10b981" },
// //   { id: 2, min: 4, max: 5, label: "4-5 days", color: "#f59e0b" },
// //   { id: 3, min: 6, max: 8, label: "6-8 days", color: "#3b82f6" },
// //   { id: 4, min: 9, max: 10, label: "9-10 days", color: "#8b5cf6" },
// //   { id: 5, min: 11, max: 999, label: "10+ days", color: "#ef4444" },
// // ];

// // const OrderLifeCycle = () => {
// //   const [activeTab, setActiveTab] = useState("po-to-grn");
// //   const [filters, setFilters] = useState({
// //     salesPerson: "",
// //     customer: "",
// //     contactPerson: "",
// //     category: "",
// //   });

// //   const [chartData, setChartData] = useState([]);
// //   const [loading, setLoading] = useState(false);

// //   const [salesPersons, setSalesPersons] = useState([]);
// //   const [customers, setCustomers] = useState([]);
// //   const [contactPersons, setContactPersons] = useState([]);
// //   const [categories, setCategories] = useState([]);

// //   const [showSuggestions, setShowSuggestions] = useState({
// //     salesPerson: false,
// //     customer: false,
// //     contactPerson: false,
// //     category: false,
// //   });
// //   const [filteredSuggestions, setFilteredSuggestions] = useState({
// //     salesPerson: [],
// //     customer: [],
// //     contactPerson: [],
// //     category: [],
// //   });

// //   const dropdownRefs = {
// //     salesPerson: useRef(null),
// //     customer: useRef(null),
// //     contactPerson: useRef(null),
// //     category: useRef(null),
// //   };

// //   useEffect(() => {
// //     (async () => {
// //       await Promise.all([
// //         fetchSalesPersons(),
// //         fetchCustomers(),
// //         fetchContactPersons(),
// //         fetchCategories(),
// //       ]);
// //     })();
// //   }, []);

// //   useEffect(() => {
// //     fetchChartData();
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [activeTab, filters.salesPerson, filters.customer, filters.contactPerson, filters.category]);

// //   useEffect(() => {
// //     const handleClickOutside = (event) => {
// //       Object.keys(dropdownRefs).forEach((key) => {
// //         if (dropdownRefs[key].current && !dropdownRefs[key].current.contains(event.target)) {
// //           setShowSuggestions((prev) => ({ ...prev, [key]: false }));
// //         }
// //       });
// //     };
// //     document.addEventListener("mousedown", handleClickOutside);
// //     return () => document.removeEventListener("mousedown", handleClickOutside);
// //   }, []);

// //   const fetchChartData = async () => {
// //     setLoading(true);
// //     try {
// //       const apiEndpoints = {
// //         "po-to-grn": "/api/order-lifecycle/po-to-grn",
// //         "grn-to-invoice": "/api/order-lifecycle/grn-to-invoice",
// //         "invoice-to-dispatch": "/api/order-lifecycle/invoice-to-dispatch",
// //       };

// //       const endpoint = apiEndpoints[activeTab];
// //       const params = new URLSearchParams();

// //       if (filters.salesPerson) params.append("slpName", filters.salesPerson);
// //       if (filters.customer) params.append("cardCode", filters.customer.split(" - ")[0]);
// //       if (filters.contactPerson) params.append("contactPerson", filters.contactPerson);
// //       if (filters.category) params.append("category", filters.category);

// //       const res = await fetch(`${endpoint}?${params.toString()}`);
// //       const data = await res.json();

// //       const aggregated = aggregateByMonth(data.data || []);
// //       setChartData(aggregated);
// //     } catch (err) {
// //       console.error("Error fetching chart data:", err);
// //       setChartData([]);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const fetchSalesPersons = async () => {
// //     const res = await fetch("/api/unique/salespersons");
// //     const data = await res.json();
// //     setSalesPersons(data.data || []);
// //     setFilteredSuggestions((p) => ({ ...p, salesPerson: data.data || [] }));
// //   };
// //   const fetchCustomers = async () => {
// //     const res = await fetch("/api/unique/customers");
// //     const data = await res.json();
// //     setCustomers(data.data || []);
// //     setFilteredSuggestions((p) => ({ ...p, customer: data.data || [] }));
// //   };
// //   const fetchContactPersons = async () => {
// //     const res = await fetch("/api/unique/contact-persons");
// //     const data = await res.json();
// //     setContactPersons(data.data || []);
// //     setFilteredSuggestions((p) => ({ ...p, contactPerson: data.data || [] }));
// //   };
// //   const fetchCategories = async () => {
// //     const res = await fetch("/api/unique/categories");
// //     const data = await res.json();
// //     setCategories(data.data || []);
// //     setFilteredSuggestions((p) => ({ ...p, category: data.data || [] }));
// //   };

// //   const aggregateByMonth = (rows) => {
// //     const monthMap = {};
// //     rows.forEach((r) => {
// //       const key = r.Month;
// //       if (!monthMap[key]) {
// //         monthMap[key] = { month: key, year: r.Year, monthNumber: r.MonthNumber, buckets: {} };
// //       }
// //       monthMap[key].buckets[r.Bucket] = {
// //         count: Number(r.TotalCount) || 0,
// //         percentage: Number(r.Percentage) || 0,
// //       };
// //     });
// //     return Object.values(monthMap).sort((a, b) => {
// //       if (a.year !== b.year) return b.year - a.year;
// //       return b.monthNumber - a.monthNumber;
// //     });
// //   };

// //   const handleInputChange = (field, value) => {
// //     setFilters((prev) => ({ ...prev, [field]: value }));
// //     let filtered = [];
// //     switch (field) {
// //       case "salesPerson":
// //         filtered = salesPersons.filter((sp) =>
// //           sp.SlpName?.toLowerCase().includes(value.toLowerCase())
// //         );
// //         break;
// //       case "customer":
// //         filtered = customers.filter(
// //           (c) =>
// //             c.CardName?.toLowerCase().includes(value.toLowerCase()) ||
// //             c.CardCode?.toLowerCase().includes(value.toLowerCase())
// //         );
// //         break;
// //       case "contactPerson":
// //         filtered = contactPersons.filter((cp) =>
// //           cp.ContactPerson?.toLowerCase().includes(value.toLowerCase())
// //         );
// //         break;
// //       case "category":
// //         filtered = categories.filter((cat) =>
// //           cat.ItmsGrpNam?.toLowerCase().includes(value.toLowerCase())
// //         );
// //         break;
// //       default:
// //         break;
// //     }
// //     setFilteredSuggestions((prev) => ({ ...prev, [field]: filtered }));
// //     setShowSuggestions((prev) => ({ ...prev, [field]: true }));
// //   };

// //   const handleSelectSuggestion = (field, item) => {
// //     let value = "";
// //     switch (field) {
// //       case "salesPerson":
// //         value = item.SlpName;
// //         break;
// //       case "customer":
// //         value = `${item.CardCode} - ${item.CardName}`;
// //         break;
// //       case "contactPerson":
// //         value = item.ContactPerson;
// //         break;
// //       case "category":
// //         value = item.ItmsGrpNam;
// //         break;
// //     }
// //     setFilters((p) => ({ ...p, [field]: value }));
// //     setShowSuggestions((p) => ({ ...p, [field]: false }));
// //   };

// //   const handleClearFilter = (field) => {
// //     setFilters((p) => ({ ...p, [field]: "" }));
// //   };

// //   const handleResetAll = () => {
// //     setFilters({
// //       salesPerson: "",
// //       customer: "",
// //       contactPerson: "",
// //       category: "",
// //     });
// //   };

// //   const tabs = [
// //     { id: "po-to-grn", label: "PO to GRN" },
// //     { id: "grn-to-invoice", label: "GRN to Invoice" },
// //     { id: "invoice-to-dispatch", label: "Invoice to Dispatch" },
// //   ];

// //   const formatMonthYear = (m) => {
// //     const [y, mo] = m.split("-");
// //     const n = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// //     return `${n[parseInt(mo) - 1]} ${y}`;
// //   };

// //   const renderStackedBar = (monthData) => {
// //     const total = Object.values(monthData.buckets).reduce((s, b) => s + (b.count || 0), 0);
// //     return (
// //       <div key={monthData.month} style={{ marginBottom: 12 }}>
// //         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
// //           <span style={{ fontSize: 13, fontWeight: 600 }}>{formatMonthYear(monthData.month)}</span>
// //           <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Total: {total}</span>
// //         </div>
// //         <div style={{ height: 36, borderRadius: 6, display: "flex", overflow: "hidden", border: "1px solid #e5e7eb" }}>
// //           {DEFAULT_RANGES.map((r, i) => {
// //             const bucket = monthData.buckets[r.label];
// //             const p = bucket ? bucket.percentage : 0;
// //             if (!p) return null;
// //             return (
// //               <div
// //                 key={i}
// //                 style={{
// //                   width: `${p}%`,
// //                   backgroundColor: r.color,
// //                   color: "#fff",
// //                   display: "flex",
// //                   alignItems: "center",
// //                   justifyContent: "center",
// //                   fontSize: 11,
// //                   fontWeight: 700,
// //                   opacity: 0.85,
// //                 }}
// //                 title={`${r.label}: ${bucket.count} orders (${p.toFixed(1)}%)`}
// //               >
// //                 {p > 10 && `${p.toFixed(1)}%`}
// //               </div>
// //             );
// //           })}
// //         </div>
// //       </div>
// //     );
// //   };

// //   const renderDropdown = (field, placeholder) => (
// //     <div ref={dropdownRefs[field]} style={{ position: "relative", flex: 1, minWidth: 180 }}>
// //       <input
// //         value={filters[field]}
// //         onChange={(e) => handleInputChange(field, e.target.value)}
// //         placeholder={placeholder}
// //         onFocus={() => setShowSuggestions((p) => ({ ...p, [field]: true }))}
// //         style={{ width: "100%", padding: "10px 32px 10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none" }}
// //       />
// //       {filters[field] && (
// //         <button
// //           onClick={() => handleClearFilter(field)}
// //           style={{
// //             position: "absolute",
// //             right: 8,
// //             top: "50%",
// //             transform: "translateY(-50%)",
// //             background: "none",
// //             border: "none",
// //             cursor: "pointer",
// //             fontSize: 18,
// //             color: "#9ca3af",
// //           }}
// //         >
// //           ×
// //         </button>
// //       )}
// //       {showSuggestions[field] && filteredSuggestions[field]?.length > 0 && (
// //         <div
// //           style={{
// //             position: "absolute",
// //             top: "100%",
// //             left: 0,
// //             right: 0,
// //             marginTop: 4,
// //             background: "#fff",
// //             border: "1px solid #d1d5db",
// //             borderRadius: 8,
// //             maxHeight: 220,
// //             overflowY: "auto",
// //             zIndex: 1000,
// //           }}
// //         >
// //           {filteredSuggestions[field].map((item, idx) => (
// //             <div
// //               key={idx}
// //               onMouseDown={() => handleSelectSuggestion(field, item)}
// //               style={{ padding: "10px 12px", cursor: "pointer", fontSize: 14 }}
// //               onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
// //               onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
// //             >
// //               {field === "customer" && (
// //                 <>
// //                   <div style={{ fontWeight: 600 }}>{item.CardCode}</div>
// //                   <div style={{ fontSize: 12, color: "#6b7280" }}>{item.CardName}</div>
// //                 </>
// //               )}
// //               {field === "salesPerson" && item.SlpName}
// //               {field === "contactPerson" && item.ContactPerson}
// //               {field === "category" && item.ItmsGrpNam}
// //             </div>
// //           ))}
// //         </div>
// //       )}
// //     </div>
// //   );

// //   const sortedLegend = [...DEFAULT_RANGES].sort((a, b) => a.min - b.min);

// //   return (
// //     <div style={{ padding: 24, minHeight: "100vh", backgroundColor: "#f9fafb" }}>
// //       <div style={{ backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
// //         <div
// //           style={{
// //             padding: "20px 24px",
// //             borderBottom: "1px solid #e5e7eb",
// //             background: "linear-gradient(to right, #dbeafe, #bfdbfe)",
// //           }}
// //         >
// //           <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1e40af" }}>📊 Order Life Cycle</h2>
// //         </div>

// //         <div
// //           style={{
// //             padding: "20px 24px",
// //             borderBottom: "1px solid #e5e7eb",
// //             display: "flex",
// //             alignItems: "center",
// //             gap: 12,
// //             flexWrap: "wrap",
// //           }}
// //         >
// //           {renderDropdown("salesPerson", "Sales Person")}
// //           {renderDropdown("customer", "Customer")}
// //           {renderDropdown("contactPerson", "Contact Person")}
// //           {renderDropdown("category", "Category")}
// //           <button
// //             onClick={handleResetAll}
// //             style={{
// //               padding: "10px 16px",
// //               background: "#ef4444",
// //               color: "#fff",
// //               border: "none",
// //               borderRadius: 8,
// //               fontWeight: 600,
// //               cursor: "pointer",
// //               minWidth: 100,
// //               height: 40,
// //             }}
// //           >
// //             Reset All
// //           </button>
// //         </div>

// //         <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #e5e7eb", padding: "0 24px" }}>
// //           {tabs.map((t) => (
// //             <button
// //               key={t.id}
// //               onClick={() => setActiveTab(t.id)}
// //               style={{
// //                 padding: "12px 20px",
// //                 border: "none",
// //                 background: "transparent",
// //                 color: activeTab === t.id ? "#2563eb" : "#6b7280",
// //                 fontWeight: activeTab === t.id ? 700 : 500,
// //                 borderBottom: activeTab === t.id ? "2px solid #2563eb" : "2px solid transparent",
// //                 marginBottom: -2,
// //                 cursor: "pointer",
// //               }}
// //             >
// //               {t.label}
// //             </button>
// //           ))}
// //         </div>

// //         <div style={{ padding: 24 }}>
// //           {loading ? (
// //             <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>⏳ Loading data...</div>
// //           ) : chartData.length ? (
// //             <>
// //               <div style={{ maxHeight: 520, overflowY: "auto", marginBottom: 20 }}>
// //                 {chartData.map((m) => renderStackedBar(m))}
// //               </div>
// //               <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
// //                 <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Day Range Legend</div>
// //                 <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
// //                   {sortedLegend.map((r) => (
// //                     <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
// //                       <span
// //                         style={{
// //                           width: 18,
// //                           height: 18,
// //                           borderRadius: 4,
// //                           backgroundColor: r.color,
// //                           border: "1px solid rgba(0,0,0,0.1)",
// //                         }}
// //                       />
// //                       <span style={{ fontSize: 13 }}>{r.label}</span>
// //                     </div>
// //                   ))}
// //                 </div>
// //               </div>
// //             </>
// //           ) : (
// //             <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
// //               <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
// //               <div style={{ fontSize: 16, fontWeight: 600 }}>No data available</div>
// //               <div style={{ fontSize: 14 }}>Try adjusting filters or pick another tab.</div>
// //             </div>
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default OrderLifeCycle;

// // pages/order-lifecycle/index.js
// import React, { useState, useEffect, useRef } from "react";

// const DEFAULT_RANGES = [
//   { id: 1, min: 0, max: 3, label: "0-3 days", color: "#10b981" },
//   { id: 2, min: 4, max: 5, label: "4-5 days", color: "#f59e0b" },
//   { id: 3, min: 6, max: 8, label: "6-8 days", color: "#3b82f6" },
//   { id: 4, min: 9, max: 10, label: "9-10 days", color: "#8b5cf6" },
//   { id: 5, min: 11, max: 999, label: "10+ days", color: "#ef4444" },
// ];

// const OrderLifeCycle = () => {
//   const [activeTab, setActiveTab] = useState("po-to-grn");
//   const [filters, setFilters] = useState({
//     salesPerson: "",
//     customer: "",
//     contactPerson: "",
//     category: "",
//   });

//   const [chartData, setChartData] = useState([]);
//   const [loading, setLoading] = useState(false);

//   // Dynamic unique values from current tab's data
//   const [uniqueValues, setUniqueValues] = useState({
//     salesPersons: [],
//     contactPersons: [],
//     customers: [],
//     categories: [],
//   });

//   const [showSuggestions, setShowSuggestions] = useState({
//     salesPerson: false,
//     customer: false,
//     contactPerson: false,
//     category: false,
//   });
//   const [filteredSuggestions, setFilteredSuggestions] = useState({
//     salesPerson: [],
//     customer: [],
//     contactPerson: [],
//     category: [],
//   });

//   const dropdownRefs = {
//     salesPerson: useRef(null),
//     customer: useRef(null),
//     contactPerson: useRef(null),
//     category: useRef(null),
//   };

//   // Fetch data when tab changes or filters change
//   useEffect(() => {
//     fetchChartData();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [activeTab, filters.salesPerson, filters.customer, filters.contactPerson, filters.category]);

//   // Reset filters when tab changes
//   useEffect(() => {
//     setFilters({
//       salesPerson: "",
//       customer: "",
//       contactPerson: "",
//       category: "",
//     });
//   }, [activeTab]);

//   // Close dropdowns on outside click
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       Object.keys(dropdownRefs).forEach((key) => {
//         if (dropdownRefs[key].current && !dropdownRefs[key].current.contains(event.target)) {
//           setShowSuggestions((prev) => ({ ...prev, [key]: false }));
//         }
//       });
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const fetchChartData = async () => {
//     setLoading(true);
//     try {
//       const apiEndpoints = {
//         "po-to-grn": "/api/order-lifecycle/po-to-grn",
//         "grn-to-invoice": "/api/order-lifecycle/grn-to-invoice",
//         "invoice-to-dispatch": "/api/order-lifecycle/invoice-to-dispatch",
//       };

//       const endpoint = apiEndpoints[activeTab];
//       const params = new URLSearchParams();

//       if (filters.salesPerson) params.append("slpName", filters.salesPerson);
//       if (filters.customer) params.append("customerName", filters.customer);
//       if (filters.contactPerson) params.append("contactPerson", filters.contactPerson);
//       if (filters.category) params.append("category", filters.category);

//       const res = await fetch(`${endpoint}?${params.toString()}`);
//       const data = await res.json();

//       // Update chart data
//       const aggregated = aggregateByMonth(data.data || []);
//       setChartData(aggregated);

//       // Update unique values from API response
//       if (data.uniqueValues) {
//         setUniqueValues(data.uniqueValues);
//         setFilteredSuggestions({
//           salesPerson: data.uniqueValues.salesPersons || [],
//           customer: data.uniqueValues.customers || [],
//           contactPerson: data.uniqueValues.contactPersons || [],
//           category: data.uniqueValues.categories || [],
//         });
//       }
//     } catch (err) {
//       console.error("Error fetching chart data:", err);
//       setChartData([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const aggregateByMonth = (rows) => {
//     const monthMap = {};
//     rows.forEach((r) => {
//       const key = r.Month;
//       if (!monthMap[key]) {
//         monthMap[key] = { month: key, year: r.Year, monthNumber: r.MonthNumber, buckets: {} };
//       }
//       monthMap[key].buckets[r.Bucket] = {
//         count: Number(r.TotalCount) || 0,
//         percentage: Number(r.Percentage) || 0,
//       };
//     });
//     return Object.values(monthMap).sort((a, b) => {
//       if (a.year !== b.year) return b.year - a.year;
//       return b.monthNumber - a.monthNumber;
//     });
//   };

//   const handleInputChange = (field, value) => {
//     setFilters((prev) => ({ ...prev, [field]: value }));
    
//     let filtered = [];
//     switch (field) {
//       case "salesPerson":
//         filtered = uniqueValues.salesPersons.filter((sp) =>
//           sp.toLowerCase().includes(value.toLowerCase())
//         );
//         break;
//       case "customer":
//         filtered = uniqueValues.customers.filter((c) =>
//           c.toLowerCase().includes(value.toLowerCase())
//         );
//         break;
//       case "contactPerson":
//         filtered = uniqueValues.contactPersons.filter((cp) =>
//           cp.toLowerCase().includes(value.toLowerCase())
//         );
//         break;
//       case "category":
//         filtered = uniqueValues.categories.filter((cat) =>
//           cat.toLowerCase().includes(value.toLowerCase())
//         );
//         break;
//       default:
//         break;
//     }
//     setFilteredSuggestions((prev) => ({ ...prev, [field]: filtered }));
//     setShowSuggestions((prev) => ({ ...prev, [field]: true }));
//   };

//   const handleSelectSuggestion = (field, value) => {
//     setFilters((p) => ({ ...p, [field]: value }));
//     setShowSuggestions((p) => ({ ...p, [field]: false }));
//   };

//   const handleClearFilter = (field) => {
//     setFilters((p) => ({ ...p, [field]: "" }));
//   };

//   const handleResetAll = () => {
//     setFilters({
//       salesPerson: "",
//       customer: "",
//       contactPerson: "",
//       category: "",
//     });
//   };

//   const tabs = [
//     { id: "po-to-grn", label: "PO to GRN" },
//     { id: "grn-to-invoice", label: "GRN to Invoice" },
//     { id: "invoice-to-dispatch", label: "Invoice to Dispatch" },
//   ];

//   const formatMonthYear = (m) => {
//     const [y, mo] = m.split("-");
//     const n = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//     return `${n[parseInt(mo) - 1]} ${y}`;
//   };

//   const renderStackedBar = (monthData) => {
//     const total = Object.values(monthData.buckets).reduce((s, b) => s + (b.count || 0), 0);
//     return (
//       <div key={monthData.month} style={{ marginBottom: 12 }}>
//         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
//           <span style={{ fontSize: 13, fontWeight: 600, color: "#1f2937" }}>
//             {formatMonthYear(monthData.month)}
//           </span>
//           <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Total: {total}</span>
//         </div>
//         <div style={{ height: 36, borderRadius: 6, display: "flex", overflow: "hidden", border: "1px solid #e5e7eb" }}>
//           {DEFAULT_RANGES.map((r, i) => {
//             const bucket = monthData.buckets[r.label];
//             const p = bucket ? bucket.percentage : 0;
//             if (!p) return null;
//             return (
//               <div
//                 key={i}
//                 style={{
//                   width: `${p}%`,
//                   backgroundColor: r.color,
//                   color: "#fff",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   fontSize: 11,
//                   fontWeight: 700,
//                   opacity: 0.85,
//                 }}
//                 title={`${r.label}: ${bucket.count} orders (${p.toFixed(1)}%)`}
//               >
//                 {p > 10 && `${p.toFixed(1)}%`}
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     );
//   };

//   const renderDropdown = (field, placeholder) => (
//     <div ref={dropdownRefs[field]} style={{ position: "relative", flex: 1, minWidth: 180 }}>
//       <input
//         value={filters[field]}
//         onChange={(e) => handleInputChange(field, e.target.value)}
//         placeholder={placeholder}
//         onFocus={() => setShowSuggestions((p) => ({ ...p, [field]: true }))}
//         style={{ 
//           width: "100%", 
//           padding: "10px 32px 10px 12px", 
//           border: "1px solid #d1d5db", 
//           borderRadius: 8, 
//           fontSize: 14, 
//           outline: "none" 
//         }}
//       />
//       {filters[field] && (
//         <button
//           onClick={() => handleClearFilter(field)}
//           style={{
//             position: "absolute",
//             right: 8,
//             top: "50%",
//             transform: "translateY(-50%)",
//             background: "none",
//             border: "none",
//             cursor: "pointer",
//             fontSize: 18,
//             color: "#9ca3af",
//           }}
//         >
//           ×
//         </button>
//       )}
//       {showSuggestions[field] && filteredSuggestions[field]?.length > 0 && (
//         <div
//           style={{
//             position: "absolute",
//             top: "100%",
//             left: 0,
//             right: 0,
//             marginTop: 4,
//             background: "#fff",
//             border: "1px solid #d1d5db",
//             borderRadius: 8,
//             boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
//             maxHeight: 220,
//             overflowY: "auto",
//             zIndex: 1000,
//           }}
//         >
//           {filteredSuggestions[field].map((item, idx) => (
//             <div
//               key={idx}
//               onMouseDown={() => handleSelectSuggestion(field, item)}
//               style={{ 
//                 padding: "10px 12px", 
//                 cursor: "pointer", 
//                 fontSize: 14 
//               }}
//               onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
//               onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
//             >
//               {item}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );

//   const sortedLegend = [...DEFAULT_RANGES].sort((a, b) => a.min - b.min);

//   return (
//     <div style={{ padding: 24, minHeight: "100vh", backgroundColor: "#f9fafb" }}>
//       <div style={{ backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
//         {/* Header */}
//         <div
//           style={{
//             padding: "20px 24px",
//             borderBottom: "1px solid #e5e7eb",
//             background: "linear-gradient(to right, #dbeafe, #bfdbfe)",
//           }}
//         >
//           <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1e40af" }}>📊 Order Life Cycle</h2>
//         </div>

//         {/* Filters */}
//         <div
//           style={{
//             padding: "20px 24px",
//             borderBottom: "1px solid #e5e7eb",
//             display: "flex",
//             alignItems: "center",
//             gap: 12,
//             flexWrap: "wrap",
//           }}
//         >
//           {renderDropdown("salesPerson", "Sales Person")}
//           {renderDropdown("customer", "Customer")}
//           {renderDropdown("contactPerson", "Contact Person")}
//           {renderDropdown("category", "Category")}
//           <button
//             onClick={handleResetAll}
//             style={{
//               padding: "10px 16px",
//               background: "#ef4444",
//               color: "#fff",
//               border: "none",
//               borderRadius: 8,
//               fontSize: 14,
//               fontWeight: 600,
//               cursor: "pointer",
//               minWidth: 100,
//               height: 40,
//             }}
//           >
//             Reset All
//           </button>
//         </div>

//         {/* Tabs */}
//         <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #e5e7eb", padding: "0 24px" }}>
//           {tabs.map((t) => (
//             <button
//               key={t.id}
//               onClick={() => setActiveTab(t.id)}
//               style={{
//                 padding: "12px 20px",
//                 border: "none",
//                 background: "transparent",
//                 color: activeTab === t.id ? "#2563eb" : "#6b7280",
//                 fontWeight: activeTab === t.id ? 700 : 500,
//                 fontSize: 14,
//                 borderBottom: activeTab === t.id ? "2px solid #2563eb" : "2px solid transparent",
//                 marginBottom: -2,
//                 cursor: "pointer",
//               }}
//             >
//               {t.label}
//             </button>
//           ))}
//         </div>

//         {/* Chart */}
//         <div style={{ padding: 24 }}>
//           {loading ? (
//             <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
//               <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
//               <div>Loading data...</div>
//             </div>
//           ) : chartData.length ? (
//             <>
//               <div style={{ maxHeight: 520, overflowY: "auto", paddingRight: 8, marginBottom: 20 }}>
//                 {chartData.map((m) => renderStackedBar(m))}
//               </div>

//               {/* Legend */}
//               <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
//                 <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
//                   Day Range Legend
//                 </div>
//                 <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
//                   {sortedLegend.map((r) => (
//                     <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                       <span
//                         style={{
//                           width: 18,
//                           height: 18,
//                           borderRadius: 4,
//                           backgroundColor: r.color,
//                           border: "1px solid rgba(0,0,0,0.1)",
//                         }}
//                       />
//                       <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{r.label}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </>
//           ) : (
//             <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
//               <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
//               <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No data available</div>
//               <div style={{ fontSize: 14 }}>Try adjusting filters or pick another tab.</div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OrderLifeCycle;


// pages/order-lifecycle/index.js
import React, { useState, useEffect, useRef } from "react";

const DEFAULT_RANGES = [
  { id: 1, min: 0, max: 3, label: "0-3 days", color: "#10b981" },
  { id: 2, min: 4, max: 5, label: "4-5 days", color: "#f59e0b" },
  { id: 3, min: 6, max: 8, label: "6-8 days", color: "#3b82f6" },
  { id: 4, min: 9, max: 10, label: "9-10 days", color: "#8b5cf6" },
  { id: 5, min: 11, max: 999, label: "10+ days", color: "#ef4444" },
];

const OrderLifeCycle = () => {
  const [activeTab, setActiveTab] = useState("po-to-grn");
  const [filters, setFilters] = useState({
    salesPerson: "",
    customer: "",
    contactPerson: "",
    category: "",
  });

  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [suggestions, setSuggestions] = useState({
    salesPerson: [],
    customer: [],
    contactPerson: [],
    category: [],
  });

  const [showSuggestions, setShowSuggestions] = useState({
    salesPerson: false,
    customer: false,
    contactPerson: false,
    category: false,
  });

  const dropdownRefs = {
    salesPerson: useRef(null),
    customer: useRef(null),
    contactPerson: useRef(null),
    category: useRef(null),
  };

  // Fetch unique values when tab changes
  useEffect(() => {
    fetchUniqueValues();
  }, [activeTab]);

  // Fetch chart data when filters or tab changes
  useEffect(() => {
    fetchChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(dropdownRefs).forEach((key) => {
        if (dropdownRefs[key].current && !dropdownRefs[key].current.contains(event.target)) {
          setShowSuggestions((prev) => ({ ...prev, [key]: false }));
        }
      });
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUniqueValues = async () => {
    try {
      const [salesRes, customersRes, contactsRes, categoriesRes] = await Promise.all([
        fetch(`/api/order-lifecycle/unique/salespersons?type=${activeTab}`),
        fetch(`/api/order-lifecycle/unique/customers?type=${activeTab}`),
        fetch(`/api/order-lifecycle/unique/contact-persons?type=${activeTab}`),
        fetch(`/api/order-lifecycle/unique/categories?type=${activeTab}`)
      ]);

      const [salesData, customersData, contactsData, categoriesData] = await Promise.all([
        salesRes.json(),
        customersRes.json(),
        contactsRes.json(),
        categoriesRes.json()
      ]);

      setSuggestions({
        salesPerson: salesData.data || [],
        customer: customersData.data || [],
        contactPerson: contactsData.data || [],
        category: categoriesData.data || [],
      });
    } catch (error) {
      console.error("Error fetching unique values:", error);
    }
  };

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const apiEndpoints = {
        "po-to-grn": "/api/order-lifecycle/po-to-grn",
        "grn-to-invoice": "/api/order-lifecycle/grn-to-invoice",
        "invoice-to-dispatch": "/api/order-lifecycle/invoice-to-dispatch",
      };

      const endpoint = apiEndpoints[activeTab];
      const params = new URLSearchParams();

      // Use names directly (no codes)
      if (filters.salesPerson) params.append("salesPerson", filters.salesPerson);
      if (filters.customer) params.append("customer", filters.customer);
      if (filters.contactPerson) params.append("contactPerson", filters.contactPerson);
      if (filters.category) params.append("category", filters.category);

      const res = await fetch(`${endpoint}?${params.toString()}`);
      const data = await res.json();

      console.log("API Response:", data);

      const aggregated = aggregateByMonth(data.data || []);
      setChartData(aggregated);
    } catch (err) {
      console.error("Error fetching chart data:", err);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const aggregateByMonth = (rows) => {
    const monthMap = {};
    rows.forEach((r) => {
      const key = r.Month;
      if (!monthMap[key]) {
        monthMap[key] = { 
          month: key, 
          year: r.Year, 
          monthNumber: r.MonthNumber, 
          buckets: {} 
        };
      }
      monthMap[key].buckets[r.Bucket] = {
        count: Number(r.TotalCount) || 0,
        percentage: Number(r.Percentage) || 0,
      };
    });
    
    return Object.values(monthMap).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.monthNumber - a.monthNumber;
    });
  };

  const handleInputChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setShowSuggestions((prev) => ({ ...prev, [field]: true }));
  };

  const handleSelectSuggestion = (field, item) => {
    let value = "";
    switch (field) {
      case "salesPerson":
        value = item.SlpName;
        break;
      case "customer":
        value = item.CardName; // Only name, no code
        break;
      case "contactPerson":
        value = item.ContactPerson;
        break;
      case "category":
        value = item.ItmsGrpNam;
        break;
    }
    setFilters((p) => ({ ...p, [field]: value }));
    setShowSuggestions((p) => ({ ...p, [field]: false }));
  };

  const handleClearFilter = (field) => {
    setFilters((p) => ({ ...p, [field]: "" }));
  };

  const handleResetAll = () => {
    setFilters({
      salesPerson: "",
      customer: "",
      contactPerson: "",
      category: "",
    });
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Reset filters when tab changes
    setFilters({
      salesPerson: "",
      customer: "",
      contactPerson: "",
      category: "",
    });
  };

  const tabs = [
    { id: "po-to-grn", label: "PO to GRN" },
    { id: "grn-to-invoice", label: "GRN to Invoice" },
    { id: "invoice-to-dispatch", label: "Invoice to Dispatch" },
  ];

  const formatMonthYear = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const renderStackedBar = (monthData) => {
    const total = Object.values(monthData.buckets).reduce((sum, b) => sum + (b.count || 0), 0);
    
    return (
      <div key={monthData.month} style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1f2937" }}>
            {formatMonthYear(monthData.month)}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>
            Total: {total}
          </span>
        </div>

        <div style={{ 
          height: 36, 
          borderRadius: 6, 
          display: "flex", 
          overflow: "hidden", 
          border: "1px solid #e5e7eb" 
        }}>
          {DEFAULT_RANGES.map((range, idx) => {
            const bucket = monthData.buckets[range.label];
            const percentage = bucket ? bucket.percentage : 0;
            if (!percentage) return null;

            return (
              <div
                key={idx}
                style={{
                  width: `${percentage}%`,
                  backgroundColor: range.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  opacity: 0.85,
                }}
                title={`${range.label}: ${bucket.count} orders (${percentage.toFixed(1)}%)`}
              >
                {percentage > 10 && `${percentage.toFixed(1)}%`}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDropdown = (field, placeholder) => (
    <div
      style={{ position: "relative", flex: 1, minWidth: 180 }}
      ref={dropdownRefs[field]}
    >
      <input
        type="text"
        value={filters[field]}
        onChange={(e) => handleInputChange(field, e.target.value)}
        onFocus={() => setShowSuggestions((p) => ({ ...p, [field]: true }))}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 32px 10px 12px",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          fontSize: 14,
          outline: "none",
        }}
      />

      {filters[field] && (
        <button
          onClick={() => handleClearFilter(field)}
          aria-label="Clear"
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 18,
            color: "#9ca3af",
            padding: 4,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}

      {showSuggestions[field] && suggestions[field]?.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            backgroundColor: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
            maxHeight: 220,
            overflowY: "auto",
            zIndex: 1000,
          }}
        >
          {suggestions[field].map((item, idx) => (
            <div
              key={idx}
              onMouseDown={() => handleSelectSuggestion(field, item)}
              style={{
                padding: "10px 12px",
                cursor: "pointer",
                fontSize: 14,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              {field === "customer" && (
                <div style={{ fontWeight: 600, color: "#111827" }}>{item.CardName}</div>
              )}
              {field === "salesPerson" && item.SlpName}
              {field === "contactPerson" && item.ContactPerson}
              {field === "category" && item.ItmsGrpNam}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const sortedLegend = [...DEFAULT_RANGES].sort((a, b) => a.min - b.min);

  return (
    <div style={{ padding: 24, minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e5e7eb",
            background: "linear-gradient(to right, #dbeafe, #bfdbfe)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1e40af" }}>
            📊 Order Life Cycle
          </h2>
        </div>

        {/* Filters */}
        <div style={{ 
          padding: "20px 24px", 
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap"
        }}>
          {renderDropdown("salesPerson", "Sales Person")}
          {renderDropdown("customer", "Customer")}
          {renderDropdown("contactPerson", "Contact Person")}
          {renderDropdown("category", "Category")}

          <button
            onClick={handleResetAll}
            style={{
              padding: "10px 16px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              minWidth: 100,
              flexShrink: 0,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            Reset All
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            borderBottom: "2px solid #e5e7eb",
            padding: "0 24px",
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              style={{
                padding: "12px 20px",
                border: "none",
                background: "transparent",
                color: activeTab === t.id ? "#2563eb" : "#6b7280",
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: 14,
                borderBottom: activeTab === t.id ? "2px solid #2563eb" : "2px solid transparent",
                marginBottom: -2,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div style={{ padding: 24 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>⏳ Loading data...</div>
          ) : chartData.length ? (
            <>
              <div style={{ maxHeight: 520, overflowY: "auto", paddingRight: 8, marginBottom: 20 }}>
                {chartData.map((m) => renderStackedBar(m))}
              </div>

              {/* Legend */}
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
                  Day Range Legend
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {sortedLegend.map((r) => (
                    <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          backgroundColor: r.color,
                          border: "1px solid rgba(0,0,0,0.1)",
                        }}
                      />
                      <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No data available</div>
              <div style={{ fontSize: 14 }}>Try adjusting filters or pick another tab.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderLifeCycle;