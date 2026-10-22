// components/page/customer-balance/chart/CustomerBalanceChart.js
// Bucketing now happens client-side off the exact same `invoices` rows the
// Customer Balance Summary table (customer-bal-table.js) renders below this
// — previously this fetched a separate, pre-aggregated endpoint built off
// SAP's GL postings (JDT1), a different data source from the table's own
// OINV-based one, so the two could never be expected to agree, and this
// chart's own filters never touched the table. One shared dataset (passed
// down from pages/customer-balance/index.js, filtered server-side there)
// fixes both at once. Visual language is also now the exact same `.cbt-`
// design system as the Summary table (same tokens, same card/table/toolbar
// treatment) instead of a plain Bootstrap Card, so the two sections read as
// one page instead of two different UIs stacked on top of each other.
import React, { useMemo, useState } from "react";
import { Spinner } from "react-bootstrap";
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BUCKET_STATUS = {
  "0-30 Days":  { color: "#21875a" },
  "31-60 Days": { color: "#d4a017" },
  "61-90 Days": { color: "#c0763a" },
  "91+ Days":   { color: "#c0402f" },
};
const BUCKET_ORDER = ["0-30 Days", "31-60 Days", "61-90 Days", "91+ Days"];

const bucketFor = (overdueDays) => {
  if (overdueDays <= 30) return "0-30 Days";
  if (overdueDays <= 60) return "31-60 Days";
  if (overdueDays <= 90) return "61-90 Days";
  return "91+ Days";
};

