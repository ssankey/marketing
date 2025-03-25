import React, { useMemo } from "react";
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

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Define a color palette - based on severity of overdue
const colorPalette = {
  backgroundColor: [
    "rgba(25, 135, 84, 0.6)",    // 0-30 days (green - less severe)
    "rgba(255, 193, 7, 0.6)",    // 31-60 days (yellow - warning)
    "rgba(253, 126, 20, 0.6)",   // 61-90 days (orange - concerning)
    "rgba(220, 53, 69, 0.6)",    // 91+ days (red - critical)
  ],
  borderColor: [
    "rgba(25, 135, 84, 1)",      // 0-30 days
    "rgba(255, 193, 7, 1)",      // 31-60 days
    "rgba(253, 126, 20, 1)",     // 61-90 days
    "rgba(220, 53, 69, 1)",      // 91+ days
  ],
};

const CustomerBalanceChart = ({ customerBalances, isLoading }) => {
  /**
   * 1) Compute chart data and summary stats with useMemo for performance
   */
  const { chartData, balanceSummary } = useMemo(() => {
    // Handle empty data
    if (!customerBalances || customerBalances.length === 0) {
      return {
        chartData: { 
          labels: ["0-30 Days", "31-60 Days", "61-90 Days", "91+ Days"], 
          values: [0, 0, 0, 0] 
        },
        balanceSummary: {
          total: 0,
          totalOverdue: 0,
          totalCustomers: 0,
          customersWithOverdue: 0,
        },
      };
    }

    // Initialize buckets for overdue amounts
    const buckets = {
      "0-30 Days": 0,
      "31-60 Days": 0,
      "61-90 Days": 0,
      "91+ Days": 0
    };
    
    // Calculate number of customers in each bucket
    const customerCounts = {
      "0-30 Days": 0,
      "31-60 Days": 0,
      "61-90 Days": 0,
      "91+ Days": 0
    };
    
    // Categorize each customer's balance into the appropriate bucket
    // customerBalances.forEach(customer => {
    //   const balance = parseFloat(customer.Balance) || 0;
    //   const daysOverdue = customer.DaysOverdue || 0; // Assuming this field exists
      
    //   if (daysOverdue <= 30) {
    //     buckets["0-30 Days"] += balance;
    //     customerCounts["0-30 Days"]++;
    //   } else if (daysOverdue <= 60) {
    //     buckets["31-60 Days"] += balance;
    //     customerCounts["31-60 Days"]++;
    //   } else if (daysOverdue <= 90) {
    //     buckets["61-90 Days"] += balance;
    //     customerCounts["61-90 Days"]++;
    //   } else {
    //     buckets["91+ Days"] += balance;
    //     customerCounts["91+ Days"]++;
    //   }
    // });

  //   customerBalances.forEach(customer => {
  // const balance = parseFloat(customer.Balance) || 0;
  // const daysOverdue = parseInt(customer['Overdue Days']) || 0;

  // if (daysOverdue < 0) return; // Ignore not-yet-due invoices

  // if (daysOverdue <= 30) {
  //   buckets["0-30 Days"] += balance;
  //   customerCounts["0-30 Days"]++;
  // } else if (daysOverdue <= 60) {
  //   buckets["31-60 Days"] += balance;
  //   customerCounts["31-60 Days"]++;
  // } else if (daysOverdue <= 90) {
  //   buckets["61-90 Days"] += balance;
  //   customerCounts["61-90 Days"]++;
  // } else {
  //   buckets["91+ Days"] += balance;
  //   customerCounts["91+ Days"]++;
  // }
  customerBalances.forEach(entry => {
  const range = entry.OverdueRange;
  const balance = parseFloat(entry.Balance) || 0;
  const count = entry.CustomerCount || 0;

  if (range in buckets) {
    buckets[range] = balance;
    customerCounts[range] = count;
  }
});

    
    // Calculate total and overdue metrics
    const totalBalance = customerBalances.reduce(
      (sum, item) => sum + (parseFloat(item.Balance) || 0),
      0
    );
    
    // Total overdue is sum of all buckets (assuming all balances are overdue)
    const totalOverdue = Object.values(buckets).reduce((a, b) => a + b, 0);
    
    // Count of customers with any overdue balance
    const customersWithOverdue = Object.values(customerCounts).reduce((a, b) => a + b, 0);

    return {
      chartData: {
        labels: Object.keys(buckets),
        values: Object.values(buckets),
        customerCounts: Object.values(customerCounts)
      },
      balanceSummary: {
        total: totalBalance,
        totalOverdue,
        totalCustomers: customerBalances.length,
        customersWithOverdue,
        customerCounts
      },
    };
  }, [customerBalances]);

  /**
   * 2) Build the Chart.js dataset
   */
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
      }
    ],
  };

  /**
   * 3) Chart.js options
   */
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#212529",
        titleFont: {
          size: 14,
          weight: "bold",
        },
        bodyFont: {
          size: 13,
        },
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed.y || 0;
            const index = ctx.dataIndex;
            const count = chartData.customerCounts[index];
            return [
              `Amount: ${formatCurrency(value)}`,
              `Customers: ${count}`
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          color: "#212529",
        },
      },
      y: {
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          callback: (value) => formatCurrency(value),
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          color: "#212529",
        },
        beginAtZero: true,
      },
    },
  };

  /**
   * 4) Simple "No Data" display
   */
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
      <p className="mt-3 mb-0">No overdue data available</p>
    </div>
  );

  /**
   * 5) Render the chart within a Card layout
   */
  return (
    <Card className="shadow-sm border-0 h-100">
      <Card.Header className="bg-white border-0 py-3">
        <h5 className="mb-0 fw-bold">Overdue Balances by Aging</h5>
      </Card.Header>

      <Card.Body className="d-flex flex-column">
        {/* Loading State */}
        {isLoading ? (
          <div className="d-flex justify-content-center align-items-center flex-grow-1">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : chartData.values.every(value => value === 0) ? (
          // No Data
          <NoDataDisplay />
        ) : (
          // Bar Chart
          <>
            <div className="chart-container" style={{ height: "400px" }}>
              <Bar data={data} options={options} />
            </div>

            {/* Summary Row */}
            <Row className="mt-4">
              <Col md={3}>
                <strong>Total Overdue:</strong>{" "}
                {formatCurrency(balanceSummary.totalOverdue)}
              </Col>
              <Col md={3}>
                <strong>Customers with Overdue:</strong>{" "}
                {balanceSummary.customersWithOverdue} of {balanceSummary.totalCustomers}
              </Col>
              <Col md={6}>
                <Row>
                  {Object.entries(balanceSummary.customerCounts || {}).map(([bucket, count]) => (
                    <Col key={bucket} xs={6} md={3}>
                      <small>
                        <strong>{bucket}:</strong> {count}
                      </small>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default CustomerBalanceChart;