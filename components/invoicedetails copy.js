// components/InvoiceDetails.js

import React from 'react';
import { useRouter } from 'next/router';
import { Container, Row, Col, Table, Image } from 'react-bootstrap';
import { formatCurrency } from 'utils/formatCurrency';
import { formatDate } from 'utils/formatDate';
import Button from 'pages/components/ui/button';
const InvoiceDetails = ({ invoice }) => {
  const router = useRouter();

  // Handle loading state
  if (router.isFallback) {
    return (
      <Container className="d-flex justify-content-center mt-5">
        <div>Loading...</div>
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

  const handlePrint = () => {
    window.print();
  };

  // Calculate totals
  const subTotal = invoice.LineItems.reduce((acc, item) => acc + parseFloat(item.LineTotal), 0);
  const taxTotal = parseFloat(invoice.TaxTotal) || 0;
  const discountTotal = parseFloat(invoice.DiscountTotal) || 0;
  const shippingFee = parseFloat(invoice.ShippingFee) || 0;
  const totalAmount = subTotal + taxTotal + shippingFee - discountTotal;

  return (
    <div className="invoice-container">
      <Container className="invoice-body">
        {/* Header Section */}
        <Row className="invoice-header">
          <Col md={6}>
            {/* Company Logo */}
            <Image src="/assets/density_logo_new_trans.png" alt="Company Logo" className="invoice-logo" />
          </Col>
          <Col md={6} className="text-end">
            <h1 className="invoice-title">INVOICE</h1>
            <h5 className="invoice-number">Invoice #: {invoice.DocNum}</h5>
            <p>Date: {formatDate(invoice.DocDate)}</p>
          </Col>
        </Row>

        {/* Sender and Receiver Information */}
        <Row className="invoice-addresses mt-4">
          <Col md={6}>
            <h5>From:</h5>
            <p>
              <strong>Your Company Name</strong><br />
              1234 Street Address<br />
              City, State, ZIP Code<br />
              Phone: (123) 456-7890<br />
              Email: info@yourcompany.com
            </p>
          </Col>
          <Col md={6}>
            <h5>Bill To:</h5>
            <p>
              <strong>{invoice.CardName}</strong><br />
              {invoice.BillToAddress || 'N/A'}<br />
              Contact: {invoice.ContactPerson || 'N/A'}<br />
              Phone: {invoice.Phone || 'N/A'}<br />
              Email: {invoice.Email || 'N/A'}
            </p>
          </Col>
        </Row>

        {/* Invoice Details */}
        <Row className="invoice-details mt-4">
          <Col md={6}>
            <p><strong>Invoice Date:</strong> {formatDate(invoice.DocDate)}</p>
            <p><strong>Due Date:</strong> {formatDate(invoice.DocDueDate)}</p>
          </Col>
          <Col md={6}>
            <p><strong>Payment Terms:</strong> {invoice.PaymentTerms || 'N/A'}</p>
            <p><strong>Sales Employee:</strong> {invoice.SalesEmployee}</p>
          </Col>
        </Row>

        {/* Line Items Table */}
        <Table striped bordered className="invoice-table mt-4">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Discount (%)</th>
              <th>Tax (%)</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.LineItems.map((item, index) => (
              <tr key={index}>
                <td>{item.LineNum + 1}</td>
                <td>{item.Description}</td>
                <td>{item.Quantity}</td>
                <td>{formatCurrency(item.Price, invoice.DocCur)}</td>
                <td>{item.DiscountPercent || 0}%</td>
                <td>{item.TaxPercent || 0}%</td>
                <td>{formatCurrency(item.LineTotal, invoice.DocCur)}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* Totals Section */}
        <Row className="invoice-totals mt-4">
          <Col md={{ span: 4, offset: 8 }}>
            <Table borderless className="text-end">
              <tbody>
                <tr>
                  <td><strong>Subtotal:</strong></td>
                  <td>{formatCurrency(subTotal, invoice.DocCur)}</td>
                </tr>
                <tr>
                  <td><strong>Discount:</strong></td>
                  <td>- {formatCurrency(discountTotal, invoice.DocCur)}</td>
                </tr>
                <tr>
                  <td><strong>Tax:</strong></td>
                  <td>{formatCurrency(taxTotal, invoice.DocCur)}</td>
                </tr>
                <tr>
                  <td><strong>Shipping:</strong></td>
                  <td>{formatCurrency(shippingFee, invoice.DocCur)}</td>
                </tr>
                <tr className="total-row">
                  <td><strong>Total:</strong></td>
                  <td>{formatCurrency(totalAmount, invoice.DocCur)}</td>
                </tr>
              </tbody>
            </Table>
          </Col>
        </Row>

        {/* Comments */}
        {invoice.Comments && (
          <Row className="invoice-comments mt-4">
            <Col>
              <h5>Comments:</h5>
              <p>{invoice.Comments}</p>
            </Col>
          </Row>
        )}

        {/* Footer */}
        <Row className="invoice-footer mt-5">
          <Col className="text-center">
            <p>Thank you for your business!</p>
            <p>
              If you have any questions about this invoice, please contact<br />
              {invoice.SalesEmployee}, Phone: (123) 456-7890, Email: sales@yourcompany.com
            </p>
          </Col>
        </Row>

        <Button variant="primary" onClick={handlePrint}>
          Print Invoice
        </Button>
      </Container>
    </div>
  );
};

export default InvoiceDetails;
