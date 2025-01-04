// pages/login.js (or wherever your login page component is located)
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Card, Form, Button, Alert } from "react-bootstrap";
import { useAuth } from "contexts/AuthContext";

export default function LoginPage() {
  const { setUser } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loginState, setLoginState] = useState({
    showPassword: false,
    error: "",
    isLoading: false
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/");
    }
  }, [router]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginState(prev => ({ ...prev, isLoading: true, error: "" }));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        switch (data.message) {
          case 'PASSWORD_NOT_SET':
            localStorage.setItem('token', data.token);
            router.push(`/set-password?email=${encodeURIComponent(data.email)}`);
            break;
          case 'SHOW_PASSWORD_FIELD':
            setLoginState(prev => ({
              ...prev,
              showPassword: true
            }));
            break;
          case 'Login_successful':
            const userData = {
              ...data.user,
              token: data.token
            };
            setUser(userData);
            router.push('/');
            break;
          default:
            throw new Error('Unexpected response');
        }
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      setLoginState(prev => ({
        ...prev,
        error: error.message || 'An unexpected error occurred'
      }));
    } finally {
      setLoginState(prev => ({ ...prev, isLoading: false }));
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
                required
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
                  required
                />
              </Form.Group>
            )}
            
            <div className="d-grid mb-3">
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loginState.isLoading}
              >
                {loginState.isLoading ? "Signing In..." : "Continue"}
              </Button>
            </div>

            <div className="d-flex justify-content-between">
              <Link href="/signup" className="text-primary">
                Create an Account
              </Link>
              <Link href="/forgot-password" className="text-primary">
                Forgot password?
              </Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}