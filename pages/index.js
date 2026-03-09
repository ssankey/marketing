
// // pages/index.js

// import React, { useState, useEffect } from "react";
// import { useRouter } from "next/router";
// import { Container, Spinner } from "react-bootstrap";
// import DashboardFilters from "components/DashboardFilters";
// import KPISection from "components/KPISection";
// import DashboardCharts from "components/DashboardCharts";
// import { useAuth } from "hooks/useAuth";
// import useDashboardData from "hooks/useDashboardData";

// const Dashboard = () => {
//   const router = useRouter();
//   const { isAuthenticated, isLoading: authLoading, redirecting, user } = useAuth();
//   const [token, setToken] = useState(null);
//   const [shouldRedirect, setShouldRedirect] = useState(false);

//   // 1) Authentication check + role-based redirect
//   useEffect(() => {
//     const checkAndSetToken = () => {
//       const stored = localStorage.getItem("token");
//       if (!stored) {
//         router.push("/login");
//         return;
//       }
//       try {
//         const payload = JSON.parse(atob(stored.split(".")[1]));
//         if (Date.now() >= payload.exp * 1000) {
//           localStorage.removeItem("token");
//           router.push("/login");
//           return;
//         }
//         setToken(stored);
        
//         // Check if user has 3ASenrise role and should be redirected
//         if (payload.role === "3ASenrise") {
//           setShouldRedirect(true);
//         }
//       } catch {
//         localStorage.removeItem("token");
//         router.push("/login");
//       }
//     };
//     checkAndSetToken();
//   }, [router]);

//   // 2) Redirect 3ASenrise users to products page
//   useEffect(() => {
//     if (shouldRedirect) {
//       router.replace("/products");
//     }
//   }, [shouldRedirect, router]);

//   // 3) Also check from useAuth hook if user role is 3ASenrise
//   useEffect(() => {
//     if (user?.role === "3ASenrise") {
//       setShouldRedirect(true);
//     }
//   }, [user]);

//   // 4) Pull initial filter values from URL
//   const {
//     dateFilter: initialDateFilter = "thisMonth",
//     startDate: initialStartDate,
//     endDate: initialEndDate,
//     region: initialRegion,
//     customer: initialCustomer,
//     salesPerson: initialSalesPerson,
//     salesCategory: initialSalesCategory,
//   } = router.query;

//   // 5) Local state for filters
//   const [dateFilter, setDateFilter] = useState(initialDateFilter);
//   const [startDate, setStartDate] = useState(initialStartDate || "");
//   const [endDate, setEndDate] = useState(initialEndDate || "");
//   const [region, setRegion] = useState(initialRegion || "");
//   const [customer, setCustomer] = useState(initialCustomer || "");
//   const [salesPerson, setSalesPerson] = useState(initialSalesPerson || "");
//   const [salesCategory, setSalesCategory] = useState(initialSalesCategory || "");

//   // 6) Push filter changes to URL
//   const handleFilterChange = async (fv) => {
//     const q = {
//       ...(fv.dateFilter && { dateFilter: fv.dateFilter }),
//       ...(fv.startDate && { startDate: fv.startDate }),
//       ...(fv.endDate && { endDate: fv.endDate }),
//       ...(fv.region && { region: fv.region }),
//       ...(fv.customer && { customer: fv.customer }),
//       ...(fv.salesPerson && { salesPerson: fv.salesPerson }),
//       ...(fv.salesCategory && { salesCategory: fv.salesCategory }),
//     };
//     Object.keys(q).forEach((k) => q[k] === "" && delete q[k]);
//     await router.push({ pathname: router.pathname, query: q });
//   };

//   // 7) Fetch KPI data only
//   const {
//     data: kpiResponse,
//     error: kpiError,
//     isLoading: kpiLoading,
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

//   // 8) Handle token expiry
//   useEffect(() => {
//     if (kpiError?.message === "Token expired" || kpiError?.status === 401) {
//       localStorage.removeItem("token");
//       router.push("/login");
//     }
//   }, [kpiError, router]);

//   const isPageLoading = authLoading || redirecting || !isAuthenticated || shouldRedirect;

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
//       style={{ backgroundColor: "#f8f9fa", fontFamily: "'Inter', sans-serif" }}
//     >
//       {/* — Filters always rendered */}
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

//       {/* — KPI section reloads on any filter change */}
//       {kpiLoading ? (
//         <div className="d-flex justify-content-center my-5">
//           <Spinner animation="border" variant="primary" />
//         </div>
//       ) : kpiError ? (
//         <div className="text-danger">Failed to load KPI data.</div>
//       ) : (
//         <KPISection
//           kpiData={kpiResponse?.kpiData}
//           salesData={kpiResponse?.salesData}
//           ordersData={kpiResponse?.ordersData}
//           dateFilter={dateFilter}
//           startDate={startDate}
//           endDate={endDate}
//         />
//       )}

//       {/* — Charts are now COMPLETELY independent */}
//       <DashboardCharts />
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
import DashboardCharts from "components/DashboardCharts";
import { useAuth } from "hooks/useAuth";
import useDashboardData from "hooks/useDashboardData";

const Dashboard = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, redirecting, user } = useAuth();
  const [token, setToken] = useState(null);

  // 1) Authentication check - NO role-based redirect
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
        
        // REMOVED: No automatic redirect for 3ASenrise
        // if (payload.role === "3ASenrise") {
        //   setShouldRedirect(true);
        // }
      } catch {
        localStorage.removeItem("token");
        router.push("/login");
      }
    };
    checkAndSetToken();
  }, [router]);

  // REMOVED: The useEffect that redirects 3ASenrise users

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
          salesData={kpiResponse?.salesData}
          ordersData={kpiResponse?.ordersData}
          dateFilter={dateFilter}
          startDate={startDate}
          endDate={endDate}
        />
      )}

      {/* — Charts are now COMPLETELY independent */}
      <DashboardCharts userRole={user?.role} />
    </Container>
  );
};

export default Dashboard;