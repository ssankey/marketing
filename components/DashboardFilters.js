import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Form,
  Button,
  Row,
  Col,
  Badge,
  ButtonGroup,
} from "react-bootstrap";
import {
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarAlt,
  FaRegCalendarCheck,
  FaUndo,
  FaFilter,
} from "react-icons/fa";

const DashboardFilters = ({
  dateFilter,
  setDateFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  setRegion,
  setCustomer,
  customer,
  region,
  handleFilterChange = () => {}, // Default to a no-op function
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Update URL when filters change
  const updateURL = (filters) => {
    const params = new URLSearchParams(searchParams);

    // Update or remove parameters based on filter values
    if (filters.dateFilter) {
      params.set("dateFilter", filters.dateFilter);
    } else {
      params.delete("dateFilter");
    }

    if (filters.startDate) {
      params.set("startDate", filters.startDate);
    } else {
      params.delete("startDate");
    }

    if (filters.endDate) {
      params.set("endDate", filters.endDate);
    } else {
      params.delete("endDate");
    }

    if (filters.region) {
      params.set("region", filters.region);
    } else {
      params.delete("region");
    }

    if (filters.customer) {
      params.set("customer", filters.customer);
    } else {
      params.delete("customer");
    }

    // Update the URL without refreshing the page
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const getActiveFiltersText = () => {
    const filters = [];

    if (dateFilter === "custom" && startDate && endDate) {
      filters.push(`Date Range: ${startDate} to ${endDate}`);
    } else {
      filters.push(`Date Range: ${dateFilter}`);
    }

    if (region) filters.push(`Region: ${region}`);

    if (filters.length === 0) {
      return "Showing data for today";
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
    setDateFilter("today");
    setStartDate("");
    setEndDate("");
    setRegion("");
    setCustomer("");

    const resetFilters = {
      dateFilter: "today",
      startDate: "",
      endDate: "",
      region: "",
      customer: "",
    };

    handleFilterChange?.(resetFilters); // Call if defined
    updateURL(resetFilters);
  };

  const handleDateFilterClick = (option) => {
    setDateFilter(option);
    const newFilters = {
      dateFilter: option,
      startDate,
      endDate,
      region,
      customer,
    };
    updateURL(newFilters);
  };

  useEffect(() => {
    if (dateFilter !== "custom") {
      const filters = { dateFilter, startDate, endDate, region, customer };
      handleFilterChange?.(filters); // Call if defined
      updateURL(filters);
    }
  }, [dateFilter, startDate, endDate, region, customer]);

  // Load initial state from URL on component mount
  useEffect(() => {
    const dateFilterParam = searchParams.get("dateFilter");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const regionParam = searchParams.get("region");
    const customerParam = searchParams.get("customer");

    if (dateFilterParam) setDateFilter(dateFilterParam);
    if (startDateParam) setStartDate(startDateParam);
    if (endDateParam) setEndDate(endDateParam);
    if (regionParam) setRegion(regionParam);
    if (customerParam) setCustomer(customerParam);
  }, []);

  return (
    <div className="mb-4">
      <Row className="align-items-center g-2 mb-2">
        <Col xs="auto">
          <ButtonGroup size="sm">
            {["today", "thisWeek", "thisMonth", "custom"].map((option) => (
              <Button
                key={option}
                variant={dateFilter === option ? "primary" : "outline-primary"}
                onClick={() => handleDateFilterClick(option)}
                className="d-flex align-items-center gap-2"
              >
                {option === "today" ? (
                  <FaCalendarDay />
                ) : option === "thisWeek" ? (
                  <FaCalendarWeek />
                ) : option === "thisMonth" ? (
                  <FaCalendarAlt />
                ) : (
                  <FaRegCalendarCheck />
                )}
                {option === "today"
                  ? "Today"
                  : option === "thisWeek"
                  ? "This Week"
                  : option === "thisMonth"
                  ? "This Month"
                  : "Custom"}
              </Button>
            ))}
          </ButtonGroup>
        </Col>

        {dateFilter === "custom" && (
          <>
            <Col xs="auto">
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => {
                  const newStartDate = e.target.value;
                  setStartDate(newStartDate);
                  const newFilters = {
                    dateFilter,
                    startDate: newStartDate,
                    endDate,
                    region,
                    customer,
                  };
                  updateURL(newFilters);
                }}
                size="sm"
                className="rounded-pill"
              />
            </Col>
            <Col xs="auto">
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => {
                  const newEndDate = e.target.value;
                  setEndDate(newEndDate);
                  const newFilters = {
                    dateFilter,
                    startDate,
                    endDate: newEndDate,
                    region,
                    customer,
                  };
                  updateURL(newFilters);
                }}
                size="sm"
                className="rounded-pill"
              />
            </Col>
          </>
        )}

        {dateFilter === "custom" && (
          <Col xs="auto">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const filters = {
                  dateFilter,
                  startDate,
                  endDate,
                  region,
                  customer,
                };
                handleFilterChange?.(filters); // Call if defined
                updateURL(filters);
              }}
              className="d-flex align-items-center gap-2"
            >
              <FaFilter />
              Apply Filters
            </Button>
          </Col>
        )}
        <Col xs="auto">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleReset}
            className="d-flex align-items-center gap-2"
          >
            <FaUndo />
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
