import React from 'react';
import { Container, Row, Col, Card, Table } from 'react-bootstrap';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    BarElement,
    ArcElement,
} from 'chart.js';
import {
    GraphUpArrow,
    CurrencyDollar,
    Cart4,
    PiggyBank
} from 'react-bootstrap-icons';
import { formatCurrency } from 'utils/formatCurrency';
import { getMonthlySalesAndCOGS, getTopCategoriesMonthly, getTopCustomers, getTotalOpenOrders } from 'lib/models/dashboard';
import LoadingSpinner from 'components/LoadingSpinner';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const Dashboard = ({ salesData = [], topCustomers, topCategories, openOrders }) => {
    // Calculate totals
    const [isLoading, setIsLoading] = React.useState(true);
    const totalSales = salesData.reduce((sum, month) => sum + month.Sales, 0);
    const totalCOGS = salesData.reduce((sum, month) => sum + month.COGS, 0);
    const totalProfit = totalSales - totalCOGS;
    const overallProfitMargin = totalSales ? ((totalProfit / totalSales) * 100).toFixed(1) : '0.0';
    const totalCategorySales = topCategories.reduce((sum, category) => sum + category.TotalSales, 0);

    React.useEffect(() => {
        // Check if all required data is available
        if (salesData.length > 0 && topCustomers?.length > 0 && topCategories?.length > 0) {
            setIsLoading(false);
        }
    }, [salesData, topCustomers, topCategories]);


    // Chart.js data configurations
    const salesChartData = {
        labels: salesData.map(data => data.Month),
        datasets: [
            {
                label: 'Sales',
                data: salesData.map(data => data.Sales),
                borderColor: 'rgb(66, 133, 244)',
                backgroundColor: 'rgba(66, 133, 244, 0.1)',
                fill: true,
                tension: 0.4,
            },
            {
                label: 'COGS',
                data: salesData.map(data => data.COGS),
                borderColor: 'rgb(234, 67, 53)',
                backgroundColor: 'rgba(234, 67, 53, 0.1)',
                fill: true,
                tension: 0.4,
            }
        ]
    };

    const months = topCustomers.length > 0
        ? Object.keys(topCustomers[0])
            .filter(key => key !== 'Customer' && key !== 'GrandTotal')
            .sort((a, b) => new Date(a) - new Date(b)) // Sort months in descending order
        : []; // Default to an empty array if topCustomers is empty
    const monthlyCustomerTotals = months.map(month =>
        topCustomers.reduce((sum, customer) => sum + (customer[month] || 0), 0)
    );
    const grandTotal = topCustomers.reduce((sum, customer) => sum + customer.GrandTotal, 0);


    
    const categoryMonths = topCategories.length > 0
    ? Object.keys(topCategories[0])
        .filter(key => key !== 'Category' && key !== 'GrandTotal')
    : [];

    const monthlyCategoryTotals = categoryMonths.map(month =>
        topCategories.reduce((sum, category) => sum + (category[month] || 0), 0)
    );

    const categoryGrandTotal = topCategories.reduce((sum, category) => sum + category.GrandTotal, 0);

    const profitChartData = {
        labels: salesData.map(data => data.Month),
        datasets: [{
            label: 'Monthly Profit',
            data: salesData.map(data => data.Sales - data.COGS),
            backgroundColor: 'rgba(52, 168, 83, 0.8)',
        }]
    };

    const customerChartData = {
        labels: topCustomers.map(customer => customer.Customer),
        datasets: [{
            data: topCustomers.map(customer => customer.TotalSales),
            backgroundColor: [
                'rgba(66, 133, 244, 0.8)',
                'rgba(234, 67, 53, 0.8)',
                'rgba(251, 188, 5, 0.8)',
                'rgba(52, 168, 83, 0.8)',
                'rgba(153, 0, 255, 0.8)',
            ],
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => formatCurrency(value)
                }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
            }
        }
    };
    if (isLoading) {
        return <LoadingSpinner />;
    }
    return (
        <Container fluid className="p-4 bg-light min-vh-100">
            <h1 className="mb-4">Sales Dashboard</h1>

            {/* Summary Cards */}
            <Row className="g-4 mb-4">
                <Col xs={12} md={6} xl={3}>
                    <Card className="h-100 shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <Card.Title className="text-muted mb-0">Total Sales</Card.Title>
                                <CurrencyDollar className="text-primary" />
                            </div>
                            <h3 className="mb-0">{formatCurrency(totalSales)}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} md={6} xl={3}>
                    <Card className="h-100 shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <Card.Title className="text-muted mb-0">COGS</Card.Title>
                                <Cart4 className="text-warning" />
                            </div>
                            <h3 className="mb-0">{formatCurrency(totalCOGS)}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} md={6} xl={3}>
                    <Card className="h-100 shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <Card.Title className="text-muted mb-0">Profit</Card.Title>
                                <PiggyBank className="text-success" />
                            </div>
                            <h3 className="mb-0">{formatCurrency(totalProfit)}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} md={6} xl={3}>
                    <Card className="h-100 shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <Card.Title className="text-muted mb-0">Monthly Growth</Card.Title>
                                <GraphUpArrow className={`text-${totalProfit >= 0 ? 'success' : 'danger'}`} />
                            </div>
                            <h3 className="mb-0 text-success">{overallProfitMargin}%</h3>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="w-full mb-4">
                <div className="p-6">
                    <Card.Title>Monthly Sales Data</Card.Title>
                    <div className="table-responsive">
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>Month</th>
                                    <th className="text-start">Sales</th>
                                    <th className="text-start">COGS</th>
                                    <th className="text-start">Profit</th>
                                    <th className="text-start">Margin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesData.map((month, index) => {
                                    const profit = month.Sales - month.COGS;
                                    const margin = month.Sales ? ((profit / month.Sales) * 100).toFixed(1) : '0.0';
                                    return (
                                        <tr key={index}>
                                            <td>{month.Month}</td>
                                            <td className="text-start">{formatCurrency(month.Sales)}</td>
                                            <td className="text-start">{formatCurrency(month.COGS)}</td>
                                            <td className="text-start">{formatCurrency(profit)}</td>
                                            <td className="text-start">{margin}%</td>
                                        </tr>
                                    );
                                })}

                                {/* Total Row */}
                                <tr className="font-weight-bold table-primary">
                                    <td>Total</td>
                                    <td className="text-start">
                                        {formatCurrency(salesData.reduce((total, month) => total + month.Sales, 0))}
                                    </td>
                                    <td className="text-start">
                                        {formatCurrency(salesData.reduce((total, month) => total + month.COGS, 0))}
                                    </td>
                                    <td className="text-start">
                                        {formatCurrency(
                                            salesData.reduce((total, month) => total + (month.Sales - month.COGS), 0)
                                        )}
                                    </td>
                                    <td className="text-start">
                                        {(
                                            (salesData.reduce((total, month) => total + (month.Sales - month.COGS), 0) /
                                                salesData.reduce((total, month) => total + month.Sales, 0)) *
                                            100
                                        ).toFixed(1)}%
                                    </td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                </div>
            </Card>


            {/* Charts Row */}
            {/* <Row className="g-4 mb-4">
                <Col lg={8}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title>Sales vs COGS Trend</Card.Title>
                            <div style={{ height: '400px' }}>
                                <Line data={salesChartData} options={chartOptions} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title>Top Customer Distribution</Card.Title>
                            <div style={{ height: '400px' }}>
                                <Doughnut data={customerChartData} options={doughnutOptions} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row> */}

            <Card className="w-full mb-4">
                <div className="p-6">
                    <Card.Title className="text-lg font-semibold mb-4">Top Customers Monthly Sales</Card.Title>
                    <div className="overflow-x-auto">
                        <Table bordered hover striped responsive>
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 text-left w-52">Customer</th>
                                    {months.map((month) => (
                                        <th key={month} className="px-4 py-2 text-right">
                                            {month.split('-')[0]}
                                        </th>
                                    ))}
                                    <th className="px-4 py-2 text-right">Grand Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topCustomers.map((customer, index) => (
                                    <tr key={index} className="odd:bg-white even:bg-gray-50">
                                        <td className="px-4 py-2 font-semibold">{customer.Customer}</td>
                                        {months.map((month) => (
                                            <td key={month} className="px-4 py-2 text-right">
                                                {formatCurrency(customer[month])}
                                            </td>
                                        ))}
                                        <td className="px-4 py-2 text-right font-semibold">
                                            {formatCurrency(customer.GrandTotal)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="table-primary">
                                    <td className="px-4 py-2 fw-bold">Total</td>
                                    {monthlyCustomerTotals.map((total, index) => (
                                        <td key={index} className="px-4 py-2 fw-bold text-right">
                                            {formatCurrency(total)}
                                        </td>
                                    ))}
                                    <td className="px-4 py-2 text-right fw-bold">{formatCurrency(grandTotal)}</td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                </div>
            </Card>


            <Card className="w-full mb-4">
                <div className="p-6">
                    <Card.Title className="text-lg font-semibold mb-4">Top Categories Monthly Sales</Card.Title>
                    <div className="overflow-x-auto">
                        <Table bordered hover striped responsive>
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 text-left w-52">Category</th>
                                    {categoryMonths.map((month) => (
                                        <th key={month} className="px-4 py-2 text-right">
                                            {month.split('-')[0]}
                                        </th>
                                    ))}
                                    <th className="px-4 py-2 text-right">Grand Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topCategories.map((category, index) => (
                                    <tr key={index} className="odd:bg-white even:bg-gray-50">
                                        <td className="px-4 py-2 font-semibold">{category.Category}</td>
                                        {categoryMonths.map((month) => (
                                            <td key={month} className="px-4 py-2 text-right">
                                                {formatCurrency(category[month] || 0)}
                                            </td>
                                        ))}
                                        <td className="px-4 py-2 text-right font-semibold">
                                            {formatCurrency(category.GrandTotal)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="table-primary">
                                    <td className="px-4 py-2 fw-bold">Total</td>
                                    {monthlyCategoryTotals.map((total, index) => (
                                        <td key={index} className="px-4 py-2 fw-bold text-right">
                                            {formatCurrency(total)}
                                        </td>
                                    ))}
                                    <td className="px-4 py-2 text-right fw-bold">{formatCurrency(categoryGrandTotal)}</td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                </div>
            </Card>


            {/* Monthly Profit Chart */}
            <Row className="g-4 mb-4">
                <Col xs={12}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title>Monthly Profit Analysis</Card.Title>
                            <div style={{ height: '300px' }}>
                                <Bar data={profitChartData} options={chartOptions} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Monthly Data Table */}

        </Container>
    );
};

export default Dashboard;

export async function getServerSideProps() {
    try {
        const [salesData, topCustomers, topCategories, openOrders] = await Promise.all([
            getMonthlySalesAndCOGS(),
            getTopCustomers(),
            getTopCategoriesMonthly(),
            getTotalOpenOrders(),
        ]);

        return {
            props: {
                salesData: salesData || [],
                topCustomers: topCustomers || [],
                topCategories: topCategories || [],
                openOrders: openOrders[0]?.TotalOpenOrders || 0,
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
            },
        };
    }
}
