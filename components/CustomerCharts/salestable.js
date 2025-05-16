

// Fixed SalesTable component
import React, { useState, useRef, useCallback, useEffect } from "react";
import GenericTable from "components/GenericTable";
import downloadExcel from "utils/exporttoexcel";
import { formatCurrency } from "utils/formatCurrency";
import Select from "react-select";
import { Button, Spinner } from "react-bootstrap";
import debounce from "lodash/debounce";

// const SalesTable = ({ data, customerId, loading }) => {
//   const [filteredData, setFilteredData] = useState(data || []);
//   // const [loading, setLoading] = useState(false);

//   // Sales Person filter state
//   const [suggestions, setSuggestions] = useState([]);
//   const [loadingSuggestions, setLoadingSuggestions] = useState(false);
//   const [selectedValue, setSelectedValue] = useState(null);
//   const [inputValue, setInputValue] = useState("");
//   const selectRef = useRef(null);
//   const cache = useRef({});

//   // Add debugging logs when component mounts
//   useEffect(() => {
//     console.log("SalesTable mounted with initial data:", data);
//     console.log("Customer ID:", customerId);
//   }, [data, customerId]);

//   const columns = [
//     { label: "Category", field: "Category" },
//     { label: "Quantity", field: "Quantity" },
//     {
//       label: "Sales",
//       field: "Sales",
//       render: (value) => formatCurrency(value),
//     },
//   ];

//   // Debounced function for API calls when typing
//   const debouncedFetchSuggestions = useCallback(
//     debounce(async (query) => {
//       await fetchSuggestions(query);
//     }, 500),
//     []
//   );

//   // Fetch sales person suggestions
//   const fetchSuggestions = async (query = "", initialLoad = false) => {
//     const cacheKey = `sales-person_${query}`;

//     if (cache.current[cacheKey]) {
//       setSuggestions(cache.current[cacheKey]);
//       return;
//     }

//     setLoadingSuggestions(true);
//     try {
//       const url = `/api/dashboard/sales-person/distinct-salesperson?search=${encodeURIComponent(query)}&page=1&limit=50`;
//       console.log("Fetching suggestions from:", url);

//       const response = await fetch(url);
//       if (!response.ok) throw new Error(`API Error: ${response.status}`);

//       const data = await response.json();
//       console.log("Suggestions API response:", data);

//       const formattedSuggestions =
//         data.salesEmployees?.map((emp) => ({
//           value: emp.value,
//           label: `${emp.value} - ${emp.label}`,
//         })) || [];

//       cache.current[cacheKey] = formattedSuggestions;
//       setSuggestions(formattedSuggestions);
//     } catch (error) {
//       console.error(`Error fetching sales-person suggestions:`, error);
//       setSuggestions([]);
//     } finally {
//       setLoadingSuggestions(false);
//     }
//   };

//   // Handle input change
//   const handleInputChange = (inputValue, { action }) => {
//     if (action === "input-change") {
//       setInputValue(inputValue);
//       debouncedFetchSuggestions(inputValue);
//     }
//   };

//   // Handle input focus
//   const handleFocus = () => {
//     fetchSuggestions(inputValue, true);
//   };

//   // Handle option selection
//   const handleOptionSelect = async (option) => {
//     console.log("Sales person selected:", option);
//     setSelectedValue(option);
//     setLoading(true);

//     try {
//       // Build the URL with the proper parameters
//       let url = `/api/customers/salesbycategory?id=${encodeURIComponent(customerId)}`;

//       if (option) {
//         // Make sure to use the correct value from the option
//         url += `&salesPerson=${encodeURIComponent(option.value)}`;
//       }

//       console.log("Fetching data from:", url);
//       const response = await fetch(url);

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error("API response not OK:", response.status, errorText);
//         throw new Error(
//           `Failed to fetch data: ${response.status} ${errorText}`
//         );
//       }

//       const result = await response.json();
//       console.log("API response for filtered data:", result);
//       setFilteredData(result);
//     } catch (error) {
//       console.error("Error fetching sales by category data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Reset filter
//   const handleReset = async () => {
//     console.log("Resetting filters");
//     setSelectedValue(null);
//     setInputValue("");
//     setLoading(true);

//     try {
//       const url = `/api/customers/salesbycategory?id=${encodeURIComponent(customerId)}`;
//       console.log("Fetching reset data from:", url);

//       const response = await fetch(url);
//       if (!response.ok) {
//         throw new Error("Failed to fetch data");
//       }

//       const result = await response.json();
//       console.log("Reset data received:", result);
//       setFilteredData(result);
//     } catch (error) {
//       console.error("Error fetching sales by category data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleExcelDownload = () => {
//     if (filteredData && filteredData.length > 0) {
//       const formattedData = filteredData.map((row) => ({
//         ...row,
//         Sales: formatCurrency(row.Sales),
//       }));
//       downloadExcel(formattedData, "SalesByCategory");
//     } else {
//       alert("No data available to export.");
//     }
//   };

//   return (
//     <div>
//       {loading ? (
//         <div className="text-center p-4">
//           <Spinner animation="border" variant="primary" />
//           <p className="mt-2">Loading data...</p>
//         </div>
//       ) : (
//         <GenericTable
//           columns={columns}
//           data={filteredData}
//           onSort={() => {}}
//           sortField=""
//           sortDirection=""
//           onExcelDownload={handleExcelDownload}
//         />
//       )}
//     </div>
//   );
// };

// export default SalesTable;


const SalesTable = ({ data, loading }) => {
  const columns = [
    { label: "Category", field: "Category" },
    { label: "Quantity", field: "Quantity" },
    {
      label: "Sales",
      field: "Sales",
      render: (value) => formatCurrency(value),
    },
  ];

  const handleExcelDownload = () => {
    if (data && data.length > 0) {
      const formattedData = data.map((row) => ({
        ...row,
        Sales: formatCurrency(row.Sales),
      }));
      downloadExcel(formattedData, "SalesByCategory");
    } else {
      alert("No data available to export.");
    }
  };

  return (
    <div>
      {loading ? (
        <div className="text-center p-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading data...</p>
        </div>
      ) : (
        <GenericTable
          columns={columns}
          data={data}
          onSort={() => {}}
          sortField=""
          sortDirection=""
          onExcelDownload={handleExcelDownload}
        />
      )}
    </div>
  );
};

export default SalesTable;
