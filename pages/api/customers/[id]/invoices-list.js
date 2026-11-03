// pages/api/customers/[id]/invoices-list.js
// Line-level invoices for one customer — reuses getInvoicesList
// (lib/models/invoices.js, same query the app-wide /invoices page uses),
// forced to cardCodes: [id] regardless of the caller's own role/access.
// Named "-list" to avoid colliding with the existing /api/customers/[id]
// route's ?invoices=true param (a different, top-10-summary endpoint).

import { verify } from "jsonwebtoken";
import { getInvoicesList } from "../../../../lib/models/invoices";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }
  try {
    verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(401).json({ error: "Token verification failed" });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "Customer id is required" });
  }

  try {
    const {
      page = 1,
      search = "",
      status = "all",
      sortField = "DocDate",
      sortDir = "desc",
      pageSize = 20,
      getAll = "false",
    } = req.query;

    const itemsPerPage = parseInt(pageSize, 10);

    const { totalItems, invoices } = await getInvoicesList({
      page: parseInt(page, 10),
      search,
      status,
      sortField,
      sortDir,
      itemsPerPage,
      isAdmin: false,
      cardCodes: [id],
      contactCodes: [],
      getAll: getAll === "true",
    });

    return res.status(200).json({
      invoices,
      totalItems,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(totalItems / itemsPerPage),
      pageSize: itemsPerPage,
    });
  } catch (error) {
    console.error("Error fetching customer invoices:", error);
    return res.status(500).json({ error: "Failed to fetch invoices" });
  }
}
