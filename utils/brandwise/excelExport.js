
// // utils/brandwise/excelExport.js
// import * as XLSX from "xlsx";
// import { TARGET_SALES_CR_FY_2025_26 } from "./targets";

// // Convert to crores function - ROUND TO 2 DECIMALS
// const toCrores = (value) => {
//   return (value / 10000000).toFixed(2);
// };

// // Helper function to calculate row totals (same as in your component)
// const calculateRowTotal = (row, categories) => {
//   let totalSales = 0;
//   let totalWeightedMargin = 0;

//   categories.forEach(category => {
//     const sales = row[`${category}_Sales`] || 0;
//     const margin = row[`${category}_Margin`] || 0;
//     totalSales += sales;
//     totalWeightedMargin += sales * (margin / 100);
//   });

//   const avgMargin = totalSales > 0 ? Number(((totalWeightedMargin / totalSales) * 100).toFixed(2)) : 0;

//   return {
//     totalSales,
//     avgMargin,
//     totalWeightedMargin
//   };
// };

// // Month key helper (same as in your component)
// const toMonthKey = (row) =>
//   `${row.Year}-${String(row.MonthNumber).padStart(2, "0")}`;

// // Quarter helpers (same as in your component)
// const QUARTER_MAP = {
//   Q1: [4, 5, 6],    // Apr-Jun
//   Q2: [7, 8, 9],    // Jul-Sep
//   Q3: [10, 11, 12], // Oct-Dec
//   Q4: [1, 2, 3],    // Jan-Mar
// };

// const getQuarterMonthNumbers = (qLabel) => QUARTER_MAP[qLabel] || [];

// // Calculate grand totals (same logic as your component)
// const calculateGrandTotals = (data, categories) => {
//   const totals = {
//     totalSales: 0,
//     totalTarget: 0,
//     totalWeightedMargin: 0,
//     categorySales: {},
//     categoryTarget: {},
//     categoryMargins: {},
//   };

//   // Initialize category buckets
//   categories.forEach((c) => {
//     totals.categorySales[c] = 0;
//     totals.categoryTarget[c] = 0;
//     totals.categoryMargins[c] = {
//       totalWeightedMargin: 0,
//       totalSales: 0
//     };
//   });

//   // Filter only monthly rows (non-quarter rows)
//   const monthlyRows = data.filter(row => !row.isQuarter && row.MonthNumber);

//   // Calculate totals from monthly data
//   monthlyRows.forEach((row) => {
//     // Actual sales
//     const rowTotals = calculateRowTotal(row, categories);
//     totals.totalSales += rowTotals.totalSales;
//     totals.totalWeightedMargin += rowTotals.totalSales * (rowTotals.avgMargin / 100);
    
//     // Per-category actuals
//     categories.forEach((cat) => {
//       const sales = row[`${cat}_Sales`] || 0;
//       const margin = row[`${cat}_Margin`] || 0;
      
//       totals.categorySales[cat] += sales;
//       totals.categoryMargins[cat].totalWeightedMargin += sales * (margin / 100);
//       totals.categoryMargins[cat].totalSales += sales;
//     });

//     // Targets (Cr)
//     const mKey = toMonthKey(row);
//     let rowTarget = 0;
//     categories.forEach((cat) => {
//       const t = TARGET_SALES_CR_FY_2025_26?.[mKey]?.[cat] ?? 0;
//       totals.categoryTarget[cat] += t;
//       rowTarget += t;
//     });
//     totals.totalTarget += rowTarget;
//   });

//   // Calculate grand total margin (weighted average)
//   totals.grandTotalMargin = totals.totalSales > 0 
//     ? Number(((totals.totalWeightedMargin / totals.totalSales) * 100).toFixed(2))
//     : 0;

//   // Calculate individual category margins
//   categories.forEach(cat => {
//     const marginData = totals.categoryMargins[cat];
//     totals.categoryMargins[cat].finalMargin = marginData.totalSales > 0 ?
//       Number(((marginData.totalWeightedMargin / marginData.totalSales) * 100).toFixed(2)) : 0;
//   });

//   return totals;
// };

// // Get visible months from data
// const getVisibleMonthKeys = (data) => {
//   const monthlyRows = data.filter((r) => !r.isQuarter && r.MonthNumber);
//   return new Set(monthlyRows.map((r) => toMonthKey(r)));
// };

