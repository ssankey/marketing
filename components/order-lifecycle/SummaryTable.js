// components/order-lifecycle/SummaryTable.js
import React, { useRef, useEffect } from 'react';
import downloadExcel from "utils/exporttoexcel";

const SummaryTable = ({ 
  processedChartData, 
  dayRanges, 
  onBarClick,
  chartType
}) => {
  const tableScrollRef = useRef(null);

  // Scroll table to right on data change
  useEffect(() => {
    if (tableScrollRef.current && processedChartData.length > 0) {
      const scrollContainer = tableScrollRef.current;
      // Small delay to ensure table is rendered
      setTimeout(() => {
        scrollContainer.scrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
      }, 100);
    }
  }, [processedChartData]);

  // Get table title based on chart type
  const getTableTitle = () => {
    switch (chartType) {
      case 'po-to-grn':
        return 'PO to GRN Summary Table';
      case 'grn-to-invoice':
        return 'GRN to Invoice Summary Table';
      case 'invoice-to-dispatch':
        return 'Invoice to Dispatch Summary Table';
      default:
        return 'Order Lifecycle Summary Table';
    }
  };

  // Export summary table to Excel
  const handleExportSummaryTable = () => {
    // Prepare data for export
    const exportData = [];

    // Add data rows for each range
    dayRanges.forEach(range => {
      const row = {
        'Range / Month': range.label,
        ...processedChartData.reduce((acc, month) => {
          acc[`${month.monthName}-${month.year}`] = month.ranges[range.label]?.count || 0;
          return acc;
        }, {})
      };
      exportData.push(row);
    });

    // Add total row
    const totalRow = {
      'Range / Month': 'Total',
      ...processedChartData.reduce((acc, month) => {
        const total = dayRanges.reduce((sum, range) => 
          sum + (month.ranges[range.label]?.count || 0), 0
        );
        acc[`${month.monthName}-${month.year}`] = total;
        return acc;
      }, {})
    };
    exportData.push(totalRow);

    // Generate filename based on chart type
    const filename = `${chartType.replace('-', '_')}_Summary_Table`;
    downloadExcel(exportData, filename);
  };

  if (!processedChartData.length) {
    return null;
  }

  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0" style={{ fontWeight: 600, color: "#212529" }}>
          {getTableTitle()}
        </h5>
        <button 
          className="btn btn-primary btn-sm d-flex align-items-center"
          onClick={handleExportSummaryTable}
          style={{ borderRadius: "8px" }}
        >
          <i className="fas fa-file-excel me-1"></i>
          Export Summary Table
        </button>
      </div>
      
      <div className="position-relative">
        <div 
          className="table-responsive" 
          ref={tableScrollRef}
          style={{ 
            maxHeight: '400px',
            overflowX: 'auto',
            overflowY: 'auto'
          }}
        >
          <table className="table table-bordered table-striped table-sm">
            <thead className="table-dark position-sticky" style={{ top: 0, zIndex: 10 }}>
              <tr>
                <th 
                  style={{ 
                    minWidth: '120px',
                    position: 'sticky',
                    left: 0,
                    backgroundColor: '#212529',
                    color: '#ffffff',
                    zIndex: 11
                  }}
                >
                  Range / Month
                </th>
                {processedChartData.map(month => (
                  <th key={`${month.monthName}-${month.year}`} 
                      className="text-center" 
                      style={{ minWidth: '100px', color: '#ffffff' }}>
                    {month.monthName}-{month.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dayRanges.map(range => (
                <tr key={range.label}>
                  <td 
                    className="fw-bold"
                    style={{ 
                      position: 'sticky',
                      left: 0,
                      backgroundColor: '#fff',
                      zIndex: 5,
                      borderRight: '2px solid #dee2e6'
                    }}
                  >
                    {range.label}
                  </td>
                  {processedChartData.map(month => {
                    // Safety check: ensure the range exists in the month data
                    const rangeData = month.ranges && month.ranges[range.label] 
                      ? month.ranges[range.label] 
                      : { count: 0, records: [] };
                    
                    return (
                      <td 
                        key={`${month.monthName}-${month.year}`}
                        className="text-center"
                        style={{ 
                          cursor: rangeData.count > 0 ? 'pointer' : 'default',
                          backgroundColor: rangeData.count > 0 ? '#f8f9fa' : 'transparent'
                        }}
                        onClick={() => {
                          if (rangeData.count > 0) {
                            onBarClick(month, range.label);
                          }
                        }}
                        title={rangeData.count > 0 ? `Click to view ${rangeData.count} records` : ''}
                      >
                        {rangeData.count}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot className="table-secondary">
              <tr>
                <th 
                  style={{ 
                    position: 'sticky',
                    left: 0,
                    backgroundColor: '#e9ecef',
                    zIndex: 5,
                    borderRight: '2px solid #dee2e6'
                  }}
                >
                  Total
                </th>
                {processedChartData.map(month => {
                  // Safety check for total calculation
                  const total = dayRanges.reduce((sum, range) => {
                    const rangeData = month.ranges && month.ranges[range.label] 
                      ? month.ranges[range.label]
                      : { count: 0 };
                    return sum + rangeData.count;
                  }, 0);
                  
                  return (
                    <th 
                      key={`total-${month.monthName}-${month.year}`}
                      className="text-center"
                      style={{ backgroundColor: '#e9ecef' }}
                    >
                      {total}
                    </th>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SummaryTable;