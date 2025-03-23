// src/components/page/vendor-payment/chart/VendorPaymentsChart.js
import React, { useMemo } from "react";
import { Card, Row, Col } from "react-bootstrap";
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
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const VendorPaymentsChart = ({ vendorPayments }) => {
  // Process chart data using useMemo to optimize performance
  const { chartData, overdueSummary } = useMemo(() => {
    // No data check
    if (!vendorPayments || vendorPayments.length === 0) {
      return {
        chartData: { labels: [], values: [] },
        overdueSummary: { total: 0, overdue: 0, current: 0 }
      };
    }

    // Aggregate data by payment terms
    const termData = vendorPayments.reduce((acc, item) => {
      const term = item['Payment Terms Code'] || 'Unknown';
      // Round to 2 decimal places when storing the values
      const balance = Math.round(parseFloat(item['BalanceDue'] || 0) * 100) / 100;

      if (!acc[term]) {
        acc[term] = balance;
      } else {
        acc[term] += balance;
      }
      return acc;
    }, {});

    // Calculate overdue summary with rounded values
    const totalBalance = Math.round(vendorPayments.reduce((sum, item) =>
      sum + (parseFloat(item['BalanceDue']) || 0), 0) * 100) / 100;

    const overdueBalance = Math.round(vendorPayments.reduce((sum, item) => {
      const overdueDays = parseInt(item['Overdue Days']) || 0;
      return sum + (overdueDays > 0 ? parseFloat(item['BalanceDue']) || 0 : 0);
    }, 0) * 100) / 100;

    const currentBalance = Math.round((totalBalance - overdueBalance) * 100) / 100;

    return {
      chartData: {
        labels: Object.keys(termData),
        values: Object.values(termData)
      },
      overdueSummary: {
        total: totalBalance,
        overdue: overdueBalance,
        current: currentBalance
      }
    };
  }, [vendorPayments]);

  // Chart configuration
  const data = {
    labels: chartData.labels,
    datasets: [{
      label: 'Balance Due',
      data: chartData.values,
      backgroundColor: [
        'rgba(54, 162, 235, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(255, 206, 86, 0.6)'
      ],
      borderColor: [
        'rgba(54, 162, 235, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(255, 206, 86, 1)'
      ],
      borderWidth: 1
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(Math.round(value * 100) / 100)
        }
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `Balance: ${formatCurrency(Math.round(context.raw * 100) / 100)}`;
          }
        }
      }
    }
  };

  // Handle no data case
  if (vendorPayments.length === 0) {
    return (
      <Card className="shadow-sm mb-3">
        <Card.Body className="text-center py-4">
          <p className="text-muted mb-0">No payment data available</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Row className="mb-3">
      <Col lg={8}>
        <Card className="shadow-sm h-100">
          <Card.Header className="bg-white py-2">
            <h6 className="mb-0">Balance by Payment Terms</h6>
          </Card.Header>
          <Card.Body>
            {/* Increased height from 240px to 400px */}
            <div style={{ height: "400px" }}>
              <Bar data={data} options={options} />
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col lg={4}>
        <Card className="shadow-sm h-100">
          <Card.Header className="bg-white py-2">
            <h6 className="mb-0">Payment Summary</h6>
          </Card.Header>
          <Card.Body>
            <div className="d-flex flex-column h-100 justify-content-center">
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Total Balance:</span>
                  <span className="fw-bold">{formatCurrency(Math.round(overdueSummary.total * 100) / 100)}</span>
                </div>
                <div className="progress" style={{ height: "8px" }}>
                  <div
                    className="progress-bar bg-primary"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Current:</span>
                  <span className="fw-bold text-success">{formatCurrency(Math.round(overdueSummary.current * 100) / 100)}</span>
                </div>
                <div className="progress" style={{ height: "8px" }}>
                  <div
                    className="progress-bar bg-success"
                    style={{ width: `${(overdueSummary.current / overdueSummary.total * 100) || 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Overdue:</span>
                  <span className="fw-bold text-danger">{formatCurrency(Math.round(overdueSummary.overdue * 100) / 100)}</span>
                </div>
                <div className="progress" style={{ height: "8px" }}>
                  <div
                    className="progress-bar bg-danger"
                    style={{ width: `${(overdueSummary.overdue / overdueSummary.total * 100) || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default VendorPaymentsChart;