

// export default CustomerBalanceChart;
import React, { useMemo, useState } from "react";
import { Card, Spinner } from "react-bootstrap";
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

// Status palette — aging severity maps naturally onto good/warning/serious/critical.
// (validated status steps, light surface)
const BUCKET_STATUS = {
  "0-30 Days":  { key: "good",     color: "#0ca30c" },
  "31-60 Days": { key: "warning",  color: "#fab219" },
  "61-90 Days": { key: "serious",  color: "#ec835a" },
  "91+ Days":   { key: "critical", color: "#d03b3b" },
};
const BUCKET_ORDER = ["0-30 Days", "31-60 Days", "61-90 Days", "91+ Days"];

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
    // initialize buckets in fixed severity order
    const buckets = {};
    const counts = {};
    BUCKET_ORDER.forEach((b) => {
      buckets[b] = 0;
      counts[b] = 0;
    });

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
        labels: BUCKET_ORDER,
        values: BUCKET_ORDER.map((b) => buckets[b]),
        customerCounts: BUCKET_ORDER.map((b) => counts[b]),
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
        backgroundColor: BUCKET_ORDER.map((b) => BUCKET_STATUS[b].color),
        borderColor: BUCKET_ORDER.map((b) => BUCKET_STATUS[b].color),
        borderWidth: 0,
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 88,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      // Globally-registered chartjs-plugin-datalabels leaks into every chart
      // unless explicitly disabled per-instance — no numbers drawn on the bars,
      // the figures live in the table below instead.
      datalabels: false,
      tooltip: {
        backgroundColor: "#1a1a19",
        padding: 12,
        cornerRadius: 8,
        titleFont: { weight: "600" },
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
      x: {
        grid: { display: false },
        border: { color: "#c3c2b7" },
        ticks: { color: "#52514e", font: { weight: "500" } },
      },
      y: {
        grid: { color: "#e1e0d9" },
        border: { display: false },
        ticks: { color: "#898781", callback: (v) => formatCurrency(v) },
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
            <div style={{ height: 340 }}>
              <Bar data={data} options={options} />
            </div>

            {/* Beautiful summary table — the numbers live here, not on the bars */}
            <div className="mt-4">
              <div className="table-responsive">
                <table className="cbc-summary-table">
                  <thead>
                    <tr>
                      <th>Aging Range</th>
                      <th className="text-end">Overdue Amount</th>
                      <th className="text-end">Customers</th>
                      <th className="text-end">% of Overdue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BUCKET_ORDER.map((b, idx) => {
                      const amount = chartData.values[idx];
                      const count = chartData.customerCounts[idx];
                      const pct =
                        balanceSummary.totalOverdue > 0
                          ? (amount / balanceSummary.totalOverdue) * 100
                          : 0;
                      return (
                        <tr key={b}>
                          <td>
                            <span
                              className="cbc-swatch"
                              style={{ backgroundColor: BUCKET_STATUS[b].color }}
                            />
                            {b}
                          </td>
                          <td className="text-end">{formatCurrency(amount)}</td>
                          <td className="text-end">{count}</td>
                          <td className="text-end">{pct.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total</td>
                      <td className="text-end">
                        {formatCurrency(balanceSummary.totalOverdue)}
                      </td>
                      <td className="text-end">
                        {balanceSummary.customersWithOverdue}
                      </td>
                      <td className="text-end">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </Card.Body>

      <style jsx>{`
        .cbc-summary-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
        }
        .cbc-summary-table th {
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          color: #898781;
          padding: 8px 10px;
          border-bottom: 2px solid #e1e0d9;
        }
        .cbc-summary-table td {
          padding: 10px;
          border-bottom: 1px solid #e1e0d9;
          color: #0b0b0b;
        }
        .cbc-summary-table tbody tr:hover {
          background: #f9f9f7;
        }
        .cbc-summary-table tfoot td {
          font-weight: 700;
          border-bottom: none;
          border-top: 2px solid #e1e0d9;
        }
        .cbc-swatch {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 3px;
          margin-right: 8px;
        }
      `}</style>
    </Card>
  );
}
