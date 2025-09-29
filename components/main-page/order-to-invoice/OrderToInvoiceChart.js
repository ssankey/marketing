// // components/order-to-invoice/OrderToInvoiceChart.js
// import React, { useState, useEffect, useRef } from "react";
// import { Bar } from "react-chartjs-2";
// import Select from 'react-select';
// import AsyncSelect from 'react-select/async';
// import OrderDetailsModal from "../../modal/OrderDetailsModalArray";
// import { customSelectStyles } from "../../daily-report/ChartConfig";
// import RangeConfiguration from "./RangeConfiguration";
// import SummaryTable from "./SummaryTable";

// import {
//   DEFAULT_RANGES,
//   generateDayRanges,
//   createChartData,
//   createChartOptions
// } from "utils/orderInvoiceUtils";

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

// const OrderToInvoiceChart = () => {
//   const [filters, setFilters] = useState({
//     salesPerson: null,
//     contactPerson: null,
//     category: null,
//     product: null,
//     customer: null,
//     financialYear: null,
//   });

//   // Filter options state
//   const [filterOptions, setFilterOptions] = useState({
//     salesPersons: [],
//     contactPersons: [],
//     categories: [],
//     products: [],
//     customers: [],
//     financialYears: []
//   });

//   const [modalData, setModalData] = useState(null);
//   const [modalTitle, setModalTitle] = useState("");
//   const [chartData, setChartData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [loadingModal, setLoadingModal] = useState(false);
  
//   // Range filter states
//   const [customRanges, setCustomRanges] = useState([...DEFAULT_RANGES]);
//   const [dayRanges, setDayRanges] = useState(generateDayRanges(DEFAULT_RANGES));

//   const chartRef = useRef(null);

//   // Fetch filter options on mount
//   useEffect(() => {
//     fetchFilterOptions();
//   }, []);

//   // Fetch chart data when filters or ranges change
//   useEffect(() => {
//     // Only fetch if financial year is set
//     if (filters.financialYear !== null) {
//       fetchChartData();
//     }
//   }, [filters, dayRanges]);

//   const fetchFilterOptions = async () => {
//     try {
//       const token = localStorage.getItem("token");
      
//       const [salesPersons, contactPersons, categories, customers, availableYears] = await Promise.all([
//         fetch("/api/unique/salespersons", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
//         fetch("/api/unique/contact-persons", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
//         fetch("/api/unique/categories", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
//         fetch("/api/unique/customers", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
//         fetch("/api/order-to-invoice/available-years", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
//       ]);

//       // Generate financial years based on available data
//       const fyOptions = availableYears.map(year => ({
//         value: year,
//         label: `FY ${year}-${(year + 1).toString().slice(-2)}`
//       }));

//       setFilterOptions({
//         salesPersons: salesPersons.data?.map(sp => ({ value: sp.SlpCode, label: sp.SlpName })) || [],
//         contactPersons: contactPersons.data?.map(cp => ({ value: cp.CntctCode, label: cp.ContactPerson })) || [],
//         categories: categories.data?.map(cat => ({ value: cat.ItmsGrpCod, label: cat.ItmsGrpNam })) || [],
//         products: [], // Products will be loaded async
//         customers: customers.data?.map(cust => ({ value: cust.CardCode, label: cust.CardName })) || [],
//         financialYears: fyOptions
//       });

//       // Set current financial year as default and trigger initial load
//       const currentMonth = new Date().getMonth() + 1;
//       const currentYear = new Date().getFullYear();
//       const defaultFY = currentMonth >= 4 ? currentYear : currentYear - 1;
      
//       // Check if defaultFY exists in available years, otherwise use the most recent year
//       const fyToSet = fyOptions.find(fy => fy.value === defaultFY) 
//         ? defaultFY 
//         : (fyOptions.length > 0 ? fyOptions[0].value : null);
      
//       setFilters(prev => ({
//         ...prev,
//         financialYear: fyToSet
//       }));

//     } catch (err) {
//       console.error("Error fetching filter options:", err);
//     }
//   };

//   // Async load products with search
//   const loadProductOptions = async (inputValue) => {
//     try {
//       const token = localStorage.getItem("token");
//       const response = await fetch("/api/unique/products", {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       const data = await response.json();
      
//       const allProducts = data.data?.map(prod => ({ 
//         value: prod.ItemCode, 
//         label: `${prod.ItemName}${prod.CasNo ? ' - ' + prod.CasNo : ''}` 
//       })) || [];

