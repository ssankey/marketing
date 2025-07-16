// layouts/navbars/NavbarTop.js
import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, ChevronRight } from 'react-feather';
import Link from 'next/link';
import {
  Nav,
  Navbar,
  Form,
  Container,
  ListGroup,
  Badge,
  Table,
  Button,
  Modal,
  Spinner,
} from 'react-bootstrap';
import QuickMenu from 'layouts/QuickMenu';
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";

const NavbarTop = (props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showLineItemModal, setShowLineItemModal] = useState(false);
  const [lineItems, setLineItems] = useState([]);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [loadingLineItems, setLoadingLineItems] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.length > 0) {
        try {
          const token = localStorage.getItem('token');
          
          // Ensure token exists
          if (!token) {
            console.error('No token found');
            setSearchResults([]);
            setShowSuggestions(false);
            return;
          }

          const res = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include' // If using cookies/sessions
          });
          
          if (!res.ok) {
            // Handle specific error cases
            if (res.status === 401) {
              // Token expired or invalid
              console.error('Authentication failed - redirect to login');
              // Optionally redirect to login
              window.location.href = '/login';
              return;
            }
            if (res.status === 403) {
              console.error('Forbidden - insufficient permissions');
              return;
            }
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          
          const data = await res.json();
          setSearchResults(data);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching search results:', error);
          setSearchResults([]);
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
        setSearchResults([]);
      }
    };

    const timer = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchLineItems = async (docNum, category) => {
    setLoadingLineItems(true);
    try {
      const res = await fetch(`/api/search/line-items?docNum=${docNum}&category=${category}`);
      const data = await res.json();
      setLineItems(data);
    } catch (error) {
      console.error('Error fetching line items:', error);
      setLineItems([]);
    } finally {
      setLoadingLineItems(false);
    }
  };

  const handleRowClick = async (item, category, rowData) => {
    const docNum = rowData[0]; // First column is always the document number
    setSelectedRowData({ docNum, category, rowData });
    
    // Close search suggestions when opening modal
    setShowSuggestions(false);
    
    setShowLineItemModal(true);
    await fetchLineItems(docNum, category);
  };

  const toggleRowExpansion = (rowIndex) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowIndex)) {
      newExpanded.delete(rowIndex);
    } else {
      newExpanded.add(rowIndex);
    }
    setExpandedRows(newExpanded);
  };

  const renderLineItemsTable = () => {
    if (loadingLineItems) {
      return (
        <div className="text-center p-4">
          <Spinner animation="border" size="sm" />
          <div className="mt-2">Loading line items...</div>
        </div>
      );
    }

    if (!lineItems || lineItems.length === 0) {
      return (
        <div className="text-center p-4 text-muted">
          No line items found
        </div>
      );
    }

    const headerItem = lineItems.find(item => item.type === 'header');
    const dataItems = lineItems.filter(item => item.type === 'data');

    return (
      <div className="table-responsive" style={{ 
        maxHeight: '400px', 
        overflowY: 'auto',
        border: '1px solid #dee2e6',
        borderRadius: '0.375rem'
      }}>
        <Table striped hover size="sm" className="mb-0">
          <thead className="table-light sticky-top">
            <tr>
              {headerItem && headerItem.data.map((header, index) => (
                <th key={index} className="text-nowrap small fw-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataItems.map((item, index) => (
              <tr key={index}>
                {item.data.map((cell, cellIndex) => {
                  // Check if the header indicates this is an amount field
                  const isAmountField = headerItem?.data[cellIndex]?.toLowerCase().includes('amount') || 
                                       headerItem?.data[cellIndex]?.toLowerCase().includes('total') ||
                                       headerItem?.data[cellIndex]?.toLowerCase().includes('value');
                  
                  // Check if the header indicates this is a date field
                  const isDateField = headerItem?.data[cellIndex]?.toLowerCase().includes('date');
                  
                  // Format the cell value accordingly
                  let formattedValue = cell;
                  if (isAmountField && !isNaN(cell)) {
                    formattedValue = formatCurrency(parseFloat(cell));
                  } else if (isDateField && cell && cell !== 'Dispatch Pending') {
                    formattedValue = formatDate(cell);
                  }

                  return (
                    <td key={cellIndex} className="text-nowrap small">
                      {formattedValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  const renderSearchResults = () => {
    if (!searchResults || searchResults.length === 0) return null;

    const groupedByCategory = {};
    searchResults.forEach(item => {
      if (!groupedByCategory[item.category]) {
        groupedByCategory[item.category] = [];
      }
      groupedByCategory[item.category].push(item);
    });

    return (
      <div className="position-absolute bg-white shadow-lg mt-1 w-100 p-3" style={{ 
        zIndex: showLineItemModal ? 1040 : 1060, // Lower z-index when modal is open
        maxHeight: '400px', 
        overflowY: 'auto',
        border: '1px solid #dee2e6',
        borderRadius: '0.375rem'
      }}>
        {Object.entries(groupedByCategory).map(([category, items]) => {
          const headerItem = items.find(item => item.type === 'header');
          const dataItems = items.filter(item => item.type === 'data');

          return (
            <div key={category} className="mb-3">
              <h6 className="text-primary mb-2 fw-bold">{category} Results</h6>
              <div className="table-responsive">
                <Table striped hover size="sm" className="mb-0">
                  <thead className="table-light">
                    <tr>
                      {headerItem && headerItem.data.map((header, index) => (
                        <th key={index} className="text-nowrap small fw-semibold">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataItems.map((item, index) => (
                      <tr 
                        key={index} 
                        className="cursor-pointer" 
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleRowClick(item, category, item.data)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                      >
                        {item.data.map((cell, cellIndex) => {
                          // Check if the header indicates this is an amount field
                          const isAmountField = headerItem?.data[cellIndex]?.toLowerCase().includes('amount') || 
                                               headerItem?.data[cellIndex]?.toLowerCase().includes('total') ||
                                               headerItem?.data[cellIndex]?.toLowerCase().includes('price');
                          
                          // Check if the header indicates this is a date field
                          const isDateField = headerItem?.data[cellIndex]?.toLowerCase().includes('date');
                          
                          // Format the cell value accordingly
                          let formattedValue = cell;
                          if (isAmountField && !isNaN(cell)) {
                            formattedValue = formatCurrency(parseFloat(cell));
                          } else if (isDateField) {
                            formattedValue = formatDate(cell);
                          }

                          return (
                            <td key={cellIndex} className="text-nowrap small">
                              {formattedValue}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleClickOutside = (e) => {
    // Don't close suggestions if modal is open or if clicking inside search container
    if (showLineItemModal || e.target.closest('.search-container') || e.target.closest('.modal')) {
      return;
    }
    setShowSuggestions(false);
  };

  const handleModalClose = () => {
    setShowLineItemModal(false);
    // Don't close search suggestions when modal closes
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showLineItemModal]); // Add showLineItemModal as dependency

  return (
    <>
      <Navbar expanded="lg" className="navbar-classic navbar navbar-expand-lg">
        <Container fluid className="px-0">
          <div className='d-flex justify-content-between align-items-center w-100'>

            {/* Left side: Sidebar toggle + Search */}
            <div className="d-flex align-items-center gap-3" style={{ flex: 1 }}>
              <Link
                href="#"
                id="nav-toggle"
                className="nav-icon icon-xs"
                onClick={() => props.data.SidebarToggleMenu(!props.data.showMenu)}
              >
                <Menu size="18px" />
              </Link>

              {/* Search Bar */}
              <div className="d-none d-md-block position-relative search-container" 
                   style={{ minWidth: '300px', maxWidth: '800px', width: '100%' }}>
                <Form className="d-flex">
                  <Form.Control
                    type="search"
                    placeholder="Search invoices, orders.."
                    className="w-100"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </Form>

                {/* Suggestions Dropdown */}
                {showSuggestions && searchResults.length > 0 && renderSearchResults()}
              </div>
            </div>

            {/* Right side: Quick Menu */}
            <div className="d-flex ms-auto">
              <Nav className="navbar-right-wrap nav-top-wrap">
                <QuickMenu />
              </Nav>
            </div>
          </div>
        </Container>
      </Navbar>

      {/* Line Items Modal */}
      <Modal 
        show={showLineItemModal} 
        onHide={handleModalClose}
        size="xl"
        centered
        style={{ zIndex: 1065 }} // Ensure modal is above everything
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedRowData && (
              <>
                {selectedRowData.category} Line Items - {selectedRowData.category === 'Invoice' ? 'Invoice' : 'SO'} #{selectedRowData.docNum}
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {renderLineItemsTable()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default NavbarTop;