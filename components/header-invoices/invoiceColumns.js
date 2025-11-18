// // components/header-invoices/invoiceColumns.js
// import React, { useState } from "react";  
// import { formatCurrency } from "utils/formatCurrency";
// import { formatDate } from "utils/formatDate";
// import { FlaskConical, FileText, Download, QrCode } from "lucide-react";
// import { Spinner, Badge } from "react-bootstrap";
// import msdsMap from "public/data/msds-map.json";
// import { useAuth } from 'contexts/AuthContext';
// import { Tags } from "lucide-react"; 
// import { formatTime  } from "utils/formatTime";
// import LabelPrintModal from '../LabelPrintModal';

// export const tableColumns = (handlers) => [
//   {
//     accessorKey: "DocNum",
//     header: "Invoice#",
//     cell: ({ row, getValue }) => (
//       <InvoiceActions 
//         docEntry={row.original.DocEntry}
//         docNum={getValue()}
//         onDetailsClick={() => handlers.onInvoiceClick(getValue(), row.original.DocEntry)}
//       />
//     ),
//     sortable: true,
//   },
//   {
//     accessorKey: "DocDate",
//     header: "Invoice Date",
//     cell: ({ getValue }) => formatDate(getValue()),
//     sortable: true,
//   },
//   {
//     accessorKey: "CreateTs",
//     header: "Invoice Time",
//     cell: ({ getValue }) => formatTime(getValue()),
    
//   },
//   {
//     accessorKey: "ContactPerson",
//     header: "Contact Person",
//     cell: ({ getValue }) => getValue() || "N/A",
//   },
//   {
//     accessorKey: "DocDueDate",
//     header: "Due Date",
//     cell: ({ getValue }) => formatDate(getValue()),
//     sortable: true,
//   },
//   {
//     accessorKey: "CardCode",
//     header: "Customer Code",
//     cell: ({ getValue }) => getValue() || "N/A",
//   },
//   {
//     accessorKey: "CardName",
//     header: "Customer Name",
//     cell: ({ getValue }) => getValue() || "N/A",
//     sortable: true,
//   },
//   {
//     accessorKey: "LineItemCount",
//     header: "Total Lines",
//     cell: ({ getValue }) => getValue() ?? 0,
//   },
//   {
//     accessorKey: "DocTotal",
//     header: "Total Amount",
//     cell: ({ getValue }) => formatCurrency(getValue()),
//     sortable: true,
//   },
//   {
//     accessorKey: "DocCur",
//     header: "Currency",
//     cell: ({ getValue }) => getValue() || "N/A",
//   },
//   {
//     accessorKey: "U_DispatchDate",
//     header: "Dispatch Date",
//     cell: ({ getValue }) => (getValue() ? formatDate(getValue()) : "Pending"),
//   },
//   {
//     accessorKey: "TrackNo",
//     header: "Tracking #",
//     cell: ({ getValue }) => getValue() || "N/A",
//   },
//   {
//     accessorKey: "TransportName",
//     header: "Transport",
//     cell: ({ getValue }) => getValue() || "N/A",
//   },
//   {
//     accessorKey: "SalesEmployee",
//     header: "Sales Person",
//     cell: ({ getValue }) => getValue() || "N/A",
//   },
  
//    {
//     accessorKey: "DocStatusDisplay",
//     header: "Status",
//     cell: ({ getValue }) => (
//       <Badge bg={getValue() === 'Closed' ? 'success' : 'danger'}>
//         {getValue() || 'N/A'}
//       </Badge>
//     ),
//     sortable: true,
//   },
// ];

// const InvoiceActions = ({ docEntry, docNum, onDetailsClick }) => {
//   const { user } = useAuth(); 
//   const [loadingCOA, setLoadingCOA] = useState(false);
//   const [loadingMSDS, setLoadingMSDS] = useState(false);
//   const [loadingPDF, setLoadingPDF] = useState(false);
//   const [loadingQR, setLoadingQR] = useState(false);
//   const [loadingLabel, setLoadingLabel] = useState(false);

//   const isAdminOrSales = ['admin', 'sales_person'].includes(user?.role);

//   // Function to generate QR code as data URL
//   const generateQRCode = async (text) => {
//     try {
//       const QRCode = await import('qrcode');
//       const qrDataURL = await QRCode.toDataURL(text, {
//         width: 300,
//         margin: 2,
//         color: {
//           dark: '#000000',
//           light: '#FFFFFF'
//         }
//       });
//       return qrDataURL;
//     } catch (error) {
//       console.error('Error generating QR code:', error);
//       return null;
//     }
//   };

