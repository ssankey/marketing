


import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Spinner, Table } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";

// Utility function to format date
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

export default function CustomerDetails({ customer }) {
  const [isClient, setIsClient] = useState(false);

  // Ensure the hook only runs client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Protect the page using the `useAuth` hook, client-side only
  const { isAuthenticated, isLoading: authLoading } = useAuth(); // Renamed for clarity


  // Conditionally initialize `useRouter` for client side only
  const router = isClient ? useRouter() : null;

  // Handle fallback during page generation
  if (router?.isFallback) {
    return (
      <Container className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
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

  if (!customer) {
    return (
      <Container className="mt-5">
        <div className="alert alert-warning">Customer not found</div>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return null; // Return null to prevent rendering if not authenticated
  }

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <h2 className="mb-0">Customer Details - {customer.CustomerName}</h2>
        </Card.Header>
        <Card.Body>
          {/* Customer Information */}
          <Row className="mb-4">
            <Col md={6}>
              {/* Basic Details */}
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Customer Code:
                </Col>
                <Col sm={8}>{customer.CustomerCode}</Col>
              </Row>
              {/* ... Additional customer detail rows ... */}
            </Col>
            <Col md={6}>
              {/* Address Details */}
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Billing Address:
                </Col>
                <Col sm={8}>{customer.BillingAddress || "N/A"}</Col>
              </Row>
              {/* ... Additional address rows ... */}
            </Col>
          </Row>

          {/* Addresses Section */}
          <h4>Addresses</h4>
          {customer.Addresses && customer.Addresses.length > 0 ? (
            <Table striped bordered hover>
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
                    <td>{address.AddressName}</td>
                    <td>{address.Street}</td>
                    <td>{address.Block}</td>
                    <td>{address.City}</td>
                    <td>{address.State}</td>
                    <td>{address.ZipCode}</td>
                    <td>{address.Country}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p>No addresses available.</p>
          )}

          {/* Back Button */}
          <div className="mt-3">
            <button
              className="btn btn-secondary"
              onClick={() => router?.back()}
            >
              Back to Customers
            </button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

// Add server-side check for authentication
export async function getServerSideProps(context) {
  const { id } = context.params;

 

  // Build the API URL dynamically
  const protocol = context.req.headers["x-forwarded-proto"] || "http";
  const host = context.req.headers.host || "localhost:3000";
  const url = `${protocol}://${host}/api/customers/${id}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch data, received status ${res.status}`);
    }

    const data = await res.json();

    return {
      props: {
        customer: Array.isArray(data) ? data[0] : data,
      },
    };
  } catch (error) {
    console.error("Error fetching customer:", error);
    return {
      props: {
        customer: null,
      },
    };
  }
}
