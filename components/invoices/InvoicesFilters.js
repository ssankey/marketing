// components/invoices/InvoicesFilters.js
import React from "react";
import { Row, Col, Button, ButtonGroup, InputGroup, Form } from "react-bootstrap";

const InvoicesFilters = ({
  globalFilter,
  statusFilter,
  fromDate,
  toDate,
  onSearch,
  onStatusChange,
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
            <Form.Label className="mb-0 small" style={{ fontSize: "0.75rem" }}>From:</Form.Label>
            <Form.Control
              type="date"
              value={fromDate}
              onChange={(e) => onDateChange("from", e.target.value)}
              size="sm"
              style={{ width: "140px", ...commonStyle }}
            />
          </div>

          <div className="d-flex align-items-center gap-1">
            <Form.Label className="mb-0 small" style={{ fontSize: "0.75rem" }}>To:</Form.Label>
            <Form.Control
              type="date"
              value={toDate}
              onChange={(e) => onDateChange("to", e.target.value)}
              size="sm"
              style={{ width: "140px", ...commonStyle }}
            />
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

export default InvoicesFilters;