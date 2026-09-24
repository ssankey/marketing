
// components/LabelPrintModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Spinner, Table, Badge, Button } from 'react-bootstrap';
import { Package, X, Download } from 'lucide-react';

const LabelPrintModal = ({ show, onHide, docEntry, docNum }) => {
  const [loading, setLoading] = useState(false);
  const [labelData, setLabelData] = useState([]);
  const [error, setError] = useState(null);
  const [downloadingLabels, setDownloadingLabels] = useState({});

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
    setDownloadingLabels({});
    onHide();
  };

  const buildCodeWithPacksize = (itemCode, packSize) => {
    if (!itemCode) return '';
    
    // Check if itemCode already ends with the packSize pattern
    // Example: "DP09176-1kg" already has the pack size
    const itemCodeLower = itemCode.toLowerCase();
    const packSizeLower = packSize?.toLowerCase() || '';
    
    // If itemCode already ends with "-{packSize}", don't append again
    if (packSizeLower && packSizeLower !== 'n/a' && itemCodeLower.endsWith(`-${packSizeLower}`)) {
      return itemCode;
    }
    
    // If packSize exists and is not 'N/A' and not already in itemCode, combine them
    if (packSize && packSize !== 'N/A') {
      return `${itemCode}-${packSize}`;
    }
    
    return itemCode;
  };

  const handleLabelDownload = async (item, index) => {
    setDownloadingLabels(prev => ({ ...prev, [index]: true }));
    
    try {
      const itemCode = item.itemCode?.toString()?.trim();
      const packSize = item.packSize?.toString()?.trim();
      const batchNum = item.batchNum?.toString()?.trim() || '';
      const category = item.category?.toString()?.trim() || '';
      
      if (!itemCode) {
        alert('Item code is missing');
        return;
      }

      // Build the combined code with pack size (avoiding duplication)
      const combinedCode = buildCodeWithPacksize(itemCode, packSize);
      
      console.log('Download params:', {
        itemCode,
        packSize,
        combinedCode,
        batchNum,
        category,
        'Already has packsize': itemCode.toLowerCase().endsWith(`-${packSize?.toLowerCase() || ''}`)
      });

      // Check if category contains "3A Chemical" (case insensitive)
      const is3AChemical = category.toLowerCase().includes('3a chemical');
      
      // Build URL with parameters
      const params = new URLSearchParams({
        docEntry: docEntry.toString(),
        docNum: docNum.toString()
      });
      
      if (batchNum && batchNum !== 'N/A') {
        params.append('batchNum', batchNum);
      }
      
      // Choose API endpoint based on category
      let apiPath;
      if (is3AChemical) {
        // Use 3A Label API
        apiPath = `/api/labels/download/${encodeURIComponent(combinedCode)}?${params.toString()}`;
        console.log("Downloading 3A Label from:", apiPath);
      } else {
        // Use Density Label API
        apiPath = `/api/density-labels/download/${encodeURIComponent(combinedCode)}${batchNum && batchNum !== 'N/A' ? `?batchNum=${encodeURIComponent(batchNum)}` : ''}`;
        console.log("Downloading Density Label from:", apiPath);
      }

      const response = await fetch(apiPath, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download label: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      const labelType = is3AChemical ? '3A_Label' : 'Density_Label';
      a.download = `${labelType}_${combinedCode}${batchNum ? `_${batchNum}` : ''}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      console.log(`Successfully downloaded ${labelType} for: ${combinedCode}`);
    } catch (err) {
      console.error(`Failed to download label:`, err);
      alert(`Failed to download label: ${err.message}`);
    } finally {
      setDownloadingLabels(prev => ({ ...prev, [index]: false }));
    }
  };

  const getLabelButtonText = (category) => {
    if (category?.toLowerCase().includes('3a chemical')) {
      return 'Download 3A Label';
    }
    return 'Download Density Label';
  };

  const getLabelButtonVariant = (category) => {
    if (category?.toLowerCase().includes('3a chemical')) {
      return 'warning';
    }
    return 'info';
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      size="xl"
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
                    <th style={{ width: '15%' }}>Cat No</th>
                    <th style={{ width: '12%' }}>Pack Size</th>
                    <th style={{ width: '18%' }}>Batch Number</th>
                    <th style={{ width: '25%' }}>Category</th>
                    <th style={{ width: '25%' }} className="text-center">Label</th>
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
                        <small>{item.category}</small>
                      </td>
                      <td className="text-center">
                        <Button
                          size="sm"
                          variant={getLabelButtonVariant(item.category)}
                          onClick={() => handleLabelDownload(item, index)}
                          disabled={downloadingLabels[index]}
                          className="d-flex align-items-center gap-2 mx-auto"
                        >
                          {downloadingLabels[index] ? (
                            <>
                              <Spinner animation="border" size="sm" />
                              <span>Downloading...</span>
                            </>
                          ) : (
                            <>
                              <Download size={14} />
                              <span>{getLabelButtonText(item.category)}</span>
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
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
      </Modal.Footer>
    </Modal>
  );
};

export default LabelPrintModal;