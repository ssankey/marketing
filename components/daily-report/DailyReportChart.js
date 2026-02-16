

// // components/daily-report/DailyReportChart.js
// import React, { useState, useEffect, useRef } from "react";
// import { Bar } from "react-chartjs-2";
// import Select from 'react-select';
// import { formatDate } from "utils/formatDate";
// import downloadExcel from "utils/exporttoexcel";
// import { formatCurrency } from "utils/formatCurrency";
// import OrderDetailsModal from "../modal/OrderDetailsModalArray";
// import useDailyReportData from "hooks/useDailyReportData";
// import { customSelectStyles } from "./ChartConfig";

// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// );

// const DailyReportChart = () => {
//   const [filters, setFilters] = useState({
//     salesPerson: null,
//     contactPerson: null,
//     category: null,
//     product: null,
//     customer: null,
//   });
//   const [modalData, setModalData] = useState(null);
//   const [modalTitle, setModalTitle] = useState("");

//   const chartRef = useRef(null);

//   const {
//     rawData,
//     processedData,
//     loading,
//     error,
//     availableMonths,
//     selectedMonth,
//     setSelectedMonth,
//     processChartData,
//     getSelectOptions,
//     applyFilters
//   } = useDailyReportData();

//   useEffect(() => {
//     if (rawData.length > 0 && selectedMonth) {
//       processChartData(rawData, filters, selectedMonth);
//     }
//   }, [filters, rawData, selectedMonth]);

//   const handleBarClick = (day) => {
//     // Apply current filters to raw data
//     const filteredData = applyFilters(rawData, filters);

//     // Filter by selected month and day
//     const modalRecords = filteredData.filter(record => 
//       record.Year === selectedMonth.year && 
//       record.MonthNumber === selectedMonth.monthNumber &&
//       record.Day === day
//     );

//     setModalData(modalRecords);
//     setModalTitle(`Orders - ${day} ${selectedMonth.monthName} ${selectedMonth.year}`);
//   };

//   const handleFilterChange = (filterType, selectedOption) => {
//     setFilters(prev => ({
//       ...prev,
//       [filterType]: selectedOption ? selectedOption.value : null
//     }));
//   };

//   const clearAllFilters = () => {
//     setFilters({
//       salesPerson: null,
//       contactPerson: null,
//       category: null,
//       product: null,
//       customer: null,
//     });
//   };

//   const handleExportAllData = () => {
//     const exportData = applyFilters(rawData, filters);
//     downloadExcel(exportData, "Daily_Orders_Report");
//   };

//   const activeFiltersCount = Object.values(filters).filter(Boolean).length;

//   // Create chart data
//   const chartData = {
//     labels: processedData.map(item => item.day),
//     datasets: [
//       {
//         label: 'Number of Orders',
//         data: processedData.map(item => item.orderCount),
//         backgroundColor: 'rgba(54, 162, 235, 0.7)',
//         borderColor: 'rgba(54, 162, 235, 1)',
//         borderWidth: 1,
//       }
//     ]
//   };

