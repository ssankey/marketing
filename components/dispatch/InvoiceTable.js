// // components/dispatch/InvoiceTable.js
// import { Card, Form, Button, Spinner } from "react-bootstrap";
// import {
//   useReactTable,
//   getCoreRowModel,
//   getFilteredRowModel,
//   flexRender,
// } from "@tanstack/react-table";
// import { formatCurrency } from "utils/formatCurrency";

// export default function InvoiceTable({ 
//   invoiceData, 
//   loading, 
//   globalFilter, 
//   setGlobalFilter, 
//   onExportExcel, 
//   isExporting 
// }) {
  
// // components/dispatch/InvoiceTable.js
// const handleCOADownload = async (coaUrl, itemNo, vendorBatchNum) => {
//   try {
//     // Create a filename based on item code and batch number
//     const filename = `COA_${itemNo}_${vendorBatchNum}.pdf`;
    
//     // Create a temporary link and trigger download
//     const a = document.createElement("a");
//     a.href = coaUrl;
//     a.download = filename;
//     a.target = "_blank"; // Open in new tab as fallback
//     document.body.appendChild(a);
//     a.click();
    
//     // Clean up
//     setTimeout(() => {
//       document.body.removeChild(a);
//     }, 100);
//   } catch (e) {
//     console.error("Failed to download COA:", e);
//     alert("Failed to download COA file.");
//   }
// };

//   const columns = [
//     {
//       accessorKey: "serialNo",
//       header: "No.",
//       cell: ({ row }) => row.index + 1,
//     },
//     {
//       accessorKey: "ItemNo",
//       header: "Item No.",
//       cell: ({ getValue }) => getValue() || "-",
//     },
//     {
//       accessorKey: "ItemDescription",
//       header: "Item/Service Description",
//       cell: ({ getValue }) => getValue() || "-",
//     },
//     {
//       accessorKey: "CasNo",
//       header: "CAS No.",
//       cell: ({ getValue }) => getValue() || "-",
//     },
//     {
//       accessorKey: "Unit",
//       header: "Unit",
//       cell: ({ getValue }) => getValue() || "-",
//     },
//     {
//       accessorKey: "PackSize",
//       header: "Pack Size",
//       cell: ({ getValue }) => getValue() || "-",
//     },
//     {
//       accessorKey: "UnitSalesPrice",
//       header: "Unit Sales Price",
//       cell: ({ getValue }) => formatCurrency(getValue()) || "-",
//     },
//     {
//       accessorKey: "Qty",
//       header: "QTY",
//       cell: ({ getValue }) => getValue() || "-",
//     },
//     {
//       accessorKey: "TotalSalesPrice",
//       header: "Total Sales Price",
//       cell: ({ getValue }) => formatCurrency(getValue()) || "-",
//     },
//     {
//       accessorKey: "COA",
//       header: "COA",
//       cell: ({ row }) => {
//         const itemNo = row.original.ItemNo;
//         const vendorBatchNum = row.original.VendorBatchNum;
//         const coaUrl = row.original.COA;
        
//         // Only show COA button if URL exists and is not empty
//         if (coaUrl && coaUrl.trim() !== '') {
//           return (
//             <Button
//               variant="link"
//               size="sm"
//               className="p-0 text-primary"
//               style={{ textDecoration: 'underline' }}
//               onClick={() => handleCOADownload(coaUrl, itemNo, vendorBatchNum)}
//             >
//               COA
//             </Button>
//           );
//         }

//         return null;
//       },
//     }
//   ];

//   const table = useReactTable({
//     data: invoiceData,
//     columns,
//     getCoreRowModel: getCoreRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),
//     state: {
//       globalFilter,
//     },
//     onGlobalFilterChange: setGlobalFilter,
//   });

