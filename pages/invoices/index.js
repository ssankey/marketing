import { useState, useEffect } from 'react';
import LoadingSpinner from 'components/LoadingSpinner';
import InvoicesTable from 'components/InvoicesTable';
import { getInvoices } from 'lib/models/invoices';
import { useRouter } from 'next/router';

export default function InvoicesPage({ invoices: initialInvoices, totalItems: initialTotalItems }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [totalItems, setTotalItems] = useState(initialTotalItems);

  // Handle loading state for client-side transitions
  useEffect(() => {
    const handleStart = () => setIsLoading(true);
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
    setInvoices(initialInvoices);
    setTotalItems(initialTotalItems);
  }, [initialInvoices, initialTotalItems]);

  if (router.isFallback) {
    return <LoadingSpinner />;
  }

  return (
    <InvoicesTable 
      invoices={invoices} 
      totalItems={totalItems}
      isLoading={isLoading}
    />
  );
}

// Static SEO properties for InvoicesPage
InvoicesPage.seo = {
  title: "Invoices | Density",
  description: "View and manage all your invoices.",
  keywords: "invoices, billing, management, density",
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

    let whereClause = '1=1'; // Base condition that's always true
    
    if (search) {
      whereClause += ` AND (
        T0.DocNum LIKE '%${search}%' OR 
        T0.CardName LIKE '%${search}%' OR 
        T1.ItemCode LIKE '%${search}%' OR 
        T1.Dscription LIKE '%${search}%'
      )`;
    }

    if (status !== 'all') {
      whereClause += ` AND (
        CASE 
          WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'closed'
          WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'cancel'
          WHEN T0.DocStatus='O' THEN 'open'
          ELSE 'NA'
        END = '${status}'
      )`;
    }

    if (fromDate) {
      whereClause += ` AND T0.DocDate >= '${fromDate}'`;
    }
    if (toDate) {
      whereClause += ` AND T0.DocDate <= '${toDate}'`;
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM OINV T0  
      INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry 
      LEFT JOIN OLCT T2 ON T1.LocCode = T2.Code 
      LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode 
      LEFT JOIN OITB T4 ON T4.ItmsGrpCod = T3.ItmsGrpCod 
      INNER JOIN OSLP T5 ON T0.slpcode = T5.slpcode
      WHERE ${whereClause};
    `;

    const dataQuery = `
      SELECT * FROM (
        SELECT 
          CASE 
            WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
            WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Canceled'
            WHEN T0.DocStatus='O' THEN 'Open' 
            ELSE 'NA' 
          END AS DocStatus,
          T0.DocEntry,
          T0.DocCur,
          T0.DocRate,
          T0.DocNum,
          T0.DocDate,
          T0.NumAtCard AS CustomerPONo,
          T0.TaxDate AS PODate,
          T0.CardName,
          T4.ItmsGrpNam AS ItemGroup,
          T1.ItemCode,
          T1.Dscription AS ItemName,
          ROUND(T1.Quantity, 2) AS Quantity,
          T1.UnitMsr AS UOMName,
          T3.OnHand AS StockStatus,
          T1.U_timeline,
          T3.SuppCatNum,
          T2.Location AS PlantLocation,
          ROUND(T1.Price, 3) AS Price,
          T1.Currency,
          T1.LineTotal,
          T5.SlpName AS SalesEmployee
        FROM OINV T0  
        INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry 
        LEFT JOIN OLCT T2 ON T1.LocCode = T2.Code 
        LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode 
        LEFT JOIN OITB T4 ON T4.ItmsGrpCod = T3.ItmsGrpCod 
        INNER JOIN OSLP T5 ON T0.slpcode = T5.slpcode
        WHERE ${whereClause}
      ) AS InvoicesData
      ORDER BY DocDate Desc
      OFFSET ${offset} ROWS
      FETCH NEXT ${ITEMS_PER_PAGE} ROWS ONLY;
    `;

    const [totalResult, rawInvoices] = await Promise.all([
      getInvoices(countQuery),
      getInvoices(dataQuery),
    ]);

    const totalItems = totalResult[0]?.total || 0;
    const invoices = rawInvoices.map((invoice) => ({
      ...invoice,
      DocDate: invoice.DocDate ? invoice.DocDate.toISOString() : null,
      PODate: invoice.PODate ? invoice.PODate.toISOString() : null,
    }));

    return {
      props: {
        invoices: Array.isArray(invoices) ? invoices : [],
        totalItems,
        currentPage: parseInt(page, 10),
      },
    };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return {
      props: {
        invoices: [],
        totalItems: 0,
      },
    };
  }
}
