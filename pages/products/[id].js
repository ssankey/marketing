// // // pages/products/[id].js
// // import { useRouter } from "next/router";
// // import { Container, Row, Col, Card, Spinner, Table, Alert } from "react-bootstrap";
// // import { getProductDetail, getProductKPIs } from "../../lib/models/products";
// // import { useAuth } from '../../hooks/useAuth';
// // import { Line, Bar } from 'react-chartjs-2';
// // import 'chart.js/auto'; // Required for Chart.js 3.x and above
// // import { formatDate } from "utils/formatDate";
// // import { formatCurrency } from "utils/formatCurrency";

// // export default function ProductDetails({ product, kpiData, salesTrendData, topCustomersData, inventoryData }) {
// //   const { isAuthenticated } = useAuth();
// //   const router = useRouter();

// //   if (!isAuthenticated) {
// //     return (
// //       <Container className="mt-5">
// //         <Alert variant="warning">You need to be authenticated to view this page.</Alert>
// //       </Container>
// //     );
// //   }

// //   if (!product) {
// //     return (
// //       <Container className="mt-5">
// //         <Alert variant="warning">Product not found</Alert>
// //       </Container>
// //     );
// //   }

  

// //   const generateCoaUrl = (item) => {
// //   const baseUrl = window.location.origin; // Get current domain
// //   const { CoaSource, LocalCOAFilename, EnergyCoaUrl, ItemCode, VendorBatchNum } = item;
  
// //   switch (CoaSource) {
// //     case 'LOCAL':
// //       if (LocalCOAFilename && LocalCOAFilename.trim() !== '') {
// //         // Extract just the filename from the full path
// //         let filename = LocalCOAFilename.trim();
        
// //         // Handle Windows paths - extract filename after last backslash
// //         if (filename.includes('\\')) {
// //           const pathParts = filename.split('\\');
// //           filename = pathParts[pathParts.length - 1];
// //         }
        
// //         // Handle Unix paths - extract filename after last forward slash
// //         if (filename.includes('/')) {
// //           const pathParts = filename.split('/');
// //           filename = pathParts[pathParts.length - 1];
// //         }
        
// //         const encodedFilename = encodeURIComponent(filename);
// //         return `${baseUrl}/api/coa/download/${encodedFilename}`;
// //       }
// //       break;
      
// //     case 'ENERGY':
// //       if (ItemCode && VendorBatchNum && VendorBatchNum.trim() !== '' && VendorBatchNum !== 'N/A') {
// //         // Use proxy endpoint for Energy COAs to force download
// //         return `${baseUrl}/api/coa/download-energy/${encodeURIComponent(ItemCode)}/${encodeURIComponent(VendorBatchNum.trim())}`;
// //       }
// //       break;
      
// //     case 'NONE':
// //     default:
// //       return null;
// //   }
  
// //   return null;
// // };


// //   // Helper function to handle COA download
// //   const handleCoaDownload = (item) => {
// //     const coaUrl = generateCoaUrl(item);
// //     if (coaUrl) {
// //       // Open in new tab to trigger download
// //       window.open(coaUrl, '_blank');
// //     }
// //   };

// //   // Prepare data for sales trend chart (Bar Chart)
// //   const salesTrendLabels = salesTrendData.map(item => item.MonthName);
// //   const salesTrendRevenue = salesTrendData.map(item => Number(item.MonthlyRevenue));
// //   const salesTrendUnits = salesTrendData.map(item => Number(item.MonthlyUnitsSold));

// //   const salesTrendChartData = {
// //     labels: salesTrendLabels,
// //     datasets: [
// //       {
// //         label: 'Sales Revenue',
// //         data: salesTrendRevenue,
// //         backgroundColor: 'rgba(0, 123, 255, 0.7)',
// //         borderColor: '#007bff',
// //         borderWidth: 1,
// //       },
// //     ],
// //   };

// //   // Custom chart options with tooltip configuration
// //   const salesTrendChartOptions = {
// //     responsive: true,
// //     maintainAspectRatio: false,
// //     plugins: {
// //       datalabels: {
// //               display: false,
// //             },
// //       legend: {
// //         position: 'top',
// //       },
// //       tooltip: {
// //         callbacks: {
// //           label: function(context) {
// //             const index = context.dataIndex;
// //             const sales = salesTrendRevenue[index].toLocaleString('en-IN', {
// //               style: 'currency',
// //               currency: 'INR',
// //               maximumFractionDigits: 0
// //             });
// //             const units = salesTrendUnits[index].toLocaleString();
// //             return [`Sales: ${sales}`, `Units Sold: ${units}`];
// //           }
// //         }
// //       }
// //     },
// //     scales: {
// //       y: {
// //         beginAtZero: true,
// //         title: {
// //           display: true,
// //           text: 'Sales Revenue (₹)'
// //         },
// //         ticks: {
// //           callback: function(value) {
// //             return '₹' + value.toLocaleString();
// //           }
// //         }
// //       },
// //       x: {
// //         title: {
// //           display: true,
// //           text: 'Month'
// //         }
// //       }
// //     }
// //   };

// //   // Process inventory data to calculate total quantity per location for the chart
// //   const inventoryByLocation = inventoryData.reduce((acc, item) => {
// //     const location = item.Location;
// //     const quantity = Number(item.Quantity) || 0;
    
// //     if (acc[location]) {
// //       acc[location] += quantity;
// //     } else {
// //       acc[location] = quantity;
// //     }
// //     return acc;
// //   }, {});

// //   const inventoryLocations = Object.keys(inventoryByLocation);
// //   const inventoryQuantities = Object.values(inventoryByLocation);

// //   const inventoryChartData = {
// //     labels: inventoryLocations,
// //     datasets: [
// //       {
// //         label: 'Total Inventory Quantity',
// //         data: inventoryQuantities,
// //         backgroundColor: '#ffc107',
// //         borderColor: '#e0a800',
// //         borderWidth: 1,
// //       },
// //     ],
// //   };

