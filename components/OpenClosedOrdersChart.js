// src/components/OpenClosedOrdersChart.js
import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Card, Button, Spinner } from "react-bootstrap";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import SearchBar from './SearchBar';
import useDebounce from '../hooks/useDebounce';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const OrdersChart = () => {
  const [ordersData, setOrdersData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [filters, setFilters] = useState({
    customer: null,
    region: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms debounce

  const colorPalette = {
    primary: "#0d6efd",
    orderLine: "#198754",
  };

  const fetchOrdersData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.customer) queryParams.append('customer', filters.customer);
      if (filters.region) queryParams.append('region', filters.region);

      const response = await fetch(`/api/monthly-orders?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders data');
      }
      const data = await response.json();
      setOrdersData(data.length ? data : []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching orders data:', err);
      setOrdersData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/search?query=${query}`);
      if (!response.ok) throw new Error('Failed to fetch search results');
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };

  const handleSelectResult = (result) => {
    setSearchQuery(result.name);
    setSearchResults([]);

    if (result.type === 'Customer') {
      setFilters(prev => ({ ...prev, customer: result.id }));
    } else if (result.type === 'Region') {
      setFilters(prev => ({ ...prev, region: result.id }));
    }
  };

  const clearFilters = () => {
    setFilters({
      customer: null,
      region: null
    });
    setSearchQuery('');
  };

  useEffect(() => {
    fetchOrdersData();
  }, [filters]);

  useEffect(() => {
    handleSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  // Filter out months with zero data
  const filteredOrdersData = ordersData.filter(data => data.openOrders > 0 || data.closedOrders > 0);

  const ordersChartData = {
    labels: filteredOrdersData.map((data) => months[data.month - 1]),
    datasets: [
      {
        label: "Open Orders",
        data: filteredOrdersData.map((data) => data.openOrders || 0),
        backgroundColor: colorPalette.primary,
        borderColor: colorPalette.primary,
        borderWidth: 1,
        barPercentage: 1,
        categoryPercentage: 0.7,
      },
      {
        label: "Closed Orders",
        data: filteredOrdersData.map((data) => data.closedOrders || 0),
        backgroundColor: colorPalette.orderLine,
        borderColor: colorPalette.orderLine,
        borderWidth: 1,
        barPercentage: 1,
        categoryPercentage: 0.7,
      },
    ],
  };

  const ordersChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000, // Duration of animation in ms
      easing: 'easeInOutQuart',
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            family: "'Inter', sans-serif",
            size: 13,
          },
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: "#212529",
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 13 },
        padding: 12,
        callbacks: {
          label: (tooltipItem) =>
            `${tooltipItem.dataset.label}: ${tooltipItem.raw}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 12 },
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 12 },
        },
      },
    },
  };

  const exportToCSV = () => {
    if (!filteredOrdersData.length) return;
    const csvData = [
      ['Month', ...filteredOrdersData.map(data => months[data.month - 1])],
      ['Open Orders', ...filteredOrdersData.map(data => data.openOrders || 0)],
      ['Closed Orders', ...filteredOrdersData.map(data => data.closedOrders || 0)]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'orders_data.csv');
    link.click();
  };

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-white py-3">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <h4 className="mb-3 mb-md-0" style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}>
            Monthly Open vs Closed Orders
          </h4>
          <div className="d-flex flex-column flex-md-row gap-2 align-items-md-center mt-3 mt-md-0">
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchResults={searchResults}
              handleSelectResult={handleSelectResult}
              placeholder="Search customer or region"
              onSearch={handleSearch}
            />
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                onClick={clearFilters}
                style={{ whiteSpace: 'nowrap' }}
              >
                Clear Filters
              </Button>
              <Button
                variant="outline-primary"
                onClick={exportToCSV}
                disabled={!filteredOrdersData.length}
                style={{ whiteSpace: 'nowrap' }}
              >
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </Card.Header>
      <Card.Body className="position-relative">
        {error && (
          <p className="text-center mt-4 text-danger">Error: {error}</p>
        )}
        <div className="chart-container" style={{ height: "450px", padding: "10px" }}>
          <Bar data={ordersChartData} options={ordersChartOptions} />
          {loading && (
            <div className="position-absolute top-50 start-50 translate-middle bg-white bg-opacity-75 p-3 rounded d-flex align-items-center">
              <Spinner animation="border" role="status" className="me-2">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <span>Updating chart data...</span>
            </div>
          )}
        </div>
        {!loading && !filteredOrdersData.length && !error && (
          <p className="text-center mt-4">No data available for the selected filters.</p>
        )}
      </Card.Body>
    </Card>
  );
};

export default OrdersChart;
