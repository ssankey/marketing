// import React, { useState, useEffect } from 'react';
// import { Container, Row, Col, Spinner } from 'react-bootstrap';
// import GenericTable from './GenericTable';
// import TableFilters from './TableFilters';
// import TablePagination from './TablePagination';
// import { formatCurrency } from 'utils/formatCurrency';
// import Link from 'next/link';
// import StatusBadge from './StatusBadge';
// import { formatDate } from 'utils/formatDate';
// import usePagination from 'hooks/usePagination';
// import useTableFilters from 'hooks/useFilteredData';
// import { truncateText } from 'utils/truncateText';
// import downloadExcel from "utils/exporttoexcel";
// import { Printer } from 'react-bootstrap-icons';

// const OrdersTable = ({ orders, totalItems, isLoading = false, status }) => {
//   const ITEMS_PER_PAGE = 20;
//   const [displayState, setDisplayState] = useState({
//     hasData: false,
//     showLoading: true
//   });

//   const { currentPage, totalPages, onPageChange } = usePagination(
//     totalItems,
//     ITEMS_PER_PAGE
//   );

//   const {
//     searchTerm,
//     statusFilter,
//     fromDate,
//     toDate,
//     sortField,
//     sortDirection,
//     handleSearch,
//     handleStatusChange,
//     handleDateFilterChange,
//     handleSort,
//     handleReset,
//   } = useTableFilters();

//   // Update display state based on props
//   useEffect(() => {
//     setDisplayState(prev => ({
//       hasData: orders.length > 0,
//       showLoading: isLoading && !prev.hasData
//     }));
//   }, [isLoading, orders]);

//   const columns = [
//     {
//       field: "DocNum",
//       label: "Order#",
//       render: (value, row) => (
//         <>
//           <Link
//             href={`/orderdetails?d=${value}&e=${row.DocEntry}`}
//             className="text-blue-600 hover:text-blue-800"
//           >
//             {value}
//           </Link>
//           {/* &nbsp;
//           <Link
//             href={`/printOrder?d=${value}&e=${row.DocEntry}`}
//             className="text-blue-600 hover:text-blue-800"
//             target="_blank"
//           >
//             <Printer />
//           </Link> */}
//         </>
//       ),
//     },
//     {
//       field: "DocStatus",
//       label: "Order Status",
//       // render: (value) => <StatusBadge status={value.toLowerCase()} />,
//        render: (value) => (
//         <span
//           className={`badge ${
//             value === "Closed" ? "bg-success" : "bg-danger"
//           }`}
//         >
//           {value}
//         </span>
//       ),
//     },
//     {
//       field: "CustomerPONo",
//       label: "Customer PONo",
//       render: (value) => value || "N/A",
//     },
//     {
//       field: "CardName",
//       label: "Customer",
//       render: (value) => truncateText(value, 20),
//     },
    
//     {
//       field: "DocDate",
//       label: "Order Date",
//       render: (value) => formatDate(value),
//     },
//     {
//       field: "ProductCount",
//       label: "Product Count",
//       render: (value) => value || "N/A",
//     },
//     {
//       field: "DeliveryDate",
//       label: "Delivery Date",
//       render: (value) => formatDate(value),
//     },
//     {
//       field: "DocTotal",
//       label: "Total Amount",
//       render: (value, row) => {
//         const amountInINR =
//           row.DocCur === "INR" ? value : value * row.ExchangeRate;
//         return formatCurrency(amountInINR);
//       },
//     },
//     {
//       field: "DocCur",
//       label: "Currency",
//       render: (value) => value || "N/A",
//     },
//     {
//       field: "SalesEmployee",
//       label: "Sales Employee",
//       render: (value) => value || "N/A",
//     },
//   ];

//   const handleExcelDownload = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         console.error("No token found");
//         return;
//       }

//       const url = `/api/excel/getAllOrders?status=${statusFilter}&search=${searchTerm}&sortField=${sortField}&sortDir=${sortDirection}&fromDate=${fromDate || ""}&toDate=${toDate || ""}`;
      
//       const response = await fetch(url, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const filteredOrders = await response.json();

//       if (filteredOrders && filteredOrders.length > 0) {
//         downloadExcel(filteredOrders, `Orders_${statusFilter}`);
//       } else {
//         alert("No data available to export.");
//       }
//     } catch (error) {
//       console.error("Failed to fetch data for Excel export:", error);
//       alert("Failed to export data. Please try again.");
//     }
//   };

//   const renderContent = () => {
//     if (displayState.showLoading) {
//       return (
//         <div className="relative min-h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
//           <div className="text-center">
//             <Spinner className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
//             <p className="text-gray-600">Loading orders...</p>
//           </div>
//         </div>
//       );
//     }

//     return (
//       <>
//         <GenericTable
//           columns={columns}
//           data={orders}
//           onSort={handleSort}
//           sortField={sortField}
//           sortDirection={sortDirection}
//           onExcelDownload={handleExcelDownload}
//         />
//         {!isLoading && orders.length === 0 && (
//           <div className="text-center py-4">No orders found.</div>
//         )}
//       </>
//     );
//   };

//   return (
//     <Container fluid>
//       <TableFilters
//         searchConfig={{
//           enabled: true,
//           placeholder: "Search orders...",
//           fields: ["DocNum", "CardName", "ItemCode", "ItemDescription","NumAtCard","CustomerPONo"],
//         }}
//         onSearch={handleSearch}
//         searchTerm={searchTerm}
//         statusFilter={{
//           enabled: true,
//           options: [
//             { value: "open", label: "Open" },
//             { value: "closed", label: "Closed" },
//             { value: "partial", label: "Partial" },
//           ],
//           value: statusFilter,
//           label: "Status",
//         }}
//         onStatusChange={handleStatusChange}
//         fromDate={fromDate}
//         toDate={toDate}
//         onDateFilterChange={handleDateFilterChange}
//         totalItems={totalItems}
//         onReset={handleReset}
//         totalItemsLabel="Total Orders"
//       />

