

// components/header-invoices/invoiceColumns.js
import React, { useState } from "react";  
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import { FlaskConical, FileText, Download, QrCode, MapPin } from "lucide-react";
import { Spinner, Badge } from "react-bootstrap";
import msdsMap from "public/data/msds-map.json";
import { useAuth } from 'contexts/AuthContext';
import { Tags } from "lucide-react";
import { formatTime  } from "utils/formatTime";
import LabelPrintModal from '../LabelPrintModal';
import { mergePdfBlobs, imagesToPdfBlob, openPrintWindow } from 'utils/printBlob';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Always the same — Density Pharmachem's own shipping address
const SHIP_FROM = {
  company: 'DENSITY PHARMACHEM PRIVATE LIMITED',
  addressLines: [
    'Sy No 615/A & 624/2/1, Pudur Village,Medchal-Malkajgiri District,',
    'Hyderabad - 501401, Telangana, India',
  ],
  contactName: 'Saroj Kumar Purohit',
  contactPhone: '+91 998 999 1194',
};

// pdf-lib's standard fonts only support WinAnsi encoding — real address/
// company text pulled from SAP can contain characters outside that (₹, smart
// quotes, em-dashes, etc.) which would otherwise throw at drawText() time.
// Normalize common punctuation to ASCII equivalents, then strip anything
// still outside the WinAnsi-safe range instead of crashing the whole print.
function sanitizeForPdf(text) {
  if (!text) return '';
  return String(text)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/₹/g, 'Rs.')
    .replace(/[^\x00-\xFF]/g, '')
    // Strip control characters (stray \r/\n/\t etc. that survived line-
    // splitting elsewhere, plus anything else WinAnsi has no glyph for) —
    // these are within \x00-\xFF so the filter above doesn't already catch them.
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wrapText(font, size, text, maxWidth) {
  const words = sanitizeForPdf(text).split(' ');
  const lines = [];
  let current = '';
  words.forEach((word) => {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  });
  if (current) lines.push(current);
  return lines;
}

// Real vector PDF (not a rasterized canvas image) — stays crisp at any zoom
// level or when pasted elsewhere, and printing it goes through the same
// iframe/PDF-viewer path as COA/MSDS/etc., so it doesn't pick up the
// browser's own page-print header/footer (title, URL, date, page count) the
// way printing a plain HTML page with an <img> in it does.
async function generateAddressPdf(shipTo) {
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const width = 480;
  const padding = 26;
  const lineHeight = 27;
  const contentWidth = width - padding * 2;

  const labelSize = 12;
  const bodySize = 15;
  const boldSize = 18;

  // Everything that gets drawn — including the bold company name and the
  // static Density Pharmachem address — has to be wrapped to contentWidth,
  // not just the customer's address, or long text runs off the page edge.
  const shipToCompanyLines = wrapText(timesBold, boldSize, shipTo.company || 'N/A', contentWidth);
  const shipToAddrLines = (shipTo.address || 'N/A')
    .split(/\r\n|\r|\n/) // SAP addresses use bare \r as the line separator, not \r\n
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => wrapText(timesRoman, bodySize, line, contentWidth));

  const shipFromCompanyLines = wrapText(timesBold, boldSize, SHIP_FROM.company, contentWidth);
  const shipFromAddrLines = SHIP_FROM.addressLines
    .flatMap((line) => wrapText(timesRoman, bodySize, line, contentWidth));

  const blockLines = (companyLines, addrLines) =>
    1 /* label */ + companyLines.length + addrLines.length + 2; /* contact name/phone */
  const totalLines =
    blockLines(shipToCompanyLines, shipToAddrLines) + blockLines(shipFromCompanyLines, shipFromAddrLines);
  const height = padding * 2 + totalLines * lineHeight + 55;

  const page = pdfDoc.addPage([width, height]);

  page.drawRectangle({
    x: 6, y: 6, width: width - 12, height: height - 12,
    borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1,
  });

  // pdf-lib's origin is bottom-left with y increasing upward, so start near
  // the top and step downward for each line.
  let cursorY = height - padding;

  const drawLabel = (text) => {
    page.drawText(sanitizeForPdf(text).toUpperCase(), { x: padding, y: cursorY - labelSize, size: labelSize, font: timesBold, color: rgb(0.33, 0.33, 0.33) });
    cursorY -= lineHeight - 6;
  };
  const drawBoldLines = (lines) => {
    lines.forEach((line) => {
      page.drawText(sanitizeForPdf(line), { x: padding, y: cursorY - boldSize, size: boldSize, font: timesBold, color: rgb(0, 0, 0) });
      cursorY -= lineHeight;
    });
  };
  const drawNormal = (text) => {
    page.drawText(sanitizeForPdf(text), { x: padding, y: cursorY - bodySize, size: bodySize, font: timesRoman, color: rgb(0.13, 0.13, 0.13) });
    cursorY -= lineHeight;
  };

  drawLabel('Ship To');
  drawBoldLines(shipToCompanyLines);
  shipToAddrLines.forEach(drawNormal);
  drawNormal(`Contact Name : ${shipTo.contactName}`);
  drawNormal(`Contact Phone : ${shipTo.contactPhone}`);

  cursorY -= 10;
  page.drawLine({
    start: { x: padding, y: cursorY }, end: { x: width - padding, y: cursorY },
    thickness: 1, color: rgb(0.87, 0.87, 0.87),
  });
  cursorY -= 22;

  drawLabel('Ship From');
  drawBoldLines(shipFromCompanyLines);
  shipFromAddrLines.forEach(drawNormal);
  drawNormal(`Contact Name : ${SHIP_FROM.contactName}`);
  drawNormal(`Contact Phone : ${SHIP_FROM.contactPhone}`);

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

