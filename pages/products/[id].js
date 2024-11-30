// pages/products/[id].js

import { useRouter } from "next/router";
import { Container, Row, Col, Card, Spinner, Table } from "react-bootstrap";
import { getProductDetail, getProductKPIs } from "../../lib/models/products";
import { useAuth } from '../../hooks/useAuth';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto'; // Required for Chart.js 3.x and above

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const options = { day: "2-digit", month: "short", year: "numeric" };
  return date.toLocaleDateString("en-GB", options);
}

export default function ProductDetails({ product, kpiData, salesTrendData, topCustomersData }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated) {
    return null; // Prevents rendering if not authenticated
  }

  if (!product) {
    return (
      <Container className="mt-5">
        <div className="alert alert-warning">Product not found</div>
      </Container>
    );
  }

  // Prepare data for sales trend chart
  const salesTrendLabels = salesTrendData.map(item => item.Month);
  const salesTrendRevenue = salesTrendData.map(item => item.MonthlyRevenue);
  const salesTrendUnits = salesTrendData.map(item => item.MonthlyUnitsSold);

  const salesTrendChartData = {
    labels: salesTrendLabels,
    datasets: [
      {
        label: 'Revenue',
        data: salesTrendRevenue,
        borderColor: '#007bff',
        fill: false,
      },
      {
        label: 'Units Sold',
        data: salesTrendUnits,
        borderColor: '#28a745',
        fill: false,
      },
    ],
  };

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <h2 className="mb-0">Product Details - {product.ItemName}</h2>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={6}>
              <h4>Basic Information</h4>
              <Table bordered>
                <tbody>
                  <tr>
                    <th>Item Code</th>
                    <td>{product.ItemCode}</td>
                  </tr>
                  <tr>
                    <th>Item Name</th>
                    <td>{product.ItemName}</td>
                  </tr>
                  <tr>
                    <th>Item Type</th>
                    <td>{product.ItemType}</td>
                  </tr>
                  <tr>
                    <th>CAS No</th>
                    <td>{product.U_CasNo || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Molecular Weight</th>
                    <td>{product.U_MolucularWeight || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Created Date</th>
                    <td>{formatDate(product.CreateDate)}</td>
                  </tr>
                  <tr>
                    <th>Updated Date</th>
                    <td>{formatDate(product.UpdateDate)}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
            <Col md={6}>
              <h4>KPI Summary</h4>
              <Table bordered>
                <tbody>
                  <tr>
                    <th>Total Revenue Generated</th>
                    <td>${kpiData.TotalRevenue}</td>
                  </tr>
                  <tr>
                    <th>Units Sold</th>
                    <td>{kpiData.UnitsSold}</td>
                  </tr>
                  <tr>
                    <th>Number of Customers</th>
                    <td>{kpiData.NumberOfCustomers}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>

          {/* <Row className="mb-4">
            <Col>
              <h4>Sales Trend</h4>
              <Card className="p-3">
                <Line data={salesTrendChartData} />
              </Card>
            </Col>
          </Row> */}

          {/* <Row className="mb-4">
            <Col>
              <h4>Top Customers</h4>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Customer Code</th>
                    <th>Customer Name</th>
                    <th>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomersData.map((customer) => (
                    <tr key={customer.CustomerCode}>
                      <td>{customer.CustomerCode}</td>
                      <td>{customer.CustomerName}</td>
                      <td>${customer.TotalSpent.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row> */}

          {/* <Row className="mb-4">
            <Col>
              <h4>Additional Information</h4>
              <Card body>
                <p>
                  <strong>IUPAC Name:</strong> {product.U_IUPACName || "N/A"}
                </p>
                <p>
                  <strong>Synonyms:</strong> {product.U_Synonyms || "N/A"}
                </p>
                <p>
                  <strong>Molecular Formula:</strong> {product.U_MolucularFormula || "N/A"}
                </p>
                <p>
                  <strong>Applications:</strong> {product.U_Applications || "N/A"}
                </p>
              </Card>
            </Col>
          </Row> */}

          {/* Back Button */}
          <div className="mt-3">
            <button className="btn btn-secondary" onClick={() => router.back()}>
              Back to Products
            </button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export async function getServerSideProps(context) {
  const { id } = context.params;

  function serializeDates(obj) {
    const serializedObj = { ...obj };
    for (const key in serializedObj) {
      if (serializedObj[key] instanceof Date) {
        serializedObj[key] = serializedObj[key].toISOString();
      }
    }
    return serializedObj;
  }

  try {
    const product = await getProductDetail(id);

    if (!product) {
      return {
        props: {
          product: null,
        },
      };
    }

    // Serialize date fields in the product object
    const serializedProduct = serializeDates(product);

    const { kpiData, salesTrendData, topCustomersData } = await getProductKPIs(id);

    // Serialize date fields in kpiData, salesTrendData, and topCustomersData if necessary
    const serializedKPIData = serializeDates(kpiData);

    // If salesTrendData and topCustomersData contain Date objects, serialize them too
    const serializedSalesTrendData = salesTrendData.map(item => serializeDates(item));
    const serializedTopCustomersData = topCustomersData.map(item => serializeDates(item));
    console.log("Sales Trend Data:", salesTrendData);
    console.log("Top Customers Data:", topCustomersData);

    return {
      props: {
        product: serializedProduct,
        kpiData: serializedKPIData,
        salesTrendData: serializedSalesTrendData,
        topCustomersData: serializedTopCustomersData,
      },
    };
  } catch (error) {
    console.error("Error fetching product data:", error);
    return {
      props: {
        product: null,
      },
    };
  }
}
