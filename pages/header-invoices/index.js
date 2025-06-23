

// pages/header-invoices/index.js
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Spinner } from "react-bootstrap";
import { useAuth } from "hooks/useAuth";
import InvoicesTable from "components/HeaderInvoiceTable";
import InvoiceDetailsModal from "components/modal/InvoiceDetailsModal";
import { Download, FileText, FlaskConical, Sparkles } from "lucide-react";
import downloadExcel from "utils/exporttoexcel";
import { Printer } from "react-bootstrap-icons";
import StatusBadge from "components/StatusBadge";
import { formatDate } from "utils/formatDate";
import Link from "next/link";
import { formatCurrency } from "utils/formatCurrency";

import msdsMap from "public/data/msds-map.json";

// Create a separate component for the action buttons
const InvoiceActions = ({ docEntry, docNum, onDetailsClick }) => {
  const [loadingCOA, setLoadingCOA] = useState(false);
  const [loadingMSDS, setLoadingMSDS] = useState(false);

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
      for (const item of invoice.LineItems) {
        const raw = item.ItemCode?.trim() || "";
        const code = raw.includes("-") ? raw.split("-")[0] : raw;
        const batch = item.VendorBatchNum?.trim();
        
        if (code && batch) {
          coaUrls.add(
            `https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/${code}_${batch}.pdf`
          );
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
          const filename = url.split("/").pop();
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
    await handleCOADownload(docEntry, docNum);
    setLoadingCOA(false);
  };

  const handleMSDSClick = async (e) => {
    e.stopPropagation();
    setLoadingMSDS(true);
    await handleMSDSDownload(docEntry, docNum);
    setLoadingMSDS(false);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 space-y-1 sm:space-y-0">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onDetailsClick(docNum, docEntry);
        }}
        className="text-blue-600 hover:text-blue-800"
        style={{ textDecoration: "none", fontWeight: 500 }}
      >
        {docNum}
      </a>

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
    </div>
  );
};

