
import * as XLSX from "xlsx";
import { TARGET_SALES_CR_FY_2025_26 } from "./targets";

// Convert to crores function - ROUND TO 2 DECIMALS
const toCrores = (value) => {
  return (value / 10000000).toFixed(2);
};

// Helper function to calculate row totals (same as in your component)
const calculateRowTotal = (row, categories) => {
  let totalSales = 0;
  let totalWeightedMargin = 0;

  categories.forEach(category => {
    const sales = row[`${category}_Sales`] || 0;
    const margin = row[`${category}_Margin`] || 0;
    totalSales += sales;
    totalWeightedMargin += sales * (margin / 100);
  });

  const avgMargin = totalSales > 0 ? Number(((totalWeightedMargin / totalSales) * 100).toFixed(2)) : 0;

  return {
    totalSales,
    avgMargin,
    totalWeightedMargin
  };
};

// Month key helper (same as in your component)
const toMonthKey = (row) =>
  `${row.Year}-${String(row.MonthNumber).padStart(2, "0")}`;

// Quarter helpers (same as in your component)
const QUARTER_MAP = {
  Q1: [4, 5, 6],    // Apr-Jun
  Q2: [7, 8, 9],    // Jul-Sep
  Q3: [10, 11, 12], // Oct-Dec
  Q4: [1, 2, 3],    // Jan-Mar
};

const getQuarterMonthNumbers = (qLabel) => QUARTER_MAP[qLabel] || [];

// Helper to extract fiscal year from row
const getFiscalYearFromRow = (row) => {
  const yearMatch = row.Year?.toString().match(/(\d{4})/);
  if (!yearMatch) return null;
  const rowYear = parseInt(yearMatch[1], 10);
  const monthLabel = String(row.Month || "").toUpperCase();

  if (monthLabel === "Q4") {
    return rowYear - 1;
  }

  return rowYear;
};

// Calculate grand totals (same logic as your component)
const calculateGrandTotals = (data, categories) => {
  const totals = {
    totalSales: 0,
    totalTarget: 0,
    totalWeightedMargin: 0,
    categorySales: {},
    categoryTarget: {},
    categoryMargins: {},
  };

  // Initialize category buckets
  categories.forEach((c) => {
    totals.categorySales[c] = 0;
    totals.categoryTarget[c] = 0;
    totals.categoryMargins[c] = {
      totalWeightedMargin: 0,
      totalSales: 0
    };
  });

  // Filter only monthly rows (non-quarter rows)
  const monthlyRows = data.filter(row => !row.isQuarter && row.MonthNumber);

  // Calculate totals from monthly data
  monthlyRows.forEach((row) => {
    // Actual sales
    const rowTotals = calculateRowTotal(row, categories);
    totals.totalSales += rowTotals.totalSales;
    totals.totalWeightedMargin += rowTotals.totalSales * (rowTotals.avgMargin / 100);
    
    // Per-category actuals
    categories.forEach((cat) => {
      const sales = row[`${cat}_Sales`] || 0;
      const margin = row[`${cat}_Margin`] || 0;
      
      totals.categorySales[cat] += sales;
      totals.categoryMargins[cat].totalWeightedMargin += sales * (margin / 100);
      totals.categoryMargins[cat].totalSales += sales;
    });

    // Targets (Cr)
    const mKey = toMonthKey(row);
    let rowTarget = 0;
    categories.forEach((cat) => {
      const t = TARGET_SALES_CR_FY_2025_26?.[mKey]?.[cat] ?? 0;
      totals.categoryTarget[cat] += t;
      rowTarget += t;
    });
    totals.totalTarget += rowTarget;
  });

  // Calculate grand total margin (weighted average)
  totals.grandTotalMargin = totals.totalSales > 0 
    ? Number(((totals.totalWeightedMargin / totals.totalSales) * 100).toFixed(2))
    : 0;

  // Calculate individual category margins
  categories.forEach(cat => {
    const marginData = totals.categoryMargins[cat];
    totals.categoryMargins[cat].finalMargin = marginData.totalSales > 0 ?
      Number(((marginData.totalWeightedMargin / marginData.totalSales) * 100).toFixed(2)) : 0;
  });

  return totals;
};

// Quarter target helpers accounting for fiscal year spanning
const calcQuarterCategoryTarget = (qLabel, category, data, row) => {
  const fiscalYear = getFiscalYearFromRow(row);
  if (!fiscalYear) return 0;
  
  const monthlyRows = data.filter((r) => !r.isQuarter && r.MonthNumber);
  const monthNums = new Set(getQuarterMonthNumbers(qLabel));
  
  const quarterRows = monthlyRows.filter((r) => {
    const monthNum = Number(r.MonthNumber);
    if (!monthNums.has(monthNum)) return false;
    
    // For Q4 (Jan-Mar), year should be fiscalYear + 1
    // For Q1-Q3 (Apr-Dec), year should be fiscalYear
    if (qLabel === 'Q4' && [1, 2, 3].includes(monthNum)) {
      return r.Year === fiscalYear + 1;
    } else {
      return r.Year === fiscalYear;
    }
  });
  
  return quarterRows.reduce((sum, row) => {
    const mKey = toMonthKey(row);
    return sum + (TARGET_SALES_CR_FY_2025_26?.[mKey]?.[category] ?? 0);
  }, 0);
};

