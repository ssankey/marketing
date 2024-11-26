import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Container, Spinner } from 'react-bootstrap';
import DashboardFilters from 'components/DashboardFilters';
import KPISection from 'components/KPISection';
import DashboardCharts from 'components/DashboardCharts';
import { formatCurrency } from 'utils/formatCurrency';
import { useAuth } from 'hooks/useAuth';

const Dashboard = ({
    quotationConversionRate,
    NumberOfSalesOrders,
    totalSalesRevenue,
    outstandingInvoices,
    salesData = [],
    orderStatistics=[],
    previousData = {}
}) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, redirecting } = useAuth();

  const {
    dateFilter: initialDateFilter = "today",
    startDate: initialStartDate,
    endDate: initialEndDate,
    region: initialRegion,
    customer: initialCustomer,
  } = router.query;

  const [dateFilter, setDateFilter] = useState(initialDateFilter);
  const [startDate, setStartDate] = useState(initialStartDate || "");
  const [endDate, setEndDate] = useState(initialEndDate || "");
  const [region, setRegion] = useState(initialRegion || "");
  const [customer, setCustomer] = useState(initialCustomer || "");

  const handleFilterChange = async (filterValues) => {
    const query = {
      ...(filterValues.dateFilter && { dateFilter: filterValues.dateFilter }),
      ...(filterValues.startDate && { startDate: filterValues.startDate }),
      ...(filterValues.endDate && { endDate: filterValues.endDate }),
      ...(filterValues.region && { region: filterValues.region }),
      ...(filterValues.customer && { customer: filterValues.customer }),
    };
    await router.push({
      pathname: router.pathname,
      query,
    });
  };

  const calculateTrend = (current, previous) =>
    previous ? (((current - previous) / previous) * 100).toFixed(2) : 0;

  const kpiData = [
    {
      title: `Total Sales Revenue ${dateFilter === "custom" ? "" : dateFilter}`,
      value: formatCurrency(totalSalesRevenue),
      icon: "RupeeIcon",
      color: "primary",
      trend:
        dateFilter === "custom"
          ? null
          : totalSalesRevenue > previousData.totalSalesRevenue
          ? "up"
          : "down",
      trendValue:
        dateFilter === "custom"
          ? null
          : calculateTrend(totalSalesRevenue, previousData.totalSalesRevenue),
      prevValue:
        dateFilter === "custom"
          ? null
          : formatCurrency(previousData.totalSalesRevenue),
      trendContext: "Compared to Last Period",
    },
    {
      title: `Number of Sales Orders ${
        dateFilter === "custom" ? "" : dateFilter
      }`,
      value: NumberOfSalesOrders,
      icon: "Cart4",
      color: "success",
      trend:
        dateFilter === "custom"
          ? null
          : NumberOfSalesOrders > previousData.NumberOfSalesOrders
          ? "up"
          : "down",
      trendValue:
        dateFilter === "custom"
          ? null
          : calculateTrend(
              NumberOfSalesOrders,
              previousData.NumberOfSalesOrders
            ),
      prevValue:
        dateFilter === "custom" ? null : previousData.NumberOfSalesOrders,
      trendContext: "Compared to Last Period",
    },
    {
      title: `Quotation Conversion Rate ${
        dateFilter === "custom" ? "" : dateFilter
      }`,
      value: `${quotationConversionRate}%`,
      icon: "GraphUpArrow",
      color: "warning",
      trend:
        dateFilter === "custom"
          ? null
          : quotationConversionRate > previousData.quotationConversionRate
          ? "up"
          : "down",
      trendValue:
        dateFilter === "custom"
          ? null
          : calculateTrend(
              quotationConversionRate,
              previousData.quotationConversionRate
            ),
      prevValue:
        dateFilter === "custom"
          ? null
          : `${previousData.quotationConversionRate}%`,
      trendContext: "Compared to Last Period",
    },
    {
      title: `Outstanding Invoices ${
        dateFilter === "custom" ? "" : dateFilter
      }`,
      value: formatCurrency(outstandingInvoices?.amount),
      icon: "ExclamationCircle",
      color: "danger",
      trend:
        dateFilter === "custom"
          ? null
          : outstandingInvoices?.amount >
            previousData.outstandingInvoices?.amount
          ? "up"
          : "down",
      trendValue:
        dateFilter === "custom"
          ? null
          : calculateTrend(
              outstandingInvoices?.amount,
              previousData.outstandingInvoices?.amount
            ),
      prevValue:
        dateFilter === "custom"
          ? null
          : formatCurrency(previousData.outstandingInvoices?.amount),
      trendContext: "Compared to Last Period",
    },
  ];

    if (isLoading || redirecting) {
        // Don't render anything if loading or redirecting
        return null;
    }
    
    return (
        isAuthenticated ? (
            <Container fluid className="p-4" style={{ backgroundColor: '#f8f9fa', fontFamily: "'Inter', sans-serif" }}>
                <DashboardFilters
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                    region={region}
                    setRegion={setRegion}
                    customer={customer}
                    setCustomer={setCustomer}
                    handleFilterChange={handleFilterChange}
                />

      <KPISection kpiData={kpiData} />

                <DashboardCharts salesData={salesData} orderStatistics={orderStatistics} />
            </Container>
        ) : null // Don't render if not authenticated
    );
};

export default Dashboard;



// Fetch data on the server side based on query parameters
export async function getServerSideProps(context) {
    const { dateFilter = 'today', startDate, endDate, region, customer } = context.query;

    let computedStartDate = startDate;
    let computedEndDate = endDate;
    let previousStartDate, previousEndDate;

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
        }
    }

    const {
        getNumberOfSalesOrders,
        getTotalSalesRevenue,
        getOutstandingInvoices,
        getQuotationConversionRate,
        getSalesAndCOGS,
        getOrderStatistics, // Importing the new function
        getTopCustomers,
    } = require('lib/models/dashboard');
    
    const {getMonthlyOrdersByStatus} = require('lib/models/orders')
    try {
        // Fetch current and previous period data
        const [
            quotationConversionRate,
            NumberOfSalesOrders,
            totalSalesRevenue,
            outstandingInvoices,
            salesData,
            orderStatistics, // Fetching order statistics for the current period
            previousQuotationConversionRate,
            previousNumberOfSalesOrders,
            previousTotalSalesRevenue,
            previousOutstandingInvoices,
            previousOrderStatistics // Fetching order statistics for the previous period
        ] = await Promise.all([
            getQuotationConversionRate({ startDate: computedStartDate, endDate: computedEndDate, region, customer }),
            getNumberOfSalesOrders({ startDate: computedStartDate, endDate: computedEndDate, region, customer }),
            getTotalSalesRevenue({ startDate: computedStartDate, endDate: computedEndDate, region, customer }),
            getOutstandingInvoices({ startDate: computedStartDate, endDate: computedEndDate, region, customer }),
            getSalesAndCOGS({ startDate: computedStartDate, endDate: computedEndDate, region, customer }),
            getOrderStatistics({ startDate: computedStartDate, endDate: computedEndDate, region, customer }), // Current period
            getQuotationConversionRate({ startDate: previousStartDate, endDate: previousEndDate, region, customer }),
            getNumberOfSalesOrders({ startDate: previousStartDate, endDate: previousEndDate, region, customer }),
            getTotalSalesRevenue({ startDate: previousStartDate, endDate: previousEndDate, region, customer }),
            getOutstandingInvoices({ startDate: previousStartDate, endDate: previousEndDate, region, customer }),
            getOrderStatistics({ startDate: previousStartDate, endDate: previousEndDate, region, customer }) // Previous period
        ]);

        console.log("OrdersData:", OrdersData);
        return {
            props: {
                quotationConversionRate,
                NumberOfSalesOrders,
                totalSalesRevenue,
                outstandingInvoices,
                salesData,
                orderStatistics, // Passing the order statistics to props
                topCustomers: [],
                previousData: {
                    quotationConversionRate: previousQuotationConversionRate,
                    NumberOfSalesOrders: previousNumberOfSalesOrders,
                    totalSalesRevenue: previousTotalSalesRevenue,
                    outstandingInvoices: previousOutstandingInvoices,
                    orderStatistics: previousOrderStatistics // Passing previous order statistics
                }
            },
        };
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return {
            props: {
                quotationConversionRate: null,
                NumberOfSalesOrders: null,
                totalSalesRevenue: null,
                outstandingInvoices: null,
                salesData: [],
                orderStatistics: null,
                topCustomers: [],
                OrdersData:[],
                previousData: {}
            },
        };
    }
}

