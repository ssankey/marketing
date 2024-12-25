import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, Tooltip, Legend, ArcElement } from "chart.js";
import { formatCurrency } from "utils/formatCurrency";


ChartJS.register(Tooltip, Legend, ArcElement);

const SalesPieChart = ({ data }) => {
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

  // Ensure we use a unique color for each category
  const chartColors = data.map(
    (_, index) => colorPalette[index % colorPalette.length]
  );

  const chartData = {
    labels: data.map((item) => item.Category),
    datasets: [
      {
        data: data.map((item) => item.Sales),
        backgroundColor: chartColors,
        hoverBackgroundColor: chartColors,
      },
    ],
  };

  const options = {
    plugins: {
      legend: { position: "right" },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            const value = tooltipItem.raw;
            return `${tooltipItem.label}: ${formatCurrency(value)}`;
          },
        },
      },
      datalabels: {
        display: false, // Disable datalabels for this chart
      },
    },
  };

  return <Pie data={chartData} options={options} />;
};

export default SalesPieChart;
