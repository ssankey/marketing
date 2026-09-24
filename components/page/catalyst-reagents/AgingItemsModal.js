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

const SORTABLE_COLUMNS = [
  { key: 'itemCode', label: 'CAT No.', align: 'left' },
  { key: 'itemName', label: 'Item Name', align: 'left' },
  { key: 'casNo', label: 'CAS No.', align: 'left' },
  { key: 'category', label: 'Category', align: 'left' },
  { key: 'stock', label: 'Stock', align: 'right' },
  { key: 'price', label: 'Price', align: 'right' },
  { key: 'value', label: 'Value', align: 'right' },
  { key: 'batchNum', label: 'Batch No.', align: 'left' },
  { key: 'grnDate', label: 'GRN Date', align: 'left' },
];

export default function AgingItemsModal({ show, onHide, categories, asOfDate, category, bucket, title }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

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

  const sortedItems = useMemo(() => {
    if (!sortField) return items;
    const dateFields = new Set(['grnDate']);
    const numericFields = new Set(['stock', 'price', 'value']);
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => {
      let av = a[sortField];
      let bv = b[sortField];
      if (dateFields.has(sortField)) {
        av = av ? new Date(av).getTime() : 0;
        bv = bv ? new Date(bv).getTime() : 0;
      } else if (numericFields.has(sortField)) {
        av = Number(av) || 0;
        bv = Number(bv) || 0;
      } else {
        av = (av || '').toString().toLowerCase();
        bv = (bv || '').toString().toLowerCase();
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [items, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE));
  const pageItems = useMemo(() => sortedItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sortedItems, page]);

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
                        {SORTABLE_COLUMNS.map((col) => (
                          <th
                            key={col.key}
                            className={col.align === 'right' ? 'cr-th-right' : 'cr-th-left'}
                            onClick={() => handleSort(col.key)}
                          >
                            {col.label}
                            {sortField === col.key && <span className="cr-sort-arrow">{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>}
                          </th>
                        ))}
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
