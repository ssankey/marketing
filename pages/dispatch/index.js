// // pages/dispatch/index.js
// import { useState, useEffect } from "react";
// import { useRouter } from "next/router";
// import { Spinner, Alert, Button, Form, Card } from "react-bootstrap";
// import {
//   useReactTable,
//   getCoreRowModel,
//   getFilteredRowModel,
//   flexRender,
// } from "@tanstack/react-table";
// import { formatCurrency } from "utils/formatCurrency";
// import { formatDate } from "utils/formatDate";
// import downloadExcel from "utils/exporttoexcel";

// export default function InvoiceDetailsPage() {
//   const router = useRouter();
//   const { docEntry, docNum, refNo } = router.query;
//   const [invoiceData, setInvoiceData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [headerData, setHeaderData] = useState(null);
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [isPdfAvailable, setIsPdfAvailable] = useState(false);

//   useEffect(() => {
//     if (!docEntry || !docNum ) return;

//     const fetchInvoiceDetails = async () => {
//       try {
//         setLoading(true);
//         setError(null);
        
//         const response = await fetch(
//           `/api/invoices/public-detail?docEntry=${docEntry}&docNum=${docNum}&refNo=${encodeURIComponent(refNo)}`
//         );

//         if (!response.ok) {
//           if (response.status === 404) {
//             const errorData = await response.json();
//             throw new Error(errorData.message || 'No dispatch details found');
//           }
//           throw new Error(`Failed to fetch invoice: ${response.status}`);
//         }

//         const data = await response.json();
        
//         if (!data || !data.LineItems) {
//           throw new Error('No dispatch details found');
//         }

//         // Set header data from the response
//         setHeaderData({
//           InvoiceNo: data.InvoiceNo,
//           InvoiceDate: data.InvoiceDate,
//           CustomerName: data.CustomerName,
//           CustomerCode: data.CustomerCode,
//           SalesPersonName: data.SalesPersonName,
//           PaymentTerms: data.PaymentTerms,
//           CustomerPONo: data.CustomerPONo,
//           TrackingNumber: "25020250021531", // Example tracking number
//           TransportName: "Shree Maruti Courier", // Example transport name
//           TrackingUpdatedDate: data.InvoiceDate, // Using invoice date as example
//           DeliveryDate: null, // N/A for estimated delivery
//         });

//         // Set line items data
//         setInvoiceData(data.LineItems);

//         // Check PDF availability after setting header data
//         checkPdfAvailability();
//       } catch (error) {
//         setError(error.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchInvoiceDetails();
//   }, [docEntry, docNum, refNo]);

//   // Generate tracking link based on transport name
//   const generateTrackingLink = (transportName, trackingNumber) => {
//     const lowerTransportName = transportName.toLowerCase();
    
//     if (lowerTransportName.includes('shree maruti')) {
//       return `https://trackcourier.io/track-and-trace/shree-maruti-courier/${trackingNumber}`;
//     } else if (lowerTransportName.includes('bluedart') || lowerTransportName.includes('blue dart')) {
//       return `https://trackcourier.io/track-and-trace/blue-dart-courier/${trackingNumber}`;
//     }
    
//     return null;
//   };

//   // Check PDF availability
//   const checkPdfAvailability = async () => {
//     if (!headerData?.InvoiceNo) return;
    
//     try {
//       const response = await fetch('/api/invoices/check-pdf-availability', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ docNum: headerData.InvoiceNo }),
//       });
      
//       if (response.ok) {
//         const result = await response.json();
//         setIsPdfAvailable(result.available);
//       }
//     } catch (error) {
//       console.error('PDF check failed:', error);
//       setIsPdfAvailable(false);
//     }
//   };

//   // Check COA availability
//   const checkCoaAvailability = async (itemCode, vendorBatchNum) => {
//     try {
//       const response = await fetch('/api/invoices/check-coa-availability', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ itemCode, vendorBatchNum }),
//       });
      
