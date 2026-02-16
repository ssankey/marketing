
// // pages/open-orders.js
// import { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/router";
// import { Spinner } from "react-bootstrap";
// import { useAuth } from "hooks/useAuth";
// import OpenOrdersTable from "components/openOrders/openOrdersTable";

// export default function OpenOrdersPage() {
//   const router = useRouter();
//   const { isAuthenticated, isLoading: authLoading } = useAuth();
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchOrders = useCallback(async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem("token");
      
//       const response = await fetch(`/api/open-orders?getAll=true`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to fetch open orders: ${response.status}`);
//       }

//       const { orders } = await response.json();
//       setOrders(orders);
//     } catch (error) {
//       setError(error.message);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     if (isAuthenticated) {
//       fetchOrders();
//     }
//   }, [isAuthenticated, fetchOrders]);

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
//     <OpenOrdersTable
//       orders={orders}
//       isLoading={loading}
//     />
//   );
// }

// OpenOrdersPage.seo = {
//   title: "Open Orders | Density",
//   description: "View and manage all your open orders with stock details.",
//   keywords: "open orders, sales, stock management",
// };


// pages/open-orders.js
import { useRouter } from "next/router";
import { useAuth } from "hooks/useAuth";
import OpenOrdersTable from "components/openOrders/openOrdersTable";

export default function OpenOrdersPage() {
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
    <OpenOrdersTable
      initialStatus="all"
      initialPage={1}
      pageSize={20}
    />
  );
}

OpenOrdersPage.seo = {
  title: "Open Orders | Density",
  description: "View and manage all your open orders with stock details.",
  keywords: "open orders, sales, stock management",
};