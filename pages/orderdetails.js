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

  if (!docNum || !docEntry || isNaN(docEntry) || isNaN(docNum)) {
    return { notFound: true };
  }

  try {
    const order = await getOrderDetails(docEntry, docNum);

    if (!order) {
      return { notFound: true };
    }

    // Helper function to safely convert dates
    const serializeDate = (date) => (date ? new Date(date).toISOString() : null);

    // Convert date fields
    const processedOrder = {
      ...order,
      DocDate: serializeDate(order.DocDate),
      DocDueDate: serializeDate(order.DocDueDate),
      ShipDate: serializeDate(order.ShipDate),
      InvoiceDate: serializeDate(order.InvoiceDate),
      LineItems: order.LineItems.map((item) => ({
        ...item,
        ShipDate: serializeDate(item.ShipDate),
        // If there's an invoice date in the lines, you can convert similarly:
        // InvoiceDate: serializeDate(item.InvoiceDate),
      })),
    };

    return {
      props: { order: processedOrder },
    };
  } catch (error) {
    console.error("Error fetching order details:", error);
    return {
      props: { error: "Failed to fetch order details" },
    };
  }
}
