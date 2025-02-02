// components/OpenClosedOrdersChart.js
import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import { Card, Button, Spinner, Dropdown, Table } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import { useRouter } from "next/router";
import ChartDataLabels from "chartjs-plugin-datalabels";
import LoadingSpinner from "../components/LoadingSpinner";

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

// Mapping full month names to their corresponding 0-indexed month numbers.
const monthMapping = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};

// Helper function to format month-year labels
const formatMonthYear = (year, month) => {
  const monthIndex = monthMapping[month];
  if (monthIndex === undefined) {
    return "Invalid Date";
  }
  const date = new Date(year, monthIndex);
  return date.toLocaleDateString("default", { month: "short", year: "numeric" });
};

const OrdersChart = () => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const colorPalette = {
    primary: "#0d6efd",
    orderLine: "#198754",
  };

  const chartRef = useRef(null);
  const router = useRouter();

  const fetchOrdersData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      // Remove the year query to fetch data for all years.
      const response = await fetch(`/api/monthly-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders data");
      }

      const { data } = await response.json();

      // Sort the data chronologically using year and month.
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.year, monthMapping[a.month]);
        const dateB = new Date(b.year, monthMapping[b.month]);
        return dateA - dateB;
      });

      setOrdersData(sortedData);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching orders data:", err);
      setOrdersData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersData();
  }, []);

  // Create labels in month-year format.
  const labels = ordersData.map((data) => formatMonthYear(data.year, data.month));

  const ordersChartData = {
    labels,
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
      tooltip: {
        backgroundColor: "#212529",
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 13 },
        padding: 12,
        callbacks: {
          label: (context) => {
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
    hover: {
      onHover: (event, elements) => {
        if (elements.length > 0) {
          event.native.target.style.cursor = "pointer";
        } else {
          event.native.target.style.cursor = "default";
        }
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const chart = chartRef.current;
        if (!chart) return;

        const datasetIndex = elements[0].datasetIndex;
        const dataIndex = elements[0].index;

        // Use the record's year and month.
        const { year, month } = ordersData[dataIndex];
        const status = datasetIndex === 0 ? "open" : "closed"; // 0: Open Orders, 1: Closed Orders

        // Convert month name to numeric value using Date.parse.
        // Alternatively, you can use the mapping: monthMapping[month] + 1
        const monthIndex = new Date(Date.parse(`${month} 1, ${year}`)).getMonth() + 1;
        const fromDate = `${year}-${String(monthIndex).padStart(2, "0")}-01`;
        // Create a date for the last day of the month by using 0 as the day of the next month.
        const toDate = new Date(year, monthIndex, 0).toISOString().split("T")[0];

        // Navigate using router.push
        router.push({
          pathname: "/orders",
          query: {
            status,
            page: 1,
            fromDate,
            toDate,
          },
        });
      }
    },
  };

  const exportToCSV = () => {
    if (!ordersData.length) return;
    const csvData = [
      ["Month", ...labels],
      ["Open Orders", ...ordersData.map((data) => data.openOrders || 0)],
      ["Closed Orders", ...ordersData.map((data) => data.closedOrders || 0)],
      ["Open Orders (Sales)", ...ordersData.map((data) => formatCurrency(data.openSales || 0))],
      ["Closed Orders (Sales)", ...ordersData.map((data) => formatCurrency(data.closedSales || 0))],
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "orders_data.csv");
    link.click();
  };

  return (
    <>
      {isNavigating && <LoadingSpinner />}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="bg-white py-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
            <h4
              className="mb-3 mb-md-0"
              style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}
            >
              Monthly Open vs Closed Orders
            </h4>
            <div className="d-flex flex-column flex-md-row gap-2 align-items-md-center mt-3 mt-md-0">
              <div className="d-flex gap-2">
                {/* The YearSelector has been removed since we are showing data for all years */}
                {/* <YearSelector /> */}
                {/* Uncomment the button below if you want CSV export functionality */}
                {/* <Button
                  variant="outline-primary"
                  onClick={exportToCSV}
                  disabled={!ordersData.length}
                  style={{ whiteSpace: "nowrap" }}
                >
                  Export CSV
                </Button> */}
              </div>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {error && <p className="text-center mt-4 text-danger">Error: {error}</p>}
          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "500px" }}>
              <Spinner animation="border" role="status" className="me-2">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <span>Loading chart data...</span>
            </div>
          ) : ordersData.length ? (
            <>
              <div className="chart-container" style={{ height: "500px", width: "100%" }}>
                <Bar ref={chartRef} data={ordersChartData} options={ordersChartOptions} />
              </div>

              <div className="mt-4">
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Open Orders</th>
                      <th>Open Orders Sales</th>
                      <th>Closed Orders</th>
                      <th>Closed Orders Sales</th>
                      <th>Total Orders</th>
                      <th>Total Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersData.map((data) => {
                      const totalOrders = (data.openOrders || 0) + (data.closedOrders || 0);
                      const totalSales = (data.openSales || 0) + (data.closedSales || 0);
                      return (
                        <tr key={`${data.year}-${data.month}`}>
                          <td>{formatMonthYear(data.year, data.month)}</td>
                          <td>{data.openOrders || 0}</td>
                          <td>{formatCurrency(data.openSales || 0)}</td>
                          <td>{data.closedOrders || 0}</td>
                          <td>{formatCurrency(data.closedSales || 0)}</td>
                          <td>{totalOrders}</td>
                          <td>{formatCurrency(totalSales)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>

            </>
          ) : (
            <p className="text-center mt-4">No data available.</p>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default OrdersChart;
