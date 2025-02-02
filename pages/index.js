// pages/dashboard.js

import React, { useState,useEffect } from 'react';
import { useRouter } from 'next/router';
import { Container, Spinner } from 'react-bootstrap';
import DashboardFilters from 'components/DashboardFilters';
import KPISection from 'components/KPISection';
import DashboardCharts from 'components/DashboardCharts';
import { useAuth } from 'hooks/useAuth';
import useDashboardData from 'hooks/useDashboardData';

const Dashboard = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading, redirecting } = useAuth();
  // const token = localStorage.getItem('token');
  const [token, setToken] = useState(null);

  useEffect(() => {
    // This runs only in the browser, so localStorage is defined
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);
  let user = null;
  if (token) {
    user = JSON.parse(atob(token.split('.')[1])) 
    
  }

  const {
    dateFilter: initialDateFilter = "today",
    startDate: initialStartDate,
    endDate: initialEndDate,
    region: initialRegion,
    customer: initialCustomer,
    salesPerson: initialSalesPerson,
    salesCategory: initialSalesCategory,
  } = router.query;

  const [dateFilter, setDateFilter] = useState(initialDateFilter);
  const [startDate, setStartDate] = useState(initialStartDate || "");
  const [endDate, setEndDate] = useState(initialEndDate || "");
  const [region, setRegion] = useState(initialRegion || "");
  const [customer, setCustomer] = useState(initialCustomer || "");
  const [salesPerson, setSalesPerson] = useState(initialSalesPerson || "");
  const [salesCategory, setSalesCategory] = useState(initialSalesCategory || "");

  const handleFilterChange = async (filterValues) => {
    const query = {
      ...(filterValues.dateFilter && { dateFilter: filterValues.dateFilter }),
      ...(filterValues.startDate && { startDate: filterValues.startDate }),
      ...(filterValues.endDate && { endDate: filterValues.endDate }),
      ...(filterValues.region && { region: filterValues.region }),
      ...(filterValues.customer && { customer: filterValues.customer }),
      ...(filterValues.salesPerson && { salesPerson: filterValues.salesPerson }),
      ...(filterValues.salesCategory && { salesCategory: filterValues.salesCategory }),
    };

    // Remove empty string values from query
    Object.keys(query).forEach(key => {
      if (query[key] === '') {
        delete query[key];
      }
    });

    await router.push({
      pathname: router.pathname,
      query,
    });
  };

  // Use custom hook to fetch dashboard data
  const { data, error, isLoading: dataLoading } = useDashboardData({
    dateFilter,
    startDate,
    endDate,
    region,
    customer,
    salesPerson,
    salesCategory,
    token
  });

  if (isLoading || redirecting) {
    return null;
  }

  return isAuthenticated ? (
    <Container
      fluid
      className="p-4"
      style={{
        backgroundColor: "#f8f9fa",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <DashboardFilters
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        region={region}
        setRegion={setRegion}
        customer={customer}
        setCustomer={setCustomer}
        salesPerson={salesPerson}
        setSalesPerson={setSalesPerson}
        salesCategory={salesCategory}
        setSalesCategory={setSalesCategory}
        handleFilterChange={handleFilterChange}
      />

      {dataLoading ? (
        <div className="d-flex justify-content-center my-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : error ? (
        <div className="text-danger">Failed to load dashboard data.</div>
      ) : (
        <KPISection kpiData={data.kpiData} />
      )}

      {!dataLoading && !error && <DashboardCharts />}
    </Container>
  ) : null;
};

export default Dashboard;
