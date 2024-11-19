import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Card, Button, Form, Container, Row, Col, Alert } from 'react-bootstrap';
import { loginUser } from 'utils/auth';
export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/"); // Redirect to dashboard if already logged in
    }
  }, [router]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    try {
      setIsLoading(true);
      const result = await loginUser(username, password);
      
      if (result.success) {
        localStorage.setItem("token", result.token); // Store token
        await router.push("/"); // Redirect to the dashboard
      } else {
        setError(result.message || "Invalid username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
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
            <h1 className="text-white fw-bold mb-2" style={{ fontSize: "2.5rem" }}>
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
              <Form onSubmit={handleLogin}>
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
                  type="submit" // Update to use form submission
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
                      <Link 
                  href="/signup" 
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Create Account
                </Link>
                    </Col>
                    <Col>
                      <div className="vr mx-3" style={{ height: "20px" }}></div>
                    </Col>
                    <Col>
                      <Link 
                  href="/forgot-password" 
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Forgot Password?
                </Link>
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
