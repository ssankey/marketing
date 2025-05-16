

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import { Spinner, Dropdown, Button } from "react-bootstrap";
import Select from "react-select";
import debounce from "lodash/debounce";
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

  // Sales Person filter state
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const selectRef = useRef(null);
  const cache = useRef({});

  // Filter state
  const [filters, setFilters] = useState({
    salesPerson: null,
  });

  const fetchCustomerData = async () => {
    try {
      setLoading(true);

      // Construct URL with optional salesPerson filter
      let url = `/api/customers/${customerId}/metrics`;

      if (filters.salesPerson) {
        url += `?salesPerson=${encodeURIComponent(filters.salesPerson.value)}`;
      }

      const response = await fetch(url);

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
  }, [customerId, filters]);

  // Debounced function for API calls when typing
  const debouncedFetchSuggestions = useCallback(
    debounce(async (query) => {
      await fetchSuggestions(query);
    }, 500),
    []
  );

  // Fetch sales person suggestions
  const fetchSuggestions = async (query = "", initialLoad = false) => {
    const cacheKey = `sales-person_${query}`;

    if (cache.current[cacheKey]) {
      setSuggestions(cache.current[cacheKey]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const url = `/api/dashboard/sales-person/distinct-salesperson?search=${encodeURIComponent(query)}&page=1&limit=50`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();

      const formattedSuggestions =
        data.salesEmployees?.map((emp) => ({
          value: emp.value,
          label: `${emp.value} - ${emp.label}`,
        })) || [];

      cache.current[cacheKey] = formattedSuggestions;
      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.error(`Error fetching sales-person suggestions:`, error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Handle input change
  const handleInputChange = (inputValue, { action }) => {
    if (action === "input-change") {
      setInputValue(inputValue);
      debouncedFetchSuggestions(inputValue);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    fetchSuggestions(inputValue, true);
  };

  // Handle option selection
  const handleOptionSelect = (option) => {
    setSelectedValue(option);

    if (option) {
      setFilters((prev) => ({
        ...prev,
        salesPerson: {
          value: option.value,
          label: option.label,
        },
      }));
    }
  };

  // Reset filter
  const handleReset = () => {
    setSelectedValue(null);
    setInputValue("");
    setFilters({
      salesPerson: null,
    });
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

  // Filter out months with no data
  const filteredData = data.filter(
    (item) =>
      item.InvoiceAmount > 0 ||
      item.OrderAmount > 0 ||
      item.InvoiceCount > 0 ||
      item.OrderCount > 0
  );

  const chartLabels = filteredData.map((item) => {
    const date = new Date(item.Date);
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  });

  // Calculate totals
  const calculateTotals = () => {
    return data.reduce(
      (acc, item) => {
        return {
          totalOrderAmount: acc.totalOrderAmount + (item.OrderAmount || 0),
          totalOrderCount: acc.totalOrderCount + (item.OrderCount || 0),
          totalLineItems: acc.totalLineItems + (item.InvoiceCount || 0),
          totalInvoiceAmount:
            acc.totalInvoiceAmount + (item.InvoiceAmount || 0),
        };
      },
      {
        totalOrderAmount: 0,
        totalOrderCount: 0,
        totalLineItems: 0,
        totalInvoiceAmount: 0,
      }
    );
  };

  const totals = calculateTotals();

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Orders Count",
        data: filteredData.map((item) => item.OrderCount),
        backgroundColor: "#7DA0FA", // Light Blue
        borderColor: "#7DA0FA",
        yAxisID: "y1",
        barPercentage: 0.9, // Increased from 0.7 to reduce space
        categoryPercentage: 0.8, // Adjusted to reduce space between groups
      },
      {
        label: "Orders Total (₹)",
        data: filteredData.map((item) => item.OrderAmount),
        backgroundColor: "#1864AB", // Blue
        borderColor: "#1864AB",
        yAxisID: "y",
        barPercentage: 0.9,
        categoryPercentage: 0.8,
      },
      {
        label: "Line Items",
        data: filteredData.map((item) => item.InvoiceCount),
        backgroundColor: "#63E6BE", // Light Green
        borderColor: "#63E6BE",
        yAxisID: "y1",
        barPercentage: 0.9,
        categoryPercentage: 0.8,
      },
      {
        label: "Invoice Total (₹)",
        data: filteredData.map((item) => item.InvoiceAmount),
        backgroundColor: "#20C997", // Green
        borderColor: "#20C997",
        yAxisID: "y",
        barPercentage: 0.9,
        categoryPercentage: 0.8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
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
        titleFont: { size: 18, weight: "bold" },
        bodyFont: { size: 16 },
        padding: 16,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || "";
            const value = context.raw;

            if (label.includes("Total")) {
              return `${label}: ${formatCurrency(value)}`;
            }
            return `${label}: ${value}`;
          },
          title: (tooltipItems) => {
            return tooltipItems[0].label;
          },
        },
      },
      datalabels: {
        display: false,
      },
    },
    scales: {
      x: {
        stacked: false,
        grid: { display: false },
        ticks: { font: { family: "'Inter', sans-serif", size: 12 } },
      },
      y: {
        type: "linear",
        position: "left",
        beginAtZero: true,
        title: { display: true, text: "Amount (₹)" },
        ticks: {
          callback: (value) => formatCurrency(value),
          font: { family: "'Inter', sans-serif", size: 12 },
        },
      },
      y1: {
        type: "linear",
        position: "right",
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        title: { display: true, text: "Count" },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 12 },
        },
      },
    },
  };

  const TotalsDisplay = ({ totals }) => (
    <div className="mb-4">
      <div className="row g-3">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <h6 className="text-muted mb-2">Total Orders</h6>
              <h3 className="mb-0">{totals.totalOrderCount}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <h6 className="text-muted mb-2">Order Amount</h6>
              <h3 className="mb-0">
                {formatCurrency(totals.totalOrderAmount)}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <h6 className="text-muted mb-2">Line Items</h6>
              <h3 className="mb-0">{totals.totalLineItems}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <h6 className="text-muted mb-2">Invoice Amount</h6>
              <h3 className="mb-0">
                {formatCurrency(totals.totalInvoiceAmount)}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <h4 className="text-xl font-semibold text-gray-900 mb-0">
            Orders & Invoices - Monthly
          </h4>

          {/* Sales Person Filter */}
          <div className="d-flex gap-2 align-items-center">
            <div style={{ width: "300px" }}>
              <Select
                ref={selectRef}
                value={selectedValue}
                inputValue={inputValue}
                onChange={handleOptionSelect}
                onInputChange={handleInputChange}
                onFocus={handleFocus}
                options={suggestions}
                isLoading={loadingSuggestions}
                isClearable
                placeholder="Filter by Sales Person"
                noOptionsMessage={() =>
                  loadingSuggestions ? "Loading..." : "No results found"
                }
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: "40px",
                    borderColor: state.isFocused ? "#007bff" : "#dee2e6",
                    fontSize: "14px",
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused ? "#007bff" : "#fff",
                    color: state.isFocused ? "#fff" : "#212529",
                  }),
                }}
              />
            </div>
            <Button
              variant="primary"
              onClick={handleReset}
              disabled={!selectedValue}
            >
              Reset
            </Button>
          </div>
        </div>
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
          <>
            {data.length > 0 && <TotalsDisplay totals={totals} />}
            <div style={{ height: "400px" }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PurchasesAmountChart;