//       if (response.ok) {
//         const result = await response.json();
//         return result;
//       }
//     } catch (error) {
//       console.error('COA check failed:', error);
//     }
//     return { available: false };
//   };

//   const columns = [
//      {
//     accessorKey: "serialNo",
//     header: "No.",
//     cell: ({ row }) => row.index + 1,
//     },
//     {
//       accessorKey: "ItemNo",
//       header: "Item No.",
//       cell: ({ getValue }) => getValue() || "-",
//     },
//     {
//       accessorKey: "ItemDescription",
//       header: "Item/Service Description",
//       cell: ({ getValue }) => getValue() || "-",
//     },
//     {
//       accessorKey: "CasNo",
//       header: "CAS No.",
//       cell: ({ getValue }) => getValue() || "-",
//     },
//     {
//       accessorKey: "Unit",
//       header: "Unit",
//       cell: ({ getValue }) => getValue() || "-",
//     },
//     {
//       accessorKey: "PackSize",
//       header: "Pack Size",
//       cell: ({ getValue }) => getValue() || "-",
//     },
//     {
//       accessorKey: "UnitSalesPrice",
//       header: "Unit Sales Price",
//       cell: ({ getValue }) => formatCurrency(getValue()) || "-",
//     },
//     {
//       accessorKey: "Qty",
//       header: "QTY",
//       cell: ({ getValue }) => getValue() || "-",
//     },
//     {
//       accessorKey: "TotalSalesPrice",
//       header: "Total Sales Price",
//       cell: ({ getValue }) => formatCurrency(getValue()) || "-",
//     },
//       {
//   accessorKey: "VendorBatchNum",
//   header: "COA",
//   cell: ({ row }) => {
//     const itemCode = row.original.ItemNo;
//     const vendorBatchNum = row.original.VendorBatchNum;
    
//     // Only proceed if we have both item code and vendor batch number
//     if (!itemCode || !vendorBatchNum) {
//       return null; // Return null to render nothing
//     }

//     // Use state to track COA availability
//     const [coaAvailable, setCoaAvailable] = useState(false);
//     const [loading, setLoading] = useState(true);

//     // Check COA availability when component mounts
//     useEffect(() => {
//       const checkCoa = async () => {
//         try {
//           const result = await checkCoaAvailability(itemCode, vendorBatchNum);
//           setCoaAvailable(result.available);
//         } catch (error) {
//           console.error('COA check error:', error);
//           setCoaAvailable(false);
//         } finally {
//           setLoading(false);
//         }
//       };
//       checkCoa();
//     }, [itemCode, vendorBatchNum]);

//     // Show loading spinner while checking
//     if (loading) {
//       return <Spinner animation="border" size="sm" />;
//     }

//     // Don't show anything if COA not available
//     if (!coaAvailable) {
//       return null;
//     }

//     // Only show COA button if available
//     return (
//       <Button
//         variant="link"
//         size="sm"
//         className="p-0 text-primary"
//         onClick={() => {
//           window.open(`/api/invoices/get-coa?itemCode=${itemCode}&batchNum=${vendorBatchNum}`, '_blank');
//         }}
//       >
//         COA
//       </Button>
//     );
//   },
// }
    
//   ];

//   const table = useReactTable({
//     data: invoiceData,
//     columns,
//     getCoreRowModel: getCoreRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),
//     state: {
//       globalFilter,
//     },
//     onGlobalFilterChange: setGlobalFilter,
//   });


// const handleExportExcel = async () => {
//   const exportButton = document.querySelector('[onclick="handleExportExcel()"]');
//   if (exportButton) {
//     exportButton.disabled = true;
//     exportButton.textContent = 'Exporting...';
//   }

//   try {
//     const ExcelJS = (await import('exceljs')).default;
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Invoice Details');

