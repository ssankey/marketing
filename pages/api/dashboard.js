
// // pages/api/dashboard.js
// import { getSalesMetrics } from "lib/models/dashboard";
// import { formatCurrency } from "utils/formatCurrency";
// import { getCache, setCache } from "lib/redis";
// import { verify } from "jsonwebtoken";
// import { getSalesDataForModal, getOrdersDataForModal } from "./kpi/kpi-modal";

// // ✅ Local date formatting function (YYYY-MM-DD)
// const formatDate = (date) => date.toLocaleDateString("en-CA");

// export default async function handler(req, res) {
//   const {
//     dateFilter = "today",
//     startDate,
//     endDate,
//     region,
//     customer,
//     salesPerson,
//     salesCategory,
//   } = req.query;

//   let computedStartDate = startDate;
//   let computedEndDate = endDate;
//   let previousStartDate, previousEndDate;
//   console.log("startenddate", startDate, endDate, dateFilter);

//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res
//       .status(401)
//       .json({ error: "Missing or malformed Authorization header" });
//   }

//   const token = authHeader.split(" ")[1];
//   let decoded;
//   try {
//     decoded = verify(token, process.env.JWT_SECRET);
//   } catch (err) {
//     console.error("Token verification failed:", err.message);
//     return res.status(401).json({ error: "Token verification failed" });
//   }
//   console.log("[DASHBOARD]", { token, decoded });

//   const today = new Date();

//   if (!startDate || !endDate || dateFilter !== "custom") {
//     if (dateFilter === "today") {
//       computedStartDate = computedEndDate = formatDate(today);
//       const yesterday = new Date(today);
//       yesterday.setDate(today.getDate() - 1);
//       previousStartDate = previousEndDate = formatDate(yesterday);

//       console.log("[DateFilter: TODAY]");
//       console.log("From:", computedStartDate, "To:", computedEndDate);

//     } else if (dateFilter === "thisWeek") {
//       const dayOfWeek = today.getDay();
//       const startOfWeek = new Date(today);
//       startOfWeek.setDate(today.getDate() - dayOfWeek);
//       computedStartDate = formatDate(startOfWeek);
//       computedEndDate = formatDate(today);

//       const daysInPeriod = dayOfWeek + 1;
//       const previousWeekStart = new Date(startOfWeek);
//       previousWeekStart.setDate(startOfWeek.getDate() - 7);
//       const previousWeekEnd = new Date(previousWeekStart);
//       previousWeekEnd.setDate(previousWeekStart.getDate() + (daysInPeriod - 1));

//       previousStartDate = formatDate(previousWeekStart);
//       previousEndDate = formatDate(previousWeekEnd);

//       console.log("[DateFilter: THIS WEEK]");
//       console.log("From:", computedStartDate, "To:", computedEndDate);

//     } else if (dateFilter === "thisMonth") {
//       const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//       computedStartDate = formatDate(firstDayOfMonth);
//       computedEndDate = formatDate(today);

//       const daysInPeriod = today.getDate();
//       const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
//       const lastDayOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
//       const previousMonthEndDay = Math.min(daysInPeriod, lastDayOfPrevMonth);
//       const previousMonthEnd = new Date(today.getFullYear(), today.getMonth() - 1, previousMonthEndDay);

//       previousStartDate = formatDate(previousMonthStart);
//       previousEndDate = formatDate(previousMonthEnd);

//       // console.log("[DateFilter: THIS MONTH]");
//       // console.log("From:", computedStartDate, "To:", computedEndDate);

//     } else if (dateFilter === "all") {
//       computedStartDate = "";
//       computedEndDate = "";
//       previousStartDate = "";
//       previousEndDate = "";

//       console.log("[DateFilter: ALL TIME]");
//       console.log("From:", computedStartDate, "To:", computedEndDate);
//     }
//   }

//   const cacheKey = `dashboard:${token || "no-token"}:${dateFilter}:${
//     computedStartDate || "null"
//   }:${computedEndDate || "null"}:${previousStartDate || "null"}:${
//     previousEndDate || "null"
//   }:${region || "all"}:${customer || "all"}:${salesPerson || "all"}:${
//     salesCategory || "all"
//   }`;

//   try {
//     const cachedData = await getCache(cacheKey);
//     if (cachedData) {
//       console.log("Cache hit for key:", cacheKey);
//       return res.status(200).json(cachedData);
//     }
//   } catch (cacheError) {
//     console.error("Error fetching cache:", cacheError);
//   }

