// // import React, { useState,useMemo } from "react";
// // import { Card, Row, Col, Spinner } from "react-bootstrap";
// // import { Bar } from "react-chartjs-2";
// // import { formatCurrency } from "utils/formatCurrency";
// // import {
// //   Chart as ChartJS,
// //   CategoryScale,
// //   LinearScale,
// //   BarElement,
// //   Title,
// //   Tooltip,
// //   Legend,
// // } from "chart.js";
// // import AllFilter from "components/AllFilters.js";

// // // Register ChartJS components
// // ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// // const colorPalette = {
// //   backgroundColor: [
// //     "rgba(25, 135, 84, 0.6)",
// //     "rgba(255, 193, 7, 0.6)",
// //     "rgba(253, 126, 20, 0.6)",
// //     "rgba(220, 53, 69, 0.6)",
// //   ],
// //   borderColor: [
// //     "rgba(25, 135, 84, 1)",
// //     "rgba(255, 193, 7, 1)",
// //     "rgba(253, 126, 20, 1)",
// //     "rgba(220, 53, 69, 1)",
// //   ],
// // };

// // const CustomerBalanceChart = ({ customerBalances, isLoading, onFilterChange }) => {
// //   // State for filters
// //   const [filters, setFilters] = useState({
// //     salesPerson: null,
// //     category: null,
// //     product: null,
// //     customer: null,
// //   });

// //   const handleFilterChange = (value) => {
// //   if (value) {
// //     let filterType;
// //     switch (value.type) {
// //       case "sales-person":
// //         filterType = "salesPerson";
// //         break;
// //       case "category":
// //         filterType = "category";
// //         break;
// //       case "product":
// //         filterType = "product";
// //       case "customer":
// //         filterType = "customer";
// //         break;

// //         break;
// //       default:
// //         return;
// //     }

// //     setFilters((prev) => ({
// //       ...prev,
// //       [filterType]: {
// //         value: value.value,
// //         label: value.label,
// //       },
// //     }));

// //     // Propagate filter changes to parent component
// //     onFilterChange({
// //       ...filters,
// //       [filterType]: {
// //         value: value.value,
// //         label: value.label,
// //       }
// //     });
// //   } else {
// //     // Reset all filters when cleared
// //     const resetFilters = {
// //       salesPerson: null,
// //       category: null,
// //       product: null,
// //     };
// //     setFilters(resetFilters);

// //     // Propagate reset to parent component
// //     onFilterChange(resetFilters);
// //   }
// // };

// //   const { chartData, balanceSummary } = useMemo(() => {
// //     if (!customerBalances || customerBalances.length === 0) {
// //       return {
// //         chartData: {
// //           labels: ["0-30 Days", "31-60 Days", "61-90 Days", "91+ Days"],
// //           values: [0, 0, 0, 0],
// //           customerCounts: [0, 0, 0, 0],
// //         },
// //         balanceSummary: {
// //           total: 0,
// //           totalOverdue: 0,
// //           totalCustomers: 0,
// //           customersWithOverdue: 0,
// //           customerCounts: {},
// //         },
// //       };
// //     }

// //     const buckets = {
// //       "0-30 Days": 0,
// //       "31-60 Days": 0,
// //       "61-90 Days": 0,
// //       "91+ Days": 0,
// //     };

// //     const customerCounts = {
// //       "0-30 Days": 0,
// //       "31-60 Days": 0,
// //       "61-90 Days": 0,
// //       "91+ Days": 0,
// //     };

// //     customerBalances.forEach(entry => {
// //       const range = entry.OverdueRange;
// //       const balance = parseFloat(entry.Balance) || 0;
// //       const count = entry.CustomerCount || 0;

// //       if (range in buckets) {
// //         buckets[range] = balance;
// //         customerCounts[range] = count;
// //       }
// //     });

// //     // Calculate total and overdue metrics
// //     const totalBalance = customerBalances.reduce(
// //       (sum, item) => sum + (parseFloat(item["Balance"]) || 0),
// //       0
// //     );

// //     const totalOverdue = Object.values(buckets).reduce((a, b) => a + b, 0);
// //     const customersWithOverdue = Object.values(customerCounts).reduce((a, b) => a + b, 0);

// //     return {
// //       chartData: {
// //         labels: Object.keys(buckets),
// //         values: Object.values(buckets),
// //         customerCounts: Object.values(customerCounts),
// //       },
// //       balanceSummary: {
// //         total: totalBalance,
// //         totalOverdue,
// //         totalCustomers: customerBalances.length,
// //         customersWithOverdue,
// //         customerCounts,
// //       },
// //     };
// //   }, [customerBalances]);

