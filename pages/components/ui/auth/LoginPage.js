
// 'use client';
// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/router";
// import Link from "next/link";
// import {
//   Card,
//   Form,
//   Button,
//   Alert,
//   Container,
//   Row,
//   Col,
// } from "react-bootstrap";
// import { useAuth } from "contexts/AuthContext";

// export default function LoginPage() {
//   const { setUser, isAuthenticated, loading } = useAuth();
//   const router = useRouter();
//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//   });
//   const [loginState, setLoginState] = useState({
//     showPassword: false,
//     error: "",
//     isLoading: false,
//   });
//   const [isRedirecting, setIsRedirecting] = useState(false);

//   useEffect(() => {
//     // Wait for auth context to finish loading before checking authentication
//     if (!loading && isAuthenticated && !isRedirecting) {
//       setIsRedirecting(true);
//       router.push("/");
//     }
//   }, [isAuthenticated, loading, router, isRedirecting]);

//   const handleInputChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setLoginState((prev) => ({ ...prev, isLoading: true, error: "" }));

//     try {
//       const response = await fetch("/api/auth/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           email: formData.email,
//           password: formData.password,
//         }),
//       });

//       const data = await response.json();
//       console.log("[LOGIN RESPONSE]", data);

//       if (response.ok) {
//         switch (data.message) {
//           case "PASSWORD_NOT_SET":
//             if (!data.token || !data.user) {
//               throw new Error("Missing token or user information.");
//             }
//             // Store token but don't set user in auth context yet
//             localStorage.setItem("token", data.token);
//             setIsRedirecting(true);
//             router.push(
//               `/set-password?email=${encodeURIComponent(data.user.email || "")}`
//             );
//             return;

//           case "SHOW_PASSWORD_FIELD":
//             setLoginState((prev) => ({
//               ...prev,
//               showPassword: true,
//             }));
//             break;

//           case "Login_successful":
//             if (!data.token || !data.user) {
//               throw new Error("Missing token or user information.");
//             }

//             const userData = {
//               email: data.user.email || "",
//               role: data.user.role || "",
//               name: data.user.name || "",
//               contactCodes: Array.isArray(data.user.contactCodes)
//                 ? data.user.contactCodes
//                 : data.user.contactCodes
//                   ? [data.user.contactCodes]
//                   : [],
//               token: data.token,
//             };

//             setUser(userData);
//             console.log("[LOGIN][SUCCESS]", {
//               email: userData.email,
//               contactCodes: userData.contactCodes,
//             });

//             setIsRedirecting(true);
//             // Use replace instead of push to prevent back navigation to login
//             router.replace("/");
//             break;

//           default:
//             throw new Error("Unexpected response");
//         }
//       } else {
//         throw new Error(data.message || "Login failed");
//       }
//     } catch (error) {
//       console.error("[LOGIN ERROR]", error);
//       setLoginState((prev) => ({
//         ...prev,
//         error: error.message || "An unexpected error occurred",
//       }));
//     } finally {
//       setLoginState((prev) => ({ ...prev, isLoading: false }));
//     }
//   };

//   // Show loading spinner while auth context is loading
//   if (loading) {
//     return (
//       <div className="vh-100 d-flex justify-content-center align-items-center">
//         <div className="text-center">
//           <div className="spinner-border text-primary" role="status">
//             <span className="visually-hidden">Loading...</span>
//           </div>
//           <p className="mt-2 text-muted">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   // Don't render form if user is authenticated and redirecting
//   if (isAuthenticated && isRedirecting) {
//     return (
//       <div className="vh-100 d-flex justify-content-center align-items-center">
//         <div className="text-center">
//           <div className="spinner-border text-primary" role="status">
//             <span className="visually-hidden">Redirecting...</span>
//           </div>
//           <p className="mt-2 text-muted">Redirecting...</p>
//         </div>
//       </div>
//     );
//   }

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
//                 {/* Left Side - Login Form */}
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
//                       <h3 className="fw-bold text-dark mb-2">Welcome Back</h3>
//                       <p className="text-muted">
//                         Sign in to your account to continue
//                       </p>
//                     </div>

//                     {/* Error Alert */}
//                     {loginState.error && (
//                       <Alert variant="danger" dismissible className="mb-4">
//                         {loginState.error}
//                       </Alert>
//                     )}

//                     {/* Login Form */}
//                     <Form onSubmit={handleLogin}>
//                       <Form.Group className="mb-3">
//                         <Form.Label className="fw-semibold">
//                           Email Address
//                         </Form.Label>
//                         <Form.Control
//                           type="email"
//                           name="email"
//                           value={formData.email}
//                           onChange={handleInputChange}
//                           placeholder="Enter your email"
//                           required
//                           size="lg"
//                           className="border-2"
//                         />
//                       </Form.Group>

//                       {loginState.showPassword && (
//                         <Form.Group className="mb-4">
//                           <Form.Label className="fw-semibold">
//                             Password
//                           </Form.Label>
//                           <Form.Control
//                             type="password"
//                             name="password"
//                             value={formData.password}
//                             onChange={handleInputChange}
//                             placeholder="Enter your password"
//                             required
//                             size="lg"
//                             className="border-2"
//                           />
//                         </Form.Group>
//                       )}

