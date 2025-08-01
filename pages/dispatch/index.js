
// // pages/dispatch/index.js
// import { useState, useMemo } from "react";
// import { useRouter } from "next/router";
// import { Alert, Button } from "react-bootstrap";
// import { formatCurrency } from "utils/formatCurrency";
// import InvoiceHeader from "../../components/dispatch/InvoiceHeader";
// import InvoiceTable from "../../components/dispatch/InvoiceTable";
// import useInvoiceData from "hooks/useInvoiceData";

// export default function InvoiceDetailsPage() {
//   const router = useRouter();
//   const { docEntry, docNum, refNo, COAdownload } = router.query;
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [isExporting, setIsExporting] = useState(false);
//   const [isDownloadingCOA, setIsDownloadingCOA] = useState(false);

//   // Check if COA download mode is enabled
//   const isCOADownloadMode = COAdownload === 'true' || COAdownload === '1';

//   const {
//     invoiceData,
//     loading,
//     error,
//     headerData,
//     isPdfAvailable,
//     coaAvailability,
//     pdfCheckCompleted
//   } = useInvoiceData(docEntry, docNum, refNo);

//   // Check if any COA is available
//   const { isCOAAvailable, coaCheckCompleted } = useMemo(() => {
//     if (!coaAvailability) {
//       return { isCOAAvailable: false, coaCheckCompleted: false };
//     }
    
//     // If coaAvailability is an object, check if any item has available COA
//     const availableCOAs = Object.values(coaAvailability).filter(coa => coa?.available);
    
//     return {
//       isCOAAvailable: availableCOAs.length > 0,
//       coaCheckCompleted: true // Since coaAvailability is already populated by the hook
//     };
//   }, [coaAvailability]);

//   const handleExportExcel = async () => {
//     setIsExporting(true);
    
//     try {
//       const ExcelJS = (await import('exceljs')).default;
//       const workbook = new ExcelJS.Workbook();
//       const worksheet = workbook.addWorksheet('Invoice Details');

//       // Add headers
//       worksheet.columns = [
//         { header: 'No.', key: 'serialNo', width: 10 },
//         { header: 'Item No.', key: 'itemNo', width: 15 },
//         { header: 'Item/Service Description', key: 'description', width: 30 },
//         { header: 'CAS No.', key: 'casNo', width: 15 },
//         { header: 'Unit', key: 'unit', width: 10 },
//         { header: 'Pack Size', key: 'packSize', width: 10 },
//         { header: 'Unit Sales Price', key: 'unitPrice', width: 15 },
//         { header: 'QTY', key: 'quantity', width: 10 },
//         { header: 'Total Sales Price', key: 'totalPrice', width: 15 },
//         { header: 'COA', key: 'coa', width: 10 }
//       ];

//       // Add data rows
//       invoiceData.forEach((row, index) => {
//         const newRow = {
//           serialNo: index + 1,
//           itemNo: row.ItemNo || '-',
//           description: row.ItemDescription || '-',
//           casNo: row.CasNo || '-',
//           unit: row.Unit || '-',
//           packSize: row.PackSize || '-',
//           unitPrice: row.UnitSalesPrice ? formatCurrency(row.UnitSalesPrice).slice(1) : '-',
//           quantity: row.Qty || '-',
//           totalPrice: row.TotalSalesPrice ? formatCurrency(row.TotalSalesPrice).slice(1) : '-',
//           coa: ''
//         };

//         // Use pre-checked COA availability
//         if (row.ItemNo && row.VendorBatchNum) {
//           const coaKey = `${row.ItemNo}-${row.VendorBatchNum}`;
//           const coaInfo = coaAvailability[coaKey];
          
//           if (coaInfo?.available && coaInfo.downloadUrl) {
//             newRow.coa = {
//               text: 'COA',
//               hyperlink: coaInfo.downloadUrl
//             };
//           }
//         }

//         const excelRow = worksheet.addRow(newRow);
        
//         // Format COA cell if available
//         if (newRow.coa && typeof newRow.coa === 'object') {
//           excelRow.getCell('coa').value = newRow.coa;
//           excelRow.getCell('coa').font = { 
//             color: { argb: 'FF0000FF' }, 
//             underline: true 
//           };
//         }
//       });