//       // Filter based on input
//       if (!inputValue) {
//         return allProducts.slice(0, 50); // Show first 50 by default
//       }

//       const filtered = allProducts.filter(product =>
//         product.label.toLowerCase().includes(inputValue.toLowerCase())
//       );

//       return filtered.slice(0, 50); // Limit to 50 results
//     } catch (err) {
//       console.error("Error loading products:", err);
//       return [];
//     }
//   };

//   const fetchChartData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const token = localStorage.getItem("token");
      
//       // Build query params
//       const params = new URLSearchParams();
      
//       if (filters.salesPerson) params.append('slpCode', filters.salesPerson);
//       if (filters.contactPerson) params.append('cntctCode', filters.contactPerson);
//       if (filters.category) params.append('itmsGrpCod', filters.category);
//       if (filters.product) params.append('itemCode', filters.product);
//       if (filters.customer) params.append('cardCode', filters.customer);
//       if (filters.financialYear) params.append('financialYear', filters.financialYear);
      
//       // Add range configuration
//       params.append('ranges', JSON.stringify(customRanges));

//       const response = await fetch(`/api/order-to-invoice/chart-data?${params}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });

//       if (!response.ok) throw new Error("Failed to fetch chart data");

//       const data = await response.json();
//       setChartData(data);

//     } catch (err) {
//       console.error("Error fetching chart data:", err);
//       setError(err.message);
//       setChartData([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleBarClick = async (monthData, rangeLabel) => {
//     try {
//       setLoadingModal(true);
//       const token = localStorage.getItem("token");

//       // Build query params for fetching specific records
//       const params = new URLSearchParams();
//       params.append('year', monthData.year);
//       params.append('month', monthData.monthNumber);
//       params.append('rangeLabel', rangeLabel);
      
//       if (filters.salesPerson) params.append('slpCode', filters.salesPerson);
//       if (filters.contactPerson) params.append('cntctCode', filters.contactPerson);
//       if (filters.category) params.append('itmsGrpCod', filters.category);
//       if (filters.product) params.append('itemCode', filters.product);
//       if (filters.customer) params.append('cardCode', filters.customer);
//       if (filters.financialYear) params.append('financialYear', filters.financialYear);
      
//       // Add range configuration
//       params.append('ranges', JSON.stringify(customRanges));

//       const response = await fetch(`/api/order-to-invoice/modal-data?${params}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });

//       if (!response.ok) throw new Error("Failed to fetch modal data");

//       const records = await response.json();
//       setModalData(records);
//       setModalTitle(`${rangeLabel} - ${monthData.monthName} ${monthData.year}`);

//     } catch (err) {
//       console.error("Error fetching modal data:", err);
//       alert("Failed to load data. Please try again.");
//     } finally {
//       setLoadingModal(false);
//     }
//   };

//   const handleFilterChange = (filterType, selectedOption) => {
//     setFilters(prev => ({
//       ...prev,
//       [filterType]: selectedOption ? selectedOption.value : null
//     }));
//   };

//   const clearAllFilters = () => {
//     const currentMonth = new Date().getMonth() + 1;
//     const currentYear = new Date().getFullYear();
//     const defaultFY = currentMonth >= 4 ? currentYear : currentYear - 1;

//     setFilters({
//       salesPerson: null,
//       contactPerson: null,
//       category: null,
//       product: null,
//       customer: null,
//       financialYear: defaultFY,
//     });
//   };

//   const handleResetAll = () => {
//     const currentMonth = new Date().getMonth() + 1;
//     const currentYear = new Date().getFullYear();
//     const defaultFY = currentMonth >= 4 ? currentYear : currentYear - 1;

//     // Check if defaultFY exists in available years
//     const fyToSet = filterOptions.financialYears.find(fy => fy.value === defaultFY)
//       ? defaultFY
//       : (filterOptions.financialYears.length > 0 ? filterOptions.financialYears[0].value : null);

//     // Reset filters
//     setFilters({
//       salesPerson: null,
//       contactPerson: null,
//       category: null,
//       product: null,
//       customer: null,
//       financialYear: fyToSet,
//     });

//     // Reset ranges to default
//     setCustomRanges([...DEFAULT_RANGES]);
//     const newDayRanges = generateDayRanges(DEFAULT_RANGES);
//     setDayRanges(newDayRanges);
//   };

