

// components/invoices/InvoicesFilters.js
import React from "react";
import { Row, Col, Button, ButtonGroup, InputGroup, Form } from "react-bootstrap";

const InvoicesFilters = ({
  globalFilter,
  statusFilter,
  selectedMonth,
  fromDate,
  toDate,
  invoices = [],
  onSearch,
  onStatusChange,
  onMonthChange,
  onDateChange,
  onReset,
  onExport,
}) => {
  const commonStyle = {
    height: "36px",
    fontSize: "0.9rem",
  };

  const headerColors = {
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    color: '#ffffff'
  };

  // Format month for display
  const formatMonthDisplay = (monthValue) => {
    if (!monthValue) return "";
    const [year, month] = monthValue.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  // Simplified and more robust function to generate available months
  const getAvailableMonths = () => {
    console.log('Getting available months from invoices:', invoices.length);
    
    if (!invoices || invoices.length === 0) {
      console.log('No invoices data available');
      return [];
    }

    // Extract and parse all valid dates
    const validDates = [];
    
    invoices.forEach((invoice, index) => {
      const dateValue = invoice["Invoice Posting Dt."];
      
      if (!dateValue) return;
      
      let parsedDate = null;
      
      try {
        // Handle different date formats
        if (dateValue instanceof Date) {
          parsedDate = dateValue;
        } else if (typeof dateValue === 'string') {
          // Try direct parsing first
          parsedDate = new Date(dateValue);
          
          // If that fails, try parsing ISO string
          if (isNaN(parsedDate.getTime())) {
            // Handle ISO string format (e.g., "2024-01-15T00:00:00.000Z")
            if (dateValue.includes('T')) {
              parsedDate = new Date(dateValue.split('T')[0]);
            } else {
              // Try parsing various date formats
              const dateParts = dateValue.split(/[-/]/);
              if (dateParts.length === 3) {
                // Try YYYY-MM-DD format first
                parsedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                
                // If that doesn't work, try DD/MM/YYYY
                if (isNaN(parsedDate.getTime())) {
                  parsedDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
                }
                
                // If that doesn't work, try MM/DD/YYYY
                if (isNaN(parsedDate.getTime())) {
                  parsedDate = new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);
                }
              }
            }
          }
        } else if (typeof dateValue === 'number') {
          parsedDate = new Date(dateValue);
        }
        
        // Only add valid dates
        if (parsedDate && !isNaN(parsedDate.getTime())) {
          validDates.push(parsedDate);
        } else {
          console.log(`Failed to parse date at index ${index}:`, dateValue);
        }
      } catch (error) {
        console.log(`Error parsing date at index ${index}:`, dateValue, error);
      }
    });

    console.log('Valid dates found:', validDates.length);
    
    if (validDates.length === 0) {
      // Fallback: generate last 12 months if no valid dates found
      console.log('No valid dates found, generating fallback months');
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

    // Sort dates and get range
    validDates.sort((a, b) => a - b);
    const minDate = validDates[0];
    const maxDate = validDates[validDates.length - 1];
    
    console.log('Date range:', minDate, 'to', maxDate);
    
    // Generate all months between min and max date
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

    console.log('Generated months:', months.length);
    return months.reverse(); // Show recent months first
  };

  const availableMonths = getAvailableMonths();
  
  // Debug logging
  React.useEffect(() => {
    console.log('InvoicesFilters - invoices prop:', invoices.length);
    console.log('Available months:', availableMonths.length);
    if (availableMonths.length > 0) {
      console.log('First few months:', availableMonths.slice(0, 3));
    }
  }, [invoices, availableMonths]);

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
            {["All", "Open", "Closed"].map((status, index) => (
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
              placeholder="Search invoices..."
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
      
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '8px' }}>
          {/* Debug: {invoices.length} invoices, {availableMonths.length} months available */}
        </div>
      )}
    </div>
  );
};

export default InvoicesFilters;