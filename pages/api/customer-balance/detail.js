
import { getCustomerBalanceDetail } from "lib/models/customer-balance/getCustomerBalanceDetail";

export default async function handler(req, res) {
  if (req.method === "GET") {
    let { cardCode, startDate, endDate } = req.query;

    // Set default values if parameters are not provided
    startDate = startDate || "1900-01-01"; // Default to the earliest date
    endDate = endDate || new Date().toISOString().split("T")[0]; // Default to today's date

    try {
      const data = await getCustomerBalanceDetail(cardCode, startDate, endDate);
      res.status(200).json(data); // Respond with the fetched data
    } catch (error) {
      console.error("Error fetching customer balance details:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

