

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Container, Card, Form, Spinner } from "react-bootstrap";
import { BarChart3 } from "lucide-react";
import MonthlyPivotTable from "components/Category/MonthlyPivotTable";
import { useAuth } from "contexts/AuthContext"; // Import auth context

const TABLE_TYPES = ["customer", "salesperson", "state", "category"];

// Indian financial year: April of startYear through March of startYear+1.
function currentFyStartYear() {
  const now = new Date();
  const month = now.getMonth() + 1;
  return month >= 4 ? now.getFullYear() : now.getFullYear() - 1;
}

function fyLabel(startYear) {
  return `FY ${startYear}-${String(startYear + 1).slice(-2)}`;
}

export default function MonthlyReportPage() {
  const { user } = useAuth(); // Get user from auth context
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

  // Financial-year filter — defaults to the current FY, changeable via the
  // dropdown at the top right. Applies to every table on this page.
  const [selectedFy, setSelectedFy] = useState(() => currentFyStartYear());
  const fyOptions = useMemo(() => {
    const start = currentFyStartYear();
    const opts = [];
    for (let y = start; y >= 2024; y--) opts.push(y);
    return opts;
  }, []);

  // ✅ Check if user is 3ASenrise
  const is3ASenrise = user?.role === '3ASenrise';
  const forcedCategory = is3ASenrise ? '3A Chemicals' : null;

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

    if (!is3ASenrise) {
      fetchCategories();
    }
  }, [is3ASenrise]);

  const buildUrl = (type, category, fy) => {
    const params = new URLSearchParams({ type, fy: String(fy) });
    if (category) params.set("category", category);
    return `/api/category/monthlySales?${params.toString()}`;
  };

  // Fetches every visible table type in parallel for the given financial year,
  // respecting each table's own category filter (or the forced 3A filter).
  const fetchAllTypes = async (fy, { showSkeleton = false } = {}) => {
    if (showSkeleton) setInitialLoad(true);
    try {
      const typesToFetch = is3ASenrise ? ["customer"] : TABLE_TYPES;
      typesToFetch.forEach((type) =>
        setLoading((prev) => ({ ...prev, [type]: true }))
      );

      const results = await Promise.all(
        typesToFetch.map(async (type) => {
          const category =
            type === "category" ? "" : forcedCategory || categoryFilters[type] || "";
          const res = await fetch(buildUrl(type, category, fy));
          const json = await res.json();
          return [type, json];
        })
      );

      setData((prev) => {
        const next = { ...prev };
        results.forEach(([type, json]) => {
          next[type] = json;
        });
        return next;
      });
    } catch (error) {
      console.error("Error fetching sales data:", error);
    } finally {
      if (showSkeleton) setInitialLoad(false);
      setLoading({
        customer: false,
        salesperson: false,
        state: false,
        category: false,
      });
    }
  };

  // Initial data fetch (full-page skeleton)
  useEffect(() => {
    if (!user) return;
    fetchAllTypes(selectedFy, { showSkeleton: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, is3ASenrise, forcedCategory]);

  // Re-fetch every table (per-card spinners, not the full skeleton) whenever
  // the financial year changes — skip the very first run, since the effect
  // above already covers the initial load.
  const didMountFy = useRef(false);
  useEffect(() => {
    if (!user) return;
    if (!didMountFy.current) {
      didMountFy.current = true;
      return;
    }
    fetchAllTypes(selectedFy, { showSkeleton: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFy]);

  // Fetch filtered data when category filter changes
  const fetchFilteredData = async (type, category) => {
    setLoading((prev) => ({ ...prev, [type]: true }));
    try {
      // ✅ For 3ASenrise, always use forced category
      const finalCategory = forcedCategory || category;
      const res = await fetch(buildUrl(type, finalCategory, selectedFy));
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

  const renderCategoryDropdown = (type) => {
    // ✅ Hide dropdown for 3ASenrise users
    if (is3ASenrise) {
      return (
        <div className="mb-2">
          <span className="badge bg-success">Filtered by: 3A Chemicals</span>
        </div>
      );
    }

    return (
      <div className="mb-2 d-flex align-items-center gap-2">
        <Form.Label className="mb-0 small text-muted fw-semibold">Category</Form.Label>
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
  };

  // Enhanced loader component
  const renderLoader = () => (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
      <div className="mt-3 text-primary fw-semibold">Loading sales data...</div>
    </div>
  );

  const fySelector = (
    <div className="d-flex align-items-center gap-2">
      <Form.Label className="mb-0 small text-muted fw-semibold text-uppercase" style={{ letterSpacing: 0.5 }}>
        Financial Year
      </Form.Label>
      <Form.Select
        value={selectedFy}
        onChange={(e) => setSelectedFy(parseInt(e.target.value, 10))}
        size="sm"
        style={{ width: 150, fontWeight: 600 }}
      >
        {fyOptions.map((y) => (
          <option key={y} value={y}>
            {fyLabel(y)}
          </option>
        ))}
      </Form.Select>
    </div>
  );

  // Skeleton loader for when initial data is loading
  if (initialLoad) {
    return (
      <Container className="mt-4" fluid>
        <Card className="mb-3 shadow-sm border-0">
          <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Loading Sales Reports...</h5>
            {fySelector}
          </Card.Header>
          <Card.Body>
            {renderLoader()}
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="mt-3" fluid>
      {/* Page-level toolbar: title + financial year selector */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 px-1">
        <div className="d-flex align-items-center gap-2">
          <BarChart3 size={22} className="text-success" />
          <h4 className="mb-0 fw-bold">Category Analytics</h4>
        </div>
        {fySelector}
      </div>

      {/* ✅ Only show Category table if NOT 3ASenrise */}
      {!is3ASenrise && (
        <Card className="mb-3 shadow-sm border-0">
          <Card.Header className="bg-white py-3 px-3 border-bottom">
            <h5 className="mb-0 fw-semibold">Category-wise Monthly Sales</h5>
          </Card.Header>
          <Card.Body className="p-3">
            {loading.category ? (
              renderLoader()
            ) : (
              <MonthlyPivotTable
                data={data.category}
                columns={buildColumns(data.category[0])}
                type="category"
                categoryFilter=""
                fyLabel={fyLabel(selectedFy)}
              />
            )}
          </Card.Body>
        </Card>
      )}

      {/* CUSTOMER TABLE CARD - Always show */}
      <Card className="mb-3 shadow-sm border-0">
        <Card.Header className="bg-white py-3 px-3 border-bottom">
          <h5 className="mb-0 fw-semibold">
            Customer-wise Monthly Sales
            {is3ASenrise && <span className="ms-2 badge bg-success">3A Chemicals</span>}
          </h5>
        </Card.Header>
        <Card.Body className="p-3">
          {renderCategoryDropdown("customer")}
          {loading.customer ? (
            renderLoader()
          ) : (
            <MonthlyPivotTable
              data={data.customer}
              columns={buildColumns(data.customer[0])}
              type="customer"
              categoryFilter={forcedCategory || categoryFilters.customer}
              fyLabel={fyLabel(selectedFy)}
            />
          )}
        </Card.Body>
      </Card>

      {/* ✅ Only show Salesperson table if NOT 3ASenrise */}
      {!is3ASenrise && (
        <Card className="mb-3 shadow-sm border-0">
          <Card.Header className="bg-white py-3 px-3 border-bottom">
            <h5 className="mb-0 fw-semibold">Salesperson-wise Monthly Sales</h5>
          </Card.Header>
          <Card.Body className="p-3">
            {renderCategoryDropdown("salesperson")}
            {loading.salesperson ? (
              renderLoader()
            ) : (
              <MonthlyPivotTable
                data={data.salesperson}
                columns={buildColumns(data.salesperson[0])}
                type="salesperson"
                categoryFilter={categoryFilters.salesperson}
                fyLabel={fyLabel(selectedFy)}
              />
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}
