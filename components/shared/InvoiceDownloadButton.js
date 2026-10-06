// components/shared/InvoiceDownloadButton.js
// Downloads an invoice PDF straight to disk (not a print dialog) — same
// blob -> object URL -> <a download> pattern as
// components/shared/PickSlipButton.js, reused by the Open DO table's
// Closed/Canceled Invoice PDF column.

import { useState } from "react";

export default function InvoiceDownloadButton({ docNum }) {
  const [loading, setLoading] = useState(false);

  if (!docNum) {
    return <span className="text-muted">N/A</span>;
  }

  const handleDownload = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/download-pdf/${docNum}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_${docNum}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading invoice PDF:", error);
      alert("Failed to download invoice PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleDownload} disabled={loading}>
      {loading ? "…" : "Invoice PDF"}
    </button>
  );
}
