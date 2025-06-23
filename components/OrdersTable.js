
// import React, { useState, useEffect } from "react";
// import { Container, Row, Col, Spinner, Button, Alert } from "react-bootstrap";
// import { Printer } from "react-bootstrap-icons";
// import Link from "next/link"; 
// import TableFilters from "./TableFilters";
// import TablePagination from "./TablePagination";
// import GenericTable from './GenericTable';
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
//   // Local state
//   const [tableData, setTableData] = useState(orders);
//   const [showDetailsModal, setShowDetailsModal] = useState(false);
//   const [orderDetails, setOrderDetails] = useState([]);
//   const [loadingDetails, setLoadingDetails] = useState(false);
//   const [selectedOrder, setSelectedOrder] = useState(null);
//   const [error, setError] = useState(null);

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
//     setError(null);
    
//     try {
//       // Build URL with proper encoding
//       const params = new URLSearchParams();
//       if (orderNo) params.append('orderNo', orderNo);
//       if (customerPONo) params.append('customerPONo', customerPONo);
      
//       const url = `/api/modal/orderDetails?${params.toString()}`;
//       console.log('Fetching from URL:', url); // Debug log
      
//       const response = await fetch(url);
      
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || `HTTP ${response.status}`);
//       }
      
//       const data = await response.json();
      
//       if (!Array.isArray(data)) {
//         throw new Error('Invalid response format - expected array');
//       }
      
//       console.log(`Received ${data.length} records`); // Debug log
      
//       if (data.length === 0) {
//         setError('No records found for the selected criteria');
//       }
      
//       setOrderDetails(data);
//       setShowDetailsModal(true);
      
//     } catch (error) {
//       console.error("Error fetching order details:", error);
//       setError(`Failed to load order details: ${error.message}`);
//     } finally {
//       setLoadingDetails(false);
//     }
//   };

//   const handleOrderNoClick = (orderNo, e) => {
//     e.preventDefault();
//     if (!orderNo) {
//       setError('Order number is required');
//       return;
//     }
    
//     console.log('Clicking order number:', orderNo); // Debug log
//     setSelectedOrder({ type: 'orderNo', value: orderNo });
//     fetchOrderDetails(orderNo, null);
//   };

//   const handleCustomerPONoClick = (customerPONo, e) => {
//     e.preventDefault();
//     if (!customerPONo) {
//       setError('Customer PO number is required');
//       return;
//     }
    
//     console.log('Clicking customer PO:', customerPONo); // Debug log
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
//           className="p-0 text-decoration-none fw-semibold" 
//           onClick={(e) => handleOrderNoClick(value, e)}
//           disabled={!value}
//         >
//           {value || 'N/A'}
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
//         return <span className={`badge ${cls}`}>{value || 'N/A'}</span>;
//       },
//     },
//     {
//       field: "CustomerPONo",
//       label: "Customer PONo",
//       render: (v, row) => v ? (
//         <Button 
//           variant="link" 
//           className="p-0 text-decoration-none fw-semibold" 
//           onClick={(e) => handleCustomerPONoClick(v, e)}
//         >
//           {v}
//         </Button>
//       ) : "N/A",
//     },
//     {
//       field: "CardName",
//       label: "Customer",
//       render: (v) => truncateText(v || 'N/A', 20),
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
//         const amt = row.DocCur === "INR" ? value : value * (row.ExchangeRate || 1);
//         return formatCurrency(amt || 0);
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
//     {
//       field: "DocNum",
//       label: "Details", // This will show as the column header
//       render: (value, row) => (
//         <Link href={`/orderdetails?d=${value}&e=${row.DocEntry}`}>
//           View Details
//         </Link>
//       )
//     }

    
//   ];

//   return (
//     <Container fluid>
//       {/* Error Alert */}
//       {error && (
//         <Alert 
//           variant="danger" 
//           dismissible 
//           onClose={() => setError(null)}
//           className="mb-3"
//         >
//           {error}
//         </Alert>
//       )}

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
//           onClose={() => {
//             setShowDetailsModal(false);
//             setError(null); // Clear error when closing modal
//           }}
//           title={selectedOrder?.type === 'orderNo' 
//             ? `Order # ${selectedOrder.value} Details` 
//             : `Customer PO # ${selectedOrder?.value} Details`}
//         />
//       )}

//       {/* Loading Spinner for Details */}
//       {loadingDetails && (
//         <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50" style={{zIndex: 1050}}>
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
import Link from "next/link"; 
import TableFilters from "./TableFilters";
import TablePagination from "./TablePagination";
import GenericTable from './GenericTable';
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
  status,
  columns, // Now receiving columns as prop
  onExcelDownload,
}) => {
  // Local state
  const [tableData, setTableData] = useState(orders);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState(null);
  const [displayState, setDisplayState] = useState({
    hasData: false,
    showLoading: true,
  });

  // Reset when parent prop changes
  useEffect(() => {
    setTableData(orders);
  }, [orders]);

  useEffect(() => {
    setDisplayState((prev) => ({
      hasData: orders.length > 0,
      showLoading: isLoading && !prev.hasData,
    }));
  }, [isLoading, orders]);

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

  // Create columns with access to local functions
  const processedColumns = columns.map(column => {
    if (column.field === "DocNum" && column.label === "Order#") {
      return {
        ...column,
        render: (value, row) => (
          // <Button 
          //   variant="link" 
          //   className="p-0 text-decoration-none fw-semibold" 
          //   onClick={(e) => handleOrderNoClick(value, e)}
          //   disabled={!value}
          // >
          //   {value || 'N/A'}
          // </Button>
          <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleOrderNoClick(value, e);
          }}
          className="text-primary fw-semibold"
          style={{ userSelect: "text", textDecoration: "none", cursor: "pointer" }}
        >
          {value || 'N/A'}
        </a>

        ),
      };
    }
    
    if (column.field === "CustomerPONo") {
      return {
        ...column,
        render: (v, row) => v ? (
          // <Button 
          //   variant="link" 
          //   className="p-0 text-decoration-none fw-semibold" 
          //   onClick={(e) => handleCustomerPONoClick(v, e)}
          // >
          //   {v}
          // </Button>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleCustomerPONoClick(v, e);
            }}
            className="text-primary fw-semibold"
            style={{ userSelect: "text", textDecoration: "none", cursor: "pointer" }}
          >
            {v}
          </a>

        ) : "N/A",
      };
    }
    
    if (column.field === "EmailSentDT" && column.label === "Mail Sent") {
      return {
        ...column,
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
      };
    }
    
    return column;
  });

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
          columns={processedColumns}
          data={tableData}
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
          onExcelDownload={onExcelDownload}
          defaultSortField="DocNum"
          defaultSortDirection="asc"
          responsive={true}
          striped={true}
          hover={true}
        />
        {!isLoading && tableData.length === 0 && (
          <div className="text-center py-4">No orders found.</div>
        )}
      </>
    );
  };

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
        showDateRange={true}
      />

      {renderContent()}

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <Row className="mb-2">
        <Col className="text-center">
          <h5>
            Page {currentPage} of {totalPages}
          </h5>
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
            ? `Order # ${selectedOrder.value} Details` 
            : `Customer PO # ${selectedOrder?.value} Details`}
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