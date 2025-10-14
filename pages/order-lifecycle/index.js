

// pages/order-lifecycle/index.js
import React, { useState, useEffect, useRef } from "react";

const DEFAULT_RANGES = [
  { id: 1, min: 0, max: 3, label: "0-3 days", color: "#10b981" },
  { id: 2, min: 4, max: 5, label: "4-5 days", color: "#f59e0b" },
  { id: 3, min: 6, max: 8, label: "6-8 days", color: "#3b82f6" },
  { id: 4, min: 9, max: 10, label: "9-10 days", color: "#8b5cf6" },
  { id: 5, min: 11, max: 999, label: "10+ days", color: "#ef4444" },
];

const OrderLifeCycle = () => {
  const [activeTab, setActiveTab] = useState("po-to-grn");
  const [filters, setFilters] = useState({
    salesPerson: "",
    customer: "",
    contactPerson: "",
    category: "",
  });

  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [suggestions, setSuggestions] = useState({
    salesPerson: [],
    customer: [],
    contactPerson: [],
    category: [],
  });

  const [showSuggestions, setShowSuggestions] = useState({
    salesPerson: false,
    customer: false,
    contactPerson: false,
    category: false,
  });

  const dropdownRefs = {
    salesPerson: useRef(null),
    customer: useRef(null),
    contactPerson: useRef(null),
    category: useRef(null),
  };

  // Fetch unique values when tab changes
  useEffect(() => {
    fetchUniqueValues();
  }, [activeTab]);

  // Fetch chart data when filters or tab changes
  useEffect(() => {
    fetchChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(dropdownRefs).forEach((key) => {
        if (dropdownRefs[key].current && !dropdownRefs[key].current.contains(event.target)) {
          setShowSuggestions((prev) => ({ ...prev, [key]: false }));
        }
      });
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUniqueValues = async () => {
    try {
      const [salesRes, customersRes, contactsRes, categoriesRes] = await Promise.all([
        fetch(`/api/order-lifecycle/unique/salespersons?type=${activeTab}`),
        fetch(`/api/order-lifecycle/unique/customers?type=${activeTab}`),
        fetch(`/api/order-lifecycle/unique/contact-persons?type=${activeTab}`),
        fetch(`/api/order-lifecycle/unique/categories?type=${activeTab}`)
      ]);

      const [salesData, customersData, contactsData, categoriesData] = await Promise.all([
        salesRes.json(),
        customersRes.json(),
        contactsRes.json(),
        categoriesRes.json()
      ]);

      setSuggestions({
        salesPerson: salesData.data || [],
        customer: customersData.data || [],
        contactPerson: contactsData.data || [],
        category: categoriesData.data || [],
      });
    } catch (error) {
      console.error("Error fetching unique values:", error);
    }
  };

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const apiEndpoints = {
        "po-to-grn": "/api/order-lifecycle/po-to-grn",
        "grn-to-invoice": "/api/order-lifecycle/grn-to-invoice",
        "invoice-to-dispatch": "/api/order-lifecycle/invoice-to-dispatch",
      };

      const endpoint = apiEndpoints[activeTab];
      const params = new URLSearchParams();

      // Use names directly (no codes)
      if (filters.salesPerson) params.append("salesPerson", filters.salesPerson);
      if (filters.customer) params.append("customer", filters.customer);
      if (filters.contactPerson) params.append("contactPerson", filters.contactPerson);
      if (filters.category) params.append("category", filters.category);

      const res = await fetch(`${endpoint}?${params.toString()}`);
      const data = await res.json();

      console.log("API Response:", data);

      const aggregated = aggregateByMonth(data.data || []);
      setChartData(aggregated);
    } catch (err) {
      console.error("Error fetching chart data:", err);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const aggregateByMonth = (rows) => {
    const monthMap = {};
    rows.forEach((r) => {
      const key = r.Month;
      if (!monthMap[key]) {
        monthMap[key] = { 
          month: key, 
          year: r.Year, 
          monthNumber: r.MonthNumber, 
          buckets: {} 
        };
      }
      monthMap[key].buckets[r.Bucket] = {
        count: Number(r.TotalCount) || 0,
        percentage: Number(r.Percentage) || 0,
      };
    });
    
    return Object.values(monthMap).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.monthNumber - a.monthNumber;
    });
  };

  const handleInputChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setShowSuggestions((prev) => ({ ...prev, [field]: true }));
  };

  const handleSelectSuggestion = (field, item) => {
    let value = "";
    switch (field) {
      case "salesPerson":
        value = item.SlpName;
        break;
      case "customer":
        value = item.CardName; // Only name, no code
        break;
      case "contactPerson":
        value = item.ContactPerson;
        break;
      case "category":
        value = item.ItmsGrpNam;
        break;
    }
    setFilters((p) => ({ ...p, [field]: value }));
    setShowSuggestions((p) => ({ ...p, [field]: false }));
  };

  const handleClearFilter = (field) => {
    setFilters((p) => ({ ...p, [field]: "" }));
  };

  const handleResetAll = () => {
    setFilters({
      salesPerson: "",
      customer: "",
      contactPerson: "",
      category: "",
    });
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Reset filters when tab changes
    setFilters({
      salesPerson: "",
      customer: "",
      contactPerson: "",
      category: "",
    });
  };

  const tabs = [
    { id: "po-to-grn", label: "PO to GRN" },
    { id: "grn-to-invoice", label: "GRN to Invoice" },
    { id: "invoice-to-dispatch", label: "Invoice to Dispatch" },
  ];

  const formatMonthYear = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const renderStackedBar = (monthData) => {
    const total = Object.values(monthData.buckets).reduce((sum, b) => sum + (b.count || 0), 0);
    
    return (
      <div key={monthData.month} style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1f2937" }}>
            {formatMonthYear(monthData.month)}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>
            Total: {total}
          </span>
        </div>

        <div style={{ 
          height: 36, 
          borderRadius: 6, 
          display: "flex", 
          overflow: "hidden", 
          border: "1px solid #e5e7eb" 
        }}>
          {DEFAULT_RANGES.map((range, idx) => {
            const bucket = monthData.buckets[range.label];
            const percentage = bucket ? bucket.percentage : 0;
            if (!percentage) return null;

            return (
              <div
                key={idx}
                style={{
                  width: `${percentage}%`,
                  backgroundColor: range.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  opacity: 0.85,
                }}
                title={`${range.label}: ${bucket.count} orders (${percentage.toFixed(1)}%)`}
              >
                {percentage > 10 && `${percentage.toFixed(1)}%`}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDropdown = (field, placeholder) => (
    <div
      style={{ position: "relative", flex: 1, minWidth: 180 }}
      ref={dropdownRefs[field]}
    >
      <input
        type="text"
        value={filters[field]}
        onChange={(e) => handleInputChange(field, e.target.value)}
        onFocus={() => setShowSuggestions((p) => ({ ...p, [field]: true }))}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 32px 10px 12px",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          fontSize: 14,
          outline: "none",
        }}
      />

      {filters[field] && (
        <button
          onClick={() => handleClearFilter(field)}
          aria-label="Clear"
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 18,
            color: "#9ca3af",
            padding: 4,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}

      {showSuggestions[field] && suggestions[field]?.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            backgroundColor: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
            maxHeight: 220,
            overflowY: "auto",
            zIndex: 1000,
          }}
        >
          {suggestions[field].map((item, idx) => (
            <div
              key={idx}
              onMouseDown={() => handleSelectSuggestion(field, item)}
              style={{
                padding: "10px 12px",
                cursor: "pointer",
                fontSize: 14,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              {field === "customer" && (
                <div style={{ fontWeight: 600, color: "#111827" }}>{item.CardName}</div>
              )}
              {field === "salesPerson" && item.SlpName}
              {field === "contactPerson" && item.ContactPerson}
              {field === "category" && item.ItmsGrpNam}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const sortedLegend = [...DEFAULT_RANGES].sort((a, b) => a.min - b.min);

  return (
    <div style={{ padding: 24, minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e5e7eb",
            background: "linear-gradient(to right, #dbeafe, #bfdbfe)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1e40af" }}>
            📊 Order Life Cycle
          </h2>
        </div>

        {/* Filters */}
        <div style={{ 
          padding: "20px 24px", 
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap"
        }}>
          {renderDropdown("salesPerson", "Sales Person")}
          {renderDropdown("customer", "Customer")}
          {renderDropdown("contactPerson", "Contact Person")}
          {renderDropdown("category", "Category")}

          <button
            onClick={handleResetAll}
            style={{
              padding: "10px 16px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              minWidth: 100,
              flexShrink: 0,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            Reset All
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            borderBottom: "2px solid #e5e7eb",
            padding: "0 24px",
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              style={{
                padding: "12px 20px",
                border: "none",
                background: "transparent",
                color: activeTab === t.id ? "#2563eb" : "#6b7280",
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: 14,
                borderBottom: activeTab === t.id ? "2px solid #2563eb" : "2px solid transparent",
                marginBottom: -2,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div style={{ padding: 24 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>⏳ Loading data...</div>
          ) : chartData.length ? (
            <>
              <div style={{ maxHeight: 520, overflowY: "auto", paddingRight: 8, marginBottom: 20 }}>
                {chartData.map((m) => renderStackedBar(m))}
              </div>

              {/* Legend */}
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
                  Day Range Legend
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {sortedLegend.map((r) => (
                    <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          backgroundColor: r.color,
                          border: "1px solid rgba(0,0,0,0.1)",
                        }}
                      />
                      <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No data available</div>
              <div style={{ fontSize: 14 }}>Try adjusting filters or pick another tab.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderLifeCycle;