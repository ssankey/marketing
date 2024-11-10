// import { useRouter } from "next/router";
// import { Container, Row, Col, Card, Spinner, Table } from "react-bootstrap";
// import { formatCurrency } from "utils/formatCurrency";
// import { useAuth } from "../../utils/useAuth";

// // Utility function to format date
// function formatDate(dateString) {
//   if (!dateString) return 'N/A';
//   const date = new Date(dateString);
//   return date.toLocaleDateString();
// }

// export default function CustomerDetails({ customer }) {
//   //   useAuth(); // Protect the  customer page

//   useAuth(); // Protect the order page

//   const router = useRouter();

//   if (router.isFallback) {
//     return (
//       <Container className="d-flex justify-content-center mt-5">
//         <Spinner animation="border" role="status">
//           <span className="visually-hidden">Loading...</span>
//         </Spinner>
//       </Container>
//     );
//   }

//   if (!customer) {
//     return (
//       <Container className="mt-5">
//         <div className="alert alert-warning">Customer not found</div>
//       </Container>
//     );
//   }

//   return (
//     <Container className="mt-4">
//       <Card>
//         <Card.Header>
//           <h2 className="mb-0">Customer Details - {customer.CustomerName}</h2>
//         </Card.Header>
//         <Card.Body>
//           {/* Customer Information */}
//           <Row className="mb-4">
//             <Col md={6}>
//               {/* Basic Details */}
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Customer Code:
//                 </Col>
//                 <Col sm={8}>{customer.CustomerCode}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Alias Name:
//                 </Col>
//                 <Col sm={8}>{customer.AliasName || "N/A"}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Contact Person:
//                 </Col>
//                 <Col sm={8}>{customer.ContactPerson || "N/A"}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Phone:
//                 </Col>
//                 <Col sm={8}>{customer.Phone || "N/A"}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Secondary Phone:
//                 </Col>
//                 <Col sm={8}>{customer.SecondaryPhone || "N/A"}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Fax:
//                 </Col>
//                 <Col sm={8}>{customer.Fax || "N/A"}</Col>
//               </Row>
//             </Col>
//             <Col md={6}>
//               {/* Address Details */}
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Billing Address:
//                 </Col>
//                 <Col sm={8}>{customer.BillingAddress || "N/A"}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Mailing Address:
//                 </Col>
//                 <Col sm={8}>{customer.MailingAddress || "N/A"}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   City:
//                 </Col>
//                 <Col sm={8}>{customer.City || "N/A"}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Country:
//                 </Col>
//                 <Col sm={8}>{customer.Country || "N/A"}</Col>
//               </Row>
//             </Col>
//           </Row>

//           {/* Contact Information */}
//           <h4>Contact Information</h4>
//           <Row className="mb-4">
//             <Col md={6}>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Email:
//                 </Col>
//                 <Col sm={8}>{customer.Email || "N/A"}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Website:
//                 </Col>
//                 <Col sm={8}>
//                   {customer.Website ? (
//                     <a
//                       href={customer.Website}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                     >
//                       {customer.Website}
//                     </a>
//                   ) : (
//                     "N/A"
//                   )}
//                 </Col>
//               </Row>
//             </Col>
//             <Col md={6}>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Language:
//                 </Col>
//                 <Col sm={8}>{customer.LanguageCode || "N/A"}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Industry:
//                 </Col>
//                 <Col sm={8}>{customer.Industry || "N/A"}</Col>
//               </Row>
//             </Col>
//           </Row>

//           {/* Financial Information */}
//           <h4>Financial Information</h4>
//           <Row className="mb-4">
//             <Col md={6}>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Balance:
//                 </Col>
//                 <Col sm={8}>
//                   {formatCurrency(customer.Balance, customer.Currency)}
//                 </Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Credit Line:
//                 </Col>
//                 <Col sm={8}>
//                   {formatCurrency(customer.CreditLine, customer.Currency)}
//                 </Col>
//               </Row>
//             </Col>
//             <Col md={6}>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Currency:
//                 </Col>
//                 <Col sm={8}>{customer.Currency}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Valid Until:
//                 </Col>
//                 <Col sm={8}>{formatDate(customer.ValidUntil)}</Col>
//               </Row>
//             </Col>
//           </Row>

//           {/* Additional Information */}
//           <h4>Additional Information</h4>
//           <Row className="mb-4">
//             <Col md={6}>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Sales Employee:
//                 </Col>
//                 <Col sm={8}>{customer.SalesEmployeeName || "N/A"}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Territory:
//                 </Col>
//                 <Col sm={8}>{customer.Territory || "N/A"}</Col>
//               </Row>
//             </Col>
//             <Col md={6}>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Active:
//                 </Col>
//                 <Col sm={8}>{customer.IsActive === "Y" ? "Yes" : "No"}</Col>
//               </Row>
//             </Col>
//           </Row>

//           {/* Notes */}
//           {customer.Notes && (
//             <>
//               <h4>Notes</h4>
//               <p>{customer.Notes}</p>
//             </>
//           )}

//           {/* Addresses Section */}
//           <h4>Addresses</h4>
//           {customer.Addresses && customer.Addresses.length > 0 ? (
//             <Table striped bordered hover>
//               <thead>
//                 <tr>
//                   <th>Type</th>
//                   <th>Address Name</th>
//                   <th>Street</th>
//                   <th>Block</th>
//                   <th>City</th>
//                   <th>State</th>
//                   <th>Zip Code</th>
//                   <th>Country</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {customer.Addresses.map((address, index) => (
//                   <tr key={index}>
//                     <td>
//                       {address.AddressType === "B" ? "Billing" : "Shipping"}
//                     </td>
//                     <td>{address.AddressName}</td>
//                     <td>{address.Street}</td>
//                     <td>{address.Block}</td>
//                     <td>{address.City}</td>
//                     <td>{address.State}</td>
//                     <td>{address.ZipCode}</td>
//                     <td>{address.Country}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </Table>
//           ) : (
//             <p>No addresses available.</p>
//           )}

//           {/* Back Button */}
//           <div className="mt-3">
//             <button className="btn btn-secondary" onClick={() => router.back()}>
//               Back to Customers
//             </button>
//           </div>
//         </Card.Body>
//       </Card>
//     </Container>
//   );
// }

// export async function getServerSideProps(context) {
//   const { id } = context.params;

//   // Build the API URL dynamically
//   const protocol = context.req.headers["x-forwarded-proto"] || "http";
//   const host = context.req.headers.host || "localhost:3000";
//   const url = `${protocol}://${host}/api/customers/${id}`;

//   try {
//     const res = await fetch(url);

//     if (!res.ok) {
//       throw new Error(`Failed to fetch data, received status ${res.status}`);
//     }

//     const data = await res.json();

//     return {
//       props: {
//         customer: Array.isArray(data) ? data[0] : data,
//       },
//     };
//   } catch (error) {
//     console.error("Error fetching customer:", error);
//     return {
//       props: {
//         customer: null,
//       },
//     };
//   }
// }


// import { useRouter } from "next/router";
// import { useEffect, useState } from "react";
// import { Container, Row, Col, Card, Spinner, Table } from "react-bootstrap";
// import { formatCurrency } from "utils/formatCurrency";
// import { useAuth } from "../../utils/useAuth";

// // Utility function to format date
// function formatDate(dateString) {
//   if (!dateString) return "N/A";
//   const date = new Date(dateString);
//   return date.toLocaleDateString();
// }

// export default function CustomerDetails({ customer }) {
//   const [isClient, setIsClient] = useState(false);

//   // Ensure the hook only runs client-side
//   useEffect(() => {
//     setIsClient(true);
//   }, []);

//   // Protect the page using the `useAuth` hook, client-side only
//   const isAuthenticated = isClient ? useAuth() : false;

//   // Conditionally initialize `useRouter` for client side only
//   const router = isClient ? useRouter() : null;

//   // Handle fallback during page generation
//   if (router?.isFallback) {
//     return (
//       <Container className="d-flex justify-content-center mt-5">
//         <Spinner animation="border" role="status">
//           <span className="visually-hidden">Loading...</span>
//         </Spinner>
//       </Container>
//     );
//   }

//   if (!customer) {
//     return (
//       <Container className="mt-5">
//         <div className="alert alert-warning">Customer not found</div>
//       </Container>
//     );
//   }

//   if (!isAuthenticated) {
//     return null; // Return null to prevent rendering if not authenticated
//   }

//   return (
//     <Container className="mt-4">
//       <Card>
//         <Card.Header>
//           <h2 className="mb-0">Customer Details - {customer.CustomerName}</h2>
//         </Card.Header>
//         <Card.Body>
//           {/* Customer Information */}
//           <Row className="mb-4">
//             <Col md={6}>
//               {/* Basic Details */}
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Customer Code:
//                 </Col>
//                 <Col sm={8}>{customer.CustomerCode}</Col>
//               </Row>
//               {/* ... Additional customer detail rows ... */}
//             </Col>
//             <Col md={6}>
//               {/* Address Details */}
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Billing Address:
//                 </Col>
//                 <Col sm={8}>{customer.BillingAddress || "N/A"}</Col>
//               </Row>
//               {/* ... Additional address rows ... */}
//             </Col>
//           </Row>

//           {/* Addresses Section */}
//           <h4>Addresses</h4>
//           {customer.Addresses && customer.Addresses.length > 0 ? (
//             <Table striped bordered hover>
//               <thead>
//                 <tr>
//                   <th>Type</th>
//                   <th>Address Name</th>
//                   <th>Street</th>
//                   <th>Block</th>
//                   <th>City</th>
//                   <th>State</th>
//                   <th>Zip Code</th>
//                   <th>Country</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {customer.Addresses.map((address, index) => (
//                   <tr key={index}>
//                     <td>
//                       {address.AddressType === "B" ? "Billing" : "Shipping"}
//                     </td>
//                     <td>{address.AddressName}</td>
//                     <td>{address.Street}</td>
//                     <td>{address.Block}</td>
//                     <td>{address.City}</td>
//                     <td>{address.State}</td>
//                     <td>{address.ZipCode}</td>
//                     <td>{address.Country}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </Table>
//           ) : (
//             <p>No addresses available.</p>
//           )}

//           {/* Back Button */}
//           <div className="mt-3">
//             <button
//               className="btn btn-secondary"
//               onClick={() => router?.back()}
//             >
//               Back to Customers
//             </button>
//           </div>
//         </Card.Body>
//       </Card>
//     </Container>
//   );
// }

// export async function getServerSideProps(context) {
//   const { id } = context.params;

//   // Build the API URL dynamically
//   const protocol = context.req.headers["x-forwarded-proto"] || "http";
//   const host = context.req.headers.host || "localhost:3000";
//   const url = `${protocol}://${host}/api/customers/${id}`;

//   try {
//     const res = await fetch(url);

//     if (!res.ok) {
//       throw new Error(`Failed to fetch data, received status ${res.status}`);
//     }

//     const data = await res.json();

//     return {
//       props: {
//         customer: Array.isArray(data) ? data[0] : data,
//       },
//     };
//   } catch (error) {
//     console.error("Error fetching customer:", error);
//     return {
//       props: {
//         customer: null,
//       },
//     };
//   }
// }


import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Spinner, Table } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import { useAuth } from "../../utils/useAuth";

// Utility function to format date
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

export default function CustomerDetails({ customer }) {
  const [isClient, setIsClient] = useState(false);

  // Ensure the hook only runs client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Protect the page using the `useAuth` hook, client-side only
  const isAuthenticated = isClient ? useAuth() : false;

  // Conditionally initialize `useRouter` for client side only
  const router = isClient ? useRouter() : null;

  // Handle fallback during page generation
  if (router?.isFallback) {
    return (
      <Container className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (!customer) {
    return (
      <Container className="mt-5">
        <div className="alert alert-warning">Customer not found</div>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return null; // Return null to prevent rendering if not authenticated
  }

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <h2 className="mb-0">Customer Details - {customer.CustomerName}</h2>
        </Card.Header>
        <Card.Body>
          {/* Customer Information */}
          <Row className="mb-4">
            <Col md={6}>
              {/* Basic Details */}
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Customer Code:
                </Col>
                <Col sm={8}>{customer.CustomerCode}</Col>
              </Row>
              {/* ... Additional customer detail rows ... */}
            </Col>
            <Col md={6}>
              {/* Address Details */}
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Billing Address:
                </Col>
                <Col sm={8}>{customer.BillingAddress || "N/A"}</Col>
              </Row>
              {/* ... Additional address rows ... */}
            </Col>
          </Row>

          {/* Addresses Section */}
          <h4>Addresses</h4>
          {customer.Addresses && customer.Addresses.length > 0 ? (
            <Table striped bordered hover>
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
                    <td>{address.AddressName}</td>
                    <td>{address.Street}</td>
                    <td>{address.Block}</td>
                    <td>{address.City}</td>
                    <td>{address.State}</td>
                    <td>{address.ZipCode}</td>
                    <td>{address.Country}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p>No addresses available.</p>
          )}

          {/* Back Button */}
          <div className="mt-3">
            <button
              className="btn btn-secondary"
              onClick={() => router?.back()}
            >
              Back to Customers
            </button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

// Add server-side check for authentication
export async function getServerSideProps(context) {
  const { id } = context.params;

  // Check if the user is authenticated by looking for a token (in cookies, headers, etc.)
  const token = context.req.cookies.token; // Adjust this to where you store your auth token

  if (!token) {
    // Redirect to login page if no token is found
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // Build the API URL dynamically
  const protocol = context.req.headers["x-forwarded-proto"] || "http";
  const host = context.req.headers.host || "localhost:3000";
  const url = `${protocol}://${host}/api/customers/${id}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch data, received status ${res.status}`);
    }

    const data = await res.json();

    return {
      props: {
        customer: Array.isArray(data) ? data[0] : data,
      },
    };
  } catch (error) {
    console.error("Error fetching customer:", error);
    return {
      props: {
        customer: null,
      },
    };
  }
}
