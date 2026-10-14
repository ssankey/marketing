// components/shared/DateFilterControl.js
// A single compact control that replaces a plain "Month:" <select> across
// every Invoice/Order list page. Clicking it opens one panel offering both
// a month quick-pick (built from the page's own min/max date range — see
// getInvoicesDateRange / getOpenOrdersDateRange / getOrdersDateRange etc.)
// and a custom From/To range, and the trigger itself always shows whichever
// filter is currently applied. Month and custom-range are mutually
// exclusive — picking one clears the other, matching how the backing API
// routes already resolve them (an explicit fromDate/toDate always wins over
// `month` server-side, so leaving a stale range set while picking a month
// would silently ignore the month).
//
// Intentionally framework-light: a plain positioned panel + an
// outside-click listener, not a UI-library popover, to keep this a drop-in
// component inside the existing react-bootstrap toolbars.

import { useState, useRef, useEffect, useMemo } from "react";
import { Form } from "react-bootstrap";

const pad2 = (n) => String(n).padStart(2, "0");

// "YYYY-MM-DD" -> "01 Oct 2026", for the trigger label and the applied-range
// line inside the panel.
const formatDisplayDate = (isoDateStr) => {
  if (!isoDateStr) return "";
  const [y, m, d] = isoDateStr.split("-").map(Number);
  if (!y || !m || !d) return isoDateStr;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
};

const formatMonthDisplay = (monthValue) => {
  if (!monthValue) return "";
  const [year, month] = monthValue.split("-");
  const date = new Date(year, month - 1);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
};

// Every month between dateRange.minDate and dateRange.maxDate, newest first.
// Centralizes what used to be six near-identical copies of this function
// across each page's own Filters component.
const buildAvailableMonths = (dateRange) => {
  const minDate = dateRange?.minDate ? new Date(dateRange.minDate) : null;
  const maxDate = dateRange?.maxDate ? new Date(dateRange.maxDate) : null;
  if (!minDate || !maxDate || isNaN(minDate.getTime()) || isNaN(maxDate.getTime())) return [];

  const months = [];
  const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  while (current <= end) {
    const year = current.getFullYear();
    const month = current.getMonth();
    months.push({
      value: `${year}-${pad2(month + 1)}`,
      display: current.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    });
    current.setMonth(current.getMonth() + 1);
  }
  return months.reverse();
};

