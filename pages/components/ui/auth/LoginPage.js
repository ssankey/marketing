


// import { useState } from "react";
// import { Card, Button, Form, Container, Row, Col } from "react-bootstrap";
// import { loginUser } from "../../../../utils/auth";

// export default function LoginPage() {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   const handleLogin = async () => {
//     const result = await loginUser(username, password);
//     if (result.success) {
//       window.location.href = "/dashboard"; // Redirect to home page
//     } else {
//       setError("Invalid username or password");
//     }
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
//               <h2 className="text-center mb-4">Login</h2>
//               <Form>
//                 {/* Username Input */}
//                 <Form.Group controlId="formUsername" className="mb-3">
//                   <Form.Control
//                     type="text"
//                     placeholder="Username"
//                     value={username}
//                     onChange={(e) => setUsername(e.target.value)}
//                     className="form-control-lg"
//                   />
//                 </Form.Group>

//                 {/* Password Input */}
//                 <Form.Group controlId="formPassword" className="mb-4">
//                   <Form.Control
//                     type="password"
//                     placeholder="Password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     className="form-control-lg"
//                   />
//                 </Form.Group>

//                 {/* Error Message */}
//                 {error && (
//                   <div className="alert alert-danger text-center">{error}</div>
//                 )}

//                 {/* Login Button */}
//                 <Button
//                   onClick={handleLogin}
//                   variant="primary"
//                   size="lg"
//                   className="w-100 mb-3"
//                 >
//                   Login
//                 </Button>
//               </Form>

//               <div className="text-center">
//                 <p>
//                   <a
//                     href="/signup"
//                     className="text-decoration-none text-primary"
//                   >
//                     Sign Up
//                   </a>{" "}
//                   |{" "}
//                   <a
//                     href="/forgot-password"
//                     className="text-decoration-none text-primary"
//                   >
//                     Forgot Password?
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
import { loginUser } from "../../../../utils/auth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const result = await loginUser(username, password);
      if (result.success) {
        window.location.href = "/dashboard";
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("An error occurred during login");
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
              Welcome Back
            </h1>
            <p className="text-white-50">Please login to your account</p>
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
              <Form>
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

                <Form.Group controlId="formUsername" className="mb-4">
                  <Form.Label className="text-muted small">USERNAME</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-control-lg border-0 bg-light"
                    style={{
                      borderRadius: "10px",
                      padding: "12px 20px",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    }}
                  />
                </Form.Group>

                <Form.Group controlId="formPassword" className="mb-4">
                  <Form.Label className="text-muted small">PASSWORD</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control-lg border-0 bg-light"
                    style={{
                      borderRadius: "10px",
                      padding: "12px 20px",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    }}
                  />
                </Form.Group>

                <Button
                  onClick={handleLogin}
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
                    "Sign In"
                  )}
                </Button>

                <div className="text-center">
                  <Row className="justify-content-center align-items-center">
                    <Col>
                      <a
                        href="/signup"
                        className="text-decoration-none fw-bold"
                        style={{ color: "#667eea" }}
                      >
                        Create Account
                      </a>
                    </Col>
                    <Col>
                      <div className="vr mx-3" style={{ height: "20px" }}></div>
                    </Col>
                    <Col>
                      <a
                        href="/forgot-password"
                        className="text-decoration-none fw-bold"
                        style={{ color: "#667eea" }}
                      >
                        Forgot Password?
                      </a>
                    </Col>
                  </Row>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}



// pages/login.js
// import { useState } from "react";
// import { Card, Button, Form, Container, Row, Col, Alert } from "react-bootstrap";
// import { loginUser } from "../../../../utils/auth";

// export default function LoginPage() {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   const handleLogin = async () => {
//     try {
//       setIsLoading(true);
//       const result = await loginUser(username, password);
//       if (result.success) {
//         // Redirect to dashboard on successful login
//         window.location.href = "/dashboard";
//       } else {
//         // Show an error message if login fails
//         setError("Invalid username or password");
//       }
//     } catch (err) {
//       setError("An error occurred during login");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center" style={{ padding: "20px" }}>
//       <Row className="w-100 justify-content-center">
//         <Col xs={12} sm={8} md={6} lg={4}>
//           <Card className="border-0" style={{ borderRadius: "15px", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)" }}>
//             <Card.Body>
//               <Form>
//                 {error && <Alert variant="danger" className="text-center">{error}</Alert>}
//                 <Form.Group controlId="formUsername">
//                   <Form.Label>Username</Form.Label>
//                   <Form.Control
//                     type="text"
//                     placeholder="Enter username"
//                     value={username}
//                     onChange={(e) => setUsername(e.target.value)}
//                   />
//                 </Form.Group>
//                 <Form.Group controlId="formPassword">
//                   <Form.Label>Password</Form.Label>
//                   <Form.Control
//                     type="password"
//                     placeholder="Enter password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                   />
//                 </Form.Group>
//                 <Button onClick={handleLogin} disabled={isLoading}>
//                   {isLoading ? "Loading..." : "Login"}
//                 </Button>
//               </Form>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>
//     </Container>
//   );
// }