//                       <div className="d-grid mb-4">
//                         <Button
//                           variant="primary"
//                           type="submit"
//                           disabled={loginState.isLoading || isRedirecting}
//                           size="lg"
//                           className="fw-semibold py-3"
//                         >
//                           {loginState.isLoading ? (
//                             <>
//                               <span
//                                 className="spinner-border spinner-border-sm me-2"
//                                 role="status"
//                                 aria-hidden="true"
//                               ></span>
//                               Signing In...
//                             </>
//                           ) : (
//                             "Continue"
//                           )}
//                         </Button>
//                       </div>
//                     </Form>

//                     {/* Forgot Password Link */}
//                     <div className="text-center">
//                       <Link
//                         href="/forgot-password"
//                         className="text-primary text-decoration-none"
//                       >
//                         <small>Forgot your password?</small>
//                       </Link>
//                     </div>
//                   </Card.Body>
//                 </Col>

//                 {/* Right Side - Hero Image */}
//                 <Col md={6} className="d-none d-md-block">
//                   <div
//                     className="h-100 position-relative"
//                     style={{
//                       backgroundImage: "url(/assets/dashboard.jpeg)",
//                       backgroundSize: "cover",
//                       backgroundPosition: "center",
//                       backgroundRepeat: "no-repeat",
//                       minHeight: "600px",
//                     }}
//                   >
//                     <div
//                       className="position-absolute top-0 start-0 w-100 h-100"
//                       style={{
//                         background:
//                           "linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)",
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

'use client';
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "contexts/AuthContext";