//       // Style the header row
//       worksheet.getRow(1).eachCell((cell) => {
//         cell.font = { bold: true };
//         cell.fill = {
//           type: 'pattern',
//           pattern: 'solid',
//           fgColor: { argb: 'FF343A40' }
//         };
//         cell.font = { color: { argb: 'FFFFFFFF' } };
//       });

//       // Generate Excel file
//       const buffer = await workbook.xlsx.writeBuffer();
//       const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `Invoice_${headerData?.InvoiceNo || 'Details'}.xlsx`;
//       document.body.appendChild(a);
//       a.click();
      
//       // Clean up
//       setTimeout(() => {
//         document.body.removeChild(a);
//         URL.revokeObjectURL(url);
//       }, 100);
//     } catch (error) {
//       console.error('Export failed:', error);
//       alert('Export failed. Please try again.');
//     } finally {
//       setIsExporting(false);
//     }
//   };

//   const handleDownloadInvoicePdf = async () => {
//     if (!isPdfAvailable) return;
    
//     try {
//       const response = await fetch('/api/invoices/check-pdf-availability', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ docNum: headerData.InvoiceNo }),
//       });
      
//       if (response.ok) {
//         const result = await response.json();
//         if (result.available) {
//           const hardcodedBaseUrl = "https://marketing.densitypharmachem.com";
//           const fullPdfUrl = `${hardcodedBaseUrl}${result.downloadUrl}?download=true`;
//           window.open(fullPdfUrl, '_blank');
//         }
//       }
//     } catch (error) {
//       console.error('PDF download failed:', error);
//       alert('Failed to download PDF. Please try again.');
//     }
//   };

//   const handleDownloadCOA = async () => {
//     if (!coaAvailability) {
//       alert("No COA information available.");
//       return;
//     }

//     setIsDownloadingCOA(true);
//     let downloadedAny = false;
    
//     try {
//       // Download all available COAs
//       for (const [key, coaInfo] of Object.entries(coaAvailability)) {
//         if (coaInfo?.available && coaInfo.downloadUrl) {
//           try {
//             const fileRes = await fetch(coaInfo.downloadUrl);
//             if (!fileRes.ok) {
//               console.warn("COA not found at", coaInfo.downloadUrl);
//               continue;
//             }
            
//             const blob = await fileRes.blob();
//             const blobUrl = URL.createObjectURL(blob);

//             const a = document.createElement("a");
//             const filename = coaInfo.downloadUrl.split("/").pop() || `COA_${key}.pdf`;
//             a.href = blobUrl;
//             a.download = filename;
//             document.body.appendChild(a);
//             a.click();
//             document.body.removeChild(a);
//             URL.revokeObjectURL(blobUrl);

//             downloadedAny = true;
//             // Small delay between downloads
//             await new Promise((r) => setTimeout(r, 300));
//           } catch (e) {
//             console.error("Failed to download COA from", coaInfo.downloadUrl, e);
//           }
//         }
//       }

//       if (!downloadedAny) {
//         alert("None of the COA files were available for download.");
//       } else {
//         alert(`Successfully downloaded ${Object.entries(coaAvailability).filter(([, coaInfo]) => coaInfo?.available).length} COA file(s).`);
//       }
//     } catch (error) {
//       console.error("COA download process failed:", error);
//       alert("Failed to download COA files. Please try again.");
//     } finally {
//       setIsDownloadingCOA(false);
//     }
//   };

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

//   if (!docEntry || !docNum) {
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

//   // COA Download Mode - Show only the download button
//   if (isCOADownloadMode) {
//     return (
//       <div className="container-fluid d-flex justify-content-center align-items-center" style={{ 
//         backgroundColor: '#f8f9fa', 
//         minHeight: '100vh',
//         padding: '2rem'
//       }}>
//         <div className="text-center">
//           <div className="mb-4">
//             <h2 className="text-primary mb-3">COA Download</h2>
//             <p className="text-muted mb-4">
//               {headerData?.InvoiceNo && `Invoice: ${headerData.InvoiceNo}`}
//             </p>
//           </div>
          
