

import React, { useState, useEffect, useMemo, memo } from "react";
import { useRouter } from "next/router";
import { Container, Spinner } from "react-bootstrap";
import DashboardFilters from "components/DashboardFilters";
import KPISection from "components/KPISection";
import DashboardCharts from "components/DashboardCharts";
import { useAuth } from "hooks/useAuth";
import useDashboardData from "hooks/useDashboardData";

const Dashboard = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, redirecting } = useAuth();
  const [token, setToken] = useState(null);

  useEffect(() => {
    const checkAndSetToken = () => {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        router.push("/login");
        return;
      }

      try {
        const payload = JSON.parse(atob(storedToken.split(".")[1]));
        const expiry = payload.exp * 1000; // Convert to milliseconds

        if (Date.now() >= expiry) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        setToken(storedToken);
      } catch (error) {
        localStorage.removeItem("token");
        router.push("/login");
      }
    };

    checkAndSetToken();
  }, [router]);

  const {
    dateFilter: initialDateFilter = "thisMonth",
    startDate: initialStartDate,
    endDate: initialEndDate,
    region: initialRegion,
    customer: initialCustomer,
    salesPerson: initialSalesPerson,
    salesCategory: initialSalesCategory,
  } = router.query;

  // ... [Filter state management remains the same]
  const [dateFilter, setDateFilter] = useState(initialDateFilter);
  const [startDate, setStartDate] = useState(initialStartDate || "");
  const [endDate, setEndDate] = useState(initialEndDate || "");
  const [region, setRegion] = useState(initialRegion || "");
  const [customer, setCustomer] = useState(initialCustomer || "");
  const [salesPerson, setSalesPerson] = useState(initialSalesPerson || "");
  const [salesCategory, setSalesCategory] = useState(
    initialSalesCategory || ""
  );

  const handleFilterChange = async (filterValues) => {
    const query = {
      ...(filterValues.dateFilter && { dateFilter: filterValues.dateFilter }),
      ...(filterValues.startDate && { startDate: filterValues.startDate }),
      ...(filterValues.endDate && { endDate: filterValues.endDate }),
      ...(filterValues.region && { region: filterValues.region }),
      ...(filterValues.customer && { customer: filterValues.customer }),
      ...(filterValues.salesPerson && {
        salesPerson: filterValues.salesPerson,
      }),
      ...(filterValues.salesCategory && {
        salesCategory: filterValues.salesCategory,
      }),
    };

    Object.keys(query).forEach((key) => {
      if (query[key] === "") {
        delete query[key];
      }
    });

    await router.push({
      pathname: router.pathname,
      query,
    });
  };

  const {
    data,
    error,
    isLoading: dataLoading,
  } = useDashboardData({
    dateFilter,
    startDate,
    endDate,
    region,
    customer,
    salesPerson,
    salesCategory,
    token,
  });

  useEffect(() => {
    if (error?.message === "Token expired" || error?.status === 401) {
      localStorage.removeItem("token");
      router.push("/login");
    }
  }, [error, router]);

  const isPageLoading = authLoading || redirecting || !isAuthenticated;

  if (isPageLoading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
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
      ) : error && error?.message !== "Token expired" ? (
        <div className="text-danger">Failed to load dashboard data.</div>
      ) : (
        // <KPISection kpiData={data?.kpiData} />
        <KPISection
          kpiData={data?.kpiData}
          dateFilter={dateFilter}
          startDate={startDate}
          endDate={endDate}
        />
      )}

      {!dataLoading && !error && <DashboardCharts />}
      {/* {!dataLoading && !error && <MemoizedDashboardCharts />} */}
    </Container>
  );
};

export default Dashboard;