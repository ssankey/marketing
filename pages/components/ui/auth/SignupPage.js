

"use client";

import { useState } from "react";
import { Row, Col, Card, Form, Button, Image } from "react-bootstrap";
import Link from "next/link";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
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
    <Row className="align-items-center justify-content-center g-0 min-vh-100">
      <Col xxl={3} lg={4} md={6} xs={8} className="py-8 py-xl-0">
        {/* Card */}
        <Card className="smooth-shadow-md">
          {/* Card body */}
          <Card.Body className="p-6">
            <div className="mb-4 text-center">
              <Link href="/">
                <img
                  src="/assets/density_logo_new_trans.png"
                  alt="Logo"
                  className="img-fluid" // Makes the image responsive
                  style={{ height: "70px", width: "auto", marginBottom: "6px" }} // Set height and keep aspect ratio
                />
              </Link>
              <p className="mb-6">Please enter your user information.</p>
            </div>

            {error && (
              <div className="alert alert-danger text-center mb-4">{error}</div>
            )}

            <Form onSubmit={handleSignup}>
              {/* Username */}
              <Form.Group className="mb-3" controlId="username">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="User Name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </Form.Group>

              {/* Email */}
              <Form.Group className="mb-3" controlId="email">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              {/* Password */}
              <Form.Group className="mb-3" controlId="password">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="**************"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>

              {/* Confirm Password */}
              <Form.Group className="mb-3" controlId="confirmPassword">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="**************"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </Form.Group>

              {/* Checkbox */}
              {/* <div className="mb-3">
                <Form.Check type="checkbox" id="terms">
                  <Form.Check.Input required />
                  <Form.Check.Label>
                    I agree to the <Link href="#">Terms of Service</Link> and{" "}
                    <Link href="#">Privacy Policy</Link>.
                  </Form.Check.Label>
                </Form.Check>
              </div> */}

              {/* Submit Button */}
              <div className="d-grid">
                <Button variant="primary" type="submit" disabled={isLoading}>
                  {isLoading ? "Signing Up..." : "Create An Account"}
                </Button>
              </div>

              <div className="d-md-flex justify-content-between mt-4">
                <div className="mb-2 mb-md-0">
                  <Link href="/login" className="text-primary">
                    Already a member? Login
                  </Link>
                </div>
                <div>
                  {/* <Link href="/forgot-password" className="text-inherit fs-5">
                    Forgot your password?
                  </Link> */}
                  <Link href="/forgot-password" className="text-primary">
                    Forgot your password?
                  </Link>
                </div>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