const calcQuarterRowTarget = (qLabel, categories, data, row) => {
  const fiscalYear = getFiscalYearFromRow(row);
  if (!fiscalYear) return 0;
  
  const monthlyRows = data.filter((r) => !r.isQuarter && r.MonthNumber);
  const monthNums = new Set(getQuarterMonthNumbers(qLabel));
  
  const quarterRows = monthlyRows.filter((r) => {
    const monthNum = Number(r.MonthNumber);
    if (!monthNums.has(monthNum)) return false;
    
    // For Q4 (Jan-Mar), year should be fiscalYear + 1
    // For Q1-Q3 (Apr-Dec), year should be fiscalYear
    if (qLabel === 'Q4' && [1, 2, 3].includes(monthNum)) {
      return r.Year === fiscalYear + 1;
    } else {
      return r.Year === fiscalYear;
    }
  });
  
  return quarterRows.reduce((acc, row) => {
    const mKey = toMonthKey(row);
    const rowTargets = categories.reduce(
      (s, c) => s + (TARGET_SALES_CR_FY_2025_26?.[mKey]?.[c] ?? 0),
      0
    );
    return acc + rowTargets;
  }, 0);
};

export const exportToExcel = (data, categories, selectedYear, targetMargins) => {
  if (data.length === 0 || categories.length === 0) {
    alert("No data to export");
    return;
  }

  const excelData = [];
  const grandTotals = calculateGrandTotals(data, categories);
  
  // ⭐ FIX #3: Match table format with Achieved %, Target (Cr), Sales (Cr), GM %
  
  // Header Row 1 - "Total" and Category names (merged across 4 columns each)
  const headerRow1 = ["Year", "Month", "Total", "", "", ""];
  categories.forEach(cat => {
    headerRow1.push(cat, "", "", ""); // Empty strings for merging (4 columns each)
  });
  
  // Header Row 2 - Column sub-headers
  const headerRow2 = ["", "", "Achieved %", "Target (Cr)", "Sales (Cr)", "GM %"];
  categories.forEach(cat => {
    const targetMargin = targetMargins[cat] || targetMargins["Other"] || 20;
    headerRow2.push("Achieved %", "Target (Cr)", "Sales (Cr)", `GM (${targetMargin}%)`);
  });
  
  excelData.push(headerRow1);
  excelData.push(headerRow2);
  
  // Data rows - reverse to show latest at bottom (same as table)
  const reversedData = [...data].reverse();
  const displayData = data;
  displayData.forEach(row => {
    const rowData = [row.Year, row.Month];
    
    let totalSales = 0;
    let totalWeightedMargin = 0;
    
    // Calculate total sales first
    categories.forEach(cat => {
      const sales = row[`${cat}_Sales`] || 0;
      const margin = row[`${cat}_Margin`] || 0;
      totalSales += sales;
      totalWeightedMargin += sales * (margin / 100);
    });
    
    // Calculate weighted average margin for Total
    const avgMargin = totalSales > 0 ? (totalWeightedMargin / totalSales) * 100 : 0;
    
    // Calculate row target total
    let rowTargetCr = 0;
    if (row.isQuarter) {
      const qLabel = String(row.Month || "").toUpperCase();
      rowTargetCr = calcQuarterRowTarget(qLabel, categories, data, row);
    } else if (row.MonthNumber) {
      const mKey = toMonthKey(row);
      rowTargetCr = categories.reduce(
        (acc, c) => acc + (TARGET_SALES_CR_FY_2025_26?.[mKey]?.[c] ?? 0),
        0
      );
    }
    
    const totalSalesCr = Number(toCrores(totalSales));
    const totalAchievedPct = rowTargetCr > 0 
      ? Number(((totalSalesCr / rowTargetCr) * 100).toFixed(2))
      : null;
    
    // Add TOTAL columns (4 columns: Achieved %, Target, Sales, GM)
    rowData.push(
      totalAchievedPct != null ? `${totalAchievedPct}%` : "-",  // Achieved %
      Number(rowTargetCr.toFixed(2)),                           // Target (Cr)
      totalSalesCr,                                             // Sales (Cr)
      Number(avgMargin.toFixed(2))                              // GM %
    );
    
    // Add category data (4 columns each: Achieved %, Target, Sales, GM)
    categories.forEach(cat => {
      const sales = row[`${cat}_Sales`] || 0;
      const margin = row[`${cat}_Margin`] || 0;
      
      // Calculate target value
      let targetValue = 0;
      if (row.isQuarter) {
        const qLabel = String(row.Month || "").toUpperCase();
        targetValue = calcQuarterCategoryTarget(qLabel, cat, data, row);
      } else if (row.MonthNumber) {
        const mKey = toMonthKey(row);
        targetValue = TARGET_SALES_CR_FY_2025_26?.[mKey]?.[cat] ?? 0;
      }
      
      const salesCr = Number(toCrores(sales));
      const achievedPct = targetValue > 0 
        ? Number(((salesCr / targetValue) * 100).toFixed(2))
        : null;
      
      // Push 4 columns for this category
      rowData.push(
        achievedPct != null ? `${achievedPct}%` : "-",  // Achieved %
        Number(targetValue.toFixed(2)),                 // Target (Cr)
        salesCr,                                        // Sales (Cr)
        Number(margin)                                  // GM %
      );
    });
    
    excelData.push(rowData);
  });
  
  // GRAND TOTAL ROW
  const totalRow = ["Total", "-"];
  
  // Total columns (4 columns)
  const totalSalesCr = Number(toCrores(grandTotals.totalSales));
  const totalTargetCr = Number(grandTotals.totalTarget);
  const totalAchievedPct = totalTargetCr > 0
    ? Number(((totalSalesCr / totalTargetCr) * 100).toFixed(2))
    : null;
  
  totalRow.push(
    totalAchievedPct != null ? `${totalAchievedPct}%` : "-",  // Achieved %
    totalTargetCr.toFixed(2),                                 // Target
    totalSalesCr,                                             // Sales
    Number(grandTotals.grandTotalMargin)                      // GM %
  );
  
  // Category totals (4 columns each)
  categories.forEach(cat => {
    const categoryTarget = grandTotals.categoryTarget[cat] || 0;
    const categorySales = grandTotals.categorySales[cat] || 0;
    const categoryMargin = grandTotals.categoryMargins[cat]?.finalMargin || 0;
    
    const categorySalesCr = Number(toCrores(categorySales));
    const categoryAchievedPct = categoryTarget > 0
      ? Number(((categorySalesCr / categoryTarget) * 100).toFixed(2))
      : null;
    
    totalRow.push(
      categoryAchievedPct != null ? `${categoryAchievedPct}%` : "-",  // Achieved %
      Number(categoryTarget.toFixed(2)),                              // Target
      categorySalesCr,                                                // Sales
      Number(categoryMargin)                                          // GM %
    );
  });
  
  excelData.push(totalRow);
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(excelData);
  
  // Apply merging for header rows
  if (!ws['!merges']) ws['!merges'] = [];
  
  // Merge Year and Month header cells
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }); // Year
  ws['!merges'].push({ s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }); // Month
  
  // Merge Total header (4 columns)
  ws['!merges'].push({ s: { r: 0, c: 2 }, e: { r: 0, c: 5 } });
  
  // Merge category headers (each category spans 4 columns)
  let colIndex = 6; // Start after Year, Month, and Total columns
  categories.forEach(() => {
    ws['!merges'].push({
      s: { r: 0, c: colIndex },
      e: { r: 0, c: colIndex + 3 }
    });
    colIndex += 4;
  });
  
  // Set column widths for better readability
  const colWidths = [
    { wch: 8 },  // Year
    { wch: 12 }, // Month
  ];
  
  // Total columns (4 columns)
  colWidths.push({ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 });
  
  // Category columns (each category has 4 columns)
  categories.forEach(() => {
    colWidths.push({ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 });
  });
  
  ws['!cols'] = colWidths;
  
  // Apply number formatting
  const range = XLSX.utils.decode_range(ws['!ref']);
  
  for (let R = 2; R <= range.e.r; R++) { // Start from data rows (skip headers)
    let colOffset = 2; // Start after Year and Month
    
    // Process Total + each category (4 columns each)
    for (let i = 0; i < categories.length + 1; i++) { // +1 for Total
      const achievedCol = colOffset;
      const targetCol = colOffset + 1;
      const salesCol = colOffset + 2;
      const gmCol = colOffset + 3;
      
      // Achieved % is already formatted as text with %
      
      // Format Target column (numeric with 2 decimals)
      const targetCell = XLSX.utils.encode_cell({ r: R, c: targetCol });
      if (ws[targetCell] && typeof ws[targetCell].v === 'number') {
        ws[targetCell].z = '#,##0.00';
      }
      
      // Format Sales column (numeric with 2 decimals)
      const salesCell = XLSX.utils.encode_cell({ r: R, c: salesCol });
      if (ws[salesCell] && typeof ws[salesCell].v === 'number') {
        ws[salesCell].z = '#,##0.00';
      }
      
      // Format GM column (numeric with 2 decimals)
      const gmCell = XLSX.utils.encode_cell({ r: R, c: gmCol });
      if (ws[gmCell] && typeof ws[gmCell].v === 'number') {
        ws[gmCell].z = '0.00';
      }
      
      colOffset += 4; // Move to next group (Total or category)
    }
  }
  
  XLSX.utils.book_append_sheet(wb, ws, "Quarterly Analysis");
  XLSX.writeFile(
    wb,
    `Quarterly_Analysis_${selectedYear.replace(/ /g, '_')}_${new Date().toISOString().split("T")[0]}.xlsx`
  );
};