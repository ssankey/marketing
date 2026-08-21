// // pages/header-invoices/index.js
// import { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/router";
// import { Spinner } from "react-bootstrap";
// import { useAuth } from "hooks/useAuth";
// import HeaderInvoicesTable from "components/header-invoices/HeaderInvoicesTable";

// export default function HeaderInvoicesPage() {
//   const router = useRouter();
//   const { isAuthenticated, isLoading: authLoading } = useAuth();
//   const [invoices, setInvoices] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchInvoices = useCallback(async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem("token");
      
//       const response = await fetch(`/api/invoices/header-invoice?getAll=true`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to fetch invoices: ${response.status}`);
//       }

//       const { invoices } = await response.json();
//       setInvoices(invoices);
//     } catch (error) {
//       setError(error.message);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     if (isAuthenticated) {
//       fetchInvoices();
//     }
//   }, [isAuthenticated, fetchInvoices]);

//   if (authLoading) {
//     return <div>Checking authentication...</div>;
//   }

//   if (!isAuthenticated) {
//     return null;
//   }

//   if (error) {
//     return <div>Error: {error}</div>;
//   }

//   return (
//     <HeaderInvoicesTable
//       invoices={invoices}
//       isLoading={loading}
//     />
//   );
// }

// HeaderInvoicesPage.seo = {
//   title: "Header Invoices | Density",
//   description: "View and manage all your header invoices with detailed information.",
//   keywords: "invoices, billing, sales documents",
// };



// pages/header-invoices/index.js
import { useRouter } from "next/router";
import { useAuth } from "hooks/useAuth";
import HeaderInvoicesTable from "components/header-invoices/HeaderInvoicesTable";

export default function HeaderInvoicesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <HeaderInvoicesTable
      initialStatus="all"
      initialPage={1}
      pageSize={20}
    />
  );
}

HeaderInvoicesPage.seo = {
  title: "Header Invoices | Density",
  description: "View and manage all your header invoices with detailed information.",
  keywords: "invoices, billing, sales documents",
};