// // components/order-lifecycle/OrderLifecycleFilters.js
// import React from "react";
// import { Row, Col, Button, InputGroup, Form } from "react-bootstrap";

// const OrderLifecycleFilters = ({
//   globalFilter,
//   onSearch,
//   onReset,
//   onExport,
// }) => {
//   const commonStyle = {
//     height: "36px",
//     fontSize: "0.9rem",
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
//         </Col>

//         <Col lg={4} md={12} className="d-flex justify-content-center">
//           <InputGroup style={{ maxWidth: "400px", minWidth: "280px", width: "100%" }}>
//             <Form.Control
//               type="text"
//               value={globalFilter}
//               onChange={(e) => onSearch(e.target.value)}
//               placeholder="Search order lifecycle..."
//               size="sm"
//               style={commonStyle}
//             />
//           </InputGroup>
//         </Col>

//         <Col lg={4} md={5} className="d-flex align-items-center justify-content-end gap-2">
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

// export default OrderLifecycleFilters;


// components/order-lifecycle/OrderLifecycleFilters.js
import React from "react";
import { Row, Col, Button, InputGroup, Form } from "react-bootstrap";

const OrderLifecycleFilters = ({
  globalFilter,
  onSearch,
  onReset,
  onExport,
  daysFilters,
  onDaysFilterChange,
}) => {
  const commonStyle = {
    height: "36px",
    fontSize: "0.9rem",
  };

  const daysColumns = [
    { key: 'PO_to_GRN_Days', label: 'PO to GRN' },
    { key: 'GRN_to_Invoice_Days', label: 'GRN to Invoice' },
    { key: 'Invoice_to_Dispatch_Days', label: 'Invoice to Dispatch' }
  ];

  return (
    <div className="mt-2 mb-2">
      {/* First Row - Main Controls */}
      <Row className="align-items-center g-2 mb-3">
        <Col lg={4} md={5} className="d-flex align-items-center gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            style={commonStyle}
            onClick={onReset}
          >
            Reset
          </Button>
        </Col>

        <Col lg={4} md={12} className="d-flex justify-content-center">
          <InputGroup style={{ maxWidth: "400px", minWidth: "280px", width: "100%" }}>
            <Form.Control
              type="text"
              value={globalFilter}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search order lifecycle..."
              size="sm"
              style={commonStyle}
            />
          </InputGroup>
        </Col>

        <Col lg={4} md={5} className="d-flex align-items-center justify-content-end gap-2">
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

      {/* Second Row - Days Filters */}
      <Row className="g-2">
        {daysColumns.map((column) => (
          <Col lg={4} md={6} key={column.key}>
            <div className="border rounded p-2 bg-light">
              <div className="fw-semibold mb-2 text-center" style={{ fontSize: '0.85rem', color: '#495057' }}>
                {column.label} (Days)
              </div>
              <Row className="g-1">
                <Col>
                  <InputGroup size="sm">
                    <InputGroup.Text style={{ fontSize: '0.75rem', minWidth: '50px' }}>
                      After
                    </InputGroup.Text>
                    <Form.Control
                      type="number"
                      min="0"
                      placeholder="0"
                      value={daysFilters[column.key]?.after || ''}
                      onChange={(e) => onDaysFilterChange(column.key, 'after', e.target.value)}
                      style={{ fontSize: '0.8rem' }}
                    />
                  </InputGroup>
                </Col>
                <Col>
                  <InputGroup size="sm">
                    <InputGroup.Text style={{ fontSize: '0.75rem', minWidth: '55px' }}>
                      Before
                    </InputGroup.Text>
                    <Form.Control
                      type="number"
                      min="0"
                      placeholder="∞"
                      value={daysFilters[column.key]?.before || ''}
                      onChange={(e) => onDaysFilterChange(column.key, 'before', e.target.value)}
                      style={{ fontSize: '0.8rem' }}
                    />
                  </InputGroup>
                </Col>
              </Row>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default OrderLifecycleFilters;