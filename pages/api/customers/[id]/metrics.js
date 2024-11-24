import { getCustomerPurchaseAndRevenue } from "../../../../lib/models/specifc-csutomer";

// api/customers/[id]/metrices.js
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await getCustomerPurchaseAndRevenue(id, year);

    if (!data || data.length === 0) {
      return res
        .status(404)
        .json({ message: "No data found for this customer" });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      message: "Failed to fetch customer data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
