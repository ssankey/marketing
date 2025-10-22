// // utils/brandwise/excelExport.js
// import * as XLSX from "xlsx";

// export const exportToExcel = (data, categories, selectedYear) => {
//   if (data.length === 0 || categories.length === 0) {
//     alert("No data to export");
//     return;
//   }

//   const excelData = [];
  
//   // Header Row 1 - Category names
//   const headerRow1 = ["Year", "Month"];
//   categories.forEach(cat => {
//     headerRow1.push(cat, "", "");
//   });
//   headerRow1.push("Total", "", "");
  
//   // Header Row 2 - Target/Sales/Margin
//   const headerRow2 = ["", ""];
//   for (let i = 0; i < categories.length + 1; i++) {
//     headerRow2.push("Target", "Sales", "Margin %");
//   }
  
//   excelData.push(headerRow1);
//   excelData.push(headerRow2);
  
//   // Data rows
//   data.forEach(row => {
//     const rowData = [row.Year, row.Month];
    
//     let rowTotalSales = 0;
//     let rowTotalMargins = [];
    
//     categories.forEach(cat => {
//       const sales = row[`${cat}_Sales`] || 0;
//       const margin = row[`${cat}_Margin`] || 0;
      
//       rowTotalSales += sales;
//       rowTotalMargins.push(margin);
      
//       rowData.push("", sales, margin);
//     });
    
//     const avgMargin = rowTotalMargins.length > 0
//       ? (rowTotalMargins.reduce((a, b) => a + b, 0) / rowTotalMargins.length).toFixed(2)
//       : 0;
    
//     rowData.push("", rowTotalSales, avgMargin);
    
//     excelData.push(rowData);
//   });
  
//   const wb = XLSX.utils.book_new();
//   const ws = XLSX.utils.aoa_to_sheet(excelData);
  
//   XLSX.utils.book_append_sheet(wb, ws, "Quarterly Analysis");
//   XLSX.writeFile(
//     wb,
//     `Quarterly_Analysis_${selectedYear}_${new Date().toISOString().split("T")[0]}.xlsx`
//   );
// };


// utils/brandwise/excelExport.js
import * as XLSX from "xlsx";

// Convert to crores function - ROUND TO 2 DECIMALS
const toCrores = (value) => {
  return (value / 10000000).toFixed(2);
};

export const exportToExcel = (data, categories, selectedYear) => {
  if (data.length === 0 || categories.length === 0) {
    alert("No data to export");
    return;
  }

  const excelData = [];
  
  // Header Row 1 - Category names (merged across 3 columns each)
  const headerRow1 = ["Year", "Month"];
  categories.forEach(cat => {
    headerRow1.push(cat, "", ""); // Empty strings for merging
  });
  headerRow1.push("Total", "", ""); // Total header
  
  // Header Row 2 - Target/Sales/Margin
  const headerRow2 = ["", ""];
  categories.forEach(() => {
    headerRow2.push("Target", "Sales (Cr)", "Margin %");
  });
  headerRow2.push("Target", "Sales (Cr)", "Margin %");
  
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
      
      // Push data for this category (3 columns)
      rowData.push("-"); // Target (always empty)
      rowData.push(Number(toCrores(sales))); // Sales in Crores
      rowData.push(Number(margin)); // Margin %
    });
    
    // Calculate weighted average margin
    const avgMargin = totalSales > 0 ? 
      (totalWeightedMargin / totalSales) * 100 : 0;
    
    // Push total data (3 columns)
    rowData.push("-"); // Target
    rowData.push(Number(toCrores(totalSales))); // Total Sales in Crores
    rowData.push(Number(avgMargin.toFixed(2))); // Weighted Average Margin
    
    excelData.push(rowData);
  });
  
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
    colWidths.push({ wch: 10 });  // Target
    colWidths.push({ wch: 12 });  // Sales (Cr)
    colWidths.push({ wch: 10 });  // Margin %
  });
  
  // Set widths for total columns
  colWidths.push({ wch: 10 }, { wch: 12 }, { wch: 10 });
  
  ws['!cols'] = colWidths;
  
  // Apply number formatting to specific columns
  const range = XLSX.utils.decode_range(ws['!ref']);
  
  for (let R = 2; R <= range.e.r; R++) { // Start from data rows (skip headers)
    let colOffset = 2; // Start after Year and Month
    
    // Process each category's 3 columns
    for (let i = 0; i < categories.length + 1; i++) { // +1 for Total
      const targetCol = colOffset;
      const salesCol = colOffset + 1;
      const marginCol = colOffset + 2;
      
      // Format Sales column (currency)
      const salesCell = XLSX.utils.encode_cell({ r: R, c: salesCol });
      if (ws[salesCell]) {
        if (!ws[salesCell].z) ws[salesCell].z = '#,##0.00';
      }
      
      // Format Margin column (percentage)
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
    `Quarterly_Analysis_${selectedYear}_${new Date().toISOString().split("T")[0]}.xlsx`
  );
};