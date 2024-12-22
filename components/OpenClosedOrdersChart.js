


import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Card, Button, Spinner } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import { useRouter } from "next/router";
import { useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import SearchBar from "./SearchBar";
import useDebounce from "../hooks/useDebounce";
import {  getElementsAtEvent } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const OrdersChart = () => {
  const [ordersData, setOrdersData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [filters, setFilters] = useState({
    customer: null,
    region: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms debounce

  const colorPalette = {
    primary: "#0d6efd",
    orderLine: "#198754",
  };
  const chartRef = useRef(null);
  const router = useRouter();

  const handleBarClick = (event) => {
    // Get clicked elements from the chart instance
    // const elements = getElementsAtEvent(chartRef.current, event);
    const elements = chartRef.current.getElementsAtEventForMode(
      event,
      "nearest",
      { intersect: true },
      true
    );

    if (!elements || elements.length === 0) return; // No element clicked, exit

    const { datasetIndex, index } = elements[0]; // Get the clicked bar's dataset and index
    // Get the clicked dataset
    const dataset = chartRef.current.data.datasets[datasetIndex];

    console.log("Clicked Bar Dataset Label:", dataset.label); // Log the label for debugging
    console.log("Clicked Bar Dataset Index:", datasetIndex); // Log dataset index
    console.log("Clicked Bar Index:", index); // Log the clicked index

    const status = dataset.label === "Closed Orders" ? "closed" : "open";
    console.log("status : ", status);

    const selectedMonth = filteredOrdersData[index]; // Corresponding month data

    // Format the month to always be two digits
    const formattedMonth = String(selectedMonth.month).padStart(2, "0");

    // Function to get the last day of the month based on the year and month
    const getLastDayOfMonth = (year, month) => {
      // For February, check for leap year
      if (month === 2) {
        return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
          ? 29
          : 28;
      }
      // For months with 30 days
      if ([4, 6, 9, 11].includes(month)) {
        return 30;
      }
      // For months with 31 days
      return 31;
    };

    // Get the last day of the selected month
    const lastDayOfMonth = getLastDayOfMonth(
      new Date().getFullYear(),
      selectedMonth.month
    );

    const queryParams = {
      status,
      fromDate: `${new Date().getFullYear()}-${formattedMonth}-01`,
      toDate: `${new Date().getFullYear()}-${formattedMonth}-${String(
        lastDayOfMonth
      ).padStart(2, "0")}`,
    };

    router.push({
      pathname: "/orders",
      query: queryParams,
    });
  };

  const fetchOrdersData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.customer) queryParams.append("customer", filters.customer);
      if (filters.region) queryParams.append("region", filters.region);

      const response = await fetch(
        `/api/monthly-orders?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch orders data");
      }
      const data = await response.json();
      console.log("Fetched Orders Data:", data);
      setOrdersData(data.length ? data : []);
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
  }, [filters]);

  // Add this useEffect to log ordersData whenever it changes
  // useEffect(() => {
  //  if (chartRef.current) {
  //    chartRef.current.update();
  //  }  
  // }, [ordersData]); // This runs every time ordersData changes

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Filter out months with zero data
  const filteredOrdersData = ordersData.filter(
    (data) => data.openOrders > 0 || data.closedOrders > 0
  );

  const ordersChartData = {
    labels: filteredOrdersData.map((data) => months[data.month - 1]),
    datasets: [
      {
        label: "Open Orders",
        data: filteredOrdersData.map((data) => data.openOrders || 0),
        backgroundColor: colorPalette.primary,
        borderColor: colorPalette.primary,
        borderWidth: 1,
        barPercentage: 1,
        categoryPercentage: 0.7,
      },
      {
        label: "Closed Orders",
        data: filteredOrdersData.map((data) => data.closedOrders || 0),
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
    animation: {
      duration: 1000, // Duration of animation in ms
      easing: "easeInOutQuart",
    },
    plugins: {
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
        enabled: true,
        bodyFont: { size: 13 },
        padding: 12,

        callbacks: {
          label: function (context) {
            const datasetLabel = context.dataset.label;
            const value = context.raw;
            const dataPoint = filteredOrdersData[context.dataIndex];

            if (datasetLabel === "Open Orders") {
              return `${datasetLabel}: ${value} (Sales: ${formatCurrency(
                dataPoint.openSales
              )})`;
            } else if (datasetLabel === "Closed Orders") {
              return `${datasetLabel}: ${value} (Sales: ${formatCurrency(
                dataPoint.closedSales
              )})`;
            }
            return `${datasetLabel}: ${value}`;
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
    interaction: {
      mode: "nearest", // This ensures it listens to hover events on nearby elements
      intersect: true, // Ensures interaction only happens when over the chart element
    },
    onHover: (event, chartElement) => {
      console.log("Hover event triggered"); // Log to check if event triggers
      if (chartElement.length > 0) {
        console.log("Hovered over element:", chartElement);
        event.native.target.style.cursor = "pointer"; // Change the cursor to pointer
      } else {
        event.native.target.style.cursor = "default"; // Reset cursor if not over element
      }
    },
  };

  const exportToCSV = () => {
    if (!filteredOrdersData.length) return;
    const csvData = [
      ["Month", ...filteredOrdersData.map((data) => months[data.month - 1])],
      // [
      //   "Open Orders",
      //   ...filteredOrdersData.map((data) => data.openOrders || 0),
      // ],
      // [
      //   "Closed Orders",
      //   ...filteredOrdersData.map((data) => data.closedOrders || 0),
      // ],
      [
        "Open Orders (Sales)",
        ...filteredOrdersData.map((data) =>
          formatCurrency(data.openSales || 0)
        ),
      ],
      [
        "Closed Orders (Sales)",
        ...filteredOrdersData.map((data) =>
          formatCurrency(data.closedSales || 0)
        ),
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
          <div className="d-flex flex-column flex-md-row gap-2 align-items-md-center mt-3 mt-md-0">
            <div className="d-flex gap-2">
              {/* <Button
                variant="outline-secondary"
                onClick={() => setFilters({ customer: null, region: null })}
                style={{ whiteSpace: "nowrap" }}
              >
                Clear Filters
              </Button> */}
              <Button
                variant="outline-primary"
                onClick={exportToCSV}
                disabled={!filteredOrdersData.length}
                style={{ whiteSpace: "nowrap" }}
              >
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </Card.Header>
      <Card.Body className="position-relative">
        {error && (
          <p className="text-center mt-4 text-danger">Error: {error}</p>
        )}
        <div
          className="chart-container"
          style={{ height: "450px", padding: "10px" }}
        >
          {/* <Bar
            ref={chartRef} // Step 3: Pass ref to the Bar component
            data={ordersChartData}
            options={ordersChartOptions}
            onClick={(e, chartElement) => handleBarClick(e, chartElement)}
          /> */}
          <Bar
            ref={chartRef} // Step 3: Pass ref to the Bar component
            data={ordersChartData}
            // options={{ responsive: true }}
            options={ordersChartOptions}
            onClick={handleBarClick}
          />
          {loading && (
            <div className="position-absolute top-50 start-50 translate-middle bg-white bg-opacity-75 p-3 rounded d-flex align-items-center">
              <Spinner animation="border" role="status" className="me-2">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <span>Updating chart data...</span>
            </div>
          )}
        </div>
        {!loading && !filteredOrdersData.length && !error && (
          <p className="text-center mt-4">
            No data available for the selected filters.
          </p>
        )}
      </Card.Body>
    </Card>
  );
};

export default OrdersChart;
