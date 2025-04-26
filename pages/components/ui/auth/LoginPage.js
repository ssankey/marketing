import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Card, Form, Button, Alert } from "react-bootstrap";
import { useAuth } from "contexts/AuthContext";

export default function LoginPage() {
  const { setUser, isAuthenticated } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loginState, setLoginState] = useState({
    showPassword: false,
    error: "",
    isLoading: false,
    isDevelopment: process.env.NODE_ENV === "development",
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
    
    // Auto-login in development mode
    if (loginState.isDevelopment) {
      handleDevLogin();
    }
  }, [isAuthenticated, router]);

  // Development mode auto-login
  const handleDevLogin = async () => {
    if (!loginState.isDevelopment) return;
    
    console.log("[DEV MODE] Attempting automatic login");
    setLoginState((prev) => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "dev@example.com",
          password: "",
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.devMode) {
        console.log("[DEV MODE] Auto-login successful");
        
        const userData = {
          email: data.user.email || "dev@example.com",
          role: data.user.role || "admin",
          name: data.user.name || "Development User",
          contactCodes: data.user.contactCodes || ["DEV001"],
          cardCodes: data.user.cardCodes || ["DEV001"],
          token: data.token,
        };

        setUser(userData);
        setTimeout(() => {
          router.push("/");
        }, 100);
      } else {
        console.warn("[DEV MODE] Auto-login failed - dev mode might not be enabled on the server");
        setLoginState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error("[DEV MODE] Auto-login error:", error);
      setLoginState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginState((prev) => ({ ...prev, isLoading: true, error: "" }));

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();
      console.log("[LOGIN RESPONSE]", data); // Helpful for debugging

      if (response.ok) {
        // Special handling for dev mode response
        if (data.devMode) {
          console.log("[DEV MODE] Login successful");
          const userData = {
            email: data.user.email || "dev@example.com",
            role: data.user.role || "admin",
            name: data.user.name || "Development User",
            contactCodes: data.user.contactCodes || ["DEV001"],
            cardCodes: data.user.cardCodes || ["DEV001"],
            token: data.token,
          };

          setUser(userData);
          setTimeout(() => {
            router.push("/");
          }, 100);
          return;
        }
        
        // Regular response handling
        switch (data.message) {
          case "PASSWORD_NOT_SET":
            if (!data.token || !data.user) {
              throw new Error("Missing token or user information.");
            }
            localStorage.setItem("token", data.token);
            router.push(
              `/set-password?email=${encodeURIComponent(data.user.email || "")}`
            );
            break;

          case "SHOW_PASSWORD_FIELD":
            setLoginState((prev) => ({
              ...prev,
              showPassword: true,
            }));
            break;

          case "Login_successful":
          case "Dev_Login_successful":
            if (!data.token || !data.user) {
              throw new Error("Missing token or user information.");
            }

            const userData = {
              email: data.user.email || "",
              role: data.user.role || "",
              name: data.user.name || "",
              contactCodes: Array.isArray(data.user.contactCodes)
                ? data.user.contactCodes
                : data.user.contactCodes
                ? [data.user.contactCodes]
                : [],
              cardCodes: Array.isArray(data.user.cardCodes)
                ? data.user.cardCodes
                : data.user.cardCodes
                ? [data.user.cardCodes]
                : [],
              token: data.token,
            };

            setUser(userData); // Store via context + localStorage
            console.log("[LOGIN][SUCCESS]", {
              email: userData.email,
              role: userData.role,
              contactCodes: userData.contactCodes,
            });

            console.log("Token in localStorage:", localStorage.getItem("token"));

            setTimeout(() => {
              router.push("/");
            }, 100);
            break;

          default:
            throw new Error("Unexpected response");
        }
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("[LOGIN ERROR]", error);
      setLoginState((prev) => ({
        ...prev,
        error: error.message || "An unexpected error occurred",
      }));
    } finally {
      setLoginState((prev) => ({ ...prev, isLoading: false }));
    }
  };

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
            {loginState.isDevelopment && (
              <Alert variant="info" className="mb-3 py-2">
                <small>Development Mode Active</small>
              </Alert>
            )}
          </div>

          {loginState.error && (
            <Alert variant="danger" dismissible>
              {loginState.error}
            </Alert>
          )}

          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required={!loginState.isDevelopment}
              />
            </Form.Group>

            {loginState.showPassword && (
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required={!loginState.isDevelopment}
                />
              </Form.Group>
            )}

            <div className="d-grid mb-3">
              <Button
                variant="primary"
                type="submit"
                disabled={loginState.isLoading}
              >
                {loginState.isLoading 
                  ? (loginState.isDevelopment ? "Auto-Signing In..." : "Signing In...") 
                  : "Continue"}
              </Button>
            </div>
            
            {loginState.isDevelopment && !loginState.isLoading && (
              <div className="text-center mt-2">
                <small>
                  <Button variant="link" size="sm" className="p-0" onClick={handleDevLogin}>
                    Use Dev Login
                  </Button>
                </small>
              </div>
            )}
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}