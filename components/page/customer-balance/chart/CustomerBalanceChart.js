

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
