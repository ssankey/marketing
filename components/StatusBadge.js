import { Badge } from "react-bootstrap";

// StatusBadge.js
const StatusBadge = ({ status }) => {
  console.log(status.toLowerCase());
  
    const getStatusBadgeColor = (status) => {
      switch (status.toLowerCase()) {
        case 'open':
          return 'primary';
        case 'closed':
          return 'success';
        case 'cancel':
          return 'danger';
        default:
          return 'secondary';
      }
    };
  
    return (
      <Badge className={getStatusBadgeColor(status)}>
        {status}
      </Badge>
    );
  };

  export default StatusBadge;