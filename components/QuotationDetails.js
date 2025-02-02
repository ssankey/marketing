// components/QuotationDetails.js

import React from 'react';
import { useRouter } from 'next/router';
import { Container, Row, Col, Card, Table, Button } from 'react-bootstrap';
import { formatCurrency } from 'utils/formatCurrency';
import { formatDate } from 'utils/formatDate';

const QuotationDetails = ({ quotation }) => {
  const router = useRouter();

  // Handle loading state
  if (router.isFallback) {
    return (
      <Container className="d-flex justify-content-center mt-5">
        <div>Loading...</div>
      </Container>
    );
  }

  if (!quotation) {
    return (
      <Container className="mt-5">
        <div className="alert alert-warning">Quotation not found</div>
      </Container>
    );
  }

  // Group products by Item Group or any relevant grouping
  const groupedProducts = quotation.LineItems.reduce((acc, product) => {
    const groupKey = product.ItemGroup || 'Others';
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(product);
    return acc;
  }, {});

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <h2 className="mb-0">Quotation Details #{quotation.DocNum}</h2>
        </Card.Header>
        <Card.Body>
          {/* Quotation Information */}
          <Row className="mb-4">
            <Col md={6}>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">Client Code:</Col>
                <Col sm={7}>{quotation.CardCode}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">Client Name:</Col>
                <Col sm={7}>{quotation.CardName}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">Contact Person:</Col>
                <Col sm={7}>{quotation.ContactPerson || 'N/A'}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">Phone:</Col>
                <Col sm={7}>{quotation.Phone || 'N/A'}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">Email:</Col>
                <Col sm={7}>{quotation.Email || 'N/A'}</Col>
              </Row>
            </Col>
            <Col md={6}>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">Quotation Date:</Col>
                <Col sm={7}>{formatDate(quotation.DocDate)}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">Valid Until:</Col>
                <Col sm={7}>{formatDate(quotation.DocDueDate)}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">Status:</Col>
                <Col sm={7}>{quotation.DocStatusDisplay}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={5} className="fw-bold">Sales Employee:</Col>
                <Col sm={7}>{quotation.SalesEmployee}</Col>
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
                    <strong>Subtotal:</strong> {formatCurrency(quotation.Subtotal)} {quotation.DocCur}
                  </p>
                  <p>
                    <strong>Tax Total:</strong> {formatCurrency(quotation.TaxTotal)} {quotation.DocCur}
                  </p>
                </Col>
                <Col md={4}>
                  <p>
                    <strong>Discount Total:</strong> {formatCurrency(quotation.DiscountTotal)} {quotation.DocCur}
                  </p>
                  <p>
                    <strong>Shipping Fee:</strong> {formatCurrency(quotation.ShippingFee)} {quotation.DocCur}
                  </p>
                </Col>
                <Col md={4}>
                  <p>
                    <strong>Total Amount:</strong> {formatCurrency(quotation.DocTotal)} {quotation.DocCur}
                  </p>
                  <p>
                    <strong>Payment Terms:</strong> {quotation.PaymentTerms || 'N/A'}
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Comments */}
          {quotation.Comments && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Comments</h5>
              </Card.Header>
              <Card.Body>
                <p>{quotation.Comments}</p>
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
                      <th className="text-nowrap">Quantity</th>
                      <th className="text-nowrap">Unit</th>
                      <th className="text-nowrap">Price</th>
                      <th className="text-nowrap">Discount (%)</th>
                      <th className="text-nowrap">Tax (%)</th>
                      <th className="text-nowrap">Line Total</th>
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
                          <td className="text-nowrap">{product.Description}</td>
                          <td className="text-nowrap">{product.Quantity}</td>
                          <td className="text-nowrap">{product.UnitMsr}</td>
                          <td className="text-nowrap">
                            {formatCurrency(product.Price)} {product.Currency || quotation.DocCur}
                          </td>
                          <td className="text-nowrap">{product.DiscountPercent || 0}%</td>
                          <td className="text-nowrap">{product.TaxPercent || 0}%</td>
                          <td className="text-nowrap">
                            {formatCurrency(lineTotal)} {product.Currency || quotation.DocCur}
                          </td>
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
              Back to Quotations
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default QuotationDetails;
