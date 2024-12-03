// 

import { useState, useEffect } from "react";
import LoadingSpinner from "components/LoadingSpinner";
import OrdersTable from "components/OrdersTable";
import { useRouter } from "next/router";
import { getOrders } from "lib/models/orders";

export default function OrdersPage({
  orders: initialOrders,
  totalItems: initialTotalItems,
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState(initialOrders);
  const [totalItems, setTotalItems] = useState(initialTotalItems);

  // Handle loading state for client-side transitions
  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  // Update local state when props change
  useEffect(() => {
    setOrders(initialOrders);
    setTotalItems(initialTotalItems);
  }, [initialOrders, initialTotalItems]);



  return (
    <OrdersTable
      orders={orders}
      totalItems={totalItems}
      isLoading={isLoading}
    />
  );
}

// SEO properties for OrdersPage
OrdersPage.seo = {
  title: "Orders | Density",
  description: "View and manage all your orders.",
  keywords: "orders, sales, management",
};

export async function getServerSideProps(context) {
  try {
    const {
      page = 1,
      search = "",
      status = "all",
      fromDate,
      toDate,
    } = context.query;

    // Set default sorting parameters
    const sortField = 'DocDate';
    const sortDir = 'desc';

    const ITEMS_PER_PAGE = 20;
    const offset = (parseInt(page) - 1) * ITEMS_PER_PAGE;

    // Build the WHERE clause based on filters
    let whereClause = "1=1"; // Base condition that's always true

    // Apply search filters
    if (search) {
      whereClause += ` AND (
        T0.DocNum LIKE '%${search}%' OR 
        T0.CardName LIKE '%${search}%' OR
        T5.SlpName LIKE '%${search}%'
      )`;
    }

    // Apply status filter
    if (status && status !== "all") {
      whereClause += ` AND (
        CASE 
          WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'closed'
          WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'cancel'
          WHEN T0.DocStatus='O' THEN 'open'
          ELSE 'NA'
        END = '${status}'
      )`;
    }

    // Add date filters
    if (fromDate) {
      whereClause += ` AND T0.DocDate >= '${fromDate}'`;
    }
    if (toDate) {
      whereClause += ` AND T0.DocDate <= '${toDate}'`;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT T0.DocEntry) as total
      FROM ORDR T0
      INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      WHERE ${whereClause};
    `;

    // Get paginated data
    const dataQuery = `
  SELECT 
    CASE 
      WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
      WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
      WHEN T0.DocStatus='O' THEN 'Open' 
      ELSE 'NA' 
    END AS DocStatus,
    T0.DocEntry,
    T0.DocNum,
    T0.DocDate,
    T0.NumAtCard AS CustomerPONo,
    T0.TaxDate AS PODate,
    T0.DocDueDate AS DeliveryDate,
    T0.CardName,
    T0.DocTotal,
    T0.DocCur,
    T0.DocRate,
    T5.SlpName AS SalesEmployee,
    COUNT(DISTINCT T1.ItemCode) AS ProductCount -- Count of unique products in the order
  FROM ORDR T0
  INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
  INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry -- Join to get product details
  WHERE ${whereClause}
  GROUP BY 
    T0.DocStatus,
    T0.CANCELED,
    T0.DocEntry,
    T0.DocNum,
    T0.DocDate,
    T0.NumAtCard,
    T0.TaxDate,
    T0.DocDueDate,
    T0.CardName,
    T0.DocTotal,
    T0.DocCur,
    T0.DocRate,
    T5.SlpName
  ORDER BY ${sortField} ${sortDir}
  OFFSET ${offset} ROWS
  FETCH NEXT ${ITEMS_PER_PAGE} ROWS ONLY;
`;


    const [totalResult, rawOrders] = await Promise.all([
      getOrders(countQuery),
      getOrders(dataQuery),
    ]);

    // Process data and return as props
    const totalItems = totalResult[0]?.total || 0;
    const orders = rawOrders.map((order) => ({
      ...order,
      DocDate: order.DocDate ? order.DocDate.toISOString() : null,
      PODate: order.PODate ? order.PODate.toISOString() : null,
      DeliveryDate: order.DeliveryDate ? order.DeliveryDate.toISOString() : null,
    }));

    return {
      props: {
        orders: Array.isArray(orders) ? orders : [],
        totalItems,
        currentPage: parseInt(page, 10),
      },
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return {
      props: {
        orders: [],
        totalItems: 0,
      },
    };
  }
}