// //   const data = {
// //     labels: chartData.labels,
// //     datasets: [
// //       {
// //         label: "Overdue Amount",
// //         data: chartData.values,
// //         backgroundColor: colorPalette.backgroundColor,
// //         borderColor: colorPalette.borderColor,
// //         borderWidth: 1,
// //         borderRadius: 6,
// //         maxBarThickness: 80,
// //       },
// //     ],
// //   };

// //   const options = {
// //     responsive: true,
// //     maintainAspectRatio: false,
// //     plugins: {
// //        datalabels: {
// //         display: false, // This disables all data labels for all datasets
// //       },
// //       legend: {
// //         display: false,
// //       },
// //       tooltip: {
// //         backgroundColor: "#212529",
// //         titleFont: { size: 14, weight: "bold" },
// //         bodyFont: { size: 13 },
// //         padding: 12,
// //         callbacks: {
// //           label: (ctx) => {
// //             const value = ctx.parsed.y || 0;
// //             const index = ctx.dataIndex;
// //             const count = chartData.customerCounts[index];
// //             return [`Amount: ${formatCurrency(value)}`, `Invoices: ${count}`];
// //           },
// //         },
// //       },
// //     },
// //     scales: {
// //       x: {
// //         grid: { display: false },
// //         ticks: { font: { size: 12, family: "'Inter', sans-serif" }, color: "#212529" },
// //       },
// //       y: {
// //         grid: { color: "rgba(0,0,0,0.05)" },
// //         ticks: {
// //           callback: (value) => formatCurrency(value),
// //           font: { size: 12, family: "'Inter', sans-serif" },
// //           color: "#212529",
// //         },
// //         beginAtZero: true,
// //       },
// //     },
// //   };

// //   const NoDataDisplay = () => (
// //     <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted">
// //       <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
// //         <path d="M21 21H3" />
// //         <path d="M21 3v18" />
// //         <path d="M3 21V3" />
// //         <path d="M3 3h18" />
// //         <path d="M10 14.5l3-3" />
// //         <path d="M13 11.5l3 3" />
// //         <path d="M8 17.5l8-8" />
// //       </svg>
// //       <p className="mt-3 mb-0">No overdue data available</p>
// //     </div>
// //   );

// //   return (
// //     <Card className="shadow-sm border-0 h-100">
// //       <Card.Header className="bg-white border-0 py-3">
// //         <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
// //           <h5 className="mb-3 mb-md-0 fw-bold">Overdue Balances by Aging</h5>
// //           <div className="ms-auto">
// //             {/* <AllFilter
// //               setSearchQuery={handleFilterChange}
// //             /> */}
// //             <AllFilter
// //               setSearchQuery={handleFilterChange}
// //               allowedTypes={["sales-person", "category", "customer"]}
// //             />
// //           </div>
// //         </div>
// //       </Card.Header>
// //       <Card.Body className="d-flex flex-column">
// //         {isLoading ? (
// //           <div className="d-flex justify-content-center align-items-center flex-grow-1">
// //             <Spinner animation="border" variant="primary" />
// //           </div>
// //         ) : chartData.values.every((value) => value === 0) ? (
// //           <NoDataDisplay />
// //         ) : (
// //           <>
// //             <div className="chart-container" style={{ height: "400px" }}>
// //               <Bar data={data} options={options} />
// //             </div>
// //             <Row className="mt-4">
// //               <Col md={3}>
// //                 <strong>Total Overdue:</strong>{" "}
// //                 {formatCurrency(balanceSummary.totalOverdue)}
// //               </Col>
// //               <Col md={3}>
// //                 <strong>Invoices with Overdue:</strong>{" "}
// //                 {balanceSummary.customersWithOverdue} of{" "}
// //                 {balanceSummary.totalCustomers}
// //               </Col>
// //               <Col md={6}>
// //                 <Row>
// //                   {Object.entries(balanceSummary.customerCounts || {}).map(
// //                     ([bucket, count]) => (
// //                       <Col key={bucket} xs={6} md={3}>
// //                         <small>
// //                           <strong>{bucket}:</strong> {count}
// //                         </small>
// //                       </Col>
// //                     )
// //                   )}
// //                 </Row>
// //               </Col>
// //             </Row>
// //           </>
// //         )}
// //       </Card.Body>
// //     </Card>
// //   );
// // };

