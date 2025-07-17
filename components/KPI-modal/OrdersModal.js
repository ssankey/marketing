// // components/KPI-modal/OrdersModal.js
// import React, { useState, useMemo } from "react";
// import {
//   useReactTable,
//   getCoreRowModel,
//   getSortedRowModel,
//   getFilteredRowModel,
//   getPaginationRowModel,
//   flexRender,
// } from "@tanstack/react-table";
// import Modal from "react-bootstrap/Modal";
// import Button from "react-bootstrap/Button";
// import Form from "react-bootstrap/Form";
// import Badge from "react-bootstrap/Badge";
// import { formatCurrency } from "utils/formatCurrency";
// import { formatDate } from "utils/formatDate";
// import downloadExcel from "utils/exporttoexcel";

// const OrdersModal = ({ ordersData, onClose, dateFilter, startDate, endDate }) => {
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [pagination, setPagination] = useState({
//     pageIndex: 0,
//     pageSize: 12,
//   });

//   const columns = useMemo(
//     () => [
//       {
//         accessorKey: "DocNum",
//         header: "Order#",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorKey: "DocStatus",
//         header: "Order Status",
//         cell: ({ getValue }) => {
//           const status = getValue();
//           let variant = "secondary";
          
//           switch (status) {
//             case "Open":
//               variant = "danger";
//               break;
//             case "Closed":
//               variant = "success";
//               break;
//             case "Cancelled":
//               variant = "danger";
//               break;
//             case "Partial":
//               variant = "warning";
//               break;
//             default:
//               variant = "secondary";
//           }
          
//           return (
//             <Badge bg={variant} className="fw-normal">
//               {status || "-"}
//             </Badge>
//           );
//         },
//       },
//       {
//         accessorKey: "CustomerPONo",
//         header: "Customer PO No",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorKey: "CardName",
//         header: "Customer",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorKey: "DocDate",
//         header: "Order Date",
//         cell: ({ getValue }) => formatDate(getValue()) || "-",
//       },
//       {
//         accessorKey: "DeliveryDate",
//         header: "Delivery Date",
//         cell: ({ getValue }) => formatDate(getValue()) || "-",
//       },
//       {
//         accessorKey: "DocTotal",
//         header: "Total Amount",
//         cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
//       },
//       {
//         accessorKey: "SalesEmployee",
//         header: "Sales Employee",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorKey: "ContactPerson",
//         header: "Contact Person",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//     ],
//     []
//   );

//   const table = useReactTable({
//     data: ordersData || [],
//     columns,
//     state: {
//       globalFilter,
//       pagination,
//     },
//     onGlobalFilterChange: setGlobalFilter,
//     onPaginationChange: setPagination,
//     getCoreRowModel: getCoreRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),
//     getPaginationRowModel: getPaginationRowModel(),
//     globalFilterFn: (row, columnId, filterValue) => {
//       const searchValue = filterValue.toLowerCase();
//       return Object.values(row.original).some(value =>
//         String(value).toLowerCase().includes(searchValue))
//     },
//   });

//   const handleExportExcel = () => {
//     const exportData = (ordersData || []).map((row) => {
//       const formattedRow = {};
//       columns.forEach((column) => {
//         const header = column.header;
//         const value = row[column.accessorKey];

//         if (header.includes("Date")) {
//           formattedRow[header] = value ? formatDate(value) : "-";
//         } else if (header === "Total Amount") {
//           formattedRow[header] = value !== null ? formatCurrency(value).slice(1) : "-";
//         } else {
//           formattedRow[header] = value || "-";
//         }
//       });
//       return formattedRow;
//     });

//     const dateRange = getDateRangeText();
//     downloadExcel(exportData, `Sales_Orders_${dateRange}`);
//   };

//   const getDateRangeText = () => {
//     const today = new Date();
//     switch (dateFilter) {
//       case "today": return "Today";
//       case "thisWeek": return "This_Week";
//       case "thisMonth": return "This_Month";
//       case "custom": return `${startDate}_to_${endDate}`;
//       default: return "Data";
//     }
//   };

//   const getModalTitle = () => {
//     const dateRange = getDateRangeText().replace(/_/g, " ");
//     return `Sales Orders - ${dateRange}`;
//   };

//   return (
//     <Modal show={true} onHide={onClose} size="xl" centered dialogClassName="modal-95w">
//       <Modal.Header className="py-3 px-4 bg-dark">
//         <div className="d-flex align-items-center justify-content-between w-100">
//           <Modal.Title className="fs-4 m-0 text-white">
//             {getModalTitle()}
//           </Modal.Title>
//           <div className="d-flex align-items-center gap-3">
//             <Form.Control
//               type="text"
//               placeholder="Search orders..."
//               value={globalFilter ?? ""}
//               onChange={(e) => setGlobalFilter(e.target.value)}
//               style={{ width: "300px" }}
//               size="lg"
//               className="border-0"
//             />
//             <Button 
//               variant="success" 
//               size="lg" 
//               onClick={handleExportExcel}
//               className="px-4"
//             >
//               Export to Excel
//             </Button>
//             <Button 
//               variant="light" 
//               size="lg" 
//               onClick={onClose}
//               className="px-3"
//             >
//               ✕
//             </Button>
//           </div>
//         </div>
//       </Modal.Header>
//       <Modal.Body style={{ margin: "0" }}>
//         <div className="border rounded overflow-auto" style={{ height: "65vh" }}>
//           <table className="table table-striped table-hover mb-0">
//             <thead className="table-dark sticky-top">
//               {table.getHeaderGroups().map((headerGroup) => (
//                 <tr key={headerGroup.id}>
//                   {headerGroup.headers.map((header) => (
//                     <th
//                       key={header.id}
//                       className="px-4 py-3 text-nowrap"
//                       style={{
//                         cursor: header.column.getCanSort() ? "pointer" : "default",
//                         userSelect: "none",
//                         backgroundColor: '#343a40',
//                         color: 'white',
//                         fontSize: '0.95rem'
//                       }}
//                       onClick={header.column.getToggleSortingHandler()}
//                     >
//                       {flexRender(header.column.columnDef.header, header.getContext())}
//                       {{
//                         asc: " 🔼",
//                         desc: " 🔽",
//                       }[header.column.getIsSorted()] ?? null}
//                     </th>
//                   ))}
//                 </tr>
//               ))}
//             </thead>
//             <tbody>
//               {table.getRowModel().rows.length > 0 ? (
//                 table.getRowModel().rows.map((row) => (
//                   <tr key={row.id}>
//                     {row.getVisibleCells().map((cell) => (
//                       <td key={cell.id} className="px-4 py-2 text-nowrap">
//                         {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                       </td>
//                     ))}
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan={columns.length} className="p-4 text-center">
//                     No orders data available for the selected period
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination Controls */}
//         <div className="d-flex justify-content-between align-items-center mt-3 px-3">
//           <div className="d-flex align-items-center gap-2">
//             <span className="text-muted">
//               Showing {table.getRowModel().rows.length} of{' '}
//               {table.getFilteredRowModel().rows.length} rows
//             </span>
//           </div>
          
//           <div className="d-flex align-items-center gap-3">
//              <Button
//             variant="outline-secondary"
//             size="sm"
//             onClick={() => table.setPageIndex(0)}
//             disabled={!table.getCanPreviousPage()}
//             title="First Page"
//           >
//             ≪
//           </Button>

//             <Button
//               variant="outline-secondary"
//               size="sm"
//               onClick={() => table.previousPage()}
//               disabled={!table.getCanPreviousPage()}
//             >
//               Previous
//             </Button>
            
//             <span className="mx-2">
//               Page{' '}
//               <strong>
//                 {table.getState().pagination.pageIndex + 1} of{' '}
//                 {table.getPageCount()}
//               </strong>
//             </span>
            
//             <Button
//               variant="outline-secondary"
//               size="sm"
//               onClick={() => table.nextPage()}
//               disabled={!table.getCanNextPage()}
//             >
//               Next
//             </Button>
//             <Button
//             variant="outline-secondary"
//             size="sm"
//             onClick={() => table.setPageIndex(table.getPageCount() - 1)}
//             disabled={!table.getCanNextPage()}
//             title="Last Page"
//           >
//             ≫
//           </Button>
//           </div>

//           <div className="d-flex align-items-center gap-2">
//             <span className="text-muted">Rows per page:</span>
//             <Form.Select
//               value={table.getState().pagination.pageSize}
//               onChange={e => {
//                 table.setPageSize(Number(e.target.value));
//               }}
//               size="sm"
//               style={{ width: '80px' }}
//             >
//               {[12, 25, 50, 100].map(pageSize => (
//                 <option key={pageSize} value={pageSize}>
//                   {pageSize}
//                 </option>
//               ))}
//             </Form.Select>
//           </div>
//         </div>
//       </Modal.Body>
//     </Modal>
//   );
// };

// export default OrdersModal;


// components/KPI-modal/OrdersModal.js
import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";
import OrderDetailsModal from "components/modal/OrderDetailsModal";

const OrdersModal = ({ ordersData, onClose, dateFilter, startDate, endDate }) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 12,
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState(null);

  const fetchOrderDetails = async (orderNo) => {
    setLoadingDetails(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found in localStorage");
      }

      const response = await fetch(`/api/modal/orderDetails?orderNo=${orderNo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format - expected array');
      }
      
      if (data.length === 0) {
        setError('No records found for this order');
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

  const handleOrderClick = (orderNo) => {
    if (!orderNo) {
      setError('Order number is required');
      return;
    }
    
    setSelectedOrder(orderNo);
    fetchOrderDetails(orderNo);
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "DocNum",
        header: "Order#",
        cell: ({ getValue }) => (
          <span 
            className="text-primary"
            style={{ 
              cursor: 'pointer',
              '&:hover': {
                textDecoration: 'none'
              }
            }}
            onClick={() => handleOrderClick(getValue())}
          >
            {getValue() || "-"}
          </span>
        ),
      },
      {
        accessorKey: "DocStatus",
        header: "Order Status",
        cell: ({ getValue }) => {
          const status = getValue();
          let variant = "secondary";
          
          switch (status) {
            case "Open":
              variant = "danger";
              break;
            case "Closed":
              variant = "success";
              break;
            case "Cancelled":
              variant = "danger";
              break;
            case "Partial":
              variant = "warning";
              break;
            default:
              variant = "secondary";
          }
          
          return (
            <Badge bg={variant} className="fw-normal">
              {status || "-"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "CustomerPONo",
        header: "Customer PO No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "CardName",
        header: "Customer",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "DocDate",
        header: "Order Date",
        cell: ({ getValue }) => formatDate(getValue()) || "-",
      },
      {
        accessorKey: "DeliveryDate",
        header: "Delivery Date",
        cell: ({ getValue }) => formatDate(getValue()) || "-",
      },
      {
        accessorKey: "DocTotal",
        header: "Total Amount",
        cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
      },
      {
        accessorKey: "SalesEmployee",
        header: "Sales Employee",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "ContactPerson",
        header: "Contact Person",
        cell: ({ getValue }) => getValue() || "-",
      },
    ],
    []
  );

  const table = useReactTable({
    data: ordersData || [],
    columns,
    state: {
      globalFilter,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase();
      return Object.values(row.original).some(value =>
        String(value).toLowerCase().includes(searchValue))
    },
  });

  const handleExportExcel = () => {
    const exportData = (ordersData || []).map((row) => {
      const formattedRow = {};
      columns.forEach((column) => {
        const header = column.header;
        const value = row[column.accessorKey];

        if (header.includes("Date")) {
          formattedRow[header] = value ? formatDate(value) : "-";
        } else if (header === "Total Amount") {
          formattedRow[header] = value !== null ? formatCurrency(value).slice(1) : "-";
        } else {
          formattedRow[header] = value || "-";
        }
      });
      return formattedRow;
    });

    const dateRange = getDateRangeText();
    downloadExcel(exportData, `Sales_Orders_${dateRange}`);
  };

  const getDateRangeText = () => {
    const today = new Date();
    switch (dateFilter) {
      case "today": return "Today";
      case "thisWeek": return "This_Week";
      case "thisMonth": return "This_Month";
      case "custom": return `${startDate}_to_${endDate}`;
      default: return "Data";
    }
  };

  const getModalTitle = () => {
    const dateRange = getDateRangeText().replace(/_/g, " ");
    return `Sales Orders - ${dateRange}`;
  };

  return (
    <Modal show={true} onHide={onClose} size="xl" centered dialogClassName="modal-95w">
      <Modal.Header className="py-3 px-4 bg-dark">
        <div className="d-flex align-items-center justify-content-between w-100">
          <Modal.Title className="fs-4 m-0 text-white">
            {getModalTitle()}
          </Modal.Title>
          <div className="d-flex align-items-center gap-3">
            <Form.Control
              type="text"
              placeholder="Search orders..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              style={{ width: "300px" }}
              size="lg"
              className="border-0"
            />
            <Button 
              variant="success" 
              size="lg" 
              onClick={handleExportExcel}
              className="px-4"
            >
              Export to Excel
            </Button>
            <Button 
              variant="light" 
              size="lg" 
              onClick={onClose}
              className="px-3"
            >
              ✕
            </Button>
          </div>
        </div>
      </Modal.Header>
      <Modal.Body style={{ margin: "0" }}>
        <div className="border rounded overflow-auto" style={{ height: "65vh" }}>
          <table className="table table-striped table-hover mb-0">
            <thead className="table-dark sticky-top">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-nowrap"
                      style={{
                        cursor: header.column.getCanSort() ? "pointer" : "default",
                        userSelect: "none",
                        backgroundColor: '#343a40',
                        color: 'white',
                        fontSize: '0.95rem'
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted()] ?? null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2 text-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="p-4 text-center">
                    No orders data available for the selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="d-flex justify-content-between align-items-center mt-3 px-3">
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">
              Showing {table.getRowModel().rows.length} of{' '}
              {table.getFilteredRowModel().rows.length} rows
            </span>
          </div>
          
          <div className="d-flex align-items-center gap-3">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              title="First Page"
            >
              ≪
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            
            <span className="mx-2">
              Page{' '}
              <strong>
                {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
              </strong>
            </span>
            
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              title="Last Page"
            >
              ≫
            </Button>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">Rows per page:</span>
            <Form.Select
              value={table.getState().pagination.pageSize}
              onChange={e => {
                table.setPageSize(Number(e.target.value));
              }}
              size="sm"
              style={{ width: '80px' }}
            >
              {[12, 25, 50, 100].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </Form.Select>
          </div>
        </div>
      </Modal.Body>

      {/* Order Details Modal */}
      {showDetailsModal && (
        <OrderDetailsModal
          orderData={orderDetails}
          onClose={() => {
            setShowDetailsModal(false);
            setError(null);
          }}
          title={`Order #${selectedOrder} Details`}
        />
      )}

      {loadingDetails && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50" style={{zIndex: 1050}}>
          <div className="bg-white p-4 rounded shadow">
            <Spinner animation="border" variant="primary" />
            <span className="ms-2">Loading order details...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="position-fixed top-20 end-20 z-50">
          <Alert 
            variant="danger" 
            dismissible 
            onClose={() => setError(null)}
            className="mb-3"
          >
            {error}
          </Alert>
        </div>
      )}
    </Modal>
  );
};

export default OrdersModal;