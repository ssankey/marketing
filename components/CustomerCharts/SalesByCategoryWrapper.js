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
