// // pages/api/getAllQuotations.js
// import { getAllQuotations } from "lib/models/excel-function";

// export default async function handler(req, res) {
//   const {
//     status = "all",
//     search = "",
//     sortField = "DocDate",
//     sortDir = "desc",
//     fromDate,
//     toDate,
//   } = req.query;

//   try {
//     const data = await getAllQuotations({
//       status,
//       search,
//       sortField,
//       sortDir,
//       fromDate,
//       toDate,
//     });
//     res.status(200).json(data);
//   } catch (error) {
//     console.error("Error fetching quotations:", error);
//     res.status(500).json({ error: "Failed to fetch quotations." });
//   }
// }


// pages/api/getAllQuotations.js
import { verify } from "jsonwebtoken";
import { getAllQuotations } from "../../../lib/models/excel-function";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // 1) Verify Authorization Header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Missing or malformed Authorization header",
      });
    }

    // 2) Verify the JWT token
    const token = authHeader.split(" ")[1];
    let decodedToken;
    try {
      decodedToken = verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error("Token verification failed:", error);
      return res.status(401).json({ error: "Token verification failed" });
    }

    // 3) Get user role and contactCodes from the token payload
    const isAdmin = decodedToken.role === "admin";
    const contactCodes = decodedToken.contactCodes || [];

    // 4) Extract query parameters
    const {
      status = "all",
      search = "",
      sortField = "DocDate",
      sortDir = "desc",
      fromDate,
      toDate,
    } = req.query;

    // 5) Call the model function including role-based filtering info
    const data = await getAllQuotations({
      status,
      search,
      sortField,
      sortDir,
      fromDate,
      toDate,
      isAdmin,
      contactCodes,
      
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching quotations:", error);
    return res.status(500).json({ error: "Failed to fetch quotations." });
  }
}
