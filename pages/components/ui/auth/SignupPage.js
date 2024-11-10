
// import { useState } from "react";
// import { Card, Button, Form, Container, Row, Col } from "react-bootstrap";

// export default function SignupPage() {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [email, setEmail] = useState("");

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log("Signup form submitted (no action for now)");
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
//               <h2 className="text-center mb-4">Signup</h2>
//               <Form onSubmit={handleSubmit}>
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
//                 <Form.Group controlId="formPassword" className="mb-3">
//                   <Form.Control
//                     type="password"
//                     placeholder="Password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     className="form-control-lg"
//                   />
//                 </Form.Group>

//                 {/* Email Input */}
//                 <Form.Group controlId="formEmail" className="mb-4">
//                   <Form.Control
//                     type="email"
//                     placeholder="Email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     className="form-control-lg"
//                   />
//                 </Form.Group>

//                 {/* Signup Button */}
//                 <Button
//                   type="submit"
//                   variant="primary"
//                   size="lg"
//                   className="w-100 mb-3"
//                 >
//                   Signup
//                 </Button>
//               </Form>

//               <div className="text-center">
//                 <p>
//                   Already have an account?{" "}
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


// import { useState } from "react";
// import { Card, Button, Form, Container, Row, Col } from "react-bootstrap";

// export default function SignupPage() {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [email, setEmail] = useState("");

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log("Signup form submitted (no action for now)");
//   };

//   return (
//     <Container
//       fluid
//       className="d-flex justify-content-center align-items-center min-vh-100"
//       style={{ backgroundColor: "#f8f9fa" }}
//     >
//       <Row className="w-100 justify-content-center">
//         <Col xs={12} sm={8} md={6} lg={4}>
//           <Card
//             className="border-0"
//             style={{
//               boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
//               borderRadius: "1rem",
//             }}
//           >
//             <Card.Body className="p-5">
//               <h2 className="text-center mb-4 fw-bold">Create Account</h2>
//               <Form onSubmit={handleSubmit}>
//                 <Form.Group className="mb-4" controlId="formUsername">
//                   <Form.Label>Username</Form.Label>
//                   <Form.Control
//                     type="text"
//                     placeholder="Choose a username"
//                     value={username}
//                     onChange={(e) => setUsername(e.target.value)}
//                     className="py-2"
//                   />
//                 </Form.Group>

//                 <Form.Group className="mb-4" controlId="formEmail">
//                   <Form.Label>Email address</Form.Label>
//                   <Form.Control
//                     type="email"
//                     placeholder="Enter your email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     className="py-2"
//                   />
//                 </Form.Group>

//                 <Form.Group className="mb-4" controlId="formPassword">
//                   <Form.Label>Password</Form.Label>
//                   <Form.Control
//                     type="password"
//                     placeholder="Create a password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     className="py-2"
//                   />
//                 </Form.Group>

//                 <div className="d-grid gap-2">
//                   <Button
//                     variant="primary"
//                     type="submit"
//                     size="lg"
//                     className="py-3"
//                     style={{
//                       backgroundColor: "#0056b3",
//                       borderColor: "#0056b3",
//                       transition: "all 0.2s ease-in-out",
//                     }}
//                   >
//                     Sign Up
//                   </Button>
//                 </div>
//               </Form>

//               <div className="text-center mt-4">
//                 <p className="mb-0 text-muted">
//                   Already have an account?{" "}
//                   <a
//                     href="/login"
//                     className="text-decoration-none fw-bold"
//                     style={{ color: "#0056b3" }}
//                   >
//                     Log In
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

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      // Add your signup logic here
      console.log("Signup form submitted");
    } catch (err) {
      setError("An error occurred during signup");
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
              Create Account
            </h1>
            <p className="text-white-50">Sign up for a new account</p>
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
              <Form onSubmit={handleSignup}>
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
                    placeholder="Choose your username"
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

                <Form.Group controlId="formPassword" className="mb-4">
                  <Form.Label className="text-muted small">PASSWORD</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Create your password"
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
                    "Sign Up"
                  )}
                </Button>

                <div className="text-center">
                  <p className="mb-0">
                    Already have an account?{" "}
                    <a
                      href="/login"
                      className="text-decoration-none fw-bold"
                      style={{ color: "#667eea" }}
                    >
                      Sign In
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