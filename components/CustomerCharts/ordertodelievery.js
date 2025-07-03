
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import { Card, Spinner, Table, Button, Dropdown } from "react-bootstrap";
import Select from "react-select";
import debounce from "lodash/debounce";
import { useAuth } from 'contexts/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_ENDPOINTS = {
  salesPerson: "/api/dashboard/sales-person/distinct-salesperson",
  category: "/api/products/categories",
  customer: "/api/customers/distinct-customer",
  contactPerson: "/api/dashboard/contact-person/distinct-contact-person",
};

export default function DeliveryPerformanceChart({ customerId }) {
  const { user } = useAuth();
  const [data, setData] = useState([]);
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

  const allowedTypes = customerId
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
        if (!customerId && activeFilters.customer) params.append("customer", activeFilters.customer);
        if (activeFilters.contactPerson) params.append("contactPerson", activeFilters.contactPerson);
      }

      const endpoint = customerId
        ? `/api/customers/${customerId}/delivery-performance`
        : `/api/customers/all-delivery-performance`;

      const response = await fetch(`${endpoint}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      setData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(filters);
  }, [customerId, filters, user]);

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

  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      { label: "0–3 days", backgroundColor: "#4CAF50", data: data.map((d) => d.green) },
      { label: "4–5 days", backgroundColor: "#FF9800", data: data.map((d) => d.orange) },
      { label: "6–8 days", backgroundColor: "#2196F3", data: data.map((d) => d.blue) },
      { label: "9–10 days", backgroundColor: "#9C27B0", data: data.map((d) => d.purple) },
      { label: ">10 days", backgroundColor: "#F44336", data: data.map((d) => d.red) },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      datalabels: { display: false },
      tooltip: {
        mode: "index",
        intersect: false,
        padding: 12,
        titleFont: { size: 16, weight: "bold" },
        bodyFont: { size: 14, weight: "bold" },
      },
      legend: { position: "top" },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        title: { display: true, text: "Number of Orders" },
      },
    },
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
            Order → Invoice Performance
          </h4>
          
          <div className="ms-auto d-flex gap-2 align-items-center">
            {isCustomer ? (
              <>
                <Button variant="outline-secondary" disabled style={{ color: "#000", fontWeight: 500 }}>
                  Order Placed By
                </Button>
                <div style={{ width: 300 }}>
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
                    {allowedTypes.includes("customer") && !customerId && (
                      <Dropdown.Item eventKey="customer">Customer</Dropdown.Item>
                    )}
                    {allowedTypes.includes("contactPerson") && (
                      <Dropdown.Item eventKey="contactPerson">Contact Person</Dropdown.Item>
                    )}
                  </Dropdown.Menu>
                </Dropdown>

                <div style={{ width: 300 }}>
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
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: 500 }}
          >
            <Spinner animation="border" role="status" className="me-2" />
            <span>Loading chart data...</span>
          </div>
        ) : data.length > 0 ? (
          <>
            <div className="chart-container" style={{ height: 500 }}>
              <Bar data={chartData} options={chartOptions} />
            </div>

            {/* Summary Table */}
            <div className="mt-4">
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Range / Month</th>
                    {data.map((d, i) => (
                      <th key={i}>{d.month}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["0–3 Days", "green"],
                    ["4–5 Days", "orange"],
                    ["6–8 Days", "blue"],
                    ["9–10 Days", "purple"],
                    [">10 Days", "red"],
                  ].map(([lbl, key]) => (
                    <tr key={key}>
                      <td>{lbl}</td>
                      {data.map((d, i) => (
                        <td key={i}>{d[key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        ) : (
          <p className="text-center m-0">No delivery performance data available</p>
        )}
      </Card.Body>
    </Card>
  );
}