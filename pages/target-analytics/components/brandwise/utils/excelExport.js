import * as XLSX from "xlsx";

export const exportToExcel = (data, categories, selectedYear) => {
  if (data.length === 0 || categories.length === 0) {
    alert("No data to export");
    return;
  }

  const excelData = [];
  
  // Header Row 1 - Category names
  const headerRow1 = ["Year", "Month"];
  categories.forEach(cat => {
    headerRow1.push(cat, "", "");
  });
  headerRow1.push("Total", "", "");
  
  // Header Row 2 - Target/Sales/Margin
  const headerRow2 = ["", ""];
  for (let i = 0; i < categories.length + 1; i++) {
    headerRow2.push("Target", "Sales", "Margin %");
  }
  
  excelData.push(headerRow1);
  excelData.push(headerRow2);
  
  // Data rows
  data.forEach(row => {
    const rowData = [row.Year, row.Month];
    
    let rowTotalSales = 0;
    let rowTotalMargins = [];
    
    categories.forEach(cat => {
      const sales = row[`${cat}_Sales`] || 0;
      const margin = row[`${cat}_Margin`] || 0;
      
      rowTotalSales += sales;
      rowTotalMargins.push(margin);
      
      rowData.push("", sales, margin);
    });
    
    const avgMargin = rowTotalMargins.length > 0
      ? (rowTotalMargins.reduce((a, b) => a + b, 0) / rowTotalMargins.length).toFixed(2)
      : 0;
    
    rowData.push("", rowTotalSales, avgMargin);
    
    excelData.push(rowData);
  });
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(excelData);
  
  XLSX.utils.book_append_sheet(wb, ws, "Quarterly Analysis");
  XLSX.writeFile(
    wb,
    `Quarterly_Analysis_${selectedYear}_${new Date().toISOString().split("T")[0]}.xlsx`
  );
};