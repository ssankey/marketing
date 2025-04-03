

// components/CustomerCharts/outstandingtable.js

import React from "react";
import { Table } from "react-bootstrap";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";


/**
 * Table component to display customer orders, deliveries, and invoices.
 * @param {Array} customerOutstandings - The data to display in the table.
 */




    
const CustomerOrdersTable = ({ customerOutstandings, filter , onExcelDownload  }) => {
//   if (!customerOutstandings || customerOutstandings.length === 0) {
//     return <p>No data available.</p>;
//   }

 const handleDownload = () => {
    const filtered = customerOutstandings?.filter(item => {
      if (filter === 'Payment Pending') return item['Balance Due'] > 0;
      if (filter === 'Payment Done') return item['Balance Due'] === 0;
      return true;
    });

    const excelData = filtered.map(item => ({
      "SO#": item["SO#"],
      "SO Date": formatDate(item["SO Date"]),
      "Tracking No": item["Tracking No"],
      "Delivery#": item["Delivery#"],
      "Delivery Date": formatDate(item["Delivery Date"]),
      "SO to Delivery Days": item["SO to Delivery Days"],
      "Invoice No.": item["Invoice No."],
      "AR Invoice Date": formatDate(item["AR Invoice Date"]),
      "Invoice Total": formatCurrency(item["Invoice Total"]),
      "Balance Due": formatCurrency(item["Balance Due"]),
      "AirLine Name": item["AirLine Name"],
      "Overdue Days": item["Overdue Days"],
      "Payment Group": item["PymntGroup"],
    }));

    downloadExcel(excelData, `Customer_Outstanding_${filter}`);
  };


   const filteredData = customerOutstandings?.filter(item => {
    if (filter === 'Payment Pending') {
      return item['Balance Due'] > 0;
    } else if (filter === 'Payment Done') {
      return item['Balance Due'] === 0;
    }
    return true; // Show all if no filter matches
  });

  return (
    <>
        <Table striped bordered hover responsive>
            <thead>
            <tr>
                <th>SO#</th>
                <th>SO Date</th>
                <th>Tracking no</th>
                <th>Delivery#</th>
                <th>Delivery Date</th>
                <th>SO to Delivery Days</th>
                <th>Invoice No.</th>
                <th>AR Invoice Date</th>
                <th>Invoice Total</th>
                <th>Balance Due</th>
                <th>AirLine Name</th>
                <th>Overdue Days</th>
                <th>Payment Group</th>
            </tr>
            </thead>

            <tbody>
            {filteredData?.length > 0 ? (
                filteredData.map((item, index) => (
                <tr key={index}>
                    <td>{item['SO#']}</td>
                    <td>{formatDate(item['SO Date'])}</td>
                    <td>{item['Tracking No']}</td>
                    <td>{item['Delivery#']}</td>
                    <td>{formatDate(item['Delivery Date'])}</td>
                    <td>{item['SO to Delivery Days']}</td>
                    <td>{item['Invoice No.']}</td>
                    <td>{formatDate(item['AR Invoice Date'])}</td>
                    <td>{formatCurrency(item['Invoice Total'])}</td>
                    <td className={item['Balance Due'] > 0 ? 'text-danger fw-bold' : 'text-success'}>
                    {formatCurrency(item['Balance Due'])}
                    </td>
                    <td>{item['AirLine Name']}</td>
                    <td>{item['Overdue Days']}</td>
                    <td>{item['PymntGroup']}</td>
                </tr>
                ))
            ) : (
                <tr>
                <td colSpan="11" className="text-center">
                    No {filter === 'Payment Pending' ? 'pending payments' : 'completed payments'} found
                </td>
                </tr>
            )}
            </tbody>
        </Table>
    </>
  );
};

export default CustomerOrdersTable;