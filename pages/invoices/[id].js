// // pages/invoices/[id].js

// import { useRouter } from 'next/router';
// import { Container, Row, Col, Card, Table, Spinner } from 'react-bootstrap';
// import { formatCurrency } from 'utils/formatCurrency';
// import { formatDate } from 'utils/formatDate';
// import { queryDatabase } from 'lib/db'; // Adjust the path based on your project structure
// import { useAuth } from "../../utils/useAuth";
// import sql from 'mssql';
// export default function InvoiceDetails({ invoices }) {
//   useAuth(); // Protect the invoice page
//   const router = useRouter();
//   const { id } = router.query;

//   if (router.isFallback) {
//     return (
//       <Container className="d-flex justify-content-center mt-5">
//         <Spinner animation="border" role="status">
//           <span className="visually-hidden">Loading...</span>
//         </Spinner>
//       </Container>
//     );
//   }

//   if (!invoices || invoices.length === 0) {
//     return (
//       <Container className="mt-5">
//         <div className="alert alert-warning">Invoice not found</div>
//       </Container>
//     );
//   }

//   const invoice = invoices[0];

//   // Group products by DocEntry
//   const groupedProducts = invoices.reduce((acc, product) => {
//     if (!acc[product.DocEntry]) {
//       acc[product.DocEntry] = [];
//     }
//     acc[product.DocEntry].push(product);
//     return acc;
//   }, {});

//   return (
//     <Container className="mt-4">
//       <Card>
//         <Card.Header>
//           <h2 className="mb-0">Invoice Details #{id}</h2>
//         </Card.Header>
//         <Card.Body>
//           <Row className="mb-4">
//             <Col md={6}>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Client Code:
//                 </Col>
//                 <Col sm={8}>{invoice.CardCode}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Bill To:
//                 </Col>
//                 <Col sm={8}>
//                   <div>{invoice.BillToCode}</div>
//                   <div>{invoice.BillToDesc}</div>
//                 </Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Doc Date:
//                 </Col>
//                 <Col sm={8}>{formatDate(invoice.DocDate)}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Due Date:
//                 </Col>
//                 <Col sm={8}>{formatDate(invoice.DocDueDate)}</Col>
//               </Row>
//             </Col>
//             <Col md={6}>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Currency:
//                 </Col>
//                 <Col sm={8}>{invoice.DocCur}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Total Amount:
//                 </Col>
//                 <Col sm={8}>
//                   {formatCurrency(invoice.DocTotal)} {invoice.DocCur}
//                 </Col>
//               </Row>
//             </Col>
//           </Row>

//           {/* Document Groups */}
//           <h4 className="mt-4 mb-3">Products</h4>
//           {Object.entries(groupedProducts).map(([docEntry, products]) => (
//             <Card key={docEntry} className="mb-3">
//               <Card.Body>
//                 <Table responsive striped hover>
//                   <thead>
//                     <tr>
//                       <th>Item Description</th>
//                       <th>Item Code</th>
//                       <th>Quantity</th>
//                       <th>Price</th>
//                       <th>Line Total</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {products.map((product, index) => {
//                       const lineTotal = product.LineTotal;
//                       return (
//                         <tr key={index}>
//                           <td>{product.Dscription}</td>
//                           <td>{product.ItemCode}</td>
//                           <td>{product.Quantity}</td>
//                           <td>
//                             {formatCurrency(product.Price)}{" "}
//                             {product.Currency || "N/A"}
//                           </td>
//                           <td>
//                             {formatCurrency(lineTotal)}{" "}
//                             {product.Currency || "N/A"}
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </Table>
//               </Card.Body>
//             </Card>
//           ))}

//           {/* Back Button */}
//           <div className="mt-3">
//             <button className="btn btn-secondary" onClick={() => router.back()}>
//               Back to Invoices
//             </button>
//           </div>
//         </Card.Body>
//       </Card>
//     </Container>
//   );
// }

// export async function getServerSideProps(context) {
//   useAuth(); // Protect the order page
//   const { id } = context.params;

//   // Ensure the id is a valid integer to prevent SQL injection
//   const invoiceId = parseInt(id, 10);

//   if (isNaN(invoiceId)) {
//     return {
//       notFound: true,
//     };
//   }

//   try {
//     const query = `
//             SELECT t0.*, t1.*
//             FROM INV1 t0 
//             INNER JOIN OINV t1 ON t0.DocEntry = t1.DocEntry
//             WHERE t1.DocNum = @DocNum;
//         `;

//     const params = [
//       {
//         name: "DocNum",
//         type: sql.Int,
//         value: invoiceId,
//       },
//     ];

//     const data = await queryDatabase(query, params);

//     if (!data || data.length === 0) {
//       return {
//         notFound: true,
//       };
//     }

//     // Map over the data and convert date strings to ISO strings
//     const safeDate = (dateString) => {
//       const date = new Date(dateString);
//       return isNaN(date.getTime()) ? null : date.toISOString(); // Check for valid date
//     };

