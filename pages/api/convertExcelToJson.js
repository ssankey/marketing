const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

// 1. Load Excel file from correct relative path
const filePath = path.join(__dirname, "Files", "MSDS_SPEC.xlsx");
const workbook = XLSX.readFile(filePath);

// 2. Access first sheet
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// 3. Convert sheet to JSON
const data = XLSX.utils.sheet_to_json(sheet);

// 4. Build key-value map (Cat-pack → MSDS URL)
const msdsMap = {};

data.forEach((row) => {
  const key = row["Cat-pack"]?.toString().trim();
  const url = row["MSDS"]?.toString().trim();

  if (key && url) {
    msdsMap[key] = url;
  }
});

// 5. Write to JSON file
const outputPath = path.join(__dirname, "msds-map.json");
fs.writeFileSync(outputPath, JSON.stringify(msdsMap, null, 2));

console.log("✅ Successfully converted to msds-map.json");
