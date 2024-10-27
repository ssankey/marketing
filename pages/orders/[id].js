import { useRouter } from 'next/router';
import { Container, Row, Col, Card, Table, Spinner } from 'react-bootstrap';
import { formatCurrency } from 'utils/formatCurrency';
import { formatDate } from 'utils/formatDate';



export default function OrderDetails({ orders }) {
    const router = useRouter();
    const { id } = router.query;

    if (router.isFallback) {
        return (
            <Container className="d-flex justify-content-center mt-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    const order = orders[0];

    if (!orders || orders.length === 0) {
        return (
            <Container className="mt-5">
                <div className="alert alert-warning">Order not found</div>
            </Container>
        );
    }

    // Group products by DocEntry
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
                    <h2 className="mb-0">Order Details #{id}</h2>
                </Card.Header>
                <Card.Body>
                    <Row className="mb-4">
                        <Col md={6}>
                            <Row className="mb-2">
                                <Col sm={4} className="fw-bold">Client Code:</Col>
                                <Col sm={8}>{order.CardCode}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col sm={4} className="fw-bold">Ship To:</Col>
                                <Col sm={8}>
                                    <div>{order.ShipToCode}</div>
                                    <div>{order.ShipToDesc}</div>
                                </Col>
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
                                            <th>Compound</th>
                                            <th>Cat No</th>
                                            <th>Qty</th>
                                            <th>Price</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((product, index) => {
                                            const subtotal = product.Quantity * product.Price;
                                            return (
                                                <tr key={index}>
                                                    <td>{product.Dscription}</td>
                                                    <td>{product.ItemCode}</td>
                                                    <td>{product.Quantity}</td>
                                                    <td>
                                                        {formatCurrency(product.Price)} {product.Currency || 'N/A'}
                                                    </td>
                                                    <td>
                                                        {formatCurrency(subtotal)} {product.Currency || 'N/A'}
                                                    </td>
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
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => router.back()}
                        >
                            Back to Orders
                        </button>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
}

export async function getServerSideProps(context) {
    const { id } = context.params;

    // Get the protocol and host from the context
    const protocol = context.req.headers['x-forwarded-proto'] || 'http';
    const host = context.req.headers.host;

    try {
        const res = await fetch(`${protocol}://${host}/api/orders/${id}`);
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
                orders: [], // Pass empty array on error
            },
        };
    }
}
