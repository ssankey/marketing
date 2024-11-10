// // pages/api/orders/[id].js
// import { getOrderDetail } from '../../../lib/models/order';

// export default async function handler(req, res) {
//   const { id } = req.query; // Existing 'id' parameter
//   const { d, e } = req.query; // Extract 'd' and 'e'

//   if (!d || !e) {
//     return res.status(400).json({ error: 'Missing docNum (d) or docEntry (e) parameter' });
//   }

//   try {
//     const orderDetails = await getOrderDetail(d, e);
//     if (orderDetails.length === 0) {
//       return res.status(404).json({ error: 'Order not found' });
//     }
//     res.status(200).json(orderDetails);
//   } catch (error) {
//     console.error('Error fetching order details:', error);
//     res.status(500).json({ error: 'Failed to fetch order details' });
//   }
// }