// // Calculate quarter category target
// const calcQuarterCategoryTarget = (qLabel, category, data) => {
//   const monthlyRows = data.filter((r) => !r.isQuarter && r.MonthNumber);
//   const monthNums = new Set(getQuarterMonthNumbers(qLabel));
//   const quarterRows = monthlyRows.filter((r) => monthNums.has(Number(r.MonthNumber)));
  
//   return quarterRows.reduce((sum, row) => {
//     const mKey = toMonthKey(row);
//     return sum + (TARGET_SALES_CR_FY_2025_26?.[mKey]?.[category] ?? 0);
//   }, 0);
// };

// // Calculate quarter row target
// const calcQuarterRowTarget = (qLabel, categories, data) => {
//   const monthlyRows = data.filter((r) => !r.isQuarter && r.MonthNumber);
//   const monthNums = new Set(getQuarterMonthNumbers(qLabel));
//   const quarterRows = monthlyRows.filter((r) => monthNums.has(Number(r.MonthNumber)));
  
//   return quarterRows.reduce((acc, row) => {
//     const mKey = toMonthKey(row);
//     const rowTargets = categories.reduce(
//       (s, c) => s + (TARGET_SALES_CR_FY_2025_26?.[mKey]?.[c] ?? 0),
//       0
//     );
//     return acc + rowTargets;
//   }, 0);
// };

// export const exportToExcel = (data, categories, selectedYear, targetMargins) => {
//   if (data.length === 0 || categories.length === 0) {
//     alert("No data to export");
//     return;
//   }

//   const excelData = [];
//   const grandTotals = calculateGrandTotals(data, categories);
  
//   // Header Row 1 - Category names (merged across 3 columns each)
//   const headerRow1 = ["Year", "Month"];
//   categories.forEach(cat => {
//     headerRow1.push(cat, "", ""); // Empty strings for merging
//   });
//   headerRow1.push("Total", "", ""); // Total header
  
//   // Header Row 2 - Target/Sales/Margin with target margin percentages
//   const headerRow2 = ["", ""];
//   categories.forEach(cat => {
//     const targetMargin = targetMargins[cat] || targetMargins["Other"] || 20;
//     headerRow2.push(`Target (${targetMargin}%)`, "Sales (Cr)", "Margin %");
//   });
//   headerRow2.push("Target (Cr)", "Sales (Cr)", "Margin %");
  
//   excelData.push(headerRow1);
//   excelData.push(headerRow2);
  
//   // Data rows
//   data.forEach(row => {
//     const rowData = [row.Year, row.Month];
    
//     let totalSales = 0;
//     let totalWeightedMargin = 0;
    
//     // Add category data
//     categories.forEach(cat => {
//       const sales = row[`${cat}_Sales`] || 0;
//       const margin = row[`${cat}_Margin`] || 0;
      
//       totalSales += sales;
//       totalWeightedMargin += sales * (margin / 100);
      
//       // Calculate target value (same logic as QuarterlyTable)
//       let targetValue = 0;
//       if (row.isQuarter) {
//         const qLabel = String(row.Month || "").toUpperCase();
//         targetValue = calcQuarterCategoryTarget(qLabel, cat, data);
//       } else if (row.MonthNumber) {
//         const mKey = toMonthKey(row);
//         targetValue = TARGET_SALES_CR_FY_2025_26?.[mKey]?.[cat] ?? 0;
//       }
      
//       // Push data for this category (3 columns)
//       rowData.push(Number(targetValue)); // Target in Crores
//       rowData.push(Number(toCrores(sales))); // Sales in Crores
//       rowData.push(Number(margin)); // Margin %
//     });
    
//     // Calculate weighted average margin
//     const avgMargin = totalSales > 0 ? 
//       (totalWeightedMargin / totalSales) * 100 : 0;
    
//     // Calculate row target total (same logic as QuarterlyTable)
//     let rowTargetCr = 0;
//     if (row.isQuarter) {
//       const qLabel = String(row.Month || "").toUpperCase();
//       rowTargetCr = calcQuarterRowTarget(qLabel, categories, data);
//     } else if (row.MonthNumber) {
//       const mKey = toMonthKey(row);
//       rowTargetCr = categories.reduce(
//         (acc, c) => acc + (TARGET_SALES_CR_FY_2025_26?.[mKey]?.[c] ?? 0),
//         0
//       );
//     }
    
