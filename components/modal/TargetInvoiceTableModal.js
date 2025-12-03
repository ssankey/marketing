// // // components/modal/TargetInvoiceTableModal.js
// // import React, { useState, useMemo } from "react";
// // import {
// //   useReactTable,
// //   getCoreRowModel,
// //   getSortedRowModel,
// //   getFilteredRowModel,
// //   getPaginationRowModel,
// //   flexRender,
// // } from "@tanstack/react-table";
// // import Modal from "react-bootstrap/Modal";
// // import Button from "react-bootstrap/Button";
// // import Form from "react-bootstrap/Form";
// // import { formatCurrency } from "utils/formatCurrency";
// // import { formatDate } from "utils/formatDate";
// // import downloadExcel from "utils/exporttoexcel";

// // const TargetInvoiceTableModal = ({ invoiceData, onClose, title = "Invoice Details" }) => {
// //   const [globalFilter, setGlobalFilter] = useState("");
// //   const [pagination, setPagination] = useState({
// //     pageIndex: 0,
// //     pageSize: 12,
// //   });

// //   console.log("TargetInvoiceTableModal received data:", invoiceData?.length, "rows");

// //   const columns = useMemo(
// //     () => [
// //       {
// //         accessorFn: (row) => row["Invoice No"],
// //         header: "Invoice No",
// //         cell: ({ getValue }) => getValue() || "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Invoice Posting Date"],
// //         header: "Invoice Date",
// //         cell: ({ getValue }) => formatDate(getValue()) || "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Year"],
// //         header: "Year",
// //         cell: ({ getValue }) => getValue() || "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Month"],
// //         header: "Month",
// //         cell: ({ getValue }) => getValue() || "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Customer Code"],
// //         header: "Customer Code",
// //         cell: ({ getValue }) => getValue() || "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Customer Name"],
// //         header: "Customer Name",
// //         cell: ({ getValue }) => getValue() || "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Sales Employee"],
// //         header: "Sales Person",
// //         cell: ({ getValue }) => getValue() || "-",
// //       },
// //       {
// //         accessorFn: (row) => row["State Code"],
// //         header: "State",
// //         cell: ({ getValue }) => getValue() || "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Country"],
// //         header: "Country",
// //         cell: ({ getValue }) => getValue() || "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Region"],
// //         header: "Region",
// //         cell: ({ getValue }) => getValue() || "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Status"],
// //         header: "Status",
// //         cell: ({ getValue }) => {
// //           const status = getValue();
// //           const statusColors = {
// //             'Closed': 'success',
// //             'Open': 'primary',
// //             'Partially Open': 'warning',
// //             'Cancelled': 'danger'
// //           };
// //           return (
// //             <span className={`badge bg-${statusColors[status] || 'secondary'}`}>
// //               {status || "-"}
// //             </span>
// //           );
// //         },
// //       },
// //       {
// //         accessorFn: (row) => row["Item Code"],
// //         header: "Item Code",
// //         cell: ({ getValue }) => getValue() || "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Description"],
// //         header: "Description",
// //         cell: ({ getValue }) => getValue() || "-",
// //       },
// //       {
// //         accessorFn: (row) => row["CAS No"],
// //         header: "CAS No",
// //         cell: ({ getValue }) => getValue() || "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Vendor Catalog No."],
// //         header: "Vendor Cat. No.",
// //         cell: ({ getValue }) => getValue() || "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Pack Size"],
// //         header: "Pack Size",
// //         cell: ({ getValue }) => getValue() !== null ? getValue() : "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Stock Status (Hyd)"],
// //         header: "Stock Status",
// //         cell: ({ getValue }) => {
// //           const status = getValue();
// //           return (
// //             <span className={`badge bg-${status === 'In Stock' ? 'success' : 'danger'}`}>
// //               {status || "-"}
// //             </span>
// //           );
// //         },
// //       },
// //       {
// //         accessorFn: (row) => row["Mkt Feedback"],
// //         header: "Mkt Feedback",
// //         cell: ({ getValue }) => getValue() || "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Unit Price"],
// //         header: "Unit Price",
// //         cell: ({ getValue }) =>
// //           getValue() !== null ? formatCurrency(getValue()) : "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Line Total"],
// //         header: "Line Total",
// //         cell: ({ getValue }) =>
// //           getValue() !== null ? formatCurrency(getValue()) : "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Discount %"],
// //         header: "Discount %",
// //         cell: ({ getValue }) =>
// //           getValue() !== null ? `${getValue()}%` : "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Tax %"],
// //         header: "Tax %",
// //         cell: ({ getValue }) =>
// //           getValue() !== null ? `${getValue()}%` : "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Currency"],
// //         header: "Currency",
// //         cell: ({ getValue }) => getValue() || "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Category Name"],
// //         header: "Category",
// //         cell: ({ getValue }) => getValue() || "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Sub Group 1"],
// //         header: "Sub Group",
// //         cell: ({ getValue }) => getValue() || "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Batch No"],
// //         header: "Batch No",
// //         cell: ({ getValue }) => getValue() || "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Vendor Batch No"],
// //         header: "Vendor Batch",
// //         cell: ({ getValue }) => getValue() || "-",
// //       },
// //       {
// //         accessorFn: (row) => row["Subtotal"],
// //         header: "Subtotal",
// //         cell: ({ getValue }) =>
// //           getValue() !== null ? formatCurrency(getValue()) : "-",
// //       },
// //     ],
// //     []
// //   );

