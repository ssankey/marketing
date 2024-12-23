// utils/auth.js
export const getUser = () => {
  if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
  }
  return null;
};

export const setUser = (userData) => {
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('token', userData.token);
};

export const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  window.location.href = '/login';
};

export const isAuthenticated = () => {
  return !!getUser();
};