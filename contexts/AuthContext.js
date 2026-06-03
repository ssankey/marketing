

// import React, { createContext, useContext, useState, useEffect } from "react";
// import { jwtDecode } from "jwt-decode";
// import {
//   getUser,
//   setUser as setUserInStorage,
//   logout as logoutUser,
// } from "../utils/auth";

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [user, setUserState] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Helper function to check if token is expired
//   const isTokenExpired = (token) => {
//     if (!token) return true;
    
//     try {
//       const decoded = jwtDecode(token);
//       const currentTime = Date.now() / 1000;
      
//       // Add a small buffer (30 seconds) to avoid edge cases
//       const bufferTime = 30;
      
//       return decoded.exp && decoded.exp < (currentTime + bufferTime);
//     } catch (error) {
//       console.error("[AuthContext] Error checking token expiry:", error);
//       return true;
//     }
//   };

//   useEffect(() => {
//     const initializeAuth = async () => {
//       try {
//         const storedUser = getUser();
        
//         if (storedUser && storedUser.token) {
//           // Check if the stored token is still valid
//           if (!isTokenExpired(storedUser.token)) {
//             setUserState(storedUser);
//             console.log("[AuthContext] User restored from storage");
//           } else {
//             console.log("[AuthContext] Stored token is expired, clearing auth");
//             logoutUser();
//           }
//         } else {
//           console.log("[AuthContext] No valid user data found in storage");
//         }
//       } catch (error) {
//         console.error("[AuthContext] Error initializing auth:", error);
//         // Clear invalid data
//         logoutUser();
//       } finally {
//         setLoading(false);
//       }
//     };

//     initializeAuth();
//   }, []);

//   const setUser = (userData) => {
//     if (!userData || !userData.token) {
//       console.warn("[AuthContext] setUser called without token");
//       return;
//     }

//     try {
//       // Check if token is expired before setting
//       if (isTokenExpired(userData.token)) {
//         console.warn("[AuthContext] Cannot set user - token is expired");
//         logoutUser();
//         return;
//       }

//       const decoded = jwtDecode(userData.token);

//       // Store token in localStorage
//       localStorage.setItem("token", userData.token);

//       // Ensure contactCodes is properly handled
//       const contactCodes = Array.isArray(decoded.contactCodes)
//         ? decoded.contactCodes
//         : decoded.contactCodes
//           ? [decoded.contactCodes]
//           : [];

//       // Create a new user object with properly formatted data
//       const newUserData = {
//         ...userData,
//         email: userData.email || decoded.email,
//         role: userData.role || decoded.role,
//         name: userData.name || decoded.name,
//         contactCodes: decoded.role === "admin" ? [] : contactCodes,
//       };

//       setUserState(newUserData);
//       setUserInStorage(newUserData);

//       console.log("[AuthContext] User set successfully:", {
//         email: newUserData.email,
//         role: newUserData.role,
//         tokenExp: new Date(decoded.exp * 1000).toISOString(),
//       });
//     } catch (error) {
//       console.error("[AuthContext] Error decoding token:", error);
//       logoutUser();
//     }
//   };

//   const logout = () => {
//     console.log("[AuthContext] Logging out user");
//     setUserState(null);
//     logoutUser();
//   };

//   // Check token expiry periodically
//   useEffect(() => {
//     if (!user || !user.token) return;

//     const checkTokenExpiry = () => {
//       if (isTokenExpired(user.token)) {
//         console.log("[AuthContext] Token expired, logging out");
//         logout();
//       }
//     };

//     // Check every 5 minutes
//     const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000);

//     return () => clearInterval(interval);
//   }, [user]);

//   const contextValue = {
//     user,
//     setUser,
//     logout,
//     loading,
//     isAuthenticated: !!user && !loading,
//     isLoading: loading,
//     redirecting: false,
//     contactCodes: user?.contactCodes || [],
//   };

