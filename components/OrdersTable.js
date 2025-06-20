
// import React, { useState, useEffect } from "react";
// import Link from "next/link";
// import { Container, Row, Col, Spinner } from "react-bootstrap";
// import { Printer } from "react-bootstrap-icons";
// import GenericTable from "./GenericTable";
// import TableFilters from "./TableFilters";
// import TablePagination from "./TablePagination";
// import usePagination from "hooks/usePagination";
// import useTableFilters from "hooks/useFilteredData";
// import { formatCurrency } from "utils/formatCurrency";
// import { formatDate } from "utils/formatDate";
// import { truncateText } from "utils/truncateText";
// import OrderDetailsModal from "./modal/OrderDetailsModal";

// const OrdersTable = ({
//   orders,
//   totalItems,
//   isLoading = false,
//   onExcelDownload,
// }) => {
//   // 1) Local copy so we can patch a row
//   const [tableData, setTableData] = useState(orders);

//   // 2) Reset when parent prop changes
//   useEffect(() => {
//     setTableData(orders);
//   }, [orders]);

//   // Pagination & filters
//   const ITEMS_PER_PAGE = 20;
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

  
//   const sendMail = async (row) => {
//     try {
//       const res = await fetch("/api/email/sendOrderEmail", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ docEntry: row.DocEntry, docNum: row.DocNum }),
//       });

//       const data = await res.json();

//       if (!data.success) {
//         // Show alert with the specific message from the server
//         alert(data.message || "Email sending failed.");
//         return;
//       }

//       // If successful, update table data with sent timestamp
//       setTableData((prev) =>
//         prev.map((r) =>
//           r.DocEntry === row.DocEntry
//             ? {
//                 ...r,
//                 EmailSentDT: data.EmailSentDT,
//                 EmailSentTM: data.EmailSentTM,
//               }
//             : r
//         )
//       );

//       // Optional: Show success message
//       alert("Order confirmation email sent successfully!");
//     } catch (e) {
//       console.error(e);
//       alert("Failed to send email: " + e.message);
//     }
//   };

//   const columns = [
//     {
//       field: "DocNum",
//       label: "Order#",
//       render: (value, row) => (
//         <Link href={`/orderdetails?d=${value}&e=${row.DocEntry}`}>{value}</Link>
//       ),
//     },
//     {
//       field: "DocStatus",
//       label: "Order Status",
//       render: (value) => {
//         let cls = "bg-danger";
//         if (value === "Open") cls = "bg-primary";
//         if (value === "Partial") cls = "bg-warning";
//         if (value === "Closed") cls = "bg-success";
//         if (value === "Cancelled") cls = "bg-secondary";
//         return <span className={`badge ${cls}`}>{value}</span>;
//       },
//     },
//     {
//       field: "CustomerPONo",
//       label: "Customer PONo",
//       render: (v) => v || "N/A",
//     },
//     {
//       field: "CardName",
//       label: "Customer",
//       render: (v) => truncateText(v, 20),
//     },
//     {
//       field: "DocDate",
//       label: "Order Date",
//       render: (v) => formatDate(v),
//     },
//     {
//       field: "DeliveryDate",
//       label: "Delivery Date",
//       render: (v) => formatDate(v),
//     },
//     {
//       field: "DocTotal",
//       label: "Total Amount",
//       render: (value, row) => {
//         const amt = row.DocCur === "INR" ? value : value * row.ExchangeRate;
//         return formatCurrency(amt);
//       },
//     },
//     {
//       field: "SalesEmployee",
//       label: "Sales Employee",
//       render: (v) => v || "N/A",
//     },
//     {
//       field: "ContactPerson",
//       label: "Contact Person",
//       render: (v) => v || "N/A",
//     },
//     {
//       field: "EmailSentDT",
//       label: "Mail Sent",
//       render: (_, row) => {
//         if (row.EmailSentDT) {
//           const dt = new Date(row.EmailSentDT);

//           // Safely handle EmailSentTM or fallback to datetime object
//           const hasTime =
//             row.EmailSentTM !== null && row.EmailSentTM !== undefined;
//           const h = hasTime ? Math.floor(row.EmailSentTM / 60) : dt.getHours();
//           const m = hasTime ? row.EmailSentTM % 60 : dt.getMinutes();

//           const day = String(dt.getDate()).padStart(2, "0");
//           const month = String(dt.getMonth() + 1).padStart(2, "0"); // 0-based
//           const year = dt.getFullYear();

