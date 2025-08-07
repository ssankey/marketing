// //pages/set-password/index.js
// import { useState, useEffect } from "react";
// import { useSearchParams } from "next/navigation";
// import { Card, Form, Button, Alert } from "react-bootstrap";
// import Link from "next/link";
// import { useRouter } from 'next/router';

// export default function SetPasswordPage() {
//   const searchParams = useSearchParams();
//   const email = searchParams?.get('email') || '';
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [error, setError] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [passwordVisible, setPasswordVisible] = useState(false);
//   const [success, setSuccess] = useState(false);
//   const router = useRouter();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (!email) {
//       setError("Email is required.");
//       return;
//     }

//     if (password !== confirmPassword) {
//       setError("Passwords do not match. Please try again.");
//       return;
//     }

//     if (password.length < 8) {
//       setError("Password must be at least 8 characters long.");
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const response = await fetch('/api/auth/set-password', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           email,
//           newPassword: password,
//           confirmPassword,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || 'Failed to set password');
//       }

//       setSuccess(true);
//       setTimeout(() => {
//         router.push('/login');
//       }, 3000);
//     } catch (err) {
//       setError(err.message || "An error occurred while setting your new password. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const togglePasswordVisibility = () => {
//     setPasswordVisible(!passwordVisible);
//   };

//   if (!email) {
//     return <div>Invalid or missing email</div>;
//   }

//   return (
//     <div className="container-fluid p-0 vh-100 d-flex justify-content-center align-items-center">
//       <Card className="shadow-sm w-100" style={{ maxWidth: "400px" }}>
//         <Card.Body className="p-4">
//           <div className="mb-4 text-center">
//             <Link href="/">
//               <img
//                 src="/assets/density_logo_new_trans.png"
//                 alt="Logo"
//                 className="img-fluid mb-3"
//                 style={{ height: "70px" }}
//               />
//             </Link>
//           </div>

//           {success ? (
//             <Alert variant="success" className="text-center mb-4">
//               Password set successfully! You will be redirected to the login page.
//             </Alert>
//           ) : (
//             <Form onSubmit={handleSubmit}>
//               {error && (
//                 <Alert variant="danger" dismissible className="mb-4">
//                   {error}
//                 </Alert>
//               )}
//               <Form.Group className="mb-3" controlId="password">
//                 <Form.Label>New Password</Form.Label>
//                 <div className="position-relative">
//                   <Form.Control
//                     type={passwordVisible ? "text" : "password"}
//                     placeholder="Enter new password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                   />
//                   <Button
//                     variant="link"
//                     onClick={togglePasswordVisibility}
//                     className="position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent"
//                     style={{ zIndex: 10 }}
//                     aria-label={passwordVisible ? "Hide password" : "Show password"}
//                   >
//                     {passwordVisible ? "🙈" : "👁️"}
//                   </Button>
//                 </div>
//               </Form.Group>
//               <Form.Group className="mb-3" controlId="confirmPassword">
//                 <Form.Label>Confirm New Password</Form.Label>
//                 <Form.Control
//                   type={passwordVisible ? "text" : "password"}
//                   placeholder="Confirm new password"
//                   value={confirmPassword}
//                   onChange={(e) => setConfirmPassword(e.target.value)}
//                   required
//                 />
//               </Form.Group>
//               <div className="d-grid mb-3">
//                 <Button
//                   variant="primary"
//                   type="submit"
//                   disabled={isLoading}
//                 >
//                   {isLoading ? "Setting Password..." : "Set New Password"}
//                 </Button>
//               </div>
//               <div className="text-center">
//                 <span className="text-muted">
//                   Remember your password?{" "}
//                   <Link href="/login" className="text-primary">
//                     Sign In
//                   </Link>
//                 </span>
//               </div>
//             </Form>
//           )}
//         </Card.Body>
//       </Card>
//     </div>
//   );
// }

// SetPasswordPage.displayName = "SetPasswordPage";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  Form,
  Button,
  Alert,
  Container,
  Row,
  Col,
} from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/router";

