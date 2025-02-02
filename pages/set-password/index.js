import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation"; // Change import
import { Row, Col, Card, Form, Button, Image, Alert } from "react-bootstrap";
import Link from "next/link";
import { useRouter } from 'next/router';  // Import useRouter for programmatic redirection

export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') || ''; // Use searchParams to get email
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [success, setSuccess] = useState(false);  // State for success message
  const router = useRouter(); // To redirect to login page

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!email) {
      setError("Email is required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      // Send email and password to set password API
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          newPassword: password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to set password');
      }

      // Show success message and redirect after 3 seconds
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');  // Redirect to login page after success
      }, 3000); // 3 seconds delay
    } catch (err) {
      setError(err.message || "An error occurred while setting your new password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  // Add a check to prevent rendering without a email
  if (!email) {
    return <div>Invalid or missing email</div>;
  }

  return (
    <div className="container-fluid p-0 vh-100 d-flex justify-content-center align-items-center">
      <Row
        className="g-0 w-100 h-auto"
        style={{ maxWidth: "1200px", padding: "25px 150px" }}
      >
        {/* Left Side (Form Section) */}
        <Col xs={12} md={6} className="d-flex align-items-center p-0">
          <Card className="shadow-sm w-100" style={{ borderRadius: "0px" }}>
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
                <p className="mb-4 text-muted">
                  Set a new, strong password to secure your account.
                </p>
              </div>

              {/* Show Success Message */}
              {success ? (
                <Alert variant="success" className="text-center mb-4">
                  Password set successfully! You will be redirected to the login page.
                </Alert>
              ) : (
                // Form for setting password
                <Form onSubmit={handleSubmit}>
                  {error && (
                    <Alert variant="danger" className="text-center mb-4">
                      {error}
                    </Alert>
                  )}
                  <Form.Group className="mb-3" controlId="password">
                    <Form.Label>New Password</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={passwordVisible ? "text" : "password"}
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="form-control-lg pe-5"
                        aria-describedby="togglePasswordVisibility"
                      />
                      <Button
                        variant="link"
                        onClick={togglePasswordVisibility}
                        className="position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent"
                        style={{ zIndex: 10 }}
                        aria-label={passwordVisible ? "Hide password" : "Show password"}
                      >
                        {passwordVisible ? "🙈" : "👁️"}
                      </Button>
                    </div>
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="confirmPassword">
                    <Form.Label>Confirm New Password</Form.Label>
                    <Form.Control
                      type={passwordVisible ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                          aria-live="polite"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      ) : (
                        "Set New Password"
                      )}
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
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Side (Image Section) */}
        <Col xs={12} md={6} className="p-0 d-none d-md-flex align-items-center">
          <Image
            src="/assets/login-image-square-2.jpg"
            alt="Decorative background"
            className="w-100"
            style={{
              height: "100%",
              objectFit: "cover",
              borderRadius: "0px",
            }}
          />
        </Col>
      </Row>
    </div>
  );
}

SetPasswordPage.displayName = "SetPasswordPage";
