

// // ============================
// // 2. pages/otp-verification.js
// // ============================
// import { useState } from "react";
// import { useRouter } from "next/router";
// import { Card, Form, Button, Alert } from "react-bootstrap";
// import Link from "next/link";

// export default function OtpVerificationPage() {
//   const [otp, setOtp] = useState("");
//   const [error, setError] = useState("");
//   const router = useRouter();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     const otpToken = localStorage.getItem("otpToken");
//     if (!otpToken) {
//       return setError("OTP token missing. Please restart the process.");
//     }

//     try {
//       const res = await fetch("/api/auth/verify-otp", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ otpToken, enteredOtp: otp }),
//       });

//       const data = await res.json();

//       if (res.ok) {
//         router.push(`/set-password?email=${encodeURIComponent(data.email)}`);
//       } else {
//         throw new Error(data.message);
//       }
//     } catch (err) {
//       setError(err.message);
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
//             <h5>OTP Verification</h5>
//           </div>

//           {error && <Alert variant="danger">{error}</Alert>}

//           <Form onSubmit={handleSubmit}>
//             <Form.Group className="mb-3">
//               <Form.Label>Enter OTP</Form.Label>
//               <Form.Control
//                 type="text"
//                 value={otp}
//                 onChange={(e) => setOtp(e.target.value)}
//                 placeholder="Enter 6-digit OTP"
//                 required
//               />
//             </Form.Group>

//             <div className="d-grid mb-3">
//               <Button type="submit" variant="primary">
//                 Verify OTP
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
// 2. pages/otp-verification.js
// ============================
import { useState } from "react";
import { useRouter } from "next/router";
import { Card, Form, Button, Alert, Container, Row, Col } from "react-bootstrap";
import Link from "next/link";

export default function OtpVerificationPage() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const otpToken = localStorage.getItem("otpToken");
    if (!otpToken) {
      setError("OTP token missing. Please restart the process.");
      setLoading(false);
      return;
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
                {/* Left Side - OTP Verification Form */}
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
                      <h3 className="fw-bold text-dark mb-2">OTP Verification</h3>
                      <p className="text-muted">
                        Enter the verification code to continue
                      </p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                      <Alert variant="danger" dismissible className="mb-4">
                        {error}
                      </Alert>
                    )}

                    {/* OTP Form */}
                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold">
                          Enter OTP
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="Enter 6-digit OTP"
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
                              Verifying...
                            </>
                          ) : (
                            "Verify OTP"
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
                          Sign In
                        </Link>
                      </span>
                    </div>
                  </Card.Body>
                </Col>

                {/* Right Side - Hero Section */}
                <Col md={6} className="d-none d-md-block">
                  <div
                    className="h-100 position-relative d-flex align-items-center justify-content-center"
                    style={{
                      background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
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
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                      <h4 className="fw-bold mb-3">Verification Required</h4>
                      <p className="opacity-75 mb-0" style={{ fontSize: "1.1rem" }}>
                        Enter the code to verify your identity and continue
                      </p>
                    </div>

                    {/* Background Pattern */}
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100 opacity-10"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m0 40l40-40h-40z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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