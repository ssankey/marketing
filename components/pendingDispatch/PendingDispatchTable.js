// components/pendingDispatch/PendingDispatchTable.js
import React, { useMemo } from "react";
import { 
  Container,
  Spinner,
  Card
} from "react-bootstrap";
import { useReactTable, getCoreRowModel, getFilteredRowModel, flexRender } from "@tanstack/react-table";
import PendingDispatchFilters from "./PendingDispatchFilters";
import PendingDispatchPagination from "./PendingDispatchPagination";
import { tableColumns } from "./pendingDispatchColumns";
import { 
  usePendingDispatchData,
  useExportHandler
} from "./pendingDispatchFunctions";

const PendingDispatchTable = ({
  invoices = [],
  isLoading = false,
  initialStatus = "all",
  initialPage = 1,
  pageSize = 20,
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
    statusFilter,
    setStatusFilter,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    handleReset,
    setAllData 
  } = usePendingDispatchData(invoices, initialStatus, initialPage, pageSize);

  const columns = React.useMemo(() => tableColumns, []);

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
          <Card.Body className="px-3 py-1">
            <PendingDispatchFilters
              globalFilter={globalFilter}
              statusFilter={statusFilter}
              fromDate={fromDate}
              toDate={toDate}
              onSearch={setGlobalFilter}
              onStatusChange={setStatusFilter}
              onDateChange={(type, value) => 
                type === "from" ? setFromDate(value) : setToDate(value)
              }
              onReset={handleReset}
              onExport={handleExport}
            />
          </Card.Body>
        </Card>

        {/* Main Table Card */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <Card.Body className="p-0">
            <div 
              className="position-relative overflow-auto"
              style={{ 
                maxHeight: "calc(100vh - 140px)",
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
                              <h5 className="text-muted mb-2">Loading invoices...</h5>
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
                              <h5 className="text-muted mb-2">No invoices found</h5>
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
                    <p className="mt-3 mb-0 fw-medium text-primary">Loading invoices...</p>
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
            <PendingDispatchPagination
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

export default PendingDispatchTable;