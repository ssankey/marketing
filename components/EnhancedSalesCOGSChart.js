

// // src/components/EnhancedSalesCOGSChart.js
// import React, { useState, useEffect } from 'react';
// import { Bar } from 'react-chartjs-2';
// import { Card, Table, Spinner } from 'react-bootstrap';
// import AllFilter from "components/AllFilters.js";
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
//   const { user } = useAuth();
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');

//   const [filters, setFilters] = useState({
//     salesPerson: null,
//      contactPerson: null,
//     category: null,
//     product: null,
//     customer: null
//   });

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
//        if (filters.customer?.value) {  // Add this
//       queryParams.append('cardCode', filters.customer.value);
//     }

//       const token = localStorage.getItem('token');
//       const response = await fetch(`/api/sales-cogs?${queryParams}`, {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       const responseJson = await response.json();
//       const { data } = responseJson;

//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to fetch data');
//       }

//       // Sort data by year then month
//       const sortedData = data.sort((a, b) => {
//         if (a.year !== b.year) {
//           return a.year - b.year;
//         }
//         return a.monthNumber - b.monthNumber;
//       });

//       setSalesData(sortedData);
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

//   // Prepare x-axis labels
//   const labels = salesData.map((d) => d.monthYear);

//   // Calculate totals, still used by the table
//   const totalSales = salesData.reduce((acc, curr) => acc + (curr.totalSales || 0), 0);
//   const totalCOGS = salesData.reduce((acc, curr) => acc + (curr.totalCogs || 0), 0);
//   const averageGrossMargin =
//     totalSales > 0 ? ((totalSales - totalCOGS) / totalSales) * 100 : 0;

//   // Distinct bar colors
//   const colorPalette = {
//     salesBarColor: "#124f94",
//     cogsBarColor: "#3bac4e",
//     gmLineColor: "#3bac4e",
//   };

//   // Sales dataset
//   const salesDataset = {
//     label: 'Sales',
//     data: salesData.map((d) => d.totalSales || 0),
//     backgroundColor: colorPalette.salesBarColor,
//     borderWidth: 1
//   };

//   // COGS dataset (only if admin)
//   const cogsDataset = {
//     label: 'COGS',
//     data: salesData.map((d) => d.totalCogs || 0),
//     backgroundColor: colorPalette.cogsBarColor,
//     borderWidth: 1
//   };

//   const invoiceCountDataset = {
//     label: "Lines",
//     data: salesData.map((d) => d.invoiceCount || 0),
//     borderWidth: 1,
//     backgroundColor: "#219cba",
//     yAxisID: "y2",
//   };

//   // Gross Margin % (line)
//   const gmPercentDataset = {
//     label: 'GM%',
//     data: salesData.map((d) => d.grossMarginPct || 0),
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

//   let finalDatasets = [salesDataset, invoiceCountDataset];
//   if (user?.role === 'admin'  || user?.role === 'sales_person') {
//     finalDatasets = [
//       invoiceCountDataset,
//       salesDataset,
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
//         left: 20,  // Add left padding
//         right: 20, // Add right padding
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

//             if (datasetLabel === "GM %") {
//               return `GM%: ${rawValue.toFixed(2)}%`;
//             }
//             if (datasetLabel === "Lines") {

