// pages/api/products/index.js

import { getProducts } from "../../../lib/models/products";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const orders = await getProducts();
    res.status(200).json(orders);
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
