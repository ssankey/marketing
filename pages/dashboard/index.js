import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Container, Row, Col, Card } from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import { useAuth } from "../../utils/useAuth";
import { formatCurrency } from "utils/formatCurrency";
import LoadingSpinner from "components/LoadingSpinner";
import DashboardFilters from "components/DashboardFilters";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  CurrencyDollar,
  Cart4,
  PiggyBank,
  GraphUpArrow,
  ExclamationCircle,
} from "react-bootstrap-icons";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = ({
  quotationConversionRate,
  NumberOfSalesOrders,
  totalSalesRevenue,
  outstandingInvoices,
  salesData = [],
  topCustomers = [],
  topCategories = [],
  openOrders = 0,
}) => {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Client-only authenticatio

  const colorPalette = {
    primary: "#4A6CF7",
    secondary: "#8A94A6",
    success: "#28a745",
    danger: "#dc3545",
    warning: "#ffc107",
    info: "#17a2b8",
    light: "#f8f9fa",
    dark: "#343a40",
  };

  function getColor(index) {
    const colors = [
      "#3366CC",
      "#DC3912",
      "#FF9900",
      "#109618",
      "#990099",
      "#0099C6",
      "#DD4477",
      "#66AA00",
      "#B82E2E",
      "#316395",
    ];
    return colors[index % colors.length];
  }

  const salesAndCOGSChartData = {
    labels: salesData.map((data) => data.month),
    datasets: [
      {
        label: "Sales",
        data: salesData.map((data) => data.sales || 0),
        backgroundColor: colorPalette.primary,
        borderColor: colorPalette.primary,
        borderWidth: 1,
        maxBarThickness: 30,
        order: 1,
      },
      {
        label: "COGS",
        data: salesData.map((data) => data.cogs || 0),
        backgroundColor: colorPalette.warning,
        borderColor: colorPalette.warning,
        borderWidth: 1,
        maxBarThickness: 30,
        order: 1,
      },
      {
        label: "GrossMargin",
        data: salesData.map((data) => data.grossMargin || 0),
        type: "line",
        borderColor: "green",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        order: 2,
      },
    ],
  };

  const salesAndCOGSChartOptions = {
    scales: {
      x: {
        ticks: {
          callback: (value, index) => salesAndCOGSChartData.labels[index] || "",
          font: { family: "'Inter', sans-serif" },
        },
      },
      y: {
        ticks: {
          callback: (value) => value.toLocaleString(),
          font: { family: "'Inter', sans-serif" },
        },
      },
    },
  };

  const topCustomersChartData = {
    labels: topCustomers.map((customer) => customer.Customer),
    datasets: [
      {
        label: "Sales",
        data: topCustomers.map((customer) => customer.Sales || 0),
        backgroundColor: topCustomers.map((_, index) => getColor(index)),
        maxBarThickness: 100,
      },
    ],
  };

  const topCategoriesChartData = {
    labels: topCategories.map((category) => category.Category),
    datasets: [
      {
        label: "Sales",
        data: topCategories.map((category) => category.Sales || 0),
        backgroundColor: topCategories.map((_, index) =>
          getColor(index + topCustomers.length)
        ),
        maxBarThickness: 100,
      },
    ],
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Container
      fluid
      className="p-4"
      style={{
        backgroundColor: colorPalette.light,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <DashboardFilters
        handleFilterChange={async (filterValues) => {
          setIsLoading(true);
          const query = {
            ...(filterValues.dateFilter && {
              dateFilter: filterValues.dateFilter,
            }),
            ...(filterValues.startDate && {
              startDate: filterValues.startDate,
            }),
            ...(filterValues.endDate && { endDate: filterValues.endDate }),
            ...(filterValues.region && { region: filterValues.region }),
            ...(filterValues.customer && { customer: filterValues.customer }),
          };
          await router.push({ pathname: router.pathname, query });
          setIsLoading(false);
        }}
      />
      <Row className="g-4 mb-4">{/* Cards rendering goes here */}</Row>
      {/* Charts rendering here */}
      <Card className="mb-4 shadow-sm">
        <Card.Header
          className="bg-white py-3"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.1)" }}
        >
          <h4
            className="mb-0"
            style={{ fontWeight: 600, color: colorPalette.dark }}
          >
            Sales vs COGS
          </h4>
        </Card.Header>
        <Card.Body>
          <div style={{ height: "400px" }}>
            <Bar
              data={salesAndCOGSChartData}
              options={salesAndCOGSChartOptions}
            />
          </div>
        </Card.Body>
      </Card>
      {/* Additional charts for top customers and categories */}
    </Container>
  );
};

export default Dashboard;

export async function getServerSideProps(context) {
  

  const {
    dateFilter = "today",
    startDate,
    endDate,
    region,
    customer,
  } = context.query;

  const calculateDateRange = (dateFilter, startDate, endDate) => {
    const today = new Date();
    let computedStartDate = startDate;
    let computedEndDate = endDate;

    if (!startDate || !endDate || dateFilter !== "custom") {
      if (dateFilter === "today") {
        computedStartDate = computedEndDate = today.toISOString().split("T")[0];
      } else if (dateFilter === "thisWeek") {
        const firstDayOfWeek = new Date(
          today.setDate(today.getDate() - today.getDay() + 1)
        );
        const lastDayOfWeek = new Date(
          today.setDate(today.getDate() - today.getDay() + 7)
        );
        computedStartDate = firstDayOfWeek.toISOString().split("T")[0];
        computedEndDate = lastDayOfWeek.toISOString().split("T")[0];
      } else if (dateFilter === "thisMonth") {
        const firstDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );
        const lastDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        );
        computedStartDate = firstDayOfMonth.toISOString().split("T")[0];
        computedEndDate = lastDayOfMonth.toISOString().split("T")[0];
      }
    }
    return { startDate: computedStartDate, endDate: computedEndDate };
  };

  const computedDates = calculateDateRange(dateFilter, startDate, endDate);

  const {
    getNumberOfSalesOrders,
    getTotalSalesRevenue,
    getOutstandingInvoices,
    getQuotationConversionRate,
    getSalesAndCOGS,
    getTopCustomers,
    getTopCategories,
    getTotalOpenOrders,
  } = require("lib/models/dashboard");

  try {
    const [
      quotationConversionRate,
      NumberOfSalesOrders,
      totalSalesRevenue,
      outstandingInvoices,
      salesData,
      topCustomers,
      topCategories,
      openOrders,
    ] = await Promise.all([
      getQuotationConversionRate({ ...computedDates, region, customer }),
      getNumberOfSalesOrders({ ...computedDates, region, customer }),
      getTotalSalesRevenue({ ...computedDates, region, customer }),
      getOutstandingInvoices({ ...computedDates, region, customer }),
      getSalesAndCOGS({ ...computedDates, region, customer }),
      getTopCustomers({ ...computedDates, region, customer }),
      getTopCategories({ ...computedDates, region, customer }),
      getTotalOpenOrders({ region, customer }),
    ]);

    return {
      props: {
        quotationConversionRate,
        NumberOfSalesOrders,
        totalSalesRevenue,
        outstandingInvoices,
        salesData,
        topCustomers: topCustomers || [],
        topCategories: topCategories || [],
        openOrders: openOrders[0]?.TotalOpenOrders || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return {
      props: {
        salesData: [],
        topCustomers: [],
        topCategories: [],
        openOrders: 0,
      },
    };
  }
}
