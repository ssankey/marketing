import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Container, Breadcrumb, Spinner } from "react-bootstrap";
import CustomerBalanceTable from "components/page/customer-balance/table/CustomerBalanceTable";
import DashboardLayout from "app/(dashboard)/layout";

export default function CustomerBalancePage({
  initialCustomerBalances,
  initialTotalItems,
  currentPage,
}) {
  const router = useRouter();
  const [customerBalances, setCustomerBalances] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const {
    page = currentPage || 1,
    search = "",
    sortField = "Balance",
    sortDir = "desc",
    fromDate,
    toDate,
  } = router.query;

  useEffect(() => {
    const fetchCustomerBalanceClientSide = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams({ page, search, sortField, sortDir });
        if (fromDate) queryParams.set("fromDate", fromDate);
        if (toDate) queryParams.set("toDate", toDate);

        const response = await fetch(`/api/customer-balance/detail?${queryParams}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch balance. Status: ${response.status}`);
        }

        const data = await response.json();
        setCustomerBalances(Array.isArray(data) ? data : []);
        setTotalItems(Array.isArray(data) ? data.length : 0);
      } catch (error) {
        console.error("Error fetching balance (client-side):", error);
        setCustomerBalances([]);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomerBalanceClientSide();
  }, [page, search, sortField, sortDir, fromDate, toDate]);

  useEffect(() => {
    if (Array.isArray(initialCustomerBalances)) {
      setCustomerBalances(initialCustomerBalances);
      setTotalItems(initialCustomerBalances.length);
    }
  }, [initialCustomerBalances]);

  if (router.isFallback) {
    return (
      <div className="text-center mt-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Container className="mt-2">
        <Breadcrumb>
          <Breadcrumb.Item active={router.pathname === "/customer-balance"} onClick={() => router.push("/customer-balance")}>
            Customer Balance
          </Breadcrumb.Item>
          <Breadcrumb.Item active={router.pathname === "/customer-balance/detail"} onClick={() => router.push("/customer-balance/detail")}>
            Details
          </Breadcrumb.Item>
        </Breadcrumb>
      </Container>

      {isLoading ? (
        <div className="text-center mt-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <CustomerBalanceTable balances={customerBalances} totalItems={totalItems} isLoading={isLoading} />
      )}
    </DashboardLayout>
  );
}

export async function getServerSideProps(context) {
  const { page = 1, search = "", sortField = "DocDate", sortDir = "desc", fromDate, toDate } = context.query;
  const protocol = context.req.headers["x-forwarded-proto"] || "http";
  const host = context.req.headers.host || "localhost:3000";
  const apiUrl = `${protocol}://${host}/api/customer-balance/detail`;

  try {
    const params = new URLSearchParams({ page, search, sortField, sortDir });
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);

    const res = await fetch(`${apiUrl}?${params}`);
    if (!res.ok) {
      throw new Error(`Server-side fetch failed with status: ${res.status}`);
    }

    const data = await res.json();
    return {
      props: {
        initialCustomerBalances: Array.isArray(data) ? data : [],
        initialTotalItems: Array.isArray(data) ? data.length : 0,
        currentPage: parseInt(page, 10) || 1,
      },
    };
  } catch (error) {
    console.error("getServerSideProps error:", error);
    return {
      props: {
        initialCustomerBalances: [],
        initialTotalItems: 0,
        currentPage: 1,
      },
    };
  }
}
