

// components/daily-report/DailyReportChart.js
import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import Select from 'react-select';
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";
import { formatCurrency } from "utils/formatCurrency";
import OrderDetailsModal from "../modal/OrderDetailsModalArray";
import useDailyReportData from "hooks/useDailyReportData";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DailyReportChart = () => {
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

  const {
    rawData,
    processedData,
    loading,
    error,
    availableMonths,
    selectedMonth,
    setSelectedMonth,
    processChartData,
    getSelectOptions,
    applyFilters
  } = useDailyReportData();

  useEffect(() => {
    if (rawData.length > 0 && selectedMonth) {
      processChartData(rawData, filters, selectedMonth);
    }
  }, [filters, rawData, selectedMonth]);

  const handleBarClick = (day) => {
    // Apply current filters to raw data
    const filteredData = applyFilters(rawData, filters);

    // Filter by selected month and day
    const modalRecords = filteredData.filter(record => 
      record.Year === selectedMonth.year && 
      record.MonthNumber === selectedMonth.monthNumber &&
      record.Day === day
    );

    setModalData(modalRecords);
    setModalTitle(`Orders - ${day} ${selectedMonth.monthName} ${selectedMonth.year}`);
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
    const exportData = applyFilters(rawData, filters);
    downloadExcel(exportData, "Daily_Orders_Report");
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  // Create chart data
  const chartData = {
    labels: processedData.map(item => item.day),
    datasets: [
      {
        label: 'Number of Orders',
        data: processedData.map(item => item.orderCount),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }
    ]
  };

  // Create chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        display: false,
      },
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          afterLabel: (context) => {
            const day = context.label;
            const dayData = processedData.find(d => d.day.toString() === day);
            return `Total Value: ${formatCurrency(dayData?.totalValue || 0)}`;
          }
        }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const day = processedData[index].day;
        handleBarClick(day);
      }
    },
    onHover: (event, elements) => {
      const target = event.native?.target || event.target;
      if (target) {
        if (elements.length > 0) {
          target.style.cursor = 'pointer';
        } else {
          target.style.cursor = 'default';
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Orders'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Day of Month'
        }
      }
    }
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white py-3">
        <div className="d-flex flex-column">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
            <h4 className="mb-3 mb-md-0" style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}>
              Daily Orders Report
            </h4>
            
            <div className="d-flex gap-2">
              {/* Month Selector */}
              <div style={{ minWidth: '150px' }}>
                <Select
                  options={availableMonths.map(m => ({
                    value: m,
                    label: `${m.monthName} ${m.year}`
                  }))}
                  value={selectedMonth ? {
                    value: selectedMonth,
                    label: `${selectedMonth.monthName} ${selectedMonth.year}`
                  } : null}
                  onChange={(selectedOption) => setSelectedMonth(selectedOption?.value)}
                  placeholder="Select Month"
                  isSearchable={false}
                  styles={customSelectStyles}
                />
              </div>
              
              {/* Excel Export Button */}
              <button 
                className="btn btn-success btn-sm d-flex align-items-center"
                onClick={handleExportAllData}
                style={{ borderRadius: "8px" }}
              >
                <i className="fas fa-file-excel me-1"></i>
                Export Data
              </button>

              {/* Clear filters button */}
              {activeFiltersCount > 0 && (
                <button 
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                  onClick={clearAllFilters}
                  style={{ borderRadius: "8px" }}
                >
                  <i className="fas fa-times me-1"></i>
                  Clear Filters ({activeFiltersCount})
                </button>
              )}
            </div>
          </div>
          
          {/* Filters Section */}
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
          <p className="text-center mt-4">No data available for selected month/filters.</p>
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
    </div>
  );
};

export default DailyReportChart;