//   const handleRangesChange = (newRanges) => {
//     setCustomRanges([...newRanges]);
//     const newDayRanges = generateDayRanges(newRanges);
//     setDayRanges(newDayRanges);
//   };

//   const handleApplyRanges = (validatedRanges) => {
//     setCustomRanges([...validatedRanges]);
//     const newDayRanges = generateDayRanges(validatedRanges);
//     setDayRanges(newDayRanges);
//   };

//   const activeFiltersCount = Object.entries(filters).filter(([key, value]) => 
//     key !== 'financialYear' && value !== null
//   ).length;

//   const chartJsData = createChartData(chartData, dayRanges);
//   const chartOptions = createChartOptions(chartData, dayRanges, handleBarClick);

//   return (
//     <div className="card shadow-sm border-0 mb-4">
//       <div className="card-header bg-white py-3">
//         <div className="d-flex flex-column">
//           <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
//             <h4 className="mb-3 mb-md-0" style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}>
//               Order to Invoice Analysis
//             </h4>
            
//             <div className="d-flex gap-2">
//               <button 
//                 className="btn btn-outline-danger btn-sm d-flex align-items-center"
//                 onClick={handleResetAll}
//                 style={{ borderRadius: "8px" }}
//               >
//                 <i className="fas fa-redo me-1"></i>
//                 Reset All
//               </button>

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
//             {/* Financial Year Filter */}
//             <div className="col-12 col-sm-6 col-md-4 col-lg-2">
//               <div className="filter-group">
//                 <label className="form-label text-muted small fw-medium mb-1">Financial Year</label>
//                 <Select
//                   options={filterOptions.financialYears}
//                   value={filterOptions.financialYears.find(fy => fy.value === filters.financialYear) || null}
//                   onChange={(selectedOption) => handleFilterChange('financialYear', selectedOption)}
//                   placeholder="Select FY"
//                   isClearable={false}
//                   isSearchable
//                   styles={customSelectStyles}
//                 />
//               </div>
//             </div>

//             {/* Range Filter */}
//             <div className="col-12 col-sm-6 col-md-4 col-lg-2">
//               <RangeConfiguration 
//                 customRanges={customRanges}
//                 onRangesChange={handleRangesChange}
//                 onApplyRanges={handleApplyRanges}
//               />
//             </div>

//             <div className="col-12 col-sm-6 col-md-4 col-lg-2">
//               <div className="filter-group">
//                 <label className="form-label text-muted small fw-medium mb-1">Sales Person</label>
//                 <Select
//                   options={filterOptions.salesPersons}
//                   value={filterOptions.salesPersons.find(sp => sp.value === filters.salesPerson) || null}
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
//                   options={filterOptions.contactPersons}
//                   value={filterOptions.contactPersons.find(cp => cp.value === filters.contactPerson) || null}
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
//                   options={filterOptions.categories}
//                   value={filterOptions.categories.find(cat => cat.value === filters.category) || null}
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
//                 <AsyncSelect
//                   cacheOptions
//                   loadOptions={loadProductOptions}
//                   defaultOptions
//                   value={filters.product ? { value: filters.product, label: filters.product } : null}
//                   onChange={(selectedOption) => handleFilterChange('product', selectedOption)}
//                   placeholder="Search Product..."
//                   isClearable
//                   styles={customSelectStyles}
//                   noOptionsMessage={() => "Type to search products..."}
//                 />
//               </div>
//             </div>
            
//             <div className="col-12 col-sm-6 col-md-4 col-lg-2">
//               <div className="filter-group">
//                 <label className="form-label text-muted small fw-medium mb-1">Customer</label>
//                 <Select
//                   options={filterOptions.customers}
//                   value={filterOptions.customers.find(cust => cust.value === filters.customer) || null}
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
//             <span>Loading data...</span>
//           </div>
//         ) : chartData.length ? (
//           <>
//             <div className="chart-container mb-4" style={{ height: "500px", width: "100%" }}>
//               <Bar
//                 ref={chartRef}
//                 data={chartJsData}
//                 options={chartOptions}
//               />
//             </div>

//             <SummaryTable 
//               processedChartData={chartData}
//               dayRanges={dayRanges}
//               onBarClick={handleBarClick}
//             />
//           </>
//         ) : (
//           <p className="text-center mt-4">No data available with valid SO Date and Invoice Date.</p>
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

