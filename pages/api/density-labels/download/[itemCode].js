

// pages/api/density-labels/download/[itemCode].js
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

  const { itemCode, batchNum } = req.query;
  if (!itemCode || itemCode.trim() === "") {
    return res.status(400).json({ message: "Item code is required" });
  }

  try {
    console.log("Fetching density label data for item:", itemCode);

    // Dynamic filter
    let filter = "WHERE T0.[ItemCode] = @itemCode";
    const queryParams = [
      { name: "itemCode", type: sql.NVarChar, value: itemCode.trim() }
    ];

    if (batchNum && batchNum.trim()) {
      filter += " AND (T6.[BatchNum] = @batchNum OR T6.[U_vendorbatchno] = @batchNum)";
      queryParams.push({ name: "batchNum", type: sql.NVarChar, value: batchNum.trim() });
    }

    // CORRECTED QUERY - Fixed column name syntax
    const densityQuery = `
      SELECT 
          T0.[ItemCode] AS 'Cat_size_main',
          T0.[ItemName] AS 'english',
          T0.[U_ALTCAT] AS 'Cat_No',
          T0.[U_CasNo] AS Cas,
          T0.[U_MolucularFormula],
          T0.[U_MolucularWeight],
          T0.[U_MSDS],
          T5.[U_COA],
          T6.[BatchNum],                  
          T6.[U_vendorbatchno] AS VendorBatchNum, 
          T0.[U_Purity],
          T0.[U_Smiles],
          T1.[ItmsGrpNam],
          T0.[U_WebsiteDisplay],
          T0.[U_CatUpdateTimeStamp],
          T0.[U_MeltingPoint],
          T0.[U_BoilingPoint],
          T0.[U_Appearance],
          T0.[U_UNNumber],
          T2.[OnHand] AS 'Stock_In_India',
          T0.[U_ChinaStock] As 'Stock_In_China',
          T0.[U_ItemBrand],
          T4.[U_Quantity],
          T4.[U_UOM],
          T4.[U_Price],
          T4.[U_PriceUSD]
      FROM [dbo].[OITM] T0
      LEFT JOIN [dbo].[OITB] T1 
          ON T0.[ItmsGrpCod] = T1.[ItmsGrpCod]
      LEFT JOIN [dbo].[OITW] T2 
          ON T0.[ItemCode] = T2.[ItemCode]
      LEFT JOIN [dbo].[@PRICING_H] T3 
          ON T0.[ItemCode] = T3.U_Code
      LEFT JOIN [dbo].[@PRICING_R] T4 
          ON T3.DocEntry = T4.DocEntry
      LEFT JOIN [dbo].[OBTN] T5 
          ON T0.[ItemCode] = T5.[ItemCode]
      LEFT JOIN [dbo].[OIBT] T6              
          ON T0.[ItemCode] = T6.[ItemCode]
      ${filter}
    `;

    const results = await queryDatabase(densityQuery, queryParams);

    if (results.length === 0) {
      return res.status(404).json({ message: "Product data not found for density label" });
    }

    const productData = results[0];
    const finalBatchNum = batchNum || productData.VendorBatchNum || productData.BatchNum || "";

    // Generate the density label image
    const labelBuffer = await generateDensityLabelImage(productData, finalBatchNum);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="Density_Label_${itemCode.replace(/[^a-zA-Z0-9]/g, "_")}.png"`);
    res.setHeader("Content-Length", labelBuffer.length);

    return res.send(labelBuffer);
  } catch (err) {
    console.error("❌ Error generating density label:", err);
    return res.status(500).json({ message: "Failed to generate density label", error: err.message });
  }
}




async function generateDensityLabelImage(productData, vendorBatchNum = "") {
  const mmToPixels = 11.8;
  const width = Math.round(100 * mmToPixels); // 100mm
  const height = Math.round(35 * mmToPixels); // 35mm

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.textBaseline = "top";
  ctx.textAlign = "start";

  const safeText = (text) => (text ? String(text).normalize("NFC") : "");
  const getFontString = (size, weight = "normal") => `${weight} ${size}px "DejaVu Sans"`;

  // Background + border
  ctx.fillStyle = "#FFF";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, width, height);

  const margin = 15;
  let yPos = margin;

  // Logo (top-left) - bigger
  try {
    const densityLogoPath = path.join(process.cwd(), "public", "assets", "density_logo_new_trans.png");
    if (fs.existsSync(densityLogoPath)) {
      const densityLogo = await loadImage(densityLogoPath);
      const logoWidth = 160;  
      const logoHeight = 80;  
      ctx.drawImage(densityLogo, margin, yPos, logoWidth, logoHeight);
    }
  } catch (err) {
    console.warn("Could not load density logo:", err);
  }

  // Company info (top-right)
  ctx.fillStyle = "#000";
  ctx.font = getFontString(24, "bold");
  ctx.textAlign = "right";
  let rightStartY = margin;
  ctx.fillText("Density Pharmachem Pvt. Ltd.", width - margin, rightStartY);

  ctx.font = getFontString(20);
  rightStartY += 30;
  ctx.fillText("110, Block A, Bobbile Empire Kompally,", width - margin, rightStartY);
  rightStartY += 24;
  ctx.fillText("Hyderabad - 500 014, Telangana, India", width - margin, rightStartY);
  rightStartY += 24;
  ctx.fillText("eMail: sales@densitypharmachem.com", width - margin, rightStartY);

  // Reset alignment
  ctx.textAlign = "left";
  yPos = margin + 90 + 24; // Added extra 24px space after eMail line

  // Product name
  ctx.font = getFontString(26, "bold");
  let productName = safeText(productData.english || "");
  ctx.fillText(productName, margin, yPos);
  yPos += 34;

  // Formula
  if (productData.U_MolucularFormula) {
    ctx.font = getFontString(24, "bold");
    ctx.fillText(safeText(productData.U_MolucularFormula), margin, yPos);
    yPos += 36;
  }

  // Item Code + Pack size (inline)
  ctx.font = getFontString(24, "bold");
  const itemCodeText = safeText(productData.Cat_No || productData.Cat_size_main || "");
  const quantity = productData.U_Quantity && productData.U_UOM 
    ? `${productData.U_Quantity}${productData.U_UOM}` 
    : "100g";
  ctx.fillText(`${itemCodeText}    ${quantity}`, margin, yPos);
  yPos += 34;

  // LOT (starting at margin)
  const lotText = `LOT: ${vendorBatchNum}`;
  ctx.fillText(lotText, margin, yPos);
  yPos += 34;

  // CAS (starting at same margin position as LOT - vertically aligned)
  const casText = productData.Cas ? `CAS No: ${safeText(productData.Cas)}` : "";
  if (casText) {
    ctx.fillText(casText, margin, yPos);
  }
  yPos += 40;

  // Bottom notes - bold, black (moved up a little)
  yPos = height - 45;
  ctx.fillStyle = "#000";
  ctx.font = getFontString(20, "bold");
  ctx.textAlign = "left";
  ctx.fillText("STORE AT COOL & DRY PLACE", margin, yPos);

  ctx.textAlign = "right";
  ctx.fillText("For research and development use only. Consult MSDS.", width - margin, yPos);

  return canvas.toBuffer("image/png");
}