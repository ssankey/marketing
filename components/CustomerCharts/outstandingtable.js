

// components/CustomerCharts/outstandingtable.js

import React from "react";
import { Table } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";

/**
 * Table component to display customer orders, deliveries, and invoices.
 * @param {Array} customerOutstandings - The data to display in the table.
 */
const CustomerOrdersTable = ({ customerOutstandings }) => {
  if (!customerOutstandings || customerOutstandings.length === 0) {
    return <p>No data available.</p>;
  }

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>SO#</th>
          <th>SO Date</th>
          <th>Delivery#</th>
          <th>Delivery Date</th>
          <th>SO to Delivery Days</th>
          <th>Invoice No.</th>
          <th>AR Invoice Date</th>
          <th>Invoice Total</th>
          <th>Balance Due</th>
          <th>Overdue Days</th>
          <th>Payment Group</th>
        </tr>
      </thead>
      <tbody>
        {customerOutstandings.map((row, index) => (
          <tr key={index}>
            <td>{row["SO#"]}</td>
            <td>{formatDate(row["SO Date"])}</td>
            <td>{row["Delivery#"]}</td>
            <td>{formatDate(row["Delivery Date"])}</td>
            <td>{row["SO to Delivery Days"]}</td>
            <td>{row["Invoice No."]}</td>
            <td>{formatDate(row["AR Invoice Date"])}</td>
            <td>{formatCurrency(row["Invoice Total"])}</td>
            <td>{formatCurrency(row["Balance Due"])}</td>
            <td>{row["Overdue Days"]}</td>
            <td>{row["PymntGroup"]}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default CustomerOrdersTable;
