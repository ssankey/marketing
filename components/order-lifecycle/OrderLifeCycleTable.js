// // components/order-lifecycle/OrderLifecycleTable.js
// import React, { useState, useEffect, useMemo } from "react";
// import { 
//   Container,
//   Row,
//   Col,
//   Spinner,
//   Alert,
//   Card
// } from "react-bootstrap";
// import { useReactTable, getCoreRowModel, getFilteredRowModel, flexRender } from "@tanstack/react-table";
// import OrderLifecycleFilters from "./OrderLifecycleFilters";
// import OrderLifecyclePagination from "./OrderLifecyclePagination";
// import { tableColumns } from "./orderLifecycleColumns";
// import { 
//   useOrderLifecycleData,
//   useExportHandler
// } from "./orderLifecycleFunctions";

// const OrderLifecycleTable = ({
//   data = [],
//   isLoading = false,
//   initialPage = 1,
//   pageSize = 15,
// }) => {
//   const {
//     allData,
//     filteredData,
//     pageData,
//     pageCount,
//     currentPage,
//     setCurrentPage,
//     globalFilter,
//     setGlobalFilter,
//     handleReset,
//     setAllData 
//   } = useOrderLifecycleData(data, initialPage, pageSize);

//   const columns = useMemo(() => tableColumns(), []);

//   const { handleExportExcel } = useExportHandler();

//   const table = useReactTable({
//     data: pageData,
//     columns,
//     getCoreRowModel: getCoreRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),
//     manualPagination: true,
//     pageCount,
//     state: {
//       globalFilter,
//       pagination: {
//         pageIndex: currentPage - 1,
//         pageSize,
//       },
//     },
//     onGlobalFilterChange: setGlobalFilter,
//   });

//   const handleExport = React.useCallback(() => {
//     handleExportExcel(filteredData, columns);
//   }, [filteredData, columns, handleExportExcel]);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
//       <Container fluid className="py-4">
//         {/* Filters Card */}
//         <Card className="shadow-sm border-0 mb-4" style={{background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)'}}>
//           <Card.Body className="px-3 py-1">
//             <OrderLifecycleFilters
//               globalFilter={globalFilter}
//               onSearch={setGlobalFilter}
//               onReset={handleReset}
//               onExport={handleExport}
//             />
//           </Card.Body>
//         </Card>

