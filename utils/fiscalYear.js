// utils/fiscalYear.js
// Indian financial year (Apr–Mar) helpers, adapted from the inline helpers in
// components/EnhancedSalesCOGSChart.js (left untouched there — this is a
// standalone copy for pages that need a resolved date range, not client-side
// row filtering).

// Local calendar date as YYYY-MM-DD. Deliberately NOT `new Date().toISOString().slice(0,10)`
// — toISOString() always renders in UTC, which silently shifts the date back
// a day for anyone in a positive UTC offset (e.g. IST, UTC+5:30) checking
// the dashboard between midnight and the offset time. This reads the
// browser's own local year/month/day instead.
export const todayLocalISO = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const getCurrentFY = () => {
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  const s = m >= 4 ? y : y - 1;
  return `${s}-${s + 1}`;
};

export const buildFYList = (calendarYears) => {
  const set = new Set();
  (calendarYears || []).forEach((y) => {
    set.add(`${y - 1}-${y}`);
    set.add(`${y}-${y + 1}`);
  });
  set.add(getCurrentFY());
  return Array.from(set).sort((a, b) => parseInt(b) - parseInt(a));
};

// "2024-2025" -> { startDate: "2024-04-01", endDate: "2025-03-31" }
export const fyToDateRange = (fy) => {
  const [sy, ey] = fy.split("-").map(Number);
  return {
    startDate: `${sy}-04-01`,
    endDate: `${ey}-03-31`,
  };
};
