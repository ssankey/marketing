

// src/components/DashboardCharts.js
import React, { memo, useState, useEffect } from 'react';
import { Card, Row, Col, Spinner, ListGroup } from 'react-bootstrap';
import { Bar, Doughnut } from 'react-chartjs-2';
import { formatCurrency } from 'utils/formatCurrency';
import { useAuth } from 'contexts/AuthContext';
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
import CategorySalesChart from "./CustomerCharts/CategorySalesChart";
import OrdersChartArray from "./OpenClosedOrdersChartArray";
import OrdersChartArrayMerged from "./open-partial-chart/OpenClosedOrdersChartArray";
import DailyReportChart from './daily-report/DailyReportChart';
import OrderToInvoiceChart from 'components/main-page/order-to-invoice/OrderToInvoiceChart';
import OrderToInvoiceChartBucket from 'components/main-page/order-to-invoice-buckets/order-to-invoice-charts';


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

function DashboardCharts({ userRole }) {
  const { user } = useAuth();
  const [topCustomers, setTopCustomers] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [customersDateFilter, setCustomersDateFilter] = useState('today');
  const [categoriesDateFilter, setCategoriesDateFilter] = useState('today');
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState(null);

  // Check if user has admin or sales role
  const isAdminOrSales = ['admin', 'sales_person'].includes(user?.role);

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

  // ... rest of your existing code (commonChartOptions, customersChartData, etc.) ...

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
    {/* <OrdersChartArrayMerged/>
      <DailyReportChart />
      <OrderToInvoiceChart />
      <OrderToInvoiceChartBucket /> */}
      <DailyReportChart />
      <OrderToInvoiceChart />
      

      
      {/* Conditionally render DeliveryPerformanceChart for admin/sales */}
      {/* {isAdminOrSales && <DeliveryPerformanceChart />} */}
       {/* <DeliveryPerformanceChart /> */}
      
      {/* <OrdersChart />
      <OrdersChartArray/> */}
      {/* <OrdersChartArrayMerged/> */}
      
      {/* Conditionally render CategorySalesChart for admin/sales */}
      {isAdminOrSales && <CategorySalesChart />}
      
      {/* Other charts that should be visible to all roles */}
      {/* <CustomerBalancesChart />
      <VendorPaymentsChart />
      <CustomerAgingChart /> */}
    </div>
  );
}

export default memo(DashboardCharts);