//   try {
//     const currentFilterParams = {
//       token,
//       role: decoded.role,
//       contactCodes: decoded.contactCodes,
//       cardCodes: decoded.cardCodes,
//       startDate: computedStartDate,
//       endDate: computedEndDate,
//       region,
//       customer,
//       salesPerson,
//       salesCategory,
//     };

//     const previousFilterParams = {
//       token,
//       role: decoded.role,
//       contactCodes: decoded.contactCodes,
//       cardCodes: decoded.cardCodes,
//       startDate: previousStartDate,
//       endDate: previousEndDate,
//       region,
//       customer,
//       salesPerson,
//       salesCategory,
//     };

//     const [currentMetrics, previousMetrics] = await Promise.all([
//       getSalesMetrics(currentFilterParams),
//       getSalesMetrics(previousFilterParams),
//     ]);

//     const modalParams = {
//       dateFilter,
//       startDate: computedStartDate,
//       endDate: computedEndDate,
//       isAdmin: decoded.role === 'admin',
//       contactCodes: decoded.contactCodes || [],
//       cardCodes: decoded.cardCodes || [],
//     };

//     const [salesData, ordersData] = await Promise.all([
//       getSalesDataForModal(modalParams),
//       getOrdersDataForModal(modalParams),
//     ]);

//     const calculateTrend = (current, previous) => {
//       if (
//         current === null || current === undefined ||
//         previous === null || previous === undefined
//       ) return "0.00";
//       if (previous === 0) return current > 0 ? "100.00" : "0.00";
//       const trend = ((current - previous) / previous) * 100;
//       return Math.min(Math.max(trend, -100), 100).toFixed(2);
//     };

//     const getDateFilterDisplay = () => {
//       const filterMap = {
//         today: "Today",
//         thisWeek: "This Week",
//         thisMonth: "This Month",
//         all: "All Time",
//         custom: "Custom Period",
//       };
//       return filterMap[dateFilter] || "All Time";
//     };

//     const displayDateFilter = getDateFilterDisplay();

//     const kpiData = [
//       {
//         title: `Total Sales Revenue`,
//         value: formatCurrency(currentMetrics.totalSales || 0),
//         icon: "RupeeIcon",
//         color: "primary",
//         trend:
//           dateFilter === "custom"
//             ? null
//             : currentMetrics.totalSales > (previousMetrics.totalSales || 0)
//             ? "up"
//             : "down",
//         trendValue:
//           dateFilter === "custom"
//             ? null
//             : calculateTrend(
//                 currentMetrics.totalSales,
//                 previousMetrics.totalSales
//               ),
//         prevValue: formatCurrency(previousMetrics.totalSales || 0),
//         trendContext: "Compared to Last Period",
//       },
//       {
//         title: `No of Sales Order`,
//         value: currentMetrics.numberOfSalesOrders || 0,
//         icon: "Cart4",
//         color: "success",
//         trend:
//           dateFilter === "custom"
//             ? null
//             : currentMetrics.numberOfSalesOrders >
//               (previousMetrics.numberOfSalesOrders || 0)
//             ? "up"
//             : "down",
//         trendValue:
//           dateFilter === "custom"
//             ? null
//             : calculateTrend(
//                 currentMetrics.numberOfSalesOrders,
//                 previousMetrics.numberOfSalesOrders
//               ),
//         prevValue: previousMetrics.numberOfSalesOrders || 0,
//         trendContext: "Compared to Last Period",
//       },
//       {
//         title: `Quotation Conversion Rate`,
//         value: `${currentMetrics.quotationConversionRate || 0}%`,
//         icon: "GraphUpArrow",
//         color: "warning",
//         trend:
//           dateFilter === "custom"
//             ? null
//             : currentMetrics.quotationConversionRate >
//               (previousMetrics.quotationConversionRate || 0)
//             ? "up"
//             : "down",
//         trendValue:
//           dateFilter === "custom"
//             ? null
//             : calculateTrend(
//                 currentMetrics.quotationConversionRate,
//                 previousMetrics.quotationConversionRate
//               ),
//         prevValue: `${previousMetrics.quotationConversionRate || 0}%`,
//         trendContext: "Compared to Last Period",
//       },
//       {
//         title: `Outstanding Invoices`,
//         value: formatCurrency(currentMetrics.outstandingInvoices.amount || 0),
//         icon: "ExclamationCircle",
//         color: "danger",
//         trend:
//           dateFilter === "custom"
//             ? null
//             : currentMetrics.outstandingInvoices.amount >
//               (previousMetrics.outstandingInvoices.amount || 0)
//             ? "up"
//             : "down",
//         trendValue:
//           dateFilter === "custom"
//             ? null
//             : calculateTrend(
//                 currentMetrics.outstandingInvoices.amount,
//                 previousMetrics.outstandingInvoices.amount
//               ),
//         prevValue: formatCurrency(
//           previousMetrics.outstandingInvoices.amount || 0
//         ),
//         trendContext: "Compared to Last Period",
//       },
//     ];

