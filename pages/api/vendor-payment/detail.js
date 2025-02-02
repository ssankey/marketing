// api/vendorPayment.js
import { getVendorPaymentDetail } from "lib/models/vendor-payment/getVendorPaymentDetail";


export default async function handler(req, res) {
  if (req.method === "GET") {
    let { cardCode, startDate, endDate } = req.query;

    // Set default values if parameters are not provided
    startDate = startDate || "1900-01-01"; // Earliest possible date
    endDate = endDate || new Date().toISOString().split("T")[0]; // Today's date

    try {
      const data = await getVendorPaymentDetail(cardCode || null, startDate, endDate);
      res.status(200).json(data);
    } catch (error) {
      console.error("Error fetching vendor payment details:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
