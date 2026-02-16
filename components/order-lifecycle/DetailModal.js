
// components/order-lifecycle/DetailModal.js (UPDATED - WITH GRN-TO-INVOICE)
import React, { useState, useEffect } from "react";

const DetailModal = ({ show, onClose, selectedCell }) => {
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedCell) return;
    
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const { month, bucket, tab, filters, ranges } = selectedCell;
        const params = new URLSearchParams();
        
        params.append("month", month);
        params.append("bucket", bucket);
        
        if (ranges) {
          params.append("ranges", JSON.stringify(ranges));
        }
        
        if (filters.salesPerson) params.append("salesPerson", filters.salesPerson);
        if (filters.customer) params.append("customer", filters.customer);
        if (filters.contactPerson) params.append("contactPerson", filters.contactPerson);
        if (filters.category) params.append("category", filters.category);

        const endpoint = `/api/order-lifecycle/${tab}/details?${params.toString()}`;
        const res = await fetch(endpoint);
        const data = await res.json();
        
        setDetails(data.data || []);
      } catch (error) {
        console.error("Error fetching details:", error);
        setDetails([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [selectedCell]);

  if (!selectedCell) return null;

  const { month, bucket, tab: type } = selectedCell;

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getColumns = () => {
    if (type === "po-to-grn") {
      return [
        { key: "PODate", label: "PO Date" },
        { key: "GRNDate", label: "GRN Date" },
        { key: "DaysDiff", label: "Days Diff" },
        { key: "PONumber", label: "PO Number" },
        { key: "GRNNumber", label: "GRN Number" },
        { key: "ItemCode", label: "Item Code" },
        { key: "ItemName", label: "Item Name" },
        { key: "VendorName", label: "Vendor Name" },
        { key: "SalesPerson", label: "Sales Person" },
        { key: "Category", label: "Category" },
      ];
    } else if (type === "grn-to-invoice") {
      return [
        { key: "GRNDate", label: "GRN Date" },
        { key: "InvoiceDate", label: "Invoice Date" },
        { key: "DaysDiff", label: "Days Diff" },
        { key: "GRNNumber", label: "GRN Number" },
        { key: "InvoiceNumber", label: "Invoice Number" },
        { key: "ItemCode", label: "Item Code" },
        { key: "ItemName", label: "Item Name" },
        { key: "VendorName", label: "Vendor Name" },
        { key: "SalesPerson", label: "Sales Person" },
        { key: "Category", label: "Category" },
      ];
    } else if (type === "invoice-to-dispatch") {
      return [
        { key: "InvoiceDate", label: "Invoice Date" },
        { key: "DispatchDate", label: "Dispatch Date" },
        { key: "DaysDiff", label: "Days Diff" },
        { key: "InvoiceNo", label: "Invoice No" },
        { key: "ItemCode", label: "Item Code" },
        { key: "ItemName", label: "Item Name" },
        { key: "CustomerName", label: "Customer Name" },
        { key: "SalesPerson", label: "Sales Person" },
        { key: "Category", label: "Category" },
      ];
    }
    return [];
  };

  const columns = getColumns();

  const formatMonthYear = (monthStr) => {
    const [year, month] = monthStr.split("-");
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
  };

  // ✅ Excel Export Function
  const handleExportToExcel = () => {
    if (details.length === 0) {
      alert("No data to export");
      return;
    }

    // Create CSV content
    const headers = columns.map(col => col.label).join(",");
    const rows = details.map(row => {
      return columns.map(col => {
        let value = row[col.key] || "";
        
        // Format dates for Excel
        if (col.key.includes("Date") && value) {
          value = formatDate(value);
        }
        
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        
        return value;
      }).join(",");
    });

    const csvContent = [headers, ...rows].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    // Generate filename
    const tabName = type.replace(/-/g, "_");
    const monthFormatted = month.replace("-", "_");
    const bucketFormatted = bucket.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
    const filename = `${tabName}_${monthFormatted}_${bucketFormatted}_${details.length}_records.csv`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          maxWidth: "95vw",
          maxHeight: "90vh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: 20,
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#1f2937",
                marginBottom: 4,
              }}
            >
              Details: {bucket}
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280" }}>
              {formatMonthYear(month)} • {loading ? "Loading..." : `${details.length} records`}
            </p>
          </div>
          
          {/* Close and Export Buttons */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {/* Excel Export Button */}
            {!loading && details.length > 0 && (
              <button
                onClick={handleExportToExcel}
                style={{
                  padding: "8px 16px",
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                title="Export to Excel"
              >
                <span style={{ fontSize: 16 }}>📊</span>
                Export Excel
              </button>
            )}
            
            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "none",
                background: "#f3f4f6",
                cursor: "pointer",
                fontSize: 20,
                color: "#6b7280",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: "#6b7280",
                fontSize: 16,
              }}
            >
              ⏳ Loading details...
            </div>
          ) : details.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: "#6b7280",
                fontSize: 16,
              }}
            >
              No details available
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        style={{
                          padding: "10px 12px",
                          textAlign: "left",
                          fontWeight: 600,
                          color: "#374151",
                          borderBottom: "2px solid #e5e7eb",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {details.map((row, idx) => (
                    <tr
                      key={idx}
                      style={{
                        background: idx % 2 === 0 ? "#fff" : "#f9fafb",
                      }}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          style={{
                            padding: "10px 12px",
                            color: "#374151",
                            borderBottom: "1px solid #e5e7eb",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {col.key.includes("Date")
                            ? formatDate(row[col.key])
                            : row[col.key] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: 20,
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            {details.length > 0 && `Showing ${details.length} record${details.length !== 1 ? 's' : ''}`}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;