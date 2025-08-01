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
//   const { docEntry, docNum, refNo } = router.query;
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [isExporting, setIsExporting] = useState(false);

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
//       }
//     } catch (error) {
//       console.error("COA download process failed:", error);
//       alert("Failed to download COA files. Please try again.");
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
  const { docEntry, docNum, refNo } = router.query;
  const [globalFilter, setGlobalFilter] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingCOA, setIsDownloadingCOA] = useState(false);

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
    
    const availableCOAs = Object.values(coaAvailability).filter(coa => coa?.available);
    
    return {
      isCOAAvailable: availableCOAs.length > 0,
      coaCheckCompleted: true
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

  const handleDownloadCOA = async () => {
    if (!coaAvailability) {
      alert("No COA information available.");
      return;
    }

    setIsDownloadingCOA(true);
    
    try {
      // Create an array of all available COAs
      const coasToDownload = Object.entries(coaAvailability)
        .filter(([_, coaInfo]) => coaInfo?.available && coaInfo.downloadUrl)
        .map(([key, coaInfo]) => ({
          key,
          url: coaInfo.downloadUrl,
          filename: `COA_${key}.pdf`
        }));

      if (coasToDownload.length === 0) {
        alert("No COA files available for download.");
        return;
      }

      let downloadedCount = 0;
      
      // Download each COA sequentially with proper delay
      for (const coa of coasToDownload) {
        try {
          const response = await fetch(coa.url);
          if (!response.ok) {
            console.warn(`COA not available: ${coa.key}`);
            continue;
          }

          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = coa.filename;
          document.body.appendChild(link);
          link.click();

          // Clean up
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
          }, 100);

          downloadedCount++;
          
          // Add delay between downloads (300ms as in working example)
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (error) {
          console.error(`Failed to download COA ${coa.key}:`, error);
        }
      }

      // Provide feedback to user
      if (downloadedCount === 0) {
        alert("Could not download any COA files.");
      } else if (downloadedCount < coasToDownload.length) {
        alert(`Downloaded ${downloadedCount} of ${coasToDownload.length} COA files. Some files were not available.`);
      }
      
    } catch (error) {
      console.error("COA download process failed:", error);
      alert("Failed to initiate COA download. Please try again.");
    } finally {
      setIsDownloadingCOA(false);
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
      <InvoiceHeader 
        headerData={headerData}
        isPdfAvailable={isPdfAvailable}
        pdfCheckCompleted={pdfCheckCompleted}
        onDownloadPdf={handleDownloadInvoicePdf}
        isCOAAvailable={isCOAAvailable}
        coaCheckCompleted={coaCheckCompleted}
        onDownloadCOA={handleDownloadCOA}
        isDownloadingCOA={isDownloadingCOA}
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