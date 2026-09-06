// pages/api/open-do/index.js
// Line-level Delivery Orders for the "Open DO" table — same request-parsing
// shape as pages/api/open-orders/index.js (month -> fromDate/toDate, role
// scoping from the JWT), backed by getDeliveryOrdersLineFromDatabase.

import { verify } from "jsonwebtoken";
import { getDeliveryOrdersLineFromDatabase } from "../../../lib/models/deliveryOrders";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }

  let decodedToken;
  try {
    decodedToken = verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(401).json({ error: "Token verification failed" });
  }

  const isAdmin = decodedToken.role === "admin";
  const contactCodes = decodedToken.contactCodes || [];
  const cardCodes = decodedToken.cardCodes || [];

  try {
    const {
      page = 1,
      search = "",
      status = "open",
      sortField = "DeliveryDate",
      sortDir = "desc",
      month = "",
      pageSize = 20,
      getAll = "false",
    } = req.query;

    const itemsPerPage = parseInt(pageSize, 10);

    let fromDate, toDate;
    if (month) {
      const [year, monthNum] = month.split("-");
      if (year && monthNum) {
        fromDate = `${year}-${monthNum.padStart(2, "0")}-01`;
        const lastDay = new Date(parseInt(year, 10), parseInt(monthNum, 10), 0).getDate();
        toDate = `${year}-${monthNum.padStart(2, "0")}-${lastDay}`;
      }
    }

    const { deliveryOrdersLine, totalItems } = await getDeliveryOrdersLineFromDatabase({
      page: parseInt(page, 10),
      search,
      status,
      fromDate,
      toDate,
      sortField,
      sortDir,
      itemsPerPage,
      isAdmin,
      contactCodes,
      cardCodes,
      getAll: getAll === "true",
    });

    return res.status(200).json({
      deliveryOrdersLine,
      totalItems,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(totalItems / itemsPerPage),
      pageSize: itemsPerPage,
    });
  } catch (error) {
    console.error("Error fetching open delivery orders:", error);
    return res.status(500).json({ error: "Failed to fetch delivery order lines" });
  }
}
