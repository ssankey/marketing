
// // pages/api/labels/download/[itemCode].js
// import { queryDatabase } from "../../../../lib/db";
// import sql from "mssql";
// import { createCanvas, registerFont } from 'canvas';
// import path from 'path';
// import fs from 'fs';

// // Register fonts - try multiple common font paths
// try {
//   // Common font paths on different systems
//   const fontPaths = [
//     // Linux paths
//     '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
//     '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
//     '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
//     // Windows paths
//     'C:/Windows/Fonts/Arial.ttf',
//     'C:/Windows/Fonts/tahoma.ttf',
//     // macOS paths
//     '/System/Library/Fonts/Arial.ttf',
//     '/System/Library/Fonts/Helvetica.ttf',
//     // Fallback to package fonts if installed
//     path.join(process.cwd(), 'node_modules', 'dejavu-fonts-ttf', 'ttf', 'DejaVuSans.ttf')
//   ];

//   let fontRegistered = false;
  
//   for (const fontPath of fontPaths) {
//     try {
//       if (fs.existsSync(fontPath)) {
//         if (fontPath.includes('DejaVuSans.ttf')) {
//             registerFont(fontPath, { family: 'DejaVu Sans' });
//           } else if (fontPath.includes('LiberationSans-Regular.ttf')) {
//             registerFont(fontPath, { family: 'Liberation Sans' });
//           } else if (fontPath.toLowerCase().includes('arial')) {
//             registerFont(fontPath, { family: 'Arial' });
//           } else {
//             registerFont(fontPath, { family: 'CustomFont' });
//           }

//         console.log(`Registered font: ${fontPath}`);
//         fontRegistered = true;
//         break;
//       }
//     } catch (err) {
//       console.warn(`Could not register font at ${fontPath}:`, err.message);
//     }
//   }

//   if (!fontRegistered) {
//     console.warn('No system fonts found, using canvas default (may have limited character support)');
//   }
// } catch (error) {
//   console.error('Error registering fonts:', error);
// }

// export default async function handler(req, res) {
//   // Handle OPTIONS request for CORS preflight
//   if (req.method === 'OPTIONS') {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//     return res.status(200).end();
//   }

//   if (req.method !== 'GET') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   // Add CORS headers to the actual response
//   res.setHeader('Access-Control-Allow-Origin', '*');

//   const { itemCode, batchNum, docEntry, docNum } = req.query;

//   if (!itemCode || itemCode.trim() === '') {
//     return res.status(400).json({ message: 'Item code is required' });
//   }

//   try {
//     console.log('Fetching label data for item:', itemCode);

//     // Extract base item code (remove size suffix) for Energy API call
//     const baseItemCode = itemCode.trim().split('-')[0]; // Get A040341 from A040341-500g
//     console.log('Base item code for Energy API:', baseItemCode);

//     // Step 1: Get Energy API token
//     const tokenResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/api/energy/getAccessToken`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });

//     let energyData = null;
//     let token = null;

//     if (tokenResponse.ok) {
//       const tokenData = await tokenResponse.json();
//       token = tokenData.data;
//       console.log('Energy API token obtained');

//       // Step 2: Get detailed product info from Energy API using base item code
//       const labelInfoResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/api/energy/getLabelInfo`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           itemNumber: baseItemCode // Use base item code without size
//         }),
//       });

//       // Log raw response for debugging
//       const rawText = await labelInfoResponse.text();
//       console.log('Raw Energy API response:', rawText);

//       let labelData;
//       try {
//         labelData = JSON.parse(rawText);
//         console.log('Parsed Energy API JSON:', labelData);
//       } catch (err) {
//         console.error('Failed to parse Energy API response as JSON:', err.message);
//         labelData = null;
//       }

//       if (labelData && labelData.code === 200) {
//         energyData = labelData.data;
//         console.log('✅ Energy API data obtained:', energyData);
//       } else {
//         console.warn('⚠️ Energy API returned no data or error');
//       }
//     } else {
//       console.error('Failed to get token:', await tokenResponse.text());
//     }

//     // If no Energy API data, we cannot proceed as we depend on it for product info
//     if (!energyData) {
//       console.log('No Energy API data available for item code:', itemCode);
//       return res.status(404).json({ message: 'Product data not found in Energy API' });
//     }

