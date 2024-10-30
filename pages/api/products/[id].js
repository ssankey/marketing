// pages/api/customers/[id].js
import { getProductDetail } from "lib/models/products";

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method === "GET") {
    const order = await getProductDetail(id);
    if (order) {
      res.status(200).json(order);
    } else {
      res.status(404).json({ message: "Order Not Found" });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
