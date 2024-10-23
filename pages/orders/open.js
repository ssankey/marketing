import Link from 'next/link';
import React, { useState, useMemo } from 'react';
import { Table, Form, Pagination, Container, Row, Col } from 'react-bootstrap';

// Pagination configuration
const ITEMS_PER_PAGE = 10;

const Open = ({ orders }) => {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('DocNum');
  const [sortDirection, setSortDirection] = useState('asc');

  // Filter orders based on search term
  const filteredOrders = useMemo(() => {
    return orders.filter(order =>
      order.DocNum.toString().includes(searchTerm) ||
      order.CardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.ItemCode && order.ItemCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.Dscription && order.Dscription.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [orders, searchTerm]);

  // Sort orders
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }, [filteredOrders, sortField, sortDirection]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedOrders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = sortedOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <Container fluid>
      {/* Search and Filter Section */}
      <Row className="mb-3 mt-3">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
        </Col>
        <Col md={6} className="text-end">
          <span>Total Orders: {filteredOrders.length}</span>
        </Col>
      </Row>

      {/* Page Information */}
      <Row className="mb-2">
        <Col className="text-center">
          <h5>
            Page {currentPage} of {totalPages}
          </h5>
        </Col>
      </Row>

      {/* Table Section */}
      <Table striped hover responsive className="text-nowrap">
        <thead>
          <tr>
            <th onClick={() => handleSort('DocNum')} style={{ cursor: 'pointer' }}>
              Order#{renderSortIndicator('DocNum')}
            </th>
            <th onClick={() => handleSort('DocDate')} style={{ cursor: 'pointer' }}>
              Date{renderSortIndicator('DocDate')}
            </th>
            <th onClick={() => handleSort('CardName')} style={{ cursor: 'pointer' }}>
              Customer{renderSortIndicator('CardName')}
            </th>
            <th onClick={() => handleSort('ItemCode')} style={{ cursor: 'pointer' }}>
              Cat No.{renderSortIndicator('ItemCode')}
            </th>
            <th onClick={() => handleSort('Dscription')} style={{ cursor: 'pointer' }}>
              Compound{renderSortIndicator('Dscription')}
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedOrders.map((order) => (
            <tr key={order.DocNum}>
              <th>
                <Link href={`/orders/${order.DocNum}`}>{order.DocNum}</Link>
              </th>
              <td>{new Date(order.DocDate[0]).toLocaleDateString()}</td>
              <td>{order.CardName}</td>
              <td>{order.ItemCode || 'N/A'}</td>
              <td>{order.Dscription || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Show message if no orders */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-4">
          No orders available.
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-3">
          <Pagination>
            <Pagination.First
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            />
            <Pagination.Prev
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            />

            {[...Array(totalPages)].map((_, idx) => (
              <Pagination.Item
                key={idx + 1}
                active={currentPage === idx + 1}
                onClick={() => setCurrentPage(idx + 1)}
              >
                {idx + 1}
              </Pagination.Item>
            ))}

            <Pagination.Next
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            />
            <Pagination.Last
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            />
          </Pagination>
        </div>
      )}
    </Container>
  );
};

export default Open;

// Keep your existing getServerSideProps
export async function getServerSideProps(context) {
  try {
    const protocol = context.req.headers['x-forwarded-proto'] || 'http';
    const host = context.req.headers.host;
    const res = await fetch(`${protocol}://${host}/api/orders`);

    if (!res.ok) {
      throw new Error(`Failed to fetch data, received status ${res.status}`);
    }

    const orders = await res.json();

    return {
      props: {
        orders: Array.isArray(orders) ? orders : [orders],
      },
    };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return {
      props: {
        orders: [],
      },
    };
  }
}
