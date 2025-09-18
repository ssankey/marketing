
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
