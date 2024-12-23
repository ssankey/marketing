

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Row, Col, Card, Form, Button, Image, Alert } from "react-bootstrap";
import { loginUser } from "utils/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showpasswordfield, setshowPasswordField] = useState(false)
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/"); // Redirect to dashboard if already logged in
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.message === 'SET_PASSWORD_REQUIRED') {
          console.log(data.message);
          
          // Redirect to Set Password page with token (if available)
          // router.push(`/set-password?email=${encodeURIComponent(email)}`);
        } else if (data.message === 'SET_SHOW_PASSWORD_FIELD') {
          setshowPasswordField(true)
          console.log(data.message);

        } else {
          // Handle successful login (redirect to dashboard)
          router.push('/dashboard');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
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
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label >Email</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>
                {showpasswordfield && (
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
                )}
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



