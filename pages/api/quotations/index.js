// pages/api/quotation/index.js

import { getQuotations } from "../../../lib/models/quotations";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const orders = await getQuotations();
    res.status(200).json(orders);
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}


