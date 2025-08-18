// components/header-invoices/invoiceColumns.js
import React, { useState } from "react";  
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import { FlaskConical, FileText, Download } from "lucide-react";
import { Spinner ,Badge} from "react-bootstrap";
import msdsMap from "public/data/msds-map.json";
import { useAuth } from 'contexts/AuthContext';

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
    accessorKey: "U_EmailSentDT",
    header: "Mail Sent",
    cell: ({ row }) => {
      const invoice = row.original;
      if (invoice.U_EmailSentDT) {
        const dt = new Date(invoice.U_EmailSentDT);
        const isMidnight =
          dt.getUTCHours() === 0 &&
          dt.getUTCMinutes() === 0 &&
          dt.getUTCSeconds() === 0;

        if (isMidnight) {
          return (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => handlers.onSendMail(invoice)}
            >
              Send Mail
            </button>
          );
        }

        const day = String(dt.getUTCDate()).padStart(2, "0");
        const month = String(dt.getUTCMonth() + 1).padStart(2, "0");
        const year = dt.getUTCFullYear();
        const h = Math.floor((invoice.U_EmailSentTM || 0) / 60);
        const m = (invoice.U_EmailSentTM || 0) % 60;

        return `${day}/${month}/${year} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      }
      return (
        <button
          className="btn btn-sm btn-primary"
          onClick={() => handlers.onSendMail(invoice)}
        >
          Send Mail
        </button>
      );
    },
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

  const isAdminOrSales = ['admin', 'sales_person'].includes(user?.role);

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

  // const handleCOADownload = async (docEntry, docNum) => {
  //   try {
  //     const res = await fetch(
  //       `/api/invoices/detail?docEntry=${docEntry}&docNum=${docNum}`
  //     );
  //     const invoice = await res.json();

  //     if (!invoice?.LineItems?.length) {
  //       alert("No line items found for this invoice.");
  //       return;
  //     }

  //     const coaUrls = new Set();
  //     for (const item of invoice.LineItems) {

  //         console.log("ItemCode:", item.ItemCode, "U_COA:", item.COAUrl);


  //       const raw = item.ItemCode?.trim() || "";
  //       const code = raw.includes("-") ? raw.split("-")[0] : raw;
  //       const batch = item.VendorBatchNum?.trim();
        
  //       if (code && batch) {
  //         coaUrls.add(
  //           `https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/${code}_${batch}.pdf`
  //         );
  //       }
  //     }

  //     if (!coaUrls.size) {
  //       alert("No valid COA URLs could be constructed.");
  //       return;
  //     }

  //     let downloadedAny = false;
  //     for (const url of coaUrls) {
  //       try {
  //         const fileRes = await fetch(url);
  //         if (!fileRes.ok) {
  //           console.warn("COA not found at", url);
  //           continue;
  //         }
  //         const blob = await fileRes.blob();
  //         const blobUrl = URL.createObjectURL(blob);

  //         const a = document.createElement("a");
  //         const filename = url.split("/").pop();
  //         a.href = blobUrl;
  //         a.download = filename;
  //         document.body.appendChild(a);
  //         a.click();
  //         document.body.removeChild(a);
  //         URL.revokeObjectURL(blobUrl);

  //         downloadedAny = true;
  //         await new Promise((r) => setTimeout(r, 300));
  //       } catch (e) {
  //         console.error("Failed to download COA from", url, e);
  //       }
  //     }

  //     if (!downloadedAny) {
  //       alert("None of the COA files were available.");
  //     }
  //   } catch (err) {
  //     console.error("Error in COA download:", err);
  //     alert("Failed to download COA files.");
  //   }
  // };
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
    const baseUrl = window.location.origin; // Get current domain

    for (const item of invoice.LineItems) {
      console.log("ItemCode:", item.ItemCode, "U_COA:", item.COAUrl);

      const itemCode = item.ItemCode?.trim() || "";
      const coaUrl = item.COAUrl?.trim();
      const batch = item.VendorBatchNum?.trim();

      // Priority 1: Check if COAUrl is present and valid
      if (coaUrl && coaUrl !== '') {
        // Extract filename from the COA URL path
        let filename = coaUrl;
        
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

        // Use the same COA API endpoint as in your reference code
        const encodedFilename = encodeURIComponent(filename);
        const localCoaUrl = `${baseUrl}/api/coa/download/${encodedFilename}`;
        coaUrls.add(localCoaUrl);
        
        console.log("Using LOCAL COA URL:", localCoaUrl);
      } 
      // Priority 2: Fallback to energy URL construction if no COAUrl
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

  return (
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
  );
};