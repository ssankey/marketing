// components/page/products/EnergySealAnalysis.js
import React, { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { getEnergySealMonthOptions } from "../../../utils/energySeal/constants";
import { formatCurrency } from "utils/formatCurrency";
import EnergySealLineItemsModal from "components/modal/EnergySealLineItemsModal";
import UltraDrySolventsModal from "components/modal/UltraDrySolventsModal";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const GROUP_OPTIONS = [
  { value: "salesperson", label: "Sales Person Wise", fieldLabel: "Sales Person" },
  { value: "region", label: "Region Wise", fieldLabel: "Region" },
];

const COLUMNS = [
  { key: "field", label: "Field", align: "left" },
  { key: "salesValue", label: "Sales Value", align: "right" },
  { key: "lineItems", label: "Line Items", align: "right" },
  { key: "orderValue", label: "Order Value", align: "right" },
];

// White/blue theme — chart bars use the sequential-blue ramp's mid step.
const BLUE = "#2a78d6";
const BLUE_HOVER = "#1c5cab";
const BLUE_SOFT = "#eaf2fc";
const BLUE_BORDER = "#cde2fb";
const INK = "#1e293b";
const INK_MUTED = "#64748b";

export default function EnergySealAnalysis() {
  const monthOptions = useMemo(() => getEnergySealMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState(
    monthOptions[monthOptions.length - 1]?.value || ""
  );
  const [groupBy, setGroupBy] = useState("salesperson");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sort, setSort] = useState({ key: "salesValue", direction: "desc" });
  const [lineItemsField, setLineItemsField] = useState(null);
  const [showUltraDryModal, setShowUltraDryModal] = useState(false);

  useEffect(() => {
    if (!selectedMonth) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/products/energy-seal-sales?month=${selectedMonth}&groupBy=${groupBy}`
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load data");
        if (!cancelled) setData(json.data || []);
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          setData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [selectedMonth, groupBy]);

  // Reset to the default sort (sales value, descending) whenever the grouping changes.
  useEffect(() => {
    setSort({ key: "salesValue", direction: "desc" });
  }, [groupBy]);

  const activeGroup = GROUP_OPTIONS.find((g) => g.value === groupBy);

  const sortedData = useMemo(() => {
    const rows = [...data];
    rows.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
      return sort.direction === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [data, sort]);

  const totals = data.reduce(
    (acc, row) => ({
      salesValue: acc.salesValue + (row.salesValue || 0),
      lineItems: acc.lineItems + (row.lineItems || 0),
      orderValue: acc.orderValue + (row.orderValue || 0),
    }),
    { salesValue: 0, lineItems: 0, orderValue: 0 }
  );

  const handleSort = (key) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "desc" ? "asc" : "desc" }
        : { key, direction: "desc" }
    );
  };

  // Chart always ranks by sales value, independent of the table's current sort.
  const chartData = useMemo(
    () => [...data].sort((a, b) => b.salesValue - a.salesValue),
    [data]
  );

  const barChartData = {
    labels: chartData.map((r) => r.field),
    datasets: [
      {
        label: "Sales Value",
        data: chartData.map((r) => r.salesValue),
        backgroundColor: BLUE,
        hoverBackgroundColor: BLUE_HOVER,
        borderRadius: 4,
        maxBarThickness: 48,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: INK,
        bodyColor: INK,
        borderColor: BLUE_BORDER,
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => `Sales Value: ${formatCurrency(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: INK_MUTED, font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#e2e8f0" },
        ticks: {
          color: INK_MUTED,
          font: { size: 11 },
          callback: (value) => formatCurrency(value),
        },
      },
    },
  };

  const sortIndicator = (key) => {
    if (sort.key !== key) return null;
    return <span style={{ marginLeft: 6 }}>{sort.direction === "asc" ? "▲" : "▼"}</span>;
  };

  return (
    <div style={{ padding: 24, background: "#f8fafc" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <h3 style={{ color: BLUE, margin: 0 }}>Energy Seal — Sales Analytics</h3>
          <button
            onClick={() => setShowUltraDryModal(true)}
            style={{
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              color: BLUE,
              background: BLUE_SOFT,
              border: `1px solid ${BLUE_BORDER}`,
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Check Ultra Dry Solvents Products
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ color: INK, fontWeight: 600, fontSize: 14 }}>Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={selectStyle}
            >
              {monthOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "inline-flex", border: `2px solid ${BLUE_BORDER}`, borderRadius: 6, overflow: "hidden" }}>
            {GROUP_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setGroupBy(o.value)}
                style={{
                  padding: "9px 16px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  backgroundColor: groupBy === o.value ? BLUE : "white",
                  color: groupBy === o.value ? "white" : BLUE,
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: BLUE }}>Loading…</div>
      ) : error ? (
        <div style={{ padding: 24, textAlign: "center", color: "#dc2626" }}>{error}</div>
      ) : data.length === 0 ? (
        <div
          style={{
            padding: 48,
            textAlign: "center",
            backgroundColor: BLUE_SOFT,
            borderRadius: 12,
            border: `2px dashed ${BLUE_BORDER}`,
            color: BLUE,
          }}
        >
          No Energy Seal sales found for the selected month.
        </div>
      ) : (
        <>
          {/* Bar chart */}
          <div
            style={{
              background: "white",
              border: `1px solid ${BLUE_BORDER}`,
              borderRadius: 12,
              padding: "20px 20px 8px",
              marginBottom: 24,
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
            }}
          >
            <div style={{ color: INK, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
              Sales Value by {activeGroup.fieldLabel}
            </div>
            <div style={{ height: Math.max(240, chartData.length * 34) }}>
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>

          {/* Table */}
          <div
            style={{
              overflowX: "auto",
              background: "white",
              border: `1px solid ${BLUE_BORDER}`,
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead style={{ backgroundColor: BLUE_SOFT }}>
                <tr>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      style={{
                        ...thStyle,
                        textAlign: col.align,
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                      title="Click to sort"
                    >
                      {col.key === "field" ? activeGroup.fieldLabel : col.label}
                      {sortIndicator(col.key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedData.map((row, idx) => (
                  <tr key={row.field} style={{ backgroundColor: idx % 2 === 0 ? "white" : "#f8fafc" }}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: INK }}>{row.field}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{formatCurrency(row.salesValue)}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10 }}>
                        <span>{row.lineItems}</span>
                        <button
                          onClick={() => setLineItemsField(row.field)}
                          style={{
                            padding: "3px 10px",
                            fontSize: 12,
                            fontWeight: 600,
                            color: BLUE,
                            background: BLUE_SOFT,
                            border: `1px solid ${BLUE_BORDER}`,
                            borderRadius: 5,
                            cursor: "pointer",
                          }}
                        >
                          Check Items
                        </button>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{formatCurrency(row.orderValue)}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: BLUE_SOFT, fontWeight: 700 }}>
                  <td style={{ ...tdStyle, color: BLUE }}>TOTAL</td>
                  <td style={{ ...tdStyle, textAlign: "right", color: BLUE }}>{formatCurrency(totals.salesValue)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", color: BLUE }}>{totals.lineItems}</td>
                  <td style={{ ...tdStyle, textAlign: "right", color: BLUE }}>{formatCurrency(totals.orderValue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {lineItemsField && (
        <EnergySealLineItemsModal
          show={!!lineItemsField}
          onClose={() => setLineItemsField(null)}
          month={selectedMonth}
          groupBy={groupBy}
          field={lineItemsField}
          fieldLabel={activeGroup.fieldLabel}
        />
      )}

      {showUltraDryModal && (
        <UltraDrySolventsModal show={showUltraDryModal} onClose={() => setShowUltraDryModal(false)} />
      )}
    </div>
  );
}

const selectStyle = {
  padding: "8px 12px",
  borderRadius: 6,
  border: `2px solid ${BLUE_BORDER}`,
  color: INK,
  fontWeight: 500,
  fontSize: 14,
  cursor: "pointer",
  background: "white",
};

const thStyle = {
  padding: 12,
  border: `1px solid ${BLUE_BORDER}`,
  color: BLUE,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: 12,
  border: `1px solid ${BLUE_BORDER}`,
  whiteSpace: "nowrap",
  color: INK,
};
