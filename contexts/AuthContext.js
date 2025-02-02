// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Updated import syntax
import { getUser, setUser as setUserInStorage, logout as logoutUser } from 'utils/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getUser();
    if (storedUser) {
      setUserState(storedUser);
    }
    setLoading(false);
  }, []);

  const setUser = (userData) => {
    if (userData?.token) {
      try {
        const decoded = jwtDecode(userData.token);
        userData.contactCodes = decoded.contactCodes || [];
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
    
    setUserState(userData);
    setUserInStorage(userData);
  };

  const logout = () => {
    setUserState(null);
    logoutUser();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      logout, 
      loading,
      contactCodes: user?.contactCodes || [] 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};