//   return (
//     <Card className="shadow-sm border-0">
//       <Card.Header 
//         className="py-3 px-3 px-md-4"
//         style={{
//           backgroundColor: '#343a40',
//           color: 'white'
//         }}
//       >
//         <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between w-100 gap-3">
//           <h5 className="mb-0 text-white" style={{ fontSize: '1.1rem' }}>Items Shipped:</h5>
//           <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2 gap-sm-3 w-100 w-lg-auto">
//             <Form.Control
//               type="text"
//               placeholder="Search all columns..."
//               value={globalFilter}
//               onChange={(e) => setGlobalFilter(e.target.value)}
//               style={{ minWidth: '250px' }}
//               size="sm"
//               className="border-0"
//             />
//             <Button 
//               variant="success" 
//               size="sm"
//               onClick={onExportExcel} 
//               disabled={loading || isExporting}
//               className="px-3 flex-shrink-0"
//               style={{ whiteSpace: 'nowrap' }}
//             >
//               {isExporting ? (
//                 <>
//                   <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
//                   <span className="ms-2 d-none d-sm-inline">Exporting...</span>
//                 </>
//               ) : (
//                 <>
//                   <span className="d-none d-sm-inline">Export to Excel</span>
//                   <span className="d-sm-none">Excel</span>
//                 </>
//               )}
//             </Button>
//           </div>
//         </div>
//       </Card.Header>
//       <Card.Body className="p-0" style={{ backgroundColor: 'white' }}>
//         {loading ? (
//           <div className="d-flex justify-content-center my-5">
//             <div className="bg-white p-4 rounded shadow">
//               <Spinner animation="border" variant="primary" />
//               <span className="ms-2">Loading invoice details...</span>
//             </div>
//           </div>
//         ) : (
//           <div 
//             className="border rounded overflow-auto" 
//             style={{ height: "65vh" }}
//           >
//             <div className="table-responsive">
//               <table className="table table-striped table-hover mb-0">
//                 <thead 
//                   className="sticky-top"
//                   style={{
//                     backgroundColor: '#343a40',
//                     color: 'white'
//                   }}
//                 >
//                   {table.getHeaderGroups().map((headerGroup) => (
//                     <tr key={headerGroup.id}>
//                       {headerGroup.headers.map((header) => (
//                         <th 
//                           key={header.id} 
//                           className="px-2 px-md-4 py-3 text-nowrap"
//                           style={{
//                             backgroundColor: '#343a40',
//                             color: 'white',
//                             fontSize: '0.85rem',
//                             minWidth: header.id === 'ItemDescription' ? '200px' : 'auto'
//                           }}
//                         >
//                           {flexRender(
//                             header.column.columnDef.header,
//                             header.getContext()
//                           )}
//                         </th>
//                       ))}
//                     </tr>
//                   ))}
//                 </thead>
//                 <tbody>
//                   {table.getRowModel().rows.length === 0 ? (
//                     <tr>
//                       <td colSpan={columns.length} className="p-4 text-center">
//                         No items found matching your search criteria
//                       </td>
//                     </tr>
//                   ) : (
//                     table.getRowModel().rows.map((row) => (
//                       <tr key={row.id}>
//                         {row.getVisibleCells().map((cell) => (
//                           <td 
//                             key={cell.id} 
//                             className="px-2 px-md-4 py-2"
//                             style={{ 
//                               fontSize: '0.85rem',
//                               wordBreak: cell.column.id === 'ItemDescription' ? 'break-word' : 'normal',
//                               whiteSpace: cell.column.id === 'ItemDescription' ? 'normal' : 'nowrap'
//                             }}
//                           >
//                             {flexRender(
//                               cell.column.columnDef.cell,
//                               cell.getContext()
//                             )}
//                           </td>
//                         ))}
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}
//       </Card.Body>
//     </Card>
//   );
// }

// components/dispatch/InvoiceTable.js
import { Card, Form, Button, Spinner } from "react-bootstrap";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { formatCurrency } from "utils/formatCurrency";

