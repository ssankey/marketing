

import React, { useEffect , useState, useRef, useCallback } from "react";
import Select from "react-select";
import { Button, Dropdown, Spinner } from 'react-bootstrap';
import debounce from 'lodash.debounce';

const AllFilter = ({ searchQuery, setSearchQuery }) => {
    const [searchType, setSearchType] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedValue, setSelectedValue] = useState(null);
    const [inputValue, setInputValue] = useState(""); // Preserve input
    const selectRef = useRef(null);
    const page = useRef(1); // For pagination when fetching product data

    // API Endpoints
    const API_ENDPOINTS = {
        "sales-person": "/api/dashboard/sales-person/distinct-salesperson",
        "product": "/api/products/distinct-product",
        "category": "/api/products/categories",
    };

    // **Caches API responses to prevent redundant requests**
    const cache = useRef({});

    // **Handle dropdown selection**
    const handleSearchTypeSelect = async (type) => {
        setSearchType(type);
        setSearchQuery("");
        setSelectedValue(null);
        setSuggestions([]);
        setInputValue(""); // Reset input when switching filters

        if (type !== "product") {
            await fetchSuggestions("", true);
        }
        if (type === "sales-person") {
        await fetchSuggestions("", true);
    }
    };

    

    // **Debounced function to optimize API calls when typing**
    const debouncedFetchSuggestions = useCallback(
        debounce(async (query) => {
            await fetchSuggestions(query);
        }, 500),
        [searchType]
    );

    // **Fetch suggestions with pagination and caching**
    const fetchSuggestions = async (query = '', initialLoad = false) => {
        if (!searchType) return;

        // Ensure products are fetched on focus and input
        if (searchType === "product" && !query && !initialLoad) return;
if (searchType === "sales-person" && !query && !initialLoad) return;
        // **Check if data is already cached**
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
                formattedSuggestions = data.salesEmployees?.map(emp => ({
                    value: emp.value, 
                    label: `${emp.value} - ${emp.label}`
                })) || [];
            } else if (searchType === "product") {
                formattedSuggestions = data.products?.map(product => ({
                    value: product.value,
                    label: product.label
                })) || []; // **No need to slice here; limit is applied in API**
            } else if (searchType === "category") {
                formattedSuggestions = data.categories?.map(cat => ({
                    value: cat,
                    label: cat,
                })) || [];
            }

            // **Cache results to avoid re-fetching**
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

    // **Handles input change with debounce**
    const handleInputChange = (inputValue, { action }) => {
        setInputValue(inputValue); // Preserve typed value
        if (action === "input-change") {
            debouncedFetchSuggestions(inputValue);
        }
    };

    // **Handles input focus (fetches initial suggestions)**
    const handleFocus = () => {
        if (searchType) {
            fetchSuggestions(inputValue, true);
        }
    };

    // **Handles option selection**
    const handleOptionSelect = (option) => {
        setSelectedValue(option);
        setSearchQuery(option ? {
            value: option.value,     
            label: option.label,     
            type: searchType         
        } : null);
    };

    return (
        <div className="d-flex gap-2 align-items-center">
            {/* Dropdown to Select Filter Type */}
            <Dropdown onSelect={(eventKey) => handleSearchTypeSelect(eventKey)}>
                <Dropdown.Toggle variant="outline-secondary" id="search-dropdown">
                    {searchType ? searchType.replace("-", " ").toUpperCase() : "Search By"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    <Dropdown.Item eventKey="sales-person">Sales Person</Dropdown.Item>
                    <Dropdown.Item eventKey="product">Product</Dropdown.Item>
                    <Dropdown.Item eventKey="category">Category</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>

            {/* Search Input with Auto-Suggestions */}
            <div style={{ width: "300px" }}>
                <Select
                    ref={selectRef}
                    value={selectedValue}
                    inputValue={inputValue} // Keeps input value on blur or tab switch
                    onChange={handleOptionSelect}
                    onInputChange={handleInputChange}
                    onFocus={handleFocus} // Fetch suggestions on focus
                    options={suggestions} 
                    isLoading={loading}
                    placeholder={searchType ? `Enter ${searchType.replace("-", " ")}` : "Select a search type"}
                    noOptionsMessage={() => (loading ? "Loading..." : "No results found")}
                    isClearable
                    styles={{
                        control: (base) => ({
                            ...base,
                            minHeight: "40px",
                            borderColor: "#dee2e6",
                            fontSize: "14px",
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
            <Button variant="primary" onClick={() => handleSearchTypeSelect(null)} disabled={!searchType}>
                Reset
            </Button>
        </div>
    );
};

export default AllFilter;
