import * as XLSX from "xlsx";

function downloadExcel(data, fileName = "data.xlsx") {
  if (!Array.isArray(data) || data.length === 0) {
    console.error("Invalid or empty data array.");
    return;
  }

  // Check and append .xlsx extension if not provided
  if (!fileName.endsWith(".xlsx")) {
    fileName += ".xlsx";
  }

  // Convert the array of objects to a worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Create a new workbook and append the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, fileName);
}

export default downloadExcel;

// // Example usage
// const data = [
//   { Name: "John Doe", Age: 30, City: "New York" },
//   { Name: "Jane Doe", Age: 28, City: "Los Angeles" },
//   { Name: "Sam Smith", Age: 35, City: "Chicago" },
// ];

// // Provide a custom name for the file
// downloadExcel(data, "UserDetails.xlsx");