export default function InvoiceTable({ 
  invoiceData, 
  loading, 
  globalFilter, 
  setGlobalFilter, 
  onExportExcel, 
  isExporting 
}) {
  
  const handleCOADownload = async (coaUrl, itemNo, vendorBatchNum) => {
    try {
      // Create a filename based on item code and batch number
      const filename = `COA_${itemNo}_${vendorBatchNum}.pdf`;
      
      // Create a temporary link and trigger download
      const a = document.createElement("a");
      a.href = coaUrl;
      a.download = filename;
      a.target = "_blank"; // Open in new tab as fallback
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
      }, 100);
    } catch (e) {
      console.error("Failed to download COA:", e);
      alert("Failed to download COA file.");
    }
  };

  const columns = [
    {
      accessorKey: "serialNo",
      header: "No.",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "ItemNo",
      header: "Item No.",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorKey: "ItemDescription",
      header: "Item/Service Description",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorKey: "CasNo",
      header: "CAS No.",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorKey: "Unit",
      header: "Unit",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorKey: "PackSize",
      header: "Pack Size",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorKey: "UnitSalesPrice",
      header: "Unit Sales Price",
      cell: ({ getValue }) => formatCurrency(getValue()) || "-",
    },
    {
      accessorKey: "Qty",
      header: "QTY",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorKey: "TotalSalesPrice",
      header: "Total Sales Price",
      cell: ({ getValue }) => formatCurrency(getValue()) || "-",
    },
    {
      accessorKey: "COA",
      header: "COA",
      cell: ({ row }) => {
        const itemNo = row.original.ItemNo;
        const vendorBatchNum = row.original.VendorBatchNum;
        const coaUrl = row.original.COA;
        const isCoaChecked = row.original.isCoaChecked;
        
        // Show loading state while checking COA availability
        if (!isCoaChecked) {
          return (
            <div className="d-flex align-items-center">
              <Spinner animation="border" size="sm" />
            </div>
          );
        }
        
        // Only show COA button if URL exists, is not empty, and has been verified as available
        if (coaUrl && coaUrl.trim() !== '') {
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
              onClick={() => handleCOADownload(coaUrl, itemNo, vendorBatchNum)}
            >
              COA
            </Button>
          );
        }

        // Show N/A if COA is not available
        return <span style={{ fontSize: '0.75rem', color: '#6c757d' }}> </span>;
      },
    }
  ];

  const table = useReactTable({
    data: invoiceData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <Card className="shadow-sm border-0">
      <Card.Header 
        className="py-3 px-3 px-md-4"
        style={{
          backgroundColor: '#343a40',
          color: 'white'
        }}
      >
        <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between w-100 gap-3">
          <h5 className="mb-0 text-white" style={{ fontSize: '1.1rem' }}>Items Shipped:</h5>
          <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2 gap-sm-3 w-100 w-lg-auto">
            <Form.Control
              type="text"
              placeholder="Search all columns..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              style={{ minWidth: '250px' }}
              size="sm"
              className="border-0"
            />
            <Button 
              variant="success" 
              size="sm"
              onClick={onExportExcel} 
              disabled={loading || isExporting}
              className="px-3 flex-shrink-0"
              style={{ whiteSpace: 'nowrap' }}
            >
              {isExporting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2 d-none d-sm-inline">Exporting...</span>
                </>
              ) : (
                <>
                  <span className="d-none d-sm-inline">Export to Excel</span>
                  <span className="d-sm-none">Excel</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card.Header>
      <Card.Body className="p-0" style={{ backgroundColor: 'white' }}>
        {loading ? (
          <div className="d-flex justify-content-center my-5">
            <div className="bg-white p-4 rounded shadow">
              <Spinner animation="border" variant="primary" />
              <span className="ms-2">Loading invoice details...</span>
            </div>
          </div>
        ) : (
          <div 
            className="border rounded overflow-auto" 
            style={{ height: "65vh" }}
          >
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead 
                  className="sticky-top"
                  style={{
                    backgroundColor: '#343a40',
                    color: 'white'
                  }}
                >
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th 
                          key={header.id} 
                          className="px-2 px-md-4 py-3 text-nowrap"
                          style={{
                            backgroundColor: '#343a40',
                            color: 'white',
                            fontSize: '0.85rem',
                            minWidth: header.id === 'ItemDescription' ? '200px' : 'auto'
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="p-4 text-center">
                        No items found matching your search criteria
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <td 
                            key={cell.id} 
                            className="px-2 px-md-4 py-2"
                            style={{ 
                              fontSize: '0.85rem',
                              wordBreak: cell.column.id === 'ItemDescription' ? 'break-word' : 'normal',
                              whiteSpace: cell.column.id === 'ItemDescription' ? 'normal' : 'nowrap'
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}