//   // Function to convert data URL to blob
//   const dataURLToBlob = (dataURL) => {
//     const arr = dataURL.split(',');
//     const mime = arr[0].match(/:(.*?);/)[1];
//     const bstr = atob(arr[1]);
//     let n = bstr.length;
//     const u8arr = new Uint8Array(n);
//     while (n--) {
//       u8arr[n] = bstr.charCodeAt(n);
//     }
//     return new Blob([u8arr], { type: mime });
//   };

//   // Enhanced handleLabelDownload function with Energy API integration
//   const handleLabelDownload = async (docEntry, docNum) => {
//     setLoadingLabel(true);
//     try {
//       console.log("Starting enhanced label download for docEntry:", docEntry, "docNum:", docNum);
      
//       // Get invoice details to extract item codes
//       const res = await fetch(
//         `/api/invoices/detail?docEntry=${docEntry}&docNum=${docNum}`
//       );
      
//       if (!res.ok) {
//         throw new Error(`Failed to fetch invoice details: ${res.status}`);
//       }
      
//       const invoice = await res.json();
//       console.log("Invoice data received for enhanced labels:", invoice);

//       if (!invoice?.LineItems?.length) {
//         console.log("No line items found in invoice");
//         alert("No line items found for this invoice.");
//         return;
//       }

//       console.log("Line items found for enhanced labels:", invoice.LineItems.length);

//       // Get unique item codes from the invoice
//       const uniqueItemCodes = [...new Set(
//         invoice.LineItems
//           .map(item => item.ItemCode?.toString()?.trim())
//           .filter(code => code && code.length > 0)
//       )];

//       console.log("Unique item codes for enhanced label generation:", uniqueItemCodes);

//       if (!uniqueItemCodes.length) {
//         alert("No valid item codes found for label generation.");
//         return;
//       }

//       // Download enhanced labels for each unique item code
//       let successCount = 0;
//       for (let i = 0; i < uniqueItemCodes.length; i++) {
//         const itemCode = uniqueItemCodes[i];
        
//         // Find the first line item with this item code to get batch info
//         const lineItem = invoice.LineItems.find(item => 
//           item.ItemCode?.toString()?.trim() === itemCode
//         );
//         const batchNum = lineItem?.VendorBatchNum?.toString()?.trim() || '';
        
//         try {
//           console.log(`Downloading enhanced label ${i + 1}/${uniqueItemCodes.length}: ${itemCode}`);
          
//           // Build URL with all available parameters
//           const params = new URLSearchParams({
//             docEntry: docEntry.toString(),
//             docNum: docNum.toString()
//           });
          
//           if (batchNum) {
//             params.append('batchNum', batchNum);
//           }
          
         
//           const apiPath = `/api/labels/download/${encodeURIComponent(itemCode)}?${params.toString()}`;
//           console.log("Calling Label API:", apiPath);

//           const labelResponse = await fetch(apiPath, {
//               method: 'GET',
//               headers: {
//                 'Content-Type': 'application/json',
//               },
//             });


//           if (!labelResponse.ok) {
//             console.warn(`Enhanced label not found for item: ${itemCode} (${labelResponse.status})`);
//             continue;
//           }

//           const blob = await labelResponse.blob();
//           const blobUrl = URL.createObjectURL(blob);

//           const a = document.createElement("a");
//           a.href = blobUrl;
//           a.download = `Enhanced_Label_${itemCode}.png`;
//           document.body.appendChild(a);
//           a.click();
//           document.body.removeChild(a);
//           URL.revokeObjectURL(blobUrl);

//           successCount++;
//           console.log(`Successfully downloaded enhanced label for: ${itemCode}`);

//           // Small delay between downloads
//           if (i < uniqueItemCodes.length - 1) {
//             await new Promise((r) => setTimeout(r, 500));
//           }
//         } catch (e) {
//           console.error(`Failed to download enhanced label for ${itemCode}:`, e);
//         }
//       }

//       console.log(`Downloaded ${successCount}/${uniqueItemCodes.length} enhanced label(s)`);
//       if (successCount > 0) {
//         alert(`Successfully downloaded ${successCount} enhanced label(s) with Energy API data!`);
//       } else {
//         alert("No enhanced labels were available for download.");
//       }
//     } catch (err) {
//       console.error("Error in enhanced label download:", err);
//       alert("Failed to download enhanced labels. Check console for details.");
//     } finally {
//       setLoadingLabel(false);
//     }
//   };