// //   const table = useReactTable({
// //     data: invoiceData || [],
// //     columns,
// //     state: {
// //       globalFilter,
// //       pagination,
// //     },
// //     onGlobalFilterChange: setGlobalFilter,
// //     onPaginationChange: setPagination,
// //     getCoreRowModel: getCoreRowModel(),
// //     getSortedRowModel: getSortedRowModel(),
// //     getFilteredRowModel: getFilteredRowModel(),
// //     getPaginationRowModel: getPaginationRowModel(),
// //     globalFilterFn: (row, columnId, filterValue) => {
// //       const searchValue = filterValue.toLowerCase();
// //       return Object.values(row.original).some((value) =>
// //         String(value).toLowerCase().includes(searchValue)
// //       );
// //     },
// //   });

// //   const handleExportExcel = () => {
// //     const exportData = (invoiceData || []).map((row) => {
// //       const formattedRow = {};
// //       columns.forEach((column) => {
// //         const header = column.header;
// //         const value = column.accessorFn(row);
        
// //         if (header.includes("Date")) {
// //           formattedRow[header] = value ? formatDate(value) : "N/A";
// //         } else if (header === "Unit Price" || header === "Line Total" || header === "Subtotal") {
// //           // Export as raw number for calculations
// //           formattedRow[header] = value !== null && value !== undefined ? Number(value) : 0;
// //         } else if (header === "Discount %" || header === "Tax %") {
// //           // Export percentage as raw number (e.g., 18 instead of "18%")
// //           formattedRow[header] = value !== null && value !== undefined ? Number(value) : 0;
// //         } else if (header === "Pack Size") {
// //           // Export pack size as number
// //           formattedRow[header] = value !== null && value !== undefined ? Number(value) : 0;
// //         } else if (header === "Year") {
// //           // Export year as number
// //           formattedRow[header] = value !== null && value !== undefined ? Number(value) : 0;
// //         } else {
// //           formattedRow[header] = value || "-";
// //         }
// //       });
// //       return formattedRow;
// //     });

// //     downloadExcel(exportData, "Invoice_Details");
// //   };

// //   return (
// //     <Modal
// //       show={true}
// //       onHide={onClose}
// //       size="xl"
// //       centered
// //       backdrop="static"
// //       style={{ maxWidth: "95vw", margin: "auto" }}
// //     >
// //       <Modal.Header
// //         closeButton
// //         style={{
// //           background: "linear-gradient(135deg, #15803d 0%, #16a34a 100%)",
// //           color: "white",
// //           borderBottom: "3px solid #dcfce7",
// //         }}
// //       >
// //         <Modal.Title style={{ fontWeight: 700, fontSize: "1.5rem" }}>
// //           {title}
// //         </Modal.Title>
// //       </Modal.Header>

