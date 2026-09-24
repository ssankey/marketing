// components/page/catalyst-reagents/DrillDownModal.js
// Opens when a cell in CatalystReagentsChart's monthly table is clicked.
// Resolves the clicked month to a startDate/endDate range and hands off to
// the shared BreakdownTable (sequence picker + recursive Category/CAS/CAT
// No./Customer table + Excel export) — the same component the inline
// "current period" breakdown below the chart uses. The Export button is
// placed in the modal's own header row (same line as the title), so
// BreakdownTable's own export row is hidden and triggered via ref instead.

import { useRef, useState } from 'react';
import { Modal } from 'react-bootstrap';
import BreakdownTable from './BreakdownTable';
import TABLE_PAGE_STYLES from './tableStyles';

// "April-26" (label year is 2-digit) + the numeric year/monthNumber from the
// clicked cell -> first/last day of that month.
const monthToDateRange = (year, monthNumber) => {
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 0)); // day 0 of next month = last day of this month
  const iso = (d) => d.toISOString().slice(0, 10);
  return { startDate: iso(start), endDate: iso(end) };
};

export default function DrillDownModal({ show, onHide, context, categories }) {
  const tableRef = useRef(null);
  const [exportReady, setExportReady] = useState(false);
  const { startDate, endDate } = context ? monthToDateRange(context.year, context.monthNumber) : {};

  return (
    <Modal show={show} onHide={onHide} centered scrollable size="xl" dialogClassName="cr-modal-dialog">
      <div className="cr">
        <style>{TABLE_PAGE_STYLES}</style>
        <Modal.Header closeButton>
          <div className="d-flex justify-content-between align-items-start w-100 me-2">
            <Modal.Title as="div">
              <div className="cr-modal-title">Breakdown — {context?.monthYear}</div>
            </Modal.Title>
            <button className="cr-export-btn" onClick={() => tableRef.current?.exportData()} disabled={!exportReady}>
              Export Excel
            </button>
          </div>
        </Modal.Header>
        <Modal.Body>
          {show && context && (
            <BreakdownTable
              ref={tableRef}
              categories={categories}
              startDate={startDate}
              endDate={endDate}
              exportFileName={`Catalyst_Reagents_Drilldown_${context.monthYear}`}
              hideExportButton
              onExportReadyChange={setExportReady}
            />
          )}
        </Modal.Body>
      </div>
    </Modal>
  );
}