//         {/* Main Table Card */}
//         <Card className="shadow-lg border-0 overflow-hidden">
//           <Card.Body className="p-0">
//             <div 
//               className="position-relative overflow-auto"
//               style={{ 
//                 maxHeight: "calc(100vh - 140px)",
//                 background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
//               }}
//             >
//               <table className="table table-hover mb-0" style={{ width: 'auto', minWidth: '100%' }}>
//                 <thead 
//                   className="sticky-top"
//                   style={{
//                     background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
//                     boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
//                   }}
//                 >
//                   {table.getHeaderGroups().map((headerGroup) => (
//                     <tr key={headerGroup.id}>
//                       {headerGroup.headers.map((header, index) => (
//                         <th
//                           key={header.id}
//                           className="text-white fw-semibold border-0 py-4 px-3"
//                           style={{
//                             fontSize: '0.875rem',
//                             letterSpacing: '0.025em',
//                             textTransform: 'uppercase',
//                             borderRight: index !== headerGroup.headers.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
//                             background: 'transparent',
//                             whiteSpace: 'nowrap',
//                             position: 'relative'
//                           }}
//                         >
//                           <div className="d-flex align-items-center gap-2">
//                             {flexRender(
//                               header.column.columnDef.header,
//                               header.getContext()
//                             )}
//                           </div>
//                         </th>
//                       ))}
//                     </tr>
//                   ))}
//                 </thead>
//                 <tbody>
//                   {table.getRowModel().rows.length > 0 ? (
//                     table.getRowModel().rows.map((row, rowIndex) => (
//                       <tr 
//                         key={row.id} 
//                         className="border-bottom"
//                         style={{
//                           background: rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc',
//                           transition: 'all 0.2s ease',
//                           borderBottom: '1px solid #e2e8f0'
//                         }}
//                         onMouseEnter={(e) => {
//                           e.target.closest('tr').style.background = '#e0f2fe';
//                           e.target.closest('tr').style.transform = 'translateY(-1px)';
//                           e.target.closest('tr').style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
//                         }}
//                         onMouseLeave={(e) => {
//                           e.target.closest('tr').style.background = rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc';
//                           e.target.closest('tr').style.transform = 'translateY(0)';
//                           e.target.closest('tr').style.boxShadow = 'none';
//                         }}
//                       >
//                         {row.getVisibleCells().map((cell, cellIndex) => (
//                           <td
//                             key={cell.id}
//                             className="py-3 px-3 align-middle border-0"
//                             style={{
//                               fontSize: '0.875rem',
//                               color: '#374151',
//                               borderRight: cellIndex !== row.getVisibleCells().length - 1 ? '1px solid #f1f5f9' : 'none',
//                               whiteSpace: 'nowrap',
//                               minWidth: '100px'
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
//                   ) : (
//                     <tr>
//                       <td colSpan={columns.length} className="text-center py-5">
//                         <div className="d-flex flex-column align-items-center justify-content-center" style={{minHeight: '200px'}}>
//                           {isLoading ? (
//                             <>
//                               <Spinner animation="border" variant="primary" className="mb-3" />
//                               <h5 className="text-muted mb-2">Loading order lifecycle data...</h5>
//                               <p className="text-muted small mb-0">Please wait while we fetch your data</p>
//                             </>
//                           ) : (
//                             <>
//                               <div 
//                                 className="rounded-circle d-flex align-items-center justify-content-center mb-3"
//                                 style={{
//                                   width: '80px',
//                                   height: '80px',
//                                   background: 'linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%)'
//                                 }}
//                               >
//                                 <i className="bi bi-inbox text-info" style={{fontSize: '2rem'}}></i>
//                               </div>
//                               <h5 className="text-muted mb-2">No order lifecycle data found</h5>
//                               <p className="text-muted small mb-0">Try adjusting your search criteria or filters</p>
//                             </>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>

//               {isLoading && (
//                 <div 
//                   className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
//                   style={{
//                     background: 'rgba(255, 255, 255, 0.8)',
//                     backdropFilter: 'blur(2px)',
//                     zIndex: 10
//                   }}
//                 >
//                   <div className="text-center">
//                     <Spinner animation="border" variant="primary" style={{width: '3rem', height: '3rem'}} />
//                     <p className="mt-3 mb-0 fw-medium text-primary">Loading order lifecycle data...</p>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </Card.Body>

//           <Card.Footer 
//             className="bg-white border-0 py-3"
//             style={{
//               background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
//               borderTop: '1px solid #e2e8f0'
//             }}
//           >
//             <OrderLifecyclePagination
//               currentPage={currentPage}
//               pageCount={pageCount}
//               filteredCount={filteredData.length}
//               onPageChange={setCurrentPage}
//             />
//           </Card.Footer>
//         </Card>
//       </Container>
//     </div>
//   );
// };

// export default OrderLifecycleTable;

// components/order-lifecycle/OrderLifecycleTable.js
import React, { useState, useEffect, useMemo } from "react";
import { 
  Container,
  Row,
  Col,
  Spinner,
  Alert,
  Card
} from "react-bootstrap";
import { useReactTable, getCoreRowModel, getFilteredRowModel, flexRender } from "@tanstack/react-table";
import OrderLifecycleFilters from "./OrderLifecycleFilters";
import OrderLifecyclePagination from "./OrderLifecyclePagination";
import { tableColumns } from "./orderLifecycleColumns";
import { 
  useOrderLifecycleData,
  useExportHandler
} from "./orderLifecycleFunctions";

