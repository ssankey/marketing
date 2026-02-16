
// components/orders/OrdersFilters.js
import React from "react";
import { Row, Col, Button, ButtonGroup, InputGroup, Form } from "react-bootstrap";

const OrdersFilters = ({
  globalFilter,
  statusFilter,
  selectedMonth,
  orders = [], // Array of orders to extract date range from
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

  // Add the formatMonthDisplay function here
  const formatMonthDisplay = (monthValue) => {
    if (!monthValue) return "";
    const [year, month] = monthValue.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  // Generate available months from order date range
  const getAvailableMonths = () => {
    console.log('Orders data:', orders);
    
    if (!orders || orders.length === 0) {
      console.log('No orders found or empty orders array');
      return [];
    }

    // Debug: Check the structure of the first order
    console.log('Sample order structure:', orders[0]);
    console.log('Order keys:', Object.keys(orders[0] || {}));

    // Extract all order dates and find min/max
    const orderDates = orders
      .map(order => {
        // Try multiple possible date field names
        let dateValue = order.DocDate
                     ;
        
        console.log('Raw date value:', dateValue, 'from order:', order);
        
        // Handle different date formats
        let date;
        if (!dateValue) {
          console.log('No date found in order:', order);
          return null;
        }
        
        // If it's already a Date object
        if (dateValue instanceof Date) {
          date = dateValue;
        }
        // If it's a string, try to parse it
        else if (typeof dateValue === 'string') {
          // Handle various date formats
          date = new Date(dateValue);
          
          // If that fails, try parsing different formats
          if (isNaN(date.getTime())) {
            // Try parsing formats like "DD/MM/YYYY", "MM/DD/YYYY", etc.
            const dateParts = dateValue.split(/[-/]/);
            if (dateParts.length === 3) {
              // Try different arrangements
              const formats = [
                new Date(dateParts[2], dateParts[1] - 1, dateParts[0]), // DD/MM/YYYY
                new Date(dateParts[2], dateParts[0] - 1, dateParts[1]), // MM/DD/YYYY
                new Date(dateParts[0], dateParts[1] - 1, dateParts[2])  // YYYY/MM/DD
              ];
              
              for (const format of formats) {
                if (!isNaN(format.getTime())) {
                  date = format;
                  break;
                }
              }
            }
          }
        }
        // If it's a number (timestamp)
        else if (typeof dateValue === 'number') {
          date = new Date(dateValue);
        }
        else {
          console.log('Unknown date format:', dateValue);
          return null;
        }
        
        console.log('Extracted date:', date, 'Valid:', !isNaN(date.getTime()));
        return date;
      })
      .filter(date => {
        const isValid = date && !isNaN(date.getTime());
        if (!isValid) {
          console.log('Invalid date filtered out:', date);
        }
        return isValid;
      })
      .sort((a, b) => a - b);

    console.log('Valid order dates:', orderDates);

    if (orderDates.length === 0) {
      console.log('No valid dates found');
      return [];
    }

    const minDate = orderDates[0];
    const maxDate = orderDates[orderDates.length - 1];
    
    console.log('Min date:', minDate, 'Max date:', maxDate);

    // Generate all months between min and max date
    const months = [];
    const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

    while (current <= end) {
      const year = current.getFullYear();
      const month = current.getMonth();
      
      // Format as "Jan 2024"
      const monthName = current.toLocaleDateString('en-US', { month: 'short' });
      const displayText = `${monthName} ${year}`;
      
      // Value format for filtering (YYYY-MM)
      const value = `${year}-${String(month + 1).padStart(2, '0')}`;
      
      months.push({
        value: value,
        display: displayText
      });

      current.setMonth(current.getMonth() + 1);
    }

    console.log('Generated months:', months);
    return months.reverse(); // Show recent months first
  };

  const availableMonths = getAvailableMonths();
  
  // Console log for debugging
  console.log('Available months:', availableMonths);

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
            {["All", "Open", "Partial", "Closed"].map((status, index) => (
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
              placeholder="Search orders..."
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
                  {formatMonthDisplay(month.value)}
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

export default OrdersFilters;