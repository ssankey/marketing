// pages/invoices/index.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Spinner } from "react-bootstrap";
import { useAuth } from "hooks/useAuth";
import InvoicesTable from "components/InvoicesTable";

export default function InvoicesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // read query from URL if needed
  const {
    page = 1,
    search = "",
    status = "all",
    sortField = "DocDate",
    sortDir = "desc",
    fromDate,
    toDate,
  } = router.query;

  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);
    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  useEffect(() => {
    async function fetchInvoices() {
      if (!isAuthenticated) return; // Only proceed if logged in

      setIsLoading(true);
      try {
        // 1) Get token from localStorage
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found in localStorage");
          return;
        }

        // 2) Build query params
        const queryParams = new URLSearchParams({
          page,
          search,
          status,
          sortField,
          sortDir,
        });
        if (fromDate) queryParams.set("fromDate", fromDate);
        if (toDate) queryParams.set("toDate", toDate);

        // 3) Fetch from /api/invoices with Bearer token
        const response = await fetch(`/api/invoices?${queryParams}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch invoices. Status: ${response.status}`);
        }

        // 4) Parse JSON
        const data = await response.json();
        setInvoices(data.invoices || []);
        setTotalItems(data.totalItems || 0);
      } catch (err) {
        console.error("Error fetching invoices:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInvoices();
  }, [
    isAuthenticated,
    page,
    search,
    status,
    sortField,
    sortDir,
    fromDate,
    toDate,
  ]);

  // Show spinner if still checking auth
  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center"
           style={{ minHeight: "100vh" }}>
        <Spinner animation="border" role="status" style={{ color: "#007bff" }}>
          <span className="sr-only">Loading...</span>
        </Spinner>
        <div className="ms-3">Checking authentication...</div>
      </div>
    );
  }

  // Not authenticated => show nothing or redirect
  if (!isAuthenticated) {
    return null;
  }

  // Otherwise, render the InvoicesTable
  return (
    <InvoicesTable
      invoices={invoices}
      totalItems={totalItems}
      isLoading={isLoading}
      status={status}
    />
  );
}

// Remove or comment out getServerSideProps if previously defined
/*
export async function getServerSideProps() {
  ...
}
*/

InvoicesPage.seo = {
  title: "Invoices | Density",
  description: "View and manage all your invoices.",
  keywords: "invoices, billing, management, density",
};
