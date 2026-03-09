// components/ordersLine/OrdersLineFilters.js
import React from "react";
import { Row, Col, Button, ButtonGroup, InputGroup, Form } from "react-bootstrap";

const OrdersLineFilters = ({
  globalFilter,
  statusFilter,
  selectedMonth,
  ordersLine = [],
  onSearch,
  onStatusChange,
  onMonthChange,
  onReset,
  onExport,
  totalItems,
}) => {
  const commonStyle = {
    height: "36px",
    fontSize: "0.9rem",
  };

  const headerColors = {
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    color: '#ffffff'
  };

  const formatMonthDisplay = (monthValue) => {
    if (!monthValue) return "";
    const [year, month] = monthValue.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  const getAvailableMonths = () => {
    if (!ordersLine || ordersLine.length === 0) {
      return [];
    }

    const validDates = [];
    
    ordersLine.forEach((order) => {
      const dateValue = order.PostingDate;
      
      if (!dateValue) return;
      
      let parsedDate = null;
      
      try {
        if (dateValue instanceof Date) {
          parsedDate = dateValue;
        } else if (typeof dateValue === 'string') {
          parsedDate = new Date(dateValue);
          
          if (isNaN(parsedDate.getTime())) {
            if (dateValue.includes('T')) {
              parsedDate = new Date(dateValue.split('T')[0]);
            }
          }
        } else if (typeof dateValue === 'number') {
          parsedDate = new Date(dateValue);
        }
        
        if (parsedDate && !isNaN(parsedDate.getTime())) {
          validDates.push(parsedDate);
        }
      } catch (error) {
        console.log(`Error parsing date:`, dateValue, error);
      }
    });

    if (validDates.length === 0) {
      const months = [];
      const now = new Date();
      
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth();
        
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const displayText = `${monthName} ${year}`;
        const value = `${year}-${String(month + 1).padStart(2, '0')}`;
        
        months.push({
          value: value,
          display: displayText
        });
      }
      
      return months;
    }

    validDates.sort((a, b) => a - b);
    const minDate = validDates[0];
    const maxDate = validDates[validDates.length - 1];
    
    const months = [];
    const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

    while (current <= end) {
      const year = current.getFullYear();
      const month = current.getMonth();
      
      const monthName = current.toLocaleDateString('en-US', { month: 'short' });
      const displayText = `${monthName} ${year}`;
      const value = `${year}-${String(month + 1).padStart(2, '0')}`;
      
      months.push({
        value: value,
        display: displayText
      });

      current.setMonth(current.getMonth() + 1);
    }

    return months.reverse();
  };

  const availableMonths = getAvailableMonths();

  return (
    <div className="mt-2 mb-2">
      <Row className="align-items-center g-2">
        <Col lg={4} md={5} className="d-flex align-items-center gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            style={commonStyle}
            onClick={onReset}
          >
            Reset
          </Button>

          <ButtonGroup size="sm" className="flex-grow-1">
            {["All", "Open", "Closed"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status.toLowerCase() || (status === "All" && statusFilter === "all") ? "primary" : "outline-primary"}
                onClick={() => onStatusChange(status === "All" ? "all" : status.toLowerCase())}
                style={{
                  ...commonStyle,
                  flex: 1,
                  minWidth: 0,
                  padding: "0 8px",
                  ...(statusFilter === status.toLowerCase() || (status === "All" && statusFilter === "all") ? {
                    background: headerColors.background,
                    color: headerColors.color,
                    border: 'none'
                  } : {borderColor: '#1e293b', color: '#1e293b'})
                }}
                className="text-truncate"
              >
                {status}
              </Button>
            ))}
          </ButtonGroup>
        </Col>

        <Col lg={4} md={12} className="d-flex justify-content-center">
          <InputGroup style={{ maxWidth: "400px", minWidth: "280px", width: "100%" }}>
            <Form.Control
              type="text"
              value={globalFilter}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search order lines..."
              size="sm"
              style={commonStyle}
            />
          </InputGroup>
        </Col>

        <Col lg={4} md={5} className="d-flex align-items-center justify-content-end gap-2">
          <div className="d-flex align-items-center gap-1">
            <Form.Label className="mb-0 small" style={{ fontSize: "0.75rem" }}>Month:</Form.Label>
            <Form.Select
              value={selectedMonth || ""}
              onChange={(e) => onMonthChange(e.target.value)}
              size="sm"
              style={{ width: "160px", ...commonStyle }}
            >
              <option value="">All Months</option>
              {availableMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.display}
                </option>
              ))}
            </Form.Select>
          </div>

          <Button
            onClick={onExport}
            variant="success"
            size="sm"
            style={{ ...commonStyle, padding: "0 16px" }}
          >
            Export
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default OrdersLineFilters;