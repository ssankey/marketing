// components/CustomerCharts/CategorySalesChart.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import { Card, Spinner, Button, Dropdown } from "react-bootstrap";
import Select from "react-select";
import debounce from "lodash/debounce";
import { useAuth } from 'contexts/AuthContext';
import { formatNumberWithIndianCommas } from "utils/formatNumberWithIndianCommas";
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
  Legend
);

const API_ENDPOINTS = {
  salesPerson: "/api/dashboard/sales-person/distinct-salesperson",
  category: "/api/products/categories",
  customer: "/api/customers/distinct-customer",
  contactPerson: "/api/dashboard/contact-person/distinct-contact-person",
};

export default function CategorySalesChart({ cardCode }) {
  const { user } = useAuth();
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isCustomer = user?.role === "contact_person";

  // For customer view
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLS] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const cache = useRef({});

  // For non-customer view
  const [searchType, setSearchType] = useState(null);
  const [filters, setFilters] = useState({
    salesPerson: null,
    category: null,
    customer: null,
    contactPerson: null,
  });

  const allowedTypes = cardCode
    ? ["salesPerson", "category", "contactPerson"]
    : ["salesPerson", "category", "customer", "contactPerson"];

  useEffect(() => {
    if (!isCustomer && searchType && !allowedTypes.includes(searchType)) {
      setSearchType(null);
      setSelectedValue(null);
      setInputValue("");
    }
  }, [searchType, allowedTypes, isCustomer]);

  const fetchData = async (activeFilters) => {
    if (!user) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (isCustomer) {
        // Customer view - only contact person filter
        if (activeFilters.contactPerson) {
          params.append("contactPerson", activeFilters.contactPerson);
        }
      } else {
        // Non-customer view - multiple filters
        if (activeFilters.salesPerson) params.append("salesPerson", activeFilters.salesPerson);
        if (activeFilters.category) params.append("category", activeFilters.category);
        if (!cardCode && activeFilters.customer) params.append("customer", activeFilters.customer);
        if (activeFilters.contactPerson) params.append("contactPerson", activeFilters.contactPerson);
      }
      
      const endpoint = cardCode
        ? `/api/customers/${cardCode}/category-sales`
        : `/api/dashboard/category-sales`;

        console.log("Fetching data from:", endpoint, "with params:", params.toString());
      const response = await fetch(`${endpoint}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      setChartData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
      setChartData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(filters);
  }, [cardCode, filters, user]);

  const getSuggestions = async (q = "", initial = false) => {
    if (!q && !initial) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const type = isCustomer ? "contactPerson" : searchType;
    if (!type) return;

    const key = `${type}_${q}`;
    if (cache.current[key]) return setSuggestions(cache.current[key]);

    setLS(true);
    try {
      const res = await fetch(`${API_ENDPOINTS[type]}?search=${encodeURIComponent(q)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      let opts = [];
      switch (type) {
        case "salesPerson":
          opts = json.salesEmployees?.map((e) => ({ 
            value: e.value, 
            label: `${e.value} - ${e.label}` 
          })) ?? [];
          break;
        case "category":
          opts = json.categories?.map((c) => ({ 
            value: c.value ?? c, 
            label: c.label ?? c 
          })) ?? [];
          break;
        case "customer":
          opts = json.customers?.map((c) => ({ 
            value: c.value, 
            label: c.label 
          })) ?? [];
          break;
        case "contactPerson":
          opts = json.contactPersons?.map((c) => ({ 
            value: c.value, 
            label: c.label 
          })) ?? [];
          break;
        default:
          break;
      }
      cache.current[key] = opts;
      setSuggestions(opts);
    } catch (err) {
      console.error("suggestion error:", err);
      setSuggestions([]);
    } finally {
      setLS(false);
    }
  };

  const debouncedFetch = useCallback(debounce(getSuggestions, 500), [isCustomer, searchType]);

  // For customer view
  const chooseOption = (opt) => {
    setSelectedValue(opt);
    setInputValue(opt ? opt.label : "");
    
    if (isCustomer) {
      setFilters(prev => ({
        ...prev,
        contactPerson: opt ? opt.value : null
      }));
    } else {
      // For non-customer view, update the appropriate filter based on searchType
      setFilters(prev => ({
        ...prev,
        [searchType]: opt ? opt.value : null
      }));
    }
  };

  // For non-customer view
  const chooseType = async (type) => {
    if (!allowedTypes.includes(type)) return;
    setSearchType(type);
    setSelectedValue(null);
    setInputValue("");
    setSuggestions([]);
    await getSuggestions("", true);
  };

  const resetAll = () => {
    if (isCustomer) {
      setSelectedValue(null);
      setInputValue("");
      setFilters({ contactPerson: null });
    } else {
      setSearchType(null);
      setSelectedValue(null);
      setInputValue("");
      setFilters({
        salesPerson: null,
        category: null,
        customer: null,
        contactPerson: null,
      });
    }
  };

  // Handle input changes for search
  const handleInputChange = (inputValue, actionMeta) => {
    if (actionMeta.action === 'input-change') {
      setInputValue(inputValue);
      debouncedFetch(inputValue);
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: { display: false },
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.parsed.y;
            if (value === 0) return null;
            
            const total = context.chart.data.datasets.reduce((sum, dataset) => {
              return sum + (dataset.data[context.dataIndex] || 0);
            }, 0);
            
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${context.dataset.label || ""}: ₹ ${formatNumberWithIndianCommas(value)} (${percentage}%)`;
          },
          footer: function (items) {
            const total = items.reduce((sum, item) => sum + item.parsed.y, 0);
            return "Total: ₹ " + formatNumberWithIndianCommas(total);
          },
        },
        itemSort: (a, b) => b.parsed.y - a.parsed.y,
      },
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: {
        stacked: true,
        ticks: {
          callback: value => "₹ " + formatNumberWithIndianCommas(value),
        },
      },
    },
    interaction: { mode: "nearest", axis: "x", intersect: false },
  };

  const labelMap = {
    salesPerson: "Sales Person",
    category: "Category",
    customer: "Customer",
    contactPerson: "Contact Person",
  };

  const anyActive = isCustomer 
    ? filters.contactPerson !== null
    : Object.values(filters).some(Boolean);

  if (!user) return null;

  if (error) {
    return (
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <div className="alert alert-danger">Error: {error}</div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-white py-3">
        <div className="d-flex justify-content-between align-items-center">
          <h4
            className="mb-3 mb-md-0"
            style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}
          >
            Category Sales Performance
          </h4>
          
          <div className="ms-auto d-flex gap-2 align-items-center">
            {isCustomer ? (
              <>
                <Button variant="outline-secondary" disabled style={{ color: "#000", fontWeight: 500 }}>
                  Order Placed By
                </Button>
                <div style={{ width: 300 }}>
                  {/* <Select
                    value={selectedValue}
                    inputValue={inputValue}
                    onChange={chooseOption}
                    onInputChange={handleInputChange}
                    onFocus={() => getSuggestions(inputValue, true)}
                    options={suggestions}
                    isLoading={loadingSuggestions}
                    isClearable
                    placeholder="Search Contact Person"
                    isSearchable={true}
                    filterOption={null}
                  /> */}
                  <Select
  value={selectedValue}
  onChange={chooseOption}
  onInputChange={(v, { action }) => {
    if (action === "input-change") debouncedFetch(v);
  }}
  onFocus={() => getSuggestions("", true)}
  options={suggestions}
  isLoading={loadingSuggestions}
  isClearable
  placeholder="Search Contact Person"
  isSearchable={true}
  filterOption={null}
/>

                </div>
              </>
            ) : (
              <>
                <Dropdown onSelect={chooseType}>
                  <Dropdown.Toggle variant="outline-secondary" id="filter-type">
                    {searchType ? labelMap[searchType] : "Order By"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {allowedTypes.includes("salesPerson") && (
                      <Dropdown.Item eventKey="salesPerson">Sales Person</Dropdown.Item>
                    )}
                    {allowedTypes.includes("category") && (
                      <Dropdown.Item eventKey="category">Category</Dropdown.Item>
                    )}
                    {allowedTypes.includes("customer") && !cardCode && (
                      <Dropdown.Item eventKey="customer">Customer</Dropdown.Item>
                    )}
                    {allowedTypes.includes("contactPerson") && (
                      <Dropdown.Item eventKey="contactPerson">Contact Person</Dropdown.Item>
                    )}
                  </Dropdown.Menu>
                </Dropdown>

                <div style={{ width: 300 }}>
                  {/* <Select
                    value={selectedValue}
                    inputValue={inputValue}
                    onChange={chooseOption}
                    onInputChange={handleInputChange}
                    onFocus={() => searchType && getSuggestions(inputValue, true)}
                    options={suggestions}
                    isLoading={loadingSuggestions}
                    isClearable
                    isDisabled={!searchType}
                    placeholder={searchType ? `Search ${labelMap[searchType]}` : "Select filter type"}
                    isSearchable={true}
                    filterOption={null}
                  /> */}
                  <Select
  value={selectedValue}
  onChange={chooseOption}
  onInputChange={(v, { action }) => {
    if (action === "input-change") debouncedFetch(v);
  }}
  onFocus={() => searchType && getSuggestions("", true)}
  options={suggestions}
  isLoading={loadingSuggestions}
  isClearable
  isDisabled={!searchType}
  placeholder={searchType ? `Search ${labelMap[searchType]}` : "Select filter type"}
  isSearchable={true}
  filterOption={null}
/>

                </div>
              </>
            )}

            <Button variant="primary" onClick={resetAll} disabled={!anyActive && !searchType}>
              Reset
            </Button>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: 500 }}>
            <Spinner animation="border" role="status" className="me-2" />
            <span>Loading chart data...</span>
          </div>
        ) : chartData && chartData.datasets.length > 0 ? (
          <div className="chart-container" style={{ height: 500 }}>
            <Bar data={chartData} options={options} />
          </div>
        ) : (
          <p className="text-center m-0">No category sales data available</p>
        )}
      </Card.Body>
    </Card>
  );
}