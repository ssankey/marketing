// pages/orderdetails.js

import { useRouter } from 'next/router';
import OrderDetails from 'components/OrderDetails';
import { getOrderDetails } from 'lib/models/orders';

export default function OrderDetailsPage({ order, error }) {
  const router = useRouter();

  if (error) {
    return <div>Error loading order details: {error}</div>;
  }

  if (!order) {
    return <div>Order not found.</div>;
  }

  return <OrderDetails order={order} />;
}

export async function getServerSideProps(context) {
  const { d: docNum, e: docEntry } = context.query;

  // Validate parameters
  if (!docNum || !docEntry || isNaN(docEntry) || isNaN(docNum)) {
    return {
      notFound: true,
    };
  }

  try {
    const order = await getOrderDetails(docEntry, docNum);

    if (!order) {
      return {
        notFound: true,
      };
    }

    // Convert Date fields to strings for serialization
    const processedOrder = {
      ...order,
      DocDate: order.DocDate ? order.DocDate.toISOString() : null,
      DocDueDate: order.DocDueDate ? order.DocDueDate.toISOString() : null,
      ShipDate: order.ShipDate ? order.ShipDate.toISOString() : null,
      LineItems: order.LineItems.map((item) => ({
        ...item,
        ShipDate: item.ShipDate ? item.ShipDate.toISOString() : null,
      })),
      Invoices: order.Invoices
        ? order.Invoices.map((invoice) => ({
            ...invoice,
            DocDate: invoice.DocDate ? invoice.DocDate.toISOString() : null,
            DocDueDate: invoice.DocDueDate ? invoice.DocDueDate.toISOString() : null,
          }))
        : [],
    };

    return {
      props: {
        order: processedOrder,
      },
    };
  } catch (error) {
    console.error('Error fetching order details:', error);
    return {
      props: {
        error: 'Failed to fetch order details',
      },
    };
  }
}
