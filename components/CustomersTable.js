import React from "react";
import { Container, Row, Col, Spinner, Card, Table, Button, Form, InputGroup } from "react-bootstrap";
import Link from "next/link";
import downloadExcel from "utils/exporttoexcel";

const CustomersTable = ({ 
  customers, 
  allCustomers,
  totalItems, 
  totalPages,
  currentPage,
  isLoading = false,
  onPageChange,
  searchTerm,
  onSearchChange,
  sortField,
  sortDir,
  onSortChange,
  status,
  onStatusChange,
  onRefresh
}) => {
  const columns = [
    {
      field: "CustomerCode",
      label: "Customer Code",
      render: (value) => (
        <Link
          href={`/customers/${value}`}
          className="text-decoration-none fw-semibold"
          style={{ color: "#2563eb" }}
        >
          {value}
        </Link>
      ),
    },
    {
      field: "CustomerName",
      label: "Customer Name",
      render: (value) => (
        <span className="fw-medium" style={{ color: "#1f2937" }}>
          {value || "N/A"}
        </span>
      ),
    },
    {
      field: "City",
      label: "City",
      render: (value) => (
        <span style={{ color: "#6b7280" }}>{value || "N/A"}</span>
      ),
    },
    {
      field: "State",
      label: "State",
      render: (value) => (
        <span style={{ color: "#6b7280" }}>{value || "N/A"}</span>
      ),
    },
    {
      field: "Country",
      label: "Country",
      render: (value) => (
        <span style={{ color: "#6b7280" }}>{value || "N/A"}</span>
      ),
    },
    {
      field: "SalesEmployeeName",
      label: "Sales Employee",
      render: (value) => (
        <span 
          className="badge" 
          style={{ 
            backgroundColor: value && value !== "N/A" ? "#dbeafe" : "#f3f4f6",
            color: value && value !== "N/A" ? "#1e40af" : "#6b7280",
            fontWeight: "500",
            fontSize: "0.75rem",
            padding: "0.25rem 0.5rem",
            borderRadius: "0.25rem"
          }}
        >
          {value || "Unassigned"}
        </span>
      ),
    },
    {
      field: "Phone",
      label: "Phone Number",
      render: (value) => (
        <span style={{ color: "#374151", fontFamily: "monospace", fontSize: "0.813rem" }}>
          {value || "N/A"}
        </span>
      ),
    },
    {
      field: "Email",
      label: "Email",
      render: (value) => (
        value && value !== "N/A" ? (
          <a 
            href={`mailto:${value}`} 
            className="text-decoration-none"
            style={{ color: "#059669", fontSize: "0.813rem" }}
          >
            {value}
          </a>
        ) : (
          <span style={{ color: "#6b7280" }}>N/A</span>
        )
      ),
    },
  ];

  const handleExcelDownload = () => {
    try {
      const dataToExport = allCustomers || customers;
      
      if (!dataToExport || dataToExport.length === 0) {
        alert("No data available to export.");
        return;
      }

      const excelData = dataToExport.map(customer => ({
        "Customer Code": customer.CustomerCode || "N/A",
        "Customer Name": customer.CustomerName || "N/A",
        "City": customer.City || "N/A",
        "State": customer.State || "N/A",
        "Country": customer.Country || "N/A",
        "Sales Employee": customer.SalesEmployeeName || "N/A",
        "Phone": customer.Phone || "N/A",
        "Email": customer.Email || "N/A",
        "Balance": customer.Balance || 0,
        "Credit Line": customer.CreditLine || 0,
        "Currency": customer.Currency || "N/A",
        "Status": customer.IsActive ? "Active" : "Inactive",
      }));

      downloadExcel(excelData, "All_Customers");
      console.log(`Exported ${excelData.length} customers to Excel`);
    } catch (error) {
      console.error("Failed to export data:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  const handleReset = () => {
    if (onSearchChange) onSearchChange("");
    if (onStatusChange) onStatusChange("all");
    if (onPageChange) onPageChange(1);
  };

  // Custom Pagination Component
  const CustomPagination = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="d-flex justify-content-center align-items-center gap-1 mt-3">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          style={{ minWidth: "60px", fontSize: "0.813rem", padding: "0.25rem 0.5rem" }}
        >
          First
        </Button>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{ padding: "0.25rem 0.5rem" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </Button>
        
        {startPage > 1 && (
          <>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => onPageChange(1)}
              style={{ padding: "0.25rem 0.5rem", minWidth: "32px", fontSize: "0.813rem" }}
            >
              1
            </Button>
            {startPage > 2 && <span className="text-muted" style={{ fontSize: "0.813rem" }}>...</span>}
          </>
        )}
        
        {pageNumbers.map((number) => (
          <Button
            key={number}
            variant={currentPage === number ? "primary" : "outline-secondary"}
            size="sm"
            onClick={() => onPageChange(number)}
            style={{ minWidth: "32px", padding: "0.25rem 0.5rem", fontSize: "0.813rem" }}
          >
            {number}
          </Button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-muted" style={{ fontSize: "0.813rem" }}>...</span>}
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              style={{ padding: "0.25rem 0.5rem", minWidth: "32px", fontSize: "0.813rem" }}
            >
              {totalPages}
            </Button>
          </>
        )}
        
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{ padding: "0.25rem 0.5rem" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </Button>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          style={{ minWidth: "60px", fontSize: "0.813rem", padding: "0.25rem 0.5rem" }}
        >
          Last
        </Button>
      </div>
    );
  };

  return (
    <Container fluid className="py-3" style={{ backgroundColor: "#f9fafb" }}>
      {/* Compact Header Section */}
      <Row className="mb-3">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="fw-bold mb-0" style={{ color: "#111827" }}>
                Customers
              </h4>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <span 
                className="badge" 
                style={{ 
                  backgroundColor: "#dbeafe",
                  color: "#1e40af",
                  fontSize: "0.875rem",
                  padding: "0.375rem 0.75rem",
                  fontWeight: "600",
                  borderRadius: "0.375rem"
                }}
              >
                Total: {totalItems}
              </span>
              {onRefresh && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={onRefresh}
                  style={{ padding: "0.375rem 0.75rem" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                </Button>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Compact Search Card */}
      <Card className="mb-3 border-0 shadow-sm">
        <Card.Body className="p-3">
          {/* Compact Search Bar */}
          <Row className="mb-2">
            <Col md={12}>
              <InputGroup>
                <InputGroup.Text 
                  style={{ 
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    borderRight: "none",
                    padding: "0.5rem 0.75rem"
                  }}
                >
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="#6b7280" 
                    strokeWidth="2"
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by code, name, city, state, sales employee, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderLeft: "none",
                    fontSize: "0.875rem",
                    padding: "0.5rem 0.75rem"
                  }}
                />
                {searchTerm && (
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => onSearchChange("")}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderLeft: "none",
                      padding: "0.5rem 0.75rem"
                    }}
                  >
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </Button>
                )}
              </InputGroup>
            </Col>
          </Row>

          {/* Compact Info Section */}
          <Row className="align-items-center">
            <Col>
              <p className="text-muted mb-0" style={{ fontSize: "0.75rem" }}>
                <span className="fw-semibold" style={{ color: "#374151" }}>
                  {totalItems}
                </span>{" "}
                customers
                {searchTerm && (
                  <span className="ms-2">
                    matching "<span className="fw-semibold" style={{ color: "#2563eb" }}>{searchTerm}</span>"
                  </span>
                )}
              </p>
            </Col>
            {searchTerm && (
              <Col xs="auto">
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={handleReset}
                  className="p-0 text-decoration-none"
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7280"
                  }}
                >
                  Reset
                </Button>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>

      {/* Compact Table Card */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {isLoading ? (
            <div 
              className="d-flex flex-column align-items-center justify-content-center" 
              style={{ minHeight: "300px" }}
            >
              <Spinner 
                animation="border" 
                variant="primary" 
                style={{ width: "2.5rem", height: "2.5rem" }}
              />
              <p className="mt-3 text-muted" style={{ fontSize: "0.875rem" }}>
                Loading customers...
              </p>
            </div>
          ) : (
            <>
              {/* Compact Export Button */}
              <div className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center" style={{ backgroundColor: "#f9fafb" }}>
                <p className="mb-0 text-muted" style={{ fontSize: "0.75rem" }}>
                  Showing <span className="fw-semibold text-dark">{customers.length}</span> customers
                </p>
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleExcelDownload}
                  className="d-flex align-items-center gap-1"
                  style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                >
                  <svg 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Export ({totalItems})
                </Button>
              </div>

              {/* Compact Table */}
              <div style={{ overflowX: "auto" }}>
                <Table 
                  hover 
                  responsive 
                  className="mb-0"
                  style={{ 
                    fontSize: "0.813rem",
                    borderCollapse: "separate",
                    borderSpacing: 0
                  }}
                >
                  <thead style={{ backgroundColor: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                    <tr>
                      {columns.map((column) => (
                        <th
                          key={column.field}
                          onClick={() => onSortChange && onSortChange(column.field)}
                          style={{
                            cursor: onSortChange ? "pointer" : "default",
                            padding: "0.625rem 0.75rem",
                            fontWeight: "600",
                            color: "#374151",
                            textTransform: "uppercase",
                            fontSize: "0.688rem",
                            letterSpacing: "0.03em",
                            whiteSpace: "nowrap",
                            position: "sticky",
                            top: 0,
                            backgroundColor: "#f9fafb",
                            zIndex: 10,
                            userSelect: "none"
                          }}
                        >
                          <div className="d-flex align-items-center gap-1">
                            {column.label}
                            {onSortChange && sortField === column.field && (
                              <span style={{ color: "#2563eb" }}>
                                {sortDir === "asc" ? (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 19V5M5 12l7-7 7 7"/>
                                  </svg>
                                ) : (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 5v14M19 12l-7 7-7-7"/>
                                  </svg>
                                )}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        style={{
                          borderBottom: "1px solid #f3f4f6",
                          transition: "background-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f9fafb";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        {columns.map((column) => (
                          <td
                            key={column.field}
                            style={{
                              padding: "0.625rem 0.75rem",
                              verticalAlign: "middle",
                              color: "#374151"
                            }}
                          >
                            {column.render
                              ? column.render(row[column.field], row)
                              : row[column.field] || "N/A"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              {customers.length === 0 && (
                <div 
                  className="text-center py-5" 
                  style={{ backgroundColor: "#f9fafb" }}
                >
                  <svg 
                    className="mx-auto mb-3" 
                    width="48" 
                    height="48" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="#d1d5db" 
                    strokeWidth="1.5"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <p className="fw-semibold mb-1" style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                    No customers found
                  </p>
                  <p className="text-muted mb-2" style={{ fontSize: "0.75rem" }}>
                    Try adjusting your search
                  </p>
                  {searchTerm && (
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={handleReset}
                      style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem" }}
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Compact Pagination */}
      {!isLoading && customers.length > 0 && totalPages > 1 && (
        <>
          <CustomPagination />

          <Row className="mt-2">
            <Col className="text-center">
              <p className="text-muted mb-0" style={{ fontSize: "0.75rem" }}>
                Showing <span className="fw-semibold text-dark">{((currentPage - 1) * 20) + 1}</span> to{" "}
                <span className="fw-semibold text-dark">
                  {Math.min(currentPage * 20, totalItems)}
                </span>{" "}
                of <span className="fw-semibold text-dark">{totalItems}</span> customers
              </p>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default CustomersTable;