// //   // Chart options to ensure visibility
// //   const chartOptions = {
// //     responsive: true,
// //     maintainAspectRatio: false,
// //     plugins: {
// //       datalabels: {
// //               display: false,
// //             },
// //       legend: {
// //         position: 'top',
// //       },
// //     },
// //     scales: {
// //       y: {
// //         beginAtZero: true,
// //         title: {
// //           display: true,
// //           text: 'Quantity'
// //         }
// //       },
// //       x: {
// //         title: {
// //           display: true,
// //           text: 'Location'
// //         }
// //       }
// //     }
// //   };

// //   return (
// //     <Container className="mt-4">
      
// //       <Card>
// //         <Card.Header>
// //           <h2 className="mb-0">Product Details - {product.ItemName}</h2>
// //         </Card.Header>
// //         <Card.Body>
// //           {/* Basic Information and KPI Summary */}
          
// //           <Row className="mb-4">
// //             <Col md={6}>
// //               <h4>Basic Information</h4>
// //               <Table bordered>
// //                 <tbody>
// //                   <tr>
// //                     <th>Item Code</th>
// //                     <td>{product.ItemCode}</td>
// //                   </tr>
// //                   <tr>
// //                     <th>Item Name</th>
// //                     <td>{product.ItemName}</td>
// //                   </tr>
// //                   <tr>
// //                     <th>Item Type</th>
// //                     <td>{product.ItemType}</td>
// //                   </tr>
// //                   <tr>
// //                     <th>CAS No</th>
// //                     <td>{product.U_CasNo || "N/A"}</td>
// //                   </tr>
// //                   <tr>
// //                     <th>Molecular Weight</th>
// //                     <td>{product.U_MolucularWeight || "N/A"}</td>
// //                   </tr>
// //                   <tr>
// //                     <th>Created Date</th>
// //                     <td>{formatDate(product.CreateDate)}</td>
// //                   </tr>
// //                   <tr>
// //                     <th>Updated Date</th>
// //                     <td>{formatDate(product.UpdateDate)}</td>
// //                   </tr>
// //                 </tbody>
// //               </Table>
// //             </Col>
// //             <Col md={6}>
// //               <h4>KPI Summary</h4>
// //               <Table bordered>
// //                 <tbody>
// //                   <tr>
// //                     <th>Total Revenue Generated</th>
// //                     <td>₹{Number(kpiData.TotalRevenue).toLocaleString()}</td>
// //                   </tr>
// //                   <tr>
// //                     <th>Units Sold</th>
// //                     <td>{Number(kpiData.UnitsSold).toLocaleString()}</td>
// //                   </tr>
// //                   <tr>
// //                     <th>Number of Customers</th>
// //                     <td>{Number(kpiData.NumberOfCustomers).toLocaleString()}</td>
// //                   </tr>
// //                 </tbody>
// //               </Table>
// //             </Col>
// //           </Row>

// //           {/* Sales Trend */}
// //           <Row className="mb-4">
// //             <Col>
// //               <h4>Sales Trend</h4>
// //               <Card className="p-3" style={{ height: '400px' }}>
// //                 <Bar data={salesTrendChartData} options={salesTrendChartOptions} />
// //               </Card>
// //             </Col>
// //           </Row>

// //           {/* Top Customers */}
// //           <Row className="mb-4">
// //             <Col>
// //               <h4>Top Customers</h4>
// //               <Table striped bordered hover>
// //                 <thead>
// //                   <tr>
// //                     <th>Customer Code</th>
// //                     <th>Customer Name</th>
// //                     <th>Total Spent (₹)</th>
// //                   </tr>
// //                 </thead>
// //                 <tbody>
// //                   {topCustomersData.length > 0 ? (
// //                     topCustomersData.map((customer) => (
// //                       <tr key={customer.CustomerCode}>
// //                         <td>{customer.CustomerCode}</td>
// //                         <td>{customer.CustomerName}</td>
// //                         <td>{formatCurrency(customer.TotalSpent)}</td>
// //                         {/* <td>₹{Number(customer.TotalSpent).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td> */}
// //                       </tr>
// //                     ))
// //                   ) : (
// //                     <tr>
// //                       <td colSpan="3" className="text-center">No customer data available.</td>
// //                     </tr>
// //                   )}
// //                 </tbody>
// //               </Table>
// //             </Col>
// //           </Row>

// //           {/* Inventory Levels */}
// //           {/* <Row className="mb-4">
// //             <Col>
// //               <h4>Inventory Levels</h4>
// //               <Card className="p-3" style={{ height: '400px' }}>
// //                 <Bar data={inventoryChartData} options={chartOptions} />
// //               </Card>
// //               <Table striped bordered hover className="mt-3">
// //                 <thead>
// //                   <tr>
// //                     <th>Location</th>
// //                     <th>Warehouse Name</th>
// //                     <th>Quantity</th>
// //                     <th>Batch Number</th>
// //                     <th>COA</th>
// //                   </tr>
// //                 </thead>
// //                 <tbody>
// //                   {inventoryData.length > 0 ? (
// //                     inventoryData.map((item, index) => {
// //                       // Create enhanced item object with ItemCode for COA generation
// //                       const enhancedItem = {
// //                         ...item,
// //                         ItemCode: product.ItemCode // Add ItemCode from product details
// //                       };
                      
// //                       const coaUrl = generateCoaUrl(enhancedItem);
                      
// //                       return (
// //                         <tr key={index}>
// //                           <td>{item.Location}</td>
// //                           <td>{item.WhsName || "N/A"}</td>
// //                           <td>{Number(item.Quantity).toLocaleString()}</td>
// //                           <td>{item.BatchNum || "N/A"}</td>
// //                           <td className="text-center">
// //                             {coaUrl ? (
// //                               <button
// //                                 className="btn btn-link btn-sm p-0"
// //                                 onClick={() => handleCoaDownload(enhancedItem)}
// //                                 style={{ 
// //                                   color: '#007bff', 
// //                                   textDecoration: 'underline',
// //                                   border: 'none',
// //                                   background: 'none',
// //                                   cursor: 'pointer'
// //                                 }}
// //                                 title={`Download COA (${item.CoaSource})`}
// //                               >
// //                                 COA
// //                               </button>
// //                             ) : (
// //                               <span style={{ color: '#6c757d' }}>N/A</span>
// //                             )}
// //                           </td>
// //                         </tr>
// //                       );
// //                     })
// //                   ) : (
// //                     <tr>
// //                       <td colSpan="5" className="text-center">No inventory data available.</td>
// //                     </tr>
// //                   )}
// //                 </tbody>
// //               </Table>
// //             </Col>
// //           </Row> */}

