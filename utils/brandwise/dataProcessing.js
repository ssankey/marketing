
// // Calculate totals for a single row
// export function calculateRowTotal(row, categories) {
//   let totalSales = 0;
//   let totalWeightedMargin = 0;

//   categories.forEach(category => {
//     const sales = row[`${category}_Sales`] || 0;
//     const margin = row[`${category}_Margin`] || 0;
    
//     totalSales += sales;
//     if (sales > 0) {
//       totalWeightedMargin += sales * (margin / 100);
//     }
//   });

//   const avgMargin = totalSales > 0 
//     ? Number(((totalWeightedMargin / totalSales) * 100).toFixed(2))
//     : 0;

//   return {
//     totalSales,
//     avgMargin
//   };
// }

// // Generate fiscal year month definitions based on the selected year
// function getFiscalYearMonths(selectedYear) {
//   // Parse the fiscal year (e.g., "FY 2024-25" or "FY 2025-26")
//   const yearMatch = selectedYear.match(/FY\s*(\d{4})-(\d{2})/i);
  
//   if (!yearMatch) {
//     // Default to current FY if parsing fails
//     return [];
//   }
  
//   const startYear = parseInt(yearMatch[1]);
//   const endYearShort = parseInt(yearMatch[2]);
//   const endYear = endYearShort < 50 ? 2000 + endYearShort : 1900 + endYearShort;
  
//   return [
//     { year: startYear, month: 4, monthNumber: 4, name: "April" },
//     { year: startYear, month: 5, monthNumber: 5, name: "May" },
//     { year: startYear, month: 6, monthNumber: 6, name: "June" },
//     { year: startYear, month: 7, monthNumber: 7, name: "July" },
//     { year: startYear, month: 8, monthNumber: 8, name: "August" },
//     { year: startYear, month: 9, monthNumber: 9, name: "September" },
//     { year: startYear, month: 10, monthNumber: 10, name: "October" },
//     { year: startYear, month: 11, monthNumber: 11, name: "November" },
//     { year: startYear, month: 12, monthNumber: 12, name: "December" },
//     { year: endYear, month: 1, monthNumber: 1, name: "January" },
//     { year: endYear, month: 2, monthNumber: 2, name: "February" },
//     { year: endYear, month: 3, monthNumber: 3, name: "March" }
//   ];
// }

// // Ensure all 12 months exist in the dataset
// function ensureAllMonthsExist(mergedData, categories, selectedYear) {
//   // If "Complete" is selected, don't fill in missing months - use actual data
//   if (selectedYear === "Complete") {
//     return mergedData.sort((a, b) => {
//       if (a.Year !== b.Year) return b.Year - a.Year;
//       return b.MonthNumber - a.MonthNumber;
//     });
//   }
  
//   const fiscalMonths = getFiscalYearMonths(selectedYear);
  
//   if (fiscalMonths.length === 0) {
//     // Fallback to original data if parsing failed
//     return mergedData;
//   }
  
//   const dataMap = {};
  
//   // Map existing data by Year-Month key
//   mergedData.forEach(row => {
//     const key = `${row.Year}-${row.MonthNumber}`;
//     dataMap[key] = row;
//   });
  
//   // Fill in missing months with zero data
//   const completeData = fiscalMonths.map(monthInfo => {
//     const key = `${monthInfo.year}-${monthInfo.monthNumber}`;
    
//     if (dataMap[key]) {
//       // Month exists in data - use it
//       return {
//         ...dataMap[key],
//         Month: monthInfo.name // Ensure consistent month name
//       };
//     } else {
//       // Month missing - create empty row with zeros
//       const emptyRow = {
//         Year: monthInfo.year,
//         Month: monthInfo.name,
//         MonthNumber: monthInfo.monthNumber
//       };
      
//       // Initialize all category sales and margins to 0
//       categories.forEach(cat => {
//         emptyRow[`${cat}_Sales`] = 0;
//         emptyRow[`${cat}_Margin`] = 0;
//       });
      
//       return emptyRow;
//     }
//   });
  
//   return completeData;
// }

// // Create a quarter summary row
// function createQuarterRow(months, quarter, categories, fiscalYear) {
//   // For Q4, use the end year (e.g., 2025 for FY 2024-25, 2026 for FY 2025-26)
//   let displayYear = months[0]?.Year || 0;
  
//   // If it's Q4 and we have months from Jan-Mar, the fiscal year started previous year
//   if (quarter === "Q4" && months.length > 0 && months[0].MonthNumber <= 3) {
//     // Keep the calendar year for display consistency
//     displayYear = months[0].Year;
//   }
  
