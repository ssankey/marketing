// import React, { useEffect, useState, useRef, useCallback } from "react";
// import Select from "react-select";
// import { Button, Dropdown } from "react-bootstrap";
// import debounce from "lodash.debounce";

// const AllFilter = ({ setSearchQuery ,allowedTypes }) => {
//   const [searchType, setSearchType] = useState(null);
//   const [suggestions, setSuggestions] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [selectedValue, setSelectedValue] = useState(null);
//   const [inputValue, setInputValue] = useState("");
//   const selectRef = useRef(null);

//   // API Endpoints
//   const API_ENDPOINTS = {
//     "sales-person": "/api/dashboard/sales-person/distinct-salesperson",
//     product: "/api/products/distinct-product",
//     category: "/api/products/categories",
//     customer: "/api/customers/distinct-customer",
//   };

//   // Cache API responses
//   const cache = useRef({});

//   // Handle dropdown selection (search type change)
//   const handleSearchTypeSelect = async (type) => {
//     setSearchType(type);
//     setSelectedValue(null);
//     setInputValue(""); // Clear input field
//     setSuggestions([]); // Clear previous suggestions

//     if (type !== "product") {
//       await fetchSuggestions("", true);
//     }
//   };

//   // Debounced function to optimize API calls when typing
//   const debouncedFetchSuggestions = useCallback(
//     debounce(async (query) => {
//       await fetchSuggestions(query);
//     }, 500),
//     [searchType]
//   );

//   // Fetch suggestions with caching
//   const fetchSuggestions = async (query = "", initialLoad = false) => {
//     if (!searchType) return;

//     // Ensure products fetch only when a query is typed
//     if (searchType === "product" && !query && !initialLoad) return;
//     if (searchType === "sales-person" && !query && !initialLoad) return;

//     const cacheKey = `${searchType}_${query}`;
//     if (cache.current[cacheKey]) {
//       setSuggestions(cache.current[cacheKey]);
//       return;
//     }

//     setLoading(true);
//     try {
//       const url = `${API_ENDPOINTS[searchType]}?search=${encodeURIComponent(query)}&page=1&limit=50`;
//       console.log("Fetching suggestions from:", url);

//       const response = await fetch(url);
//       if (!response.ok) throw new Error(`API Error: ${response.status}`);

//       const data = await response.json();
//       console.log("API Response:", data);

//       let formattedSuggestions = [];
//       if (searchType === "sales-person") {
//         formattedSuggestions =
//           data.salesEmployees?.map((emp) => ({
//             value: emp.value,
//             label: `${emp.value} - ${emp.label}`,
//           })) || [];
//       } else if (searchType === "product") {
//         formattedSuggestions =
//           data.products?.map((product) => ({
//             value: product.value,
//             label: product.label,
//           })) || [];
//       } else if (searchType === "category") {
//         formattedSuggestions =
//           data.categories?.map((cat) => ({
//             value: cat,
//             label: cat,
//           })) || [];
//       } else if (searchType === "customer") {
//         formattedSuggestions =
//           data.customers?.map((cust) => ({
//             value: cust.value,
//             label: `${cust.value} - ${cust.label}`,
//           })) || [];
//       }

//       cache.current[cacheKey] = formattedSuggestions;
//       console.log("Formatted Suggestions:", formattedSuggestions);
//       setSuggestions(formattedSuggestions);
//     } catch (error) {
//       console.error(`Error fetching ${searchType} suggestions:`, error);
//       setSuggestions([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle input change (prevents reloading chart on clear)
//   const handleInputChange = (inputValue, { action }) => {
//     if (!searchType) return; // Prevent input when no search type is selected

//     if (action === "input-change") {
//       setInputValue(inputValue);
//       debouncedFetchSuggestions(inputValue);
//     }
//   };

//   // Handle input focus
//   const handleFocus = () => {
//     if (searchType) {
//       fetchSuggestions(inputValue, true);
//     }
//   };

//   // Handle option selection
//   const handleOptionSelect = (option) => {
//     setSelectedValue(option);

//     if (option) {
//       setSearchQuery({
//         value: option.value,
//         label: option.label,
//         type: searchType
//       });
//     }
//   };

//   // **Prevent Chart Reload on Clear**
//   const handleClear = () => {
//     setInputValue(""); // Clear only the input field
//   };

//   // Reset function (clears everything)
//   const handleReset = () => {
//     setSearchType(null);
//     setSelectedValue(null);
//     setSearchQuery(null); // Reset search query
//     setInputValue(""); // Clear input field
//   };

