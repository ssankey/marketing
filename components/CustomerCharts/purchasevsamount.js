

import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Spinner } from "react-bootstrap";
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

const PurchasesAmountChart = ({ customerId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customers/${customerId}/metrics`);

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

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

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

  // Filter out months where AmountSpend is 0
  const filteredData = data.filter((item) => item.AmountSpend > 0);

  // Format labels and data for the chart
  const chartLabels = filteredData.map((item) => {
    const date = new Date(item.Date);
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  });

  const chartDataValues = filteredData.map((item) => item.AmountSpend);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Sales (₹)",
        data: chartDataValues,
        backgroundColor: colorPalette.sales,
        borderColor: colorPalette.sales,
        borderWidth: 1,
        barPercentage: 0.8,
        categoryPercentage: 0.4,
        clip: 10,
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
      datalabels: {
        display: true,
        color: "#000",
        anchor: "end",
        align: "top",
        offset: 0,
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