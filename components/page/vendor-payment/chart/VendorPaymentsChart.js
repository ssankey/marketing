// src/components/VendorPaymentsChart.js
import React, { useState, useEffect } from "react";
import { Card, Spinner, ListGroup, Row, Col } from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import { formatCurrency } from "utils/formatCurrency";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import FilterDropdown from "components/filters/FilterDropdown";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Define a cohesive color palette
const colorPalette = {
  primary: "#0d6efd",
  secondary: "#6c757d",
  success: "#198754",
  warning: "#ffc107",
  info: "#0dcaf0",
  dark: "#212529",
  light: "#f8f9fa",
  gradient: [
    "#0d6efd",
    "#6610f2",
    "#6f42c1",
    "#d63384",
    "#dc3545",
    "#fd7e14",
    "#ffc107",
    "#198754",
    "#20c997",
    "#0dcaf0",
  ],
};

const VendorPaymentsChart = () => {
  // State Variables
  const [vendorPayments, setVendorPayments] = useState([]);
  const [dateFilter, setDateFilter] = useState("today");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Vendor Payments Data
  const fetchVendorPayments = async (filter) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ dateFilter: filter });
      const response = await fetch(`/api/dashboard/vendors-balances?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch vendor payments data");
      }

      const data = await response.json();
      setVendorPayments(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching vendor payments:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when filter changes
  useEffect(() => {
    fetchVendorPayments(dateFilter);
  }, [dateFilter]);

  // Chart Configuration
  const chartData = {
    labels: vendorPayments.map((vendor) => vendor.cardname),
    datasets: [
      {
        label: "Payment",
        data: vendorPayments.map((vendor) => vendor.Balance || 0),
        backgroundColor: colorPalette.warning,
        borderRadius: 6,
        maxBarThickness: 40,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        display: false, // Disable datalabels for this chart
      },
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: colorPalette.dark,
        titleFont: {
          size: 14,
          weight: "bold",
        },
        bodyFont: {
          size: 13,
        },
        padding: 12,
        callbacks: {
          label: (tooltipItem) => `${formatCurrency(tooltipItem.raw)}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          color: colorPalette.dark,
          maxRotation: 45, // Rotate labels 45 degrees
          minRotation: 45, // Keep rotation consistent
          callback: function (value, index) {
            // Truncate long names to 15 characters + ellipsis
            const label = this.getLabelForValue(value);
            if (label.length > 15) {
              return label.substr(0, 12) + "...";
            }
            return label;
          },
        },
      },
      y: {
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          callback: (value) => formatCurrency(value),
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          color: colorPalette.dark,
        },
        beginAtZero: true,
      },
    },
  };

  // No Data Display Component
  const NoDataDisplay = () => (
    <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted">
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 21H3" />
        <path d="M21 3v18" />
        <path d="M3 21V3" />
        <path d="M3 3h18" />
        <path d="M10 14.5l3-3" />
        <path d="M13 11.5l3 3" />
        <path d="M8 17.5l8-8" />
      </svg>
      <p className="mt-3 mb-0">No data available for this time period</p>
    </div>
  );

  // Loading and Error States
  if (error) {
    return (
      <Card className="shadow-sm border-0 h-100">
        <Card.Header className="bg-white border-0 py-3">
          <div className="d-flex justify-content-between align-items-center">
            {/* <h5 className="mb-0 fw-bold">Vendor Payments</h5> */}
            <FilterDropdown
              currentFilter={dateFilter}
              setFilter={setDateFilter}
            />
          </div>
        </Card.Header>
        <Card.Body className="d-flex justify-content-center align-items-center">
          <p className="text-danger">Error: {error}</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0 h-100">
      <Card.Header className="bg-white border-0 py-3">
        <div className="d-flex justify-content-between align-items-center">
          {/* <h5 className="mb-0 fw-bold">Vendor Payments</h5> */}
          {/* <FilterDropdown
            currentFilter={dateFilter}
            setFilter={setDateFilter}
          /> */}
        </div>
      </Card.Header>
      <Card.Body className="d-flex flex-column">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center flex-grow-1">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : vendorPayments.length === 0 ? (
          <NoDataDisplay />
        ) : (
          <div className="chart-container" style={{ height: "400px" }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default VendorPaymentsChart;
