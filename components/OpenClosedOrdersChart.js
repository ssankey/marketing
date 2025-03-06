// components/OpenClosedOrdersChart.js
import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import { Card, Button, Spinner, Dropdown, Table } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import { useRouter } from "next/router";
import ChartDataLabels from "chartjs-plugin-datalabels";
import LoadingSpinner from "../components/LoadingSpinner";
import AllFilter from "components/AllFilters.js";

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

  // Added state for filters and search query similar to EnhancedSalesCOGSChart.
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    salesPerson: null,
    category: null,
    product: null
  });

  const colorPalette = {
    primary: "#0d6efd",
    orderLine: "#198754",
    total: "#dc3545" // Red color for total bar
  };

  const chartRef = useRef(null);
  const router = useRouter();

  const fetchOrdersData = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      // Append filters to the query parameters if available.
      if (filters.salesPerson?.value) {
        queryParams.append('slpCode', filters.salesPerson.value);
      }
      if (filters.category?.value) {
        queryParams.append('itmsGrpCod', filters.category.value);
      }
      if (filters.product?.value) {
        queryParams.append('itemCode', filters.product.value);
      }
      const token = localStorage.getItem("token");
      // Remove the year query to fetch data for all years.
      const response = await fetch(`/api/monthly-orders?${queryParams}`, {
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
    // Fetch orders data again whenever filters change.
  }, [filters]);

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
            const datasetLabel = context.dataset.label;
            const value = context.raw;

            // For the total bar
            if (context.dataIndex === labels.length - 1) {
              return `${datasetLabel} Total: ${value} (Sales: ${formatCurrency(totalOpenSales)})`;
            }

            // For individual month bars
            const dataPoint = ordersData[context.dataIndex];
            return `${datasetLabel}: ${value} (Sales: ${formatCurrency(
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
      if (elements.length > 0 && elements[0].datasetIndex === 0 && elements[0].index !== labels.length - 1) {
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

  const exportToCSV = () => {
    if (!ordersData.length) return;
    const csvData = [
      ["Month", ...labels],
      ["Open Orders", ...ordersData.map((data) => data.openOrders || 0), totalOpenOrders],
      ["Open Orders (Sales)", ...ordersData.map((data) => formatCurrency(data.openSales || 0)), formatCurrency(totalOpenSales)],
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
              Monthly Open Orders
            </h4>
            <div className="ms-auto">
              <AllFilter
                searchQuery={searchQuery}
                setSearchQuery={(value) => {
                  if (value) {
                    setFilters((prev) => ({
                      ...prev,
                      [value.type === "sales-person" ? "salesPerson" : value.type]: {
                        value: value.value,
                        label: value.label,
                      },
                    }));
                  } else {
                    // Reset all filters when cleared
                    setFilters({
                      salesPerson: null,
                      category: null,
                      product: null,
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