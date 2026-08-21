
// components/main-page/order-to-invoice-buckets/order-to-invoice-charts.js
import React, { useState, useEffect, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, Table, Spinner, Tabs, Tab } from 'react-bootstrap';
import AllFilter from "components/AllFilters.js";
import Select from "react-select";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '../../../contexts/AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const OrderToInvoiceCharts = () => {
  const [orderToInvoiceData, setOrderToInvoiceData] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState(null);
  const [financialYears, setFinancialYears] = useState([]);
  const [activeTab, setActiveTab] = useState('PO to GRN');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const tableContainerRef = useRef(null);

  const [filters, setFilters] = useState({
    salesPerson: null,
    contactPerson: null,
    category: null,
    product: null,
    customer: null,
  });

  const getCurrentFinancialYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    if (currentMonth >= 3) {
      return `${currentYear}-${currentYear + 1}`;
    } else {
      return `${currentYear - 1}-${currentYear}`;
    }
  };

  const generateFinancialYears = (years) => {
    if (!years || years.length === 0) return [];
    const fySet = new Set();
    years.forEach(year => {
      fySet.add(`${year - 1}-${year}`);
      fySet.add(`${year}-${year + 1}`);
    });
    return Array.from(fySet).sort((a, b) => {
      const aStart = parseInt(a.split('-')[0]);
      const bStart = parseInt(b.split('-')[0]);
      return bStart - aStart;
    });
  };

  const filterDataByFinancialYear = (data, fy) => {
    if (!fy || !data) return data;
    const [startYear, endYear] = fy.split('-').map(Number);
    return data.filter(item => {
      const year = item.year;
      const month = item.monthNumber;
      if (month >= 4) {
        return year === startYear;
      } else {
        return year === endYear;
      }
    });
  };

  const fetchOrderToInvoiceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters.salesPerson?.value) queryParams.append('slpCode', filters.salesPerson.value);
      if (filters.category?.value) queryParams.append('itmsGrpCod', filters.category.value);
      if (filters.product?.value) queryParams.append('itemCode', filters.product.value);
      if (filters.contactPerson?.value) queryParams.append('cntctCode', filters.contactPerson.value);
      if (filters.customer?.value) queryParams.append('cardCode', filters.customer.value);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/main-page/order-to-invoice?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const responseJson = await response.json();
      const { data, availableYears: years } = responseJson;

      if (!response.ok) {
        throw new Error(responseJson?.error || 'Failed to fetch data');
      }

      const sortedData = data.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthNumber - b.monthNumber;
      });

      setOrderToInvoiceData(sortedData);
      setAvailableYears(years);

      const fyList = generateFinancialYears(years);
      setFinancialYears(fyList);

      if (!selectedFinancialYear && fyList.length > 0) {
        const currentFY = getCurrentFinancialYear();
        const defaultFY = fyList.includes(currentFY) ? currentFY : fyList[0];
        setSelectedFinancialYear(defaultFY);
      }

    } catch (error) {
      console.error('Error fetching order to invoice data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const hasToken = localStorage.getItem("token");
    if (hasToken) fetchOrderToInvoiceData();
  }, [user, filters]);

  const filteredData = selectedFinancialYear
    ? filterDataByFinancialYear(orderToInvoiceData, selectedFinancialYear)
    : orderToInvoiceData;

  const tabFilteredData = filteredData.filter(item => item.type === activeTab);

  useEffect(() => {
    if (tableContainerRef.current && tabFilteredData.length > 0) {
      tableContainerRef.current.scrollLeft = tableContainerRef.current.scrollWidth;
    }
  }, [tabFilteredData]);

  const labels = tabFilteredData.map((d) => {
    const [year, month] = d.month.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]}-${year.slice(-2)}`;
  });

  const bucketColors = {
    '0-3 days': '#22c55e',
    '4-5 days': '#f97316',
    '6-8 days': '#3b82f6',
    '9-10 days': '#8b5cf6',
    '10+ days': '#ef4444'
  };

  const buckets = ['0-3 days', '4-5 days', '6-8 days', '9-10 days', '10+ days'];

  const datasets = buckets.map(bucket => ({
    label: bucket,
    data: tabFilteredData.map(item => item[`${bucket}_count`] || 0),
    backgroundColor: bucketColors[bucket],
    borderColor: bucketColors[bucket],
    borderWidth: 1,
    borderRadius: 4,
    borderSkipped: false,
  }));

  const chartData = { labels, datasets };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: { display: false },
      title: {
        display: true,
        text: `${activeTab} - Processing Time Distribution`,
        font: { size: 16, weight: 'bold' },
        padding: 20
      },
      legend: {
        position: 'top',
        labels: { font: { family: "'Inter', sans-serif", size: 12 }, padding: 15, usePointStyle: true, pointStyle: 'rectRounded' },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const dataIndex = context.dataIndex;
            const bucket = context.dataset.label;
            const count = context.raw;
            const percentage = tabFilteredData[dataIndex]?.[`${bucket}_percentage`] || 0;
            return `${bucket}: ${count} (${percentage.toFixed(1)}%)`;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true },
    },
    interaction: { mode: 'index', intersect: false },
  };

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-white py-3">
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-3 mb-md-0" style={{ fontWeight: 600, color: "#212529", fontSize: "1.25rem" }}>
            Order to Invoice Processing Time
          </h4>
          <div className="d-flex align-items-center gap-3">
            <div style={{ minWidth: "180px" }}>
              <Select
                options={financialYears.map((fy) => ({ value: fy, label: `FY ${fy}` }))}
                value={selectedFinancialYear ? { value: selectedFinancialYear, label: `FY ${selectedFinancialYear}` } : null}
                onChange={(option) => setSelectedFinancialYear(option.value)}
                placeholder="Select FY"
                isClearable={false}
              />
            </div>
            <AllFilter
              allowedTypes={["sales-person", "contact-person", "product", "category", "customer"]}
              searchQuery={searchQuery}
              setSearchQuery={(value) => {
                if (value) {
                  setFilters((prev) => ({
                    ...prev,
                    [value.type === "sales-person"
                      ? "salesPerson"
                      : value.type === "contact-person"
                        ? "contactPerson"
                        : value.type]: {
                      value: value.value,
                      label: value.label,
                    },
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
        {error && <p className="text-center mt-4 text-danger">Error: {error}</p>}
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: "500px" }}>
            <Spinner animation="border" role="status" className="me-2"><span className="visually-hidden">Loading...</span></Spinner>
            <span>Loading chart data...</span>
          </div>
        ) : (
          <>
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
              <Tab eventKey="PO to GRN" title="PO to GRN" />
              <Tab eventKey="GRN to Invoice" title="GRN to Invoice" />
              <Tab eventKey="Invoice to Dispatch" title="Invoice to Dispatch" />
              <Tab eventKey="Order to Invoice" title="Order to Invoice" />
            </Tabs>

            {tabFilteredData.length ? (
              <>
                <div className="chart-container mb-4" style={{ height: "500px", width: "100%" }}>
                  <Bar data={chartData} options={chartOptions} />
                </div>

                {/* ✅ Flipped Table */}
                <div className="mt-4">
                  <h5 className="mb-3">Processing Time Summary - {activeTab}</h5>
                  <div ref={tableContainerRef} style={{ overflowX: 'auto' }}>
                    <Table striped bordered hover size="sm" style={{ whiteSpace: 'nowrap' }}>
                      <thead>
                        <tr>
                          <th>Bucket</th>
                          {labels.map((monthLabel, idx) => (
                            <th key={idx}>{monthLabel}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {buckets.map(bucket => (
                          <tr key={bucket}>
                            <td style={{ backgroundColor: bucketColors[bucket], color: 'white' }}>{bucket}</td>
                            {tabFilteredData.map((item, idx) => (
                              <td key={idx}>
                                {item[`${bucket}_count`] || 0}
                                <br />
                                <small className="text-muted">
                                  ({(item[`${bucket}_percentage`] || 0).toFixed(1)}%)
                                </small>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center mt-4">No data available for {activeTab} in the selected financial year.</p>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default OrderToInvoiceCharts;
