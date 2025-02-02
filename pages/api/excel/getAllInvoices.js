// pages/api/getAllQuotations.js
import { getAllInvoices } from "lib/models/excel-function";
import { verify } from "jsonwebtoken";

export default async function handler(req, res) {
  const {
    status = "all",
    search = "",
    sortField = "DocDate",
    sortDir = "desc",
    fromDate,
    toDate, 
  } = req.query; // Extract filters from the query parameters

  try {
    // 1) Verify the Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Missing or malformed Authorization header",
        received: authHeader,
      });
    }

    const token = authHeader.split(" ")[1];
    let decodedToken;
    try {
      decodedToken = verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("Token verification failed:", err);
      return res.status(401).json({ error: "Token verification failed" });
    }

    
    // 3) Extract role-based or contactCodes-based logic
    const isAdmin = decodedToken.role === "admin";
    // If your JWT includes an array of contactCodes, extract it:
    const contactCodes = decodedToken.contactCodes || [];
    const data = await getAllInvoices({
      status,
      search,
      sortField,
      sortDir,
      fromDate,
      toDate,
      isAdmin,
      contactCodes,
    });
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices." });
  }
}


