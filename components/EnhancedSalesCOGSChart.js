
// // src/components/EnhancedSalesCOGSChart.js
// import React, { useState, useEffect, useRef } from 'react';
// import { Bar } from 'react-chartjs-2';
// import { Card, Table, Spinner, Dropdown } from 'react-bootstrap';
// import AllFilter from "components/AllFilters.js";
// import Select from "react-select";
// import {

//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   LineElement,
//   PointElement,
//   LineController
// } from 'chart.js';
// import ChartDataLabels from 'chartjs-plugin-datalabels';
// import { formatCurrency } from 'utils/formatCurrency';
// import { useAuth } from '../contexts/AuthContext';

// // Register ChartJS components
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   LineElement,
//   PointElement,
//   Title,
//   Tooltip,
//   Legend,
//   LineController,
//   ChartDataLabels
// );

// const EnhancedSalesCOGSChart = () => {
//   const [salesData, setSalesData] = useState([]);
//   const [availableYears, setAvailableYears] = useState([]);
//   const [selectedFinancialYear, setSelectedFinancialYear] = useState(null);
//   const [financialYears, setFinancialYears] = useState([]);
//   const { user } = useAuth();
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const tableContainerRef = useRef(null);

//   const [filters, setFilters] = useState({
//     salesPerson: null,
//     contactPerson: null,
//     category: null,
//     product: null,
//     customer: null
//   });

//   // Helper function to get current financial year
//   const getCurrentFinancialYear = () => {
//     const now = new Date();
//     const currentYear = now.getFullYear();
//     const currentMonth = now.getMonth(); // 0-based, so April = 3
    
//     // If current month is April or later, FY is current year to next year
//     // If current month is before April, FY is previous year to current year
//     if (currentMonth >= 3) { // April or later
//       return `${currentYear}-${currentYear + 1}`;
//     } else {
//       return `${currentYear - 1}-${currentYear}`;
//     }
//   };

//   // Generate financial years from available calendar years
//   // const generateFinancialYears = (years) => {
//   //   if (!years || years.length === 0) return [];
    
//   //   const fySet = new Set();
    
//   //   years.forEach(year => {
//   //     // Each calendar year can belong to two financial years
//   //     fySet.add(`${year - 1}-${year}`); // FY ending in this year
//   //     fySet.add(`${year}-${year + 1}`); // FY starting in this year
//   //   });
    
//   //   // Convert to array and sort in descending order
//   //   return Array.from(fySet)
//   //     .sort((a, b) => {
//   //       const aStart = parseInt(a.split('-')[0]);
//   //       const bStart = parseInt(b.split('-')[0]);
//   //       return bStart - aStart;
//   //     });
//   // };

//   const generateFinancialYears = (years) => {
//   if (!years || years.length === 0) return [];
  
//   const fySet = new Set();
  
//   years.forEach(year => {
//     // Each calendar year can belong to two financial years
//     fySet.add(`${year - 1}-${year}`); // FY ending in this year
//     fySet.add(`${year}-${year + 1}`); // FY starting in this year
//   });
  
//   return Array.from(fySet)
//     .sort((a, b) => {
//       const aStart = parseInt(a.split('-')[0]);
//       const bStart = parseInt(b.split('-')[0]);
//       return bStart - aStart;
//     });
// };


//   // Filter sales data based on selected financial year
//   const filterDataByFinancialYear = (data, fy) => {
//     if (!fy || !data) return data;
    
//     const [startYear, endYear] = fy.split('-').map(Number);
    
//     return data.filter(item => {
//       const year = item.year;
//       const month = item.monthNumber;
      
//       // Financial year runs from April to March
//       if (month >= 4) {
//         // April to December - should be in starting year of FY
//         return year === startYear;
//       } else {
//         // January to March - should be in ending year of FY
//         return year === endYear;
//       }
//     });
//   };

//   const fetchSalesData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const queryParams = new URLSearchParams();
//       if (filters.salesPerson?.value) {
//         queryParams.append('slpCode', filters.salesPerson.value);
//       }
//       if (filters.category?.value) {
//         queryParams.append('itmsGrpCod', filters.category.value);
//       }
//       if (filters.product?.value) {
//         queryParams.append('itemCode', filters.product.value);
//       }
//       if (filters.contactPerson?.value) {
//         queryParams.append('cntctCode', filters.contactPerson.value);
//       }
//       if (filters.customer?.value) {
//         queryParams.append('cardCode', filters.customer.value);
//       }

