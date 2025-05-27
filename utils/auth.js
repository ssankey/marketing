//utils/auth.js

import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

export const getUser = () => {
  if (typeof window !== "undefined") {
    try {
      // Try to get user from localStorage first
      const userStr = localStorage.getItem("user");

      // Check both localStorage and cookies for token
      let tokenStr = localStorage.getItem("token");
      if (!tokenStr) {
        tokenStr = Cookies.get("token");
      }

      if (!tokenStr) return null;

      // If we have a token but no stored user, try to extract user from token
      const user = userStr ? JSON.parse(userStr) : null;

      try {
        const decoded = jwtDecode(tokenStr);
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          // Clear both storage locations if expired
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          Cookies.remove("token");
          return null;
        }

        // If user exists in localStorage, update contactCodes from token
        // Otherwise, create user object from token data
        const userData = user || {
          email: decoded.email,
          role: decoded.role,
          name: decoded.name,
        };

        // Ensure contactCodes is an array
        userData.contactCodes = Array.isArray(decoded.contactCodes)
          ? decoded.contactCodes
          : decoded.contactCodes
          ? [decoded.contactCodes]
          : [];

        // Make sure token is available in localStorage for API calls
        if (!localStorage.getItem("token") && tokenStr) {
          localStorage.setItem("token", tokenStr);
          // If we recreated the user from token, also store it
          if (!userStr) {
            localStorage.setItem("user", JSON.stringify(userData));
          }
        }

        return userData;
      } catch (error) {
        console.error("Token validation error:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        Cookies.remove("token");
        return null;
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  }
  return null;
};

export const setUser = (userData) => {
  if (!userData?.token) {
    console.error("No token provided in user data");
    return;
  }

  try {
    const decoded = jwtDecode(userData.token);

    // Ensure contactCodes is an array
    const contactCodes = Array.isArray(decoded.contactCodes)
      ? decoded.contactCodes
      : decoded.contactCodes
      ? [decoded.contactCodes]
      : [];

    const userToStore = {
      email: userData.email || decoded.email,
      role: userData.role || decoded.role,
      name: userData.name || decoded.name,
      contactCodes: contactCodes,
    };

    // Store in both localStorage and ensure we have the token
    localStorage.setItem("user", JSON.stringify(userToStore));
    localStorage.setItem("token", userData.token);

    // Also store in cookies as a backup
    Cookies.set("token", userData.token, {
      expires: 1 / 24, // 1 hour
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    console.log("[AUTH][SET] Stored user:", userToStore);
    console.log("[AUTH][SET] Token length:", userData.token.length);
  } catch (error) {
    console.error("Error setting user data:", error);
    throw error;
  }
};

// Other functions remain largely the same with minor fixes
export const logout = () => {
  try {
    // localStorage.removeItem("user");
    // localStorage.removeItem("token");
       Object.keys(localStorage).forEach((key) => {
         if (
           key.startsWith("orders:") ||
           key.startsWith("invoices:") ||
           key.startsWith("customers:") ||
           key === "token" ||
           key === "user"
         ) {
           localStorage.removeItem(key);
         }
       });
    Cookies.remove("token");
  } catch (error) {
    console.error("Error during logout:", error);
  }
  window.location.href = "/login";
};

export const getContactCodes = () => {
  const user = getUser();
  // Return null for admin to indicate no restrictions
  if (user?.role === "admin") return null;
  return user?.contactCodes || [];
};

export const isAuthenticated = () => {
  const user = getUser();
  const token = localStorage.getItem("token") || Cookies.get("token");

  if (!user || !token) return false;

  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 > Date.now();
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
};

export const hasMultipleContactCodes = () => {
  const contactCodes = getContactCodes();
  return Array.isArray(contactCodes) && contactCodes.length > 1;
};

// Add a utility to get the auth token for API requests
export const getAuthToken = () => {
  return localStorage.getItem("token") || Cookies.get("token") || null;
};