//               return `Lines: ${rawValue}`; // Just show the number
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
//         // invoice count
//         position: "right",
//         beginAtZero: true,
//         min: 0,
//         offset: false, // pushes labels a little further right
//         ticks: { callback: (v) => v },
//         grid: { drawOnChartArea: false },
//       },
//       x: {
//         grid: { display: false },
//         ticks: {
//           font: { family: "'Inter', sans-serif", size: 12 },
//         },
//         // Add these options to improve bar width and spacing
//         barPercentage: 0.8,  // Controls the width of the bars
//         categoryPercentage: 0.9, // Controls the spacing between bars
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
//           <div className="ms-auto">
//             {/* <AllFilter
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
//                   });
//                 }
//               }}
//             /> */}
//             <AllFilter
//             allowedTypes={["sales-person", "contact-person", "product", "category", "customer"]}
//             searchQuery={searchQuery}
//             setSearchQuery={(value) => {
//               if (value) {
//                 setFilters((prev) => ({
//                   ...prev,
//                   [value.type === "sales-person"
//                     ? "salesPerson"
//                     : value.type === "contact-person"
//                     ? "contactPerson"
//                     : value.type]: {
//                     value: value.value,
//                     label: value.label,
//                   },
//                 }));
//               } else {
//                 setFilters({
//                   salesPerson: null,
//                   contactPerson: null,
//                   category: null,
//                   product: null,
//                 });
//               }
//             }}
//           />

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
//         ) : salesData.length ? (
//           <>
//             <div
//               className="chart-container"
//               style={{ height: "500px", width: "100%", overflow: "visible" }}
//             >
//               <Bar data={chartData} options={chartOptions} />
//             </div>

//             {/* Table still shows totals */}
//             <div className="mt-4">
//               <Table striped bordered hover responsive>
//                 <thead>
//                   <tr>
//                     <th>Metric</th>
//                     {labels.map((label, idx) => (
//                       <th key={idx}>{label}</th>
//                     ))}
//                     <th>Total</th> {/* Additional column to display total */}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   <tr>
//                     <td>Sales</td>
//                     {salesData.map((data, index) => (
//                       <td key={index}>
//                         {formatCurrency(data.totalSales || 0)}
//                       </td>
//                     ))}
//                     <td>{formatCurrency(totalSales)}</td>
//                   </tr>
//                   {user?.role === "admin" && (
//                     <>
//                       <tr>
//                         <td>COGS</td>
//                         {salesData.map((data, index) => (
//                           <td key={index}>
//                             {formatCurrency(data.totalCogs || 0)}
//                           </td>
//                         ))}
//                         <td>{formatCurrency(totalCOGS)}</td>
//                       </tr>
//                       <tr>
//                         <td>GM %</td>
//                         {salesData.map((data, index) => (
//                           <td key={index}>
//                             {`${(data.grossMarginPct || 0).toFixed(2)}%`}
//                           </td>
//                         ))}
//                         <td>{`${averageGrossMargin.toFixed(2)}%`}</td>
//                       </tr>
//                       {/* <tr>
//                         <td>Lines</td>
//                         {salesData.map((data, index) => (
//                           <td key={index}>{data.invoiceCount || 0}</td>
//                         ))}
//                         <td>
//                           {salesData.reduce(
//                             (sum, d) => sum + (d.invoiceCount || 0),
//                             0
//                           )}
//                         </td>
//                       </tr> */}
//                     </>
//                   )}
//                   <tr>
//                     <td>Lines</td>
//                     {salesData.map((data, index) => (
//                       <td key={index}>{data.invoiceCount || 0}</td>
//                     ))}
//                     <td>
//                       {salesData.reduce(
//                         (sum, d) => sum + (d.invoiceCount || 0),
//                         0
//                       )}
//                     </td>
//                   </tr>
//                 </tbody>
//               </Table>
//             </div>
//           </>
//         ) : (
//           <p className="text-center mt-4">No data available.</p>
//         )}
//       </Card.Body>
//     </Card>
//   );
// };

// export default EnhancedSalesCOGSChart;