// //           {/* Inventory Levels */}
// // <Row className="mb-4">
// //   <Col>
// //     <h4>Inventory Levels</h4>
// //     <Card className="p-3" style={{ height: '400px' }}>
// //       <Bar data={inventoryChartData} options={chartOptions} />
// //     </Card>
// //     <Table striped bordered hover className="mt-3">
// //       <thead>
// //         <tr>
// //           <th>Location</th>
// //           <th>Warehouse Name</th>
// //           <th>Quantity</th>
// //           <th>Batch Number</th>
// //           <th>Vendor Batch</th>
// //           <th>COA</th>
// //         </tr>
// //       </thead>
// //       <tbody>
// //         {inventoryData.length > 0 ? (
// //           inventoryData.map((item, index) => {
// //             // Create enhanced item object with ItemCode for COA generation
// //             const enhancedItem = {
// //               ...item,
// //               ItemCode: product.ItemCode // Add ItemCode from product details
// //             };
            
// //             const coaUrl = generateCoaUrl(enhancedItem);
            
// //             return (
// //               <tr key={index}>
// //                 <td>{item.Location}</td>
// //                 <td>{item.WhsName || "N/A"}</td>
// //                 <td>{Number(item.Quantity).toLocaleString()}</td>
// //                 <td>{item.BatchNum || "N/A"}</td>
// //                 <td>{item.VendorBatchNum || "N/A"}</td>
// //                 <td className="text-center">
// //                   {coaUrl ? (
// //                     <button
// //                       className="btn btn-link btn-sm p-0"
// //                       onClick={() => handleCoaDownload(enhancedItem)}
// //                       style={{ 
// //                         color: '#007bff', 
// //                         textDecoration: 'underline',
// //                         border: 'none',
// //                         background: 'none',
// //                         cursor: 'pointer'
// //                       }}
// //                       title={`Download COA (${item.CoaSource})`}
// //                     >
// //                       COA
// //                     </button>
// //                   ) : (
// //                     <span style={{ color: '#6c757d' }}>N/A</span>
// //                   )}
// //                 </td>
// //               </tr>
// //             );
// //           })
// //         ) : (
// //           <tr>
// //             <td colSpan="6" className="text-center">No inventory data available.</td>
// //           </tr>
// //         )}
// //       </tbody>
// //     </Table>
// //   </Col>
// // </Row>

// //           {/* Additional Information */}
// //           <Row className="mb-4">
// //             <Col>
// //               <h4>Additional Information</h4>
// //               <Card body>
// //                 <p>
// //                   <strong>IUPAC Name:</strong> {product.U_IUPACName || "N/A"}
// //                 </p>
// //                 <p>
// //                   <strong>Synonyms:</strong> {product.U_Synonyms || "N/A"}
// //                 </p>
// //                 <p>
// //                   <strong>Molecular Formula:</strong> {product.U_MolucularFormula || "N/A"}
// //                 </p>
// //                 <p>
// //                   <strong>Applications:</strong> {product.U_Applications || "N/A"}
// //                 </p>
// //                 <p>
// //                   <strong>Structure:</strong> {product.U_Structure ? <a href={product.U_Structure} target="_blank" rel="noopener noreferrer">View Structure</a> : "N/A"}
// //                 </p>
// //               </Card>
// //             </Col>
// //           </Row>

// //           {/* Back Button */}
// //           <div className="mt-3">
// //             <button className="btn btn-secondary" onClick={() => router.back()}>
// //               Back to Products
// //             </button>
// //           </div>
// //         </Card.Body>
// //       </Card>
// //     </Container>
// //   );
// // }

// // export async function getServerSideProps(context) {
// //   const { id } = context.params;

// //   function serializeDates(obj) {
// //     const serializedObj = { ...obj };
// //     for (const key in serializedObj) {
// //       if (serializedObj[key] instanceof Date) {
// //         serializedObj[key] = serializedObj[key].toISOString();
// //       }
// //     }
// //     return serializedObj;
// //   }

// //   try {
// //     const product = await getProductDetail(id);

// //     if (!product) {
// //       return {
// //         props: {
// //           product: null,
// //         },
// //       };
// //     }

// //     // Serialize date fields in the product object
// //     const serializedProduct = serializeDates(product);

// //     const { kpiData, salesTrendData, topCustomersData, inventoryData } = await getProductKPIs(id);

// //     // Serialize date fields in kpiData, salesTrendData, topCustomersData, inventoryData if necessary
// //     const serializedKPIData = kpiData ? serializeDates(kpiData) : null;

// //     const serializedSalesTrendData = salesTrendData ? salesTrendData.map(item => serializeDates(item)) : [];
// //     const serializedTopCustomersData = topCustomersData ? topCustomersData.map(item => serializeDates(item)) : [];
// //     const serializedInventoryData = inventoryData ? inventoryData.map(item => serializeDates(item)) : [];

// //     return {
// //       props: {
// //         product: serializedProduct,
// //         kpiData: serializedKPIData,
// //         salesTrendData: serializedSalesTrendData,
// //         topCustomersData: serializedTopCustomersData,
// //         inventoryData: serializedInventoryData,
// //       },
// //     };
// //   } catch (error) {
// //     console.error("Error fetching product data:", error);
// //     return {
// //       props: {
// //         product: null,
// //       },
// //     };
// //   }
// // }

// // pages/products/[id].js
// import { useRouter } from "next/router";
// import { Container, Row, Col, Card, Spinner, Table, Alert } from "react-bootstrap";
// import { getProductDetail, getProductKPIs } from "../../lib/models/products";
// import { useAuth } from '../../hooks/useAuth';
// import { Line, Bar } from 'react-chartjs-2';
// import 'chart.js/auto'; // Required for Chart.js 3.x and above
// import { formatDate } from "utils/formatDate";
// import { formatCurrency } from "utils/formatCurrency";
// import { useState, useEffect } from "react";

