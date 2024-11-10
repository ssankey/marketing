// // utils/auth.js

// export async function loginUser(username, password) {
//   const response = await fetch("/api/auth/login", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ username, password }),
//   });

//   const data = await response.json();

//   if (data.success) {
//     localStorage.setItem("token", data.token);
//     return { success: true, token: data.token };
//   } else {
//     return { success: false, message: data.message };
//   }
// }

// import { useRouter } from "next/router";
// import { useEffect, useState } from "react";

// export function useAuth() {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const router = typeof window !== "undefined" ? useRouter() : null;

//   useEffect(() => {
//     // Check if running on the client side and `router` is defined
//     if (!router) return;

//     const token = localStorage.getItem("token");
//     if (token) {
//       setIsAuthenticated(true);
//     } else {
//       setIsAuthenticated(false);
//       router.push("/login"); // Redirect to login if unauthenticated
//     }
//   }, [router]);

//   return isAuthenticated;
// }

// import { useRouter } from "next/router";
// import { useEffect, useState } from "react";

// export function useAuth() {
//   const [isAuthenticated, setIsAuthenticated] = useState(null); // Start with null to indicate "loading"
//   const router = useRouter();

//   useEffect(() => {
//     if (typeof window === "undefined") return; // Exit if server-side

//     // Client-side check for authentication token
//     const token = localStorage.getItem("token");

//     if (token) {
//       setIsAuthenticated(true);
//     } else {
//       setIsAuthenticated(false);
//       router.push("/login"); // Redirect to login if not authenticated
//     }
//   }, [router]);

//   return isAuthenticated;
// }


import { useEffect, useState } from "react";
import { useRouter } from "next/router";

// export function useAuth() {
//   const [isAuthenticated, setIsAuthenticated] = useState(null); // `null` means loading state
//   const router = useRouter();

//   useEffect(() => {
//     if (typeof window === "undefined") return; // Ensure hook only runs on the client

//     const token = localStorage.getItem("token");
//     if (token) {
//       setIsAuthenticated(true);
//     } else {
//       setIsAuthenticated(false);
//     }
//   }, []);

//   // Optional client-side redirect if needed elsewhere
//   useEffect(() => {
//     if (isAuthenticated === false) {
//       router.push("/login");
//     }
//   }, [isAuthenticated, router]);

//   return isAuthenticated;
// }


// In utils/auth.js
// export async function loginUser(username, password) {
//   try {
//     const response = await fetch("/api/auth/login", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ username, password }),
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       return { success: false, message: errorData.message || "Login failed" };
//     }

//     const data = await response.json();
//     localStorage.setItem("token", data.token); // Only if token storage is managed here

//     return { success: true, token: data.token };
//   } catch (error) {
//     return { success: false, message: "Network error, please try again." };
//   }
// }


// utils/auth.js
export async function loginUser(username, password) {
  // Hardcoded credentials for testing purposes only
  const hardcodedUsername = "testUser";
  const hardcodedPassword = "testPassword";

  // Check if the provided credentials match the hardcoded ones
  if (username === hardcodedUsername && password === hardcodedPassword) {
    // Simulate a token and success response
    const token = "fakeToken123"; // This token would typically come from your server
    localStorage.setItem("token", token); // Store token in local storage for authenticated sessions
    return { success: true, token };
  } else {
    // Return failure message if credentials do not match
    return { success: false, message: "Invalid username or password" };
  }
}