//     // Add headers
//     worksheet.columns = [
//       { header: 'Item No.', key: 'itemNo', width: 15 },
//       { header: 'Item/Service Description', key: 'description', width: 30 },
//       { header: 'CAS No.', key: 'casNo', width: 15 },
//       { header: 'Unit', key: 'unit', width: 10 },
//       { header: 'Pack Size', key: 'packSize', width: 10 },
//       { header: 'Unit Sales Price', key: 'unitPrice', width: 15 },
//       { header: 'QTY', key: 'quantity', width: 10 },
//       { header: 'Total Sales Price', key: 'totalPrice', width: 15 },
//       { header: 'COA', key: 'coa', width: 10 }
//     ];

//     // Add data rows
//     for (const row of invoiceData) {
//       const newRow = {
//         itemNo: row.ItemNo || '-',
//         description: row.ItemDescription || '-',
//         casNo: row.CasNo || '-',
//         unit: row.Unit || '-',
//         packSize: row.PackSize || '-',
//         unitPrice: row.UnitSalesPrice ? formatCurrency(row.UnitSalesPrice).slice(1) : '-',
//         quantity: row.Qty || '-',
//         totalPrice: row.TotalSalesPrice ? formatCurrency(row.TotalSalesPrice).slice(1) : '-',
//         coa: '' // Default to empty string instead of '-'
//       };

//       if (row.ItemNo && row.VendorBatchNum) {
//         try {
//           const coaResult = await checkCoaAvailability(row.ItemNo, row.VendorBatchNum);
//           if (coaResult.available) {
//             // Add the row first
//             const excelRow = worksheet.addRow(newRow);
            
//             // Then modify the COA cell to be a hyperlink
//             excelRow.getCell('coa').value = {
//               text: 'COA',
//               hyperlink: coaResult.downloadUrl
//             };
//             excelRow.getCell('coa').font = { 
//               color: { argb: 'FF0000FF' }, 
//               underline: true 
//             };
//             continue; // Skip the default row addition
//           }
//         } catch (error) {
//           console.error('COA check failed:', error);
//           // Keep COA cell empty on error
//         }
//       }

//       // Add regular row (without hyperlink)
//       worksheet.addRow(newRow);
//     }

//     // Style the header row
//     worksheet.getRow(1).eachCell((cell) => {
//       cell.font = { bold: true };
//       cell.fill = {
//         type: 'pattern',
//         pattern: 'solid',
//         fgColor: { argb: 'FF343A40' }
//       };
//       cell.font = { color: { argb: 'FFFFFFFF' } };
//     });

//     // Generate Excel file
//     const buffer = await workbook.xlsx.writeBuffer();
//     const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `Invoice_${headerData?.InvoiceNo || 'Details'}.xlsx`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//   } catch (error) {
//     console.error('Export failed:', error);
//     alert('Export failed. Please try again.');
//   } finally {
//     const exportButton = document.querySelector('[onclick="handleExportExcel()"]');
//     if (exportButton) {
//       exportButton.disabled = false;
//       exportButton.textContent = 'Export to Excel';
//     }
//   }
// };

//   const handleDownloadInvoicePdf = async () => {
//     const pdfResult = await checkPdfAvailability();
//     if (pdfResult.available) {
//       const hardcodedBaseUrl = "https://marketing.densitypharmachem.com";
//       const fullPdfUrl = `${hardcodedBaseUrl}${pdfResult.downloadUrl}?download=true`;
//       window.open(fullPdfUrl, '_blank');
//     } else {
//       alert('Invoice PDF not available');
//     }
//   };

//   // Show error alert if dispatch details not found
//   if (error) {
//     return (
//       <div className="container mt-5">
//         <Alert variant="danger" className="text-center">
//           <Alert.Heading>No Dispatch Details Found</Alert.Heading>
//           <p className="mb-3">{error}</p>
//           <p>Please check your reference number and try again.</p>
//           <Button variant="outline-danger" onClick={() => router.back()}>
//             Go Back
//           </Button>
//         </Alert>
//       </div>
//     );
//   }