// // export default CustomerBalanceChart;

// import React, { useState, useMemo } from "react";
// import { Card, Row, Col, Spinner } from "react-bootstrap";
// import { Bar } from "react-chartjs-2";
// import { formatCurrency } from "utils/formatCurrency";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";
// import AllFilter from "components/AllFilters.js";

// // Register ChartJS components
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// );

// const colorPalette = {
//   backgroundColor: [
//     "rgba(25, 135, 84, 0.6)",
//     "rgba(255, 193, 7, 0.6)",
//     "rgba(253, 126, 20, 0.6)",
//     "rgba(220, 53, 69, 0.6)",
//   ],
//   borderColor: [
//     "rgba(25, 135, 84, 1)",
//     "rgba(255, 193, 7, 1)",
//     "rgba(253, 126, 20, 1)",
//     "rgba(220, 53, 69, 1)",
//   ],
// };

// const CustomerBalanceChart = ({
//   customerBalances,
//   isLoading,
//   onFilterChange,
// }) => {
//   // State for filters
//   const [filters, setFilters] = useState({
//     salesPerson: null,
//     category: null,
//     product: null,
//     customer: null,
//   });

//   const handleFilterChange = (value) => {
//     if (value) {
//       let filterType;
//       switch (value.type) {
//         case "sales-person":
//           filterType = "salesPerson";
//           break;
//         case "category":
//           filterType = "category";
//           break;
//         case "product":
//           filterType = "product";
//           break;
//         case "customer":
//           filterType = "customer";
//           break;
//         default:
//           return;
//       }

//       const updatedFilters = {
//         ...filters,
//         [filterType]: {
//           value: value.value,
//           label: value.label,
//         },
//       };

//       setFilters(updatedFilters);

//       // Propagate filter changes to parent component
//       onFilterChange(updatedFilters);
//     } else {
//       // Reset all filters when cleared
//       const resetFilters = {
//         salesPerson: null,
//         category: null,
//         product: null,
//         customer: null,
//       };
//       setFilters(resetFilters);

//       // Propagate reset to parent component
//       onFilterChange(resetFilters);
//     }
//   };

//   const { chartData, balanceSummary } = useMemo(() => {
//     if (!customerBalances || customerBalances.length === 0) {
//       return {
//         chartData: {
//           labels: ["0-30 Days", "31-60 Days", "61-90 Days", "91+ Days"],
//           values: [0, 0, 0, 0],
//           customerCounts: [0, 0, 0, 0],
//         },
//         balanceSummary: {
//           total: 0,
//           totalOverdue: 0,
//           totalCustomers: 0,
//           customersWithOverdue: 0,
//           customerCounts: {},
//         },
//       };
//     }

//     const buckets = {
//       "0-30 Days": 0,
//       "31-60 Days": 0,
//       "61-90 Days": 0,
//       "91+ Days": 0,
//     };

//     const customerCounts = {
//       "0-30 Days": 0,
//       "31-60 Days": 0,
//       "61-90 Days": 0,
//       "91+ Days": 0,
//     };

//     customerBalances.forEach((entry) => {
//       const range = entry.OverdueRange;
//       const balance = parseFloat(entry.Balance) || 0;
//       const count = entry.CustomerCount || 0;

//       if (range in buckets) {
//         buckets[range] = balance;
//         customerCounts[range] = count;
//       }
//     });

//     // Calculate total and overdue metrics
//     const totalBalance = customerBalances.reduce(
//       (sum, item) => sum + (parseFloat(item["Balance"]) || 0),
//       0
//     );

//     const totalOverdue = Object.values(buckets).reduce((a, b) => a + b, 0);
//     const customersWithOverdue = Object.values(customerCounts).reduce(
//       (a, b) => a + b,
//       0
//     );

//     return {
//       chartData: {
//         labels: Object.keys(buckets),
//         values: Object.values(buckets),
//         customerCounts: Object.values(customerCounts),
//       },
//       balanceSummary: {
//         total: totalBalance,
//         totalOverdue,
//         totalCustomers: customerBalances.length,
//         customersWithOverdue,
//         customerCounts,
//       },
//     };
//   }, [customerBalances]);

//   const data = {
//     labels: chartData.labels,
//     datasets: [
//       {
//         label: "Overdue Amount",
//         data: chartData.values,
//         backgroundColor: colorPalette.backgroundColor,
//         borderColor: colorPalette.borderColor,
//         borderWidth: 1,
//         borderRadius: 6,
//         maxBarThickness: 80,
//       },
//     ],
//   };

