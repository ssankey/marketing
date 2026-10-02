// components/daily-report/DailyInvoiceChart.js
import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { formatCurrency } from "utils/formatCurrency";
import DailyInvoiceDetailsModalSlim from "../modal/DailyInvoiceDetailsModalSlim";
import { customSelectStyles } from "./ChartConfig";

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

const BAR_COLOR = "#124f94";

const DailyInvoiceChart = () => {
  const [filters, setFilters] = useState({
    salesPerson: null,
    contactPerson: null,
    category: null,
    product: null,
    customer: null,
    selectedMonth: null,
  });

  const [filterOptions, setFilterOptions] = useState({
    salesPersons: [],
    contactPersons: [],
    categories: [],
    customers: [],
    availableMonths: []
  });

  const [metric, setMetric] = useState("invoiceCount"); // "invoiceCount" | "invoiceValue"
  const [modalData, setModalData] = useState(null);
  const [modalTitle, setModalTitle] = useState("");
  const [barSummary, setBarSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);

  const chartRef = useRef(null);

  useEffect(() => { fetchFilterOptions(); }, []);

  useEffect(() => {
    if (filters.selectedMonth !== null) fetchChartData();
  }, [filters]);

  const fetchFilterOptions = async () => {
  try {
    const token = localStorage.getItem("token");

    const [salesPersons, contactPersons, categories, customers, availableMonths] = await Promise.all([
      fetch("/api/unique/salespersons",      { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/unique/contact-persons",   { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/unique/categories",        { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/unique/customers",         { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/daily-invoice/available-months", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]);

    // 👇 FIX: Properly handle the response
    const availableMonthsArray = Array.isArray(availableMonths) 
      ? availableMonths 
      : availableMonths?.data || [];

    setFilterOptions({
      salesPersons:  salesPersons.data?.map(sp   => ({ value: sp.SlpCode,      label: sp.SlpName       })) || [],
      contactPersons: contactPersons.data?.map(cp => ({ value: cp.CntctCode,   label: cp.ContactPerson })) || [],
      categories:    categories.data?.map(cat    => ({ value: cat.ItmsGrpCod,  label: cat.ItmsGrpNam   })) || [],
      customers:     customers.data?.map(cust    => ({ value: cust.CardCode,   label: cust.CardName    })) || [],
      availableMonths: availableMonthsArray  // 👈 USE THIS
    });

    const now = new Date();
    const currentMonthOption = availableMonthsArray.find(
      m => m.year === now.getFullYear() && m.monthNumber === now.getMonth() + 1
    );
    setFilters(prev => ({
      ...prev,
      selectedMonth: currentMonthOption || (availableMonthsArray.length > 0 ? availableMonthsArray[0] : null)
    }));
  } catch (err) {
    console.error("Error fetching filter options:", err);
  }
};

  const loadProductOptions = async (inputValue) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/unique/products", { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();

      const allProducts = data.data?.map(prod => ({
        value: prod.ItemCode,
        label: `${prod.ItemCode}: ${prod.ItemName}${prod.CasNo ? ' - ' + prod.CasNo : ''}`,
        itemCode: prod.ItemCode,
        itemName: prod.ItemName,
        casNo: prod.CasNo
      })) || [];

      if (!inputValue) return allProducts.slice(0, 50);
      const s = inputValue.toLowerCase();
      return allProducts.filter(p =>
        p.itemCode.toLowerCase().includes(s) ||
        p.itemName.toLowerCase().includes(s) ||
        (p.casNo && p.casNo.toLowerCase().includes(s))
      ).slice(0, 50);
    } catch (err) {
      console.error("Error loading products:", err);
      return [];
    }
  };

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (filters.selectedMonth) {
        params.append('year',  filters.selectedMonth.year);
        params.append('month', filters.selectedMonth.monthNumber);
      }
      if (filters.salesPerson)   params.append('slpCode',    filters.salesPerson);
      if (filters.contactPerson) params.append('cntctCode',  filters.contactPerson);
      if (filters.category)      params.append('itmsGrpCod', filters.category);
      if (filters.product)       params.append('itemCode',   filters.product);
      if (filters.customer)      params.append('cardCode',   filters.customer);

      const response = await fetch(`/api/daily-invoice/chart-data?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch chart data");

      setChartData(await response.json());
    } catch (err) {
      console.error("Error fetching chart data:", err);
      setError(err.message);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBarClick = async (day) => {
    if (!filters.selectedMonth) return;

    const dayData = chartData.find(item => item.day === day);
  setBarSummary({ invoiceCount: dayData?.invoiceCount ?? 0, totalValue: dayData?.totalValue ?? 0 });


    try {
      setLoadingModal(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append('year',  filters.selectedMonth.year);
      params.append('month', filters.selectedMonth.monthNumber);
      params.append('day',   day);

      if (filters.salesPerson)   params.append('slpCode',    filters.salesPerson);
      if (filters.contactPerson) params.append('cntctCode',  filters.contactPerson);
      if (filters.category)      params.append('itmsGrpCod', filters.category);
      if (filters.product)       params.append('itemCode',   filters.product);
      if (filters.customer)      params.append('cardCode',   filters.customer);

      const response = await fetch(`/api/daily-invoice/modal-data-slim?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch modal data");

      setModalData(await response.json());
      setModalTitle(`Invoices - ${day} ${filters.selectedMonth.monthName} ${filters.selectedMonth.year}`);
    } catch (err) {
      console.error("Error fetching modal data:", err);
      alert("Failed to load data. Please try again.");
    } finally {
      setLoadingModal(false);
    }
  };

  const handleFilterChange = (filterType, selectedOption) => {
    setFilters(prev => ({ ...prev, [filterType]: selectedOption ? selectedOption.value : null }));
  };

  const handleMonthChange = (selectedOption) => {
    setFilters(prev => ({ ...prev, selectedMonth: selectedOption ? selectedOption.value : null }));
  };

  const clearAllFilters = () => {
    setFilters(prev => ({
      salesPerson: null, contactPerson: null, category: null,
      product: null, customer: null, selectedMonth: prev.selectedMonth,
    }));
  };

  const handleResetAll = () => {
    const now = new Date();
    const currentMonthOption = filterOptions.availableMonths.find(
      m => m.year === now.getFullYear() && m.monthNumber === now.getMonth() + 1
    );
    setFilters({
      salesPerson: null, contactPerson: null, category: null,
      product: null, customer: null,
      selectedMonth: currentMonthOption || (filterOptions.availableMonths.length > 0 ? filterOptions.availableMonths[0] : null),
    });
  };

  const getSelectedProductOption = () => {
    if (!filters.product) return null;
    return { value: filters.product, label: filters.product };
  };

  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => key !== 'selectedMonth' && value !== null
  ).length;

  const isInvoiceValue = metric === "invoiceValue";

  const chartJsData = {
    labels: chartData.map(item => item.day),
    datasets: [{
      label: isInvoiceValue ? "Invoice Value" : "Number of Invoices",
      data: chartData.map(item => isInvoiceValue ? item.totalValue : item.invoiceCount),
      backgroundColor: `${BAR_COLOR}cc`,
      borderColor: BAR_COLOR,
      borderWidth: 1,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: { display: false },
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: (context) => {
            const d = chartData[context.dataIndex];
            return isInvoiceValue
              ? `Invoice Value: ${formatCurrency(d?.totalValue || 0)}`
              : `Invoices: ${d?.invoiceCount || 0}`;
          },
          afterLabel: (context) => {
            const d = chartData[context.dataIndex];
            return isInvoiceValue
              ? `Invoice Count: ${d?.invoiceCount || 0}`
              : `Total Value: ${formatCurrency(d?.totalValue || 0)}`;
          }
        }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) handleBarClick(chartData[elements[0].index].day);
    },
    onHover: (event, elements) => {
      const target = event.native?.target || event.target;
      if (target) target.style.cursor = elements.length > 0 ? "pointer" : "default";
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: isInvoiceValue ? "Invoice Value (₹)" : "Number of Invoices" },
        ticks: { callback: (value) => isInvoiceValue ? formatCurrency(value) : value }
      },
      x: { title: { display: true, text: "Day of Month" } }
    }
  };

  // Shared toggle button style
  const toggleBtn = (active) => ({
    fontSize: "0.8rem",
    padding: "4px 12px",
    border: `1px solid ${BAR_COLOR}`,
    backgroundColor: active ? BAR_COLOR : "transparent",
    color: active ? "#fff" : BAR_COLOR,
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    transition: "all 0.15s ease",
  });

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white py-3">
        <div className="d-flex flex-column">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">

            {/* Title + metric toggle */}
            <div className="d-flex align-items-center gap-3 mb-3 mb-md-0">
              <h4 className="mb-0" style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}>
                Daily Invoice Report
              </h4>
              <div role="group" aria-label="Chart metric toggle" style={{ display: "flex" }}>
                <button
                  type="button"
                  onClick={() => setMetric("invoiceCount")}
                  style={{ ...toggleBtn(metric === "invoiceCount"), borderRadius: "8px 0 0 8px" }}
                >
                  No of Invoices
                </button>
                <button
                  type="button"
                  onClick={() => setMetric("invoiceValue")}
                  style={{ ...toggleBtn(metric === "invoiceValue"), borderRadius: "0 8px 8px 0", borderLeft: "none" }}
                >
                  Invoice Value
                </button>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-danger btn-sm d-flex align-items-center"
                onClick={handleResetAll}
                style={{ borderRadius: "8px" }}
              >
                <i className="fas fa-redo me-1"></i> Reset All
              </button>
              {activeFiltersCount > 0 && (
                <button
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                  onClick={clearAllFilters}
                  style={{ borderRadius: "8px" }}
                >
                  <i className="fas fa-times me-1"></i> Clear Filters ({activeFiltersCount})
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="row g-3">
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <div className="filter-group">
                <label className="form-label text-muted small fw-medium mb-1">Month</label>
                <Select
                  options={filterOptions.availableMonths?.map(m => ({ value: m, label: `${m.monthName} ${m.year}` })) || []}
                  value={filters.selectedMonth ? { value: filters.selectedMonth, label: `${filters.selectedMonth.monthName} ${filters.selectedMonth.year}` } : null}
                  onChange={handleMonthChange}
                  placeholder="Select Month"
                  isClearable={false}
                  isSearchable={false}
                  styles={customSelectStyles}
                />
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <div className="filter-group">
                <label className="form-label text-muted small fw-medium mb-1">Sales Person</label>
                <Select
                  options={filterOptions.salesPersons}
                  value={filterOptions.salesPersons.find(sp => sp.value === filters.salesPerson) || null}
                  onChange={(o) => handleFilterChange('salesPerson', o)}
                  placeholder="All Sales Person"
                  isClearable isSearchable styles={customSelectStyles}
                />
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <div className="filter-group">
                <label className="form-label text-muted small fw-medium mb-1">Contact Person</label>
                <Select
                  options={filterOptions.contactPersons}
                  value={filterOptions.contactPersons.find(cp => cp.value === filters.contactPerson) || null}
                  onChange={(o) => handleFilterChange('contactPerson', o)}
                  placeholder="All Contact Person"
                  isClearable isSearchable styles={customSelectStyles}
                />
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <div className="filter-group">
                <label className="form-label text-muted small fw-medium mb-1">Category</label>
                <Select
                  options={filterOptions.categories}
                  value={filterOptions.categories.find(cat => cat.value === filters.category) || null}
                  onChange={(o) => handleFilterChange('category', o)}
                  placeholder="All Category"
                  isClearable isSearchable styles={customSelectStyles}
                />
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <div className="filter-group">
                <label className="form-label text-muted small fw-medium mb-1">Product</label>
                <AsyncSelect
                  cacheOptions loadOptions={loadProductOptions} defaultOptions
                  value={getSelectedProductOption()}
                  onChange={(o) => handleFilterChange('product', o)}
                  placeholder="Search Product..."
                  isClearable styles={customSelectStyles}
                  noOptionsMessage={({ inputValue }) => inputValue ? "No products found" : "Type to search products..."}
                />
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <div className="filter-group">
                <label className="form-label text-muted small fw-medium mb-1">Customer</label>
                <Select
                  options={filterOptions.customers}
                  value={filterOptions.customers.find(c => c.value === filters.customer) || null}
                  onChange={(o) => handleFilterChange('customer', o)}
                  placeholder="All Customer"
                  isClearable isSearchable styles={customSelectStyles}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-body">
        {error && <p className="text-danger mb-3">Error: {error}</p>}
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: "500px" }}>
            <div className="spinner-border me-2" role="status"><span className="visually-hidden">Loading...</span></div>
            <span>Loading data...</span>
          </div>
        ) : chartData.length ? (
          <div className="chart-container" style={{ height: "500px", width: "100%" }}>
            <Bar ref={chartRef} data={chartJsData} options={chartOptions} />
          </div>
        ) : (
          <p className="text-center mt-4">No data available for selected month/filters.</p>
        )}
      </div>

                {modalData && (
            <DailyInvoiceDetailsModalSlim
                invoiceData={modalData}
                onClose={() => { setModalData(null); setBarSummary(null); }}
                title={modalTitle}
                barSummary={barSummary}  
            />
            )}
      {loadingModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyInvoiceChart;