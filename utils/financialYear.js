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