// // components/order-to-invoice/OrderToInvoiceChart.js
// import React, { useState, useEffect, useRef } from "react";
// import { Bar } from "react-chartjs-2";
// import Select from 'react-select';
// import { formatDate } from "utils/formatDate";
// import downloadExcel from "utils/exporttoexcel";
// import { formatCurrency } from "utils/formatCurrency";
// import OrderDetailsModal from "../modal/OrderDetailsModalArray";
// import useDailyReportData from "hooks/useDailyReportData";
// import { customSelectStyles } from "../daily-report/ChartConfig";

// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// );

// const OrderToInvoiceChart = () => {
//   const [filters, setFilters] = useState({
//     salesPerson: null,
//     contactPerson: null,
//     category: null,
//     product: null,
//     customer: null,
//   });
//   const [modalData, setModalData] = useState(null);
//   const [modalTitle, setModalTitle] = useState("");
//   const [processedChartData, setProcessedChartData] = useState([]);
//   const [summaryTableData, setSummaryTableData] = useState({});
  
//   // Range filter states
//   const [showRangeDropdown, setShowRangeDropdown] = useState(false);
//   const [customRanges, setCustomRanges] = useState([
//     { id: 1, min: 0, max: 3, color: '#28a745', bgColor: 'rgba(40, 167, 69, 0.7)' },
//     { id: 2, min: 4, max: 5, color: '#fd7e14', bgColor: 'rgba(253, 126, 20, 0.7)' },
//     { id: 3, min: 6, max: 8, color: '#007bff', bgColor: 'rgba(0, 123, 255, 0.7)' },
//     { id: 4, min: 9, max: 10, color: '#6f42c1', bgColor: 'rgba(111, 66, 193, 0.7)' },
//     { id: 5, min: 10, max: null, color: '#dc3545', bgColor: 'rgba(220, 53, 69, 0.7)' }
//   ]);
//   const [tempRanges, setTempRanges] = useState([...customRanges]);
//   const [showApplyButton, setShowApplyButton] = useState(false);

//   const chartRef = useRef(null);
//   const tableScrollRef = useRef(null);
//   const rangeDropdownRef = useRef(null);

//   const {
//     rawData,
//     loading,
//     error,
//     getSelectOptions,
//     applyFilters
//   } = useDailyReportData();

//   // Generate day ranges based on customRanges
//   const generateDayRanges = (ranges) => {
//     return ranges.map((range, index) => ({
//       label: range.max === null ? `>${range.min} Days` : `${range.min}–${range.max} Days`,
//       min: range.min,
//       max: range.max === null ? Infinity : range.max,
//       color: range.color,
//       bgColor: range.bgColor
//     }));
//   };

//   const [dayRanges, setDayRanges] = useState(generateDayRanges(customRanges));

//   // Calculate days between SO_Date and Invoice_Date
//   const calculateDaysDifference = (soDate, invoiceDate) => {
//     if (!soDate || !invoiceDate || invoiceDate === 'N/A') return null;
    
//     const so = new Date(soDate);
//     const invoice = new Date(invoiceDate);
//     const diffTime = invoice - so;
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
//     return diffDays >= 0 ? diffDays : null;
//   };

//   // Get range category for given days
//   const getRangeCategory = (days) => {
//     if (days === null || days < 0) return null;
    
//     for (let range of dayRanges) {
//       if (days >= range.min && days <= range.max) {
//         return range;
//       }
//     }
//     return dayRanges[dayRanges.length - 1]; // Last range (>X Days)
//   };



//     // Fixed handleRangeInputChange function
// const handleRangeInputChange = (rangeId, field, value) => {
//   // Allow empty values for editing
//   if (value === '') {
//     setTempRanges(prev => prev.map(range => 
//       range.id === rangeId 
//         ? { ...range, [field]: '' }
//         : range
//     ));
//     setShowApplyButton(true);
//     return;
//   }

//   const numValue = parseInt(value);
  
//   // Allow any positive number or zero
//   if (isNaN(numValue) || numValue < 0) {
//     return;
//   }

//   setTempRanges(prev => {
//     const newRanges = prev.map(range => {
//       if (range.id === rangeId) {
//         const updated = { ...range };
//         if (field === 'min') {
//           updated.min = numValue;
//         } else if (field === 'max') {
//           updated.max = numValue;
//         }
//         return updated;
//       }
//       return range;
//     });

//     // More lenient validation - only check for basic consistency
//     let isValid = true;
//     for (let i = 0; i < newRanges.length; i++) {
//       const current = newRanges[i];
      
//       // Skip validation if values are empty strings (during editing)
//       if (current.min === '' || current.max === '') continue;
      
//       // Check that min is not greater than max (for ranges that have max)
//       if (current.max !== null && current.min >= current.max) {
//         isValid = false;
//         break;
//       }
//     }

