// pages/api/customers/distinct-customer.js
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { search = "", page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const parameters = [];

    let whereClause = "WHERE CardType = 'C'"; // Customer type
    if (search) {
      whereClause += " AND (CardCode LIKE @search OR CardName LIKE @search)";
      parameters.push({
        name: "search",
        type: sql.NVarChar,
        value: `%${search}%`,
      });
    }

    const query = `
      SELECT CardCode, CardName
      FROM OCRD
      ${whereClause}
      ORDER BY CardName
      OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
    `;

    const result = await queryDatabase(query, parameters);

    const formatted = result.map((cust) => ({
      value: cust.CardCode,
      label: cust.CardName,
    }));

    res.status(200).json({ customers: formatted });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
