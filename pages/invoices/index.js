import { useState, useEffect } from 'react';
import LoadingSpinner from 'components/LoadingSpinner';
import InvoicesTable from 'components/InvoicesTable';
import { useRouter } from 'next/router';
import { useAuth } from 'hooks/useAuth';
import { Spinner } from 'react-bootstrap';
// import { getInvoices } from 'lib/models/invoices';

export default function InvoicesPage({ invoices: initialInvoices, totalItems: initialTotalItems }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth(); // Renamed for clarity

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [invoices, setInvoices] = useState(initialInvoices);
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
    setInvoices(initialInvoices);
    setTotalItems(initialTotalItems);
  }, [initialInvoices, initialTotalItems]);

   // Show a loader if still loading or redirecting
   if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <Spinner animation="border" role="status" style={{ color: "#007bff" }}>
          <span className="sr-only">Loading...</span>
        </Spinner>
        <div className="ms-3">Checking authentication...</div>
      </div>
    );
  }


  return (
    isAuthenticated ? (
      <InvoicesTable
      invoices={invoices}
      totalItems={totalItems}
      isLoading={isLoading}
      />
    ) : null
  );
}

// Static SEO properties for InvoicesPage
InvoicesPage.seo = {
  title: "Invoices | Density",
  description: "View and manage all your invoices.",
  keywords: "invoices, billing, management, density",
};

// export async function getServerSideProps(context) {
//   try {
//     const { 
//       page = 1, 
//       search = '', 
//       status = 'all',
//       fromDate,
//       toDate
//     } = context.query;

//     // Set default sorting parameters
//     const sortField = 'DocDate';
//     const sortDir = 'desc';

//     const ITEMS_PER_PAGE = 20;
//     const offset = (parseInt(page, 10) - 1) * ITEMS_PER_PAGE;

//     let whereClause = '1=1';

//     if (search) {
//       whereClause += ` AND (
//         T0.DocNum LIKE '%${search}%' OR 
//         T0.CardName LIKE '%${search}%' OR 
//         T0.NumAtCard LIKE '%${search}%'
//       )`;
//     }

//     if (status !== 'all') {
//       whereClause += ` AND (
//         CASE 
//           WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'closed'
//           WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'canceled'
//           WHEN T0.DocStatus='O' THEN 'open'
//           ELSE 'NA'
//         END = '${status}'
//       )`;
//     }

//     if (fromDate) {
//       whereClause += ` AND T0.DocDate >= '${fromDate}'`;
//     }
//     if (toDate) {
//       whereClause += ` AND T0.DocDate <= '${toDate}'`;
//     }

//     const countQuery = `
//       SELECT COUNT(DISTINCT T0.DocEntry) as total
//       FROM OINV T0
//       INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
//       WHERE ${whereClause};
//     `;

//     const dataQuery = `
//   SELECT 
//     CASE 
//       WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
//       WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Canceled'
//       WHEN T0.DocStatus='O' THEN 'Open' 
//       ELSE 'NA' 
//     END AS DocStatus,
//     T0.DocEntry,
//     T0.DocNum,
//     T0.DocDate,
//     T0.NumAtCard AS CustomerPONo,
//     T0.TaxDate AS PODate,
//     T0.DocDueDate,
//     T0.CardName,
//     -- Calculate InvoiceTotal based on the logic for Invoice or Credit Note
//     CASE 
//       WHEN T0.CurSource='L' AND T0.DpmAmnt <> 0 THEN (T0.DpmAmnt + T0.DpmVat) 
//       ELSE T0.DocTotal 
//     END AS InvoiceTotal,
//     T0.DocCur,
//     T0.DocRate,
//     T5.SlpName AS SalesEmployee,
//     CASE 
//       WHEN T1.Country = 'IN' THEN 'Domestic' 
//       ELSE 'Export' 
//     END AS TradeType,
//     T1.GroupCode,
//     (SELECT GroupName FROM OCRG WHERE GroupCode = T1.GroupCode) AS [CustomerGroup],
//     T0.ShipToCode,
//     (SELECT TOP 1 GSTRegnNo FROM CRD1 WHERE CardCode = T0.CardCode AND AdresType='S' AND Address = T0.ShipToCode) AS GSTIN,
//     T0.Comments
//   FROM OINV T0
//   INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
//   INNER JOIN OCRD T1 ON T0.CardCode = T1.CardCode
//   WHERE ${whereClause}
//   ORDER BY ${sortField} ${sortDir}
//   OFFSET ${offset} ROWS
//   FETCH NEXT ${ITEMS_PER_PAGE} ROWS ONLY;
// `;



//     const [totalResult, rawInvoices] = await Promise.all([
//       getInvoices(countQuery),
//       getInvoices(dataQuery),
//     ]);

//     const totalItems = totalResult[0]?.total || 0;
//     const invoices = rawInvoices.map((invoice) => ({
//       ...invoice,
//       DocDate: invoice.DocDate ? invoice.DocDate.toISOString() : null,
//       PODate: invoice.PODate ? invoice.PODate.toISOString() : null,
//       DocDueDate: invoice.DocDueDate ? invoice.DocDueDate.toISOString() : null,
//     }));

//     return {
//       props: {
//         invoices: Array.isArray(invoices) ? invoices : [],
//         totalItems,
//         currentPage: parseInt(page, 10),
//       },
//     };
//   } catch (error) {
//     console.error('Error fetching invoices:', error);
//     return {
//       props: {
//         invoices: [],
//         totalItems: 0,
//         currentPage: 1,
//         error: 'Failed to fetch invoices',
//       },
//     };
//   }
// }



export async function getServerSideProps(context) {
  try {
    const {
      page = 1,
      search = "",
      status = "all",
      fromDate,
      toDate,
    } = context.query;

    const protocol = context.req.headers["x-forwarded-proto"] || "http";
    const host = context.req.headers.host || "localhost:3000";
    const apiUrl = `${protocol}://${host}/api/invoices`;

    // Fetch invoices via API
    const response = await fetch(
      `${apiUrl}?page=${page}&search=${search}&status=${status}&fromDate=${
        fromDate || ""
      }&toDate=${toDate || ""}`
    );
    const data = await response.json();

    return {
      props: {
        invoices: data.invoices || [],
        totalItems: data.totalItems || 0,
        currentPage: parseInt(page, 10),
      },
    };
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return {
      props: {
        invoices: [],
        totalItems: 0,
        currentPage: 1,
        error: "Failed to fetch invoices",
      },
    };
  }
}

