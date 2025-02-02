// pages/api/customers.js
import { getCustomers } from "lib/models/customers"; // Your DB query function

export default async function handler(req, res) {
  const { search } = req.query;
  const sanitizedSearch = search.replace(/'/g, "''"); // Sanitize input

  const query = `
    SELECT T0.CardCode AS CustomerCode, T0.CardName AS CustomerName
    FROM OCRD T0
    WHERE T0.CardName LIKE '%${sanitizedSearch}%'
    LIMIT 5;
  `;

  try {
    const customers = await getCustomers(query);
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
}