//   // Show parameter validation error
//   if (!docEntry || !docNum ) {
//     return (
//       <div className="container mt-5">
//         <Alert variant="warning" className="text-center">
//           <Alert.Heading>Invalid URL Parameters</Alert.Heading>
//           <p>Required parameters (docEntry, docNum) are missing from the URL.</p>
//           <Button variant="outline-warning" onClick={() => router.back()}>
//             Go Back
//           </Button>
//         </Alert>
//       </div>
//     );
//   }

//   return (
//     <div className="container-fluid p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
//       {/* Dispatch Details Card */}
//       {headerData && (
//         <Card className="mb-4 shadow-sm border-0">
//           <Card.Header 
//             className="py-3 px-4"
//             style={{
//               backgroundColor: '#343a40',
//               color: 'white',
//               fontSize: '1.1rem'
//             }}
//           >
//             <h5 className="mb-0 text-white">Dispatch Details</h5>
//           </Card.Header>
//           <Card.Body className="p-4" style={{ backgroundColor: 'white' }}>
//             <div className="dispatch-info">
//               <p className="mb-3" style={{ fontSize: '0.95rem' }}>
//                 <strong>Our Invoice Number:</strong> {headerData.InvoiceNo} – Dated # {formatDate(headerData.InvoiceDate)}
//               </p>
//               <p className="mb-3" style={{ fontSize: '0.95rem' }}>
//                 <strong>Customer PO Number:</strong> {headerData.CustomerPONo}
//               </p>
//               <p className="mb-3" style={{ fontSize: '0.95rem' }}>
//                 <strong>Carrier name:</strong> {headerData.TransportName}
//               </p>
//               <p className="mb-3" style={{ fontSize: '0.95rem' }}>
//                 <strong>Tracking Number:</strong> {headerData.TrackingNumber} – Dated # {formatDate(headerData.TrackingUpdatedDate)}
//               </p>
//               {headerData.TransportName && headerData.TrackingNumber && (
//                 <p className="mb-3" style={{ fontSize: '0.95rem' }}>
//                   <strong>Click to Track shipment:</strong>{' '}
//                   <a 
//                     href={generateTrackingLink(headerData.TransportName, headerData.TrackingNumber)}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="text-primary"
//                   >
//                     {generateTrackingLink(headerData.TransportName, headerData.TrackingNumber)}
//                   </a>
//                 </p>
//               )}
//               <p className="mb-0" style={{ fontSize: '0.95rem' }}>
//                 <strong>Estimated Delivery Date:</strong> {headerData.DeliveryDate ? formatDate(headerData.DeliveryDate) : 'N/A'}
//               </p>
//             </div>
//           </Card.Body>
//         </Card>
//       )}

//       {/* Invoice PDF Download Link - Only show if PDF is available */}
//       {headerData && isPdfAvailable && (
//         <div className="mb-4">
//           <span 
//             className="fw-bold"
//             style={{ 
//               cursor: 'pointer',
//               color: 'black',
//               fontSize: '1rem'
//             }}
//             onClick={handleDownloadInvoicePdf}
//           >
//             Click here to download the Invoice PDF - 
//           </span>
//           <span 
//             className="text-primary fw-bold ms-1"
//             style={{ 
//               cursor: 'pointer',
//               textDecoration: 'underline',
//               fontSize: '1rem'
//             }}
//             onClick={handleDownloadInvoicePdf}
//           >
//             INV
//           </span>
//         </div>
//       )}