//       const token = localStorage.getItem('token');
//       const response = await fetch(`/api/sales-cogs?${queryParams}`, {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       const responseJson = await response.json();
//       const { data, availableYears: years } = responseJson;

//       if (!response.ok) {
//         throw new Error(data?.error || 'Failed to fetch data');
//       }

//       // Sort data by year then month
//       const sortedData = data.sort((a, b) => {
//         if (a.year !== b.year) {
//           return a.year - b.year;
//         }
//         return a.monthNumber - b.monthNumber;
//       });

//       setSalesData(sortedData);
//       setAvailableYears(years);

//       // Generate financial years and set default
//       const fyList = generateFinancialYears(years);
//       setFinancialYears(fyList);
      
//       // Set current financial year as default if not already selected
//       if (!selectedFinancialYear && fyList.length > 0) {
//         const currentFY = getCurrentFinancialYear();
//         const defaultFY = fyList.includes(currentFY) ? currentFY : fyList[0];
//         setSelectedFinancialYear(defaultFY);
//       }

//     } catch (error) {
//       console.error('Error fetching sales data:', error);
//       setError(error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (!user) return;

//     const hasToken = localStorage.getItem("token");
//     if (hasToken) {
//       fetchSalesData();
//     }
//   }, [user, filters]);

//   // Filter data based on selected financial year
//   const filteredSalesData = selectedFinancialYear 
//     ? filterDataByFinancialYear(salesData, selectedFinancialYear)
//     : salesData;

//   // Scroll to right side when data changes
//   useEffect(() => {
//     if (tableContainerRef.current && filteredSalesData.length > 0) {
//       tableContainerRef.current.scrollLeft = tableContainerRef.current.scrollWidth;
//     }
//   }, [filteredSalesData]);

//   // Prepare x-axis labels
//   const labels = filteredSalesData.map((d) => d.monthYear);

//   // Calculate totals, still used by the table
//   const totalSales = filteredSalesData.reduce((acc, curr) => acc + (curr.totalSales || 0), 0);
//   const totalCOGS = filteredSalesData.reduce((acc, curr) => acc + (curr.totalCogs || 0), 0);
//   const averageGrossMargin =
//     totalSales > 0 ? ((totalSales - totalCOGS) / totalSales) * 100 : 0;

//   // Distinct bar colors
//   const colorPalette = {
//     salesBarColor: "#124f94",
//     cogsBarColor: "#3bac4e",
//     gmLineColor: "#3bac4e",
//     orderValueColor: "#F39C12",
//   };

//   // Sales dataset
//   const salesDataset = {
//     label: 'Sales',
//     data: filteredSalesData.map((d) => d.totalSales || 0),
//     backgroundColor: colorPalette.salesBarColor,
//     borderWidth: 1
//   };


// // Add the Order Value dataset
// const orderValueDataset = {
//   label: 'Order Value',
//   data: filteredSalesData.map((d) => d.orderValue || 0),
//   backgroundColor: colorPalette.orderValueColor,
//   borderWidth: 1
// };



//   // COGS dataset (only if admin)
//   const cogsDataset = {
//     label: 'COGS',
//     data: filteredSalesData.map((d) => d.totalCogs || 0),
//     backgroundColor: colorPalette.cogsBarColor,
//     borderWidth: 1
//   };

//   const invoiceCountDataset = {
//     label: "Lines",
//     data: filteredSalesData.map((d) => d.invoiceCount || 0),
//     borderWidth: 1,
//     backgroundColor: "#219cba",
//     yAxisID: "y2",
//   };

//   // Gross Margin % (line)
//   const gmPercentDataset = {
//     label: 'GM%',
//     data: filteredSalesData.map((d) => d.grossMarginPct || 0),
//     type: 'line',
//     borderColor: colorPalette.gmLineColor,
//     backgroundColor: colorPalette.gmLineColor,
//     borderWidth: 2,
//     fill: false,
//     yAxisID: 'y1',
//     tension: 0.4,
//     pointRadius: 4,
//     pointHoverRadius: 6,
//   };

//   let finalDatasets = [salesDataset, orderValueDataset,invoiceCountDataset];
//   if (user?.role === 'admin' || user?.role === 'sales_person') {
//     finalDatasets = [
//       invoiceCountDataset,
//       salesDataset,
//       orderValueDataset,
//       cogsDataset,
//       gmPercentDataset,

