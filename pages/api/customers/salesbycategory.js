import { getSalesByCategory } from "lib/models/customers";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: "Customer ID is required" });
  }

  try {
    const data = await getSalesByCategory(id);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching sales by category:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
