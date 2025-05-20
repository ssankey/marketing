// // // // // import React, { useEffect, useState, useRef, useCallback } from "react";
// // // // // import { Bar } from "react-chartjs-2";
// // // // // import {
// // // // //   Chart as ChartJS,
// // // // //   CategoryScale,
// // // // //   LinearScale,
// // // // //   BarElement,
// // // // //   Title,
// // // // //   Tooltip as ChartTooltip,
// // // // //   Legend,
// // // // // } from "chart.js";
// // // // // import { Spinner, Row, Col, Button } from "react-bootstrap";
// // // // // import Select from "react-select";
// // // // // import debounce from "lodash/debounce";
// // // // // import { formatCurrency } from "utils/formatCurrency";
// // // // // import SalesTable from "./SalesTable";

// // // // // // Register Chart.js components
// // // // // ChartJS.register(
// // // // //   CategoryScale,
// // // // //   LinearScale,
// // // // //   BarElement,
// // // // //   Title,
// // // // //   ChartTooltip,
// // // // //   Legend
// // // // // );

// // // // // const SalesByCategoryMonthlyChart = ({ customerId }) => {
// // // // //   const [data, setData] = useState({ months: [], categories: [] });
// // // // //   const [loading, setLoading] = useState(true);
// // // // //   const [salesPersonFilter, setSalesPersonFilter] = useState(null);
// // // // //   const [categoryFilter, setCategoryFilter] = useState(null);
// // // // //   const [salesPersonInputValue, setSalesPersonInputValue] = useState("");
// // // // //   const [categoryInputValue, setCategoryInputValue] = useState("");
// // // // //   const [salesPersonSuggestions, setSalesPersonSuggestions] = useState([]);
// // // // //   const [categorySuggestions, setCategorySuggestions] = useState([]);
// // // // //   const cache = useRef({});

// // // // //   // Fetch the monthly sales data
// // // // //   const fetchData = async () => {
// // // // //     setLoading(true);
// // // // //     try {
// // // // //       let url = `/api/customers/salesbycategorymonthly?id=${customerId}`;
// // // // //       if (salesPersonFilter) {
// // // // //         url += `&salesPerson=${encodeURIComponent(salesPersonFilter.value)}`;
// // // // //       }
// // // // //       if (categoryFilter) {
// // // // //         url += `&category=${encodeURIComponent(categoryFilter.value)}`;
// // // // //       }
// // // // //       const response = await fetch(url);
// // // // //       if (!response.ok) {
// // // // //         throw new Error(`API Error: ${response.status}`);
// // // // //       }
// // // // //       const result = await response.json();
// // // // //       setData(result);
// // // // //     } catch (err) {
// // // // //       console.error("Error fetching sales by category monthly:", err);
// // // // //     } finally {
// // // // //       setLoading(false);
// // // // //     }
// // // // //   };

// // // // //   useEffect(() => {
// // // // //     if (customerId) {
// // // // //       fetchData();
// // // // //     }
// // // // //   }, [customerId, salesPersonFilter, categoryFilter]);

// // // // //   // Fetch sales person suggestions
// // // // //   const fetchSalesPersonSuggestions = useCallback(async (query = "") => {
// // // // //     const cacheKey = `sales-person_${query}`;
// // // // //     if (cache.current[cacheKey]) {
// // // // //       setSalesPersonSuggestions(cache.current[cacheKey]);
// // // // //       return;
// // // // //     }
// // // // //     try {
// // // // //       const url = `/api/dashboard/sales-person/distinct-salesperson?search=${encodeURIComponent(query)}&page=1&limit=50`;
// // // // //       const response = await fetch(url);
// // // // //       const json = await response.json();
// // // // //       const formatted =
// // // // //         json.salesEmployees?.map((emp) => ({
// // // // //           value: emp.value,
// // // // //           label: `${emp.value} - ${emp.label}`,
// // // // //         })) || [];
// // // // //       cache.current[cacheKey] = formatted;
// // // // //       setSalesPersonSuggestions(formatted);
// // // // //     } catch (err) {
// // // // //       console.error("Error fetching sales person suggestions:", err);
// // // // //     }
// // // // //   }, []);

// // // // //   // Fetch category suggestions
// // // // //   const fetchCategorySuggestions = useCallback(async (query = "") => {
// // // // //     const cacheKey = `category_${query}`;
// // // // //     if (cache.current[cacheKey]) {
// // // // //       setCategorySuggestions(cache.current[cacheKey]);
// // // // //       return;
// // // // //     }
// // // // //     try {
// // // // //       const url = `/api/products/categories?search=${encodeURIComponent(query)}&page=1&limit=50`;
// // // // //       const response = await fetch(url);
// // // // //       const json = await response.json();
// // // // //       const formatted =
// // // // //         json.categories?.map((cat) => ({
// // // // //           value: cat,
// // // // //           label: cat,
// // // // //         })) || [];
// // // // //       cache.current[cacheKey] = formatted;
// // // // //       setCategorySuggestions(formatted);
// // // // //     } catch (err) {
// // // // //       console.error("Error fetching category suggestions:", err);
// // // // //     }
// // // // //   }, []);

// // // // //   // Debounced search handlers
// // // // //   const debouncedFetchSalesPersons = useCallback(
// // // // //     debounce((query) => fetchSalesPersonSuggestions(query), 300),
// // // // //     []
// // // // //   );

// // // // //   const debouncedFetchCategories = useCallback(
// // // // //     debounce((query) => fetchCategorySuggestions(query), 300),
// // // // //     []
// // // // //   );

// // // // //   // Handle reset of all filters
// // // // //   const handleReset = () => {
// // // // //     setSalesPersonFilter(null);
// // // // //     setCategoryFilter(null);
// // // // //     setSalesPersonInputValue("");
// // // // //     setCategoryInputValue("");
// // // // //   };

// // // // //   // Color palette for the chart
// // // // //   const colorPalette = [
// // // // //     "#0d6efd", // Primary Blue
// // // // //     "#6c757d", // Secondary Gray
// // // // //     "#198754", // Success Green
// // // // //     "#ffc107", // Warning Yellow
// // // // //     "#0dcaf0", // Info Cyan
// // // // //     "#212529", // Dark Black
// // // // //     "#6610f2", // Purple
// // // // //     "#6f42c1", // Violet
// // // // //     "#d63384", // Pink
// // // // //     "#dc3545", // Red
// // // // //     "#fd7e14", // Orange
// // // // //   ];

// // // // //   // Prepare data for the chart
// // // // //   const chartData = {
// // // // //     labels: data.months?.map((month) => month.month) || [],
// // // // //     datasets:
// // // // //       data.categories?.map((category, index) => ({
// // // // //         label: category,
// // // // //         data:
// // // // //           data.months?.map((month) => month.categories[category] || 0) || [],
// // // // //         backgroundColor: colorPalette[index % colorPalette.length],
// // // // //         stack: "stack",
// // // // //       })) || [],
// // // // //   };

