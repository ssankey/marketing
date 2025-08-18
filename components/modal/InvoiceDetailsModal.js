// // components/modal/InvoiceDetailsModal.js
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
// import Alert from "react-bootstrap/Alert";

// import { formatCurrency } from "utils/formatCurrency";
// import { formatDate } from "utils/formatDate";
// import downloadExcel from "utils/exporttoexcel";

// const InvoiceDetailsModal = ({ invoiceData, onClose, title }) => {
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [pagination, setPagination] = useState({
//     pageIndex: 0,
//     pageSize: 12,
//   });

//   // Function to generate COA download URL
//   const generateCoaUrl = (row) => {
//     const baseUrl = window.location.origin;
//     const localCoaPath = row["COA Filename"];
//     const itemNo = row["Item No."];
//     const batchNum = row["BatchNum"];

//     // Check if local COA exists and is not empty
//     if (localCoaPath && localCoaPath.trim() !== '') {
//       // Extract filename from full path
//       let filename = localCoaPath.trim();
      
//       // Handle Windows paths - extract filename after last backslash
//       if (filename.includes('\\')) {
//         const pathParts = filename.split('\\');
//         filename = pathParts[pathParts.length - 1];
//       }
      
//       // Handle Unix paths - extract filename after last forward slash
//       if (filename.includes('/')) {
//         const pathParts = filename.split('/');
//         filename = pathParts[pathParts.length - 1];
//       }
      
//       const encodedFilename = encodeURIComponent(filename);
//       return `${baseUrl}/api/coa/download/${encodedFilename}`;
//     }
    
//     // Fallback to energy URL if local COA doesn't exist and we have itemNo and batchNum
//     if (itemNo && batchNum && batchNum.trim() !== '') {
//       const itemPrefix = itemNo.includes('-') ? itemNo.split('-')[0] : itemNo;
//       return `${baseUrl}/api/coa/download-energy/${encodeURIComponent(itemPrefix)}/${encodeURIComponent(batchNum.trim())}`;
//     }
    
//     return null;
//   };

//   // Function to handle COA download
//   const handleCoaDownload = (row) => {
//     const coaUrl = generateCoaUrl(row);
    
//     if (coaUrl) {
//       // Create a temporary link element and trigger download
//       const link = document.createElement('a');
//       link.href = coaUrl;
//       link.target = '_blank';
//       link.download = ''; // This will use the filename from the server
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     } else {
//       alert('COA not available for this item');
//     }
//   };

//   const columns = useMemo(
//     () => [
//       {
//         accessorFn: row => row["SO No"],
//         header: "SO No",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: row => row["SO Date"],
//         header: "SO Date",
//         cell: ({ getValue }) => formatDate(getValue()) || "-",
//       },
//       {
//         accessorFn: row => row["SO Customer Ref. No"],
//         header: "Customer Ref. No",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: row => row["Contact Person"],
//         header: "Contact Person",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: row => row["Item No."],
//         header: "Item No.",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: row => row["Item/Service Description"],
//         header: "Description",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: row => row["Cas No"],
//         header: "Cas No",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: row => row["COA Filename"],
//         header: "COA",
//         cell: ({ getValue, row }) => {
//           const coaUrl = generateCoaUrl(row.original);
          
//           if (coaUrl) {
//             return (
//               <Button
//                 variant="link"
//                 size="sm"
//                 className="p-0 text-decoration-underline"
//                 style={{ fontSize: '0.875rem' }}
//                 onClick={() => handleCoaDownload(row.original)}
//               >
//                 COA
//               </Button>
//             );
//           }
//           return "N/A";
//         },
//       },
//       {
//         accessorFn: row => row["Vendor Catalog No."],
//         header: "Vendor Cat. No.",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: row => row["PKZ"],
//         header: "PKZ",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: row => row["Qty"],
//         header: "Qty",
//         cell: ({ getValue }) => getValue() !== null ? getValue() : "-",
//       },
//       {
//         accessorFn: row => row["STATUS"],
//         header: "Status",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: row => row["Inv#"],
//         header: "Invoice No",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: row => row["Invoice Posting Dt."],
//         header: "Invoice Date",
//         cell: ({ getValue }) => formatDate(getValue()) || "N/A",
//       },
//       {
//         accessorFn: row => row["Tracking Number"],
//         header: "Tracking No",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: row => row["Dispatch Date"],
//         header: "Dispatch Date",
//         cell: ({ getValue }) => formatDate(getValue()) || "N/A",
//       },
//       {
//         accessorFn: row => row["DELIVER DATE"],
//         header: "Delivery Date",
//         cell: ({ getValue }) => formatDate(getValue()) || "N/A",
//       },
//       {
//         accessorFn: row => row["Unit Sales Price"],
//         header: "Unit Price",
//         cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
//       },
//       {
//         accessorFn: row => row["Total Sales Price/Open Value"],
//         header: "Total Value",
//         cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
//       },
//       {
//         accessorFn: row => row["BatchNum"],
//         header: "Batch No",
//         cell: ({ getValue }) => getValue() || "-",
//       },
//       {
//         accessorFn: row => row["Mkt_Feedback"],
//         header: "Mkt Feedback",
//         cell: ({ getValue }) => getValue() || "-",
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
//       return Object.values(row.original).some(value =>
//         String(value).toLowerCase().includes(searchValue))
//     },
//   });

//   const handleExportExcel = () => {
//     const exportData = (invoiceData || []).map((row) => {
//       const formattedRow = {};
//       columns.forEach((column) => {
//         const header = column.header;
//         const value = column.accessorFn(row);

//         // Special handling for COA column in export
//         if (header === "COA") {
//           const coaUrl = generateCoaUrl(row);
//           formattedRow[header] = coaUrl ? "Available" : "N/A";
//         } else if (header.includes("Date")) {
//           formattedRow[header] = value ? formatDate(value) : "N/A";
//         } else if (header === "Unit Price" || header === "Total Value") {
//           formattedRow[header] = value !== null ? formatCurrency(value).slice(1) : "-";
//         } else {
//           formattedRow[header] = value || "-";
//         }
//       });
//       return formattedRow;
//     });

//     downloadExcel(exportData, "Invoice_Details");
//   };

//   return (
//     <Modal show={true} onHide={onClose} size="xl" centered dialogClassName="modal-95w">
//       <Modal.Header className="py-3 px-4 bg-dark">
//         <div className="d-flex align-items-center justify-content-between w-100">
//           <Modal.Title className="fs-4 m-0 text-white">
//             Invoice # {invoiceData?.[0]?.["Inv#"] || invoiceData?.[0]?.["Invoice No"] || "N/A"} Details
//           </Modal.Title>
//           <div className="d-flex align-items-center gap-3">
//             <Form.Control
//               type="text"
//               placeholder="Search invoice details..."
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
//                     No data available
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

// export default InvoiceDetailsModal;

// components/modal/InvoiceDetailsModal.js
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
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";

import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import downloadExcel from "utils/exporttoexcel";

const InvoiceDetailsModal = ({ invoiceData, onClose, title }) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 12,
  });

  // Function to generate COA download URL
  const generateCoaUrl = (row) => {
    const baseUrl = window.location.origin;
    const localCoaPath = row["COA Filename"];
    const itemNo = row["Item No."];
    const batchNum = row["BatchNum"];

    // Check if local COA exists and is not empty
    if (localCoaPath && localCoaPath.trim() !== '') {
      // Extract filename from full path
      let filename = localCoaPath.trim();
      
      // Handle Windows paths - extract filename after last backslash
      if (filename.includes('\\')) {
        const pathParts = filename.split('\\');
        filename = pathParts[pathParts.length - 1];
      }
      
      // Handle Unix paths - extract filename after last forward slash
      if (filename.includes('/')) {
        const pathParts = filename.split('/');
        filename = pathParts[pathParts.length - 1];
      }
      
      const encodedFilename = encodeURIComponent(filename);
      return {
        url: `${baseUrl}/api/coa/download/${encodedFilename}`,
        type: 'local'
      };
    }
    
    // Fallback to energy URL if local COA doesn't exist and we have itemNo and batchNum
    if (itemNo && batchNum && batchNum.trim() !== '') {
      const itemPrefix = itemNo.includes('-') ? itemNo.split('-')[0] : itemNo;
      return {
        url: `${baseUrl}/api/coa/download-energy/${encodeURIComponent(itemPrefix)}/${encodeURIComponent(batchNum.trim())}`,
        type: 'energy'
      };
    }
    
    return null;
  };

  // Function to check if COA PDF is available
  const checkCoaAvailability = async (coaInfo) => {
    if (!coaInfo) return false;
    
    try {
      // For local COA files, try a HEAD request first
      const response = await fetch(coaInfo.url, {
        method: 'HEAD',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      // If HEAD request fails, try GET with small range
      if (!response.ok) {
        const getResponse = await fetch(coaInfo.url, {
          method: 'GET',
          headers: {
            'Range': 'bytes=0-1',
            'Cache-Control': 'no-cache'
          }
        });
        
        return getResponse.ok || getResponse.status === 206;
      }
      
      // Check content type to ensure it's a PDF, not JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        console.log('COA returned JSON instead of PDF, marking as unavailable');
        return false;
      }
      
      return response.ok;
      
    } catch (error) {
      console.error('Error checking COA availability:', error);
      return false;
    }
  };

  // Function to handle COA download
  const handleCoaDownload = (row) => {
    const coaInfo = generateCoaUrl(row);
    
    if (coaInfo) {
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = coaInfo.url;
      link.target = '_blank';
      link.download = ''; // This will use the filename from the server
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('COA not available for this item');
    }
  };

  // COA Cell Component for the modal
  const CoaCellModal = ({ row }) => {
    const [isAvailable, setIsAvailable] = useState(null); // null = loading, true/false = available/not available
    const [isLoading, setIsLoading] = useState(true);
    
    React.useEffect(() => {
      const checkAvailability = async () => {
        setIsLoading(true);
        const coaInfo = generateCoaUrl(row);
        
        if (coaInfo) {
          try {
            const available = await checkCoaAvailability(coaInfo);
            setIsAvailable(available);
          } catch (error) {
            console.error('Error checking COA availability:', error);
            setIsAvailable(false);
          }
        } else {
          setIsAvailable(false);
        }
        
        setIsLoading(false);
      };
      
      checkAvailability();
    }, [row]);

    if (isLoading) {
      return (
        <div className="d-flex align-items-center justify-content-center">
          <Spinner animation="border" size="sm" />
        </div>
      );
    }
    
    if (isAvailable) {
      return (
        <Button
          variant="link"
          size="sm"
          className="p-0 text-decoration-underline"
          style={{ 
            fontSize: '0.875rem',
            color: '#007bff',
            border: 'none',
            background: 'none'
          }}
          onClick={() => handleCoaDownload(row)}
        >
          COA
        </Button>
      );
    }
    
    return <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>N/A</span>;
  };

  const columns = useMemo(
    () => [
      {
        accessorFn: row => row["SO No"],
        header: "SO No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["SO Date"],
        header: "SO Date",
        cell: ({ getValue }) => formatDate(getValue()) || "-",
      },
      {
        accessorFn: row => row["SO Customer Ref. No"],
        header: "Customer Ref. No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Contact Person"],
        header: "Contact Person",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Item No."],
        header: "Item No.",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Item/Service Description"],
        header: "Description",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Cas No"],
        header: "Cas No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["COA Filename"],
        header: "COA",
        cell: ({ row }) => <CoaCellModal row={row.original} />,
      },
      {
        accessorFn: row => row["Vendor Catalog No."],
        header: "Vendor Cat. No.",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["PKZ"],
        header: "PKZ",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Qty"],
        header: "Qty",
        cell: ({ getValue }) => getValue() !== null ? getValue() : "-",
      },
      {
        accessorFn: row => row["STATUS"],
        header: "Status",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Inv#"],
        header: "Invoice No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Invoice Posting Dt."],
        header: "Invoice Date",
        cell: ({ getValue }) => formatDate(getValue()) || "N/A",
      },
      {
        accessorFn: row => row["Tracking Number"],
        header: "Tracking No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Dispatch Date"],
        header: "Dispatch Date",
        cell: ({ getValue }) => formatDate(getValue()) || "N/A",
      },
      {
        accessorFn: row => row["DELIVER DATE"],
        header: "Delivery Date",
        cell: ({ getValue }) => formatDate(getValue()) || "N/A",
      },
      {
        accessorFn: row => row["Unit Sales Price"],
        header: "Unit Price",
        cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
      },
      {
        accessorFn: row => row["Total Sales Price/Open Value"],
        header: "Total Value",
        cell: ({ getValue }) => getValue() !== null ? formatCurrency(getValue()) : "-",
      },
      {
        accessorFn: row => row["BatchNum"],
        header: "Batch No",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorFn: row => row["Mkt_Feedback"],
        header: "Mkt Feedback",
        cell: ({ getValue }) => getValue() || "-",
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
      return Object.values(row.original).some(value =>
        String(value).toLowerCase().includes(searchValue))
    },
  });

  const handleExportExcel = async () => {
    const exportData = [];
    
    // Process each row and check COA availability for export
    for (const row of invoiceData || []) {
      const formattedRow = {};
      
      for (const column of columns) {
        const header = column.header;
        const value = column.accessorFn(row);

        // Special handling for COA column in export - check actual availability
        if (header === "COA") {
          const coaInfo = generateCoaUrl(row);
          if (coaInfo) {
            try {
              const available = await checkCoaAvailability(coaInfo);
              formattedRow[header] = available ? "Available" : "N/A";
            } catch (error) {
              formattedRow[header] = "N/A";
            }
          } else {
            formattedRow[header] = "N/A";
          }
        } else if (header.includes("Date")) {
          formattedRow[header] = value ? formatDate(value) : "N/A";
        } else if (header === "Unit Price" || header === "Total Value") {
          formattedRow[header] = value !== null ? formatCurrency(value).slice(1) : "-";
        } else {
          formattedRow[header] = value || "-";
        }
      }
      
      exportData.push(formattedRow);
    }

    downloadExcel(exportData, "Invoice_Details");
  };

  return (
    <Modal show={true} onHide={onClose} size="xl" centered dialogClassName="modal-95w">
      <Modal.Header className="py-3 px-4 bg-dark">
        <div className="d-flex align-items-center justify-content-between w-100">
          <Modal.Title className="fs-4 m-0 text-white">
            Invoice # {invoiceData?.[0]?.["Inv#"] || invoiceData?.[0]?.["Invoice No"] || "N/A"} Details
          </Modal.Title>
          <div className="d-flex align-items-center gap-3">
            <Form.Control
              type="text"
              placeholder="Search invoice details..."
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
                    No data available
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

export default InvoiceDetailsModal;