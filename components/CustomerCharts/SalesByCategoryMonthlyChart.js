

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import { Spinner, Dropdown, Button } from "react-bootstrap";
import Select from "react-select";
import ChartJS from "chart.js/auto";
import { formatCurrency } from "utils/formatCurrency";

const MonthlySalesChart = ({ customerId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ salesPerson: null, category: null });

  const categoriesSet = new Set();
  const monthsSet = new Set();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.salesPerson)
        params.append("salesPerson", filters.salesPerson.value);
      if (filters.category) params.append("category", filters.category.value);

      const res = await fetch(
        `/api/customers/${customerId}/monthly-sales?${params}`
      );
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("Failed to fetch sales data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [customerId, filters]);

  // Build months and categories
  data.forEach(({ month, category }) => {
    monthsSet.add(month);
    categoriesSet.add(category);
  });

  const months = Array.from(monthsSet);
  const categories = Array.from(categoriesSet);
  const totalSalesByMonth = {};

  // Compute dataset for each category
  const datasets = categories.map((cat, index) => {
    const colorPalette = [
      "#0d6efd",
      "#198754",
      "#ffc107",
      "#6f42c1",
      "#d63384",
      "#fd7e14",
      "#6c757d",
    ];
    const bgColor = colorPalette[index % colorPalette.length];

    const categorySales = months.map((month) => {
      const entry = data.find((d) => d.month === month && d.category === cat);
      const sales = entry ? entry.sales : 0;
      totalSalesByMonth[month] = (totalSalesByMonth[month] || 0) + sales;
      return sales;
    });

    return {
      label: cat,
      data: categorySales,
      backgroundColor: bgColor,
      stack: "Sales",
    };
  });

  // Chart config
  const chartData = {
    labels: months,
    datasets,
  };

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          footer: (items) => {
            const month = items[0].label;
            return `Total: ${formatCurrency(totalSalesByMonth[month])}`;
          },
          label: function (context) {
            const value = context.raw;
            const month = context.label;
            const percent = ((value / totalSalesByMonth[month]) * 100).toFixed(
              1
            );
            return `${context.dataset.label}: ${formatCurrency(value)} (${percent}%)`;
          },
        },
      },
      legend: {
        position: "top",
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: "Sales (INR)",
        },
      },
    },
  };

  return (
    <div className="bg-white rounded shadow-sm p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">Monthly Sales by Category</h5>
        <Button
          variant="outline-primary"
          onClick={() => setFilters({ salesPerson: null, category: null })}
        >
          Reset Filters
        </Button>
      </div>

      {/* Add your filter UI here like category/salesperson dropdown */}
      <div className="mb-3 d-flex gap-3">
        <Select
          placeholder="Filter by Salesperson"
          value={filters.salesPerson}
          onChange={(option) =>
            setFilters((prev) => ({ ...prev, salesPerson: option }))
          }
          options={[
            // Replace with API response
            { label: "101 - John", value: 101 },
            { label: "102 - Sarah", value: 102 },
          ]}
          isClearable
        />
        <Select
          placeholder="Filter by Category"
          value={filters.category}
          onChange={(option) =>
            setFilters((prev) => ({ ...prev, category: option }))
          }
          options={[
            { label: "API", value: "API" },
            { label: "Solvents", value: "Solvents" },
          ]}
          isClearable
        />
      </div>

      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" />
          <p className="mt-2">Loading sales data...</p>
        </div>
      ) : (
        <div style={{ height: "500px" }}>
          <Bar data={chartData} options={options} />
        </div>
      )}
    </div>
  );
};

export default MonthlySalesChart;
