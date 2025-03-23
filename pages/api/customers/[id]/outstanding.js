//api/customers/[id].js/outstanding.js 
import { getCustomerOutstanding } from "../../../../lib/models/customers";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query; // Customer ID (e.g., C000080)

  if (!id) {
    return res.status(400).json({ message: "Customer ID is required" });
  }

  try {
    const orders = await getCustomerOutstanding(id);
    console.log("API Response:", orders);
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res.status(500).json({ message: "Failed to fetch customer orders" });
  }
}