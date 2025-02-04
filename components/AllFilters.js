

import React, { useState, useRef } from "react";
import Select from "react-select";
import { Card, Table, Button, Spinner, Dropdown, Form } from 'react-bootstrap';

const AllFilter = ({ searchQuery, setSearchQuery }) => {
    const [searchType, setSearchType] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedValue, setSelectedValue] = useState(null);
    const selectRef = useRef(null);

    // API Endpoints
    const API_ENDPOINTS = {
        "sales-person": "/api/dashboard/sales-person/distinct-salesperson",
        "product": "/api/products/distinct-product",
        "category": "/api/products/categories",
    };

    // Handle dropdown selection
    const handleSearchTypeSelect = (type) => {
        setSearchType(type);
        setSearchQuery("");
        setSelectedValue(null);
        setSuggestions([]);
    };


    const fetchSuggestions = async (query = '') => {
    if (!searchType) return;

    setLoading(true);
    try {
        const url = `${API_ENDPOINTS[searchType]}${query ? `?search=${encodeURIComponent(query)}` : ''}`;
        console.log("Fetching suggestions from:", url);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        console.log("API Response:", data);

        let formattedSuggestions = [];
        if (searchType === "sales-person") {
            formattedSuggestions = data.salesEmployees?.map(emp => ({
                value: emp.value, // SlpCode
                label: `${emp.value} - ${emp.label}` // SlpCode + SlpName
            })) || [];
        } else if (searchType === "product") {
            formattedSuggestions = data.products
                .filter(product => 
                    product.label.toLowerCase().includes(query.toLowerCase()) || 
                    product.value.toLowerCase().includes(query.toLowerCase())
                );
        } else if (searchType === "category") {
            formattedSuggestions = data.categories?.map(cat => ({
                value: cat,
                label: cat,
            })) || [];
        }

        console.log("Formatted Suggestions:", formattedSuggestions);
        setSuggestions(formattedSuggestions);
    } catch (error) {
        console.error(`Error fetching ${searchType} suggestions:`, error);
        setSuggestions([]);
    } finally {
        setLoading(false);
    }
};



// Modify handleFocus to do nothing for products
const handleFocus = () => {
    // Only fetch all suggestions for non-product search types
    if (searchType !== "product") {
        fetchSuggestions();
    }
    
    // Programmatically open the dropdown menu
    if (selectRef.current) {
        selectRef.current.focus();
    }
};

// Modify handleInputChange to work with products
const handleInputChange = (inputValue, { action }) => {
    if (action === "input-change") {
        // For products, fetch suggestions with any input length
        if (searchType === "product" && inputValue.length > 0) {
            fetchSuggestions(inputValue);
        } 
        // For other types, keep existing logic
        else if (searchType !== "product" && inputValue.length > 1) {
            fetchSuggestions(inputValue);
        }
    }
};

  

    const handleOptionSelect = (option) => {
  setSelectedValue(option);
  
  // Return more information for filtering
  setSearchQuery(option ? {
    value: option.value,     // SlpCode, ItemCode, etc.
    label: option.label,     // Full label for display
    type: searchType         // Filter type
  } : null);
};

    // Reset everything
    const handleReset = () => {
        setSearchType(null);
        setSearchQuery("");
        setSelectedValue(null);
        setSuggestions([]);
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
                    onChange={handleOptionSelect}
                    onInputChange={handleInputChange}
                    onFocus={handleFocus}
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
            <Button variant="primary" onClick={handleReset} disabled={!searchType}>
                Reset
            </Button>
        </div>
    );
};

export default AllFilter;



 