// components/shared/PickSlipButton.js
// Downloads a Delivery Order's Pick Slip PDF straight to disk (not a print
// dialog) — shared by the Open DO table (components/openDO/openDOColumns.js,
// where every row IS a delivery line so deliveryNo always exists) and the
// All Line Orders table (components/ordersLine/ordersLineColumns.js, where
// deliveryNo comes from a per-SO-line subquery and can be missing if that
// line hasn't been delivered yet).

import { useState } from "react";

export default function PickSlipButton({ deliveryNo }) {
  const [loading, setLoading] = useState(false);

  if (!deliveryNo) {
    return <span className="text-muted">N/A</span>;
  }

  const handleDownload = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/delivery-orders/download-pickslip/${deliveryNo}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Pick_Slip_${deliveryNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading pick slip:", error);
      alert("Failed to download pick slip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleDownload} disabled={loading}>
      {loading ? "…" : "Pick Slip"}
    </button>
  );
}
