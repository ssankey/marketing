

// Fixed SalesTable component
import React, { useState, useRef, useCallback, useEffect } from "react";
import GenericTable from "components/GenericTable";
import downloadExcel from "utils/exporttoexcel";
import { formatCurrency } from "utils/formatCurrency";
import Select from "react-select";
import { Button, Spinner } from "react-bootstrap";
import debounce from "lodash/debounce";



const SalesTable = ({ data, loading }) => {
  const columns = [
    { label: "Category", field: "Category" },
    { label: "Quantity", field: "Quantity" },
    {
      label: "Sales",
      field: "Sales",
      render: (value) => formatCurrency(value),
    },
  ];

  const handleExcelDownload = () => {
    if (data && data.length > 0) {
      const formattedData = data.map((row) => ({
        ...row,
        Sales: formatCurrency(row.Sales),
      }));
      downloadExcel(formattedData, "SalesByCategory");
    } else {
      alert("No data available to export.");
    }
  };

  return (
    <div>
      {loading ? (
        <div className="text-center p-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading data...</p>
        </div>
      ) : (
        <GenericTable
          columns={columns}
          data={data}
          onSort={() => {}}
          sortField=""
          sortDirection=""
          onExcelDownload={handleExcelDownload}
        />
      )}
    </div>
  );
};

export default SalesTable;
