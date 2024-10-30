// pages/api/customers/index.js

import { getCustomers } from "../../../lib/models/customers";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const orders = await getCustomers();
    res.status(200).json(orders);
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
