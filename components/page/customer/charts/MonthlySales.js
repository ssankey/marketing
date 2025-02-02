// Import necessary libraries
import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Dropdown, Spinner } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  ChartDataLabels
);

/**
 * PurchasesAmountChart Component
 * Displays a bar chart of monthly sales for a selected customer and year.
 *
 * @param {string} customerId - The ID of the customer to fetch sales data for.
 * @returns {JSX.Element}
 */
const PurchasesAmountChart = ({ customerId }) => {
  // State management
  const [data, setData] = useState([]); // Chart data
  const [availableYears, setAvailableYears] = useState([2024, 2025]); // Years available for selection
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Currently selected year
  const [loading, setLoading] = useState(true); // Loading state

  /**
   * Fetch sales data for the selected customer and year
   */
  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/customers/${customerId}?metrics=true&year=${selectedYear}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching customer data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when the selected year changes
  useEffect(() => {
    fetchCustomerData();
  }, [selectedYear]);

  // Color palette for the chart
  const colorPalette = {
    sales: "#198754", // Green for sales
  };

  // Define months for the x-axis labels
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

  // Filter data to exclude months with zero sales
  const filteredData = data.filter((item) => item.AmountSpend !== 0);

  // Get filtered month labels
  const filteredMonths = filteredData.map(
    (_, index) => months[data.indexOf(filteredData[index])]
  );

  // Chart.js data configuration
  const chartData = {
    labels: filteredMonths,
    datasets: [
      {
        label: "Sales (₹)",
        data: filteredData.map((item) => item.AmountSpend),
        backgroundColor: colorPalette.sales,
        borderColor: colorPalette.sales,
        borderWidth: 1,
        barPercentage: 0.8,
        categoryPercentage: 0.4,
      },
    ],
  };

  // Chart.js options configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
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
          label: (tooltipItem) => {
            return formatCurrency(tooltipItem.raw);
          },
        },
      },
      datalabels: {
        display: true,
        color: "#000",
        anchor: "end",
        align: "top",
        offset: 4,
        font: {
          family: "'Inter', sans-serif",
          size: 12,
        },
        formatter: (value) => formatCurrency(value),
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
          callback: (value) => {
            return formatCurrency(value);
          },
          font: { family: "'Inter', sans-serif", size: 12 },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header Section */}
      <div className="p-4 border-b d-flex justify-content-between align-items-center">
        <h4 className="text-xl font-semibold text-gray-900">Sales - Monthly</h4>
        <Dropdown>
          <Dropdown.Toggle variant="outline-secondary" id="year-dropdown">
            {selectedYear}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {availableYears.map((year) => (
              <Dropdown.Item key={year} onClick={() => setSelectedYear(year)}>
                {year}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* Chart Section */}
      <div className="p-4 bg-gray-50">
        {loading ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: "400px" }}
          >
            <Spinner animation="border" />
          </div>
        ) : (
          <div style={{ height: "400px" }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasesAmountChart;
