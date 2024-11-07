import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Form, Button } from 'react-bootstrap';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import {
    GraphUpArrow,
    CurrencyDollar,
    Cart4,
    PiggyBank,
    ExclamationCircle,
} from 'react-bootstrap-icons';
import { formatCurrency } from 'utils/formatCurrency';

import LoadingSpinner from 'components/LoadingSpinner';
import DashboardFilters from 'components/DashboardFilters';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const Dashboard = ({
    quotationConversionRate,
    NumberOfSalesOrders,
    totalSalesRevenue,
    outstandingInvoices,
    salesData = [],
    topCustomers = [],
    topCategories = [],
    availableMonths = [],
    availableYears = [],
    availableRegions = [],
    availableCustomers = [],
    openOrders = 0
}) => {
    console.log('openOrders', openOrders);

    // Existing calculations...
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
      

    // Calculate total Sales and total COGS
    const totalSales = salesData.Sales || 0;
    const totalCOGS = salesData.COGS || 0;
    const totalProfit = totalSales - totalCOGS;
    const overallProfitMargin = totalSales
        ? ((totalProfit / totalSales) * 100).toFixed(1)
        : '0.0';

    const [isLoading, setIsLoading] = React.useState(true);
    const [isFilterLoading, setIsFilterLoading] = useState(false);

    // useEffect(() => {
    //     if (salesData && topCustomers.length > 0 && topCategories.length > 0) {
    //       setIsLoading(false);
    //       setIsFilterLoading(false);
    //     }
    //   }, [salesData, topCustomers, topCategories]);
      

    // Color palette
    const colorPalette = {
        primary: '#4A6CF7',
        secondary: '#8A94A6',
        success: '#28a745',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8',
        light: '#f8f9fa',
        dark: '#343a40'
    };

    // Function to assign colors with more sophisticated color management
    function getColor(index) {
        const colors = [
            '#3366CC', '#DC3912', '#FF9900', '#109618',
            '#990099', '#0099C6', '#DD4477', '#66AA00',
            '#B82E2E', '#316395'
        ];
        return colors[index % colors.length];
    }

    // Chart configurations (keeping existing logic with style improvements)
    // Chart configuration
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12,
                    }
                }
            },
            tooltip: {
                backgroundColor: colorPalette.dark,
                titleFont: {
                    family: "'Inter', sans-serif",
                    weight: 'bold'
                },
                bodyFont: {
                    family: "'Inter', sans-serif"
                },
                callbacks: {
                    label: function (tooltipItem) {
                        // Format tooltip values with formatCurrency
                        return formatCurrency(tooltipItem.raw);
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(0,0,0,0.05)',
                    drawBorder: false
                },
                ticks: {
                    font: {
                        family: "'Inter', sans-serif"
                    }
                }
            },
            y: {
                grid: {
                    color: 'rgba(0,0,0,0.05)',
                    drawBorder: false
                },
                ticks: {
                    font: {
                        family: "'Inter', sans-serif"
                    }
                }
            }
        }
    };


    // **Sales vs COGS Bar Chart**

    const salesAndCOGSChartData = {
        labels: ['Sales', 'COGS'],
        datasets: [
            {
                label: 'Amount',
                data: [totalSales, totalCOGS],
                backgroundColor: [colorPalette.primary, colorPalette.warning],
                borderColor: [colorPalette.primary, colorPalette.warning],
                borderWidth: 1,
                maxBarThickness: 100,
            },
        ],
    };

    const salesAndCOGSChartOptions = {
        ...chartOptions,
        indexAxis: 'y',
        scales: {
            x: {
                ...chartOptions.scales.x,
                stacked: false,
                ticks: {
                    callback: (value) => formatCurrency(value),
                    font: {
                        family: "'Inter', sans-serif",
                    },
                },
            },
            y: {
                ...chartOptions.scales.y,
                stacked: false,
            },
        },
    };


    // **2. Top Customers Monthly Sales Chart**

    const months = topCustomers?.[0]
        ? Object.keys(topCustomers[0])
            .filter((key) => key !== 'Customer' && key !== 'GrandTotal')
            .sort((a, b) => new Date(a) - new Date(b))
        : [];

    const customerDatasets = topCustomers.map((customer, index) => ({
        label: customer.Customer,
        data: months.map((month) => customer[month] || 0),
        backgroundColor: getColor(index),
    }));

    // **2. Top Customers Sales Chart**

    const topCustomersChartData = {
        labels: topCustomers.map((customer) => customer.Customer),
        datasets: [
          {
            label: 'Sales',
            data: topCustomers.map((customer) => customer.Sales || 0),
            backgroundColor: topCustomers.map((_, index) => getColor(index)),
            maxBarThickness: 100,
          },
        ],
      };
      

    const topCustomersChartOptions = {
        ...chartOptions,
        scales: {
            x: {
                ...chartOptions.scales.x,
                stacked: false, // Ensure bars are not stacked
            },
            y: {
                ticks: {
                    callback: (value) => formatCurrency(value),
                    ...chartOptions.scales.y.ticks,
                },
                ...chartOptions.scales.y,
                stacked: false, // Ensure bars are not stacked
            },
        },
    };


    // **3. Top Categories Monthly Sales Chart**

    const categoryMonths = topCategories?.[0]
        ? Object.keys(topCategories[0])
            .filter((key) => key !== 'Category' && key !== 'GrandTotal')
            .sort((a, b) => new Date(a) - new Date(b))
        : [];

    const categoryDatasets = topCategories.map((category, index) => ({
        label: category.Category,
        data: categoryMonths.map((month) => category[month] || 0),
        backgroundColor: getColor(index + topCustomers.length),
    }));

    // **3. Top Categories Sales Chart**

    const topCategoriesChartData = {
        labels: topCategories.map((category) => category.Category),
        datasets: [
          {
            label: 'Sales',
            data: topCategories.map((category) => category.Sales || 0),
            backgroundColor: topCategories.map((_, index) => getColor(index + topCustomers.length)),
            maxBarThickness: 100,
          },
        ],
      };
      

    const topCategoriesChartOptions = {
        ...chartOptions,
        scales: {
            x: {
                ...chartOptions.scales.x,
                stacked: false, // Ensure bars are not stacked
            },
            y: {
                ticks: {
                    callback: (value) => formatCurrency(value),
                    ...chartOptions.scales.y.ticks,
                },
                ...chartOptions.scales.y,
                stacked: false, // Ensure bars are not stacked
            },
        },
    };


    const handleFilterChange = async (filterValues) => {
        setIsFilterLoading(true);
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
      




    // if (isLoading) {
    //     return <LoadingSpinner />;
    // }

    return (
        <Container fluid className="p-4" style={{
            backgroundColor: colorPalette.light,
            fontFamily: "'Inter', sans-serif"
        }}>
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

            <Row className="g-4 mb-4">
                {[
                    {
                        title: 'Total Sales Revenue Today',
                        value: formatCurrency(totalSalesRevenue),
                        icon: <CurrencyDollar className="text-primary" />,
                        color: colorPalette.primary,
                      },
                      {
                        title: 'Number of Sales Orders Today',
                        value: NumberOfSalesOrders,
                        icon: <Cart4 className="text-success" />,
                        color: colorPalette.success,
                      },
                      {
                        title: 'Quotation Conversion Rate Today',
                        value: `${quotationConversionRate}%`,
                        icon: <GraphUpArrow className="text-warning" />,
                        color: colorPalette.warning,
                      },
                      {
                        title: 'Outstanding Invoices Today',
                        value: formatCurrency(outstandingInvoices.amount),
                        icon: <ExclamationCircle className="text-danger" />,
                        color: colorPalette.danger,
                      },
                    {
                        title: 'Total Sales',
                        value: formatCurrency(totalSales),
                        icon: <CurrencyDollar className="text-primary" />,
                        color: colorPalette.primary
                    },
                    {
                        title: 'COGS',
                        value: formatCurrency(totalCOGS),
                        icon: <Cart4 className="text-warning" />,
                        color: colorPalette.warning
                    },
                    {
                        title: 'Profit',
                        value: formatCurrency(totalProfit),
                        icon: <PiggyBank className="text-success" />,
                        color: colorPalette.success
                    },
                    {
                        title: 'Profit Margin',
                        value: `${overallProfitMargin}%`,
                        icon: <GraphUpArrow className={`text-${overallProfitMargin >= 0 ? 'success' : 'danger'}`} />,
                        color: overallProfitMargin >= 0 ? colorPalette.success : colorPalette.danger
                    }
                ].map((card, index) => (
                    <Col key={index} xs={12} md={6} xl={3}>
                        <Card
                            className="h-100 shadow-sm"
                            style={{
                                borderLeft: `4px solid ${card.color}`,
                                transition: 'transform 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.02)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <Card.Title
                                        className="text-muted mb-0"
                                        style={{
                                            fontSize: '0.875rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}
                                    >
                                        {card.title}
                                    </Card.Title>
                                    {card.icon}
                                </div>
                                <h3
                                    className="mb-0"
                                    style={{
                                        color: card.color,
                                        fontWeight: 600,
                                        fontSize: '1.5rem'
                                    }}
                                >
                                    {card.value || 0}
                                </h3>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
            {/* Charts */}
            {[
                {
                    title: 'Sales vs COGS',
                    chart: <Bar data={salesAndCOGSChartData} options={salesAndCOGSChartOptions} />,
                },
                {
                    title: 'Top Customers Sales',
                    chart: <Bar data={topCustomersChartData} options={topCustomersChartOptions} />,
                },
                {
                    title: 'Top Categories Sales',
                    chart: <Bar data={topCategoriesChartData} options={topCategoriesChartOptions} />,
                },
            ].map((section, index) => (
                <Card
                    key={index}
                    className="mb-4 shadow-sm"
                    style={{
                        borderRadius: '12px',
                        overflow: 'hidden'
                    }}
                >
                    <Card.Header
                        className="bg-white py-3"
                        style={{
                            borderBottom: '1px solid rgba(0,0,0,0.1)'
                        }}
                    >
                        <h4
                            className="mb-0"
                            style={{
                                fontWeight: 600,
                                color: colorPalette.dark
                            }}
                        >
                            {section.title}
                        </h4>
                    </Card.Header>
                    <Card.Body>
                        <div style={{ height: '400px' }}>
                            {section.chart}
                        </div>
                    </Card.Body>
                </Card>
            ))}
        </Container>
    );
};

Dashboard.seo = {
    title: 'Dashboard | Density',
    description: 'Comprehensive business performance dashboard with sales, profit, and category insights.',
    keywords: 'dashboard, business analytics, sales performance, profit margin'
};

export default Dashboard;

export async function getServerSideProps(context) {
    const {
        dateFilter = 'today',
        startDate,
        endDate,
        region,
        customer,
    } = context.query;

    let computedStartDate = startDate;
    let computedEndDate = endDate;

    if (!startDate || !endDate || dateFilter !== 'custom') {
        const today = new Date();
        if (dateFilter === 'today') {
            computedStartDate = computedEndDate = today.toISOString().split('T')[0];
        } else if (dateFilter === 'thisWeek') {
            const firstDayOfWeek = new Date(
                today.setDate(today.getDate() - today.getDay() + 1)
            );
            const lastDayOfWeek = new Date(
                today.setDate(today.getDate() - today.getDay() + 7)
            );
            computedStartDate = firstDayOfWeek.toISOString().split('T')[0];
            computedEndDate = lastDayOfWeek.toISOString().split('T')[0];
        } else if (dateFilter === 'thisMonth') {
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            computedStartDate = firstDayOfMonth.toISOString().split('T')[0];
            computedEndDate = lastDayOfMonth.toISOString().split('T')[0];
        }
    }

    // Import server-side functions here
    const {
        getNumberOfSalesOrders,
        getTotalSalesRevenue,
        getOutstandingInvoices,
        getQuotationConversionRate,
        getSalesAndCOGS,
        getTopCustomers,
        getTopCategories,
        getTotalOpenOrders,
    } = require('lib/models/dashboard');

    try {
        const [ quotationConversionRate,NumberOfSalesOrders, totalSalesRevenue,outstandingInvoices,salesData, topCustomers, topCategories, openOrders] = await Promise.all([
            getQuotationConversionRate({
                startDate: computedStartDate,
                endDate: computedEndDate,
                region,
                customer,
            }),
            getNumberOfSalesOrders({
                startDate: computedStartDate,
                endDate: computedEndDate,
                region,
                customer,
            }),
            getTotalSalesRevenue({
                startDate: computedStartDate,
                endDate: computedEndDate,
                region,
                customer,
            }),
            getOutstandingInvoices({
                startDate: computedStartDate,
                endDate: computedEndDate,
                region,
                customer,
            }),
            getSalesAndCOGS({
                startDate: computedStartDate,
                endDate: computedEndDate,
                region,
                customer,
            }),
            getTopCustomers({
                startDate: computedStartDate,
                endDate: computedEndDate,
                region,
                customer,
            }),
            getTopCategories({
                startDate: computedStartDate,
                endDate: computedEndDate,
                region,
                customer,
            }),
            getTotalOpenOrders({ region, customer }),
        ]);

        return {
            props: {
                quotationConversionRate,
                NumberOfSalesOrders,
                totalSalesRevenue,
                outstandingInvoices,
                salesData,
                topCustomers: topCustomers || [],
                topCategories: topCategories || [],
                openOrders: openOrders[0]?.TotalOpenOrders || 0,
                // Remove unused props
            },
        };
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return {
            props: {
                salesData: {},
                topCustomers: [],
                topCategories: [],
                openOrders: 0,
            },
        };
    }
}


