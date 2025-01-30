import React, { useState } from "react";
import Select from "react-select";
import { Container, Row, Col, Form, Card } from "react-bootstrap";
import DashboardLayout from "app/(dashboard)/layout";
import OrdersChart from "components/page/dashboard/sales-person/chart/OpenClosedOrdersChart";
import EnhancedSalesCOGSChart from "components/page/dashboard/sales-person/chart/EnhancedSalesCOGSChart";

const SalespersonSearchPage = () => {
  const [salespersonOptions, setSalespersonOptions] = useState([]);
  const [searchSalesperson, setSearchSalesperson] = useState(null); // Holds selected salesperson in the input
  const [chartSalesperson, setChartSalesperson] = useState(null); // Holds locked-in salesperson for the charts
  const [loading, setLoading] = useState(false);

  const fetchSalespersons = async (searchValue) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/dashboard/sales-person/distinct-salesperson?search=${encodeURIComponent(
          searchValue || ""
        )}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch salespersons");
      }
      const { salesEmployees } = await response.json();
      setSalespersonOptions(salesEmployees);
    } catch (error) {
      console.error("Error fetching salespersons:", error);
      setSalespersonOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (inputValue, { action }) => {
    if (action === "input-change") {
      fetchSalespersons(inputValue);
    }
  };

  const handleFocus = () => {
    fetchSalespersons(""); // Fetch all salespersons on focus
  };

  const handleSalespersonSelect = (option) => {
    if (!option) {
      // Clear selection
      setSearchSalesperson(null);
    } else {
      // Update both states
      setSearchSalesperson(option);
      setChartSalesperson(option); // Lock in for the charts
    }
  };

  return (
    
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col md={12}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h4 className="mb-4 text-primary">Search Salespersons</h4>
                <Form.Group>
                  <Form.Label>Type to search salespersons</Form.Label>
                  <Select
                    value={searchSalesperson}
                    onChange={handleSalespersonSelect}
                    onInputChange={handleInputChange}
                    onFocus={handleFocus}
                    options={salespersonOptions}
                    isLoading={loading}
                    placeholder="Search by Slpcode or Name..."
                    noOptionsMessage={() => "No salespersons found"}
                    getOptionLabel={(option) => `${option.value}: ${option.label}`}
                    isClearable
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: "45px",
                        borderColor: "#dee2e6",
                        cursor: "pointer",
                        width: "100%",
                        fontSize: "14px",
                      }),
                      option: (base, state) => ({
                        ...base,
                        cursor: "pointer",
                        backgroundColor: state.isFocused ? "#007bff" : "#fff",
                        color: state.isFocused ? "#fff" : "#212529",
                        padding: "10px 12px",
                        fontSize: "14px",
                      }),
                      clearIndicator: (base) => ({
                        ...base,
                        cursor: "pointer",
                      }),
                      dropdownIndicator: (base) => ({
                        ...base,
                        cursor: "pointer",
                      }),
                      menu: (base) => ({
                        ...base,
                        zIndex: 1050,
                      }),
                      menuList: (base) => ({
                        ...base,
                        maxHeight: "200px",
                      }),
                    }}
                    theme={(theme) => ({
                      ...theme,
                      colors: {
                        ...theme.colors,
                        primary25: "#007bff",
                        primary: "#007bff",
                      },
                    })}
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Show charts only if we have a "locked-in" salesperson */}
            {chartSalesperson && (
              <>
                <Card className="shadow-sm mb-4">
                  <Card.Body>
                    {/* Pass the SlpCode to the EnhancedSalesCOGSChart */}
                    
                    <EnhancedSalesCOGSChart slpCode={chartSalesperson.value} />
                  </Card.Body>
                </Card>
                <Card className="shadow-sm">
                  <Card.Body>
                    {/* Pass the SlpCode to the OrdersChart */}
                    <OrdersChart slpCode={chartSalesperson.value} />
                  </Card.Body>
                </Card>
              </>
            )}
          </Col>
        </Row>
      </Container>
    
  );
};

export default SalespersonSearchPage;
