

import { useState, useEffect, useCallback } from "react";

export default function useCustomers({
  initialPage = 1,
  initialSearch = "",
  initialSortField = "CardName",
  initialSortDir = "asc",
  initialStatus = "all",
  itemsPerPage = 20,
} = {}) {
  // Main customer list state
  const [allCustomers, setAllCustomers] = useState([]); // Store ALL customers
  const [customers, setCustomers] = useState([]); // Current page customers
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [sortField, setSortField] = useState(initialSortField);
  const [sortDir, setSortDir] = useState(initialSortDir);
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dropdown specific state
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [dropdownError, setDropdownError] = useState(null);

  // Function to fetch ALL customers from API
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      // Fetch all customers without pagination
      const queryParams = new URLSearchParams({
        search: searchTerm,
        sortField,
        sortDir,
        status,
      }).toString();

      const response = await fetch(`/api/customers?${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch customers");
      }

      const data = await response.json();

      // Store all customers
      setAllCustomers(data.customers || []);
      setTotalItems(data.totalItems || 0);
      
      // Reset to first page when data changes
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      setError(err.message || "Something went wrong");
      setAllCustomers([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, sortField, sortDir, status]);

  // Client-side pagination - update displayed customers when page or data changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCustomers = allCustomers.slice(startIndex, endIndex);
    setCustomers(paginatedCustomers);
  }, [allCustomers, currentPage, itemsPerPage]);

  // Function to fetch customers for dropdown
  const fetchDropdownOptions = useCallback(async () => {
    setDropdownLoading(true);
    setDropdownError(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const response = await fetch('/api/customers?type=dropdown', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : "",
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch customer options');
      }

      const { customers } = await response.json();
      
      const options = customers.map(customer => ({
        value: customer.value || customer.CustomerCode,
        label: customer.label || customer.CustomerName,
      }));

      setDropdownOptions(options);
    } catch (error) {
      console.error("Failed to fetch dropdown options:", error);
      setDropdownError(error.message || "Failed to load customer options");
      setDropdownOptions([]);
    } finally {
      setDropdownLoading(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCustomers();
    }, 300);

    return () => clearTimeout(handler);
  }, [fetchCustomers]);

  // Fetch dropdown options on mount
  useEffect(() => {
    fetchDropdownOptions();
  }, [fetchDropdownOptions]);

  // Helper function to change page
  const goToPage = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
  }, []);

  // Helper function to refresh data
  const refreshCustomers = useCallback(() => {
    fetchCustomers();
    fetchDropdownOptions();
  }, [fetchCustomers, fetchDropdownOptions]);

  // Helper function to handle sort
  const handleSort = useCallback((field) => {
    if (field === sortField) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  }, [sortField, sortDir]);

  // Helper function to reset filters
  const resetFilters = useCallback(() => {
    setSearchTerm(initialSearch);
    setSortField(initialSortField);
    setSortDir(initialSortDir);
    setStatus(initialStatus);
    setCurrentPage(1);
  }, [initialSearch, initialSortField, initialSortDir, initialStatus]);

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    // Main list data
    customers, // Current page customers (20 items)
    allCustomers, // All customers (for Excel export)
    totalItems,
    currentPage,
    totalPages,
    searchTerm,
    sortField,
    sortDir,
    status,
    isLoading,
    error,

    // Dropdown data
    dropdownOptions,
    dropdownLoading,
    dropdownError,

    // Setters
    setSearchTerm,
    setSortField,
    setSortDir,
    setStatus,

    // Helper functions
    goToPage,
    refreshCustomers,
    handleSort,
    resetFilters,
    
    hasActiveFilters: useCallback(() => {
      return searchTerm !== initialSearch || 
             sortField !== initialSortField || 
             sortDir !== initialSortDir || 
             status !== initialStatus;
    }, [searchTerm, sortField, sortDir, status, initialSearch, initialSortField, initialSortDir, initialStatus])
  };
}