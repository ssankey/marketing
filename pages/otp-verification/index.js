

// ============================
// 2. pages/otp-verification.js
// ============================
import { useState } from "react";
import { useRouter } from "next/router";
import { Card, Form, Button, Alert } from "react-bootstrap";
import Link from "next/link";

export default function OtpVerificationPage() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const otpToken = localStorage.getItem("otpToken");
    if (!otpToken) {
      return setError("OTP token missing. Please restart the process.");
    }

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otpToken, enteredOtp: otp }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/set-password?email=${encodeURIComponent(data.email)}`);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
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
            <h5>OTP Verification</h5>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Enter OTP</Form.Label>
              <Form.Control
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                required
              />
            </Form.Group>

            <div className="d-grid mb-3">
              <Button type="submit" variant="primary">
                Verify OTP
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