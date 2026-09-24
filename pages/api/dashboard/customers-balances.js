

  import { queryDatabase } from "../../../lib/db";
  import sql from "mssql";
  import { getCache, setCache, delCache } from "../../../lib/redis";

  export default async function handler(req, res) {
    try {
      // Extract query parameters from request
      const {
        page = 1,
        search = "",
        status = "all",
        fromDate = "",
        toDate = "",
        sortField = "SO Date",
        sortDir = "desc",
        queryType = "balances",
        slpCode = "",
        itmsGrpCod = "",
        itemCode = "",
        getAll = "false",
        cardCode = "",
      } = req.query;

      const isGetAll = getAll === "true";

      // Construct a unique cache key based on parameters
      const cacheKey = `customer-${queryType}:${isGetAll ? "all" : page}:${search}:${status}:${fromDate}:${toDate}:${sortField}:${sortDir}:${slpCode}:${itmsGrpCod}:${itemCode}`;

      // Return cached data if available and not a full export
      if (!isGetAll) {
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
          if (cachedData.totalCount) {
            res.setHeader("X-Total-Count", cachedData.totalCount);
          }
          return res.status(200).json(cachedData.data || []);
        }
      }

      // Helper function to safely parse numeric values
      const parseNumericValue = (value, fallback = null) => {
        if (!value || value === "") return fallback;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? fallback : parsed;
      };

      // Helper function to validate and clean string values
      const cleanStringValue = (value) => {
        if (!value || value === "" || value === "undefined" || value === "null") {
          return undefined;
        }
        return value.toString().trim();
      };

      // Build SQL parameters with proper data type handling
      const buildParameters = () => {
        const params = [];

        // Search parameter
        if (search && search.trim()) {
          params.push({
            name: "search",
            type: sql.NVarChar,
            value: `%${search.trim()}%`,
          });
        }

        // Date parameters
        if (fromDate) {
          params.push({
            name: "fromDate",
            type: sql.Date,
            value: new Date(fromDate),
          });
        }
        if (toDate) {
          params.push({
            name: "toDate",
            type: sql.Date,
            value: new Date(toDate),
          });
        }

        // Sales person code - handle both numeric and string cases
        const cleanSlpCode = cleanStringValue(slpCode);
        if (cleanSlpCode) {
          // First, try to determine if slpCode should be numeric or string
          // by checking if it's a valid number
          const numericSlpCode = parseNumericValue(cleanSlpCode);

          if (numericSlpCode !== null) {
            // It's a valid number, use as integer
            params.push({
              name: "slpCode",
              type: sql.Int,
              value: numericSlpCode,
            });
          } else {
            // It's a string value, use as NVarChar
            params.push({
              name: "slpCode",
              type: sql.NVarChar,
              value: cleanSlpCode,
            });
          }
        }

        // Other string parameters
        const stringParams = [
          { name: "cardCode", value: cleanStringValue(cardCode) },
          { name: "itmsGrpCod", value: cleanStringValue(itmsGrpCod) },
          { name: "itemCode", value: cleanStringValue(itemCode) },
        ];

        stringParams.forEach((param) => {
          if (param.value) {
            params.push({
              name: param.name,
              type: sql.NVarChar,
              value: param.value,
            });
          }
        });

        return params;
      };

      const parameters = buildParameters();
      let data, totalCount;

      // ========================= BALANCES QUERY =========================
      if (queryType === "balances") {
        // Build dynamic WHERE conditions
        let salesPersonCondition = "";
        if (slpCode && cleanStringValue(slpCode)) {
          // Check if we have a numeric or string slpCode parameter
          const hasNumericSlp = parameters.find(
            (p) => p.name === "slpCode" && p.type === sql.Int
          );
          const hasStringSlp = parameters.find(
            (p) => p.name === "slpCode" && p.type === sql.NVarChar
          );

          if (hasNumericSlp) {
            salesPersonCondition = "AND T1.SlpCode = @slpCode";
          } else if (hasStringSlp) {
            salesPersonCondition = "AND CAST(T1.SlpCode AS NVARCHAR) = @slpCode";
          }
        }

        const query = `
          SELECT TOP 10
            t1.cardcode,
            t1.cardname,
            (SUM(T0.Debit) - SUM(T0.Credit)) AS Balance,
            MAX(DATEDIFF(DAY, T0.DueDate, GETDATE())) AS DaysOverdue
          FROM JDT1 t0
          LEFT OUTER JOIN OCRD t1 ON T0.ShortName = T1.CardCode
          WHERE T0.ShortName LIKE 'C%'
          ${salesPersonCondition}
          GROUP BY t1.cardname, t1.cardcode
          HAVING (SUM(T0.Debit) - SUM(T0.Credit)) > 0
          ORDER BY Balance DESC;
        `;

        data = await queryDatabase(query, parameters);
        totalCount = data.length;
      }

      // ========================= DELIVERIES QUERY =========================
      else if (queryType === "deliveries") {
        // Build WHERE filters
        let searchFilter = "";
        if (parameters.find((p) => p.name === "search")) {
          searchFilter = `AND (
            T0.[DocNum] LIKE @search OR
            T13.[DocNum] LIKE @search OR
            T13.[NumAtCard] LIKE @search OR
            T15.[PymntGroup] LIKE @search
          )`;
        }

        let dateFilter = "";
        if (parameters.find((p) => p.name === "fromDate")) {
          dateFilter += " AND T0.[DocDate] >= @fromDate";
        }
        if (parameters.find((p) => p.name === "toDate")) {
          dateFilter += " AND T0.[DocDate] <= @toDate";
        }

        let overdueFilter = "";
        if (status !== "all") {
          if (status === "30")
            overdueFilter =
              "AND DATEDIFF(DAY, T13.[DocDueDate], GETDATE()) BETWEEN 0 AND 30";
          else if (status === "60")
            overdueFilter =
              "AND DATEDIFF(DAY, T13.[DocDueDate], GETDATE()) BETWEEN 31 AND 60";
          else if (status === "90")
            overdueFilter =
              "AND DATEDIFF(DAY, T13.[DocDueDate], GETDATE()) BETWEEN 61 AND 90";
          else if (status === "90+")
            overdueFilter = "AND DATEDIFF(DAY, T13.[DocDueDate], GETDATE()) > 90";
        }

        // Dynamic sales person filter with proper type handling
        let salesPersonFilter = "";
        if (parameters.find((p) => p.name === "slpCode")) {
          const slpParam = parameters.find((p) => p.name === "slpCode");
          if (slpParam.type === sql.Int) {
            salesPersonFilter = "AND T13.[SlpCode] = @slpCode";
          } else {
            salesPersonFilter = "AND CAST(T13.[SlpCode] AS NVARCHAR) = @slpCode";
          }
        }

        let categoryFilter = parameters.find((p) => p.name === "itmsGrpCod")
          ? "AND T10.ItmsGrpCod = @itmsGrpCod"
          : "";
        let productFilter = parameters.find((p) => p.name === "itemCode")
          ? "AND T1.ItemCode = @itemCode"
          : "";
        let customerFilter = parameters.find((p) => p.name === "cardCode")
          ? "AND T1.CardCode = @cardCode"
          : "";

        const validSortFields = {
          "Inv No.": "T13.[DocNum]",
          "Ar Inv No": "T13.[DocDate]",
          "so#": "T0.[DocNum]",
          "so Date": "T0.[DocDate]",
          "Customer Ref no": "T13.[NumAtCard]",
          "Invoice Total": "T13.[DocTotal]",
          "Balance Due": "(T13.[DocTotal] - T13.[PaidToDate])",
          "Airline Name": "T3.[U_AirlineName]",
          "Tracking no": "T3.[U_TrackingNo]",
          "Delivery Date": "T3.[DocDate]",
          "so to Delivery Days": "DATEDIFF(DAY, T0.[DocDate], T3.[DocDate])",
          "Overdue Days": "DATEDIFF(DAY, T13.[DocDueDate], GETDATE())",
          "Payment Group": "T15.[PymntGroup]",
          "Sales Person": "T50.[SlpName]",
        };

        const orderBy = validSortFields[sortField]
          ? `ORDER BY ${validSortFields[sortField]} ${sortDir === "desc" ? "DESC" : "ASC"}`
          : "ORDER BY T0.[DocDate] DESC";

        const pageSize = 20;
        const offset = (page - 1) * pageSize;

        // const paginatedQuery = `
        //   SELECT
        //     T13.[DocNum] AS 'Invoice No.',
        //     T13.[DocDate] AS 'AR Invoice Date',
        //     T0.[DocNum] AS 'SO#',
        //     T0.[DocDate] AS 'SO Date',
        //     T13.[NumAtCard] AS 'BP Reference No.',
        //     T14.[CardName] AS 'Customer Name',
        //     T16.[Name] AS 'Contact Person',
        //     T14.[Country] AS 'Country',
        //     T17.[State] AS 'State',
        //     T13.[DocTotal] AS 'Invoice Total',
        //     (T13.[DocTotal] - T13.[PaidToDate]) AS 'Balance Due',
        //     T13.[U_Airlinename] AS 'AirlineName',
        //     T13.[trackNo] AS 'TrackingNo',
        //     T3.[DocDate] AS 'Delivery Date',
        //     DATEDIFF(DAY, T0.[DocDate], T3.[DocDate]) AS 'SOToDeliveryDays',
        //     DATEDIFF(DAY, T13.[DocDueDate], GETDATE()) AS 'Overdue Days',
        //     T15.[PymntGroup] AS 'Payment Terms',
        //     T50.[SlpName] AS 'Sales Person',
        //     T13.[TaxDate] AS 'Dispatch Date'
        //   FROM ORDR T0
        //   INNER JOIN RDR1 T1 ON T0.[DocEntry] = T1.[DocEntry]
        //   INNER JOIN DLN1 T2 ON T1.[DocEntry] = T2.[BaseEntry] AND T1.[ItemCode] = T2.[ItemCode] AND T2.[BaseLine] = T1.[LineNum]
        //   INNER JOIN ODLN T3 ON T3.[DocEntry] = T2.[DocEntry]
        //   INNER JOIN INV1 T12 ON T2.[DocEntry] = T12.[BaseEntry] AND T2.[ItemCode] = T12.[ItemCode] AND T12.[BaseLine] = T2.[LineNum]
        //   INNER JOIN OINV T13 ON T13.[DocEntry] = T12.[DocEntry]
        //   INNER JOIN OITM T10 ON T10.[ItemCode] = T1.[ItemCode]
        //   INNER JOIN OITB T11 ON T11.[ItmsGrpCod] = T10.[ItmsGrpCod]
        //   INNER JOIN OCRD T14 ON T13.[CardCode] = T14.[CardCode]
        //   INNER JOIN CRD1 T17 ON T14.[CardCode] = T17.[CardCode]
        //   INNER JOIN OCPR T16 ON T14.[CardCode] = T16.[CardCode]
        //   INNER JOIN OCTG T15 ON T14.[GroupNum] = T15.[GroupNum]
        //   LEFT JOIN OSLP T50 ON T50.[SlpCode] = T13.[SlpCode]
        //   WHERE (T13.[DocTotal] - T13.[PaidToDate]) > 0
        //   ${searchFilter}
        //   ${dateFilter}
        //   ${overdueFilter}
        //   ${salesPersonFilter}
        //   ${categoryFilter}
        //   ${productFilter}
        //   ${customerFilter}
        //   ${orderBy}
          
        //   ${isGetAll ? "" : `OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`}
        // `;

        const paginatedQuery = `
  SELECT
    T13.[DocNum] AS 'Invoice No.',
    T13.[DocDate] AS 'AR Invoice Date',
    T0.[DocNum] AS 'SO#',
    T0.[DocDate] AS 'SO Date',
    T13.[NumAtCard] AS 'BP Reference No.',
    T14.[CardName] AS 'Customer Name',
    T16.[Name] AS 'Contact Person',
    T14.[Country] AS 'Country',
    T17.[State] AS 'State',
    T13.[DocTotal] AS 'Invoice Total',
    (T13.[DocTotal] - T13.[PaidToDate]) AS 'Balance Due',
    T13.[U_Airlinename] AS 'AirlineName',
    T13.[trackNo] AS 'TrackingNo',
    T3.[DocDate] AS 'Delivery Date',
    DATEDIFF(DAY, T0.[DocDate], T3.[DocDate]) AS 'SOToDeliveryDays',
    DATEDIFF(DAY, T13.[DocDueDate], GETDATE()) AS 'Overdue Days',
    T15.[PymntGroup] AS 'Payment Terms',
    T50.[SlpName] AS 'Sales Person - Invoice',
    T51.[SlpName] AS 'MasterSalesPerson',
    T13.[TaxDate] AS 'Dispatch Date'
  FROM ORDR T0
  INNER JOIN RDR1 T1
    ON T0.[DocEntry] = T1.[DocEntry]
  INNER JOIN DLN1 T2
    ON T1.[DocEntry] = T2.[BaseEntry]
   AND T1.[ItemCode] = T2.[ItemCode]
   AND T2.[BaseLine] = T1.[LineNum]
  INNER JOIN ODLN T3
    ON T3.[DocEntry] = T2.[DocEntry]
  INNER JOIN INV1 T12
    ON T2.[DocEntry] = T12.[BaseEntry]
   AND T2.[ItemCode] = T12.[ItemCode]
   AND T12.[BaseLine] = T2.[LineNum]
  INNER JOIN OINV T13
    ON T13.[DocEntry] = T12.[DocEntry]
  INNER JOIN OITM T10
    ON T10.[ItemCode] = T1.[ItemCode]
  INNER JOIN OITB T11
    ON T11.[ItmsGrpCod] = T10.[ItmsGrpCod]
  INNER JOIN OCRD T14
    ON T13.[CardCode] = T14.[CardCode]
  INNER JOIN CRD1 T17
    ON T14.[CardCode] = T17.[CardCode]
  INNER JOIN OCPR T16
    ON T14.[CardCode] = T16.[CardCode]
  INNER JOIN OCTG T15
    ON T14.[GroupNum] = T15.[GroupNum]
  LEFT JOIN OSLP T50
    ON T50.[SlpCode] = T13.[SlpCode]
  LEFT JOIN OSLP T51
    ON T51.[SlpCode] = T14.[SlpCode]
  WHERE (T13.[DocTotal] - T13.[PaidToDate]) > 0
  ${searchFilter}
  ${dateFilter}
  ${overdueFilter}
  ${salesPersonFilter}
  ${categoryFilter}
  ${productFilter}
  ${customerFilter}
  ${orderBy}
  ${isGetAll ? "" : `OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`}
`;


        const countQuery = `
          SELECT COUNT(*) AS total
          FROM ORDR T0
          INNER JOIN RDR1 T1 ON T0.[DocEntry] = T1.[DocEntry]
          INNER JOIN DLN1 T2 ON T1.[DocEntry] = T2.[BaseEntry] AND T1.[ItemCode] = T2.[ItemCode] AND T2.[BaseLine] = T1.[LineNum]
          INNER JOIN ODLN T3 ON T3.[DocEntry] = T2.[DocEntry]
          INNER JOIN INV1 T12 ON T2.[DocEntry] = T12.[BaseEntry] AND T2.[ItemCode] = T12.[ItemCode] AND T12.[BaseLine] = T2.[LineNum]
          INNER JOIN OINV T13 ON T13.[DocEntry] = T12.[DocEntry]
          INNER JOIN OITM T10 ON T10.[ItemCode] = T1.[ItemCode]
          INNER JOIN OITB T11 ON T11.[ItmsGrpCod] = T10.[ItmsGrpCod]
          INNER JOIN OCRD T14 ON T13.[CardCode] = T14.[CardCode]
          INNER JOIN OCTG T15 ON T14.[GroupNum] = T15.[GroupNum]
          LEFT JOIN OSLP T50 ON T50.[SlpCode] = T13.[SlpCode]
          WHERE (T13.[DocTotal] - T13.[PaidToDate]) > 0
          ${searchFilter}
          ${dateFilter}
          ${overdueFilter}
          ${salesPersonFilter}
          ${categoryFilter}
          ${productFilter}
        `;

        // Fetch data and count
        let queryData = [],
          countResult = [];

        if (isGetAll) {
          queryData = await queryDatabase(paginatedQuery, parameters);
          totalCount = queryData.length;
        } else {
          [queryData, countResult] = await Promise.all([
            queryDatabase(paginatedQuery, parameters),
            queryDatabase(countQuery, parameters),
          ]);
          totalCount = countResult?.[0]?.total || 0;
        }

        data = queryData;
      }

      // ========================= CHART QUERY =========================
      else if (queryType === "chart") {
        // Build dynamic filters
        let searchFilter = "";
        if (parameters.find((p) => p.name === "search")) {
          searchFilter =
            "AND (T0.ShortName LIKE @search OR T1.CardName LIKE @search)";
        }

        let dateFilter = "";
        if (parameters.find((p) => p.name === "fromDate")) {
          dateFilter += " AND T0.DueDate >= @fromDate";
        }
        if (parameters.find((p) => p.name === "toDate")) {
          dateFilter += " AND T0.DueDate <= @toDate";
        }

        let overdueFilter = "";
        if (status === "30")
          overdueFilter =
            "AND DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 0 AND 30";
        else if (status === "60")
          overdueFilter =
            "AND DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 31 AND 60";
        else if (status === "90")
          overdueFilter =
            "AND DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 61 AND 90";
        else if (status === "90+")
          overdueFilter = "AND DATEDIFF(DAY, T0.DueDate, GETDATE()) > 90";

        // Dynamic sales person filter
        let salesPersonFilter = "";
        if (parameters.find((p) => p.name === "slpCode")) {
          const slpParam = parameters.find((p) => p.name === "slpCode");
          if (slpParam.type === sql.Int) {
            salesPersonFilter = "AND T1.SlpCode = @slpCode";
          } else {
            salesPersonFilter = "AND CAST(T1.SlpCode AS NVARCHAR) = @slpCode";
          }
        }

        let categoryFilter = parameters.find((p) => p.name === "itmsGrpCod")
          ? "AND T4.ItmsGrpCod = @itmsGrpCod"
          : "";
        let productFilter = parameters.find((p) => p.name === "itemCode")
          ? "AND T3.ItemCode = @itemCode"
          : "";
        let customerFilter = parameters.find((p) => p.name === "cardCode")
          ? "AND T0.ShortName = @cardCode"
          : "";

        const query = `
          SELECT 
            CASE 
              WHEN DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 0 AND 30 THEN '0-30 Days'
              WHEN DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 31 AND 60 THEN '31-60 Days'
              WHEN DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 61 AND 90 THEN '61-90 Days'
              ELSE '91+ Days'
            END AS OverdueRange,
            SUM(T0.Debit - T0.Credit) AS Balance,
            COUNT(DISTINCT T0.ShortName) AS CustomerCount
          FROM JDT1 T0
          INNER JOIN OINV T2 ON T0.TransId = T2.TransId
          LEFT OUTER JOIN OCRD T1 ON T0.ShortName = T1.CardCode
          LEFT JOIN INV1 T12 ON T0.BaseRef = T12.DocEntry
          LEFT JOIN OITM T3 ON T12.ItemCode = T3.ItemCode
          LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
          WHERE T0.ShortName LIKE 'C%'
            AND T0.DueDate <= GETDATE()
            AND (T0.Debit - T0.Credit) > 0
            ${searchFilter}
            ${dateFilter}
            ${overdueFilter}
            ${salesPersonFilter}
            ${categoryFilter}
            ${productFilter}
            ${customerFilter}
          GROUP BY CASE 
            WHEN DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 0 AND 30 THEN '0-30 Days'
            WHEN DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 31 AND 60 THEN '31-60 Days'
            WHEN DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 61 AND 90 THEN '61-90 Days'
            ELSE '91+ Days'
          END
          ORDER BY OverdueRange;
        `;

        data = await queryDatabase(query, parameters);
        totalCount = data.length;
      }

      // Return data and cache it
      res.setHeader("X-Total-Count", totalCount);
      if (!isGetAll) {
        await setCache(
          cacheKey,
          {
            data: data || [],
            totalCount: totalCount,
          },
          900
        ); // Cache for 15 mins
      }

      res.status(200).json(data || []);
    } catch (error) {
      console.error("Error fetching customer data:", error);

      // Enhanced error logging for debugging
      if (error.originalError) {
        console.error("Original SQL Error:", error.originalError.message);
        console.error("SQL Error Number:", error.number);
        console.error("SQL Error State:", error.state);
      }

      res.status(500).json({
        message: "Internal Server Error",
        error:
          process.env.NODE_ENV === "development"
            ? {
                message: error.message,
                sqlError: error.originalError?.message,
                errorNumber: error.number,
                errorState: error.state,
              }
            : undefined,
      });
    }
  }