// utils/auth.js
import { jwtDecode } from 'jwt-decode';

export const getUser = () => {
  if (typeof window !== 'undefined') {
      try {
          const userStr = localStorage.getItem('user');
          const tokenStr = localStorage.getItem('token');
          
          if (!userStr || !tokenStr) return null;
          
          const user = JSON.parse(userStr);
          
          try {
              const decoded = jwtDecode(tokenStr);
              if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                  localStorage.removeItem('user');
                  localStorage.removeItem('token');
                  return null;
              }
              // Only set contactCodes if user is not admin
              if (decoded.role !== 'admin') {
                  user.contactCodes = decoded.contactCodes || [];
              }
              return user;
          } catch (error) {
              console.error('Token validation error:', error);
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              return null;
          }
      } catch (error) {
          console.error('Error parsing user data:', error);
          return null;
      }
  }
  return null;
};

export const getContactCodes = () => {
  const user = getUser();
  // Return null for admin to indicate no restrictions
  if (user?.role === 'admin') return null;
  return user?.contactCodes || [];
};

export const setUser = (userData) => {
  if (!userData?.token) {
    console.error('No token provided in user data');
    return;
  }

  try {
    const decoded = jwtDecode(userData.token);
    // Ensure we store the contact codes from the token
    userData.contactCodes = decoded.contactCodes || [];
    
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.token);
  } catch (error) {
    console.error('Error setting user data:', error);
    throw error; // Propagate the error to handle it in the calling code
  }
};

export const isAuthenticated = () => {
  const user = getUser();
  const token = localStorage.getItem('token');
  
  if (!user || !token) return false;
  
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 > Date.now();
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

// export const getContactCodes = () => {
//   const user = getUser();
//   return user?.contactCodes || [];
// };

export const hasMultipleContactCodes = () => {
  const contactCodes = getContactCodes();
  return contactCodes.length > 1;
};

export const logout = () => {
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  } catch (error) {
    console.error('Error during logout:', error);
  }
  window.location.href = '/login';
};