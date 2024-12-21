
// File: /pages/api/customers/index.js

import { getCustomers } from "lib/models/customers";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const {
      page = 1,
      search = "",
      sortField = "CardName",
      sortDir = "asc",
      status = "all",
    } = req.query;

    const ITEMS_PER_PAGE = 20;
    const offset = (parseInt(page, 10) - 1) * ITEMS_PER_PAGE;

    let whereClause = "T0.CardType = 'C'"; // Only customers

    if (search) {
      // Sanitize input to prevent SQL injection
      const sanitizedSearch = search.replace(/'/g, "''");
      whereClause += ` AND (
        T0.CardCode LIKE '%${sanitizedSearch}%' OR 
        T0.CardName LIKE '%${sanitizedSearch}%' OR 
        T0.Phone1 LIKE '%${sanitizedSearch}%' OR 
        T0.E_Mail LIKE '%${sanitizedSearch}%'
      )`;
    }

    if (status && status !== "all") {
      // Assuming 'status' could be 'active' or 'inactive'
      whereClause += ` AND T0.ValidFor = '${status === "active" ? "Y" : "N"}'`;
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM OCRD T0  
      WHERE ${whereClause};
    `;

    const dataQuery = `
      SELECT
        T0.CardCode AS CustomerCode,
        T0.CardName AS CustomerName,
        T0.Phone1 AS Phone,
        T0.E_Mail AS Email,
        T0.Address AS BillingAddress,
        T0.Balance,
        T0.Currency,
        T0.ValidFor AS IsActive,
        T0.CreditLine,
        T5.SlpName AS SalesEmployeeName
      FROM OCRD T0
      LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      WHERE ${whereClause}
      ORDER BY ${sortField} ${sortDir}
      OFFSET ${offset} ROWS
      FETCH NEXT ${ITEMS_PER_PAGE} ROWS ONLY;
    `;

    const [totalResult, rawCustomers] = await Promise.all([
      getCustomers(countQuery),
      getCustomers(dataQuery),
    ]);

    const totalItems = totalResult[0]?.total || 0;
    const customers = rawCustomers.map((customer) => ({
      ...customer,
      IsActive: customer.IsActive === "Y",
    }));

    return res.status(200).json({
      customers,
      totalItems,
      currentPage: parseInt(page, 10),
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
