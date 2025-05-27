

// ============================
// 1. pages/forgot-password.js
// ============================
import { useState } from "react";
import { useRouter } from "next/router";
import { Card, Form, Button, Alert } from "react-bootstrap";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      console.log("Response data:", data); // Check this in browser console

      if (!res.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      // Handle different success cases
      if (data.otpToken) {
        localStorage.setItem("otpToken", data.otpToken);
        localStorage.setItem("otpEmail", email); // Store email for verification
        router.push("/otp-verification");
      } else if (data.redirectTo === "set-password") {
        router.push(`/set-password?email=${encodeURIComponent(email)}`);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="container-fluid p-0 vh-100 d-flex justify-content-center align-items-center">
      <Card className="shadow-sm w-100" style={{ maxWidth: "400px" }}>
        <Card.Body className="p-4">
          <div className="mb-4 text-center">
            <img
              src="/assets/density_logo_new_trans.png"
              alt="Logo"
              style={{ height: "70px" }}
              className="mb-3"
            />
            <h5>Forgot Password</h5>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </Form.Group>

            <div className="d-grid mb-3">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? "Sending OTP..." : "Continue"}
              </Button>
            </div>
            <div className="text-center">
                            <span className="text-muted">
                              Remember your password?{" "}
                              <Link href="/login" className="text-primary">
                                Sign In
                              </Link>
                            </span>
                          </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
