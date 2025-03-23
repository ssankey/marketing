import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Card, Table, Spinner } from "react-bootstrap";
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
  LineController,
} from "chart.js";
import { formatCurrency } from "utils/formatCurrency";

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

const EnhancedSalesCOGSChart = ({ cardCode }) => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/dashboard/customer/sales-cogs?cardCode=${cardCode}`
      );
      const { data } = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch data");
      }

      // Define month order for sorting
      const monthOrder = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];

      // Sort data in ascending order: first by year then by month.
      const sortedData = data.sort((a, b) => {
        // Assume a.month is the month abbreviation and a.year holds the year.
        if (a.year !== b.year) {
          return parseInt(a.year) - parseInt(b.year);
        }
        return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
      });

      setSalesData(sortedData);
    } catch (error) {
      console.error("Error fetching sales data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cardCode) fetchSalesData();
  }, [cardCode]);

  // Construct labels by combining month and year (e.g., "Jan 2024").
  const labels = salesData.map((data) => `${data.month} ${data.year}`);

  // Calculate totals for each metric.
  const totalSales = salesData.reduce(
    (acc, data) => acc + (data.sales || 0),
    0
  );
  const totalCOGS = salesData.reduce(
    (acc, data) => acc + (data.cogs || 0),
    0
  );
  const totalGrossMargin = salesData.reduce(
    (acc, data) => acc + (data.grossMargin || 0),
    0
  );
  const overallGrossMarginPct =
    totalSales > 0 ? (totalGrossMargin / totalSales) * 100 : 0;

  const salesAndCOGSChartData = {
    labels,
    datasets: [
      {
        label: "Sales",
        data: salesData.map((data) => data.sales || 0),
        backgroundColor: "#124f94",
        borderWidth: 1,
      },
      {
        label: "COGS",
        data: salesData.map((data) => data.cogs || 0),
        backgroundColor: "#3bac4e",
        borderWidth: 1,
      },
      {
        label: "Gross Margin %",
        data: salesData.map((data) =>
          data.sales ? (data.grossMargin / data.sales) * 100 : 0
        ),
        type: "line",
        borderColor: "#3bac4e",
        borderWidth: 2,
        fill: false,
        yAxisID: "y1",
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

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-white py-3">
        <h4
          className="mb-0"
          style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}
        >
          Sales, COGS, and Gross Margin %
        </h4>
      </Card.Header>
      <Card.Body>
        {error && (
          <p className="text-center mt-4 text-danger">Error: {error}</p>
        )}
        {loading ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: "500px" }}
          >
            <Spinner animation="border" role="status" className="me-2">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <span>Loading chart data...</span>
          </div>
        ) : salesData.length ? (
          <>
            <div
              className="chart-container"
              style={{ height: "500px", width: "100%" }}
            >
              <Bar
                data={salesAndCOGSChartData}
                options={salesAndCOGSChartOptions}
              />
            </div>
            <div className="mt-4">
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Metric</th>
                    {salesData.map((data) => (
                      <th key={`${data.month}-${data.year}`}>
                        {`${data.month} ${data.year}`}
                      </th>
                    ))}
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Sales</td>
                    {salesData.map((data, index) => (
                      <td key={index}>{formatCurrency(data.sales || 0)}</td>
                    ))}
                    <td>{formatCurrency(totalSales)}</td>
                  </tr>
                  <tr>
                    <td>COGS</td>
                    {salesData.map((data, index) => (
                      <td key={index}>{formatCurrency(data.cogs || 0)}</td>
                    ))}
                    <td>{formatCurrency(totalCOGS)}</td>
                  </tr>
                  <tr>
                    <td>Gross Margin %</td>
                    {salesData.map((data, index) => (
                      <td key={index}>
                        {data.sales
                          ? `${((data.grossMargin / data.sales) * 100).toFixed(
                              2
                            )}%`
                          : "-"}
                      </td>
                    ))}
                    <td>
                      {totalSales
                        ? `${overallGrossMarginPct.toFixed(2)}%`
                        : "-"}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </div>
          </>
        ) : (
          <p className="text-center mt-4">
            No data available for the selected filters.
          </p>
        )}
      </Card.Body>
    </Card>
  );
};

export default EnhancedSalesCOGSChart;
