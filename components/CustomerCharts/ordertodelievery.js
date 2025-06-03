// components/CustomerCharts/ordertodelivery.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import { Spinner, Table, Button, Dropdown } from "react-bootstrap";
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

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Construct URL with optional filters
      const params = new URLSearchParams();
      
      if (filters.salesPerson) {
        params.append("salesPerson", filters.salesPerson.value);
      }
      
      if (filters.category) {
        params.append("category", filters.category.value);
      }

      // const url = `/api/customers/${customerId}/delivery-performance?${params.toString()}`;
        const url = customerId
          ? `/api/customers/${customerId}/delivery-performance?${params.toString()}`
          : `/api/customers/delivery-performance?${params.toString()}`;
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
     fetchData();
  }, [customerId, filters]);

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
            {/* Invoice to order - Monthly */}
          </h4>

          {/* Filter Controls */}
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
                isDisabled={!searchType}
                placeholder={
                  searchType
                    ? `Search ${searchType === "salesPerson" ? "Sales Person" : "Category"}`
                    : "Select filter type"
                }
                noOptionsMessage={() =>
                  loadingSuggestions ? "Loading..." : "No results found"
                }
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: "40px",
                    borderColor: state.isFocused ? "#007bff" : "#dee2e6",
                    fontSize: "14px",
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
      <div className="p-4 bg-gray-50">
        {loading ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: "500px" }}
          >
            <Spinner animation="border" />
          </div>
        ) : data.length > 0 ? (
          <>
            <div style={{ height: "500px" }}>
              <Bar data={chartData} options={chartOptions} />
            </div>

            {/* 📊 Chart Data Table */}
            <div className="mt-4">
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Range / Month</th>
                    {data.map((item, index) => (
                      <th key={index}>{item.month}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>0–3 Days</td>
                    {data.map((item, index) => (
                      <td key={index}>{item.green}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>4–5 Days</td>
                    {data.map((item, index) => (
                      <td key={index}>{item.orange}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>6–8 Days</td>
                    {data.map((item, index) => (
                      <td key={index}>{item.blue}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>9–10 Days</td>
                    {data.map((item, index) => (
                      <td key={index}>{item.purple}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>&gt;10 Days</td>
                    {data.map((item, index) => (
                      <td key={index}>{item.red}</td>
                    ))}
                  </tr>
                </tbody>
              </Table>
            </div>
          </>
        ) : (
          <div className="text-center">
            No delivery performance data available
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryPerformanceChart;