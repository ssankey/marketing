
// components/order-to-invoice/OrderToInvoiceChart.js
import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import Select from 'react-select';
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";
import { formatCurrency } from "utils/formatCurrency";
import OrderDetailsModal from "../../modal/OrderDetailsModalArray";
import useDailyReportData from "hooks/useDailyReportData";
import { customSelectStyles } from "../../daily-report/ChartConfig";
import RangeConfiguration from "./RangeConfiguration";
import SummaryTable from "./SummaryTable";

import {
  DEFAULT_RANGES,
  generateDayRanges,
  processOrderToInvoiceData,
  createChartData,
  createChartOptions
} from "utils/orderInvoiceUtils";

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

const OrderToInvoiceChart = () => {
  const [filters, setFilters] = useState({
    salesPerson: null,
    contactPerson: null,
    category: null,
    product: null,
    customer: null,
  });
  const [modalData, setModalData] = useState(null);
  const [modalTitle, setModalTitle] = useState("");
  const [processedChartData, setProcessedChartData] = useState([]);
  const [summaryTableData, setSummaryTableData] = useState({});
  
  // Range filter states
  const [customRanges, setCustomRanges] = useState([...DEFAULT_RANGES]);
  const [dayRanges, setDayRanges] = useState(generateDayRanges(DEFAULT_RANGES));
  const [isProcessing, setIsProcessing] = useState(false);

  const chartRef = useRef(null);

  const {
    rawData,
    loading,
    error,
    getSelectOptions,
    applyFilters
  } = useDailyReportData();

  // Handle range changes
  const handleRangesChange = (newRanges) => {
    setCustomRanges([...newRanges]);
    const newDayRanges = generateDayRanges(newRanges);
    setDayRanges(newDayRanges);
  };

  // Handle apply ranges
  const handleApplyRanges = (validatedRanges) => {
    setCustomRanges([...validatedRanges]);
    const newDayRanges = generateDayRanges(validatedRanges);
    setDayRanges(newDayRanges);
    
    // Clear processed data to trigger re-processing with new ranges
    setProcessedChartData([]);
    setSummaryTableData({});
  };

  // Process data when raw data, filters, or day ranges change
  useEffect(() => {
    if (rawData.length > 0) {
      setIsProcessing(true);
      try {
        const { chartData, summaryData } = processOrderToInvoiceData(
          rawData, 
          filters, 
          dayRanges, 
          applyFilters
        );
        setProcessedChartData(chartData);
        setSummaryTableData(summaryData);
      } catch (err) {
        console.error("Error processing data:", err);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [rawData, filters, dayRanges]);

  const handleBarClick = (monthData, rangeLabel) => {
    const records = monthData.ranges[rangeLabel]?.records || [];
    setModalData(records);
    setModalTitle(`${rangeLabel} - ${monthData.monthName} ${monthData.year}`);
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
    downloadExcel(exportData, "Order_to_Invoice_Analysis");
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  // Create chart data and options
  const chartData = createChartData(processedChartData, dayRanges);
  const chartOptions = createChartOptions(processedChartData, dayRanges, handleBarClick);

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white py-3">
        <div className="d-flex flex-column">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
            <h4 className="mb-3 mb-md-0" style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}>
              Order to Invoice Analysis
            </h4>
            
            <div className="d-flex gap-2">              
              <button 
                className="btn btn-success btn-sm d-flex align-items-center"
                onClick={handleExportAllData}
                style={{ borderRadius: "8px" }}
              >
                <i className="fas fa-file-excel me-1"></i>
                Export Data
              </button>

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
            {/* Range Filter */}
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <RangeConfiguration 
                customRanges={customRanges}
                onRangesChange={handleRangesChange}
                onApplyRanges={handleApplyRanges}
              />
            </div>

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

        {loading || isProcessing ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: "500px" }}>
            <div className="spinner-border me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span>{loading ? "Loading data..." : "Processing data..."}</span>
          </div>
        ) : processedChartData.length ? (
          <>
            <div className="chart-container mb-4" style={{ height: "500px", width: "100%" }}>
              <Bar
                ref={chartRef}
                data={chartData}
                options={chartOptions}
              />
            </div>

            <SummaryTable 
              processedChartData={processedChartData}
              dayRanges={dayRanges}
              onBarClick={handleBarClick}
            />
          </>
        ) : (
          <p className="text-center mt-4">No data available with valid SO Date and Invoice Date.</p>
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

export default OrderToInvoiceChart;