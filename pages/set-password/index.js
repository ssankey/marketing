// pages/set-password/index.js
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import Link from "next/link";

export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

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
        headers: { "Content-Type": "application/json" },
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

  const togglePasswordVisibility = () => setPasswordVisible((v) => !v);

  const sharedStyles = (
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
  );

  if (!email) {
    return (
      <>
        {sharedStyles}
        <div style={s.root}>
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

          <div data-right style={s.right}>
            <div style={{ ...s.rightInner, ...(mounted ? s.rightInnerMounted : {}) }}>
              <div style={s.logoWrap}>
                <Link href="/">
                  <img src="/assets/density_logo_new_trans.png" alt="Density" style={s.logoImg} />
                </Link>
              </div>

              <h1 style={s.heading}>
                Invalid <em style={s.headingEm}>access.</em>
              </h1>
              <p style={s.subtitle}>
                Invalid or missing email parameter. Please use a valid password reset link.
              </p>

              <Link href="/login" style={s.btnPrimary}>
                <span style={s.btnInner}>Back to login →</span>
              </Link>

              <div style={s.footer}>
                © {new Date().getFullYear()} Density Pharmachem. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {sharedStyles}

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
              Set a new <em style={s.headingEm}>password.</em>
            </h1>
            <p style={s.subtitle}>
              Setting password for <strong style={{ color: "rgba(241,245,249,0.6)" }}>{email}</strong>
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
                Password set successfully! Redirecting to login…
              </div>
            )}

            {!success && (
              <form style={s.form} onSubmit={handleSubmit}>
                <div style={s.field}>
                  <label style={s.label}>New password</label>
                  <div style={s.inputWrapper}>
                    <input
                      style={s.input}
                      type={passwordVisible ? "text" : "password"}
                      placeholder="••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      autoFocus
                    />
                    <button
                      type="button"
                      style={s.toggleBtn}
                      onClick={togglePasswordVisibility}
                      aria-label={passwordVisible ? "Hide password" : "Show password"}
                    >
                      {passwordVisible ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 7C12.5304 7 13.0391 7.21071 13.4142 7.58579C13.7893 7.96086 14 8.46957 14 9C14 9.53043 13.7893 10.0391 13.4142 10.4142C13.0391 10.7893 12.5304 11 12 11C11.4696 11 10.9609 10.7893 10.5858 10.4142C10.2107 10.0391 10 9.53043 10 9C10 8.46957 10.2107 7.96086 10.5858 7.58579C10.9609 7.21071 11.4696 7 12 7ZM12 5C7 5 2.73 8.11 1 12C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 12C21.27 8.11 17 5 12 5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" fill="currentColor" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.83 9L15 12.16C15 12.11 15 12.05 15 12C15 10.34 13.66 9 12 9C11.94 9 11.89 9 11.83 9ZM7.53 9.8L9.08 11.35C9.03 11.56 9 11.77 9 12C9 13.66 10.34 15 12 15C12.22 15 12.44 14.97 12.65 14.92L14.2 16.47C13.53 16.8 12.79 17 12 17C9.24 17 7 14.76 7 12C7 11.21 7.2 10.47 7.53 9.8ZM2 4.27L4.28 6.55L4.73 7C3.08 8.3 1.78 10 1 12C2.73 15.89 7 19 12 19C13.55 19 15.03 18.7 16.38 18.18L16.81 18.61L19.73 21.53L21 20.27L3.27 2.5L2 4.27ZM12 7C14.76 7 17 9.24 17 12C17 12.64 16.87 13.26 16.64 13.82L19.57 16.75C21.07 15.5 22.27 13.86 23 12C21.27 8.11 17 5 12 5C10.6 5 9.26 5.26 8.04 5.73L10.17 7.86C10.74 7.13 11.81 6.4 12 7Z" fill="currentColor" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p style={s.hint}>Must be at least 8 characters</p>
                </div>

                <div style={s.field}>
                  <label style={s.label}>Confirm new password</label>
                  <input
                    style={s.input}
                    type={passwordVisible ? "text" : "password"}
                    placeholder="••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <button
                  data-btn-primary
                  style={{ ...s.btnPrimary, ...(isLoading ? s.btnDisabled : {}) }}
                  type="submit"
                  disabled={isLoading}
                >
                  <span style={s.btnInner}>
                    {isLoading && <span style={s.spinner} />}
                    {isLoading ? "Setting password…" : "Set password →"}
                  </span>
                </button>
              </form>
            )}

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

SetPasswordPage.displayName = "SetPasswordPage";

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
  inputWrapper: { position: "relative" },
  toggleBtn: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", padding: 4, cursor: "pointer", color: "rgba(241,245,249,0.35)", display: "flex", alignItems: "center" },
  hint: { fontSize: "0.72rem", color: "rgba(241,245,249,0.3)", fontWeight: 300, letterSpacing: "0.02em", marginTop: 8 },

  btnPrimary: { width: "100%", padding: "14px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: "0.92rem", fontWeight: 500, letterSpacing: "0.04em", cursor: "pointer", overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s, opacity 0.2s", boxShadow: "0 4px 22px rgba(99,102,241,0.35)", marginTop: 6, textAlign: "center", textDecoration: "none", display: "block", boxSizing: "border-box" },
  btnDisabled: { opacity: 0.55, cursor: "not-allowed" },
  btnInner: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10 },
  spinner: { display: "inline-block", width: 15, height: 15, border: "2px solid rgba(255,255,255,0.28)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 },

  linksRow: { display: "flex", justifyContent: "flex-start", marginTop: 20 },
  linkBtn: { background: "none", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "rgba(129,140,248,0.65)", cursor: "pointer", padding: 0, letterSpacing: "0.02em", textDecoration: "none" },

  footer: { marginTop: 48, fontSize: "0.72rem", color: "rgba(241,245,249,0.18)", letterSpacing: "0.06em", textAlign: "center" },
};
