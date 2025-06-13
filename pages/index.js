// //pages/index.js

// import React, { useState, useEffect, useMemo, memo } from "react";
// import { useRouter } from "next/router";
// import { Container, Spinner } from "react-bootstrap";
// import DashboardFilters from "components/DashboardFilters";
// import KPISection from "components/KPISection";
// import DashboardCharts from "components/DashboardCharts";
// import { useAuth } from "hooks/useAuth";
// import useDashboardData from "hooks/useDashboardData";

// const Dashboard = () => {
//   const router = useRouter();
//   const { isAuthenticated, isLoading: authLoading, redirecting } = useAuth();
//   const [token, setToken] = useState(null);

//   useEffect(() => {
//     const checkAndSetToken = () => {
//       const storedToken = localStorage.getItem("token");
//       if (!storedToken) {
//         router.push("/login");
//         return;
//       }

//       try {
//         const payload = JSON.parse(atob(storedToken.split(".")[1]));
//         const expiry = payload.exp * 1000; // Convert to milliseconds

//         if (Date.now() >= expiry) {
//           localStorage.removeItem("token");
//           router.push("/login");
//           return;
//         }

//         setToken(storedToken);
//       } catch (error) {
//         localStorage.removeItem("token");
//         router.push("/login");
//       }
//     };

//     checkAndSetToken();
//   }, [router]);

//   const {
//     dateFilter: initialDateFilter = "thisMonth",
//     startDate: initialStartDate,
//     endDate: initialEndDate,
//     region: initialRegion,
//     customer: initialCustomer,
//     salesPerson: initialSalesPerson,
//     salesCategory: initialSalesCategory,
//   } = router.query;
  

//   // ... [Filter state management remains the same]
//   const [dateFilter, setDateFilter] = useState(initialDateFilter);
//   const [startDate, setStartDate] = useState(initialStartDate || "");
//   const [endDate, setEndDate] = useState(initialEndDate || "");
//   const [region, setRegion] = useState(initialRegion || "");
//   const [customer, setCustomer] = useState(initialCustomer || "");
//   const [salesPerson, setSalesPerson] = useState(initialSalesPerson || "");
//   const [salesCategory, setSalesCategory] = useState(
//     initialSalesCategory || ""
//   );

//   const handleFilterChange = async (filterValues) => {
//     const query = {
//       ...(filterValues.dateFilter && { dateFilter: filterValues.dateFilter }),
//       ...(filterValues.startDate && { startDate: filterValues.startDate }),
//       ...(filterValues.endDate && { endDate: filterValues.endDate }),
//       ...(filterValues.region && { region: filterValues.region }),
//       ...(filterValues.customer && { customer: filterValues.customer }),
//       ...(filterValues.salesPerson && {
//         salesPerson: filterValues.salesPerson,
//       }),
//       ...(filterValues.salesCategory && {
//         salesCategory: filterValues.salesCategory,
//       }),
//     };

//     Object.keys(query).forEach((key) => {
//       if (query[key] === "") {
//         delete query[key];
//       }
//     });

//     await router.push({
//       pathname: router.pathname,
//       query,
//     });
//   };

//   const {
//     data,
//     error,
//     isLoading: dataLoading,
//   } = useDashboardData({
//     dateFilter,
//     startDate,
//     endDate,
//     region,
//     customer,
//     salesPerson,
//     salesCategory,
//     token,
//   });
  

//   useEffect(() => {
//     if (error?.message === "Token expired" || error?.status === 401) {
//       localStorage.removeItem("token");
//       router.push("/login");
//     }
//   }, [error, router]);

//   const isPageLoading = authLoading || redirecting || !isAuthenticated;

//   if (isPageLoading) {
//     return (
//       <div className="d-flex justify-content-center my-5">
//         <Spinner animation="border" variant="primary" />
//       </div>
//     );
//   }

//   return (
//     <Container
//       fluid
//       className="p-4"
//       style={{
//         backgroundColor: "#f8f9fa",
//         fontFamily: "'Inter', sans-serif",
//       }}
//     >
//       <DashboardFilters
//         dateFilter={dateFilter}
//         setDateFilter={setDateFilter}
//         startDate={startDate}
//         setStartDate={setStartDate}
//         endDate={endDate}
//         setEndDate={setEndDate}
//         region={region}
//         setRegion={setRegion}
//         customer={customer}
//         setCustomer={setCustomer}
//         salesPerson={salesPerson}
//         setSalesPerson={setSalesPerson}
//         salesCategory={salesCategory}
//         setSalesCategory={setSalesCategory}
//         handleFilterChange={handleFilterChange}
//       />

