

import { getCustomerPurchaseAndRevenue } from "lib/models/specific-customer";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { id, salesPerson, category } = req.query;

    if (!id) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    console.log("API handler received params:", { id, salesPerson, category });

    // Pass both parameters to the model function
    const data = await getCustomerPurchaseAndRevenue(id, salesPerson, category);

    const safeData = Array.isArray(data) ? data : [];
    return res.status(200).json(safeData);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      message: "Failed to fetch customer data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

