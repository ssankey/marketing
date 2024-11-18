// pages/orders.js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Spinner } from 'react-bootstrap';
import { formatCurrency } from 'utils/formatCurrency';
import { formatDate } from 'utils/formatDate';

export default function OrderDetails({ orders }) {
    const router = useRouter();
    const { d, e } = router.query; // Extract 'd' and 'e' instead of 'id'

  // Handle loading state for fallback during ISR/SSG
  if (router.isFallback) {
    return (
      <Container className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return <LoadingSpinner />; // Display loading spinner if not authenticated
  }

  if (!orders || orders.length === 0) {
    return (
      <Container className="mt-5">
        <div className="alert alert-warning">Order not found</div>
      </Container>
    );
  }

  const order = orders[0];

    // Group products by DocEntry (though with both d and e, grouping may not be necessary)
    const groupedProducts = orders.reduce((acc, product) => {
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
                    <h2 className="mb-0">Order Details #{d}</h2>
                </Card.Header>
                <Card.Body>
                    <Row className="mb-4">
                        <Col md={6}>
                            <Row className="mb-2">
                                <Col sm={4} className="fw-bold">Client Code:</Col>
                                <Col sm={8}>{order.CardCode}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col sm={4} className="fw-bold">Customer PO No:</Col>
                                <Col sm={8}>{order.CustomerPONo || 'N/A'}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col sm={4} className="fw-bold">Ship Date:</Col>
                                <Col sm={8}>{formatDate(order.ShipDate)}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col sm={4} className="fw-bold">Doc Date:</Col>
                                <Col sm={8}>{formatDate(order.DocDate)}</Col>
                            </Row>
                        </Col>
                        <Col md={6}>
                            <Row className="mb-2">
                                <Col sm={4} className="fw-bold">Currency:</Col>
                                <Col sm={8}>{order.Currency}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col sm={4} className="fw-bold">Total Amount:</Col>
                                <Col sm={8}>
                                    {formatCurrency(order.DocTotal)} {order.Currency}
                                </Col>
                            </Row>
                            <Row className="mb-2">
                                <Col sm={4} className="fw-bold">Status:</Col>
                                <Col sm={8}>{order.DocStatus}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col sm={4} className="fw-bold">Sales Employee:</Col>
                                <Col sm={8}>{order.SalesEmployee}</Col>
                            </Row>
                        </Col>
                    </Row>

                    {/* Document Groups */}
                    <h4 className="mt-4 mb-3">Products</h4>
                    {Object.entries(groupedProducts).map(([docEntry, products]) => (
                        <Card key={docEntry} className="mb-3">
                            <Card.Body>
                                <Table responsive striped hover>
                                    <thead>
                                        <tr>
                                            <th>Item Group</th>
                                            <th>Item Code</th>
                                            <th>Item Name</th>
                                            <th>Quantity</th>
                                            <th>Price</th>
                                            <th>Subtotal</th>
                                            <th>Delivery Date</th>
                                            <th>Plant Location</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((product, index) => {
                                            const subtotal = product.Quantity * product.Price;
                                            return (
                                                <tr key={index}>
                                                    <td>{product.ItemGroup}</td>
                                                    <td>{product.ItemCode}</td>
                                                    <td>{product.ItemName}</td>
                                                    <td>{product.Quantity}</td>
                                                    <td>
                                                        {formatCurrency(product.Price)} {product.Currency || 'N/A'}
                                                    </td>
                                                    <td>
                                                        {formatCurrency(subtotal)} {product.Currency || 'N/A'}
                                                    </td>
                                                    <td>{formatDate(product.ShipDate)}</td>
                                                    <td>{product.PlantLocation || 'N/A'}</td>
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
            <button className="btn btn-secondary" onClick={() => router.back()}>
              Back to Orders
            </button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

// Server-side authentication and data fetching
export async function getServerSideProps(context) {
    const { d, e } = context.query; // Extract 'd' and 'e' from query parameters

    if (!d || !e) {
        return {
            notFound: true, // Return 404 page if parameters are missing
        };
    }

  // Fetch the data from your API
  try {
    const protocol = context.req.headers['x-forwarded-proto'] || 'http';
    const host = context.req.headers.host;

    try {
        const res = await fetch(`${protocol}://${host}/api/orders/detail?d=${d}&e=${e}`);
        if (!res.ok) {
            throw new Error(`Failed to fetch data, received status ${res.status}`);
        }

    const data = await res.json();

    return {
      props: {
        orders: Array.isArray(data) ? data : [data],
      },
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    return {
      props: {
        orders: [],
      },
    };
  }
}
