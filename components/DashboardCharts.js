    import React, { useState, useEffect } from 'react';
    import { Card, Dropdown, ButtonGroup, Row, Col, ListGroup, Badge } from 'react-bootstrap';
    import { Bar, Doughnut } from 'react-chartjs-2';
    import { formatCurrency } from 'utils/formatCurrency';
    import {
        Filter,
        ArrowUpCircleFill,
        ArrowDownCircleFill,
        Calendar3
    } from 'react-bootstrap-icons';
    import {
        Chart as ChartJS,
        CategoryScale,
        LinearScale,
        BarElement,
        ArcElement,
        Title,
        Tooltip,
        Legend,
        PointElement,
        LineElement
    } from 'chart.js';
import EnhancedSalesCOGSChart from './EnhancedSalesCOGSChart';
import OrdersChart from "./OpenClosedOrdersChart";

    ChartJS.register(
        CategoryScale,
        LinearScale,
        BarElement,
        ArcElement,
        Title,
        Tooltip,
        Legend,
        PointElement,
        LineElement
    );

    const colorPalette = {
        primary: '#0d6efd',
        secondary: '#6c757d',
        success: '#198754',
        warning: '#ffc107',
        info: '#0dcaf0',
        dark: '#212529',
        light: '#f8f9fa',
        gradient: ['#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#dc3545']
    };

    const DashboardCharts = ({ salesData,orderStatistics }) => {
        const [topCustomers, setTopCustomers] = useState([]);
        const [topCategories, setTopCategories] = useState([]);
        const [customersDateFilter, setCustomersDateFilter] = useState('today');
        const [categoriesDateFilter, setCategoriesDateFilter] = useState('today');
        const [totalSales, setTotalSales] = useState(0);
        const [salesGrowth, setSalesGrowth] = useState(0);

        const fetchChartData = async (type, filter) => {
            try {
                const params = new URLSearchParams({ dateFilter: filter });
                const response = await fetch(`/api/dashboard/${type}?${params}`);
                if (!response.ok) throw new Error(`Failed to fetch ${type} data`);
                const data = await response.json();

                // const ordersresponse = await fetch(
                //   `/api/dashboard/orders`
                // );
                // if (!ordersresponse.ok)
                //   throw new Error(`Failed to fetch orders data`);
                // const ordersdata = await ordersresponse.json();
                // setOrdersData(ordersdata)

                if (type === 'customers') {
                    setTopCustomers(data);
                    // Calculate total sales
                    const total = data.reduce((sum, customer) => sum + (customer.Sales || 0), 0);
                    setTotalSales(total);
                    // Simulate growth (in real app, fetch from API)
                    setSalesGrowth(Math.random() * 20 - 10);
                } else if (type === 'categories') {
                    setTopCategories(data);
                }
            } catch (error) {
                console.error(`Error fetching ${type} data:`, error);
            }
        };

        useEffect(() => {
            fetchChartData('customers', customersDateFilter);
        }, [customersDateFilter]);

        useEffect(() => {
            fetchChartData('categories', categoriesDateFilter);
        }, [categoriesDateFilter]);

        const renderFilterDropdown = (currentFilter, setFilter) => (
            <Dropdown as={ButtonGroup}>
                <Dropdown.Toggle variant="light" className="d-flex align-items-center gap-2 shadow-sm">
                    <Calendar3 size={14} />
                    {currentFilter === 'today' ? 'Today' :
                        currentFilter === 'thisWeek' ? 'This Week' :
                            currentFilter === 'thisMonth' ? 'This Month' : 'All Time'}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    {['today', 'thisWeek', 'thisMonth', 'allTime'].map((option) => (
                        <Dropdown.Item
                            key={option}
                            active={currentFilter === option}
                            onClick={() => setFilter(option)}
                        >
                            {option === 'allTime' ? 'All Time' :
                                option === 'thisWeek' ? 'This Week' :
                                    option === 'thisMonth' ? 'This Month' : 'Today'}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown>
        );

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: colorPalette.dark,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    callbacks: {
                        label: (tooltipItem) => ` ${formatCurrency(tooltipItem.raw)}`
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        callback: (value) => formatCurrency(value),
                        font: {
                            size: 12
                        }
                    }
                }
            }
        };

        const doughnutData = {
            labels: topCategories.map((category) => category.Category),
            datasets: [{
                data: topCategories.map((category) => category.Sales || 0),
                backgroundColor: colorPalette.gradient,
                borderWidth: 0,
            }]
        };

        const doughnutOptions = {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: colorPalette.dark,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    callbacks: {
                        label: (tooltipItem) => `${tooltipItem.label}: ${formatCurrency(tooltipItem.raw)}`
                    }
                }
            }
        };

       

       



        return (
          <div className="p-4 bg-light">
            {/* Charts Row */}

            <EnhancedSalesCOGSChart salesData={salesData} />
            <OrdersChart orderStatistics={orderStatistics} />
            <Row className="g-4">
              <Col lg={7}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Header className="bg-white border-0 py-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0 fw-bold">Top Customers</h5>
                      {renderFilterDropdown(
                        customersDateFilter,
                        setCustomersDateFilter
                      )}
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <div style={{ height: "400px" }}>
                      <Bar
                        data={{
                          labels: topCustomers.map(
                            (customer) => customer.Customer
                          ),
                          datasets: [
                            {
                              data: topCustomers.map(
                                (customer) => customer.Sales || 0
                              ),
                              backgroundColor: colorPalette.primary,
                              borderRadius: 6,
                            },
                          ],
                        }}
                        options={chartOptions}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={5}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Header className="bg-white border-0 py-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0 fw-bold">Sales by Category</h5>
                      {renderFilterDropdown(
                        categoriesDateFilter,
                        setCategoriesDateFilter
                      )}
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={7}>
                        <div style={{ height: "300px" }}>
                          <Doughnut
                            data={doughnutData}
                            options={doughnutOptions}
                          />
                        </div>
                      </Col>
                      <Col md={5}>
                        <ListGroup variant="flush">
                          {topCategories.map((category, index) => (
                            <ListGroup.Item
                              key={index}
                              className="d-flex justify-content-between align-items-center px-0"
                            >
                              <div className="d-flex align-items-center">
                                <div
                                  className="me-2"
                                  style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    backgroundColor:
                                      colorPalette.gradient[index],
                                  }}
                                />
                                <span className="small">
                                  {category.Category}
                                </span>
                              </div>
                              <span className="fw-bold small">
                                {formatCurrency(category.Sales || 0)}
                              </span>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            {/* <Row className="g-4 mt-3">
                    <Card className="shadow-sm border-0">
                        <Card.Header
                            className="bg-white py-3"
                            style={{
                                borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
                                padding: "16px 24px",
                            }}
                        >
                            <h4
                                className="mb-0"
                                style={{
                                    fontWeight: 600,
                                    color: colorPalette.dark,
                                    fontSize: "1.25rem",
                                }}
                            >
                                Sales vs COGS
                            </h4>
                        </Card.Header>
                        <Card.Body
                            style={{
                                padding: "20px",
                                backgroundColor: "#f9f9f9",
                                overflow: "hidden" // Prevent overflow outside the card
                            }}
                        >
                            <div style={{ height: "400px", padding: "10px", overflow: "hidden" }}>
                                <Bar
                                    data={salesAndCOGSChartData}
                                    options={salesAndCOGSChartOptions}
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </Row> */}
            <Row className="mt-4">
              {/* <EnhancedSalesCOGSChart salesData={salesData}/> */}
            </Row>
          </div>
        );
    };

    export default DashboardCharts;