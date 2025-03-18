

import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import { Card, Spinner, Table } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import { useRouter } from "next/router";
import ChartDataLabels from "chartjs-plugin-datalabels";
import AllFilter from "components/AllFilters"; // ✅ Import AllFilter component

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

// Month Mapping Helper
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

// Format Month-Year Labels
const formatMonthYear = (year, month) => {
  const monthIndex = monthMapping[month];
  if (monthIndex === undefined) return "Invalid Date";
  const date = new Date(year, monthIndex);
  return date.toLocaleDateString("default", { month: "short", year: "numeric" });
};

const OrdersChart = () => {
  const [ordersData, setOrdersData] = useState([]);

   const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    salesPerson: null,
    category: null,
    product: null,
  }); // ✅ New state for filters

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
    const queryParams = new URLSearchParams();

    // ✅ Map filters to API query parameters
    if (filters.salesPerson?.value) queryParams.append("slpCode", filters.salesPerson.value);
     if (filters.category?.value) queryParams.append("itmsGrpCod", filters.category.value);
    if (filters.product?.value) queryParams.append("itemCode", filters.product.value);

    const response = await fetch(`/api/monthly-orders?${queryParams}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch orders data");

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

  // ✅ Fetch data when filters change
  useEffect(() => {
    fetchOrdersData();
  }, [filters]);

  const labels = ordersData.map((data) => formatMonthYear(data.year, data.month));

  const ordersChartData = {
    labels,
    datasets: [
      {
        label: "Open Orders",
        data: ordersData.map((data) => data.openOrders || 0),
        backgroundColor: "#0d6efd",
        borderColor: "#0d6efd",
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
          return ordersData[context.dataIndex]?.openSales > 0;
        },
        formatter: (_, context) => {
          return formatCurrency(ordersData[context.dataIndex]?.openSales);
        },
        anchor: "end",
        align: "end",
        offset: 4,
        color: "#212529",
        font: { weight: "bold", size: 12 },
      },
      legend: { position: "top" },
      tooltip: {
        backgroundColor: "#212529",
        callbacks: {
          label: (context) => {
            const value = context.raw;
            const dataPoint = ordersData[context.dataIndex];
            return `Open Orders: ${value} (Sales: ${formatCurrency(dataPoint.openSales)})`;
          },
        },
      },
      
    },
    //    interaction: {
    //   mode: 'index',
    //   intersect: false,
    // },
    // onHover: (event, elements) => {
    //   const chartCanvas = document.getElementById('orders-chart');
    //   if (chartCanvas) {
    //     chartCanvas.style.cursor = elements.length ? 'pointer' : 'default';
    //   }
    // },
    hover: {
    onHover: (event, elements) => {
      const canvas = event.chart.canvas; // Access the canvas element
      if (elements.length > 0) {
        canvas.style.cursor = "pointer"; // Change cursor to pointer
      } else {
        canvas.style.cursor = "default"; // Reset cursor to default
      }
    },
  },
   onClick: (event, elements) => {
      if (elements.length > 0) {
        const chart = chartRef.current;
        if (!chart) return;

        const datasetIndex = elements[0].datasetIndex;
        const dataIndex = elements[0].index;

        const selectedMonth = ordersData[dataIndex].month; // e.g., "January"
        const status = datasetIndex === 0 ? "open" : "closed"; // 0: Open Orders, 1: Closed Orders

        // Convert month name to numeric value
        const monthIndex = new Date(Date.parse(`${selectedMonth} 1, ${selectedYear}`)).getMonth() + 1;
        const fromDate = `${selectedYear}-${String(monthIndex).padStart(2, "0")}-01`;
        const toDate = new Date(selectedYear, monthIndex, 0).toISOString().split("T")[0]; // Last day of month

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
    
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: "rgba(0, 0, 0, 0.05)" } },
    },
    
  };

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-white py-3">
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-3 mb-md-0" style={{ fontWeight: 600, color: "#212529" }}>
            Open Orders - Monthly
          </h4>

          {/* ✅ Integrate AllFilter Component */}
          <AllFilter
            searchQuery={filters}
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
                setFilters({ salesPerson: null, category: null, product: null });
              }
            }}
          />
        </div>
      </Card.Header>

      <Card.Body>
        {error && <p className="text-center mt-4 text-danger">Error: {error}</p>}

        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: "500px" }}>
            <Spinner animation="border" role="status" />
            <span>Loading chart data...</span>
          </div>
        ) : ordersData.length ? (
          <>
            <div className="chart-container" style={{ height: "500px", width: "100%" }}>
              <Bar ref={chartRef} data={ordersChartData} options={ordersChartOptions} />
            </div>

            <Table striped bordered hover responsive className="mt-4">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Open Orders</th>
                  <th>Open Orders Sales</th>
                </tr>
              </thead>
              <tbody>
                {ordersData.map((data) => (
                  <tr key={`${data.year}-${data.month}`}>
                    <td>{formatMonthYear(data.year, data.month)}</td>
                    <td>{data.openOrders || 0}</td>
                    <td>{formatCurrency(data.openSales || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        ) : (
          <p className="text-center mt-4">No data available.</p>
        )}
      </Card.Body>
    </Card>
  );
};

export default OrdersChart;


