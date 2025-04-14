import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, Form, Button, Alert } from "react-bootstrap";
import Link from "next/link";
import { useRouter } from 'next/router';

export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') || '';
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

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

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || "An error occurred while setting your new password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  if (!email) {
    return <div>Invalid or missing email</div>;
  }

  return (
    <div className="container-fluid p-0 vh-100 d-flex justify-content-center align-items-center">
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

          {success ? (
            <Alert variant="success" className="text-center mb-4">
              Password set successfully! You will be redirected to the login page.
            </Alert>
          ) : (
            <Form onSubmit={handleSubmit}>
              {error && (
                <Alert variant="danger" dismissible className="mb-4">
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
                    required
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
                  required
                />
              </Form.Group>
              <div className="d-grid mb-3">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Setting Password..." : "Set New Password"}
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
    </div>
  );
}

SetPasswordPage.displayName = "SetPasswordPage";