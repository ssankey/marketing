// pages/api/dashboard/vendors-balances.js
import { getVendorBalances } from "../../../lib/models/vendor-payment/getVendorBalance";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const filters = {
        overdueDays: req.query.overdueDays || '',
        paymentTerms: req.query.paymentTerms || ''
      };

      const data = await getVendorBalances(filters);
      
      if (data && data.length > 0) {
        res.status(200).json(data);
      } else {
        res.status(404).json({ message: "No vendor balances found with these filters" });
      }
    } catch (error) {
      console.error("Error fetching vendor balances:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}