//   const options = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       datalabels: {
//         display: false, // This disables all data labels for all datasets
//       },
//       legend: {
//         display: false,
//       },
//       tooltip: {
//         backgroundColor: "#212529",
//         titleFont: { size: 14, weight: "bold" },
//         bodyFont: { size: 13 },
//         padding: 12,
//         callbacks: {
//           label: (ctx) => {
//             const value = ctx.parsed.y || 0;
//             const index = ctx.dataIndex;
//             const count = chartData.customerCounts[index];
//             return [`Amount: ${formatCurrency(value)}`, `Invoices: ${count}`];
//           },
//         },
//       },
//     },
//     scales: {
//       x: {
//         grid: { display: false },
//         ticks: {
//           font: { size: 12, family: "'Inter', sans-serif" },
//           color: "#212529",
//         },
//       },
//       y: {
//         grid: { color: "rgba(0,0,0,0.05)" },
//         ticks: {
//           callback: (value) => formatCurrency(value),
//           font: { size: 12, family: "'Inter', sans-serif" },
//           color: "#212529",
//         },
//         beginAtZero: true,
//       },
//     },
//   };

//   const NoDataDisplay = () => (
//     <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted">
//       <svg
//         width="64"
//         height="64"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="2"
//       >
//         <path d="M21 21H3" />
//         <path d="M21 3v18" />
//         <path d="M3 21V3" />
//         <path d="M3 3h18" />
//         <path d="M10 14.5l3-3" />
//         <path d="M13 11.5l3 3" />
//         <path d="M8 17.5l8-8" />
//       </svg>
//       <p className="mt-3 mb-0">No overdue data available</p>
//     </div>
//   );

//   return (
//     <Card className="shadow-sm border-0 h-100">
//       <Card.Header className="bg-white border-0 py-3">
//         <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
//           <h5 className="mb-3 mb-md-0 fw-bold">Overdue Balances by Aging</h5>
//           <div className="ms-auto">
//             <AllFilter
//               setSearchQuery={handleFilterChange}
//               allowedTypes={["sales-person", "category", "product", "customer"]}
//             />
//           </div>
//         </div>
//       </Card.Header>
//       <Card.Body className="d-flex flex-column">
//         {isLoading ? (
//           <div className="d-flex justify-content-center align-items-center flex-grow-1">
//             <Spinner animation="border" variant="primary" />
//           </div>
//         ) : chartData.values.every((value) => value === 0) ? (
//           <NoDataDisplay />
//         ) : (
//           <>
//             <div className="chart-container" style={{ height: "400px" }}>
//               <Bar data={data} options={options} />
//             </div>
//             <Row className="mt-4">
//               <Col md={3}>
//                 <strong>Total Overdue:</strong>{" "}
//                 {formatCurrency(balanceSummary.totalOverdue)}
//               </Col>
//               <Col md={3}>
//                 <strong>Invoices with Overdue:</strong>{" "}
//                 {balanceSummary.customersWithOverdue} of{" "}
//                 {balanceSummary.totalCustomers}
//               </Col>
//               <Col md={6}>
//                 <Row>
//                   {Object.entries(balanceSummary.customerCounts || {}).map(
//                     ([bucket, count]) => (
//                       <Col key={bucket} xs={6} md={3}>
//                         <small>
//                           <strong>{bucket}:</strong> {count}
//                         </small>
//                       </Col>
//                     )
//                   )}
//                 </Row>
//               </Col>
//             </Row>
//           </>
//         )}
//       </Card.Body>
//     </Card>
//   );
// };

// export default CustomerBalanceChart;
import React, { useMemo, useState } from "react";
import { Card, Row, Col, Spinner } from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import { formatCurrency } from "utils/formatCurrency";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import AllFilter from "components/AllFilters.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Simple helper to parse date ranges if needed
function parseDateForFilter(dateString) {
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? null : d;
}

const colorPalette = {
  backgroundColor: [
    "rgba(25, 135, 84, 0.6)",
    "rgba(255, 193, 7, 0.6)",
    "rgba(253, 126, 20, 0.6)",
    "rgba(220, 53, 69, 0.6)",
  ],
  borderColor: [
    "rgba(25, 135, 84, 1)",
    "rgba(255, 193, 7, 1)",
    "rgba(253, 126, 20, 1)",
    "rgba(220, 53, 69, 1)",
  ],
};