// export default function ProductDetails({ product, kpiData, salesTrendData, topCustomersData, inventoryData }) {
//   const { isAuthenticated } = useAuth();
//   const router = useRouter();

//   if (!isAuthenticated) {
//     return (
//       <Container className="mt-5">
//         <Alert variant="warning">You need to be authenticated to view this page.</Alert>
//       </Container>
//     );
//   }

//   if (!product) {
//     return (
//       <Container className="mt-5">
//         <Alert variant="warning">Product not found</Alert>
//       </Container>
//     );
//   }

//   const generateCoaUrl = (item) => {
//     const baseUrl = window.location.origin; // Get current domain
//     const { CoaSource, LocalCOAFilename, EnergyCoaUrl, ItemCode, VendorBatchNum } = item;
    
//     switch (CoaSource) {
//       case 'LOCAL':
//         if (LocalCOAFilename && LocalCOAFilename.trim() !== '') {
//           // Extract just the filename from the full path
//           let filename = LocalCOAFilename.trim();
          
//           // Handle Windows paths - extract filename after last backslash
//           if (filename.includes('\\')) {
//             const pathParts = filename.split('\\');
//             filename = pathParts[pathParts.length - 1];
//           }
          
//           // Handle Unix paths - extract filename after last forward slash
//           if (filename.includes('/')) {
//             const pathParts = filename.split('/');
//             filename = pathParts[pathParts.length - 1];
//           }
          
//           const encodedFilename = encodeURIComponent(filename);
//           return {
//             url: `${baseUrl}/api/coa/download/${encodedFilename}`,
//             type: 'local'
//           };
//         }
//         break;
        
//       case 'ENERGY':
//         if (ItemCode && VendorBatchNum && VendorBatchNum.trim() !== '' && VendorBatchNum !== 'N/A') {
//           // Use proxy endpoint for Energy COAs to force download
//           return {
//             url: `${baseUrl}/api/coa/download-energy/${encodeURIComponent(ItemCode)}/${encodeURIComponent(VendorBatchNum.trim())}`,
//             type: 'energy'
//           };
//         }
//         break;
        
//       case 'NONE':
//       default:
//         return null;
//     }
    
//     return null;
//   };

//   // Function to check if COA PDF is available
//   const checkCoaAvailability = async (coaInfo) => {
//     if (!coaInfo) return false;
    
//     try {
//       // For local COA files, try a HEAD request first
//       const response = await fetch(coaInfo.url, {
//         method: 'HEAD',
//         headers: {
//           'Cache-Control': 'no-cache'
//         }
//       });
      
//       // If HEAD request fails, try GET with small range
//       if (!response.ok) {
//         const getResponse = await fetch(coaInfo.url, {
//           method: 'GET',
//           headers: {
//             'Range': 'bytes=0-1',
//             'Cache-Control': 'no-cache'
//           }
//         });
        
//         return getResponse.ok || getResponse.status === 206;
//       }
      
//       // Check content type to ensure it's a PDF, not JSON
//       const contentType = response.headers.get('content-type');
//       if (contentType && contentType.includes('application/json')) {
//         console.log('COA returned JSON instead of PDF, marking as unavailable');
//         return false;
//       }
      
//       return response.ok;
      
//     } catch (error) {
//       console.error('Error checking COA availability:', error);
//       return false;
//     }
//   };

