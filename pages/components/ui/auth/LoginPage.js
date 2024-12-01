


import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Row, Col, Card, Form, Button, Image, Alert } from "react-bootstrap";
import { loginUser } from "utils/auth";

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
    <Row className="align-items-center justify-content-center g-0 min-vh-100">
      <Col xxl={3} lg={4} md={6} xs={8} className="py-8 py-xl-0">
        {/* Card */}
        <Card className="smooth-shadow-md">
          {/* Card body */}
          <Card.Body className="p-6">
            <div className="mb-4 text-center">
              <Link href="/">
                {/* <Image
                  src="/images/brand/logo/logo-primary.svg"
                  className="mb-2"
                  alt="Logo"
                /> */}
                <img
                  src="/assets/density_logo_new_trans.png"
                  alt="Logo"
                  className="img-fluid" // Makes the image responsive
                  style={{ height: "70px", width: "auto", marginBottom: "6px" }} // Set height and keep aspect ratio
                />
              </Link>
              <p className="mb-6">Welcome back!</p>
            </div>
            {/* Error Alert */}
            {error && (
              <Alert variant="danger" className="text-center">
                {error}
              </Alert>
            )}
            {/* Form */}
            <Form onSubmit={handleLogin}>
              {/* Username */}
              <Form.Group className="mb-3" controlId="username">
                <Form.Label>Username or Email</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </Form.Group>

              {/* Password */}
              <Form.Group className="mb-3" controlId="password">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>

              {/* Checkbox */}
              {/* <Form.Check type="checkbox" id="rememberme" className="mb-4">
                <Form.Check.Input />
                <Form.Check.Label>Remember me</Form.Check.Label>
              </Form.Check> */}

              {/* Button */}
              <div className="d-grid mb-3">
                <Button variant="primary" type="submit" disabled={isLoading}>
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </div>

              {/* Links */}
              <div className="d-md-flex justify-content-between">
                <Link href="/signup" className="text-primary">
                  Create an Account
                </Link>
                <Link href="/forgot-password" className="text-primary">
                  Forgot your password?
                </Link>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
