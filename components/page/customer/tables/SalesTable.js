// Import necessary libraries and components
import React from "react";
import GenericTable from "components/tabel/GenericTable";
import downloadExcel from "utils/exportToExcel";
import { formatCurrency } from "utils/formatCurrency";

/**
 * SalesTable Component
 * A table component that displays sales data by category and allows exporting the data to Excel.
 *
 * @param {Object[]} data - The sales data to be displayed in the table.
 * @returns {JSX.Element}
 */
const SalesTable = ({ data }) => {
  // Define table columns with labels and corresponding fields
  const columns = [
    { label: "Category", field: "Category" },
    { label: "Quantity", field: "Quantity" },
    {
      label: "Sales",
      field: "Sales",
      render: (value) => formatCurrency(value), // Format the Sales value using the utility function
    },
  ];

  /**
   * Handle exporting table data to Excel
   */
  const handleExcelDownload = () => {
    if (data && data.length > 0) {
      // Format the sales data before exporting to Excel
      const formattedData = data.map((row) => ({
        ...row,
        Sales: formatCurrency(row.Sales), // Apply formatting to Sales field
      }));

      // Export formatted data to Excel
      downloadExcel(formattedData, "SalesByCategory");
    } else {
      // Show an alert if no data is available
      alert("No data available to export.");
    }
  };

  return (
    <GenericTable
      columns={columns} // Pass the table columns
      data={data} // Pass the sales data
      onSort={() => {}} // Placeholder for sorting functionality
      sortField="" // No default sort field
      sortDirection="" // No default sort direction
      onExcelDownload={handleExcelDownload} // Pass the export to Excel handler
    />
  );
};

export default SalesTable;
