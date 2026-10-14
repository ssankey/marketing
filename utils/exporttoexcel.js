// import * as XLSX from "xlsx";

// function downloadExcel(data, fileName = "data.xlsx") {
//   if (!Array.isArray(data) || data.length === 0) {
//     console.error("Invalid or empty data array.");
//     return;
//   }

//   // Check and append .xlsx extension if not provided
//   if (!fileName.endsWith(".xlsx")) {
//     fileName += ".xlsx";
//   }

//   // Convert the array of objects to a worksheet
//   const worksheet = XLSX.utils.json_to_sheet(data);

//   // Create a new workbook and append the worksheet
//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

//   // Generate Excel file and trigger download
//   XLSX.writeFile(workbook, fileName);
// }

// export default downloadExcel;


// Replace your entire downloadExcel function with this
import * as XLSX from "xlsx";

function downloadExcel(data, fileName = "data.xlsx", columnFormats = {}) {
  if (!Array.isArray(data) || data.length === 0) {
    console.error("Invalid or empty data array.");
    return;
  }

  // Check and append .xlsx extension if not provided
  if (!fileName.endsWith(".xlsx")) {
    fileName += ".xlsx";
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Get headers from first data row
  const headers = Object.keys(data[0]);
  
  // Create worksheet data manually to ensure proper formatting
  const wsData = [];
  
  // Add headers
  wsData.push(headers);
  
  // Add data rows
  data.forEach(row => {
    const rowData = headers.map(header => {
      const value = row[header];
      const format = columnFormats[header];
      
      if (format && format.type === 'currency') {
        // Ensure it's a clean number
        const numValue = Number(value);
        return isNaN(numValue) ? 0 : numValue;
      }
      
      return value;
    });
    wsData.push(rowData);
  });
  
  // Create worksheet from array
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Apply cell formatting manually
  const range = XLSX.utils.decode_range(ws['!ref']);
  
  // Format each cell individually
  for (let R = 1; R <= range.e.r; ++R) { // Start from row 1 (skip header)
    for (let C = 0; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellRef];
      
      if (!cell) continue;
      
      const header = headers[C];
      const format = columnFormats[header];
      
      if (format) {
        if (format.type === 'currency') {
          // Force number type and format
          const numValue = Number(cell.v);
          if (!isNaN(numValue)) {
            ws[cellRef] = {
              v: numValue,
              t: 'n',
              z: '#,##0.00'
            };
          }
        } else if (format.type === 'date' || format.type === 'datetime') {
          // Write a genuine Excel date-typed cell (serial number + date
          // format), not text — so Excel's own date filter/sort/grouping
          // works on it. Two bugs fixed here:
          //  - 'date' used to run the serial through XLSX.SSF.parse_date_code,
          //    which DECODES a serial back into a {y,m,d,...} object — it
          //    doesn't produce one. That object was being written as the
          //    cell value directly, producing a broken cell.
          //  - the serial was computed against a LOCAL-timezone epoch
          //    anchor (`new Date(1899, 11, 30)`), so on a browser set to
          //    IST a clean date would drift by the UTC offset and pick up a
          //    spurious time-of-day (e.g. "28/09/2026 05:21:10" instead of
          //    a plain date). Anchoring with Date.UTC fixes that regardless
          //    of the viewer's local timezone.
          let dateValue = cell.v;
          if (typeof dateValue === 'string') {
            dateValue = new Date(dateValue);
          }

          if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
            const excelSerial = (dateValue.getTime() - Date.UTC(1899, 11, 30)) / 86400000;
            ws[cellRef] = {
              v: excelSerial,
              t: 'n',
              z: format.type === 'datetime' ? 'dd/mm/yyyy hh:mm' : 'dd/mm/yyyy',
            };
          }
        }
      }
    }
  }
  
  // Set column widths
  const colWidths = headers.map(header => {
    const format = columnFormats[header];
    if (format) {
      if (format.type === 'currency') return { wch: 15 };
      if (format.type === 'date' || format.type === 'datetime') return { wch: 12 };
    }
    return { wch: 10 };
  });
  
  ws['!cols'] = colWidths;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  
  // Write file
  XLSX.writeFile(wb, fileName);
}

export default downloadExcel;