//     // Step 3: Get batch number from database
//     let vendorBatchNum = batchNum || '';
    
//     if (!vendorBatchNum) {
//       const batchQuery = `
//         SELECT TOP 1 ISNULL(T0.BatchNum, '') AS VendorBatchNum
//         FROM OIBT T0
//         WHERE T0.ItemCode = @itemCode
//         ORDER BY T0.InDate DESC
//       `;
      
//       const batchParams = [
//         { name: 'itemCode', type: sql.NVarChar, value: itemCode.trim() }
//       ];

//       try {
//         const batchResults = await queryDatabase(batchQuery, batchParams);
//         if (batchResults && batchResults.length > 0) {
//           vendorBatchNum = batchResults[0].VendorBatchNum || '';
//         }
//       } catch (error) {
//         console.warn('Could not fetch batch number:', error.message);
//         // Continue without batch number
//       }
//     }

//     console.log('Energy data:', energyData);
//     console.log('Vendor Batch Number:', vendorBatchNum);

//     // Step 4: Generate enhanced label with Energy API data
//     const labelBuffer = await generateEnhancedLabelImage(itemCode, energyData, vendorBatchNum);

//     // Set response headers for image download
//     res.setHeader('Content-Type', 'image/png');
//     res.setHeader('Content-Disposition', `attachment; filename="Label_${itemCode.replace(/[^a-zA-Z0-9]/g, '_')}.png"`);
//     res.setHeader('Content-Length', labelBuffer.length);

//     console.log('Enhanced label generated successfully for:', itemCode);
//     return res.send(labelBuffer);

//   } catch (error) {
//     console.error('Error generating label:', error);
//     return res.status(500).json({ 
//       message: 'Failed to generate label',
//       error: error.message 
//     });
//   }
// }

// async function generateEnhancedLabelImage(fullItemCode, energyData, vendorBatchNum = '') {
//   // Convert mm to pixels at 300 DPI (11.8 pixels per mm)
//   const mmToPixels = 11.8;
//   const width = Math.round(80 * mmToPixels);  // 944 pixels
//   const height = Math.round(40 * mmToPixels); // 472 pixels
  
//   const canvas = createCanvas(width, height);
//   const ctx = canvas.getContext('2d');

//   // Set text rendering properties
//   ctx.textBaseline = 'top';
//   ctx.textAlign = 'start';

//   // Safe text function to handle encoding
//   // const safeText = (text) => {
//   //   if (!text) return '';
//   //   return String(text).normalize('NFC').replace(/[^\x00-\x7F]/g, '');
//   // };
//   const safeText = (text) => {
//   if (!text) return '';
//   // Allow Latin (U+0000–U+024F), symbols like °, ≤, ≥, %, and spaces
//   return String(text).normalize('NFC').replace(/[^\u0000-\u024F\u00B0\u2264\u2265% ]/g, '');
// };


//   // Font stack with fallbacks
//   // const getFontString = (size, weight = 'normal') => {
//   //   return `${weight} ${size}px Arial, Helvetica, sans-serif`;
//   // };
//   const getFontString = (size, weight = 'normal') => {
//   return `${weight} ${size}px "DejaVu Sans", "Liberation Sans", Arial, Helvetica, sans-serif`;
// };


//   // Background - white
//   ctx.fillStyle = '#FFFFFF';
//   ctx.fillRect(0, 0, width, height);

//   // Blue header section
//   const headerHeight = Math.round(height * 0.15); // ~15% of height
//   ctx.fillStyle = '#1E5AA8'; // Blue color matching 3ASenrise
//   ctx.fillRect(0, 0, width, headerHeight);

//   // 3ASenrise brand text
//   ctx.fillStyle = '#FFFFFF';
//   ctx.font = getFontString(Math.round(height * 0.08), 'bold');
//   ctx.textAlign = 'left';
//   ctx.fillText(safeText('3ASenrise'), 15, headerHeight * 0.2);

//   // Website in header
//   ctx.font = getFontString(Math.round(height * 0.045));
//   ctx.textAlign = 'right';
//   ctx.fillText(safeText('www.3asenrise.com'), width - 15, headerHeight * 0.2);

//   // Main content area starts after header
//   let yPos = headerHeight + Math.round(height * 0.05);
//   ctx.fillStyle = '#000000';
//   ctx.textAlign = 'left';