export default function CustomerBalanceChart({ invoices, isLoading, onFilterChange }) {
  const rows = Array.isArray(invoices) ? invoices : [];

  const [filters, setFilters] = useState({ salesPerson: null, category: null, customer: null });

  const handleFilterChange = (value) => {
    let newFilters = { ...filters };
    if (value) {
      if (value.type === "sales-person") newFilters.salesPerson = value;
      else if (value.type === "category") newFilters.category = value;
      else if (value.type === "customer") newFilters.customer = value;
    } else {
      newFilters = { salesPerson: null, category: null, customer: null };
    }
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Only invoices actually past due belong in an "Overdue Balances" view —
  // a negative OverdueDays means it isn't due yet. The Summary table below
  // still shows every outstanding invoice regardless; this chart is scoped
  // to overdue ones specifically, same as its own title says.
  const { chartData, balanceSummary } = useMemo(() => {
    const buckets = {};
    const counts = {};
    const customersInBucket = {};
    BUCKET_ORDER.forEach((b) => { buckets[b] = 0; counts[b] = 0; customersInBucket[b] = new Set(); });

    rows.forEach((row) => {
      const overdueDays = row.OverdueDays;
      if (overdueDays == null || overdueDays < 0) return;
      const bucket = bucketFor(overdueDays);
      const amount = parseFloat(row.BalanceDue) || 0;
      buckets[bucket] += amount;
      customersInBucket[bucket].add(row.CardCode);
    });
    BUCKET_ORDER.forEach((b) => { counts[b] = customersInBucket[b].size; });

    const totalOverdue = Object.values(buckets).reduce((a, b) => a + b, 0);
    const customersWithOverdue = new Set(
      rows.filter((r) => r.OverdueDays != null && r.OverdueDays >= 0).map((r) => r.CardCode)
    ).size;

    return {
      chartData: {
        labels: BUCKET_ORDER,
        values: BUCKET_ORDER.map((b) => buckets[b]),
        customerCounts: BUCKET_ORDER.map((b) => counts[b]),
      },
      balanceSummary: { totalOverdue, customersWithOverdue },
    };
  }, [rows]);

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: "Overdue Amount",
        data: chartData.values,
        backgroundColor: BUCKET_ORDER.map((b) => BUCKET_STATUS[b].color),
        borderWidth: 0,
        borderRadius: 6,
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
      datalabels: false,
      tooltip: {
        backgroundColor: "#10151c",
        padding: 12,
        cornerRadius: 6,
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
        border: { color: "#c5d2dc" },
        ticks: { color: "#52606d", font: { family: "'IBM Plex Mono', monospace", size: 11, weight: "500" } },
      },
      y: {
        grid: { color: "#e0edf9" },
        border: { display: false },
        ticks: { color: "#52606d", font: { family: "'IBM Plex Mono', monospace", size: 11 }, callback: (v) => formatCurrency(v) },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="cbc">
      <style>{CHART_STYLES}</style>

      <div className="cbc-toolbar">
        <div className="cbc-title">Overdue Balances by Aging</div>
        <AllFilter
          setSearchQuery={handleFilterChange}
          allowedTypes={["sales-person", "category", "customer"]}
        />
      </div>

      <div className="cbc-card">
        {isLoading ? (
          <div className="cbc-loading">
            <Spinner animation="border" size="sm" />
            <span>Loading…</span>
          </div>
        ) : chartData.values.every((v) => v === 0) ? (
          <div className="cbc-empty">No overdue balances for the current filter.</div>
        ) : (
          <>
            <div style={{ height: 300 }}>
              <Bar data={data} options={options} />
            </div>

            <div className="cbc-table-scroll mt-3">
              <table className="cbc-table">
                <thead>
                  <tr>
                    <th className="cbc-th-left">Aging Range</th>
                    <th className="cbc-th-right">Overdue Amount</th>
                    <th className="cbc-th-right">Customers</th>
                    <th className="cbc-th-right">% of Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {BUCKET_ORDER.map((b, idx) => {
                    const amount = chartData.values[idx];
                    const count = chartData.customerCounts[idx];
                    const pct = balanceSummary.totalOverdue > 0 ? (amount / balanceSummary.totalOverdue) * 100 : 0;
                    return (
                      <tr key={b}>
                        <td>
                          <span className="cbc-swatch" style={{ backgroundColor: BUCKET_STATUS[b].color }} />
                          {b}
                        </td>
                        <td className="cbc-num">{formatCurrency(amount)}</td>
                        <td className="cbc-num">{count}</td>
                        <td className="cbc-num">{pct.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td className="cbc-num">{formatCurrency(balanceSummary.totalOverdue)}</td>
                    <td className="cbc-num">{balanceSummary.customersWithOverdue}</td>
                    <td className="cbc-num">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Same tokens/typography as components/page/customer-balance/table/customer-bal-table.js's
// .cbt- design system, scoped under .cbc- so the two sections read as one
// consistent page instead of two different UI languages stacked together.
const CHART_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

  .cbc {
    --surface: #ffffff;
    --surface2: #e0edf9;
    --border: #c5d2dc;
    --text: #10151c;
    --muted: #52606d;
    --accent: #1f68bf;
    font-family: 'IBM Plex Sans', sans-serif;
    color: var(--text);
  }

  .cbc-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; flex-wrap: wrap; margin-bottom: 14px;
  }
  .cbc-title {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.5px; color: var(--text);
  }

  .cbc-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 18px;
  }

  .cbc-loading, .cbc-empty {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 60px 0; color: var(--muted);
    font-family: 'IBM Plex Mono', monospace; font-size: 13px;
  }

  .cbc-table-scroll { overflow-x: auto; }
  .cbc-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .cbc-table th {
    background: var(--surface2);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;
    font-weight: 600; color: var(--muted);
    border-bottom: 1px solid var(--border);
    padding: 8px 12px; white-space: nowrap;
  }
  .cbc-th-left { text-align: left; }
  .cbc-th-right { text-align: right; }
  .cbc-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); color: var(--text); }
  .cbc-table tbody tr:hover { background: var(--surface2); }
  .cbc-table tbody tr:last-child td { border-bottom: none; }
  .cbc-num { text-align: right; font-family: 'IBM Plex Mono', monospace; }
  .cbc-table tfoot td { font-weight: 700; border-top: 2px solid var(--border); border-bottom: none; background: #f0f4ff; color: var(--accent); }
  .cbc-swatch { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 8px; }
`;
