// components/Loading.js
import { Spinner } from "react-bootstrap";

const Loading = () => (
  <div className="loading-overlay">
    <Spinner animation="border" variant="primary" />
  </div>
);

export default Loading;
