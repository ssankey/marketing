// // components/KPICard.js
// import React from "react";
// import { useRouter } from "next/router";
// import { Card, Badge } from "react-bootstrap";
// import {
//   Cart4,
//   GraphUpArrow,
//   ExclamationCircle,
//   ArrowUpShort,
//   ArrowDownShort,
// } from "react-bootstrap-icons";
// import { MdOutlineCurrencyRupee } from "react-icons/md";

// // Enhanced color palette
// const colors = {
//   primary: "#0d6efd",
//   success: "#198754",
//   warning: "#ffc107",
//   danger: "#dc3545",
//   muted: "#6c757d",
// };

// const KPICard = ({
//   title,
//   value,
//   icon,
//   color,
//   trend,
//   trendValue,
//   dateFilter,
//   startDate,
//   endDate,
// }) => {
//   const router = useRouter();

//   const handleClick = () => {
//     if (title === "No of Sales Order") {
//       let fromDate, toDate;
//       const today = new Date();

//       switch (dateFilter) {
//         case "today":
//           fromDate = toDate = today.toISOString().split("T")[0];
//           break;
//         case "thisWeek": {
//           const day = today.getDay();
//           const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
//           const weekStart = new Date(today.setDate(diff));
//           fromDate = weekStart.toISOString().split("T")[0];
//           const weekEnd = new Date(weekStart);
//           weekEnd.setDate(weekStart.getDate() + 6);
//           toDate = weekEnd.toISOString().split("T")[0];
//           break;
//         }
//         case "thisMonth": {
//           const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
//           const lastDay = new Date(
//             today.getFullYear(),
//             today.getMonth() + 1,
//             0
//           );
//           fromDate = firstDay.toISOString().split("T")[0];
//           toDate = lastDay.toISOString().split("T")[0];
//           break;
//         }
//         case "custom":
//           if (startDate && endDate) {
//             fromDate = startDate;
//             toDate = endDate;
//           } else {
//             // Default to today if custom range not specified
//             fromDate = toDate = today.toISOString().split("T")[0];
//           }
//           break;
//         default:
//           // Default to today
//           fromDate = toDate = today.toISOString().split("T")[0];
//       }

//       router.push({
//         pathname: "/orders",
//         query: {
//           page: 1,
//           fromDate,
//           toDate,
//         },
//       });
//     }
//   };

//   const renderIcon = (icon, color) => {
//     const iconComponents = {
//       RupeeIcon: () => (
//         <div
//           className="rounded-circle p-3 mb-3"
//           style={{
//             backgroundColor: `${colors[color]}15`,
//             display: "inline-flex",
//             alignItems: "center",
//             justifyContent: "center",
//           }}
//         >
//           <MdOutlineCurrencyRupee size={24} color={colors[color]} />
//         </div>
//       ),
//       Cart4: () => (
//         <div
//           className="rounded-circle p-3 mb-3"
//           style={{
//             backgroundColor: `${colors[color]}15`,
//             display: "inline-flex",
//             alignItems: "center",
//             justifyContent: "center",
//           }}
//         >
//           <Cart4 size={24} color={colors[color]} />
//         </div>
//       ),
//       GraphUpArrow: () => (
//         <div
//           className="rounded-circle p-3 mb-3"
//           style={{
//             backgroundColor: `${colors[color]}15`,
//             display: "inline-flex",
//             alignItems: "center",
//             justifyContent: "center",
//           }}
//         >
//           <GraphUpArrow size={24} color={colors[color]} />
//         </div>
//       ),
//       ExclamationCircle: () => (
//         <div
//           className="rounded-circle p-3 mb-3"
//           style={{
//             backgroundColor: `${colors[color]}15`,
//             display: "inline-flex",
//             alignItems: "center",
//             justifyContent: "center",
//           }}
//         >
//           <ExclamationCircle size={24} color={colors[color]} />
//         </div>
//       ),
//     };

//     return iconComponents[icon] ? iconComponents[icon]() : null;
//   };

//   return (
//     <Card
//       className="h-100 shadow-sm border-0"
//       style={{
//         transition: "transform 0.2s ease, box-shadow 0.2s ease",
//         cursor: "pointer",
//       }}
//       onMouseEnter={(e) => {
//         e.currentTarget.style.transform = "translateY(-5px)";
//         e.currentTarget.style.boxShadow = "0 .5rem 1rem rgba(0,0,0,.15)";
//       }}
//       onMouseLeave={(e) => {
//         e.currentTarget.style.transform = "translateY(0)";
//         e.currentTarget.style.boxShadow = "0 .125rem .25rem rgba(0,0,0,.075)";
//       }}
//       onClick={handleClick}
//     >
//       <Card.Body className="p-4">
//         {renderIcon(icon, color)}
//         <h3
//           className="mb-2 fw-bold"
//           style={{ color: colors[color], fontSize: "1.75rem" }}
//         >
//           {value || 0}
//         </h3>
//         <p
//           className="text-muted mb-0"
//           style={{
//             fontSize: "0.875rem",
//             letterSpacing: "0.5px",
//             fontWeight: "500",
//           }}
//         >
//           {title}
//         </p>
//         {trendValue !== null && (
//           <Badge
//             bg={trend === "up" ? "success" : "danger"}
//             className="d-flex align-items-center gap-1 px-2 py-1 mt-2"
//             style={{ fontSize: "0.8rem" }}
//           >
//             {trend === "up" ? (
//               <ArrowUpShort size={16} />
//             ) : (
//               <ArrowDownShort size={16} />
//             )}
//             {trendValue}%
//           </Badge>
//         )}
//       </Card.Body>
//     </Card>
//   );
// };

