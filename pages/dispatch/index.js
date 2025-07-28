
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
  const [pdfCheckCompleted, setPdfCheckCompleted] = useState(false);

  useEffect(() => {
    if (!docEntry || !docNum) return;

 
    const fetchInvoiceDetails = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Fetch basic invoice data
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

    // Fetch transport details separately
    let transportData = {};
    try {
      const transportResponse = await fetch(
        `/api/invoices/transport-details?docEntry=${docEntry}`
      );
      if (transportResponse.ok) {
        transportData = await transportResponse.json();
      } else {
        console.warn('Failed to fetch transport details, using fallback values');
      }
    } catch (transportError) {
      console.error('Error fetching transport details:', transportError);
    }

    const headerInfo = {
      InvoiceNo: data.InvoiceNo,
      InvoiceDate: data.InvoiceDate,
      CustomerName: data.CustomerName,
      CustomerCode: data.CustomerCode,
      SalesPersonName: data.SalesPersonName,
      PaymentTerms: data.PaymentTerms,
      CustomerPONo: data.CustomerPONo,
      TrackingNumber: transportData.TrackingNumber || data.TrackingNumber || "N/A",
      TransportName: transportData.TransportName || data.TransportName || "null",
      TrackingUpdatedDate: transportData.TrackingUpdatedDate || data.TrackingUpdatedDate || data.InvoiceDate,
      DeliveryDate: null,
    };

    setHeaderData(headerInfo);
    setInvoiceData(data.LineItems);
    
    // Check PDF availability immediately after setting header data
    await checkPdfAvailability(headerInfo.InvoiceNo);
    
    // Pre-check COA availability for all items
    await checkAllCoas(data.LineItems);
  } catch (error) {
    setError(error.message);
    console.error('Error fetching invoice details:', error);
  } finally {
    setLoading(false);
  }
};
    fetchInvoiceDetails();
  }, [docEntry, docNum, refNo]);

  // Pre-check COA availability for all items using the corrected approach
  // const checkAllCoas = async (lineItems) => {
  //   const availabilityMap = {};
    
  //   // First, get detailed invoice data to access VendorBatchNum
  //   try {
  //     const detailResponse = await fetch(
  //       `/api/invoices/detail?docEntry=${docEntry}&docNum=${docNum}`
  //     );
      
  //     if (detailResponse.ok) {
  //       const invoiceDetail = await detailResponse.json();
        
  //       if (invoiceDetail?.LineItems) {
  //         // Check COAs in batches to avoid overwhelming the server
  //         const batchSize = 5;
  //         const itemsToCheck = invoiceDetail.LineItems.filter(item => item.ItemCode && item.VendorBatchNum);
          
  //         for (let i = 0; i < itemsToCheck.length; i += batchSize) {
  //           const batch = itemsToCheck.slice(i, i + batchSize);
  //           await Promise.all(batch.map(async (item) => {
  //             try {
  //               const coaCheckResponse = await fetch('/api/invoices/check-coa-availability', {
  //                 method: 'POST',
  //                 headers: { 'Content-Type': 'application/json' },
  //                 body: JSON.stringify({ 
  //                   itemCode: item.ItemCode, 
  //                   vendorBatchNum: item.VendorBatchNum 
  //                 }),
  //               });
                
  //               if (coaCheckResponse.ok) {
  //                 const result = await coaCheckResponse.json();
  //                 availabilityMap[`${item.ItemCode}-${item.VendorBatchNum}`] = result.available;
  //               } else {
  //                 availabilityMap[`${item.ItemCode}-${item.VendorBatchNum}`] = false;
  //               }
  //             } catch (error) {
  //               console.error('COA check error:', error);
  //               availabilityMap[`${item.ItemCode}-${item.VendorBatchNum}`] = false;
  //             }
  //           }));
  //         }
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Failed to fetch detailed invoice data for COA checks:', error);
  //   }
    
  //   setCoaAvailability(availabilityMap);
  // };
  const checkAllCoas = async (lineItems) => {
  const availabilityMap = {};
  
  try {
    const detailResponse = await fetch(
      `/api/invoices/detail?docEntry=${docEntry}&docNum=${docNum}`
    );
    
    if (detailResponse.ok) {
      const invoiceDetail = await detailResponse.json();
      
      if (invoiceDetail?.LineItems) {
        const batchSize = 5;
        const itemsToCheck = invoiceDetail.LineItems.filter(item => item.ItemCode && item.VendorBatchNum);
        
        for (let i = 0; i < itemsToCheck.length; i += batchSize) {
          const batch = itemsToCheck.slice(i, i + batchSize);
          await Promise.all(batch.map(async (item) => {
            try {
              const coaCheckResponse = await fetch('/api/invoices/check-coa-availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  itemCode: item.ItemCode, 
                  vendorBatchNum: item.VendorBatchNum 
                }),
              });
              
              if (coaCheckResponse.ok) {
                const result = await coaCheckResponse.json();
                // Store both availability and download URL
                availabilityMap[`${item.ItemCode}-${item.VendorBatchNum}`] = {
                  available: result.available,
                  downloadUrl: result.downloadUrl
                };
              } else {
                availabilityMap[`${item.ItemCode}-${item.VendorBatchNum}`] = {
                  available: false,
                  downloadUrl: null
                };
              }
            } catch (error) {
              console.error('COA check error:', error);
              availabilityMap[`${item.ItemCode}-${item.VendorBatchNum}`] = {
                available: false,
                downloadUrl: null
              };
            }
          }));
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch detailed invoice data for COA checks:', error);
  }
  
  setCoaAvailability(availabilityMap);
};

 
  const generateTrackingLink = (transportName, trackingNumber) => {
  if (!transportName || !trackingNumber) return null;
  
  const lowerTransportName = transportName.toLowerCase();
  
  if (lowerTransportName.includes('shree maruti')) {
    return `https://trackcourier.io/track-and-trace/shree-maruti-courier/${trackingNumber}`;
  } else if (lowerTransportName.includes('bluedart') || lowerTransportName.includes('blue dart')) {
    return `https://trackcourier.io/track-and-trace/blue-dart-courier/${trackingNumber}`;
  }
  
  return null;
};
  
  


  const checkPdfAvailability = async (invoiceNo) => {
    if (!invoiceNo) return;
    
    try {
      const response = await fetch('/api/invoices/check-pdf-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docNum: invoiceNo }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setIsPdfAvailable(result.available);
      } else {
        setIsPdfAvailable(false);
      }
    } catch (error) {
      console.error('PDF check failed:', error);
      setIsPdfAvailable(false);
    } finally {
      setPdfCheckCompleted(true);
    }
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
    // {
    //   accessorKey: "VendorBatchNum",
    //   header: "COA",
    //   cell: ({ row }) => {
    //     const itemCode = row.original.ItemNo;
    //     const vendorBatchNum = row.original.VendorBatchNum;
        
    //     if (!itemCode || !vendorBatchNum) {
    //       return null;
    //     }

    //     const coaKey = `${itemCode}-${vendorBatchNum}`;
    //     const isAvailable = coaAvailability[coaKey];
        
    //     if (isAvailable === undefined) {
    //       return <Spinner animation="border" size="sm" />;
    //     }

    //     if (!isAvailable) {
    //       return null;
    //     }

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

    // Get the download URL from coaAvailability if available
    const coaInfo = coaAvailability[coaKey];
    const downloadUrl = typeof coaInfo === 'object' ? coaInfo.downloadUrl : null;

    return (
      <Button
        variant="link"
        size="sm"
        className="p-0 text-primary"
        onClick={() => {
          if (downloadUrl) {
            window.open(downloadUrl, '_blank');
          }
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

  // const handleExportExcel = async () => {
  //   setIsExporting(true);
    
  //   try {
  //     // Dynamically import ExcelJS only when needed
  //     const ExcelJS = (await import('exceljs')).default;
  //     const workbook = new ExcelJS.Workbook();
  //     const worksheet = workbook.addWorksheet('Invoice Details');

  //     // Add headers
  //     worksheet.columns = [
  //       { header: 'No.', key: 'serialNo', width: 10 },
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
  //     invoiceData.forEach((row, index) => {
  //       const newRow = {
  //         serialNo: index + 1,
  //         itemNo: row.ItemNo || '-',
  //         description: row.ItemDescription || '-',
  //         casNo: row.CasNo || '-',
  //         unit: row.Unit || '-',
  //         packSize: row.PackSize || '-',
  //         unitPrice: row.UnitSalesPrice ? formatCurrency(row.UnitSalesPrice).slice(1) : '-',
  //         quantity: row.Qty || '-',
  //         totalPrice: row.TotalSalesPrice ? formatCurrency(row.TotalSalesPrice).slice(1) : '-',
  //         coa: ''
  //       };

  //       // Use pre-checked COA availability
  //       if (row.ItemNo && row.VendorBatchNum) {
  //         const coaKey = `${row.ItemNo}-${row.VendorBatchNum}`;
  //         if (coaAvailability[coaKey]) {
  //           newRow.coa = {
  //             text: 'COA',
  //             hyperlink: `/api/invoices/get-coa?itemCode=${row.ItemNo}&batchNum=${row.VendorBatchNum}`
  //           };
  //         }
  //       }

  //       const excelRow = worksheet.addRow(newRow);
        
  //       // Format COA cell if available
  //       if (newRow.coa && typeof newRow.coa === 'object') {
  //         excelRow.getCell('coa').value = newRow.coa;
  //         excelRow.getCell('coa').font = { 
  //           color: { argb: 'FF0000FF' }, 
  //           underline: true 
  //         };
  //       }
  //     });

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
      
  //     // Clean up
  //     setTimeout(() => {
  //       document.body.removeChild(a);
  //       URL.revokeObjectURL(url);
  //     }, 100);
  //   } catch (error) {
  //     console.error('Export failed:', error);
  //     alert('Export failed. Please try again.');
  //   } finally {
  //     setIsExporting(false);
  //   }
  // };

  const handleExportExcel = async () => {
  setIsExporting(true);
  
  try {
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
        const coaInfo = coaAvailability[coaKey];
        
        if (coaInfo?.available && coaInfo.downloadUrl) {
          newRow.coa = {
            text: 'COA',
            hyperlink: coaInfo.downloadUrl // Use the direct download URL
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
    <div className="container-fluid p-2 p-md-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {headerData && (
        <Card className="mb-4 shadow-sm border-0">
          <Card.Header 
            className="py-3 px-3 px-md-4"
            style={{
              backgroundColor: '#343a40',
              color: 'white',
              fontSize: '1.1rem'
            }}
          >
            <h5 className="mb-0 text-white">Dispatch Details</h5>
          </Card.Header>
          <Card.Body className="p-3 p-md-4" style={{ backgroundColor: 'white' }}>
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
            
              {generateTrackingLink(headerData.TransportName, headerData.TrackingNumber) && (
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

      {/* PDF Download Section - Show only when check is completed */}
      {headerData && pdfCheckCompleted && isPdfAvailable && (
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
          className="py-3 px-3 px-md-4"
          style={{
            backgroundColor: '#343a40',
            color: 'white'
          }}
        >
          <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between w-100 gap-3">
            <h5 className="mb-0 text-white" style={{ fontSize: '1.1rem' }}>Items Shipped:</h5>
            <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2 gap-sm-3 w-100 w-lg-auto">
              <Form.Control
                type="text"
                placeholder="Search all columns..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                style={{ minWidth: '250px' }}
                size="sm"
                className="border-0"
              />
              <Button 
                variant="success" 
                size="sm"
                onClick={handleExportExcel} 
                disabled={loading || isExporting}
                className="px-3 flex-shrink-0"
                style={{ whiteSpace: 'nowrap' }}
              >
                {isExporting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2 d-none d-sm-inline">Exporting...</span>
                  </>
                ) : (
                  <>
                    <span className="d-none d-sm-inline">Export to Excel</span>
                    <span className="d-sm-none">Excel</span>
                  </>
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
              <div className="table-responsive">
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
                            className="px-2 px-md-4 py-3 text-nowrap"
                            style={{
                              backgroundColor: '#343a40',
                              color: 'white',
                              fontSize: '0.85rem',
                              minWidth: header.id === 'ItemDescription' ? '200px' : 'auto'
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
                            <td 
                              key={cell.id} 
                              className="px-2 px-md-4 py-2"
                              style={{ 
                                fontSize: '0.85rem',
                                wordBreak: cell.column.id === 'ItemDescription' ? 'break-word' : 'normal',
                                whiteSpace: cell.column.id === 'ItemDescription' ? 'normal' : 'nowrap'
                              }}
                            >
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