//   const handleLabelClick = async (e) => {
//     e.stopPropagation();
//     await handleLabelDownload(docEntry, docNum);
//   };

//   // Updated generateQRCodeWithLabels function
//   const generateQRCodeWithLabels = async (url, itemCode, batch) => {
//     try {
//       const qrDataURL = await generateQRCode(url);
//       if (!qrDataURL) return null;

//       const canvas = document.createElement('canvas');
//       const ctx = canvas.getContext('2d');
      
//       const qrImage = new Image();
      
//       return new Promise((resolve) => {
//         qrImage.onload = () => {
//           const qrSize = qrImage.width;
//           const textHeight = 80;
//           const padding = 20;
          
//           canvas.width = qrSize + (padding * 2);
//           canvas.height = qrSize + textHeight + (padding * 2);
          
//           ctx.fillStyle = 'white';
//           ctx.fillRect(0, 0, canvas.width, canvas.height);
          
//           ctx.drawImage(qrImage, padding, padding, qrSize, qrSize);
          
//           ctx.fillStyle = 'black';
//           ctx.font = 'bold 16px Arial';
//           ctx.textAlign = 'left';
          
//           const textStartY = qrSize + padding + 25;
//           const textX = padding + 10;
          
//           ctx.fillText(`CAT ${itemCode}`, textX, textStartY);
//           ctx.fillText(`LOT ${batch}`, textX, textStartY + 25);
          
//           const finalDataURL = canvas.toDataURL('image/png');
//           resolve(finalDataURL);
//         };
        
//         qrImage.src = qrDataURL;
//       });
//     } catch (error) {
//       console.error('Error generating QR code with labels:', error);
//       return null;
//     }
//   };

//   // Updated handleQRDownload function
//   const handleQRDownload = async (docEntry, docNum) => {
//     setLoadingQR(true);
//     try {
//       console.log("Starting QR download for docEntry:", docEntry, "docNum:", docNum);
      
//       const res = await fetch(
//         `/api/invoices/detail?docEntry=${docEntry}&docNum=${docNum}`
//       );
      
//       if (!res.ok) {
//         throw new Error(`Failed to fetch invoice details: ${res.status}`);
//       }
      
//       const invoice = await res.json();
//       console.log("Invoice data received:", invoice);

//       if (!invoice?.LineItems?.length) {
//         console.log("No line items found in invoice");
//         alert("No line items found for this invoice.");
//         return;
//       }

//       console.log("Line items found:", invoice.LineItems.length);
//       const qrCodes = [];

//       for (let i = 0; i < invoice.LineItems.length; i++) {
//         const item = invoice.LineItems[i];
//         console.log(`Processing item ${i + 1}:`, {
//           ItemCode: item.ItemCode,
//           VendorBatchNum: item.VendorBatchNum,
//           allProperties: Object.keys(item)
//         });

//         const itemCode = item.ItemCode?.toString()?.trim() || "";
//         const batch = item.VendorBatchNum?.toString()?.trim() || "";

//         console.log(`Item ${i + 1} processed values:`, {
//           itemCode: `"${itemCode}"`,
//           batch: `"${batch}"`,
//           itemCodeLength: itemCode.length,
//           batchLength: batch.length
//         });

//         if (!batch || batch.length === 0) {
//           console.log(`Item ${i + 1} skipped - no batch number available`);
//           continue;
//         }

//         if (itemCode && itemCode.length > 0) {
//           console.log(`Valid item found: ${itemCode} - ${batch}`);
          
//           const code = itemCode.includes("-") ? itemCode.split("-")[0] : itemCode;
//           const energyUrl = `https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/${code}_${batch}.pdf`;
          
//           console.log("Generated Energy URL:", energyUrl);
          
//           try {
//             const testResponse = await fetch(energyUrl, { method: 'HEAD' });
//             console.log(`URL test for ${energyUrl}: ${testResponse.status}`);
            
