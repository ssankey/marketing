


// src/components/DashboardCharts.js
import React, { memo, useState, useEffect } from 'react';
import { Card, Row, Col, Spinner, ListGroup } from 'react-bootstrap';
import { Bar, Doughnut } from 'react-chartjs-2';
import { formatCurrency } from 'utils/formatCurrency';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import EnhancedSalesCOGSChart from './EnhancedSalesCOGSChart';
import OrdersChart from "./OpenClosedOrdersChart";
import FilterDropdown from './FilterDropdown';
import CustomerBalancesChart from './CustomerBalancesChart';
import VendorPaymentsChart from './VendorPaymentsChart';
 import CustomerAgingChart from "./CustomerCharts/customeragingreport";
 import DeliveryPerformanceChart from "./CustomerCharts/ordertodelievery";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const colorPalette = {
  primary: '#0d6efd',
  secondary: '#6c757d',
  success: '#198754',
  warning: '#ffc107',
  info: '#0dcaf0',
  dark: '#212529',
  light: '#f8f9fa',
  gradient: [
    '#0d6efd',
    '#6610f2',
    '#6f42c1',
    '#d63384',
    '#dc3545',
    '#fd7e14',
    '#ffc107',
    '#198754',
    '#20c997',
    '#0dcaf0'
  ]
};

// 1) Define a named function component
function DashboardCharts({ userRole }) {
  const [topCustomers, setTopCustomers] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [customersDateFilter, setCustomersDateFilter] = useState('today');
  const [categoriesDateFilter, setCategoriesDateFilter] = useState('today');
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState(null);

  const fetchChartData = async (type, filter) => {
    try {
      if (type === 'customers') setLoadingCustomers(true);
      else if (type === 'categories') setLoadingCategories(true);

      const params = new URLSearchParams({ dateFilter: filter });
      const response = await fetch(`/api/dashboard/${type}?${params}`);
      if (!response.ok) throw new Error(`Failed to fetch ${type} data`);
      const data = await response.json();

      if (type === 'customers') {
        setTopCustomers(data);
      } else {
        setTopCategories(data);
      }
    } catch (err) {
      setError(err.message);
      console.error(`Error fetching ${type} data:`, err);
    } finally {
      if (type === 'customers') setLoadingCustomers(false);
      else if (type === 'categories') setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchChartData('customers', customersDateFilter);
  }, [customersDateFilter]);

  useEffect(() => {
    fetchChartData('categories', categoriesDateFilter);
  }, [categoriesDateFilter]);

  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: { display: false },
      legend: { display: false },
      tooltip: {
        backgroundColor: colorPalette.dark,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        padding: 12,
        callbacks: {
          label: (tooltipItem) => `${formatCurrency(tooltipItem.raw)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 12, family: "'Inter', sans-serif" },
          color: colorPalette.dark,
          maxRotation: 45,
          minRotation: 45,
          callback: function (value) {
            const label = this.getLabelForValue(value);
            if (label.length > 15) {
              return label.substr(0, 10) + '...';
            }
            return label;
          },
        },
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: {
          callback: (value) => formatCurrency(value),
          font: { size: 12, family: "'Inter', sans-serif" },
          color: colorPalette.dark,
        },
        beginAtZero: true,
      },
    },
  };

  const customersChartData = {
    labels: topCustomers.map((c) => c.Customer),
    datasets: [
      {
        label: 'Sales',
        data: topCustomers.map((c) => c.Sales || 0),
        backgroundColor: colorPalette.primary,
        borderRadius: 6,
        maxBarThickness: 40,
      },
    ],
  };

  const categoriesChartData = {
    labels: topCategories.map((cat) => cat.Category),
    datasets: [
      {
        data: topCategories.map((cat) => cat.Sales || 0),
        backgroundColor: colorPalette.gradient.slice(0, topCategories.length),
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: { display: false },
      legend: { display: false },
      tooltip: {
        backgroundColor: colorPalette.dark,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        padding: 12,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = formatCurrency(context.raw);
            return `${label}: ${value}`;
          },
        },
      },
    },
    cutout: '70%',
  };

  const NoDataDisplay = () => (
    <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted">
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 21H3" />
        <path d="M21 3v18" />
        <path d="M3 21V3" />
        <path d="M3 3h18" />
        <path d="M10 14.5l3-3" />
        <path d="M13 11.5l3 3" />
        <path d="M8 17.5l8-8" />
      </svg>
      <p className="mt-3 mb-0">No data available for this time period</p>
    </div>
  );

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Card className="shadow-sm border-0 p-4">
          <Card.Body className="text-center">
            <h5 className="text-danger">Error: {error}</h5>
            <p>Please try refreshing the page or contact support.</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="g-4">
      <EnhancedSalesCOGSChart />
      {/* <DeliveryPerformanceChart /> */}
      <OrdersChart />

      {/* Show admin-only content: */}
      {userRole === "admin" && (
        <>
          <Row className="g-4 mt-4">
            <Col lg={6} md={6}>
              <CustomerBalancesChart />
            </Col>
            <Col lg={6} md={6}>
              <VendorPaymentsChart />
            </Col>
          </Row>

          <Row className="g-4 mt-4">
            <Col lg={7} md={12}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-white border-0 py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">Top Customers</h5>
                    <FilterDropdown
                      currentFilter={customersDateFilter}
                      setFilter={setCustomersDateFilter}
                    />
                  </div>
                </Card.Header>
                <Card.Body className="d-flex flex-column">
                  {loadingCustomers ? (
                    <div className="d-flex justify-content-center align-items-center flex-grow-1">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  ) : topCustomers.length === 0 ? (
                    <NoDataDisplay />
                  ) : (
                    <div
                      className="chart-container"
                      style={{ height: "400px" }}
                    >
                      <Bar
                        data={customersChartData}
                        options={commonChartOptions}
                      />
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={5} md={12}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-white border-0 py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">Sales by Category</h5>
                    <FilterDropdown
                      currentFilter={categoriesDateFilter}
                      setFilter={setCategoriesDateFilter}
                    />
                  </div>
                </Card.Header>
                <Card.Body className="d-flex flex-column">
                  {loadingCategories ? (
                    <div className="d-flex justify-content-center align-items-center flex-grow-1">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  ) : topCategories.length === 0 ? (
                    <NoDataDisplay />
                  ) : (
                    <Row className="flex-grow-1">
                      <Col
                        md={7}
                        className="d-flex justify-content-center align-items-center"
                      >
                        <Doughnut
                          data={categoriesChartData}
                          options={doughnutOptions}
                        />
                      </Col>
                      <Col md={5} className="d-flex align-items-center">
                        <ListGroup variant="flush" className="w-100">
                          {topCategories.map((category, index) => (
                            <ListGroup.Item
                              key={index}
                              className="d-flex justify-content-between align-items-center px-2 py-1"
                            >
                              <div className="d-flex align-items-center">
                                <span
                                  className="me-2"
                                  style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    backgroundColor:
                                      colorPalette.gradient[
                                        index % colorPalette.gradient.length
                                      ],
                                  }}
                                />
                                <span className="small text-capitalize">
                                  {category.Category}
                                </span>
                              </div>
                              <span className="fw-bold small">
                                {formatCurrency(category.Sales || 0)}
                              </span>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}

// 2) Wrap in memo and export
export default memo(DashboardCharts);