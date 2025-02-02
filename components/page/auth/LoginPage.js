// pages/login.js
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Card, Form, Button, Alert, Spinner, Container, Row, Col } from "react-bootstrap";
import { useAuth } from "contexts/AuthContext";
import Head from "next/head";

export default function LoginPage() {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract redirect path from query parameters
  const { redirect } = router.query;

  useEffect(() => {
    if (!loading && user) {
      // If already logged in, redirect to home or intended page
      router.replace(redirect || "/");
    }
  }, [user, loading, router, redirect]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include", // Important for sending cookies
      });

      const data = await response.json();

      if (response.ok) {
        // Update AuthContext to fetch and set the user
        await updateUser();
        // Redirect is handled by useEffect
      } else {
        // Handle different error messages
        switch (data.message) {
          case "PASSWORD_NOT_SET":
            setError("Your password is not set. Please set your password.");
            // Optionally, redirect to set-password page with email
            router.push(`/set-password?email=${encodeURIComponent(formData.email)}`);
            break;
          case "SHOW_PASSWORD_FIELD":
            setError("Please enter your password.");
            break;
          case "Invalid credentials":
          case "User Not Found":
          case "Incorrect Password":
            setError("Invalid email or password.");
            break;
          default:
            setError(data.message || "An unknown error occurred.");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred while processing your request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Density</title>
        <meta name="description" content="Login to your account." />
      </Head>
      <Container className="vh-100 d-flex justify-content-center align-items-center">
        <Row>
          <Col>
            <Card className="shadow-sm w-100" style={{ maxWidth: "400px" }}>
              <Card.Body className="p-4">
                <div className="mb-4 text-center">
                  <Link href="/">
                    <img
                      src="/assets/density_logo_new_trans.png"
                      alt="Logo"
                      className="img-fluid mb-3"
                      style={{ height: "70px" }}
                    />
                  </Link>
                </div>

                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError("")}>
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleLogin}>
                  <Form.Group controlId="formEmail" className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      required
                      disabled={isSubmitting}
                    />
                  </Form.Group>

                  <Form.Group controlId="formPassword" className="mb-4">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      required
                      disabled={isSubmitting}
                    />
                  </Form.Group>

                  <Button variant="primary" type="submit" disabled={isSubmitting} className="w-100">
                    {isSubmitting ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Signing In...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </Form>

                {/* Optional: Links to signup or forgot password */}
                <div className="mt-3 text-center">
                  <Link href="/forgot-password">Forgot Password?</Link>
                </div>
                <div className="mt-2 text-center">
                  Don't have an account? <Link href="/signup">Sign Up</Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