//   return (
//     <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import {
  getUser,
  setUser as setUserInStorage,
  logout as logoutUser,
} from "../utils/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Fix 1: buffer is subtracted, not added.
  // Adding buffer means "log out 30s BEFORE expiry" — wrong.
  // Subtracting means "only flag expired if we're 30s PAST expiry" — correct grace period.
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      if (!decoded.exp) return false; // no expiry set → treat as valid
      const currentTime = Date.now() / 1000;
      const GRACE_SECONDS = 30;
      return decoded.exp < (currentTime - GRACE_SECONDS);
    } catch (error) {
      console.error("[AuthContext] Error checking token expiry:", error);
      return true;
    }
  };

  // ── Fix 2: track whether any fetch is in-flight so we don't
  // logout mid-request just because the interval fires.
  const activeFetchCount = useRef(0);

  // Monkey-patch fetch once to track in-flight requests.
  // This is lightweight — just increments/decrements a ref counter.
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      activeFetchCount.current += 1;
      try {
        return await originalFetch(...args);
      } finally {
        activeFetchCount.current = Math.max(0, activeFetchCount.current - 1);
      }
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // ── Initialize auth from storage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // ── Fix 3: always re-read token from localStorage directly,
        // not just the cached user object, so refresh gets the latest value.
        const storedUser = getUser();
        const rawToken = localStorage.getItem("token");

        // Prefer the raw token over whatever is serialised in the user object
        const tokenToCheck = rawToken || storedUser?.token;

        if (storedUser && tokenToCheck) {
          if (!isTokenExpired(tokenToCheck)) {
            // Ensure the user object always carries the freshest token
            const freshUser = { ...storedUser, token: tokenToCheck };
            setUserState(freshUser);
            console.log("[AuthContext] User restored from storage");
          } else {
            console.log("[AuthContext] Stored token is expired, clearing auth");
            logoutUser();
          }
        } else {
          console.log("[AuthContext] No valid user data found in storage");
        }
      } catch (error) {
        console.error("[AuthContext] Error initializing auth:", error);
        logoutUser();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const setUser = (userData) => {
    if (!userData || !userData.token) {
      console.warn("[AuthContext] setUser called without token");
      return;
    }

    try {
      if (isTokenExpired(userData.token)) {
        console.warn("[AuthContext] Cannot set user — token is already expired");
        logoutUser();
        return;
      }

      const decoded = jwtDecode(userData.token);
      localStorage.setItem("token", userData.token);

      const contactCodes = Array.isArray(decoded.contactCodes)
        ? decoded.contactCodes
        : decoded.contactCodes
          ? [decoded.contactCodes]
          : [];

      const newUserData = {
        ...userData,
        email: userData.email || decoded.email,
        role: userData.role || decoded.role,
        name: userData.name || decoded.name,
        contactCodes: decoded.role === "admin" ? [] : contactCodes,
      };

      setUserState(newUserData);
      setUserInStorage(newUserData);

      console.log("[AuthContext] User set successfully:", {
        email: newUserData.email,
        role: newUserData.role,
        tokenExp: new Date(decoded.exp * 1000).toISOString(),
      });
    } catch (error) {
      console.error("[AuthContext] Error decoding token:", error);
      logoutUser();
    }
  };

  const logout = () => {
    console.log("[AuthContext] Logging out user");
    setUserState(null);
    logoutUser();
  };

  // ── Periodic token expiry check
  // Fix: skip the logout if a fetch is currently in-flight —
  // avoids killing the session mid-request on slow connections.
  useEffect(() => {
    if (!user?.token) return;

    const checkTokenExpiry = () => {
      if (isTokenExpired(user.token)) {
        if (activeFetchCount.current > 0) {
          // A request is in progress — wait for the next tick to re-check
          console.log("[AuthContext] Token looks expired but fetch in-flight, deferring logout");
          setTimeout(() => {
            if (isTokenExpired(user.token) && activeFetchCount.current === 0) {
              console.log("[AuthContext] Token expired after request settled, logging out");
              logout();
            }
          }, 3000);
          return;
        }
        console.log("[AuthContext] Token expired, logging out");
        logout();
      }
    };

    // Check every 5 minutes — same as before
    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const contextValue = {
    user,
    setUser,
    logout,
    loading,
    isAuthenticated: !!user && !loading,
    isLoading: loading,
    redirecting: false,
    contactCodes: user?.contactCodes || [],
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};