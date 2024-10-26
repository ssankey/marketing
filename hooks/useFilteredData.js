// hooks/useTableFilters.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const useTableFilters = (initialSortField = 'DocNum', initialSortDirection = 'asc') => {
  const router = useRouter();
  const { query } = router;

  // State management for filters and sorting
  const [searchTerm, setSearchTerm] = useState(query.search || '');
  const [statusFilter, setStatusFilter] = useState(query.status || 'all');
  const [fromDate, setFromDate] = useState(query.fromDate || '');
  const [toDate, setToDate] = useState(query.toDate || '');
  const [sortField, setSortField] = useState(initialSortField);
  const [sortDirection, setSortDirection] = useState(initialSortDirection);

  // Handlers to manage state and update query params
  const handleSearch = (value) => {
    setSearchTerm(value);
    router.push({
      pathname: router.pathname,
      query: { ...query, search: value, page: 1 },
    });
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    router.push({
      pathname: router.pathname,
      query: { ...query, status: value, page: 1 },
    });
  };

  const handleDateFilterChange = ({ fromDate, toDate }) => {
    setFromDate(fromDate);
    setToDate(toDate);
    router.push({
      pathname: router.pathname,
      query: { ...query, fromDate, toDate, page: 1 },
    });
  };

  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    router.push({
      pathname: router.pathname,
      query: { ...query, sortField: field, sortDir: newDirection, page: 1 },
    });
  };

  return {
    searchTerm,
    statusFilter,
    fromDate,
    toDate,
    sortField,
    sortDirection,
    handleSearch,
    handleStatusChange,
    handleDateFilterChange,
    handleSort,
  };
};

export default useTableFilters;
