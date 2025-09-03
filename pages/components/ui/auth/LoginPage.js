

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
//   const { setUser, isAuthenticated } = useAuth();
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

//   useEffect(() => {
//     if (isAuthenticated) {
//       router.push("/");
//     }
//   }, [isAuthenticated, router]);

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
//             localStorage.setItem("token", data.token);
//             router.push(
//               `/set-password?email=${encodeURIComponent(data.user.email || "")}`
//             );
//             return; // Important: return here to prevent further execution

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

//             console.log(
//               "Token in localStorage:",
//               localStorage.getItem("token")
//             );

//             setTimeout(() => {
//               router.push("/");
//             }, 100);
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
//                           disabled={loginState.isLoading}
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
//                       // backgroundImage: "url(/assets/densitY_Hero-Banner.jpg)",
//                       backgroundImage: "url(/assets/dashboard.jpeg)",
//                       backgroundSize: "cover",
//                       backgroundPosition: "center",
//                       backgroundRepeat: "no-repeat",
//                       minHeight: "600px",
//                     }}
//                   >
//                     {/* Optional overlay for better text readability if needed */}
//                     <div
//                       className="position-absolute top-0 start-0 w-100 h-100"
//                       style={{
//                         background:
//                           "linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)",
//                       }}
//                     ></div>

//                     {/* Optional content overlay on the image */}
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
import {
  Card,
  Form,
  Button,
  Alert,
  Container,
  Row,
  Col,
} from "react-bootstrap";
import { useAuth } from "contexts/AuthContext";

export default function LoginPage() {
  const { setUser, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loginState, setLoginState] = useState({
    showPassword: false,
    error: "",
    isLoading: false,
  });
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Wait for auth context to finish loading before checking authentication
    if (!loading && isAuthenticated && !isRedirecting) {
      setIsRedirecting(true);
      router.push("/");
    }
  }, [isAuthenticated, loading, router, isRedirecting]);

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
      console.log("[LOGIN RESPONSE]", data);

      if (response.ok) {
        switch (data.message) {
          case "PASSWORD_NOT_SET":
            if (!data.token || !data.user) {
              throw new Error("Missing token or user information.");
            }
            // Store token but don't set user in auth context yet
            localStorage.setItem("token", data.token);
            setIsRedirecting(true);
            router.push(
              `/set-password?email=${encodeURIComponent(data.user.email || "")}`
            );
            return;

          case "SHOW_PASSWORD_FIELD":
            setLoginState((prev) => ({
              ...prev,
              showPassword: true,
            }));
            break;

          case "Login_successful":
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
              token: data.token,
            };

            setUser(userData);
            console.log("[LOGIN][SUCCESS]", {
              email: userData.email,
              contactCodes: userData.contactCodes,
            });

            setIsRedirecting(true);
            // Use replace instead of push to prevent back navigation to login
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
      setLoginState((prev) => ({
        ...prev,
        error: error.message || "An unexpected error occurred",
      }));
    } finally {
      setLoginState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Show loading spinner while auth context is loading
  if (loading) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render form if user is authenticated and redirecting
  if (isAuthenticated && isRedirecting) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Redirecting...</span>
          </div>
          <p className="mt-2 text-muted">Redirecting...</p>
        </div>
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
                {/* Left Side - Login Form */}
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
                      <h3 className="fw-bold text-dark mb-2">Welcome Back</h3>
                      <p className="text-muted">
                        Sign in to your account to continue
                      </p>
                    </div>

                    {/* Error Alert */}
                    {loginState.error && (
                      <Alert variant="danger" dismissible className="mb-4">
                        {loginState.error}
                      </Alert>
                    )}

                    {/* Login Form */}
                    <Form onSubmit={handleLogin}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                          Email Address
                        </Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter your email"
                          required
                          size="lg"
                          className="border-2"
                        />
                      </Form.Group>

                      {loginState.showPassword && (
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-semibold">
                            Password
                          </Form.Label>
                          <Form.Control
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Enter your password"
                            required
                            size="lg"
                            className="border-2"
                          />
                        </Form.Group>
                      )}

                      <div className="d-grid mb-4">
                        <Button
                          variant="primary"
                          type="submit"
                          disabled={loginState.isLoading || isRedirecting}
                          size="lg"
                          className="fw-semibold py-3"
                        >
                          {loginState.isLoading ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              Signing In...
                            </>
                          ) : (
                            "Continue"
                          )}
                        </Button>
                      </div>
                    </Form>

                    {/* Forgot Password Link */}
                    <div className="text-center">
                      <Link
                        href="/forgot-password"
                        className="text-primary text-decoration-none"
                      >
                        <small>Forgot your password?</small>
                      </Link>
                    </div>
                  </Card.Body>
                </Col>

                {/* Right Side - Hero Image */}
                <Col md={6} className="d-none d-md-block">
                  <div
                    className="h-100 position-relative"
                    style={{
                      backgroundImage: "url(/assets/dashboard.jpeg)",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      minHeight: "600px",
                    }}
                  >
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)",
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