// components/CustomerCharts/SalesStackedBarChart.js
import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { formatCurrency } from "utils/formatCurrency";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SalesStackedBarChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center p-4">No data available for the chart</div>
    );
  }

  // Get unique months and categories
  const months = [...new Set(data.map((item) => item.MonthName))];
  const categories = [...new Set(data.map((item) => item.Category))];

  // Color palette for categories
  const colorPalette = [
    "#4e79a7",
    "#f28e2b",
    "#e15759",
    "#76b7b2",
    "#59a14f",
    "#edc948",
    "#b07aa1",
    "#ff9da7",
    "#9c755f",
    "#bab0ac",
  ];

  // Prepare dataset for each category
  const datasets = categories.map((category, index) => {
    const categoryData = months.map((month) => {
      const item = data.find(
        (d) => d.MonthName === month && d.Category === category
      );
      return item ? item.Percentage : 0;
    });

    return {
      label: category,
      data: categoryData,
      backgroundColor: colorPalette[index % colorPalette.length],
      borderWidth: 1,
    };
  });

  const chartData = {
    labels: months,
    datasets: datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Sales by Category (%)",
        font: {
          size: 16,
        },
      },
      legend: {
        position: "bottom",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || "";
            const value = context.raw;
            const dataItem = data.find(
              (d) => d.MonthName === context.label && d.Category === label
            );

            const sales = dataItem ? formatCurrency(dataItem.Sales) : "0";
            return `${label}: ${sales} (${value.toFixed(1)}%)`;
          },
          afterBody: function (context) {
            const monthData = data.filter(
              (d) => d.MonthName === context[0].label
            );
            const total = monthData.reduce((sum, item) => sum + item.Sales, 0);
            return [`Total: ${formatCurrency(total)}`];
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
      },
      y: {
        stacked: true,
        min: 0,
        max: 100,
        ticks: {
          callback: function (value) {
            return value + "%";
          },
        },
      },
    },
  };

  return (
    <div style={{ height: "500px" }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default SalesStackedBarChart;
