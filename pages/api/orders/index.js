// pages/api/orders/index.js
import { getOrders } from '../../../lib/models/orders';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const orders = await getOrders();
    res.status(200).json(orders);
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