//   // Extract item code without size and size separately
//   const itemCodeParts = fullItemCode.split('-');
//   const itemCodeWithoutSize = itemCodeParts.slice(0, -1).join('-') || fullItemCode;
  
//   // Extract size (last part after hyphen)
//   let size = '';
//   if (itemCodeParts.length > 1) {
//     size = itemCodeParts[itemCodeParts.length - 1];
//   } else {
//     const sizeMatch = fullItemCode.match(/(\d+[a-zA-Z]*g?)$/);
//     if (sizeMatch) {
//       size = sizeMatch[1];
//     }
//   }

//   // Line 1: Item code, size, LOT number, and Danger (horizontal layout)
//   const mainFontSize = Math.round(height * 0.065);
//   ctx.font = getFontString(mainFontSize, 'bold');
//   ctx.fillText(safeText(itemCodeWithoutSize), 15, yPos);
  
//   const sizeX = Math.round(width * 0.28);
//   ctx.fillText(safeText(size), sizeX, yPos);
  
//   const lotX = Math.round(width * 0.42);
//   const lotText = vendorBatchNum ? `Lot: ${vendorBatchNum}` : 'Lot:';
//   ctx.fillText(safeText(lotText), lotX, yPos);
  
//   // Danger text (right aligned)
//   ctx.textAlign = 'right';
//   ctx.fillText(safeText('Danger'), width - 15, yPos);
//   ctx.textAlign = 'left';
  
//   yPos += Math.round(height * 0.13);

//   // Line 2: Chemical name (from Energy API)
//   const chemicalName = energyData?.productName || '';
//   const descFontSize = Math.round(height * 0.055);
//   ctx.font = getFontString(descFontSize);
//   ctx.fillStyle = '#333333';
  
//   // Truncate if too long for the width
//   const maxWidth = width - 30;
//   let displayName = safeText(chemicalName);
//   if (ctx.measureText(displayName).width > maxWidth) {
//     while (ctx.measureText(displayName + '...').width > maxWidth && displayName.length > 0) {
//       displayName = displayName.slice(0, -1);
//     }
//     displayName += '...';
//   }
  
//   ctx.fillText(displayName, 15, yPos);
//   yPos += Math.round(height * 0.11);

//   // Line 3: Purity (extract only up to % sign from Energy API)
//   ctx.fillStyle = '#000000';
//   ctx.font = getFontString(Math.round(height * 0.055), 'bold');
//   let purity = energyData?.purity || '';
  
//   // Extract purity up to % sign
//   if (purity) {
//     const purityMatch = purity.match(/^([^%]+%)/);
//     if (purityMatch) {
//       purity = purityMatch[1];
//     }
    
//     // Truncate purity if too long
//     let displayPurity = safeText(purity);
//     if (ctx.measureText(displayPurity).width > maxWidth) {
//       while (ctx.measureText(displayPurity + '...').width > maxWidth && displayPurity.length > 0) {
//         displayPurity = displayPurity.slice(0, -1);
//       }
//       displayPurity += '...';
//     }
//     ctx.fillText(displayPurity, 15, yPos);
//   }
//   yPos += Math.round(height * 0.11);

//   // Line 4: CAS, Molecular Formula, FW (horizontal) - from Energy API
//   const smallFontSize = Math.round(height * 0.045);
//   ctx.font = getFontString(smallFontSize);
  
//   const casNumber = energyData?.cas || '';
//   const molFormula = energyData?.productMF || '';
//   const molWeight = energyData?.productMW || '';
  
//   let xPos = 15;
//   if (casNumber) {
//     ctx.fillText(safeText(`CAS: ${casNumber}`), xPos, yPos);
//     xPos += Math.round(width * 0.25);
//   }
  
//   if (molFormula) {
//     ctx.fillText(safeText(molFormula), xPos, yPos);
//     xPos += Math.round(width * 0.25);
//   }
  
//   if (molWeight) {
//     ctx.fillText(safeText(`FW: ${molWeight}`), xPos, yPos);
//   }
//   yPos += Math.round(height * 0.09);

//   // Line 5: Storage conditions
//   ctx.fillText(safeText('Store at -2-8°C'), 15, yPos);
//   yPos += Math.round(height * 0.09);

