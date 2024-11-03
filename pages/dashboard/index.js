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
} from 'react-bootstrap-icons';
import { formatCurrency } from 'utils/formatCurrency';
import {
    getAvailableFilters,
    getMonthlySalesAndCOGS,
    getTopCategoriesMonthly,
    getTopCustomers,
    getTotalOpenOrders,
} from 'lib/models/dashboard';
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
    salesData = [],
    topCustomers = [],
    topCategories = [],
    availableMonths = [],
    availableYears = [],
    availableRegions = [],
    availableCustomers=[],
    openOrders = 0
}) => {
    
    // Existing calculations...
    const router = useRouter();
    const { month: initialMonth, year: initialYear, region: initialRegion,customer: initialCustomer, } = router.query;
    const [month, setMonth] = useState(initialMonth || '');
    const [year, setYear] = useState(initialYear || '');
    const [region, setRegion] = useState(initialRegion || '');
    const [customer, setCustomer] = useState(initialCustomer || '');

    // Calculate total Sales and total COGS
    const totalSales = salesData.reduce((sum, data) => sum + data.Sales, 0);
    const totalCOGS = salesData.reduce((sum, data) => sum + data.COGS, 0);


    // const totalSales = salesData.reduce((sum, month) => sum + month.Sales, 0);
    // const totalCOGS = salesData.reduce((sum, month) => sum + month.COGS, 0);
    const totalProfit = totalSales - totalCOGS;
    const overallProfitMargin = totalSales
        ? ((totalProfit / totalSales) * 100).toFixed(1)
        : '0.0';

    const [isLoading, setIsLoading] = React.useState(true);
    const [isFilterLoading, setIsFilterLoading] = useState(false);

    React.useEffect(() => {
        if (salesData.length > 0 && topCustomers.length > 0 && topCategories.length > 0) {
            setIsLoading(false);
            setIsFilterLoading(false);  // Stop loading when data is ready
        }
    }, [salesData, topCustomers, topCategories]);

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
                data: topCustomers.map((customer) => customer.GrandTotal || 0),
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
                data: topCategories.map((category) => category.GrandTotal || 0),
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
          ...(filterValues.month && { month: filterValues.month }),
          ...(filterValues.year && { year: filterValues.year }),
          ...(filterValues.region && { region: filterValues.region }),
          ...(filterValues.customer && { customer: filterValues.customer }),
        };
        console.log(query);
        
        await router.push({
          pathname: router.pathname,
          query,
        });
      };
      



    if (isLoading || isFilterLoading) {
        return <LoadingSpinner />;
    }

    return (
        <Container fluid className="p-4" style={{
            backgroundColor: colorPalette.light,
            fontFamily: "'Inter', sans-serif"
        }}>
            <DashboardFilters
                month={month}
                year={year}
                region={region}
                customer={customer}
                setMonth={setMonth}
                setYear={setYear}
                setRegion={setRegion}
                setCustomer={setCustomer}
                availableMonths={availableMonths}
                availableYears={availableYears}
                availableRegions={availableRegions}
                availableCustomers={availableCustomers}
                handleFilterChange={handleFilterChange}
            />

            <Row className="g-4 mb-4">
                {[
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
                                    {card.value}
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

// pages/dashboard.js
export async function getServerSideProps(context) {
    const { month, year, region, customer } = context.query;
  
    try {
      const [
        salesData,
        topCustomers,
        topCategories,
        openOrders,
        availableFilters,
      ] = await Promise.all([
        getMonthlySalesAndCOGS({ month, year, region, customer }),
        getTopCustomers({ month, year, region, customer }),
        getTopCategoriesMonthly({ month, year, region, customer }),
        getTotalOpenOrders({ region, customer }),
        getAvailableFilters({ month, year }),
      ]);
  
      const { months, years, customers } = availableFilters;
  
      return {
        props: {
          salesData: salesData || [],
          topCustomers: topCustomers || [],
          topCategories: topCategories || [],
          openOrders: openOrders[0]?.TotalOpenOrders || 0,
          availableMonths: months || [],
          availableYears: years || [],
          availableCustomers: customers || [],
        },
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return {
        props: {
          salesData: [],
          topCustomers: [],
          topCategories: [],
          openOrders: 0,
          availableMonths: [],
          availableYears: [],
          availableCustomers: [],
        },
      };
    }
  }
  


