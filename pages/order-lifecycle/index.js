
// pages/order-lifecycle/index.js
import React, { useState, useEffect, useRef } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import RangeConfiguration from '../../components/order-lifecycle/RangeConfiguration';
import SummaryTable from '../../components/order-lifecycle/SummaryTable';
import DetailModal from '../../components/order-lifecycle/DetailModal';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DEFAULT_RANGES = [
  { id: 1, min: 0, max: 3, label: "0-3 days", color: "#10b981" },
  { id: 2, min: 4, max: 5, label: "4-5 days", color: "#f59e0b" },
  { id: 3, min: 6, max: 8, label: "6-8 days", color: "#3b82f6" },
  { id: 4, min: 9, max: 10, label: "9-10 days", color: "#8b5cf6" },
  { id: 5, min: 11, max: 999, label: "10+ days", color: "#ef4444" },
];

const OrderLifeCycle = () => {
  const [activeTab, setActiveTab] = useState("po-to-grn");
  const [customRanges, setCustomRanges] = useState([...DEFAULT_RANGES]);
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

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  const dropdownRefs = {
    salesPerson: useRef(null),
    customer: useRef(null),
    contactPerson: useRef(null),
    category: useRef(null),
  };

  useEffect(() => {
    fetchUniqueValues();
  }, [activeTab]);

  useEffect(() => {
    fetchChartData();
  }, [activeTab, filters, customRanges]);

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

      if (filters.salesPerson) params.append("salesPerson", filters.salesPerson);
      if (filters.customer) params.append("customer", filters.customer);
      if (filters.contactPerson) params.append("contactPerson", filters.contactPerson);
      if (filters.category) params.append("category", filters.category);
      params.append("ranges", JSON.stringify(customRanges));

      const res = await fetch(`${endpoint}?${params.toString()}`);
      const data = await res.json();

      const aggregated = aggregateByMonth(data.data || []);
      setChartData(aggregated);
    } catch (err) {
      console.error("Error fetching chart data:", err);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  // const aggregateByMonth = (rows) => {
  //   const monthMap = {};
  //   rows.forEach((r) => {
  //     const key = r.Month;
  //     if (!monthMap[key]) {
  //       monthMap[key] = { 
  //         month: key, 
  //         year: r.Year, 
  //         monthNumber: r.MonthNumber, 
  //         buckets: {} 
  //       };
  //     }
  //     monthMap[key].buckets[r.Bucket] = {
  //       count: Number(r.TotalCount) || 0,
  //       percentage: Number(r.Percentage) || 0,
  //     };
  //   });
    
  //   return Object.values(monthMap).sort((a, b) => {
  //     if (a.year !== b.year) return a.year - b.year;
  //     return a.monthNumber - b.monthNumber;
  //   });
  // };
  const aggregateByMonth = (rows) => {
  const monthMap = {};
  rows.forEach((r) => {
    const key = r.Month;
    if (!monthMap[key]) {
      monthMap[key] = { 
        month: key, 
        year: r.Year, 
        monthNumber: r.MonthNumber, 
        buckets: {},
        total: 0  // ✅ Initialize total
      };
    }
    monthMap[key].buckets[r.Bucket] = {
      count: Number(r.TotalCount) || 0,
      percentage: Number(r.Percentage) || 0,
    };
    // ✅ Add to total
    monthMap[key].total += Number(r.TotalCount) || 0;
  });
  
  return Object.values(monthMap).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.monthNumber - b.monthNumber;
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
        value = item.CardName;
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
    setFilters({
      salesPerson: "",
      customer: "",
      contactPerson: "",
      category: "",
    });
  };

  // const handleCellClick = (month, bucket) => {
  //   setSelectedCell({ month, bucket, tab: activeTab, filters });
  //   setShowDetailModal(true);
  // };

  const handleCellClick = (month, bucket) => {
  setSelectedCell({ 
    month, bucket, tab: activeTab, filters,
    ranges: customRanges  // Add this!
  });
  setShowDetailModal(true);
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

  // Filter suggestions based on input
  const getFilteredSuggestions = (field) => {
    const searchValue = filters[field].toLowerCase().trim();
    if (!searchValue) return suggestions[field];

    return suggestions[field].filter((item) => {
      let itemValue = "";
      switch (field) {
        case "salesPerson":
          itemValue = item.SlpName?.toLowerCase() || "";
          break;
        case "customer":
          itemValue = item.CardName?.toLowerCase() || "";
          break;
        case "contactPerson":
          itemValue = item.ContactPerson?.toLowerCase() || "";
          break;
        case "category":
          itemValue = item.ItmsGrpNam?.toLowerCase() || "";
          break;
      }
      return itemValue.includes(searchValue);
    });
  };

  // Prepare Chart.js data
  const prepareChartData = () => {
    const labels = chartData.map(m => formatMonthYear(m.month));
    
    const datasets = customRanges.map(range => {
      return {
        label: range.label,
        data: chartData.map(m => m.buckets[range.label]?.count || 0),
        backgroundColor: range.color,
        borderColor: range.color,
        borderWidth: 1,
      };
    });

    return { labels, datasets };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { font: { size: 11, weight: 600 }, color: '#374151' }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: { font: { size: 11 }, color: '#6b7280' },
        grid: { color: '#f3f4f6' }
      },
    },
    plugins: {
            datalabels: {
              display: false,
            },
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          font: { size: 11, weight: 600 },
          padding: 12,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return `${label}: ${value}`;
          },
        },
      },
    },
  };

  const renderDropdown = (field, placeholder) => {
    const filteredSuggestions = getFilteredSuggestions(field);
    
    return (
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

        {showSuggestions[field] && filteredSuggestions.length > 0 && (
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
            {filteredSuggestions.map((item, idx) => (
              <div
                key={idx}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectSuggestion(field, item);
                }}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  fontSize: 14,
                  backgroundColor: "#fff",
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

        {showSuggestions[field] && filteredSuggestions.length === 0 && filters[field] && (
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
              padding: "10px 12px",
              zIndex: 1000,
              color: "#9ca3af",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            No results found
          </div>
        )}
      </div>
    );
  };

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

          <RangeConfiguration
            customRanges={customRanges}
            onRangesChange={setCustomRanges}
            onApplyRanges={setCustomRanges}
          />

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
            <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
              ⏳ Loading data...
            </div>
          ) : chartData.length ? (
            <>
              <div style={{ height: 400, marginBottom: 32 }}>
                <Bar data={prepareChartData()} options={chartOptions} />
              </div>

              {/* Summary Table */}
              <SummaryTable
                chartData={chartData}
                customRanges={customRanges}
                onCellClick={handleCellClick}
              />
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

      {/* Detail Modal */}
      {showDetailModal && (
        <DetailModal
          show={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          selectedCell={selectedCell}
        />
      )}
    </div>
  );
};

export default OrderLifeCycle;