//   const typesToShow = allowedTypes || ["sales-person", "product", "category"];

//   return (
//     <div className="d-flex gap-2 align-items-center">
//       {/* Dropdown to Select Filter Type */}
//       <Dropdown onSelect={(eventKey) => handleSearchTypeSelect(eventKey)}>
//         <Dropdown.Toggle variant="outline-secondary" id="search-dropdown">
//           {searchType ? searchType.replace("-", " ").toUpperCase() : "Search By"}
//         </Dropdown.Toggle>
//         {/* <Dropdown.Menu>
//           <Dropdown.Item eventKey="sales-person">Sales Person</Dropdown.Item>
//           <Dropdown.Item eventKey="product">Product</Dropdown.Item>
//           <Dropdown.Item eventKey="category">Category</Dropdown.Item>
//         </Dropdown.Menu> */}
//         <Dropdown.Menu>
//   {typesToShow.includes("sales-person") && (
//     <Dropdown.Item eventKey="sales-person">Sales Person</Dropdown.Item>
//   )}
//   {typesToShow.includes("product") && (
//     <Dropdown.Item eventKey="product">Product</Dropdown.Item>
//   )}
//   {typesToShow.includes("category") && (
//     <Dropdown.Item eventKey="category">Category</Dropdown.Item>
//   )}
// </Dropdown.Menu>

//       </Dropdown>

//       {/* Search Input with Auto-Suggestions */}
//       <div style={{ width: "300px" }}>
//         <Select
//           ref={selectRef}
//           value={selectedValue}
//           inputValue={inputValue}
//           onChange={handleOptionSelect}
//           onInputChange={handleInputChange}
//           onFocus={handleFocus}
//           options={suggestions}
//           isLoading={loading}
//           isClearable
//           isDisabled={!searchType} // Disable input when no dropdown selection is made
//           onBlur={handleClear} // Prevent chart reload on input clear
//           placeholder={searchType ? `Enter ${searchType.replace("-", " ")}` : "Select a search type"}
//           noOptionsMessage={() => (loading ? "Loading..." : "No results found")}
//           styles={{
//             control: (base, state) => ({
//               ...base,
//               minHeight: "40px",
//               borderColor: state.isFocused ? "#007bff" : "#dee2e6",
//               fontSize: "14px",
//               backgroundColor: searchType ? "#fff" : "#f8f9fa", // Gray background when disabled
//             }),
//             option: (base, state) => ({
//               ...base,
//               backgroundColor: state.isFocused ? "#007bff" : "#fff",
//               color: state.isFocused ? "#fff" : "#212529",
//             }),
//           }}
//         />
//       </div>

//       {/* Reset Button */}
//       <Button variant="primary" onClick={handleReset} disabled={!searchType}>
//         Reset
//       </Button>
//     </div>
//   );
// };

// export default AllFilter;

import React, { useEffect, useState, useRef, useCallback } from "react";
import Select from "react-select";
import { Button, Dropdown } from "react-bootstrap";
import debounce from "lodash.debounce";