const OrderLifecycleTable = ({
  data = [],
  isLoading = false,
  initialPage = 1,
  pageSize = 15,
}) => {
  const {
    allData,
    filteredData,
    pageData,
    pageCount,
    currentPage,
    setCurrentPage,
    globalFilter,
    setGlobalFilter,
    handleReset,
    setAllData,
    daysFilters,
    handleDaysFilterChange
  } = useOrderLifecycleData(data, initialPage, pageSize);

  const columns = useMemo(() => tableColumns(), []);

  const { handleExportExcel } = useExportHandler();

  const table = useReactTable({
    data: pageData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount,
    state: {
      globalFilter,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const handleExport = React.useCallback(() => {
    handleExportExcel(filteredData, columns);
  }, [filteredData, columns, handleExportExcel]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Container fluid className="py-4">
        {/* Filters Card */}
        <Card className="shadow-sm border-0 mb-4" style={{background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)'}}>
          <Card.Body className="px-3 py-3">
            <OrderLifecycleFilters
              globalFilter={globalFilter}
              onSearch={setGlobalFilter}
              onReset={handleReset}
              onExport={handleExport}
              daysFilters={daysFilters}
              onDaysFilterChange={handleDaysFilterChange}
            />
          </Card.Body>
        </Card>

        {/* Main Table Card */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <Card.Body className="p-0">
            <div 
              className="position-relative overflow-auto"
              style={{ 
                maxHeight: "calc(100vh - 200px)",
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
              }}
            >
              <table className="table table-hover mb-0" style={{ width: 'auto', minWidth: '100%' }}>
                <thead 
                  className="sticky-top"
                  style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                  }}
                >
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header, index) => (
                        <th
                          key={header.id}
                          className="text-white fw-semibold border-0 py-4 px-3"
                          style={{
                            fontSize: '0.875rem',
                            letterSpacing: '0.025em',
                            textTransform: 'uppercase',
                            borderRight: index !== headerGroup.headers.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                            background: 'transparent',
                            whiteSpace: 'nowrap',
                            position: 'relative'
                          }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row, rowIndex) => (
                      <tr 
                        key={row.id} 
                        className="border-bottom"
                        style={{
                          background: rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc',
                          transition: 'all 0.2s ease',
                          borderBottom: '1px solid #e2e8f0'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.background = '#e0f2fe';
                          e.target.closest('tr').style.transform = 'translateY(-1px)';
                          e.target.closest('tr').style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.background = rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc';
                          e.target.closest('tr').style.transform = 'translateY(0)';
                          e.target.closest('tr').style.boxShadow = 'none';
                        }}
                      >
                        {row.getVisibleCells().map((cell, cellIndex) => (
                          <td
                            key={cell.id}
                            className="py-3 px-3 align-middle border-0"
                            style={{
                              fontSize: '0.875rem',
                              color: '#374151',
                              borderRight: cellIndex !== row.getVisibleCells().length - 1 ? '1px solid #f1f5f9' : 'none',
                              whiteSpace: 'nowrap',
                              minWidth: '100px'
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
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-5">
                        <div className="d-flex flex-column align-items-center justify-content-center" style={{minHeight: '200px'}}>
                          {isLoading ? (
                            <>
                              <Spinner animation="border" variant="primary" className="mb-3" />
                              <h5 className="text-muted mb-2">Loading order lifecycle data...</h5>
                              <p className="text-muted small mb-0">Please wait while we fetch your data</p>
                            </>
                          ) : (
                            <>
                              <div 
                                className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                                style={{
                                  width: '80px',
                                  height: '80px',
                                  background: 'linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%)'
                                }}
                              >
                                <i className="bi bi-inbox text-info" style={{fontSize: '2rem'}}></i>
                              </div>
                              <h5 className="text-muted mb-2">No order lifecycle data found</h5>
                              <p className="text-muted small mb-0">Try adjusting your search criteria or filters</p>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {isLoading && (
                <div 
                  className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(2px)',
                    zIndex: 10
                  }}
                >
                  <div className="text-center">
                    <Spinner animation="border" variant="primary" style={{width: '3rem', height: '3rem'}} />
                    <p className="mt-3 mb-0 fw-medium text-primary">Loading order lifecycle data...</p>
                  </div>
                </div>
              )}
            </div>
          </Card.Body>

          <Card.Footer 
            className="bg-white border-0 py-3"
            style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
              borderTop: '1px solid #e2e8f0'
            }}
          >
            <OrderLifecyclePagination
              currentPage={currentPage}
              pageCount={pageCount}
              filteredCount={filteredData.length}
              onPageChange={setCurrentPage}
            />
          </Card.Footer>
        </Card>
      </Container>
    </div>
  );
};

export default OrderLifecycleTable;