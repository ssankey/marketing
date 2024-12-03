// pages/products/[id].js

import { useRouter } from "next/router";
import { Container, Row, Col, Card, Spinner, Table, Alert } from "react-bootstrap";
import { getProductDetail, getProductKPIs } from "../../lib/models/products";
import { useAuth } from '../../hooks/useAuth';
import { Line, Bar } from 'react-chartjs-2';
import 'chart.js/auto'; // Required for Chart.js 3.x and above

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const options = { day: "2-digit", month: "short", year: "numeric" };
  return date.toLocaleDateString("en-GB", options);
}

export default function ProductDetails({ product, kpiData, salesTrendData, topCustomersData, inventoryData, pricingHistoryData }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">You need to be authenticated to view this page.</Alert>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">Product not found</Alert>
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
        label: 'Revenue ($)',
        data: salesTrendRevenue,
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.5)',
        fill: true,
      },
      {
        label: 'Units Sold',
        data: salesTrendUnits,
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.5)',
        fill: true,
      },
    ],
  };

  // Prepare data for inventory levels
  const inventoryLevels = inventoryData.map(item => item.Location);
  const inventoryQuantities = inventoryData.map(item => item.Quantity);

  const inventoryChartData = {
    labels: inventoryLevels,
    datasets: [
      {
        label: 'Inventory Quantity',
        data: inventoryQuantities,
        backgroundColor: '#ffc107',
      },
    ],
  };

  // Prepare data for pricing history
  // const pricingLabels = pricingHistoryData.map(item => formatDate(item.Date));
  // const pricingValues = pricingHistoryData.map(item => item.Price);

  // const pricingChartData = {
  //   labels: pricingLabels,
  //   datasets: [
  //     {
  //       label: 'Price ($)',
  //       data: pricingValues,
  //       borderColor: '#dc3545',
  //       backgroundColor: 'rgba(220, 53, 69, 0.5)',
  //       fill: false,
  //     },
  //   ],
  // };

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <h2 className="mb-0">Product Details - {product.ItemName}</h2>
        </Card.Header>
        <Card.Body>
          {/* Basic Information and KPI Summary */}
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
                    <td>{product.U_MolecularWeight || "N/A"}</td>
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
                    <td>${Number(kpiData.TotalRevenue).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <th>Units Sold</th>
                    <td>{Number(kpiData.UnitsSold).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <th>Number of Customers</th>
                    <td>{Number(kpiData.NumberOfCustomers).toLocaleString()}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>

          {/* Sales Trend */}
          <Row className="mb-4">
            <Col>
              <h4>Sales Trend</h4>
              <Card className="p-3">
                <Line data={salesTrendChartData} />
              </Card>
            </Col>
          </Row>

          {/* Top Customers */}
          <Row className="mb-4">
            <Col>
              <h4>Top Customers</h4>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Customer Code</th>
                    <th>Customer Name</th>
                    <th>Total Spent ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomersData.length > 0 ? (
                    topCustomersData.map((customer) => (
                      <tr key={customer.CustomerCode}>
                        <td>{customer.CustomerCode}</td>
                        <td>{customer.CustomerName}</td>
                        <td>${Number(customer.TotalSpent).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center">No customer data available.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Col>
          </Row>

          {/* Inventory Levels */}
          <Row className="mb-4">
            <Col>
              <h4>Inventory Levels</h4>
              <Card className="p-3">
                <Bar data={inventoryChartData} />
              </Card>
              <Table striped bordered hover className="mt-3">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.length > 0 ? (
                    inventoryData.map((item, index) => (
                      <tr key={index}>
                        <td>{item.Location}</td>
                        <td>{Number(item.Quantity).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="text-center">No inventory data available.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Col>
          </Row>

          {/* Pricing History */}
          {/* <Row className="mb-4">
            <Col>
              <h4>Pricing History</h4>
              <Card className="p-3">
                <Line data={pricingChartData} />
              </Card>
              <Table striped bordered hover className="mt-3">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Price ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingHistoryData.length > 0 ? (
                    pricingHistoryData.map((price, index) => (
                      <tr key={index}>
                        <td>{formatDate(price.Date)}</td>
                        <td>${Number(price.Price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="text-center">No pricing history available.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Col>
          </Row> */}

          {/* Additional Information */}
          <Row className="mb-4">
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
                  <strong>Molecular Formula:</strong> {product.U_MolecularFormula || "N/A"}
                </p>
                <p>
                  <strong>Applications:</strong> {product.U_Applications || "N/A"}
                </p>
                <p>
                  <strong>Structure:</strong> {product.U_Structure ? <a href={product.U_Structure} target="_blank" rel="noopener noreferrer">View Structure</a> : "N/A"}
                </p>
              </Card>
            </Col>
          </Row>

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

    const { kpiData, salesTrendData, topCustomersData, inventoryData } = await getProductKPIs(id);

    // Serialize date fields in kpiData, salesTrendData, topCustomersData, inventoryData, and pricingHistoryData if necessary
    const serializedKPIData = serializeDates(kpiData);

    const serializedSalesTrendData = salesTrendData.map(item => serializeDates(item));
    const serializedTopCustomersData = topCustomersData.map(item => serializeDates(item));
    const serializedInventoryData = inventoryData.map(item => serializeDates(item));
    // const serializedPricingHistoryData = pricingHistoryData.map(item => serializeDates(item));

    console.log("Sales Trend Data:", salesTrendData);
    console.log("Top Customers Data:", topCustomersData);
    console.log("Inventory Data:", inventoryData);
    // console.log("Pricing History Data:", pricingHistoryData);

    return {
      props: {
        product: serializedProduct,
        kpiData: serializedKPIData,
        salesTrendData: serializedSalesTrendData,
        topCustomersData: serializedTopCustomersData,
        inventoryData: serializedInventoryData,
        // pricingHistoryData: serializedPricingHistoryData,
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