// //       <Modal.Body style={{ maxHeight: "75vh", overflowY: "auto", padding: "1.5rem" }}>
// //         <div
// //           style={{
// //             display: "flex",
// //             justifyContent: "space-between",
// //             alignItems: "center",
// //             marginBottom: "1.5rem",
// //             gap: "1rem",
// //             flexWrap: "wrap",
// //           }}
// //         >
// //           <Form.Control
// //             type="text"
// //             placeholder="Search invoices..."
// //             value={globalFilter ?? ""}
// //             onChange={(e) => setGlobalFilter(e.target.value)}
// //             style={{ width: "300px" }}
// //             size="lg"
// //             className="border-0"
// //           />
// //           <div style={{ display: "flex", gap: "10px" }}>
// //             <Button
// //               variant="success"
// //               onClick={handleExportExcel}
// //               disabled={!invoiceData || invoiceData.length === 0}
// //               style={{
// //                 fontWeight: 600,
// //                 padding: "0.5rem 1.5rem",
// //                 boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
// //               }}
// //             >
// //               📥 Export to Excel
// //             </Button>
// //             <Button
// //               variant="outline-danger"
// //               onClick={onClose}
// //               style={{ fontWeight: 600, padding: "0.5rem 1.5rem" }}
// //             >
// //               ✕ Close
// //             </Button>
// //           </div>
// //         </div>

// //         <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
// //           <table
// //             style={{
// //               width: "100%",
// //               borderCollapse: "collapse",
// //               fontSize: "0.875rem",
// //             }}
// //           >
// //             <thead style={{ backgroundColor: "#f0fdf4", position: "sticky", top: 0, zIndex: 10 }}>
// //               {table.getHeaderGroups().map((headerGroup) => (
// //                 <tr key={headerGroup.id}>
// //                   {headerGroup.headers.map((header) => (
// //                     <th
// //                       key={header.id}
// //                       onClick={header.column.getToggleSortingHandler()}
// //                       style={{
// //                         padding: "12px",
// //                         textAlign: "left",
// //                         fontWeight: "700",
// //                         color: "#15803d",
// //                         cursor: "pointer",
// //                         whiteSpace: "nowrap",
// //                         borderBottom: "2px solid #a7f3d0",
// //                       }}
// //                     >
// //                       {flexRender(header.column.columnDef.header, header.getContext())}
// //                       {
// //                         {
// //                           asc: " 🔼",
// //                           desc: " 🔽",
// //                         }[header.column.getIsSorted()]
// //                       }
// //                     </th>
// //                   ))}
// //                 </tr>
// //               ))}
// //             </thead>
// //             <tbody>
// //               {table.getRowModel().rows.length > 0 ? (
// //                 table.getRowModel().rows.map((row) => (
// //                   <tr
// //                     key={row.id}
// //                     style={{
// //                       backgroundColor: row.index % 2 === 0 ? "white" : "#f9fafb",
// //                       transition: "background-color 0.2s ease",
// //                     }}
// //                     onMouseOver={(e) =>
// //                       (e.currentTarget.style.backgroundColor = "#e0f2fe")
// //                     }
// //                     onMouseOut={(e) =>
// //                       (e.currentTarget.style.backgroundColor =
// //                         row.index % 2 === 0 ? "white" : "#f9fafb")
// //                     }
// //                   >
// //                     {row.getVisibleCells().map((cell) => (
// //                       <td
// //                         key={cell.id}
// //                         style={{
// //                           padding: "12px",
// //                           borderBottom: "1px solid #e5e7eb",
// //                           whiteSpace: "nowrap",
// //                         }}
// //                       >
// //                         {flexRender(cell.column.columnDef.cell, cell.getContext())}
// //                       </td>
// //                     ))}
// //                   </tr>
// //                 ))
// //               ) : (
// //                 <tr>
// //                   <td
// //                     colSpan={columns.length}
// //                     style={{
// //                       padding: "2rem",
// //                       textAlign: "center",
// //                       color: "#6b7280",
// //                       fontStyle: "italic",
// //                     }}
// //                   >
// //                     No data available
// //                   </td>
// //                 </tr>
// //               )}
// //             </tbody>
// //           </table>
// //         </div>

