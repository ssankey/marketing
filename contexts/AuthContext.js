// // contexts/AuthContext.js
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

//   useEffect(() => {
//     const storedUser = getUser();
//     if (storedUser) {
//       setUserState(storedUser);
//     }
//     setLoading(false);
//   }, []);

//   const setUser = (userData) => {
//     if (!userData || !userData.token) {
//       console.warn("[AuthContext] setUser called without token");
//       return;
//     }

//     try {
//       const decoded = jwtDecode(userData.token);
//         localStorage.setItem("token", userData.token);

//       // Ensure contactCodes is properly handled
//       const contactCodes = Array.isArray(decoded.contactCodes)
//         ? decoded.contactCodes
//         : decoded.contactCodes
//         ? [decoded.contactCodes]
//         : [];

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
//     } catch (error) {
//       console.error("[AuthContext] Error decoding token:", error);
//     }
//   };

//   const logout = () => {
//     setUserState(null);
//     logoutUser();
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         setUser,
//         logout,
//         loading,
//         isAuthenticated: !!user,
//         isLoading: loading,
//         redirecting: false,
//         contactCodes: user?.contactCodes || [],
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };

import React, { createContext, useContext, useState, useEffect } from "react";
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

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = getUser();
        if (storedUser) {
          setUserState(storedUser);
        }
      } catch (error) {
        console.error("[AuthContext] Error initializing auth:", error);
        // Clear invalid data
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
      const decoded = jwtDecode(userData.token);

      // Check if token is expired
      if (decoded.exp && decoded.exp * 1000 <= Date.now()) {
        console.warn("[AuthContext] Token is expired");
        logoutUser();
        return;
      }

      localStorage.setItem("token", userData.token);

      // Ensure contactCodes is properly handled
      const contactCodes = Array.isArray(decoded.contactCodes)
        ? decoded.contactCodes
        : decoded.contactCodes
          ? [decoded.contactCodes]
          : [];

      // Create a new user object with properly formatted data
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
      });
    } catch (error) {
      console.error("[AuthContext] Error decoding token:", error);
      logoutUser();
    }
  };

  const logout = () => {
    setUserState(null);
    logoutUser();
  };

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