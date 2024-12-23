import React from 'react';
import { Col, Form, Row, Button, ButtonGroup } from 'react-bootstrap';

const TableFilters = ({
  searchConfig = {
    enabled: true,
    placeholder: "Search...",
    fields: [],
  },
  onSearch,
  searchTerm = "",
  statusFilter = {
    enabled: false,
    options: [],
    value: "all",
    label: "Status"
  },
  onStatusChange,
  dateFilter = {
    enabled: true,
  },
  fromDate = "",
  toDate = "",
  onDateFilterChange,
  totalItems,
  totalItemsLabel = "Total Items",
  customElement,
}) => {

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
  };

  return (
    <Row className="mb-3 mt-3 align-items-center g-2">
      {/* Search Input */}
      {searchConfig.enabled && (
        <Col xs="auto">
          <Form.Control
            type="text"
            placeholder={searchConfig.placeholder}
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            size="sm"
          />
        </Col>
      )}

      {/* Status Filter Buttons */}
      {statusFilter.enabled && (
        <Col xs="auto">
          <ButtonGroup size="sm">
            <Button
              variant={
                statusFilter.value === "all" ? "primary" : "outline-primary"
              }
              onClick={() => onStatusChange("all")}
            >
              All {statusFilter.label}
            </Button>
            {statusFilter.options.map((option) => (
              <Button
                key={option.value}
                variant={
                  statusFilter.value === option.value
                    ? "primary"
                    : "outline-primary"
                }
                onClick={() => onStatusChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </ButtonGroup>
        </Col>
      )}

      {/* From Date Filter */}
      {dateFilter.enabled && (
        <>
          <Col xs="auto">
            <Form.Control
              type="date"
              value={fromDate}
              onChange={(e) =>
                onDateFilterChange({ fromDate: e.target.value, toDate })
              }
              placeholder="From Date"
              size="sm"
            />
          </Col>

          {/* To Date Filter */}
          <Col xs="auto">
            <Form.Control
              type="date"
              value={toDate}
              onChange={(e) =>
                onDateFilterChange({ fromDate, toDate: e.target.value })
              }
              placeholder="To Date"
              size="sm"
            />
          </Col>
        </>
      )}

      {/* Custom Element */}
      {customElement && <Col xs="auto">{customElement.component}</Col>}

      {/* Reset Button */}
      <Col xs="auto">
        <Button variant="outline-secondary" size="sm" onClick={handleReset}>
          Reset
        </Button>
      </Col>

      {/* Total Items Display */}
      {totalItems !== undefined && (
        <Col xs="auto" className="ms-auto">
          <span>
            {totalItemsLabel}: {totalItems}
          </span>
        </Col>
      )}
    </Row>
  );
};

export default TableFilters;