//   const quarterRow = {
//     Year: displayYear,
//     Month: quarter,
//     MonthNumber: null,
//     isQuarter: true
//   };
  
//   categories.forEach(category => {
//     const totalSales = months.reduce((sum, m) => sum + (m[`${category}_Sales`] || 0), 0);
//     let totalWeightedMargin = 0;
    
//     months.forEach(m => {
//       const sales = m[`${category}_Sales`] || 0;
//       const margin = m[`${category}_Margin`] || 0;
//       if (sales > 0) {
//         totalWeightedMargin += sales * (margin / 100);
//       }
//     });
    
//     const avgMargin = totalSales > 0 
//       ? Number(((totalWeightedMargin / totalSales) * 100).toFixed(2))
//       : 0;
    
//     quarterRow[`${category}_Sales`] = totalSales;
//     quarterRow[`${category}_Margin`] = avgMargin;
//   });
  
//   return quarterRow;
// }

// // /// Main function: Process data for display
// // export function processDataForDisplay(mergedData, categories, selectedYear = "FY 2025-26") {
// //   console.log("🔧 Processing data for year:", selectedYear);
// //   console.log("📥 Input merged data rows:", mergedData.length);
  
// //   // If "Complete" is selected, show all data without quarter summaries
// //   if (selectedYear === "Complete") {
// //     const sortedData = mergedData.sort((a, b) => {
// //       if (a.Year !== b.Year) return b.Year - a.Year;
// //       return b.MonthNumber - a.MonthNumber;
// //     });
    
// //     console.log("✅ Returning complete data (no quarters):", sortedData.length);
// //     return sortedData;
// //   }
  
// //   // For specific FY: Ensure all 12 months exist (fills missing months with zeros)
// //   const completeMonthlyData = ensureAllMonthsExist(mergedData, categories, selectedYear);
  
// //   console.log("✅ Complete monthly data (all 12 months):", completeMonthlyData.length);
  
// //   // Parse fiscal year for quarter calculation
// //   const yearMatch = selectedYear.match(/FY\s*(\d{4})-(\d{2})/i);
// //   if (!yearMatch) {
// //     console.warn("⚠️ Could not parse fiscal year, returning monthly data only");
// //     return completeMonthlyData;
// //   }
  
// //   const startYear = parseInt(yearMatch[1]);
// //   const endYearShort = parseInt(yearMatch[2]);
// //   const endYear = endYearShort < 50 ? 2000 + endYearShort : 1900 + endYearShort;
  
// //   const result = [];
  
// //   // Q1: April, May, June
// //   const q1Months = completeMonthlyData.filter(
// //     r => r.Year === startYear && [4, 5, 6].includes(r.MonthNumber)
// //   );
// //   q1Months.forEach(m => result.push(m));
// //   if (q1Months.length > 0) {
// //     result.push(createQuarterRow(q1Months, "Q1", categories, startYear));
// //   }
  
// //   // Q2: July, August, September
// //   const q2Months = completeMonthlyData.filter(
// //     r => r.Year === startYear && [7, 8, 9].includes(r.MonthNumber)
// //   );
// //   q2Months.forEach(m => result.push(m));
// //   if (q2Months.length > 0) {
// //     result.push(createQuarterRow(q2Months, "Q2", categories, startYear));
// //   }
  
// //   // Q3: October, November, December
// //   const q3Months = completeMonthlyData.filter(
// //     r => r.Year === startYear && [10, 11, 12].includes(r.MonthNumber)
// //   );
// //   q3Months.forEach(m => result.push(m));
// //   if (q3Months.length > 0) {
// //     result.push(createQuarterRow(q3Months, "Q3", categories, startYear));
// //   }
  
// //   // Q4: January, February, March (next calendar year)
// //   const q4Months = completeMonthlyData.filter(
// //     r => r.Year === endYear && [1, 2, 3].includes(r.MonthNumber)
// //   );
// //   q4Months.forEach(m => result.push(m));
// //   if (q4Months.length > 0) {
// //     result.push(createQuarterRow(q4Months, "Q4", categories, endYear));
// //   }
  
// //   console.log("✅ Final display data with quarters:", result.length, "rows");
  
// //   return result;
// // }

// // Main function: Process data for display
// export function processDataForDisplay(mergedData, categories, selectedYear = "FY 2025-26") {
//   console.log("🔧 Processing data for year:", selectedYear);
//   console.log("📥 Input merged data rows:", mergedData.length);
  
