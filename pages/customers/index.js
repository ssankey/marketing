

import LoadingSpinner from "components/LoadingSpinner";
import CustomersTable from "components/CustomersTable";
import { useRouter } from "next/router";
import { useAuth } from "hooks/useAuth";
import { Spinner } from "react-bootstrap";

export default function CustomersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  if (router.isFallback) {
    return <LoadingSpinner />;
  }

  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <Spinner animation="border" role="status" style={{ color: "#007bff" }}>
          <span className="sr-only">Loading...</span>
        </Spinner>
        <div className="ms-3">Checking authentication...</div>
      </div>
    );
  }

  return isAuthenticated ? <CustomersTable /> : null;
}

CustomersPage.seo = {
  title: "Customers | Density",
  description: "View and manage all your customers.",
  keywords: "customers, density",
};
