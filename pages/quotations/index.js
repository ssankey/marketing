import { useState, useEffect } from "react";
import LoadingSpinner from "components/LoadingSpinner";
import QuotationsTable from "components/QuotationsTable";
// import { getQuotations } from "lib/models/quotations";
import { useRouter } from "next/router";
import { useAuth } from "hooks/useAuth";
import { Spinner } from "react-bootstrap";

export default function QuotationsPage({
  quotations: initialQuotations,
  totalItems: initialTotalItems,
}) {
  const { isAuthenticated, isLoading: authLoading } = useAuth(); // Renamed for clarity


  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [quotations, setQuotations] = useState(initialQuotations);
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
    setQuotations(initialQuotations);
    setTotalItems(initialTotalItems);
  }, [initialQuotations, initialTotalItems]);

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


  if (router.isFallback) {
    return <LoadingSpinner />;
  }

  return (
    isAuthenticated ? (
      <QuotationsTable
        quotations={quotations}
        totalItems={totalItems}
        isLoading={isLoading}
      />
    ) : (
      null
    )
  );
}

// Static SEO properties for InvoicesPage
QuotationsPage.seo = {
  title: "Quotations | Density",
  description: "View and manage all your quotations.",
  keywords: "quotations, density",
};

// export async function getServerSideProps(context) {
//   try {
//     const {
//       page = 1,
//       search = "",
//       status = "all",
//       sortField = "DocNum",
//       sortDir = "desc",
//       fromDate,
//       toDate,
//     } = context.query;
//     console.log(context.query);
//     const ITEMS_PER_PAGE = 20;
//     const offset = (parseInt(page, 10) - 1) * ITEMS_PER_PAGE;

//     let whereClause = "1=1";

//     if (search) {
//       whereClause += ` AND (
//         T0.DocNum LIKE '%${search}%' OR 
//         T0.CardName LIKE '%${search}%' OR 
//         T1.ItemCode LIKE '%${search}%' OR 
//         T1.Dscription LIKE '%${search}%'
//       )`;
//     }
      
//       // if (search) {
//       //   whereClause += ` AND (
//       //   CAST(T0.DocNum AS VARCHAR) LIKE '%${search}%' OR 
//       //   T0.CardName LIKE '%${search}%' OR 
//       //   T1.ItemCode LIKE '%${search}%' OR 
//       //   T1.Dscription LIKE '%${search}%'
//       // )`;
//       // }

   

//     if (status && status !== "all") {
//       whereClause += ` AND (
//         CASE 
//           WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'N') THEN 'closed'
//           WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'Y') THEN 'cancel'
//           WHEN T0.DocStatus = 'O' THEN 'open'
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
//      SELECT COUNT(DISTINCT T0.DocEntry) as total
//       FROM OQUT T0  
//       INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
//       WHERE ${whereClause};

//     `;

//     const dataQuery = `
//       SELECT 
//       CASE 
//         WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'N') THEN 'Closed'
//         WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'Y') THEN 'Cancelled'
//         WHEN T0.DocStatus = 'O' THEN 'Open'
//         ELSE 'NA' 
//       END AS DocStatus,
//       T0.DocEntry,
//       T0.DocNum,
//       T0.DocDate,
//       T0.NumAtCard AS CustomerPONo,
//       T0.DocDueDate AS DeliveryDate,
//       T0.CardName,
//       T0.DocTotal,
//       T0.DocCur,
//       T5.SlpName AS SalesEmployee
//     FROM OQUT T0  
//     INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
//     WHERE ${whereClause}
//     ORDER BY ${sortField} ${sortDir}
//     OFFSET ${offset} ROWS
//     FETCH NEXT ${ITEMS_PER_PAGE} ROWS ONLY;
//     `;

//     const [totalResult, rawQuotations] = await Promise.all([
//       getQuotations(countQuery),
//       getQuotations(dataQuery),
//     ]);

//     console.log(totalResult);
//     console.log(rawQuotations);

//     const totalItems = totalResult[0]?.total || 0;
//     const quotations = rawQuotations.map((quotation) => ({
//       ...quotation,
//       DocDate: quotation.DocDate ? quotation.DocDate.toISOString() : null,
//       DeliveryDate: quotation.DeliveryDate ? quotation.DeliveryDate.toISOString() : null,
//     }));

//     return {
//       props: {
//         quotations: Array.isArray(quotations) ? quotations : [],
//         totalItems,
//         currentPage: parseInt(page, 10),
//       },
//     };
//   } catch (error) {
//     console.error("Error fetching quotations:", error);
//     return {
//       props: {
//         quotations: [],
//         totalItems: 0,
//         currentPage: 1,
//         error: "Failed to fetch quotations"
//       }
//     };
//   }
// }



export async function getServerSideProps(context) {
  const {
    page = 1,
    search = "",
    status = "all",
    sortField = "DocNum",
    sortDir = "desc",
    fromDate,
    toDate,
  } = context.query;

  try {

    const protocol = context.req.headers["x-forwarded-proto"] || "http";
    const host = context.req.headers.host || "localhost:3000";
    const apiUrl = `${protocol}://${host}/api/quotations`;


    const response = await fetch(
      `${apiUrl}?page=${page}&search=${search}&status=${status}&sortField=${sortField}&sortDir=${sortDir}&fromDate=${fromDate}&toDate=${toDate}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch quotations from API");
    }

    const { quotations, totalItems } = await response.json();

    return {
      props: {
        quotations,
        totalItems,
        currentPage: parseInt(page, 10),
      },
    };
  } catch (error) {
    console.error("Error fetching quotations:", error);
    return {
      props: {
        quotations: [],
        totalItems: 0,
        currentPage: 1,
        error: "Failed to fetch quotations",
      },
    };
  }
}
