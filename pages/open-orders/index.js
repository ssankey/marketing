import { useState, useEffect } from "react";
import OpenOrdersTable from "components/OpenOrdersTable";
import { useRouter } from "next/router";
import { getOrders } from "lib/models/orders";

export default function OpenOrdersPage({
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
    <OpenOrdersTable
      orders={orders}
      totalItems={totalItems}
      isLoading={isLoading}
    />
  );
}

// SEO properties for OpenOrdersPage
OpenOrdersPage.seo = {
  title: "Open Orders | Density",
  description: "View and manage all your open orders with stock details.",
  keywords: "open orders, sales, stock management",
};

export async function getServerSideProps(context) {
  try {
    const {
      page = 1,
      search = "",
      fromDate,
      toDate,
    } = context.query;

    // Set default sorting parameters
    const sortField = "DocDate";
    const sortDir = "desc";

    const ITEMS_PER_PAGE = 20;
    const offset = (parseInt(page) - 1) * ITEMS_PER_PAGE;

    // Build the WHERE clause for open orders
    let whereClause = "T0.DocStatus = 'O' AND T1.LineStatus = 'O'"; // Only open orders and lines

    // Apply search filters
    if (search) {
      whereClause += ` AND (
        T0.DocNum LIKE '%${search}%' OR 
        T0.CardName LIKE '%${search}%' OR 
        T1.ItemCode LIKE '%${search}%'
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
      INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
      WHERE ${whereClause};
    `;

    // Get paginated data
    const dataQuery = `
      SELECT 
        T0.DocEntry,
        T0.DocNum,
        T0.DocDate,
        T0.CardName,
        T1.ItemCode,
        T1.Dscription AS ItemName,
        T1.Quantity,
        T1.OpenQty,
        T3.OnHand AS Stock,
        CASE 
          WHEN T3.OnHand >= T1.OpenQty THEN 'In Stock'
          ELSE 'Out of Stock'
        END AS StockStatus,
        T1.Price,
        T1.LineTotal,
        T1.Currency,
        (T1.OpenQty * T1.Price) AS OpenAmount,
        T0.DocCur,
        T0.DocRate,
        T1.ShipDate AS DeliveryDate,
        T5.SlpName AS SalesEmployee
      FROM ORDR T0  
      INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry 
      LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
      INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      WHERE ${whereClause}
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
      DeliveryDate: order.DeliveryDate
        ? order.DeliveryDate.toISOString()
        : null,
    }));

    return {
      props: {
        orders: Array.isArray(orders) ? orders : [],
        totalItems,
        currentPage: parseInt(page, 10),
      },
    };
  } catch (error) {
    console.error("Error fetching open orders:", error);
    return {
      props: {
        orders: [],
        totalItems: 0,
      },
    };
  }
}
