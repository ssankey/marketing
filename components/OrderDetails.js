// components/OrderDetails.js
import React from "react";
import { useRouter } from "next/router";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Spinner,
  Button,
  Alert,
} from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import StatusBadge from "./StatusBadge";
import Link from "next/link";

const OrderDetails = ({ order }) => {
  const router = useRouter();

  // Loading fallback (optional for SSR)
  if (router.isFallback) {
    return (
      <Container className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="mt-5">
        <div className="alert alert-warning">Order not found</div>
      </Container>
    );
  }

  // Example grouping by an 'ItemGroup' if you had it
  const groupedProducts = order.LineItems.reduce((acc, product) => {
    const groupKey = product.ItemGroup || "General"; 
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(product);
    return acc;
  }, {});

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header className="p-0">
          <Alert
            variant={order.DocStatus === "C" ? "success" : "primary"}
            className="w-100 mb-0 fw-bold fs-4"
            style={{ color: "#000" }}
          >
            Order Details #{order.DocNum} -{" "}
            {order.DocStatus === "C" ? "Closed" : "Open"}
          </Alert>
        </Card.Header>
        <Card.Body>
          {/* Order Header Info */}
          <Row className="mb-4">
            <Col md={6}>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">
                  Client Code:
                </Col>
                <Col sm={7}>{order.CardCode}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">
                  Client Name:
                </Col>
                <Col sm={7}>{order.CardName}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">
                  Contact Person:
                </Col>
                <Col sm={7}>{order.ContactPerson || "N/A"}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">
                  Phone:
                </Col>
                <Col sm={7}>{order.Phone || "N/A"}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">
                  Email:
                </Col>
                <Col sm={7}>{order.Email || "N/A"}</Col>
              </Row>
            </Col>
            <Col md={6}>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">
                  Order Date:
                </Col>
                <Col sm={7}>{formatDate(order.DocDate)}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">
                  Delivery Date:
                </Col>
                <Col sm={7}>{formatDate(order.DocDueDate)}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">
                  Ship Date:
                </Col>
                <Col sm={7}>{formatDate(order.ShipDate)}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">
                  Status:
                </Col>
                <Col sm={7}>
                  <StatusBadge status={order.DocStatus} />
                </Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">
                  Sales Employee:
                </Col>
                <Col sm={7}>{order.SalesEmployee}</Col>
              </Row>
            </Col>
          </Row>

          {/* Financial Summary */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Financial Summary</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <p>
                    <strong>Subtotal:</strong>{" "}
                    {formatCurrency(order.Subtotal)} {order.DocCur}
                  </p>
                  <p>
                    <strong>Tax Total:</strong>{" "}
                    {formatCurrency(order.TaxTotal)} {order.DocCur}
                  </p>
                </Col>
                <Col md={4}>
                  <p>
                    <strong>Discount Total:</strong>{" "}
                    {formatCurrency(order.DiscountTotal)}
                  </p>
                  <p>
                    <strong>Shipping Fee:</strong>{" "}
                    {formatCurrency(order.ShippingFee)} {order.DocCur}
                  </p>
                </Col>
                <Col md={4}>
                  <p>
                    <strong>Total Amount:</strong>{" "}
                    {formatCurrency(order.DocTotal)} {order.DocCur}
                  </p>
                  <p>
                    <strong>Payment Terms:</strong>{" "}
                    {order.PaymentTerms || "N/A"}
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Addresses */}
          <Row className="mb-4">
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Billing Address</h5>
                </Card.Header>
                <Card.Body>
                  <p>{order.BillToAddress || "N/A"}</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Shipping Address</h5>
                </Card.Header>
                <Card.Body>
                  <p>{order.ShipToAddress || "N/A"}</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Comments (Optional) */}
          {order.Comments && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Comments</h5>
              </Card.Header>
              <Card.Body>
                <p>{order.Comments}</p>
              </Card.Body>
            </Card>
          )}

          {/* Line Items */}
          <h4 className="mt-4 mb-3">Line Items</h4>
          {Object.entries(groupedProducts).map(([groupKey, products]) => (
            <Card key={groupKey} className="mb-3">
              <Card.Header>
                <h5 className="mb-0">{groupKey}</h5>
              </Card.Header>
              <Card.Body>
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Line #</th>
                      <th>Item Code</th>
                      <th>CAS No</th>
                      <th>Invoice No</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Description</th>
                      <th>Warehouse</th>
                      <th>Quantity</th>
                      <th>Unit</th>
                      <th>Price</th>
                      <th>Discount (%)</th>
                      <th>Tax Code</th>
                      <th>Line Total</th>
                      <th>Delivery Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => {
                      const lineTotal =
                        product.LineTotal || product.Quantity * product.Price;

                      // We now read from the line fields:
                      const invoiceNumber = product.InvoiceNumber || "N/A";
                      const invoiceDocEntry = product.InvoiceDocEntry || "N/A";

                      return (
                        <tr key={index}>
                          <td>{product.LineNum + 1}</td>
                          <td>{product.ItemCode}</td>
                          <td>{product.U_CasNo}</td>
                          <td>
                            {invoiceNumber !== "N/A" ? (
                              <Link
                                href={`/invoicedetails?d=${invoiceNumber}&e=${invoiceDocEntry}`}
                              >
                                {invoiceNumber}
                              </Link>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td>{product.StockStatus}</td>
                          <td>{product.LineStatus}</td>
                          <td>{product.Description}</td>
                          <td>{product.WhsCode}</td>
                          <td>{product.Quantity}</td>
                          <td>{product.UnitMsr}</td>
                          <td>{formatCurrency(product.Price)}</td>
                          <td>{product.DiscountPercent || 0}%</td>
                          <td>{product.TaxCode || "N/A"}</td>
                          <td>{formatCurrency(lineTotal)}</td>
                          <td>{formatDate(product.ShipDate)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          ))}

          {/* Back Button */}
          <div className="mt-3">
            <Button variant="secondary" onClick={() => router.back()}>
              Back to Orders
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OrderDetails;
