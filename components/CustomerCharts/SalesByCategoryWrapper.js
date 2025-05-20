
// // components/CustomerCharts/SalesByCategoryWrapper.js
// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { Bar } from "react-chartjs-2";
// import Select from "react-select";
// import { Spinner, Dropdown, Button } from "react-bootstrap";
// import debounce from "lodash/debounce";
// import { formatCurrency } from "utils/formatCurrency";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";

// ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// const MonthlyCategorySalesChart = ({ customerId }) => {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const API_ENDPOINTS = {
//     salesPerson: "/api/dashboard/sales-person/distinct-salesperson",
//     category: "/api/products/categories",
//   };

//   const [searchType, setSearchType] = useState(null);
//   const [filters, setFilters] = useState({ salesPerson: null, category: null });
//   const [inputValue, setInputValue] = useState("");
//   const [selectedValue, setSelectedValue] = useState(null);
//   const [suggestions, setSuggestions] = useState([]);
//   const [loadingSuggestions, setLoadingSuggestions] = useState(false);
//   const cache = useRef({});

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       const params = new URLSearchParams();
//       params.append("customerCode", customerId);
//       if (filters.salesPerson) params.append("salesPersonCode", filters.salesPerson.value);
//       if (filters.category) params.append("category", filters.category.value);

//       const url = `/api/customers/salesbycategory?${params.toString()}`;
//       const response = await fetch(url);
//       const result = await response.json();
//       setData(result);
//     } catch (error) {
//       console.error("Error fetching monthly category sales:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (customerId) fetchData();
//   }, [customerId, filters]);

//   const handleSearchTypeSelect = (type) => {
//     setSearchType(type);
//     setSelectedValue(null);
//     setInputValue("");
//     setSuggestions([]);
//     fetchSuggestions(type, "", true);
//   };

//   const fetchSuggestions = useCallback(async (type, query = "", initial = false) => {
//     if (!type || (!initial && !query)) return;
//     const cacheKey = `${type}_${query}`;
//     if (cache.current[cacheKey]) {
//       setSuggestions(cache.current[cacheKey]);
//       return;
//     }
//     setLoadingSuggestions(true);
//     try {
//       const url = `${API_ENDPOINTS[type]}?search=${encodeURIComponent(query)}&page=1&limit=50`;
//       const res = await fetch(url);
//       const json = await res.json();
//       const formatted = (type === "salesPerson")
//         ? json.salesEmployees.map((e) => ({ value: e.value, label: `${e.value} - ${e.label}` }))
//         : json.categories.map((c) => ({ value: c, label: c }));
//       cache.current[cacheKey] = formatted;
//       setSuggestions(formatted);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoadingSuggestions(false);
//     }
//   }, []);

//   const handleInputChange = (val) => {
//     setInputValue(val);
//     if (searchType) debouncedFetchSuggestions(searchType, val);
//   };

//   const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 500), []);

//   const handleOptionSelect = (option) => {
//     setSelectedValue(option);
//     setFilters((prev) => ({ ...prev, [searchType]: option }));
//   };

//   const handleReset = () => {
//     setSearchType(null);
//     setSelectedValue(null);
//     setInputValue("");
//     setFilters({ salesPerson: null, category: null });
//   };

//   const months = [...new Set(data.map((d) => d.month))];
//   const categories = [...new Set(data.map((d) => d.category))];

//   const colorPalette = [
//     "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f",
//     "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#bab0ac"
//   ];

//   const datasets = categories.map((category, idx) => {
//     const dataSet = months.map((month) => {
//       const item = data.find((d) => d.month === month && d.category === category);
//       return item ? item.sales : 0;
//     });
//     return {
//       label: category,
//       data: dataSet,
//       backgroundColor: colorPalette[idx % colorPalette.length],
//     };
//   });

//   const chartData = { labels: months, datasets };

