import { useState, useEffect, useCallback } from "react";

export default function useCustomers({
  initialPage = 1,
  initialSearch = "",
  initialSortField = "",
  initialSortDir = "asc",
  initialStatus = "all",
} = {}) {
  // Main customer list state
  const [customers, setCustomers] = useState([]);
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

  // Function to fetch customers for the main list
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get token from localStorage or your auth storage
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        search: searchTerm,
        sortField,
        sortDir,
        status,
      }).toString();

      // Make API request
      const response = await fetch(`/api/customers?${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include", // Include cookies if needed
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch customers");
      }

      const data = await response.json();

      // Update state with fetched data
      setCustomers(data.customers);
      setTotalItems(data.totalItems);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, sortField, sortDir, status]);

  // Function to fetch customers for dropdown
  const fetchDropdownOptions = useCallback(async () => {
    setDropdownLoading(true);
    setDropdownError(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const response = await fetch('/api/customers/dropdown', {
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
      
      // Transform data for react-select format
      const options = customers.map(customer => ({
        value: customer.CustomerCode,
        label: customer.CustomerName,
      }));

      setDropdownOptions(options);
    } catch (error) {
      console.error("Failed to fetch dropdown options:", error);
      setDropdownError(error.message || "Failed to load customer options");
    } finally {
      setDropdownLoading(false);
    }
  }, []);

  // Debounce search input to prevent excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCustomers();
    }, 500); // 500ms debounce delay

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
      // If clicking the same field, toggle direction
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set it with default ascending order
      setSortField(field);
      setSortDir('asc');
    }
    // Reset to first page when sorting changes
    setCurrentPage(1);
  }, [sortField, sortDir]);

  // Helper function to reset filters
  const resetFilters = useCallback(() => {
    setSearchTerm(initialSearch);
    setSortField(initialSortField);
    setSortDir(initialSortDir);
    setStatus(initialStatus);
    setCurrentPage(1);
  }, [initialSearch, initialSortField, initialSortDir, initialStatus]);

  return {
    // Main list data
    customers,
    totalItems,
    currentPage,
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
    
    // Additional helper function to check if any filters are active
    hasActiveFilters: useCallback(() => {
      return searchTerm !== '' || 
             sortField !== initialSortField || 
             sortDir !== initialSortDir || 
             status !== initialStatus;
    }, [searchTerm, sortField, sortDir, status, initialSortField, initialSortDir, initialStatus])
  };
}