//       {dataLoading ? (
//         <div className="d-flex justify-content-center my-5">
//           <Spinner animation="border" variant="primary" />
//         </div>
//       ) : error && error?.message !== "Token expired" ? (
//         <div className="text-danger">Failed to load dashboard data.</div>
//       ) : (
//         // <KPISection kpiData={data?.kpiData} />
//         <KPISection
//           kpiData={data?.kpiData}
//           dateFilter={dateFilter}
//           startDate={startDate}
//           endDate={endDate}
//         />
//       )}

//       {!dataLoading && !error && <DashboardCharts />}
      
//     </Container>
//   );
// };

// export default Dashboard;

// pages/index.js

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Container, Spinner } from "react-bootstrap";
import DashboardFilters from "components/DashboardFilters";
import KPISection from "components/KPISection";
import DashboardCharts from "components/DashboardCharts";  // ← assume this is already `export default memo(DashboardCharts)`
import { useAuth } from "hooks/useAuth";
import useDashboardData from "hooks/useDashboardData";

const Dashboard = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, redirecting } = useAuth();
  const [token, setToken] = useState(null);

  // 1) Authentication check (unchanged)
  useEffect(() => {
    const checkAndSetToken = () => {
      const stored = localStorage.getItem("token");
      if (!stored) {
        router.push("/login");
        return;
      }
      try {
        const payload = JSON.parse(atob(stored.split(".")[1]));
        if (Date.now() >= payload.exp * 1000) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        setToken(stored);
      } catch {
        localStorage.removeItem("token");
        router.push("/login");
      }
    };
    checkAndSetToken();
  }, [router]);

  // 2) Pull initial filter values from URL
  const {
    dateFilter: initialDateFilter = "thisMonth",
    startDate: initialStartDate,
    endDate: initialEndDate,
    region: initialRegion,
    customer: initialCustomer,
    salesPerson: initialSalesPerson,
    salesCategory: initialSalesCategory,
  } = router.query;

  // 3) Local state for filters
  const [dateFilter, setDateFilter] = useState(initialDateFilter);
  const [startDate, setStartDate] = useState(initialStartDate || "");
  const [endDate, setEndDate] = useState(initialEndDate || "");
  const [region, setRegion] = useState(initialRegion || "");
  const [customer, setCustomer] = useState(initialCustomer || "");
  const [salesPerson, setSalesPerson] = useState(initialSalesPerson || "");
  const [salesCategory, setSalesCategory] = useState(initialSalesCategory || "");

  // 4) Push filter changes to URL
  const handleFilterChange = async (fv) => {
    const q = {
      ...(fv.dateFilter && { dateFilter: fv.dateFilter }),
      ...(fv.startDate && { startDate: fv.startDate }),
      ...(fv.endDate && { endDate: fv.endDate }),
      ...(fv.region && { region: fv.region }),
      ...(fv.customer && { customer: fv.customer }),
      ...(fv.salesPerson && { salesPerson: fv.salesPerson }),
      ...(fv.salesCategory && { salesCategory: fv.salesCategory }),
    };
    Object.keys(q).forEach((k) => q[k] === "" && delete q[k]);
    await router.push({ pathname: router.pathname, query: q });
  };

  // 5) Fetch KPI data only
  const {
    data: kpiResponse,
    error: kpiError,
    isLoading: kpiLoading,
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

  // 6) Handle token expiry
  useEffect(() => {
    if (kpiError?.message === "Token expired" || kpiError?.status === 401) {
      localStorage.removeItem("token");
      router.push("/login");
    }
  }, [kpiError, router]);

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
      style={{ backgroundColor: "#f8f9fa", fontFamily: "'Inter', sans-serif" }}
    >
      {/* — Filters always rendered */}
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

      {/* — KPI section reloads on any filter change */}
      {kpiLoading ? (
        <div className="d-flex justify-content-center my-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : kpiError ? (
        <div className="text-danger">Failed to load KPI data.</div>
      ) : (
        <KPISection
          kpiData={kpiResponse?.kpiData}
          dateFilter={dateFilter}
          startDate={startDate}
          endDate={endDate}
        />
      )}

      {/* — Charts are now COMPLETELY independent */}
      <DashboardCharts />
    </Container>
  );
};

export default Dashboard;
