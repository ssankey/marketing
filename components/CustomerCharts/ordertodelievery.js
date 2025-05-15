

// components/DeliveryPerformanceChart.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import { Spinner, Table, Button } from "react-bootstrap";
import Select from "react-select";
import debounce from "lodash/debounce";
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
  console.log("customer code inside chart", customerId);
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

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Construct URL with optional salesPerson filter
      let url = `/api/customers/${customerId}/delivery-performance`;
      
      if (filters.salesPerson) {
        url += `?salesPerson=${encodeURIComponent(filters.salesPerson.value)}`;
      }

      const response = await fetch(url);
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
          size: 18,
          weight: "bold",
        },
        titleFont: {
          size: 20,
          weight: "bold",
        },
        padding: 12,
      },
      datalabels: {
        display: false,
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

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="text-xl font-semibold text-gray-900 mb-0">
            Delivery Performance - Monthly
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
            style={{ height: "500px" }}
          >
            <Spinner animation="border" />
          </div>
        ) : data.length > 0 ? (
          <div style={{ height: "500px" }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="text-center">No delivery performance data available</div>
        )}
      </div>
    </div>
  );
};

export default DeliveryPerformanceChart;