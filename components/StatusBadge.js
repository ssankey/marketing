// import { Badge } from "react-bootstrap";

// // StatusBadge.js
// const StatusBadge = ({ status }) => {
//     const getStatusBadgeColor = (status) => {
//       switch (status.toLowerCase()) {
//         case 'open':
//           return 'primary';
//         case 'closed':
//           return 'success';
//         case 'cancel':
//           return 'danger';
//         default:
//           return 'secondary';
//       }
//     };
  
//     return (
//       <Badge className={getStatusBadgeColor(status)}>
//         {status}
//       </Badge>
//     );
//   };

//   export default StatusBadge;

import { Badge } from "react-bootstrap";

// StatusBadge.js
const StatusBadge = ({ status }) => {
  const getStatusBadgeColor = (status) => {
    if (typeof status !== "string") {
      return "secondary"; // Default badge color if status is not a string
    }

    switch (status.toLowerCase()) {
      case "open":
        return "primary";
      case "closed":
        return "success";
      case "cancel":
        return "danger";
      default:
        return "secondary";
    }
  };

  return (
    <Badge className={getStatusBadgeColor(status)}>
      {status || "Unknown"} {/* Display 'Unknown' if status is falsy */}
    </Badge>
  );
};

export default StatusBadge;