// export default KPICard;

// components/KPICard.js
import React, { useState } from "react";
import { useRouter } from "next/router";
import { Card, Badge } from "react-bootstrap";
import {
  Cart4,
  GraphUpArrow,
  ExclamationCircle,
  ArrowUpShort,
  ArrowDownShort,
} from "react-bootstrap-icons";
import { MdOutlineCurrencyRupee } from "react-icons/md";
import SalesModal from "./KPI-modal/SalesModal";
import OrdersModal from "./KPI-modal/OrdersModal";

// Enhanced color palette
const colors = {
  primary: "#0d6efd",
  success: "#198754",
  warning: "#ffc107",
  danger: "#dc3545",
  muted: "#6c757d",
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
  salesData, // Add this prop for sales data
  ordersData, // Add this prop for orders data
}) => {
  const router = useRouter();
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  const handleClick = () => {
    if (title === "Total Sales Revenue") {
      setShowSalesModal(true);
    } else if (title === "No of Sales Order") {
      // Check if we should show modal or navigate
      if (salesData && salesData.length > 0) {
        setShowOrdersModal(true);
      } else {
        // Navigate to orders page with date filters
        let fromDate, toDate;
        const today = new Date();

        switch (dateFilter) {
          case "today":
            fromDate = toDate = today.toISOString().split("T")[0];
            break;
          case "thisWeek": {
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1);
            const weekStart = new Date(today.setDate(diff));
            fromDate = weekStart.toISOString().split("T")[0];
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            toDate = weekEnd.toISOString().split("T")[0];
            break;
          }
          case "thisMonth": {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            fromDate = firstDay.toISOString().split("T")[0];
            toDate = lastDay.toISOString().split("T")[0];
            break;
          }
          case "custom":
            if (startDate && endDate) {
              fromDate = startDate;
              toDate = endDate;
            } else {
              fromDate = toDate = today.toISOString().split("T")[0];
            }
            break;
          default:
            fromDate = toDate = today.toISOString().split("T")[0];
        }

        router.push({
          pathname: "/orders",
          query: {
            page: 1,
            fromDate,
            toDate,
          },
        });
      }
    }
  };

  const renderIcon = (icon, color) => {
    const iconComponents = {
      RupeeIcon: () => (
        <div
          className="rounded-circle p-3 mb-3"
          style={{
            backgroundColor: `${colors[color]}15`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MdOutlineCurrencyRupee size={24} color={colors[color]} />
        </div>
      ),
      Cart4: () => (
        <div
          className="rounded-circle p-3 mb-3"
          style={{
            backgroundColor: `${colors[color]}15`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Cart4 size={24} color={colors[color]} />
        </div>
      ),
      GraphUpArrow: () => (
        <div
          className="rounded-circle p-3 mb-3"
          style={{
            backgroundColor: `${colors[color]}15`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GraphUpArrow size={24} color={colors[color]} />
        </div>
      ),
      ExclamationCircle: () => (
        <div
          className="rounded-circle p-3 mb-3"
          style={{
            backgroundColor: `${colors[color]}15`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
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
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-5px)";
          e.currentTarget.style.boxShadow = "0 .5rem 1rem rgba(0,0,0,.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 .125rem .25rem rgba(0,0,0,.075)";
        }}
        onClick={handleClick}
      >
        <Card.Body className="p-4">
          {renderIcon(icon, color)}
          <h3
            className="mb-2 fw-bold"
            style={{ color: colors[color], fontSize: "1.75rem" }}
          >
            {value || 0}
          </h3>
          <p
            className="text-muted mb-0"
            style={{
              fontSize: "0.875rem",
              letterSpacing: "0.5px",
              fontWeight: "500",
            }}
          >
            {title}
          </p>
          {trendValue !== null && (
            <Badge
              bg={trend === "up" ? "success" : "danger"}
              className="d-flex align-items-center gap-1 px-2 py-1 mt-2"
              style={{ fontSize: "0.8rem" }}
            >
              {trend === "up" ? (
                <ArrowUpShort size={16} />
              ) : (
                <ArrowDownShort size={16} />
              )}
              {trendValue}%
            </Badge>
          )}
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

export default KPICard;