//     ];
//   }

//   const chartData = {
//     labels,
//     datasets: finalDatasets
//   };

//   const chartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     layout: {
//       padding: {
//         left: 20,
//         right: 20,
//       }
//     },
//     plugins: {
//       datalabels: {
//         display: false,
//       },
//       tooltip: {
//         callbacks: {
//           label: (context) => {
//             const datasetLabel = context.dataset.label;
//             const rawValue = context.raw;

//             if (datasetLabel === "GM%") {
//               return `GM%: ${rawValue.toFixed(2)}%`;
//             }
//             if (datasetLabel === "Lines") {
//               return `Lines: ${rawValue}`;
//             }
//             return `${datasetLabel}: ${formatCurrency(rawValue)}`;
//           },
//         },
//       },
//       legend: {
//         position: "top",
//         labels: {
//           font: {
//             family: "'Inter', sans-serif",
//             size: 13,
//           },
//           padding: 20,
//         },
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         min: 0,
//         ticks: {
//           callback: (value) => formatCurrency(value),
//           font: { family: "'Inter', sans-serif", size: 12 },
//         },
//         grid: { color: "rgba(0, 0, 0, 0.05)" },
//       },
//       y1: {
//         position: "right",
//         beginAtZero: true,
//         min: 0,
//         ticks: {
//           callback: (value) => `${value}%`,
//           font: { family: "'Inter', sans-serif", size: 12 },
//         },
//         grid: {
//           drawOnChartArea: false,
//         },
//       },
//       y2: {
//         position: "right",
//         beginAtZero: true,
//         min: 0,
//         offset: false,
//         ticks: { callback: (v) => v },
//         grid: { drawOnChartArea: false },
//       },
//       x: {
//         grid: { display: false },
//         ticks: {
//           font: { family: "'Inter', sans-serif", size: 12 },
//         },
//         barPercentage: 0.8,
//         categoryPercentage: 0.9,
//       },
//     },
//   };

//   return (
//     <Card className="shadow-sm border-0 mb-4">
//       <Card.Header className="bg-white py-3">
//         <div className="d-flex justify-content-between align-items-center">
//           <h4
//             className="mb-3 mb-md-0"
//             style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}
//           >
//             Sales
//           </h4>
//           <div className="d-flex align-items-center gap-3">
//             {/* Financial Year Dropdown */}
//             {/* <Dropdown>
//               <Dropdown.Toggle 
//                 variant="outline-primary" 
//                 id="financial-year-dropdown"
//                 size="sm"
//                 style={{ minWidth: '120px' }}
//               >
//                 FY {selectedFinancialYear || 'Select'}
//               </Dropdown.Toggle>
//               <Dropdown.Menu>
//                 {financialYears.map((fy) => (
//                   <Dropdown.Item
//                     key={fy}
//                     active={selectedFinancialYear === fy}
//                     onClick={() => setSelectedFinancialYear(fy)}
//                   >
//                     FY {fy}
//                   </Dropdown.Item>
//                 ))}
//               </Dropdown.Menu>
//             </Dropdown> */}
//             {/* Financial Year Dropdown */}
// <div style={{ minWidth: "180px" }}>
//   <Select
//     options={financialYears.map((fy) => ({
//       value: fy,
//       label: `FY ${fy}`,
//     }))}
//     value={
//       selectedFinancialYear
//         ? { value: selectedFinancialYear, label: `FY ${selectedFinancialYear}` }
//         : null
//     }
//     onChange={(option) => setSelectedFinancialYear(option.value)}
//     placeholder="Select FY"
//     isClearable={false}
//     styles={{
//       control: (base) => ({
//         ...base,
//         minHeight: "38px",
//         fontSize: "14px",
//         borderRadius: "6px",
//       }),
//       menu: (base) => ({
//         ...base,
//         fontSize: "14px",
//       }),
//     }}
//   />
// </div>