//     // Push total data (3 columns)
//     rowData.push(Number(rowTargetCr)); // Target in Crores
//     rowData.push(Number(toCrores(totalSales))); // Total Sales in Crores
//     rowData.push(Number(avgMargin.toFixed(2))); // Weighted Average Margin
    
//     excelData.push(rowData);
//   });
  
//   // GRAND TOTAL ROW (same as in QuarterlyTable)
//   const totalRow = ["Total", "-"];
  
//   // Category totals across all visible months
//   categories.forEach(cat => {
//     const categoryTarget = grandTotals.categoryTarget[cat] || 0;
//     const categorySales = grandTotals.categorySales[cat] || 0;
//     const categoryMargin = grandTotals.categoryMargins[cat]?.finalMargin || 0;
    
//     totalRow.push(Number(categoryTarget)); // Target
//     totalRow.push(Number(toCrores(categorySales))); // Sales
//     totalRow.push(Number(categoryMargin)); // Margin
//   });
  
//   // Overall totals (only visible months)
//   totalRow.push(Number(grandTotals.totalTarget)); // Total Target
//   totalRow.push(Number(toCrores(grandTotals.totalSales))); // Total Sales
//   totalRow.push(Number(grandTotals.grandTotalMargin)); // Total Margin
  
//   excelData.push(totalRow);
  
//   const wb = XLSX.utils.book_new();
//   const ws = XLSX.utils.aoa_to_sheet(excelData);
  
//   // Apply merging for header rows
//   if (!ws['!merges']) ws['!merges'] = [];
  
//   // Merge category headers (each category spans 3 columns)
//   let colIndex = 2; // Start after Year and Month columns
//   categories.forEach(() => {
//     ws['!merges'].push({
//       s: { r: 0, c: colIndex },
//       e: { r: 0, c: colIndex + 2 }
//     });
//     colIndex += 3;
//   });
  
//   // Merge Total header
//   ws['!merges'].push({
//     s: { r: 0, c: colIndex },
//     e: { r: 0, c: colIndex + 2 }
//   });
  
//   // Set column widths for better readability
//   if (!ws['!cols']) ws['!cols'] = [];
  
//   const colWidths = [
//     { wch: 8 },  // Year
//     { wch: 12 }, // Month
//   ];
  
//   // Set widths for category columns (each category has 3 columns)
//   categories.forEach(() => {
//     colWidths.push({ wch: 12 });  // Target
//     colWidths.push({ wch: 12 });  // Sales (Cr)
//     colWidths.push({ wch: 10 });  // Margin %
//   });
  
//   // Set widths for total columns
//   colWidths.push({ wch: 12 }, { wch: 12 }, { wch: 10 });
  
//   ws['!cols'] = colWidths;
  
//   // Apply number formatting to specific columns
//   const range = XLSX.utils.decode_range(ws['!ref']);
  
//   for (let R = 2; R <= range.e.r; R++) { // Start from data rows (skip headers)
//     let colOffset = 2; // Start after Year and Month
    
//     // Process each category's 3 columns + total columns
//     for (let i = 0; i < categories.length + 1; i++) { // +1 for Total
//       const targetCol = colOffset;
//       const salesCol = colOffset + 1;
//       const marginCol = colOffset + 2;
      
//       // Format Target column (currency)
//       const targetCell = XLSX.utils.encode_cell({ r: R, c: targetCol });
//       if (ws[targetCell]) {
//         if (!ws[targetCell].z) ws[targetCell].z = '#,##0.00';
//       }
      
//       // Format Sales column (currency)
//       const salesCell = XLSX.utils.encode_cell({ r: R, c: salesCol });
//       if (ws[salesCell]) {
//         if (!ws[salesCell].z) ws[salesCell].z = '#,##0.00';
//       }
      
//       // Format Margin column (percentage)
//       const marginCell = XLSX.utils.encode_cell({ r: R, c: marginCol });
//       if (ws[marginCell]) {
//         if (!ws[marginCell].z) ws[marginCell].z = '0.00"%";-0.00"%";0.00"%";';
//       }
      
