// components/OpenClosedOrdersChart.js
import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import { Card, Spinner } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import { useRouter } from "next/router";
import ChartDataLabels from "chartjs-plugin-datalabels";
import AllFilter from "components/AllFilters.js";
import MonthlyOrdersModal from "components/modal/MonthlyOrdersModal";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const monthMapping = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};

const formatMonthYear = (year, month) => {
  const monthIndex = monthMapping[month];
  if (monthIndex === undefined) return "Invalid Date";
  const date = new Date(year, monthIndex);
  return date.toLocaleDateString("default", { month: "short", year: "numeric" });
};

const OrdersChart = () => {
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    year: null,
    month: null,
    status: null
  });
  const [filters, setFilters] = useState({
    salesPerson: null,
    contactPerson: null,
    category: null,
    product: null,
    customer: null,
  });

  const chartRef = useRef(null);
  const router = useRouter();

  const fetchOrdersData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();

      if (filters.salesPerson?.value) {
        queryParams.append("slpCode", filters.salesPerson.value);
      }
      if (filters.contactPerson?.value) {
        queryParams.append("contactPerson", filters.contactPerson.value);
      }
      if (filters.category?.value) {
        queryParams.append("itmsGrpCod", filters.category.value);
      }
      if (filters.product?.value) {
        queryParams.append("itemCode", filters.product.value);
      }
      if (filters.customer?.value) {
        queryParams.append("cardCode", filters.customer.value);
      }

      const response = await fetch(`/api/monthly-orders?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders data");
      }

      const { data } = await response.json();
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.year, monthMapping[a.month]);
        const dateB = new Date(b.year, monthMapping[b.month]);
        return dateA - dateB;
      });

      setOrdersData(sortedData);
    } catch (err) {
      console.error("Error fetching orders data:", err);
      setError(err.message);
      setOrdersData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersData();
  }, [filters]);

  const handleBarClick = (year, month, status) => {
    setModalData({ year, month, status });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalData({ year: null, month: null, status: null });
  };

  const labels = ordersData.map((d) => formatMonthYear(d.year, d.month));

  const colorPalette = {
    primary: "#0d6efd",
    warning: "#ffc107",
  };

  const ordersChartData = {
    labels,
    datasets: [
      {
        label: "Open Orders",
        data: ordersData.map((d) => d.openOrders || 0),
        backgroundColor: ordersData.map(() => colorPalette.primary),
        borderColor: ordersData.map(() => colorPalette.primary),
        borderWidth: 1,
        barPercentage: 1,
        categoryPercentage: 0.7,
      },
      {
        label: "Partial Orders",
        data: ordersData.map((d) => d.partialOrders || 0),
        backgroundColor: ordersData.map(() => colorPalette.warning),
        borderColor: ordersData.map(() => colorPalette.warning),
        borderWidth: 1,
        barPercentage: 1,
        categoryPercentage: 0.7,
      },
    ],
  };

  const ordersChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#212529",
        bodyFont: {
          size: 14,
          weight: 'bold'
        },
        titleFont: {
          size: 16,
          weight: 'bold'
        },
        padding: 16,
        callbacks: {
          label: (context) => {
            const datasetLabel = context.dataset.label;
            const numOrders = context.raw;
            const dataIndex = context.dataIndex;
            const dataPoint = ordersData[dataIndex];

            if (datasetLabel === "Open Orders") {
              return [
                `Open Orders: ${numOrders}`,
                `Line Items: ${dataPoint.openOrderLineItems}`,
                `Sales: ${formatCurrency(dataPoint.openOrderSales)}`
              ];
            } else if (datasetLabel === "Partial Orders") {
              return [
                `Partial Orders: ${numOrders}`,
                `Line Items: ${dataPoint.partialOrderLineItems}`,
                `Sales: ${formatCurrency(dataPoint.partialOrderSales)}`
              ];
            }
            return `${datasetLabel}: ${numOrders}`;
          },
        },
      },
      legend: {
        position: "top",
      },
    },
    scales: {
      x: {
        stacked: false,
      },
      y: {
        stacked: false,
        beginAtZero: true,
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const dataIndex = element.index;
        const datasetIndex = element.datasetIndex;
        const { year, month } = ordersData[dataIndex];
        const status = datasetIndex === 0 ? "open" : "partial";
        handleBarClick(year, month, status);
      }
    },
    onHover: (event, chartElement, chart) => {
  const target = event.native?.target || event.target;
  if (target && chartElement.length) {
    target.style.cursor = 'pointer';
  } else if (target) {
    target.style.cursor = 'default';
  }
},

  };

  return (
    <>
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="bg-white py-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
            <h4 className="mb-3 mb-md-0" style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}>
              Monthly Orders (Open & Partial)
            </h4>
            <div className="ms-auto">
              <AllFilter
                allowedTypes={["sales-person", "contact-person", "product", "category", "customer"]}
                setSearchQuery={(value) => {
                  if (value) {
                    setFilters((prev) => ({
                      ...prev,
                      [value.type === "sales-person" ? "salesPerson" : 
                       value.type === "contact-person" ? "contactPerson" : 
                       value.type === "customer" ? "customer" : value.type]: 
                        value.value ? {
                          value: value.value,
                          label: value.label,
                        } : null
                    }));
                  } else {
                    setFilters({
                      salesPerson: null,
                      contactPerson: null,
                      category: null,
                      product: null,
                      customer: null,
                    });
                  }
                }}
              />
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          {error && <p className="text-danger mb-3">Error: {error}</p>}

          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "500px" }}>
              <Spinner animation="border" role="status" className="me-2">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <span>Loading chart data...</span>
            </div>
          ) : ordersData.length ? (
            <div className="chart-container" style={{ height: "500px", width: "100%" }}>
              <div style={{ height: 500, width: "100%" }}>
                <Bar
                  ref={chartRef}
                  data={ordersChartData}
                  options={ordersChartOptions}
                />
              </div>
            </div>
          ) : (
            <p className="text-center mt-4">No data available.</p>
          )}
        </Card.Body>
      </Card>

      {showModal && (
        <MonthlyOrdersModal
          onClose={handleCloseModal}
          year={modalData.year}
          month={modalData.month}
          status={modalData.status}
          filters={filters}
        />
      )}
    </>
  );
};

export default OrdersChart;