// // // // //   // Chart options
// // // // //   const chartOptions = {
// // // // //     responsive: true,
// // // // //     maintainAspectRatio: false,
// // // // //     plugins: {
// // // // //       legend: {
// // // // //         position: "top",
// // // // //         labels: {
// // // // //           font: {
// // // // //             size: 12,
// // // // //           },
// // // // //         },
// // // // //       },
// // // // //       tooltip: {
// // // // //         callbacks: {
// // // // //           label: (context) => {
// // // // //             const datasetLabel = context.dataset.label || "";
// // // // //             const value = context.parsed.y;
// // // // //             const month = data.months[context.dataIndex];
// // // // //             const percentage = ((value / month.totalSales) * 100).toFixed(2);
// // // // //             return `${datasetLabel}: ${formatCurrency(value)} (${percentage}%)`;
// // // // //           },
// // // // //           afterBody: (tooltipItems) => {
// // // // //             // Get the month data for this tooltip
// // // // //             const monthData = data.months[tooltipItems[0].dataIndex];
// // // // //             if (!monthData) return [];

// // // // //             // Create a listing of all categories for this month
// // // // //             return data.categories.map((category) => {
// // // // //               const sales = monthData.categories[category] || 0;
// // // // //               const percentage = ((sales / monthData.totalSales) * 100).toFixed(
// // // // //                 2
// // // // //               );
// // // // //               return `${category}: ${formatCurrency(sales)} (${percentage}%)`;
// // // // //             });
// // // // //           },
// // // // //         },
// // // // //       },
// // // // //     },
// // // // //     scales: {
// // // // //       x: {
// // // // //         stacked: true,
// // // // //         grid: {
// // // // //           display: false,
// // // // //         },
// // // // //         title: {
// // // // //           display: true,
// // // // //           text: "Month",
// // // // //           font: {
// // // // //             size: 14,
// // // // //             weight: "bold",
// // // // //           },
// // // // //         },
// // // // //       },
// // // // //       y: {
// // // // //         stacked: true,
// // // // //         title: {
// // // // //           display: true,
// // // // //           text: "Sales Amount",
// // // // //           font: {
// // // // //             size: 14,
// // // // //             weight: "bold",
// // // // //           },
// // // // //         },
// // // // //         ticks: {
// // // // //           callback: (value) => formatCurrency(value, { compact: true }),
// // // // //         },
// // // // //       },
// // // // //     },
// // // // //   };

// // // // //   // Function to prepare data for the table
// // // // //   const prepareTableData = () => {
// // // // //     if (!data.months || !data.categories) return [];

// // // // //     return data.months.map((month) => {
// // // // //       const rowData = {
// // // // //         month: month.month,
// // // // //         totalSales: month.totalSales,
// // // // //       };

// // // // //       // Add all categories as columns
// // // // //       data.categories.forEach((category) => {
// // // // //         rowData[category] = month.categories[category] || 0;
// // // // //       });

// // // // //       return rowData;
// // // // //     });
// // // // //   };

// // // // //   return (
// // // // //     <>
// // // // //       {/* Filters */}
// // // // //       <div className="d-flex justify-content-end align-items-center mb-3 gap-2">
// // // // //         <div style={{ width: "250px" }}>
// // // // //           <Select
// // // // //             value={salesPersonFilter}
// // // // //             inputValue={salesPersonInputValue}
// // // // //             onChange={(option) => setSalesPersonFilter(option)}
// // // // //             onInputChange={(val) => {
// // // // //               setSalesPersonInputValue(val);
// // // // //               debouncedFetchSalesPersons(val);
// // // // //             }}
// // // // //             onFocus={() => fetchSalesPersonSuggestions(salesPersonInputValue)}
// // // // //             options={salesPersonSuggestions}
// // // // //             isClearable
// // // // //             placeholder="Filter by Sales Person"
// // // // //           />
// // // // //         </div>
// // // // //         <div style={{ width: "250px" }}>
// // // // //           <Select
// // // // //             value={categoryFilter}
// // // // //             inputValue={categoryInputValue}
// // // // //             onChange={(option) => setCategoryFilter(option)}
// // // // //             onInputChange={(val) => {
// // // // //               setCategoryInputValue(val);
// // // // //               debouncedFetchCategories(val);
// // // // //             }}
// // // // //             onFocus={() => fetchCategorySuggestions(categoryInputValue)}
// // // // //             options={categorySuggestions}
// // // // //             isClearable
// // // // //             placeholder="Filter by Category"
// // // // //           />
// // // // //         </div>
// // // // //         <Button
// // // // //           variant="primary"
// // // // //           onClick={handleReset}
// // // // //           disabled={!salesPersonFilter && !categoryFilter}
// // // // //         >
// // // // //           Reset
// // // // //         </Button>
// // // // //       </div>

// // // // //       {/* Chart and Table */}
// // // // //       {loading ? (
// // // // //         <div className="text-center p-5">
// // // // //           <Spinner animation="border" variant="primary" />
// // // // //           <p className="mt-2">Loading sales data...</p>
// // // // //         </div>
// // // // //       ) : data.months.length === 0 ? (
// // // // //         <div className="text-center p-5">
// // // // //           <p>No sales data available for the selected criteria.</p>
// // // // //         </div>
// // // // //       ) : (
// // // // //         <>
// // // // //           <Row>
// // // // //             <Col lg={12}>
// // // // //               <div className="bg-white rounded shadow-sm p-3 mb-4">
// // // // //                 <h5 className="mb-3">Monthly Sales by Category</h5>
// // // // //                 <div style={{ height: "400px" }}>
// // // // //                   <Bar data={chartData} options={chartOptions} />
// // // // //                 </div>
// // // // //               </div>
// // // // //             </Col>
// // // // //           </Row>
// // // // //           <Row>
// // // // //             <Col lg={12}>
// // // // //               <SalesTable
// // // // //                 data={prepareTableData()}
// // // // //                 categories={data.categories}
// // // // //                 loading={loading}
// // // // //               />
// // // // //             </Col>
// // // // //           </Row>
// // // // //         </>
// // // // //       )}
// // // // //     </>
// // // // //   );
// // // // // };

// // // // // export default SalesByCategoryMonthlyChart;

// // // // import React, { useEffect, useState, useRef, useCallback } from "react";
// // // // import { Bar } from "react-chartjs-2";
// // // // import {
// // // //   Chart as ChartJS,
// // // //   CategoryScale,
// // // //   LinearScale,
// // // //   BarElement,
// // // //   Title,
// // // //   Tooltip as ChartTooltip,
// // // //   Legend,
// // // // } from "chart.js";
// // // // import { Spinner, Row, Col, Button } from "react-bootstrap";
// // // // import Select from "react-select";
// // // // import debounce from "lodash/debounce";
// // // // import { formatCurrency } from "utils/formatCurrency";
// // // // import SalesTable from "./SalesTable";