//   // Create chart options
//   const chartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       datalabels: {
//         display: false,
//       },
//       legend: {
//         position: 'top',
//       },
//       tooltip: {
//         callbacks: {
//           afterLabel: (context) => {
//             const day = context.label;
//             const dayData = processedData.find(d => d.day.toString() === day);
//             return `Total Value: ${formatCurrency(dayData?.totalValue || 0)}`;
//           }
//         }
//       }
//     },
//     onClick: (event, elements) => {
//       if (elements.length > 0) {
//         const index = elements[0].index;
//         const day = processedData[index].day;
//         handleBarClick(day);
//       }
//     },
//     onHover: (event, elements) => {
//       const target = event.native?.target || event.target;
//       if (target) {
//         if (elements.length > 0) {
//           target.style.cursor = 'pointer';
//         } else {
//           target.style.cursor = 'default';
//         }
//       }
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         title: {
//           display: true,
//           text: 'Number of Orders'
//         }
//       },
//       x: {
//         title: {
//           display: true,
//           text: 'Day of Month'
//         }
//       }
//     }
//   };

//   return (
//     <div className="card shadow-sm border-0 mb-4">
//       <div className="card-header bg-white py-3">
//         <div className="d-flex flex-column">
//           <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
//             <h4 className="mb-3 mb-md-0" style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}>
//               Daily Orders Report
//             </h4>
            
//             <div className="d-flex gap-2">
//               {/* Month Selector */}
//               <div style={{ minWidth: '150px' }}>
//                 <Select
//                   options={availableMonths.map(m => ({
//                     value: m,
//                     label: `${m.monthName} ${m.year}`
//                   }))}
//                   value={selectedMonth ? {
//                     value: selectedMonth,
//                     label: `${selectedMonth.monthName} ${selectedMonth.year}`
//                   } : null}
//                   onChange={(selectedOption) => setSelectedMonth(selectedOption?.value)}
//                   placeholder="Select Month"
//                   isSearchable={false}
//                   styles={customSelectStyles}
//                 />
//               </div>
              
//               {/* Excel Export Button */}
//               <button 
//                 className="btn btn-success btn-sm d-flex align-items-center"
//                 onClick={handleExportAllData}
//                 style={{ borderRadius: "8px" }}
//               >
//                 <i className="fas fa-file-excel me-1"></i>
//                 Export Data
//               </button>

//               {/* Clear filters button */}
//               {activeFiltersCount > 0 && (
//                 <button 
//                   className="btn btn-outline-secondary btn-sm d-flex align-items-center"
//                   onClick={clearAllFilters}
//                   style={{ borderRadius: "8px" }}
//                 >
//                   <i className="fas fa-times me-1"></i>
//                   Clear Filters ({activeFiltersCount})
//                 </button>
//               )}
//             </div>
//           </div>
          
//           {/* Filters Section */}
//           <div className="row g-3">
//             <div className="col-12 col-sm-6 col-md-4 col-lg-2">
//               <div className="filter-group">
//                 <label className="form-label text-muted small fw-medium mb-1">Sales Person</label>
//                 <Select
//                   options={getSelectOptions('Sales_Person')}
//                   value={filters.salesPerson ? { value: filters.salesPerson, label: filters.salesPerson } : null}
//                   onChange={(selectedOption) => handleFilterChange('salesPerson', selectedOption)}
//                   placeholder="All Sales Person"
//                   isClearable
//                   isSearchable
//                   styles={customSelectStyles}
//                 />
//               </div>
//             </div>
            
//             <div className="col-12 col-sm-6 col-md-4 col-lg-2">
//               <div className="filter-group">
//                 <label className="form-label text-muted small fw-medium mb-1">Contact Person</label>
//                 <Select
//                   options={getSelectOptions('Contact_Person')}
//                   value={filters.contactPerson ? { value: filters.contactPerson, label: filters.contactPerson } : null}
//                   onChange={(selectedOption) => handleFilterChange('contactPerson', selectedOption)}
//                   placeholder="All Contact Person"
//                   isClearable
//                   isSearchable
//                   styles={customSelectStyles}
//                 />
//               </div>
//             </div>
            
//             <div className="col-12 col-sm-6 col-md-4 col-lg-2">
//               <div className="filter-group">
//                 <label className="form-label text-muted small fw-medium mb-1">Category</label>
//                 <Select
//                   options={getSelectOptions('Category')}
//                   value={filters.category ? { value: filters.category, label: filters.category } : null}
//                   onChange={(selectedOption) => handleFilterChange('category', selectedOption)}
//                   placeholder="All Category"
//                   isClearable
//                   isSearchable
//                   styles={customSelectStyles}
//                 />
//               </div>
//             </div>
            
//             <div className="col-12 col-sm-6 col-md-4 col-lg-2">
//               <div className="filter-group">
//                 <label className="form-label text-muted small fw-medium mb-1">Product</label>
//                 <Select
//                   options={getSelectOptions('Item_No')}
//                   value={filters.product ? { value: filters.product, label: filters.product } : null}
//                   onChange={(selectedOption) => handleFilterChange('product', selectedOption)}
//                   placeholder="All Product"
//                   isClearable
//                   isSearchable
//                   styles={customSelectStyles}
//                 />
//               </div>
//             </div>
            
//             <div className="col-12 col-sm-6 col-md-4 col-lg-2">
//               <div className="filter-group">
//                 <label className="form-label text-muted small fw-medium mb-1">Customer</label>
//                 <Select
//                   options={getSelectOptions('Customer')}
//                   value={filters.customer ? { value: filters.customer, label: filters.customer } : null}
//                   onChange={(selectedOption) => handleFilterChange('customer', selectedOption)}
//                   placeholder="All Customer"
//                   isClearable
//                   isSearchable
//                   styles={customSelectStyles}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="card-body">
//         {error && <p className="text-danger mb-3">Error: {error}</p>}

//         {loading ? (
//           <div className="d-flex justify-content-center align-items-center" style={{ height: "500px" }}>
//             <div className="spinner-border me-2" role="status">
//               <span className="visually-hidden">Loading...</span>
//             </div>
//             <span>Loading chart data...</span>
//           </div>
//         ) : processedData.length ? (
//           <div className="chart-container" style={{ height: "500px", width: "100%" }}>
//             <Bar
//               ref={chartRef}
//               data={chartData}
//               options={chartOptions}
//             />
//           </div>
//         ) : (
//           <p className="text-center mt-4">No data available for selected month/filters.</p>
//         )}
//       </div>

//       {/* Modal for displaying order details */}
//       {modalData && (
//         <OrderDetailsModal
//           orderData={modalData}
//           onClose={() => setModalData(null)}
//           title={modalTitle}
//         />
//       )}
//     </div>
//   );
// };

// export default DailyReportChart;


// components/daily-report/DailyReportChart.js
import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { formatCurrency } from "utils/formatCurrency";
import OrderDetailsModal from "../modal/OrderDetailsModalArray";
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
    selectedMonth: null,
  });

  const [filterOptions, setFilterOptions] = useState({
    salesPersons: [],
    contactPersons: [],
    categories: [],
    customers: [],
    availableMonths: []
  });

  const [modalData, setModalData] = useState(null);
  const [modalTitle, setModalTitle] = useState("");
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);

  const chartRef = useRef(null);

  // Fetch filter options and available months on mount
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Fetch chart data when filters change
  useEffect(() => {
    if (filters.selectedMonth !== null) {
      fetchChartData();
    }
  }, [filters]);

  const fetchFilterOptions = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const [salesPersons, contactPersons, categories, customers, availableMonths] = await Promise.all([
        fetch("/api/unique/salespersons", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch("/api/unique/contact-persons", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch("/api/unique/categories", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch("/api/unique/customers", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch("/api/daily-report/available-months", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);

      setFilterOptions({
        salesPersons: salesPersons.data?.map(sp => ({ value: sp.SlpCode, label: sp.SlpName })) || [],
        contactPersons: contactPersons.data?.map(cp => ({ value: cp.CntctCode, label: cp.ContactPerson })) || [],
        categories: categories.data?.map(cat => ({ value: cat.ItmsGrpCod, label: cat.ItmsGrpNam })) || [],
        customers: customers.data?.map(cust => ({ value: cust.CardCode, label: cust.CardName })) || [],
        availableMonths: availableMonths || []
      });

      // Set current month as default
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      const currentMonthOption = availableMonths.find(
        m => m.year === currentYear && m.monthNumber === currentMonth
      );
      
      const monthToSet = currentMonthOption || (availableMonths.length > 0 ? availableMonths[0] : null);
      
      setFilters(prev => ({
        ...prev,
        selectedMonth: monthToSet
      }));

    } catch (err) {
      console.error("Error fetching filter options:", err);
    }
  };

  // Async load products with search
  const loadProductOptions = async (inputValue) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/unique/products", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      const allProducts = data.data?.map(prod => ({ 
        value: prod.ItemCode,
        label: `${prod.ItemCode}: ${prod.ItemName}${prod.CasNo ? ' - ' + prod.CasNo : ''}`,
        itemCode: prod.ItemCode,
        itemName: prod.ItemName,
        casNo: prod.CasNo
      })) || [];

      if (!inputValue) {
        return allProducts.slice(0, 50);
      }

      const searchTerm = inputValue.toLowerCase();
      const filtered = allProducts.filter(product =>
        product.itemCode.toLowerCase().includes(searchTerm) ||
        product.itemName.toLowerCase().includes(searchTerm) ||
        (product.casNo && product.casNo.toLowerCase().includes(searchTerm))
      );

      return filtered.slice(0, 50);
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
        params.append('year', filters.selectedMonth.year);
        params.append('month', filters.selectedMonth.monthNumber);
      }
      
      if (filters.salesPerson) params.append('slpCode', filters.salesPerson);
      if (filters.contactPerson) params.append('cntctCode', filters.contactPerson);
      if (filters.category) params.append('itmsGrpCod', filters.category);
      if (filters.product) params.append('itemCode', filters.product);
      if (filters.customer) params.append('cardCode', filters.customer);

      const response = await fetch(`/api/daily-report/chart-data?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to fetch chart data");

      const data = await response.json();
      setChartData(data);

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

    try {
      setLoadingModal(true);
      const token = localStorage.getItem("token");

      const params = new URLSearchParams();
      params.append('year', filters.selectedMonth.year);
      params.append('month', filters.selectedMonth.monthNumber);
      params.append('day', day);
      
      if (filters.salesPerson) params.append('slpCode', filters.salesPerson);
      if (filters.contactPerson) params.append('cntctCode', filters.contactPerson);
      if (filters.category) params.append('itmsGrpCod', filters.category);
      if (filters.product) params.append('itemCode', filters.product);
      if (filters.customer) params.append('cardCode', filters.customer);

      const response = await fetch(`/api/daily-report/modal-data?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to fetch modal data");

      const records = await response.json();
      setModalData(records);
      setModalTitle(`Orders - ${day} ${filters.selectedMonth.monthName} ${filters.selectedMonth.year}`);

    } catch (err) {
      console.error("Error fetching modal data:", err);
      alert("Failed to load data. Please try again.");
    } finally {
      setLoadingModal(false);
    }
  };

  const handleFilterChange = (filterType, selectedOption) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: selectedOption ? selectedOption.value : null
    }));
  };

  const handleMonthChange = (selectedOption) => {
    setFilters(prev => ({
      ...prev,
      selectedMonth: selectedOption ? selectedOption.value : null
    }));
  };

  const clearAllFilters = () => {
    setFilters(prev => ({
      salesPerson: null,
      contactPerson: null,
      category: null,
      product: null,
      customer: null,
      selectedMonth: prev.selectedMonth, // Keep month selection
    }));
  };

  const handleResetAll = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const currentMonthOption = filterOptions.availableMonths.find(
      m => m.year === currentYear && m.monthNumber === currentMonth
    );
    
    const monthToSet = currentMonthOption || (filterOptions.availableMonths.length > 0 ? filterOptions.availableMonths[0] : null);

    setFilters({
      salesPerson: null,
      contactPerson: null,
      category: null,
      product: null,
      customer: null,
      selectedMonth: monthToSet,
    });
  };

  const getSelectedProductOption = () => {
    if (!filters.product) return null;
    return {
      value: filters.product,
      label: filters.product
    };
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => 
    key !== 'selectedMonth' && value !== null
  ).length;

  // Create chart data
  const chartJsData = {
    labels: chartData.map(item => item.day),
    datasets: [
      {
        label: 'Number of Orders',
        data: chartData.map(item => item.orderCount),
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
            const dayData = chartData[context.dataIndex];
            return `Total Value: ${formatCurrency(dayData?.totalValue || 0)}`;
          }
        }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const day = chartData[index].day;
        handleBarClick(day);
      }
    },
    onHover: (event, elements) => {
      const target = event.native?.target || event.target;
      if (target) {
        target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
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
              <button 
                className="btn btn-outline-danger btn-sm d-flex align-items-center"
                onClick={handleResetAll}
                style={{ borderRadius: "8px" }}
              >
                <i className="fas fa-redo me-1"></i>
                Reset All
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
            {/* Month Selector */}
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <div className="filter-group">
                <label className="form-label text-muted small fw-medium mb-1">Month</label>
                <Select
                  options={filterOptions.availableMonths.map(m => ({
                    value: m,
                    label: `${m.monthName} ${m.year}`
                  }))}
                  value={filters.selectedMonth ? {
                    value: filters.selectedMonth,
                    label: `${filters.selectedMonth.monthName} ${filters.selectedMonth.year}`
                  } : null}
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
                  options={filterOptions.contactPersons}
                  value={filterOptions.contactPersons.find(cp => cp.value === filters.contactPerson) || null}
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
                  options={filterOptions.categories}
                  value={filterOptions.categories.find(cat => cat.value === filters.category) || null}
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
                <AsyncSelect
                  cacheOptions
                  loadOptions={loadProductOptions}
                  defaultOptions
                  value={getSelectedProductOption()}
                  onChange={(selectedOption) => handleFilterChange('product', selectedOption)}
                  placeholder="Search Product..."
                  isClearable
                  styles={customSelectStyles}
                  noOptionsMessage={({ inputValue }) => 
                    inputValue ? "No products found" : "Type to search products..."
                  }
                />
              </div>
            </div>
            
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <div className="filter-group">
                <label className="form-label text-muted small fw-medium mb-1">Customer</label>
                <Select
                  options={filterOptions.customers}
                  value={filterOptions.customers.find(cust => cust.value === filters.customer) || null}
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
            <span>Loading data...</span>
          </div>
        ) : chartData.length ? (
          <div className="chart-container" style={{ height: "500px", width: "100%" }}>
            <Bar
              ref={chartRef}
              data={chartJsData}
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

      {/* Loading overlay for modal */}
      {loadingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReportChart;