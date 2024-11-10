// import { useRouter } from "next/router";
// import { Container, Row, Col, Card, Spinner } from "react-bootstrap";
// import { getProductDetail } from "lib/models/products";
// import { useAuth } from "../../utils/useAuth";

// // Utility function to format dates as 'dd-MMM-yyyy' (e.g., 23-Oct-2024)
// function formatDate(dateString) {
//   useAuth(); // Protect the product page

//   if (!dateString) return "N/A";
//   const date = new Date(dateString);
//   const options = { day: "2-digit", month: "short", year: "numeric" };
//   return date.toLocaleDateString("en-GB", options); // Ensures 'dd-MMM-yyyy' format
// }

// export default function ProductDetails({ product }) {
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

//   if (!product) {
//     return (
//       <Container className="mt-5">
//         <div className="alert alert-warning">Product not found</div>
//       </Container>
//     );
//   }

//   // Display product details
//   return (
//     <Container className="mt-4">
//       <Card>
//         <Card.Header>
//           <h2 className="mb-0">Product Details - {product.ItemName}</h2>
//         </Card.Header>
//         <Card.Body>
//           <Row className="mb-4">
//             <Col md={6}>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Item Code:
//                 </Col>
//                 <Col sm={8}>{product.ItemCode}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Item Name:
//                 </Col>
//                 <Col sm={8}>{product.ItemName}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Item Type:
//                 </Col>
//                 <Col sm={8}>{product.ItemType}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   CAS No:
//                 </Col>
//                 <Col sm={8}>{product.U_CasNo || "N/A"}</Col>
//               </Row>
//             </Col>
//             <Col md={6}>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Valid For:
//                 </Col>
//                 <Col sm={8}>{product.validFor}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Created Date:
//                 </Col>
//                 <Col sm={8}>{formatDate(product.CreateDate)}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Updated Date:
//                 </Col>
//                 <Col sm={8}>{formatDate(product.UpdateDate)}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col sm={4} className="fw-bold">
//                   Molecular Weight:
//                 </Col>
//                 <Col sm={8}>{product.U_MolucularWeight || "N/A"}</Col>
//               </Row>
//             </Col>
//           </Row>

//           <Row className="mb-4">
//             <Col>
//               <h4>Additional Information</h4>
//               <p><strong>IUPAC Name:</strong> {product.U_IUPACName || "N/A"}</p>
//               <p><strong>Synonyms:</strong> {product.U_Synonyms || "N/A"}</p>
//               <p><strong>Molecular Formula:</strong> {product.U_MolucularFormula || "N/A"}</p>
//               <p><strong>Applications:</strong> {product.U_Applications || "N/A"}</p>
//             </Col>
//           </Row>

//           {/* Back Button */}
//           <div className="mt-3">
//             <button className="btn btn-secondary" onClick={() => router.back()}>
//               Back to Products
//             </button>
//           </div>
//         </Card.Body>
//       </Card>
//     </Container>
//   );
// }


// export async function getServerSideProps(context) {
//   const { id } = context.params;

//   try {
//     const product = await getProductDetail(id);

//     if (!product) {
//       // If product is undefined, return product: null
//       return {
//         props: {
//           product: null,
//         },
//       };
//     }

//     return {
//       props: {
//         product, // Pass the product object directly
//       },
//     };
//   } catch (error) {
//     console.error("Error fetching Product:", error);
//     return {
//       props: {
//         product: null, // Pass null on error
//       },
//     };
//   }
// }



import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner } from "react-bootstrap";
import { getProductDetail } from "lib/models/products";
import { useAuth } from "../../utils/useAuth";

// Utility function to format dates as 'dd-MMM-yyyy' (e.g., 23-Oct-2024)
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const options = { day: "2-digit", month: "short", year: "numeric" };
  return date.toLocaleDateString("en-GB", options);
}

export default function ProductDetails({ product }) {
  const isAuthenticated = useAuth(); // Client-side authentication check
  const router = useRouter();

  if (router.isFallback) {
    return (
      <Container className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

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

  // Display product details
  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <h2 className="mb-0">Product Details - {product.ItemName}</h2>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={6}>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Item Code:
                </Col>
                <Col sm={8}>{product.ItemCode}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Item Name:
                </Col>
                <Col sm={8}>{product.ItemName}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Item Type:
                </Col>
                <Col sm={8}>{product.ItemType}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  CAS No:
                </Col>
                <Col sm={8}>{product.U_CasNo || "N/A"}</Col>
              </Row>
            </Col>
            <Col md={6}>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Valid For:
                </Col>
                <Col sm={8}>{product.validFor}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Created Date:
                </Col>
                <Col sm={8}>{formatDate(product.CreateDate)}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Updated Date:
                </Col>
                <Col sm={8}>{formatDate(product.UpdateDate)}</Col>
              </Row>
              <Row className="mb-2">
                <Col sm={4} className="fw-bold">
                  Molecular Weight:
                </Col>
                <Col sm={8}>{product.U_MolucularWeight || "N/A"}</Col>
              </Row>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col>
              <h4>Additional Information</h4>
              <p>
                <strong>IUPAC Name:</strong> {product.U_IUPACName || "N/A"}
              </p>
              <p>
                <strong>Synonyms:</strong> {product.U_Synonyms || "N/A"}
              </p>
              <p>
                <strong>Molecular Formula:</strong>{" "}
                {product.U_MolucularFormula || "N/A"}
              </p>
              <p>
                <strong>Applications:</strong> {product.U_Applications || "N/A"}
              </p>
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
  const token = context.req.cookies.token; // Check for token in cookies

  // Redirect to login if no token is found
  if (!token) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
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

    return {
      props: {
        product,
      },
    };
  } catch (error) {
    console.error("Error fetching Product:", error);
    return {
      props: {
        product: null,
      },
    };
  }
}

