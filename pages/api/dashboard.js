// pages/api/dashboard.js

import {
  getNumberOfSalesOrders,
  getTotalSalesRevenue,
  getOutstandingInvoices,
  getQuotationConversionRate,
} from 'lib/models/dashboard';
import { formatCurrency } from 'utils/formatCurrency'; // Ensure correct import path

export default async function handler(req, res) {
  const {
    dateFilter = 'today',
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

  // Determine date ranges for current and previous periods
  const today = new Date();

  if (!startDate || !endDate || dateFilter !== 'custom') {
    if (dateFilter === 'today') {
      // Today's date
      computedStartDate = computedEndDate = today.toISOString().split('T')[0];

      // Yesterday's date for previous period
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      previousStartDate = previousEndDate = yesterday.toISOString().split('T')[0];
    } else if (dateFilter === 'thisWeek') {
      // Start and end of the current week (Monday to Sunday)
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6); // Sunday

      computedStartDate = firstDayOfWeek.toISOString().split('T')[0];
      computedEndDate = lastDayOfWeek.toISOString().split('T')[0];

      // Previous week (Monday to Sunday)
      const previousWeekStart = new Date(firstDayOfWeek);
      previousWeekStart.setDate(firstDayOfWeek.getDate() - 7);
      const previousWeekEnd = new Date(lastDayOfWeek);
      previousWeekEnd.setDate(lastDayOfWeek.getDate() - 7);

      previousStartDate = previousWeekStart.toISOString().split('T')[0];
      previousEndDate = previousWeekEnd.toISOString().split('T')[0];
    } else if (dateFilter === 'thisMonth') {
      // Start and end of the current month
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      computedStartDate = firstDayOfMonth.toISOString().split('T')[0];
      computedEndDate = lastDayOfMonth.toISOString().split('T')[0];

      // Previous month
      const previousMonthStart = new Date(firstDayOfMonth);
      previousMonthStart.setMonth(firstDayOfMonth.getMonth() - 1);
      const previousMonthEnd = new Date(lastDayOfMonth);
      previousMonthEnd.setMonth(lastDayOfMonth.getMonth() - 1);

      previousStartDate = previousMonthStart.toISOString().split('T')[0];
      previousEndDate = previousMonthEnd.toISOString().split('T')[0];
    } else if (dateFilter === 'all') {
      // Fallback to no date filter
      computedStartDate = '';
      computedEndDate = '';
      previousStartDate = '';
      previousEndDate = '';
    }
  }

  try {
    // Create filter params object for current and previous periods
    const currentFilterParams = {
      ...(computedStartDate && { startDate: computedStartDate }),
      ...(computedEndDate && { endDate: computedEndDate }),
      region,
      customer,
      salesPerson,
      salesCategory,
    };

    const previousFilterParams = {
      ...(previousStartDate && { startDate: previousStartDate }),
      ...(previousEndDate && { endDate: previousEndDate }),
      region,
      customer,
      salesPerson,
      salesCategory,
    };

    // Fetch current and previous period data
    const [
      quotationConversionRate,
      NumberOfSalesOrders,
      totalSalesRevenue,
      outstandingInvoices,
      previousQuotationConversionRate,
      previousNumberOfSalesOrders,
      previousTotalSalesRevenue,
      previousOutstandingInvoices,
    ] = await Promise.all([
      getQuotationConversionRate(currentFilterParams),
      getNumberOfSalesOrders(currentFilterParams),
      getTotalSalesRevenue(currentFilterParams),
      getOutstandingInvoices(currentFilterParams),
      getQuotationConversionRate(previousFilterParams),
      getNumberOfSalesOrders(previousFilterParams),
      getTotalSalesRevenue(previousFilterParams),
      getOutstandingInvoices(previousFilterParams),
    ]);

    // Improved trend calculation function
    const calculateTrend = (current, previous) => {
      // Handle null or undefined values
      if (current === null || current === undefined || 
          previous === null || previous === undefined) {
        return '0.00';
      }

      // Avoid division by zero
      if (previous === 0) {
        return current > 0 ? '100.00' : '0.00';
      }

      // Calculate percentage change, cap at ±100%
      const trend = ((current - previous) / previous) * 100;
      return Math.min(Math.max(trend, -100), 100).toFixed(2);
    };

    // Ensure dateFilter has a valid value for display
    const getDateFilterDisplay = () => {
      const filterMap = {
        today: 'Today',
        thisWeek: 'This Week',
        thisMonth: 'This Month',
        all: 'All Time',
        custom: 'Custom Period',
      };
      return filterMap[dateFilter] || 'All Time';
    };

    const displayDateFilter = getDateFilterDisplay();

    // Construct kpiData
    const kpiData = [
      {
        title: `Total Sales Revenue (${displayDateFilter})`,
        value: formatCurrency(totalSalesRevenue || 0),
        icon: 'RupeeIcon',
        color: 'primary',
        trend:
          dateFilter === 'custom'
            ? null
            : totalSalesRevenue > (previousTotalSalesRevenue || 0)
            ? 'up'
            : 'down',
        trendValue:
          dateFilter === 'custom'
            ? null
            : calculateTrend(totalSalesRevenue, previousTotalSalesRevenue),
        prevValue: formatCurrency(previousTotalSalesRevenue || 0),
        trendContext: 'Compared to Last Period',
      },
      {
        title: `Number of Sales Orders (${displayDateFilter})`,
        value: NumberOfSalesOrders !== null && NumberOfSalesOrders !== undefined ? NumberOfSalesOrders : 0,
        icon: 'Cart4',
        color: 'success',
        trend:
          dateFilter === 'custom'
            ? null
            : NumberOfSalesOrders > (previousNumberOfSalesOrders || 0)
            ? 'up'
            : 'down',
        trendValue:
          dateFilter === 'custom'
            ? null
            : calculateTrend(NumberOfSalesOrders, previousNumberOfSalesOrders),
        prevValue: previousNumberOfSalesOrders || 0,
        trendContext: 'Compared to Last Period',
      },
      {
        title: `Quotation Conversion Rate (${displayDateFilter})`,
        value: quotationConversionRate !== null && quotationConversionRate !== undefined ? `${quotationConversionRate}%` : '0%',
        icon: 'GraphUpArrow',
        color: 'warning',
        trend:
          dateFilter === 'custom'
            ? null
            : quotationConversionRate > (previousQuotationConversionRate || 0)
            ? 'up'
            : 'down',
        trendValue:
          dateFilter === 'custom'
            ? null
            : calculateTrend(quotationConversionRate, previousQuotationConversionRate),
        prevValue: `${previousQuotationConversionRate || 0}%`,
        trendContext: 'Compared to Last Period',
      },
      {
        title: `Outstanding Invoices (${displayDateFilter})`,
        value: formatCurrency(outstandingInvoices?.amount || 0),
        icon: 'ExclamationCircle',
        color: 'danger',
        trend:
          dateFilter === 'custom'
            ? null
            : (outstandingInvoices?.amount || 0) > (previousOutstandingInvoices?.amount || 0)
            ? 'up'
            : 'down',
        trendValue:
          dateFilter === 'custom'
            ? null
            : calculateTrend(outstandingInvoices?.amount, previousOutstandingInvoices?.amount),
        prevValue: formatCurrency(previousOutstandingInvoices?.amount || 0),
        trendContext: 'Compared to Last Period',
      },
    ];

    res.status(200).json({
      kpiData,
      chartData: {
        // Include chart-specific data here
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data.',
    });
  }
}