// // First, create an API endpoint for logout
// // pages/api/auth/logout.js
// export default async function handler(req, res) {
//     if (req.method !== 'POST') {
//       return res.status(405).json({ message: 'Method not allowed' });
//     }
  
//     try {
//       // Clear the auth cookie
//       res.setHeader('Set-Cookie', [
//         'token=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict',
//       ]);
  
//       return res.status(200).json({ message: 'Logged out successfully' });
//     } catch (error) {
//       console.error('Logout error:', error);
//       return res.status(500).json({ message: 'Error during logout' });
//     }
//   }


// pages/api/auth/logout.js

import { serialize } from "cookie";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const cookie = serialize("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure only in production
      sameSite: "strict",
      path: "/",
      maxAge: 0, // Expire immediately
      
    });

    res.setHeader("Set-Cookie", cookie);
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Error during logout" });
  }
}