//             const qrDataURL = await generateQRCodeWithLabels(energyUrl, code, batch);
//             if (qrDataURL) {
//               qrCodes.push({
//                 dataURL: qrDataURL,
//                 filename: `QR_${itemCode}_${batch}.png`,
//                 url: energyUrl,
//                 itemCode: itemCode,
//                 batch: batch
//               });
//               console.log(`QR code with labels generated for: ${itemCode}_${batch}`);
//             } else {
//               console.error(`Failed to generate QR code with labels for: ${itemCode}_${batch}`);
//             }
//           } catch (urlError) {
//             console.warn(`URL not accessible: ${energyUrl}`, urlError);
//             const qrDataURL = await generateQRCodeWithLabels(energyUrl, itemCode, batch);
//             if (qrDataURL) {
//               qrCodes.push({
//                 dataURL: qrDataURL,
//                 filename: `QR_${itemCode}_${batch}.png`,
//                 url: energyUrl,
//                 itemCode: itemCode,
//                 batch: batch
//               });
//               console.log(`QR code with labels generated for inaccessible URL: ${itemCode}_${batch}`);
//             }
//           }
//         } else {
//           console.log(`Item ${i + 1} skipped - missing item code`);
//         }
//       }

//       console.log(`Total QR codes to download: ${qrCodes.length}`);

//       if (!qrCodes.length) {
//         console.log("No valid QR codes generated");
//         alert("No valid items found to generate QR codes. Items must have both item code and batch number (batch cannot be empty or 'NA').");
//         return;
//       }

//       let successCount = 0;
//       for (let i = 0; i < qrCodes.length; i++) {
//         const qr = qrCodes[i];
//         try {
//           console.log(`Downloading QR ${i + 1}/${qrCodes.length}: ${qr.filename}`);
          
//           const blob = dataURLToBlob(qr.dataURL);
//           const blobUrl = URL.createObjectURL(blob);

//           const a = document.createElement("a");
//           a.href = blobUrl;
//           a.download = qr.filename;
//           document.body.appendChild(a);
//           a.click();
//           document.body.removeChild(a);
//           URL.revokeObjectURL(blobUrl);

//           successCount++;
//           console.log(`Successfully downloaded: ${qr.filename}`);

//           if (i < qrCodes.length - 1) {
//             await new Promise((r) => setTimeout(r, 300));
//           }
//         } catch (e) {
//           console.error("Failed to download QR code", qr.filename, e);
//         }
//       }

//       console.log(`Downloaded ${successCount}/${qrCodes.length} QR code(s)`);
//       if (successCount > 0) {
//         alert(`Successfully downloaded ${successCount} QR code(s) with labels`);
//       }
//     } catch (err) {
//       console.error("Error in QR download:", err);
//       alert("Failed to generate QR codes. Check console for details.");
//     } finally {
//       setLoadingQR(false);
//     }
//   };

//   const handleInvoicePDFDownload = async (docNum) => {
//     try {
//       const response = await fetch(`/api/invoices/download-pdf/${docNum}`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const blob = await response.blob();
//       const url = URL.createObjectURL(blob);
      
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `Invoice_${docNum}(Signed).pdf`;
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       URL.revokeObjectURL(url);
      
//     } catch (error) {
//       console.error('Error downloading invoice PDF:', error);
//       alert('Failed to download invoice PDF. Please try again.');
//     }
//   };

//   const handleCOADownload = async (docEntry, docNum) => {
//     try {
//       const res = await fetch(
//         `/api/invoices/detail?docEntry=${docEntry}&docNum=${docNum}`
//       );
//       const invoice = await res.json();

//       if (!invoice?.LineItems?.length) {
//         alert("No line items found for this invoice.");
//         return;
//       }

//       const coaUrls = new Set();
//       const baseUrl = window.location.origin;

//       for (const item of invoice.LineItems) {
//         console.log("ItemCode:", item.ItemCode, "U_COA:", item.COAUrl);

//         const itemCode = item.ItemCode?.trim() || "";
//         const coaUrl = item.COAUrl?.trim();
//         const batch = item.VendorBatchNum?.trim();

//         if (coaUrl && coaUrl !== '') {
//           let filename = coaUrl;
          
//           if (filename.includes('\\')) {
//             const pathParts = filename.split('\\');
//             filename = pathParts[pathParts.length - 1];
//           }
          
//           if (filename.includes('/')) {
//             const pathParts = filename.split('/');
//             filename = pathParts[pathParts.length - 1];
//           }

//           const encodedFilename = encodeURIComponent(filename);
//           const localCoaUrl = `${baseUrl}/api/coa/download/${encodedFilename}`;
//           coaUrls.add(localCoaUrl);
          
//           console.log("Using LOCAL COA URL:", localCoaUrl);
//         } 
//         else if (itemCode && batch) {
//           const code = itemCode.includes("-") ? itemCode.split("-")[0] : itemCode;
//           const energyUrl = `https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/${code}_${batch}.pdf`;
//           coaUrls.add(energyUrl);
          
