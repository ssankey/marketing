// components/Filters.js
import { Row, Col, Form } from 'react-bootstrap';

const Filters = ({
  searchTerm,
  onSearch,
  statusFilter,
  onStatusChange,
  fromDate,
  toDate,
  onDateFilterChange,
}) => (
  <Row className="mb-4">
    <Col md={4}>
      <Form.Control
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
      />
    </Col>
    <Col md={4}>
      <Form.Select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)}>
        <option value="all">All</option>
        <option value="open">Open</option>
        <option value="closed">Closed</option>
        <option value="cancel">Cancelled</option>
      </Form.Select>
    </Col>
    <Col md={2}>
      <Form.Control
        type="date"
        value={fromDate}
        onChange={(e) => onDateFilterChange({ fromDate: e.target.value, toDate })}
      />
    </Col>
    <Col md={2}>
      <Form.Control
        type="date"
        value={toDate}
        onChange={(e) => onDateFilterChange({ fromDate, toDate: e.target.value })}
      />
    </Col>
  </Row>
);

export default Filters;