//     const responseData = {
//       kpiData,
//       salesData,
//       ordersData,
//     };

//     try {
//       await setCache(cacheKey, responseData, 300);
//     } catch (cacheSetError) {
//       console.error("Error setting cache:", cacheSetError);
//     }

//     res.status(200).json(responseData);
//   } catch (error) {
//     console.error("Error fetching dashboard data:", error);
//     res.status(500).json({
//       error: "Failed to fetch dashboard data.",
//     });
//   }
// }



// pages/api/dashboard.js
import { getSalesMetrics } from "lib/models/dashboard";
import { formatCurrency } from "utils/formatCurrency";
import { getCache, setCache } from "lib/redis";
import { verify } from "jsonwebtoken";
import { getSalesDataForModal, getOrdersDataForModal } from "./kpi/kpi-modal";

// ✅ Local date formatting function (YYYY-MM-DD)
const formatDate = (date) => date.toLocaleDateString("en-CA");

export default async function handler(req, res) {
  const {
    dateFilter = "today",
    startDate,
    endDate,
    region,
    customer,
    salesPerson,
    salesCategory,
  } = req.query;

  let computedStartDate = startDate;
  let computedEndDate = endDate;
  let previousStartDate, previousEndDate;
  console.log("startenddate", startDate, endDate, dateFilter);

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or malformed Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(401).json({ error: "Token verification failed" });
  }
  console.log("[DASHBOARD]", { token, decoded });

  const today = new Date();

  if (!startDate || !endDate || dateFilter !== "custom") {
    if (dateFilter === "today") {
      computedStartDate = computedEndDate = formatDate(today);
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      previousStartDate = previousEndDate = formatDate(yesterday);

      console.log("[DateFilter: TODAY]");
      console.log("From:", computedStartDate, "To:", computedEndDate);

    } else if (dateFilter === "thisWeek") {
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      computedStartDate = formatDate(startOfWeek);
      computedEndDate = formatDate(today);

      const daysInPeriod = dayOfWeek + 1;
      const previousWeekStart = new Date(startOfWeek);
      previousWeekStart.setDate(startOfWeek.getDate() - 7);
      const previousWeekEnd = new Date(previousWeekStart);
      previousWeekEnd.setDate(previousWeekStart.getDate() + (daysInPeriod - 1));

      previousStartDate = formatDate(previousWeekStart);
      previousEndDate = formatDate(previousWeekEnd);

      console.log("[DateFilter: THIS WEEK]");
      console.log("From:", computedStartDate, "To:", computedEndDate);

    } else if (dateFilter === "thisMonth") {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      computedStartDate = formatDate(firstDayOfMonth);
      computedEndDate = formatDate(today);

      const daysInPeriod = today.getDate();
      const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      const previousMonthEndDay = Math.min(daysInPeriod, lastDayOfPrevMonth);
      const previousMonthEnd = new Date(today.getFullYear(), today.getMonth() - 1, previousMonthEndDay);

      previousStartDate = formatDate(previousMonthStart);
      previousEndDate = formatDate(previousMonthEnd);

      // console.log("[DateFilter: THIS MONTH]");
      // console.log("From:", computedStartDate, "To:", computedEndDate);

    } else if (dateFilter === "all") {
      computedStartDate = "";
      computedEndDate = "";
      previousStartDate = "";
      previousEndDate = "";

      console.log("[DateFilter: ALL TIME]");
      console.log("From:", computedStartDate, "To:", computedEndDate);
    }
  }

  // CACHING LOGIC START (commented out)
  /*
  const cacheKey = `dashboard:${token || "no-token"}:${dateFilter}:${
    computedStartDate || "null"
  }:${computedEndDate || "null"}:${previousStartDate || "null"}:${
    previousEndDate || "null"
  }:${region || "all"}:${customer || "all"}:${salesPerson || "all"}:${
    salesCategory || "all"
  }`;

  try {
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log("Cache hit for key:", cacheKey);
      return res.status(200).json(cachedData);
    }
  } catch (cacheError) {
    console.error("Error fetching cache:", cacheError);
  }
  */

  try {
    const currentFilterParams = {
      token,
      role: decoded.role,
      contactCodes: decoded.contactCodes,
      cardCodes: decoded.cardCodes,
      startDate: computedStartDate,
      endDate: computedEndDate,
      region,
      customer,
      salesPerson,
      salesCategory,
    };

    const previousFilterParams = {
      token,
      role: decoded.role,
      contactCodes: decoded.contactCodes,
      cardCodes: decoded.cardCodes,
      startDate: previousStartDate,
      endDate: previousEndDate,
      region,
      customer,
      salesPerson,
      salesCategory,
    };

    const [currentMetrics, previousMetrics] = await Promise.all([
      getSalesMetrics(currentFilterParams),
      getSalesMetrics(previousFilterParams),
    ]);

    const modalParams = {
      dateFilter,
      startDate: computedStartDate,
      endDate: computedEndDate,
      isAdmin: decoded.role === 'admin',
      contactCodes: decoded.contactCodes || [],
      cardCodes: decoded.cardCodes || [],
    };

    const [salesData, ordersData] = await Promise.all([
      getSalesDataForModal(modalParams),
      getOrdersDataForModal(modalParams),
    ]);

    const calculateTrend = (current, previous) => {
      if (
        current === null || current === undefined ||
        previous === null || previous === undefined
      ) return "0.00";
      if (previous === 0) return current > 0 ? "100.00" : "0.00";
      const trend = ((current - previous) / previous) * 100;
      return Math.min(Math.max(trend, -100), 100).toFixed(2);
    };

    const getDateFilterDisplay = () => {
      const filterMap = {
        today: "Today",
        thisWeek: "This Week",
        thisMonth: "This Month",
        all: "All Time",
        custom: "Custom Period",
      };
      return filterMap[dateFilter] || "All Time";
    };

    const displayDateFilter = getDateFilterDisplay();

    const kpiData = [
      {
        title: `Total Sales Revenue`,
        value: formatCurrency(currentMetrics.totalSales || 0),
        icon: "RupeeIcon",
        color: "primary",
        trend:
          dateFilter === "custom"
            ? null
            : currentMetrics.totalSales > (previousMetrics.totalSales || 0)
            ? "up"
            : "down",
        trendValue:
          dateFilter === "custom"
            ? null
            : calculateTrend(
                currentMetrics.totalSales,
                previousMetrics.totalSales
              ),
        prevValue: formatCurrency(previousMetrics.totalSales || 0),
        trendContext: "Compared to Last Period",
      },
      {
        title: `No of Sales Order`,
        value: currentMetrics.numberOfSalesOrders || 0,
        icon: "Cart4",
        color: "success",
        trend:
          dateFilter === "custom"
            ? null
            : currentMetrics.numberOfSalesOrders >
              (previousMetrics.numberOfSalesOrders || 0)
            ? "up"
            : "down",
        trendValue:
          dateFilter === "custom"
            ? null
            : calculateTrend(
                currentMetrics.numberOfSalesOrders,
                previousMetrics.numberOfSalesOrders
              ),
        prevValue: previousMetrics.numberOfSalesOrders || 0,
        trendContext: "Compared to Last Period",
      },
      {
        title: `Quotation Conversion Rate`,
        value: `${currentMetrics.quotationConversionRate || 0}%`,
        icon: "GraphUpArrow",
        color: "warning",
        trend:
          dateFilter === "custom"
            ? null
            : currentMetrics.quotationConversionRate >
              (previousMetrics.quotationConversionRate || 0)
            ? "up"
            : "down",
        trendValue:
          dateFilter === "custom"
            ? null
            : calculateTrend(
                currentMetrics.quotationConversionRate,
                previousMetrics.quotationConversionRate
              ),
        prevValue: `${previousMetrics.quotationConversionRate || 0}%`,
        trendContext: "Compared to Last Period",
      },
      {
        title: `Outstanding Invoices`,
        value: formatCurrency(currentMetrics.outstandingInvoices.amount || 0),
        icon: "ExclamationCircle",
        color: "danger",
        trend:
          dateFilter === "custom"
            ? null
            : currentMetrics.outstandingInvoices.amount >
              (previousMetrics.outstandingInvoices.amount || 0)
            ? "up"
            : "down",
        trendValue:
          dateFilter === "custom"
            ? null
            : calculateTrend(
                currentMetrics.outstandingInvoices.amount,
                previousMetrics.outstandingInvoices.amount
              ),
        prevValue: formatCurrency(
          previousMetrics.outstandingInvoices.amount || 0
        ),
        trendContext: "Compared to Last Period",
      },
    ];

    const responseData = {
      kpiData,
      salesData,
      ordersData,
    };

    // CACHING LOGIC CONTINUED (commented out)
    /*
    try {
      await setCache(cacheKey, responseData, 300);
    } catch (cacheSetError) {
      console.error("Error setting cache:", cacheSetError);
    }
    */

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard data.",
    });
  }
}