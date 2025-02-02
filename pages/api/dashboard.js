// pages/api/dashboard.js

import { getSalesMetrics } from 'lib/models/dashboard';
import { formatCurrency } from 'utils/formatCurrency';

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
  console.log('Query params:', req.query);
  
  let computedStartDate = startDate;
  let computedEndDate = endDate;
  let previousStartDate, previousEndDate;

  const authHeader = req.headers.authorization;
  let token;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7); // remove "Bearer "
  }
  // Determine date ranges for current and previous periods
  const today = new Date();

  if (!startDate || !endDate || dateFilter !== 'custom') {
    if (dateFilter === 'today') {
      computedStartDate = computedEndDate = today.toISOString().split('T')[0];
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      previousStartDate = previousEndDate = yesterday.toISOString().split('T')[0];
    } else if (dateFilter === 'thisWeek') {
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay() + 1);
      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);

      computedStartDate = firstDayOfWeek.toISOString().split('T')[0];
      computedEndDate = lastDayOfWeek.toISOString().split('T')[0];

      const previousWeekStart = new Date(firstDayOfWeek);
      previousWeekStart.setDate(firstDayOfWeek.getDate() - 7);
      const previousWeekEnd = new Date(lastDayOfWeek);
      previousWeekEnd.setDate(lastDayOfWeek.getDate() - 7);

      previousStartDate = previousWeekStart.toISOString().split('T')[0];
      previousEndDate = previousWeekEnd.toISOString().split('T')[0];
    } else if (dateFilter === 'thisMonth') {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      computedStartDate = firstDayOfMonth.toISOString().split('T')[0];
      computedEndDate = lastDayOfMonth.toISOString().split('T')[0];

      const previousMonthStart = new Date(firstDayOfMonth);
      previousMonthStart.setMonth(firstDayOfMonth.getMonth() - 1);
      const previousMonthEnd = new Date(lastDayOfMonth);
      previousMonthEnd.setMonth(lastDayOfMonth.getMonth() - 1);

      previousStartDate = previousMonthStart.toISOString().split('T')[0];
      previousEndDate = previousMonthEnd.toISOString().split('T')[0];
    } else if (dateFilter === 'all') {
      computedStartDate = '';
      computedEndDate = '';
      previousStartDate = '';
      previousEndDate = '';
    }
  }

  try {
    const currentFilterParams = {
      token,
      ...(computedStartDate && { startDate: computedStartDate }),
      ...(computedEndDate && { endDate: computedEndDate }),
      region,
      customer,
      salesPerson,
      salesCategory,
    };

    const previousFilterParams = {
      token,
      ...(previousStartDate && { startDate: previousStartDate }),
      ...(previousEndDate && { endDate: previousEndDate }),
      region,
      customer,
      salesPerson,
      salesCategory,
    };

    // Fetch current and previous period data using consolidated function
    const [currentMetrics, previousMetrics] = await Promise.all([
      getSalesMetrics(currentFilterParams),
      getSalesMetrics(previousFilterParams),
    ]);

    // Improved trend calculation function
    const calculateTrend = (current, previous) => {
      if (current === null || current === undefined || 
          previous === null || previous === undefined) {
        return '0.00';
      }
      if (previous === 0) {
        return current > 0 ? '100.00' : '0.00';
      }
      const trend = ((current - previous) / previous) * 100;
      return Math.min(Math.max(trend, -100), 100).toFixed(2);
    };

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

    const kpiData = [
      {
        title: `Total Sales Revenue (${displayDateFilter})`,
        value: formatCurrency(currentMetrics.totalSales || 0),
        icon: 'RupeeIcon',
        color: 'primary',
        trend: dateFilter === 'custom'
          ? null
          : currentMetrics.totalSales > (previousMetrics.totalSales || 0)
            ? 'up'
            : 'down',
        trendValue: dateFilter === 'custom'
          ? null
          : calculateTrend(currentMetrics.totalSales, previousMetrics.totalSales),
        prevValue: formatCurrency(previousMetrics.totalSales || 0),
        trendContext: 'Compared to Last Period',
      },
      {
        title: `Number of Sales Orders (${displayDateFilter})`,
        value: currentMetrics.numberOfSalesOrders || 0,
        icon: 'Cart4',
        color: 'success',
        trend: dateFilter === 'custom'
          ? null
          : currentMetrics.numberOfSalesOrders > (previousMetrics.numberOfSalesOrders || 0)
            ? 'up'
            : 'down',
        trendValue: dateFilter === 'custom'
          ? null
          : calculateTrend(currentMetrics.numberOfSalesOrders, previousMetrics.numberOfSalesOrders),
        prevValue: previousMetrics.numberOfSalesOrders || 0,
        trendContext: 'Compared to Last Period',
      },
      {
        title: `Quotation Conversion Rate (${displayDateFilter})`,
        value: `${currentMetrics.quotationConversionRate || 0}%`,
        icon: 'GraphUpArrow',
        color: 'warning',
        trend: dateFilter === 'custom'
          ? null
          : currentMetrics.quotationConversionRate > (previousMetrics.quotationConversionRate || 0)
            ? 'up'
            : 'down',
        trendValue: dateFilter === 'custom'
          ? null
          : calculateTrend(currentMetrics.quotationConversionRate, previousMetrics.quotationConversionRate),
        prevValue: `${previousMetrics.quotationConversionRate || 0}%`,
        trendContext: 'Compared to Last Period',
      },
      {
        title: `Outstanding Invoices (${displayDateFilter})`,
        value: formatCurrency(currentMetrics.outstandingInvoices.amount || 0),
        icon: 'ExclamationCircle',
        color: 'danger',
        trend: dateFilter === 'custom'
          ? null
          : currentMetrics.outstandingInvoices.amount > (previousMetrics.outstandingInvoices.amount || 0)
            ? 'up'
            : 'down',
        trendValue: dateFilter === 'custom'
          ? null
          : calculateTrend(currentMetrics.outstandingInvoices.amount, previousMetrics.outstandingInvoices.amount),
        prevValue: formatCurrency(previousMetrics.outstandingInvoices.amount || 0),
        trendContext: 'Compared to Last Period',
      },
    ];

    res.status(200).json({
      kpiData,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data.',
    });
  }
}