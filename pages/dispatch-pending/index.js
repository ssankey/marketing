// pages/dispatch-pending/index.js
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Spinner } from "react-bootstrap";
import { useAuth } from "hooks/useAuth";
import PendingDispatchTable from "components/pendingDispatch/PendingDispatchTable";

export default function PendingDispatchInvoicesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`/api/invoices/pendingDispatch?getAll=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch invoices: ${response.status}`);
      }

      const { invoices } = await response.json();
      setInvoices(invoices);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);

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
    <PendingDispatchTable
      invoices={invoices}
      isLoading={loading}
    />
  );
}

PendingDispatchInvoicesPage.seo = {
  title: "Pending Dispatch Invoices | Density",
  description: "View and manage all your pending dispatch invoices.",
  keywords: "invoices, pending dispatch, sales management",
};