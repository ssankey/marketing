

import React from "react";
import { Bar } from "react-chartjs-2";
import { formatCurrency } from "utils/formatCurrency";
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
// import { callback } from "chart.js/dist/helpers/helpers.core";
import { callback } from "chart.js/helpers";

// Register chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement
);





const PurchasesAmountChart = ({ data }) => {
  const colorPalette = {
    sales: "#198754", // Green for sales
  };

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

  // Filter out months where AmountSpend is zero
  const filteredData = data.filter((item) => item.AmountSpend !== 0);

  // Get the labels (months) for the filtered data
  // const filteredMonths = filteredData.map((_, index) => months[index]);
  const filteredMonths = filteredData.map(
    (_, index) => months[data.indexOf(filteredData[index])]
  );

  const chartData = {
    labels: filteredMonths,
    datasets: [
      {
        label: "Sales (₹)",
        data: filteredData.map((item) => item.AmountSpend),
        backgroundColor: colorPalette.sales,
        borderColor: colorPalette.sales,
        borderWidth: 1,
        barPercentage: 0.7,
        categoryPercentage: 0.6,
      },
    ],
  };

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
        // callbacks: {
        //   label: (tooltipItem) =>
        //     `${tooltipItem.dataset.label}: ₹${tooltipItem.raw.toFixed(2)}`,
        // },
        callbacks: {
          label: (tooltipItem) => {
            return formatCurrency(tooltipItem.raw);
          }
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
          // callback: (value) => `₹${value.toFixed(0)}`,
          callback : (value) => {
            return formatCurrency(value);
          },
          font: { family: "'Inter', sans-serif", size: 12 },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <h4 className="text-xl font-semibold text-gray-900">Sales - Monthly</h4>
      </div>
      <div className="p-4 bg-gray-50">
        <div className="h-[450px]">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default PurchasesAmountChart;
