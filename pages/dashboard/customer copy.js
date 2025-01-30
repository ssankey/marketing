
import React, { useState } from "react";
import Select from "react-select";
import { Container, Row, Col, Form, Card } from "react-bootstrap";
import DashboardLayout from "app/(dashboard)/layout";
import OrdersChart from "components/page/dashboard/customer/chart/OpenClosedOrdersChart";
import EnhancedSalesCOGSChart from "components/page/dashboard/customer/chart/EnhancedSalesCOGSChart";

const CustomerSearchPage = () => {
  // Stores the fetched options
  const [customerOptions, setCustomerOptions] = useState([]);
  // Used as the <Select value> so the input shows the chosen label
  const [searchCustomer, setSearchCustomer] = useState(null);
  // This is the "locked-in" customer whose data we show in the charts
  const [chartCustomer, setChartCustomer] = useState(null);
  // For loading state while fetching
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async (searchValue) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/dashboard/customer/distinct_customer?search=${encodeURIComponent(
          searchValue || ""
        )}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }
      const { customers } = await response.json();
      setCustomerOptions(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomerOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Called each time the user types in the select box
  const handleInputChange = (inputValue, { action }) => {
    if (action === "input-change") {
      fetchCustomers(inputValue);
    }
  };

  // Called when the user focuses on the select field
  const handleFocus = () => {
    // Maybe fetch the full list
    fetchCustomers("");
  };

  // Called when an item is selected or cleared
  const handleCustomerSelect = (option) => {
    if (!option) {
      // User clicked the "X" to clear => clear only the input
      setSearchCustomer(null);
      // DO NOT clear chartCustomer => chart remains visible
    } else {
      // User picked a new customer => update both states
      setSearchCustomer(option);
      setChartCustomer(option);
    }
  };

  return (
    
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col md={12}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h4 className="mb-4 text-primary">Search Customers</h4>
                <Form.Group>
                  <Form.Label>Type to search customers</Form.Label>
                  <Select
                    // Let the select show whichever customer is "actively" chosen
                    value={searchCustomer}
                    onChange={handleCustomerSelect}
                    onInputChange={handleInputChange}
                    onFocus={handleFocus}
                    options={customerOptions}
                    isLoading={loading}
                    placeholder="Search by CardCode or CardName..."
                    noOptionsMessage={() => "No customers found"}
                    // We still want the built-in clear button
                    isClearable
                    // Custom styles
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: "45px",
                        borderColor: "#dee2e6",
                        cursor: "pointer", // pointer for the control
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
                        cursor: "pointer", // pointer on the dropdown icon
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

            {/* Show charts if we have a "last selected" customer */}
            {chartCustomer && (
              <>
                <Card className="shadow-sm mb-4">
                  <Card.Body>
                    <EnhancedSalesCOGSChart cardCode={chartCustomer.value} />
                  </Card.Body>
                </Card>
                <Card className="shadow-sm">
                  <Card.Body>
                    <OrdersChart cardCode={chartCustomer.value} />
                  </Card.Body>
                </Card>
              </>
            )}
          </Col>
        </Row>
      </Container>
    
  );
};

export default CustomerSearchPage;
