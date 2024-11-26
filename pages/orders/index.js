import { useState, useEffect } from "react";
import OrdersTable from "components/OrdersTable";
import { useRouter } from "next/router";
import { getOrders } from "lib/models/orders";

export default function OrdersPage({
  orders: initialOrders,
  totalItems: initialTotalItems,
  totalPages,
}) {
  const router = useRouter();
  const { page = 1 } = router.query;
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

  // Update local state when props or page change
  useEffect(() => {
    setOrders(initialOrders);
    setTotalItems(initialTotalItems);
  }, [initialOrders, initialTotalItems, page]);

  return (
    <OrdersTable
      orders={orders}
      totalItems={totalItems}
      isLoading={isLoading}
      currentPage={parseInt(page, 10)}
      totalPages={totalPages}
    />
  );
}

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
        T3.DocNum LIKE '%${search}%'
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
    
    const dataQuery = `
    SELECT DISTINCT
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
      T5.SlpName AS SalesEmployee,
      T3.DocEntry AS InvoiceDocEntry,
      T3.DocNum AS InvoiceNum,
      T3.DocDate AS InvoiceDate,
      T3.DocTotal AS InvoiceTotal,
      PC.ProductCount,
      CASE 
        WHEN T3.DocStatus = 'O' THEN 'Open'
        WHEN T3.DocStatus = 'C' THEN 'Closed'
        ELSE 'NA' 
      END AS InvoiceStatus
    FROM ORDR T0
    INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    LEFT JOIN (
        -- Subquery to get the product count per order
        SELECT DocEntry, COUNT(DISTINCT ItemCode) AS ProductCount
        FROM RDR1
        GROUP BY DocEntry
    ) PC ON PC.DocEntry = T0.DocEntry
    LEFT JOIN (
        -- Subquery to get invoice DocEntry per order, including invoices from deliveries
        SELECT BaseEntry, MAX(InvoiceDocEntry) AS InvoiceDocEntry
        FROM (
            -- Invoices created directly from Sales Orders
            SELECT 
              INV1.BaseEntry AS BaseEntry,
              INV1.DocEntry AS InvoiceDocEntry
            FROM INV1
            WHERE INV1.BaseType = 17 -- Sales Order
  
            UNION ALL
  
            -- Invoices created from Deliveries linked to Sales Orders
            SELECT 
              DLN1.BaseEntry AS BaseEntry,
              INV1.DocEntry AS InvoiceDocEntry
            FROM INV1
            INNER JOIN DLN1 ON INV1.BaseEntry = DLN1.DocEntry AND INV1.BaseLine = DLN1.LineNum AND INV1.BaseType = 15 -- Delivery
            WHERE DLN1.BaseType = 17 -- Sales Order
        ) AS InvoiceData
        GROUP BY BaseEntry
    ) INV_SO ON INV_SO.BaseEntry = T0.DocEntry
    LEFT JOIN OINV T3 ON T3.DocEntry = INV_SO.InvoiceDocEntry
    WHERE ${whereClause}
    ORDER BY ${sortField} ${sortDir}
    OFFSET ${offset} ROWS
    FETCH NEXT ${ITEMS_PER_PAGE} ROWS ONLY;
    
  -- Count query
  WITH ProductCounts AS (
      SELECT DocEntry, COUNT(DISTINCT ItemCode) AS ProductCount
      FROM RDR1
      GROUP BY DocEntry
  )
  SELECT COUNT(DISTINCT T0.DocEntry) AS total,
         SUM(PC.ProductCount) AS TotalProductCount
  FROM ORDR T0
  INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
  LEFT JOIN ProductCounts PC ON PC.DocEntry = T0.DocEntry
  WHERE ${whereClause};
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
      InvoiceDate: order.InvoiceDate ? order.InvoiceDate.toISOString() : null,
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