//       {/* Items Shipped Card */}
//       <Card className="shadow-sm border-0">
//         <Card.Header 
//           className="py-3 px-4"
//           style={{
//             backgroundColor: '#343a40',
//             color: 'white'
//           }}
//         >
//           <div className="d-flex align-items-center justify-content-between w-100">
//             <h5 className="mb-0 text-white" style={{ fontSize: '1.1rem' }}>Items Shipped:</h5>
//             <div className="d-flex align-items-center gap-3">
//               <Form.Control
//                 type="text"
//                 placeholder="Search all columns..."
//                 value={globalFilter}
//                 onChange={(e) => setGlobalFilter(e.target.value)}
//                 style={{ width: '300px' }}
//                 size="lg"
//                 className="border-0"
//               />
//               <Button 
//                 variant="success" 
//                 size="lg"
//                 onClick={handleExportExcel} 
//                 disabled={loading}
//                 className="px-4"
//               >
//                 Export to Excel
//               </Button>
//             </div>
//           </div>
//         </Card.Header>
//         <Card.Body className="p-0" style={{ backgroundColor: 'white' }}>
//           {loading ? (
//             <div className="d-flex justify-content-center my-5">
//               <div className="bg-white p-4 rounded shadow">
//                 <Spinner animation="border" variant="primary" />
//                 <span className="ms-2">Loading invoice details...</span>
//               </div>
//             </div>
//           ) : (
//             <div 
//               className="border rounded overflow-auto" 
//               style={{ height: "65vh" }}
//             >
//               <table className="table table-striped table-hover mb-0">
//                 <thead 
//                   className="sticky-top"
//                   style={{
//                     backgroundColor: '#343a40',
//                     color: 'white'
//                   }}
//                 >
//                   {table.getHeaderGroups().map((headerGroup) => (
//                     <tr key={headerGroup.id}>
//                       {headerGroup.headers.map((header) => (
//                         <th 
//                           key={header.id} 
//                           className="px-4 py-3 text-nowrap"
//                           style={{
//                             backgroundColor: '#343a40',
//                             color: 'white',
//                             fontSize: '0.95rem'
//                           }}
//                         >
//                           {flexRender(
//                             header.column.columnDef.header,
//                             header.getContext()
//                           )}
//                         </th>
//                       ))}
//                     </tr>
//                   ))}
//                 </thead>
//                 <tbody>
//                   {table.getRowModel().rows.length === 0 ? (
//                     <tr>
//                       <td colSpan={columns.length} className="p-4 text-center">
//                         No items found matching your search criteria
//                       </td>
//                     </tr>
//                   ) : (
//                     table.getRowModel().rows.map((row) => (
//                       <tr key={row.id}>
//                         {row.getVisibleCells().map((cell) => (
//                           <td key={cell.id} className="px-4 py-2 text-nowrap">
//                             {flexRender(
//                               cell.column.columnDef.cell,
//                               cell.getContext()
//                             )}
//                           </td>
//                         ))}
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </Card.Body>
//       </Card>
//     </div>
//   );
// }

// InvoiceDetailsPage.seo = {
//   title: "Invoice Details | Density",
//   description: "View detailed invoice information",
//   keywords: "invoice, details, sales, items",
// };
// pages/dispatch/index.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Spinner, Alert, Button, Form, Card } from "react-bootstrap";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";