//     // Always allow the change during editing, show apply button
//     setShowApplyButton(true);
//     return newRanges;
//   });
// };


// // Updated handleApplyRanges function
// const handleApplyRanges = () => {
//   // Validate before applying
//   const validatedRanges = tempRanges.map(range => ({
//     ...range,
//     min: range.min === '' ? 0 : parseInt(range.min),
//     max: range.max === '' ? null : parseInt(range.max)
//   }));

//   // Final validation
//   let isValid = true;
//   let errorMessage = '';

//   for (let i = 0; i < validatedRanges.length - 1; i++) {
//     const current = validatedRanges[i];
//     const next = validatedRanges[i + 1];
    
//     // Check min < max for current range
//     if (current.max !== null && current.min >= current.max) {
//       isValid = false;
//       errorMessage = `Range ${i + 1}: Minimum must be less than maximum`;
//       break;
//     }
    
//     // Check that ranges don't overlap
//     if (current.max !== null && current.max >= next.min) {
//       isValid = false;
//       errorMessage = `Range ${i + 1} and ${i + 2}: Ranges cannot overlap`;
//       break;
//     }
//   }

//   if (!isValid) {
//     alert(errorMessage);
//     return;
//   }

//   // Update ranges first
//   setCustomRanges([...validatedRanges]);
//   const newDayRanges = generateDayRanges(validatedRanges);
//   setDayRanges(newDayRanges);
  
//   // Clear processed data to trigger re-processing with new ranges
//   setProcessedChartData([]);
//   setSummaryTableData({});
  
//   setShowApplyButton(false);
//   setShowRangeDropdown(false);
// };

//   // Reset ranges to default
//   const handleResetRanges = () => {
//     const defaultRanges = [
//       { id: 1, min: 0, max: 3, color: '#28a745', bgColor: 'rgba(40, 167, 69, 0.7)' },
//       { id: 2, min: 4, max: 5, color: '#fd7e14', bgColor: 'rgba(253, 126, 20, 0.7)' },
//       { id: 3, min: 6, max: 8, color: '#007bff', bgColor: 'rgba(0, 123, 255, 0.7)' },
//       { id: 4, min: 9, max: 10, color: '#6f42c1', bgColor: 'rgba(111, 66, 193, 0.7)' },
//       { id: 5, min: 10, max: null, color: '#dc3545', bgColor: 'rgba(220, 53, 69, 0.7)' }
//     ];
//     setTempRanges(defaultRanges);
//     setCustomRanges(defaultRanges);
//     setDayRanges(generateDayRanges(defaultRanges));
//     setShowApplyButton(false);
//   };

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (rangeDropdownRef.current && !rangeDropdownRef.current.contains(event.target)) {
//         setShowRangeDropdown(false);
//         setShowApplyButton(false);
//         setTempRanges([...customRanges]); // Reset temp ranges
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, [customRanges]);


// // Fixed processOrderToInvoiceData function
// const processOrderToInvoiceData = (data, filters) => {
//   // Apply filters
//   const filteredData = applyFilters(data, filters);

//   // Only include records that have both SO_Date and Invoice_Date
//   const validRecords = filteredData.filter(record => 
//     record.SO_Date && 
//     record.Invoice_Date && 
//     record.Invoice_Date !== 'N/A'
//   );

//   // Calculate days for each record and add range info
//   const recordsWithDays = validRecords.map(record => {
//     const days = calculateDaysDifference(record.SO_Date, record.Invoice_Date);
//     const rangeCategory = getRangeCategory(days);
    
//     return {
//       ...record,
//       daysDifference: days,
//       rangeCategory: rangeCategory
//     };
//   }).filter(record => record.rangeCategory !== null);

//   // Group by month and range
//   const monthlyData = {};
//   const summaryData = {};

//   recordsWithDays.forEach(record => {
//     const monthKey = `${record.Month}-${record.Year}`;
//     const rangeLabel = record.rangeCategory.label;

//     // Initialize month data if it doesn't exist
//     if (!monthlyData[monthKey]) {
//       monthlyData[monthKey] = {
//         monthName: record.Month,
//         year: record.Year,
//         monthNumber: record.MonthNumber,
//         ranges: {}
//       };
      
//       // Initialize all ranges for this month using current dayRanges
//       dayRanges.forEach(range => {
//         monthlyData[monthKey].ranges[range.label] = {
//           count: 0,
//           records: [],
//           color: range.color,
//           bgColor: range.bgColor
//         };
//       });
//     }

//     // Initialize summary data if it doesn't exist
//     if (!summaryData[monthKey]) {
//       summaryData[monthKey] = {};
//       dayRanges.forEach(range => {
//         summaryData[monthKey][range.label] = 0;
//       });
//     }

