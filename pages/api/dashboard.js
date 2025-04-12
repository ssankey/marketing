


import { getSalesMetrics } from "lib/models/dashboard";
import { formatCurrency } from "utils/formatCurrency";
import { getCache, setCache } from "lib/redis";
import { verify } from "jsonwebtoken";


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
  // let token;
  // if (authHeader && authHeader.startsWith("Bearer ")) {
  //   token = authHeader.substring(7); // remove "Bearer "
  // }
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

  // Determine date ranges for current and previous periods
  const today = new Date();

  if (!startDate || !endDate || dateFilter !== "custom") {
    if (dateFilter === "today") {
      computedStartDate = computedEndDate = today.toISOString().split("T")[0];
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      previousStartDate = previousEndDate = yesterday
        .toISOString()
        .split("T")[0];
    } else if (dateFilter === "thisWeek") {
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay() + 1);
      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);

      computedStartDate = firstDayOfWeek.toISOString().split("T")[0];
      computedEndDate = lastDayOfWeek.toISOString().split("T")[0];

      const previousWeekStart = new Date(firstDayOfWeek);
      previousWeekStart.setDate(firstDayOfWeek.getDate() - 7);
      const previousWeekEnd = new Date(lastDayOfWeek);
      previousWeekEnd.setDate(lastDayOfWeek.getDate() - 7);

      previousStartDate = previousWeekStart.toISOString().split("T")[0];
      previousEndDate = previousWeekEnd.toISOString().split("T")[0];
    } else if (dateFilter === "thisMonth") {
      // Current month (e.g., February 2025)
      const firstDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
      const lastDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      );

      computedStartDate = firstDayOfMonth.toISOString().split("T")[0]; // e.g. 2025-02-01
      computedEndDate = lastDayOfMonth.toISOString().split("T")[0]; // e.g. 2025-02-28

      // Previous month (e.g., January 2025)
      const previousMonthStart = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1
      );
      const previousMonthEnd = new Date(
        today.getFullYear(),
        today.getMonth(),
        0
      );

      previousStartDate = previousMonthStart.toISOString().split("T")[0]; // e.g. 2025-01-01
      previousEndDate = previousMonthEnd.toISOString().split("T")[0]; // e.g. 2025-01-31
    } else if (dateFilter === "all") {
      computedStartDate = "";
      computedEndDate = "";
      previousStartDate = "";
      previousEndDate = "";
    }
  }

  // Build a unique cache key using token and all filter parameters
  const cacheKey = `dashboard:${token || "no-token"}:${dateFilter}:${
    computedStartDate || "null"
  }:${computedEndDate || "null"}:${previousStartDate || "null"}:${
    previousEndDate || "null"
  }:${region || "all"}:${customer || "all"}:${salesPerson || "all"}:${
    salesCategory || "all"
  }`;

  // Attempt to fetch from cache first
  try {
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log("Cache hit for key:", cacheKey);
      return res.status(200).json(cachedData);
    }
  } catch (cacheError) {
    console.error("Error fetching cache:", cacheError);
    // Continue without cache if there's an error
  }
    try {
  const currentFilterParams = {
    token, // Include the token here
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
    token, // Include the token here
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

    // Fetch current and previous period data concurrently
    const [currentMetrics, previousMetrics] = await Promise.all([
      getSalesMetrics(currentFilterParams),
      getSalesMetrics(previousFilterParams),
    ]);

    // Helper to calculate trends
    const calculateTrend = (current, previous) => {
      if (
        current === null ||
        current === undefined ||
        previous === null ||
        previous === undefined
      ) {
        return "0.00";
      }
      if (previous === 0) {
        return current > 0 ? "100.00" : "0.00";
      }
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
        title: `Total Sales Revenue (${displayDateFilter})`,
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
        title: `Number of Sales Orders (${displayDateFilter})`,
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
        title: `Quotation Conversion Rate (${displayDateFilter})`,
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
        title: `Outstanding Invoices (${displayDateFilter})`,
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

    const responseData = { kpiData };

    // Set cache for subsequent requests (TTL set to 300 seconds here)
    try {
      await setCache(cacheKey, responseData, 300);
    } catch (cacheSetError) {
      console.error("Error setting cache:", cacheSetError);
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard data.",
    });
  }
}