export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
  
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0'); // Ensure two digits for the day
    const month = date.toLocaleString('en-US', { month: 'short' }); // Get abbreviated month name (e.g., "Oct")
    const year = date.getFullYear();
  
    return `${day}-${month}-${year}`;
  };
  