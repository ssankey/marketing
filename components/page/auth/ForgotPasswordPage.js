// import { useState } from "react";
// import { Row, Col, Card, Form, Button, Image, Alert } from "react-bootstrap";
// import Link from "next/link";

// export default function ForgotPasswordPage() {
//   const [email, setEmail] = useState("");
//   const [error, setError] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);
//     try {
//       // Add your forgot password logic here
//       console.log("Forgot password form submitted");
//     } catch (err) {
//       setError("An error occurred while sending reset link");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="container-fluid p-0 vh-100 d-flex justify-content-center align-items-center">
//       <Row
//         className="g-0 w-100 h-auto"
//         style={{ maxWidth: "1200px", padding: "25px 150px" }}
//       >
//         {/* Left Side (Form Section) */}
//         <Col xs={12} md={6} className="d-flex align-items-center p-0">
//           <Card
//             className="shadow-sm w-100"
//             style={{
//               borderRadius: "0px",
//             }}
//           >
//             <Card.Body className="p-6 d-flex flex-column justify-content-center">
//               <div className="mb-4 text-center">
//                 <Link href="/">
//                   <img
//                     src="/assets/density_logo_new_trans.png"
//                     alt="Logo"
//                     className="img-fluid mb-3"
//                     style={{ height: "70px", width: "auto" }}
//                   />
//                 </Link>
//                 <p className="mb-4 text-muted">
//                   Don&apos;t worry, we&apos;ll send you an email to reset your
//                   password.
//                 </p>
//               </div>
//               {/* Form */}
//               <Form onSubmit={handleSubmit}>
//                 {error && (
//                   <Alert variant="danger" className="text-center mb-4">
//                     {error}
//                   </Alert>
//                 )}
//                 <Form.Group className="mb-3" controlId="email">
//                   <Form.Label>Email</Form.Label>
//                   <Form.Control
//                     type="email"
//                     placeholder="Enter your email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     className="form-control-lg"
//                   />
//                 </Form.Group>
//                 <div className="mb-3 d-grid">
//                   <Button
//                     variant="primary"
//                     type="submit"
//                     className="btn-lg"
//                     disabled={isLoading}
//                   >
//                     {isLoading ? (
//                       <div
//                         className="spinner-border spinner-border-sm text-light"
//                         role="status"
//                       >
//                         <span className="visually-hidden">Loading...</span>
//                       </div>
//                     ) : (
//                       "Reset Password"
//                     )}
//                   </Button>
//                 </div>
//                 <div className="text-center">
//                   <span className="text-muted">
//                     Don&apos;t have an account?{" "}
//                     <Link href="/login" className="text-primary">
//                       Sign In
//                     </Link>
//                   </span>
//                 </div>
//               </Form>
//             </Card.Body>
//           </Card>
//         </Col>

//         {/* Right Side (Image Section) */}
//         <Col xs={12} md={6} className="p-0 d-none d-md-flex align-items-center">
//           <Image
//             src="/assets/login-image-square-2.jpg"
//             alt="Right Side Image"
//             className="w-100"
//             style={{
//               height: "100%",
//               objectFit: "cover",
//               borderRadius: "0px",
//             }}
//           />
//         </Col>
//       </Row>
//     </div>
//   );
// }

// ForgotPasswordPage.displayName = "ForgotPasswordPage";

import { useState } from "react";
import { Row, Col, Card, Form, Button, Image, Alert } from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/router";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const router = useRouter();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("OTP has been sent to your email. Valid for 5 minutes.");
        setStep(2);
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch (err) {
      setError("An error occurred while sending OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep(3);
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setError("An error occurred while verifying OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Password reset successfully. You can now login.");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (err) {
      setError("An error occurred while resetting password");
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
        <Col xs={12} md={6} className="d-flex align-items-center p-0">
          <Card
            className="shadow-sm w-100"
            style={{
              borderRadius: "0px",
            }}
          >
            <Card.Body className="p-6 d-flex flex-column justify-content-center">
              <div className="mb-4 text-center">
                <Link href="/">
                  <img
                    src="/assets/density_logo_new_trans.png"
                    alt="Logo"
                    className="img-fluid mb-3"
                    style={{ height: "70px", width: "auto" }}
                  />
                </Link>
                <h4 className="mb-3">Reset Password</h4>
                {success && (
                  <Alert variant="success" className="text-center mb-4">
                    {success}
                  </Alert>
                )}
                {error && (
                  <Alert variant="danger" className="text-center mb-4">
                    {error}
                  </Alert>
                )}
              </div>

              {step === 1 && (
                <Form onSubmit={handleSendOtp}>
                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-control-lg"
                      required
                    />
                  </Form.Group>
                  <div className="mb-3 d-grid">
                    <Button
                      variant="primary"
                      type="submit"
                      className="btn-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? "Sending..." : "Send OTP"}
                    </Button>
                  </div>
                </Form>
              )}

              {step === 2 && (
                <Form onSubmit={handleVerifyOtp}>
                  <Form.Group className="mb-3" controlId="otp">
                    <Form.Label>OTP</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter OTP received in email"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="form-control-lg"
                      required
                    />
                  </Form.Group>
                  <div className="mb-3 d-grid">
                    <Button
                      variant="primary"
                      type="submit"
                      className="btn-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? "Verifying..." : "Verify OTP"}
                    </Button>
                  </div>
                </Form>
              )}

              {step === 3 && (
                <Form onSubmit={handleResetPassword}>
                  <Form.Group className="mb-3" controlId="newPassword">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="form-control-lg"
                      required
                      minLength={8}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="confirmPassword">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="form-control-lg"
                      required
                      minLength={8}
                    />
                  </Form.Group>
                  <div className="mb-3 d-grid">
                    <Button
                      variant="primary"
                      type="submit"
                      className="btn-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                  </div>
                </Form>
              )}

              <div className="text-center">
                <span className="text-muted">
                  Remember your password?{" "}
                  <Link href="/login" className="text-primary">
                    Sign In
                  </Link>
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={6} className="p-0 d-none d-md-flex align-items-center">
          <Image
            src="/assets/login-image-square-2.jpg"
            alt="Right Side Image"
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