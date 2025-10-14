

// pages/category/index.js
import React, { useEffect, useState } from "react";
import { Container, Card, Form, Spinner } from "react-bootstrap";
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
  const [initialLoad, setInitialLoad] = useState(true);

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
    const fetchInitialData = async () => {
      setInitialLoad(true);
      try {
        for (const type of TABLE_TYPES) {
          setLoading((prev) => ({ ...prev, [type]: true }));
          const res = await fetch(`/api/category/monthlySales?type=${type}`);
          const json = await res.json();
          setData((prev) => ({ ...prev, [type]: json }));
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setInitialLoad(false);
        setLoading({
          customer: false,
          salesperson: false,
          state: false,
          category: false,
        });
      }
    };
    fetchInitialData();
  }, []);

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

  const buildColumns = (sample) =>
    sample
      ? Object.keys(sample).map((key) => ({
          accessorKey: key,
          header: key,
          isNumeric: typeof sample[key] === "number",
        }))
      : [];

  const renderCategoryDropdown = (type) => (
    <div className="mb-2 d-flex align-items-center gap-2">
      <Form.Label className="mb-0 small">Filter by Category:</Form.Label>
      <Form.Select
        value={categoryFilters[type]}
        onChange={(e) => handleCategoryChange(type, e.target.value)}
        size="sm"
        style={{ width: "200px" }}
        disabled={initialLoad}
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

  // Enhanced loader component
  const renderLoader = () => (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
      <div className="mt-3 text-primary fw-semibold">Loading sales data...</div>
    </div>
  );

  // Skeleton loader for when initial data is loading
  if (initialLoad) {
    return (
      <Container className="mt-4" fluid>
        <Card className="mb-3 shadow-sm">
          <Card.Header className="bg-white py-3">
            <h5 className="mb-0">Loading Sales Reports...</h5>
          </Card.Header>
          <Card.Body>
            {renderLoader()}
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="mt-2" fluid>
      {/* CATEGORY TABLE CARD */}
      <Card className="mb-2 shadow-sm">
        <Card.Header className="bg-white py-2 px-3">
          <h5 className="mb-0">Category-wise Monthly Sales</h5>
        </Card.Header>
        <Card.Body className="p-2">
          {loading.category ? (
            renderLoader()
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
      <Card className="mb-2 shadow-sm">
        <Card.Header className="bg-white py-2 px-3">
          <h5 className="mb-0">Customer-wise Monthly Sales</h5>
        </Card.Header>
        <Card.Body className="p-2">
          {renderCategoryDropdown("customer")}
          {loading.customer ? (
            renderLoader()
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
      <Card className="mb-2 shadow-sm">
        <Card.Header className="bg-white py-2 px-3">
          <h5 className="mb-0">Salesperson-wise Monthly Sales</h5>
        </Card.Header>
        <Card.Body className="p-2">
          {renderCategoryDropdown("salesperson")}
          {loading.salesperson ? (
            renderLoader()
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
    </Container>
  );
}