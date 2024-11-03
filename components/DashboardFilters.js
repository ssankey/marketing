import React from 'react';
import { Form, Button, Row, Col, Badge } from 'react-bootstrap';

const DashboardFilters = ({
    month,
    year,
    region,
    setMonth,
    customer,
    setCustomer,
    setYear,
    setRegion,
    availableMonths,
    availableYears,
    availableRegions,
    availableCustomers,
    handleFilterChange
}) => {
    const getMonthName = (monthValue) => {
        return new Date(0, monthValue - 1).toLocaleString('default', { month: 'long' });
    };

    const getActiveFiltersText = () => {
        const filters = [];

        if (month) filters.push(`Month: ${getMonthName(month)}`);
        if (year) filters.push(`Year: ${year}`);
        if (region) filters.push(`Region: ${region}`);
        if (customer) {
            const customerObj = availableCustomers.find((c) => c.code === customer);
            const customerName = customerObj ? customerObj.name : customer;
            filters.push(`Customer: ${customerName}`);
          }
        if (filters.length === 0) {
            return 'Showing data for all time periods,customer and regions';
        }

        return (
            <span className="d-flex align-items-center gap-2">
                Showing data for:
                {filters.map((filter, index) => (
                    <Badge key={index} bg="info" className="text-dark bg-light border">
                        {filter}
                    </Badge>
                ))}
            </span>
        );
    };

    const handleReset = () => {
        // First reset all the state values
        setMonth('');
        setYear('');
        setRegion('');
        setCustomer('')
        // Then trigger the filter change with empty values
        handleFilterChange({
            month: '',
            year: '',
            region: '',
            customer: ''
        });
    };

    return (
        <div className="mb-4">
            <Row className="align-items-center g-2 mb-2">
                <Col xs="auto">
                    <Form.Control
                        as="select"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        size="sm"
                    >
                        <option value="">All Months</option>
                        {availableMonths.map((monthValue) => (
                            <option key={monthValue} value={monthValue}>
                                {getMonthName(monthValue)}
                            </option>
                        ))}
                    </Form.Control>
                </Col>

                <Col xs="auto">
                    <Form.Control
                        as="select"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        size="sm"
                    >
                        <option value="">All Years</option>
                        {availableYears.map((yearValue) => (
                            <option key={yearValue} value={yearValue}>
                                {yearValue}
                            </option>
                        ))}
                    </Form.Control>
                </Col>
                <Col xs="auto">
                    <Form.Control
                        as="select"
                        value={customer}
                        onChange={(e) => setCustomer(e.target.value)}
                        size="sm"
                    >
                        <option value="">All Customers</option>
                        {availableCustomers.map((customer) => (
                            <option key={customer.code} value={customer.code}>
                                {customer.name}
                            </option>
                        ))}
                    </Form.Control>
                </Col>

                <Col xs="auto">
                    <Form.Control
                        as="select"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        size="sm"
                    >
                        <option value="">All Regions</option>
                        {availableRegions.map((regionValue) => (
                            <option key={regionValue} value={regionValue}>
                                {regionValue}
                            </option>
                        ))}
                    </Form.Control>
                </Col>

                <Col xs="auto">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleFilterChange({ month, year, region,customer })}
                        className="me-2"
                    >
                        Apply Filters
                    </Button>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={handleReset}
                    >
                        Reset
                    </Button>
                </Col>

                <Col xs="auto" className="ms-auto">
                    <small className="text-muted">
                        {getActiveFiltersText()}
                    </small>
                </Col>
            </Row>
        </div>
    );
};

export default DashboardFilters;