// import React from 'react';
// import { Row, Col, Card, Badge } from 'react-bootstrap';
// import {
//     Cart4,
//     GraphUpArrow,
//     ExclamationCircle,
//     ArrowUpShort,
//     ArrowDownShort,
// } from 'react-bootstrap-icons';
// import { MdOutlineCurrencyRupee } from 'react-icons/md';

// // Enhanced color palette
// const colors = {
//     primary: '#124f94', // Updated primary color
//     success: '#3bac4e', // Updated success (secondary) color
//     warning: '#ffc107',
//     danger: '#dc3545',
//     muted: '#6c757d',
// };

// // Icon Rendering Functions
// const renderIcon = (icon, color) => {
//     const iconComponents = {
//         RupeeIcon: () => (
//             <div className="rounded-circle p-2" style={{ backgroundColor: `${colors[color]}15` }}>
//                 <MdOutlineCurrencyRupee size={24} color={colors[color]} />
//             </div>
//         ),
//         Cart4: () => (
//             <div className="rounded-circle p-2" style={{ backgroundColor: `${colors[color]}15` }}>
//                 <Cart4 size={24} color={colors[color]} />
//             </div>
//         ),
//         GraphUpArrow: () => (
//             <div className="rounded-circle p-2" style={{ backgroundColor: `${colors[color]}15` }}>
//                 <GraphUpArrow size={24} color={colors[color]} />
//             </div>
//         ),
//         ExclamationCircle: () => (
//             <div className="rounded-circle p-2" style={{ backgroundColor: `${colors[color]}15` }}>
//                 <ExclamationCircle size={24} color={colors[color]} />
//             </div>
//         ),
//     };

//     return iconComponents[icon] ? iconComponents[icon]() : null;
// };

// const KPICard = ({ title, value, icon, color, trend, trendValue }) => (
//     <Card
//         className="h-100 shadow-sm border-0"
//         style={{
//             transition: 'transform 0.2s ease, box-shadow 0.2s ease',
//             cursor: 'pointer',
//         }}
//         onMouseEnter={(e) => {
//             e.currentTarget.style.transform = 'translateY(-5px)';
//             e.currentTarget.style.boxShadow = '0 .5rem 1rem rgba(0,0,0,.15)';
//         }}
//         onMouseLeave={(e) => {
//             e.currentTarget.style.transform = 'translateY(0)';
//             e.currentTarget.style.boxShadow = '0 .125rem .25rem rgba(0,0,0,.075)';
//         }}
//     >
//         <Card.Body className="p-4">
//             {/* Icon and Trend Badge Row */}
//             <div className="d-flex justify-content-between align-items-center mb-3">
//                 {renderIcon(icon, color)}
//                 {trendValue !== null && (
//                     <Badge
//                         bg={trend === 'up' ? 'success' : 'danger'}
//                         className="d-flex align-items-center gap-1 px-2 py-1"
//                         style={{ fontSize: '0.8rem' }}
//                     >
//                         {trend === 'up' ? <ArrowUpShort size={16} /> : <ArrowDownShort size={16} />}
//                         {trendValue}%
//                     </Badge>
//                 )}
//             </div>

//             {/* Value and Title */}
//             <h3 className="mb-2 fw-bold" style={{ color: colors[color], fontSize: '1.75rem' }}>
//                 {value || 0}
//             </h3>
//             <p
//                 className="text-muted mb-0"
//                 style={{
//                     fontSize: '0.875rem',
//                     letterSpacing: '0.5px',
//                     fontWeight: '500',
//                 }}
//             >
//                 {title}
//             </p>
//         </Card.Body>
//     </Card>
// );


// const KPISection = ({ kpiData = [], dateFilter, startDate, endDate }) => (
//   <Row className="g-4 mb-4">
//     {kpiData.map((card, index) => (
//       <Col key={index} xs={12} sm={6} xl={3}>
//         <KPICard
//           title={card.title}
//           value={card.value}
//           icon={card.icon}
//           color={card.color}
//           trend={card.trend}
//           trendValue={card.trendValue}
//           dateFilter={dateFilter}
//           startDate={startDate}
//           endDate={endDate}
//         />
//       </Col>
//     ))}
//   </Row>
// );



// export default KPISection;

