// pages/api/orders/detail.js
import { getOrderDetails } from '../../../lib/models/orders';

export default async function handler(req, res) {
  const { d, e } = req.query; // Extract 'd' and 'e' from query parameters

  if (!d || !e) {
    return res.status(400).json({ error: 'Missing docNum (d) or docEntry (e) parameter' });
  }

  try {
    const orderDetails = await getOrderDetails(d, e);
    console.log(orderDetails);
    if (orderDetails.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json(orderDetails);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
}


