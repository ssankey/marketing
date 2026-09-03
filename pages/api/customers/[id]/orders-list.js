// pages/api/customers/[id]/orders-list.js
// Line-level orders for one customer — reuses getOrdersLineFromDatabase
// (lib/models/orders.js, same query the app-wide /orders-line page uses),
// forced to cardCodes: [id] regardless of the caller's own role/access, since
// this route only ever needs to answer "this one customer's order lines".
// Named "-list" to avoid colliding with the existing /api/customers/[id]
// route's ?orders=true param (a different, top-10-summary endpoint).

import { verify } from "jsonwebtoken";
import { getOrdersLineFromDatabase } from "../../../../lib/models/orders";

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
      sortField = "PostingDate",
      sortDir = "desc",
      pageSize = 20,
      getAll = "false",
    } = req.query;

    const itemsPerPage = parseInt(pageSize, 10);

    const { totalItems, ordersLine } = await getOrdersLineFromDatabase({
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
      ordersLine,
      totalItems,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(totalItems / itemsPerPage),
      pageSize: itemsPerPage,
    });
  } catch (error) {
    console.error("Error fetching customer order lines:", error);
    return res.status(500).json({ error: "Failed to fetch order lines" });
  }
}
