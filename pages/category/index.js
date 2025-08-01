// pages/category/index.js
import React, { useEffect, useState } from "react";
import { Container, Card, Form } from "react-bootstrap";
import MonthlyPivotTable from "components/Category/MonthlyPivotTable";

const TABLE_TYPES = ["customer", "salesperson", "state", "category"];

export default function MonthlyReportPage() {
  const [data, setData] = useState({
    customer: [],
    salesperson: [],
    state: [],
    category: [],
  });

  const [categories, setCategories] = useState([]);
  const [categoryFilters, setCategoryFilters] = useState({
    customer: "",
    salesperson: "",
    state: "",
  });
  const [loading, setLoading] = useState({
    customer: false,
    salesperson: false,
    state: false,
    category: false,
  });

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/products/categories");
        const json = await res.json();
        setCategories(json.categories || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    for (const type of TABLE_TYPES) {
      setLoading((prev) => ({ ...prev, [type]: true }));
      try {
        const res = await fetch(`/api/category/monthlySales?type=${type}`);
        const json = await res.json();
        setData((prev) => ({ ...prev, [type]: json }));
      } catch (error) {
        console.error(`Error fetching ${type} data:`, error);
      } finally {
        setLoading((prev) => ({ ...prev, [type]: false }));
      }
    }
  };

  // Fetch filtered data when category filter changes
  const fetchFilteredData = async (type, category) => {
    setLoading((prev) => ({ ...prev, [type]: true }));
    try {
      const url = category
        ? `/api/category/monthlySales?type=${type}&category=${encodeURIComponent(category)}`
        : `/api/category/monthlySales?type=${type}`;

      const res = await fetch(url);
      const json = await res.json();
      setData((prev) => ({ ...prev, [type]: json }));
    } catch (error) {
      console.error(`Error fetching filtered ${type} data:`, error);
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  // Handle category filter change
  const handleCategoryChange = (type, category) => {
    setCategoryFilters((prev) => ({ ...prev, [type]: category }));
    fetchFilteredData(type, category);
  };

//   const buildColumns = (sample) =>
//     sample
//       ? Object.keys(sample).map((key) => ({
//           accessorKey: key,
//           header: key,
//         }))
//       : [];
const buildColumns = (sample) =>
  sample
    ? Object.keys(sample).map((key) => ({
        accessorKey: key,
        header: key,
        isNumeric: typeof sample[key] === "number", // Mark numeric columns
      }))
    : [];


  const renderCategoryDropdown = (type) => (
    <div className="mb-3 d-flex align-items-center gap-3">
      <Form.Label className="mb-0 fw-semibold">Filter by Category:</Form.Label>
      <Form.Select
        value={categoryFilters[type]}
        onChange={(e) => handleCategoryChange(type, e.target.value)}
        style={{ width: "300px" }}
      >
        <option value="">All Categories</option>
        {categories.map((category, index) => (
          <option key={index} value={category}>
            {category}
          </option>
        ))}
      </Form.Select>
    </div>
  );

  return (
    <Container className="mt-3">
      {/* CATEGORY TABLE CARD - No filter needed */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-white">
          <h4 className="mb-0">Category-wise Monthly Sales</h4>
        </Card.Header>
        <Card.Body>
          {loading.category ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <MonthlyPivotTable
              data={data.category}
              columns={buildColumns(data.category[0])}
              type="category"
              categoryFilter=""
            />
          )}
        </Card.Body>
      </Card>

      {/* CUSTOMER TABLE CARD */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-white">
          <h4 className="mb-0">Customer-wise Monthly Sales</h4>
        </Card.Header>
        <Card.Body>
          {renderCategoryDropdown("customer")}
          {loading.customer ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <MonthlyPivotTable
              data={data.customer}
              columns={buildColumns(data.customer[0])}
              type="customer"
              categoryFilter={categoryFilters.customer}
            />
          )}
        </Card.Body>
      </Card>

      {/* SALESPERSON TABLE CARD */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-white">
          <h4 className="mb-0">Salesperson-wise Monthly Sales</h4>
        </Card.Header>
        <Card.Body>
          {renderCategoryDropdown("salesperson")}
          {loading.salesperson ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <MonthlyPivotTable
              data={data.salesperson}
              columns={buildColumns(data.salesperson[0])}
              type="salesperson"
              categoryFilter={categoryFilters.salesperson}
            />
          )}
        </Card.Body>
      </Card>

      {/* STATE TABLE CARD */}
      {/* <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-white">
          <h4 className="mb-0">State-wise Monthly Sales</h4>
        </Card.Header>
        <Card.Body>
          {renderCategoryDropdown("state")}
          {loading.state ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <MonthlyPivotTable
              data={data.state}
              columns={buildColumns(data.state[0])}
            />
          )}
        </Card.Body>
      </Card> */}
    </Container>
  );
}