//           console.log("Using ENERGY COA URL:", energyUrl);
//         }
//       }

//       if (!coaUrls.size) {
//         alert("No valid COA URLs could be constructed.");
//         return;
//       }

//       let downloadedAny = false;
//       for (const url of coaUrls) {
//         try {
//           const fileRes = await fetch(url);
//           if (!fileRes.ok) {
//             console.warn("COA not found at", url);
//             continue;
//           }
//           const blob = await fileRes.blob();
//           const blobUrl = URL.createObjectURL(blob);

//           const a = document.createElement("a");
//           const filename = url.includes('/api/coa/download/') 
//             ? decodeURIComponent(url.split('/').pop()) 
//             : url.split("/").pop();
            
//           a.href = blobUrl;
//           a.download = filename;
//           document.body.appendChild(a);
//           a.click();
//           document.body.removeChild(a);
//           URL.revokeObjectURL(blobUrl);

//           downloadedAny = true;
//           await new Promise((r) => setTimeout(r, 300));
//         } catch (e) {
//           console.error("Failed to download COA from", url, e);
//         }
//       }

//       if (!downloadedAny) {
//         alert("None of the COA files were available.");
//       }
//     } catch (err) {
//       console.error("Error in COA download:", err);
//       alert("Failed to download COA files.");
//     }
//   };

//   const handleMSDSDownload = async (docEntry, docNum) => {
//     try {
//       const res = await fetch(
//         `/api/invoices/detail?docEntry=${docEntry}&docNum=${docNum}`
//       );
//       const invoice = await res.json();

//       if (!invoice?.LineItems || invoice.LineItems.length === 0) {
//         alert("No line items found for this invoice.");
//         return;
//       }

//       const downloaded = new Set();

//       for (const item of invoice.LineItems) {
//         const key = item.ItemCode?.trim();
//         const msdsUrl = msdsMap[key];

//         if (msdsUrl && !downloaded.has(msdsUrl)) {
//           try {
//             const fileRes = await fetch(msdsUrl);
//             const blob = await fileRes.blob();
//             const blobUrl = URL.createObjectURL(blob);

//             const a = document.createElement("a");
//             a.href = blobUrl;
//             a.download = `${key}_MSDS.pdf`;
//             document.body.appendChild(a);
//             a.click();
//             document.body.removeChild(a);
//             URL.revokeObjectURL(blobUrl);

//             downloaded.add(msdsUrl);
//             await new Promise((resolve) => setTimeout(resolve, 300));
//           } catch (err) {
//             console.error(`Failed to download ${key}:`, err);
//           }
//         }
//       }

//       if (downloaded.size === 0) {
//         alert("No MSDS files matched this invoice.");
//       }
//     } catch (err) {
//       console.error("Error in MSDS download:", err);
//       alert("Failed to download MSDS files.");
//     }
//   };

//   const handleCOAClick = async (e) => {
//     e.stopPropagation();
//     setLoadingCOA(true);
//     try {
//       await handleCOADownload(docEntry, docNum);
//     } finally {
//       setLoadingCOA(false);
//     }
//   };

//   const handleMSDSClick = async (e) => {
//     e.stopPropagation();
//     setLoadingMSDS(true);
//     try {
//       await handleMSDSDownload(docEntry, docNum);
//     } finally {
//       setLoadingMSDS(false);
//     }
//   };

//   const handlePDFClick = async (e) => {
//     e.stopPropagation();
//     setLoadingPDF(true);
//     try {
//       await handleInvoicePDFDownload(docNum);
//     } finally {
//       setLoadingPDF(false);
//     }
//   };

//   const handleQRClick = async (e) => {
//     e.stopPropagation();
//     setLoadingQR(true);
//     try {
//       await handleQRDownload(docEntry, docNum);
//     } finally {
//       setLoadingQR(false);
//     }
//   };

//   return (
//     <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 space-y-1 sm:space-y-0">
//       <a
//         href="#"
//         onClick={(e) => {
//           e.preventDefault();
//           e.stopPropagation();
//           onDetailsClick(docNum, docEntry);
//         }}
//         className="text-blue-600 hover:text-blue-800"
//         style={{ textDecoration: "none", fontWeight: 500 }}
//       >
//         {docNum}
//       </a>

