// pages/api/orders/[id].js
import { getOrderDetail } from 'lib/models/orders';

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method === 'GET') {
    const order = await getOrderDetail(id);
    if (order) {
      res.status(200).json(order);
    } else {
      res.status(404).json({ message: 'Order Not Found' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