// src/components/EnhancedSalesCOGSChart.js
import React, { useState, useEffect, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, Table, Spinner } from 'react-bootstrap';
import AllFilter from "components/AllFilters.js";
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
       if (filters.customer?.value) {  // Add this
      queryParams.append('cardCode', filters.customer.value);
    }

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sales-cogs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const responseJson = await response.json();
      const { data } = responseJson;

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch data');
      }

      // Sort data by year then month
      const sortedData = data.sort((a, b) => {
        if (a.year !== b.year) {
          return a.year - b.year;
        }
        return a.monthNumber - b.monthNumber;
      });

      setSalesData(sortedData);
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

  // Scroll to right side when data changes
  useEffect(() => {
    if (tableContainerRef.current && salesData.length > 0) {
      tableContainerRef.current.scrollLeft = tableContainerRef.current.scrollWidth;
    }
  }, [salesData]);

  // Prepare x-axis labels
  const labels = salesData.map((d) => d.monthYear);

  // Calculate totals, still used by the table
  const totalSales = salesData.reduce((acc, curr) => acc + (curr.totalSales || 0), 0);
  const totalCOGS = salesData.reduce((acc, curr) => acc + (curr.totalCogs || 0), 0);
  const averageGrossMargin =
    totalSales > 0 ? ((totalSales - totalCOGS) / totalSales) * 100 : 0;

  // Distinct bar colors
  const colorPalette = {
    salesBarColor: "#124f94",
    cogsBarColor: "#3bac4e",
    gmLineColor: "#3bac4e",
  };

  // Sales dataset
  const salesDataset = {
    label: 'Sales',
    data: salesData.map((d) => d.totalSales || 0),
    backgroundColor: colorPalette.salesBarColor,
    borderWidth: 1
  };

  // COGS dataset (only if admin)
  const cogsDataset = {
    label: 'COGS',
    data: salesData.map((d) => d.totalCogs || 0),
    backgroundColor: colorPalette.cogsBarColor,
    borderWidth: 1
  };

  const invoiceCountDataset = {
    label: "Lines",
    data: salesData.map((d) => d.invoiceCount || 0),
    borderWidth: 1,
    backgroundColor: "#219cba",
    yAxisID: "y2",
  };

  // Gross Margin % (line)
  const gmPercentDataset = {
    label: 'GM%',
    data: salesData.map((d) => d.grossMarginPct || 0),
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

  let finalDatasets = [salesDataset, invoiceCountDataset];
  if (user?.role === 'admin'  || user?.role === 'sales_person') {
    finalDatasets = [
      invoiceCountDataset,
      salesDataset,
      cogsDataset,
      gmPercentDataset,
    ];
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
        left: 20,  // Add left padding
        right: 20, // Add right padding
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

            if (datasetLabel === "GM %") {
              return `GM%: ${rawValue.toFixed(2)}%`;
            }
            if (datasetLabel === "Lines") {

              return `Lines: ${rawValue}`; // Just show the number
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
        // invoice count
        position: "right",
        beginAtZero: true,
        min: 0,
        offset: false, // pushes labels a little further right
        ticks: { callback: (v) => v },
        grid: { drawOnChartArea: false },
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 12 },
        },
        // Add these options to improve bar width and spacing
        barPercentage: 0.8,  // Controls the width of the bars
        categoryPercentage: 0.9, // Controls the spacing between bars
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
          <div className="ms-auto">
            {/* <AllFilter
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
                  });
                }
              }}
            /> */}
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
                });
              }
            }}
          />

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
        ) : salesData.length ? (
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
                      {salesData.map((data, index) => (
                        <td key={index}>
                          {formatCurrency(data.totalSales || 0)}
                        </td>
                      ))}
                      <td>{formatCurrency(totalSales)}</td>
                    </tr>
                    {  (user?.role === 'admin'  || user?.role === 'sales_person') && (
                      <>
                        <tr>
                          <td>COGS</td>
                          {salesData.map((data, index) => (
                            <td key={index}>
                              {formatCurrency(data.totalCogs || 0)}
                            </td>
                          ))}
                          <td>{formatCurrency(totalCOGS)}</td>
                        </tr>
                        <tr>
                          <td>GM %</td>
                          {salesData.map((data, index) => (
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
                      {salesData.map((data, index) => (
                        <td key={index}>{data.invoiceCount || 0}</td>
                      ))}
                      <td>
                        {salesData.reduce(
                          (sum, d) => sum + (d.invoiceCount || 0),
                          0
                        )}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center mt-4">No data available.</p>
        )}
      </Card.Body>
    </Card>
  );
};

export default EnhancedSalesCOGSChart;