// src/components/EnhancedSalesCOGSChart.js
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, Table, Button, Spinner } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement, LineController } from 'chart.js';
import { formatCurrency } from 'utils/formatCurrency';
import SearchBar from './SearchBar';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, LineController);

const EnhancedSalesCOGSChart = () => {
    const [salesData, setSalesData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [filters, setFilters] = useState({
        customerId: null,
        productId: null,
        salesPersonId: null,
        categoryId: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSalesData = async () => {
        const queryParams = new URLSearchParams();
        if (filters.customerId) queryParams.append('customerId', filters.customerId);
        if (filters.productId) queryParams.append('productId', filters.productId);
        if (filters.salesPersonId) queryParams.append('salesPersonId', filters.salesPersonId);
        if (filters.categoryId) queryParams.append('categoryId', filters.categoryId);

        try {
            setLoading(true);
            const response = await fetch(`/api/sales-cogs?${queryParams.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch sales data');
            const data = await response.json();
            setSalesData(data.length ? data : []);
        } catch (error) {
            setError(error.message);
            console.error('Error fetching sales data:', error);
            setSalesData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await fetch(`/api/search?query=${query}`);
            if (!response.ok) throw new Error('Failed to fetch search results');
            const results = await response.json();
            setSearchResults(results);
        } catch (error) {
            console.error('Error fetching search results:', error);
        }
    };

    const handleSelectResult = (result) => {
        setSearchQuery(result.name);
        setSearchResults([]);

        if (result.type === 'Customer') {
            setFilters((prev) => ({ ...prev, customerId: result.id }));
        } else if (result.type === 'Product') {
            setFilters((prev) => ({ ...prev, productId: result.id }));
        } else if (result.type === 'Employee') {
            setFilters((prev) => ({ ...prev, salesPersonId: result.id }));
        } else if (result.type === 'Category') {
            setFilters((prev) => ({ ...prev, categoryId: result.id }));
        }
    };

    const clearFilters = () => {
        setFilters({
            customerId: null,
            productId: null,
            salesPersonId: null,
            categoryId: null
        });
        setSearchQuery('');
    };

    useEffect(() => {
        fetchSalesData();
    }, [filters]);

    const salesAndCOGSChartData = {
        labels: salesData.map((data) => data.month),
        datasets: [
            {
                label: 'Sales',
                data: salesData.map((data) => data.sales || 0),
                backgroundColor: '#0d6efd',
                borderWidth: 1,
            },
            {
                label: 'COGS',
                data: salesData.map((data) => data.cogs || 0),
                backgroundColor: '#ffc107',
                borderWidth: 1,
            },
            {
                label: 'Gross Margin %',
                data: salesData.map((data) =>
                    data.sales ? (data.grossMargin / data.sales) * 100 : 0
                ),
                type: 'line',
                borderColor: '#198754',
                backgroundColor: '#198754',
                borderWidth: 2,
                fill: false,
                yAxisID: 'y1',
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    const salesAndCOGSChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
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
                titleFont: { size: 14, weight: "bold" },
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
        const csvData = [
            ['Metric', ...salesData.map((data) => data.month)],
            ['Sales', ...salesData.map((data) => data.sales || 0)],
            ['COGS', ...salesData.map((data) => data.cogs || 0)],
            ['Gross Margin %', ...salesData.map((data) => (data.sales ? ((data.grossMargin / data.sales) * 100).toFixed(2) : '-'))],
        ];

        const csvContent = csvData.map((row) => row.join(',')).join('\n');
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
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                    <h4 className="mb-3 mb-md-0" style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}>Sales, COGS, and Gross Margin %</h4>
                    <div className="d-flex flex-column flex-md-row gap-2 align-items-md-center  mt-3 mt-md-0">
                        {/* <SearchBar
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            searchResults={searchResults}
                            handleSelectResult={handleSelectResult}
                            placeholder="Search customer or products or category"
                            onSearch={handleSearch}
                        /> */}
                        <div className="d-flex gap-2">
                            <Button
                                variant="outline-secondary"
                                onClick={clearFilters}
                                style={{ whiteSpace: 'nowrap' }}
                            >
                                Clear Filters
                            </Button>
                            <Button
                                variant="outline-primary"
                                onClick={exportToCSV}
                                disabled={!salesData.length}
                                style={{ whiteSpace: 'nowrap' }}
                            >
                                Export CSV
                            </Button>

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
