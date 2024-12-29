// // pages/api/orders/index.js


// import { getOrders } from '../../../lib/models/orders';

// export default async function handler(req, res) {
//   if (req.method === 'GET') {
//     const orders = await getOrders();
//     res.status(200).json(orders);
//   } else {
//     res.status(405).json({ message: 'Method Not Allowed' });
//   }
// }


//  pages/api/orders/index.js


import { getOrdersFromDatabase } from "../../../lib/models/orders";
import { parseISO, isValid } from "date-fns";

function isValidDate(date) {
  return date && isValid(parseISO(date));
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const {
      page = 1,
      search = "",
      status = "all",
      sortField = "DocNum",
      sortDir = "asc",
      fromDate,
      toDate,
    } = req.query;

    const ITEMS_PER_PAGE = 20;

    const { totalItems, orders } = await getOrdersFromDatabase({
      search,
      sortField,
      sortDir,
      offset: (parseInt(page, 10) - 1) * ITEMS_PER_PAGE,
      ITEMS_PER_PAGE,
      status,
      fromDate: isValidDate(fromDate) ? fromDate : undefined,
      toDate: isValidDate(toDate) ? toDate : undefined,
    });

    res
      .status(200)
      .json({ orders, totalItems, currentPage: parseInt(page, 10) });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
}