export default function InvoicesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [error, setError] = useState(null);

  const [fetchState, setFetchState] = useState({
    isInitialLoad: true,
    isLoading: false,
    error: null
  });

  // Extract query params from router
  const {
    page = 1,
    search = "",
    status = "all",
    sortField = "DocDate",
    sortDir = "desc",
    fromDate,
    toDate,
  } = router.query;

  const fetchInvoiceDetails = async (invoiceNo) => {
    setLoadingDetails(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found in localStorage");
      }

      const response = await fetch(`/api/modal/invoiceDetails?invoiceNo=${invoiceNo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format - expected array');
      }
      
      if (data.length === 0) {
        setError('No records found for this invoice');
      }
      
      setInvoiceDetails(data);
      setShowDetailsModal(true);
      
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      setError(`Failed to load invoice details: ${error.message}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleInvoiceClick = (invoiceNo, docEntry) => {
    if (!invoiceNo) {
      setError('Invoice number is required');
      return;
    }
    
    setSelectedInvoice(invoiceNo);
    fetchInvoiceDetails(invoiceNo);
  };

  // Memoize fetchInvoices to prevent unnecessary recreations
  const fetchInvoices = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const queryParams = new URLSearchParams({
      page,
      search,
      status,
      sortField,
      sortDir,
    });
    if (fromDate) queryParams.set("fromDate", fromDate);
    if (toDate) queryParams.set("toDate", toDate);

    const response = await fetch(`/api/invoices/header-invoice?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch invoices. Status: ${response.status}`);
    }

    return response.json();
  }, [page, search, status, sortField, sortDir, fromDate, toDate]);

  const sendInvoiceMail = async (row) => {
    try {
      const res = await fetch("/api/email/sendInvoiceEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docEntry: row.DocEntry, docNum: row.DocNum }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Email sending failed.");
        return;
      }

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.DocEntry === row.DocEntry
            ? {
                ...inv,
                U_EmailSentDT: data.EmailSentDT,
                U_EmailSentTM: data.EmailSentTM,
              }
            : inv
        )
      );

      alert("Email sent successfully!");
    } catch (err) {
      console.error("Error sending invoice email:", err);
      alert("Failed to send invoice email: " + err.message);
    }
  };

  // Define columns with proper hook usage
  const columns = [
    {
      field: "DocNum",
      label: "Invoice#",
      render: (value, row) => (
        <InvoiceActions 
          docEntry={row.DocEntry}
          docNum={value}
          onDetailsClick={handleInvoiceClick}
        />
      ),
      sortable: true,
    },
    {
      field: "DocDate",
      label: "Invoice Date",
      render: (value) => formatDate(value),
      sortable: true,
    },
    {
      field: "ContactPerson",
      label: "Contact Person",
      render: (value) => value || "N/A",
    },
    {
      field: "DocDueDate",
      label: "Due Date",
      render: (value) => formatDate(value),
      sortable: true,
    },
    {
      field: "CardCode",
      label: "Customer Code",
      render: (value) => value || "N/A",
    },
    {
      field: "CardName",
      label: "Customer Name",
      render: (value) => value || "N/A",
      sortable: true,
    },
    {
      field: "LineItemCount",
      label: "Total Lines",
      render: (value) => value ?? 0,
    },
    {
      field: "DocTotal",
      label: "Total Amount",
      render: (value) => formatCurrency(value),
      sortable: true,
    },
    {
      field: "DocCur",
      label: "Currency",
      render: (value) => value || "N/A",
    },
    {
      field: "U_DispatchDate",
      label: "Dispatch Date",
      render: (value) => (value ? formatDate(value) : "Pending"),
    },
    {
      field: "TrackNo",
      label: "Tracking #",
      render: (value) => value || "N/A",
    },
    {
      field: "TransportName",
      label: "Transport",
      render: (value) => value || "N/A",
    },
    {
      field: "SalesEmployee",
      label: "Sales Person",
      render: (value) => value || "N/A",
    },
    {
      field: "U_EmailSentDT",
      label: "Mail Sent",
      render: (_, row) => {
        if (row.U_EmailSentDT) {
          const dt = new Date(row.U_EmailSentDT);
          const isMidnight =
            dt.getUTCHours() === 0 &&
            dt.getUTCMinutes() === 0 &&
            dt.getUTCSeconds() === 0;

          if (isMidnight) {
            return (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => sendInvoiceMail(row)}
              >
                Send Mail
              </button>
            );
          }

          const day = String(dt.getUTCDate()).padStart(2, "0");
          const month = String(dt.getUTCMonth() + 1).padStart(2, "0");
          const year = dt.getUTCFullYear();
          const h = Math.floor((row.U_EmailSentTM || 0) / 60);
          const m = (row.U_EmailSentTM || 0) % 60;

          return `${day}/${month}/${year} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        }
        return (
          <button
            className="btn btn-sm btn-primary"
            onClick={() => sendInvoiceMail(row)}
          >
            Send Mail
          </button>
        );
      },
    },
  ];

  const handleExcelDownload = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const queryParams = {
        status: router.query.status || "all",
        search: router.query.search || "",
        sortField: router.query.sortField || "DocDate",
        sortDir: router.query.sortDir || "desc",
        fromDate: router.query.fromDate || "",
        toDate: router.query.toDate || "",
        getAll: "true",
      };

      const url = `/api/invoices/header-invoice?${new URLSearchParams(queryParams)}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const { invoices: allInvoices } = await response.json();

      if (allInvoices && allInvoices.length > 0) {
        const dateFields = new Set([
          "DocDate",
          "DocDueDate",
          "U_DispatchDate",
          "TaxDate",
        ]);
        const currencyFields = new Set(["DocTotal", "VatSum"]);

        const excelData = allInvoices.map((invoice) => {
          const row = {};

          // columns.forEach((column) => {
          //   const field = column.field;
          //   const label = column.label;
          //   const value = invoice[field];

          //   if (dateFields.has(field)) {
          //     row[label] = value ? new Date(value) : null;
          //   } else if (currencyFields.has(field)) {
          //     row[label] = value ? Number(value) : 0;
          //   } else {
          //     row[label] = value != null ? value : "N/A";
          //   }
          // });
          
         columns.forEach((column) => {
          const value = invoice[column.field];
          
          // Apply formatting based on field type
          if (currencyFields.has(column.field) && value) {
            row[column.label] = formatCurrency(value);
          } else if (dateFields.has(column.field) && value) {
            row[column.label] = formatDate(value);
          } else {
            row[column.label] = value || "N/A";
          }
        });

          return row;
        });

        const columnStyles = columns.map(column => {
          const style = {};
          
          if (dateFields.has(column.field)) {
            style.cellFormat = 'dd/mm/yyyy';
          } else if (currencyFields.has(column.field)) {
            style.cellFormat = '#,##0.00;[Red]-#,##0.00';
          }
          
          return style;
        });

        downloadExcel(
          excelData, 
          `Invoices_${queryParams.status}`,
          columnStyles
        );
      } else {
        alert("No data available to export.");
      }
    } catch (error) {
      console.error("Failed to export to Excel:", error);
      alert("Failed to export data. Please try again.");
    }
  }, [router.query, columns]);

  // Handle data fetching
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setFetchState(prev => ({
        ...prev,
        isLoading: prev.isInitialLoad || invoices.length === 0,
        error: null
      }));

      try {
        const { invoices: newInvoices, totalItems: newTotalItems } = await fetchInvoices();
        
        if (isMounted) {
          setInvoices(newInvoices || []);
          setTotalItems(newTotalItems || 0);
          setFetchState({
            isInitialLoad: false,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        if (isMounted) {
          setFetchState({
            isInitialLoad: false,
            isLoading: false,
            error: error.message
          });
        }
      }
    };

    if (isAuthenticated) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, fetchInvoices]);

  // Handle route changes
  useEffect(() => {
    const handleRouteStart = () => {
      if (invoices.length === 0) {
        setFetchState(prev => ({ ...prev, isLoading: true }));
      }
    };

    const handleRouteEnd = () => {
      setFetchState(prev => ({ ...prev, isLoading: false }));
    };

    router.events.on("routeChangeStart", handleRouteStart);
    router.events.on("routeChangeComplete", handleRouteEnd);
    router.events.on("routeChangeError", handleRouteEnd);

    return () => {
      router.events.off("routeChangeStart", handleRouteStart);
      router.events.off("routeChangeComplete", handleRouteEnd);
      router.events.off("routeChangeError", handleRouteEnd);
    };
  }, [router, invoices.length]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner animation="border" role="status" variant="primary" />
        <span className="ml-3">Checking authentication...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (fetchState.error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading invoices: {fetchState.error}</p>
      </div>
    );
  }

  return (
    <>
      <InvoicesTable
        invoices={invoices}
        totalItems={totalItems}
        isLoading={fetchState.isInitialLoad || fetchState.isLoading}
        status={status}
        onExcelDownload={handleExcelDownload}
        columns={columns}
      />

      {showDetailsModal && (
        <InvoiceDetailsModal
          invoiceData={invoiceDetails}
          onClose={() => {
            setShowDetailsModal(false);
            setError(null);
          }}
          title={`Invoice #${selectedInvoice} Details`}
        />
      )}

      {loadingDetails && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50" style={{zIndex: 1050}}>
          <div className="bg-white p-4 rounded shadow">
            <Spinner animation="border" variant="primary" />
            <span className="ms-2">Loading invoice details...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="position-fixed top-20 end-20 z-50">
          <Alert 
            variant="danger" 
            dismissible 
            onClose={() => setError(null)}
            className="mb-3"
          >
            {error}
          </Alert>
        </div>
      )}
    </>
  );
}

InvoicesPage.seo = {
  title: "Invoices | Density",
  description: "View and manage all your invoices.",
  keywords: "invoices, billing, management, density",
};