//   // Line 6: UN Number and Hazard Class (from Energy API)
//   const unNumber = energyData?.UnNo || '';
//   const hazClass = energyData?.GHSClass || '';
//   ctx.fillText(safeText(`UN: ${unNumber}`), 15, yPos);
//   ctx.fillText(safeText(`Haz Class: ${hazClass || '-'}`), Math.round(width * 0.25), yPos);
//   yPos += Math.round(height * 0.09);

//   // Address section
//   const addressFontSize = Math.round(height * 0.035);
//   ctx.font = getFontString(addressFontSize);
//   ctx.fillStyle = '#333333';
  
//   // Updated address as requested
//   const addressLine1 = '101, Block A, Bobbili Empire, Kompally,';
//   const addressLine2 = 'Hyderabad - 500014, Telangana, India';
//   const phoneNumber = 'Tel: +91-9989991174';

//   ctx.fillText(safeText(addressLine1), 15, yPos);
//   yPos += Math.round(height * 0.045);
//   ctx.fillText(safeText(addressLine2), 15, yPos);
//   yPos += Math.round(height * 0.045);
//   ctx.fillText(safeText(phoneNumber), 15, yPos);

//   // Hazard symbols (bottom right) - handle GHSImage array from Energy API
//   const symbolSize = Math.round(height * 0.15);
//   const symbolY = height - symbolSize - 10;
//   let symbolX = width - symbolSize - 15;

//   // Draw up to 3 hazard symbols if GHSImage is array and not empty
//   const maxSymbols = 3;

//   if (energyData?.GHSImage && Array.isArray(energyData.GHSImage) && energyData.GHSImage.length > 0) {
//     // Draw hazard symbols for each image URL
//     for (let i = 0; i < Math.min(energyData.GHSImage.length, maxSymbols); i++) {
//       drawHazardSymbol(ctx, symbolX, symbolY, symbolSize);
//       symbolX -= symbolSize + 5;
//     }
//   }

//   // Warning text at bottom left
//   ctx.fillStyle = '#FF0000';
//   ctx.font = getFontString(Math.round(height * 0.03), 'bold');
//   ctx.fillText(safeText('For R&D use only. Safety datasheet is available.'), 15, height - 20);

//   return canvas.toBuffer('image/png');
// }

// function drawHazardSymbol(ctx, x, y, size) {
//   // Diamond shape hazard symbol
//   ctx.strokeStyle = '#FF0000';
//   ctx.lineWidth = 2;
  
//   // Draw diamond
//   ctx.beginPath();
//   ctx.moveTo(x + size/2, y);
//   ctx.lineTo(x + size, y + size/2);
//   ctx.lineTo(x + size/2, y + size);
//   ctx.lineTo(x, y + size/2);
//   ctx.closePath();
//   ctx.stroke();
  
//   // Exclamation mark or other symbol in diamond
//   ctx.fillStyle = '#FF0000';
//   ctx.font = `bold ${Math.round(size * 0.4)}px "DejaVu Sans", "Liberation Sans", Arial, Helvetica, sans-serif`;

//   ctx.textAlign = 'center';
//   ctx.fillText('!', x + size/2, y + size/2 + size * 0.1);
//   ctx.textAlign = 'left'; // Reset alignment
// }

// pages/api/labels/download/[itemCode].js
import { queryDatabase } from "../../../../lib/db";
import sql from "mssql";
import { createCanvas, registerFont } from "canvas";
import path from "path";
import fs from "fs";