//           {loading ? (
//             <div className="spinner-border text-primary" role="status">
//               <span className="sr-only">Loading...</span>
//             </div>
//           ) : !coaCheckCompleted ? (
//             <div className="text-muted">
//               <div className="spinner-border spinner-border-sm me-2" role="status"></div>
//               Checking COA availability...
//             </div>
//           ) : !isCOAAvailable ? (
//             <Alert variant="warning" className="text-center">
//               <Alert.Heading>No COA Available</Alert.Heading>
//               <p>No Certificate of Analysis files are available for this invoice.</p>
//             </Alert>
//           ) : (
//             <div>
//               <Button 
//                 variant="primary" 
//                 size="lg"
//                 onClick={handleDownloadCOA}
//                 disabled={isDownloadingCOA}
//                 className="px-5 py-3"
//                 style={{
//                   fontSize: '1.2rem',
//                   fontWeight: '600',
//                   borderRadius: '10px',
//                   boxShadow: '0 4px 15px rgba(13, 110, 253, 0.3)',
//                   border: 'none',
//                   background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
//                   transition: 'all 0.3s ease'
//                 }}
//                 onMouseEnter={(e) => {
//                   e.target.style.transform = 'translateY(-2px)';
//                   e.target.style.boxShadow = '0 6px 20px rgba(13, 110, 253, 0.4)';
//                 }}
//                 onMouseLeave={(e) => {
//                   e.target.style.transform = 'translateY(0)';
//                   e.target.style.boxShadow = '0 4px 15px rgba(13, 110, 253, 0.3)';
//                 }}
//               >
//                 {isDownloadingCOA ? (
//                   <>
//                     <span className="spinner-border spinner-border-sm me-2" role="status"></span>
//                     Downloading COAs...
//                   </>
//                 ) : (
//                   <>
//                     <i className="fas fa-download me-2"></i>
//                     Download All COA
//                   </>
//                 )}
//               </Button>
              
//               <div className="mt-3 text-muted small">
//                 {Object.entries(coaAvailability || {}).filter(([, coaInfo]) => coaInfo?.available).length} COA file(s) available
//               </div>
//             </div>
//           )}
          
//           <div className="mt-4">
//             {/* <Button 
//               variant="outline-secondary" 
//               onClick={() => router.back()}
//               className="me-2"
//             >
//               Go Back
//             </Button> */}
//             <Button 
//               variant="outline-primary" 
//               onClick={() => {
//                 const newQuery = { ...router.query };
//                 delete newQuery.COAdownload;
//                 router.push({
//                   pathname: router.pathname,
//                   query: newQuery
//                 });
//               }}
//             >
//               View Full Invoice
//             </Button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Normal Mode - Show the regular invoice interface
//   return (
//     <div className="container-fluid p-2 p-md-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
//       <InvoiceHeader 
//         headerData={headerData}
//         isPdfAvailable={isPdfAvailable}
//         pdfCheckCompleted={pdfCheckCompleted}
//         onDownloadPdf={handleDownloadInvoicePdf}
//         isCOAAvailable={isCOAAvailable}
//         coaCheckCompleted={coaCheckCompleted}
//         onDownloadCOA={handleDownloadCOA}
//       />
      
//       <InvoiceTable 
//         invoiceData={invoiceData}
//         loading={loading}
//         coaAvailability={coaAvailability}
//         globalFilter={globalFilter}
//         setGlobalFilter={setGlobalFilter}
//         onExportExcel={handleExportExcel}
//         isExporting={isExporting}
//       />
//     </div>
//   );
// }

// InvoiceDetailsPage.seo = {
//   title: "Invoice Details | Density",
//   description: "View detailed invoice information",
//   keywords: "invoice, details, sales, items",
// };


// pages/dispatch/index.js
import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import { Alert, Button } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import InvoiceHeader from "../../components/dispatch/InvoiceHeader";
import InvoiceTable from "../../components/dispatch/InvoiceTable";
import useInvoiceData from "hooks/useInvoiceData";

