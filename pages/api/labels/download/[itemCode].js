

// pages/api/labels/download/[itemCode].js
import { queryDatabase } from "../../../../lib/db";
import sql from "mssql";
import { createCanvas, registerFont, loadImage } from "canvas";
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
  const height = Math.round(30 * mmToPixels);

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
  let yPos = headerHeight + Math.round(height * 0.04);

  // Define the split point - left half for product info, right half for GHS
  const splitX = Math.round(width * 0.5);
  const leftMaxWidth = splitX - 25; // Leave some margin

  // LEFT COLUMN - Product Information
  // Item + Size + Lot - REDUCED SIZE
  ctx.font = getFontString(Math.round(height * 0.050)); // Reduced from 0.065
  const itemCodeParts = fullItemCode.split("-");
  const itemCodeWithoutSize = itemCodeParts.slice(0, -1).join("-") || fullItemCode;
  const size = itemCodeParts[itemCodeParts.length - 1] || "";
  ctx.fillText(safeText(itemCodeWithoutSize), 15, yPos);
  
  // Calculate dynamic positions to fit in left column
  const item1Width = ctx.measureText(safeText(itemCodeWithoutSize)).width;
  ctx.fillText(safeText(size), 15 + item1Width + 15, yPos);
  
  const sizeWidth = ctx.measureText(safeText(size)).width;
  ctx.fillText(`Lot: ${vendorBatchNum}`, 15 + item1Width + 15 + sizeWidth + 15, yPos);
  yPos += Math.round(height * 0.08);

  // Product Name
  ctx.font = getFontString(Math.round(height * 0.055));
  ctx.fillStyle = "#333";
  let name = safeText(energyData?.productName || "");
  if (ctx.measureText(name).width > leftMaxWidth) {
    while (ctx.measureText(name + "...").width > leftMaxWidth && name.length > 0) name = name.slice(0, -1);
    name += "...";
  }
  ctx.fillText(name, 15, yPos);
  yPos += Math.round(height * 0.09);

  // Purity
  ctx.fillStyle = "#000";
  ctx.font = getFontString(Math.round(height * 0.055));
  let purity = energyData?.purity?.match(/^([^%]+%)/)?.[1] || "";
  ctx.fillText(safeText(purity), 15, yPos);
  yPos += Math.round(height * 0.09);

  // CAS / Formula / MW
  ctx.font = getFontString(Math.round(height * 0.045));
  let xPos = 15;
  if (energyData?.cas) {
    ctx.fillText(`CAS: ${safeText(energyData.cas)}`, xPos, yPos);
    xPos += Math.round(width * 0.22);
  }
  if (energyData?.productMF) {
    ctx.fillText(safeText(energyData.productMF), xPos, yPos);
    xPos += Math.round(width * 0.15);
  }
  if (energyData?.productMW && xPos < splitX - 80) {
    ctx.fillText(`FW: ${safeText(energyData.productMW)}`, xPos, yPos);
  }
  yPos += Math.round(height * 0.075);

  // Storage
  ctx.fillText(`Stores at : ${""}`, 15, yPos);
  yPos += Math.round(height * 0.075);

  // UN Number
  ctx.fillText(`UN: ${safeText(energyData?.UnNo || "")}`, 15, yPos);
  yPos += Math.round(height * 0.065);
  
  // Hazard Class
  ctx.fillText(`Haz Class: ${safeText(energyData?.GHSClass || "")}`, 15, yPos);
  yPos += Math.round(height * 0.075);

  // Address
  ctx.font = getFontString(Math.round(height * 0.035));
  ctx.fillStyle = "#333";
  ctx.fillText("101, Block A, Bobbili Empire, Kompally,", 15, yPos);
  yPos += Math.round(height * 0.038);
  ctx.fillText("Hyderabad - 500014, Telangana, India", 15, yPos);
  yPos += Math.round(height * 0.038);
  
  // Tel
  ctx.fillText("Tel: +91-9989991174", 15, yPos);

  // RIGHT COLUMN - GHS Information and Hazard Symbols
  const rightStartX = splitX + 10;
  const rightMaxWidth = width - rightStartX - 15;
  let rightY = headerHeight + Math.round(height * 0.04);

  // GHS Information Section - Very compact with small font
  const ghsInfo = energyData?.GHSInfo || {};
  const verySmallFont = Math.round(height * 0.024);
  const lineHeight = Math.round(height * 0.028);
  
  ctx.font = getFontString(verySmallFont);
  ctx.fillStyle = "#000";
  
  // Helper function to wrap and draw text in right column
  const drawWrappedText = (label, items, startX, maxW) => {
    // Skip if no data
    if (!items) return rightY;
    if (Array.isArray(items) && items.length === 0) return rightY;
    if (typeof items === 'string' && items.trim() === '') return rightY;
    
    // Draw label in bold
    ctx.font = getFontString(verySmallFont, "bold");
    ctx.fillText(label, startX, rightY);
    rightY += lineHeight;
    
    // Draw items
    ctx.font = getFontString(verySmallFont);
    
    // Handle both arrays and strings from API
    let content = '';
    if (Array.isArray(items)) {
      content = items.join(" ");
    } else {
      content = String(items);
    }
    
    const words = content.split(" ");
    let line = "";
    
    for (let word of words) {
      const testLine = line + (line ? " " : "") + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxW && line) {
        ctx.fillText(line, startX, rightY);
        rightY += lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }
    
    if (line) {
      ctx.fillText(line, startX, rightY);
      rightY += lineHeight;
    }
    
    rightY += Math.round(lineHeight * 0.3); // Small gap between sections
    return rightY;
  };
  
  // Draw each GHS section in right column - data comes from API
  console.log("GHS Info from API:", JSON.stringify(ghsInfo, null, 2));
  
  if (ghsInfo.Prevention) {
    rightY = drawWrappedText("Prevention:", ghsInfo.Prevention, rightStartX, rightMaxWidth);
  }
  if (ghsInfo.Response) {
    rightY = drawWrappedText("Response:", ghsInfo.Response, rightStartX, rightMaxWidth);
  }
  if (ghsInfo.Storage) {
    rightY = drawWrappedText("Storage:", ghsInfo.Storage, rightStartX, rightMaxWidth);
  }
  if (ghsInfo.Disposal) {
    rightY = drawWrappedText("Disposal:", ghsInfo.Disposal, rightStartX, rightMaxWidth);
  }
  if (ghsInfo.HazardStatement) {
    rightY = drawWrappedText("Hazard:", ghsInfo.HazardStatement, rightStartX, rightMaxWidth);
  }
  
  // Load and draw hazard images - bottom right - ALWAYS SHOW 3 SYMBOLS
  rightY += Math.round(height * 0.02);
  const symbolSize = Math.round(height * 0.10);
  let symbolX = rightStartX;
  
  // Always draw exactly 3 symbols
  const ghsImages = Array.isArray(energyData?.GHSImage) ? energyData.GHSImage : [];
  
  for (let i = 0; i < 3; i++) {
    if (i < ghsImages.length) {
      // Draw actual GHS image from API
      try {
        const imageUrl = ghsImages[i];
        console.log(`Loading hazard image ${i + 1}: ${imageUrl}`);
        const hazardImage = await loadImage(imageUrl);
        ctx.drawImage(hazardImage, symbolX, rightY, symbolSize, symbolSize);
      } catch (err) {
        console.warn(`⚠️ Could not load hazard image ${i}:`, err.message);
        // If image fails to load, draw placeholder
        drawNoGHSSymbol(ctx, symbolX, rightY, symbolSize);
      }
    } else {
      // Draw "NO GHS AVAILABLE" placeholder for missing images
      drawNoGHSSymbol(ctx, symbolX, rightY, symbolSize);
    }
    symbolX += (symbolSize + 5);
  }
  
  // Footer warning - bottom right, below icons
  ctx.fillStyle = "#F00";
  ctx.font = getFontString(Math.round(height * 0.026));
  ctx.textAlign = "left";
  const warningY = rightY + symbolSize + 3;
  
  // Wrap the warning text to fit in right column
  const warningText = "For R&D use only. Safety datasheet is available.";
  const warningWords = warningText.split(" ");
  let warningLine = "";
  let warningYPos = warningY;
  
  for (let word of warningWords) {
    const testLine = warningLine + (warningLine ? " " : "") + word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > rightMaxWidth && warningLine) {
      ctx.fillText(warningLine, rightStartX, warningYPos);
      warningYPos += Math.round(height * 0.032);
      warningLine = word;
    } else {
      warningLine = testLine;
    }
  }
  
  if (warningLine) {
    ctx.fillText(warningLine, rightStartX, warningYPos);
  }

  return canvas.toBuffer("image/png");
}

function drawNoGHSSymbol(ctx, x, y, size) {
  // Draw red diamond outline
  ctx.strokeStyle = "#F00";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + size / 2, y);
  ctx.lineTo(x + size, y + size / 2);
  ctx.lineTo(x + size / 2, y + size);
  ctx.lineTo(x, y + size / 2);
  ctx.closePath();
  ctx.stroke();

  // Draw "NO GHS AVAILABLE" text inside - very small to fit
  ctx.fillStyle = "#000";
  const fontSize = Math.round(size * 0.12); // Very small font
  ctx.font = `bold ${fontSize}px "DejaVu Sans"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  // Draw two lines of text
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  
  ctx.fillText("NO GHS", centerX, centerY - fontSize * 0.6);
  ctx.fillText("AVAILABLE", centerX, centerY + fontSize * 0.6);
  
  // Reset text alignment
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
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