const AllFilter = ({ setSearchQuery, allowedTypes }) => {
  const [searchType, setSearchType] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const selectRef = useRef(null);

  // API Endpoints
  const API_ENDPOINTS = {
    "sales-person": "/api/dashboard/sales-person/distinct-salesperson",
    product: "/api/products/distinct-product",
    category: "/api/products/categories",
    customer: "/api/customers/distinct-customer",
  };

  // Cache API responses
  const cache = useRef({});

  // Handle dropdown selection (search type change)
  const handleSearchTypeSelect = async (type) => {
    setSearchType(type);
    setSelectedValue(null);
    setInputValue(""); // Clear input field
    setSuggestions([]); // Clear previous suggestions

    if (type !== "product") {
      await fetchSuggestions("", true);
    }
  };

  // Debounced function to optimize API calls when typing
  const debouncedFetchSuggestions = useCallback(
    debounce(async (query) => {
      await fetchSuggestions(query);
    }, 500),
    [searchType]
  );

  // Fetch suggestions with caching
  const fetchSuggestions = async (query = "", initialLoad = false) => {
    if (!searchType) return;

    // Ensure products fetch only when a query is typed
    if (searchType === "product" && !query && !initialLoad) return;
    if (searchType === "sales-person" && !query && !initialLoad) return;

    const cacheKey = `${searchType}_${query}`;
    if (cache.current[cacheKey]) {
      setSuggestions(cache.current[cacheKey]);
      return;
    }

    setLoading(true);
    try {
      const url = `${API_ENDPOINTS[searchType]}?search=${encodeURIComponent(query)}&page=1&limit=50`;
      console.log("Fetching suggestions from:", url);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      console.log("API Response:", data);

      let formattedSuggestions = [];
      if (searchType === "sales-person") {
        formattedSuggestions =
          data.salesEmployees?.map((emp) => ({
            value: emp.value,
            label: `${emp.value} - ${emp.label}`,
          })) || [];
      } else if (searchType === "product") {
        formattedSuggestions =
          data.products?.map((product) => ({
            value: product.value,
            label: product.label,
          })) || [];
      } else if (searchType === "category") {
        formattedSuggestions =
          data.categories?.map((cat) => ({
            value: cat,
            label: cat,
          })) || [];
      } else if (searchType === "customer") {
        formattedSuggestions =
          data.customers?.map((cust) => ({
            value: cust.value,
            label: cust.label,
          })) || [];
      }

      cache.current[cacheKey] = formattedSuggestions;
      console.log("Formatted Suggestions:", formattedSuggestions);
      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.error(`Error fetching ${searchType} suggestions:`, error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change (prevents reloading chart on clear)
  const handleInputChange = (inputValue, { action }) => {
    if (!searchType) return; // Prevent input when no search type is selected

    if (action === "input-change") {
      setInputValue(inputValue);
      debouncedFetchSuggestions(inputValue);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (searchType) {
      fetchSuggestions(inputValue, true);
    }
  };

  // Handle option selection
  const handleOptionSelect = (option) => {
    setSelectedValue(option);

    if (option) {
      setSearchQuery({
        value: option.value,
        label: option.label,
        type: searchType,
      });
    } else {
      // If option is null (cleared), reset filter
      setSearchQuery(null);
    }
  };

  // **Prevent Chart Reload on Clear**
  const handleClear = () => {
    setInputValue(""); // Clear only the input field
  };

  // Reset function (clears everything)
  const handleReset = () => {
    setSearchType(null);
    setSelectedValue(null);
    setSearchQuery(null); // Reset search query
    setInputValue(""); // Clear input field
  };

  // Default to including all types if none specified
  const typesToShow = allowedTypes || [
    "sales-person",
    "product",
    "category",
    "customer",
  ];

  return (
    <div className="d-flex gap-2 align-items-center">
      {/* Dropdown to Select Filter Type */}
      <Dropdown onSelect={(eventKey) => handleSearchTypeSelect(eventKey)}>
        <Dropdown.Toggle variant="outline-secondary" id="search-dropdown">
          {searchType
            ? searchType.replace("-", " ").toUpperCase()
            : "Search By"}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {typesToShow.includes("sales-person") && (
            <Dropdown.Item eventKey="sales-person">Sales Person</Dropdown.Item>
          )}
          {typesToShow.includes("product") && (
            <Dropdown.Item eventKey="product">Product</Dropdown.Item>
          )}
          {typesToShow.includes("category") && (
            <Dropdown.Item eventKey="category">Category</Dropdown.Item>
          )}
          {/* {typesToShow.includes("customer") && (
            <Dropdown.Item eventKey="customer">Customer</Dropdown.Item>
          )} */}
        </Dropdown.Menu>
      </Dropdown>

      {/* Search Input with Auto-Suggestions */}
      <div style={{ width: "300px" }}>
        <Select
          ref={selectRef}
          value={selectedValue}
          inputValue={inputValue}
          onChange={handleOptionSelect}
          onInputChange={handleInputChange}
          onFocus={handleFocus}
          options={suggestions}
          isLoading={loading}
          isClearable
          isDisabled={!searchType} // Disable input when no dropdown selection is made
          onBlur={handleClear} // Prevent chart reload on input clear
          placeholder={
            searchType
              ? `Enter ${searchType.replace("-", " ")}`
              : "Select a search type"
          }
          noOptionsMessage={() => (loading ? "Loading..." : "No results found")}
          styles={{
            control: (base, state) => ({
              ...base,
              minHeight: "40px",
              borderColor: state.isFocused ? "#007bff" : "#dee2e6",
              fontSize: "14px",
              backgroundColor: searchType ? "#fff" : "#f8f9fa", // Gray background when disabled
            }),
            option: (base, state) => ({
              ...base,
              backgroundColor: state.isFocused ? "#007bff" : "#fff",
              color: state.isFocused ? "#fff" : "#212529",
            }),
          }}
        />
      </div>

      {/* Reset Button */}
      <Button variant="primary" onClick={handleReset} disabled={!searchType}>
        Reset
      </Button>
    </div>
  );
};

export default AllFilter;