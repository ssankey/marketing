

import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Spinner, Table } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import  PurchasesAmountChart  from "../../components/CustomerCharts/purchasevsamount";


// Utility function to format date
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

export default function CustomerDetails({ customer, purchaseData }) {
//export default function CustomerDetails({ customer }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());




  // Handle client-side auth redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // Handle loading states
  if (router.isFallback || authLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" role="status" variant="primary" />
        <span className="ms-3">
          {router.isFallback ? "Loading..." : "Checking authentication..."}
        </span>
      </Container>
    );
  }

  // Handle unauthorized access
  if (!isAuthenticated) {
    return null;
  }
  console.log("PurchasesAmountChart:", PurchasesAmountChart);

  // Handle missing customer data
  if (!customer) {
    return (
      <Container className="mt-5">
        <Card>
          <Card.Body>
            <div className="alert alert-warning mb-0">
              Customer not found or an error occurred while loading customer
              data.
            </div>
            <button
              className="btn btn-secondary mt-3"
              onClick={() => router.back()}
            >
              Back to Customers
            </button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      {/* First Card - Customer Details */}
      <Card className="mb-4">
        <Card.Header>
          <h2 className="mb-0">
            Customer Details - {customer?.CustomerName || "N/A"}
          </h2>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={6}>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Customer Code:
                </Col>
                <Col sm={8}>{customer?.CustomerCode || "N/A"}</Col>
              </Row>
              {/* Add more customer details as needed */}
            </Col>
            <Col md={6}>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Billing Address:
                </Col>
                <Col sm={8}>{customer?.BillingAddress || "N/A"}</Col>
              </Row>
              {/* Add more address details as needed */}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/*Purchase Analytics Card */}
       {purchaseData && purchaseData.length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Purchase Analytics</h3>
              <select
                className="form-select w-auto"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {[2022, 2023, 2024].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </Card.Header>
          <Card.Body>
            <PurchasesAmountChart data={purchaseData}  />
          </Card.Body>
        </Card>
      )}

      {/* Addresses Card */}
      <Card className="mb-4">
        <Card.Header>
          <h3 className="mb-0">Addresses</h3>
        </Card.Header>
        <Card.Body>
          {customer?.Addresses && customer.Addresses.length > 0 ? (
            <Table responsive striped bordered hover>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Address Name</th>
                  <th>Street</th>
                  <th>Block</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Zip Code</th>
                  <th>Country</th>
                </tr>
              </thead>
              <tbody>
                {customer.Addresses.map((address, index) => (
                  <tr key={index}>
                    <td>
                      {address.AddressType === "B" ? "Billing" : "Shipping"}
                    </td>
                    <td>{address.AddressName || "N/A"}</td>
                    <td>{address.Street || "N/A"}</td>
                    <td>{address.Block || "N/A"}</td>
                    <td>{address.City || "N/A"}</td>
                    <td>{address.State || "N/A"}</td>
                    <td>{address.ZipCode || "N/A"}</td>
                    <td>{address.Country || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="mb-0">No addresses available.</p>
          )}
        </Card.Body>
      </Card>

      {/* Back Button */}
      <div className="mt-3 mb-4">
        <button className="btn btn-secondary" onClick={() => router.back()}>
          Back to Customers
        </button>
      </div>
    </Container>
  );
}


export async function getServerSideProps(context) {
  const { id } = context.params;
  const currentYear = new Date().getFullYear();
  
  try {
    // Ensure customer ID is provided
    if (!id) {
      throw new Error("Customer ID is required");
    }

    const protocol = context.req.headers["x-forwarded-proto"] || "http";
    const host = context.req.headers.host || "localhost:3000";

    // Fetch customer details
    const customerUrl = `${protocol}://${host}/api/customers/${id}`;
    const customerRes = await fetch(customerUrl);

    if (!customerRes.ok) {
      throw new Error(
        `Failed to fetch customer data: ${customerRes.statusText}`
      );
    }

    const customerData = await customerRes.json();
    const customer = Array.isArray(customerData)
      ? customerData[0]
      : customerData;

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Fetch purchase and revenue data
     const metricsUrl = `${protocol}://${host}/api/customers/${id}?metrics=true&year=${currentYear}`;
    const metricsRes = await fetch(metricsUrl);


    if (!metricsRes.ok) {
      throw new Error(
        `Failed to fetch purchase metrics: ${metricsRes.statusText}`
      );
    }

    const purchaseData = await metricsRes.json();
    console.log(purchaseData);

    return {
      props: {
        customer,
        purchaseData,
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error.message);

    return {
      props: {
        customer: null,
        purchaseData: null,
        error: error.message,
      },
    };
  }
} 