// // // // // Register Chart.js components
// // // // ChartJS.register(
// // // //   CategoryScale,
// // // //   LinearScale,
// // // //   BarElement,
// // // //   Title,
// // // //   ChartTooltip,
// // // //   Legend
// // // // );

// // // // const SalesByCategoryMonthlyChart = ({ customerId }) => {
// // // //   const [data, setData] = useState({ months: [], categories: [] });
// // // //   const [loading, setLoading] = useState(true);
// // // //   const [salesPersonFilter, setSalesPersonFilter] = useState(null);
// // // //   const [categoryFilter, setCategoryFilter] = useState(null);
// // // //   const [salesPersonInputValue, setSalesPersonInputValue] = useState("");
// // // //   const [categoryInputValue, setCategoryInputValue] = useState("");
// // // //   const [salesPersonSuggestions, setSalesPersonSuggestions] = useState([]);
// // // //   const [categorySuggestions, setCategorySuggestions] = useState([]);
// // // //   const cache = useRef({});

// // // //   // Fetch the monthly sales data
// // // //   const fetchData = async () => {
// // // //     setLoading(true);
// // // //     try {
// // // //       let url = `/api/customers/salesbycategorymonthly?id=${customerId}`;
// // // //       if (salesPersonFilter) {
// // // //         url += `&salesPerson=${encodeURIComponent(salesPersonFilter.value)}`;
// // // //       }
// // // //       if (categoryFilter) {
// // // //         url += `&category=${encodeURIComponent(categoryFilter.value)}`;
// // // //       }
// // // //       const response = await fetch(url);
// // // //       if (!response.ok) {
// // // //         throw new Error(`API Error: ${response.status}`);
// // // //       }
// // // //       const result = await response.json();
// // // //       setData(result);
// // // //     } catch (err) {
// // // //       console.error("Error fetching sales by category monthly:", err);
// // // //     } finally {
// // // //       setLoading(false);
// // // //     }
// // // //   };

// // // //   useEffect(() => {
// // // //     if (customerId) {
// // // //       fetchData();
// // // //     }
// // // //   }, [customerId, salesPersonFilter, categoryFilter]);

// // // //   // Fetch sales person suggestions
// // // //   const fetchSalesPersonSuggestions = useCallback(async (query = "") => {
// // // //     const cacheKey = `sales-person_${query}`;
// // // //     if (cache.current[cacheKey]) {
// // // //       setSalesPersonSuggestions(cache.current[cacheKey]);
// // // //       return;
// // // //     }
// // // //     try {
// // // //       const url = `/api/dashboard/sales-person/distinct-salesperson?search=${encodeURIComponent(query)}&page=1&limit=50`;
// // // //       const response = await fetch(url);
// // // //       const json = await response.json();
// // // //       const formatted =
// // // //         json.salesEmployees?.map((emp) => ({
// // // //           value: emp.value,
// // // //           label: `${emp.value} - ${emp.label}`,
// // // //         })) || [];
// // // //       cache.current[cacheKey] = formatted;
// // // //       setSalesPersonSuggestions(formatted);
// // // //     } catch (err) {
// // // //       console.error("Error fetching sales person suggestions:", err);
// // // //     }
// // // //   }, []);

// // // //   // Fetch category suggestions
// // // //   const fetchCategorySuggestions = useCallback(async (query = "") => {
// // // //     const cacheKey = `category_${query}`;
// // // //     if (cache.current[cacheKey]) {
// // // //       setCategorySuggestions(cache.current[cacheKey]);
// // // //       return;
// // // //     }
// // // //     try {
// // // //       const url = `/api/products/categories?search=${encodeURIComponent(query)}&page=1&limit=50`;
// // // //       const response = await fetch(url);
// // // //       const json = await response.json();
// // // //       const formatted =
// // // //         json.categories?.map((cat) => ({
// // // //           value: cat,
// // // //           label: cat,
// // // //         })) || [];
// // // //       cache.current[cacheKey] = formatted;
// // // //       setCategorySuggestions(formatted);
// // // //     } catch (err) {
// // // //       console.error("Error fetching category suggestions:", err);
// // // //     }
// // // //   }, []);

// // // //   // Debounced search handlers
// // // //   const debouncedFetchSalesPersons = useCallback(
// // // //     debounce((query) => fetchSalesPersonSuggestions(query), 300),
// // // //     []
// // // //   );

// // // //   const debouncedFetchCategories = useCallback(
// // // //     debounce((query) => fetchCategorySuggestions(query), 300),
// // // //     []
// // // //   );

// // // //   // Handle reset of all filters
// // // //   const handleReset = () => {
// // // //     setSalesPersonFilter(null);
// // // //     setCategoryFilter(null);
// // // //     setSalesPersonInputValue("");
// // // //     setCategoryInputValue("");
// // // //   };

// // // //   // Color palette for the chart
// // // //   const colorPalette = [
// // // //     "#0d6efd", // Primary Blue
// // // //     "#6c757d", // Secondary Gray
// // // //     "#198754", // Success Green
// // // //     "#ffc107", // Warning Yellow
// // // //     "#0dcaf0", // Info Cyan
// // // //     "#212529", // Dark Black
// // // //     "#6610f2", // Purple
// // // //     "#6f42c1", // Violet
// // // //     "#d63384", // Pink
// // // //     "#dc3545", // Red
// // // //     "#fd7e14", // Orange
// // // //   ];

// // // //   // Prepare data for the chart
// // // //   const chartData = {
// // // //     labels: data.months?.map((month) => month.month) || [],
// // // //     datasets:
// // // //       data.categories?.map((category, index) => ({
// // // //         label: category,
// // // //         data:
// // // //           data.months?.map((month) => month.categories[category] || 0) || [],
// // // //         backgroundColor: colorPalette[index % colorPalette.length],
// // // //         stack: "stack",
// // // //       })) || [],
// // // //   };

// // // //   // Chart options
// // // //   const chartOptions = {
// // // //     responsive: true,
// // // //     maintainAspectRatio: false,
// // // //     plugins: {
// // // //       legend: {
// // // //         position: "top",
// // // //         labels: {
// // // //           font: {
// // // //             size: 12,
// // // //           },
// // // //         },
// // // //       },
// // // //       tooltip: {
// // // //         callbacks: {
// // // //           label: (context) => {
// // // //             const datasetLabel = context.dataset.label || "";
// // // //             const value = context.parsed.y;
// // // //             const month = data.months[context.dataIndex];
// // // //             const percentage = monthData.totalSales
// // // //               ? ((value / monthData.totalSales) * 100).toFixed(2)
// // // //               : "0.00";
// // // //             return `${datasetLabel}: ${formatCurrency(value)} (${percentage}%)`;
// // // //           },
// // // //           afterBody: (tooltipItems) => {
// // // //             const monthData = data.months?.[tooltipItems[0].dataIndex];
// // // //             if (!monthData) return [];

