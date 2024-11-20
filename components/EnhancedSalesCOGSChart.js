import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, Table } from 'react-bootstrap';
import { formatCurrency } from 'utils/formatCurrency';

const EnhancedSalesCOGSChart = ({ salesData }) => {
    const colorPalette = {
        primary: '#0d6efd',
        warning: '#ffc107',
        gmLine: '#198754', // Green for GM%
    };

    // Define months of the current year
    const months = [
        // 'Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 'May 2024', 'Jun 2024',
         'Aug 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024'
    ];

    // Create data for chart
    const salesAndCOGSChartData = {
        labels: salesData.map((data) => data.month),
        datasets: [
            {
                label: 'Sales',
                data: salesData.map((data) => data.sales || 0),
                backgroundColor: colorPalette.primary,
                borderColor: colorPalette.primary,
                borderWidth: 1,
                barPercentage: 0.6,
                categoryPercentage: 1.0,
                order: 1,
            },
            {
                label: 'COGS',
                data: salesData.map((data) => data.cogs || 0),
                backgroundColor: colorPalette.warning,
                borderColor: colorPalette.warning,
                borderWidth: 1,
                barPercentage: 0.6,
                categoryPercentage: 1.0,
                order: 1,
            },
            {
                label: 'Gross Margin %',
                data: salesData.map((data) =>
                    data.sales && data.cogs ? ((data.sales - data.cogs) / data.sales) * 100 : 0
                ),
                type: 'line',
                borderColor: colorPalette.gmLine,
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                yAxisID: 'y1',
                pointRadius: 4,
                pointHoverRadius: 6,
                order: 2,
            },
        ],
    };

    const salesAndCOGSChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
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
            tooltip: {
                backgroundColor: '#212529',
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 13 },
                padding: 12,
                callbacks: {
                    label: (tooltipItem) =>
                        tooltipItem.dataset.label === 'Gross Margin %'
                            ? `GM%: ${tooltipItem.raw.toFixed(2)}%`
                            : `${tooltipItem.dataset.label}: ${formatCurrency(tooltipItem.raw)}`,
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    callback: (value, index) => salesAndCOGSChartData.labels[index] || '',
                    font: { family: "'Inter', sans-serif", size: 12 },
                },
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0, 0, 0, 0.05)' },
                ticks: {
                    callback: (value) => formatCurrency(value),
                    font: { family: "'Inter', sans-serif", size: 12 },
                },
            },
            y1: {
                position: 'right',
                beginAtZero: true,
                ticks: {
                    callback: (value) => `${value}%`,
                    font: { family: "'Inter', sans-serif", size: 12 },
                },
                grid: { drawOnChartArea: false },
            },
        },
    };

    // Prepare data for the horizontal table
    const salesRow = months.map((month) => {
        const data = salesData.find((item) => item.month === month);
        return data ? formatCurrency(data.sales) : '-';
    });

    const cogsRow = months.map((month) => {
        const data = salesData.find((item) => item.month === month);
        return data ? formatCurrency(data.cogs) : '-';
    });

    const grossMarginRow = months.map((month) => {
        const data = salesData.find((item) => item.month === month);
        return data ? `${((data.sales - data.cogs) / data.sales * 100).toFixed(2)}%` : '-';
    });

    return (
        <Card className="shadow-sm border-0">
            <Card.Header className="bg-white py-3">
                <h4
                    className="mb-0"
                    style={{
                        fontWeight: 600,
                        color: '#212529',
                        fontSize: '1.25rem',
                    }}
                >
                    Sales, COGS, and Gross Margin %
                </h4>
            </Card.Header>
            <Card.Body style={{ padding: '20px', backgroundColor: '#f9f9f9', overflow: 'hidden' }}>
                <div style={{ height: '450px', padding: '10px' }}>
                    <Bar data={salesAndCOGSChartData} options={salesAndCOGSChartOptions} />
                </div>

                {/* Horizontal Table for monthly data */}
                <div className="mt-4">
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Metric</th>
                                {months.map((month, index) => (
                                    <th key={index}>{month}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Sales</td>
                                {salesRow.map((value, index) => (
                                    <td key={index}>{value}</td>
                                ))}
                            </tr>
                            <tr>
                                <td>COGS</td>
                                {cogsRow.map((value, index) => (
                                    <td key={index}>{value}</td>
                                ))}
                            </tr>
                            <tr>
                                <td>Gross Margin %</td>
                                {grossMarginRow.map((value, index) => (
                                    <td key={index}>{value}</td>
                                ))}
                            </tr>
                        </tbody>
                    </Table>
                </div>
            </Card.Body>
        </Card>
    );
};

export default EnhancedSalesCOGSChart;
