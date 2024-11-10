import React from 'react';
import { Form, Button, Row, Col, Badge } from 'react-bootstrap';

const DashboardFilters = ({
    dateFilter,
    setDateFilter,
    startDate,
    setStartDate,
    endDate,
    setRegion,
    setCustomer,
    setEndDate,
    customer,
    region,
    handleFilterChange
}) => {
    const getMonthName = (monthValue) => {
        return new Date(0, monthValue - 1).toLocaleString('default', { month: 'long' });
    };

    const getActiveFiltersText = () => {
        const filters = [];
      
        if (dateFilter === 'custom') {
          if (startDate && endDate) {
            filters.push(`Date Range: ${startDate} to ${endDate}`);
          }
        } else {
          filters.push(`Date Range: ${dateFilter}`);
        }
      
        if (region) filters.push(`Region: ${region}`);
        if (customer) {
          const customerObj = availableCustomers.find((c) => c.code === customer);
          const customerName = customerObj ? customerObj.name : customer;
          filters.push(`Customer: ${customerName}`);
        }
      
        if (filters.length === 0) {
          return 'Showing data for today';
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
        setDateFilter('today');
        setStartDate('');
        setEndDate('');
        setRegion('');
        setCustomer('');
        handleFilterChange({
          dateFilter: 'today',
          startDate: '',
          endDate: '',
          region: '',
          customer: '',
        });
      };
      

    return (
        <div className="mb-4">
            <Row className="align-items-center g-2 mb-2">
                <Col xs="auto">
                    <Form.Control
                        as="select"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        size="sm"
                    >
                        <option value="today">Today</option>
                        <option value="thisWeek">This Week</option>
                        <option value="thisMonth">This Month</option>
                        <option value="custom">Custom</option>
                    </Form.Control>
                </Col>

                {dateFilter === 'custom' && (
                    <>
                        <Col xs="auto">
                            <Form.Control
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                size="sm"
                            />
                        </Col>
                        <Col xs="auto">
                            <Form.Control
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                size="sm"
                            />
                        </Col>
                    </>
                )}

                {/* Region and Customer Filters */}

                <Col xs="auto">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                            handleFilterChange({ dateFilter, startDate, endDate, region, customer })
                        }
                    >
                        Apply Filters
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={handleReset}>
                        Reset
                    </Button>
                </Col>

                <Col xs="auto" className="ms-auto">
                    <small className="text-muted">{getActiveFiltersText()}</small>
                </Col>
            </Row>
        </div>

    );
};

export default DashboardFilters;