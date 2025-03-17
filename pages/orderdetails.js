// pages/orderdetails.js
import { useRouter } from 'next/router';
import { Suspense } from 'react';
import { getCache, setCache, delCache } from 'lib/redis';
import OrderDetails from 'components/OrderDetails';
import { getOrderDetails } from '../lib/models/orders';

// Date serialization helper (moved outside for reusability)
const serializeDates = (obj) => {
  if (!obj) return obj;
  
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value instanceof Date) {
      acc[key] = value.toISOString();
    } else if (typeof value === 'object' && value !== null) {
      acc[key] = serializeDates(value);
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});
};

export default function OrderDetailsPage({ order, error }) {
  const router = useRouter();

  if (error) {
    return <div>Error loading order details: {error}</div>;
  }

  if (!order) {
    return <div>Order not found.</div>;
  }

  return (
    <Suspense fallback={<div>Loading order details...</div>}>
      <OrderDetails order={order} />
    </Suspense>
  );
}

export async function getServerSideProps(context) {
  const { d: docNum, e: docEntry } = context.query;
  if (!docNum || !docEntry || isNaN(docEntry) || isNaN(docNum)) {
    return { notFound: true };
  }

  const cacheKey = `order:${docEntry}:${docNum}`;

  try {
    // 1. Check Redis cache first
    const cachedOrder = await getCache(cacheKey);
    if (cachedOrder) {
      console.log('Cache hit for order:', cacheKey);
      return { props: { order: cachedOrder } };
    }

    // 2. Cache miss - fetch from database
    const rawOrder = await getOrderDetails(docEntry, docNum);
    if (!rawOrder) {
      return { notFound: true };
    }

    // 3. Serialize dates
    // (your same serializeDates logic)
    const serializeDates = (obj) => {
      if (!obj) return obj;
      return Object.entries(obj).reduce((acc, [key, value]) => {
        if (value instanceof Date) {
          acc[key] = value.toISOString();
        } else if (typeof value === 'object' && value !== null) {
          acc[key] = serializeDates(value);
        } else {
          acc[key] = value;
        }
        return acc;
      }, {});
    };
    const processedOrder = {
      ...rawOrder,
      ...serializeDates(rawOrder),
      LineItems: rawOrder.LineItems.map(item => serializeDates(item)),
    };

    // 4. Cache the processed order with 1-hour expiration
    await setCache(cacheKey, processedOrder, 3600);

    return { props: { order: processedOrder } };
  } catch (error) {
    console.error("Error fetching order details:", error);
    
    // Invalidate cache on critical errors
    if (error.message.includes('Database connection')) {
      await delCache(cacheKey);
    }
    
    return {
      props: {
        error: error.message.includes('timed out')
          ? 'Request timed out. Please try again.'
          : 'Failed to fetch order details',
      },
    };
  }
}