
import { getSalesByCategory } from "lib/models/customers";

export default async function handler(req, res) {
  const { id, salesPerson } = req.query;

  console.log("API received request with parameters:", { id, salesPerson });

  if (!id) {
    return res.status(400).json({ message: "Customer ID is required" });
  }

  try {
    // Pass salesPerson parameter directly without modification
    const data = await getSalesByCategory(id, salesPerson);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching sales by category:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
}
