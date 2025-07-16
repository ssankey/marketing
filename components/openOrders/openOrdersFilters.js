// // components/openOrders/OpenOrdersFilters.js
// import React from "react";
// import { Row, Col, Button, ButtonGroup, InputGroup, Form } from "react-bootstrap";

// const OpenOrdersFilters = ({
//   globalFilter,
//   statusFilter,
//   fromDate,
//   toDate,
//   onSearch,
//   onStatusChange,
//   onDateChange,
//   onReset,
//   onExport,
// }) => {
//   const commonStyle = {
//     height: "36px",
//     fontSize: "0.9rem",
//   };

//   const headerColors = {
//     background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
//     color: '#ffffff'
//   };

//   return (
//     <div className="mt-2 mb-2">
//       <Row className="align-items-center g-2">
//         <Col lg={4} md={5} className="d-flex align-items-center gap-2">
//           <Button
//             variant="outline-secondary"
//             size="sm"
//             style={commonStyle}
//             onClick={onReset}
//           >
//             Reset
//           </Button>

//           <ButtonGroup size="sm" className="flex-grow-1">
//             {["All", "In Stock", "Out of Stock"].map((status, index) => (
//               <Button
//                 key={status}
//                 variant={statusFilter === status.toLowerCase().replace(' ', '') || (status === "All" && statusFilter === "all") ? "primary" : "outline-primary"}
//                 onClick={() => onStatusChange(status === "All" ? "all" : status.toLowerCase().replace(' ', ''))}
//                 style={{
//                   ...commonStyle,
//                   flex: 1,
//                   minWidth: 0,
//                   padding: "0 8px",
//                   ...(statusFilter === status.toLowerCase().replace(' ', '') || (status === "All" && statusFilter === "all") ? {
//                     background: headerColors.background,
//                     color: headerColors.color,
//                     border: 'none'
//                   } : {borderColor: '#1e293b', color: '#1e293b'})
//                 }}
//                 className="text-truncate"
//               >
//                 {status}
//               </Button>
//             ))}
//           </ButtonGroup>
//         </Col>

//         <Col lg={4} md={12} className="d-flex justify-content-center">
//           <InputGroup style={{ maxWidth: "400px", minWidth: "280px", width: "100%" }}>
//             <Form.Control
//               type="text"
//               value={globalFilter}
//               onChange={(e) => onSearch(e.target.value)}
//               placeholder="Search open orders..."
//               size="sm"
//               style={commonStyle}
//             />
//           </InputGroup>
//         </Col>

//         <Col lg={4} md={5} className="d-flex align-items-center justify-content-end gap-2">
//           <div className="d-flex align-items-center gap-1">
//             <Form.Label className="mb-0 small" style={{ fontSize: "0.75rem" }}>From:</Form.Label>
//             <Form.Control
//               type="date"
//               value={fromDate}
//               onChange={(e) => onDateChange("from", e.target.value)}
//               size="sm"
//               style={{ width: "140px", ...commonStyle }}
//             />
//           </div>

//           <div className="d-flex align-items-center gap-1">
//             <Form.Label className="mb-0 small" style={{ fontSize: "0.75rem" }}>To:</Form.Label>
//             <Form.Control
//               type="date"
//               value={toDate}
//               onChange={(e) => onDateChange("to", e.target.value)}
//               size="sm"
//               style={{ width: "140px", ...commonStyle }}
//             />
//           </div>

//           <Button
//             onClick={onExport}
//             variant="success"
//             size="sm"
//             style={{ ...commonStyle, padding: "0 16px" }}
//           >
//             Export
//           </Button>
//         </Col>
//       </Row>
//     </div>
//   );
// };

// export default OpenOrdersFilters;

// components/openOrders/OpenOrdersFilters.js
import React from "react";
import { Row, Col, Button, ButtonGroup, InputGroup, Form } from "react-bootstrap";