//     const invoices = data.map((invoice) => {
//       return {
//         ...invoice,
//         CreateDate: safeDate(invoice.CreateDate), // Convert CreateDate to ISO string
//         TaxDate: safeDate(invoice.TaxDate), // Convert CreateDate to ISO string
//         AssetDate: safeDate(invoice.AssetDate), // Convert CreateDate to ISO string
//         ShipDate: safeDate(invoice.ShipDate), // Convert ShipDate to ISO string
//         DocDate: safeDate(invoice.DocDate), // Convert DocDate to ISO string
//         DocDueDate: safeDate(invoice.DocDueDate), // Convert DocDueDate to ISO string
//         ActDelDate: safeDate(invoice.ActDelDate), // Convert ActDelDate to ISO string
//         UpdateDate: safeDate(invoice.UpdateDate), // Convert UpdateDate to ISO string
//       };
//     });

//     return {
//       props: {
//         invoices: Array.isArray(invoices) ? invoices : [invoices],
//       },
//     };
//   } catch (error) {
//     console.error("Error fetching invoice:", error);
//     return {
//       props: {
//         invoices: [],
//       },
//     };
//   }
// }

  
  
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Spinner } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import { queryDatabase } from "lib/db"; // Adjust the path based on your project structure
import { useAuth } from "../../utils/useAuth";
import sql from "mssql";

export default function InvoiceDetails({ invoices }) {
  const isAuthenticated = useAuth(); // Protect the invoice page
  const router = useRouter();
  const { id } = router.query;

  // Display a loading spinner while the router is in fallback mode
  if (router.isFallback) {
    return (
      <Container className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  // Show a warning message if the invoice is not found
  if (!invoices || invoices.length === 0) {
    return (
      <Container className="mt-5">
        <div className="alert alert-warning">Invoice not found</div>
      </Container>
    );
  }

  // Display the invoice details, grouping products by `DocEntry`
  const invoice = invoices[0];
  const groupedProducts = invoices.reduce((acc, product) => {
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
          <h2 className="mb-0">Invoice Details #{id}</h2>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={6}>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Client Code:
                </Col>
                <Col sm={8}>{invoice.CardCode}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Bill To:
                </Col>
                <Col sm={8}>
                  <div>{invoice.BillToCode}</div>
                  <div>{invoice.BillToDesc}</div>
                </Col>
              </Row>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Doc Date:
                </Col>
                <Col sm={8}>{formatDate(invoice.DocDate)}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Due Date:
                </Col>
                <Col sm={8}>{formatDate(invoice.DocDueDate)}</Col>
              </Row>
            </Col>
            <Col md={6}>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Currency:
                </Col>
                <Col sm={8}>{invoice.DocCur}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Total Amount:
                </Col>
                <Col sm={8}>
                  {formatCurrency(invoice.DocTotal)} {invoice.DocCur}
                </Col>
              </Row>
            </Col>
          </Row>

          {/* Products Section */}
          <h4 className="mt-4 mb-3">Products</h4>
          {Object.entries(groupedProducts).map(([docEntry, products]) => (
            <Card key={docEntry} className="mb-3">
              <Card.Body>
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Item Description</th>
                      <th>Item Code</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => (
                      <tr key={index}>
                        <td>{product.Dscription}</td>
                        <td>{product.ItemCode}</td>
                        <td>{product.Quantity}</td>
                        <td>
                          {formatCurrency(product.Price)}{" "}
                          {product.Currency || "N/A"}
                        </td>
                        <td>
                          {formatCurrency(product.LineTotal)}{" "}
                          {product.Currency || "N/A"}
                        </td>
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
              Back to Invoices
            </button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

// Server-side authentication and data fetching
export async function getServerSideProps(context) {
  const token = context.req.cookies.token; // Ensure you adjust to your token storage method

  if (!token) {
    // Redirect to login if no token is found
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const { id } = context.params;
  const invoiceId = parseInt(id, 10);

  if (isNaN(invoiceId)) {
    return { notFound: true };
  }

  try {
    const query = `
      SELECT t0.*, t1.*
      FROM INV1 t0 
      INNER JOIN OINV t1 ON t0.DocEntry = t1.DocEntry
      WHERE t1.DocNum = @DocNum;
    `;

    const params = [
      {
        name: "DocNum",
        type: sql.Int,
        value: invoiceId,
      },
    ];

    const data = await queryDatabase(query, params);

    if (!data || data.length === 0) {
      return { notFound: true };
    }

    // Ensure dates are correctly formatted to ISO strings
    const safeDate = (dateString) => {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date.toISOString();
    };

    const invoices = data.map((invoice) => ({
      ...invoice,
      CreateDate: safeDate(invoice.CreateDate),
      TaxDate: safeDate(invoice.TaxDate),
      AssetDate: safeDate(invoice.AssetDate),
      ShipDate: safeDate(invoice.ShipDate),
      DocDate: safeDate(invoice.DocDate),
      DocDueDate: safeDate(invoice.DocDueDate),
      ActDelDate: safeDate(invoice.ActDelDate),
      UpdateDate: safeDate(invoice.UpdateDate),
    }));

    return {
      props: {
        invoices: Array.isArray(invoices) ? invoices : [invoices],
      },
    };
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return {
      props: {
        invoices: [],
      },
    };
  }
}
