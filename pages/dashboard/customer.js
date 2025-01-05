// /pages/dashboard/customer.js

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Spinner,
  Pagination,
  Alert,
  InputGroup,
} from 'react-bootstrap';
import Select from 'react-select';
import DashboardFilters from 'components/DashboardFilters';
import KPISection from 'components/KPISection';
import DashboardCharts from 'components/DashboardCharts';
import { useAuth } from 'hooks/useAuth';
import useDashboardData from 'hooks/useDashboardData';
import useCustomers from 'hooks/useCustomers'; // Custom hook to fetch customers

const CustomerDashboard = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, redirecting } = useAuth();

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);

  // Search and pagination state are managed by useCustomers hook
  const [searchTerm, setSearchTerm] = useState('');

  // Dashboard filters state
  const [dateFilter, setDateFilter] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salesCategory, setSalesCategory] = useState('');

  // Use custom hook to fetch customers
  const {
    customers,
    totalItems,
    currentPage,
    searchTerm: hookSearchTerm,
    setSearchTerm: setHookSearchTerm,
    sortField,
    setSortField,
    sortDir,
    setSortDir,
    status,
    setStatus,
    isLoading: customersLoading,
    error: customersError,
    goToPage,
    refreshCustomers,
  } = useCustomers({
    initialPage: 1,
    initialSearch: '',
    initialSortField: 'CustomerName',
    initialSortDir: 'asc',
    initialStatus: 'all',
  });

  // Handle page change
  const handlePageChange = (pageNumber) => {
    goToPage(pageNumber);
  };

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    // The `useCustomers` hook will refetch due to searchTerm change
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedCustomer) {
      setShowDashboard(true);
    }
  };

  // Use custom hook to fetch customer-specific dashboard data
  const { data, error: dataError, isLoading: dataLoading } = useDashboardData({
    dateFilter,
    startDate,
    endDate,
    customer: selectedCustomer?.value,
    salesCategory,
    viewType: 'customer',
    enabled: showDashboard, // Only fetch when dashboard should be shown
  });

  if (authLoading || redirecting) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return isAuthenticated ? (
    <Container
      fluid
      className="py-4 px-4"
      style={{ backgroundColor: "#f8f9fa" }}
    >
      {/* Selection Section */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body className="p-4">
          <h2 className="mb-4 text-primary">Customer Dashboard</h2>
          {/* <Form onSubmit={handleSubmit}>
            <Row className="align-items-end">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="text-muted mb-2">Select Customer</Form.Label>
                  <Select
                    value={selectedCustomer}
                    onChange={(option) => {
                      setSelectedCustomer(option);
                      setShowDashboard(false);
                    }}
                    options={customers?.map((customer) => ({
                      value: customer.CustomerCode, // Use CustomerCode as value
                      label: customer.CustomerName, // Use CustomerName as label
                    }))}
                    isLoading={customersLoading}
                    placeholder="Choose a customer..."
                    className="basic-single"
                    classNamePrefix="select"
                    noOptionsMessage={() => 'No customers found'}
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '45px',
                        borderColor: '#dee2e6',
                      }),
                    }}
                  />
                  {customersError && <Form.Text className="text-danger">{customersError}</Form.Text>}
                </Form.Group>
              </Col>
              {/* <Col md={4}>
                <Form.Group>
                  <Form.Label className="text-muted mb-2">Search</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setHookSearchTerm(e.target.value)}
                    />
                    <Button variant="outline-secondary" onClick={handleSearch}>
                      Search
                    </Button>
                  </InputGroup>
                </Form.Group>
              </Col> */}
          {/* <Col md={2}>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-100"
                  disabled={!selectedCustomer}
                >
                  View
                </Button>
              </Col>
            </Row>
          </Form>  */}

          <Form onSubmit={handleSubmit}>
            <Row className="align-items-end">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="text-muted mb-2">
                    Select Customer
                  </Form.Label>
                  <Select
                    value={selectedCustomer}
                    onChange={(option) => {
                      setSelectedCustomer(option);
                      setShowDashboard(false);
                    }}
                    options={customers?.map((customer) => ({
                      value: customer.CustomerCode, // Use CustomerCode as value
                      label: customer.CustomerName, // Use CustomerName as label
                    }))}
                    isLoading={customersLoading}
                    placeholder="Choose a customer..."
                    className="basic-single"
                    classNamePrefix="select"
                    noOptionsMessage={() => "No customers found"}
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: "45px",
                        borderColor: "#dee2e6",
                      }),
                    }}
                  />
                  {customersError && (
                    <Form.Text className="text-danger">
                      {customersError}
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>

              <Col md="auto">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="mt-md-0" // ensures no extra top margin on medium screens
                  disabled={!selectedCustomer}
                >
                  View
                </Button>
              </Col>
            </Row>
          </Form>

          {/* Pagination Controls */}
          {totalItems > 20 && (
            <div className="mt-3 d-flex justify-content-end">
              <Pagination>
                <Pagination.First
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                />
                {/* Display up to 5 page numbers centered around current page */}
                {Array.from(
                  { length: Math.ceil(totalItems / 20) },
                  (_, i) => i + 1
                )
                  .filter(
                    (pageNum) =>
                      pageNum >= currentPage - 2 && pageNum <= currentPage + 2
                  )
                  .map((pageNum) => (
                    <Pagination.Item
                      key={pageNum}
                      active={pageNum === currentPage}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Pagination.Item>
                  ))}
                <Pagination.Next
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === Math.ceil(totalItems / 20)}
                />
                <Pagination.Last
                  onClick={() => handlePageChange(Math.ceil(totalItems / 20))}
                  disabled={currentPage === Math.ceil(totalItems / 20)}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Dashboard Content */}
      {showDashboard && (
        <div className="dashboard-content">
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body className="p-4">
              <DashboardFilters
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                salesCategory={salesCategory}
                setSalesCategory={setSalesCategory}
                viewType="customer"
              />
            </Card.Body>
          </Card>

          {dataLoading ? (
            <div className="d-flex justify-content-center my-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : dataError ? (
            <Alert variant="danger">
              Failed to load customer dashboard data.
            </Alert>
          ) : (
            <>
              <KPISection kpiData={data.kpiData} viewType="customer" />
              <DashboardCharts viewType="customer" data={data.chartData} />
            </>
          )}
        </div>
      )}
    </Container>
  ) : null;
};

export default CustomerDashboard;
