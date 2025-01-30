//  // pages/api/customer-balance/index.js
// import { getCustomerBalances } from "../../../lib/models/customer-balance/getCustomerBalance";

// export default async function handler(req, res) {
//   if (req.method === "GET") {
//     try {
//       const data = await getCustomerBalances();
//       if (data) {
//         res.status(200).json(data);
//       } else {
//         res.status(404).json({ message: "No Customer Balances Found" });
//       }
//     } catch (error) {
//       console.error("Error fetching customer balances:", error);
//       res.status(500).json({ message: "Internal Server Error" });
//     }
//   } else {
//     res.status(405).json({ message: "Method Not Allowed" });
//   }
// }


// pages/api/customer-balance/index.js

import { getCustomerBalances } from "../../../lib/models/customer-balance/getCustomerBalance";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      // This returns an *array* of balance rows
      const data = await getCustomerBalances();

      if (data && Array.isArray(data)) {
        // Wrap in an object so front-end can access `balances` and `totalItems`
        res.status(200).json({
          balances: data,
          totalItems: data.length,
        });
      } else {
        res.status(404).json({ message: "No Customer Balances Found" });
      }
    } catch (error) {
      console.error("Error fetching customer balances:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
