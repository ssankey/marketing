// src/components/EnhancedSalesCOGSChart.js
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import Select from "react-select";
import { Card, Table, Button, Spinner, Dropdown, Form } from 'react-bootstrap';
import AllFilter from "components/AllFilters.js";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement,
    LineController
} from 'chart.js';
import { formatCurrency } from 'utils/formatCurrency';
import { useAuth } from '../contexts/AuthContext';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    LineController
);

const EnhancedSalesCOGSChart = () => {
    const [salesData, setSalesData] = useState([]);
    const { user } = useAuth(); // Get user info
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [filters, setFilters] = useState({
        salesPerson: null,
        category: null,
        product: null
    });

    const fetchSalesData = async () => {
        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams();

            // Add filters only if they have a value
            if (filters.salesPerson?.value) {
                queryParams.append('slpCode', filters.salesPerson.value);
            }
            if (filters.category?.value) {
                queryParams.append('itmsGrpCod', filters.category.value);
            }
            if (filters.product?.value) {
                queryParams.append('itemCode', filters.product.value);
            }
            const token = localStorage.getItem('token');
            // Assuming the API returns data for all years when no "year" query is provided.
            const response = await fetch(`/api/sales-cogs?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const responseJson = await response.json();
            const { data } = responseJson;

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch data');
            }

            // Sort the data by year and month
            const sortedData = data.sort((a, b) => {
                // First compare years
                if (a.year !== b.year) {
                    return a.year - b.year;
                }
                // If years are the same, compare months
                return a.monthNumber - b.monthNumber;
            });

            setSalesData(sortedData);
        } catch (error) {
            console.error('Error fetching sales data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Remove dependency on any year filter; fetch once on component mount.
        console.log("Filters:", filters);
        if (user?.token) {
            fetchSalesData();
        }
    }, [user, filters]);

    // Prepare the x-axis labels using month-year format directly from API response
    const labels = salesData.map((data) => data.monthYear);

    // Calculate totals for each row
    const totalSales = salesData.reduce((acc, curr) => acc + (curr.totalSales || 0), 0);
    const totalCOGS = salesData.reduce((acc, curr) => acc + (curr.totalCogs || 0), 0);
    const averageGrossMargin = salesData.length
        ? salesData.reduce((acc, curr) => acc + (curr.grossMarginPct || 0), 0) / salesData.length
        : 0;

    const salesAndCOGSChartData = {
        labels,
        datasets: [
            {
                label: 'Sales',
                data: salesData.map((data) => data.totalSales || 0),
                backgroundColor: '#124f94', // Primary color
                borderWidth: 1,
            },
            // Only include COGS and Gross Margin % datasets for admin users.
            ...(user?.role === 'admin'
                ? [
                    {
                        label: 'COGS',
                        data: salesData.map((data) => data.totalCogs || 0),
                        backgroundColor: '#3bac4e', // Secondary color
                        borderWidth: 1,
                    },
                    {
                        label: 'Gross Margin %',
                        data: salesData.map((data) => data.grossMarginPct || 0),
                        type: 'line',
                        borderColor: '#3bac4e',
                        backgroundColor: '#3bac4e',
                        borderWidth: 2,
                        fill: false,
                        yAxisID: 'y1',
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                    },
                ]
                : []),
        ],
    };

    const salesAndCOGSChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            datalabels: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        if (context.dataset.label === 'Gross Margin %') {
                            return `${context.raw.toFixed(2)}%`;
                        }
                        return formatCurrency(context.raw);
                    },
                },
                backgroundColor: '#212529',
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 13 },
                padding: 12,
            },
            legend: {
                position: 'top',
                labels: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 13,
                    },
                    padding: 20,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => formatCurrency(value),
                    font: { family: "'Inter', sans-serif", size: 12 },
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                },
            },
            y1: {
                position: 'right',
                beginAtZero: true,
                ticks: {
                    callback: (value) => `${value}%`,
                    font: { family: "'Inter', sans-serif", size: 12 },
                },
                grid: {
                    drawOnChartArea: false,
                },
            },
            x: {
                grid: { display: false },
                ticks: {
                    font: { family: "'Inter', sans-serif", size: 12 },
                },
            },
        },
    };

    const exportToCSV = () => {
        if (!salesData.length) return; // Prevent exporting empty data.
        const csvRows = [
            ['Metric', ...labels, 'Total'],
            ['Sales', ...salesData.map((data) => data.totalSales || 0), totalSales],
            ...(user?.role === 'admin'
                ? [
                    ['COGS', ...salesData.map((data) => data.totalCogs || 0), totalCOGS],
                    ['Gross Margin %', ...salesData.map((data) => (data.grossMarginPct || 0).toFixed(2)), averageGrossMargin.toFixed(2)],
                ]
                : []),
        ];

        const csvContent = csvRows.map((row) => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'sales_cogs_data.csv');
        link.click();
    };

    return (
        <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white py-3">
                <div className="d-flex justify-content-between align-items-center">
                    {/* Left: Title */}
                    <h4
                        className="mb-3 mb-md-0"
                        style={{ fontWeight: 600, color: '#212529', fontSize: '1.25rem' }}
                    >
                        Sales
                    </h4>

                    {/* Right: AllFilter */}
                    <div className="ms-auto">
                        <AllFilter
                            searchQuery={searchQuery}
                            setSearchQuery={(value) => {
                                if (value) {
                                    setFilters(prev => ({
                                        ...prev,
                                        [value.type === "sales-person" ? "salesPerson" : value.type]: {
                                            // Map "sales-person" to "salesPerson"
                                            value: value.value,
                                            label: value.label
                                        }
                                    }));
                                } else {
                                    // Reset all filters when cleared
                                    setFilters({
                                        salesPerson: null,
                                        category: null,
                                        product: null
                                    });
                                }
                            }}
                        />
                    </div>
                </div>
            </Card.Header>
            <Card.Body>
                {error && <p className="text-center mt-4 text-danger">Error: {error}</p>}
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '500px' }}>
                        <Spinner animation="border" role="status" className="me-2">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                        <span>Loading chart data...</span>
                    </div>
                ) : salesData.length ? (
                    <>
                        <div className="chart-container" style={{ height: '500px', width: '100%' }}>
                            <Bar data={salesAndCOGSChartData} options={salesAndCOGSChartOptions} />
                        </div>
                        <div className="mt-4">
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Metric</th>
                                        {labels.map((label, idx) => (
                                            <th key={idx}>{label}</th>
                                        ))}
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Sales</td>
                                        {salesData.map((data, index) => (
                                            <td key={index}>{formatCurrency(data.totalSales || 0)}</td>
                                        ))}
                                        <td>{formatCurrency(totalSales)}</td>
                                    </tr>
                                    {user?.role === 'admin' && (
                                        <>
                                            <tr>
                                                <td>COGS</td>
                                                {salesData.map((data, index) => (
                                                    <td key={index}>{formatCurrency(data.totalCogs || 0)}</td>
                                                ))}
                                                <td>{formatCurrency(totalCOGS)}</td>
                                            </tr>
                                            <tr>
                                                <td>Gross Margin %</td>
                                                {salesData.map((data, index) => (
                                                    <td key={index}>
                                                        {`${data.grossMarginPct?.toFixed(2) || '0.00'}%`}
                                                    </td>
                                                ))}
                                                <td>{`${averageGrossMargin.toFixed(2)}%`}</td>
                                            </tr>
                                        </>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                        {/* <div className="text-end">
                            <Button variant="outline-primary" onClick={exportToCSV}>
                                Export to CSV
                            </Button>
                        </div> */}
                    </>
                ) : (
                    <p className="text-center mt-4">No data available.</p>
                )}
            </Card.Body>
        </Card>
    );
};

export default EnhancedSalesCOGSChart;