//   // If "Complete" is selected, show all data without quarter summaries
//   if (selectedYear === "Complete") {
//     const sortedData = mergedData.sort((a, b) => {
//       if (a.Year !== b.Year) return a.Year - b.Year; // Oldest year first
//       return a.MonthNumber - a.MonthNumber; // Oldest month first
//     });
    
//     console.log("✅ Returning complete data (oldest first):", sortedData.length);
//     return sortedData; // Return oldest first (will appear at top in table)
//   }
  
//   // For specific FY: Ensure all 12 months exist (fills missing months with zeros)
//   const completeMonthlyData = ensureAllMonthsExist(mergedData, categories, selectedYear);
  
//   console.log("✅ Complete monthly data (all 12 months):", completeMonthlyData.length);
  
//   // Parse fiscal year for quarter calculation
//   const yearMatch = selectedYear.match(/FY\s*(\d{4})-(\d{2})/i);
//   if (!yearMatch) {
//     console.warn("⚠️ Could not parse fiscal year, returning monthly data only");
//     return completeMonthlyData;
//   }
  
//   const startYear = parseInt(yearMatch[1]);
//   const endYearShort = parseInt(yearMatch[2]);
//   const endYear = endYearShort < 50 ? 2000 + endYearShort : 1900 + endYearShort;
  
//   const result = [];
  
//   // Q1: April, May, June
//   const q1Months = completeMonthlyData.filter(
//     r => r.Year === startYear && [4, 5, 6].includes(r.MonthNumber)
//   );
//   q1Months.forEach(m => result.push(m));
//   if (q1Months.length > 0) {
//     result.push(createQuarterRow(q1Months, "Q1", categories, startYear));
//   }
  
//   // Q2: July, August, September
//   const q2Months = completeMonthlyData.filter(
//     r => r.Year === startYear && [7, 8, 9].includes(r.MonthNumber)
//   );
//   q2Months.forEach(m => result.push(m));
//   if (q2Months.length > 0) {
//     result.push(createQuarterRow(q2Months, "Q2", categories, startYear));
//   }
  
//   // Q3: October, November, December
//   const q3Months = completeMonthlyData.filter(
//     r => r.Year === startYear && [10, 11, 12].includes(r.MonthNumber)
//   );
//   q3Months.forEach(m => result.push(m));
//   if (q3Months.length > 0) {
//     result.push(createQuarterRow(q3Months, "Q3", categories, startYear));
//   }
  
//   // Q4: January, February, March (next calendar year)
//   const q4Months = completeMonthlyData.filter(
//     r => r.Year === endYear && [1, 2, 3].includes(r.MonthNumber)
//   );
//   q4Months.forEach(m => result.push(m));
//   if (q4Months.length > 0) {
//     result.push(createQuarterRow(q4Months, "Q4", categories, endYear));
//   }
  
//   console.log("✅ Final display data with quarters:", result.length, "rows");
  
//   return result;
// }


// // Export the createQuarterRow function for external use if needed
// export { createQuarterRow };

// utils/brandwise/dataProcessing.js

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

// Generate fiscal year month definitions based on the selected year
function getFiscalYearMonths(selectedYear) {
  const yearMatch = selectedYear.match(/FY\s*(\d{4})-(\d{2})/i);
  
  if (!yearMatch) {
    return [];
  }
  
  const startYear = parseInt(yearMatch[1]);
  const endYearShort = parseInt(yearMatch[2]);
  const endYear = endYearShort < 50 ? 2000 + endYearShort : 1900 + endYearShort;
  
  return [
    { year: startYear, month: 4, monthNumber: 4, name: "April" },
    { year: startYear, month: 5, monthNumber: 5, name: "May" },
    { year: startYear, month: 6, monthNumber: 6, name: "June" },
    { year: startYear, month: 7, monthNumber: 7, name: "July" },
    { year: startYear, month: 8, monthNumber: 8, name: "August" },
    { year: startYear, month: 9, monthNumber: 9, name: "September" },
    { year: startYear, month: 10, monthNumber: 10, name: "October" },
    { year: startYear, month: 11, monthNumber: 11, name: "November" },
    { year: startYear, month: 12, monthNumber: 12, name: "December" },
    { year: endYear, month: 1, monthNumber: 1, name: "January" },
    { year: endYear, month: 2, monthNumber: 2, name: "February" },
    { year: endYear, month: 3, monthNumber: 3, name: "March" }
  ];
}