export default function LoginPage() {
  const { setUser, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loginState, setLoginState] = useState({
    showPassword: false,
    error: "",
    isLoading: false,
  });
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!loading && isAuthenticated && !isRedirecting) {
      setIsRedirecting(true);
      router.push("/");
    }
  }, [isAuthenticated, loading, router, isRedirecting]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginState((prev) => ({ ...prev, isLoading: true, error: "" }));

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      const data = await response.json();
      console.log("[LOGIN RESPONSE]", data);

      if (response.ok) {
        switch (data.message) {
          case "PASSWORD_NOT_SET":
            if (!data.token || !data.user) throw new Error("Missing token or user information.");
            localStorage.setItem("token", data.token);
            setIsRedirecting(true);
            router.push(`/set-password?email=${encodeURIComponent(data.user.email || "")}`);
            return;

          case "SHOW_PASSWORD_FIELD":
            setLoginState((prev) => ({ ...prev, showPassword: true }));
            break;

          case "Login_successful":
            if (!data.token || !data.user) throw new Error("Missing token or user information.");
            const userData = {
              email: data.user.email || "",
              role: data.user.role || "",
              name: data.user.name || "",
              contactCodes: Array.isArray(data.user.contactCodes)
                ? data.user.contactCodes
                : data.user.contactCodes ? [data.user.contactCodes] : [],
              token: data.token,
            };
            setUser(userData);
            console.log("[LOGIN][SUCCESS]", { email: userData.email, contactCodes: userData.contactCodes });
            setIsRedirecting(true);
            router.replace("/");
            break;

          default:
            throw new Error("Unexpected response");
        }
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("[LOGIN ERROR]", error);
      setLoginState((prev) => ({ ...prev, error: error.message || "An unexpected error occurred" }));
    } finally {
      setLoginState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div style={s.fullscreen}>
        <span style={s.spinnerLg} />
        <p style={s.spinnerLabel}>Loading…</p>
      </div>
    );
  }

  /* ── Redirecting state ── */
  if (isAuthenticated && isRedirecting) {
    return (
      <div style={s.fullscreen}>
        <span style={s.spinnerLg} />
        <p style={s.spinnerLabel}>Redirecting…</p>
      </div>
    );
  }

  const isDisabled = loginState.isLoading || isRedirecting;

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
        @keyframes spinLg { to { transform: rotate(360deg); } }
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
        @media (min-width: 900px)  { [data-left]  { display: flex !important; } }
        @media (max-width: 899px)  { [data-right] { max-width: 100% !important; border-left: none !important; } }
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
              {loginState.showPassword
                ? <>Enter your <em style={s.headingEm}>password.</em></>
                : <>Welcome <em style={s.headingEm}>back.</em></>}
            </h1>
            <p style={s.subtitle}>
              {loginState.showPassword
                ? "Almost there — one last step."
                : "Sign in to continue to your workspace."}
            </p>

            {loginState.error && (
              <div style={s.errorBox}>
                <svg style={s.errorIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {loginState.error}
              </div>
            )}

            <form style={s.form} onSubmit={handleLogin}>

              {/* Email chip (shown after moving to password step) */}
              {loginState.showPassword && (
                <div style={s.emailChip}>
                  <span style={s.chipDot} />
                  <span style={s.chipText}>{formData.email}</span>
                </div>
              )}

              {/* Email field */}
              {!loginState.showPassword && (
                <div style={s.field}>
                  <label style={s.label}>Email address</label>
                  <input
                    style={s.input}
                    type="email"
                    name="email"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isDisabled}
                    autoFocus
                  />
                </div>
              )}

              {/* Password field */}
              {loginState.showPassword && (
                <div style={s.field}>
                  <label style={s.label}>Password</label>
                  <input
                    style={s.input}
                    type="password"
                    name="password"
                    placeholder="••••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={isDisabled}
                    autoFocus
                  />
                </div>
              )}

              <button
                data-btn-primary
                style={{ ...s.btnPrimary, ...(isDisabled ? s.btnDisabled : {}) }}
                type="submit"
                disabled={isDisabled}
              >
                <span style={s.btnInner}>
                  {loginState.isLoading && <span style={s.spinner} />}
                  {loginState.isLoading
                    ? (loginState.showPassword ? "Signing in…" : "Checking…")
                    : "Continue →"}
                </span>
              </button>

              {loginState.showPassword && (
                <div style={s.linksRow}>
                  <button
                    type="button"
                    style={s.linkBtn}
                    onClick={() => {
                      setLoginState((prev) => ({ ...prev, showPassword: false, error: "" }));
                      setFormData((prev) => ({ ...prev, password: "" }));
                    }}
                  >
                    ← Different email
                  </button>
                  <Link href={`/forgot-password?email=${encodeURIComponent(formData.email)}`} style={s.linkBtn}>
                    Forgot password?
                  </Link>
                </div>
              )}

              {!loginState.showPassword && (
                <div style={{ ...s.linksRow, justifyContent: "center" }}>
                  <Link href="/forgot-password" style={s.linkBtn}>
                    Forgot password?
                  </Link>
                </div>
              )}
            </form>

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
  fullscreen: {
    minHeight: "100vh", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    background: "#0a0a0f", fontFamily: "'DM Sans', sans-serif",
  },
  spinnerLg: {
    display: "inline-block", width: 36, height: 36,
    border: "3px solid rgba(99,102,241,0.2)",
    borderTopColor: "#6366f1", borderRadius: "50%",
    animation: "spinLg 0.8s linear infinite",
  },
  spinnerLabel: { marginTop: 14, fontSize: "0.85rem", color: "rgba(241,245,249,0.35)" },

  root: {
    minHeight: "100vh", display: "flex",
    fontFamily: "'DM Sans', sans-serif",
    background: "#0a0a0f", overflow: "hidden",
  },
  left: {
    flex: 1, position: "relative", overflow: "hidden",
    display: "none", flexDirection: "column", justifyContent: "flex-end",
  },
  leftBg: {
    position: "absolute", inset: 0,
    background: `
      radial-gradient(ellipse 80% 60% at 30% 40%, rgba(99,102,241,0.32) 0%, transparent 60%),
      radial-gradient(ellipse 60% 80% at 70% 70%, rgba(20,184,166,0.2) 0%, transparent 60%),
      linear-gradient(160deg, #0f0f1a 0%, #0a0a0f 100%)`,
  },
  gridOverlay: {
    position: "absolute", inset: 0,
    backgroundImage: `
      linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)`,
    backgroundSize: "58px 58px", pointerEvents: "none",
  },
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

  form: { display: "flex", flexDirection: "column" },
  field: { marginBottom: 18 },
  label: { display: "block", fontSize: "0.7rem", fontWeight: 500, color: "rgba(241,245,249,0.38)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 },
  input: { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 10, padding: "13px 16px", fontSize: "0.92rem", color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", fontWeight: 300, outline: "none", transition: "border-color 0.22s, background 0.22s, box-shadow 0.22s", WebkitAppearance: "none" },

  emailChip: { display: "flex", alignItems: "center", gap: 10, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 10, padding: "11px 15px", marginBottom: 18 },
  chipDot: { width: 7, height: 7, borderRadius: "50%", background: "#6366f1", flexShrink: 0, boxShadow: "0 0 8px rgba(99,102,241,0.9)" },
  chipText: { fontSize: "0.88rem", color: "rgba(241,245,249,0.6)", fontWeight: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },

  btnPrimary: { width: "100%", padding: "14px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: "0.92rem", fontWeight: 500, letterSpacing: "0.04em", cursor: "pointer", position: "relative", overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s, opacity 0.2s", boxShadow: "0 4px 22px rgba(99,102,241,0.35)", marginTop: 6 },
  btnDisabled: { opacity: 0.55, cursor: "not-allowed" },
  btnInner: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10 },
  spinner: { display: "inline-block", width: 15, height: 15, border: "2px solid rgba(255,255,255,0.28)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 },

  linksRow: { display: "flex", justifyContent: "space-between", marginTop: 20 },
  linkBtn: { background: "none", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "rgba(129,140,248,0.65)", cursor: "pointer", padding: 0, letterSpacing: "0.02em", textDecoration: "none", transition: "color 0.2s" },

  footer: { marginTop: 48, fontSize: "0.72rem", color: "rgba(241,245,249,0.18)", letterSpacing: "0.06em", textAlign: "center" },
};