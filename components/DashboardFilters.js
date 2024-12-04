// import React, { useEffect } from 'react';
// import { Form, Button, Row, Col, Badge, ButtonGroup } from 'react-bootstrap';

// const DashboardFilters = ({
//     dateFilter,
//     setDateFilter,
//     startDate,
//     setStartDate,
//     endDate,
//     setRegion,
//     setCustomer,
//     setEndDate,
//     customer,
//     region,
//     handleFilterChange,
// }) => {
//     const getActiveFiltersText = () => {
//         const filters = [];
      
//         if (dateFilter === 'custom' && startDate && endDate) {
//             filters.push(`Date Range: ${startDate} to ${endDate}`);
//         } else {
//             filters.push(`Date Range: ${dateFilter}`);
//         }
      
//         if (region) filters.push(`Region: ${region}`);
      
//         if (filters.length === 0) {
//             return 'Showing data for today';
//         }
      
//         return (
//             <span className="d-flex align-items-center gap-2">
//                 Showing data for:
//                 {filters.map((filter, index) => (
//                     <Badge key={index} bg="info" className="text-dark bg-light border">
//                         {filter}
//                     </Badge>
//                 ))}
//             </span>
//         );
//     };

//     const handleReset = () => {
//         setDateFilter('today');
//         setStartDate('');
//         setEndDate('');
//         setRegion('');
//         setCustomer('');
//         handleFilterChange({
//             dateFilter: 'today',
//             startDate: '',
//             endDate: '',
//             region: '',
//             customer: '',
//         });
//     };

//     useEffect(() => {
//         if (dateFilter !== 'custom') {
//             handleFilterChange({ dateFilter, startDate, endDate, region, customer });
//         }
//     }, [dateFilter, startDate, endDate, region, customer]);

//     return (
//         <div className="mb-4">
//             <Row className="align-items-center g-2 mb-2">
                
//                 {/* Date Filter Button Group */}
//                 <Col xs="auto">
//                     <ButtonGroup size="sm">
//                         {['today', 'thisWeek', 'thisMonth', 'custom'].map((option) => (
//                             <Button
//                                 key={option}
//                                 variant={dateFilter === option ? "primary" : "outline-primary"}
//                                 onClick={() => setDateFilter(option)}
//                             >
//                                 {option === 'today' ? 'Today' : option === 'thisWeek' ? 'This Week' : option === 'thisMonth' ? 'This Month' : 'Custom'}
//                             </Button>
//                         ))}
//                     </ButtonGroup>
//                 </Col>

//                 {/* Custom Date Range Inputs */}
//                 {dateFilter === 'custom' && (
//                     <>
//                         <Col xs="auto">
//                             <Form.Control
//                                 type="date"
//                                 value={startDate}
//                                 onChange={(e) => setStartDate(e.target.value)}
//                                 size="sm"
//                             />
//                         </Col>
//                         <Col xs="auto">
//                             <Form.Control
//                                 type="date"
//                                 value={endDate}
//                                 onChange={(e) => setEndDate(e.target.value)}
//                                 size="sm"
//                             />
//                         </Col>
//                     </>
//                 )}

//                 {/* Apply and Reset Buttons */}
//                 {dateFilter === 'custom' && (
//                     <Col xs="auto">
//                         <Button
//                             variant="primary"
//                             size="sm"
//                             onClick={() =>
//                                 handleFilterChange({ dateFilter, startDate, endDate, region, customer })
//                             }
//                         >
//                             Apply Filters
//                         </Button>
//                     </Col>
//                 )}
//                 <Col xs="auto">
//                     <Button variant="outline-secondary" size="sm" onClick={handleReset}>
//                         Reset
//                     </Button>
//                 </Col>

//                 <Col xs="auto" className="ms-auto">
//                     <small className="text-muted">{getActiveFiltersText()}</small>
//                 </Col>
//             </Row>
//         </div>
//     );
// };

// export default DashboardFilters;


import React, { useEffect } from "react";
import {
  Form,
  Button,
  Row,
  Col,
  Badge,
  ButtonGroup,
//   Tooltip,
//   OverlayTrigger,
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
  setRegion,
  setCustomer,
  setEndDate,
  customer,
  region,
  handleFilterChange,
}) => {
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
    handleFilterChange({
      dateFilter: "today",
      startDate: "",
      endDate: "",
      region: "",
      customer: "",
    });
  };

  useEffect(() => {
    if (dateFilter !== "custom") {
      handleFilterChange({ dateFilter, startDate, endDate, region, customer });
    }
  }, [dateFilter, startDate, endDate, region, customer]);

  return (
    <div className="mb-4">
      <Row className="align-items-center g-2 mb-2">
        {/* Date Filter Button Group */}
        <Col xs="auto">
          {/* <ButtonGroup size="sm">
            {["today", "this Week", "this Month", "custom"].map((option) => (
              <OverlayTrigger
                key={option}
                placement="top"
                overlay={
                  <Tooltip id={`tooltip-${option}`}>
                    {option === "today"
                      ? "Today"
                      : option === "this Week"
                      ? "This Week"
                      : option === "this Month"
                      ? "This Month"
                      : "Custom Range"}
                  </Tooltip>
                }
              >
                <Button
                  variant={
                    dateFilter === option ? "primary" : "outline-primary"
                  }
                  onClick={() => setDateFilter(option)}
                  className="d-flex align-items-center gap-2"
                >
                  {option === "today" ? (
                    <FaCalendarDay />
                  ) : option === "this Week" ? (
                    <FaCalendarWeek />
                  ) : option === "this Month" ? (
                    <FaCalendarAlt />
                  ) : (
                    <FaRegCalendarCheck />
                  )}
                  {option === "today"
                    ? "Today"
                    : option === "this Week"
                    ? "This Week"
                    : option === "this Month"
                    ? "This Month"
                    : "Custom"}
                </Button>
              </OverlayTrigger>
            ))}
          </ButtonGroup> */}
          <ButtonGroup size="sm">
            {["today", "thisWeek", "thisMonth", "custom"].map((option) => (
              <Button
                key={option}
                variant={dateFilter === option ? "primary" : "outline-primary"}
                onClick={() => setDateFilter(option)}
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

        {/* Custom Date Range Inputs */}
        {dateFilter === "custom" && (
          <>
            <Col xs="auto">
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="sm"
                className="rounded-pill"
              />
            </Col>
            <Col xs="auto">
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                size="sm"
                className="rounded-pill"
              />
            </Col>
          </>
        )}

        {/* Apply and Reset Buttons */}
        {dateFilter === "custom" && (
          <Col xs="auto">
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                handleFilterChange({
                  dateFilter,
                  startDate,
                  endDate,
                  region,
                  customer,
                })
              }
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

        {/* Active Filters Text */}
        <Col xs="auto" className="ms-auto">
          <small className="text-muted">{getActiveFiltersText()}</small>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardFilters;


