// components/openDO/OpenDOFilters.js
// Same visual pattern as components/ordersLine/OrdersLineFilters.js, except
// only three status buttons (Open/Closed/Canceled — no "All", and no
// Reset), per the requested "keep it very simple" spec: default is Open,
// search bar in the middle, Month dropdown + Export on the right.

import React from "react";
import { Row, Col, Button, ButtonGroup, InputGroup, Form } from "react-bootstrap";

const STATUSES = ["Open", "Closed", "Canceled"];

const OpenDOFilters = ({
  globalFilter,
  statusFilter,
  selectedMonth,
  onSearch,
  onStatusChange,
  onMonthChange,
  onExport,
}) => {
  const commonStyle = { height: "36px", fontSize: "0.9rem" };
  const headerColors = { background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", color: "#ffffff" };

  const getAvailableMonths = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      months.push({
        value: `${year}-${String(month + 1).padStart(2, "0")}`,
        display: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      });
    }
    return months;
  };

  const availableMonths = getAvailableMonths();

  return (
    <div className="mt-2 mb-2">
      <Row className="align-items-center g-2">
        <Col lg={4} md={5}>
          <ButtonGroup size="sm" className="w-100">
            {STATUSES.map((status) => {
              const val = status.toLowerCase();
              const active = statusFilter === val;
              return (
                <Button
                  key={status}
                  variant={active ? "primary" : "outline-primary"}
                  onClick={() => onStatusChange(val)}
                  style={{
                    ...commonStyle,
                    flex: 1,
                    padding: "0 8px",
                    ...(active
                      ? { background: headerColors.background, color: headerColors.color, border: "none" }
                      : { borderColor: "#1e293b", color: "#1e293b" }),
                  }}
                  className="text-truncate"
                >
                  {status}
                </Button>
              );
            })}
          </ButtonGroup>
        </Col>

        <Col lg={4} md={12} className="d-flex justify-content-center">
          <InputGroup style={{ maxWidth: "400px", minWidth: "280px", width: "100%" }}>
            <Form.Control
              type="text"
              value={globalFilter}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search delivery orders..."
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
                <option key={month.value} value={month.value}>{month.display}</option>
              ))}
            </Form.Select>
          </div>

          <Button onClick={onExport} variant="success" size="sm" style={{ ...commonStyle, padding: "0 16px" }}>
            Export
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default OpenDOFilters;
