
// components/dispatch/InvoiceHeader.js
import { Card, Button } from "react-bootstrap";
import { formatDate } from "utils/formatDate";

export default function InvoiceHeader({ 
  headerData, 
  isPdfAvailable, 
  pdfCheckCompleted, 
  onDownloadPdf,
  isCOAAvailable,
  coaCheckCompleted,
  onDownloadCOA
}) {
  const generateTrackingLink = (transportName, trackingNumber) => {
    if (!transportName || !trackingNumber) return null;
    
    const lowerTransportName = transportName.toLowerCase();
    
    if (lowerTransportName.includes('shree maruti')) {
      return `https://trackcourier.io/track-and-trace/shree-maruti-courier/${trackingNumber}`;
    } else if (lowerTransportName.includes('bluedart') || lowerTransportName.includes('blue dart')) {
      return `https://trackcourier.io/track-and-trace/blue-dart-courier/${trackingNumber}`;
    }
    
    return null;
  };

  const handleDownloadClick = () => {
    // If both are available, download both
    if (isPdfAvailable && isCOAAvailable) {
      onDownloadPdf();
      onDownloadCOA();
    } else if (isPdfAvailable) {
      onDownloadPdf();
    } else if (isCOAAvailable) {
      onDownloadCOA();
    }
  };

  const getDownloadText = () => {
    if (isPdfAvailable && isCOAAvailable) {
      return "Click here to download Invoice and COA";
    } else if (isPdfAvailable) {
      return "Click here to download Invoice";
    } else if (isCOAAvailable) {
      return "Click here to download COA";
    }
    return "";
  };

  if (!headerData) return null;

  return (
    <>
      <Card className="mb-4 shadow-sm border-0">
        <Card.Header 
          className="py-3 px-3 px-md-4"
          style={{
            backgroundColor: '#343a40',
            color: 'white',
            fontSize: '1.1rem'
          }}
        >
          <h5 className="mb-0 text-white">Dispatch Details</h5>
        </Card.Header>
        <Card.Body className="p-3 p-md-4" style={{ backgroundColor: 'white' }}>
          <div className="dispatch-info">
            <p className="mb-3" style={{ fontSize: '0.95rem' }}>
              <strong>Our Invoice Number:</strong> {headerData.InvoiceNo} – Dated # {formatDate(headerData.InvoiceDate)}
            </p>
            <p className="mb-3" style={{ fontSize: '0.95rem' }}>
              <strong>Customer PO Number:</strong> {headerData.CustomerPONo}
            </p>
            <p className="mb-3" style={{ fontSize: '0.95rem' }}>
              <strong>Carrier name:</strong> {headerData.TransportName}
            </p>
            <p className="mb-3" style={{ fontSize: '0.95rem' }}>
              <strong>Tracking Number:</strong> {headerData.TrackingNumber} – Dated # {formatDate(headerData.TrackingUpdatedDate)}
            </p>
            
            {generateTrackingLink(headerData.TransportName, headerData.TrackingNumber) && (
              <p className="mb-3" style={{ fontSize: '0.95rem' }}>
                <strong>Click to Track shipment:</strong>{' '}
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => window.open(
                    generateTrackingLink(headerData.TransportName, headerData.TrackingNumber),
                    '_blank'
                  )}
                  className="ms-2"
                >
                  Track Shipment
                </Button>
              </p>
            )}
            <p className="mb-0" style={{ fontSize: '0.95rem' }}>
              <strong>Estimated Delivery Date:</strong> {headerData.DeliveryDate ? formatDate(headerData.DeliveryDate) : 'N/A'}
            </p>
          </div>
        </Card.Body>
      </Card>

      {/* PDF/COA Download Section */}
      {(pdfCheckCompleted || coaCheckCompleted) && (isPdfAvailable || isCOAAvailable) && (
        <div className="mb-4">
          <span 
            className="fw-bold"
            style={{ 
              cursor: 'pointer',
              color: 'black',
              fontSize: '1rem'
            }}
            onClick={handleDownloadClick}
          >
            {getDownloadText()} - 
          </span>
          
          {/* Show individual download links based on availability */}
          {isPdfAvailable && (
            <span 
              className="text-primary fw-bold ms-1"
              style={{ 
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '1rem'
              }}
              onClick={onDownloadPdf}
            >
              INV
            </span>
          )}
          
          {isPdfAvailable && isCOAAvailable && (
            <span className="fw-bold ms-1" style={{ fontSize: '1rem' }}> & </span>
          )}
          
          {isCOAAvailable && (
            <span 
              className="text-primary fw-bold ms-1"
              style={{ 
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '1rem'
              }}
              onClick={onDownloadCOA}
            >
              COA
            </span>
          )}
        </div>
      )}
    </>
  );
}