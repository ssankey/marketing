
// /api/customers/[id]/outstanding.js
import { getCustomerOutstanding } from "../../../../lib/models/customers";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query; // Customer ID (e.g., C000080)
  const { getAll = "false", page = 1, fromDate, toDate } = req.query;

  const all = getAll === "true";
  const currentPage = parseInt(page, 10);
  const itemsPerPage = 5;

  if (!id) {
    return res.status(400).json({ message: "Customer ID is required" });
  }

  try {
    const { results, totalItems } = await getCustomerOutstanding(id, {
      getAll: all,
      page: currentPage,
      itemsPerPage,
      fromDate,
      toDate,
    });

    res.status(200).json({
      customerOutstandings: results,
      totalItems,
      currentPage,
      totalPages: Math.ceil(totalItems / itemsPerPage),
    });
  } catch (error) {
    console.error("Error fetching customer outstanding:", error);
    res.status(500).json({ message: "Failed to fetch customer outstanding" });
  }
}