//     // Check if the range exists in monthlyData (it should after initialization above)
//     // But add extra safety check
//     if (!monthlyData[monthKey].ranges[rangeLabel]) {
//       monthlyData[monthKey].ranges[rangeLabel] = {
//         count: 0,
//         records: [],
//         color: record.rangeCategory.color,
//         bgColor: record.rangeCategory.bgColor
//       };
//     }

//     // Add record to the range
//     monthlyData[monthKey].ranges[rangeLabel].count++;
//     monthlyData[monthKey].ranges[rangeLabel].records.push(record);
    
//     // Initialize summary data for this range if it doesn't exist
//     if (!summaryData[monthKey][rangeLabel]) {
//       summaryData[monthKey][rangeLabel] = 0;
//     }
//     summaryData[monthKey][rangeLabel]++;
//   });

//   // Ensure all months have all ranges initialized (even with 0 counts)
//   Object.keys(monthlyData).forEach(monthKey => {
//     dayRanges.forEach(range => {
//       if (!monthlyData[monthKey].ranges[range.label]) {
//         monthlyData[monthKey].ranges[range.label] = {
//           count: 0,
//           records: [],
//           color: range.color,
//           bgColor: range.bgColor
//         };
//       }
//       if (!summaryData[monthKey][range.label]) {
//         summaryData[monthKey][range.label] = 0;
//       }
//     });
//   });

//   // Convert to array and sort by year/month
//   const chartData = Object.values(monthlyData).sort((a, b) => {
//     if (a.year !== b.year) return a.year - b.year;
//     return a.monthNumber - b.monthNumber;
//   });

//   setProcessedChartData(chartData);
//   setSummaryTableData(summaryData);
// };
// const createChartData = () => {
//   if (!processedChartData.length || !dayRanges.length) {
//     return {
//       labels: [],
//       datasets: []
//     };
//   }

//   return {
//     labels: processedChartData.map(item => `${item.monthName}-${item.year}`),
//     datasets: dayRanges.map(range => ({
//       label: range.label,
//       data: processedChartData.map(item => {
//         // Safety check: ensure the range exists in the item
//         return item.ranges && item.ranges[range.label] 
//           ? item.ranges[range.label].count 
//           : 0;
//       }),
//       backgroundColor: range.bgColor,
//       borderColor: range.color,
//       borderWidth: 1,
//     }))
//   };
// };

//   useEffect(() => {
//     if (rawData.length > 0) {
//       processOrderToInvoiceData(rawData, filters);
//     }
//   }, [rawData, filters, dayRanges]);

//   // Scroll table to right on data change
//   useEffect(() => {
//     if (tableScrollRef.current && processedChartData.length > 0) {
//       const scrollContainer = tableScrollRef.current;
//       // Small delay to ensure table is rendered
//       setTimeout(() => {
//         scrollContainer.scrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
//       }, 100);
//     }
//   }, [processedChartData]);

//   const handleBarClick = (monthData, rangeLabel) => {
//     const records = monthData.ranges[rangeLabel].records;
//     setModalData(records);
//     setModalTitle(`${rangeLabel} - ${monthData.monthName} ${monthData.year}`);
//   };

//   const handleFilterChange = (filterType, selectedOption) => {
//     setFilters(prev => ({
//       ...prev,
//       [filterType]: selectedOption ? selectedOption.value : null
//     }));
//   };

//   const clearAllFilters = () => {
//     setFilters({
//       salesPerson: null,
//       contactPerson: null,
//       category: null,
//       product: null,
//       customer: null,
//     });
//   };

//   const handleExportAllData = () => {
//     const exportData = applyFilters(rawData, filters);
//     downloadExcel(exportData, "Order_to_Invoice_Analysis");
//   };

//   // Export summary table to Excel
//   const handleExportSummaryTable = () => {
//     // Prepare data for export
//     const exportData = [];

//     // Add data rows for each range (no header row to avoid duplication)
//     dayRanges.forEach(range => {
//       const row = {
//         'Range / Month': range.label,
//         ...processedChartData.reduce((acc, month) => {
//           acc[`${month.monthName}-${month.year}`] = month.ranges[range.label].count;
//           return acc;
//         }, {})
//       };
//       exportData.push(row);
//     });

//     // Add total row
//     const totalRow = {
//       'Range / Month': 'Total',
//       ...processedChartData.reduce((acc, month) => {
//         const total = dayRanges.reduce((sum, range) => 
//           sum + month.ranges[range.label].count, 0
//         );
//         acc[`${month.monthName}-${month.year}`] = total;
//         return acc;
//       }, {})
//     };
//     exportData.push(totalRow);

//     downloadExcel(exportData, "Order_to_Invoice_Summary_Table");
//   };

