// src/components/EnhancedSalesCOGSChart.js
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, Table, Button, Spinner, Dropdown } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement, LineController } from 'chart.js';
import { formatCurrency } from 'utils/formatCurrency';
import SearchBar from './SearchBar';
import { useAuth } from '../contexts/AuthContext';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, LineController);

const EnhancedSalesCOGSChart = () => {
    const [salesData, setSalesData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [availableYears, setAvailableYears] = useState([]);
    const { user, contactCodes } = useAuth(); // Get both user and contactCodes
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [filters, setFilters] = useState({
        customerId: null,
        productId: null,
        salesPersonId: null,
        categoryId: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSalesData = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            const response = await fetch(`/api/sales-cogs?year=${selectedYear}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const { data, availableYears } = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch data');
            }

            setSalesData(data);
            setAvailableYears(availableYears);
        } catch (error) {
            console.error('Error fetching sales data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token) {
            fetchSalesData();
        }
    }, [user, selectedYear]);

    const salesAndCOGSChartData = {
        labels: salesData.map((data) => data.month),
        datasets: [
            {
                label: 'Sales',
                data: salesData.map((data) => data.sales || 0),
                backgroundColor: '#124f94', // Primary color
                borderWidth: 1,
            },
            {
                label: 'COGS',
                data: salesData.map((data) => data.cogs || 0),
                backgroundColor: '#3bac4e', // Secondary color
                borderWidth: 1,
            },
            // Conditionally add the Gross Margin % dataset if the user is an admin
            ...(user?.role === 'admin'
                ? [
                      {
                          label: 'Gross Margin %',
                          data: salesData.map((data) =>
                              data.sales ? (data.grossMargin / data.sales) * 100 : 0
                          ),
                          type: 'line',
                          borderColor: '#3bac4e', // Secondary color for line
                          backgroundColor: '#3bac4e', // Same as line color
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
                display: false, // Disable datalabels for this chart
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        if (context.dataset.label === "Gross Margin %") {
                            return `${context.raw.toFixed(2)}%`;
                        }
                        return formatCurrency(context.raw);
                    },
                },
                backgroundColor: "#212529",
                titleFont: { size: 14, weight: "bold" },
                bodyFont: { size: 13 },
                padding: 12,
            },
            legend: {
                position: "top",
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
                    color: "rgba(0, 0, 0, 0.05)",
                },
            },
            y1: {
                position: "right",
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
        const csvData = [
            ['Metric', ...salesData.map((data) => data.month)],
            ['Sales', ...salesData.map((data) => data.sales || 0)],
            ['COGS', ...salesData.map((data) => data.cogs || 0)],
            // Conditionally include Gross Margin % row for admin users
            ...(user?.role === 'admin'
                ? [
                      [
                          'Gross Margin %',
                          ...salesData.map((data) =>
                              data.sales ? ((data.grossMargin / data.sales) * 100).toFixed(2) : '-'
                          ),
                      ],
                  ]
                : []),
        ];

        const csvContent = csvData.map((row) => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'sales_cogs_data.csv');
        link.click();
    };

    const YearSelector = () => (
        <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" id="year-dropdown">
                {selectedYear}
            </Dropdown.Toggle>
            <Dropdown.Menu>
                {availableYears.map(year => (
                    <Dropdown.Item
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        active={year === selectedYear}
                    >
                        {year}
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );

    return (
        <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white py-3">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                    <h4 className="mb-3 mb-md-0" style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}>
                        Sales
                    </h4>
                    <div className="d-flex flex-column flex-md-row gap-2 align-items-md-center mt-3 mt-md-0">
                        <div className="d-flex gap-2">
                            <YearSelector />
                        </div>
                    </div>
                </div>
            </Card.Header>
            <Card.Body>
                {error && (
                    <p className="text-center mt-4 text-danger">Error: {error}</p>
                )}
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
                                        {salesData.map((data) => (
                                            <th key={data.month}>{data.month}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Sales</td>
                                        {salesData.map((data, index) => (
                                            <td key={index}>{formatCurrency(data.sales || 0)}</td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td>COGS</td>
                                        {salesData.map((data, index) => (
                                            <td key={index}>{formatCurrency(data.cogs || 0)}</td>
                                        ))}
                                    </tr>
                                    {/* Conditionally render Gross Margin % row for admin users */}
                                    {user?.role === 'admin' && (
                                        <tr>
                                            <td>Gross Margin %</td>
                                            {salesData.map((data, index) => (
                                                <td key={index}>
                                                    {data.sales
                                                        ? `${((data.grossMargin / data.sales) * 100).toFixed(2)}%`
                                                        : '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </>
                ) : (
                    <p className="text-center mt-4">No data available for the selected filters.</p>
                )}
            </Card.Body>
        </Card>
    );
};

export default EnhancedSalesCOGSChart;