//pages/orders/index.js
import { useState, useEffect } from "react";
import LoadingSpinner from "components/LoadingSpinner";
import OrdersTable from "components/OrdersTable";
import { useRouter } from "next/router";
import { useAuth } from "hooks/useAuth";
import { Spinner } from "react-bootstrap";

export default function OrdersPage({
  orders: initialOrders,
  totalItems: initialTotalItems,
  currentPage: initialCurrentPage,
}) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState(initialOrders);
  const [totalItems, setTotalItems] = useState(initialTotalItems);
  const [currentPage, setCurrentPage] = useState(initialCurrentPage);

  // Handle client-side route transitions
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

  // Update local state when props change
  useEffect(() => {
    setOrders(initialOrders);
    setTotalItems(initialTotalItems);
    setCurrentPage(initialCurrentPage);
  }, [initialOrders, initialTotalItems, initialCurrentPage]);

  // Show a loader if authentication is loading
  if (authLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <Spinner animation="border" role="status" style={{ color: "#007bff" }}>
          <span className="sr-only">Loading...</span>
        </Spinner>
        <div className="ms-3">Checking authentication...</div>
      </div>
    );
  }

  if (router.isFallback) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? (
    <OrdersTable
      orders={orders}
      totalItems={totalItems}
      currentPage={currentPage}
      isLoading={isLoading}
    />
  ) : null;
}

OrdersPage.seo = {
  title: "Orders | Density",
  description: "View and manage all your orders.",
  keywords: "orders, density",
};

export async function getServerSideProps(context) {
  const {
    page = 1,
    search = "",
    status = "all",
    sortField = "DocNum",
    sortDir = "desc",
    fromDate,
    toDate,
  } = context.query;

  try {
    const protocol = context.req.headers["x-forwarded-proto"] || "http";
    const host = context.req.headers.host || "localhost:3000";
    const apiUrl = `${protocol}://${host}/api/orders`;

    const response = await fetch(
      `${apiUrl}?page=${page}&search=${search}&status=${status}&sortField=${sortField}&sortDir=${sortDir}&fromDate=${fromDate}&toDate=${toDate}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch orders from API");
    }

    const { orders, totalItems } = await response.json();

    return {
      props: {
        orders: Array.isArray(orders) ? orders : [],
        totalItems: totalItems || 0,
        currentPage: parseInt(page, 10),
      },
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return {
      props: {
        orders: [],
        totalItems: 0,
        currentPage: 1,
        error: "Failed to fetch orders",
      },
    };
  }
}



// import { useState, useEffect } from "react";
// import LoadingSpinner from "components/LoadingSpinner";
// import OpenOrdersTable from "components/OpenOrdersTable";
// import { useRouter } from "next/router";
// import { useAuth } from "hooks/useAuth";
// import { Spinner } from "react-bootstrap";

// export default function OpenOrdersPage({
//   orders: initialOrders,
//   totalItems: initialTotalItems,
//   currentPage: initialCurrentPage,
// }) {
//   const { isAuthenticated, isLoading: authLoading } = useAuth();
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(false);
//   const [orders, setOrders] = useState(initialOrders);
//   const [totalItems, setTotalItems] = useState(initialTotalItems);
//   const [currentPage, setCurrentPage] = useState(initialCurrentPage);

//   // Handle client-side route transitions
//   useEffect(() => {
//     const handleStart = () => setIsLoading(true);
//     const handleComplete = () => setIsLoading(false);

//     router.events.on("routeChangeStart", handleStart);
//     router.events.on("routeChangeComplete", handleComplete);
//     router.events.on("routeChangeError", handleComplete);

//     return () => {
//       router.events.off("routeChangeStart", handleStart);
//       router.events.off("routeChangeComplete", handleComplete);
//       router.events.off("routeChangeError", handleComplete);
//     };
//   }, [router]);

//   // Update local state when props change
//   useEffect(() => {
//     setOrders(initialOrders);
//     setTotalItems(initialTotalItems);
//     setCurrentPage(initialCurrentPage);
//   }, [initialOrders, initialTotalItems, initialCurrentPage]);

//   // Show a loader if authentication is loading
//   if (authLoading) {
//     return (
//       <div
//         className="d-flex justify-content-center align-items-center"
//         style={{ minHeight: "100vh" }}
//       >
//         <Spinner animation="border" role="status" style={{ color: "#007bff" }}>
//           <span className="sr-only">Loading...</span>
//         </Spinner>
//         <div className="ms-3">Checking authentication...</div>
//       </div>
//     );
//   }

//   if (router.isFallback) {
//     return <LoadingSpinner />;
//   }

//   return isAuthenticated ? (
//     <OpenOrdersTable
//       orders={orders}
//       totalItems={totalItems}
//       currentPage={currentPage}
//       isLoading={isLoading}
//     />
//   ) : null;
// }

// OpenOrdersPage.seo = {
//   title: "Open Orders | Density",
//   description: "View and manage all your open orders with stock details.",
//   keywords: "open orders, sales, stock management",
// };

// export async function getServerSideProps(context) {
//   const {
//     page = 1,
//     search = "",
//     sortField = "DocNum",
//     sortDir = "desc",
//     fromDate,
//     toDate,
//   } = context.query;

//   try {
//     const protocol = context.req.headers["x-forwarded-proto"] || "http";
//     const host = context.req.headers.host || "localhost:3000";
//     const apiUrl = `${protocol}://${host}/api/open-orders`;

//     const response = await fetch(
//       `${apiUrl}?page=${page}&search=${search}&sortField=${sortField}&sortDir=${sortDir}&fromDate=${fromDate}&toDate=${toDate}`
//     );

//     if (!response.ok) {
//       throw new Error("Failed to fetch open orders from API");
//     }

//     const { orders, totalItems } = await response.json();

//     return {
//       props: {
//         orders: Array.isArray(orders) ? orders : [],
//         totalItems: totalItems || 0,
//         currentPage: parseInt(page, 10),
//       },
//     };
//   } catch (error) {
//     console.error("Error fetching open orders:", error);
//     return {
//       props: {
//         orders: [],
//         totalItems: 0,
//         currentPage: 1,
//         error: "Failed to fetch open orders",
//       },
//     };
//   }
// }
