

// components/DashboardFilters.js
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Form,
  Button,
  Row,
  Col,
  Badge,
  ButtonGroup,
  Card,
  InputGroup,
} from "react-bootstrap";
import {
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarAlt,
  FaRegCalendarCheck,
  FaUndo,
  FaCheck,
  FaTimes,
} from "react-icons/fa";

const DashboardFilters = ({
  dateFilter,
  setDateFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  // setRegion,
  // setCustomer,
  // customer,
  // region,
  handleFilterChange = () => {},
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  // Update URL when filters change
  const updateURL = (filters) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`?${params.toString()}`, { scroll: false });
  };

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case "today":
        return "Today";
      case "thisWeek":
        return "This Week";
      case "thisMonth":
        return "This Month";
      case "custom":
        return startDate && endDate
          ? `${formatDate(startDate)} - ${formatDate(endDate)}`
          : "Custom Range";
      default:
        return "This Month";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getActiveFiltersDisplay = () => {
    if (dateFilter === "thisMonth") return null;

    return (
      <div className="d-flex align-items-center gap-2 mt-3">
        <span className="text-muted fw-medium small">ACTIVE FILTER:</span>
        <Badge
          bg="primary"
          className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
          style={{ fontSize: "0.75rem", fontWeight: "500" }}
        >
          {getDateFilterLabel()}
          <FaTimes
            size={10}
            className="cursor-pointer"
            onClick={() => handleDateFilterClick("thisMonth")}
            style={{ cursor: "pointer" }}
          />
        </Badge>
      </div>
    );
  };

  const handleReset = () => {
    const resetFilters = {
      dateFilter: "thisMonth",
      startDate: "",
      endDate: "",
      // region: "",
      // customer: "",
    };

    setDateFilter("thisMonth");
    setStartDate("");
    setEndDate("");
    setTempStartDate("");
    setTempEndDate("");
    // setRegion("");
    // setCustomer("");

    handleFilterChange?.(resetFilters);
    updateURL(resetFilters);
  };

  const handleDateFilterClick = (option) => {
    setDateFilter(option);

    if (option !== "custom") {
      setStartDate("");
      setEndDate("");
      setTempStartDate("");
      setTempEndDate("");
    }

    const newFilters = {
      dateFilter: option,
      startDate: option === "custom" ? startDate : "",
      endDate: option === "custom" ? endDate : "",
      // region,
      // customer,
    };

    handleFilterChange?.(newFilters);
    updateURL(newFilters);
  };

  const handleCustomDateApply = () => {
    if (tempStartDate && tempEndDate) {
      setStartDate(tempStartDate);
      setEndDate(tempEndDate);

      const filters = {
        dateFilter: "custom",
        startDate: tempStartDate,
        endDate: tempEndDate,
        // region,
        // customer,
      };

      handleFilterChange?.(filters);
      updateURL(filters);
    }
  };

  const handleCustomDateCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  };

  // Load initial state from URL on component mount
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());

    if (params.dateFilter) setDateFilter(params.dateFilter);
    if (params.startDate) {
      setStartDate(params.startDate);
      setTempStartDate(params.startDate);
    }
    if (params.endDate) {
      setEndDate(params.endDate);
      setTempEndDate(params.endDate);
    }
    // if (params.region) setRegion(params.region);
    // if (params.customer) setCustomer(params.customer);
  }, []);

  // Update temp dates when actual dates change
  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  }, [startDate, endDate]);

  const dateFilterOptions = [
    { key: "today", label: "Today", icon: FaCalendarDay },
    { key: "thisWeek", label: "This Week", icon: FaCalendarWeek },
    { key: "thisMonth", label: "This Month", icon: FaCalendarAlt },
    { key: "custom", label: "Custom", icon: FaRegCalendarCheck },
  ];

  const hasActiveFilters = dateFilter !== "thisMonth";
  const hasUnsavedCustomChanges =
    dateFilter === "custom" &&
    (tempStartDate !== startDate || tempEndDate !== endDate);

  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Body className="p-4">
        {/* Main Filter Section */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h6 className="text-muted fw-bold mb-1 small">TIME PERIOD</h6>
            <ButtonGroup className="shadow-sm">
              {dateFilterOptions.map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={dateFilter === key ? "primary" : "light"}
                  onClick={() => handleDateFilterClick(key)}
                  className={`px-4 py-2 border-0 d-flex align-items-center gap-2 ${
                    dateFilter === key
                      ? "text-white fw-semibold"
                      : "text-dark bg-white hover-lift"
                  }`}
                  style={{
                    fontSize: "0.875rem",
                    minWidth: "110px",
                  }}
                >
                  <Icon size={14} />
                  {label}
                </Button>
              ))}
            </ButtonGroup>
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleReset}
              className="d-flex align-items-center gap-2 px-3 py-2 border-0 bg-light text-dark hover-lift"
              style={{ fontWeight: "500" }}
            >
              <FaUndo size={12} />
              Reset
            </Button>
          )}
        </div>

        {/* Custom Date Range Section */}
        {dateFilter === "custom" && (
          <div className="bg-light p-4 rounded-3 mb-3">
            <Row className="align-items-center g-3">
              <Col xs={12} md="auto">
                <span className="text-muted fw-semibold small">
                  SELECT DATE RANGE
                </span>
              </Col>

              <Col xs={12} md="auto">
                <div className="d-flex align-items-center gap-3">
                  <div>
                    <label className="form-label small text-muted mb-1">
                      From
                    </label>
                    <Form.Control
                      type="date"
                      value={tempStartDate}
                      onChange={(e) => setTempStartDate(e.target.value)}
                      className="border-0 shadow-sm bg-white"
                      style={{ minWidth: "160px" }}
                    />
                  </div>

                  <div className="text-muted mt-4">
                    <span>to</span>
                  </div>

                  <div>
                    <label className="form-label small text-muted mb-1">
                      To
                    </label>
                    <Form.Control
                      type="date"
                      value={tempEndDate}
                      onChange={(e) => setTempEndDate(e.target.value)}
                      className="border-0 shadow-sm bg-white"
                      style={{ minWidth: "160px" }}
                    />
                  </div>
                </div>
              </Col>

              <Col xs={12} md="auto" className="ms-auto">
                <div className="d-flex gap-2">
                  {hasUnsavedCustomChanges && (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={handleCustomDateCancel}
                      className="px-3 py-2 border-0 bg-white text-muted hover-lift"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCustomDateApply}
                    disabled={!tempStartDate || !tempEndDate}
                    className="px-4 py-2 d-flex align-items-center gap-2 fw-semibold"
                  >
                    <FaCheck size={12} />
                    Apply
                  </Button>
                </div>
              </Col>
            </Row>
          </div>
        )}

        {/* Active Filters Display */}
        {getActiveFiltersDisplay()}

        {/* Future filters - commented out for later use */}
        {/*
        <Row className="align-items-center g-3 mt-3">
          <Col xs={12} md={6}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <FaMapMarkerAlt className="text-muted" size={12} />
              <span className="text-muted fw-medium small">REGION</span>
            </div>
            <Form.Select
              value={region}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="border-0 shadow-sm bg-white"
            >
              <option value="">All Regions</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Form.Select>
          </Col>

          <Col xs={12} md={6}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <FaUser className="text-muted" size={12} />
              <span className="text-muted fw-medium small">CUSTOMER</span>
            </div>
            <Form.Select
              value={customer}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="border-0 shadow-sm bg-white"
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Form.Select>
          </Col>
        </Row>
        */}
      </Card.Body>

      <style jsx>{`
        .hover-lift:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .btn-group .btn {
          transition: all 0.2s ease;
        }

        .cursor-pointer {
          cursor: pointer;
        }

        .badge:hover {
          transform: scale(1.02);
          transition: transform 0.2s ease;
        }

        .form-control:focus {
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
          border-color: #86b7fe;
        }

        .btn-primary:disabled {
          opacity: 0.5;
        }
      `}</style>
    </Card>
  );
};

export default DashboardFilters;