export default function DateFilterControl({
  selectedMonth,
  fromDate,
  toDate,
  dateRange,
  onMonthChange,
  onDateChange,
  label = "Date",
}) {
  const [open, setOpen] = useState(false);
  // Staged (not-yet-applied) custom-range inputs, so typing/picking a date
  // doesn't re-fetch on every keystroke — only "Apply" commits it.
  const [stagedFrom, setStagedFrom] = useState(fromDate || "");
  const [stagedTo, setStagedTo] = useState(toDate || "");
  const rootRef = useRef(null);

  const availableMonths = useMemo(() => buildAvailableMonths(dateRange), [dateRange?.minDate, dateRange?.maxDate]);
  const hasRange = !!(fromDate || toDate);

  // Re-stage whenever the panel is (re)opened, so it reflects whatever is
  // actually applied right now rather than a half-typed leftover.
  useEffect(() => {
    if (open) {
      setStagedFrom(fromDate || "");
      setStagedTo(toDate || "");
    }
  }, [open, fromDate, toDate]);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onEscape = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const triggerLabel = hasRange
    ? fromDate && toDate
      ? `${formatDisplayDate(fromDate)} – ${formatDisplayDate(toDate)}`
      : fromDate
      ? `From ${formatDisplayDate(fromDate)}`
      : `Until ${formatDisplayDate(toDate)}`
    : selectedMonth
    ? formatMonthDisplay(selectedMonth)
    : "All Dates";

  const pickMonth = (value) => {
    onMonthChange(value);
    if (fromDate) onDateChange("from", "");
    if (toDate) onDateChange("to", "");
    setOpen(false);
  };

  const applyRange = () => {
    onDateChange("from", stagedFrom || "");
    onDateChange("to", stagedTo || "");
    if (selectedMonth) onMonthChange("");
    setOpen(false);
  };

  const clearAll = () => {
    onMonthChange("");
    onDateChange("from", "");
    onDateChange("to", "");
    setStagedFrom("");
    setStagedTo("");
    setOpen(false);
  };

  const rangeInvalid = stagedFrom && stagedTo && stagedFrom > stagedTo;

  return (
    <div ref={rootRef} className="dfc-root">
      <button
        type="button"
        className={`dfc-trigger ${hasRange || selectedMonth ? "dfc-trigger-active" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="dfc-trigger-icon" aria-hidden="true">📅</span>
        <span className="dfc-trigger-label">{triggerLabel}</span>
        <span className={`dfc-chevron ${open ? "dfc-chevron-open" : ""}`} aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="dfc-panel" role="dialog" aria-label={`${label} filter`}>
          <div className="dfc-panel-header">
            <span>{label}</span>
            {(hasRange || selectedMonth) && (
              <button type="button" className="dfc-clear-link" onClick={clearAll}>Clear</button>
            )}
          </div>

          <div className="dfc-section-title">Quick pick — month</div>
          <div className="dfc-month-grid">
            <button
              type="button"
              className={`dfc-month-chip ${!selectedMonth && !hasRange ? "dfc-chip-active" : ""}`}
              onClick={() => pickMonth("")}
            >
              All
            </button>
            {availableMonths.map((m) => (
              <button
                key={m.value}
                type="button"
                className={`dfc-month-chip ${selectedMonth === m.value ? "dfc-chip-active" : ""}`}
                onClick={() => pickMonth(m.value)}
              >
                {m.display}
              </button>
            ))}
          </div>

          <div className="dfc-divider"><span>or custom range</span></div>

          <div className="dfc-range-row">
            <div className="dfc-range-field">
              <Form.Label className="dfc-range-label">From</Form.Label>
              <Form.Control
                type="date"
                size="sm"
                value={stagedFrom}
                max={stagedTo || undefined}
                onChange={(e) => setStagedFrom(e.target.value)}
              />
            </div>
            <div className="dfc-range-field">
              <Form.Label className="dfc-range-label">To</Form.Label>
              <Form.Control
                type="date"
                size="sm"
                value={stagedTo}
                min={stagedFrom || undefined}
                onChange={(e) => setStagedTo(e.target.value)}
              />
            </div>
          </div>
          {rangeInvalid && <div className="dfc-range-error">"From" must be before "To".</div>}

          <div className="dfc-panel-footer">
            <button type="button" className="dfc-btn dfc-btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="dfc-btn dfc-btn-primary"
              disabled={rangeInvalid || (!stagedFrom && !stagedTo)}
              onClick={applyRange}
            >
              Apply Range
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .dfc-root { position: relative; display: inline-block; }

        .dfc-trigger {
          display: flex; align-items: center; gap: 0.4rem;
          height: 36px; padding: 0 0.75rem;
          background: white; border: 1.5px solid #dee2e6; border-radius: 8px;
          font-size: 0.82rem; font-weight: 600; color: #343a40;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
        }
        .dfc-trigger:hover { border-color: #1e293b; }
        .dfc-trigger-active {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          border-color: #1e293b; color: #ffffff;
        }
        .dfc-trigger-icon { font-size: 0.85rem; }
        .dfc-trigger-label { max-width: 220px; overflow: hidden; text-overflow: ellipsis; }
        .dfc-chevron { font-size: 0.7rem; transition: transform 0.15s; opacity: 0.7; }
        .dfc-chevron-open { transform: rotate(180deg); }

        .dfc-panel {
          position: absolute; top: calc(100% + 6px); right: 0; z-index: 1050;
          width: 300px; background: white; border: 1px solid #e9ecef;
          border-radius: 12px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);
          padding: 0.9rem; animation: dfc-fade-in 0.12s ease-out;
        }
        @keyframes dfc-fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dfc-panel-header {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 0.78rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.4px; color: #1e293b; margin-bottom: 0.7rem;
        }
        .dfc-clear-link {
          background: none; border: none; color: #dc3545; font-size: 0.75rem;
          font-weight: 600; cursor: pointer; text-decoration: underline;
          text-transform: none; letter-spacing: normal;
        }

        .dfc-section-title {
          font-size: 0.7rem; font-weight: 600; color: #6c757d;
          margin-bottom: 0.4rem;
        }

        .dfc-month-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.35rem;
          max-height: 150px; overflow-y: auto; margin-bottom: 0.75rem;
        }
        .dfc-month-chip {
          padding: 0.35rem 0.3rem; background: #f8f9fa; border: 1px solid #e9ecef;
          border-radius: 6px; font-size: 0.75rem; font-weight: 600; color: #495057;
          cursor: pointer; transition: all 0.12s;
        }
        .dfc-month-chip:hover { border-color: #1e293b; color: #1e293b; }
        .dfc-chip-active {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          border-color: #1e293b; color: #ffffff;
        }

        .dfc-divider {
          display: flex; align-items: center; text-align: center;
          font-size: 0.68rem; color: #adb5bd; text-transform: uppercase;
          letter-spacing: 0.3px; margin: 0.6rem 0;
        }
        .dfc-divider::before, .dfc-divider::after {
          content: ""; flex: 1; border-bottom: 1px solid #f1f3f5;
        }
        .dfc-divider span { padding: 0 0.6rem; }

        .dfc-range-row { display: flex; gap: 0.5rem; }
        .dfc-range-field { flex: 1; }
        .dfc-range-label {
          font-size: 0.7rem; font-weight: 600; color: #6c757d; margin-bottom: 0.2rem;
        }
        .dfc-range-error {
          font-size: 0.72rem; color: #dc3545; margin-top: 0.4rem;
        }

        .dfc-panel-footer {
          display: flex; justify-content: flex-end; gap: 0.5rem;
          margin-top: 0.85rem; padding-top: 0.75rem; border-top: 1px solid #f1f3f5;
        }
        .dfc-btn {
          padding: 0.4rem 0.9rem; border-radius: 7px; font-size: 0.78rem;
          font-weight: 700; cursor: pointer; border: 1.5px solid transparent;
        }
        .dfc-btn-secondary { background: white; border-color: #dee2e6; color: #495057; }
        .dfc-btn-secondary:hover { border-color: #adb5bd; }
        .dfc-btn-primary {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white;
        }
        .dfc-btn-primary:disabled { background: #adb5bd; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
