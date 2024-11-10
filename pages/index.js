import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Container } from 'react-bootstrap';
import DashboardFilters from 'components/DashboardFilters';
import KPISection from 'components/KPISection';
import DashboardCharts from 'components/DashboardCharts';
import { formatCurrency } from 'utils/formatCurrency';

const Dashboard = ({
    quotationConversionRate,
    NumberOfSalesOrders,
    totalSalesRevenue,
    outstandingInvoices,
    salesData = [],
}) => {
    const router = useRouter();
    const {
        dateFilter: initialDateFilter = 'today',
        startDate: initialStartDate,
        endDate: initialEndDate,
        region: initialRegion,
        customer: initialCustomer,
    } = router.query;

    const [dateFilter, setDateFilter] = useState(initialDateFilter);
    const [startDate, setStartDate] = useState(initialStartDate || '');
    const [endDate, setEndDate] = useState(initialEndDate || '');
    const [region, setRegion] = useState(initialRegion || '');
    const [customer, setCustomer] = useState(initialCustomer || '');

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

    const kpiData = [
        {
            title: `Total Sales Revenue ${dateFilter === 'custom' ? '' : dateFilter}`,
            value: formatCurrency(totalSalesRevenue),
            icon: 'CurrencyDollar',
            color: 'primary',
        },
        {
            title: `Number of Sales Orders ${dateFilter === 'custom' ? '' : dateFilter}`,
            value: NumberOfSalesOrders,
            icon: 'Cart4',
            color: 'success',
        },
        {
            title: `Quotation Conversion Rate ${dateFilter === 'custom' ? '' : dateFilter}`,
            value: `${quotationConversionRate}%`,
            icon: 'GraphUpArrow',
            color: 'warning',
        },
        {
            title: `Outstanding Invoices ${dateFilter === 'custom' ? '' : dateFilter}`,
            value: formatCurrency(outstandingInvoices?.amount),
            icon: 'ExclamationCircle',
            color: 'danger',
        }
    ];

    return (
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

            {/* DashboardCharts is now unaffected by main filters */}
            <DashboardCharts />
        </Container>
    );
};

export default Dashboard;


// Fetch data on the server side based on query parameters
export async function getServerSideProps(context) {
    const { dateFilter = 'today', startDate, endDate, region, customer } = context.query;

    let computedStartDate = startDate;
    let computedEndDate = endDate;

    // Determine date range based on dateFilter
    if (!startDate || !endDate || dateFilter !== 'custom') {
        const today = new Date();
        if (dateFilter === 'today') {
            computedStartDate = computedEndDate = today.toISOString().split('T')[0];
        } else if (dateFilter === 'thisWeek') {
            const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
            const lastDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 7));
            computedStartDate = firstDayOfWeek.toISOString().split('T')[0];
            computedEndDate = lastDayOfWeek.toISOString().split('T')[0];
        } else if (dateFilter === 'thisMonth') {
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            computedStartDate = firstDayOfMonth.toISOString().split('T')[0];
            computedEndDate = lastDayOfMonth.toISOString().split('T')[0];
        }
    }

    const {
        getNumberOfSalesOrders,
        getTotalSalesRevenue,
        getOutstandingInvoices,
        getQuotationConversionRate,
        getSalesAndCOGS,
        getTopCustomers,
    } = require('lib/models/dashboard');

    try {
        const [
            quotationConversionRate,
            NumberOfSalesOrders,
            totalSalesRevenue,
            outstandingInvoices,
            salesData,
            topCustomers,
        ] = await Promise.all([
            getQuotationConversionRate({ startDate: computedStartDate, endDate: computedEndDate, region, customer }),
            getNumberOfSalesOrders({ startDate: computedStartDate, endDate: computedEndDate, region, customer }),
            getTotalSalesRevenue({ startDate: computedStartDate, endDate: computedEndDate, region, customer }),
            getOutstandingInvoices({ startDate: computedStartDate, endDate: computedEndDate, region, customer }),
            getSalesAndCOGS({ startDate: computedStartDate, endDate: computedEndDate, region, customer }),
            getTopCustomers({ startDate: computedStartDate, endDate: computedEndDate, region, customer })
        ]);

        return {
            props: {
                quotationConversionRate,
                NumberOfSalesOrders,
                totalSalesRevenue,
                outstandingInvoices,
                salesData,
                topCustomers: topCustomers || [],
                topCategories: [],
            },
        };
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return {
            props: {
                salesData: {},
                topCustomers: [],
                topCategories: [],
            },
        };
    }
}