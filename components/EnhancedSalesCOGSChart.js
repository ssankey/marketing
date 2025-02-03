



// src/components/EnhancedSalesCOGSChart.js
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import Select from "react-select";
import { Card, Table, Button, Spinner ,Dropdown ,Form } from 'react-bootstrap';
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
    LineController
);

const EnhancedSalesCOGSChart = () => {
    const [salesData, setSalesData] = useState([]);
    const { user } = useAuth(); // Get user info
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

     const [filters, setFilters] = useState({
    salesPerson: null,
    category: null,
    product: null
  });

 // Map full month names to their corresponding 0-indexed month numbers.
const monthMapping = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  };
  
  const formatMonthYear = (year, month) => {
    const monthIndex = monthMapping[month];
    if (monthIndex === undefined) {
      return 'Invalid Date';
    }
    const date = new Date(year, monthIndex);
    return date.toLocaleDateString('default', { month: 'short', year: 'numeric' });
  };
  
    

    const fetchSalesData = async () => {
        try {
            setLoading(true);
            setError(null);

       const queryParams = new URLSearchParams({
      ...(filters.salesPerson && { slpCode: filters.salesPerson }),
      ...(filters.category && { category: filters.category }),
      ...(filters.product && { product: filters.product })
    });

            const token = localStorage.getItem('token');
            // Assuming the API returns data for all years when no "year" query is provided.
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

            // Sort the data chronologically using year and month.
            const sortedData = data.sort((a, b) => {
                const dateA = new Date(a.year, a.month - 1);
                const dateB = new Date(b.year, b.month - 1);
                return dateA - dateB;
            });

            setSalesData(sortedData);
        } catch (error) {
            console.error('Error fetching sales data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };
    console.log(salesData.map(item => ({ year: item.year, month: item.month })));

    useEffect(() => {
        // Remove dependency on any year filter; fetch once on component mount.
        if (user?.token) {
            fetchSalesData();
        }
    }, [user,filters]);

    // Prepare the x-axis labels using month-year format.
    const labels = salesData.map((data) => formatMonthYear(data.year, data.month));

    const salesAndCOGSChartData = {
        labels,
        datasets: [
            {
                label: 'Sales',
                data: salesData.map((data) => data.sales || 0),
                backgroundColor: '#124f94', // Primary color
                borderWidth: 1,
            },
            // Only include COGS and Gross Margin % datasets for admin users.
            ...(user?.role === 'admin'
                ? [
                      {
                          label: 'COGS',
                          data: salesData.map((data) => data.cogs || 0),
                          backgroundColor: '#3bac4e', // Secondary color
                          borderWidth: 1,
                      },
                      {
                          label: 'Gross Margin %',
                          data: salesData.map((data) =>
                              data.sales ? (data.grossMargin / data.sales) * 100 : 0
                          ),
                          type: 'line',
                          borderColor: '#3bac4e',
                          backgroundColor: '#3bac4e',
                          borderWidth: 2,
                          fill: false,
                          yAxisID: 'y1',
                          tension: 0.4,
                          pointRadius: 4,
                          pointHoverRadius: 6,
                      },
                  ]
                : []),
        ],
    };

    const salesAndCOGSChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            datalabels: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        if (context.dataset.label === 'Gross Margin %') {
                            return `${context.raw.toFixed(2)}%`;
                        }
                        return formatCurrency(context.raw);
                    },
                },
                backgroundColor: '#212529',
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 13 },
                padding: 12,
            },
            legend: {
                position: 'top',
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
                ticks: {
                    callback: (value) => formatCurrency(value),
                    font: { family: "'Inter', sans-serif", size: 12 },
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                },
            },
            y1: {
                position: 'right',
                beginAtZero: true,
                ticks: {
                    callback: (value) => `${value}%`,
                    font: { family: "'Inter', sans-serif", size: 12 },
                },
                grid: {
                    drawOnChartArea: false,
                },
            },
            x: {
                grid: { display: false },
                ticks: {
                    font: { family: "'Inter', sans-serif", size: 12 },
                },
            },
        },
    };

    const exportToCSV = () => {
        if (!salesData.length) return; // Prevent exporting empty data.
        const csvRows = [
            ['Metric', ...labels],
            ['Sales', ...salesData.map((data) => data.sales || 0)],
            ...(user?.role === 'admin'
                ? [
                      ['COGS', ...salesData.map((data) => data.cogs || 0)],
                      [
                          'Gross Margin %',
                          ...salesData.map((data) =>
                              data.sales ? ((data.grossMargin / data.sales) * 100).toFixed(2) : '-'
                          ),
                      ],
                  ]
                : []),
        ];

        const csvContent = csvRows.map((row) => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'sales_cogs_data.csv');
        link.click();
    };

    
 
    return (
        <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white py-3">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                    <h4
                        className="mb-3 mb-md-0"
                        style={{ fontWeight: 600, color: '#212529', fontSize: '1.25rem' }}
                    >
                        {/* Sales (All Years) */}
                        Sales
                    </h4>
                    {/* <div className="d-flex flex-column flex-md-row gap-2 align-items-md-center mt-3 mt-md-0">
                        <div className="d-flex gap-2">
                            <AllFilter />
                        </div>
                    </div> */}
                    {/* Center: Dropdown */}
                        <div className="d-flex justify-content-center w-100">
                            {/* <AllFilter /> */}
                            {/* <AllFilter searchQuery={searchQuery} setSearchQuery={setSearchQuery} /> */}
                            <AllFilter 
            searchQuery={filters.salesPerson} 
            setSearchQuery={(value) => 
              setFilters(prev => ({ 
                ...prev, 
                salesPerson: value 
              }))
            } 
          />
                        </div>
                </div>
            </Card.Header>
            <Card.Body>
                {error && <p className="text-center mt-4 text-danger">Error: {error}</p>}
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '500px' }}>
                        <Spinner animation="border" role="status" className="me-2">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                        <span>Loading chart data...</span>
                    </div>
                ) : salesData.length ? (
                    <>
                        <div className="chart-container" style={{ height: '500px', width: '100%' }}>
                            <Bar data={salesAndCOGSChartData} options={salesAndCOGSChartOptions} />
                        </div>
                        <div className="mt-4">
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Metric</th>
                                        {labels.map((label, idx) => (
                                            <th key={idx}>{label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Sales</td>
                                        {salesData.map((data, index) => (
                                            <td key={index}>{formatCurrency(data.sales || 0)}</td>
                                        ))}
                                    </tr>
                                    {user?.role === 'admin' && (
                                        <>
                                            <tr>
                                                <td>COGS</td>
                                                {salesData.map((data, index) => (
                                                    <td key={index}>{formatCurrency(data.cogs || 0)}</td>
                                                ))}
                                            </tr>
                                            <tr>
                                                <td>Gross Margin %</td>
                                                {salesData.map((data, index) => (
                                                    <td key={index}>
                                                        {data.sales
                                                            ? `${((data.grossMargin / data.sales) * 100).toFixed(2)}%`
                                                            : '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                        </>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                        {/* <div className="text-end">
                            <Button variant="outline-primary" onClick={exportToCSV}>
                                Export to CSV
                            </Button>
                        </div> */}
                    </>
                ) : (
                    <p className="text-center mt-4">No data available.</p>
                )}
            </Card.Body>
        </Card>
    );
};


export default EnhancedSalesCOGSChart;

 






// // src/components/EnhancedSalesCOGSChart.js
// import React, { useState, useEffect } from 'react';
// import { Bar } from 'react-chartjs-2';
// import Select from "react-select";
// import { Card, Table, Button, Spinner ,Dropdown ,Form } from 'react-bootstrap';
// import AllFilter from "components/AllFilters.js";
// import {
//     Chart as ChartJS,
//     CategoryScale,
//     LinearScale,
//     BarElement,
//     Title,
//     Tooltip,
//     Legend,
//     LineElement,
//     PointElement,
//     LineController
// } from 'chart.js';
// import { formatCurrency } from 'utils/formatCurrency';
// import { useAuth } from '../contexts/AuthContext';

// // Register ChartJS components
// ChartJS.register(
//     CategoryScale,
//     LinearScale,
//     BarElement,
//     LineElement,
//     PointElement,
//     Title,
//     Tooltip,
//     Legend,
//     LineController
// );

// const EnhancedSalesCOGSChart = () => {
//     const [salesData, setSalesData] = useState([]);
//     const { user } = useAuth(); // Get user info
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [searchQuery, setSearchQuery] = useState('');

//  // Map full month names to their corresponding 0-indexed month numbers.
// const monthMapping = {
//     January: 0,
//     February: 1,
//     March: 2,
//     April: 3,
//     May: 4,
//     June: 5,
//     July: 6,
//     August: 7,
//     September: 8,
//     October: 9,
//     November: 10,
//     December: 11,
//   };
  
//   const formatMonthYear = (year, month) => {
//     const monthIndex = monthMapping[month];
//     if (monthIndex === undefined) {
//       return 'Invalid Date';
//     }
//     const date = new Date(year, monthIndex);
//     return date.toLocaleDateString('default', { month: 'short', year: 'numeric' });
//   };
  
    

//     const fetchSalesData = async () => {
//         try {
//             setLoading(true);
//             setError(null);

//             const token = localStorage.getItem('token');
//             // Assuming the API returns data for all years when no "year" query is provided.
//             const response = await fetch(`/api/sales-cogs`, {
//                 headers: {
//                     'Authorization': `Bearer ${token}`
//                 }
//             });

//             const responseJson = await response.json();
//             const { data } = responseJson;

//             if (!response.ok) {
//                 throw new Error(data.error || 'Failed to fetch data');
//             }

//             // Sort the data chronologically using year and month.
//             const sortedData = data.sort((a, b) => {
//                 const dateA = new Date(a.year, a.month - 1);
//                 const dateB = new Date(b.year, b.month - 1);
//                 return dateA - dateB;
//             });

//             setSalesData(sortedData);
//         } catch (error) {
//             console.error('Error fetching sales data:', error);
//             setError(error.message);
//         } finally {
//             setLoading(false);
//         }
//     };
//     console.log(salesData.map(item => ({ year: item.year, month: item.month })));

//     useEffect(() => {
//         // Remove dependency on any year filter; fetch once on component mount.
//         if (user?.token) {
//             fetchSalesData();
//         }
//     }, [user]);

//     // Prepare the x-axis labels using month-year format.
//     const labels = salesData.map((data) => formatMonthYear(data.year, data.month));

//     const salesAndCOGSChartData = {
//         labels,
//         datasets: [
//             {
//                 label: 'Sales',
//                 data: salesData.map((data) => data.sales || 0),
//                 backgroundColor: '#124f94', // Primary color
//                 borderWidth: 1,
//             },
//             // Only include COGS and Gross Margin % datasets for admin users.
//             ...(user?.role === 'admin'
//                 ? [
//                       {
//                           label: 'COGS',
//                           data: salesData.map((data) => data.cogs || 0),
//                           backgroundColor: '#3bac4e', // Secondary color
//                           borderWidth: 1,
//                       },
//                       {
//                           label: 'Gross Margin %',
//                           data: salesData.map((data) =>
//                               data.sales ? (data.grossMargin / data.sales) * 100 : 0
//                           ),
//                           type: 'line',
//                           borderColor: '#3bac4e',
//                           backgroundColor: '#3bac4e',
//                           borderWidth: 2,
//                           fill: false,
//                           yAxisID: 'y1',
//                           tension: 0.4,
//                           pointRadius: 4,
//                           pointHoverRadius: 6,
//                       },
//                   ]
//                 : []),
//         ],
//     };

//     const salesAndCOGSChartOptions = {
//         responsive: true,
//         maintainAspectRatio: false,
//         plugins: {
//             datalabels: {
//                 display: false,
//             },
//             tooltip: {
//                 callbacks: {
//                     label: (context) => {
//                         if (context.dataset.label === 'Gross Margin %') {
//                             return `${context.raw.toFixed(2)}%`;
//                         }
//                         return formatCurrency(context.raw);
//                     },
//                 },
//                 backgroundColor: '#212529',
//                 titleFont: { size: 14, weight: 'bold' },
//                 bodyFont: { size: 13 },
//                 padding: 12,
//             },
//             legend: {
//                 position: 'top',
//                 labels: {
//                     font: {
//                         family: "'Inter', sans-serif",
//                         size: 13,
//                     },
//                     padding: 20,
//                 },
//             },
//         },
//         scales: {
//             y: {
//                 beginAtZero: true,
//                 ticks: {
//                     callback: (value) => formatCurrency(value),
//                     font: { family: "'Inter', sans-serif", size: 12 },
//                 },
//                 grid: {
//                     color: 'rgba(0, 0, 0, 0.05)',
//                 },
//             },
//             y1: {
//                 position: 'right',
//                 beginAtZero: true,
//                 ticks: {
//                     callback: (value) => `${value}%`,
//                     font: { family: "'Inter', sans-serif", size: 12 },
//                 },
//                 grid: {
//                     drawOnChartArea: false,
//                 },
//             },
//             x: {
//                 grid: { display: false },
//                 ticks: {
//                     font: { family: "'Inter', sans-serif", size: 12 },
//                 },
//             },
//         },
//     };

//     const exportToCSV = () => {
//         if (!salesData.length) return; // Prevent exporting empty data.
//         const csvRows = [
//             ['Metric', ...labels],
//             ['Sales', ...salesData.map((data) => data.sales || 0)],
//             ...(user?.role === 'admin'
//                 ? [
//                       ['COGS', ...salesData.map((data) => data.cogs || 0)],
//                       [
//                           'Gross Margin %',
//                           ...salesData.map((data) =>
//                               data.sales ? ((data.grossMargin / data.sales) * 100).toFixed(2) : '-'
//                           ),
//                       ],
//                   ]
//                 : []),
//         ];

//         const csvContent = csvRows.map((row) => row.join(',')).join('\n');
//         const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//         const url = URL.createObjectURL(blob);

//         const link = document.createElement('a');
//         link.href = url;
//         link.setAttribute('download', 'sales_cogs_data.csv');
//         link.click();
//     };

    
 
// // const AllFilter = ({ searchQuery, setSearchQuery }) => {
// //     const [selectedLabel, setSelectedLabel] = useState('Search By'); // Default text for dropdown
// //     const [placeholder, setPlaceholder] = useState(''); // Initially empty

// //     const handleSelect = (eventKey) => {
// //         let newPlaceholder = ''; // Default empty
// //         let newLabel = 'Search By'; // Default dropdown label

// //         if (eventKey === 'sales-person') {
// //             newPlaceholder = 'Enter Sales Person Name or Code';
// //             newLabel = 'Sales Person';
// //         } else if (eventKey === 'product') {
// //             newPlaceholder = 'Enter Product Name';
// //             newLabel = 'Product';
// //         } else if (eventKey === 'category') {
// //             newPlaceholder = 'Enter Any Category';
// //             newLabel = 'Category';
// //         }

// //         setPlaceholder(newPlaceholder);
// //         setSelectedLabel(newLabel);
// //         setSearchQuery(''); // Clear input when switching filters
// //     };

// //     // Reset Function
// //     const handleReset = () => {
// //         setSelectedLabel('Search By'); // Reset dropdown label
// //         setPlaceholder(''); // Reset placeholder
// //         setSearchQuery(''); // Clear search input
// //     };

// //     return (
// //         <div className="d-flex gap-2 align-items-center">
// //             {/* Dropdown */}
// //             <Dropdown onSelect={handleSelect}>
// //                 <Dropdown.Toggle variant="outline-secondary" id="search-dropdown">
// //                     {selectedLabel}
// //                 </Dropdown.Toggle>
// //                 <Dropdown.Menu>
// //                     <Dropdown.Item eventKey="sales-person">Sales Person</Dropdown.Item>
// //                     <Dropdown.Item eventKey="product">Product</Dropdown.Item>
// //                     <Dropdown.Item eventKey="category">Category</Dropdown.Item>
// //                 </Dropdown.Menu>
// //             </Dropdown>

// //             {/* Search Input Field */}
// //             <Form.Control
// //                 type="text"
// //                 value={searchQuery}
// //                 onChange={(e) => setSearchQuery(e.target.value)}
// //                 placeholder={placeholder}
// //                 className="ms-2"
// //                 style={{ width: '400px' }}
// //                 disabled={!placeholder} // Disable input until selection is made
// //             />

// //             {/* Reset Button */}
// //             <Button variant="primary" onClick={handleReset} disabled={!placeholder}>
// //                 Reset
// //             </Button>
// //         </div>
// //     );
// // };

// // const AllFilter = ({ searchQuery, setSearchQuery }) => {
// //     const [searchType, setSearchType] = useState(null);
// //     const [suggestions, setSuggestions] = useState([]);
// //     const [loading, setLoading] = useState(false);
// //     const [selectedValue, setSelectedValue] = useState(null);

// //     // API Endpoints
// //     const API_ENDPOINTS = {
// //         "sales-person": "/api/dashboard/sales-person/distinct-salesperson",
// //         "product": "/api/products/distinct-product",
// //         "category": "/api/products/categories",
// //     };

// //     // Handle dropdown selection
// //     const handleSearchTypeSelect = (type) => {
// //         setSearchType(type);
// //         setSearchQuery("");
// //         setSelectedValue(null);
// //         setSuggestions([]);
// //     };

// //     // Fetch suggestions dynamically
// //     const fetchSuggestions = async (query) => {
// //         if (!searchType || !query) return;

// //         setLoading(true);
// //         try {
// //             const response = await fetch(`${API_ENDPOINTS[searchType]}?search=${query}`);
// //             const data = await response.json();

// //             let formattedSuggestions = [];
// //             if (searchType === "sales-person") {
// //                 formattedSuggestions = data.salesEmployees?.map(emp => ({
// //                     value: emp.value, label: emp.label
// //                 })) || [];
// //             } else if (searchType === "product") {
// //                 formattedSuggestions = data.categories?.map(cat => ({
// //                     value: cat, label: cat
// //                 })) || [];
// //             } else if (searchType === "category") {
// //                 formattedSuggestions = data.categories?.map(cat => ({
// //                     value: cat, label: cat
// //                 })) || [];
// //             }

// //             setSuggestions(formattedSuggestions);
// //         } catch (error) {
// //             console.error(`Error fetching ${searchType} suggestions:`, error);
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     // Called when the user types in the input field
// //     const handleInputChange = (inputValue, { action }) => {
// //         if (action === "input-change") {
// //             fetchSuggestions(inputValue);
// //         }
// //     };

// //     // Handle selection of an option
// //     const handleOptionSelect = (option) => {
// //         setSelectedValue(option);
// //         setSearchQuery(option?.label || "");
// //     };

// //     // Reset everything
// //     const handleReset = () => {
// //         setSearchType(null);
// //         setSearchQuery("");
// //         setSelectedValue(null);
// //         setSuggestions([]);
// //     };

// //     return (
// //         <div className="d-flex gap-2 align-items-center">
// //             {/* Dropdown to Select Filter Type */}
// //             <Dropdown onSelect={(eventKey) => handleSearchTypeSelect(eventKey)}>
// //                 <Dropdown.Toggle variant="outline-secondary" id="search-dropdown">
// //                     {searchType ? searchType.replace("-", " ").toUpperCase() : "Search By"}
// //                 </Dropdown.Toggle>
// //                 <Dropdown.Menu>
// //                     <Dropdown.Item eventKey="sales-person">Sales Person</Dropdown.Item>
// //                     <Dropdown.Item eventKey="product">Product</Dropdown.Item>
// //                     <Dropdown.Item eventKey="category">Category</Dropdown.Item>
// //                 </Dropdown.Menu>
// //             </Dropdown>

// //             {/* Search Input with Auto-Suggestions */}
// //             <div style={{ width: "300px" }}>
// //                 <Select
// //                     value={selectedValue}
// //                     onChange={handleOptionSelect}
// //                     onInputChange={handleInputChange}
// //                     options={suggestions}
// //                     isLoading={loading}
// //                     placeholder={searchType ? `Enter ${searchType.replace("-", " ")}` : "Select a search type"}
// //                     noOptionsMessage={() => "No results found"}
// //                     isClearable
// //                     styles={{
// //                         control: (base) => ({
// //                             ...base,
// //                             minHeight: "40px",
// //                             borderColor: "#dee2e6",
// //                             fontSize: "14px",
// //                         }),
// //                         option: (base, state) => ({
// //                             ...base,
// //                             backgroundColor: state.isFocused ? "#007bff" : "#fff",
// //                             color: state.isFocused ? "#fff" : "#212529",
// //                         }),
// //                     }}
// //                 />
// //             </div>

// //             {/* Reset Button */}
// //             <Button variant="primary" onClick={handleReset} disabled={!searchType}>
// //                 Reset
// //             </Button>
// //         </div>
// //     );
// // };



//     return (
//         <Card className="shadow-sm border-0 mb-4">
//             <Card.Header className="bg-white py-3">
//                 <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
//                     <h4
//                         className="mb-3 mb-md-0"
//                         style={{ fontWeight: 600, color: '#212529', fontSize: '1.25rem' }}
//                     >
//                         {/* Sales (All Years) */}
//                         Sales
//                     </h4>
//                     {/* <div className="d-flex flex-column flex-md-row gap-2 align-items-md-center mt-3 mt-md-0">
//                         <div className="d-flex gap-2">
//                             <AllFilter />
//                         </div>
//                     </div> */}
//                     {/* Center: Dropdown */}
//                         <div className="d-flex justify-content-center w-100">
//                             {/* <AllFilter /> */}
//                             <AllFilter searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
//                         </div>
//                 </div>
//             </Card.Header>
//             <Card.Body>
//                 {error && <p className="text-center mt-4 text-danger">Error: {error}</p>}
//                 {loading ? (
//                     <div className="d-flex justify-content-center align-items-center" style={{ height: '500px' }}>
//                         <Spinner animation="border" role="status" className="me-2">
//                             <span className="visually-hidden">Loading...</span>
//                         </Spinner>
//                         <span>Loading chart data...</span>
//                     </div>
//                 ) : salesData.length ? (
//                     <>
//                         <div className="chart-container" style={{ height: '500px', width: '100%' }}>
//                             <Bar data={salesAndCOGSChartData} options={salesAndCOGSChartOptions} />
//                         </div>
//                         <div className="mt-4">
//                             <Table striped bordered hover responsive>
//                                 <thead>
//                                     <tr>
//                                         <th>Metric</th>
//                                         {labels.map((label, idx) => (
//                                             <th key={idx}>{label}</th>
//                                         ))}
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     <tr>
//                                         <td>Sales</td>
//                                         {salesData.map((data, index) => (
//                                             <td key={index}>{formatCurrency(data.sales || 0)}</td>
//                                         ))}
//                                     </tr>
//                                     {user?.role === 'admin' && (
//                                         <>
//                                             <tr>
//                                                 <td>COGS</td>
//                                                 {salesData.map((data, index) => (
//                                                     <td key={index}>{formatCurrency(data.cogs || 0)}</td>
//                                                 ))}
//                                             </tr>
//                                             <tr>
//                                                 <td>Gross Margin %</td>
//                                                 {salesData.map((data, index) => (
//                                                     <td key={index}>
//                                                         {data.sales
//                                                             ? `${((data.grossMargin / data.sales) * 100).toFixed(2)}%`
//                                                             : '-'}
//                                                     </td>
//                                                 ))}
//                                             </tr>
//                                         </>
//                                     )}
//                                 </tbody>
//                             </Table>
//                         </div>
//                         {/* <div className="text-end">
//                             <Button variant="outline-primary" onClick={exportToCSV}>
//                                 Export to CSV
//                             </Button>
//                         </div> */}
//                     </>
//                 ) : (
//                     <p className="text-center mt-4">No data available.</p>
//                 )}
//             </Card.Body>
//         </Card>
//     );
// };


// export default EnhancedSalesCOGSChart;

 