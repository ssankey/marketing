
// pages/order-lifecycle.js
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useAuth } from "hooks/useAuth";
import OrderLifecycleTable from "components/order-lifecycle/OrderLifeCycleTable";
import OrderLifecycleChart from "components/order-lifecycle/OrderLifecycleChart";

export default function OrderLifecyclePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState("chart"); // default view

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/order-lifecycle`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch order lifecycle data: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  if (authLoading) {
    return <div>Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="order-lifecycle-page">
      {/* Toggle buttons */}
      <div className="view-toggle-container" style={{ marginBottom: "20px" }}>
        <div className="view-toggle-buttons" style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setActiveView("chart")}
            className={`toggle-btn ${activeView === "chart" ? "active" : ""}`}
            style={{
              padding: "10px 20px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              backgroundColor: activeView === "chart" ? "#007bff" : "#fff",
              color: activeView === "chart" ? "#fff" : "#333",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease",
            }}
          >
            📊 Chart
          </button>
          <button
            onClick={() => setActiveView("table")}
            className={`toggle-btn ${activeView === "table" ? "active" : ""}`}
            style={{
              padding: "10px 20px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              backgroundColor: activeView === "table" ? "#007bff" : "#fff",
              color: activeView === "table" ? "#fff" : "#333",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease",
            }}
          >
            📋 Table
          </button>
        </div>
      </div>

      {/* Render view */}
      <div className="view-content">
        {activeView === "chart" ? (
          <OrderLifecycleChart data={data} isLoading={loading} />
        ) : (
          <OrderLifecycleTable data={data} isLoading={loading} />
        )}
      </div>
    </div>
  );
}

OrderLifecyclePage.seo = {
  title: "Order Lifecycle | Density",
  description: "Track your orders from PO to dispatch with detailed timeline information.",
  keywords: "order lifecycle, PO, GRN, invoice, dispatch",
};