//       {renderContent()}

//       <TablePagination
//         currentPage={currentPage}
//         totalPages={totalPages}
//         onPageChange={onPageChange}
//       />

//       <Row className="mb-2">
//         <Col className="text-center">
//           <h5>
//             Page {currentPage} of {totalPages}
//           </h5>
//         </Col>
//       </Row>
//     </Container>
//   );
// };




// export default OrdersTable;



// ✅ UPDATED OrdersTable.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import GenericTable from './GenericTable';
import TableFilters from './TableFilters';
import TablePagination from './TablePagination';
import { formatCurrency } from 'utils/formatCurrency';
import Link from 'next/link';
import { formatDate } from 'utils/formatDate';
import usePagination from 'hooks/usePagination';
import useTableFilters from 'hooks/useFilteredData';
import { truncateText } from 'utils/truncateText';
import downloadExcel from 'utils/exporttoexcel';

const OrdersTable = ({ orders, totalItems, isLoading = false, status, fetchAllOrders }) => {
  const ITEMS_PER_PAGE = 20;
  const [displayState, setDisplayState] = useState({ hasData: false, showLoading: true });

  const { currentPage, totalPages, onPageChange } = usePagination(totalItems, ITEMS_PER_PAGE);
  const {
    searchTerm,
    statusFilter,
    fromDate,
    toDate,
    sortField,
    sortDirection,
    handleSearch,
    handleStatusChange,
    handleDateFilterChange,
    handleSort,
    handleReset,
  } = useTableFilters();

  useEffect(() => {
    setDisplayState(prev => ({
      hasData: orders.length > 0,
      showLoading: isLoading && !prev.hasData,
    }));
  }, [isLoading, orders]);

  const columns = [
    {
      field: 'DocNum',
      label: 'Order#',
      render: (value, row) => (
        <Link href={`/orderdetails?d=${value}&e=${row.DocEntry}`} className="text-blue-600 hover:text-blue-800">{value}</Link>
      ),
    },
    {
      field: 'DocStatus',
      label: 'Order Status',
      render: value => (
        <span className={`badge ${value === 'Closed' ? 'bg-success' : 'bg-danger'}`}>{value}</span>
      ),
    },
    { field: 'CustomerPONo', label: 'Customer PONo', render: v => v || 'N/A' },
    { field: 'CardName', label: 'Customer', render: v => truncateText(v, 20) },
    { field: 'DocDate', label: 'Order Date', render: formatDate },
    { field: 'ProductCount', label: 'Product Count', render: v => v || 'N/A' },
    { field: 'DeliveryDate', label: 'Delivery Date', render: formatDate },
    {
      field: 'DocTotal',
      label: 'Total Amount',
      render: (value, row) => formatCurrency(row.DocCur === 'INR' ? value : value * row.ExchangeRate),
    },
    { field: 'DocCur', label: 'Currency', render: v => v || 'N/A' },
    { field: 'SalesEmployee', label: 'Sales Employee', render: v => v || 'N/A' },
  ];

  const handleExcelDownload = async () => {
    try {
      const fullData = await fetchAllOrders();
      if (!fullData || fullData.length === 0) {
        alert('No data available to export.');
        return;
      }

      const formatted = fullData.map(row => ({
        'Order#': row.DocNum,
        'Order Status': row.DocStatus,
        'Customer PONo': row.CustomerPONo || 'N/A',
        'Customer': truncateText(row.CardName || 'N/A', 20),
        'Order Date': formatDate(row.DocDate),
        'Product Count': row.ProductCount || 'N/A',
        'Delivery Date': formatDate(row.DeliveryDate),
        'Total Amount': formatCurrency(row.DocCur === 'INR' ? row.DocTotal : row.DocTotal * row.DocRate),
        'Currency': row.DocCur || 'N/A',
        'Sales Employee': row.SalesEmployee || 'N/A',
      }));

      downloadExcel(formatted, `Orders_${statusFilter}`);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to export data. Please try again.');
    }
  };

  const renderContent = () => {
    if (displayState.showLoading) {
      return (
        <div className="relative min-h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Spinner className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      );
    }

    return (
      <>
        <GenericTable
          columns={columns}
          data={orders}
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
          onExcelDownload={handleExcelDownload}
        />
        {!isLoading && orders.length === 0 && <div className="text-center py-4">No orders found.</div>}
      </>
    );
  };

  return (
    <Container fluid>
      <TableFilters
        searchConfig={{
          enabled: true,
          placeholder: 'Search orders...',
          fields: ['DocNum', 'CardName', 'ItemCode', 'ItemDescription', 'NumAtCard', 'CustomerPONo'],
        }}
        onSearch={handleSearch}
        searchTerm={searchTerm}
        statusFilter={{
          enabled: true,
          options: [
            { value: 'open', label: 'Open' },
            { value: 'closed', label: 'Closed' },
            { value: 'partial', label: 'Partial' },
          ],
          value: statusFilter,
          label: 'Status',
        }}
        onStatusChange={handleStatusChange}
        fromDate={fromDate}
        toDate={toDate}
        onDateFilterChange={handleDateFilterChange}
        totalItems={totalItems}
        onReset={handleReset}
        totalItemsLabel="Total Orders"
      />

      {renderContent()}

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <Row className="mb-2">
        <Col className="text-center">
          <h5>Page {currentPage} of {totalPages}</h5>
        </Col>
      </Row>
    </Container>
  );
};

export default OrdersTable;
