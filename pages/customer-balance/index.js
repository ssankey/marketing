

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Breadcrumb,
  Card,
  Spinner,
  Container,
  Table,
} from "react-bootstrap";
import DashboardLayout from "app/(dashboard)/layout";
import CustomerBalancesChart from "components/page/customer-balance/chart/CustomerBalanceChart";
import { formatCurrency } from "utils/formatCurrency";

export default function CustomerBalancePage({ initialCustomerBalances = [] }) {
  const router = useRouter();
  const [customerBalances, setCustomerBalances] = useState(
    Array.isArray(initialCustomerBalances) ? initialCustomerBalances : []
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchCustomerBalancesClientSide() {
      try {
        setIsLoading(true);

        const response = await fetch("/api/customer-balance");
        if (!response.ok) {
          throw new Error("Failed to fetch customer balances");
        }

        const data = await response.json();
        setCustomerBalances(Array.isArray(data.balances) ? data.balances : []);
      } catch (error) {
        console.error("Error fetching customer balances (client-side):", error);
        setCustomerBalances([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCustomerBalancesClientSide();
  }, []);

  if (router.isFallback) {
    return <Spinner animation="border" role="status" />;
  }

  const handleBreadcrumbClick = (path) => {
    router.push(path);
  };

  return (
    
      <Container className="mt-2">
        {/* <Breadcrumb>
          <Breadcrumb.Item
            active={router.pathname === "/customer-balance"}
            onClick={() => handleBreadcrumbClick("/customer-balance")}
          >
            Customer Balance
          </Breadcrumb.Item>
          <Breadcrumb.Item
            active={router.pathname === "/customer-balance/detail"}
            onClick={() => handleBreadcrumbClick("/customer-balance/detail")}
          >
            Details
          </Breadcrumb.Item>
        </Breadcrumb> */}

        <Card className="mb-2">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Customer Balance</h3>
            </div>
          </Card.Header>
          <Card.Body>
            <CustomerBalancesChart
              customerBalances={customerBalances}
              isLoading={isLoading}
            />
          </Card.Body>
          <div className="mt-4">
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Customer</th>
                  {customerBalances.map((data) => (
                    <th key={data.cardcode}>{data.cardname}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Balance</td>
                  {customerBalances.map((data, index) => (
                    <td key={index}>{formatCurrency(data.Balance)}</td>
                  ))}
                </tr>
              </tbody>
            </Table>
          </div>
        </Card>
      </Container>
    
  );
}

export async function getServerSideProps(context) {
  try {
    const { req } = context;
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host;
    const apiUrl = `${protocol}://${host}/api/customer-balance`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("Failed to fetch customer balances (SSR)");
    }

    const data = await response.json();

    return {
      props: {
        initialCustomerBalances: Array.isArray(data.balances) ? data.balances : [],
      },
    };
  } catch (error) {
    console.error(
      "Error in getServerSideProps for CustomerBalancePage:",
      error
    );
    return {
      props: {
        initialCustomerBalances: [],
      },
    };
  }
}

