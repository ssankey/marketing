
  
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Spinner } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
// Adjust the path based on your project structure
// import { useAuth } from "../../utils/useAuth";
import { useAuth } from "hooks/useAuth";



export default function InvoiceDetails({ invoices }) {
  const isAuthenticated = useAuth(); // Protect the invoice page
  const router = useRouter();
  const { id } = router.query;

  // Display a loading spinner while the router is in fallback mode
  if (router.isFallback) {
    return (
      <Container className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  // Show a warning message if the invoice is not found
  if (!invoices || invoices.length === 0) {
    return (
      <Container className="mt-5">
        <div className="alert alert-warning">Invoice not found</div>
      </Container>
    );
  }

  // Display the invoice details, grouping products by `DocEntry`
  const invoice = invoices[0];
  const groupedProducts = invoices.reduce((acc, product) => {
    if (!acc[product.DocEntry]) {
      acc[product.DocEntry] = [];
    }
    acc[product.DocEntry].push(product);
    return acc;
  }, {});

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <h2 className="mb-0">Invoice Details #{id}</h2>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={6}>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Client Code:
                </Col>
                <Col sm={8}>{invoice.CardCode}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Bill To:
                </Col>
                <Col sm={8}>
                  <div>{invoice.BillToCode}</div>
                  <div>{invoice.BillToDesc}</div>
                </Col>
              </Row>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Doc Date:
                </Col>
                <Col sm={8}>{formatDate(invoice.DocDate)}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Due Date:
                </Col>
                <Col sm={8}>{formatDate(invoice.DocDueDate)}</Col>
              </Row>
            </Col>
            <Col md={6}>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Currency:
                </Col>
                <Col sm={8}>{invoice.DocCur}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Total Amount:
                </Col>
                <Col sm={8}>
                  {formatCurrency(invoice.DocTotal)} {invoice.DocCur}
                </Col>
              </Row>
            </Col>
          </Row>

          {/* Products Section */}
          <h4 className="mt-4 mb-3">Products</h4>
          {Object.entries(groupedProducts).map(([docEntry, products]) => (
            <Card key={docEntry} className="mb-3">
              <Card.Body>
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Item Description</th>
                      <th>Item Code</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => (
                      <tr key={index}>
                        <td>{product.Dscription}</td>
                        <td>{product.ItemCode}</td>
                        <td>{product.Quantity}</td>
                        <td>
                          {formatCurrency(product.Price)}{" "}
                          {product.Currency || "N/A"}
                        </td>
                        <td>
                          {formatCurrency(product.LineTotal)}{" "}
                          {product.Currency || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          ))}

          {/* Back Button */}
          <div className="mt-3">
            <button className="btn btn-secondary" onClick={() => router.back()}>
              Back to Invoices
            </button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}


export async function getServerSideProps(context) {
  const token = context.req.cookies.token;

  if (!token) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const { id } = context.params;

  try {
    
    const protocol = context.req.headers["x-forwarded-proto"] || "http";
    const host = context.req.headers.host || "localhost:3000";
    const apiUrl = `${protocol}://${host}/api/invoices/${id}`;
    
    const res = await fetch(`${apiUrl}`);
    if (!res.ok) {
      return { notFound: true };
    }

    const { invoices } = await res.json();

    return {
      props: {
        invoices: Array.isArray(invoices) ? invoices : [invoices],
      },
    };
  } catch (error) {
    console.error("Fetch error:", error);
    return {
      props: { invoices: [] },
    };
  }
}
