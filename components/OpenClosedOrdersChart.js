// OrdersChart.js
import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import { Card, Spinner } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import { useRouter } from "next/router";
import ChartDataLabels from "chartjs-plugin-datalabels";
import AllFilter from "components/AllFilters.js";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

// Month mapping helper
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

// Format month-year labels
const formatMonthYear = (year, month) => {
  const monthIndex = monthMapping[month];
  if (monthIndex === undefined) return "Invalid Date";
  const date = new Date(year, monthIndex);
  return date.toLocaleDateString("default", { month: "short", year: "numeric" });
};

const OrdersChart = () => {
  // ----------------------------------
  // State
  // ----------------------------------
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters and search query
  const [searchQuery, setSearchQuery] = useState("");
  // const [filters, setFilters] = useState({
  //   salesPerson: null,
  //   category: null,
  //   product: null,
  // });

  const [filters, setFilters] = useState({
  salesPerson: null,
  contactPerson: null,
  category: null,
  product: null,
  customer: null,
});


  // ----------------------------------
  // Refs and other hooks
  // ----------------------------------
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
      const text = await response.text();
      console.error("Failed response text:", text);
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

  // Re-fetch data whenever filters change
  useEffect(() => {
    fetchOrdersData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // ----------------------------------
  // Derived values
  // ----------------------------------
  // This example no longer uses a "Total" bar
  const totalOpenOrders = ordersData.reduce(
    (sum, data) => sum + (data.openOrders || 0),
    0
  );
  const totalOpenSales = ordersData.reduce(
    (sum, data) => sum + (data.openSales || 0),
    0
  );

  // ----------------------------------
  // Labels: monthly only
  // ----------------------------------
  const labels = ordersData.map((d) => formatMonthYear(d.year, d.month));

  // ----------------------------------
  // Chart config
  // ----------------------------------
  const colorPalette = {
    primary: "#0d6efd",
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
                size: 14, // Increase font size
                weight: 'bold' // Make font bold
            },
            titleFont: {
                size: 16, // Larger font for title
                weight: 'bold'
            },
            padding: 16, // Increase padding
        callbacks: {
          label: (context) => {
            const datasetLabel = context.dataset.label;
            const numOrders = context.raw;
            const dataIndex = context.dataIndex;
            const dataPoint = ordersData[dataIndex];


            // return `${datasetLabel}: ${numOrders} (Sales: ${formatCurrency(
            //   dataPoint.openSales
            // )})`;

             return [
                        `Open Orders: ${numOrders}`,
                        `Line Items: ${dataPoint.openLineItems}`,
                        `Value: ${formatCurrency(dataPoint.openSales)}`
                    ];


          },
          
        },
      },
      legend: {
        position: "top",
      },
    },
    hover: {
      mode: "nearest",
      intersect: true,
      onHover: (event, elements, chart) => {
        if (chart && chart.canvas) {
          chart.canvas.style.cursor = elements.length ? "pointer" : "default";
        }
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0 && elements[0].datasetIndex === 0) {
        const dataIndex = elements[0].index;
        const { year, month } = ordersData[dataIndex];
        const status = "open";
        const monthIndex =
          new Date(Date.parse(`${month} 1, ${year}`)).getMonth() + 1;
        const fromDate = `${year}-${String(monthIndex).padStart(2, "0")}-01`;
        // const toDate = new Date(year, monthIndex, 0)
        //   .toISOString()
        //   .split("T")[0];
        const toDate = new Date(year, monthIndex, 0)
  .toLocaleDateString("en-CA");  // "2025-06-30"


        router.push({
          pathname: "/orders",
          query: {
            status,
            page: 1,
            fromDate,
            toDate,
          },
        });
      }
    },
  };
 
  const exportToCSV = () => {
    if (!ordersData.length) return;
    const csvData = [
      ["Month", ...labels],
      ["Open Orders", ...ordersData.map((data) => data.openOrders || 0)],
      [
        "Open Orders (Sales)",
        ...ordersData.map((data) => formatCurrency(data.openSales || 0)),
      ],
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "orders_data.csv");
    link.click();
  };

  // ----------------------------------
  // Render
  // ----------------------------------
  return (
    <>
      <style jsx global>{`
        .ordersChartWrapper canvas:hover {
          cursor: pointer !important;
        }
      `}</style>
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="bg-white py-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
            <h4
              className="mb-3 mb-md-0"
              style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}
            >
              Monthly Open Orders
            </h4>
            <div className="ms-auto">
              {/* <AllFilter
                searchQuery={searchQuery}
                setSearchQuery={(value) => {
                  if (value) {
                    setFilters((prev) => ({
                      ...prev,
                      [value.type === "sales-person"
                        ? "salesPerson"
                        : value.type]: {
                        value: value.value,
                        label: value.label,
                      },
                    }));
                  } else {
                    // Reset all filters when cleared
                    setFilters({
                      salesPerson: null,
                      category: null,
                      product: null,
                    });
                  }
                }}
              /> */}
               
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
                  // Reset all filters when cleared
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
          {/* Show error if any */}
          {error && <p className="text-danger mb-3">Error: {error}</p>}

          {/* Show loading spinner */}
          {loading ? (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ height: "500px" }}
            >
              <Spinner animation="border" role="status" className="me-2">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <span>Loading chart data...</span>
            </div>
          ) : ordersData.length ? (
            <>
              <div
                className="chart-container"
                style={{ height: "500px", width: "100%" }}
              >
                {/* <Bar
                  ref={chartRef}
                  data={ordersChartData}
                  options={ordersChartOptions}
                /> */}
                <div
                  className="ordersChartWrapper"
                  style={{ height: 500, width: "100%" }}
                >
                  <Bar
                    ref={chartRef}
                    data={ordersChartData}
                    options={ordersChartOptions}
                  />
                </div>
              </div>
              {/* Example button for CSV export, if desired */}
              {/* <Button variant="outline-primary" className="mt-3" onClick={exportToCSV}>
              Export CSV
            </Button> */}
            </>
          ) : (
            <p className="text-center mt-4">No data available.</p>
          )}
        </Card.Body>
      </Card>
    </>
    
  );
};

export default OrdersChart;