//             {/* Existing All Filter */}
//             <AllFilter
//               allowedTypes={["sales-person", "contact-person", "product", "category", "customer"]}
//               searchQuery={searchQuery}
//               setSearchQuery={(value) => {
//                 if (value) {
//                   setFilters((prev) => ({
//                     ...prev,
//                     [value.type === "sales-person"
//                       ? "salesPerson"
//                       : value.type === "contact-person"
//                       ? "contactPerson"
//                       : value.type]: {
//                       value: value.value,
//                       label: value.label,
//                     },
//                   }));
//                 } else {
//                   setFilters({
//                     salesPerson: null,
//                     contactPerson: null,
//                     category: null,
//                     product: null,
//                     customer: null,
//                   });
//                 }
//               }}
//             />
//           </div>
//         </div>
//       </Card.Header>

//       <Card.Body>
//         {error && (
//           <p className="text-center mt-4 text-danger">Error: {error}</p>
//         )}
//         {loading ? (
//           <div
//             className="d-flex justify-content-center align-items-center"
//             style={{ height: "500px" }}
//           >
//             <Spinner animation="border" role="status" className="me-2">
//               <span className="visually-hidden">Loading...</span>
//             </Spinner>
//             <span>Loading chart data...</span>
//           </div>
//         ) : filteredSalesData.length ? (
//           <>
//             <div
//               className="chart-container"
//               style={{ height: "500px", width: "100%", overflow: "visible" }}
//             >
//               <Bar data={chartData} options={chartOptions} />
//             </div>

//             {/* Table with right-side initial scroll */}
//             <div className="mt-4">
//               <div 
//                 ref={tableContainerRef}
//                 style={{ 
//                   overflowX: 'auto',
//                   direction: 'rtl'
//                 }}
//               >
//                 <Table 
//                   striped 
//                   bordered 
//                   hover 
//                   responsive={false}
//                   style={{ 
//                     direction: 'ltr',
//                     minWidth: '100%',
//                     whiteSpace: 'nowrap'
//                   }}
//                 >
//                   <thead>
//                     <tr>
//                       <th>Metric</th>
//                       {labels.map((label, idx) => (
//                         <th key={idx}>{label}</th>
//                       ))}
//                       <th>Total</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     <tr>
//                       <td>Sales</td>
//                       {filteredSalesData.map((data, index) => (
//                         <td key={index}>
//                           {formatCurrency(data.totalSales || 0)}
//                         </td>
//                       ))}
//                       <td>{formatCurrency(totalSales)}</td>
//                     </tr>
//                     {(user?.role === 'admin' || user?.role === 'sales_person') && (
//                       <>
//                         <tr>
//                           <td>COGS</td>
//                           {filteredSalesData.map((data, index) => (
//                             <td key={index}>
//                               {formatCurrency(data.totalCogs || 0)}
//                             </td>
//                           ))}
//                           <td>{formatCurrency(totalCOGS)}</td>
//                         </tr>
//                         <tr>
//                           <td>GM %</td>
//                           {filteredSalesData.map((data, index) => (
//                             <td key={index}>
//                               {`${(data.grossMarginPct || 0).toFixed(2)}%`}
//                             </td>
//                           ))}
//                           <td>{`${averageGrossMargin.toFixed(2)}%`}</td>
//                         </tr>
//                       </>
//                     )}
//                     <tr>
//                       <td>Lines</td>
//                       {filteredSalesData.map((data, index) => (
//                         <td key={index}>{data.invoiceCount || 0}</td>
//                       ))}
//                       <td>
//                         {filteredSalesData.reduce(
//                           (sum, d) => sum + (d.invoiceCount || 0),
//                           0
//                         )}
//                       </td>
//                     </tr>
//                     <tr>
//                       <td>Order Value</td>
//                       {filteredSalesData.map((data, index) => (
//                         <td key={index}>
//                           {formatCurrency(data.orderValue || 0)}
//                         </td>
//                       ))}
//                       <td>
//                         {formatCurrency(
//                           filteredSalesData.reduce((sum, d) => sum + (d.orderValue || 0), 0)
//                         )}
//                       </td>
//                     </tr>
//                   </tbody>
//                 </Table>
//               </div>
//             </div>
//           </>
//         ) : (
//           <p className="text-center mt-4">
//             No data available for the selected financial year.
//           </p>
//         )}
//       </Card.Body>
//     </Card>
//   );
// };

// export default EnhancedSalesCOGSChart;

// src/components/EnhancedSalesCOGSChart.js
import React, { useState, useEffect, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, Table, Spinner, Dropdown } from 'react-bootstrap';
import AllFilter from "components/AllFilters.js";
import Select from "react-select";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LineController
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { formatCurrency } from 'utils/formatCurrency';
import { useAuth } from '../contexts/AuthContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  ChartDataLabels
);

