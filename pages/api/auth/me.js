// pages/api/auth/me.js
import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  const { token } = req.cookies;

  if (!token) {
    return res.status(200).json({ isAuthenticated: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json({ isAuthenticated: true, user: decoded });
  } catch (error) {
    return res.status(200).json({ isAuthenticated: false });
  }
}
