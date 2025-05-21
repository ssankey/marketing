// /api/customers/[id]/all-outstanding.js

import { getCustomerOutstanding } from "../../../../lib/models/customers";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query; // Customer ID (e.g., C000080)
  const { filterType = "Payment Pending" } = req.query;

  if (!id) {
    return res.status(400).json({ message: "Customer ID is required" });
  }

  try {
    const { results } = await getCustomerOutstanding(id, {
      getAll: true,
      filterType,
    });

    res.status(200).json({
      customerOutstandings: results,
    });
  } catch (error) {
    console.error("Error fetching customer outstanding:", error);
    res.status(500).json({ message: "Failed to fetch customer outstanding" });
  }
}