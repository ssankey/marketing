// // components/OrderDetailsModal.js
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
// import { formatCurrency } from "utils/formatCurrency";
// import { formatDate } from "utils/formatDate";
// import downloadExcel from "utils/exporttoexcel";

// const OrderDetailsModal = ({ orderData, onClose, title = "Order Details" }) => {
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [pagination, setPagination] = useState({
//     pageIndex: 0,
//     pageSize: 12,
//   });

//   // Initial sorting state - sort by SO_Date in descending order (latest first)
//   const [sorting, setSorting] = useState([
//     {
//       id: "SO_Date",
//       desc: true, // true for descending (latest first)
//     },
//   ]);

//   const columns = useMemo(
//     () => [
//       {
//         accessorKey: "SO_No",
//         header: "SO No",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorKey: "SO_Date",
//         header: "SO Date",
//         cell: ({ getValue }) => formatDate(getValue()) || "-",
//         sortingFn: (rowA, rowB) => {
//           const dateA = new Date(rowA.getValue("SO_Date"));
//           const dateB = new Date(rowB.getValue("SO_Date"));
//           return dateA.getTime() - dateB.getTime();
//         },
//       },
//       {
//         accessorKey: "Customer_Ref_No",
//         header: "Customer Ref. No",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorKey: "Customer",
//         header: "Customer",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorKey: "Sales_Person",
//         header: "Sales Person",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorKey: "Contact_Person",
//         header: "Contact Person",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorKey: "Item_No",
//         header: "Item No.",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorKey: "Item_Service_Description",
//         header: "Description",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorKey: "Cas_No",
//         header: "Cas No",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorKey: "Vendor_Catalog_No",
//         header: "Vendor Cat. No.",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorKey: "PKZ",
//         header: "PKZ",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorKey: "Quantity",
//         header: "Qty",
//         cell: ({ getValue }) => getValue() !== null ? getValue() : "-",
//       },
//       {
//         accessorKey: "Status_Line",
//         header: "Status",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorKey: "Invoice_No",
//         header: "Invoice No",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorKey: "Batch_No",
//         header: "Batch No",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorKey: "Unit_Price",
//         header: "Unit Price",
//         cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
//         sortingFn: (rowA, rowB) => {
//           const priceA = parseFloat(rowA.original["Unit_Price"]) || 0;
//           const priceB = parseFloat(rowB.original["Unit_Price"]) || 0;
//           return priceA - priceB;
//         },
//       },
//       {
//         accessorKey: "Total_Price",
//         header: "Total Value",
//         cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
//         sortingFn: (rowA, rowB) => {
//           const totalA = parseFloat(rowA.original["Total_Price"]) || 0;
//           const totalB = parseFloat(rowB.original["Total_Price"]) || 0;
//           return totalA - totalB;
//         },
//       },
//       {
//         accessorKey: "MKT_Feedback",
//         header: "Mkt Feedback",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorKey: "Category",
//         header: "Category",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//     ],
//     []
//   );

//   const table = useReactTable({
//     data: orderData || [],
//     columns,
//     state: {
//       globalFilter,
//       pagination,
//       sorting,
//     },
//     onGlobalFilterChange: setGlobalFilter,
//     onPaginationChange: setPagination,
//     onSortingChange: setSorting,
//     getCoreRowModel: getCoreRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),
//     getPaginationRowModel: getPaginationRowModel(),
//     globalFilterFn: (row, columnId, filterValue) => {
//       const searchValue = filterValue.toLowerCase();
//       return Object.values(row.original).some(value =>
//         String(value).toLowerCase().includes(searchValue)
//       );
//     },
//     // Enable sorting for all columns
//     enableSorting: true,
//     // Default sort state - sort by SO_Date descending (newest first)
//     initialState: {
//       sorting: [
//         { id: 'SO_Date', desc: true }
//       ]
//     }
//   });

//   const handleExportExcel = () => {
//     const exportData = (orderData || []).map((row) => {
//       const formattedRow = {};
//       columns.forEach((column) => {
//         const header = column.header;
//         const value = row[column.accessorKey];

//         if (header.includes("Date")) {
//           formattedRow[header] = value ? formatDate(value) : "-";
//         } else if (header === "Unit Price" || header === "Total Value") {
//           formattedRow[header] = value !== null ? formatCurrency(value).slice(1) : "-";
//         } else {
//           formattedRow[header] = value || "-";
//         }
//       });
//       return formattedRow;
//     });

//     downloadExcel(exportData, "Order_Details");
//   };

//   return (
//     <Modal show={true} onHide={onClose} size="xl" centered dialogClassName="modal-95w">
//       <Modal.Header className="py-3 px-4 bg-dark">
//         <div className="d-flex align-items-center justify-content-between w-100">
//           <Modal.Title className="fs-4 m-0 text-white">
//             {title}
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
//                       <div className="d-flex align-items-center">
//                         {flexRender(header.column.columnDef.header, header.getContext())}
//                         {{
//                           asc: <span className="ms-2">↑</span>,
//                           desc: <span className="ms-2">↓</span>,
//                         }[header.column.getIsSorted()] ?? null}
//                       </div>
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
//                     No order data available
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
//             <Button
//               variant="outline-secondary"
//               size="sm"
//               onClick={() => table.setPageIndex(0)}
//               disabled={!table.getCanPreviousPage()}
//               title="First Page"
//             >
//               ≪
//             </Button>
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
//               variant="outline-secondary"
//               size="sm"
//               onClick={() => table.setPageIndex(table.getPageCount() - 1)}
//               disabled={!table.getCanNextPage()}
//               title="Last Page"
//             >
//               ≫
//             </Button>
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

// export default OrderDetailsModal;


// components/OrderDetailsModal.js
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
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";

const OrderDetailsModal = ({ orderData, onClose, title = "Order Details" }) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 12,
  });

  // Initial sorting state - sort by SO_Date in descending order (latest first)
  const [sorting, setSorting] = useState([
    {
      id: "SO_Date",
      desc: true, // true for descending (latest first)
    },
  ]);

  const columns = useMemo(
    () => [
     
      {
        accessorKey: "Sales_Person",
        header: "Sales Person",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Customer",
        header: "Customer",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "CardCode",
        header: "Card Code",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "CustomerRefNo",
        header: "Customer Ref No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Contact_Person",
        header: "Contact Person",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Status_Header",
        header: "Status Header",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "SO_No",
        header: "SO No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "SO_Date",
        header: "SO Date",
        cell: ({ getValue }) => formatDate(getValue()) || "-",
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.getValue("SO_Date"));
          const dateB = new Date(rowB.getValue("SO_Date"));
          return dateA.getTime() - dateB.getTime();
        },
      },
      {
        accessorKey: "Status_Line",
        header: "Status Line",
        cell: ({ getValue }) => getValue() || "-",
      },
      
      {
        accessorKey: "Invoice_Date",
        header: "Invoice Date",
        cell: ({ getValue }) => formatDate(getValue()) || "-",
      },
      {
        accessorKey: "Item_No",
        header: "Item No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Vendor_Catalog_No",
        header: "Vendor Catalog No",
        cell: ({ getValue }) => getValue() || "-",
      },
      
      {
        accessorKey: "PKZ",
        header: "PKZ",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Item_Service_Description",
        header: "Item Service Description",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Cas_No",
        header: "Cas No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Batch_No",
        header: "Batch No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Open Qty",
        header: "Open Qty",
        cell: ({ getValue }) => getValue() !== null ? getValue() : "-",
      },
      {
        accessorKey: "Delivered Quantity",
        header: "Delivered Quantity",
        cell: ({ getValue }) => getValue() !== null ? getValue() : "-",
      },
      {
        accessorKey: "Stock Status-In hyd",
        header: "Stock Status-In hyd",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Delivery Date",
        header: "Delivery Date",
        cell: ({ getValue }) => getValue() ? formatDate(getValue()) : "-",
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.getValue("Delivery Date"));
          const dateB = new Date(rowB.getValue("Delivery Date"));
          return dateA.getTime() - dateB.getTime();
        },
      },
      {
        accessorKey: "Timeline",
        header: "Timeline",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Quantity",
        header: "Quantity",
        cell: ({ getValue }) => getValue() !== null ? getValue() : "-",
      },
      {
        accessorKey: "Unit_Price",
        header: "Unit Price",
        cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
        sortingFn: (rowA, rowB) => {
          const priceA = parseFloat(rowA.original["Unit_Price"]) || 0;
          const priceB = parseFloat(rowB.original["Unit_Price"]) || 0;
          return priceA - priceB;
        },
      },
      {
        accessorKey: "Total_Price",
        header: "Total Price",
        cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
        sortingFn: (rowA, rowB) => {
          const totalA = parseFloat(rowA.original["Total_Price"]) || 0;
          const totalB = parseFloat(rowB.original["Total_Price"]) || 0;
          return totalA - totalB;
        },
      },
      {
        accessorKey: "Category",
        header: "Category",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Invoice_No",
        header: "Invoice No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "MKT_Feedback",
        header: "MKT Feedback",
        cell: ({ getValue }) => getValue() || "-",
      },
    ],
    []
  );

  const table = useReactTable({
    data: orderData || [],
    columns,
    state: {
      globalFilter,
      pagination,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase();
      return Object.values(row.original).some(value =>
        String(value).toLowerCase().includes(searchValue)
      );
    },
    // Enable sorting for all columns
    enableSorting: true,
    // Default sort state - sort by SO_Date descending (newest first)
    initialState: {
      sorting: [
        { id: 'SO_Date', desc: true }
      ]
    }
  });

  const handleExportExcel = () => {
    const exportData = (orderData || []).map((row) => {
      const formattedRow = {};
      columns.forEach((column) => {
        const header = column.header;
        const value = row[column.accessorKey];

        if (header.includes("Date")) {
          formattedRow[header] = value ? formatDate(value) : "-";
        } else if (header === "Unit Price" || header === "Total Price") {
          formattedRow[header] = value !== null ? formatCurrency(value).slice(1) : "-";
        } else {
          formattedRow[header] = value || "-";
        }
      });
      return formattedRow;
    });

    downloadExcel(exportData, "Order_Details");
  };

  return (
    <Modal show={true} onHide={onClose} size="xl" centered dialogClassName="modal-95w">
      <Modal.Header className="py-3 px-4 bg-dark">
        <div className="d-flex align-items-center justify-content-between w-100">
          <Modal.Title className="fs-4 m-0 text-white">
            {title}
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
                      <div className="d-flex align-items-center">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <span className="ms-2">↑</span>,
                          desc: <span className="ms-2">↓</span>,
                        }[header.column.getIsSorted()] ?? null}
                      </div>
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
                    No order data available
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
    </Modal>
  );
};

export default OrderDetailsModal;