

// lib/middleware/auth.js
import { verify } from "jsonwebtoken";
import { parse } from "cookie";

const authMiddleware = async (req) => {
  let token = null;

  // 1. Check Authorization header first
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 2. Fallback to cookie
  if (!token && req.headers.cookie) {
    const cookies = parse(req.headers.cookie);
    token = cookies.token;
  }

  // 3. Fallback to body (some routes POST the token)
  if (!token && req.body?.token) {
    token = req.body.token;
  }

  if (!token) {
    return { success: false, error: "Authentication required", status: 401 };
  }

  // ── Fix: use the named import `verify`, not `jwt.verify`
  try {
    const decoded = verify(token, process.env.JWT_SECRET);

    let contactCodes = [];
    if (decoded.contactCodes) {
      contactCodes = Array.isArray(decoded.contactCodes)
        ? decoded.contactCodes
        : typeof decoded.contactCodes === "string"
          ? [decoded.contactCodes]
          : [];
    }

    return {
      success: true,
      user: {
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
        contactCodes: decoded.role === "admin" ? [] : contactCodes,
        exp: decoded.exp,
      },
    };
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return {
      success: false,
      error: "Token verification failed: " + err.message,
      status: 401,
    };
  }
};

export const withAuth = (handler) => async (req, res) => {
  const auth = await authMiddleware(req);
  if (!auth.success) {
    return res.status(auth.status || 401).json({ error: auth.error });
  }
  req.user = auth.user;
  return handler(req, res);
};

export default authMiddleware;