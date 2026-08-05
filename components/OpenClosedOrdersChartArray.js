// components/OpenClosedOrdersChartArray.js
import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";
import { useRouter } from "next/router";
import Select from "react-select";
import OrderDetailsModal from "./modal/OrderDetailsModalArray";

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

const monthMapping = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};

const formatMonthYear = (year, month) => {
  const monthIndex = monthMapping[month];
  if (monthIndex === undefined) return "Invalid Date";
  const date = new Date(year, monthIndex);
  return date.toLocaleDateString("default", { month: "short", year: "numeric" });
};

const OpenPartialOrdersChart = () => {
  const [rawData, setRawData] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    salesPerson: null,
    contactPerson: null,
    category: null,
    product: null,
    customer: null,
  });
  const [modalData, setModalData] = useState(null);
  const [modalTitle, setModalTitle] = useState("");

  const chartRef = useRef(null);
  const router = useRouter();

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const response = await fetch("/api/monthly-open-partial-array", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await response.json();
      
      // Filter out records where Invoice_No is not "N/A"
      const filteredData = data.filter(record => record.Invoice_No === "N/A");
      
      setRawData(filteredData);
      processChartData(filteredData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
      setRawData([]);
      setProcessedData([]);
    } finally {
      setLoading(false);
    }
  };

  // Process data for chart
  const processChartData = (data) => {
    // Apply filters
    let filteredData = data;
    
    if (filters.salesPerson) {
      filteredData = filteredData.filter(record => record.Sales_Person === filters.salesPerson);
    }
    if (filters.contactPerson) {
      filteredData = filteredData.filter(record => record.Contact_Person === filters.contactPerson);
    }
    if (filters.category) {
      filteredData = filteredData.filter(record => record.Category === filters.category);
    }
    if (filters.product) {
      filteredData = filteredData.filter(record => record.Item_No === filters.product);
    }
    if (filters.customer) {
      filteredData = filteredData.filter(record => record.Customer === filters.customer);
    }

    // Group by Year and Month
    const groupedData = {};
    
    filteredData.forEach(record => {
      const key = `${record.Year}-${record.Month}`;
      
      if (!groupedData[key]) {
        groupedData[key] = {
          year: record.Year,
          month: record.Month,
          monthNumber: record.MonthNumber,
          openOrders: new Set(),
          partialOrders: new Set(),
          openLineItems: 0,
          partialLineItems: 0,
          openValue: 0,
          partialValue: 0,
        };
      }
      
      const group = groupedData[key];
      
      // Count unique SO numbers for Open and Partial orders
      if (record.Status_Header === "Open") {
        group.openOrders.add(record.SO_No);
        
        // Count line items and value for Open orders where Status_Line is "Open"
        if (record.Status_Line === "Open") {
          group.openLineItems++;
          group.openValue += record.Total_Price;
        }
      } else if (record.Status_Header === "Partial") {
        group.partialOrders.add(record.SO_No);
        
        // Count line items and value for Partial orders where Status_Line is "Open"
        if (record.Status_Line === "Open") {
          group.partialLineItems++;
          group.partialValue += record.Total_Price;
        }
      }
    });

    // Convert to array and sort by date
    const processedArray = Object.values(groupedData).map(group => ({
      ...group,
      openOrders: group.openOrders.size,
      partialOrders: group.partialOrders.size,
    })).sort((a, b) => {
      const dateA = new Date(a.year, a.monthNumber - 1);
      const dateB = new Date(b.year, b.monthNumber - 1);
      return dateA - dateB;
    });

    setProcessedData(processedArray);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (rawData.length > 0) {
      processChartData(rawData);
    }
  }, [filters, rawData]);

  const handleBarClick = (year, month, status) => {
    // Filter data based on the clicked bar
    let filteredData = rawData;

    // Apply current filters
    if (filters.salesPerson) {
      filteredData = filteredData.filter(record => record.Sales_Person === filters.salesPerson);
    }
    if (filters.contactPerson) {
      filteredData = filteredData.filter(record => record.Contact_Person === filters.contactPerson);
    }
    if (filters.category) {
      filteredData = filteredData.filter(record => record.Category === filters.category);
    }
    if (filters.product) {
      filteredData = filteredData.filter(record => record.Item_No === filters.product);
    }
    if (filters.customer) {
      filteredData = filteredData.filter(record => record.Customer === filters.customer);
    }

    // Filter by year, month, and status
    const modalRecords = filteredData.filter(record => {
      const isCorrectMonth = record.Year === year && record.Month === month;
      const isCorrectStatus = status === "open" 
        ? record.Status_Header === "Open" && record.Status_Line === "Open"
        : record.Status_Header === "Partial" && record.Status_Line === "Open";
      
      return isCorrectMonth && isCorrectStatus;
    });

    setModalData(modalRecords);
    setModalTitle(`${status === "open" ? "Open" : "Partial"} Orders - ${formatMonthYear(year, month)}`);
  };

  const labels = processedData.map((d) => formatMonthYear(d.year, d.month));

  const colorPalette = {
    open: "#0d6efd",
    partial: "#ffc107",
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: "Open Orders",
        data: processedData.map((d) => d.openOrders || 0),
        backgroundColor: colorPalette.open,
        borderColor: colorPalette.open,
        borderWidth: 1,
        barPercentage: 1,
        categoryPercentage: 0.7,
      },
      {
        label: "Partial Orders",
        data: processedData.map((d) => d.partialOrders || 0),
        backgroundColor: colorPalette.partial,
        borderColor: colorPalette.partial,
        borderWidth: 1,
        barPercentage: 1,
        categoryPercentage: 0.7,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#212529",
        bodyFont: {
          size: 14,
          weight: 'bold'
        },
        titleFont: {
          size: 16,
          weight: 'bold'
        },
        padding: 16,
        callbacks: {
          label: (context) => {
            const datasetLabel = context.dataset.label;
            const dataIndex = context.dataIndex;
            const dataPoint = processedData[dataIndex];

            if (datasetLabel === "Open Orders") {
              return [
                `Open Orders: ${dataPoint.openOrders}`,
                `Line Items: ${dataPoint.openLineItems}`,
                `Value: ${formatCurrency(dataPoint.openValue)}`
              ];
            } else if (datasetLabel === "Partial Orders") {
              return [
                `Partial Orders: ${dataPoint.partialOrders}`,
                `Line Items: ${dataPoint.partialLineItems}`,
                `Value: ${formatCurrency(dataPoint.partialValue)}`
              ];
            }
            return `${datasetLabel}: ${context.raw}`;
          },
        },
      },
      legend: {
        position: "top",
      },
    },
    scales: {
      x: {
        stacked: false,
      },
      y: {
        stacked: false,
        beginAtZero: true,
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const dataIndex = element.index;
        const datasetIndex = element.datasetIndex;
        const { year, month } = processedData[dataIndex];
        const status = datasetIndex === 0 ? "open" : "partial";
        handleBarClick(year, month, status);
      }
    },
    onHover: (event, chartElement) => {
      const target = event.native?.target || event.target;
      if (target && chartElement.length) {
        target.style.cursor = 'pointer';
      } else if (target) {
        target.style.cursor = 'default';
      }
    },
  };

  // Get unique values for filters
  const getUniqueValues = (field) => {
    return [...new Set(rawData.map(record => record[field]))].filter(Boolean);
  };

  // Convert unique values to react-select format
  const getSelectOptions = (field) => {
    return getUniqueValues(field).map(value => ({
      value,
      label: value
    }));
  };

  const handleFilterChange = (filterType, selectedOption) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: selectedOption ? selectedOption.value : null
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      salesPerson: null,
      contactPerson: null,
      category: null,
      product: null,
      customer: null,
    });
  };

  const handleExportAllData = () => {
    // Apply current filters to the raw data
    let filteredData = rawData;
    
    if (filters.salesPerson) {
      filteredData = filteredData.filter(record => record.Sales_Person === filters.salesPerson);
    }
    if (filters.contactPerson) {
      filteredData = filteredData.filter(record => record.Contact_Person === filters.contactPerson);
    }
    if (filters.category) {
      filteredData = filteredData.filter(record => record.Category === filters.category);
    }
    if (filters.product) {
      filteredData = filteredData.filter(record => record.Item_No === filters.product);
    }
    if (filters.customer) {
      filteredData = filteredData.filter(record => record.Customer === filters.customer);
    }

    // Only export records where Status_Line is "Open"
    const exportData = filteredData.filter(record => record.Status_Line === "Open");

    downloadExcel(exportData, "Monthly_Open_Orders_Complete");
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      borderRadius: "8px",
      border: "1px solid #e0e0e0",
      fontSize: "0.875rem",
      minHeight: "32px",
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: "#b0b0b0",
      },
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: "0.875rem",
      padding: "8px 12px",
    }),
    placeholder: (provided) => ({
      ...provided,
      fontSize: "0.875rem",
    }),
    singleValue: (provided) => ({
      ...provided,
      fontSize: "0.875rem",
    }),
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white py-3">
        <div className="d-flex flex-column">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
            <h4 className="mb-3 mb-md-0" style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}>
              Monthly Orders (Open & Partial)
            </h4>
            
            <div className="d-flex gap-2">
              {/* Excel Export Button */}
              <button 
                className="btn btn-success btn-sm d-flex align-items-center"
                onClick={handleExportAllData}
                style={{ borderRadius: "8px" }}
              >
                <i className="fas fa-file-excel me-1"></i>
                Export All Data
              </button>

              {/* Clear filters button */}
              {activeFiltersCount > 0 && (
                <button 
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                  onClick={clearAllFilters}
                  style={{ borderRadius: "8px" }}
                >
                  <i className="fas fa-times me-1"></i>
                  Clear All Filters ({activeFiltersCount})
                </button>
              )}
            </div>
          </div>
          
          {/* Enhanced Filters Section */}
          <div className="filters-section">
            <div className="row g-3">
              <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                <div className="filter-group">
                  <label className="form-label text-muted small fw-medium mb-1">Sales Person</label>
                  <Select
                    options={getSelectOptions('Sales_Person')}
                    value={filters.salesPerson ? { value: filters.salesPerson, label: filters.salesPerson } : null}
                    onChange={(selectedOption) => handleFilterChange('salesPerson', selectedOption)}
                    placeholder="All Sales Person"
                    isClearable
                    isSearchable
                    styles={customSelectStyles}
                  />
                </div>
              </div>
              
              <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                <div className="filter-group">
                  <label className="form-label text-muted small fw-medium mb-1">Contact Person</label>
                  <Select
                    options={getSelectOptions('Contact_Person')}
                    value={filters.contactPerson ? { value: filters.contactPerson, label: filters.contactPerson } : null}
                    onChange={(selectedOption) => handleFilterChange('contactPerson', selectedOption)}
                    placeholder="All Contact Person"
                    isClearable
                    isSearchable
                    styles={customSelectStyles}
                  />
                </div>
              </div>
              
              <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                <div className="filter-group">
                  <label className="form-label text-muted small fw-medium mb-1">Category</label>
                  <Select
                    options={getSelectOptions('Category')}
                    value={filters.category ? { value: filters.category, label: filters.category } : null}
                    onChange={(selectedOption) => handleFilterChange('category', selectedOption)}
                    placeholder="All Category"
                    isClearable
                    isSearchable
                    styles={customSelectStyles}
                  />
                </div>
              </div>
              
              <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                <div className="filter-group">
                  <label className="form-label text-muted small fw-medium mb-1">Product</label>
                  <Select
                    options={getSelectOptions('Item_No')}
                    value={filters.product ? { value: filters.product, label: filters.product } : null}
                    onChange={(selectedOption) => handleFilterChange('product', selectedOption)}
                    placeholder="All Product"
                    isClearable
                    isSearchable
                    styles={customSelectStyles}
                  />
                </div>
              </div>
              
              <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                <div className="filter-group">
                  <label className="form-label text-muted small fw-medium mb-1">Customer</label>
                  <Select
                    options={getSelectOptions('Customer')}
                    value={filters.customer ? { value: filters.customer, label: filters.customer } : null}
                    onChange={(selectedOption) => handleFilterChange('customer', selectedOption)}
                    placeholder="All Customer"
                    isClearable
                    isSearchable
                    styles={customSelectStyles}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-body">
        {error && <p className="text-danger mb-3">Error: {error}</p>}

        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: "500px" }}>
            <div className="spinner-border me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span>Loading chart data...</span>
          </div>
        ) : processedData.length ? (
          <div className="chart-container" style={{ height: "500px", width: "100%" }}>
            <Bar
              ref={chartRef}
              data={chartData}
              options={chartOptions}
            />
          </div>
        ) : (
          <p className="text-center mt-4">No data available.</p>
        )}
      </div>

      {/* Modal for displaying order details */}
      {modalData && (
        <OrderDetailsModal
          orderData={modalData}
          onClose={() => setModalData(null)}
          title={modalTitle}
        />
      )}
      
      <style jsx>{`
        .filters-section {
          background: #f8f9fa;
          padding: 1.25rem;
          border-radius: 10px;
          border: 1px solid #e9ecef;
        }
        
        @media (max-width: 768px) {
          .filters-section {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default OpenPartialOrdersChart;