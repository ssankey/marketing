// components/InvoiceDetails.js

import React from 'react';
import { useRouter } from 'next/router';
import { Container, Row, Col, Card, Table, Spinner, Button ,Alert} from 'react-bootstrap';
import { formatCurrency } from 'utils/formatCurrency';
import { formatDate } from 'utils/formatDate';

const InvoiceDetails = ({ invoice }) => {
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

  if (!invoice) {
    return (
      <Container className="mt-5">
        <div className="alert alert-warning">Invoice not found</div>
      </Container>
    );
  }

  // Determine the document type
  const isCreditNote = invoice.Type === 'CN';

  // Adjust titles accordingly
  const documentTitle = isCreditNote ? 'Credit Note Details' : 'Invoice Details';
  const printButtonLabel = isCreditNote ? 'Print Credit Note' : 'Print Invoice';

  // Group products by Item Group or any relevant grouping
  const groupedProducts = invoice.LineItems.reduce((acc, product) => {
    const groupKey = product.ItemGroup || 'Others';
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(product);
    return acc;
  }, {});

  // Function to convert amounts to INR
  const convertToINR = (amount) => {
    return invoice.DocCur === 'INR' ? amount : amount * invoice.DocRate;
  };


  // Converted amounts
  const subtotalINR = convertToINR(invoice.Subtotal);
  const taxTotalINR = convertToINR(invoice.TaxTotal);
  const discountTotalINR = convertToINR(invoice.DiscountTotal);
  const shippingFeeINR = convertToINR(invoice.ShippingFee);
  const invoiceTotalINR = convertToINR(invoice.InvoiceTotal);


  return (
    <Container className="mt-4">
      <Card>
        {/* <Card.Header className="p-0">
          
          <Alert 
        variant={invoice.DocStatusDisplay === 'Closed' ? 'success' : 'primary'} 
        className="w-100 text-center mb-0 fw-bold fs-4"
        style={{ color: "#000" }} // Ensures black text
    >
        {documentTitle} #{invoice.DocNum} - {invoice.DocStatusDisplay}
    </Alert>
        </Card.Header> */}
        <Card.Header className="p-0">
    <Alert 
        variant={invoice.DocStatusDisplay === 'Closed' ? 'success' : 'primary'} 
        className="w-100 mb-0 fw-bold fs-4 d-flex justify-content-between align-items-center"
        style={{ color: "#000" }} // Ensures black text inside alert
    >
        {/* Order Status */}
        <span>
            {documentTitle} #{invoice.DocNum} - {invoice.DocStatusDisplay}
        </span>

        {/* Print Button (Inside Alert, Right-Aligned) */}
        <Button
            variant="primary"
            onClick={() => router.push(`/printInvoice?d=${invoice.DocNum}&e=${invoice.DocEntry}`)}
            className="fw-bold border"
        >
            {printButtonLabel}
        </Button>
    </Alert>
</Card.Header>

        <Card.Body>
          {/* Invoice Information */}
          <Row className="mb-4">
            <Col md={6}>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">Client Code:</Col>
                <Col sm={7}>{invoice.CardCode}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">Client Name:</Col>
                <Col sm={7}>{invoice.CardName}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">Contact Person:</Col>
                <Col sm={7}>{invoice.ContactPerson || 'N/A'}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">Phone:</Col>
                <Col sm={7}>{invoice.Phone || 'N/A'}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">Email:</Col>
                <Col sm={7}>{invoice.Email || 'N/A'}</Col>
              </Row>
            </Col>
            <Col md={6}>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">Date:</Col>
                <Col sm={7}>{formatDate(invoice.DocDate)}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">Due Date:</Col>
                <Col sm={7}>{formatDate(invoice.DocDueDate)}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">Ship Date:</Col>
                <Col sm={7}>{formatDate(invoice.ShipDate)}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">Status:</Col>
                <Col sm={7}>{invoice.DocStatusDisplay}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">Sales Employee:</Col>
                <Col sm={7}>{invoice.SalesEmployee}</Col>
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
                    <strong>Subtotal:</strong> {formatCurrency(subtotalINR, 'INR')}
                  </p>
                  <p>
                    <strong>Tax Total:</strong> {formatCurrency(taxTotalINR, 'INR')}
                  </p>
                </Col>
                <Col md={4}>
                  <p>
                    <strong>Discount Total:</strong> {formatCurrency(discountTotalINR, 'INR')}
                  </p>
                  <p>
                    <strong>Shipping Fee:</strong> {formatCurrency(shippingFeeINR, 'INR')}
                  </p>
                </Col>
                <Col md={4}>
                  <p>
                    <strong>Total Amount:</strong> {formatCurrency(invoiceTotalINR, 'INR')}
                  </p>
                  <p>
                    <strong>Payment Terms:</strong> {invoice.PaymentTerms || 'N/A'}
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
                  <p>{invoice.BillToAddress || 'N/A'}</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Shipping Address</h5>
                </Card.Header>
                <Card.Body>
                  <p>{invoice.ShipToAddress || 'N/A'}</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Comments */}
          {invoice.Comments && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Comments</h5>
              </Card.Header>
              <Card.Body>
                <p>{invoice.Comments}</p>
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
                      <th className="text-nowrap">Line #</th>
                      <th className="text-nowrap">Item Code</th>
                       <th className="text-nowrap">Status</th>
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
                      // For credit notes, quantities and amounts are negative
                      const quantity = product.Quantity;
                      const price = product.Price;
                      const lineTotal = product.LineTotal || product.Quantity * product.Price;
                      const priceINR = invoice.DocCur === 'INR' ? product.Price : product.Price * invoice.DocRate;
                      const lineTotalINR = invoice.DocCur === 'INR' ? product.LineTotal : product.LineTotal * invoice.DocRate;

                      return (
                        <tr key={index}>
                          <td className="text-nowrap">{product.LineNum + 1}</td>
                          <td className="text-nowrap">{product.ItemCode}</td>
                           <td className="text-nowrap">{product.LineStatus}</td>
                          <td className="text-nowrap">{product.Description}</td>
                          <td className="text-nowrap">{product.WhsCode}</td>
                          <td className="text-nowrap">{quantity}</td>
                          <td className="text-nowrap">{product.UnitMsr}</td>
                          <td className="text-nowrap">
                            {formatCurrency(priceINR, 'INR')}
                          </td>
                          <td className="text-nowrap">{product.DiscountPercent || 0}%</td>
                          <td className="text-nowrap">{product.TaxPercent || 0}%</td>
                          <td className="text-nowrap">
                            {formatCurrency(lineTotalINR, 'INR')}
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

          {/* Back and Print Buttons */}
          <div className="mt-3 d-flex justify-content-between">
            <Button variant="secondary" onClick={() => router.back()}>
              Back to Invoices
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                router.push(`/printInvoice?d=${invoice.DocNum}&e=${invoice.DocEntry}`)
              }
            >
              {printButtonLabel}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default InvoiceDetails;
