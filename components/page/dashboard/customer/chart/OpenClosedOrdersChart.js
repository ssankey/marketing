import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import { Card, Spinner } from "react-bootstrap";
import { useRouter } from "next/router";
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

const formatMonthYear = (year, month) => {
  const monthIndex = monthMapping[month];
  if (monthIndex === undefined) {
    return "Invalid Date";
  }
  const date = new Date(year, monthIndex);
  return date.toLocaleDateString("default", { month: "short", year: "numeric" });
};

const OrdersChart = ({ cardCode }) => {
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const chartRef = useRef(null);

  const colorPalette = {
    primary: "#0d6efd",
    total: "#8A2BE2" // Red color for total bar
  };

  const fetchOrdersData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/dashboard/customer/monthly-orders?cardCode=${cardCode}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch orders data");
      }

      const { data } = await response.json();
      
      // Sort the data chronologically
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
    if (cardCode) fetchOrdersData();
  }, [cardCode]);

  // Calculate total open orders and sales
  const totalOpenOrders = ordersData.reduce((sum, data) => sum + (data.openOrders || 0), 0);
  const totalOpenSales = ordersData.reduce((sum, data) => sum + (data.openSales || 0), 0);

  // Create labels in month-year format, with an additional "Total" label
  const labels = [
    ...ordersData.map((data) => formatMonthYear(data.year, data.month)),
    "Total"
  ];

  const ordersChartData = {
    labels,
    datasets: [
      {
        label: "Open Orders",
        data: [
          ...ordersData.map((data) => data.openOrders || 0),
          totalOpenOrders
        ],
        backgroundColor: [
          ...ordersData.map(() => colorPalette.primary),
          colorPalette.total
        ],
        borderColor: [
          ...ordersData.map(() => colorPalette.primary),
          colorPalette.total
        ],
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
          // For the last bar (total), always show the sales value
          if (context.dataIndex === labels.length - 1) {
            return true;
          }
          
          const value = ordersData[context.dataIndex]?.openSales;
          return value > 0;
        },
        formatter: (_, context) => {
          // For the last bar (total), show total sales
          if (context.dataIndex === labels.length - 1) {
            return formatCurrency(totalOpenSales);
          }
          
          const salesValue = ordersData[context.dataIndex]?.openSales;
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
            // For the total bar
            if (context.dataIndex === labels.length - 1) {
              return `Total Open Orders: ${totalOpenOrders} (Sales: ${formatCurrency(totalOpenSales)})`;
            }

            // For individual month bars
            const dataPoint = ordersData[context.dataIndex];
            return `Open Orders: ${context.raw} (Sales: ${formatCurrency(
              dataPoint.openSales
            )})`;
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
      if (elements.length > 0 && elements[0].index !== labels.length - 1) {
        const chart = chartRef.current;
        if (!chart) return;

        const dataIndex = elements[0].index;

        // Use the record's year and month.
        const { year, month } = ordersData[dataIndex];
        const status = "open";

        // Convert month name to numeric value using Date.parse.
        const monthIndex = new Date(Date.parse(`${month} 1, ${year}`)).getMonth() + 1;
        const fromDate = `${year}-${String(monthIndex).padStart(2, "0")}-01`;
        // Create a date for the last day of the month.
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

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-white py-3">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <h4
            className="mb-3 mb-md-0"
            style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}
          >
            Monthly Open Orders
          </h4>
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
        ) : (
          <p className="text-center mt-4">
            No data available.
          </p>
        )}
      </Card.Body>
    </Card>
  );
};

export default OrdersChart;