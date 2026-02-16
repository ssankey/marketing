// pages/orders-line/index.js
import { useRouter } from "next/router";
import { useAuth } from "hooks/useAuth";
import OrdersLineTable from "components/ordersLine/OrdersLineTable";

export default function OrdersLinePage() {
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
    <OrdersLineTable
      initialStatus="all"
      initialPage={1}
      pageSize={20}
    />
  );
}

OrdersLinePage.seo = {
  title: "Orders Line | Density",
  description: "View and manage all your order lines.",
  keywords: "orders, line items, density",
};