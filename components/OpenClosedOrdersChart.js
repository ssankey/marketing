// OrdersChart.js
import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import { Card, Spinner, Table } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import { useRouter } from "next/router";
import ChartDataLabels from "chartjs-plugin-datalabels";
import AllFilter from "components/AllFilters.js";
import LoadingSpinner from "../components/LoadingSpinner"; // if actually used

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

// Month mapping helper
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

// Format month-year labels
const formatMonthYear = (year, month) => {
  const monthIndex = monthMapping[month];
  if (monthIndex === undefined) return "Invalid Date";
  const date = new Date(year, monthIndex);
  return date.toLocaleDateString("default", { month: "short", year: "numeric" });
};

const OrdersChart = () => {
  // ----------------------------------
  // State
  // ----------------------------------
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters and search query
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    salesPerson: null,
    category: null,
    product: null,
  });

  // ----------------------------------
  // Refs and other hooks
  // ----------------------------------
  const chartRef = useRef(null);
  const router = useRouter();

  // ----------------------------------
  // Fetch data
  // ----------------------------------
  const fetchOrdersData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();

      if (filters.salesPerson?.value) {
        queryParams.append("slpCode", filters.salesPerson.value);
      }
      if (filters.category?.value) {
        queryParams.append("itmsGrpCod", filters.category.value);
      }
      if (filters.product?.value) {
        queryParams.append("itemCode", filters.product.value);
      }

      const response = await fetch(`/api/monthly-orders?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders data");
      }

      const { data } = await response.json();
      // Sort data chronologically
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.year, monthMapping[a.month]);
        const dateB = new Date(b.year, monthMapping[b.month]);
        return dateA - dateB;
      });

      setOrdersData(sortedData);
    } catch (err) {
      console.error("Error fetching orders data:", err);
      setError(err.message);
      setOrdersData([]);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch data whenever filters change
  useEffect(() => {
    fetchOrdersData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // ----------------------------------
  // Derived values
  // ----------------------------------
  const totalOpenOrders = ordersData.reduce(
    (sum, data) => sum + (data.openOrders || 0),
    0
  );
  const totalOpenSales = ordersData.reduce(
    (sum, data) => sum + (data.openSales || 0),
    0
  );

  // Chart labels: monthly + "Total"
  const labels = [
    ...ordersData.map((d) => formatMonthYear(d.year, d.month)),
    "Total",
  ];

  // ----------------------------------
  // Chart config
  // ----------------------------------
  const colorPalette = {
    primary: "#0d6efd",
    total: "#8A2BE2", // 
  };

  const ordersChartData = {
    labels,
    datasets: [
      {
        label: "Open Orders",
        data: [
          ...ordersData.map((d) => d.openOrders || 0),
          totalOpenOrders,
        ],
        backgroundColor: [
          ...ordersData.map(() => colorPalette.primary),
          colorPalette.total,
        ],
        borderColor: [
          ...ordersData.map(() => colorPalette.primary),
          colorPalette.total,
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
          // For the last bar (Total), always show the sales value
          if (context.dataIndex === labels.length - 1) {
            return true;
          }
          // For monthly bars, show label only if openSales > 0
          const monthlySales = ordersData[context.dataIndex]?.openSales || 0;
          return monthlySales > 0;
        },
        formatter: (_, context) => {
          // If it's the Total bar
          if (context.dataIndex === labels.length - 1) {
            return formatCurrency(totalOpenSales);
          }
          // Else monthly bar
          const salesValue = ordersData[context.dataIndex]?.openSales || 0;
          return formatCurrency(salesValue);
        },
        anchor: "end",
        align: "end",
        offset: 4,
        color: "#212529",
        font: { weight: "bold", size: 12 },
      },
      tooltip: {
        backgroundColor: "#212529",
        callbacks: {
          label: (context) => {
            const datasetLabel = context.dataset.label; // e.g., "Open Orders"
            const value = context.raw; // raw bar value
            const dataIndex = context.dataIndex;

            // For the Total bar
            if (dataIndex === labels.length - 1) {
              return `${datasetLabel} Total: ${value} (Sales: ${formatCurrency(
                totalOpenSales
              )})`;
            }

            // For individual month bars
            const dataPoint = ordersData[dataIndex];
            return `${datasetLabel}: ${value} (Sales: ${formatCurrency(
              dataPoint.openSales
            )})`;
          },
        },
      },
      legend: {
        position: "top",
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
      if (
        elements.length > 0 &&
        elements[0].datasetIndex === 0 &&
        elements[0].index !== labels.length - 1
      ) {
        const dataIndex = elements[0].index;
        const { year, month } = ordersData[dataIndex];
        const status = "open";

        // Convert month name to numeric index
        const monthIndex =
          new Date(Date.parse(`${month} 1, ${year}`)).getMonth() + 1;
        const fromDate = `${year}-${String(monthIndex).padStart(2, "0")}-01`;
        const toDate = new Date(year, monthIndex, 0).toISOString().split("T")[0];

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

  // ----------------------------------
  // CSV Export
  // ----------------------------------
  const exportToCSV = () => {
    if (!ordersData.length) return;
    const csvData = [
      ["Month", ...labels],
      [
        "Open Orders",
        ...ordersData.map((data) => data.openOrders || 0),
        totalOpenOrders,
      ],
      [
        "Open Orders (Sales)",
        ...ordersData.map((data) => formatCurrency(data.openSales || 0)),
        formatCurrency(totalOpenSales),
      ],
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "orders_data.csv");
    link.click();
  };

  // ----------------------------------
  // Render
  // ----------------------------------
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
          <div className="ms-auto">
            <AllFilter
              searchQuery={searchQuery}
              setSearchQuery={(value) => {
                if (value) {
                  setFilters((prev) => ({
                    ...prev,
                    [value.type === "sales-person" ? "salesPerson" : value.type]:
                      {
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
        {/* Show error if any */}
        {error && <p className="text-danger mb-3">Error: {error}</p>}

        {/* Show loading spinner */}
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
              <Bar ref={chartRef} data={ordersChartData} options={ordersChartOptions} />
            </div>
            {/* Example button for CSV export, if desired */}
            {/* <Button variant="outline-primary" className="mt-3" onClick={exportToCSV}>
              Export CSV
            </Button> */}
          </>
        ) : (
          <p className="text-center mt-4">No data available.</p>
        )}
      </Card.Body>
    </Card>
  );
};

export default OrdersChart;
