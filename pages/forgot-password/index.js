

// // ============================
// // 1. pages/forgot-password.js
// // ============================
// import { useState } from "react";
// import { useRouter } from "next/router";
// import { Card, Form, Button, Alert } from "react-bootstrap";
// import Link from "next/link";

// export default function ForgotPasswordPage() {
//   const [email, setEmail] = useState("");
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

  
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");
//     setSuccess("");

//     try {
//       const res = await fetch("/api/auth/forgot-password", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email }),
//       });

//       const data = await res.json();

//       console.log("Response data:", data); // Check this in browser console

//       if (!res.ok) {
//         throw new Error(data.message || "Failed to send OTP");
//       }

//       // Handle different success cases
//       if (data.otpToken) {
//         localStorage.setItem("otpToken", data.otpToken);
//         localStorage.setItem("otpEmail", email); // Store email for verification
//         router.push("/otp-verification");
//       } else if (data.redirectTo === "set-password") {
//         router.push(`/set-password?email=${encodeURIComponent(email)}`);
//       } else {
//         throw new Error("Unexpected response format");
//       }
//     } catch (err) {
//       setError(err.message);
//       console.error("Error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };
//   return (
//     <div className="container-fluid p-0 vh-100 d-flex justify-content-center align-items-center">
//       <Card className="shadow-sm w-100" style={{ maxWidth: "400px" }}>
//         <Card.Body className="p-4">
//           <div className="mb-4 text-center">
//             <img
//               src="/assets/density_logo_new_trans.png"
//               alt="Logo"
//               style={{ height: "70px" }}
//               className="mb-3"
//             />
//             <h5>Forgot Password</h5>
//           </div>

//           {error && <Alert variant="danger">{error}</Alert>}

//           <Form onSubmit={handleSubmit}>
//             <Form.Group className="mb-3">
//               <Form.Label>Email</Form.Label>
//               <Form.Control
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 placeholder="Enter your email"
//                 required
//               />
//             </Form.Group>

//             <div className="d-grid mb-3">
//               <Button variant="primary" type="submit" disabled={loading}>
//                 {loading ? "Sending OTP..." : "Continue"}
//               </Button>
//             </div>
//             <div className="text-center">
//                             <span className="text-muted">
//                               Remember your password?{" "}
//                               <Link href="/login" className="text-primary">
//                                 Sign In
//                               </Link>
//                             </span>
//                           </div>
//           </Form>
//         </Card.Body>
//       </Card>
//     </div>
//   );
// }



// ============================
// 1. pages/forgot-password.js
// ============================
import { useState } from "react";
import { useRouter } from "next/router";
import { Card, Form, Button, Alert, Container, Row, Col } from "react-bootstrap";
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
    <div
      className="vh-100 d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "#f8f9fa" }}
    >
      <Container fluid>
        <Row className="justify-content-center">
          <Col xs={12} lg={10} xl={8}>
            <Card className="shadow-lg border-0 overflow-hidden">
              <Row className="g-0 min-vh-75">
                {/* Left Side - Forgot Password Form */}
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
                      <h3 className="fw-bold text-dark mb-2">Forgot Password?</h3>
                      <p className="text-muted">
                        No worries! Enter your email and we'll send you a reset link
                      </p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                      <Alert variant="danger" dismissible className="mb-4">
                        {error}
                      </Alert>
                    )}

                    {/* Success Alert */}
                    {success && (
                      <Alert variant="success" dismissible className="mb-4">
                        {success}
                      </Alert>
                    )}

                    {/* Forgot Password Form */}
                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold">
                          Email Address
                        </Form.Label>
                        <Form.Control
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email address"
                          required
                          size="lg"
                          className="border-2"
                        />
                      </Form.Group>

                      <div className="d-grid mb-4">
                        <Button
                          variant="primary"
                          type="submit"
                          disabled={loading}
                          size="lg"
                          className="fw-semibold py-3"
                        >
                          {loading ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              Sending Reset Link...
                            </>
                          ) : (
                            "Send Reset Link"
                          )}
                        </Button>
                      </div>
                    </Form>

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
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
                              d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V17C3 18.11 3.89 19 5 19H11V21C11 21.55 11.45 22 12 22S13 21.55 13 21V19H19C20.11 19 21 18.11 21 17V9M19 17H5V3H13V9H19Z"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                      </div>
                      <h4 className="fw-bold mb-3">Secure Password Recovery</h4>
                      <p className="opacity-75 mb-0" style={{ fontSize: "1.1rem" }}>
                        We'll help you get back into your account safely and securely
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