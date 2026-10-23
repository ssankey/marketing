


// // ============================
// // 1. pages/forgot-password.js
// // ============================
// import { useState } from "react";
// import { useRouter } from "next/router";
// import { Card, Form, Button, Alert, Container, Row, Col } from "react-bootstrap";
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
//     <div
//       className="vh-100 d-flex justify-content-center align-items-center"
//       style={{ backgroundColor: "#f8f9fa" }}
//     >
//       <Container fluid>
//         <Row className="justify-content-center">
//           <Col xs={12} lg={10} xl={8}>
//             <Card className="shadow-lg border-0 overflow-hidden">
//               <Row className="g-0 min-vh-75">
//                 {/* Left Side - Forgot Password Form */}
//                 <Col md={6} className="d-flex flex-column">
//                   <Card.Body className="p-5 d-flex flex-column justify-content-center h-100">
//                     {/* Logo Section */}
//                     <div className="mb-4 text-center">
//                       <Link href="/">
//                         <img
//                           src="/assets/density_logo_new_trans.png"
//                           alt="Logo"
//                           className="img-fluid mb-3"
//                           style={{ height: "80px" }}
//                         />
//                       </Link>
//                     </div>

//                     {/* Welcome Text */}
//                     <div className="text-center mb-4">
//                       <h3 className="fw-bold text-dark mb-2">Forgot Password?</h3>
//                       <p className="text-muted">
//                         No worries! Enter your email and we'll send you a reset link
//                       </p>
//                     </div>

//                     {/* Error Alert */}
//                     {error && (
//                       <Alert variant="danger" dismissible className="mb-4">
//                         {error}
//                       </Alert>
//                     )}

//                     {/* Success Alert */}
//                     {success && (
//                       <Alert variant="success" dismissible className="mb-4">
//                         {success}
//                       </Alert>
//                     )}

//                     {/* Forgot Password Form */}
//                     <Form onSubmit={handleSubmit}>
//                       <Form.Group className="mb-4">
//                         <Form.Label className="fw-semibold">
//                           Email Address
//                         </Form.Label>
//                         <Form.Control
//                           type="email"
//                           value={email}
//                           onChange={(e) => setEmail(e.target.value)}
//                           placeholder="Enter your email address"
//                           required
//                           size="lg"
//                           className="border-2"
//                         />
//                       </Form.Group>

//                       <div className="d-grid mb-4">
//                         <Button
//                           variant="primary"
//                           type="submit"
//                           disabled={loading}
//                           size="lg"
//                           className="fw-semibold py-3"
//                         >
//                           {loading ? (
//                             <>
//                               <span
//                                 className="spinner-border spinner-border-sm me-2"
//                                 role="status"
//                                 aria-hidden="true"
//                               ></span>
//                               Sending Reset Link...
//                             </>
//                           ) : (
//                             "Send Reset Link"
//                           )}
//                         </Button>
//                       </div>
//                     </Form>

//                     {/* Back to Login Link */}
//                     <div className="text-center">
//                       <span className="text-muted">
//                         Remember your password?{" "}
//                         <Link
//                           href="/login"
//                           className="text-primary text-decoration-none fw-semibold"
//                         >
//                           Back to Sign In
//                         </Link>
//                       </span>
//                     </div>
//                   </Card.Body>
//                 </Col>

//                 {/* Right Side - Hero Image */}
//                 <Col md={6} className="d-none d-md-block">
//                   <div
//                     className="h-100 position-relative d-flex align-items-center justify-content-center"
//                     style={{
//                       background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//                       minHeight: "600px",
//                     }}
//                   >
//                     {/* Decorative Elements */}
//                     <div className="text-center text-white p-5">
//                       <div className="mb-4">
//                         <div
//                           className="rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center"
//                           style={{
//                             width: "120px",
//                             height: "120px",
//                             background: "rgba(255, 255, 255, 0.1)",
//                             backdropFilter: "blur(10px)",
//                           }}
//                         >
//                           <svg
//                             width="60"
//                             height="60"
//                             viewBox="0 0 24 24"
//                             fill="none"
//                             xmlns="http://www.w3.org/2000/svg"
//                           >
//                             <path
//                               d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V17C3 18.11 3.89 19 5 19H11V21C11 21.55 11.45 22 12 22S13 21.55 13 21V19H19C20.11 19 21 18.11 21 17V9M19 17H5V3H13V9H19Z"
//                               fill="currentColor"
//                             />
//                           </svg>
//                         </div>
//                       </div>
//                       <h4 className="fw-bold mb-3">Secure Password Recovery</h4>
//                       <p className="opacity-75 mb-0" style={{ fontSize: "1.1rem" }}>
//                         We'll help you get back into your account safely and securely
//                       </p>
//                     </div>

//                     {/* Background Pattern */}
//                     <div
//                       className="position-absolute top-0 start-0 w-100 h-100 opacity-10"
//                       style={{
//                         backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
//                       }}
//                     ></div>
//                   </div>
//                 </Col>
//               </Row>
//             </Card>
//           </Col>
//         </Row>
//       </Container>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

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
      console.log("Response data:", data);

      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      if (data.otpToken) {
        localStorage.setItem("otpToken", data.otpToken);
        localStorage.setItem("otpEmail", email);
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes floatOrb {
          0%,100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-24px) scale(1.06); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(241,245,249,0.18); }
        input:focus {
          outline: none;
          border-color: rgba(99,102,241,0.55) !important;
          background: rgba(255,255,255,0.07) !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1), 0 0 18px rgba(99,102,241,0.07) !important;
        }
        [data-btn-primary]:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(99,102,241,0.5) !important;
        }
        [data-btn-primary]:active:not(:disabled) { transform: translateY(0); }
        @media (min-width: 900px) { [data-left] { display: flex !important; } }
        @media (max-width: 899px) { [data-right] { max-width: 100% !important; border-left: none !important; } }
      `}</style>

      <div style={s.root}>

        {/* ── LEFT PANEL ── */}
        <div data-left style={s.left}>
          <div style={s.leftBg} />
          <div style={s.gridOverlay} />
          <div style={{ ...s.orb, ...s.orb1 }} />
          <div style={{ ...s.orb, ...s.orb2 }} />
          <div style={{ ...s.orb, ...s.orb3 }} />
          <div style={s.leftContent}>
            <div style={s.divider} />
            <div style={s.tagline}>
              Density —<br />
              <span style={s.taglineSpan}>Happy to be</span><br />
              <em style={s.taglineEm}>bothered.</em>
            </div>
            <p style={s.leftSub}>
              Your workspace for data-driven decisions — precise, fast, and beautifully simple.
            </p>
            <div style={s.badgeRow}>
              {["Analytics", "Real-time", "Insights"].map((b) => (
                <span key={b} style={s.badge}>{b}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div data-right style={s.right}>
          <div style={{ ...s.rightInner, ...(mounted ? s.rightInnerMounted : {}) }}>

            <div style={s.logoWrap}>
              <Link href="/">
                <img src="/assets/density_logo_new_trans.png" alt="Density" style={s.logoImg} />
              </Link>
            </div>

            <h1 style={s.heading}>
              Forgot your <em style={s.headingEm}>password?</em>
            </h1>
            <p style={s.subtitle}>
              No worries — enter your email and we&apos;ll send you a reset link.
            </p>

            {error && (
              <div style={s.errorBox}>
                <svg style={s.errorIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div style={s.successBox}>
                <svg style={s.successIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
                {success}
              </div>
            )}

            <form style={s.form} onSubmit={handleSubmit}>
              <div style={s.field}>
                <label style={s.label}>Email address</label>
                <input
                  style={s.input}
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>

              <button
                data-btn-primary
                style={{ ...s.btnPrimary, ...(loading ? s.btnDisabled : {}) }}
                type="submit"
                disabled={loading}
              >
                <span style={s.btnInner}>
                  {loading && <span style={s.spinner} />}
                  {loading ? "Sending…" : "Send reset link →"}
                </span>
              </button>
            </form>

            <div style={s.linksRow}>
              <Link href="/login" style={s.linkBtn}>
                ← Back to sign in
              </Link>
            </div>

            <div style={s.footer}>
              © {new Date().getFullYear()} Density Pharmachem. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Styles ─── */
const s = {
  root: { minHeight: "100vh", display: "flex", fontFamily: "'DM Sans', sans-serif", background: "#0a0a0f", overflow: "hidden" },

  left: { flex: 1, position: "relative", overflow: "hidden", display: "none", flexDirection: "column", justifyContent: "flex-end" },
  leftBg: { position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 60% at 30% 40%, rgba(99,102,241,0.32) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 70% 70%, rgba(20,184,166,0.2) 0%, transparent 60%), linear-gradient(160deg, #0f0f1a 0%, #0a0a0f 100%)` },
  gridOverlay: { position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)`, backgroundSize: "58px 58px", pointerEvents: "none" },
  orb: { position: "absolute", borderRadius: "50%", filter: "blur(55px)", pointerEvents: "none" },
  orb1: { width: 280, height: 280, background: "radial-gradient(circle, rgba(99,102,241,0.5), transparent)", top: "8%", left: "4%", animation: "floatOrb 9s ease-in-out infinite" },
  orb2: { width: 200, height: 200, background: "radial-gradient(circle, rgba(20,184,166,0.45), transparent)", bottom: "16%", right: "8%", animation: "floatOrb 7s ease-in-out infinite", animationDelay: "-3s" },
  orb3: { width: 130, height: 130, background: "radial-gradient(circle, rgba(167,139,250,0.5), transparent)", top: "52%", left: "36%", animation: "floatOrb 11s ease-in-out infinite", animationDelay: "-6s" },
  leftContent: { position: "relative", zIndex: 1, padding: "64px" },
  divider: { width: 44, height: 1, background: "linear-gradient(90deg, #6366f1, transparent)", marginBottom: 20 },
  tagline: { fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2.4rem,3.2vw,3.8rem)", fontWeight: 300, color: "#f8fafc", lineHeight: 1.18, letterSpacing: "-0.02em", marginBottom: 20 },
  taglineSpan: { background: "linear-gradient(135deg,#818cf8,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" },
  taglineEm: { fontStyle: "italic", background: "linear-gradient(135deg,#c4b5fd,#6ee7b7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" },
  leftSub: { fontSize: "0.9rem", color: "rgba(248,250,252,0.38)", fontWeight: 300, letterSpacing: "0.04em", lineHeight: 1.75, maxWidth: 320, marginBottom: 28 },
  badgeRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  badge: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 100, padding: "5px 14px", fontSize: "0.72rem", color: "rgba(248,250,252,0.4)", letterSpacing: "0.07em" },

  right: { width: "100%", maxWidth: 480, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 40px", background: "#0d0d16", borderLeft: "1px solid rgba(99,102,241,0.1)", position: "relative" },
  rightInner: { width: "100%", maxWidth: 340, opacity: 0, transform: "translateY(18px)", transition: "opacity 0.65s ease, transform 0.65s ease" },
  rightInnerMounted: { opacity: 1, transform: "translateY(0)" },

  logoWrap: { marginBottom: 48 },
  logoImg: { height: 42, width: "auto", objectFit: "contain" },
  heading: { fontFamily: "'Cormorant Garamond', serif", fontSize: "2.5rem", fontWeight: 400, color: "#f1f5f9", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 10 },
  headingEm: { fontStyle: "italic", color: "#818cf8" },
  subtitle: { fontSize: "0.875rem", color: "rgba(241,245,249,0.38)", fontWeight: 300, letterSpacing: "0.02em", marginBottom: 36 },

  errorBox: { display: "flex", alignItems: "center", gap: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 10, padding: "12px 16px", marginBottom: 22, fontSize: "0.84rem", color: "#fca5a5", letterSpacing: "0.01em" },
  errorIcon: { width: 16, height: 16, flexShrink: 0, color: "#ef4444" },
  successBox: { display: "flex", alignItems: "center", gap: 10, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.22)", borderRadius: 10, padding: "14px 16px", marginBottom: 22, fontSize: "0.84rem", color: "#6ee7b7", letterSpacing: "0.01em" },
  successIcon: { width: 16, height: 16, flexShrink: 0, color: "#34d399" },

  form: { display: "flex", flexDirection: "column" },
  field: { marginBottom: 18 },
  label: { display: "block", fontSize: "0.7rem", fontWeight: 500, color: "rgba(241,245,249,0.38)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 },
  input: { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 10, padding: "13px 16px", fontSize: "0.92rem", color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", fontWeight: 300, outline: "none", transition: "border-color 0.22s, background 0.22s, box-shadow 0.22s", WebkitAppearance: "none" },

  btnPrimary: { width: "100%", padding: "14px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: "0.92rem", fontWeight: 500, letterSpacing: "0.04em", cursor: "pointer", overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s, opacity 0.2s", boxShadow: "0 4px 22px rgba(99,102,241,0.35)", marginTop: 6 },
  btnDisabled: { opacity: 0.55, cursor: "not-allowed" },
  btnInner: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10 },
  spinner: { display: "inline-block", width: 15, height: 15, border: "2px solid rgba(255,255,255,0.28)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 },

  linksRow: { display: "flex", justifyContent: "flex-start", marginTop: 20 },
  linkBtn: { background: "none", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "rgba(129,140,248,0.65)", cursor: "pointer", padding: 0, letterSpacing: "0.02em", textDecoration: "none" },

  footer: { marginTop: 48, fontSize: "0.72rem", color: "rgba(241,245,249,0.18)", letterSpacing: "0.06em", textAlign: "center" },
};