//       {/* Conditionally render MSDS button */}
//       {isAdminOrSales && (
//         <button
//           onClick={handleMSDSClick}
//           className="flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-200 text-blue-900 hover:bg-blue-300 rounded-md border border-blue-400 shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-60"
//           title="Download MSDS"
//           disabled={loadingMSDS}
//         >
//           {loadingMSDS ? (
//             <Spinner animation="border" size="sm" />
//           ) : (
//             <FlaskConical size={12} />
//           )}
//           <span className="hidden sm:inline font-medium">MSDS</span>
//         </button>
//       )}

//       {/* Conditionally render COA button */}
//       {isAdminOrSales && (
//         <button
//           onClick={handleCOAClick}
//           className="flex items-center gap-2 px-3 py-1.5 text-xs bg-green-200 text-green-900 hover:bg-green-300 rounded-md border border-green-400 shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-60"
//           title="Download COA"
//           disabled={loadingCOA}
//         >
//           {loadingCOA ? (
//             <Spinner animation="border" size="sm" />
//           ) : (
//             <FileText size={12} />
//           )}
//           <span className="hidden sm:inline font-medium">COA</span>
//         </button>
//       )}

//       {/* QR Code button for Energy COA links */}
//       {isAdminOrSales && (
//         <button
//           onClick={handleQRClick}
//           className="flex items-center gap-2 px-3 py-1.5 text-xs bg-purple-200 text-purple-900 hover:bg-purple-300 rounded-md border border-purple-400 shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-60"
//           title="Download QR Codes for Energy COA Links"
//           disabled={loadingQR}
//         >
//           {loadingQR ? (
//             <Spinner animation="border" size="sm" />
//           ) : (
//             <QrCode size={12} />
//           )}
//           <span className="hidden sm:inline font-medium">QR</span>
//         </button>
//       )}

//       {/* Enhanced Label button */}
//       {isAdminOrSales && (
//         <button
//           onClick={handleLabelClick}
//           className="flex items-center gap-2 px-3 py-1.5 text-xs bg-indigo-200 text-indigo-900 hover:bg-indigo-300 rounded-md border border-indigo-400 shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-60"
//           title="Download Enhanced Product Labels with Energy API Data"
//           disabled={loadingLabel}
//         >
//           {loadingLabel ? (
//             <Spinner animation="border" size="sm" />
//           ) : (
//             <Tags size={12} />
//           )}
//           <span className="hidden sm:inline font-medium">Label</span>
//         </button>
//       )}

//       {/* Invoice PDF Download button */}
//       {isAdminOrSales && (
//         <button
//           onClick={handlePDFClick}
//           className="flex items-center gap-2 px-3 py-1.5 text-xs bg-orange-200 text-orange-900 hover:bg-orange-300 rounded-md border border-orange-400 shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-60"
//           title="Download Invoice PDF"
//           disabled={loadingPDF}
//         >
//           {loadingPDF ? (
//             <Spinner animation="border" size="sm" />
//           ) : (
//             <Download size={12} />
//           )}
//           <span className="hidden sm:inline font-medium">INV Copy</span>
//         </button>
//       )}
//     </div>
//   );
// };


// components/header-invoices/invoiceColumns.js
import React, { useState } from "react";  
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import { FlaskConical, FileText, Download, QrCode } from "lucide-react";
import { Spinner, Badge } from "react-bootstrap";
import msdsMap from "public/data/msds-map.json";
import { useAuth } from 'contexts/AuthContext';
import { Tags } from "lucide-react"; 
import { formatTime  } from "utils/formatTime";
import LabelPrintModal from '../LabelPrintModal';