export default function CustomerBalanceChart({
  customerBalances,
  isLoading,
  onFilterChange,
}) {
  // Ensure we always work with an array
  const balancesArray = Array.isArray(customerBalances) ? customerBalances : [];

  // State for filters
  const [filters, setFilters] = useState({
    salesPerson: null,
    category: null,
    customer: null,
  });

  const handleFilterChange = (value) => {
    let newFilters = { ...filters };
    if (value) {
      if (value.type === "sales-person") newFilters.salesPerson = value;
      else if (value.type === "category") newFilters.category = value;
      else if (value.type === "customer") newFilters.customer = value;
    } else {
      // reset all
      newFilters = { salesPerson: null, category: null, customer: null };
    }
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const { chartData, balanceSummary } = useMemo(() => {
    // initialize buckets
    const buckets = {
      "0-30 Days": 0,
      "31-60 Days": 0,
      "61-90 Days": 0,
      "91+ Days": 0,
    };
    const counts = {
      "0-30 Days": 0,
      "31-60 Days": 0,
      "61-90 Days": 0,
      "91+ Days": 0,
    };

    balancesArray.forEach((entry) => {
      const range = entry.OverdueRange;
      const balance = parseFloat(entry.Balance) || 0;
      const count = entry.CustomerCount || 0;
      if (range in buckets) {
        buckets[range] += balance;
        counts[range] += count;
      }
    });

    const total = balancesArray.reduce(
      (sum, e) => sum + (parseFloat(e.Balance) || 0),
      0
    );
    const totalOverdue = Object.values(buckets).reduce((a, b) => a + b, 0);
    const customersWithOverdue = Object.values(counts).reduce(
      (a, b) => a + b,
      0
    );

    return {
      chartData: {
        labels: Object.keys(buckets),
        values: Object.values(buckets),
        customerCounts: Object.values(counts),
      },
      balanceSummary: {
        total,
        totalOverdue,
        totalCustomers: balancesArray.length,
        customersWithOverdue,
        customerCounts: counts,
      },
    };
  }, [balancesArray]);

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: "Overdue Amount",
        data: chartData.values,
        backgroundColor: colorPalette.backgroundColor,
        borderColor: colorPalette.borderColor,
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 80,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.y || 0;
            const idx = ctx.dataIndex;
            const cnt = chartData.customerCounts[idx];
            return [`Amount: ${formatCurrency(val)}`, `Customers: ${cnt}`];
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { callback: (v) => formatCurrency(v) },
        beginAtZero: true,
      },
    },
  };

  const NoData = () => (
    <div className="d-flex justify-content-center align-items-center h-100 text-muted">
      <p>No overdue data available</p>
    </div>
  );

  return (
    <Card className="h-100 shadow-sm border-0">
      <Card.Header className="bg-white border-0 py-3">
        <div className="d-flex align-items-center">
          <h5 className="mb-0 me-auto">Overdue Balances by Aging</h5>
          <AllFilter
            setSearchQuery={handleFilterChange}
            allowedTypes={["sales-person", "category", "customer"]}
            apiPaths={{
              "sales-person": "/api/dashboard/sales-person/distinct",
              category: "/api/dashboard/category/distinct",
              customer: "/api/dashboard/customer/distinct_customer",
            }}
          />
        </div>
      </Card.Header>
      <Card.Body className="d-flex flex-column">
        {isLoading ? (
          <div className="flex-grow-1 d-flex justify-content-center align-items-center">
            <Spinner animation="border" />
          </div>
        ) : chartData.values.every((v) => v === 0) ? (
          <NoData />
        ) : (
          <>
            <div style={{ height: 400 }}>
              <Bar data={data} options={options} />
            </div>
            <Row className="mt-4">
              <Col md={3}>
                <strong>Total Overdue:</strong>{" "}
                {formatCurrency(balanceSummary.totalOverdue)}
              </Col>
              <Col md={3}>
                <strong>Customers Overdue:</strong>{" "}
                {balanceSummary.customersWithOverdue} /{" "}
                {balanceSummary.totalCustomers}
              </Col>
              <Col md={6}>
                <Row>
                  {Object.entries(balanceSummary.customerCounts).map(
                    ([b, c]) => (
                      <Col key={b} xs={6} md={3}>
                        <small>
                          <strong>{b}:</strong> {c}
                        </small>
                      </Col>
                    )
                  )}
                </Row>
              </Col>
            </Row>
          </>
        )}
      </Card.Body>
    </Card>
  );
}
