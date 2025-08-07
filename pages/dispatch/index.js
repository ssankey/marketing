// pages/dispatch/index.js
import { useState } from "react";
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
    pdfCheckCompleted,
    isCOAAvailable
  } = useInvoiceData(docEntry, docNum, refNo);

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
          coa: row.COA && row.COA.trim() !== '' ? {
            text: 'COA',
            hyperlink: row.COA
          } : ''
        };

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
          window.open(result.downloadUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handleDownloadCOA = async () => {
  if (!invoiceData || invoiceData.length === 0) {
    alert("No invoice data available.");
    return;
  }

  setIsDownloadingCOA(true);
  
  try {
    // Get all COAs from the invoice data
    const coasToDownload = invoiceData
      .filter(item => item.COA && item.COA.trim() !== '')
      .map(item => ({
        url: item.COA,
        itemNo: item.ItemNo,
        vendorBatchNum: item.VendorBatchNum
      }));

    if (coasToDownload.length === 0) {
      alert("No COA files available for download.");
      return;
    }

    // Download each COA with a delay between them
    for (let i = 0; i < coasToDownload.length; i++) {
      const coa = coasToDownload[i];
      try {
        const response = await fetch(coa.url);
        
        if (!response.ok) {
          console.warn(`COA not found at ${coa.url}`);
          continue;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const filename = `COA_${coa.itemNo}_${coa.vendorBatchNum}.pdf`;
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);

        // Add delay between downloads (300ms)
        if (i < coasToDownload.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
      } catch (error) {
        console.error(`Failed to download COA for ${coa.itemNo}:`, error);
      }
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
        onDownloadCOA={handleDownloadCOA}
        isDownloadingCOA={isDownloadingCOA}
      />
      
      <InvoiceTable 
        invoiceData={invoiceData}
        loading={loading}
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