//   const activeFiltersCount = Object.values(filters).filter(Boolean).length;

// //   // Create chart data
// //   const chartData = {
// //     labels: processedChartData.map(item => `${item.monthName}-${item.year}`),
// //     datasets: dayRanges.map(range => ({
// //       label: range.label,
// //       data: processedChartData.map(item => item.ranges[range.label].count),
// //       backgroundColor: range.bgColor,
// //       borderColor: range.color,
// //       borderWidth: 1,
// //     }))
// //   };

//     const chartData = createChartData();

//   // Create chart options
//   const chartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       datalabels: {
//         display: false,
//       },
//       legend: {
//         position: 'top',
//       },
//       tooltip: {
//         mode: 'index',
//         intersect: false,
//         callbacks: {
//           title: (context) => {
//             const monthData = processedChartData[context[0].dataIndex];
//             return `${monthData.monthName} ${monthData.year}`;
//           },
//           label: (context) => {
//             const rangeLabel = context.dataset.label;
//             const count = context.parsed.y;
//             return `${rangeLabel}: ${count} orders`;
//           }
//         }
//       }
//     },
//     onClick: (event, elements) => {
//       if (elements.length > 0) {
//         const element = elements[0];
//         const monthData = processedChartData[element.index];
//         const rangeLabel = dayRanges[element.datasetIndex].label;
//         handleBarClick(monthData, rangeLabel);
//       }
//     },
//     onHover: (event, elements) => {
//       const target = event.native?.target || event.target;
//       if (target) {
//         if (elements.length > 0) {
//           target.style.cursor = 'pointer';
//         } else {
//           target.style.cursor = 'default';
//         }
//       }
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         stacked: false,
//         title: {
//           display: true,
//           text: 'Number of Orders'
//         }
//       },
//       x: {
//         title: {
//           display: true,
//           text: 'Month'
//         }
//       }
//     }
//   };

//   return (
//     <div className="card shadow-sm border-0 mb-4">
//       <div className="card-header bg-white py-3">
//         <div className="d-flex flex-column">
//           <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
//             <h4 className="mb-3 mb-md-0" style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}>
//               Order to Invoice Analysis
//             </h4>
            
//             <div className="d-flex gap-2">              
//               {/* Excel Export Button */}
//               <button 
//                 className="btn btn-success btn-sm d-flex align-items-center"
//                 onClick={handleExportAllData}
//                 style={{ borderRadius: "8px" }}
//               >
//                 <i className="fas fa-file-excel me-1"></i>
//                 Export Data
//               </button>

//               {/* Clear filters button */}
//               {activeFiltersCount > 0 && (
//                 <button 
//                   className="btn btn-outline-secondary btn-sm d-flex align-items-center"
//                   onClick={clearAllFilters}
//                   style={{ borderRadius: "8px" }}
//                 >
//                   <i className="fas fa-times me-1"></i>
//                   Clear Filters ({activeFiltersCount})
//                 </button>
//               )}
//             </div>
//           </div>
          
//           {/* Filters Section */}
//           <div className="row g-3">
//             {/* Range Filter */}
//             <div className="col-12 col-sm-6 col-md-4 col-lg-2">
//               <div className="filter-group position-relative" ref={rangeDropdownRef}>
//                 <label className="form-label text-muted small fw-medium mb-1">Day Ranges</label>
//                 <div 
//                   className="form-control d-flex justify-content-between align-items-center"
//                   style={{ 
//                     cursor: 'pointer',
//                     borderRadius: '8px',
//                     backgroundColor: '#f8f9fa',
//                     border: '2px solid #e9ecef',
//                     fontSize: '14px',
//                     fontWeight: '500'
//                   }}
//                   onClick={() => setShowRangeDropdown(!showRangeDropdown)}
//                 >
//                   <span style={{ color: '#495057' }}>
//                     <i className="fas fa-calendar-alt me-2"></i>
//                     Configure Ranges
//                   </span>
//                   <i className={`fas fa-chevron-${showRangeDropdown ? 'up' : 'down'}`}></i>
//                 </div>

//                 {showRangeDropdown && (
//                   <div 
//                     className="position-absolute bg-white border rounded shadow-lg p-3"
//                     style={{ 
//                       top: '100%', 
//                       left: 0, 
//                       right: 0, 
//                       zIndex: 1000,
//                       marginTop: '4px',
//                       minWidth: '300px'
//                     }}
//                   >
//                     <div className="d-flex justify-content-between align-items-center mb-3">
//                       <h6 className="mb-0" style={{ fontWeight: 600, color: '#212529' }}>
//                         Customize Day Ranges
//                       </h6>
//                       <button 
//                         className="btn btn-outline-secondary btn-sm"
//                         onClick={handleResetRanges}
//                         style={{ fontSize: '12px' }}
//                       >
//                         Reset
//                       </button>
//                     </div>

