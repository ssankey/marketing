import { useState, useEffect } from "react";
import LoadingSpinner from "components/LoadingSpinner";
import CustomersTable from "components/CustomersTable";
import { getCustomers } from "lib/models/customers";
import { useRouter } from "next/router";
import { useAuth } from "hooks/useAuth";
import { Spinner } from "react-bootstrap";

export default function CustomersPage({
  customers: initialCustomers,
  totalItems: initialTotalItems,
}) {

  const { isAuthenticated, isLoading: authLoading } = useAuth(); // Renamed for clarity



  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState(initialCustomers);
  const [totalItems, setTotalItems] = useState(initialTotalItems);

  // Handle loading state for client-side transitions
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
    setCustomers(initialCustomers);
    setTotalItems(initialTotalItems);
  }, [initialCustomers, initialTotalItems]);

  if (router.isFallback) {
    return <LoadingSpinner />;
  }

  // Show a loader if still loading or redirecting
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

  return (
    isAuthenticated ? (
      <CustomersTable
        customers={customers}
        totalItems={totalItems}
        isLoading={isLoading}
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

export async function getServerSideProps(context) {
  try {
    const {
      page = 1,
      search = "",
      sortField = "CardName",
      sortDir = "asc",
      status = "all",
    } = context.query;

    const ITEMS_PER_PAGE = 20;
    const offset = (parseInt(page, 10) - 1) * ITEMS_PER_PAGE;

    let whereClause = "T0.CardType = 'C'"; // Only customers

    if (search) {
      // Sanitize input to prevent SQL injection
      const sanitizedSearch = search.replace(/'/g, "''");
      whereClause += ` AND (
        T0.CardCode LIKE '%${sanitizedSearch}%' OR 
        T0.CardName LIKE '%${sanitizedSearch}%' OR 
        T0.Phone1 LIKE '%${sanitizedSearch}%' OR 
        T0.E_Mail LIKE '%${sanitizedSearch}%'
      )`;
    }

    if (status && status !== "all") {
      // Assuming 'status' could be 'active' or 'inactive'
      whereClause += ` AND T0.validFor = '${status === 'active' ? 'Y' : 'N'}'`;
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM OCRD T0  
      WHERE ${whereClause};
    `;

    const dataQuery = `
      SELECT
        T0.CardCode AS CustomerCode,
        T0.CardName AS CustomerName,
        T0.Phone1 AS Phone,
        T0.E_Mail AS Email,
        T0.Address AS BillingAddress,
        T0.Balance,
        T0.Currency,
        T0.ValidFor AS IsActive,
        T0.CreditLine,
        T5.SlpName AS SalesEmployeeName
      FROM OCRD T0
      LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      WHERE ${whereClause}
      ORDER BY ${sortField} ${sortDir}
      OFFSET ${offset} ROWS
      FETCH NEXT ${ITEMS_PER_PAGE} ROWS ONLY;
    `;

    const [totalResult, rawCustomers] = await Promise.all([
      getCustomers(countQuery),
      getCustomers(dataQuery),
    ]);

    const totalItems = totalResult[0]?.total || 0;
    const customers = rawCustomers.map((customer) => ({
      ...customer,
      IsActive: customer.IsActive === 'Y',
    }));
    // Console.log(customers);

    return {
      props: {
        customers: Array.isArray(customers) ? customers : [],
        totalItems,
        currentPage: parseInt(page, 10),
      },
    };
  } catch (error) {
    console.error("Error fetching customers:", error);
    return {
      props: {
        customers: [],
        totalItems: 0,
      },
    };
  }
}
