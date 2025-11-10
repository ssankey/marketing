// components/LabelPrintModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Spinner, Table, Badge } from 'react-bootstrap';
import { Package, X } from 'lucide-react';

const LabelPrintModal = ({ show, onHide, docEntry, docNum }) => {
  const [loading, setLoading] = useState(false);
  const [labelData, setLabelData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show && docEntry && docNum) {
      fetchLabelData();
    }
  }, [show, docEntry, docNum]);

  const fetchLabelData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/labels/print?docEntry=${docEntry}&docNum=${docNum}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch label data: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setLabelData(result.data);
      } else {
        setError(result.message || 'Failed to load label data');
      }
    } catch (err) {
      console.error('Error fetching label data:', err);
      setError(err.message || 'Failed to load label data');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setLabelData([]);
    setError(null);
    onHide();
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      size="lg"
      centered
    >
      <Modal.Header className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
        <div className="d-flex align-items-center gap-2 w-100">
          <Package size={24} />
          <div className="flex-grow-1">
            <Modal.Title className="mb-0">
              Product Labels
            </Modal.Title>
            <small className="opacity-90">
              Invoice #{docNum}
            </small>
          </div>
          <button
            onClick={handleClose}
            className="btn btn-sm btn-light rounded-circle p-2"
            style={{ width: '36px', height: '36px' }}
          >
            <X size={18} />
          </button>
        </div>
      </Modal.Header>

      <Modal.Body className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Loading label data...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && labelData.length === 0 && (
          <div className="text-center py-5 text-muted">
            <Package size={48} className="opacity-50 mb-3" />
            <p>No label data available</p>
          </div>
        )}

        {!loading && !error && labelData.length > 0 && (
          <div>
            <div className="mb-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 text-muted">
                Total Items: <Badge bg="primary">{labelData.length}</Badge>
              </h6>
            </div>

            <div className="table-responsive">
              <Table striped hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th style={{ width: '5%' }}>#</th>
                    <th style={{ width: '20%' }}>Cat No</th>
                    <th style={{ width: '15%' }}>Pack Size</th>
                    <th style={{ width: '25%' }}>Batch Number</th>
                    <th style={{ width: '35%' }}>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {labelData.map((item, index) => (
                    <tr key={index}>
                      <td className="text-muted">{index + 1}</td>
                      <td>
                        <strong className="text-primary">
                          {item.catNo}
                        </strong>
                      </td>
                      <td>
                        <Badge bg="secondary" className="font-monospace">
                          {item.packSize}
                        </Badge>
                      </td>
                      <td>
                        <code className="bg-light px-2 py-1 rounded">
                          {item.batchNum}
                        </code>
                      </td>
                      <td className="text-muted">
                        {item.category}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* Label Preview Cards - Alternative View */}
            {/* <div className="mt-4">
              <h6 className="text-muted mb-3">Label Preview</h6>
              <div className="row g-3">
                {labelData.map((item, index) => (
                  <div key={index} className="col-md-6">
                    <div className="card shadow-sm border-0">
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="mb-0 text-primary">
                            CAT: {item.catNo}
                          </h6>
                          <Badge bg="info">{item.packSize}</Badge>
                        </div>
                        <div className="mt-2">
                          <small className="text-muted d-block">
                            <strong>LOT:</strong> {item.batchNum}
                          </small>
                          <small className="text-muted d-block">
                            <strong>Category:</strong> {item.category}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div> */}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0 bg-light">
        <button 
          className="btn btn-secondary"
          onClick={handleClose}
        >
          Close
        </button>
        {/* Placeholder for future download functionality */}
        <button 
          className="btn btn-primary"
          disabled={loading || labelData.length === 0}
        >
          <Package size={16} className="me-2" />
          Download Labels (Coming Soon)
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default LabelPrintModal;