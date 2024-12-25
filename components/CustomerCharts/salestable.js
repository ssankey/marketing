import React from "react";
import GenericTable from "components/GenericTable";
import downloadExcel from "utils/exporttoexcel";
import { formatCurrency } from "utils/formatCurrency";




const SalesTable = ({ data }) => {
  const columns = [
    { label: "Category", field: "Category" },
    { label: "Quantity", field: "Quantity" },
    {
      label: "Sales",
      field: "Sales",
      render: (value) => formatCurrency(value),
    },
  ];


//   const handleExcelDownload = () => {
//     if (data && data.length > 0) {
//       downloadExcel(data, "SalesByCategory");
//     } else {
//       alert("No data available to export.");
//     }
//   };

 const handleExcelDownload = () => {
   if (data && data.length > 0) {
     // Format the sales data before exporting to Excel
     const formattedData = data.map((row) => ({
       ...row,
       Sales: formatCurrency(row.Sales), // Apply formatting to Sales field
     }));
     downloadExcel(formattedData, "SalesByCategory");
   } else {
     alert("No data available to export.");
   }
 };




  return (
    <GenericTable
      columns={columns}
      data={data}
      onSort={() => {}}
      sortField=""
      sortDirection=""
      onExcelDownload={handleExcelDownload}
    />
  );
};

export default SalesTable;