//   // Helper function to handle COA download
//   const handleCoaDownload = (item) => {
//     const coaInfo = generateCoaUrl(item);
//     if (coaInfo) {
//       // Create a temporary link element and trigger download
//       const link = document.createElement('a');
//       link.href = coaInfo.url;
//       link.target = '_blank';
//       link.download = ''; // This will use the filename from the server
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     } else {
//       alert('COA not available for this item');
//     }
//   };

//   // COA Cell Component with availability check
//   const CoaCell = ({ item }) => {
//     const [isAvailable, setIsAvailable] = useState(null); // null = loading, true/false = available/not available
//     const [isLoading, setIsLoading] = useState(true);
    
//     useEffect(() => {
//       const checkAvailability = async () => {
//         setIsLoading(true);
//         const coaInfo = generateCoaUrl(item);
        
//         if (coaInfo) {
//           try {
//             const available = await checkCoaAvailability(coaInfo);
//             setIsAvailable(available);
//           } catch (error) {
//             console.error('Error checking COA availability:', error);
//             setIsAvailable(false);
//           }
//         } else {
//           setIsAvailable(false);
//         }
        
//         setIsLoading(false);
//       };
      
//       checkAvailability();
//     }, [item]);

//     // Debug logging
//     console.log('COA Status for item:', {
//       itemCode: item.ItemCode,
//       vendorBatchNum: item.VendorBatchNum,
//       coaSource: item.CoaSource,
//       localCOAFilename: item.LocalCOAFilename,
//       isLoading,
//       isAvailable
//     });
    
//     if (isLoading) {
//       return (
//         <div className="d-flex align-items-center justify-content-center">
//           <Spinner animation="border" size="sm" />
//         </div>
//       );
//     }
    
//     if (isAvailable) {
//       return (
//         <button
//           className="btn btn-link btn-sm p-0"
//           onClick={() => handleCoaDownload(item)}
//           style={{ 
//             color: '#007bff', 
//             textDecoration: 'underline',
//             border: 'none',
//             background: 'none',
//             cursor: 'pointer',
//             fontSize: '0.875rem'
//           }}
//           title={`Download COA (${item.CoaSource})`}
//         >
//           COA
//         </button>
//       );
//     }
    
//     return <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>N/A</span>;
//   };

//   // Prepare data for sales trend chart (Bar Chart)
//   const salesTrendLabels = salesTrendData.map(item => item.MonthName);
//   const salesTrendRevenue = salesTrendData.map(item => Number(item.MonthlyRevenue));
//   const salesTrendUnits = salesTrendData.map(item => Number(item.MonthlyUnitsSold));

//   const salesTrendChartData = {
//     labels: salesTrendLabels,
//     datasets: [
//       {
//         label: 'Sales Revenue',
//         data: salesTrendRevenue,
//         backgroundColor: 'rgba(0, 123, 255, 0.7)',
//         borderColor: '#007bff',
//         borderWidth: 1,
//       },
//     ],
//   };

//   // Custom chart options with tooltip configuration
//   const salesTrendChartOptions = {
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
//         callbacks: {
//           label: function(context) {
//             const index = context.dataIndex;
//             const sales = salesTrendRevenue[index].toLocaleString('en-IN', {
//               style: 'currency',
//               currency: 'INR',
//               maximumFractionDigits: 0
//             });
//             const units = salesTrendUnits[index].toLocaleString();
//             return [`Sales: ${sales}`, `Units Sold: ${units}`];
//           }
//         }
//       }
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         title: {
//           display: true,
//           text: 'Sales Revenue (₹)'
//         },
//         ticks: {
//           callback: function(value) {
//             return '₹' + value.toLocaleString();
//           }
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

//   // Process inventory data to calculate total quantity per location for the chart
//   const inventoryByLocation = inventoryData.reduce((acc, item) => {
//     const location = item.Location;
//     const quantity = Number(item.Quantity) || 0;
    
//     if (acc[location]) {
//       acc[location] += quantity;
//     } else {
//       acc[location] = quantity;
//     }
//     return acc;
//   }, {});

//   const inventoryLocations = Object.keys(inventoryByLocation);
//   const inventoryQuantities = Object.values(inventoryByLocation);

//   const inventoryChartData = {
//     labels: inventoryLocations,
//     datasets: [
//       {
//         label: 'Total Inventory Quantity',
//         data: inventoryQuantities,
//         backgroundColor: '#ffc107',
//         borderColor: '#e0a800',
//         borderWidth: 1,
//       },
//     ],
//   };

//   // Chart options to ensure visibility
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
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         title: {
//           display: true,
//           text: 'Quantity'
//         }
//       },
//       x: {
//         title: {
//           display: true,
//           text: 'Location'
//         }
//       }
//     }
//   };

//   return (
//     <Container className="mt-4">
      
//       <Card>
//         <Card.Header>
//           <h2 className="mb-0">Product Details - {product.ItemName}</h2>
//         </Card.Header>
//         <Card.Body>
//           {/* Basic Information and KPI Summary */}
          
//           <Row className="mb-4">
//             <Col md={6}>
//               <h4>Basic Information</h4>
//               <Table bordered>
//                 <tbody>
//                   <tr>
//                     <th>Item Code</th>
//                     <td>{product.ItemCode}</td>
//                   </tr>
//                   <tr>
//                     <th>Item Name</th>
//                     <td>{product.ItemName}</td>
//                   </tr>
//                   <tr>
//                     <th>Item Type</th>
//                     <td>{product.ItemType}</td>
//                   </tr>
//                   <tr>
//                     <th>CAS No</th>
//                     <td>{product.U_CasNo || "N/A"}</td>
//                   </tr>
//                   <tr>
//                     <th>Molecular Weight</th>
//                     <td>{product.U_MolucularWeight || "N/A"}</td>
//                   </tr>
//                   <tr>
//                     <th>Created Date</th>
//                     <td>{formatDate(product.CreateDate)}</td>
//                   </tr>
//                   <tr>
//                     <th>Updated Date</th>
//                     <td>{formatDate(product.UpdateDate)}</td>
//                   </tr>
//                 </tbody>
//               </Table>
//             </Col>
//             <Col md={6}>
//               <h4>KPI Summary</h4>
//               <Table bordered>
//                 <tbody>
//                   <tr>
//                     <th>Total Revenue Generated</th>
//                     <td>₹{Number(kpiData.TotalRevenue).toLocaleString()}</td>
//                   </tr>
//                   <tr>
//                     <th>Units Sold</th>
//                     <td>{Number(kpiData.UnitsSold).toLocaleString()}</td>
//                   </tr>
//                   <tr>
//                     <th>Number of Customers</th>
//                     <td>{Number(kpiData.NumberOfCustomers).toLocaleString()}</td>
//                   </tr>
//                 </tbody>
//               </Table>
//             </Col>
//           </Row>

//           {/* Sales Trend */}
//           <Row className="mb-4">
//             <Col>
//               <h4>Sales Trend</h4>
//               <Card className="p-3" style={{ height: '400px' }}>
//                 <Bar data={salesTrendChartData} options={salesTrendChartOptions} />
//               </Card>
//             </Col>
//           </Row>

//           {/* Top Customers */}
//           <Row className="mb-4">
//             <Col>
//               <h4>Top Customers</h4>
//               <Table striped bordered hover>
//                 <thead>
//                   <tr>
//                     <th>Customer Code</th>
//                     <th>Customer Name</th>
//                     <th>Total Spent (₹)</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {topCustomersData.length > 0 ? (
//                     topCustomersData.map((customer) => (
//                       <tr key={customer.CustomerCode}>
//                         <td>{customer.CustomerCode}</td>
//                         <td>{customer.CustomerName}</td>
//                         <td>{formatCurrency(customer.TotalSpent)}</td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan="3" className="text-center">No customer data available.</td>
//                     </tr>
//                   )}
//                 </tbody>
//               </Table>
//             </Col>
//           </Row>

//           {/* Inventory Levels */}
//           <Row className="mb-4">
//             <Col>
//               <h4>Inventory Levels</h4>
//               <Card className="p-3" style={{ height: '400px' }}>
//                 <Bar data={inventoryChartData} options={chartOptions} />
//               </Card>
//               <Table striped bordered hover className="mt-3">
//                 <thead>
//                   <tr>
//                     <th>Location</th>
//                     <th>Warehouse Name</th>
//                     <th>Quantity</th>
//                     <th>Batch Number</th>
//                     <th>Vendor Batch</th>
//                     <th>COA</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {inventoryData.length > 0 ? (
//                     inventoryData.map((item, index) => {
//                       // Create enhanced item object with ItemCode for COA generation
//                       const enhancedItem = {
//                         ...item,
//                         ItemCode: product.ItemCode // Add ItemCode from product details
//                       };
                      
//                       return (
//                         <tr key={index}>
//                           <td>{item.Location}</td>
//                           <td>{item.WhsName || "N/A"}</td>
//                           <td>{Number(item.Quantity).toLocaleString()}</td>
//                           <td>{item.BatchNum || "N/A"}</td>
//                           <td>{item.VendorBatchNum || "N/A"}</td>
//                           <td className="text-center">
//                             <CoaCell item={enhancedItem} />
//                           </td>
//                         </tr>
//                       );
//                     })
//                   ) : (
//                     <tr>
//                       <td colSpan="6" className="text-center">No inventory data available.</td>
//                     </tr>
//                   )}
//                 </tbody>
//               </Table>
//             </Col>
//           </Row>

//           {/* Additional Information */}
//           <Row className="mb-4">
//             <Col>
//               <h4>Additional Information</h4>
//               <Card body>
//                 <p>
//                   <strong>IUPAC Name:</strong> {product.U_IUPACName || "N/A"}
//                 </p>
//                 <p>
//                   <strong>Synonyms:</strong> {product.U_Synonyms || "N/A"}
//                 </p>
//                 <p>
//                   <strong>Molecular Formula:</strong> {product.U_MolucularFormula || "N/A"}
//                 </p>
//                 <p>
//                   <strong>Applications:</strong> {product.U_Applications || "N/A"}
//                 </p>
//                 <p>
//                   <strong>Structure:</strong> {product.U_Structure ? <a href={product.U_Structure} target="_blank" rel="noopener noreferrer">View Structure</a> : "N/A"}
//                 </p>
//               </Card>
//             </Col>
//           </Row>

//           {/* Back Button */}
//           <div className="mt-3">
//             <button className="btn btn-secondary" onClick={() => router.back()}>
//               Back to Products
//             </button>
//           </div>
//         </Card.Body>
//       </Card>
//     </Container>
//   );
// }

// export async function getServerSideProps(context) {
//   const { id } = context.params;

//   function serializeDates(obj) {
//     const serializedObj = { ...obj };
//     for (const key in serializedObj) {
//       if (serializedObj[key] instanceof Date) {
//         serializedObj[key] = serializedObj[key].toISOString();
//       }
//     }
//     return serializedObj;
//   }

//   try {
//     const product = await getProductDetail(id);

//     if (!product) {
//       return {
//         props: {
//           product: null,
//         },
//       };
//     }

//     // Serialize date fields in the product object
//     const serializedProduct = serializeDates(product);

//     const { kpiData, salesTrendData, topCustomersData, inventoryData } = await getProductKPIs(id);

//     // Serialize date fields in kpiData, salesTrendData, topCustomersData, inventoryData if necessary
//     const serializedKPIData = kpiData ? serializeDates(kpiData) : null;

//     const serializedSalesTrendData = salesTrendData ? salesTrendData.map(item => serializeDates(item)) : [];
//     const serializedTopCustomersData = topCustomersData ? topCustomersData.map(item => serializeDates(item)) : [];
//     const serializedInventoryData = inventoryData ? inventoryData.map(item => serializeDates(item)) : [];

//     return {
//       props: {
//         product: serializedProduct,
//         kpiData: serializedKPIData,
//         salesTrendData: serializedSalesTrendData,
//         topCustomersData: serializedTopCustomersData,
//         inventoryData: serializedInventoryData,
//       },
//     };
//   } catch (error) {
//     console.error("Error fetching product data:", error);
//     return {
//       props: {
//         product: null,
//       },
//     };
//   }
// }


// pages/products/[id].js
import { useRouter } from "next/router";
import { Container, Row, Col, Card, Spinner, Table, Alert, Form, InputGroup, Button } from "react-bootstrap";
import { getProductDetail, getProductKPIs } from "../../lib/models/products";
import { useAuth } from '../../hooks/useAuth';
import { Line, Bar } from 'react-chartjs-2';
import 'chart.js/auto'; // Required for Chart.js 3.x and above
import { formatDate } from "utils/formatDate";
import { formatCurrency } from "utils/formatCurrency";
import { useState, useEffect } from "react";

export default function ProductDetails({ initialProduct, initialKpiData, initialSalesTrendData, initialTopCustomersData, initialInventoryData }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  // State for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // State for product data (initially from props, then updated via search)
  const [product, setProduct] = useState(initialProduct);
  const [kpiData, setKpiData] = useState(initialKpiData);
  const [salesTrendData, setSalesTrendData] = useState(initialSalesTrendData);
  const [topCustomersData, setTopCustomersData] = useState(initialTopCustomersData);
  const [inventoryData, setInventoryData] = useState(initialInventoryData);

  // Initialize search query with current product code
  useEffect(() => {
    if (product) {
      setSearchQuery(product.ItemCode);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">You need to be authenticated to view this page.</Alert>
      </Container>
    );
  }

  // Function to handle product search
  const handleSearch = async (itemCode) => {
    if (!itemCode.trim()) {
      setSearchError('Please enter a product code');
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      // Fetch product details
      const productResponse = await fetch(`/api/products/${encodeURIComponent(itemCode.trim())}`);
      
      if (!productResponse.ok) {
        throw new Error('Product not found');
      }

      const productData = await productResponse.json();

      // Fetch KPI data
      const kpiResponse = await fetch(`/api/products/${encodeURIComponent(itemCode.trim())}/kpis`);
      let kpiResult = null;
      
      if (kpiResponse.ok) {
        kpiResult = await kpiResponse.json();
      }

      // Update all state with new data
      setProduct(productData);
      setKpiData(kpiResult?.kpiData || null);
      setSalesTrendData(kpiResult?.salesTrendData || []);
      setTopCustomersData(kpiResult?.topCustomersData || []);
      setInventoryData(kpiResult?.inventoryData || []);

      // Update URL without page reload
      router.replace(`/products/${encodeURIComponent(itemCode.trim())}`, undefined, { shallow: true });

    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Product not found. Please check the product code and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  // Handle Enter key press in search input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(searchQuery);
    }
  };

  if (!product) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">Product not found</Alert>
      </Container>
    );
  }

  const generateCoaUrl = (item) => {
    const baseUrl = window.location.origin; // Get current domain
    const { CoaSource, LocalCOAFilename, EnergyCoaUrl, ItemCode, VendorBatchNum } = item;
    
    switch (CoaSource) {
      case 'LOCAL':
        if (LocalCOAFilename && LocalCOAFilename.trim() !== '') {
          // Extract just the filename from the full path
          let filename = LocalCOAFilename.trim();
          
          // Handle Windows paths - extract filename after last backslash
          if (filename.includes('\\')) {
            const pathParts = filename.split('\\');
            filename = pathParts[pathParts.length - 1];
          }
          
          // Handle Unix paths - extract filename after last forward slash
          if (filename.includes('/')) {
            const pathParts = filename.split('/');
            filename = pathParts[pathParts.length - 1];
          }
          
          const encodedFilename = encodeURIComponent(filename);
          return {
            url: `${baseUrl}/api/coa/download/${encodedFilename}`,
            type: 'local'
          };
        }
        break;
        
      case 'ENERGY':
        if (ItemCode && VendorBatchNum && VendorBatchNum.trim() !== '' && VendorBatchNum !== 'N/A') {
          // Use proxy endpoint for Energy COAs to force download
          return {
            url: `${baseUrl}/api/coa/download-energy/${encodeURIComponent(ItemCode)}/${encodeURIComponent(VendorBatchNum.trim())}`,
            type: 'energy'
          };
        }
        break;
        
      case 'NONE':
      default:
        return null;
    }
    
    return null;
  };

  // Function to check if COA PDF is available
  const checkCoaAvailability = async (coaInfo) => {
    if (!coaInfo) return false;
    
    try {
      // For local COA files, try a HEAD request first
      const response = await fetch(coaInfo.url, {
        method: 'HEAD',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      // If HEAD request fails, try GET with small range
      if (!response.ok) {
        const getResponse = await fetch(coaInfo.url, {
          method: 'GET',
          headers: {
            'Range': 'bytes=0-1',
            'Cache-Control': 'no-cache'
          }
        });
        
        return getResponse.ok || getResponse.status === 206;
      }
      
      // Check content type to ensure it's a PDF, not JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        console.log('COA returned JSON instead of PDF, marking as unavailable');
        return false;
      }
      
      return response.ok;
      
    } catch (error) {
      console.error('Error checking COA availability:', error);
      return false;
    }
  };

  // Helper function to handle COA download
  const handleCoaDownload = (item) => {
    const coaInfo = generateCoaUrl(item);
    if (coaInfo) {
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = coaInfo.url;
      link.target = '_blank';
      link.download = ''; // This will use the filename from the server
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('COA not available for this item');
    }
  };

  // COA Cell Component with availability check
  const CoaCell = ({ item }) => {
    const [isAvailable, setIsAvailable] = useState(null); // null = loading, true/false = available/not available
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
      const checkAvailability = async () => {
        setIsLoading(true);
        const coaInfo = generateCoaUrl(item);
        
        if (coaInfo) {
          try {
            const available = await checkCoaAvailability(coaInfo);
            setIsAvailable(available);
          } catch (error) {
            console.error('Error checking COA availability:', error);
            setIsAvailable(false);
          }
        } else {
          setIsAvailable(false);
        }
        
        setIsLoading(false);
      };
      
      checkAvailability();
    }, [item]);
    
    if (isLoading) {
      return (
        <div className="d-flex align-items-center justify-content-center">
          <Spinner animation="border" size="sm" />
        </div>
      );
    }
    
    if (isAvailable) {
      return (
        <button
          className="btn btn-link btn-sm p-0"
          onClick={() => handleCoaDownload(item)}
          style={{ 
            color: '#007bff', 
            textDecoration: 'underline',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
          title={`Download COA (${item.CoaSource})`}
        >
          COA
        </button>
      );
    }
    
    return <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>N/A</span>;
  };

  // Prepare data for sales trend chart (Bar Chart)
  const salesTrendLabels = salesTrendData.map(item => item.MonthName);
  const salesTrendRevenue = salesTrendData.map(item => Number(item.MonthlyRevenue));
  const salesTrendUnits = salesTrendData.map(item => Number(item.MonthlyUnitsSold));

  const salesTrendChartData = {
    labels: salesTrendLabels,
    datasets: [
      {
        label: 'Sales Revenue',
        data: salesTrendRevenue,
        backgroundColor: 'rgba(0, 123, 255, 0.7)',
        borderColor: '#007bff',
        borderWidth: 1,
      },
    ],
  };

  // Custom chart options with tooltip configuration
  const salesTrendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        display: false,
      },
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const index = context.dataIndex;
            const sales = salesTrendRevenue[index].toLocaleString('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0
            });
            const units = salesTrendUnits[index].toLocaleString();
            return [`Sales: ${sales}`, `Units Sold: ${units}`];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Sales Revenue (₹)'
        },
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Month'
        }
      }
    }
  };

  // Process inventory data to calculate total quantity per location for the chart
  const inventoryByLocation = inventoryData.reduce((acc, item) => {
    const location = item.Location;
    const quantity = Number(item.Quantity) || 0;
    
    if (acc[location]) {
      acc[location] += quantity;
    } else {
      acc[location] = quantity;
    }
    return acc;
  }, {});

  const inventoryLocations = Object.keys(inventoryByLocation);
  const inventoryQuantities = Object.values(inventoryByLocation);

  const inventoryChartData = {
    labels: inventoryLocations,
    datasets: [
      {
        label: 'Total Inventory Quantity',
        data: inventoryQuantities,
        backgroundColor: '#ffc107',
        borderColor: '#e0a800',
        borderWidth: 1,
      },
    ],
  };

  // Chart options to ensure visibility
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        display: false,
      },
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Quantity'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Location'
        }
      }
    }
  };

  return (
    <Container className="mt-4">
      
      {/* Search Bar Section */}
      <Card className="mb-4">
        <Card.Header>
          <h4 className="mb-0">Product Search</h4>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearchSubmit}>
            <Row className="align-items-center">
              <Col md={8}>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Enter Product Code (e.g., DP00128-500g)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isSearching}
                  />
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    {isSearching ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Searching...
                      </>
                    ) : (
                      'Search'
                    )}
                  </Button>
                </InputGroup>
              </Col>
              <Col md={4}>
                <div className="text-muted small">
                  Press Enter or click Search to find product
                </div>
              </Col>
            </Row>
            {searchError && (
              <Alert variant="danger" className="mt-2 mb-0">
                {searchError}
              </Alert>
            )}
          </Form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h2 className="mb-0">Product Details - {product.ItemName}</h2>
        </Card.Header>
        <Card.Body>
          {/* Basic Information and KPI Summary */}
          
          <Row className="mb-4">
            <Col md={6}>
              <h4>Basic Information</h4>
              <Table bordered>
                <tbody>
                  <tr>
                    <th>Item Code</th>
                    <td>{product.ItemCode}</td>
                  </tr>
                  <tr>
                    <th>Item Name</th>
                    <td>{product.ItemName}</td>
                  </tr>
                  <tr>
                    <th>Item Type</th>
                    <td>{product.ItemType}</td>
                  </tr>
                  <tr>
                    <th>CAS No</th>
                    <td>{product.U_CasNo || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Molecular Weight</th>
                    <td>{product.U_MolucularWeight || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Created Date</th>
                    <td>{formatDate(product.CreateDate)}</td>
                  </tr>
                  <tr>
                    <th>Updated Date</th>
                    <td>{formatDate(product.UpdateDate)}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
            <Col md={6}>
              <h4>KPI Summary</h4>
              <Table bordered>
                <tbody>
                  <tr>
                    <th>Total Revenue Generated</th>
                    <td>₹{kpiData ? Number(kpiData.TotalRevenue).toLocaleString() : 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Units Sold</th>
                    <td>{kpiData ? Number(kpiData.UnitsSold).toLocaleString() : 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Number of Customers</th>
                    <td>{kpiData ? Number(kpiData.NumberOfCustomers).toLocaleString() : 'N/A'}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>

          {/* Sales Trend */}
          {salesTrendData.length > 0 && (
            <Row className="mb-4">
              <Col>
                <h4>Sales Trend</h4>
                <Card className="p-3" style={{ height: '400px' }}>
                  <Bar data={salesTrendChartData} options={salesTrendChartOptions} />
                </Card>
              </Col>
            </Row>
          )}

          {/* Top Customers */}
          <Row className="mb-4">
            <Col>
              <h4>Top Customers</h4>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Customer Code</th>
                    <th>Customer Name</th>
                    <th>Total Spent (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomersData.length > 0 ? (
                    topCustomersData.map((customer) => (
                      <tr key={customer.CustomerCode}>
                        <td>{customer.CustomerCode}</td>
                        <td>{customer.CustomerName}</td>
                        <td>{formatCurrency(customer.TotalSpent)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center">No customer data available.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Col>
          </Row>

          {/* Inventory Levels */}
          <Row className="mb-4">
            <Col>
              <h4>Inventory Levels</h4>
              {inventoryData.length > 0 && (
                <Card className="p-3" style={{ height: '400px' }}>
                  <Bar data={inventoryChartData} options={chartOptions} />
                </Card>
              )}
              <Table striped bordered hover className="mt-3">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Warehouse Name</th>
                    <th>Quantity</th>
                    <th>Batch Number</th>
                    <th>Vendor Batch</th>
                    <th>COA</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.length > 0 ? (
                    inventoryData.map((item, index) => {
                      // Create enhanced item object with ItemCode for COA generation
                      const enhancedItem = {
                        ...item,
                        ItemCode: product.ItemCode // Add ItemCode from product details
                      };
                      
                      return (
                        <tr key={index}>
                          <td>{item.Location}</td>
                          <td>{item.WhsName || "N/A"}</td>
                          <td>{Number(item.Quantity).toLocaleString()}</td>
                          <td>{item.BatchNum || "N/A"}</td>
                          <td>{item.VendorBatchNum || "N/A"}</td>
                          <td className="text-center">
                            <CoaCell item={enhancedItem} />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center">No inventory data available.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Col>
          </Row>

          {/* Additional Information */}
          <Row className="mb-4">
            <Col>
              <h4>Additional Information</h4>
              <Card body>
                <p>
                  <strong>IUPAC Name:</strong> {product.U_IUPACName || "N/A"}
                </p>
                <p>
                  <strong>Synonyms:</strong> {product.U_Synonyms || "N/A"}
                </p>
                <p>
                  <strong>Molecular Formula:</strong> {product.U_MolucularFormula || "N/A"}
                </p>
                <p>
                  <strong>Applications:</strong> {product.U_Applications || "N/A"}
                </p>
                <p>
                  <strong>Structure:</strong> {product.U_Structure ? <a href={product.U_Structure} target="_blank" rel="noopener noreferrer">View Structure</a> : "N/A"}
                </p>
              </Card>
            </Col>
          </Row>

          {/* Back Button */}
          <div className="mt-3">
            <button className="btn btn-secondary" onClick={() => router.back()}>
              Back to Products
            </button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export async function getServerSideProps(context) {
  const { id } = context.params;

  function serializeDates(obj) {
    const serializedObj = { ...obj };
    for (const key in serializedObj) {
      if (serializedObj[key] instanceof Date) {
        serializedObj[key] = serializedObj[key].toISOString();
      }
    }
    return serializedObj;
  }

  try {
    const product = await getProductDetail(id);

    if (!product) {
      return {
        props: {
          initialProduct: null,
        },
      };
    }

    // Serialize date fields in the product object
    const serializedProduct = serializeDates(product);

    const { kpiData, salesTrendData, topCustomersData, inventoryData } = await getProductKPIs(id);

    // Serialize date fields in kpiData, salesTrendData, topCustomersData, inventoryData if necessary
    const serializedKPIData = kpiData ? serializeDates(kpiData) : null;

    const serializedSalesTrendData = salesTrendData ? salesTrendData.map(item => serializeDates(item)) : [];
    const serializedTopCustomersData = topCustomersData ? topCustomersData.map(item => serializeDates(item)) : [];
    const serializedInventoryData = inventoryData ? inventoryData.map(item => serializeDates(item)) : [];

    return {
      props: {
        initialProduct: serializedProduct,
        initialKpiData: serializedKPIData,
        initialSalesTrendData: serializedSalesTrendData,
        initialTopCustomersData: serializedTopCustomersData,
        initialInventoryData: serializedInventoryData,
      },
    };
  } catch (error) {
    console.error("Error fetching product data:", error);
    return {
      props: {
        initialProduct: null,
      },
    };
  }
}