export default function InvoiceDetailsPage() {
  const router = useRouter();
  const { docEntry, docNum, refNo, COAdownload } = router.query;
  const [globalFilter, setGlobalFilter] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Check if COA download mode is enabled
  const isCOADownloadMode = COAdownload === 'true' || COAdownload === '1';

  const {
    invoiceData,
    loading,
    error,
    headerData,
    isPdfAvailable,
    coaAvailability,
    pdfCheckCompleted
  } = useInvoiceData(docEntry, docNum, refNo);

  // Check if any COA is available
  const { isCOAAvailable, coaCheckCompleted } = useMemo(() => {
    if (!coaAvailability) {
      return { isCOAAvailable: false, coaCheckCompleted: false };
    }
    
    // If coaAvailability is an object, check if any item has available COA
    const availableCOAs = Object.values(coaAvailability).filter(coa => coa?.available);
    
    return {
      isCOAAvailable: availableCOAs.length > 0,
      coaCheckCompleted: true // Since coaAvailability is already populated by the hook
    };
  }, [coaAvailability]);

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
              hyperlink: coaInfo.downloadUrl
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

  // This is the reliable COA download function from InvoiceHeader
  const handleDownloadCOA = async () => {
    if (!coaAvailability) {
      alert("No COA information available.");
      return;
    }

    let downloadedAny = false;
    
    try {
      // Download all available COAs
      for (const [key, coaInfo] of Object.entries(coaAvailability)) {
        if (coaInfo?.available && coaInfo.downloadUrl) {
          try {
            const fileRes = await fetch(coaInfo.downloadUrl);
            if (!fileRes.ok) {
              console.warn("COA not found at", coaInfo.downloadUrl);
              continue;
            }
            
            const blob = await fileRes.blob();
            const blobUrl = URL.createObjectURL(blob);

            const a = document.createElement("a");
            const filename = coaInfo.downloadUrl.split("/").pop() || `COA_${key}.pdf`;
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);

            downloadedAny = true;
            // Small delay between downloads
            await new Promise((r) => setTimeout(r, 300));
          } catch (e) {
            console.error("Failed to download COA from", coaInfo.downloadUrl, e);
          }
        }
      }

      if (!downloadedAny) {
        alert("None of the COA files were available for download.");
      }
    } catch (error) {
      console.error("COA download process failed:", error);
      alert("Failed to download COA files. Please try again.");
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

  // COA Download Mode - Show the centered UI with the reliable COA download button
  if (isCOADownloadMode) {
    return (
      <div className="container-fluid d-flex justify-content-center align-items-center" style={{ 
        backgroundColor: '#f8f9fa', 
        minHeight: '100vh',
        padding: '2rem'
      }}>
        <div className="text-center">
          <div className="mb-4">
            <h2 className="text-primary mb-3">COA Download</h2>
            <p className="text-muted mb-4">
              {headerData?.InvoiceNo && `Invoice: ${headerData.InvoiceNo}`}
            </p>
          </div>
          
          {loading ? (
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          ) : (
            <div>
              {/* Use the InvoiceHeader component but render only the COA download button in centered style */}
              <InvoiceHeader 
                headerData={headerData}
                isPdfAvailable={false} // Hide PDF download in COA mode
                pdfCheckCompleted={true}
                onDownloadPdf={() => {}} // No-op
                isCOAAvailable={isCOAAvailable}
                coaCheckCompleted={coaCheckCompleted}
                onDownloadCOA={handleDownloadCOA}
                coaOnlyMode={true} // Pass a prop to indicate COA-only mode
                centeredStyle={true} // Pass a prop for centered styling
              />
            </div>
          )}
          
          <div className="mt-4">
            <Button 
              variant="outline-primary" 
              onClick={() => {
                const newQuery = { ...router.query };
                delete newQuery.COAdownload;
                router.push({
                  pathname: router.pathname,
                  query: newQuery
                });
              }}
            >
              View Full Invoice
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Normal Mode - Show the regular invoice interface
  return (
    <div className="container-fluid p-2 p-md-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <InvoiceHeader 
        headerData={headerData}
        isPdfAvailable={isPdfAvailable}
        pdfCheckCompleted={pdfCheckCompleted}
        onDownloadPdf={handleDownloadInvoicePdf}
        isCOAAvailable={isCOAAvailable}
        coaCheckCompleted={coaCheckCompleted}
        onDownloadCOA={handleDownloadCOA}
      />
      
      <InvoiceTable 
        invoiceData={invoiceData}
        loading={loading}
        coaAvailability={coaAvailability}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        onExportExcel={handleExportExcel}
        isExporting={isExporting}
      />
    </div>
  );
}

InvoiceDetailsPage.seo = {
  title: "Invoice Details | Density",
  description: "View detailed invoice information",
  keywords: "invoice, details, sales, items",
};