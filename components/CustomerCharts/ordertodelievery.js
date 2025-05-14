
// components/DeliveryPerformanceChart.js
import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Spinner, Table } from "react-bootstrap";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DeliveryPerformanceChart = ({ customerId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/customers/${customerId}/delivery-performance`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const result = await response.json();
      console.log("API response data:", result);
      setData(result);
    } catch (error) {
      console.error("Error fetching delivery performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchData();
    }
  }, [customerId]);

  const chartData = {
    labels: data.map((item) => item.month),
    datasets: [
      {
        type: "bar",
        label: "0-3 days",
        data: data.map((item) => item.green),
        backgroundColor: "#4CAF50",
        yAxisID: "y",
      },
      {
        type: "bar",
        label: "4-5 days",
        data: data.map((item) => item.orange),
        backgroundColor: "#FF9800",
        yAxisID: "y",
      },
      {
        type: "bar",
        label: "6-8 days",
        data: data.map((item) => item.blue),
        backgroundColor: "#2196F3",
        yAxisID: "y",
      },
      {
        type: "bar",
        label: "9-10 days",
        data: data.map((item) => item.purple),
        backgroundColor: "#9C27B0",
        yAxisID: "y",
      },
      {
        type: "bar",
        label: ">10 days",
        data: data.map((item) => item.red),
        backgroundColor: "#F44336",
        yAxisID: "y",
      },
      {
        type: "line",
        label: "SLA Achieved %",
        data: data.map((item) => item.slaPercentage),
        borderColor: "#000000",
        backgroundColor: "rgba(0, 0, 0, 0.1)",
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: "#000000",
        yAxisID: "y1",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        mode: "index",
        intersect: false,
        bodyFont: {
          size: 18, // 🔍 tooltip body font size
          weight: "bold",
        },
        titleFont: {
          size: 20, // 🔍 tooltip title font size
          weight: "bold",
        },
        padding: 12,
      },
      datalabels: {
        display: false, // Disable datalabels for this chart
      },
    },

    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: "Number of Orders",
        },
        beginAtZero: true,
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: {
          display: true,
          text: "SLA %",
        },
        min: 0,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  // Prepare transposed data for the table
  const tableRows = [
    { label: "0–3 Days", key: "green" },
    { label: "4–5 Days", key: "orange" },
    { label: "6–8 Days", key: "blue" },
    { label: "9–10 Days", key: "purple" },
    { label: ">10 Days", key: "red" },
    { label: "Total Orders", key: "totalOrders" },
    { label: "SLA %", key: "slaPercentage", format: (val) => val.toFixed(2) + "%" },
  ];

  return (
    <div>
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : data.length > 0 ? (
        <>
          <div style={{ height: "500px" }}>
            <Bar data={chartData} options={chartOptions} />
          </div>

          {/* Transposed Table View */}
          <div className="mt-4">
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Month</th>
                  {data.map((item, idx) => (
                    <th key={idx}>{item.month}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    <td>{row.label}</td>
                    {data.map((item, colIdx) => (
                      <td key={colIdx}>
                        {row.format 
                          ? row.format(item[row.key])
                          : item[row.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      ) : (
        <div className="text-center">No delivery performance data available</div>
      )}
    </div>
  );
};

export default DeliveryPerformanceChart;