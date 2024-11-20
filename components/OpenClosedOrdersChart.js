import React from "react";
import { Bar } from "react-chartjs-2";
import { Card } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";

const OrdersChart = ({ OrdersData }) => {
  const colorPalette = {
    primary: "#0d6efd",
    orderLine: "#198754", // Green for orders
  };
  console.log(Array.isArray(OrdersData));
  // Define months of the current year
  const months = ["Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024"];

  // Create data for the chart
  const ordersChartData = {
    labels: OrdersData.map((data) => data.month),

     
    datasets: [
      {
        label: "Orders",
        data: OrdersData.map((data) => data.orders || 0),
        backgroundColor: colorPalette.primary,
        borderColor: colorPalette.primary,
        borderWidth: 1,
        barPercentage: 0.6,
        categoryPercentage: 1.0,
        order: 1,
      },
    ],
  };

  const ordersChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
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
      tooltip: {
        backgroundColor: "#212529",
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 13 },
        padding: 12,
        callbacks: {
          label: (tooltipItem) =>
            `${tooltipItem.dataset.label}: ${formatCurrency(tooltipItem.raw)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          callback: (value, index) => ordersChartData.labels[index] || "",
          font: { family: "'Inter', sans-serif", size: 12 },
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: {
          callback: (value) => formatCurrency(value),
          font: { family: "'Inter', sans-serif", size: 12 },
        },
      },
    },
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-white py-3">
        <h4
          className="mb-0"
          style={{
            fontWeight: 600,
            color: "#212529",
            fontSize: "1.25rem",
          }}
        >
          Monthly Orders
        </h4>
      </Card.Header>
      <Card.Body
        style={{
          padding: "20px",
          backgroundColor: "#f9f9f9",
          overflow: "hidden",
        }}
      >
        <div style={{ height: "450px", padding: "10px" }}>
          <Bar data={ordersChartData} options={ordersChartOptions} />
        </div>
      </Card.Body>
    </Card>
  );
};

export default OrdersChart;

