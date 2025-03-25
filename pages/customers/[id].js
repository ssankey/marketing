//page/customers/[id].js

import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Spinner, Table , Dropdown } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import  PurchasesAmountChart  from "../../components/CustomerCharts/purchasevsamount";
import CustomerOrdersTable from  "../../components/CustomerCharts/outstandingtable";

import SalesTable from "../../components/CustomerCharts/salestable";
import SalesPieChart from "../../components/CustomerCharts/SalesPieChart";

// Utility function to format date
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString();
}


export default function CustomerDetails({
  customer,
  purchaseData,
  TopQuotationData,
  TopOrderData,
  TopInvoiceData,
  salesByCategoryData,
  customerOutstandings, 
}) {
  //export default function CustomerDetails({ customer }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [outstandingFilter, setOutstandingFilter] = useState('Payment Pending');

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

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

  const handleFilterSelect = (eventKey) => {
  setOutstandingFilter(eventKey);
};

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
            </div>
          </Card.Header>
          <Card.Body>
            {/* <PurchasesAmountChart data={purchaseData} /> */}
            <PurchasesAmountChart
              customerId={customer?.CustomerCode}
            />
          </Card.Body>
        </Card>
      )}
      {/*salesByCategory */}
      {purchaseData && purchaseData.length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Sales by Category</h3>
            </div>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col lg={6}>
                {/* Table for Sales by Category */}
                <SalesTable data={salesByCategoryData} />
              </Col>
              <Col lg={6}>
                {/* Pie Chart for Sales by Category */}
                <SalesPieChart data={salesByCategoryData} />
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
      <Row className="mb-4">
        <Col lg={4}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Last 10 Quotations</h5>
            </Card.Header>
            <Card.Body>
              <div className="p-3">
                {TopQuotationData?.map((quote) => (
                  <div
                    key={quote.QuotationNumber}
                    className="py-3 px-3 mb-2 rounded bg-light shadow-sm d-flex flex-column"
                  >
                    {/* <div className="fw-bold">
                      Quotation#: {quote.QuotationNumber}
                    </div> */}
                    <div className="fw-bold">
                      Quotation#:{" "}
                      <span
                        style={{ cursor: "pointer", color: "blue" }}
                        onClick={() =>
                          // router.push(`/quotationdetails?/${quote.QuotationNumber}`)
                          router.push(
                            `/quotationdetails?d=${quote.QuotationNumber}&e=${quote.DocEntry}`
                          )
                        }
                      >
                        {quote.QuotationNumber}
                      </span>
                    </div>
                    <div className="text-muted small mt-1">
                      <div>
                        <i className="bi bi-calendar-event me-1"></i>
                        Quotation Date: {formatDate(quote.QuotationDate)}
                      </div>
                      <div>
                        <i className="bi bi-truck me-1"></i>
                        Delivery Date: {formatDate(quote.DeliveryDate)}
                      </div>
                      <div className="fw-bold mt-2">
                        Status:{" "}
                        <span
                          className={`badge ${
                            quote.QuotationStatus === "C"
                              ? "bg-danger"
                              : "bg-success"
                          }`}
                        >
                          {quote.QuotationStatus === "C" ? "Closed" : "Open"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Last 10 Orders</h5>
            </Card.Header>
            <Card.Body>
              <div className="p-3">
                {TopOrderData?.map((order) => (
                  <div
                    key={order.OrderNumber}
                    className="py-3 px-3 mb-2 rounded bg-light shadow-sm d-flex flex-column"
                  >
                    {/* <div className="fw-bold">Order#: {order.OrderNumber}</div> */}
                    <div className="fw-bold">
                      Order#:{" "}
                      <span
                        style={{ cursor: "pointer", color: "blue" }}
                        onClick={() =>
                          // router.push(`/orders/${order.OrderNumber}`)
                          router.push(
                            `/orderdetails?d=${order.OrderNumber}&e=${order.DocEntry}`
                          )
                        }
                      >
                        {order.OrderNumber}
                      </span>
                    </div>
                    <div className="text-muted small mt-1">
                      <div>
                        <i className="bi bi-calendar-check me-1"></i>
                        Order Date: {formatDate(order.OrderDate)}
                      </div>
                      <div>
                        <i className="bi bi-truck me-1"></i>
                        Delivery Date: {formatDate(order.DeliveryDate)}
                      </div>
                      <div className="fw-bold mt-2">
                        Status:{" "}
                        <span
                          className={`badge ${
                            order.OrderStatus === "C"
                              ? "bg-danger"
                              : "bg-success"
                          }`}
                        >
                          {order.OrderStatus === "C" ? "Closed" : "Open"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Last 10 Invoices</h5>
            </Card.Header>
            <Card.Body>
              <div className="p-3">
                {TopInvoiceData?.map((invoice) => (
                  <div
                    key={invoice.InvoiceNumber}
                    className="py-3 px-3 mb-2 rounded bg-light shadow-sm d-flex flex-column"
                  >
                    {/* <div className="fw-bold">
                      Invoice#: {invoice.InvoiceNumber}
                    </div> */}
                    <div className="fw-bold">
                      Invoice#:{" "}
                      <span
                        style={{ cursor: "pointer", color: "blue" }}
                        onClick={() =>
                          // router.push(`/invoices/${invoice.InvoiceNumber}`)
                          router.push(
                            `/invoicedetails?d=${invoice.InvoiceNumber}&e=${invoice.DocEntry}`
                          )
                        }
                      >
                        {invoice.InvoiceNumber}
                      </span>
                    </div>
                    <div className="text-muted small mt-1">
                      <div>
                        <i className="bi bi-calendar me-1"></i>
                        Invoice Date: {formatDate(invoice.InvoiceDate)}
                      </div>
                      <div>
                        <i className="bi bi-calendar me-1"></i>
                        Delivery Date: {formatDate(invoice.DeliveryDate)}
                      </div>
                      <div>
                        <i className="bi bi-calendar me-1"></i>
                        NetAmount : {formatCurrency(invoice.NetAmount)}
                      </div>
                      <div className="fw-bold mt-2">
                        Status:{" "}
                        <span
                          className={`badge ${
                            invoice.InvoiceStatus === "C"
                              ? "bg-danger"
                              : "bg-success"
                          }`}
                        >
                          {invoice.InvoiceStatus === "C" ? "Closed" : "Open"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {/* Customer Orders Table */}
      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
      <h3 className="mb-0">Customer Outstanding</h3>
      <div className="ms-auto"> {/* ms-auto pushes the dropdown to the right */}
        <Dropdown onSelect={handleFilterSelect}>
          <Dropdown.Toggle variant="outline-secondary" id="outstanding-filter-dropdown">
            {outstandingFilter}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item eventKey="Payment Pending">Payment Pending</Dropdown.Item>
            <Dropdown.Item eventKey="Payment Done">Payment Done</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </div>
        </Card.Header>
        {/* <Card.Body> */}
        <Card.Body 
          style={{ 
            maxHeight: "500px",  // Fixed height
            overflowY: "auto",    // Vertical scroll when needed
            overflowX: "auto"     // Horizontal scroll when needed
          }}
        >
         {/* <CustomerOrdersTable customerOutstandings={ customerOutstandings } /> */}
         <CustomerOrdersTable 
  customerOutstandings={customerOutstandings} 
  filter={outstandingFilter}
/>


        </Card.Body>
      </Card>
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

    //fetch outstanding

    const outstandingUrl = `${protocol}://${host}/api/customers/${id}/outstanding`;
    const outstandingRes = await fetch(outstandingUrl);

    if (!outstandingRes.ok) {
      throw new Error(`Failed to fetch customer outstanding: ${outstandingRes.statusText}`);
    }

    const customerOutstandings = await outstandingRes.json();

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
    console.log(metricsUrl);
    const metricsRes = await fetch(metricsUrl);

    if (!id) {
      throw new Error("Customer ID is required");
    }
    console.log("Customer ID in getServerSideProps:", id);

    if (!metricsRes.ok) {
      throw new Error(
        `Failed to fetch purchase metrics: ${metricsRes.statusText}`
      );
    }

    const purchaseData = await metricsRes.json();
    console.log(purchaseData);

    /****Top quotation  */
    const topquotation = `${protocol}://${host}/api/customers/${id}?quotations=true`;
    const quotationRes = await fetch(topquotation);
    console.log(id);
    if (!quotationRes.ok) {
      throw new Error(
        `Failed to fetch top quotation: ${quotationRes.statusText}`
      );
    }

    const TopQuotationData = await quotationRes.json();
    console.log(TopQuotationData);

    /****Top Orders  */
    const toporders = `${protocol}://${host}/api/customers/${id}?orders=true`;
    const orderRes = await fetch(toporders);

    if (!orderRes.ok) {
      throw new Error(`Failed to fetch top orders: ${orderRes.statusText}`);
    }

    const TopOrderData = await orderRes.json();
    console.log(TopOrderData);

    /***Top Invoices */

    const topinvoices = `${protocol}://${host}/api/customers/${id}?invoices=true`;
    const invoiceRes = await fetch(topinvoices);

    if (!invoiceRes.ok) {
      throw new Error(`Failed to fetch top invoice ${invoiceRes.statusText}`);
    }

    const TopInvoiceData = await invoiceRes.json();
    console.log(TopInvoiceData);

    const salesByCategoryUrl = `${protocol}://${host}/api/customers/salesbycategory?id=${id}`;
    const salesByCategoryRes = await fetch(salesByCategoryUrl);

    if (!salesByCategoryRes.ok) {
      throw new Error(
        `Failed to fetch sales by category: ${salesByCategoryRes.statusText}`
      );
    }

    const salesByCategoryData = await salesByCategoryRes.json();

    return {
      props: {
        customer,
        purchaseData,
        TopQuotationData,
        TopOrderData,
        TopInvoiceData,
        salesByCategoryData,
        customerOutstandings
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error.message);

    return {
      props: {
        customer: null,
        purchaseData: null,
        TopQuotationData: null,
        TopOrderData: null,
        TopInvoiceData: null,
        salesByCategoryData: null,
        customerOutstandings:null,
        error: error.message,
        
      },
    };
  }
} 