// Register fonts explicitly
try {
  const fontPaths = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "C:/Windows/Fonts/Arial.ttf",
    "C:/Windows/Fonts/tahoma.ttf",
    "/System/Library/Fonts/Arial.ttf",
    "/System/Library/Fonts/Helvetica.ttf",
    path.join(process.cwd(), "node_modules", "dejavu-fonts-ttf", "ttf", "DejaVuSans.ttf"),
  ];

  let registered = false;
  for (const fontPath of fontPaths) {
    if (fs.existsSync(fontPath)) {
      let family = "CustomFont";
      if (fontPath.includes("DejaVuSans")) family = "DejaVu Sans";
      else if (fontPath.includes("NotoSansCJK")) family = "Noto Sans CJK";
      else if (fontPath.includes("LiberationSans")) family = "Liberation Sans";
      else if (fontPath.toLowerCase().includes("arial")) family = "Arial";

      registerFont(fontPath, { family });
      console.log(`✅ Registered font: ${family} (${fontPath})`);
      registered = true;
    }
  }

  if (!registered) {
    console.warn("⚠️ No system fonts found, falling back to canvas default.");
  }
} catch (err) {
  console.error("❌ Error registering fonts:", err);
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  const { itemCode, batchNum, docEntry, docNum } = req.query;
  if (!itemCode || itemCode.trim() === "") {
    return res.status(400).json({ message: "Item code is required" });
  }

  try {
    console.log("Fetching label data for item:", itemCode);

    const baseItemCode = itemCode.trim().split("-")[0];

    // Step 1: Get Energy API token
    const tokenResponse = await fetch(`${process.env.API_BASE_URL || "http://localhost:3000"}/api/energy/getAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    let energyData = null;
    if (tokenResponse.ok) {
      const { data: token } = await tokenResponse.json();
      console.log("✅ Energy API token obtained");

      const labelInfoResponse = await fetch(`${process.env.API_BASE_URL || "http://localhost:3000"}/api/energy/getLabelInfo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemNumber: baseItemCode }),
      });

      const rawText = await labelInfoResponse.text();
      console.log("Raw Energy API response:", rawText);

      try {
        const labelData = JSON.parse(rawText);
        if (labelData.code === 200) {
          energyData = labelData.data;
          console.log("✅ Energy API data obtained");
        }
      } catch (err) {
        console.error("❌ Failed to parse Energy API response:", err);
      }
    }

    if (!energyData) {
      return res.status(404).json({ message: "Product data not found in Energy API" });
    }

    // Step 2: Batch number
    let vendorBatchNum = batchNum || "";
    if (!vendorBatchNum) {
      const batchQuery = `
        SELECT TOP 1 ISNULL(T0.BatchNum, '') AS VendorBatchNum
        FROM OIBT T0
        WHERE T0.ItemCode = @itemCode
        ORDER BY T0.InDate DESC
      `;
      const batchParams = [{ name: "itemCode", type: sql.NVarChar, value: itemCode.trim() }];
      try {
        const batchResults = await queryDatabase(batchQuery, batchParams);
        if (batchResults.length > 0) vendorBatchNum = batchResults[0].VendorBatchNum || "";
      } catch (err) {
        console.warn("⚠️ Could not fetch batch number:", err.message);
      }
    }

    const labelBuffer = await generateEnhancedLabelImage(itemCode, energyData, vendorBatchNum);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="Label_${itemCode.replace(/[^a-zA-Z0-9]/g, "_")}.png"`);
    res.setHeader("Content-Length", labelBuffer.length);

    return res.send(labelBuffer);
  } catch (err) {
    console.error("❌ Error generating label:", err);
    return res.status(500).json({ message: "Failed to generate label", error: err.message });
  }
}

async function generateEnhancedLabelImage(fullItemCode, energyData, vendorBatchNum = "") {
  const mmToPixels = 11.8;
  const width = Math.round(80 * mmToPixels);
  const height = Math.round(40 * mmToPixels);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.textBaseline = "top";
  ctx.textAlign = "start";

  const safeText = (text) => (text ? String(text).normalize("NFC") : "");

  const getFontString = (size, weight = "normal") =>
    `${weight} ${size}px "DejaVu Sans"`;

  // Background
  ctx.fillStyle = "#FFF";
  ctx.fillRect(0, 0, width, height);

  // Header
  const headerHeight = Math.round(height * 0.15);
  ctx.fillStyle = "#1E5AA8";
  ctx.fillRect(0, 0, width, headerHeight);

  ctx.fillStyle = "#FFF";
  ctx.font = getFontString(Math.round(height * 0.08), "bold");
  ctx.textAlign = "left";
  ctx.fillText("3ASenrise", 15, headerHeight * 0.2);

  ctx.font = getFontString(Math.round(height * 0.045));
  ctx.textAlign = "right";
  ctx.fillText("www.3asenrise.com", width - 15, headerHeight * 0.2);

  ctx.textAlign = "left";
  ctx.fillStyle = "#000";
  let yPos = headerHeight + Math.round(height * 0.05);

  // Item + Size + Lot + Danger
  ctx.font = getFontString(Math.round(height * 0.065), "bold");
  const itemCodeParts = fullItemCode.split("-");
  const itemCodeWithoutSize = itemCodeParts.slice(0, -1).join("-") || fullItemCode;
  const size = itemCodeParts[itemCodeParts.length - 1] || "";
  ctx.fillText(safeText(itemCodeWithoutSize), 15, yPos);
  ctx.fillText(safeText(size), Math.round(width * 0.28), yPos);
  ctx.fillText(`Lot: ${vendorBatchNum}`, Math.round(width * 0.42), yPos);
  ctx.textAlign = "right";
  ctx.fillText("Danger", width - 15, yPos);
  ctx.textAlign = "left";
  yPos += Math.round(height * 0.13);

  // Product Name
  ctx.font = getFontString(Math.round(height * 0.055));
  ctx.fillStyle = "#333";
  let name = safeText(energyData?.productName || "");
  if (ctx.measureText(name).width > width - 30) {
    while (ctx.measureText(name + "...").width > width - 30 && name.length > 0) name = name.slice(0, -1);
    name += "...";
  }
  ctx.fillText(name, 15, yPos);
  yPos += Math.round(height * 0.11);

  // Purity
  ctx.fillStyle = "#000";
  ctx.font = getFontString(Math.round(height * 0.055), "bold");
  let purity = energyData?.purity?.match(/^([^%]+%)/)?.[1] || "";
  ctx.fillText(safeText(purity), 15, yPos);
  yPos += Math.round(height * 0.11);

  // CAS / Formula / MW
  ctx.font = getFontString(Math.round(height * 0.045));
  let xPos = 15;
  if (energyData?.cas) {
    ctx.fillText(`CAS: ${safeText(energyData.cas)}`, xPos, yPos);
    xPos += Math.round(width * 0.25);
  }
  if (energyData?.productMF) {
    ctx.fillText(safeText(energyData.productMF), xPos, yPos);
    xPos += Math.round(width * 0.25);
  }
  if (energyData?.productMW) ctx.fillText(`FW: ${safeText(energyData.productMW)}`, xPos, yPos);
  yPos += Math.round(height * 0.09);

  // Storage
  ctx.fillText("Store at -2-8°C", 15, yPos);
  yPos += Math.round(height * 0.09);

  // UN / Hazard Class
  ctx.fillText(`UN: ${safeText(energyData?.UnNo || "")}`, 15, yPos);
  ctx.fillText(`Haz Class: ${safeText(energyData?.GHSClass || "-")}`, Math.round(width * 0.25), yPos);
  yPos += Math.round(height * 0.09);

  // Address
  ctx.font = getFontString(Math.round(height * 0.035));
  ctx.fillStyle = "#333";
  ctx.fillText("101, Block A, Bobbili Empire, Kompally,", 15, yPos);
  yPos += Math.round(height * 0.045);
  ctx.fillText("Hyderabad - 500014, Telangana, India", 15, yPos);
  yPos += Math.round(height * 0.045);
  ctx.fillText("Tel: +91-9989991174", 15, yPos);

  // Hazard symbols (placeholder diamonds)
  const symbolSize = Math.round(height * 0.15);
  let symbolX = width - symbolSize - 15;
  const symbolY = height - symbolSize - 10;
  if (Array.isArray(energyData?.GHSImage)) {
    for (let i = 0; i < Math.min(energyData.GHSImage.length, 3); i++) {
      drawHazardSymbol(ctx, symbolX, symbolY, symbolSize);
      symbolX -= symbolSize + 5;
    }
  }

  // Footer warning
  ctx.fillStyle = "#F00";
  ctx.font = getFontString(Math.round(height * 0.03), "bold");
  ctx.textAlign = "left";
  ctx.fillText("For R&D use only. Safety datasheet is available.", 15, height - 20);

  return canvas.toBuffer("image/png");
}

function drawHazardSymbol(ctx, x, y, size) {
  ctx.strokeStyle = "#F00";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + size / 2, y);
  ctx.lineTo(x + size, y + size / 2);
  ctx.lineTo(x + size / 2, y + size);
  ctx.lineTo(x, y + size / 2);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = "#F00";
  ctx.font = `bold ${Math.round(size * 0.4)}px "DejaVu Sans"`;
  ctx.textAlign = "center";
  ctx.fillText("!", x + size / 2, y + size / 2 + size * 0.1);
  ctx.textAlign = "left";
}