//           return (
//             <>
//               {`${day}/${month}/${year} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`}
//             </>
//           );
//         }

//         return (
//           <button
//             className="btn btn-sm btn-primary"
//             onClick={() => sendMail(row)}
//           >
//             Send Mail
//           </button>
//         );
//       },
//     },
//   ];

//   return (
//     <Container fluid>
//       <TableFilters
//         searchConfig={{
//           enabled: true,
//           placeholder: "Search orders…",
//           fields: ["DocNum", "CardName", "NumAtCard", "CustomerPONo"],
//         }}
//         onSearch={handleSearch}
//         searchTerm={searchTerm}
//         statusFilter={{
//           enabled: true,
//           options: [
//             { value: "Open", label: "Open" },
//             { value: "Partial", label: "Partial" },
//             { value: "Closed", label: "Closed" },
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

//       {isLoading && tableData.length === 0 ? (
//         <div className="flex justify-center p-8">
//           <Spinner animation="border" />
//         </div>
//       ) : (
//         <GenericTable
//           columns={columns}
//           data={tableData}
//           onSort={handleSort}
//           sortField={sortField}
//           sortDirection={sortDirection}
//           onExcelDownload={onExcelDownload}
//         />
//       )}

//       <TablePagination
//         currentPage={currentPage}
//         totalPages={totalPages}
//         onPageChange={onPageChange}
//       />

//       <Row className="mt-2">
//         <Col className="text-center">
//           Page {currentPage} of {totalPages}
//         </Col>
//       </Row>
//     </Container>
//   );
// };

// export default OrdersTable;



// import React, { useState, useEffect } from "react";
// import { Container, Row, Col, Spinner, Button } from "react-bootstrap";
// import { Printer } from "react-bootstrap-icons";
// import GenericTable from "./GenericTable";
// import TableFilters from "./TableFilters";
// import TablePagination from "./TablePagination";
// import usePagination from "hooks/usePagination";
// import useTableFilters from "hooks/useFilteredData";
// import { formatCurrency } from "utils/formatCurrency";
// import { formatDate } from "utils/formatDate";
// import { truncateText } from "utils/truncateText";
//  import OrderDetailsModal from "./modal/OrderDetailsModal";

// const OrdersTable = ({
//   orders,
//   totalItems,
//   isLoading = false,
//   onExcelDownload,
// }) => {
//   // Local state
//   const [tableData, setTableData] = useState(orders);
//   const [showDetailsModal, setShowDetailsModal] = useState(false);
//   const [orderDetails, setOrderDetails] = useState([]);
//   const [loadingDetails, setLoadingDetails] = useState(false);
//   const [selectedOrder, setSelectedOrder] = useState(null);

//   // Reset when parent prop changes
//   useEffect(() => {
//     setTableData(orders);
//   }, [orders]);

//   // Pagination & filters
//   const ITEMS_PER_PAGE = 20;
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

//   const fetchOrderDetails = async (orderNo, customerPONo) => {
//     setLoadingDetails(true);
//     try {
//       let url = '/api/modal/orderDetails?';
//       if (orderNo) url += `orderNo=${orderNo}`;
//       if (customerPONo) url += `customerPONo=${customerPONo}`;
      
//       const response = await fetch(url);
//       const data = await response.json();
//       setOrderDetails(data);
//       setShowDetailsModal(true);
//     } catch (error) {
//       console.error("Error fetching order details:", error);
//       alert("Failed to load order details");
//     } finally {
//       setLoadingDetails(false);
//     }
//   };

//   const handleOrderNoClick = (orderNo, e) => {
//     e.preventDefault();
//     setSelectedOrder({ type: 'orderNo', value: orderNo });
//     fetchOrderDetails(orderNo, null);
//   };

//   const handleCustomerPONoClick = (customerPONo, e) => {
//     e.preventDefault();
//     if (!customerPONo) return;
//     setSelectedOrder({ type: 'customerPONo', value: customerPONo });
//     fetchOrderDetails(null, customerPONo);
//   };

//   const sendMail = async (row) => {
//     try {
//       const res = await fetch("/api/email/sendOrderEmail", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ docEntry: row.DocEntry, docNum: row.DocNum }),
//       });

//       const data = await res.json();

//       if (!data.success) {
//         alert(data.message || "Email sending failed.");
//         return;
//       }

