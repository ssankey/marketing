

import { useState } from "react";
import { Row, Col, Card, Form, Button, Image, Alert } from "react-bootstrap";
import Link from "next/link";

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
    <Row className="align-items-center justify-content-center g-0 min-vh-100">
      <Col xxl={3} lg={4} md={6} xs={8} className="py-8 py-xl-0">
        {/* Card */}
        <Card className="smooth-shadow-md" >
          {/* Card body */}
          <Card.Body className="p-6">
            <div className="mb-4 text-center">
              <Link href="/">
                <img
                  src="/assets/density_logo_new_trans.png"
                  alt="Logo"
                  className="img-fluid" // Makes the image responsive
                  style={{
                    height: "70px",
                    width: "auto",
                    marginBottom: "6px",
                  }} // Set height and keep aspect ratio
                />
              </Link>

              <p className="mb-4 text-muted">
                Don&apos;t worry, we&apos;ll send you an email to reset your
                password.
              </p>
            </div>
            {/* Form */}
            <Form onSubmit={handleSubmit}>
              {error && (
                <Alert variant="danger" className="text-center mb-4">
                  {error}
                </Alert>
              )}
              <Form.Group className="mb-3" controlId="email">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control-lg"
                />
              </Form.Group>
              <div className="mb-3 d-grid">
                <Button
                  variant="primary"
                  type="submit"
                  className="btn-lg"
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
                    "Reset Password"
                  )}
                </Button>
              </div>
              <div className="text-center">
                <span className="text-muted">
                  Don&apos;t have an account?{" "}
                  <Link href="/login" className="text-primary">
                    Sign In
                  </Link>
                </span>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

ForgotPasswordPage.displayName = "ForgotPasswordPage";
  