// // // //             // Create a listing of all categories for this month
// // // //             return (
// // // //               data.categories?.map((category) => {
// // // //                 const sales = monthData.categories?.[category] || 0;
// // // //                 const percentage = monthData.totalSales
// // // //                   ? ((sales / monthData.totalSales) * 100).toFixed(2)
// // // //                   : "0.00";
// // // //                 return `${category}: ${formatCurrency(sales)} (${percentage}%)`;
// // // //               }) || []
// // // //             );
// // // //           },
// // // //         },
// // // //       },
// // // //     },
// // // //     scales: {
// // // //       x: {
// // // //         stacked: true,
// // // //         grid: {
// // // //           display: false,
// // // //         },
// // // //         title: {
// // // //           display: true,
// // // //           text: "Month",
// // // //           font: {
// // // //             size: 14,
// // // //             weight: "bold",
// // // //           },
// // // //         },
// // // //       },
// // // //       y: {
// // // //         stacked: true,
// // // //         title: {
// // // //           display: true,
// // // //           text: "Sales Amount",
// // // //           font: {
// // // //             size: 14,
// // // //             weight: "bold",
// // // //           },
// // // //         },
// // // //         ticks: {
// // // //           callback: (value) => formatCurrency(value, { compact: true }),
// // // //         },
// // // //       },
// // // //     },
// // // //   };

// // // //   // Function to prepare data for the table
// // // //   const prepareTableData = () => {
// // // //     if (!data.months || !data.categories) return [];

// // // //     return data.months.map((month) => {
// // // //       const rowData = {
// // // //         month: month.month,
// // // //         totalSales: month.totalSales || 0,
// // // //       };

// // // //       // Add all categories as columns
// // // //       data.categories.forEach((category) => {
// // // //         rowData[category] = month.categories?.[category] || 0;
// // // //       });

// // // //       return rowData;
// // // //     });
// // // //   };

// // // //   return (
// // // //     <>
// // // //       {/* Filters */}
// // // //       <div className="d-flex justify-content-end align-items-center mb-3 gap-2">
// // // //         <div style={{ width: "250px" }}>
// // // //           <Select
// // // //             value={salesPersonFilter}
// // // //             inputValue={salesPersonInputValue}
// // // //             onChange={(option) => setSalesPersonFilter(option)}
// // // //             onInputChange={(val) => {
// // // //               setSalesPersonInputValue(val);
// // // //               debouncedFetchSalesPersons(val);
// // // //             }}
// // // //             onFocus={() => fetchSalesPersonSuggestions(salesPersonInputValue)}
// // // //             options={salesPersonSuggestions}
// // // //             isClearable
// // // //             placeholder="Filter by Sales Person"
// // // //           />
// // // //         </div>
// // // //         <div style={{ width: "250px" }}>
// // // //           <Select
// // // //             value={categoryFilter}
// // // //             inputValue={categoryInputValue}
// // // //             onChange={(option) => setCategoryFilter(option)}
// // // //             onInputChange={(val) => {
// // // //               setCategoryInputValue(val);
// // // //               debouncedFetchCategories(val);
// // // //             }}
// // // //             onFocus={() => fetchCategorySuggestions(categoryInputValue)}
// // // //             options={categorySuggestions}
// // // //             isClearable
// // // //             placeholder="Filter by Category"
// // // //           />
// // // //         </div>
// // // //         <Button
// // // //           variant="primary"
// // // //           onClick={handleReset}
// // // //           disabled={!salesPersonFilter && !categoryFilter}
// // // //         >
// // // //           Reset
// // // //         </Button>
// // // //       </div>

// // // //       {/* Chart and Table */}
// // // //       {loading ? (
// // // //         <div className="text-center p-5">
// // // //           <Spinner animation="border" variant="primary" />
// // // //           <p className="mt-2">Loading sales data...</p>
// // // //         </div>
// // // //       ) : !data.months || data.months.length === 0 ? (
// // // //         <div className="text-center p-5">
// // // //           <p>No sales data available for the selected criteria.</p>
// // // //         </div>
// // // //       ) : (
// // // //         <>
// // // //           <Row>
// // // //             <Col lg={12}>
// // // //               <div className="bg-white rounded shadow-sm p-3 mb-4">
// // // //                 <h5 className="mb-3">Monthly Sales by Category</h5>
// // // //                 <div style={{ height: "400px" }}>
// // // //                   <Bar data={chartData} options={chartOptions} />
// // // //                 </div>
// // // //               </div>
// // // //             </Col>
// // // //           </Row>
// // // //           <Row>
// // // //             <Col lg={12}>
// // // //               <SalesTable
// // // //                 data={prepareTableData()}
// // // //                 categories={data.categories}
// // // //                 loading={loading}
// // // //               />
// // // //             </Col>
// // // //           </Row>
// // // //         </>
// // // //       )}
// // // //     </>
// // // //   );
// // // // };

// // // // export default SalesByCategoryMonthlyChart;

// // // import React, { useEffect, useState, useRef, useCallback } from "react";
// // // import { Bar } from "react-chartjs-2";
// // // import { Spinner, Row, Col, Button, Dropdown } from "react-bootstrap";
// // // import Select from "react-select";
// // // import debounce from "lodash/debounce";
// // // import { formatCurrency } from "utils/formatCurrency";
// // // import {
// // //   Chart as ChartJS,
// // //   CategoryScale,
// // //   LinearScale,
// // //   BarElement,
// // //   Title,
// // //   Tooltip,
// // //   Legend,
// // // } from "chart.js";

// // // // Register ChartJS components
// // // ChartJS.register(
// // //   CategoryScale,
// // //   LinearScale,
// // //   BarElement,
// // //   Title,
// // //   Tooltip,
// // //   Legend
// // // );

// // // const MonthlySalesByCategoryChart = ({ customerId }) => {
// // //   const [data, setData] = useState({
// // //     months: [],
// // //     categories: [],
// // //     salesByMonthAndCategory: [],
// // //   });
// // //   const [loading, setLoading] = useState(false);

// // //   // Filter state
// // //   const [filters, setFilters] = useState({
// // //     salesPerson: null,
// // //     category: null,
// // //   });

// // //   // Search type and filter UI state
// // //   const [searchType, setSearchType] = useState(null);
// // //   const [suggestions, setSuggestions] = useState([]);
// // //   const [loadingSuggestions, setLoadingSuggestions] = useState(false);
// // //   const [selectedValue, setSelectedValue] = useState(null);
// // //   const [inputValue, setInputValue] = useState("");
// // //   const cache = useRef({});

// // //   // API endpoints for filters
// // //   const API_ENDPOINTS = {
// // //     salesPerson: "/api/dashboard/sales-person/distinct-salesperson",
// // //     category: "/api/products/categories",
// // //   };

// // //   const fetchData = async () => {
// // //     if (!customerId) return;