export const tableColumns = (handlers) => [
  {
    accessorKey: "DocNum",
    header: "Invoice#",
    cell: ({ row, getValue }) => (
      <InvoiceActions 
        docEntry={row.original.DocEntry}
        docNum={getValue()}
        onDetailsClick={() => handlers.onInvoiceClick(getValue(), row.original.DocEntry)}
      />
    ),
    sortable: true,
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

  // Updated handleQRDownload function
  const handleQRDownload = async (docEntry, docNum) => {
    setLoadingQR(true);
    try {
      console.log("Starting QR download for docEntry:", docEntry, "docNum:", docNum);
      
      const res = await fetch(
        `/api/invoices/detail?docEntry=${docEntry}&docNum=${docNum}`
      );
      
      if (!res.ok) {
        throw new Error(`Failed to fetch invoice details: ${res.status}`);
      }
      
      const invoice = await res.json();
      console.log("Invoice data received:", invoice);

      if (!invoice?.LineItems?.length) {
        console.log("No line items found in invoice");
        alert("No line items found for this invoice.");
        return;
      }

      console.log("Line items found:", invoice.LineItems.length);
      const qrCodes = [];

      for (let i = 0; i < invoice.LineItems.length; i++) {
        const item = invoice.LineItems[i];
        console.log(`Processing item ${i + 1}:`, {
          ItemCode: item.ItemCode,
          VendorBatchNum: item.VendorBatchNum,
          allProperties: Object.keys(item)
        });

        const itemCode = item.ItemCode?.toString()?.trim() || "";
        const batch = item.VendorBatchNum?.toString()?.trim() || "";

        console.log(`Item ${i + 1} processed values:`, {
          itemCode: `"${itemCode}"`,
          batch: `"${batch}"`,
          itemCodeLength: itemCode.length,
          batchLength: batch.length
        });

        if (!batch || batch.length === 0) {
          console.log(`Item ${i + 1} skipped - no batch number available`);
          continue;
        }

        if (itemCode && itemCode.length > 0) {
          console.log(`Valid item found: ${itemCode} - ${batch}`);
          
          const code = itemCode.includes("-") ? itemCode.split("-")[0] : itemCode;
          const energyUrl = `https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/${code}_${batch}.pdf`;
          
          console.log("Generated Energy URL:", energyUrl);
          
          try {
            const testResponse = await fetch(energyUrl, { method: 'HEAD' });
            console.log(`URL test for ${energyUrl}: ${testResponse.status}`);
            
            const qrDataURL = await generateQRCodeWithLabels(energyUrl, code, batch);
            if (qrDataURL) {
              qrCodes.push({
                dataURL: qrDataURL,
                filename: `QR_${itemCode}_${batch}.png`,
                url: energyUrl,
                itemCode: itemCode,
                batch: batch
              });
              console.log(`QR code with labels generated for: ${itemCode}_${batch}`);
            } else {
              console.error(`Failed to generate QR code with labels for: ${itemCode}_${batch}`);
            }
          } catch (urlError) {
            console.warn(`URL not accessible: ${energyUrl}`, urlError);
            const qrDataURL = await generateQRCodeWithLabels(energyUrl, itemCode, batch);
            if (qrDataURL) {
              qrCodes.push({
                dataURL: qrDataURL,
                filename: `QR_${itemCode}_${batch}.png`,
                url: energyUrl,
                itemCode: itemCode,
                batch: batch
              });
              console.log(`QR code with labels generated for inaccessible URL: ${itemCode}_${batch}`);
            }
          }
        } else {
          console.log(`Item ${i + 1} skipped - missing item code`);
        }
      }

      console.log(`Total QR codes to download: ${qrCodes.length}`);

      if (!qrCodes.length) {
        console.log("No valid QR codes generated");
        alert("No valid items found to generate QR codes. Items must have both item code and batch number (batch cannot be empty or 'NA').");
        return;
      }

      let successCount = 0;
      for (let i = 0; i < qrCodes.length; i++) {
        const qr = qrCodes[i];
        try {
          console.log(`Downloading QR ${i + 1}/${qrCodes.length}: ${qr.filename}`);
          
          const blob = dataURLToBlob(qr.dataURL);
          const blobUrl = URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = qr.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);

          successCount++;
          console.log(`Successfully downloaded: ${qr.filename}`);

          if (i < qrCodes.length - 1) {
            await new Promise((r) => setTimeout(r, 300));
          }
        } catch (e) {
          console.error("Failed to download QR code", qr.filename, e);
        }
      }

      console.log(`Downloaded ${successCount}/${qrCodes.length} QR code(s)`);
      if (successCount > 0) {
        alert(`Successfully downloaded ${successCount} QR code(s) with labels`);
      }
    } catch (err) {
      console.error("Error in QR download:", err);
      alert("Failed to generate QR codes. Check console for details.");
    } finally {
      setLoadingQR(false);
    }
  };

  const handleInvoicePDFDownload = async (docNum) => {
    try {
      const response = await fetch(`/api/invoices/download-pdf/${docNum}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${docNum}(Signed).pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      alert('Failed to download invoice PDF. Please try again.');
    }
  };

  const handleCOADownload = async (docEntry, docNum) => {
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
        console.log("ItemCode:", item.ItemCode, "U_COA:", item.COAUrl);

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
          const localCoaUrl = `${baseUrl}/api/coa/download/${encodedFilename}`;
          coaUrls.add(localCoaUrl);
          
          console.log("Using LOCAL COA URL:", localCoaUrl);
        } 
        else if (itemCode && batch) {
          const code = itemCode.includes("-") ? itemCode.split("-")[0] : itemCode;
          const energyUrl = `https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/${code}_${batch}.pdf`;
          coaUrls.add(energyUrl);
          
          console.log("Using ENERGY COA URL:", energyUrl);
        }
      }

      if (!coaUrls.size) {
        alert("No valid COA URLs could be constructed.");
        return;
      }

      let downloadedAny = false;
      for (const url of coaUrls) {
        try {
          const fileRes = await fetch(url);
          if (!fileRes.ok) {
            console.warn("COA not found at", url);
            continue;
          }
          const blob = await fileRes.blob();
          const blobUrl = URL.createObjectURL(blob);

          const a = document.createElement("a");
          const filename = url.includes('/api/coa/download/') 
            ? decodeURIComponent(url.split('/').pop()) 
            : url.split("/").pop();
            
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);

          downloadedAny = true;
          await new Promise((r) => setTimeout(r, 300));
        } catch (e) {
          console.error("Failed to download COA from", url, e);
        }
      }

      if (!downloadedAny) {
        alert("None of the COA files were available.");
      }
    } catch (err) {
      console.error("Error in COA download:", err);
      alert("Failed to download COA files.");
    }
  };

  const handleMSDSDownload = async (docEntry, docNum) => {
    try {
      const res = await fetch(
        `/api/invoices/detail?docEntry=${docEntry}&docNum=${docNum}`
      );
      const invoice = await res.json();

      if (!invoice?.LineItems || invoice.LineItems.length === 0) {
        alert("No line items found for this invoice.");
        return;
      }

      const downloaded = new Set();

      for (const item of invoice.LineItems) {
        const key = item.ItemCode?.trim();
        const msdsUrl = msdsMap[key];

        if (msdsUrl && !downloaded.has(msdsUrl)) {
          try {
            const fileRes = await fetch(msdsUrl);
            const blob = await fileRes.blob();
            const blobUrl = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = `${key}_MSDS.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);

            downloaded.add(msdsUrl);
            await new Promise((resolve) => setTimeout(resolve, 300));
          } catch (err) {
            console.error(`Failed to download ${key}:`, err);
          }
        }
      }

      if (downloaded.size === 0) {
        alert("No MSDS files matched this invoice.");
      }
    } catch (err) {
      console.error("Error in MSDS download:", err);
      alert("Failed to download MSDS files.");
    }
  };

  const handleCOAClick = async (e) => {
    e.stopPropagation();
    setLoadingCOA(true);
    try {
      await handleCOADownload(docEntry, docNum);
    } finally {
      setLoadingCOA(false);
    }
  };

  const handleMSDSClick = async (e) => {
    e.stopPropagation();
    setLoadingMSDS(true);
    try {
      await handleMSDSDownload(docEntry, docNum);
    } finally {
      setLoadingMSDS(false);
    }
  };

  const handlePDFClick = async (e) => {
    e.stopPropagation();
    setLoadingPDF(true);
    try {
      await handleInvoicePDFDownload(docNum);
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleQRClick = async (e) => {
    e.stopPropagation();
    setLoadingQR(true);
    try {
      await handleQRDownload(docEntry, docNum);
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
          className="text-blue-600 hover:text-blue-800"
          style={{ textDecoration: "none", fontWeight: 500 }}
        >
          {docNum}
        </a>

        {/* Conditionally render MSDS button */}
        {isAdminOrSales && (
          <button
            onClick={handleMSDSClick}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-200 text-blue-900 hover:bg-blue-300 rounded-md border border-blue-400 shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-60"
            title="Download MSDS"
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

        {/* Conditionally render COA button */}
        {isAdminOrSales && (
          <button
            onClick={handleCOAClick}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-green-200 text-green-900 hover:bg-green-300 rounded-md border border-green-400 shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-60"
            title="Download COA"
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

        {/* QR Code button for Energy COA links */}
        {isAdminOrSales && (
          <button
            onClick={handleQRClick}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-purple-200 text-purple-900 hover:bg-purple-300 rounded-md border border-purple-400 shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-60"
            title="Download QR Codes for Energy COA Links"
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

        {/* Invoice PDF Download button */}
        {isAdminOrSales && (
          <button
            onClick={handlePDFClick}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-orange-200 text-orange-900 hover:bg-orange-300 rounded-md border border-orange-400 shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-60"
            title="Download Invoice PDF"
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