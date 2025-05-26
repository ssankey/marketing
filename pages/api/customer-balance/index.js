

// import { getCustomerBalance } from "../../../lib/models/invoices";
// export default async function handler(req, res) {
//   if (req.method !== "GET") {
//     return res.status(405).json({ message: "Method Not Allowed" });
//   }

//   try {
//     // Remove pagination and get all data
//     const result = await getCustomerBalance({ pageSize: 10000 }); // Use a large number

//     return res.status(200).json({
//       invoices: result?.data || [],
//       totalItems: result?.totalItems || 0,
//     });
//   } catch (error) {
//     console.error("Error fetching invoice records:", error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// }


import { getCustomerBalance } from "../../../lib/models/invoices";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  try {
    const { data, totalItems } = await getCustomerBalance();
    return res.status(200).json({
      invoices: data,
      totalItems,
    });
  } catch (error) {
    console.error("Error fetching invoice records:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
