

// import { useState, useEffect } from "react";
// import LoadingSpinner from "components/LoadingSpinner";
// import QuotationsTable from "components/QuotationsTable";
// import { getQuotations } from "lib/models/quotations";
// import { useRouter } from "next/router";

// export default function QuotationsPage({
//   quotations: initialQuotations,
//   totalItems: initialTotalItems,
// }) {
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(false);
//   const [quotations, setQuotations] = useState(initialQuotations);
//   const [totalItems, setTotalItems] = useState(initialTotalItems);

//   // Handle loading state for client-side transitions
//   useEffect(() => {
//     const handleStart = () => setIsLoading(true);
//     const handleComplete = () => setIsLoading(false);

//     router.events.on("routeChangeStart", handleStart);
//     router.events.on("routeChangeComplete", handleComplete);
//     router.events.on("routeChangeError", handleComplete);

//     return () => {
//       router.events.off("routeChangeStart", handleStart);
//       router.events.off("routeChangeComplete", handleComplete);
//       router.events.off("routeChangeError", handleComplete);
//     };
//   }, [router]);

//   // Update local state when props change
//   useEffect(() => {
//     setQuotations(initialQuotations);
//     setTotalItems(initialTotalItems);
//   }, [initialQuotations, initialTotalItems]);

//   if (router.isFallback) {
//     return <LoadingSpinner />;
//   }

//   return (
//     <QuotationsTable
//       quotations={quotations}
//       totalItems={totalItems}
//       isLoading={isLoading}
//     />
//   );
// }

// export async function getServerSideProps(context) {
//   try {
//     const {
//       page = 1,
//       search = "",
//       status = "all",
//       sortField = "DocNum",
//       sortDir = "asc",
//       fromDate,
//       toDate,
//     } = context.query;

//     const ITEMS_PER_PAGE = 20;
//     const offset = (parseInt(page) - 1) * ITEMS_PER_PAGE;

//     let whereClause = "1=1";

//     if (search) {
//       whereClause += ` AND (
//           T0.DocNum LIKE '%${search}%' OR 
//           T0.CardName LIKE '%${search}%' OR 
//           T1.ItemCode LIKE '%${search}%' OR 
//           T1.Dscription LIKE '%${search}%'
//         )`;
//     }

//     // Check if status is defined and not 'all'
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
//       SELECT COUNT(*) as total
//       FROM OQUT T0  
//       INNER JOIN QUT1 T1 ON T0.DocEntry = T1.DocEntry 
//       WHERE ${whereClause};
//     `;

//     const dataQuery = `
//       SELECT 
//         T0.DocNum,
//         T0.DocDate,
//         T0.CardName,
//         T1.ItemCode,
//         T1.Dscription
//       FROM OQUT T0  
//       INNER JOIN QUT1 T1 ON T0.DocEntry = T1.DocEntry 
//       WHERE ${whereClause}
//       ORDER BY ${sortField} ${sortDir}
//       OFFSET ${offset} ROWS
//       FETCH NEXT ${ITEMS_PER_PAGE} ROWS ONLY;
//     `;

//     const [totalResult, rawQuotations] = await Promise.all([
//       getQuotations(countQuery),
//       getQuotations(dataQuery),
//     ]);

//     const totalItems = totalResult[0]?.total || 0;
//     const quotations = rawQuotations.map((quotation) => ({
//       ...quotation,
//       DocDate: quotation.DocDate ? quotation.DocDate.toISOString() : null,
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
//       },
//     };
//   }
// }


import { useState, useEffect } from "react";
import LoadingSpinner from "components/LoadingSpinner";
import QuotationsTable from "components/QuotationsTable";
import { getQuotations } from "lib/models/quotations";
import { useRouter } from "next/router";

export default function QuotationsPage({
  quotations: initialQuotations,
  totalItems: initialTotalItems,
}) {
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

  if (router.isFallback) {
    return <LoadingSpinner />;
  }

  return (
    <QuotationsTable
      quotations={quotations}
      totalItems={totalItems}
      isLoading={isLoading}
    />
  );
}

  // Static SEO properties for InvoicesPage
  QuotationsPage.seo = {
    title: "Quotations | Density",
    description: "View and manage all your quotations.",
    keywords: "quotations, density",
  };

export async function getServerSideProps(context) {
  try {
    const {
      page = 1,
      search = "",
      status = "all",
      sortField = "DocNum",
      sortDir = "asc",
      fromDate,
      toDate,
    } = context.query;

    const ITEMS_PER_PAGE = 20;
    const offset = (parseInt(page, 10) - 1) * ITEMS_PER_PAGE;

    let whereClause = "1=1";

    if (search) {
      whereClause += ` AND (
          T0.DocNum LIKE '%${search}%' OR 
          T0.CardName LIKE '%${search}%' OR 
          T1.ItemCode LIKE '%${search}%' OR 
          T1.Dscription LIKE '%${search}%'
        )`;
    }

    // Check if status is defined and not 'all'
    if (status && status !== "all") {
      whereClause += ` AND (
        CASE 
          WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'N') THEN 'closed'
          WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'Y') THEN 'cancel'
          WHEN T0.DocStatus = 'O' THEN 'open'
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
      FROM OQUT T0  
      INNER JOIN QUT1 T1 ON T0.DocEntry = T1.DocEntry 
      WHERE ${whereClause};
    `;

    // const dataQuery = `
    //   SELECT 
    //     T0.DocNum,
    //     T0.DocDate,
    //     T0.CardName,
    //     T1.ItemCode,
    //     T1.Dscription
    //   FROM OQUT T0  
    //   INNER JOIN QUT1 T1 ON T0.DocEntry = T1.DocEntry 
    //   WHERE ${whereClause}
    //   ORDER BY ${sortField} ${sortDir}
    //   OFFSET ${offset} ROWS
    //   FETCH NEXT ${ITEMS_PER_PAGE} ROWS ONLY;
    // `;

    const dataQuery = `
  SELECT 
    CASE 
      WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'N') THEN 'Closed'
      WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'Y') THEN 'Cancel'
      WHEN T0.DocStatus = 'O' THEN 'Open'
      ELSE 'NA' 
    END AS "DocStatus", -- Added the CASE statement for DocStatus
    T0.DocNum,
    T0.DocDate,
    T0.DocCur,
      T0.DocRate,
    T0.CardName,
    T1.ItemCode,
    T1.Dscription
  FROM OQUT T0  
  INNER JOIN QUT1 T1 ON T0.DocEntry = T1.DocEntry 
  WHERE ${whereClause}
  ORDER BY ${sortField} ${sortDir}
  OFFSET ${offset} ROWS
  FETCH NEXT ${ITEMS_PER_PAGE} ROWS ONLY;
`;


    const [totalResult, rawQuotations] = await Promise.all([
      getQuotations(countQuery),
      getQuotations(dataQuery),
    ]);

    const totalItems = totalResult[0]?.total || 0;
    const quotations = rawQuotations.map((quotation) => ({
      ...quotation,
      DocDate: quotation.DocDate ? quotation.DocDate.toISOString() : null,
    }));

    return {
      props: {
        quotations: Array.isArray(quotations) ? quotations : [],
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
      },
    };
  }
}
