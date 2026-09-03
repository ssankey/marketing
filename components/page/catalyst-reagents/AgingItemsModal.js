// components/page/catalyst-reagents/AgingItemsModal.js
// Opens when a cell in the Aging Details table is clicked — lists the
// individual stock batches behind that cell (a single category+bucket, an
// entire category's Total column, an entire bucket's Total row, or every
// batch for the grand-total cell), client-paginated, with Excel export.

import { useState, useEffect, useMemo } from 'react';
import { Modal, Spinner } from 'react-bootstrap';
import downloadExcel from 'utils/exporttoexcel';
import { formatCurrency } from 'utils/formatCurrency';
import TABLE_PAGE_STYLES from './tableStyles';

const PAGE_SIZE = 20;

const formatDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function AgingItemsModal({ show, onHide, categories, asOfDate, category, bucket, title }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!show) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        setPage(1);
        const params = new URLSearchParams({ asOfDate, category: category || 'ALL', bucket: bucket || 'ALL' });
        (categories || []).forEach((c) => params.append('itmsGrpNam', c));
        const res = await fetch(`/api/catalyst-reagents/aging-items?${params}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load items');
        setItems(json.items || []);
      } catch (e) {
        setError(e.message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [show, categories, asOfDate, category, bucket]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = useMemo(() => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [items, page]);

  const handleExport = () => {
    if (items.length === 0) { alert('No data to export'); return; }
    const exportData = items.map((it) => ({
      'CAT No.': it.itemCode,
      'Item Name': it.itemName,
      'CAS No.': it.casNo,
      Category: it.category,
      'Age Bucket': it.bucket,
      Stock: it.stock,
      Price: it.price,
      Value: it.value,
      'Batch No.': it.batchNum,
      'GRN Date': it.grnDate,
    }));
    downloadExcel(exportData, `Aging_Items_${title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`, {
      Price: { type: 'currency' }, Value: { type: 'currency' },
    });
  };

  return (
    <Modal show={show} onHide={onHide} centered scrollable size="xl" dialogClassName="cr-modal-dialog">
      <div className="cr">
        <style>{TABLE_PAGE_STYLES}</style>
        <Modal.Header closeButton>
          <div className="d-flex justify-content-between align-items-start w-100 me-2">
            <Modal.Title as="div">
              <div className="cr-modal-title">Items — {title}</div>
              <div className="cr-modal-subtitle">{items.length} batch{items.length !== 1 ? 'es' : ''}</div>
            </Modal.Title>
            <button className="cr-export-btn" onClick={handleExport} disabled={loading || items.length === 0}>
              Export Excel
            </button>
          </div>
        </Modal.Header>
        <Modal.Body>
          {error && <div className="cr-empty" style={{ color: 'var(--bad)' }}>{error}</div>}

          {loading ? (
            <div className="cr-loading"><Spinner animation="border" size="sm" /><span>Loading items…</span></div>
          ) : items.length === 0 ? (
            <div className="cr-empty">No items found.</div>
          ) : (
            <>
              <div className="cr-table-card">
                <div className="cr-table-scroll">
                  <table className="cr-table">
                    <thead>
                      <tr>
                        <th className="cr-th-left">CAT No.</th>
                        <th className="cr-th-left">Item Name</th>
                        <th className="cr-th-left">CAS No.</th>
                        <th className="cr-th-left">Category</th>
                        <th className="cr-th-right">Stock</th>
                        <th className="cr-th-right">Price</th>
                        <th className="cr-th-right">Value</th>
                        <th className="cr-th-left">Batch No.</th>
                        <th className="cr-th-left">GRN Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((it, i) => (
                        <tr key={`${it.itemCode}-${it.batchNum}-${i}`}>
                          <td>{it.itemCode}</td>
                          <td><span className="cr-truncate" title={it.itemName}>{it.itemName}</span></td>
                          <td>{it.casNo || <span className="cr-dash">N/A</span>}</td>
                          <td>{it.category}</td>
                          <td className="cr-num">{it.stock.toLocaleString('en-IN')}</td>
                          <td className="cr-num">{formatCurrency(it.price)}</td>
                          <td className="cr-num">{formatCurrency(it.value)}</td>
                          <td>{it.batchNum || <span className="cr-dash">N/A</span>}</td>
                          <td>{formatDate(it.grnDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <span className="cr-header-desc">Page {page} of {totalPages}</span>
                  <div className="d-flex gap-1">
                    <button className="cr-page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
                    <button className="cr-page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </Modal.Body>
      </div>
    </Modal>
  );
}