//       {/* Loading overlay for modal */}
//       {loadingModal && (
//         <div style={{
//           position: 'fixed',
//           top: 0,
//           left: 0,
//           right: 0,
//           bottom: 0,
//           backgroundColor: 'rgba(0,0,0,0.5)',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           zIndex: 9999
//         }}>
//           <div className="spinner-border text-light" role="status">
//             <span className="visually-hidden">Loading...</span>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default OrderToInvoiceChart;




// components/order-to-invoice/OrderToInvoiceChart.js
import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import OrderDetailsModal from "../../modal/OrderDetailsModalArray";
import { customSelectStyles } from "../../daily-report/ChartConfig";
import RangeConfiguration from "./RangeConfiguration";
import SummaryTable from "./SummaryTable";

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

const OrderToInvoiceChart = () => {
  const [filters, setFilters] = useState({
    salesPerson: null,
    contactPerson: null,
    category: null,
    product: null,
    customer: null,
    financialYear: null,
  });

  // Filter options state
  const [filterOptions, setFilterOptions] = useState({
    salesPersons: [],
    contactPersons: [],
    categories: [],
    products: [],
    customers: [],
    financialYears: []
  });

  const [modalData, setModalData] = useState(null);
  const [modalTitle, setModalTitle] = useState("");
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);
  
  // Range filter states
  const [customRanges, setCustomRanges] = useState([...DEFAULT_RANGES]);
  const [dayRanges, setDayRanges] = useState(generateDayRanges(DEFAULT_RANGES));

  const chartRef = useRef(null);

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Fetch chart data when filters or ranges change
  useEffect(() => {
    // Only fetch if financial year is set
    if (filters.financialYear !== null) {
      fetchChartData();
    }
  }, [filters, dayRanges]);

  const fetchFilterOptions = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const [salesPersons, contactPersons, categories, customers, availableYears] = await Promise.all([
        fetch("/api/unique/salespersons", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch("/api/unique/contact-persons", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch("/api/unique/categories", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch("/api/unique/customers", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch("/api/order-to-invoice/available-years", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);

      // Generate financial years based on available data
      const fyOptions = availableYears.map(year => ({
        value: year,
        label: `FY ${year}-${(year + 1).toString().slice(-2)}`
      }));

      setFilterOptions({
        salesPersons: salesPersons.data?.map(sp => ({ value: sp.SlpCode, label: sp.SlpName })) || [],
        contactPersons: contactPersons.data?.map(cp => ({ value: cp.CntctCode, label: cp.ContactPerson })) || [],
        categories: categories.data?.map(cat => ({ value: cat.ItmsGrpCod, label: cat.ItmsGrpNam })) || [],
        products: [], // Products will be loaded async
        customers: customers.data?.map(cust => ({ value: cust.CardCode, label: cust.CardName })) || [],
        financialYears: fyOptions
      });

      // Set current financial year as default and trigger initial load
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const defaultFY = currentMonth >= 4 ? currentYear : currentYear - 1;
      
      // Check if defaultFY exists in available years, otherwise use the most recent year
      const fyToSet = fyOptions.find(fy => fy.value === defaultFY) 
        ? defaultFY 
        : (fyOptions.length > 0 ? fyOptions[0].value : null);
      
      setFilters(prev => ({
        ...prev,
        financialYear: fyToSet
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

      // Filter based on input (search in both ItemCode and ItemName)
      if (!inputValue) {
        return allProducts.slice(0, 50); // Show first 50 by default
      }

      const searchTerm = inputValue.toLowerCase();
      const filtered = allProducts.filter(product =>
        product.itemCode.toLowerCase().includes(searchTerm) ||
        product.itemName.toLowerCase().includes(searchTerm) ||
        (product.casNo && product.casNo.toLowerCase().includes(searchTerm))
      );

      return filtered.slice(0, 50); // Limit to 50 results
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
      
      // Build query params
      const params = new URLSearchParams();
      
      if (filters.salesPerson) params.append('slpCode', filters.salesPerson);
      if (filters.contactPerson) params.append('cntctCode', filters.contactPerson);
      if (filters.category) params.append('itmsGrpCod', filters.category);
      if (filters.product) params.append('itemCode', filters.product);
      if (filters.customer) params.append('cardCode', filters.customer);
      if (filters.financialYear) params.append('financialYear', filters.financialYear);
      
      // Add range configuration
      params.append('ranges', JSON.stringify(customRanges));

      const response = await fetch(`/api/order-to-invoice/chart-data?${params}`, {
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

  const handleBarClick = async (monthData, rangeLabel) => {
    try {
      setLoadingModal(true);
      const token = localStorage.getItem("token");

      // Build query params for fetching specific records
      const params = new URLSearchParams();
      params.append('year', monthData.year);
      params.append('month', monthData.monthNumber);
      params.append('rangeLabel', rangeLabel);
      
      if (filters.salesPerson) params.append('slpCode', filters.salesPerson);
      if (filters.contactPerson) params.append('cntctCode', filters.contactPerson);
      if (filters.category) params.append('itmsGrpCod', filters.category);
      if (filters.product) params.append('itemCode', filters.product);
      if (filters.customer) params.append('cardCode', filters.customer);
      if (filters.financialYear) params.append('financialYear', filters.financialYear);
      
      // Add range configuration
      params.append('ranges', JSON.stringify(customRanges));

      const response = await fetch(`/api/order-to-invoice/modal-data?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to fetch modal data");

      const records = await response.json();
      setModalData(records);
      setModalTitle(`${rangeLabel} - ${monthData.monthName} ${monthData.year}`);

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

  const clearAllFilters = () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const defaultFY = currentMonth >= 4 ? currentYear : currentYear - 1;

    // Check if defaultFY exists in available years
    const fyToSet = filterOptions.financialYears.find(fy => fy.value === defaultFY)
      ? defaultFY
      : (filterOptions.financialYears.length > 0 ? filterOptions.financialYears[0].value : null);

    setFilters({
      salesPerson: null,
      contactPerson: null,
      category: null,
      product: null,
      customer: null,
      financialYear: fyToSet,
    });
  };

  const handleResetAll = () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const defaultFY = currentMonth >= 4 ? currentYear : currentYear - 1;

    // Check if defaultFY exists in available years
    const fyToSet = filterOptions.financialYears.find(fy => fy.value === defaultFY)
      ? defaultFY
      : (filterOptions.financialYears.length > 0 ? filterOptions.financialYears[0].value : null);

    // Reset filters
    setFilters({
      salesPerson: null,
      contactPerson: null,
      category: null,
      product: null,
      customer: null,
      financialYear: fyToSet,
    });

    // Reset ranges to default
    setCustomRanges([...DEFAULT_RANGES]);
    const newDayRanges = generateDayRanges(DEFAULT_RANGES);
    setDayRanges(newDayRanges);
  };

  // Get selected product option for display
  const getSelectedProductOption = () => {
    if (!filters.product) return null;
    
    // Return a simple object with the selected ItemCode
    // The actual label will be fetched when dropdown opens
    return {
      value: filters.product,
      label: filters.product // This will be replaced when options load
    };
  };

  const handleRangesChange = (newRanges) => {
    setCustomRanges([...newRanges]);
    const newDayRanges = generateDayRanges(newRanges);
    setDayRanges(newDayRanges);
  };

  const handleApplyRanges = (validatedRanges) => {
    setCustomRanges([...validatedRanges]);
    const newDayRanges = generateDayRanges(validatedRanges);
    setDayRanges(newDayRanges);
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => 
    key !== 'financialYear' && value !== null
  ).length;

  const chartJsData = createChartData(chartData, dayRanges);
  const chartOptions = createChartOptions(chartData, dayRanges, handleBarClick);

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
            {/* Financial Year Filter */}
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <div className="filter-group">
                <label className="form-label text-muted small fw-medium mb-1">Financial Year</label>
                <Select
                  options={filterOptions.financialYears}
                  value={filterOptions.financialYears.find(fy => fy.value === filters.financialYear) || null}
                  onChange={(selectedOption) => handleFilterChange('financialYear', selectedOption)}
                  placeholder="Select FY"
                  isClearable={false}
                  isSearchable
                  styles={customSelectStyles}
                />
              </div>
            </div>

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
          <>
            <div className="chart-container mb-4" style={{ height: "500px", width: "100%" }}>
              <Bar
                ref={chartRef}
                data={chartJsData}
                options={chartOptions}
              />
            </div>

            <SummaryTable 
              processedChartData={chartData}
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

export default OrderToInvoiceChart;