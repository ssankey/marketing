

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
    allCustomers, // For Excel export
    totalItems,
    totalPages,
    isLoading,
    error,
    currentPage,
    goToPage,
    searchTerm,
    setSearchTerm,
    sortField,
    setSortField,
    sortDir,
    setSortDir,
    status,
    setStatus,
    refreshCustomers,
    handleSort
  } = useCustomers({
    initialPage: 1,
    initialSearch: "",
    initialSortField: "CardName",
    initialSortDir: "asc",
    initialStatus: "all"
  });

  // Update the route change handler
  useEffect(() => {
    const handleRouteChange = () => {
      const query = router.query;
      if (query.page) goToPage(parseInt(query.page, 10));
      if (query.search) setSearchTerm(query.search);
      if (query.sortField) setSortField(query.sortField);
      if (query.sortDir) setSortDir(query.sortDir);
      if (query.status) setStatus(query.status);
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
      <div className="alert alert-danger m-4">
        Error loading customers: {error}
        <button 
          className="btn btn-sm btn-outline-danger ms-3"
          onClick={refreshCustomers}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    isAuthenticated ? (
      <CustomersTable
        customers={customers}
        allCustomers={allCustomers}
        totalItems={totalItems}
        totalPages={totalPages}
        currentPage={currentPage}
        isLoading={isLoading}
        onPageChange={goToPage}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortField={sortField}
        sortDir={sortDir}
        onSortChange={handleSort}
        status={status}
        onStatusChange={setStatus}
        onRefresh={refreshCustomers}
      />
    ) : null
  );
}

CustomersPage.seo = {
  title: "Customers | Density",
  description: "View and manage all your customers.",
  keywords: "customers, density",
};