//                     {tempRanges.map((range, index) => (
//                       <div key={range.id} className="mb-2">
//                         <div className="d-flex align-items-center gap-2">
//                           <span className="small fw-medium" style={{ minWidth: '60px', fontSize: '12px' }}>
//                             Range {index + 1}:
//                           </span>
//                           <input
//                             type="number"
//                             className="form-control form-control-sm"
//                             style={{ width: '60px', fontSize: '12px' }}
//                             value={range.min}
//                             onChange={(e) => handleRangeInputChange(range.id, 'min', e.target.value)}
//                             min="0"
//                           />
//                           <span className="small">to</span>
//                           {range.max === null ? (
//                             <span className="form-control form-control-sm d-flex align-items-center justify-content-center"
//                                   style={{ width: '60px', fontSize: '12px', backgroundColor: '#f8f9fa' }}>
//                               ∞
//                             </span>
//                           ) : (
//                             <input
//                               type="number"
//                               className="form-control form-control-sm"
//                               style={{ width: '60px', fontSize: '12px' }}
//                               value={range.max}
//                               onChange={(e) => handleRangeInputChange(range.id, 'max', e.target.value)}
//                               min={range.min + 1}
//                             />
//                           )}
//                           <span className="small">days</span>
//                         </div>
//                       </div>
//                     ))}

//                     {showApplyButton && (
//                       <div className="mt-3 pt-2 border-top">
//                         <button 
//                           className="btn btn-primary btn-sm w-100"
//                           onClick={handleApplyRanges}
//                           style={{ fontSize: '12px' }}
//                         >
//                           Apply Ranges
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="col-12 col-sm-6 col-md-4 col-lg-2">
//               <div className="filter-group">
//                 <label className="form-label text-muted small fw-medium mb-1">Sales Person</label>
//                 <Select
//                   options={getSelectOptions('Sales_Person')}
//                   value={filters.salesPerson ? { value: filters.salesPerson, label: filters.salesPerson } : null}
//                   onChange={(selectedOption) => handleFilterChange('salesPerson', selectedOption)}
//                   placeholder="All Sales Person"
//                   isClearable
//                   isSearchable
//                   styles={customSelectStyles}
//                 />
//               </div>
//             </div>
            
//             <div className="col-12 col-sm-6 col-md-4 col-lg-2">
//               <div className="filter-group">
//                 <label className="form-label text-muted small fw-medium mb-1">Contact Person</label>
//                 <Select
//                   options={getSelectOptions('Contact_Person')}
//                   value={filters.contactPerson ? { value: filters.contactPerson, label: filters.contactPerson } : null}
//                   onChange={(selectedOption) => handleFilterChange('contactPerson', selectedOption)}
//                   placeholder="All Contact Person"
//                   isClearable
//                   isSearchable
//                   styles={customSelectStyles}
//                 />
//               </div>
//             </div>
            
//             <div className="col-12 col-sm-6 col-md-4 col-lg-2">
//               <div className="filter-group">
//                 <label className="form-label text-muted small fw-medium mb-1">Category</label>
//                 <Select
//                   options={getSelectOptions('Category')}
//                   value={filters.category ? { value: filters.category, label: filters.category } : null}
//                   onChange={(selectedOption) => handleFilterChange('category', selectedOption)}
//                   placeholder="All Category"
//                   isClearable
//                   isSearchable
//                   styles={customSelectStyles}
//                 />
//               </div>
//             </div>
            
//             <div className="col-12 col-sm-6 col-md-4 col-lg-2">
//               <div className="filter-group">
//                 <label className="form-label text-muted small fw-medium mb-1">Product</label>
//                 <Select
//                   options={getSelectOptions('Item_No')}
//                   value={filters.product ? { value: filters.product, label: filters.product } : null}
//                   onChange={(selectedOption) => handleFilterChange('product', selectedOption)}
//                   placeholder="All Product"
//                   isClearable
//                   isSearchable
//                   styles={customSelectStyles}
//                 />
//               </div>
//             </div>
            
//             <div className="col-12 col-sm-6 col-md-4 col-lg-2">
//               <div className="filter-group">
//                 <label className="form-label text-muted small fw-medium mb-1">Customer</label>
//                 <Select
//                   options={getSelectOptions('Customer')}
//                   value={filters.customer ? { value: filters.customer, label: filters.customer } : null}
//                   onChange={(selectedOption) => handleFilterChange('customer', selectedOption)}
//                   placeholder="All Customer"
//                   isClearable
//                   isSearchable
//                   styles={customSelectStyles}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="card-body">
//         {error && <p className="text-danger mb-3">Error: {error}</p>}

