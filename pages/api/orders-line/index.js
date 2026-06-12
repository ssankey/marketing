// pages/api/orders-line.js
import { verify } from "jsonwebtoken";
import { parseISO, isValid } from "date-fns";
import { getOrdersLineFromDatabase } from "../../../lib/models/orders";

function isValidDate(date) {
  return date && isValid(parseISO(date));
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
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
    let decodedToken;
    try {
      decodedToken = verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("Token verification failed:", err);
      return res.status(401).json({ error: "Token verification failed" });
    }

    const isAdmin = decodedToken.role === "admin";
    const contactCodes = decodedToken.contactCodes || [];
    const cardCodes = decodedToken.cardCodes || [];

    const {
      page = 1,
      search = "",
      status = "all",
      sortField = "PostingDate",
      sortDir = "desc",
      fromDate,
      toDate,
      month = "",
      getAll = "false",
      pageSize = 20
    } = req.query;

    const itemsPerPage = parseInt(pageSize, 10);

    const validFromDate = isValidDate(fromDate) ? fromDate : undefined;
    const validToDate = isValidDate(toDate) ? toDate : undefined;

    let monthFromDate, monthToDate;
    if (month && month !== "") {
      const [year, monthNum] = month.split('-');
      if (year && monthNum) {
        monthFromDate = `${year}-${monthNum.padStart(2, '0')}-01`;
        const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
        monthToDate = `${year}-${monthNum.padStart(2, '0')}-${lastDay}`;
      }
    }

    const { totalItems, ordersLine } = await getOrdersLineFromDatabase({
      page: parseInt(page, 10),
      search,
      status,
      fromDate: validFromDate || monthFromDate,
      toDate: validToDate || monthToDate,
      sortField,
      sortDir,
      itemsPerPage,
      isAdmin,
      cardCodes,
      contactCodes,
      getAll: getAll === "true",
    });

    return res.status(200).json({
      ordersLine,
      totalItems,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(totalItems / itemsPerPage),
      pageSize: itemsPerPage,
      hasNextPage: parseInt(page, 10) * itemsPerPage < totalItems,
      hasPrevPage: parseInt(page, 10) > 1,
    });
  } catch (error) {
    console.error("Error fetching order lines:", error);
    return res.status(500).json({ error: "Failed to fetch order lines" });
  }
}