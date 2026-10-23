export function getFinancialYears(startYear = 2024) {
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentYear = today.getFullYear();
  
  // FY starts April (month 4), so if Jan-Mar, current FY started last year
  const currentFYStartYear = currentMonth >= 4 ? currentYear : currentYear - 1;
  
  const years = [];
  for (let y = startYear; y <= currentFYStartYear; y++) {
    years.push({
      label: `${y}-${String(y + 1).slice(-2)}`,
      value: `${y}-${y + 1}`,
      startDate: `${y}-04-01`,
      endDate: `${y + 1}-03-31`,
    });
  }
  return years;
}

export function getCurrentFY() {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const startYear = currentMonth >= 4 ? currentYear : currentYear - 1;
  return `${startYear}-${startYear + 1}`;
}

// Indian financial year: April -> March. Same convention as pages/products/[id].js's
// local fyStartYear/fyLabel — centralized here so customer-detail charts can share it.
export function fyStartYear(year, month) {
  return month >= 4 ? year : year - 1;
}

export function fyLabel(startYear) {
  return `FY ${startYear}-${String(startYear + 1).slice(-2)}`;
}

// Parses a SQL Server FORMAT(date, 'MMM yyyy') / 'MMM-yyyy' style label (e.g.
// "Jan 2025" or "Jan-2025") into { year, month }. Returns null if unparseable.
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function parseMonthAbbrLabel(label, separator = " ") {
  if (!label) return null;
  const [monStr, yearStr] = label.split(separator);
  const month = MONTH_ABBR.indexOf(monStr) + 1;
  const year = parseInt(yearStr, 10);
  if (!month || !year) return null;
  return { year, month };
}