export default function InvoiceDetailsPage() {
  const router = useRouter();
  const { docEntry, docNum, refNo } = router.query;
  const [invoiceData, setInvoiceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [headerData, setHeaderData] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isPdfAvailable, setIsPdfAvailable] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [coaAvailability, setCoaAvailability] = useState({});

  useEffect(() => {
    if (!docEntry || !docNum) return;

    const fetchInvoiceDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `/api/invoices/public-detail?docEntry=${docEntry}&docNum=${docNum}${refNo ? `&refNo=${encodeURIComponent(refNo)}` : ''}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'No dispatch details found');
          }
          throw new Error(`Failed to fetch invoice: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data || !data.LineItems) {
          throw new Error('No dispatch details found');
        }

        setHeaderData({
          InvoiceNo: data.InvoiceNo,
          InvoiceDate: data.InvoiceDate,
          CustomerName: data.CustomerName,
          CustomerCode: data.CustomerCode,
          SalesPersonName: data.SalesPersonName,
          PaymentTerms: data.PaymentTerms,
          CustomerPONo: data.CustomerPONo,
          TrackingNumber: "25020250021531",
          TransportName: "Shree Maruti Courier",
          TrackingUpdatedDate: data.InvoiceDate,
          DeliveryDate: null,
        });

        setInvoiceData(data.LineItems);
        checkPdfAvailability();
        
        // Pre-check COA availability for all items
        checkAllCoas(data.LineItems);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [docEntry, docNum, refNo]);

  // Pre-check COA availability for all items
  const checkAllCoas = async (lineItems) => {
    const availabilityMap = {};
    const itemsToCheck = lineItems.filter(item => item.ItemNo && item.VendorBatchNum);
    
    // Check COAs in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < itemsToCheck.length; i += batchSize) {
      const batch = itemsToCheck.slice(i, i + batchSize);
      await Promise.all(batch.map(async (item) => {
        try {
          const result = await checkCoaAvailability(item.ItemNo, item.VendorBatchNum);
          availabilityMap[`${item.ItemNo}-${item.VendorBatchNum}`] = result.available;
        } catch (error) {
          console.error('COA check error:', error);
          availabilityMap[`${item.ItemNo}-${item.VendorBatchNum}`] = false;
        }
      }));
    }
    
    setCoaAvailability(availabilityMap);
  };

  const generateTrackingLink = (transportName, trackingNumber) => {
    const lowerTransportName = transportName.toLowerCase();
    
    if (lowerTransportName.includes('shree maruti')) {
      return `https://trackcourier.io/track-and-trace/shree-maruti-courier/${trackingNumber}`;
    } else if (lowerTransportName.includes('bluedart') || lowerTransportName.includes('blue dart')) {
      return `https://trackcourier.io/track-and-trace/blue-dart-courier/${trackingNumber}`;
    }
    
    return null;
  };

  const checkPdfAvailability = async () => {
    if (!headerData?.InvoiceNo) return;
    
    try {
      const response = await fetch('/api/invoices/check-pdf-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docNum: headerData.InvoiceNo }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setIsPdfAvailable(result.available);
      }
    } catch (error) {
      console.error('PDF check failed:', error);
      setIsPdfAvailable(false);
    }
  };

  const checkCoaAvailability = async (itemCode, vendorBatchNum) => {
    try {
      const response = await fetch('/api/invoices/check-coa-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemCode, vendorBatchNum }),
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('COA check failed:', error);
    }
    return { available: false };
  };

  const columns = [
    {
      accessorKey: "serialNo",
      header: "No.",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "ItemNo",
      header: "Item No.",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorKey: "ItemDescription",
      header: "Item/Service Description",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorKey: "CasNo",
      header: "CAS No.",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorKey: "Unit",
      header: "Unit",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorKey: "PackSize",
      header: "Pack Size",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorKey: "UnitSalesPrice",
      header: "Unit Sales Price",
      cell: ({ getValue }) => formatCurrency(getValue()) || "-",
    },
    {
      accessorKey: "Qty",
      header: "QTY",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorKey: "TotalSalesPrice",
      header: "Total Sales Price",
      cell: ({ getValue }) => formatCurrency(getValue()) || "-",
    },
    {
      accessorKey: "VendorBatchNum",
      header: "COA",
      cell: ({ row }) => {
        const itemCode = row.original.ItemNo;
        const vendorBatchNum = row.original.VendorBatchNum;
        
        if (!itemCode || !vendorBatchNum) {
          return null;
        }

        const coaKey = `${itemCode}-${vendorBatchNum}`;
        const isAvailable = coaAvailability[coaKey];
        
        if (isAvailable === undefined) {
          return <Spinner animation="border" size="sm" />;
        }

        if (!isAvailable) {
          return null;
        }

        return (
          <Button
            variant="link"
            size="sm"
            className="p-0 text-primary"
            onClick={() => {
              window.open(`/api/invoices/get-coa?itemCode=${itemCode}&batchNum=${vendorBatchNum}`, '_blank');
            }}
          >
            COA
          </Button>
        );
      },
    }
  ];

  const table = useReactTable({
    data: invoiceData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const handleExportExcel = async () => {
    setIsExporting(true);
    
    try {
      // Dynamically import ExcelJS only when needed
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Invoice Details');

      // Add headers
      worksheet.columns = [
        { header: 'No.', key: 'serialNo', width: 10 },
        { header: 'Item No.', key: 'itemNo', width: 15 },
        { header: 'Item/Service Description', key: 'description', width: 30 },
        { header: 'CAS No.', key: 'casNo', width: 15 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'Pack Size', key: 'packSize', width: 10 },
        { header: 'Unit Sales Price', key: 'unitPrice', width: 15 },
        { header: 'QTY', key: 'quantity', width: 10 },
        { header: 'Total Sales Price', key: 'totalPrice', width: 15 },
        { header: 'COA', key: 'coa', width: 10 }
      ];

      // Add data rows
      invoiceData.forEach((row, index) => {
        const newRow = {
          serialNo: index + 1,
          itemNo: row.ItemNo || '-',
          description: row.ItemDescription || '-',
          casNo: row.CasNo || '-',
          unit: row.Unit || '-',
          packSize: row.PackSize || '-',
          unitPrice: row.UnitSalesPrice ? formatCurrency(row.UnitSalesPrice).slice(1) : '-',
          quantity: row.Qty || '-',
          totalPrice: row.TotalSalesPrice ? formatCurrency(row.TotalSalesPrice).slice(1) : '-',
          coa: ''
        };

        // Use pre-checked COA availability
        if (row.ItemNo && row.VendorBatchNum) {
          const coaKey = `${row.ItemNo}-${row.VendorBatchNum}`;
          if (coaAvailability[coaKey]) {
            newRow.coa = {
              text: 'COA',
              hyperlink: `/api/invoices/get-coa?itemCode=${row.ItemNo}&batchNum=${row.VendorBatchNum}`
            };
          }
        }

        const excelRow = worksheet.addRow(newRow);
        
        // Format COA cell if available
        if (newRow.coa && typeof newRow.coa === 'object') {
          excelRow.getCell('coa').value = newRow.coa;
          excelRow.getCell('coa').font = { 
            color: { argb: 'FF0000FF' }, 
            underline: true 
          };
        }
      });

      // Style the header row
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF343A40' }
        };
        cell.font = { color: { argb: 'FFFFFFFF' } };
      });

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${headerData?.InvoiceNo || 'Details'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadInvoicePdf = async () => {
    if (!isPdfAvailable) return;
    
    try {
      const response = await fetch('/api/invoices/check-pdf-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docNum: headerData.InvoiceNo }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.available) {
          const hardcodedBaseUrl = "https://marketing.densitypharmachem.com";
          const fullPdfUrl = `${hardcodedBaseUrl}${result.downloadUrl}?download=true`;
          window.open(fullPdfUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="container mt-5">
        <Alert variant="danger" className="text-center">
          <Alert.Heading>No Dispatch Details Found</Alert.Heading>
          <p className="mb-3">{error}</p>
          <p>Please check your reference number and try again.</p>
          <Button variant="outline-danger" onClick={() => router.back()}>
            Go Back
          </Button>
        </Alert>
      </div>
    );
  }

  if (!docEntry || !docNum) {
    return (
      <div className="container mt-5">
        <Alert variant="warning" className="text-center">
          <Alert.Heading>Invalid URL Parameters</Alert.Heading>
          <p>Required parameters (docEntry, docNum) are missing from the URL.</p>
          <Button variant="outline-warning" onClick={() => router.back()}>
            Go Back
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {headerData && (
        <Card className="mb-4 shadow-sm border-0">
          <Card.Header 
            className="py-3 px-4"
            style={{
              backgroundColor: '#343a40',
              color: 'white',
              fontSize: '1.1rem'
            }}
          >
            <h5 className="mb-0 text-white">Dispatch Details</h5>
          </Card.Header>
          <Card.Body className="p-4" style={{ backgroundColor: 'white' }}>
            <div className="dispatch-info">
              <p className="mb-3" style={{ fontSize: '0.95rem' }}>
                <strong>Our Invoice Number:</strong> {headerData.InvoiceNo} – Dated # {formatDate(headerData.InvoiceDate)}
              </p>
              <p className="mb-3" style={{ fontSize: '0.95rem' }}>
                <strong>Customer PO Number:</strong> {headerData.CustomerPONo}
              </p>
              <p className="mb-3" style={{ fontSize: '0.95rem' }}>
                <strong>Carrier name:</strong> {headerData.TransportName}
              </p>
              <p className="mb-3" style={{ fontSize: '0.95rem' }}>
                <strong>Tracking Number:</strong> {headerData.TrackingNumber} – Dated # {formatDate(headerData.TrackingUpdatedDate)}
              </p>
              {headerData.TransportName && headerData.TrackingNumber && (
                <p className="mb-3" style={{ fontSize: '0.95rem' }}>
                  <strong>Click to Track shipment:</strong>{' '}
                  <a 
                    href={generateTrackingLink(headerData.TransportName, headerData.TrackingNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary"
                  >
                    {generateTrackingLink(headerData.TransportName, headerData.TrackingNumber)}
                  </a>
                </p>
              )}
              <p className="mb-0" style={{ fontSize: '0.95rem' }}>
                <strong>Estimated Delivery Date:</strong> {headerData.DeliveryDate ? formatDate(headerData.DeliveryDate) : 'N/A'}
              </p>
            </div>
          </Card.Body>
        </Card>
      )}

      {headerData && isPdfAvailable && (
        <div className="mb-4">
          <span 
            className="fw-bold"
            style={{ 
              cursor: 'pointer',
              color: 'black',
              fontSize: '1rem'
            }}
            onClick={handleDownloadInvoicePdf}
          >
            Click here to download the Invoice PDF - 
          </span>
          <span 
            className="text-primary fw-bold ms-1"
            style={{ 
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '1rem'
            }}
            onClick={handleDownloadInvoicePdf}
          >
            INV
          </span>
        </div>
      )}

      <Card className="shadow-sm border-0">
        <Card.Header 
          className="py-3 px-4"
          style={{
            backgroundColor: '#343a40',
            color: 'white'
          }}
        >
          <div className="d-flex align-items-center justify-content-between w-100">
            <h5 className="mb-0 text-white" style={{ fontSize: '1.1rem' }}>Items Shipped:</h5>
            <div className="d-flex align-items-center gap-3">
              <Form.Control
                type="text"
                placeholder="Search all columns..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                style={{ width: '300px' }}
                size="lg"
                className="border-0"
              />
              <Button 
                variant="success" 
                size="lg"
                onClick={handleExportExcel} 
                disabled={loading || isExporting}
                className="px-4"
              >
                {isExporting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2">Exporting...</span>
                  </>
                ) : (
                  'Export to Excel'
                )}
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0" style={{ backgroundColor: 'white' }}>
          {loading ? (
            <div className="d-flex justify-content-center my-5">
              <div className="bg-white p-4 rounded shadow">
                <Spinner animation="border" variant="primary" />
                <span className="ms-2">Loading invoice details...</span>
              </div>
            </div>
          ) : (
            <div 
              className="border rounded overflow-auto" 
              style={{ height: "65vh" }}
            >
              <table className="table table-striped table-hover mb-0">
                <thead 
                  className="sticky-top"
                  style={{
                    backgroundColor: '#343a40',
                    color: 'white'
                  }}
                >
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th 
                          key={header.id} 
                          className="px-4 py-3 text-nowrap"
                          style={{
                            backgroundColor: '#343a40',
                            color: 'white',
                            fontSize: '0.95rem'
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="p-4 text-center">
                        No items found matching your search criteria
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-2 text-nowrap">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

InvoiceDetailsPage.seo = {
  title: "Invoice Details | Density",
  description: "View detailed invoice information",
  keywords: "invoice, details, sales, items",
};