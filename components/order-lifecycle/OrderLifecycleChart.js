

// components/order-lifecycle/OrderLifecycleChart.js
import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import Select from 'react-select';
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";
// import OrderDetailsModal from "../../modal/OrderDetailsModalArray";
// import OrderDetailsModal from "components/modal/OrderDetailsModalArray";
import OrderDetailsModal from "components/modal/OrderLifecycleModal";

import RangeConfiguration from "components/main-page/order-to-invoice/RangeConfiguration";
import SummaryTable from "components/order-lifecycle/SummaryTable";

import {
  DEFAULT_RANGES,
  generateDayRanges,
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

// Custom select styles
const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderRadius: '8px',
    border: '2px solid #e9ecef',
    borderColor: state.isFocused ? '#80bdff' : '#e9ecef',
    boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0,123,255,.25)' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#80bdff' : '#adb5bd'
    },
    fontSize: '14px',
    fontWeight: '500'
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#007bff' : state.isFocused ? '#f8f9fa' : 'white',
    color: state.isSelected ? 'white' : '#495057',
    fontSize: '14px',
    fontWeight: '500'
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#6c757d',
    fontSize: '14px'
  })
};

const OrderLifecycleChart = ({ data, isLoading }) => {
  // Chart type selection (PO to GRN, GRN to Invoice, Invoice to Dispatch)
  const [chartType, setChartType] = useState('po-to-grn');
  
  const [filters, setFilters] = useState({
    customer: null,
    salesPerson: null,
    contactPerson: null,
    category: null,
    financialYear: null
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

  // Get unique values for dropdowns
  const getSelectOptions = (field) => {
    if (!data || data.length === 0) return [];
    
    const fieldMapping = {
      'Customer': 'Customer',
      'Sales_Person': 'Sales_Person',
      'Contact_Person': 'Contact_Person',
      'Category': 'Category'
    };
    
    const fieldName = fieldMapping[field] || field;
    const uniqueValues = [...new Set(
      data.map(item => item[fieldName])
        .filter(value => value && value !== 'N/A' && value.toString().trim() !== '')
    )].sort();
    
    return uniqueValues.map(value => ({
      value: value,
      label: value
    }));
  };

  // Get financial years from PO dates
  const getFinancialYearOptions = () => {
    if (!data || data.length === 0) return [];
    
    const years = new Set();
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    
    data.forEach(item => {
      if (item.PO_Date) {
        const poDate = new Date(item.PO_Date);
        const poYear = poDate.getFullYear();
        const poMonth = poDate.getMonth() + 1;
        
        // Financial year starts from April (month 4)
        if (poMonth >= 4) {
          years.add(`${poYear}-${poYear + 1}`);
        } else {
          years.add(`${poYear - 1}-${poYear}`);
        }
      }
    });
    
    const sortedYears = Array.from(years).sort((a, b) => {
      const yearA = parseInt(a.split('-')[0]);
      const yearB = parseInt(b.split('-')[0]);
      return yearB - yearA; // Descending order
    });
    
    // Set current financial year as default
    const currentFinancialYear = currentMonth >= 4 
      ? `${currentYear}-${currentYear + 1}` 
      : `${currentYear - 1}-${currentYear}`;
    
    return {
      options: sortedYears.map(year => ({ value: year, label: year })),
      defaultYear: currentFinancialYear
    };
  };

  // Set default financial year on component mount
  useEffect(() => {
    if (data && data.length > 0 && !filters.financialYear) {
      const fyOptions = getFinancialYearOptions();
      if (fyOptions.defaultYear) {
        setFilters(prev => ({
          ...prev,
          financialYear: fyOptions.defaultYear
        }));
      }
    }
  }, [data]);

  // Apply filters to data
  const applyFilters = (rawData, currentFilters) => {
    return rawData.filter(item => {
      // Customer filter
      if (currentFilters.customer && item.Customer !== currentFilters.customer) {
        return false;
      }
      
      // Sales Person filter
      if (currentFilters.salesPerson && item.Sales_Person !== currentFilters.salesPerson) {
        return false;
      }
      
      // Contact Person filter
      if (currentFilters.contactPerson && item.Contact_Person !== currentFilters.contactPerson) {
        return false;
      }
      
      // Category filter
      if (currentFilters.category && item.Category !== currentFilters.category) {
        return false;
      }
      
      // Financial Year filter
      if (currentFilters.financialYear && item.PO_Date) {
        const poDate = new Date(item.PO_Date);
        const poYear = poDate.getFullYear();
        const poMonth = poDate.getMonth() + 1;
        
        const itemFinancialYear = poMonth >= 4 
          ? `${poYear}-${poYear + 1}` 
          : `${poYear - 1}-${poYear}`;
        
        if (itemFinancialYear !== currentFilters.financialYear) {
          return false;
        }
      }
      
      return true;
    });
  };

  // Process data for charts
  const processOrderLifecycleData = (rawData, currentFilters, currentDayRanges, chartTypeFilter) => {
    const filteredData = applyFilters(rawData, currentFilters);
    
    // Get the appropriate days field based on chart type
    let daysField, dateField1, dateField2;
    switch (chartTypeFilter) {
      case 'po-to-grn':
        daysField = 'PO_to_GRN_Days';
        dateField1 = 'PO_Date';
        dateField2 = 'GRN_Date';
        break;
      case 'grn-to-invoice':
        daysField = 'GRN_to_Invoice_Days';
        dateField1 = 'GRN_Date';
        dateField2 = 'Invoice_Date';
        break;
      case 'invoice-to-dispatch':
        daysField = 'Invoice_to_Dispatch_Days';
        dateField1 = 'Invoice_Date';
        dateField2 = 'Dispatch_Date';
        break;
      default:
        daysField = 'PO_to_GRN_Days';
        dateField1 = 'PO_Date';
        dateField2 = 'GRN_Date';
    }

    // Filter records with valid data
    const validRecords = filteredData.filter(item => {
      // Check if days field has valid value (>= 0)
      const days = item[daysField];
      return days !== null && days !== undefined && days >= 0;
    });

    // Group by month-year
    const groupedData = {};
    
    validRecords.forEach(item => {
      const primaryDate = item[dateField1] || item[dateField2];
      if (!primaryDate) return;
      
      const date = new Date(primaryDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      
      if (!groupedData[monthKey]) {
        groupedData[monthKey] = {
          monthName,
          year,
          monthKey,
          ranges: {}
        };
        
        // Initialize ranges
        currentDayRanges.forEach(range => {
          groupedData[monthKey].ranges[range.label] = {
            count: 0,
            records: []
          };
        });
      }
      
      // Categorize by day range
      const days = item[daysField];
      const matchedRange = currentDayRanges.find(range => {
        if (range.max === null) {
          return days >= range.min;
        }
        return days >= range.min && days < range.max;
      });
      
      if (matchedRange) {
        groupedData[monthKey].ranges[matchedRange.label].count++;
        groupedData[monthKey].ranges[matchedRange.label].records.push(item);
      }
    });

    // Convert to sorted array
    const chartData = Object.values(groupedData).sort((a, b) => {
      return new Date(a.monthKey + '-01') - new Date(b.monthKey + '-01');
    });

    // Create summary data
    const summaryData = {
      totalRecords: validRecords.length,
      avgDays: validRecords.length > 0 
        ? (validRecords.reduce((sum, item) => sum + item[daysField], 0) / validRecords.length).toFixed(1)
        : 0,
      maxDays: validRecords.length > 0 
        ? Math.max(...validRecords.map(item => item[daysField]))
        : 0,
      minDays: validRecords.length > 0 
        ? Math.min(...validRecords.map(item => item[daysField]))
        : 0
    };

    return { chartData, summaryData };
  };

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

  // Process data when raw data, filters, chart type, or day ranges change
  useEffect(() => {
    if (data && data.length > 0) {
      setIsProcessing(true);
      try {
        const { chartData, summaryData } = processOrderLifecycleData(
          data, 
          filters, 
          dayRanges, 
          chartType
        );
        setProcessedChartData(chartData);
        setSummaryTableData(summaryData);
      } catch (err) {
        console.error("Error processing data:", err);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [data, filters, dayRanges, chartType]);

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
    const fyOptions = getFinancialYearOptions();
    setFilters({
      customer: null,
      salesPerson: null,
      contactPerson: null,
      category: null,
      financialYear: fyOptions.defaultYear // Keep default financial year
    });
  };

  const handleExportAllData = () => {
    const exportData = applyFilters(data, filters);
    downloadExcel(exportData, "Order_Lifecycle_Analysis");
  };

  // Get chart title based on type
  const getChartTitle = () => {
    switch (chartType) {
      case 'po-to-grn':
        return 'PO to GRN Days Analysis';
      case 'grn-to-invoice':
        return 'GRN to Invoice Days Analysis';
      case 'invoice-to-dispatch':
        return 'Invoice to Dispatch Days Analysis';
      default:
        return 'Order Lifecycle Analysis';
    }
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value && value !== getFinancialYearOptions().defaultYear
  ).length;

  // Create chart data and options
  const chartData = createChartData(processedChartData, dayRanges);
  const chartOptions = createChartOptions(processedChartData, dayRanges, handleBarClick);

  if (isLoading) {
    return (
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body d-flex justify-content-center align-items-center" style={{ height: "500px" }}>
          <div className="text-center">
            <div className="spinner-border me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span>Loading chart data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
          <div className="text-center">
            <h5 className="text-muted mb-2">No data available for chart</h5>
            <p className="text-muted">Try adjusting your filters or date range</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white py-3">
        <div className="d-flex flex-column">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
            <h4 className="mb-3 mb-md-0" style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}>
              {getChartTitle()}
            </h4>
            
            <div className="d-flex gap-2">              
              

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

          {/* Chart Type Selection Buttons */}
          <div className="d-flex gap-2 mb-3 flex-wrap">
            <button
              onClick={() => setChartType('po-to-grn')}
              className={`btn btn-sm ${chartType === 'po-to-grn' ? 'btn-primary' : 'btn-outline-secondary'}`}
              style={{ borderRadius: "8px" }}
            >
              PO to GRN Days
            </button>
            <button
              onClick={() => setChartType('grn-to-invoice')}
              className={`btn btn-sm ${chartType === 'grn-to-invoice' ? 'btn-primary' : 'btn-outline-secondary'}`}
              style={{ borderRadius: "8px" }}
            >
              GRN to Invoice Days
            </button>
            <button
              onClick={() => setChartType('invoice-to-dispatch')}
              className={`btn btn-sm ${chartType === 'invoice-to-dispatch' ? 'btn-primary' : 'btn-outline-secondary'}`}
              style={{ borderRadius: "8px" }}
            >
              Invoice to Dispatch Days
            </button>
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

            {/* Financial Year Filter */}
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <div className="filter-group">
                <label className="form-label text-muted small fw-medium mb-1">Financial Year</label>
                <Select
                  options={getFinancialYearOptions().options}
                  value={filters.financialYear ? { value: filters.financialYear, label: filters.financialYear } : null}
                  onChange={(selectedOption) => handleFilterChange('financialYear', selectedOption)}
                  placeholder="Select Year"
                  isClearable={false}
                  isSearchable={false}
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
                  placeholder="All Customers"
                  isClearable
                  isSearchable
                  styles={customSelectStyles}
                />
              </div>
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
                  placeholder="All Categories"
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
        {isProcessing ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: "500px" }}>
            <div className="spinner-border me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span>Processing data...</span>
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
              chartType={chartType}
            />
          </>
        ) : (
          <p className="text-center mt-4">No data available with valid dates and days calculation.</p>
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

export default OrderLifecycleChart;