//         {loading ? (
//           <div className="d-flex justify-content-center align-items-center" style={{ height: "500px" }}>
//             <div className="spinner-border me-2" role="status">
//               <span className="visually-hidden">Loading...</span>
//             </div>
//             <span>Loading chart data...</span>
//           </div>
//         ) : processedChartData.length ? (
//           <>
//             <div className="chart-container mb-4" style={{ height: "500px", width: "100%" }}>
//               <Bar
//                 ref={chartRef}
//                 data={chartData}
//                 options={chartOptions}
//               />
//             </div>

//             {/* Summary Table */}
//             <div className="mt-4">
//               <div className="d-flex justify-content-between align-items-center mb-3">
//                 <h5 className="mb-0" style={{ fontWeight: 600, color: "#212529" }}>
//                   Order to Invoice Summary Table
//                 </h5>
//                 <button 
//                   className="btn btn-primary btn-sm d-flex align-items-center"
//                   onClick={handleExportSummaryTable}
//                   style={{ borderRadius: "8px" }}
//                 >
//                   <i className="fas fa-file-excel me-1"></i>
//                   Export Summary Table
//                 </button>
//               </div>
              
//               <div className="position-relative">
//                 <div 
//                   className="table-responsive" 
//                   ref={tableScrollRef}
//                   style={{ 
//                     maxHeight: '400px',
//                     overflowX: 'auto',
//                     overflowY: 'auto'
//                   }}
//                 >
//                   <table className="table table-bordered table-striped table-sm">
//                     <thead className="table-dark position-sticky" style={{ top: 0, zIndex: 10 }}>
//                       <tr>
//                         <th 
//                           style={{ 
//                             minWidth: '120px',
//                             position: 'sticky',
//                             left: 0,
//                             backgroundColor: '#212529',
//                             color: '#ffffff',
//                             zIndex: 11
//                           }}
//                         >
//                           Range / Month
//                         </th>
//                         {processedChartData.map(month => (
//                           <th key={`${month.monthName}-${month.year}`} 
//                               className="text-center" 
//                               style={{ minWidth: '100px', color: '#ffffff' }}>
//                             {month.monthName}-{month.year}
//                           </th>
//                         ))}
//                       </tr>
//                     </thead>
//                     {/* <tbody>
//                       {dayRanges.map(range => (
//                         <tr key={range.label}>
//                           <td 
//                             className="fw-bold"
//                             style={{ 
//                               position: 'sticky',
//                               left: 0,
//                               backgroundColor: '#fff',
//                               zIndex: 5,
//                               borderRight: '2px solid #dee2e6'
//                             }}
//                           >
//                             {range.label}
//                           </td>
//                           {processedChartData.map(month => (
//                             <td 
//                               key={`${month.monthName}-${month.year}`}
//                               className="text-center"
//                               style={{ 
//                                 cursor: month.ranges[range.label].count > 0 ? 'pointer' : 'default'
//                               }}
//                               onClick={() => {
//                                 if (month.ranges[range.label].count > 0) {
//                                   handleBarClick(month, range.label);
//                                 }
//                               }}
//                             >
//                               {month.ranges[range.label].count}
//                             </td>
//                           ))}
//                         </tr>
//                       ))}
//                     </tbody>
//                     <tfoot className="table-secondary">
//                       <tr>
//                         <th 
//                           style={{ 
//                             position: 'sticky',
//                             left: 0,
//                             backgroundColor: '#e9ecef',
//                             zIndex: 5,
//                             borderRight: '2px solid #dee2e6'
//                           }}
//                         >
//                           Total
//                         </th>
//                         {processedChartData.map(month => {
//                           const total = dayRanges.reduce((sum, range) => 
//                             sum + month.ranges[range.label].count, 0
//                           );
//                           return (
//                             <th key={`total-${month.monthName}-${month.year}`} className="text-center">
//                               {total}
//                             </th>
//                           );
//                         })}
//                       </tr>
//                     </tfoot> */}
//                     <tbody>
//                     {dayRanges.map(range => (
//                         <tr key={range.label}>
//                         <td 
//                             className="fw-bold"
//                             style={{ 
//                             position: 'sticky',
//                             left: 0,
//                             backgroundColor: '#fff',
//                             zIndex: 5,
//                             borderRight: '2px solid #dee2e6'
//                             }}
//                         >
//                             {range.label}
//                         </td>
//                         {processedChartData.map(month => {
//                             // Safety check: ensure the range exists in the month data
//                             const rangeData = month.ranges && month.ranges[range.label] 
//                             ? month.ranges[range.label] 
//                             : { count: 0, records: [] };
                            
//                             return (
//                             <td 
//                                 key={`${month.monthName}-${month.year}`}
//                                 className="text-center"
//                                 style={{ 
//                                 cursor: rangeData.count > 0 ? 'pointer' : 'default'
//                                 }}
//                                 onClick={() => {
//                                 if (rangeData.count > 0) {
//                                     handleBarClick(month, range.label);
//                                 }
//                                 }}
//                             >
//                                 {rangeData.count}
//                             </td>
//                             );
//                         })}
//                         </tr>
//                     ))}
//                     </tbody>
//                     <tfoot className="table-secondary">
//                     <tr>
//                         <th 
//                         style={{ 
//                             position: 'sticky',
//                             left: 0,
//                             backgroundColor: '#e9ecef',
//                             zIndex: 5,
//                             borderRight: '2px solid #dee2e6'
//                         }}
//                         >
//                         Total
//                         </th>
//                         {processedChartData.map(month => {
//                         // Safety check for total calculation
//                         const total = dayRanges.reduce((sum, range) => {
//                             const rangeData = month.ranges && month.ranges[range.label] 
//                             ? month.ranges[range.label] 
//                             : { count: 0 };
//                             return sum + rangeData.count;
//                         }, 0);
                        
//                         return (
//                             <th key={`total-${month.monthName}-${month.year}`} className="text-center">
//                             {total}
//                             </th>
//                         );
//                         })}
//                     </tr>
//                     </tfoot>
//                   </table>
//                 </div>
//               </div>
//             </div>
//           </>
//         ) : (
//           <p className="text-center mt-4">No data available with valid SO Date and Invoice Date.</p>
//         )}
//       </div>

//       {/* Modal for displaying order details */}
//       {modalData && (
//         <OrderDetailsModal
//           orderData={modalData}
//           onClose={() => setModalData(null)}
//           title={modalTitle}
//         />
//       )}
//     </div>
//   );
// };

// export default OrderToInvoiceChart;

// components/order-to-invoice/OrderToInvoiceChart.js
import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import Select from 'react-select';
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";
import { formatCurrency } from "utils/formatCurrency";
import OrderDetailsModal from "../../modal/OrderDetailsModalArray";
import useDailyReportData from "hooks/useDailyReportData";
import { customSelectStyles } from "../../daily-report/ChartConfig";
import RangeConfiguration from "./RangeConfiguration";
import SummaryTable from "./SummaryTable";

import {
  DEFAULT_RANGES,
  generateDayRanges,
  processOrderToInvoiceData,
  createChartData,
  createChartOptions
} from "utils/orderInvoiceUtils";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const OrderToInvoiceChart = () => {
  const [filters, setFilters] = useState({
    salesPerson: null,
    contactPerson: null,
    category: null,
    product: null,
    customer: null,
  });
  const [modalData, setModalData] = useState(null);
  const [modalTitle, setModalTitle] = useState("");
  const [processedChartData, setProcessedChartData] = useState([]);
  const [summaryTableData, setSummaryTableData] = useState({});
  
  // Range filter states
  const [customRanges, setCustomRanges] = useState([...DEFAULT_RANGES]);
  const [dayRanges, setDayRanges] = useState(generateDayRanges(DEFAULT_RANGES));
  const [isProcessing, setIsProcessing] = useState(false);

  const chartRef = useRef(null);

  const {
    rawData,
    loading,
    error,
    getSelectOptions,
    applyFilters
  } = useDailyReportData();

  // Handle range changes
  const handleRangesChange = (newRanges) => {
    setCustomRanges([...newRanges]);
    const newDayRanges = generateDayRanges(newRanges);
    setDayRanges(newDayRanges);
  };

  // Handle apply ranges
  const handleApplyRanges = (validatedRanges) => {
    setCustomRanges([...validatedRanges]);
    const newDayRanges = generateDayRanges(validatedRanges);
    setDayRanges(newDayRanges);
    
    // Clear processed data to trigger re-processing with new ranges
    setProcessedChartData([]);
    setSummaryTableData({});
  };

  // Process data when raw data, filters, or day ranges change
  useEffect(() => {
    if (rawData.length > 0) {
      setIsProcessing(true);
      try {
        const { chartData, summaryData } = processOrderToInvoiceData(
          rawData, 
          filters, 
          dayRanges, 
          applyFilters
        );
        setProcessedChartData(chartData);
        setSummaryTableData(summaryData);
      } catch (err) {
        console.error("Error processing data:", err);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [rawData, filters, dayRanges]);

  const handleBarClick = (monthData, rangeLabel) => {
    const records = monthData.ranges[rangeLabel]?.records || [];
    setModalData(records);
    setModalTitle(`${rangeLabel} - ${monthData.monthName} ${monthData.year}`);
  };

  const handleFilterChange = (filterType, selectedOption) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: selectedOption ? selectedOption.value : null
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      salesPerson: null,
      contactPerson: null,
      category: null,
      product: null,
      customer: null,
    });
  };

  const handleExportAllData = () => {
    const exportData = applyFilters(rawData, filters);
    downloadExcel(exportData, "Order_to_Invoice_Analysis");
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  // Create chart data and options
  const chartData = createChartData(processedChartData, dayRanges);
  const chartOptions = createChartOptions(processedChartData, dayRanges, handleBarClick);

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white py-3">
        <div className="d-flex flex-column">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
            <h4 className="mb-3 mb-md-0" style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}>
              Order to Invoice Analysis
            </h4>
            
            <div className="d-flex gap-2">              
              <button 
                className="btn btn-success btn-sm d-flex align-items-center"
                onClick={handleExportAllData}
                style={{ borderRadius: "8px" }}
              >
                <i className="fas fa-file-excel me-1"></i>
                Export Data
              </button>

              {activeFiltersCount > 0 && (
                <button 
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                  onClick={clearAllFilters}
                  style={{ borderRadius: "8px" }}
                >
                  <i className="fas fa-times me-1"></i>
                  Clear Filters ({activeFiltersCount})
                </button>
              )}
            </div>
          </div>
          
          {/* Filters Section */}
          <div className="row g-3">
            {/* Range Filter */}
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <RangeConfiguration 
                customRanges={customRanges}
                onRangesChange={handleRangesChange}
                onApplyRanges={handleApplyRanges}
              />
            </div>

            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <div className="filter-group">
                <label className="form-label text-muted small fw-medium mb-1">Sales Person</label>
                <Select
                  options={getSelectOptions('Sales_Person')}
                  value={filters.salesPerson ? { value: filters.salesPerson, label: filters.salesPerson } : null}
                  onChange={(selectedOption) => handleFilterChange('salesPerson', selectedOption)}
                  placeholder="All Sales Person"
                  isClearable
                  isSearchable
                  styles={customSelectStyles}
                />
              </div>
            </div>
            
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <div className="filter-group">
                <label className="form-label text-muted small fw-medium mb-1">Contact Person</label>
                <Select
                  options={getSelectOptions('Contact_Person')}
                  value={filters.contactPerson ? { value: filters.contactPerson, label: filters.contactPerson } : null}
                  onChange={(selectedOption) => handleFilterChange('contactPerson', selectedOption)}
                  placeholder="All Contact Person"
                  isClearable
                  isSearchable
                  styles={customSelectStyles}
                />
              </div>
            </div>
            
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <div className="filter-group">
                <label className="form-label text-muted small fw-medium mb-1">Category</label>
                <Select
                  options={getSelectOptions('Category')}
                  value={filters.category ? { value: filters.category, label: filters.category } : null}
                  onChange={(selectedOption) => handleFilterChange('category', selectedOption)}
                  placeholder="All Category"
                  isClearable
                  isSearchable
                  styles={customSelectStyles}
                />
              </div>
            </div>
            
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <div className="filter-group">
                <label className="form-label text-muted small fw-medium mb-1">Product</label>
                <Select
                  options={getSelectOptions('Item_No')}
                  value={filters.product ? { value: filters.product, label: filters.product } : null}
                  onChange={(selectedOption) => handleFilterChange('product', selectedOption)}
                  placeholder="All Product"
                  isClearable
                  isSearchable
                  styles={customSelectStyles}
                />
              </div>
            </div>
            
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <div className="filter-group">
                <label className="form-label text-muted small fw-medium mb-1">Customer</label>
                <Select
                  options={getSelectOptions('Customer')}
                  value={filters.customer ? { value: filters.customer, label: filters.customer } : null}
                  onChange={(selectedOption) => handleFilterChange('customer', selectedOption)}
                  placeholder="All Customer"
                  isClearable
                  isSearchable
                  styles={customSelectStyles}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-body">
        {error && <p className="text-danger mb-3">Error: {error}</p>}

        {loading || isProcessing ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: "500px" }}>
            <div className="spinner-border me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span>{loading ? "Loading data..." : "Processing data..."}</span>
          </div>
        ) : processedChartData.length ? (
          <>
            <div className="chart-container mb-4" style={{ height: "500px", width: "100%" }}>
              <Bar
                ref={chartRef}
                data={chartData}
                options={chartOptions}
              />
            </div>

            <SummaryTable 
              processedChartData={processedChartData}
              dayRanges={dayRanges}
              onBarClick={handleBarClick}
            />
          </>
        ) : (
          <p className="text-center mt-4">No data available with valid SO Date and Invoice Date.</p>
        )}
      </div>

      {/* Modal for displaying order details */}
      {modalData && (
        <OrderDetailsModal
          orderData={modalData}
          onClose={() => setModalData(null)}
          title={modalTitle}
        />
      )}
    </div>
  );
};

export default OrderToInvoiceChart;