const OpenOrdersFilters = ({
  globalFilter,
  statusFilter,
  fromDate,
  toDate,
  selectedMonth,
  orders = [],
  onSearch,
  onStatusChange,
  onDateChange,
  onMonthChange,
  onReset,
  onExport,
}) => {
  const commonStyle = {
    height: "36px",
    fontSize: "0.9rem",
  };

  const headerColors = {
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    color: '#ffffff'
  };

  // Format month for display
  const formatMonthDisplay = (monthValue) => {
    if (!monthValue) return "";
    const [year, month] = monthValue.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  // Generate available months from order date range
  const getAvailableMonths = () => {
    if (!orders || orders.length === 0) return [];

    // Extract all order dates and find min/max
    const orderDates = orders
      .map(order => {
        if (!order.PostingDate) return null;
        
        let date;
        if (order.PostingDate instanceof Date) {
          date = order.PostingDate;
        } else if (typeof order.PostingDate === 'string') {
          date = new Date(order.PostingDate);
          
          if (isNaN(date.getTime())) {
            const dateParts = order.PostingDate.split(/[-/]/);
            if (dateParts.length === 3) {
              const formats = [
                new Date(dateParts[2], dateParts[1] - 1, dateParts[0]), // DD/MM/YYYY
                new Date(dateParts[2], dateParts[0] - 1, dateParts[1]), // MM/DD/YYYY
                new Date(dateParts[0], dateParts[1] - 1, dateParts[2])  // YYYY/MM/DD
              ];
              
              for (const format of formats) {
                if (!isNaN(format.getTime())) {
                  date = format;
                  break;
                }
              }
            }
          }
        } else if (typeof order.PostingDate === 'number') {
          date = new Date(order.PostingDate);
        } else {
          return null;
        }
        
        return date && !isNaN(date.getTime()) ? date : null;
      })
      .filter(date => date && !isNaN(date.getTime()))
      .sort((a, b) => a - b);

    if (orderDates.length === 0) return [];

    const minDate = orderDates[0];
    const maxDate = orderDates[orderDates.length - 1];
    
    // Generate all months between min and max date
    const months = [];
    const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

    while (current <= end) {
      const year = current.getFullYear();
      const month = current.getMonth();
      
      const monthName = current.toLocaleDateString('en-US', { month: 'short' });
      const displayText = `${monthName} ${year}`;
      const value = `${year}-${String(month + 1).padStart(2, '0')}`;
      
      months.push({
        value: value,
        display: displayText
      });

      current.setMonth(current.getMonth() + 1);
    }

    return months.reverse(); // Show recent months first
  };

  const availableMonths = getAvailableMonths();

  return (
    <div className="mt-2 mb-2">
      <Row className="align-items-center g-2">
        <Col lg={4} md={5} className="d-flex align-items-center gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            style={commonStyle}
            onClick={onReset}
          >
            Reset
          </Button>

          <ButtonGroup size="sm" className="flex-grow-1">
            {["All", "In Stock", "Out of Stock"].map((status, index) => (
              <Button
                key={status}
                variant={statusFilter === status.toLowerCase().replace(' ', '') || (status === "All" && statusFilter === "all") ? "primary" : "outline-primary"}
                onClick={() => onStatusChange(status === "All" ? "all" : status.toLowerCase().replace(' ', ''))}
                style={{
                  ...commonStyle,
                  flex: 1,
                  minWidth: 0,
                  padding: "0 8px",
                  ...(statusFilter === status.toLowerCase().replace(' ', '') || (status === "All" && statusFilter === "all") ? {
                    background: headerColors.background,
                    color: headerColors.color,
                    border: 'none'
                  } : {borderColor: '#1e293b', color: '#1e293b'})
                }}
                className="text-truncate"
              >
                {status}
              </Button>
            ))}
          </ButtonGroup>
        </Col>

        <Col lg={4} md={12} className="d-flex justify-content-center">
          <InputGroup style={{ maxWidth: "400px", minWidth: "280px", width: "100%" }}>
            <Form.Control
              type="text"
              value={globalFilter}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search open orders..."
              size="sm"
              style={commonStyle}
            />
          </InputGroup>
        </Col>

        <Col lg={4} md={5} className="d-flex align-items-center justify-content-end gap-2">
          <div className="d-flex align-items-center gap-1">
            <Form.Label className="mb-0 small" style={{ fontSize: "0.75rem" }}>Month:</Form.Label>
            <Form.Select
              value={selectedMonth || ""}
              onChange={(e) => onMonthChange(e.target.value)}
              size="sm"
              style={{ width: "160px", ...commonStyle }}
            >
              <option value="">All Months</option>
              {availableMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {formatMonthDisplay(month.value)}
                </option>
              ))}
            </Form.Select>
          </div>

          <Button
            onClick={onExport}
            variant="success"
            size="sm"
            style={{ ...commonStyle, padding: "0 16px" }}
          >
            Export
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default OpenOrdersFilters;