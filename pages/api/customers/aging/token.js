// pages/api/customers/aging/simple.js
import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Missing or malformed Authorization header",
        received: authHeader,
      });
    }

    const token = authHeader.split(" ")[1];
    let decoded;

    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return res.status(401).json({ error: "Token verification failed" });
    }

    const cardCodes = decoded.cardCodes || [];

    if (cardCodes.length === 0) {
      return res.status(403).json({
        error: "Access denied: cardCodes not found in token",
      });
    }

    // 👇 Log the card codes being used
    console.log("Using cardCodes:", cardCodes);

    const query = `
      SELECT
        SUM(CASE WHEN DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 0 AND 30 THEN (T0.Debit - T0.Credit) ELSE 0 END) AS [0-30 Days],
        SUM(CASE WHEN DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 31 AND 60 THEN (T0.Debit - T0.Credit) ELSE 0 END) AS [31-60 Days],
        SUM(CASE WHEN DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 61 AND 90 THEN (T0.Debit - T0.Credit) ELSE 0 END) AS [61-90 Days],
        SUM(CASE WHEN DATEDIFF(DAY, T0.DueDate, GETDATE()) > 90 THEN (T0.Debit - T0.Credit) ELSE 0 END) AS [91+ Days],
        SUM(T0.Debit - T0.Credit) AS [Total Balance]
      FROM JDT1 T0
      WHERE
        T0.DueDate <= GETDATE()
        AND (T0.Debit - T0.Credit) > 0
        AND T0.ShortName IN (${cardCodes.map(code => `'${code}'`).join(",")})
    `;

    const data = await queryDatabase(query);

    const result = data && data.length > 0 ? data[0] : {
      "0-30 Days": 0,
      "31-60 Days": 0,
      "61-90 Days": 0,
      "91+ Days": 0,
      "Total Balance": 0
    };

    res.status(200).json(result);

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      message: "Failed to fetch customer aging data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}
