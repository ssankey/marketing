

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import { Spinner, Button, Dropdown, Table } from "react-bootstrap";
import Select from "react-select";
import debounce from "lodash/debounce";
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

const CustomerAgingChart = ({ cardCode }) => {
  const [data, setData] = useState({
    "0-30 Days": 0,
    "31-60 Days": 0,
    "61-90 Days": 0,
    "91+ Days": 0,
    "Total Balance": 0,
  });
  const [loading, setLoading] = useState(true);

  // API Endpoints
  const API_ENDPOINTS = {
    salesPerson: "/api/dashboard/sales-person/distinct-salesperson",
    category: "/api/products/categories",
  };

  // Search type and filters
  const [searchType, setSearchType] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const selectRef = useRef(null);
  const cache = useRef({});

  // Filter state
  const [filters, setFilters] = useState({
    salesPerson: null,
    category: null,
  });

  const fetchAgingData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.salesPerson) {
        params.append("salesPerson", filters.salesPerson.value);
      }
      if (filters.category) {
        params.append("category", filters.category.value);
      }

      const url = `/api/customers/${cardCode}/aging?${params.toString()}`;
      const response = await fetch(url);
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
    if (cardCode) fetchAgingData();
  }, [cardCode, filters]);

  // Handle dropdown selection
  const handleSearchTypeSelect = async (type) => {
    setSearchType(type);
    setSelectedValue(null);
    setInputValue("");
    setSuggestions([]);
    if (type === "salesPerson" || type === "category") {
      await fetchSuggestions("", true);
    }
  };

  // Debounced function for API calls when typing
  const debouncedFetchSuggestions = useCallback(
    debounce(async (query) => {
      await fetchSuggestions(query);
    }, 500),
    [searchType]
  );

  // Fetch suggestions based on search type
  const fetchSuggestions = async (query = "", initialLoad = false) => {
    if (!searchType) return;
    if (!initialLoad && !query) return;

    const cacheKey = `${searchType}_${query}`;
    if (cache.current[cacheKey]) {
      setSuggestions(cache.current[cacheKey]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const url = `${API_ENDPOINTS[searchType]}?search=${encodeURIComponent(query)}&page=1&limit=50`;
      const response = await fetch(url);

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();

      let formattedSuggestions = [];
      if (searchType === "salesPerson") {
        formattedSuggestions =
          data.salesEmployees?.map((emp) => ({
            value: emp.value,
            label: `${emp.value} - ${emp.label}`,
          })) || [];
      } else if (searchType === "category") {
        formattedSuggestions =
          data.categories?.map((cat) => ({
            value: cat,
            label: cat,
          })) || [];
      }

      cache.current[cacheKey] = formattedSuggestions;
      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.error(`Error fetching ${searchType} suggestions:`, error);
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
    if (searchType) {
      fetchSuggestions(inputValue, true);
    }
  };

  // Handle option selection
  const handleOptionSelect = (option) => {
    setSelectedValue(option);

    if (option) {
      setFilters((prev) => ({
        ...prev,
        [searchType]: {
          value: option.value,
          label: option.label,
        },
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [searchType]: null,
      }));
    }
  };

  // Reset filter
  const handleReset = () => {
    setSearchType(null);
    setSelectedValue(null);
    setInputValue("");
    setFilters({
      salesPerson: null,
      category: null,
    });
  };

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

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <h4 className="text-xl font-semibold text-gray-900 mb-0">
            {/* Outstanding Aging Summary */}
          </h4>

          <div className="d-flex gap-2 align-items-center">
            <Dropdown onSelect={handleSearchTypeSelect}>
              <Dropdown.Toggle variant="outline-secondary" id="search-dropdown">
                {searchType
                  ? searchType === "salesPerson"
                    ? "Sales Person"
                    : "Category"
                  : "Filter By"}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item eventKey="salesPerson">
                  Sales Person
                </Dropdown.Item>
                <Dropdown.Item eventKey="category">Category</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <div style={{ width: 300 }}>
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
                isDisabled={!searchType}
                placeholder={
                  searchType
                    ? `Search ${searchType === "salesPerson" ? "Sales Person" : "Category"}`
                    : "Select filter type"
                }
                noOptionsMessage={() =>
                  loadingSuggestions ? "Loading..." : "No results"
                }
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: 40,
                    borderColor: state.isFocused ? "#007bff" : "#dee2e6",
                    fontSize: 14,
                    backgroundColor: searchType ? "#fff" : "#f8f9fa",
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
              disabled={
                !searchType && !filters.salesPerson && !filters.category
              }
            >
              Reset
            </Button>
          </div>
        </div>
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
                <th>Total </th>
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

export default CustomerAgingChart;