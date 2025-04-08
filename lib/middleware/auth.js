

// 1. First, fix the auth middleware (lib/middleware/auth.js)
import { verify } from "jsonwebtoken";
import { parse } from "cookie";

// export const authMiddleware = async (req) => {
//   try {
//     // Try to get token from different sources
//     let token;

//     // 1. Check Authorization header
//     const authHeader = req.headers.authorization;
//     if (authHeader && authHeader.startsWith("Bearer ")) {
//       token = authHeader.split(" ")[1];
//     }

//     // 2. If no token in header, check cookies
//     if (!token && req.headers.cookie) {
//       const cookies = parse(req.headers.cookie);
//       token = cookies.token;
//     }

//     // 3. No token found
//     if (!token) {
//       return {
//         success: false,
//         status: 401,
//         error: "Authentication required",
//       };
//     }

//     // Verify token
//     try {
//       const decoded = verify(token, process.env.JWT_SECRET);

//       // Format contact codes consistently as an array - FIXED to handle string properly
//       let contactCodes = [];
//       if (decoded.contactCodes) {
//         contactCodes = Array.isArray(decoded.contactCodes) 
//           ? decoded.contactCodes 
//           : typeof decoded.contactCodes === 'string'
//             ? [decoded.contactCodes]
//             : [];
//       }

//       // Return user data
//       return {
//         success: true,
//         user: {
//           email: decoded.email,
//           role: decoded.role,
//           name: decoded.name,
//           contactCodes: contactCodes,
//         },
//       };
//     } catch (verifyError) {
//       console.error("Token verification failed:", verifyError);
//       return {
//         success: false,
//         status: 401,
//         error: "Token verification failed: " + verifyError.message,
//       };
//     }
//   } catch (error) {
//     console.error("Auth middleware error:", error);
//     return {
//       success: false,
//       status: 500,
//       error: "Authentication error",
//     };
//   }
// };

const authMiddleware = async (req) => {
  let token = null;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.headers.cookie) {
    const cookies = parse(req.headers.cookie);
    token = cookies.token;
  }

  if (!token) {
    return { success: false, error: "Token missing", status: 401 };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { success: true, user: decoded };
  } catch (err) {
    return {
      success: false,
      error: "Token invalid: " + err.message,
      status: 401,
    };
  }
};


// Helper to wrap API handlers with auth
export const withAuth = (handler) => async (req, res) => {
  const auth = await authMiddleware(req);

  if (!auth.success) {
    return res.status(auth.status).json({ error: auth.error });
  }

  // Add user to request object
  req.user = auth.user;

  // Call the original handler
  return handler(req, res);
};
