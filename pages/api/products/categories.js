// import { queryDatabase } from "../../../lib/db";

// export default async function handler(req, res) {
//   if (req.method !== "GET") {
//     return res.status(405).json({ message: "Method not allowed" });
//   }

//   try {
//     const query = `SELECT DISTINCT ItmsGrpNam FROM OITB ORDER BY ItmsGrpNam ASC`;
//     const results = await queryDatabase(query);
//     const categories = results.map((row) => row.ItmsGrpNam);
//     res.status(200).json({ categories });
//   } catch (error) {
//     console.error("Error fetching categories:", error);
//     res.status(500).json({ message: "Failed to fetch categories" });
//   }
// }


import { queryDatabase } from "../../../lib/db";
import { verify } from "jsonwebtoken";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get user role from JWT token
    let userRole = "";
    try {
      // Check for token in Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const decoded = verify(token, process.env.JWT_SECRET);
        userRole = decoded.role || "";
        console.log("User role from token:", userRole);
      }
      // Check for token in cookies as fallback
      else if (req.headers.cookie) {
        const cookieMatch = req.headers.cookie.match(/token=([^;]+)/);
        if (cookieMatch) {
          const token = cookieMatch[1];
          const decoded = verify(token, process.env.JWT_SECRET);
          userRole = decoded.role || "";
          console.log("User role from cookie:", userRole);
        }
      }
    } catch (error) {
      console.error("Token verification error:", error);
      // Continue without role if token is invalid
    }

    let query = `SELECT DISTINCT ItmsGrpNam FROM OITB`;
    const params = [];

    // If user role is 3ASenrise, only return "3A Chemicals" category
    if (userRole === "3ASenrise") {
      query += ` WHERE ItmsGrpNam = @category`;
      params.push({ name: "category", type: sql.NVarChar, value: "3A Chemicals" });
      console.log("Filtering categories for 3ASenrise user");
    }

    query += ` ORDER BY ItmsGrpNam ASC`;

    console.log("Executing query:", query);
    console.log("With parameters:", params);

    const results = await queryDatabase(query, params);
    const categories = results.map((row) => row.ItmsGrpNam);

    console.log("Categories returned:", categories);

    res.status(200).json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
}