const EnhancedSalesCOGSChart = () => {
  const [salesData, setSalesData] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState(null);
  const [financialYears, setFinancialYears] = useState([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const tableContainerRef = useRef(null);

  const [filters, setFilters] = useState({
    salesPerson: null,
    contactPerson: null,
    category: null,
    product: null,
    customer: null
  });

  // Check user roles
  const isAdmin = user?.role === 'admin';
  const isSalesPerson = user?.role === 'sales_person';
  const is3ASenrise = user?.role === '3ASenrise';
  
  // Show GM% and COGS for admin, sales_person, AND 3ASenrise
  const shouldShowGMAndCOGS = isAdmin || isSalesPerson || is3ASenrise;

  // Helper function to get current financial year
  const getCurrentFinancialYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-based, so April = 3
    
    // If current month is April or later, FY is current year to next year
    // If current month is before April, FY is previous year to current year
    if (currentMonth >= 3) { // April or later
      return `${currentYear}-${currentYear + 1}`;
    } else {
      return `${currentYear - 1}-${currentYear}`;
    }
  };

  // Generate financial years from available calendar years
  const generateFinancialYears = (years) => {
    if (!years || years.length === 0) return [];
    
    const fySet = new Set();
    
    years.forEach(year => {
      // Each calendar year can belong to two financial years
      fySet.add(`${year - 1}-${year}`); // FY ending in this year
      fySet.add(`${year}-${year + 1}`); // FY starting in this year
    });
    
    return Array.from(fySet)
      .sort((a, b) => {
        const aStart = parseInt(a.split('-')[0]);
        const bStart = parseInt(b.split('-')[0]);
        return bStart - aStart;
      });
  };

  // Filter sales data based on selected financial year
  const filterDataByFinancialYear = (data, fy) => {
    if (!fy || !data) return data;
    
    const [startYear, endYear] = fy.split('-').map(Number);
    
    return data.filter(item => {
      const year = item.year;
      const month = item.monthNumber;
      
      // Financial year runs from April to March
      if (month >= 4) {
        // April to December - should be in starting year of FY
        return year === startYear;
      } else {
        // January to March - should be in ending year of FY
        return year === endYear;
      }
    });
  };

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters.salesPerson?.value) {
        queryParams.append('slpCode', filters.salesPerson.value);
      }
      if (filters.category?.value) {
        queryParams.append('itmsGrpCod', filters.category.value);
      }
      if (filters.product?.value) {
        queryParams.append('itemCode', filters.product.value);
      }
      if (filters.contactPerson?.value) {
        queryParams.append('cntctCode', filters.contactPerson.value);
      }
      if (filters.customer?.value) {
        queryParams.append('cardCode', filters.customer.value);
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sales-cogs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || `Failed to fetch data: ${response.status}`);
      }

      const responseJson = await response.json();
      const { data, availableYears: years } = responseJson;

      // Sort data by year then month
      const sortedData = data.sort((a, b) => {
        if (a.year !== b.year) {
          return a.year - b.year;
        }
        return a.monthNumber - b.monthNumber;
      });

      setSalesData(sortedData);
      setAvailableYears(years);

      // Generate financial years and set default
      const fyList = generateFinancialYears(years);
      setFinancialYears(fyList);
      
      // Set current financial year as default if not already selected
      if (!selectedFinancialYear && fyList.length > 0) {
        const currentFY = getCurrentFinancialYear();
        const defaultFY = fyList.includes(currentFY) ? currentFY : fyList[0];
        setSelectedFinancialYear(defaultFY);
      }

    } catch (error) {
      console.error('Error fetching sales data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const hasToken = localStorage.getItem("token");
    if (hasToken) {
      fetchSalesData();
    }
  }, [user, filters]);

  // Filter data based on selected financial year
  const filteredSalesData = selectedFinancialYear 
    ? filterDataByFinancialYear(salesData, selectedFinancialYear)
    : salesData;

  // Scroll to right side when data changes
  useEffect(() => {
    if (tableContainerRef.current && filteredSalesData.length > 0) {
      tableContainerRef.current.scrollLeft = tableContainerRef.current.scrollWidth;
    }
  }, [filteredSalesData]);

  // Prepare x-axis labels
  const labels = filteredSalesData.map((d) => d.monthYear);

  // Calculate totals, still used by the table
  const totalSales = filteredSalesData.reduce((acc, curr) => acc + (curr.totalSales || 0), 0);
  const totalCOGS = filteredSalesData.reduce((acc, curr) => acc + (curr.totalCogs || 0), 0);
  const averageGrossMargin =
    totalSales > 0 ? ((totalSales - totalCOGS) / totalSales) * 100 : 0;

  // Distinct bar colors
  const colorPalette = {
    salesBarColor: "#124f94",
    cogsBarColor: "#3bac4e",
    gmLineColor: "#3bac4e",
    orderValueColor: "#F39C12",
  };

  // Sales dataset
  const salesDataset = {
    label: 'Sales',
    data: filteredSalesData.map((d) => d.totalSales || 0),
    backgroundColor: colorPalette.salesBarColor,
    borderWidth: 1
  };

  // Order Value dataset
  const orderValueDataset = {
    label: 'Order Value',
    data: filteredSalesData.map((d) => d.orderValue || 0),
    backgroundColor: colorPalette.orderValueColor,
    borderWidth: 1
  };

  // COGS dataset (show for admin, sales_person, AND 3ASenrise)
  const cogsDataset = {
    label: 'COGS',
    data: filteredSalesData.map((d) => d.totalCogs || 0),
    backgroundColor: colorPalette.cogsBarColor,
    borderWidth: 1
  };

  const invoiceCountDataset = {
    label: "Lines",
    data: filteredSalesData.map((d) => d.invoiceCount || 0),
    borderWidth: 1,
    backgroundColor: "#219cba",
    yAxisID: "y2",
  };

  // Gross Margin % (line)
  const gmPercentDataset = {
    label: 'GM%',
    data: filteredSalesData.map((d) => d.grossMarginPct || 0),
    type: 'line',
    borderColor: colorPalette.gmLineColor,
    backgroundColor: colorPalette.gmLineColor,
    borderWidth: 2,
    fill: false,
    yAxisID: 'y1',
    tension: 0.4,
    pointRadius: 4,
    pointHoverRadius: 6,
  };

  // Build datasets based on user role
  let finalDatasets = [];
  
  if (shouldShowGMAndCOGS) {
    // For admin, sales_person, and 3ASenrise: show all datasets
    finalDatasets = [
      invoiceCountDataset,
      salesDataset,
      orderValueDataset,
      cogsDataset,
      gmPercentDataset,
    ];
  } else {
    // For other users: show only basic datasets
    finalDatasets = [salesDataset, orderValueDataset, invoiceCountDataset];
  }

  const chartData = {
    labels,
    datasets: finalDatasets
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 20,
        right: 20,
      }
    },
    plugins: {
      datalabels: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const datasetLabel = context.dataset.label;
            const rawValue = context.raw;

            if (datasetLabel === "GM%") {
              return `GM%: ${rawValue.toFixed(2)}%`;
            }
            if (datasetLabel === "Lines") {
              return `Lines: ${rawValue}`;
            }
            return `${datasetLabel}: ${formatCurrency(rawValue)}`;
          },
        },
      },
      legend: {
        position: "top",
        labels: {
          font: {
            family: "'Inter', sans-serif",
            size: 13,
          },
          padding: 20,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        ticks: {
          callback: (value) => formatCurrency(value),
          font: { family: "'Inter', sans-serif", size: 12 },
        },
        grid: { color: "rgba(0, 0, 0, 0.05)" },
      },
      y1: {
        position: "right",
        beginAtZero: true,
        min: 0,
        ticks: {
          callback: (value) => `${value}%`,
          font: { family: "'Inter', sans-serif", size: 12 },
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      y2: {
        position: "right",
        beginAtZero: true,
        min: 0,
        offset: false,
        ticks: { callback: (v) => v },
        grid: { drawOnChartArea: false },
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 12 },
        },
        barPercentage: 0.8,
        categoryPercentage: 0.9,
      },
    },
  };

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-white py-3">
        <div className="d-flex justify-content-between align-items-center">
          <h4
            className="mb-3 mb-md-0"
            style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}
          >
            Sales
          </h4>
          <div className="d-flex align-items-center gap-3">
            {/* Financial Year Dropdown */}
            <div style={{ minWidth: "180px" }}>
              <Select
                options={financialYears.map((fy) => ({
                  value: fy,
                  label: `FY ${fy}`,
                }))}
                value={
                  selectedFinancialYear
                    ? { value: selectedFinancialYear, label: `FY ${selectedFinancialYear}` }
                    : null
                }
                onChange={(option) => setSelectedFinancialYear(option.value)}
                placeholder="Select FY"
                isClearable={false}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "38px",
                    fontSize: "14px",
                    borderRadius: "6px",
                  }),
                  menu: (base) => ({
                    ...base,
                    fontSize: "14px",
                  }),
                }}
              />
            </div>

            {/* Only show AllFilter for admin and sales_person, NOT for 3ASenrise */}
            {!is3ASenrise && (
              <AllFilter
                allowedTypes={["sales-person", "contact-person", "product", "category", "customer"]}
                searchQuery={searchQuery}
                setSearchQuery={(value) => {
                  if (value) {
                    setFilters((prev) => ({
                      ...prev,
                      [value.type === "sales-person"
                        ? "salesPerson"
                        : value.type === "contact-person"
                        ? "contactPerson"
                        : value.type]: {
                        value: value.value,
                        label: value.label,
                      },
                    }));
                  } else {
                    setFilters({
                      salesPerson: null,
                      contactPerson: null,
                      category: null,
                      product: null,
                      customer: null,
                    });
                  }
                }}
              />
            )}
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        {error && (
          <p className="text-center mt-4 text-danger">Error: {error}</p>
        )}
        {loading ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: "500px" }}
          >
            <Spinner animation="border" role="status" className="me-2">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <span>Loading chart data...</span>
          </div>
        ) : filteredSalesData.length ? (
          <>
            <div
              className="chart-container"
              style={{ height: "500px", width: "100%", overflow: "visible" }}
            >
              <Bar data={chartData} options={chartOptions} />
            </div>

            {/* Table with right-side initial scroll */}
            <div className="mt-4">
              <div 
                ref={tableContainerRef}
                style={{ 
                  overflowX: 'auto',
                  direction: 'rtl'
                }}
              >
                <Table 
                  striped 
                  bordered 
                  hover 
                  responsive={false}
                  style={{ 
                    direction: 'ltr',
                    minWidth: '100%',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <thead>
                    <tr>
                      <th>Metric</th>
                      {labels.map((label, idx) => (
                        <th key={idx}>{label}</th>
                      ))}
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Sales</td>
                      {filteredSalesData.map((data, index) => (
                        <td key={index}>
                          {formatCurrency(data.totalSales || 0)}
                        </td>
                      ))}
                      <td>{formatCurrency(totalSales)}</td>
                    </tr>
                    
                    {/* Show COGS row for admin, sales_person, AND 3ASenrise */}
                    {shouldShowGMAndCOGS && (
                      <>
                        <tr>
                          <td>COGS</td>
                          {filteredSalesData.map((data, index) => (
                            <td key={index}>
                              {formatCurrency(data.totalCogs || 0)}
                            </td>
                          ))}
                          <td>{formatCurrency(totalCOGS)}</td>
                        </tr>
                        <tr>
                          <td>GM %</td>
                          {filteredSalesData.map((data, index) => (
                            <td key={index}>
                              {`${(data.grossMarginPct || 0).toFixed(2)}%`}
                            </td>
                          ))}
                          <td>{`${averageGrossMargin.toFixed(2)}%`}</td>
                        </tr>
                      </>
                    )}
                    
                    <tr>
                      <td>Lines</td>
                      {filteredSalesData.map((data, index) => (
                        <td key={index}>{data.invoiceCount || 0}</td>
                      ))}
                      <td>
                        {filteredSalesData.reduce(
                          (sum, d) => sum + (d.invoiceCount || 0),
                          0
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>Order Value</td>
                      {filteredSalesData.map((data, index) => (
                        <td key={index}>
                          {formatCurrency(data.orderValue || 0)}
                        </td>
                      ))}
                      <td>
                        {formatCurrency(
                          filteredSalesData.reduce((sum, d) => sum + (d.orderValue || 0), 0)
                        )}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center mt-4">
            No data available for the selected financial year.
          </p>
        )}
      </Card.Body>
    </Card>
  );
};

export default EnhancedSalesCOGSChart;