// Ensure all 12 months exist in the dataset
function ensureAllMonthsExist(mergedData, categories, selectedYear) {
  if (selectedYear === "Complete") {
    // For complete view, sort oldest first (will appear at top)
    return mergedData.sort((a, b) => {
      if (a.Year !== b.Year) return a.Year - b.Year;
      return a.MonthNumber - b.MonthNumber;
    });
  }
  
  const fiscalMonths = getFiscalYearMonths(selectedYear);
  
  if (fiscalMonths.length === 0) {
    return mergedData;
  }
  
  const dataMap = {};
  
  mergedData.forEach(row => {
    const key = `${row.Year}-${row.MonthNumber}`;
    dataMap[key] = row;
  });
  
  // Fill in missing months with zero data
  const completeData = fiscalMonths.map(monthInfo => {
    const key = `${monthInfo.year}-${monthInfo.monthNumber}`;
    
    if (dataMap[key]) {
      return {
        ...dataMap[key],
        Month: monthInfo.name
      };
    } else {
      const emptyRow = {
        Year: monthInfo.year,
        Month: monthInfo.name,
        MonthNumber: monthInfo.monthNumber
      };
      
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
function createQuarterRow(months, quarter, categories, fiscalYear) {
  let displayYear = months[0]?.Year || 0;
  
  if (quarter === "Q4" && months.length > 0 && months[0].MonthNumber <= 3) {
    displayYear = months[0].Year;
  }
  
  const quarterRow = {
    Year: displayYear,
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

// Main function: Process data for display - OLDEST FIRST (LATEST AT BOTTOM)
export function processDataForDisplay(mergedData, categories, selectedYear = "FY 2025-26") {
  console.log("🔧 Processing data for year:", selectedYear);
  console.log("📥 Input merged data rows:", mergedData.length);
  
  // If "Complete" is selected, show all data without quarter summaries
  // Sort OLDEST FIRST (latest will be at bottom)
  if (selectedYear === "Complete") {
    const sortedData = mergedData.sort((a, b) => {
      if (a.Year !== b.Year) return a.Year - b.Year; // Oldest year first
      return a.MonthNumber - b.MonthNumber; // Oldest month first
    });
    
    console.log("✅ Returning complete data (oldest first, latest at bottom):", sortedData.length);
    return sortedData;
  }
  
  // For specific FY: Ensure all 12 months exist (fills missing months with zeros)
  const completeMonthlyData = ensureAllMonthsExist(mergedData, categories, selectedYear);
  
  console.log("✅ Complete monthly data (all 12 months):", completeMonthlyData.length);
  
  // Parse fiscal year for quarter calculation
  const yearMatch = selectedYear.match(/FY\s*(\d{4})-(\d{2})/i);
  if (!yearMatch) {
    console.warn("⚠️ Could not parse fiscal year, returning monthly data only");
    return completeMonthlyData;
  }
  
  const startYear = parseInt(yearMatch[1]);
  const endYearShort = parseInt(yearMatch[2]);
  const endYear = endYearShort < 50 ? 2000 + endYearShort : 1900 + endYearShort;
  
  const result = [];
  
  // Q1: April, May, June (oldest quarter, appears first)
  const q1Months = completeMonthlyData.filter(
    r => r.Year === startYear && [4, 5, 6].includes(r.MonthNumber)
  );
  q1Months.forEach(m => result.push(m));
  if (q1Months.length > 0) {
    result.push(createQuarterRow(q1Months, "Q1", categories, startYear));
  }
  
  // Q2: July, August, September
  const q2Months = completeMonthlyData.filter(
    r => r.Year === startYear && [7, 8, 9].includes(r.MonthNumber)
  );
  q2Months.forEach(m => result.push(m));
  if (q2Months.length > 0) {
    result.push(createQuarterRow(q2Months, "Q2", categories, startYear));
  }
  
  // Q3: October, November, December
  const q3Months = completeMonthlyData.filter(
    r => r.Year === startYear && [10, 11, 12].includes(r.MonthNumber)
  );
  q3Months.forEach(m => result.push(m));
  if (q3Months.length > 0) {
    result.push(createQuarterRow(q3Months, "Q3", categories, startYear));
  }
  
  // Q4: January, February, March (latest quarter, appears last)
  const q4Months = completeMonthlyData.filter(
    r => r.Year === endYear && [1, 2, 3].includes(r.MonthNumber)
  );
  q4Months.forEach(m => result.push(m));
  if (q4Months.length > 0) {
    result.push(createQuarterRow(q4Months, "Q4", categories, endYear));
  }
  
  console.log("✅ Final display data with quarters (oldest first, latest at bottom):", result.length, "rows");
  
  return result;
}

// Export the createQuarterRow function for external use if needed
export { createQuarterRow };