export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";
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
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          newPassword: password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to set password");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      setError(
        err.message ||
          "An error occurred while setting your new password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  if (!email) {
    return (
      <div
        className="vh-100 d-flex justify-content-center align-items-center"
        style={{ backgroundColor: "#f8f9fa" }}
      >
        <Container fluid>
          <Row className="justify-content-center">
            <Col xs={12} lg={6} xl={4}>
              <Card className="shadow-lg border-0">
                <Card.Body className="p-5 text-center">
                  <Alert variant="danger">
                    <h5 className="alert-heading">Invalid Access</h5>
                    <p>
                      Invalid or missing email parameter. Please use a valid
                      password reset link.
                    </p>
                    <hr />
                    <Link href="/login" className="btn btn-primary">
                      Back to Login
                    </Link>
                  </Alert>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div
      className="vh-100 d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "#f8f9fa" }}
    >
      <Container fluid>
        <Row className="justify-content-center">
          <Col xs={12} lg={10} xl={8}>
            <Card className="shadow-lg border-0 overflow-hidden">
              <Row className="g-0 min-vh-75">
                {/* Left Side - Set Password Form */}
                <Col md={6} className="d-flex flex-column">
                  <Card.Body className="p-5 d-flex flex-column justify-content-center h-100">
                    {/* Logo Section */}
                    <div className="mb-4 text-center">
                      <Link href="/">
                        <img
                          src="/assets/density_logo_new_trans.png"
                          alt="Logo"
                          className="img-fluid mb-3"
                          style={{ height: "80px" }}
                        />
                      </Link>
                    </div>

                    {/* Welcome Text */}
                    <div className="text-center mb-4">
                      <h3 className="fw-bold text-dark mb-2">
                        Set New Password
                      </h3>
                      <p className="text-muted">
                        Create a strong password for your account
                      </p>
                      <small className="text-muted d-block">
                        Setting password for: <strong>{email}</strong>
                      </small>
                    </div>

                    {/* Success Alert */}
                    {success && (
                      <Alert variant="success" className="text-center mb-4">
                        <div className="d-flex align-items-center justify-content-center mb-2">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="me-2"
                          >
                            <path
                              d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"
                              fill="currentColor"
                            />
                          </svg>
                          Password Set Successfully!
                        </div>
                        <p className="mb-0">
                          You will be redirected to the login page in a few
                          seconds.
                        </p>
                      </Alert>
                    )}

                    {/* Error Alert */}
                    {error && (
                      <Alert variant="danger" dismissible className="mb-4">
                        <div className="d-flex align-items-start">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="me-2 mt-1 flex-shrink-0"
                          >
                            <path
                              d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
                              fill="currentColor"
                            />
                          </svg>
                          {error}
                        </div>
                      </Alert>
                    )}

                    {/* Set Password Form */}
                    {!success && (
                      <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-semibold">
                            New Password
                          </Form.Label>
                          <div className="position-relative">
                            <Form.Control
                              type={passwordVisible ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter your new password"
                              required
                              size="lg"
                              className="border-2 pe-5"
                            />
                            <Button
                              variant="link"
                              onClick={togglePasswordVisibility}
                              className="position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent text-muted p-2"
                              style={{ zIndex: 10 }}
                              aria-label={
                                passwordVisible
                                  ? "Hide password"
                                  : "Show password"
                              }
                            >
                              {passwordVisible ? (
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M12 7C12.5304 7 13.0391 7.21071 13.4142 7.58579C13.7893 7.96086 14 8.46957 14 9C14 9.53043 13.7893 10.0391 13.4142 10.4142C13.0391 10.7893 12.5304 11 12 11C11.4696 11 10.9609 10.7893 10.5858 10.4142C10.2107 10.0391 10 9.53043 10 9C10 8.46957 10.2107 7.96086 10.5858 7.58579C10.9609 7.21071 11.4696 7 12 7ZM12 5C7 5 2.73 8.11 1 12C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 12C21.27 8.11 17 5 12 5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M11.83 9L15 12.16C15 12.11 15 12.05 15 12C15 10.34 13.66 9 12 9C11.94 9 11.89 9 11.83 9ZM7.53 9.8L9.08 11.35C9.03 11.56 9 11.77 9 12C9 13.66 10.34 15 12 15C12.22 15 12.44 14.97 12.65 14.92L14.2 16.47C13.53 16.8 12.79 17 12 17C9.24 17 7 14.76 7 12C7 11.21 7.2 10.47 7.53 9.8ZM2 4.27L4.28 6.55L4.73 7C3.08 8.3 1.78 10 1 12C2.73 15.89 7 19 12 19C13.55 19 15.03 18.7 16.38 18.18L16.81 18.61L19.73 21.53L21 20.27L3.27 2.5L2 4.27ZM12 7C14.76 7 17 9.24 17 12C17 12.64 16.87 13.26 16.64 13.82L19.57 16.75C21.07 15.5 22.27 13.86 23 12C21.27 8.11 17 5 12 5C10.6 5 9.26 5.26 8.04 5.73L10.17 7.86C10.74 7.13 11.81 6.4 12 7Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              )}
                            </Button>
                          </div>
                          <Form.Text className="text-muted">
                            Password must be at least 8 characters long
                          </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-4">
                          <Form.Label className="fw-semibold">
                            Confirm New Password
                          </Form.Label>
                          <Form.Control
                            type={passwordVisible ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your new password"
                            required
                            size="lg"
                            className="border-2"
                          />
                        </Form.Group>

                        <div className="d-grid mb-4">
                          <Button
                            variant="primary"
                            type="submit"
                            disabled={isLoading}
                            size="lg"
                            className="fw-semibold py-3"
                          >
                            {isLoading ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                                Setting Password...
                              </>
                            ) : (
                              "Set New Password"
                            )}
                          </Button>
                        </div>
                      </Form>
                    )}

                    {/* Back to Login Link */}
                    <div className="text-center">
                      <span className="text-muted">
                        Remember your password?{" "}
                        <Link
                          href="/login"
                          className="text-primary text-decoration-none fw-semibold"
                        >
                          Back to Sign In
                        </Link>
                      </span>
                    </div>
                  </Card.Body>
                </Col>

                {/* Right Side - Hero Image */}
                <Col md={6} className="d-none d-md-block">
                  <div
                    className="h-100 position-relative d-flex align-items-center justify-content-center"
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      minHeight: "600px",
                    }}
                  >
                    {/* Decorative Elements */}
                    <div className="text-center text-white p-5">
                      <div className="mb-4">
                        <div
                          className="rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center"
                          style={{
                            width: "120px",
                            height: "120px",
                            background: "rgba(255, 255, 255, 0.1)",
                            backdropFilter: "blur(10px)",
                          }}
                        >
                          <svg
                            width="60"
                            height="60"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                      </div>
                      <h4 className="fw-bold mb-3">Secure Your Account</h4>
                      <p
                        className="opacity-75 mb-0"
                        style={{ fontSize: "1.1rem" }}
                      >
                        Create a strong password to protect your account and
                        keep your data safe
                      </p>
                    </div>

                    {/* Background Pattern */}
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100 opacity-10"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                      }}
                    ></div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

SetPasswordPage.displayName = "SetPasswordPage";