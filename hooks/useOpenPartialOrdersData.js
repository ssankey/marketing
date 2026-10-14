// hooks/useOpenPartialOrdersData.js
import { useState, useEffect } from 'react';

const useOpenPartialOrdersData = () => {
  const [rawData, setRawData] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const response = await fetch("/api/monthly-open-partial-array", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await response.json();
      
      // Filter out records where Invoice_No is not "N/A"
      // const filteredData = data.filter(record => record.Invoice_No === "N/A");
      
      // setRawData(filteredData);
      setRawData(data);
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
  const processChartData = (data, filters) => {
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

    // Group by Year and Month
    const groupedData = {};
    
    filteredData.forEach(record => {
      const key = `${record.Year}-${record.Month}`;
      
      if (!groupedData[key]) {
        groupedData[key] = {
          year: record.Year,
          month: record.Month,
          monthNumber: record.MonthNumber,
          openOrders: new Set(),
          partialOrders: new Set(),
          openLineItems: 0,
          partialLineItems: 0,
          openValue: 0,
          partialValue: 0,
        };
      }
      
      const group = groupedData[key];
      
      // Count unique SO numbers for Open and Partial orders
      if (record.Status_Header === "Open") {
        group.openOrders.add(record.SO_No);
        
        // Count line items and value for Open orders where Status_Line is "Open"
        if (record.Status_Line === "Open") {
          group.openLineItems++;
          group.openValue += record.Total_Price;
        }
      } else if (record.Status_Header === "Partial") {
        group.partialOrders.add(record.SO_No);
        
        // Count line items and value for Partial orders where Status_Line is "Open"
        if (record.Status_Line === "Open") {
          group.partialLineItems++;
          group.partialValue += record.Total_Price;
        }
      }
    });

    // Convert to array and sort by date
    const processedArray = Object.values(groupedData).map(group => ({
      ...group,
      openOrders: group.openOrders.size,
      partialOrders: group.partialOrders.size,
    })).sort((a, b) => {
      const dateA = new Date(a.year, a.monthNumber - 1);
      const dateB = new Date(b.year, b.monthNumber - 1);
      return dateA - dateB;
    });

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
    processChartData,
    getSelectOptions,
    applyFilters,
    refetch: fetchData
  };
};

export default useOpenPartialOrdersData;