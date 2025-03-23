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


// *******************new function to do automatic logout *******************************//

// utils/auth.js
export const isTokenExpired = () => {
  const token = localStorage.getItem('token');
  if (!token) return true; // No token found

  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 < Date.now(); // Check if token is expired
  } catch (error) {
    console.error('Error decoding token:', error);
    return true; // Assume token is invalid if decoding fails
  }
};


// utils/auth.js
export const startTokenExpirationCheck = () => {
  const checkInterval = 10 * 1000; // Check every 1 minute

  const intervalId = setInterval(() => {
    if (isTokenExpired()) {
      clearInterval(intervalId); // Stop the interval
      logout(); // Redirect to login page
    }
  }, checkInterval);

  return intervalId;
};


// utils/auth.js
export const handleTabVisibilityChange = () => {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isTokenExpired()) {
      logout(); // Redirect to login page
    }
  });
};