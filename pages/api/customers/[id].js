// pages/api/customers/[id].js
// import { getCustomerDetail } from "lib/models/customers";

// export default async function handler(req, res) {
//   const { id } = req.query;
//   if (req.method === "GET") {
//     const customer = await getCustomerDetail(id);
//     if (customer) {
//       res.status(200).json(customer);
//     } else {
//       res.status(404).json({ message: "Customer Not Found" });
//     }
//   } else {
//     res.status(405).json({ message: "Customer Not Allowed" });
//   }
// }


import { getCustomerDetail } from "lib/models/customers";
import {getCustomerPurchaseAndRevenue}  from "lib/models/specific-customer";

export default async function handler(req, res) {
  const { id, metrics, year } = req.query;

  // Ensure the `id` parameter is provided
  if (!id) {
    return res.status(400).json({ message: "Customer ID is required" });
  }

  try {
    // Handle metrics fetching
    if (metrics === "true") {
      if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
      }

      const yearValue = parseInt(year) || new Date().getFullYear();
      const data = await getCustomerPurchaseAndRevenue(id, yearValue);

      if (!data || data.length === 0) {
        return res
          .status(404)
          .json({ message: "No data found for this customer" });
      }

      return res.status(200).json(data);
    }

    // Handle customer detail fetching
    if (req.method === "GET") {
      const customer = await getCustomerDetail(id);

      if (customer) {
        return res.status(200).json(customer);
      } else {
        return res.status(404).json({ message: "Customer Not Found" });
      }
    }

    return res.status(405).json({ message: "Method Not Allowed" });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      message: "Failed to process request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
