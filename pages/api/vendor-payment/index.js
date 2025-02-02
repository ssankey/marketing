// pages/api/dashboard/vendors-balances.js
import { getVendorBalances } from "../../../lib/models/vendor-payment/getVendorBalance";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const data = await getVendorBalances();
      if (data) {
        res.status(200).json(data);
      } else {
        res.status(404).json({ message: "No Vendor Balances Found" });
      }
    } catch (error) {
      console.error("Error fetching vendor balances:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