// // //     setLoading(true);
// // //     try {
// // //       // Construct URL with optional filters
// // //       const params = new URLSearchParams();
// // //       params.append("id", customerId);

// // //       if (filters.salesPerson) {
// // //         params.append("salesPerson", filters.salesPerson.value);
// // //       }

// // //       if (filters.category) {
// // //         params.append("category", filters.category.value);
// // //       }

// // //       const url = `/api/customers/monthlySalesByCategory?${params.toString()}`;
// // //       const response = await fetch(url);

// // //       if (!response.ok) {
// // //         throw new Error("Failed to fetch data");
// // //       }

// // //       const result = await response.json();
// // //       console.log("API response data:", result);
// // //       setData(result);
// // //     } catch (error) {
// // //       console.error("Error fetching monthly sales by category:", error);
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   useEffect(() => {
// // //     fetchData();
// // //   }, [customerId, filters]);

// // //   // Define color palette
// // //   const colorPalette = [
// // //     "#0d6efd", // Primary Blue
// // //     "#6c757d", // Secondary Gray
// // //     "#198754", // Success Green
// // //     "#ffc107", // Warning Yellow
// // //     "#0dcaf0", // Info Cyan
// // //     "#212529", // Dark Black
// // //     "#6610f2", // Purple
// // //     "#6f42c1", // Violet
// // //     "#d63384", // Pink
// // //     "#dc3545", // Red
// // //     "#fd7e14", // Orange
// // //   ];

// // //   // Prepare chart data
// // //   const chartData = {
// // //     labels: data.months,
// // //     datasets: data.categories.map((category, index) => ({
// // //       label: category,
// // //       data: data.months.map((month) => {
// // //         const matchingData = data.salesByMonthAndCategory.find(
// // //           (item) => item.month === month && item.category === category
// // //         );
// // //         return matchingData ? matchingData.sales : 0;
// // //       }),
// // //       backgroundColor: colorPalette[index % colorPalette.length],
// // //       stack: "Stack 0",
// // //     })),
// // //   };

// // //   // Chart options
// // //   const chartOptions = {
// // //     responsive: true,
// // //     maintainAspectRatio: false,
// // //     plugins: {
// // //       legend: {
// // //         position: "top",
// // //       },
// // //       tooltip: {
// // //         callbacks: {
// // //           label: function (context) {
// // //             const dataIndex = context.dataIndex;
// // //             const datasetIndex = context.datasetIndex;
// // //             const month = data.months[dataIndex];
// // //             const category = data.categories[datasetIndex];

// // //             // Find the corresponding data point
// // //             const matchingData = data.salesByMonthAndCategory.find(
// // //               (item) => item.month === month && item.category === category
// // //             );

// // //             if (matchingData) {
// // //               return `${category}: ${formatCurrency(matchingData.sales)} (${matchingData.percentage}%)`;
// // //             }
// // //             return `${category}: ${formatCurrency(0)} (0%)`;
// // //           },
// // //           afterBody: function (tooltipItems) {
// // //             const month = data.months[tooltipItems[0].dataIndex];

// // //             // Sum all sales for this month
// // //             const totalSales = data.salesByMonthAndCategory
// // //               .filter((item) => item.month === month)
// // //               .reduce((sum, item) => sum + item.sales, 0);

// // //             return `Total: ${formatCurrency(totalSales)}`;
// // //           },
// // //         },
// // //       },
// // //       datalabels: {
// // //         display: false,
// // //       },
// // //     },
// // //     scales: {
// // //       x: {
// // //         stacked: true,
// // //         grid: {
// // //           display: false,
// // //         },
// // //         title: {
// // //           display: true,
// // //           text: "Month",
// // //         },
// // //       },
// // //       y: {
// // //         stacked: true,
// // //         title: {
// // //           display: true,
// // //           text: "Sales",
// // //         },
// // //         ticks: {
// // //           callback: function (value) {
// // //             return formatCurrency(value, true);
// // //           },
// // //         },
// // //       },
// // //     },
// // //   };

// // //   // Handle dropdown selection
// // //   const handleSearchTypeSelect = async (type) => {
// // //     setSearchType(type);
// // //     setSelectedValue(null);
// // //     setInputValue("");
// // //     setSuggestions([]);
// // //     if (type === "salesPerson" || type === "category") {
// // //       await fetchSuggestions("", true);
// // //     }
// // //   };

// // //   // Debounced function for API calls when typing
// // //   const debouncedFetchSuggestions = useCallback(
// // //     debounce(async (query) => {
// // //       await fetchSuggestions(query);
// // //     }, 500),
// // //     [searchType]
// // //   );

// // //   // Fetch suggestions based on search type
// // //   const fetchSuggestions = async (query = "", initialLoad = false) => {
// // //     if (!searchType) return;
// // //     if (!initialLoad && !query) return;

// // //     const cacheKey = `${searchType}_${query}`;
// // //     if (cache.current[cacheKey]) {
// // //       setSuggestions(cache.current[cacheKey]);
// // //       return;
// // //     }

// // //     setLoadingSuggestions(true);
// // //     try {
// // //       const url = `${API_ENDPOINTS[searchType]}?search=${encodeURIComponent(query)}&page=1&limit=50`;
// // //       const response = await fetch(url);

// // //       if (!response.ok) throw new Error(`API Error: ${response.status}`);
// // //       const responseData = await response.json();

// // //       let formattedSuggestions = [];
// // //       if (searchType === "salesPerson") {
// // //         formattedSuggestions =
// // //           responseData.salesEmployees?.map((emp) => ({
// // //             value: emp.value,
// // //             label: `${emp.value} - ${emp.label}`,
// // //           })) || [];
// // //       } else if (searchType === "category") {
// // //         formattedSuggestions =
// // //           responseData.categories?.map((cat) => ({
// // //             value: cat,
// // //             label: cat,
// // //           })) || [];
// // //       }

// // //       cache.current[cacheKey] = formattedSuggestions;
// // //       setSuggestions(formattedSuggestions);
// // //     } catch (error) {
// // //       console.error(`Error fetching ${searchType} suggestions:`, error);
// // //       setSuggestions([]);
// // //     } finally {
// // //       setLoadingSuggestions(false);
// // //     }
// // //   };

// // //   // Handle input change
// // //   const handleInputChange = (inputValue, { action }) => {
// // //     if (action === "input-change") {
// // //       setInputValue(inputValue);
// // //       debouncedFetchSuggestions(inputValue);
// // //     }
// // //   };

// // //   // Handle option selection
// // //   const handleOptionSelect = (option) => {
// // //     setSelectedValue(option);

// // //     if (option) {
// // //       setFilters((prev) => ({
// // //         ...prev,
// // //         [searchType]: {
// // //           value: option.value,
// // //           label: option.label,
// // //         },
// // //       }));
// // //     } else {
// // //       setFilters((prev) => ({
// // //         ...prev,
// // //         [searchType]: null,
// // //       }));
// // //     }
// // //   };

// // //   // Reset filters
// // //   const handleReset = () => {
// // //     setFilters({
// // //       salesPerson: null,
// // //       category: null,
// // //     });
// // //     setSearchType(null);
// // //     setSelectedValue(null);
// // //     setInputValue("");
// // //   };

// // //   return (
// // //     <div className="bg-white rounded-lg shadow-sm p-4">
// // //       <div className="d-flex justify-content-between align-items-center mb-4">
// // //         <h4 className="text-xl font-semibold text-gray-900 mb-0">
// // //           Monthly Sales by Category
// // //         </h4>

// // //         {/* Filter Controls */}
// // //         <div className="d-flex gap-2 align-items-center">
// // //           <Dropdown onSelect={handleSearchTypeSelect}>
// // //             <Dropdown.Toggle variant="outline-secondary" id="search-dropdown">
// // //               {searchType
// // //                 ? searchType === "salesPerson"
// // //                   ? "Sales Person"
// // //                   : "Category"
// // //                 : "Filter By"}
// // //             </Dropdown.Toggle>
// // //             <Dropdown.Menu>
// // //               <Dropdown.Item eventKey="salesPerson">Sales Person</Dropdown.Item>
// // //               <Dropdown.Item eventKey="category">Category</Dropdown.Item>
// // //             </Dropdown.Menu>
// // //           </Dropdown>

// // //           <div style={{ width: "250px" }}>
// // //             <Select
// // //               value={selectedValue}
// // //               inputValue={inputValue}
// // //               onChange={handleOptionSelect}
// // //               onInputChange={handleInputChange}
// // //               onFocus={() => fetchSuggestions(inputValue, true)}
// // //               options={suggestions}
// // //               isLoading={loadingSuggestions}
// // //               isClearable
// // //               isDisabled={!searchType}
// // //               placeholder={
// // //                 searchType
// // //                   ? `Search ${searchType === "salesPerson" ? "Sales Person" : "Category"}`
// // //                   : "Select filter type"
// // //               }
// // //               noOptionsMessage={() =>
// // //                 loadingSuggestions ? "Loading..." : "No results found"
// // //               }
// // //             />
// // //           </div>
// // //           <Button
// // //             variant="primary"
// // //             onClick={handleReset}
// // //             disabled={!filters.salesPerson && !filters.category}
// // //           >
// // //             Reset
// // //           </Button>
// // //         </div>
// // //       </div>

// // //       {loading ? (
// // //         <div className="text-center p-5">
// // //           <Spinner animation="border" variant="primary" />
// // //           <p className="mt-2">Loading data...</p>
// // //         </div>
// // //       ) : data.months.length > 0 ? (
// // //         <div style={{ height: "500px" }}>
// // //           <Bar data={chartData} options={chartOptions} />
// // //         </div>
// // //       ) : (
// // //         <div className="text-center p-5">
// // //           <p>No sales data available for the selected filters.</p>
// // //         </div>
// // //       )}
// // //     </div>
// // //   );
// // // };

// // // export default MonthlySalesByCategoryChart;
// // import React, { useEffect, useState, useRef, useCallback } from "react";
// // import { Bar } from "react-chartjs-2";
// // import { Spinner, Row, Col, Button, Dropdown } from "react-bootstrap";
// // import Select from "react-select";
// // import debounce from "lodash/debounce";
// // import { formatCurrency } from "utils/formatCurrency";
// // import {
// //   Chart as ChartJS,
// //   CategoryScale,
// //   LinearScale,
// //   BarElement,
// //   Title,
// //   Tooltip,
// //   Legend,
// // } from "chart.js";

// // // Register ChartJS components
// // ChartJS.register(
// //   CategoryScale,
// //   LinearScale,
// //   BarElement,
// //   Title,
// //   Tooltip,
// //   Legend
// // );

// // const MonthlySalesByCategoryChart = ({ customerId }) => {
// //   const [data, setData] = useState({
// //     months: [],
// //     categories: [],
// //     salesByMonthAndCategory: [],
// //   });
// //   const [loading, setLoading] = useState(true); // Start with loading true

// //   // Filter state
// //   const [filters, setFilters] = useState({
// //     salesPerson: null,
// //     category: null,
// //   });

// //   // Search type and filter UI state
// //   const [searchType, setSearchType] = useState(null);
// //   const [suggestions, setSuggestions] = useState([]);
// //   const [loadingSuggestions, setLoadingSuggestions] = useState(false);
// //   const [selectedValue, setSelectedValue] = useState(null);
// //   const [inputValue, setInputValue] = useState("");
// //   const cache = useRef({});

// //   // API endpoints for filters
// //   const API_ENDPOINTS = {
// //     salesPerson: "/api/dashboard/sales-person/distinct-salesperson",
// //     category: "/api/products/categories",
// //   };

// //   const fetchData = async () => {
// //     if (!customerId) return;

// //     setLoading(true);
// //     try {
// //       // Construct URL with optional filters
// //       const params = new URLSearchParams();
// //       params.append("id", customerId);

// //       if (filters.salesPerson) {
// //         params.append("salesPerson", filters.salesPerson.value);
// //       }

// //       if (filters.category) {
// //         params.append("category", filters.category.value);
// //       }

// //       const url = `/api/customers/monthlySalesByCategory?${params.toString()}`;
// //       console.log("Fetching data from:", url);

// //       const response = await fetch(url);

// //       if (!response.ok) {
// //         throw new Error(`Failed to fetch data: ${response.status}`);
// //       }

// //       const result = await response.json();
// //       console.log("API response data:", result);

// //       // Handle empty or invalid response
// //       if (!result || !Array.isArray(result.months)) {
// //         console.warn("Invalid response format:", result);
// //         setData({
// //           months: [],
// //           categories: [],
// //           salesByMonthAndCategory: [],
// //         });
// //       } else {
// //         setData(result);
// //       }
// //     } catch (error) {
// //       console.error("Error fetching monthly sales by category:", error);
// //       setData({
// //         months: [],
// //         categories: [],
// //         salesByMonthAndCategory: [],
// //       });
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   useEffect(() => {
// //     if (customerId) {
// //       fetchData();
// //     }
// //   }, [customerId, filters]);

// //   // Define color palette
// //   const colorPalette = [
// //     "#0d6efd", // Primary Blue
// //     "#6c757d", // Secondary Gray
// //     "#198754", // Success Green
// //     "#ffc107", // Warning Yellow
// //     "#0dcaf0", // Info Cyan
// //     "#212529", // Dark Black
// //     "#6610f2", // Purple
// //     "#6f42c1", // Violet
// //     "#d63384", // Pink
// //     "#dc3545", // Red
// //     "#fd7e14", // Orange
// //   ];

// //   // Prepare chart data
// //   const chartData = {
// //     labels: data.months || [],
// //     datasets: (data.categories || []).map((category, index) => ({
// //       label: category,
// //       data: (data.months || []).map((month) => {
// //         const matchingData = (data.salesByMonthAndCategory || []).find(
// //           (item) => item.month === month && item.category === category
// //         );
// //         return matchingData ? matchingData.sales : 0;
// //       }),
// //       backgroundColor: colorPalette[index % colorPalette.length],
// //       stack: "Stack 0",
// //     })),
// //   };

// //   // Chart options
// //   const chartOptions = {
// //     responsive: true,
// //     maintainAspectRatio: false,
// //     plugins: {
// //       legend: {
// //         position: "top",
// //       },
// //       tooltip: {
// //         callbacks: {
// //           label: function (context) {
// //             const dataIndex = context.dataIndex;
// //             const datasetIndex = context.datasetIndex;
// //             const month = (data.months || [])[dataIndex];
// //             const category = (data.categories || [])[datasetIndex];

// //             // Find the corresponding data point
// //             const matchingData = (data.salesByMonthAndCategory || []).find(
// //               (item) => item.month === month && item.category === category
// //             );

// //             if (matchingData) {
// //               return `${category}: ${formatCurrency(matchingData.sales)} (${matchingData.percentage}%)`;
// //             }
// //             return `${category}: ${formatCurrency(0)} (0%)`;
// //           },
// //           afterBody: function (tooltipItems) {
// //             if (!tooltipItems || tooltipItems.length === 0) return "";

// //             const month = (data.months || [])[tooltipItems[0].dataIndex];

// //             // Sum all sales for this month
// //             const totalSales = (data.salesByMonthAndCategory || [])
// //               .filter((item) => item.month === month)
// //               .reduce((sum, item) => sum + item.sales, 0);

// //             return `Total: ${formatCurrency(totalSales)}`;
// //           },
// //         },
// //       },
// //       datalabels: {
// //         display: false,
// //       },
// //     },
// //     scales: {
// //       x: {
// //         stacked: true,
// //         grid: {
// //           display: false,
// //         },
// //         title: {
// //           display: true,
// //           text: "Month",
// //         },
// //       },
// //       y: {
// //         stacked: true,
// //         title: {
// //           display: true,
// //           text: "Sales",
// //         },
// //         ticks: {
// //           callback: function (value) {
// //             return formatCurrency(value, true);
// //           },
// //         },
// //       },
// //     },
// //   };

// //   // Handle dropdown selection
// //   const handleSearchTypeSelect = async (type) => {
// //     setSearchType(type);
// //     setSelectedValue(null);
// //     setInputValue("");
// //     setSuggestions([]);
// //     if (type === "salesPerson" || type === "category") {
// //       await fetchSuggestions("", true);
// //     }
// //   };

// //   // Debounced function for API calls when typing
// //   const debouncedFetchSuggestions = useCallback(
// //     debounce(async (query) => {
// //       await fetchSuggestions(query);
// //     }, 500),
// //     [searchType]
// //   );

// //   // Fetch suggestions based on search type
// //   const fetchSuggestions = async (query = "", initialLoad = false) => {
// //     if (!searchType) return;
// //     if (!initialLoad && !query) return;

// //     const cacheKey = `${searchType}_${query}`;
// //     if (cache.current[cacheKey]) {
// //       setSuggestions(cache.current[cacheKey]);
// //       return;
// //     }

// //     setLoadingSuggestions(true);
// //     try {
// //       const url = `${API_ENDPOINTS[searchType]}?search=${encodeURIComponent(query)}&page=1&limit=50`;
// //       const response = await fetch(url);

// //       if (!response.ok) throw new Error(`API Error: ${response.status}`);
// //       const responseData = await response.json();

// //       let formattedSuggestions = [];
// //       if (searchType === "salesPerson") {
// //         formattedSuggestions =
// //           responseData.salesEmployees?.map((emp) => ({
// //             value: emp.value,
// //             label: `${emp.value} - ${emp.label}`,
// //           })) || [];
// //       } else if (searchType === "category") {
// //         formattedSuggestions =
// //           responseData.categories?.map((cat) => ({
// //             value: cat,
// //             label: cat,
// //           })) || [];
// //       }

// //       cache.current[cacheKey] = formattedSuggestions;
// //       setSuggestions(formattedSuggestions);
// //     } catch (error) {
// //       console.error(`Error fetching ${searchType} suggestions:`, error);
// //       setSuggestions([]);
// //     } finally {
// //       setLoadingSuggestions(false);
// //     }
// //   };

// //   // Handle input change
// //   const handleInputChange = (inputValue, { action }) => {
// //     if (action === "input-change") {
// //       setInputValue(inputValue);
// //       debouncedFetchSuggestions(inputValue);
// //     }
// //   };

// //   // Handle option selection
// //   const handleOptionSelect = (option) => {
// //     setSelectedValue(option);

// //     if (option) {
// //       setFilters((prev) => ({
// //         ...prev,
// //         [searchType]: {
// //           value: option.value,
// //           label: option.label,
// //         },
// //       }));
// //     } else {
// //       setFilters((prev) => ({
// //         ...prev,
// //         [searchType]: null,
// //       }));
// //     }
// //   };

// //   // Reset filters
// //   const handleReset = () => {
// //     setFilters({
// //       salesPerson: null,
// //       category: null,
// //     });
// //     setSearchType(null);
// //     setSelectedValue(null);
// //     setInputValue("");
// //   };

// //   return (
// //     <div className="bg-white rounded-lg shadow-sm p-4">
// //       <div className="d-flex justify-content-between align-items-center mb-4">
// //         <h4 className="text-xl font-semibold text-gray-900 mb-0">
// //           Monthly Sales by Category
// //         </h4>

// //         {/* Filter Controls */}
// //         <div className="d-flex gap-2 align-items-center">
// //           <Dropdown onSelect={handleSearchTypeSelect}>
// //             <Dropdown.Toggle variant="outline-secondary" id="search-dropdown">
// //               {searchType
// //                 ? searchType === "salesPerson"
// //                   ? "Sales Person"
// //                   : "Category"
// //                 : "Filter By"}
// //             </Dropdown.Toggle>
// //             <Dropdown.Menu>
// //               <Dropdown.Item eventKey="salesPerson">Sales Person</Dropdown.Item>
// //               <Dropdown.Item eventKey="category">Category</Dropdown.Item>
// //             </Dropdown.Menu>
// //           </Dropdown>

// //           <div style={{ width: "250px" }}>
// //             <Select
// //               value={selectedValue}
// //               inputValue={inputValue}
// //               onChange={handleOptionSelect}
// //               onInputChange={handleInputChange}
// //               onFocus={() => fetchSuggestions(inputValue, true)}
// //               options={suggestions}
// //               isLoading={loadingSuggestions}
// //               isClearable
// //               isDisabled={!searchType}
// //               placeholder={
// //                 searchType
// //                   ? `Search ${searchType === "salesPerson" ? "Sales Person" : "Category"}`
// //                   : "Select filter type"
// //               }
// //               noOptionsMessage={() =>
// //                 loadingSuggestions ? "Loading..." : "No results found"
// //               }
// //             />
// //           </div>
// //           <Button
// //             variant="primary"
// //             onClick={handleReset}
// //             disabled={!filters.salesPerson && !filters.category}
// //           >
// //             Reset
// //           </Button>
// //         </div>
// //       </div>

// //       {loading ? (
// //         <div className="text-center p-5">
// //           <Spinner animation="border" variant="primary" />
// //           <p className="mt-2">Loading data...</p>
// //         </div>
// //       ) : data.months.length > 0 ? (
// //         <div style={{ height: "500px" }}>
// //           <Bar data={chartData} options={chartOptions} />
// //         </div>
// //       ) : (
// //         <div className="text-center p-5">
// //           <p>No sales data available for the selected filters.</p>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default MonthlySalesByCategoryChart;

// import React from "react";
// import { Bar } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";
// import { formatCurrency } from "utils/formatCurrency";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// );

// const colorPalette = [
//   "#0d6efd", // Primary Blue
//   "#6c757d", // Secondary Gray
//   "#198754", // Success Green
//   "#ffc107", // Warning Yellow
//   "#0dcaf0", // Info Cyan
//   "#6610f2", // Purple
//   "#d63384", // Pink
//   "#fd7e14", // Orange
//   "#20c997", // Teal
//   "#adb5bd", // Gray
// ];

// const SalesBarChart = ({ data, categories }) => {
//   if (!data || data.length === 0 || !categories || categories.length === 0) {
//     return (
//       <div className="text-center p-4">No data available for the chart</div>
//     );
//   }

//   const chartData = {
//     labels: data.map((item) => item.month),
//     datasets: categories.map((category, index) => ({
//       label: category,
//       data: data.map((item) => item[category] || 0),
//       backgroundColor: colorPalette[index % colorPalette.length],
//       borderWidth: 1,
//     })),
//   };

//   const options = {
//     responsive: true,
//     plugins: {
//       legend: {
//         position: "top",
//       },
//       title: {
//         display: true,
//         text: "Monthly Sales by Category",
//         font: {
//           size: 16,
//         },
//       },
//       tooltip: {
//         callbacks: {
//           label: function (context) {
//             const label = context.dataset.label || "";
//             const value = context.raw || 0;

//             // Calculate total for this stack (month)
//             const total = Object.values(context.raw._custom.data)
//               .filter((val) => typeof val === "number")
//               .reduce((sum, val) => sum + val, 0);

//             const percentage =
//               total > 0 ? ((value / total) * 100).toFixed(1) : 0;

//             return `${label}: ${formatCurrency(value)} (${percentage}%)`;
//           },
//         },
//       },
//     },
//     scales: {
//       x: {
//         stacked: true,
//         grid: {
//           display: false,
//         },
//       },
//       y: {
//         stacked: true,
//         beginAtZero: true,
//         ticks: {
//           callback: function (value) {
//             return formatCurrency(value);
//           },
//         },
//       },
//     },
//     interaction: {
//       mode: "index",
//       intersect: false,
//     },
//   };

//   return (
//     <div style={{ height: "500px", position: "relative" }}>
//       <Bar data={chartData} options={options} />
//     </div>
//   );
// };

// export default SalesBarChart;

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import { Spinner, Dropdown, Button } from "react-bootstrap";
import Select from "react-select";
import ChartJS from "chart.js/auto";
import { formatCurrency } from "utils/formatCurrency";

const MonthlySalesChart = ({ customerId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ salesPerson: null, category: null });

  const categoriesSet = new Set();
  const monthsSet = new Set();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.salesPerson)
        params.append("salesPerson", filters.salesPerson.value);
      if (filters.category) params.append("category", filters.category.value);

      const res = await fetch(
        `/api/customers/${customerId}/monthly-sales?${params}`
      );
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("Failed to fetch sales data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [customerId, filters]);

  // Build months and categories
  data.forEach(({ month, category }) => {
    monthsSet.add(month);
    categoriesSet.add(category);
  });

  const months = Array.from(monthsSet);
  const categories = Array.from(categoriesSet);
  const totalSalesByMonth = {};

  // Compute dataset for each category
  const datasets = categories.map((cat, index) => {
    const colorPalette = [
      "#0d6efd",
      "#198754",
      "#ffc107",
      "#6f42c1",
      "#d63384",
      "#fd7e14",
      "#6c757d",
    ];
    const bgColor = colorPalette[index % colorPalette.length];

    const categorySales = months.map((month) => {
      const entry = data.find((d) => d.month === month && d.category === cat);
      const sales = entry ? entry.sales : 0;
      totalSalesByMonth[month] = (totalSalesByMonth[month] || 0) + sales;
      return sales;
    });

    return {
      label: cat,
      data: categorySales,
      backgroundColor: bgColor,
      stack: "Sales",
    };
  });

  // Chart config
  const chartData = {
    labels: months,
    datasets,
  };

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          footer: (items) => {
            const month = items[0].label;
            return `Total: ${formatCurrency(totalSalesByMonth[month])}`;
          },
          label: function (context) {
            const value = context.raw;
            const month = context.label;
            const percent = ((value / totalSalesByMonth[month]) * 100).toFixed(
              1
            );
            return `${context.dataset.label}: ${formatCurrency(value)} (${percent}%)`;
          },
        },
      },
      legend: {
        position: "top",
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: "Sales (INR)",
        },
      },
    },
  };

  return (
    <div className="bg-white rounded shadow-sm p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">Monthly Sales by Category</h5>
        <Button
          variant="outline-primary"
          onClick={() => setFilters({ salesPerson: null, category: null })}
        >
          Reset Filters
        </Button>
      </div>

      {/* Add your filter UI here like category/salesperson dropdown */}
      <div className="mb-3 d-flex gap-3">
        <Select
          placeholder="Filter by Salesperson"
          value={filters.salesPerson}
          onChange={(option) =>
            setFilters((prev) => ({ ...prev, salesPerson: option }))
          }
          options={[
            // Replace with API response
            { label: "101 - John", value: 101 },
            { label: "102 - Sarah", value: 102 },
          ]}
          isClearable
        />
        <Select
          placeholder="Filter by Category"
          value={filters.category}
          onChange={(option) =>
            setFilters((prev) => ({ ...prev, category: option }))
          }
          options={[
            { label: "API", value: "API" },
            { label: "Solvents", value: "Solvents" },
          ]}
          isClearable
        />
      </div>

      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" />
          <p className="mt-2">Loading sales data...</p>
        </div>
      ) : (
        <div style={{ height: "500px" }}>
          <Bar data={chartData} options={options} />
        </div>
      )}
    </div>
  );
};

export default MonthlySalesChart;
