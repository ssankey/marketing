//components/CustomerCharts/purchasevsamount


import React from "react";
import { Bar } from "react-chartjs-2";
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
  LineElement,
  ChartDataLabels
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
        barPercentage: 0.8,
        categoryPercentage: 0.4,
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
        callbacks: {
          label: (tooltipItem) => {
            return formatCurrency(tooltipItem.raw);
          },
        },
      },
      // Add the datalabels plugin configuration
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
      <div className="p-4 border-b">
        <h4 className="text-xl font-semibold text-gray-900">Sales - Monthly</h4>
      </div>
      <div className="p-4 bg-gray-50">
        {/* <div className="h-[1000px]">
          <Bar data={chartData} options={chartOptions} />
        </div> */}
        <div style={{ height: "400px" }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default PurchasesAmountChart;
