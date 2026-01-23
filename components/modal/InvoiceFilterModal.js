// components/modal/InvoiceFilterModal.js
import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import InvoiceDetailsModal from "./TargetInvoiceDetailsModal";

const InvoiceFilterModal = ({ show, onClose, preSelectedField = null }) => {
  const [selectedYear, setSelectedYear] = useState("FY 2025-26");
  const [selectedFilterType, setSelectedFilterType] = useState("region");
  const [selectedFilterValue, setSelectedFilterValue] = useState("");
  const [filterOptions, setFilterOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const yearOptions = ["FY 2025-26", "FY 2024-25", "Complete"];
  
  const filterTypeOptions = [
    { value: "region", label: "Region" },
    { value: "state", label: "State" },
    { value: "salesperson", label: "Sales Person" },
    { value: "category", label: "Category" },
  ];

  // Define filter options for each type
  const staticFilterOptions = {
    region: ["Central", "South", "West 1", "West 2", "North", "East", "Overseas"],
    state: ["AP", "TE", "KL", "KT", "TN", "PC", "MH", "GO", "DN", "GJ", "DL", "HR", "HP", "PU", "RJ", "UP", "UT", "MP", "CH", "WB", "JH", "AS", "ME"],
  };

  // Fetch dynamic filter options for salesperson and category
  useEffect(() => {
    if (selectedFilterType === "region" || selectedFilterType === "state") {
      setFilterOptions(staticFilterOptions[selectedFilterType] || []);
      setSelectedFilterValue("");
    } else {
      fetchFilterOptions();
    }
  }, [selectedFilterType]);

  // Set pre-selected field if provided
  useEffect(() => {
    if (preSelectedField) {
      setSelectedFilterValue(preSelectedField);
    }
  }, [preSelectedField]);

  const fetchFilterOptions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const endpoint = selectedFilterType === "salesperson" 
        ? "/api/target-analytics/salesperson-list"
        : "/api/target-analytics/category-list";
      
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        setFilterOptions(result.data);
        setSelectedFilterValue("");
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
      setFilterOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFilterValue) {
      alert("Please select a filter value");
      return;
    }

    setLoadingInvoices(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/target-analytics/invoice-details?year=${encodeURIComponent(selectedYear)}&filterType=${selectedFilterType}&filterValue=${encodeURIComponent(selectedFilterValue)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await response.json();
      
      if (result.success && result.data) {
        setInvoiceData(result.data);
        setShowInvoiceModal(true);
      } else {
        alert(result.message || "No invoices found");
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      alert("Failed to fetch invoice details");
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleCloseInvoiceModal = () => {
    setShowInvoiceModal(false);
    setInvoiceData([]);
  };

  const getModalTitle = () => {
    if (selectedFilterValue) {
      const filterLabel = filterTypeOptions.find(f => f.value === selectedFilterType)?.label || "Filter";
      return `Invoice Details - ${filterLabel}: ${selectedFilterValue}`;
    }
    return "Invoice Details";
  };

  return (
    <>
      <Modal
        show={show && !showInvoiceModal}
        onHide={onClose}
        centered
        backdrop="static"
      >
        <Modal.Header
          closeButton
          style={{
            background: "linear-gradient(135deg, #15803d 0%, #16a34a 100%)",
            color: "white",
            borderBottom: "3px solid #dcfce7",
          }}
        >
          <Modal.Title style={{ fontWeight: 700 }}>
            🔍 Select Invoice Filters
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ padding: "1.5rem" }}>
          <Form>
            {/* Financial Year Selection */}
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 600, color: "#15803d" }}>
                Financial Year
              </Form.Label>
              <Form.Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{
                  border: "2px solid #a7f3d0",
                  borderRadius: "6px",
                  padding: "10px",
                }}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Filter Type Selection */}
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 600, color: "#15803d" }}>
                Filter By
              </Form.Label>
              <Form.Select
                value={selectedFilterType}
                onChange={(e) => setSelectedFilterType(e.target.value)}
                style={{
                  border: "2px solid #a7f3d0",
                  borderRadius: "6px",
                  padding: "10px",
                }}
              >
                {filterTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Filter Value Selection */}
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 600, color: "#15803d" }}>
                Select {filterTypeOptions.find(f => f.value === selectedFilterType)?.label}
              </Form.Label>
              {loading ? (
                <div style={{ textAlign: "center", padding: "1rem" }}>
                  <Spinner animation="border" variant="success" size="sm" />
                  <span style={{ marginLeft: "0.5rem" }}>Loading options...</span>
                </div>
              ) : (
                <Form.Select
                  value={selectedFilterValue}
                  onChange={(e) => setSelectedFilterValue(e.target.value)}
                  style={{
                    border: "2px solid #a7f3d0",
                    borderRadius: "6px",
                    padding: "10px",
                  }}
                  disabled={filterOptions.length === 0}
                >
                  <option value="">-- Select --</option>
                  {filterOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Form.Select>
              )}
            </Form.Group>

            {filterOptions.length === 0 && !loading && (
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#fef3c7",
                  borderRadius: "6px",
                  color: "#92400e",
                  fontSize: "0.875rem",
                }}
              >
                No options available for this filter type
              </div>
            )}
          </Form>
        </Modal.Body>

        <Modal.Footer style={{ borderTop: "1px solid #e5e7eb" }}>
          <Button
            variant="outline-secondary"
            onClick={onClose}
            style={{ fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleSubmit}
            disabled={!selectedFilterValue || loadingInvoices}
            style={{
              fontWeight: 600,
              backgroundColor: "#15803d",
              borderColor: "#15803d",
            }}
          >
            {loadingInvoices ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  style={{ marginRight: "0.5rem" }}
                />
                Loading...
              </>
            ) : (
              "Show Invoices"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {showInvoiceModal && (
        <InvoiceDetailsModal
          invoiceData={invoiceData}
          onClose={handleCloseInvoiceModal}
          title={getModalTitle()}
        />
      )}
    </>
  );
};

export default InvoiceFilterModal;