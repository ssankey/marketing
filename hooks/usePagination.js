// hooks/useServerPagination.js
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

const usePagination = (totalItems, itemsPerPage) => {
  console.log(totalItems);
  console.log(itemsPerPage);
  
  const router = useRouter();
  const { query } = router;
  
  // Get the current page from the query or default to 1
  const currentPageFromQuery = parseInt(query.page, 10) || 1;
  const [currentPage, setCurrentPage] = useState(currentPageFromQuery);
  
  // Calculate total pages
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Ensure current page is within bounds
  useEffect(() => {
    if (currentPageFromQuery < 1 || currentPageFromQuery > totalPages) {
      handlePageChange(1);
    }
  }, [totalPages, currentPageFromQuery]);
  
  // Update the URL when page changes
  const handlePageChange = (page) => {
    router.push({
      pathname: router.pathname,
      query: { ...query, page }
    });
  };
  
  return {
    currentPage: currentPageFromQuery,
    totalPages,
    onPageChange: handlePageChange
  };
};

export default usePagination;