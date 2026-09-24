// component/CustomerCharts/TokenCustomerAgingChart.js
import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Spinner, Table } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import ChartDataLabels from "chartjs-plugin-datalabels";
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

const TokenCustomerAgingChart = () => {
  const [data, setData] = useState({
    "0-30 Days": 0,
    "31-60 Days": 0,
    "61-90 Days": 0,
    "91+ Days": 0,
    "Total Balance": 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchAgingData = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await fetch('/api/customers/aging/token', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error("Failed to fetch aging data");

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching customer aging data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgingData();
  }, []);

  const chartData = {
    labels: ["0-30 Days", "31-60 Days", "61-90 Days", "> 90 Days"],
    datasets: [
      {
        label: "Amount",
        data: [
          data["0-30 Days"],
          data["31-60 Days"],
          data["61-90 Days"],
          data["91+ Days"],
        ],
        backgroundColor: ["#4e73df", "#1cc88a", "#36b9cc", "#f6c23e"],
        borderColor: ["#4e73df", "#1cc88a", "#36b9cc", "#f6c23e"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#212529",
        titleFont: { size: 16, weight: "bold" },
        bodyFont: { size: 14 },
        padding: 12,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`,
          title: (items) => items[0].label,
        },
      },
      datalabels: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: "Inter", size: 12 } },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (v) => formatCurrency(v),
          font: { family: "Inter", size: 12 },
        },
        title: {
          display: true,
          text: "Amount (₹)",
          font: { family: "Inter", size: 12 },
        },
      },
    },
  };

  if (!localStorage.getItem("token")) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="text-center text-gray-500">
          Please log in to view aging data
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        {/* <h4 className="text-xl font-semibold text-gray-900 mb-0">
          Outstanding Aging Summary
        </h4> */}
      </div>

      <div className="p-4 bg-gray-50" style={{ height: 400 }}>
        {loading ? (
          <div className="d-flex justify-content-center align-items-center h-100">
            <Spinner animation="border" />
          </div>
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </div>

      {/* Data Table */}
      <div className="p-4">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-4">
            <Spinner animation="border" />
          </div>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Days Range</th>
                <th>0-30 Days</th>
                <th>31-60 Days</th>
                <th>61-90 Days</th>
                <th>&gt; 90 Days</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Amount</td>
                <td>{formatCurrency(data["0-30 Days"])}</td>
                <td>{formatCurrency(data["31-60 Days"])}</td>
                <td>{formatCurrency(data["61-90 Days"])}</td>
                <td>{formatCurrency(data["91+ Days"])}</td>
                <td>{formatCurrency(data["Total Balance"])}</td>
              </tr>
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default TokenCustomerAgingChart;