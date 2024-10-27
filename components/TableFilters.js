import { Col, Form, Row, Button } from "react-bootstrap";



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
    fromDate = "",
    toDate = "",
    onDateFilterChange,
    totalItems,
    totalItemsLabel = "Total Items",
    customElement,
  }) => {
  
    // Handler for reset button
    // const handleReset = () => {
    //   onSearch(""); // Clear search
    //   onStatusChange("all"); // Reset status
    //   onDateFilterChange({ fromDate: "", toDate: "" }); // Reset dates
    // };

    const handleReset = () => {
      onSearch(""); // Clear search
      if (onStatusChange) onStatusChange("all"); // Reset status if function exists
      if (onDateFilterChange) onDateFilterChange({ fromDate: "", toDate: "" }); // Reset dates if function exists
    };


    return (
      <Row className="mb-3 mt-3 align-items-center">
        {/* Search Input */}
        {searchConfig.enabled && (
          <Col md={2}>
            <Form.Control
              type="text"
              placeholder={searchConfig.placeholder}
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
            />
          </Col>
        )}

        {/* Status Filter */}
        {statusFilter.enabled && (
          <Col md={2}>
            <Form.Select
              value={statusFilter.value}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              <option value="all">All {statusFilter.label}</option>
              {statusFilter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Col>
        )}

        {/* From Date Filter */}
        <Col md={2}>
          <Form.Control
            type="date"
            value={fromDate}
            onChange={(e) => 
              onDateFilterChange({ fromDate: e.target.value, toDate })
            }
            placeholder="From Date"
          />
        </Col>

        {/* To Date Filter */}
        <Col md={2}>
          <Form.Control
            type="date"
            value={toDate}
            onChange={(e) =>
              onDateFilterChange({ fromDate, toDate: e.target.value })
            }
            placeholder="To Date"
          />
        </Col>

        {/* Custom Element */}
        {customElement && (
          <Col md={2}>
            {customElement.component}
          </Col>
        )}

        

        {/* Reset Button */}
        <Col md={2} className="text-end">
          <Button variant="outline-secondary" onClick={handleReset}>
            Reset
          </Button>
        </Col>

        {/* Total Items Display */}
        {totalItems !== undefined && (
          <Col md={2} className="text-end">
            <span>{totalItemsLabel}: {totalItems}</span>
          </Col>
        )}
      </Row>
    );
  };

export default TableFilters;