// //         {/* Pagination Controls */}
// //         <div
// //           style={{
// //             display: "flex",
// //             justifyContent: "space-between",
// //             alignItems: "center",
// //             marginTop: "1.5rem",
// //             flexWrap: "wrap",
// //             gap: "1rem",
// //           }}
// //         >
// //           <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
// //             Showing {table.getRowModel().rows.length} of{" "}
// //             {table.getFilteredRowModel().rows.length} rows
// //           </div>

// //           <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
// //             <Button
// //               variant="outline-success"
// //               size="sm"
// //               onClick={() => table.setPageIndex(0)}
// //               disabled={!table.getCanPreviousPage()}
// //               title="First Page"
// //             >
// //               ≪
// //             </Button>
// //             <Button
// //               variant="outline-success"
// //               size="sm"
// //               onClick={() => table.previousPage()}
// //               disabled={!table.getCanPreviousPage()}
// //             >
// //               Previous
// //             </Button>
// //             <span style={{ padding: "0 1rem", fontSize: "0.875rem" }}>
// //               Page {table.getState().pagination.pageIndex + 1} of{" "}
// //               {table.getPageCount()}
// //             </span>
// //             <Button
// //               variant="outline-success"
// //               size="sm"
// //               onClick={() => table.nextPage()}
// //               disabled={!table.getCanNextPage()}
// //             >
// //               Next
// //             </Button>
// //             <Button
// //               variant="outline-success"
// //               size="sm"
// //               onClick={() => table.setPageIndex(table.getPageCount() - 1)}
// //               disabled={!table.getCanNextPage()}
// //               title="Last Page"
// //             >
// //               ≫
// //             </Button>
// //           </div>

// //           <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
// //             <span style={{ fontSize: "0.875rem" }}>Rows per page:</span>
// //             <Form.Select
// //               value={table.getState().pagination.pageSize}
// //               onChange={(e) => {
// //                 table.setPageSize(Number(e.target.value));
// //               }}
// //               size="sm"
// //               style={{ width: "80px" }}
// //             >
// //               {[12, 25, 50, 100].map((pageSize) => (
// //                 <option key={pageSize} value={pageSize}>
// //                   {pageSize}
// //                 </option>
// //               ))}
// //             </Form.Select>
// //           </div>
// //         </div>
// //       </Modal.Body>
// //     </Modal>
// //   );
// // };

// // export default TargetInvoiceTableModal;

// // components/modal/TargetInvoiceTableModal.js
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

