


// import { useState } from "react";
// import { Card, Button, Form, Container, Row, Col } from "react-bootstrap";

// export default function ForgotPasswordPage() {
//   const [email, setEmail] = useState("");

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log("Forgot password form submitted (no action for now)");
//   };

//   return (
//     <Container
//       fluid
//       className="d-flex justify-content-center align-items-center min-vh-100 bg-light"
//     >
//       <Row className="w-100 justify-content-center">
//         <Col xs={12} sm={8} md={6} lg={4}>
//           <Card className="p-4 shadow-lg border-0 rounded-lg">
//             <Card.Body>
//               <h2 className="text-center mb-4">Forgot Password</h2>
//               <Form onSubmit={handleSubmit}>
//                 {/* Email Input */}
//                 <Form.Group controlId="formEmail" className="mb-4">
//                   <Form.Control
//                     type="email"
//                     placeholder="Enter your email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     className="form-control-lg"
//                   />
//                 </Form.Group>

//                 {/* Submit Button */}
//                 <Button
//                   type="submit"
//                   variant="primary"
//                   size="lg"
//                   className="w-100 mb-3"
//                 >
//                   Send Reset Link
//                 </Button>
//               </Form>

//               <div className="text-center">
//                 <p>
//                   Remember your password?{" "}
//                   <a
//                     href="/login"
//                     className="text-decoration-none text-primary"
//                   >
//                     Login
//                   </a>
//                 </p>
//               </div>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>
//     </Container>
//   );
// }


import { useState } from "react";
import {
  Card,
  Button,
  Form,
  Container,
  Row,
  Col,
  Alert,
} from "react-bootstrap";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Add your forgot password logic here
      console.log("Forgot password form submitted");
    } catch (err) {
      setError("An error occurred while sending reset link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container
      fluid
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={8} md={6} lg={4}>
          <div className="text-center mb-4">
            <h1
              className="text-white fw-bold mb-2"
              style={{ fontSize: "2.5rem" }}
            >
              Forgot Password
            </h1>
            <p className="text-white-50">Enter your email to reset password</p>
          </div>

          <Card
            className="border-0"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: "15px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
            }}
          >
            <Card.Body className="p-4 p-md-5">
              <Form onSubmit={handleSubmit}>
                {error && (
                  <Alert
                    variant="danger"
                    className="mb-4 text-center"
                    style={{
                      borderRadius: "10px",
                      border: "none",
                      backgroundColor: "rgba(220, 53, 69, 0.1)",
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <Form.Group controlId="formEmail" className="mb-4">
                  <Form.Label className="text-muted small">EMAIL</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control-lg border-0 bg-light"
                    style={{
                      borderRadius: "10px",
                      padding: "12px 20px",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    }}
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-100 mb-4 text-uppercase fw-bold"
                  style={{
                    borderRadius: "10px",
                    padding: "12px",
                    background: "linear-gradient(to right, #667eea, #764ba2)",
                    border: "none",
                    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div
                      className="spinner-border spinner-border-sm text-light"
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <div className="text-center">
                  <p className="mb-0">
                    Remember your password?{" "}
                    <a
                      href="/login"
                      className="text-decoration-none fw-bold"
                      style={{ color: "#667eea" }}
                    >
                      Login
                    </a>
                  </p>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