export const tableColumns = (handlers) => [
  {
    accessorKey: "DocNum",
    header: "DocNum",
    cell: ({ row, getValue }) =>
      row.original.Type === 'CN' ? (
        <span className="text-gray-700">{getValue()}</span>
      ) : (
        <InvoiceActions
          docEntry={row.original.DocEntry}
          docNum={getValue()}
          onDetailsClick={() => handlers.onInvoiceClick(getValue(), row.original.DocEntry)}
        />
      ),
    sortable: true,
  },
  {
    id: "Type",
    header: "Type",
    cell: ({ row }) => (
      <Badge bg={row.original.Type === 'CN' ? 'danger' : 'primary'}>
        {row.original.Type || 'IN'}
      </Badge>
    ),
  },
  {
    accessorKey: "DocDate",
    header: "Invoice Date",
    cell: ({ getValue }) => formatDate(getValue()),
    sortable: true,
  },
  {
    accessorKey: "CreateTs",
    header: "Invoice Time",
    cell: ({ getValue }) => formatTime(getValue()),
    
  },
  {
    accessorKey: "ContactPerson",
    header: "Contact Person",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "DocDueDate",
    header: "Due Date",
    cell: ({ getValue }) => formatDate(getValue()),
    sortable: true,
  },
  {
    accessorKey: "CardCode",
    header: "Customer Code",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "CardName",
    header: "Customer Name",
    cell: ({ getValue }) => getValue() || "N/A",
    sortable: true,
  },
  {
    accessorKey: "LineItemCount",
    header: "Total Lines",
    cell: ({ getValue }) => getValue() ?? 0,
  },
  {
    accessorKey: "DocTotal",
    header: "Total Amount",
    cell: ({ getValue }) => formatCurrency(getValue()),
    sortable: true,
  },
  {
    accessorKey: "DocCur",
    header: "Currency",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "U_DispatchDate",
    header: "Dispatch Date",
    cell: ({ getValue }) => (getValue() ? formatDate(getValue()) : "Pending"),
  },
  {
    accessorKey: "TrackNo",
    header: "Tracking #",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "TransportName",
    header: "Transport",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  {
    accessorKey: "SalesEmployee",
    header: "Sales Person",
    cell: ({ getValue }) => getValue() || "N/A",
  },
  
   {
    accessorKey: "DocStatusDisplay",
    header: "Status",
    cell: ({ getValue }) => (
      <Badge bg={getValue() === 'Closed' ? 'success' : 'danger'}>
        {getValue() || 'N/A'}
      </Badge>
    ),
    sortable: true,
  },
];

const InvoiceActions = ({ docEntry, docNum, onDetailsClick }) => {
  const { user } = useAuth(); 
  const [loadingCOA, setLoadingCOA] = useState(false);
  const [loadingMSDS, setLoadingMSDS] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingQR, setLoadingQR] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // State for Label Modal
  const [showLabelModal, setShowLabelModal] = useState(false);

  const isAdminOrSales = ['admin', 'sales_person'].includes(user?.role);

  // Function to generate QR code as data URL
  const generateQRCode = async (text) => {
    try {
      const QRCode = await import('qrcode');
      const qrDataURL = await QRCode.toDataURL(text, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  };

  // Function to convert data URL to blob
  const dataURLToBlob = (dataURL) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Enhanced handleLabelDownload function with Energy API integration
  const handleLabelDownload = async (docEntry, docNum) => {
    setLoadingLabel(true);
    try {
      console.log("Starting enhanced label download for docEntry:", docEntry, "docNum:", docNum);
      
      // Get invoice details to extract item codes
      const res = await fetch(
        `/api/invoices/detail?docEntry=${docEntry}&docNum=${docNum}`
      );
      
      if (!res.ok) {
        throw new Error(`Failed to fetch invoice details: ${res.status}`);
      }
      
      const invoice = await res.json();
      console.log("Invoice data received for enhanced labels:", invoice);

      if (!invoice?.LineItems?.length) {
        console.log("No line items found in invoice");
        alert("No line items found for this invoice.");
        return;
      }

      console.log("Line items found for enhanced labels:", invoice.LineItems.length);

      // Get unique item codes from the invoice
      const uniqueItemCodes = [...new Set(
        invoice.LineItems
          .map(item => item.ItemCode?.toString()?.trim())
          .filter(code => code && code.length > 0)
      )];

      console.log("Unique item codes for enhanced label generation:", uniqueItemCodes);

      if (!uniqueItemCodes.length) {
        alert("No valid item codes found for label generation.");
        return;
      }

      // Download enhanced labels for each unique item code
      let successCount = 0;
      for (let i = 0; i < uniqueItemCodes.length; i++) {
        const itemCode = uniqueItemCodes[i];
        
        // Find the first line item with this item code to get batch info
        const lineItem = invoice.LineItems.find(item => 
          item.ItemCode?.toString()?.trim() === itemCode
        );
        const batchNum = lineItem?.VendorBatchNum?.toString()?.trim() || '';
        
        try {
          console.log(`Downloading enhanced label ${i + 1}/${uniqueItemCodes.length}: ${itemCode}`);
          
          // Build URL with all available parameters
          const params = new URLSearchParams({
            docEntry: docEntry.toString(),
            docNum: docNum.toString()
          });
          
          if (batchNum) {
            params.append('batchNum', batchNum);
          }
          
         
          const apiPath = `/api/labels/download/${encodeURIComponent(itemCode)}?${params.toString()}`;
          console.log("Calling Label API:", apiPath);

          const labelResponse = await fetch(apiPath, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });


          if (!labelResponse.ok) {
            console.warn(`Enhanced label not found for item: ${itemCode} (${labelResponse.status})`);
            continue;
          }

          const blob = await labelResponse.blob();
          const blobUrl = URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = `Enhanced_Label_${itemCode}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);

          successCount++;
          console.log(`Successfully downloaded enhanced label for: ${itemCode}`);

          // Small delay between downloads
          if (i < uniqueItemCodes.length - 1) {
            await new Promise((r) => setTimeout(r, 500));
          }
        } catch (e) {
          console.error(`Failed to download enhanced label for ${itemCode}:`, e);
        }
      }

      console.log(`Downloaded ${successCount}/${uniqueItemCodes.length} enhanced label(s)`);
      if (successCount > 0) {
        alert(`Successfully downloaded ${successCount} enhanced label(s) with Energy API data!`);
      } else {
        alert("No enhanced labels were available for download.");
      }
    } catch (err) {
      console.error("Error in enhanced label download:", err);
      alert("Failed to download enhanced labels. Check console for details.");
    } finally {
      setLoadingLabel(false);
    }
  };

  // Updated handleLabelClick to open modal instead of downloading
  const handleLabelClick = (e) => {
    e.stopPropagation();
    setShowLabelModal(true);
  };

  const handleAddressClick = async (e) => {
    e.stopPropagation();
    setLoadingAddress(true);
    try {
      const res = await fetch(`/api/invoices/detail?docEntry=${docEntry}&docNum=${docNum}`);
      if (!res.ok) throw new Error(`Failed to fetch invoice details: ${res.status}`);
      const invoice = await res.json();

      const shipTo = {
        company: invoice.CardName || 'N/A',
        address: invoice.ShipToAddress || invoice.BillToAddress || 'N/A',
        contactName: invoice.ContactPerson || 'N/A',
        contactPhone: invoice.ContactPersonPhone || 'N/A',
      };

      const blob = await generateAddressPdf(shipTo);
      openPrintWindow(blob, `Address_${docNum}`);
    } catch (err) {
      console.error('Error printing address:', err);
      alert('Failed to load address for printing.');
    } finally {
      setLoadingAddress(false);
    }
  };

  // Updated generateQRCodeWithLabels function
  const generateQRCodeWithLabels = async (url, itemCode, batch) => {
    try {
      const qrDataURL = await generateQRCode(url);
      if (!qrDataURL) return null;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const qrImage = new Image();
      
      return new Promise((resolve) => {
        qrImage.onload = () => {
          const qrSize = qrImage.width;
          const textHeight = 80;
          const padding = 20;
          
          canvas.width = qrSize + (padding * 2);
          canvas.height = qrSize + textHeight + (padding * 2);
          
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.drawImage(qrImage, padding, padding, qrSize, qrSize);
          
          ctx.fillStyle = 'black';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'left';
          
          const textStartY = qrSize + padding + 25;
          const textX = padding + 10;
          
          ctx.fillText(`CAT ${itemCode}`, textX, textStartY);
          ctx.fillText(`LOT ${batch}`, textX, textStartY + 25);
          
          const finalDataURL = canvas.toDataURL('image/png');
          resolve(finalDataURL);
        };
        
        qrImage.src = qrDataURL;
      });
    } catch (error) {
      console.error('Error generating QR code with labels:', error);
      return null;
    }
  };

  // Generates one labelled QR per line item, merges them into a single PDF
  // (one QR per page), and opens it in a print window — no files saved to disk.
  const handleQRPrint = async (docEntry, docNum) => {
    setLoadingQR(true);
    try {
      const res = await fetch(
        `/api/invoices/detail?docEntry=${docEntry}&docNum=${docNum}`
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch invoice details: ${res.status}`);
      }

      const invoice = await res.json();
      if (!invoice?.LineItems?.length) {
        alert("No line items found for this invoice.");
        return;
      }

      const qrBlobs = [];

      for (const item of invoice.LineItems) {
        const itemCode = item.ItemCode?.toString()?.trim() || "";
        const batch = item.VendorBatchNum?.toString()?.trim() || "";
        if (!itemCode || !batch) continue;

        const code = itemCode.includes("-") ? itemCode.split("-")[0] : itemCode;
        const energyUrl = `https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/${code}_${batch}.pdf`;

        const qrDataURL = await generateQRCodeWithLabels(energyUrl, itemCode, batch);
        if (qrDataURL) {
          qrBlobs.push(dataURLToBlob(qrDataURL));
        } else {
          console.error(`Failed to generate QR code with labels for: ${itemCode}_${batch}`);
        }
      }

      if (!qrBlobs.length) {
        alert("No valid items found to generate QR codes. Items must have both item code and batch number (batch cannot be empty or 'NA').");
        return;
      }

      const mergedPdf = await imagesToPdfBlob(qrBlobs);
      openPrintWindow(mergedPdf, `QR_${docNum}`);
    } catch (err) {
      console.error("Error in QR print:", err);
      alert("Failed to generate QR codes. Check console for details.");
    } finally {
      setLoadingQR(false);
    }
  };

  const handleInvoicePDFPrint = async (docNum) => {
    try {
      const response = await fetch(`/api/invoices/download-pdf/${docNum}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      openPrintWindow(blob, `Invoice_${docNum}`);
    } catch (error) {
      console.error('Error printing invoice PDF:', error);
      alert('Failed to load invoice PDF for printing. Please try again.');
    }
  };

  // Fetches every line item's COA (local or energy source), merges them into
  // a single PDF, and opens one print window — instead of N separate downloads.
  const handleCOAPrint = async (docEntry, docNum) => {
    try {
      const res = await fetch(
        `/api/invoices/detail?docEntry=${docEntry}&docNum=${docNum}`
      );
      const invoice = await res.json();

      if (!invoice?.LineItems?.length) {
        alert("No line items found for this invoice.");
        return;
      }

      const coaUrls = new Set();
      const baseUrl = window.location.origin;

      for (const item of invoice.LineItems) {
        const itemCode = item.ItemCode?.trim() || "";
        const coaUrl = item.COAUrl?.trim();
        const batch = item.VendorBatchNum?.trim();

        if (coaUrl && coaUrl !== '') {
          let filename = coaUrl;

          if (filename.includes('\\')) {
            const pathParts = filename.split('\\');
            filename = pathParts[pathParts.length - 1];
          }

          if (filename.includes('/')) {
            const pathParts = filename.split('/');
            filename = pathParts[pathParts.length - 1];
          }

          const encodedFilename = encodeURIComponent(filename);
          coaUrls.add(`${baseUrl}/api/coa/download/${encodedFilename}`);
        }
        else if (itemCode && batch) {
          const code = itemCode.includes("-") ? itemCode.split("-")[0] : itemCode;
          coaUrls.add(`https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/${code}_${batch}.pdf`);
        }
      }

      if (!coaUrls.size) {
        alert("No valid COA URLs could be constructed.");
        return;
      }

      const coaBlobs = [];
      for (const url of coaUrls) {
        try {
          const fileRes = await fetch(url);
          if (!fileRes.ok) {
            console.warn("COA not found at", url);
            continue;
          }
          coaBlobs.push(await fileRes.blob());
        } catch (e) {
          console.error("Failed to fetch COA from", url, e);
        }
      }

      if (!coaBlobs.length) {
        alert("None of the COA files were available.");
        return;
      }

      const mergedPdf = await mergePdfBlobs(coaBlobs);
      openPrintWindow(mergedPdf, `COA_${docNum}`);
    } catch (err) {
      console.error("Error in COA print:", err);
      alert("Failed to load COA files for printing.");
    }
  };

  // Same merge-then-print treatment as COA — a multi-line invoice can pull in
  // several distinct MSDS PDFs, so they're combined into one print job.
  const handleMSDSPrint = async (docEntry, docNum) => {
    try {
      const res = await fetch(
        `/api/invoices/detail?docEntry=${docEntry}&docNum=${docNum}`
      );
      const invoice = await res.json();

      if (!invoice?.LineItems || invoice.LineItems.length === 0) {
        alert("No line items found for this invoice.");
        return;
      }

      const seenUrls = new Set();
      const msdsBlobs = [];

      for (const item of invoice.LineItems) {
        const key = item.ItemCode?.trim();
        const msdsUrl = msdsMap[key];

        if (msdsUrl && !seenUrls.has(msdsUrl)) {
          seenUrls.add(msdsUrl);
          try {
            const fileRes = await fetch(msdsUrl);
            if (!fileRes.ok) {
              console.warn("MSDS not found at", msdsUrl);
              continue;
            }
            msdsBlobs.push(await fileRes.blob());
          } catch (err) {
            console.error(`Failed to fetch MSDS for ${key}:`, err);
          }
        }
      }

      if (!msdsBlobs.length) {
        alert("No MSDS files matched this invoice.");
        return;
      }

      const mergedPdf = await mergePdfBlobs(msdsBlobs);
      openPrintWindow(mergedPdf, `MSDS_${docNum}`);
    } catch (err) {
      console.error("Error in MSDS print:", err);
      alert("Failed to load MSDS files for printing.");
    }
  };

  const handleCOAClick = async (e) => {
    e.stopPropagation();
    setLoadingCOA(true);
    try {
      await handleCOAPrint(docEntry, docNum);
    } finally {
      setLoadingCOA(false);
    }
  };

  const handleMSDSClick = async (e) => {
    e.stopPropagation();
    setLoadingMSDS(true);
    try {
      await handleMSDSPrint(docEntry, docNum);
    } finally {
      setLoadingMSDS(false);
    }
  };

  const handlePDFClick = async (e) => {
    e.stopPropagation();
    setLoadingPDF(true);
    try {
      await handleInvoicePDFPrint(docNum);
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleQRClick = async (e) => {
    e.stopPropagation();
    setLoadingQR(true);
    try {
      await handleQRPrint(docEntry, docNum);
    } finally {
      setLoadingQR(false);
    }
  };

  // Helper function to safely get table row
  const getTableRow = (element) => {
    try {
      return element?.closest('tr');
    } catch (e) {
      return null;
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 space-y-1 sm:space-y-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDetailsClick(docNum, docEntry);
          }}
          className="text-blue-600 hover:text-blue-800 me-2"
          style={{ textDecoration: "none", fontWeight: 500 }}
        >
          {docNum}
        </a>

        {/* Invoice PDF Print button */}
        {isAdminOrSales && (
          <button
            onClick={handlePDFClick}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-orange-200 text-orange-900 hover:bg-orange-300 rounded-md border border-orange-400 shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-60"
            title="Print Invoice PDF"
            disabled={loadingPDF}
          >
            {loadingPDF ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <Download size={12} />
            )}
            <span className="hidden sm:inline font-medium">INV Copy</span>
          </button>
        )}

        {/* Conditionally render COA button */}
        {isAdminOrSales && (
          <button
            onClick={handleCOAClick}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-green-200 text-green-900 hover:bg-green-300 rounded-md border border-green-400 shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-60"
            title="Print COA (merged into one PDF)"
            disabled={loadingCOA}
          >
            {loadingCOA ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <FileText size={12} />
            )}
            <span className="hidden sm:inline font-medium">COA</span>
          </button>
        )}

        {/* Address button — prints a Times New Roman address image directly */}
        {isAdminOrSales && (
          <button
            onClick={handleAddressClick}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-pink-200 text-pink-900 hover:bg-pink-300 rounded-md border border-pink-400 shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-60"
            title="Print Shipping Address"
            disabled={loadingAddress}
          >
            {loadingAddress ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <MapPin size={12} />
            )}
            <span className="hidden sm:inline font-medium">Address</span>
          </button>
        )}

        {/* QR Code button for Energy COA links */}
        {isAdminOrSales && (
          <button
            onClick={handleQRClick}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-purple-200 text-purple-900 hover:bg-purple-300 rounded-md border border-purple-400 shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-60"
            title="Print QR Codes for Energy COA Links"
            disabled={loadingQR}
          >
            {loadingQR ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <QrCode size={12} />
            )}
            <span className="hidden sm:inline font-medium">QR</span>
          </button>
        )}

        {/* Conditionally render MSDS button */}
        {isAdminOrSales && (
          <button
            onClick={handleMSDSClick}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-200 text-blue-900 hover:bg-blue-300 rounded-md border border-blue-400 shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-60"
            title="Print MSDS (merged into one PDF)"
            disabled={loadingMSDS}
          >
            {loadingMSDS ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <FlaskConical size={12} />
            )}
            <span className="hidden sm:inline font-medium">MSDS</span>
          </button>
        )}

        {/* Enhanced Label button - Now opens modal */}
        {isAdminOrSales && (
          <button
            onClick={handleLabelClick}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-indigo-200 text-indigo-900 hover:bg-indigo-300 rounded-md border border-indigo-400 shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-60"
            title="View Product Labels"
            disabled={loadingLabel}
          >
            {loadingLabel ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <Tags size={12} />
            )}
            <span className="hidden sm:inline font-medium">Label</span>
          </button>
        )}
      </div>

      {/* Label Print Modal */}
      <LabelPrintModal
        show={showLabelModal}
        onHide={() => setShowLabelModal(false)}
        docEntry={docEntry}
        docNum={docNum}
      />
    </>
  );
};