//       setTableData((prev) =>
//         prev.map((r) =>
//           r.DocEntry === row.DocEntry
//             ? {
//                 ...r,
//                 EmailSentDT: data.EmailSentDT,
//                 EmailSentTM: data.EmailSentTM,
//               }
//             : r
//         )
//       );

//       alert("Order confirmation email sent successfully!");
//     } catch (e) {
//       console.error(e);
//       alert("Failed to send email: " + e.message);
//     }
//   };

//   const columns = [
//     {
//       field: "DocNum",
//       label: "Order#",
//       render: (value, row) => (
//         <Button 
//           variant="link" 
//           className="p-0 text-decoration-none" 
//           onClick={(e) => handleOrderNoClick(value, e)}
//         >
//           {value}
//         </Button>
//       ),
//     },
//     {
//       field: "DocStatus",
//       label: "Order Status",
//       render: (value) => {
//         let cls = "bg-danger";
//         if (value === "Open") cls = "bg-primary";
//         if (value === "Partial") cls = "bg-warning";
//         if (value === "Closed") cls = "bg-success";
//         if (value === "Cancelled") cls = "bg-secondary";
//         return <span className={`badge ${cls}`}>{value}</span>;
//       },
//     },
//     {
//       field: "CustomerPONo",
//       label: "Customer PONo",
//       render: (v, row) => v ? (
//         <Button 
//           variant="link" 
//           className="p-0 text-decoration-none" 
//           onClick={(e) => handleCustomerPONoClick(v, e)}
//         >
//           {v}
//         </Button>
//       ) : "N/A",
//     },
//     {
//       field: "CardName",
//       label: "Customer",
//       render: (v) => truncateText(v, 20),
//     },
//     {
//       field: "DocDate",
//       label: "Order Date",
//       render: (v) => formatDate(v),
//     },
//     {
//       field: "DeliveryDate",
//       label: "Delivery Date",
//       render: (v) => formatDate(v),
//     },
//     {
//       field: "DocTotal",
//       label: "Total Amount",
//       render: (value, row) => {
//         const amt = row.DocCur === "INR" ? value : value * row.ExchangeRate;
//         return formatCurrency(amt);
//       },
//     },
//     {
//       field: "SalesEmployee",
//       label: "Sales Employee",
//       render: (v) => v || "N/A",
//     },
//     {
//       field: "ContactPerson",
//       label: "Contact Person",
//       render: (v) => v || "N/A",
//     },
//     {
//       field: "EmailSentDT",
//       label: "Mail Sent",
//       render: (_, row) => {
//         if (row.EmailSentDT) {
//           const dt = new Date(row.EmailSentDT);
//           const hasTime = row.EmailSentTM !== null && row.EmailSentTM !== undefined;
//           const h = hasTime ? Math.floor(row.EmailSentTM / 60) : dt.getHours();
//           const m = hasTime ? row.EmailSentTM % 60 : dt.getMinutes();
//           const day = String(dt.getDate()).padStart(2, "0");
//           const month = String(dt.getMonth() + 1).padStart(2, "0");
//           const year = dt.getFullYear();

//           return (
//             <>
//               {`${day}/${month}/${year} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`}
//             </>
//           );
//         }

//         return (
//           <button
//             className="btn btn-sm btn-primary"
//             onClick={() => sendMail(row)}
//           >
//             Send Mail
//           </button>
//         );
//       },
//     },
//   ];

//   return (
//     <Container fluid>
//       <TableFilters
//         searchConfig={{
//           enabled: true,
//           placeholder: "Search orders…",
//           fields: ["DocNum", "CardName", "NumAtCard", "CustomerPONo"],
//         }}
//         onSearch={handleSearch}
//         searchTerm={searchTerm}
//         statusFilter={{
//           enabled: true,
//           options: [
//             { value: "Open", label: "Open" },
//             { value: "Partial", label: "Partial" },
//             { value: "Closed", label: "Closed" },
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

//       {isLoading && tableData.length === 0 ? (
//         <div className="flex justify-center p-8">
//           <Spinner animation="border" />
//         </div>
//       ) : (
//         <GenericTable
//           columns={columns}
//           data={tableData}
//           onSort={handleSort}
//           sortField={sortField}
//           sortDirection={sortDirection}
//           onExcelDownload={onExcelDownload}
//         />
//       )}

//       <TablePagination
//         currentPage={currentPage}
//         totalPages={totalPages}
//         onPageChange={onPageChange}
//       />

//       <Row className="mt-2">
//         <Col className="text-center">
//           Page {currentPage} of {totalPages}
//         </Col>
//       </Row>

