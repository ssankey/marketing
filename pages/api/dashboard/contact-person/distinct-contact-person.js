// // pages/api/dashboard/contact-person/distinct-contact-person.js
// import { queryDatabase } from "../../../../lib/db";
// import sql from "mssql";

// export default async function handler(req, res) {
//   if (req.method !== "GET") {
//     return res.status(405).json({ message: "Method not allowed" });
//   }

//   const { search } = req.query;

//   try {
//     const query = search
//       ? `
//         SELECT CntctCode, Name, E_MailL
//         FROM OCPR
//         WHERE Name LIKE @SearchTerm
//         ORDER BY Name ASC
//       `
//       : `
//         SELECT CntctCode, Name, E_MailL
//         FROM OCPR
//         ORDER BY Name ASC
//       `;

//     const params = search
//       ? [
//           {
//             name: "SearchTerm",
//             type: sql.NVarChar,
//             value: `%${search}%`,
//           },
//         ]
//       : [];

//     const results = await queryDatabase(query, params);

//     const contactPersons = results.map((row) => ({
//       value: row.CntctCode,
//       label: `${row.Name} (${row.E_MailL || "No Email"})`,
//       email: row.E_MailL,
//     }));

//     res.status(200).json({ contactPersons });
//   } catch (error) {
//     console.error("Error fetching contact persons:", error);
//     res.status(500).json({ message: "Failed to fetch contact persons" });
//   }
// }

// pages/api/dashboard/contact-person/distinct-contact-person.js
import { queryDatabase } from "../../../../lib/db";
import sql from "mssql";
import { verify } from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { search } = req.query;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  let decoded;

  try {
    decoded = verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error("JWT decode error:", err);
    return res.status(403).json({ message: "Invalid token" });
  }

  const isCustomer = decoded.role === "contact_person";
  const cardCodes = decoded.cardCodes || [];

  try {
    let whereClauses = [];
    let params = [];

    if (search) {
      whereClauses.push("Name LIKE @SearchTerm");
      params.push({
        name: "SearchTerm",
        type: sql.NVarChar,
        value: `%${search}%`,
      });
    }

    if (isCustomer && cardCodes.length > 0) {
      whereClauses.push(`CardCode IN (${cardCodes.map((_, i) => `@CardCode${i}`).join(", ")})`);
      cardCodes.forEach((code, i) => {
        params.push({
          name: `CardCode${i}`,
          type: sql.NVarChar(20),
          value: code,
        });
      });
    }

    const whereClause = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `
      SELECT CntctCode, Name, E_MailL
      FROM OCPR
      ${whereClause}
      ORDER BY Name ASC
    `;

    const results = await queryDatabase(query, params);

    const contactPersons = results.map((row) => ({
      value: row.CntctCode,
      label: `${row.Name} (${row.E_MailL || "No Email"})`,
      email: row.E_MailL,
    }));

    res.status(200).json({ contactPersons });
  } catch (error) {
    console.error("Error fetching contact persons:", error);
    res.status(500).json({ message: "Failed to fetch contact persons" });
  }
}