//   const options = {
//     responsive: true,
//     plugins: {
//       legend: { position: "bottom" },
//       tooltip: {
//         callbacks: {
//           label: function (context) {
//             return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
//           },
//         },
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         ticks: {
//           callback: (val) => formatCurrency(val),
//         },
//         title: { display: true, text: "Sales Amount" },
//       },
//       x: {
//         title: { display: true, text: "Month" },
//       },
//     },
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-sm p-4">
//       <div className="d-flex justify-content-between align-items-center mb-3">
//         <h4 className="mb-0">Monthly Category Sales</h4>
//         <div className="d-flex gap-2">
//           <Dropdown onSelect={handleSearchTypeSelect}>
//             <Dropdown.Toggle variant="outline-secondary">
//               {searchType ? (searchType === "salesPerson" ? "Sales Person" : "Category") : "Filter By"}
//             </Dropdown.Toggle>
//             <Dropdown.Menu>
//               <Dropdown.Item eventKey="salesPerson">Sales Person</Dropdown.Item>
//               <Dropdown.Item eventKey="category">Category</Dropdown.Item>
//             </Dropdown.Menu>
//           </Dropdown>

//           <div style={{ width: 250 }}>
//             <Select
//               value={selectedValue}
//               inputValue={inputValue}
//               onChange={handleOptionSelect}
//               onInputChange={handleInputChange}
//               onFocus={() => fetchSuggestions(searchType, "", true)}
//               options={suggestions}
//               isClearable
//               isDisabled={!searchType}
//               isLoading={loadingSuggestions}
//               placeholder={searchType ? `Search ${searchType}` : "Select filter type"}
//             />
//           </div>

//           <Button variant="primary" onClick={handleReset} disabled={!searchType && !filters.salesPerson && !filters.category}>
//             Reset
//           </Button>
//         </div>
//       </div>

//       {loading ? (
//         <div className="text-center p-5">
//           <Spinner animation="border" />
//         </div>
//       ) : (
//         <div style={{ height: "500px" }}>
//           <Bar data={chartData} options={options} />
//         </div>
//       )}
//     </div>
//   );
// };

// export default MonthlyCategorySalesChart;


// components/CustomerCharts/SalesByCategoryWrapper.js
import React, { useEffect, useState, useRef, useCallback } from "react";
import Select from "react-select";
import { Button, Spinner, Row, Col } from "react-bootstrap";
import SalesTable from "./salestable";
import SalesPieChart from "./SalesPieChart";

const SalesByCategoryWrapper = ({ customerId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const cache = useRef({});

  const fetchData = async (salesPerson = null) => {
    setLoading(true);
    try {
      let url = `/api/customers/salesbycategory?id=${customerId}`;
      if (salesPerson) url += `&salesPerson=${encodeURIComponent(salesPerson)}`;
      const response = await fetch(url);
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Error fetching sales by category:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [customerId]);

  const fetchSuggestions = useCallback(async (query = "") => {
    const cacheKey = `sales-person_${query}`;
    if (cache.current[cacheKey]) {
      setSuggestions(cache.current[cacheKey]);
      return;
    }
    try {
      const url = `/api/dashboard/sales-person/distinct-salesperson?search=${encodeURIComponent(query)}&page=1&limit=50`;
      const response = await fetch(url);
      const json = await response.json();
      const formatted =
        json.salesEmployees?.map((emp) => ({
          value: emp.value,
          label: `${emp.value} - ${emp.label}`,
        })) || [];
      cache.current[cacheKey] = formatted;
      setSuggestions(formatted);
    } catch (err) {
      console.error("Error fetching sales person suggestions:", err);
    }
  }, []);

  const handleOptionSelect = (option) => {
    setSelectedValue(option);
    fetchData(option?.value);
  };

  const handleReset = () => {
    setSelectedValue(null);
    setInputValue("");
    fetchData();
  };

  return (
    <>
      {/* <div className="d-flex justify-content-between align-items-center mb-3">
        
        <div className="d-flex gap-2 align-items-center">
          <div style={{ width: "250px" }}>
            <Select
              value={selectedValue}
              inputValue={inputValue}
              onChange={handleOptionSelect}
              onInputChange={(val) => setInputValue(val)}
              onFocus={() => fetchSuggestions(inputValue)}
              options={suggestions}
              isClearable
              placeholder="Filter by Sales Person"
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
      </div> */}
      <div className="d-flex justify-content-end align-items-center mb-3 gap-2">
  <div style={{ width: "250px" }}>
    <Select
      value={selectedValue}
      inputValue={inputValue}
      onChange={handleOptionSelect}
      onInputChange={(val) => setInputValue(val)}
      onFocus={() => fetchSuggestions(inputValue)}
      options={suggestions}
      isClearable
      placeholder="Filter by Sales Person"
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

   
        <Row>
          <Col lg={6}>
            <SalesTable data={data} customerId={customerId} loading={loading} />
          </Col>
          <Col lg={6}>
            <SalesPieChart data={data} />
          </Col>
        </Row>
      
    </>
  );
};

export default SalesByCategoryWrapper;