//       colOffset += 3; // Move to next category
//     }
//   }
  
//   XLSX.utils.book_append_sheet(wb, ws, "Quarterly Analysis");
//   XLSX.writeFile(
//     wb,
//     `Quarterly_Analysis_${selectedYear.replace(/ /g, '_')}_${new Date().toISOString().split("T")[0]}.xlsx`
//   );
// };


// utils/brandwise/excelExport.js
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

// ⬇️ REVISED: Quarter target helpers constrained to the row's YEAR
const calcQuarterCategoryTarget = (qLabel, category, data, rowYear) => {
  const monthlyRows = data.filter(
    (r) => !r.isQuarter && r.MonthNumber && r.Year === rowYear
  );
  const monthNums = new Set(getQuarterMonthNumbers(qLabel));
  const quarterRows = monthlyRows.filter((r) => monthNums.has(Number(r.MonthNumber)));
  
  return quarterRows.reduce((sum, row) => {
    const mKey = toMonthKey(row);
    return sum + (TARGET_SALES_CR_FY_2025_26?.[mKey]?.[category] ?? 0);
  }, 0);
};

const calcQuarterRowTarget = (qLabel, categories, data, rowYear) => {
  const monthlyRows = data.filter(
    (r) => !r.isQuarter && r.MonthNumber && r.Year === rowYear
  );
  const monthNums = new Set(getQuarterMonthNumbers(qLabel));
  const quarterRows = monthlyRows.filter((r) => monthNums.has(Number(r.MonthNumber)));
  
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
  
  // Header Row 1 - Category names (merged across 3 columns each)
  const headerRow1 = ["Year", "Month"];
  categories.forEach(cat => {
    headerRow1.push(cat, "", ""); // Empty strings for merging
  });
  headerRow1.push("Total", "", ""); // Total header
  
  // Header Row 2 - Target/Sales/Margin with target margin percentages
  const headerRow2 = ["", ""];
  categories.forEach(cat => {
    const targetMargin = targetMargins[cat] || targetMargins["Other"] || 20;
    headerRow2.push(`Target (${targetMargin}%)`, "Sales (Cr)", "Margin %");
  });
  headerRow2.push("Target (Cr)", "Sales (Cr)", "Margin %");
  
  excelData.push(headerRow1);
  excelData.push(headerRow2);
  
  // Data rows
  data.forEach(row => {
    const rowData = [row.Year, row.Month];
    
    let totalSales = 0;
    let totalWeightedMargin = 0;
    
    // Add category data
    categories.forEach(cat => {
      const sales = row[`${cat}_Sales`] || 0;
      const margin = row[`${cat}_Margin`] || 0;
      
      totalSales += sales;
      totalWeightedMargin += sales * (margin / 100);
      
      // Calculate target value (scoped to row's year for quarters)
      let targetValue = 0;
      if (row.isQuarter) {
        const qLabel = String(row.Month || "").toUpperCase();
        targetValue = calcQuarterCategoryTarget(qLabel, cat, data, row.Year); // ⬅️ pass row.Year
      } else if (row.MonthNumber) {
        const mKey = toMonthKey(row);
        targetValue = TARGET_SALES_CR_FY_2025_26?.[mKey]?.[cat] ?? 0;
      }
      
      // Push data for this category (3 columns)
      rowData.push(Number(targetValue));         // Target in Crores
      rowData.push(Number(toCrores(sales)));     // Sales in Crores
      rowData.push(Number(margin));              // Margin %
    });
    
    // Calculate weighted average margin
    const avgMargin = totalSales > 0 ? 
      (totalWeightedMargin / totalSales) * 100 : 0;
    
    // Calculate row target total (scoped to row's year for quarters)
    let rowTargetCr = 0;
    if (row.isQuarter) {
      const qLabel = String(row.Month || "").toUpperCase();
      rowTargetCr = calcQuarterRowTarget(qLabel, categories, data, row.Year); // ⬅️ pass row.Year
    } else if (row.MonthNumber) {
      const mKey = toMonthKey(row);
      rowTargetCr = categories.reduce(
        (acc, c) => acc + (TARGET_SALES_CR_FY_2025_26?.[mKey]?.[c] ?? 0),
        0
      );
    }
    
    // Push total data (3 columns)
    rowData.push(Number(rowTargetCr));                 // Target in Crores
    rowData.push(Number(toCrores(totalSales)));        // Total Sales in Crores
    rowData.push(Number(avgMargin.toFixed(2)));        // Weighted Average Margin
    
    excelData.push(rowData);
  });
  
  // GRAND TOTAL ROW (same as in QuarterlyTable)
  const totalRow = ["Total", "-"];
  
  // Category totals across all visible months
  categories.forEach(cat => {
    const categoryTarget = grandTotals.categoryTarget[cat] || 0;
    const categorySales = grandTotals.categorySales[cat] || 0;
    const categoryMargin = grandTotals.categoryMargins[cat]?.finalMargin || 0;
    
    totalRow.push(Number(categoryTarget));          // Target
    totalRow.push(Number(toCrores(categorySales))); // Sales
    totalRow.push(Number(categoryMargin));          // Margin
  });
  
  // Overall totals (only visible months)
  totalRow.push(Number(grandTotals.totalTarget));             // Total Target
  totalRow.push(Number(toCrores(grandTotals.totalSales)));    // Total Sales
  totalRow.push(Number(grandTotals.grandTotalMargin));        // Total Margin
  
  excelData.push(totalRow);
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(excelData);
  
  // Apply merging for header rows
  if (!ws['!merges']) ws['!merges'] = [];
  
  // Merge category headers (each category spans 3 columns)
  let colIndex = 2; // Start after Year and Month columns
  categories.forEach(() => {
    ws['!merges'].push({
      s: { r: 0, c: colIndex },
      e: { r: 0, c: colIndex + 2 }
    });
    colIndex += 3;
  });
  
  // Merge Total header
  ws['!merges'].push({
    s: { r: 0, c: colIndex },
    e: { r: 0, c: colIndex + 2 }
  });
  
  // Set column widths for better readability
  if (!ws['!cols']) ws['!cols'] = [];
  
  const colWidths = [
    { wch: 8 },  // Year
    { wch: 12 }, // Month
  ];
  
  // Set widths for category columns (each category has 3 columns)
  categories.forEach(() => {
    colWidths.push({ wch: 12 });  // Target
    colWidths.push({ wch: 12 });  // Sales (Cr)
    colWidths.push({ wch: 10 });  // Margin %
  });
  
  // Set widths for total columns
  colWidths.push({ wch: 12 }, { wch: 12 }, { wch: 10 });
  
  ws['!cols'] = colWidths;
  
  // Apply number formatting to specific columns
  const range = XLSX.utils.decode_range(ws['!ref']);
  
  for (let R = 2; R <= range.e.r; R++) { // Start from data rows (skip headers)
    let colOffset = 2; // Start after Year and Month
    
    // Process each category's 3 columns + total columns
    for (let i = 0; i < categories.length + 1; i++) { // +1 for Total
      const targetCol = colOffset;
      const salesCol = colOffset + 1;
      const marginCol = colOffset + 2;
      
      // Format Target column (numeric with 2 decimals)
      const targetCell = XLSX.utils.encode_cell({ r: R, c: targetCol });
      if (ws[targetCell]) {
        if (!ws[targetCell].z) ws[targetCell].z = '#,##0.00';
      }
      
      // Format Sales column (numeric with 2 decimals)
      const salesCell = XLSX.utils.encode_cell({ r: R, c: salesCol });
      if (ws[salesCell]) {
        if (!ws[salesCell].z) ws[salesCell].z = '#,##0.00';
      }
      
      // Format Margin column (percentage-looking text)
      const marginCell = XLSX.utils.encode_cell({ r: R, c: marginCol });
      if (ws[marginCell]) {
        if (!ws[marginCell].z) ws[marginCell].z = '0.00"%";-0.00"%";0.00"%";';
      }
      
      colOffset += 3; // Move to next category
    }
  }
  
  XLSX.utils.book_append_sheet(wb, ws, "Quarterly Analysis");
  XLSX.writeFile(
    wb,
    `Quarterly_Analysis_${selectedYear.replace(/ /g, '_')}_${new Date().toISOString().split("T")[0]}.xlsx`
  );
};
