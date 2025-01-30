// Import necessary libraries and components
import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, Tooltip, Legend, ArcElement } from "chart.js";
import { formatCurrency } from "utils/formatCurrency";

// Register required Chart.js components
ChartJS.register(Tooltip, Legend, ArcElement);

/**
 * SalesPieChart Component
 * A reusable Pie chart component to visualize sales data by category.
 *
 * @param {Object[]} data - Array of sales data, where each object contains `Category` and `Sales`.
 * @returns {JSX.Element}
 */
const SalesPieChart = ({ data }) => {
  // Define a color palette for the chart
  const colorPalette = [
    "#0d6efd", // Primary Blue
    "#6c757d", // Secondary Gray
    "#198754", // Success Green
    "#ffc107", // Warning Yellow
    "#0dcaf0", // Info Cyan
    "#212529", // Dark Black
    "#6610f2", // Purple
    "#6f42c1", // Violet
    "#d63384", // Pink
    "#dc3545", // Red
    "#fd7e14", // Orange
  ];

  // Assign colors to each category using the color palette
  const chartColors = data.map(
    (_, index) => colorPalette[index % colorPalette.length]
  );

  // Prepare the chart data structure
  const chartData = {
    labels: data.map((item) => item.Category), // Labels for each category
    datasets: [
      {
        data: data.map((item) => item.Sales), // Sales values for each category
        backgroundColor: chartColors, // Background colors for each slice
        hoverBackgroundColor: chartColors, // Hover colors for each slice
      },
    ],
  };

  // Chart configuration options
  const options = {
    plugins: {
      legend: {
        position: "right", // Display legend on the right side
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            const value = tooltipItem.raw; // Raw sales value
            return `${tooltipItem.label}: ${formatCurrency(value)}`; // Format the tooltip label
          },
        },
      },
      datalabels: {
        display: false, // Disable data labels on the chart
      },
    },
  };

  return <Pie data={chartData} options={options} />;
};

export default SalesPieChart;
