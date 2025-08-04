// pages/pendingDispatch/index.js
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Spinner } from "react-bootstrap";
import { useAuth } from "hooks/useAuth";
import PendingDispatchTable from "components/pendingDispatch/PendingDispatchTable";

export default function PendingDispatchPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState([]); // Changed from orders to invoices
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPendingDispatch = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`/api/invoices/pendingDispatch?getAll=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pending dispatch: ${response.status}`);
      }

      const { invoices } = await response.json(); // Changed from data to invoices
      setInvoices(invoices);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching pending dispatch:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      console.log("Fetching pending dispatch data...");
      fetchPendingDispatch();
    }
  }, [isAuthenticated, fetchPendingDispatch]);

  // Add debug logging to check data
  useEffect(() => {
    if (invoices.length > 0) {
      console.log("Received invoices data:", invoices);
    }
  }, [invoices]);

  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Checking authentication...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  if (error) {
    return (
      <div className="alert alert-danger m-3">
        Error loading pending dispatch: {error}
      </div>
    );
  }

  return (
    <PendingDispatchTable
      invoices={invoices} // Changed prop name from orders to invoices
      isLoading={loading}
    />
  );
}

PendingDispatchPage.seo = {
  title: "Pending Dispatch | Density",
  description: "View and manage all pending dispatch orders.",
  keywords: "pending dispatch, orders, shipping, density",
};