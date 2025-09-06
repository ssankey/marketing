// // pages/api/order-lifecycle.js
// import { verify } from "jsonwebtoken";
// import { orderlifecycle } from "../../../models/order-lifecycle/order-lifecycle";

// export default async function handler(req, res) {
//   if (req.method !== "GET") {
//     return res.status(405).json({ message: "Method Not Allowed" });
//   }

//   try {
//     // 1) Verify the Bearer token
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({
//         error: "Missing or malformed Authorization header",
//         received: authHeader,
//       });
//     }

//     const token = authHeader.split(" ")[1];
//     let decodedToken;
//     try {
//       decodedToken = verify(token, process.env.JWT_SECRET);
//     } catch (err) {
//       console.error("Token verification failed:", err);
//       return res.status(401).json({ error: "Token verification failed" });
//     }

//     // 2) Extract role and access codes from token
//     const isAdmin = decodedToken.role === "admin";
//     const contactCodes = decodedToken.contactCodes || [];
//     const cardCodes = decodedToken.cardCodes || [];

//     // 3) Call the modal function with only the required parameters
//     const results = await orderlifecycle({
//       isAdmin,
//       contactCodes,
//       cardCodes
//     });

//     // 4) Return the data
//     return res.status(200).json(results);

//   } catch (error) {
//     console.error("Error fetching order lifecycle data:", error);
//     return res.status(500).json({ error: "Failed to fetch order lifecycle data" });
//   }
// }


// pages/api/order-lifecycle.js
import { verify } from "jsonwebtoken";
import { orderlifecycle } from "../../../models/order-lifecycle/order-lifecycle";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // 1) Check for Basic Authentication
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return res.status(401).json({
        error: "Missing or invalid Authorization header. Use Basic Auth with username:password",
      });
    }

    // 2) Extract and decode Basic Auth credentials
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    // 3) Validate against .env credentials
    const validUsername = process.env.API_USERNAME;
    const validPassword = process.env.API_PASSWORD;

    if (username !== validUsername || password !== validPassword) {
      return res.status(401).json({ 
        error: "Invalid credentials" 
      });
    }

    // 4) Verify the Bearer token (JWT)
    const bearerHeader = req.headers['x-bearer-token'] || req.headers['authorization-bearer'];
    if (!bearerHeader) {
      return res.status(401).json({
        error: "Missing Bearer token",
      });
    }

    let bearerToken;
    if (bearerHeader.startsWith("Bearer ")) {
      bearerToken = bearerHeader.split(" ")[1];
    } else {
      bearerToken = bearerHeader;
    }

    let decodedToken;
    try {
      decodedToken = verify(bearerToken, process.env.JWT_SECRET);
    } catch (err) {
      console.error("Token verification failed:", err);
      return res.status(401).json({ error: "Token verification failed" });
    }

    // 5) Extract role and access codes from token
    const isAdmin = decodedToken.role === "admin";
    const contactCodes = decodedToken.contactCodes || [];
    const cardCodes = decodedToken.cardCodes || [];

    // 6) Call the modal function with only the required parameters
    const results = await orderlifecycle({
      isAdmin,
      contactCodes,
      cardCodes
    });

    // 7) Return the data
    return res.status(200).json(results);

  } catch (error) {
    console.error("Error fetching order lifecycle data:", error);
    return res.status(500).json({ error: "Failed to fetch order lifecycle data" });
  }
}