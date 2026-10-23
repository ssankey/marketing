// hooks/useDailyReportData.js
import { useState, useEffect } from 'react';

const useDailyReportData = () => {
  const [rawData, setRawData] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Fetch data from API
  const fetchData = async (year, month) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/daily-report?year=${year || ''}&month=${month || ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await response.json();
      setRawData(data);
      
      // Extract available months for dropdown
      const monthsMap = {};
      data.forEach(record => {
        const key = `${record.Year}-${record.MonthNumber}`;
        monthsMap[key] = {
          year: record.Year,
          monthNumber: record.MonthNumber,
          monthName: record.Month
        };
      });
      
      const months = Object.values(monthsMap).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.monthNumber - a.monthNumber;
      });
      
      setAvailableMonths(months);
      
      // Set current month as default if not already selected
      if (!selectedMonth && months.length > 0) {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        
        const found = months.find(m => 
          m.monthNumber === currentMonth && m.year === currentYear
        );
        
        setSelectedMonth(found || months[0]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
      setRawData([]);
      setProcessedData([]);
    } finally {
      setLoading(false);
    }
  };

  // Process data for chart
  const processChartData = (data, filters, monthData) => {
    // Apply filters
    let filteredData = data;
    
    if (filters.salesPerson) {
      filteredData = filteredData.filter(record => record.Sales_Person === filters.salesPerson);
    }
    if (filters.contactPerson) {
      filteredData = filteredData.filter(record => record.Contact_Person === filters.contactPerson);
    }
    if (filters.category) {
      filteredData = filteredData.filter(record => record.Category === filters.category);
    }
    if (filters.product) {
      filteredData = filteredData.filter(record => record.Item_No === filters.product);
    }
    if (filters.customer) {
      filteredData = filteredData.filter(record => record.Customer === filters.customer);
    }

    // Filter by selected month if provided
    if (monthData) {
      filteredData = filteredData.filter(record => 
        record.Year === monthData.year && 
        record.MonthNumber === monthData.monthNumber
      );
    }

    // Group by Day
    const groupedData = {};
    
    filteredData.forEach(record => {
      const day = record.Day;
      
      if (!groupedData[day]) {
        groupedData[day] = {
          day,
          orderCount: 0,
          totalValue: 0,
          orders: []
        };
      }
      
      groupedData[day].orderCount++;
      groupedData[day].totalValue += record.Total_Price;
      groupedData[day].orders.push(record);
    });

    // Convert to array and sort by day
    const processedArray = Object.values(groupedData).sort((a, b) => a.day - b.day);

    setProcessedData(processedArray);
  };

  // Get unique values for filters
  const getUniqueValues = (field) => {
    return [...new Set(rawData.map(record => record[field]))].filter(Boolean);
  };

  // Convert unique values to react-select format
  const getSelectOptions = (field) => {
    return getUniqueValues(field).map(value => ({
      value,
      label: value
    }));
  };

  // Apply filters to raw data
  const applyFilters = (data, filters) => {
    let filteredData = data;
    
    if (filters.salesPerson) {
      filteredData = filteredData.filter(record => record.Sales_Person === filters.salesPerson);
    }
    if (filters.contactPerson) {  
      filteredData = filteredData.filter(record => record.Contact_Person === filters.contactPerson);
    }
    if (filters.category) {
      filteredData = filteredData.filter(record => record.Category === filters.category);
    }
    if (filters.product) {
      filteredData = filteredData.filter(record => record.Item_No === filters.product);
    }
    if (filters.customer) {
      filteredData = filteredData.filter(record => record.Customer === filters.customer);
    }

    return filteredData;
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    rawData,
    processedData,
    loading,
    error,
    availableMonths,
    selectedMonth,
    setSelectedMonth,
    processChartData,
    getSelectOptions,
    applyFilters,
    refetch: fetchData
  };
};

export default useDailyReportData;