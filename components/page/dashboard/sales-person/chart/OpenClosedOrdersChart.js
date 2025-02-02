import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import { Card, Spinner, Dropdown, Table } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const OrdersChart = ({ slpCode }) => {
  const [ordersData, setOrdersData] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  const colorPalette = {
    primary: "#0d6efd",
    orderLine: "#198754",
  };

  const fetchOrdersData = async () => {
    try {
      console.log("orders-chart",slpCode);
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/dashboard/sales-person/monthly-orders?year=${selectedYear}&SlpCode=${slpCode}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch orders data");
      }

      const { data, availableYears } = await response.json();
      setOrdersData(data);
      setAvailableYears(availableYears);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching orders data:", err);
      setOrdersData([]);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
    if (slpCode) {
      fetchOrdersData();
    }
  }, [slpCode, selectedYear]);

  const ordersChartData = {
    labels: ordersData.map((data) => data.month),
    datasets: [
      {
        label: "Open Orders",
        data: ordersData.map((data) => data.openOrders || 0),
        backgroundColor: colorPalette.primary,
        borderColor: colorPalette.primary,
        borderWidth: 1,
        barPercentage: 1,
        categoryPercentage: 0.7,
      },
      {
        label: "Closed Orders",
        data: ordersData.map((data) => data.closedOrders || 0),
        backgroundColor: colorPalette.orderLine,
        borderColor: colorPalette.orderLine,
        borderWidth: 1,
        barPercentage: 1,
        categoryPercentage: 0.7,
      },
    ],
  };

  const ordersChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        display: (context) => {
          const value =
            context.dataset.label === "Open Orders"
              ? ordersData[context.dataIndex]?.openSales
              : ordersData[context.dataIndex]?.closedSales;
          return value > 0;
        },
        formatter: (_, context) => {
          const salesValue =
            context.dataset.label === "Open Orders"
              ? ordersData[context.dataIndex]?.openSales
              : ordersData[context.dataIndex]?.closedSales;
          return formatCurrency(salesValue);
        },
        anchor: "end",
        align: "end",
        offset: 4,
        color: "#212529",
        font: {
          weight: "bold",
          size: 12,
        },
      },
      legend: {
        position: "top",
        labels: {
          font: { family: "'Inter', sans-serif", size: 13 },
          padding: 20,
        },
      },
      datalabels: {
      display: false, // Disable datalabels for this chart
    },
      
      tooltip: {
        backgroundColor: "#212529",
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 13 },
        padding: 12,
        callbacks: {
          label: function (context) {
            const datasetLabel = context.dataset.label;
            const value = context.raw;
            const dataPoint = ordersData[context.dataIndex];

            if (datasetLabel === "Open Orders") {
              return `${datasetLabel}: ${value} (Sales: ${formatCurrency(
                dataPoint.openSales
              )})`;
            } else {
              return `${datasetLabel}: ${value} (Sales: ${formatCurrency(
                dataPoint.closedSales
              )})`;
            }
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 12 },
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 12 },
        },
      },
    },
  };

  const YearSelector = () => (
    <Dropdown>
      <Dropdown.Toggle variant="outline-secondary" id="year-dropdown">
        {selectedYear}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {availableYears.map((year) => (
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
          <h4
            className="mb-3 mb-md-0"
            style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}
          >
            Monthly Open vs Closed Orders
          </h4>
          <YearSelector />
        </div>
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
        ) : ordersData.length ? (
          <>
            <div
              className="chart-container"
              style={{ height: "500px", width: "100%" }}
            >
              <Bar
                ref={chartRef}
                data={ordersChartData}
                options={ordersChartOptions}
              />
            </div>
            <div className="mt-4">
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Metric</th>
                    {ordersData.map((data) => (
                      <th key={data.month}>{data.month}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Open Orders</td>
                    {ordersData.map((data, index) => (
                      <td key={index}>{data.openOrders || 0}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Closed Orders</td>
                    {ordersData.map((data, index) => (
                      <td key={index}>{data.closedOrders || 0}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Open Orders Sales</td>
                    {ordersData.map((data, index) => (
                      <td key={index}>{formatCurrency(data.openSales || 0)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Closed Orders Sales</td>
                    {ordersData.map((data, index) => (
                      <td key={index}>
                        {formatCurrency(data.closedSales || 0)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </Table>
            </div>
          </>
        ) : (
          <p className="text-center mt-4">
            No data available for the selected year.
          </p>
        )}
      </Card.Body>
    </Card>
  );
};

export default OrdersChart;