//       {/* Order Details Modal */}
//       {showDetailsModal && (
//         <OrderDetailsModal
//           orderData={orderDetails}
//           onClose={() => setShowDetailsModal(false)}
//           title={selectedOrder?.type === 'orderNo' 
//             ? `Order #${selectedOrder.value} Details` 
//             : `Customer PO #${selectedOrder?.value} Details`}
//         />
//       )}

//       {/* Loading Spinner for Details */}
//       {loadingDetails && (
//         <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50 z-index-1050">
//           <div className="bg-white p-4 rounded shadow">
//             <Spinner animation="border" variant="primary" />
//             <span className="ms-2">Loading order details...</span>
//           </div>
//         </div>
//       )}
//     </Container>
//   );
// };

// export default OrdersTable;

import React, { useState, useEffect } from "react";
import { Container, Row, Col, Spinner, Button, Alert } from "react-bootstrap";
import { Printer } from "react-bootstrap-icons";
import GenericTable from "./GenericTable";
import TableFilters from "./TableFilters";
import TablePagination from "./TablePagination";
import usePagination from "hooks/usePagination";
import useTableFilters from "hooks/useFilteredData";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import { truncateText } from "utils/truncateText";
import OrderDetailsModal from "./modal/OrderDetailsModal";

const OrdersTable = ({
  orders,
  totalItems,
  isLoading = false,
  onExcelDownload,
}) => {
  // Local state
  const [tableData, setTableData] = useState(orders);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState(null);

  // Reset when parent prop changes
  useEffect(() => {
    setTableData(orders);
  }, [orders]);

  // Pagination & filters
  const ITEMS_PER_PAGE = 20;
  const { currentPage, totalPages, onPageChange } = usePagination(
    totalItems,
    ITEMS_PER_PAGE
  );
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

  const fetchOrderDetails = async (orderNo, customerPONo) => {
    setLoadingDetails(true);
    setError(null);
    
    try {
      // Build URL with proper encoding
      const params = new URLSearchParams();
      if (orderNo) params.append('orderNo', orderNo);
      if (customerPONo) params.append('customerPONo', customerPONo);
      
      const url = `/api/modal/orderDetails?${params.toString()}`;
      console.log('Fetching from URL:', url); // Debug log
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format - expected array');
      }
      
      console.log(`Received ${data.length} records`); // Debug log
      
      if (data.length === 0) {
        setError('No records found for the selected criteria');
      }
      
      setOrderDetails(data);
      setShowDetailsModal(true);
      
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError(`Failed to load order details: ${error.message}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOrderNoClick = (orderNo, e) => {
    e.preventDefault();
    if (!orderNo) {
      setError('Order number is required');
      return;
    }
    
    console.log('Clicking order number:', orderNo); // Debug log
    setSelectedOrder({ type: 'orderNo', value: orderNo });
    fetchOrderDetails(orderNo, null);
  };

  const handleCustomerPONoClick = (customerPONo, e) => {
    e.preventDefault();
    if (!customerPONo) {
      setError('Customer PO number is required');
      return;
    }
    
    console.log('Clicking customer PO:', customerPONo); // Debug log
    setSelectedOrder({ type: 'customerPONo', value: customerPONo });
    fetchOrderDetails(null, customerPONo);
  };

  const sendMail = async (row) => {
    try {
      const res = await fetch("/api/email/sendOrderEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docEntry: row.DocEntry, docNum: row.DocNum }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Email sending failed.");
        return;
      }

      setTableData((prev) =>
        prev.map((r) =>
          r.DocEntry === row.DocEntry
            ? {
                ...r,
                EmailSentDT: data.EmailSentDT,
                EmailSentTM: data.EmailSentTM,
              }
            : r
        )
      );

      alert("Order confirmation email sent successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to send email: " + e.message);
    }
  };

  const columns = [
    {
      field: "DocNum",
      label: "Order#",
      render: (value, row) => (
        <Button 
          variant="link" 
          className="p-0 text-decoration-none fw-semibold" 
          onClick={(e) => handleOrderNoClick(value, e)}
          disabled={!value}
        >
          {value || 'N/A'}
        </Button>
      ),
    },
    {
      field: "DocStatus",
      label: "Order Status",
      render: (value) => {
        let cls = "bg-danger";
        if (value === "Open") cls = "bg-primary";
        if (value === "Partial") cls = "bg-warning";
        if (value === "Closed") cls = "bg-success";
        if (value === "Cancelled") cls = "bg-secondary";
        return <span className={`badge ${cls}`}>{value || 'N/A'}</span>;
      },
    },
    {
      field: "CustomerPONo",
      label: "Customer PONo",
      render: (v, row) => v ? (
        <Button 
          variant="link" 
          className="p-0 text-decoration-none fw-semibold" 
          onClick={(e) => handleCustomerPONoClick(v, e)}
        >
          {v}
        </Button>
      ) : "N/A",
    },
    {
      field: "CardName",
      label: "Customer",
      render: (v) => truncateText(v || 'N/A', 20),
    },
    {
      field: "DocDate",
      label: "Order Date",
      render: (v) => formatDate(v),
    },
    {
      field: "DeliveryDate",
      label: "Delivery Date",
      render: (v) => formatDate(v),
    },
    {
      field: "DocTotal",
      label: "Total Amount",
      render: (value, row) => {
        const amt = row.DocCur === "INR" ? value : value * (row.ExchangeRate || 1);
        return formatCurrency(amt || 0);
      },
    },
    {
      field: "SalesEmployee",
      label: "Sales Employee",
      render: (v) => v || "N/A",
    },
    {
      field: "ContactPerson",
      label: "Contact Person",
      render: (v) => v || "N/A",
    },
    {
      field: "EmailSentDT",
      label: "Mail Sent",
      render: (_, row) => {
        if (row.EmailSentDT) {
          const dt = new Date(row.EmailSentDT);
          const hasTime = row.EmailSentTM !== null && row.EmailSentTM !== undefined;
          const h = hasTime ? Math.floor(row.EmailSentTM / 60) : dt.getHours();
          const m = hasTime ? row.EmailSentTM % 60 : dt.getMinutes();
          const day = String(dt.getDate()).padStart(2, "0");
          const month = String(dt.getMonth() + 1).padStart(2, "0");
          const year = dt.getFullYear();

          return (
            <>
              {`${day}/${month}/${year} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`}
            </>
          );
        }

        return (
          <button
            className="btn btn-sm btn-primary"
            onClick={() => sendMail(row)}
          >
            Send Mail
          </button>
        );
      },
    },
  ];

  return (
    <Container fluid>
      {/* Error Alert */}
      {error && (
        <Alert 
          variant="danger" 
          dismissible 
          onClose={() => setError(null)}
          className="mb-3"
        >
          {error}
        </Alert>
      )}

      <TableFilters
        searchConfig={{
          enabled: true,
          placeholder: "Search orders…",
          fields: ["DocNum", "CardName", "NumAtCard", "CustomerPONo"],
        }}
        onSearch={handleSearch}
        searchTerm={searchTerm}
        statusFilter={{
          enabled: true,
          options: [
            { value: "Open", label: "Open" },
            { value: "Partial", label: "Partial" },
            { value: "Closed", label: "Closed" },
          ],
          value: statusFilter,
          label: "Status",
        }}
        onStatusChange={handleStatusChange}
        fromDate={fromDate}
        toDate={toDate}
        onDateFilterChange={handleDateFilterChange}
        totalItems={totalItems}
        onReset={handleReset}
        totalItemsLabel="Total Orders"
      />

      {isLoading && tableData.length === 0 ? (
        <div className="flex justify-center p-8">
          <Spinner animation="border" />
        </div>
      ) : (
        <GenericTable
          columns={columns}
          data={tableData}
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
          onExcelDownload={onExcelDownload}
        />
      )}

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <Row className="mt-2">
        <Col className="text-center">
          Page {currentPage} of {totalPages}
        </Col>
      </Row>

      {/* Order Details Modal */}
      {showDetailsModal && (
        <OrderDetailsModal
          orderData={orderDetails}
          onClose={() => {
            setShowDetailsModal(false);
            setError(null); // Clear error when closing modal
          }}
          title={selectedOrder?.type === 'orderNo' 
            ? `Order #${selectedOrder.value} Details` 
            : `Customer PO #${selectedOrder?.value} Details`}
        />
      )}

      {/* Loading Spinner for Details */}
      {loadingDetails && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50" style={{zIndex: 1050}}>
          <div className="bg-white p-4 rounded shadow">
            <Spinner animation="border" variant="primary" />
            <span className="ms-2">Loading order details...</span>
          </div>
        </div>
      )}
    </Container>
  );
};

export default OrdersTable;