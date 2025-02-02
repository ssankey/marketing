import { useState, useEffect } from "react";
import LoadingSpinner from "components/LoadingSpinner";
import CustomersTable from "components/CustomersTable";
import { useRouter } from "next/router";
import { useAuth } from "hooks/useAuth";
import { Spinner } from "react-bootstrap";
import useCustomers from "hooks/useCustomers";

export default function CustomersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const {
    customers,
    totalItems,
    isLoading,
    error,
    currentPage,
    goToPage,            // Changed from setCurrentPage to goToPage
    searchTerm,
    setSearchTerm,
    sortField,
    setSortField,
    sortDir,
    setSortDir,
    status,
    setStatus,
    refreshCustomers,
    handleSort          // Using the handleSort function from the hook
  } = useCustomers({
    initialPage: 1,
    initialSearch: "",
    initialSortField: "CardName",
    initialSortDir: "asc",
    initialStatus: "all"
  });

  // Update the route change handler to use goToPage
  useEffect(() => {
    const handleRouteChange = () => {
      const query = router.query;
      goToPage(parseInt(query.page || '1', 10));
      setSearchTerm(query.search || '');
      setSortField(query.sortField || 'CardName');
      setSortDir(query.sortDir || 'asc');
      setStatus(query.status || 'all');
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router, goToPage, setSearchTerm, setSortField, setSortDir, setStatus]);

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

  if (error) {
    return (
      <div className="alert alert-danger">
        Error loading customers: {error}
      </div>
    );
  }

  return (
    isAuthenticated ? (
      <CustomersTable
        customers={customers}
        totalItems={totalItems}
        isLoading={isLoading}
        currentPage={currentPage}
        searchTerm={searchTerm}
        sortField={sortField}
        sortDir={sortDir}
        status={status}
        onPageChange={goToPage}         // Changed from setCurrentPage to goToPage
        onSearchChange={setSearchTerm}
        onSortChange={handleSort}       // Using the handleSort function from the hook
        onStatusChange={setStatus}
        onRefresh={refreshCustomers}
      />
    ) : null
  );
}

// Static SEO properties for CustomersPage
CustomersPage.seo = {
  title: "Customers | Density",
  description: "View and manage all your customers.",
  keywords: "customers, density",
};