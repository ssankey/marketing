

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Row, Col, Card, Form, Button, Image, Alert } from "react-bootstrap";
// import { loginUser } from "utils/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="container-fluid p-0 vh-100 d-flex justify-content-center align-items-center">
      <Row
        className="g-0 w-100 h-auto"
        style={{ maxWidth: "1200px", padding: "25px 150px" }} // Adjust padding for smaller screens
      >
        {/* Left Side (Form Section) */}
        <Col xs={12} md={6} className="d-flex align-items-center p-0">
          <Card
            className="shadow-sm w-100"
            style={{
              borderRadius: "0px",
            }}
          >
            <Card.Body className="p-4 d-flex flex-column justify-content-center">
              <div className="mb-4 text-center">
                <Link href="/">
                  <img
                    src="/assets/density_logo_new_trans.png"
                    alt="Logo"
                    className="img-fluid mb-3"
                    style={{ height: "70px", width: "auto" }}
                  />
                </Link>
                {/* <h4 className="mb-4"><strong>Welcome back!</strong></h4> */}
              </div> 
              {error && (
                <Alert variant="danger" className="text-center">
                  {error}
                </Alert>
              )}
              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label >Username or Email</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Form.Group>
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
                <div className="d-grid mb-3">
                  <Button variant="primary" type="submit" disabled={isLoading}>
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </div>
                <div className="d-flex justify-content-between">
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

        {/* Right Side (Image Section) */}
        <Col xs={12} md={6} className="p-0 d-flex align-items-center">
          <Image
            src="/assets/login-image-square-2.jpg"
            alt="Right Side Image"
            className="w-100"
            style={{
              height: "100%",
              objectFit: "cover",
              borderRadius: "0px", // Optional for rounded corners
            }}
          />
        </Col>
      </Row>
    </div>
  );
}


 