// components/KPISection.js
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Row, Col, Card, Badge } from 'react-bootstrap';
import {
    Cart4,
    GraphUpArrow,
    ExclamationCircle,
    ArrowUpShort,
    ArrowDownShort,
} from 'react-bootstrap-icons';
import { MdOutlineCurrencyRupee } from 'react-icons/md';
import SalesModal from './KPI-modal/SalesModal';
import OrdersModal from './KPI-modal/OrdersModal';

// Enhanced color palette
const colors = {
    primary: '#124f94',
    success: '#3bac4e',
    warning: '#ffc107',
    danger: '#dc3545',
    muted: '#6c757d',
};

const KPICard = ({ 
  title, 
  value, 
  icon, 
  color, 
  trend, 
  trendValue,
  dateFilter,
  startDate,
  endDate,
  salesData,
  ordersData
}) => {
  const router = useRouter();
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);

   const handleClick = () => {
  // console.log("Card clicked:", title);
  // console.log("Sales Data:", salesData);
  // console.log("Orders Data:", ordersData);

  if (title === "Total Sales Revenue" && Array.isArray(salesData) && salesData.length > 0) {
    setShowSalesModal(true);
  } else if (title === "No of Sales Order" && Array.isArray(ordersData) && ordersData.length > 0) {
    setShowOrdersModal(true);
  } else {
    alert("No data available to show.");
  }
};


  const renderIcon = (icon, color) => {
    const iconComponents = {
        RupeeIcon: () => (
            <div className="rounded-circle p-2" style={{ backgroundColor: `${colors[color]}15` }}>
                <MdOutlineCurrencyRupee size={24} color={colors[color]} />
            </div>
        ),
        Cart4: () => (
            <div className="rounded-circle p-2" style={{ backgroundColor: `${colors[color]}15` }}>
                <Cart4 size={24} color={colors[color]} />
            </div>
        ),
        GraphUpArrow: () => (
            <div className="rounded-circle p-2" style={{ backgroundColor: `${colors[color]}15` }}>
                <GraphUpArrow size={24} color={colors[color]} />
            </div>
        ),
        ExclamationCircle: () => (
            <div className="rounded-circle p-2" style={{ backgroundColor: `${colors[color]}15` }}>
                <ExclamationCircle size={24} color={colors[color]} />
            </div>
        ),
    };

    return iconComponents[icon] ? iconComponents[icon]() : null;
  };

  return (
    <>
      <Card
        className="h-100 shadow-sm border-0"
        style={{
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 .5rem 1rem rgba(0,0,0,.15)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 .125rem .25rem rgba(0,0,0,.075)';
        }}
        onClick={handleClick}
      >
        <Card.Body className="p-4">
            {/* Icon and Trend Badge Row */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                {renderIcon(icon, color)}
                {trendValue !== null && (
                    <Badge
                        bg={trend === 'up' ? 'success' : 'danger'}
                        className="d-flex align-items-center gap-1 px-2 py-1"
                        style={{ fontSize: '0.8rem' }}
                    >
                        {trend === 'up' ? <ArrowUpShort size={16} /> : <ArrowDownShort size={16} />}
                        {trendValue}%
                    </Badge>
                )}
            </div>

            {/* Value and Title */}
            <h3 className="mb-2 fw-bold" style={{ color: colors[color], fontSize: '1.75rem' }}>
                {value || 0}
            </h3>
            <p
                className="text-muted mb-0"
                style={{
                    fontSize: '0.875rem',
                    letterSpacing: '0.5px',
                    fontWeight: '500',
                }}
            >
                {title}
            </p>
        </Card.Body>
      </Card>

      {/* Sales Modal */}
      {showSalesModal && (
        <SalesModal
          salesData={salesData}
          onClose={() => setShowSalesModal(false)}
          dateFilter={dateFilter}
          startDate={startDate}
          endDate={endDate}
        />
      )}

      {/* Orders Modal */}
      {showOrdersModal && (
        <OrdersModal
          ordersData={ordersData}
          onClose={() => setShowOrdersModal(false)}
          dateFilter={dateFilter}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </>
  );
};

const KPISection = ({ kpiData = [], dateFilter, startDate, endDate, salesData, ordersData }) => (
  <Row className="g-4 mb-4">
    {kpiData.map((card, index) => (
      <Col key={index} xs={12} sm={6} xl={3}>
        <KPICard
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
          trend={card.trend}
          trendValue={card.trendValue}
          dateFilter={dateFilter}
          startDate={startDate}
          endDate={endDate}
          salesData={salesData}
          ordersData={ordersData}
       
        />
      </Col>
    ))}
  </Row>
);

export default KPISection;