// // /hooks/useCustomers.js

// import { useState, useEffect } from 'react';

// /**
//  * Custom hook to fetch customers from the API.
//  * @param {Object} options - Options for fetching customers.
//  * @param {number} options.initialPage - Initial page number.
//  * @param {string} options.initialSearch - Initial search term.
//  * @param {string} options.initialSortField - Initial sort field.
//  * @param {string} options.initialSortDir - Initial sort direction ('asc' or 'desc').
//  * @param {string} options.initialStatus - Initial status filter ('all', 'active', 'inactive').
//  */
// export default function useCustomers({
//   initialPage = 1,
//   initialSearch = '',
//   initialSortField = '',
//   initialSortDir = 'asc',
//   initialStatus = 'all',
// } = {}) {
//   const [customers, setCustomers] = useState([]);
//   const [totalItems, setTotalItems] = useState(0);
//   const [currentPage, setCurrentPage] = useState(initialPage);
//   const [searchTerm, setSearchTerm] = useState(initialSearch);
//   const [sortField, setSortField] = useState(initialSortField);
//   const [sortDir, setSortDir] = useState(initialSortDir);
//   const [status, setStatus] = useState(initialStatus);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // Debounce search input to prevent excessive API calls
//   useEffect(() => {
//     const handler = setTimeout(() => {
//       fetchCustomers();
//     }, 500); // 500ms debounce delay

//     return () => {
//       clearTimeout(handler);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [searchTerm, currentPage, sortField, sortDir, status]);

//   const fetchCustomers = async () => {
//     setIsLoading(true);
//     setError(null);

//     try {
//       const queryParams = new URLSearchParams({
//         page: currentPage,
//         search: searchTerm,
//         sortField,
//         sortDir,
//         status,
//       }).toString();

//       const response = await fetch(`/api/customers?${queryParams}`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         credentials: 'include', // Include cookies for authentication
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to fetch customers');
//       }

//       const data = await response.json();

//       setCustomers(data.customers);
//       setTotalItems(data.totalItems);
//     } catch (err) {
//       console.error('Failed to fetch customers:', err);
//       setError(err.message || 'Something went wrong');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const goToPage = (pageNumber) => {
//     setCurrentPage(pageNumber);
//   };

//   const refreshCustomers = () => {
//     fetchCustomers();
//   };

//   return {
//     customers,
//     totalItems,
//     currentPage,
//     searchTerm,
//     setSearchTerm,
//     sortField,
//     setSortField,
//     sortDir,
//     setSortDir,
//     status,
//     setStatus,
//     isLoading,
//     error,
//     goToPage,
//     refreshCustomers,
//   };
// }


import { useState, useEffect } from "react";

export default function useCustomers({
  initialPage = 1,
  initialSearch = "",
  initialSortField = "",
  initialSortDir = "asc",
  initialStatus = "all",
} = {}) {
  const [customers, setCustomers] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [sortField, setSortField] = useState(initialSortField);
  const [sortDir, setSortDir] = useState(initialSortDir);
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce search input to prevent excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCustomers();
    }, 500); // 500ms debounce delay

    return () => clearTimeout(handler);
  }, [searchTerm, currentPage, sortField, sortDir, status]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Retrieve the token from localStorage (or wherever you store it)
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const queryParams = new URLSearchParams({
        page: currentPage,
        search: searchTerm,
        sortField,
        sortDir,
        status,
      }).toString();

      // 2. Include the token in the Authorization header
      const response = await fetch(`/api/customers?${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include", // If your auth depends on cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch customers");
      }

      const data = await response.json();

      setCustomers(data.customers);
      setTotalItems(data.totalItems);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const refreshCustomers = () => {
    fetchCustomers();
  };

  return {
    customers,
    totalItems,
    currentPage,
    searchTerm,
    setSearchTerm,
    sortField,
    setSortField,
    sortDir,
    setSortDir,
    status,
    setStatus,
    isLoading,
    error,
    goToPage,
    refreshCustomers,
  };
}
