import { useState, useEffect } from 'react';
import LoadingSpinner from 'components/LoadingSpinner';
import OrdersTable from 'components/OrdersTable';
import { getOrders } from 'lib/models/orders';
import { useRouter } from 'next/router';

export default function OrdersPage({ orders: initialOrders, totalItems: initialTotalItems }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState(initialOrders);
  const [totalItems, setTotalItems] = useState(initialTotalItems);

  // Handle loading state for client-side transitions
  useEffect(() => {
    // Show loading state when route changes start
    const handleStart = () => setIsLoading(true);
    // Hide loading state when route changes complete
    const handleComplete = () => setIsLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  // Update local state when props change
  useEffect(() => {
    setOrders(initialOrders);
    setTotalItems(initialTotalItems);
  }, [initialOrders, initialTotalItems]);

  // Show loading spinner for initial server-side load
  if (router.isFallback) {
    return <LoadingSpinner />;
  }

  return (
    <OrdersTable 
      orders={orders} 
      totalItems={totalItems}
      isLoading={isLoading}
    />
  );
  


}
  // Static SEO properties for InvoicesPage
  OrdersPage.seo = {
    title: "Orders | Density",
    description: "View and manage all your Orders.",
    keywords: "Orders, sales",
  };

export async function getServerSideProps(context) {
  try {
      const { 
        page = 1, 
        search = '', 
        status = 'all',
        sortField = 'DocEntry',
        sortDir = 'asc',
        fromDate,
        toDate
      } = context.query;
      
      const ITEMS_PER_PAGE = 20;
      const offset = (parseInt(page) - 1) * ITEMS_PER_PAGE;
  
      // Build the WHERE clause based on filters
      let whereClause = '1=1'; // Base condition that's always true
      
      if (search) {
        whereClause += ` AND (
          T0.DocNum LIKE '%${search}%' OR 
          T0.CardName LIKE '%${search}%' OR 
          T1.ItemCode LIKE '%${search}%' OR 
          T1.Dscription LIKE '%${search}%'
        )`;
      }
  
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
      SELECT COUNT(*) as total
      FROM ORDR T0  
      INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry 
      INNER JOIN OLCT T2 ON T1.LocCode = T2.Code 
      LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode 
      LEFT JOIN OITB T4 ON T4.ItmsGrpCod = T3.ItmsGrpCod 
      INNER JOIN OSLP T5 ON T0.slpcode = T5.slpcode
      WHERE ${whereClause};
    `;


    // Get paginated data
    const dataQuery = `
  SELECT * FROM (
    SELECT 
      Case When (T0.DocStatus='C' and T0.CANCELED='N') Then 'Closed'
           When (T0.DocStatus='C' and T0.CANCELED='Y') Then 'Cancel'
           When T0.DocStatus='O' Then 'Open' Else 'NA' End "DocStatus",
      T0.DocEntry,
      T0.DocCur,
      T0.DocRate,
      T0.DocNum,
      T0.DocDate,
      T0.DocTotal,
      T0.NumAtCard as "CustomerPONo",
      T0.TaxDate as "PODate",
      T0.CardName,
      T4.ItmsGrpNam AS ItemGroup,
      T1.ItemCode,
      T1.Dscription as ItemName,
      Case When (T1.LineStatus='C') Then 'Closed'
           When T1.LineStatus='O' Then 'Open' Else 'NA' End "LineStatus",
      round(T1.Quantity, 2) as Quantity,
      T1.UnitMsr as UOMName,
      round(T1.OpenQty, 2) as OpenQty,
      T3.onhand as StockStatus,
      T1.U_timeline,
      T3.suppcatnum,
      T1.DelivrdQty,
      T1.ShipDate as DeliveryDate,
      T2.Location as PlantLocation,
      round(T1.Price, 3) as Price,
      T1.Currency,
      (T1.OpenQty * T1.Price) AS OpenAmount,
      T5.slpname as SalesEmployee
    FROM ORDR T0  
    INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry 
    INNER JOIN OLCT T2 ON T1.LocCode = T2.Code 
    LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode 
    LEFT JOIN OITB T4 ON T4.ItmsGrpCod = T3.ItmsGrpCod 
    INNER JOIN OSLP T5 ON T0.slpcode = T5.slpcode
    WHERE ${whereClause}
  ) AS OrdersData
  ORDER BY ${sortField} ${sortDir}
  OFFSET ${offset} ROWS
  FETCH NEXT ${ITEMS_PER_PAGE} ROWS ONLY;
`;


    const [totalResult, rawOrders] = await Promise.all([
      getOrders(countQuery),
      getOrders(dataQuery)
    ]);

    const totalItems = totalResult[0]?.total || 0;
    let orders = rawOrders.map(order => ({
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
    console.error('Error fetching orders:', error);
    return {
      props: {
        orders: [],
        totalItems: 0,
      },
    };
  }
}