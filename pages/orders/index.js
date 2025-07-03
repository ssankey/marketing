
// // pages/orders.js
// import { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/router";
// import { Spinner } from "react-bootstrap";
// import { useAuth } from "hooks/useAuth";
// import OrdersTable from "components/orders/OrdersTable";

// export default function OrdersPage() {
//   const router = useRouter();
//   const { isAuthenticated, isLoading: authLoading } = useAuth();
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchOrders = useCallback(async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem("token");
      
//       const response = await fetch(`/api/orders?getAll=true`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to fetch orders: ${response.status}`);
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
//     <OrdersTable
//       orders={orders}
//       isLoading={loading}
//     />
//   );
// }

// OrdersPage.seo = {
//   title: "Orders | Density",
//   description: "View and manage all your orders.",
//   keywords: "orders, sales, management",
// };


// pages/orders.js
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Spinner } from "react-bootstrap";
import { useAuth } from "hooks/useAuth";
import OrdersTable from "components/orders/ordersTable";

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`/api/orders?getAll=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const { orders } = await response.json();
      setOrders(orders);
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
    <OrdersTable
      orders={orders}
      isLoading={loading}
    />
  );
}

OrdersPage.seo = {
  title: "Orders | Density",
  description: "View and manage all your orders.",
  keywords: "orders, density",
};