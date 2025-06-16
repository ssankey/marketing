// pages/invoices/index.js
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Spinner } from "react-bootstrap";
import { useAuth } from "hooks/useAuth";
import InvoicesTable from "components/HeaderInvoiceTable";
import { Download, FileText, FlaskConical, Sparkles } from "lucide-react";


  import downloadExcel from "utils/exporttoexcel";
  import { Printer } from "react-bootstrap-icons";
  import StatusBadge from "components/StatusBadge";
  import { formatDate } from "utils/formatDate";
  import Link from "next/link";
  import { formatCurrency } from "utils/formatCurrency";

  import msdsMap from "public/data/msds-map.json"; // Adjust path if needed


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

    // 1) Gather all unique URLs
    const coaUrls = new Set();
    for (const item of invoice.LineItems) {
      const raw = item.ItemCode?.trim() || "";
      const code = raw.includes("-") ? raw.split("-")[0] : raw;
      const batch = item.BatchNum?.trim();
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

    // 2) Download them one-by-one
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
        // derive a nice file name from the url
        const filename = url.split("/").pop();
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);

        downloadedAny = true;
        // slight pause so downloads don’t stomp each other
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
      const key = item.ItemCode?.trim(); // or `${item.ItemCode}-${item.UnitMsr}`
      const msdsUrl = msdsMap[key];

      if (msdsUrl && !downloaded.has(msdsUrl)) {
        try {
          const fileRes = await fetch(msdsUrl);
          const blob = await fileRes.blob();
          const blobUrl = URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = `${key}_MSDS.pdf`; // Custom filename
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);

          downloaded.add(msdsUrl);
          await new Promise((resolve) => setTimeout(resolve, 300)); // spacing
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

  
export default function InvoicesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  
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

  const columns = [
    // {
    //   field: "DocNum",
    //   label: "Invoice#",
    //   render: (value, row) => (
    //     <>
    //       <Link
    //         href={`/invoicedetails?d=${value}&e=${row.DocEntry}`}
    //         className="text-blue-600 hover:text-blue-800"
    //       >
    //         {value}
    //       </Link>
    //       &nbsp;
    //       <Link
    //         href={`/printInvoice?d=${value}&e=${row.DocEntry}`}
    //         className="text-blue-600 hover:text-blue-800"
    //         target="_blank"
    //       >
    //         <Printer />
    //       </Link>
    //     </>
    //   ),
    //   sortable: true,
    // },
    // {
    //   field: "DocNum",
    //   label: "Invoice#",
    //   render: (value, row) => (
    //     <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 space-y-1 sm:space-y-0">
    //       {/* Invoice Number Link */}
    //       <Link
    //         href={`/invoicedetails?d=${value}&e=${row.DocEntry}`}
    //         className="text-blue-700 hover:text-blue-900 font-semibold text-sm underline"
    //       >
    //         {value}
    //       </Link>

    //       {/* MSDS Button */}
    //       <button
    //         onClick={(e) => {
    //           e.stopPropagation();
    //           handleMSDSDownload(row.DocEntry, value);
    //         }}
    //         className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-md border border-blue-300 shadow-sm hover:shadow-md transition-all duration-150"
    //         title="Download MSDS"
    //       >
    //         <FlaskConical size={12} />
    //         <span className="hidden sm:inline font-medium">MSDS</span>
    //       </button>

    //       {/* COA Button */}
    //       <button
    //         onClick={(e) => {
    //           e.stopPropagation();
    //           handleCOADownload(row.DocEntry, value);
    //         }}
    //         className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-green-100 text-green-800 hover:bg-green-200 rounded-md border border-green-300 shadow-sm hover:shadow-md transition-all duration-150"
    //         title="Download COA"
    //       >
    //         <FileText size={12} />
    //         <span className="hidden sm:inline font-medium">COA</span>
    //       </button>
    //     </div>
    //   ),
    //   sortable: true,
    // },
    {
      field: "DocNum",
      label: "Invoice#",
      render: (value, row) => (
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 space-y-1 sm:space-y-0">
          {/* Invoice Number Link */}
          <Link
            href={`/invoicedetails?d=${value}&e=${row.DocEntry}`}
            className="text-blue-700 hover:text-blue-900 font-semibold text-sm underline"
          >
            {value}
          </Link>

          {/* MSDS Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMSDSDownload(row.DocEntry, value);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-md border border-blue-300 shadow-sm hover:shadow-md transition-all duration-150"
            title="Download MSDS"
          >
            <FlaskConical size={12} />
            <span className="hidden sm:inline font-medium">MSDS</span>
          </button>

          {/* COA Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCOADownload(row.DocEntry, value);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-green-100 text-green-800 hover:bg-green-200 rounded-md border border-green-300 shadow-sm hover:shadow-md transition-all duration-150"
            title="Download COA"
          >
            <FileText size={12} />
            <span className="hidden sm:inline font-medium">COA</span>
          </button>
        </div>
      ),
      sortable: true,
    },
    {
      field: "DocStatusDisplay",
      label: "Status",
      render: (value) => (
        <span
          className={`badge ${
            value === "Closed"
              ? "bg-success"
              : value === "Cancelled"
                ? "bg-warning"
                : "bg-danger"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      field: "LineItemCount",
      label: "Items",
      render: (value) => value ?? 0,
    },
    {
      field: "DocDate",
      label: "Invoice Date",
      render: (value) => formatDate(value),
      sortable: true,
    },
    {
      field: "DocDueDate",
      label: "Due Date",
      render: (value) => formatDate(value),
      sortable: true,
    },
    {
      field: "U_DispatchDate",
      label: "Dispatch Date",
      render: (value) => (value ? formatDate(value) : "Pending"),
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
    // {
    //   field: "CustomerGroup",
    //   label: "Customer Group",
    //   render: (value) => value || "N/A",
    // },
    //   {
    //     field: "NumAtCard",
    //     label: "Customer PO#",
    //     render: (value) => value || "N/A"
    //   },
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
      field: "VatSum",
      label: "Tax Amount",
      render: (value) => formatCurrency(value),
    },
    {
      field: "TaxDate",
      label: "Tax Date",
      render: (value) => formatDate(value),
    },
    //   {
    //     field: "U_DispatchDate",
    //     label: "Dispatch Date",
    //     render: (value) => (value ? formatDate(value) : "Pending")
    //   },
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
      field: "PaymentGroup",
      label: "Payment Terms",
      render: (value) => value || "N/A",
    },
    {
      field: "Country",
      label: "Country",
      render: (value) => value || "N/A",
    },
    {
      field: "SalesEmployee",
      label: "Sales Person",
      render: (value) => value || "N/A",
    },
    {
      field: "ContactPerson",
      label: "Contact Person",
      render: (value) => value || "N/A",
    },
    // {
    //   field: "U_EmailSentDT",
    //   label: "Mail Sent",
    //   render: (_, row) => {
    //     if (row.U_EmailSentDT) {
    //       const dt = new Date(row.U_EmailSentDT);

    //       // Extract using UTC methods to avoid timezone offset
    //       const day = String(dt.getUTCDate()).padStart(2, "0");
    //       const month = String(dt.getUTCMonth() + 1).padStart(2, "0");
    //       const year = dt.getUTCFullYear();

    //       const h = Math.floor((row.U_EmailSentTM || 0) / 60);
    //       const m = (row.U_EmailSentTM || 0) % 60;

    //       return (
    //         <>
    //           {`${day}/${month}/${year} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`}
    //         </>
    //       );
    //     }

    //     return (
    //       <button
    //         className="btn btn-sm btn-primary"
    //         onClick={() => sendInvoiceMail(row)}
    //       >
    //         Send Mail
    //       </button>
    //     );
    //   },
    // },
    {
      field: "U_EmailSentDT",
      label: "Mail Sent",
      render: (_, row) => {
        if (row.U_EmailSentDT) {
          const dt = new Date(row.U_EmailSentDT);

          // Check if time is exactly 00:00
          const isMidnight =
            dt.getUTCHours() === 0 &&
            dt.getUTCMinutes() === 0 &&
            dt.getUTCSeconds() === 0;

          // Also fallback to Send Mail button if it's midnight
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

          return (
            <>
              {`${day}/${month}/${year} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`}
            </>
          );
        }

        // Fallback if no date
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
   
const sendInvoiceMail = async (row) => {
  try {
    const res = await fetch("/api/email/sendInvoiceEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docEntry: row.DocEntry, docNum: row.DocNum }),
    });

    const data = await res.json();

    // Check if the request was successful but email sending failed
    if (!data.success) {
      // Show alert with the specific message from the server
      alert(data.message || "Email sending failed.");
      return;
    }

    // If successful, update invoice list with sent timestamp
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

    // Optional: Show success message
    alert("Email sent successfully!");
  } catch (err) {
    console.error("Error sending invoice email:", err);
    alert("Failed to send invoice email: " + err.message);
  }
};
    

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
      // Define sets for special formatting
      const dateFields = new Set([
        "DocDate",
        "DocDueDate",
        "U_DispatchDate",
        "TaxDate",
      ]);
      const currencyFields = new Set(["DocTotal", "VatSum"]);

      // Create worksheet data with proper formatting
      const excelData = allInvoices.map((invoice) => {
        const row = {};

        columns.forEach((column) => {
          const field = column.field;
          const label = column.label;
          const value = invoice[field];

          if (dateFields.has(field)) {
            // For dates, we want to keep the raw date value but format it in Excel
            row[label] = value ? new Date(value) : null;
          } else if (currencyFields.has(field)) {
            // For currency, we want to keep the raw number value
            row[label] = value ? Number(value) : 0;
          } else {
            row[label] = value != null ? value : "N/A";
          }
        });

        return row;
      });

      
      // Define column styles for Excel
      const columnStyles = columns.map(column => {
        const style = {};
        
        if (dateFields.has(column.field)) {
          style.cellFormat = 'dd/mm/yyyy'; // Excel date format
        } else if (currencyFields.has(column.field)) {
          style.cellFormat = '#,##0.00;[Red]-#,##0.00'; // Excel currency format
        }
        
        return style;
      });

      // Download with formatting
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
}, [router.query]);




 
  // Handle data fetching
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // Only show loading on initial load or if we have no data
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
      // Only show loading if we don't have data
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
    <InvoicesTable
      invoices={invoices}
      totalItems={totalItems}
      isLoading={fetchState.isInitialLoad || fetchState.isLoading}
      status={status}
      onExcelDownload={handleExcelDownload}
      columns={columns}
    />
  );
}

InvoicesPage.seo = {
  title: "Invoices | Density",
  description: "View and manage all your invoices.",
  keywords: "invoices, billing, management, density",
  description: "View and manage all your invoices.",
  keywords: "invoices, billing, management, density",
  keywords: "invoices, billing, management, density",
};