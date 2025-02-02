"use client";

import { useState } from "react";
import { Row, Col, Card, Form, Button } from "react-bootstrap";
import Link from "next/link";
import Image from "next/image";

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
    <div className="container-fluid p-0 vh-100 d-flex justify-content-center align-items-center">
      <Row
        className="g-0 w-100 h-auto"
        style={{ maxWidth: "1200px", padding: "25px 150px" }}
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
                  <Image
                    src="/assets/density_logo_new_trans.png"
                    alt="Logo"
                    width={140}
                    height={70}
                    priority
                  />
                </Link>
              </div>
              <Form onSubmit={handleSignup}>
                {/* Username */}
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label className="fw-bold">Username</Form.Label>
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
                  <Form.Label className="fw-bold">Email</Form.Label>
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
                  <Form.Label className="fw-bold">Password</Form.Label>
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
                  <Form.Label className="fw-bold">Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="**************"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Form.Group>
                {/* Submit Button */}
                <div className="d-grid mb-3">
                  <Button variant="primary" type="submit" disabled={isLoading}>
                    {isLoading ? "Signing Up..." : "Create An Account"}
                  </Button>
                </div>
                <div className="d-flex justify-content-between">
                  <Link href="/login" className="text-primary">
                    Already a member? Login
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
            width={600}
            height={800}
            layout="intrinsic"
            objectFit="cover"
          />
        </Col>
      </Row>
    </div>
  );
}