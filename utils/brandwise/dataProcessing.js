
// ============================================
// COMPLETE REPLACEMENT for utils/brandwise/dataProcessing.js
// This will show ALL 12 months from April 2025 to March 2026
// ============================================

// Full FY 2025-26 month definitions
const FULL_FY_MONTHS = [
  { year: 2025, month: 4, monthNumber: 4, name: "April" },
  { year: 2025, month: 5, monthNumber: 5, name: "May" },
  { year: 2025, month: 6, monthNumber: 6, name: "June" },
  { year: 2025, month: 7, monthNumber: 7, name: "July" },
  { year: 2025, month: 8, monthNumber: 8, name: "August" },
  { year: 2025, month: 9, monthNumber: 9, name: "September" },
  { year: 2025, month: 10, monthNumber: 10, name: "October" },
  { year: 2025, month: 11, monthNumber: 11, name: "November" },
  { year: 2025, month: 12, monthNumber: 12, name: "December" },
  { year: 2026, month: 1, monthNumber: 1, name: "January" },
  { year: 2026, month: 2, monthNumber: 2, name: "February" },
  { year: 2026, month: 3, monthNumber: 3, name: "March" }
];

// Calculate totals for a single row
export function calculateRowTotal(row, categories) {
  let totalSales = 0;
  let totalWeightedMargin = 0;

  categories.forEach(category => {
    const sales = row[`${category}_Sales`] || 0;
    const margin = row[`${category}_Margin`] || 0;
    
    totalSales += sales;
    if (sales > 0) {
      totalWeightedMargin += sales * (margin / 100);
    }
  });

  const avgMargin = totalSales > 0 
    ? Number(((totalWeightedMargin / totalSales) * 100).toFixed(2))
    : 0;

  return {
    totalSales,
    avgMargin
  };
}

// Ensure all 12 months exist in the dataset
function ensureAllMonthsExist(mergedData, categories) {
  const dataMap = {};
  
  // Map existing data by Year-Month key
  mergedData.forEach(row => {
    const key = `${row.Year}-${row.MonthNumber}`;
    dataMap[key] = row;
  });
  
  // Fill in missing months with zero data
  const completeData = FULL_FY_MONTHS.map(monthInfo => {
    const key = `${monthInfo.year}-${monthInfo.monthNumber}`;
    
    if (dataMap[key]) {
      // Month exists in data - use it
      return {
        ...dataMap[key],
        Month: monthInfo.name // Ensure consistent month name
      };
    } else {
      // Month missing - create empty row with zeros
      const emptyRow = {
        Year: monthInfo.year,
        Month: monthInfo.name,
        MonthNumber: monthInfo.monthNumber
      };
      
      // Initialize all category sales and margins to 0
      categories.forEach(cat => {
        emptyRow[`${cat}_Sales`] = 0;
        emptyRow[`${cat}_Margin`] = 0;
      });
      
      return emptyRow;
    }
  });
  
  return completeData;
}

// Create a quarter summary row
function createQuarterRow(months, quarter, categories) {
  const quarterRow = {
    Year: months[0]?.Year || 0,
    Month: quarter,
    MonthNumber: null,
    isQuarter: true
  };
  
  categories.forEach(category => {
    const totalSales = months.reduce((sum, m) => sum + (m[`${category}_Sales`] || 0), 0);
    let totalWeightedMargin = 0;
    
    months.forEach(m => {
      const sales = m[`${category}_Sales`] || 0;
      const margin = m[`${category}_Margin`] || 0;
      if (sales > 0) {
        totalWeightedMargin += sales * (margin / 100);
      }
    });
    
    const avgMargin = totalSales > 0 
      ? Number(((totalWeightedMargin / totalSales) * 100).toFixed(2))
      : 0;
    
    quarterRow[`${category}_Sales`] = totalSales;
    quarterRow[`${category}_Margin`] = avgMargin;
  });
  
  return quarterRow;
}

// Main function: Process data for display with ALL 12 months
export function processDataForDisplay(mergedData, categories) {
  // CRITICAL: Ensure all 12 months exist (fills missing months with zeros)
  const completeMonthlyData = ensureAllMonthsExist(mergedData, categories);
  
  console.log("✅ Complete monthly data (all 12 months):", completeMonthlyData);
  
  const result = [];
  
  // Q1: April, May, June (2025)
  const q1Months = completeMonthlyData.filter(
    r => r.Year === 2025 && [4, 5, 6].includes(r.MonthNumber)
  );
  q1Months.forEach(m => result.push(m));
  result.push(createQuarterRow(q1Months, "Q1", categories));
  
  // Q2: July, August, September (2025)
  const q2Months = completeMonthlyData.filter(
    r => r.Year === 2025 && [7, 8, 9].includes(r.MonthNumber)
  );
  q2Months.forEach(m => result.push(m));
  result.push(createQuarterRow(q2Months, "Q2", categories));
  
  // Q3: October, November, December (2025)
  const q3Months = completeMonthlyData.filter(
    r => r.Year === 2025 && [10, 11, 12].includes(r.MonthNumber)
  );
  q3Months.forEach(m => result.push(m));
  result.push(createQuarterRow(q3Months, "Q3", categories));
  
  // Q4: January, February, March (2026)
  const q4Months = completeMonthlyData.filter(
    r => r.Year === 2026 && [1, 2, 3].includes(r.MonthNumber)
  );
  q4Months.forEach(m => result.push(m));
  result.push(createQuarterRow(q4Months, "Q4", categories));
  
  console.log("✅ Final display data with quarters:", result);
  
  return result;
}

// Export the createQuarterRow function for external use if needed
export { createQuarterRow };