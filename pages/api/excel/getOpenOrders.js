// pages/api/getOpenOrders.js
import { getAllOpenOrders } from "lib/models/excel-function";
import { verify } from "jsonwebtoken";

export default async function handler(req, res) {
  const {
    search = "",
    sortField = "DocNum",
    sortDir = "asc",
    fromDate,
    toDate,
    status="all"
  } = req.query; 

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
    const data = await getAllOpenOrders({
      search,
      sortField,
      sortDir,
      fromDate,
      toDate,
      status,
      isAdmin,
      contactCodes,
    });
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching open orders:", error);
    res.status(500).json({ error: "Failed to open orders." });
  }
}
