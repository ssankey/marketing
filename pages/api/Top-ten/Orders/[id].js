import { getLastTenOrders } from "lib/models/latestten";

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method === "GET") {
    const orders = await getLastTenOrders(id);
    res.status(200).json(orders);
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
