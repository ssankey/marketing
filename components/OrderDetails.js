// components/OrderDetails.js

import React from 'react';
import { useRouter } from 'next/router';
import { Container, Row, Col, Card, Table, Spinner, Button , Alert} from 'react-bootstrap';
import { formatCurrency } from 'utils/formatCurrency';
import { formatDate } from 'utils/formatDate';
import StatusBadge from "./StatusBadge";

const OrderDetails = ({ order }) => {
    console.log(order);
    const router = useRouter();

    // Handle loading state
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

    // Group products by Item Group or any relevant grouping
    const groupedProducts = order.LineItems.reduce((acc, product) => {
        const groupKey = product.ItemGroup || '';
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
                    {/* <h2 className="mb-0">Order Details #{order.DocNum}</h2> */}
                    {/* <Alert variant="success" className="w-100 text-center mb-0" >Order Details #{order.DocNum}</Alert> */}
                    <Alert 
            variant={order.DocStatus === 'C' ? 'success' : 'primary'} 
            className="w-100  mb-0 fw-bold fs-4"
            style={{ color: "#000" }} // Ensures black text
        >
            Order Details #{order.DocNum} - {order.DocStatus === 'C' ? 'Closed' : 'Open'}
        </Alert>
                </Card.Header>
                <Card.Body>
                    {/* Order Information */}
                    <Row className="mb-4">
                        <Col md={6}>
                            <Row className="mb-2">
                                <Col sm={5} className="fw-bold">Client Code:</Col>
                                <Col sm={7}>{order.CardCode}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col sm={5} className="fw-bold">Client Name:</Col>
                                <Col sm={7}>{order.CardName}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col sm={5} className="fw-bold">Contact Person:</Col>
                                <Col sm={7}>{order.ContactPerson || 'N/A'}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col sm={5} className="fw-bold">Phone:</Col>
                                <Col sm={7}>{order.Phone || 'N/A'}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col sm={5} className="fw-bold">Email:</Col>
                                <Col sm={7}>{order.Email || 'N/A'}</Col>
                            </Row>
                        </Col>
                        <Col md={6}>
                            <Row className="mb-2">
                                <Col sm={5} className="fw-bold">Order Date:</Col>
                                <Col sm={7}>{formatDate(order.DocDate)}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col sm={5} className="fw-bold">Delivery Date:</Col>
                                <Col sm={7}>{formatDate(order.DocDueDate)}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col sm={5} className="fw-bold">Ship Date:</Col>
                                <Col sm={7}>{formatDate(order.ShipDate)}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col sm={5} className="fw-bold">Status:</Col>
                                <Col sm={7}>{order.DocStatus}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col sm={5} className="fw-bold">Sales Employee:</Col>
                                <Col sm={7}>{order.SalesEmployee}</Col>
                            </Row>
                        </Col>
                    </Row>

                    {/* Financial Details */}
                    <Card className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">Financial Summary</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={4}>
                                    <p>
                                        <strong>Subtotal:</strong> {formatCurrency(order.Subtotal)} {order.DocCur}
                                    </p>
                                    <p>
                                        <strong>Tax Total:</strong> {formatCurrency(order.TaxTotal)} {order.DocCur}
                                    </p>
                                </Col>
                                <Col md={4}>
                                    <p>
                                        <strong>Discount Total:</strong> {formatCurrency(order.DiscountTotal)}
                                    </p>
                                    <p>
                                        <strong>Shipping Fee:</strong> {formatCurrency(order.ShippingFee)} {order.DocCur}
                                    </p>
                                </Col>
                                <Col md={4}>
                                    <p>
                                        <strong>Total Amount:</strong> {formatCurrency(order.DocTotal)} {order.DocCur}
                                    </p>
                                    <p>
                                        <strong>Payment Terms:</strong> {order.PaymentTerms || 'N/A'}
                                    </p>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Timeline */}
          {/* <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Timeline</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <p>
                    <strong>Timeline</strong> { invoice.Timeline||'N/A'}
                  </p>
                </Col>
                <Col md={4}>
                  <p>
                    <strong>Quote Status</strong> {invoice.QuoteStatus|| 'N/A'}
                  </p>
                </Col>
                <Col md={4}>
                  <p>
                    <strong>Mkt Feedback</strong> { invoice.Mkt_Feedback||'N/A'}
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card> */}

                    {/* Addresses */}
                    <Row className="mb-4">
                        <Col md={6}>
                            <Card>
                                <Card.Header>
                                    <h5 className="mb-0">Billing Address</h5>
                                </Card.Header>
                                <Card.Body>
                                    <p>{order.BillToAddress || 'N/A'}</p>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card>
                                <Card.Header>
                                    <h5 className="mb-0">Shipping Address</h5>
                                </Card.Header>
                                <Card.Body>
                                    <p>{order.ShipToAddress || 'N/A'}</p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Comments */}
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

                    {/* Products Section */}
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
                                            <th className="text-nowrap">Line #</th>
                                            <th className="text-nowrap">Item Code</th>
                                            <th className="text-nowrap">Status</th>
                                            <th className="text-nowrap">Stock</th>
                                            <th className="text-nowrap">Description</th>
                                            <th className="text-nowrap">Warehouse</th>
                                            <th className="text-nowrap">Quantity</th>
                                            <th className="text-nowrap">Unit</th>
                                            <th className="text-nowrap">Price</th>
                                            <th className="text-nowrap">Discount (%)</th>
                                            <th className="text-nowrap">Tax (%)</th>
                                            <th className="text-nowrap">Line Total</th>
                                            <th className="text-nowrap">Delivery Date</th>
                                            {/* <th className="text-nowrap">Status</th> */}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((product, index) => {
                                            const lineTotal = product.LineTotal || product.Quantity * product.Price;
                                            return (
                                                <tr key={index}>
                                                    <td className="text-nowrap">{product.LineNum + 1}</td>
                                                    <td className="text-nowrap">{product.ItemCode}</td>
                                                     <td className="text-nowrap">{product.LineStatus}</td>
                                                     {/* <td className="text-nowrap"><span
                                                            className={`badge ${
                                                                product.StockStatus} === "In Stock" ? "bg-success" : "bg-danger"
                                                            }`}
                                                            >
                                                            {product.StockStatus}
                                                            </span></td> */}
                                                    <td className="text-nowrap">{product.StockStatus}</td>
                                                    <td className="text-nowrap">{product.Description}</td>
                                                    <td className="text-nowrap">{product.WhsCode}</td>
                                                    <td className="text-nowrap">{product.Quantity}</td>
                                                    <td className="text-nowrap">{product.UnitMsr}</td>
                                                    <td className="text-nowrap">
                                                        {formatCurrency(product.Price)}
                                                    </td>
                                                    <td className="text-nowrap">{product.DiscountPercent || 0}%</td>
                                                    <td className="text-nowrap">{product.TaxPercent || 0}%</td>
                                                    <td className="text-nowrap">
                                                        {formatCurrency(lineTotal)}
                                                    </td>
                                                    <td className="text-nowrap">{formatDate(product.ShipDate)}</td>
                                                    {/* <td className="text-nowrap">{product.LineStatus}</td> */}
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
