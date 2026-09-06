// components/openDO/OpenDOTable.js
// "Open DO" — line-level Delivery Orders table, rendered below Open Orders
// on pages/open-orders/index.js. Same visual pattern (dark gradient sticky
// header, hover-highlighted rows, Card wrapper) as
// components/openOrders/openOrdersTable.js, since it sits directly under
// that table on the same page. Reuses OpenOrdersPagination as-is (a plain,
// domain-agnostic pagination footer).

import React, { useMemo } from "react";
import { Container, Spinner, Alert, Card } from "react-bootstrap";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import OpenDOFilters from "./OpenDOFilters";
import OpenOrdersPagination from "../openOrders/openOrdersPagination";
import { tableColumns } from "./openDOColumns";
import { useOpenDOData } from "./openDOFunctions";

const OpenDOTable = ({ initialStatus = "open", initialPage = 1, pageSize = 20 }) => {
  const {
    deliveryOrdersLine,
    totalItems,
    totalPages,
    currentPage,
    loading,
    error,
    globalFilter,
    statusFilter,
    selectedMonth,
    setGlobalFilter,
    setStatusFilter,
    setSelectedMonth,
    handlePageChange,
    handleExportExcel,
    setError,
  } = useOpenDOData(initialStatus, initialPage, pageSize);

  const columns = useMemo(() => tableColumns(), []);

  const table = useReactTable({
    data: deliveryOrdersLine,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    state: { pagination: { pageIndex: currentPage - 1, pageSize } },
  });

  const handleExport = React.useCallback(() => handleExportExcel(columns), [handleExportExcel, columns]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Container fluid className="pb-4 pt-3">
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
            {error}
          </Alert>
        )}

        <Card className="shadow-sm border-0 mb-4" style={{ background: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(10px)" }}>
          <Card.Body className="px-3 py-1">
            <OpenDOFilters
              globalFilter={globalFilter}
              statusFilter={statusFilter}
              selectedMonth={selectedMonth}
              onSearch={setGlobalFilter}
              onStatusChange={setStatusFilter}
              onMonthChange={setSelectedMonth}
              onExport={handleExport}
            />
          </Card.Body>
        </Card>

        <Card className="shadow-lg border-0 overflow-hidden">
          <Card.Body className="p-0">
            <div
              className="position-relative overflow-auto"
              style={{ maxHeight: "calc(100vh - 140px)", background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)" }}
            >
              <table className="table table-hover mb-0" style={{ width: "auto", minWidth: "100%" }}>
                <thead
                  className="sticky-top"
                  style={{ background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
                >
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header, index) => (
                        <th
                          key={header.id}
                          className="text-white fw-semibold border-0 py-4 px-3"
                          style={{
                            fontSize: "0.875rem",
                            letterSpacing: "0.025em",
                            textTransform: "uppercase",
                            borderRight: index !== headerGroup.headers.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none",
                            background: "transparent",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {deliveryOrdersLine.length > 0 ? (
                    table.getRowModel().rows.map((row, rowIndex) => (
                      <tr
                        key={row.id}
                        className="border-bottom"
                        style={{ background: rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc", transition: "all 0.2s ease", borderBottom: "1px solid #e2e8f0" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#e0f2fe";
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc";
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        {row.getVisibleCells().map((cell, cellIndex) => (
                          <td
                            key={cell.id}
                            className="py-3 px-3 align-middle border-0"
                            style={{
                              fontSize: "0.875rem",
                              color: "#374151",
                              borderRight: cellIndex !== row.getVisibleCells().length - 1 ? "1px solid #f1f5f9" : "none",
                              whiteSpace: "nowrap",
                              minWidth: "100px",
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-5">
                        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "200px" }}>
                          {loading ? (
                            <>
                              <Spinner animation="border" variant="primary" className="mb-3" />
                              <h5 className="text-muted mb-2">Loading delivery orders...</h5>
                            </>
                          ) : (
                            <>
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                                style={{ width: "80px", height: "80px", background: "linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%)" }}
                              >
                                <i className="bi bi-truck text-info" style={{ fontSize: "2rem" }}></i>
                              </div>
                              <h5 className="text-muted mb-2">No delivery orders found</h5>
                              <p className="text-muted small mb-0">Try adjusting your search criteria or filters</p>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {loading && deliveryOrdersLine.length > 0 && (
                <div
                  className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                  style={{ background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(2px)", zIndex: 10 }}
                >
                  <div className="text-center">
                    <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem" }} />
                    <p className="mt-3 mb-0 fw-medium text-primary">Loading delivery orders...</p>
                  </div>
                </div>
              )}
            </div>
          </Card.Body>

          <Card.Footer className="bg-white border-0 py-3" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)", borderTop: "1px solid #e2e8f0" }}>
            <OpenOrdersPagination
              currentPage={currentPage}
              pageCount={totalPages}
              filteredCount={totalItems}
              onPageChange={handlePageChange}
            />
          </Card.Footer>
        </Card>
      </Container>
    </div>
  );
};

export default OpenDOTable;
