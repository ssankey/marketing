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
//
// The panel is rendered through a portal straight into document.body rather
// than as a normal absolutely-positioned child. A table's own header row
// commonly sits in its own stacking context (sticky positioning, etc.), and
// when that context is DOM-later than this control's, it paints on top of
// the panel no matter how high the panel's own z-index is set — z-index
// only resolves conflicts within the same stacking context. A portal
// sidesteps that entirely: the panel is positioned in the viewport (fixed,
// from the trigger's own bounding rect) and lives outside every ancestor's
// stacking context, so nothing on the page can end up drawn over it.
//
// Styling is a plain CSS Module (DateFilterControl.module.css), not
// styled-jsx — confirmed directly that styled-jsx's scoped class doesn't
// reliably attach to portaled content: the panel rendered on top of the
// table correctly, but with none of its styling applied. A CSS Module's
// class names resolve at build time, so they apply the same way regardless
// of where in the DOM the element ends up.

import { useState, useRef, useEffect, useMemo, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Form } from "react-bootstrap";
import styles from "./DateFilterControl.module.css";

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
  // Staged month picks — a Set of "YYYY-MM" values, multi-select, also only
  // committed on "Apply". There's no backend support for a sparse "these
  // exact months, skipping gaps" filter (every page's API route only takes
  // one fromDate/toDate range), so picking more than one month applies the
  // CONTIGUOUS span from the earliest to the latest one picked — e.g. Jan +
  // Mar applies Jan 1 -> Mar 31, including Feb. Picking exactly one month
  // still applies as that single month via onMonthChange, unchanged from
  // before.
  const [stagedMonths, setStagedMonths] = useState(() => new Set(selectedMonth ? [selectedMonth] : []));
  const [panelStyle, setPanelStyle] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []); // document.body isn't available during SSR

  const availableMonths = useMemo(() => buildAvailableMonths(dateRange), [dateRange?.minDate, dateRange?.maxDate]);
  const hasRange = !!(fromDate || toDate);

  // Re-stage whenever the panel is (re)opened, so it reflects whatever is
  // actually applied right now rather than a half-typed leftover.
  useEffect(() => {
    if (open) {
      setStagedFrom(fromDate || "");
      setStagedTo(toDate || "");
      setStagedMonths(new Set(selectedMonth ? [selectedMonth] : []));
    }
  }, [open, fromDate, toDate, selectedMonth]);

  // Position the portaled panel from the trigger's own screen coordinates —
  // right-aligned under the trigger, like the old `right: 0` did, clamped so
  // it never runs off the left edge of the viewport.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelWidth = 300;
    const left = Math.max(8, Math.min(rect.right - panelWidth, window.innerWidth - panelWidth - 8));
    setPanelStyle({ top: rect.bottom + 6, left });
  }, [open]);

  // Closing on scroll/resize rather than re-tracking position continuously
  // — simpler, and a filter popover doesn't need to follow the page around.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e) => {
      const insideTrigger = triggerRef.current && triggerRef.current.contains(e.target);
      const insidePanel = panelRef.current && panelRef.current.contains(e.target);
      if (!insideTrigger && !insidePanel) setOpen(false);
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

  // "All" stays an instant clear+close — it's unambiguous, not a pick to
  // stage alongside others.
  const pickAllMonths = () => {
    onMonthChange("");
    onDateChange("from", "");
    onDateChange("to", "");
    setStagedMonths(new Set());
    setOpen(false);
  };

  const toggleMonth = (value) => {
    setStagedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  // First day of the earliest picked month -> last day of the latest picked
  // month. "YYYY-MM" sorts correctly as a plain string, so min/max are just
  // the first/last after a lexicographic sort.
  const monthsToRange = (monthSet) => {
    const sorted = [...monthSet].sort();
    const [minY, minM] = sorted[0].split("-").map(Number);
    const [maxY, maxM] = sorted[sorted.length - 1].split("-").map(Number);
    const lastDay = new Date(Date.UTC(maxY, maxM, 0)).getUTCDate(); // day 0 of next month = last day of maxM
    return {
      from: `${sorted[0]}-01`,
      to: `${maxY}-${pad2(maxM)}-${pad2(lastDay)}`,
    };
  };

  const applyMonths = () => {
    if (stagedMonths.size === 1) {
      onMonthChange([...stagedMonths][0]);
      onDateChange("from", "");
      onDateChange("to", "");
    } else {
      const { from, to } = monthsToRange(stagedMonths);
      onMonthChange("");
      onDateChange("from", from);
      onDateChange("to", to);
    }
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
    setStagedMonths(new Set());
    setOpen(false);
  };

  const rangeInvalid = stagedFrom && stagedTo && stagedFrom > stagedTo;
  const monthsStagedLabel =
    stagedMonths.size === 0
      ? null
      : stagedMonths.size === 1
      ? formatMonthDisplay([...stagedMonths][0])
      : (() => {
          const { from, to } = monthsToRange(stagedMonths);
          return `${stagedMonths.size} months selected (${formatDisplayDate(from)} – ${formatDisplayDate(to)})`;
        })();

  const panel = mounted && open && panelStyle && createPortal(
    (
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-label={`${label} filter`}
        style={{ position: "fixed", top: panelStyle.top, left: panelStyle.left }}
      >
        <div className={styles.panelHeader}>
          <span>{label}</span>
          {(hasRange || selectedMonth) && (
            <button type="button" className={styles.clearLink} onClick={clearAll}>Clear</button>
          )}
        </div>

        <div className={styles.sectionTitle}>
          Quick pick — month{stagedMonths.size > 0 ? "s" : ""} (select one or more)
        </div>
        <div className={styles.monthGrid}>
          <button
            type="button"
            className={`${styles.monthChip} ${stagedMonths.size === 0 && !hasRange ? styles.chipActive : ""}`}
            onClick={pickAllMonths}
          >
            All
          </button>
          {availableMonths.map((m) => (
            <button
              key={m.value}
              type="button"
              className={`${styles.monthChip} ${stagedMonths.has(m.value) ? styles.chipActive : ""}`}
              onClick={() => toggleMonth(m.value)}
            >
              {m.display}
            </button>
          ))}
        </div>
        {monthsStagedLabel && (
          <div className={styles.monthsSummary}>{monthsStagedLabel}</div>
        )}
        <div className={styles.panelFooterInline}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={stagedMonths.size === 0}
            onClick={applyMonths}
          >
            Apply {stagedMonths.size > 1 ? `${stagedMonths.size} Months` : "Month"}
          </button>
        </div>

        <div className={styles.divider}><span>or custom range</span></div>

        <div className={styles.rangeRow}>
          <div className={styles.rangeField}>
            <Form.Label className={styles.rangeLabel}>From</Form.Label>
            <Form.Control
              type="date"
              size="sm"
              value={stagedFrom}
              max={stagedTo || undefined}
              onChange={(e) => setStagedFrom(e.target.value)}
            />
          </div>
          <div className={styles.rangeField}>
            <Form.Label className={styles.rangeLabel}>To</Form.Label>
            <Form.Control
              type="date"
              size="sm"
              value={stagedTo}
              min={stagedFrom || undefined}
              onChange={(e) => setStagedTo(e.target.value)}
            />
          </div>
        </div>
        {rangeInvalid && <div className={styles.rangeError}>"From" must be before "To".</div>}

        <div className={styles.panelFooter}>
          <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={rangeInvalid || (!stagedFrom && !stagedTo)}
            onClick={applyRange}
          >
            Apply Range
          </button>
        </div>
      </div>
    ),
    document.body
  );

  return (
    <div className={styles.root}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${hasRange || selectedMonth ? styles.triggerActive : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.triggerIcon} aria-hidden="true">📅</span>
        <span className={styles.triggerLabel}>{triggerLabel}</span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} aria-hidden="true">▾</span>
      </button>

      {panel}
    </div>
  );
}
