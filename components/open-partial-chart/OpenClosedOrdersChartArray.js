// components/open-partial-chart/OpenClosedOrdersChartArray.js
import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";
import { useRouter } from "next/router";
import OrderDetailsModal from "../modal/OrderDetailsModalArray";
import useOpenPartialOrdersData from "hooks/useOpenPartialOrdersData";
import ChartFilters from "./ChartFilters";
import { createChartData, createChartOptions, formatMonthYear } from "./ChartConfig";
import { formatCurrency } from "utils/formatCurrency";


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

const OpenPartialOrdersChart = () => {
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

  const {
    rawData,
    processedData,
    loading,
    error,
    processChartData,
    getSelectOptions,
    applyFilters
  } = useOpenPartialOrdersData();

  useEffect(() => {
    if (rawData.length > 0) {
      processChartData(rawData, filters);
    }
  }, [filters, rawData]);

  const handleBarClick = (year, month, status) => {
    // Apply current filters to raw data
    const filteredData = applyFilters(rawData, filters);

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
    // const filteredData = applyFilters(rawData, filters);

    // Only export records where Status_Line is "Open"
    // Export data in the exact same format as received from API
    // const exportData = filteredData.filter(record => record.Status_Line === "Open");
    const exportData = rawData.filter(record => record.Status_Line === "Open");

    downloadExcel(exportData, "Monthly_Open_Orders_Complete");
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const chartData = createChartData(processedData);
  const chartOptions = createChartOptions(processedData, handleBarClick);

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
          <ChartFilters
            filters={filters}
            getSelectOptions={getSelectOptions}
            handleFilterChange={handleFilterChange}
            clearAllFilters={clearAllFilters}
            activeFiltersCount={activeFiltersCount}
          />
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
    </div>
  );
};

export default OpenPartialOrdersChart;