// const TargetInvoiceTableModal = ({ invoiceData, onClose, title = "Invoice Details" }) => {
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [pagination, setPagination] = useState({
//     pageIndex: 0,
//     pageSize: 12,
//   });

//   console.log("TargetInvoiceTableModal received data:", invoiceData?.length, "rows");

//   const columns = useMemo(
//     () => [
//       {
//         accessorFn: (row) => row["Invoice No"],
//         header: "Invoice No",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: (row) => row["Invoice Posting Date"],
//         header: "Invoice Date",
//         cell: ({ getValue }) => formatDate(getValue()) || "-",
//       },
//       {
//         accessorFn: (row) => row["Year"],
//         header: "Year",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: (row) => row["Month"],
//         header: "Month",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: (row) => row["Customer Code"],
//         header: "Customer Code",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: (row) => row["Customer Name"],
//         header: "Customer Name",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: (row) => row["Sales Employee"],
//         header: "Sales Person",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: (row) => row["State Code"],
//         header: "State",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: (row) => row["Country"],
//         header: "Country",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: (row) => row["Region"],
//         header: "Region",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: (row) => row["Status"],
//         header: "Status",
//         cell: ({ getValue }) => {
//           const status = getValue();
//           const statusColors = {
//             'Closed': 'success',
//             'Open': 'primary',
//             'Partially Open': 'warning',
//             'Cancelled': 'danger'
//           };
//           return (
//             <span className={`badge bg-${statusColors[status] || 'secondary'}`}>
//               {status || "-"}
//             </span>
//           );
//         },
//       },
//       {
//         accessorFn: (row) => row["Item Code"],
//         header: "Item Code",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: (row) => row["Description"],
//         header: "Description",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: (row) => row["CAS No"],
//         header: "CAS No",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: (row) => row["Vendor Catalog No."],
//         header: "Vendor Cat. No.",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: (row) => row["Pack Size"],
//         header: "Pack Size",
//         cell: ({ getValue }) => getValue() !== null ? getValue() : "-",
//       },
//       {
//         accessorFn: (row) => row["Stock Status (Hyd)"],
//         header: "Stock Status",
//         cell: ({ getValue }) => {
//           const status = getValue();
//           return (
//             <span className={`badge bg-${status === 'In Stock' ? 'success' : 'danger'}`}>
//               {status || "-"}
//             </span>
//           );
//         },
//       },
//       {
//         accessorFn: (row) => row["Mkt Feedback"],
//         header: "Mkt Feedback",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: (row) => row["Unit Price"],
//         header: "Unit Price",
//         cell: ({ getValue }) =>
//           getValue() !== null ? formatCurrency(getValue()) : "-",
//       },
//       {
//         accessorFn: (row) => row["Line Total"],
//         header: "Line Total",
//         cell: ({ getValue }) =>
//           getValue() !== null ? formatCurrency(getValue()) : "-",
//       },
//       {
//         accessorFn: (row) => row["Discount %"],
//         header: "Discount %",
//         cell: ({ getValue }) =>
//           getValue() !== null ? `${getValue()}%` : "-",
//       },
//       {
//         accessorFn: (row) => row["Tax %"],
//         header: "Tax %",
//         cell: ({ getValue }) =>
//           getValue() !== null ? `${getValue()}%` : "-",
//       },
//       {
//         accessorFn: (row) => row["Currency"],
//         header: "Currency",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: (row) => row["Category Name"],
//         header: "Category",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: (row) => row["Sub Group 1"],
//         header: "Sub Group",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: (row) => row["Subtotal"],
//         header: "Subtotal",
//         cell: ({ getValue }) =>
//           getValue() !== null ? formatCurrency(getValue()) : "-",
//       },
//     ],
//     []
//   );

//   const table = useReactTable({
//     data: invoiceData || [],
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
//       return Object.values(row.original).some((value) =>
//         String(value).toLowerCase().includes(searchValue)
//       );
//     },
//   });

//   const handleExportExcel = () => {
//     const exportData = (invoiceData || []).map((row) => {
//       const formattedRow = {};
//       columns.forEach((column) => {
//         const header = column.header;
//         const value = column.accessorFn(row);
        
//         if (header.includes("Date")) {
//           formattedRow[header] = value ? formatDate(value) : "N/A";
//         } else if (header === "Unit Price" || header === "Line Total" || header === "Subtotal") {
//           // Export as raw number for calculations
//           formattedRow[header] = value !== null && value !== undefined ? Number(value) : 0;
//         } else if (header === "Discount %" || header === "Tax %") {
//           // Export percentage as raw number (e.g., 18 instead of "18%")
//           formattedRow[header] = value !== null && value !== undefined ? Number(value) : 0;
//         } else if (header === "Pack Size") {
//           // Export pack size as number
//           formattedRow[header] = value !== null && value !== undefined ? Number(value) : 0;
//         } else if (header === "Year") {
//           // Export year as number
//           formattedRow[header] = value !== null && value !== undefined ? Number(value) : 0;
//         } else {
//           formattedRow[header] = value || "-";
//         }
//       });
//       return formattedRow;
//     });

//     downloadExcel(exportData, "Invoice_Details");
//   };

//   return (
//     <Modal
//       show={true}
//       onHide={onClose}
//       size="xl"
//       centered
//       backdrop="static"
//       style={{ maxWidth: "95vw", margin: "auto" }}
//     >
//       <Modal.Header
//         closeButton
//         style={{
//           background: "linear-gradient(135deg, #15803d 0%, #16a34a 100%)",
//           color: "white",
//           borderBottom: "3px solid #dcfce7",
//         }}
//       >
//         <Modal.Title style={{ fontWeight: 700, fontSize: "1.5rem" }}>
//           {title}
//         </Modal.Title>
//       </Modal.Header>

//       <Modal.Body style={{ maxHeight: "75vh", overflowY: "auto", padding: "1.5rem" }}>
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             marginBottom: "1.5rem",
//             gap: "1rem",
//             flexWrap: "wrap",
//           }}
//         >
//           <Form.Control
//             type="text"
//             placeholder="Search invoices..."
//             value={globalFilter ?? ""}
//             onChange={(e) => setGlobalFilter(e.target.value)}
//             style={{ width: "300px" }}
//             size="lg"
//             className="border-0"
//           />
//           <div style={{ display: "flex", gap: "10px" }}>
//             <Button
//               variant="success"
//               onClick={handleExportExcel}
//               disabled={!invoiceData || invoiceData.length === 0}
//               style={{
//                 fontWeight: 600,
//                 padding: "0.5rem 1.5rem",
//                 boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
//               }}
//             >
//               📥 Export to Excel
//             </Button>
//             <Button
//               variant="outline-danger"
//               onClick={onClose}
//               style={{ fontWeight: 600, padding: "0.5rem 1.5rem" }}
//             >
//               ✕ Close
//             </Button>
//           </div>
//         </div>

//         <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
//           <table
//             style={{
//               width: "100%",
//               borderCollapse: "collapse",
//               fontSize: "0.875rem",
//             }}
//           >
//             <thead style={{ backgroundColor: "#f0fdf4", position: "sticky", top: 0, zIndex: 10 }}>
//               {table.getHeaderGroups().map((headerGroup) => (
//                 <tr key={headerGroup.id}>
//                   {headerGroup.headers.map((header) => (
//                     <th
//                       key={header.id}
//                       onClick={header.column.getToggleSortingHandler()}
//                       style={{
//                         padding: "12px",
//                         textAlign: "left",
//                         fontWeight: "700",
//                         color: "#15803d",
//                         cursor: "pointer",
//                         whiteSpace: "nowrap",
//                         borderBottom: "2px solid #a7f3d0",
//                       }}
//                     >
//                       {flexRender(header.column.columnDef.header, header.getContext())}
//                       {
//                         {
//                           asc: " 🔼",
//                           desc: " 🔽",
//                         }[header.column.getIsSorted()]
//                       }
//                     </th>
//                   ))}
//                 </tr>
//               ))}
//             </thead>
//             <tbody>
//               {table.getRowModel().rows.length > 0 ? (
//                 table.getRowModel().rows.map((row) => (
//                   <tr
//                     key={row.id}
//                     style={{
//                       backgroundColor: row.index % 2 === 0 ? "white" : "#f9fafb",
//                       transition: "background-color 0.2s ease",
//                     }}
//                     onMouseOver={(e) =>
//                       (e.currentTarget.style.backgroundColor = "#e0f2fe")
//                     }
//                     onMouseOut={(e) =>
//                       (e.currentTarget.style.backgroundColor =
//                         row.index % 2 === 0 ? "white" : "#f9fafb")
//                     }
//                   >
//                     {row.getVisibleCells().map((cell) => (
//                       <td
//                         key={cell.id}
//                         style={{
//                           padding: "12px",
//                           borderBottom: "1px solid #e5e7eb",
//                           whiteSpace: "nowrap",
//                         }}
//                       >
//                         {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                       </td>
//                     ))}
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td
//                     colSpan={columns.length}
//                     style={{
//                       padding: "2rem",
//                       textAlign: "center",
//                       color: "#6b7280",
//                       fontStyle: "italic",
//                     }}
//                   >
//                     No data available
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination Controls */}
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             marginTop: "1.5rem",
//             flexWrap: "wrap",
//             gap: "1rem",
//           }}
//         >
//           <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
//             Showing {table.getRowModel().rows.length} of{" "}
//             {table.getFilteredRowModel().rows.length} rows
//           </div>

//           <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
//             <Button
//               variant="outline-success"
//               size="sm"
//               onClick={() => table.setPageIndex(0)}
//               disabled={!table.getCanPreviousPage()}
//               title="First Page"
//             >
//               ≪
//             </Button>
//             <Button
//               variant="outline-success"
//               size="sm"
//               onClick={() => table.previousPage()}
//               disabled={!table.getCanPreviousPage()}
//             >
//               Previous
//             </Button>
//             <span style={{ padding: "0 1rem", fontSize: "0.875rem" }}>
//               Page {table.getState().pagination.pageIndex + 1} of{" "}
//               {table.getPageCount()}
//             </span>
//             <Button
//               variant="outline-success"
//               size="sm"
//               onClick={() => table.nextPage()}
//               disabled={!table.getCanNextPage()}
//             >
//               Next
//             </Button>
//             <Button
//               variant="outline-success"
//               size="sm"
//               onClick={() => table.setPageIndex(table.getPageCount() - 1)}
//               disabled={!table.getCanNextPage()}
//               title="Last Page"
//             >
//               ≫
//             </Button>
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
//             <span style={{ fontSize: "0.875rem" }}>Rows per page:</span>
//             <Form.Select
//               value={table.getState().pagination.pageSize}
//               onChange={(e) => {
//                 table.setPageSize(Number(e.target.value));
//               }}
//               size="sm"
//               style={{ width: "80px" }}
//             >
//               {[12, 25, 50, 100].map((pageSize) => (
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

// export default TargetInvoiceTableModal;

// components/modal/TargetInvoiceTableModal.js
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

const TargetInvoiceTableModal = ({ invoiceData, onClose, title = "Invoice Details" }) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 12,
  });

  console.log("TargetInvoiceTableModal received data:", invoiceData?.length, "rows");

  const columns = useMemo(
    () => [
      {
        accessorFn: (row) => row["Invoice No"],
        header: "Invoice No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: (row) => row["Invoice Posting Date"],
        header: "Invoice Date",
        cell: ({ getValue }) => formatDate(getValue()) || "-",
      },
      {
        accessorFn: (row) => row["Year"],
        header: "Year",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: (row) => row["Month"],
        header: "Month",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: (row) => row["Customer Code"],
        header: "Customer Code",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: (row) => row["Customer Name"],
        header: "Customer Name",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: (row) => row["Sales Employee"],
        header: "Sales Person",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: (row) => row["State"],
        header: "State",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: (row) => row["Country"],
        header: "Country",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: (row) => row["Region"],
        header: "Region",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: (row) => row["Status"],
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue();
          const statusColors = {
            'Closed': 'success',
            'Open': 'primary',
            'Partially Open': 'warning',
            'Cancelled': 'danger'
          };
          return (
            <span className={`badge bg-${statusColors[status] || 'secondary'}`}>
              {status || "-"}
            </span>
          );
        },
      },
      {
        accessorFn: (row) => row["Item Code"],
        header: "Item Code",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: (row) => row["Description"],
        header: "Description",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: (row) => row["CAS No"],
        header: "CAS No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: (row) => row["Vendor Catalog No."],
        header: "Vendor Cat. No.",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: (row) => row["Pack Size"],
        header: "Pack Size",
        cell: ({ getValue }) => getValue() !== null ? getValue() : "-",
      },
      {
        accessorFn: (row) => row["Stock Status (Hyd)"],
        header: "Stock Status",
        cell: ({ getValue }) => {
          const status = getValue();
          return (
            <span className={`badge bg-${status === 'In Stock' ? 'success' : 'danger'}`}>
              {status || "-"}
            </span>
          );
        },
      },
      {
        accessorFn: (row) => row["Mkt Feedback"],
        header: "Mkt Feedback",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: (row) => row["Unit Price"],
        header: "Unit Price",
        cell: ({ getValue }) =>
          getValue() !== null ? formatCurrency(getValue()) : "-",
      },
      {
        accessorFn: (row) => row["Line Total"],
        header: "Line Total",
        cell: ({ getValue }) =>
          getValue() !== null ? formatCurrency(getValue()) : "-",
      },
      {
        accessorFn: (row) => row["Discount %"],
        header: "Discount %",
        cell: ({ getValue }) =>
          getValue() !== null ? `${getValue()}%` : "-",
      },
      {
        accessorFn: (row) => row["Tax %"],
        header: "Tax %",
        cell: ({ getValue }) =>
          getValue() !== null ? `${getValue()}%` : "-",
      },
      {
        accessorFn: (row) => row["Currency"],
        header: "Currency",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: (row) => row["Category Name"],
        header: "Category",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: (row) => row["Sub Group 1"],
        header: "Sub Group",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: (row) => row["Subtotal"],
        header: "Subtotal",
        cell: ({ getValue }) =>
          getValue() !== null ? formatCurrency(getValue()) : "-",
      },
    ],
    []
  );

  const table = useReactTable({
    data: invoiceData || [],
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
      return Object.values(row.original).some((value) =>
        String(value).toLowerCase().includes(searchValue)
      );
    },
  });

  const handleExportExcel = () => {
    const exportData = (invoiceData || []).map((row) => {
      const formattedRow = {};
      columns.forEach((column) => {
        const header = column.header;
        const value = column.accessorFn(row);
        
        if (header.includes("Date")) {
          formattedRow[header] = value ? formatDate(value) : "N/A";
        } else if (header === "Unit Price" || header === "Line Total" || header === "Subtotal") {
          // Export as raw number for calculations
          formattedRow[header] = value !== null && value !== undefined ? Number(value) : 0;
        } else if (header === "Discount %" || header === "Tax %") {
          // Export percentage as raw number (e.g., 18 instead of "18%")
          formattedRow[header] = value !== null && value !== undefined ? Number(value) : 0;
        } else if (header === "Pack Size") {
          // Export pack size as number
          formattedRow[header] = value !== null && value !== undefined ? Number(value) : 0;
        } else if (header === "Year") {
          // Export year as number
          formattedRow[header] = value !== null && value !== undefined ? Number(value) : 0;
        } else {
          formattedRow[header] = value || "-";
        }
      });
      return formattedRow;
    });

    downloadExcel(exportData, "Invoice_Details");
  };

  return (
    <Modal
      show={true}
      onHide={onClose}
      size="xl"
      centered
      backdrop="static"
      style={{ maxWidth: "95vw", margin: "auto" }}
    >
      <Modal.Header
        closeButton
        style={{
          background: "linear-gradient(135deg, #15803d 0%, #16a34a 100%)",
          color: "white",
          borderBottom: "3px solid #dcfce7",
        }}
      >
        <Modal.Title style={{ fontWeight: 700, fontSize: "1.5rem" }}>
          {title}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: "75vh", overflowY: "auto", padding: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <Form.Control
            type="text"
            placeholder="Search invoices..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            style={{ width: "300px" }}
            size="lg"
            className="border-0"
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <Button
              variant="success"
              onClick={handleExportExcel}
              disabled={!invoiceData || invoiceData.length === 0}
              style={{
                fontWeight: 600,
                padding: "0.5rem 1.5rem",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              📥 Export to Excel
            </Button>
            <Button
              variant="outline-danger"
              onClick={onClose}
              style={{ fontWeight: 600, padding: "0.5rem 1.5rem" }}
            >
              ✕ Close
            </Button>
          </div>
        </div>

        <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.875rem",
            }}
          >
            <thead style={{ backgroundColor: "#f0fdf4", position: "sticky", top: 0, zIndex: 10 }}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: "700",
                        color: "#15803d",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        borderBottom: "2px solid #a7f3d0",
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {
                        {
                          asc: " 🔼",
                          desc: " 🔽",
                        }[header.column.getIsSorted()]
                      }
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    style={{
                      backgroundColor: row.index % 2 === 0 ? "white" : "#f9fafb",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#e0f2fe")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        row.index % 2 === 0 ? "white" : "#f9fafb")
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #e5e7eb",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#6b7280",
                      fontStyle: "italic",
                    }}
                  >
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Showing {table.getRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} rows
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Button
              variant="outline-success"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              title="First Page"
            >
              ≪
            </Button>
            <Button
              variant="outline-success"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <span style={{ padding: "0 1rem", fontSize: "0.875rem" }}>
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>
            <Button
              variant="outline-success"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
            <Button
              variant="outline-success"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              title="Last Page"
            >
              ≫
            </Button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem" }}>Rows per page:</span>
            <Form.Select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              size="sm"
              style={{ width: "80px" }}
            >
              {[12, 25, 50, 100].map((pageSize) => (
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

export default TargetInvoiceTableModal;