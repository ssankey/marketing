
// // // pages/orders.js
// // import { useState, useEffect, useCallback } from "react";
// // import { useRouter } from "next/router";
// // import { Spinner } from "react-bootstrap";
// // import { useAuth } from "hooks/useAuth";
// // import OrdersTable from "components/orders/OrdersTable";

// // export default function OrdersPage() {
// //   const router = useRouter();
// //   const { isAuthenticated, isLoading: authLoading } = useAuth();
// //   const [orders, setOrders] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);

// //   const fetchOrders = useCallback(async () => {
// //     try {
// //       setLoading(true);
// //       const token = localStorage.getItem("token");
      
// //       const response = await fetch(`/api/orders?getAll=true`, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });

// //       if (!response.ok) {
// //         throw new Error(`Failed to fetch orders: ${response.status}`);
// //       }

// //       const { orders } = await response.json();
// //       setOrders(orders);
// //     } catch (error) {
// //       setError(error.message);
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, []);

// //   useEffect(() => {
// //     if (isAuthenticated) {
// //       fetchOrders();
// //     }
// //   }, [isAuthenticated, fetchOrders]);

// //   if (authLoading) {
// //     return <div>Checking authentication...</div>;
// //   }

// //   if (!isAuthenticated) {
// //     return null;
// //   }

// //   if (error) {
// //     return <div>Error: {error}</div>;
// //   }

// //   return (
// //     <OrdersTable
// //       orders={orders}
// //       isLoading={loading}
// //     />
// //   );
// // }

// // OrdersPage.seo = {
// //   title: "Orders | Density",
// //   description: "View and manage all your orders.",
// //   keywords: "orders, sales, management",
// // };


// // pages/orders.js
// import { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/router";
// import { Spinner } from "react-bootstrap";
// import { useAuth } from "hooks/useAuth";
// import OrdersTable from "components/orders/ordersTable";

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
//   keywords: "orders, density",
// };


// pages/orders.js
import { useRouter } from "next/router";
import { useAuth } from "hooks/useAuth";
import OrdersTable from "components/orders/ordersTable";

export default function OrdersPage() {
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
    <OrdersTable
      initialStatus="all"
      initialPage={1}
      pageSize={20}
    />
  );
}

OrdersPage.seo = {
  title: "Orders | Density",
  description: "View and manage all your orders.",
  keywords: "orders, density",
};