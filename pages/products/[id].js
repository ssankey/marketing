import { useRouter } from "next/router";
import { Container, Row, Col, Card, Table, Spinner } from "react-bootstrap";

// Utility function to format dates as 'dd-MMM-yyyy' (e.g., 23-Oct-2024)
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { day: "2-digit", month: "short", year: "numeric" };
  return date.toLocaleDateString("en-GB", options); // Ensures 'dd-MMM-yyyy' format
}

export default function QuotationDetails({ quotations }) {
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

  if (!quotations || quotations.length === 0) {
    return (
      <Container className="mt-5">
        <div className="alert alert-warning">Quotation not found</div>
      </Container>
    );
  }

  const quotation = quotations[0];

  // Group products by DocEntry
  const groupedProducts = quotations.reduce((acc, product) => {
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
          <h2 className="mb-0">Quotation Details #{id}</h2>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={6}>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Ship To:
                </Col>
                <Col sm={8}>
                  <div>{quotation.ShipToCode}</div>
                  <div>{quotation.ShipToDesc}</div>
                </Col>
              </Row>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Ship Date:
                </Col>
                <Col sm={8}>{formatDate(quotation.ShipDate)}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Doc Date:
                </Col>
                <Col sm={8}>{formatDate(quotation.DocDate)}</Col>
              </Row>
            </Col>
            <Col md={6}>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Currency:
                </Col>
                <Col sm={8}>{quotation.Currency}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Description:
                </Col>
                <Col sm={8}>{quotation.Dscription}</Col>
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
                      <th>Currency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => (
                      <tr key={index}>
                        <td>{product.Dscription}</td>
                        <td>{product.ItemCode}</td>
                        <td>{product.Quantity}</td>
                        <td>{product.Price}</td>
                        <td>{product.Currency || "N/A"}</td>
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
              Back to Quotations
            </button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export async function getServerSideProps(context) {
  const { id } = context.params;
  const protocol = context.req.headers["x-forwarded-proto"] || "http";
  const host = context.req.headers.host || "localhost:3000";

  const url = `${protocol}://${host}/api/quotations/${id}`;
  console.log(`Fetching data from URL: ${url}`); // Debugging log

  try {
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`Failed to fetch data, received status ${res.status}`);
      throw new Error(`Failed to fetch data, received status ${res.status}`);
    }

    const data = await res.json();

    return {
      props: {
        quotations: Array.isArray(data) ? data : [data],
      },
    };
  } catch (error) {
    console.error("Error fetching Quotation:", error);
    return {
      props: {
        quotations: [], // Pass empty array on error
      },
    };
  }
}