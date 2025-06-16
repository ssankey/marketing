

// components/CustomerCharts/CategorySalesChart.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import { Spinner, Button, Dropdown } from "react-bootstrap";
import Select from "react-select";
import debounce from "lodash/debounce";
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
};

export default function CategorySalesChart({ cardCode }) {
  /* ------------------------------ state --------------------------- */
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchType, setSearchType] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLS] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const cache = useRef({});

  const [filters, setFilters] = useState({
    salesPerson: null,
    category: null,
  });

  const allowedTypes = ["salesPerson", "category"];

  /* prevent stale searchType */
  useEffect(() => {
    if (searchType && !allowedTypes.includes(searchType)) {
      setSearchType(null);
      setSelectedValue(null);
      setInputValue("");
    }
  }, [searchType, allowedTypes]);

  /* ------------------------------ data fetch ---------------------- */
  // const fetchData = async (activeFilters) => {
  //   try {
  //     setLoading(true);
  //     const params = new URLSearchParams();
  //     if (activeFilters.salesPerson) params.append("salesPerson", activeFilters.salesPerson);
  //     if (activeFilters.category) params.append("category", activeFilters.category);

  //     // const response = await fetch(
  //     //   `/api/customers/${cardCode}/category-sales?${params}`
  //     // );
  //     const response = await fetch(
  //       `/api/dashboard/category-sales?${cardCode ? `cardCode=${cardCode}&` : ""}${params.toString()}`
  //               )

  //     if (!response.ok) throw new Error("Failed to fetch data");
  //     const data = await response.json();
  //     setChartData(data);
  //     setError(null);
  //   } catch (err) {
  //     console.error("Error fetching data:", err);
  //     setError(err.message);
  //     setChartData(null);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchData = async (activeFilters) => {
  try {
    setLoading(true);
    const params = new URLSearchParams();

    if (cardCode) params.append("cardCode", cardCode);
    if (activeFilters.salesPerson) params.append("salesPerson", activeFilters.salesPerson);
    if (activeFilters.category) params.append("category", activeFilters.category);

    const response = await fetch(`/api/dashboard/category-sales?${params.toString()}`);
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
  }, [cardCode, filters]);

  /* ------------------------------ suggestions --------------------- */
  const getSuggestions = async (q = "", initial = false) => {
    if (!searchType || !allowedTypes.includes(searchType)) return;
    if (!initial && !q) return;

    const key = `${searchType}_${q}`;
    if (cache.current[key]) return setSuggestions(cache.current[key]);

    setLS(true);
    try {
      const res = await fetch(`${API_ENDPOINTS[searchType]}?search=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      let opts = [];
      switch (searchType) {
        case "salesPerson":
          opts =
            json.salesEmployees?.map((e) => ({ value: e.value, label: `${e.value} - ${e.label}` })) ?? [];
          break;
        case "category":
          opts = json.categories?.map((c) => ({ value: c.value ?? c, label: c.label ?? c })) ?? [];
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

  const debouncedFetch = useCallback(debounce(getSuggestions, 500), [searchType]);

  /* ------------------------------ handlers ------------------------ */
  const chooseType = async (type) => {
    if (!allowedTypes.includes(type)) return;
    setSearchType(type);
    setSelectedValue(null);
    setInputValue("");
    setSuggestions([]);
    await getSuggestions("", true);
  };

  const chooseOption = (opt) => {
    setSelectedValue(opt);
    setFilters((prev) => ({
      ...prev,
      [searchType]: opt ? opt.value : null,
    }));
  };

  const resetAll = () => {
    setSearchType(null);
    setSelectedValue(null);
    setInputValue("");
    setFilters({
      salesPerson: null,
      category: null,
    });
  };

  /* ------------------------------ chart options ------------------- */
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
            if (value === 0) {
              return null; // skip tooltip if value is 0
            }
            let label = context.dataset.label || "";
            return `${label}: ₹ ${formatNumberWithIndianCommas(value)}`;
          },
          footer: function (tooltipItems) {
            let total = 0;
            tooltipItems.forEach((item) => {
              total += item.parsed.y;
            });
            return "Total: ₹ " + formatNumberWithIndianCommas(total);
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
      },
      y: {
        stacked: true,
        ticks: {
          callback: function (value) {
            return "₹ " + formatNumberWithIndianCommas(value);
          },
        },
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };

  /* ------------------------------ render -------------------------- */
  const labelMap = {
    salesPerson: "Sales Person",
    category: "Category",
  };

  const anyActive = Object.values(filters).some(Boolean);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "400px" }}
        >
          <Spinner animation="border" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="alert alert-danger">Error: {error}</div>
      </div>
    );
  }

//   if (!chartData || chartData.datasets.length === 0) {
//     return (
//       <div className="bg-white rounded-lg shadow-sm p-4">
//         <div className="alert alert-info">No category sales data available</div>
//       </div>
//     );
//   }
if (!chartData || chartData.datasets.length === 0) {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* header with filters */}
      <div className="p-4 border-b">
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0 fw-semibold"></h4>

          <div className="d-flex gap-2 align-items-center">
            <Dropdown onSelect={chooseType}>
              <Dropdown.Toggle variant="outline-secondary" id="filter-type">
                {searchType ? labelMap[searchType] : "Filter By"}
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
                value={selectedValue}
                inputValue={inputValue}
                onChange={chooseOption}
                onInputChange={(v, { action }) => {
                  if (action === "input-change") {
                    setInputValue(v);
                    debouncedFetch(v);
                  }
                }}
                onFocus={() => searchType && getSuggestions(inputValue, true)}
                options={suggestions}
                isLoading={loadingSuggestions}
                isClearable
                isDisabled={!searchType}
                placeholder={
                  searchType
                    ? `Search ${labelMap[searchType]}`
                    : "Select filter type"
                }
              />
            </div>

            <Button
              variant="primary"
              onClick={resetAll}
              disabled={!anyActive && !searchType}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* No data message */}
      <div className="p-4">
        <div className="alert alert-info">No category sales data available</div>
      </div>
    </div>
  );
}


  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* header with filters */}
      <div className="p-4 border-b">
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0 fw-semibold"></h4>

          <div className="d-flex gap-2 align-items-center">
            <Dropdown onSelect={chooseType}>
              <Dropdown.Toggle variant="outline-secondary" id="filter-type">
                {searchType ? labelMap[searchType] : "Filter By"}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item eventKey="salesPerson">Sales Person</Dropdown.Item>
                <Dropdown.Item eventKey="category">Category</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <div style={{ width: 300 }}>
              <Select
                value={selectedValue}
                inputValue={inputValue}
                onChange={chooseOption}
                onInputChange={(v, { action }) => {
                  if (action === "input-change") {
                    setInputValue(v);
                    debouncedFetch(v);
                  }
                }}
                onFocus={() => searchType && getSuggestions(inputValue, true)}
                options={suggestions}
                isLoading={loadingSuggestions}
                isClearable
                isDisabled={!searchType}
                placeholder={searchType ? `Search ${labelMap[searchType]}` : "Select filter type"}
              />
            </div>

            <Button variant="primary" onClick={resetAll} disabled={!anyActive && !searchType}>
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* chart */}
      <div className="p-4">
        <div style={{ height: "500px" }}>
          <Bar data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
}