// // pages/api/labels/download/[itemCode].js
// import { queryDatabase } from "../../../../lib/db";
// import sql from "mssql";
// import { createCanvas } from 'canvas';

// export default async function handler(req, res) {
//   if (req.method !== 'GET') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   const { itemCode, batchNum, docEntry, docNum } = req.query;

//   if (!itemCode || itemCode.trim() === '') {
//     return res.status(400).json({ message: 'Item code is required' });
//   }

//   try {
//     console.log('Fetching label data for item:', itemCode);

//     // Get product information
//     const productParams = [
//       { name: "itemCode", type: sql.NVarChar, value: itemCode.trim() }
//     ];

//     const productQuery = `
//       SELECT TOP 1
//           T0.[ItemCode] AS Cat_size_main,
//           T0.[ItemName] AS english,
//           T0.[U_ALTCAT] AS Cat_No,
//           T0.[U_CasNo] AS Cas,
//           T0.[U_MolucularFormula],
//           T0.[U_MolucularWeight],
//           T0.[U_MSDS],
//           T5.[U_COA],
//           T0.[U_Purity],
//           T0.[U_Smiles],
//           T1.[ItmsGrpNam],
//           T0.[U_WebsiteDisplay],
//           T0.[U_CatUpdateTimeStamp],
//           T0.[U_MeltingPoint],
//           T0.[U_BoilingPoint],
//           T0.[U_Appearance],
//           T0.[U_UNNumber],
//           T2.[OnHand] AS Stock_In_India,
//           T0.[U_ChinaStock] As Stock_In_China,
//           T0.[U_ItemBrand],
//           T4.[U_Quantity],
//           T4.[U_UOM],
//           T4.[U_Price],
//           T4.[U_PriceUSD]
//       FROM [dbo].[OITM] T0
//       LEFT JOIN [dbo].[OITB] T1 
//           ON T0.[ItmsGrpCod] = T1.[ItmsGrpCod]
//       LEFT JOIN [dbo].[OITW] T2 
//           ON T0.[ItemCode] = T2.[ItemCode]
//       LEFT JOIN [dbo].[@PRICING_H] T3 
//           ON T0.[ItemCode] = T3.U_Code
//       LEFT JOIN [dbo].[@PRICING_R] T4 
//           ON T3.DocEntry = T4.DocEntry
//       LEFT JOIN OBTN T5 
//           ON T0.[ItemCode] = T5.[ItemCode]
//       WHERE T0.[ItemCode] = @itemCode
//     `;

//     console.log('Executing SQL query for item:', itemCode);
//     const products = await queryDatabase(productQuery, productParams);
//     console.log('Query results:', products);

//     if (!products || products.length === 0) {
//       console.log('No product found for item code:', itemCode);
//       return res.status(404).json({ message: 'Product not found' });
//     }

//     const product = products[0];

//     // Get batch number if docEntry and docNum are provided
//     let vendorBatchNum = batchNum || '';
    
//     // if (docEntry && docNum && !vendorBatchNum) {
//     //   const batchQuery = `
//     //     SELECT TOP 1 ISNULL(T15.U_vendorbatchno, '') AS VendorBatchNum
//     //     FROM OINV T0
//     //     INNER JOIN INV1 T1 ON T1.DocEntry = T0.DocEntry
//     //     LEFT JOIN DLN1 T2 ON T2.DocEntry = T1.BaseEntry AND T2.LineNum = T1.BaseLine AND T1.BaseType = 15
//     //     LEFT JOIN ODLN T3 ON T3.DocEntry = T2.DocEntry
//     //     LEFT JOIN IBT1 T10 ON T10.CardCode = T3.CardCode 
//     //       AND T10.ItemCode = T2.ItemCode 
//     //       AND T10.BaseNum = T3.DocNum 
//     //       AND T10.BaseEntry = T3.DocEntry 
//     //       AND T10.BaseType = 15 
//     //       AND T10.BaseLinNum = T2.LineNum 
//     //       AND T10.Direction = 1
//     //     LEFT JOIN OIBT T15 ON T10.ItemCode = T15.ItemCode 
//     //       AND T10.BatchNum = T15.BatchNum
//     //     WHERE T0.DocEntry = @docEntry 
//     //       AND T0.DocNum = @docNum 
//     //       AND T1.ItemCode = @itemCode
//     //   `;
      
//     //   const batchParams = [
//     //     { name: 'docEntry', type: sql.Int, value: parseInt(docEntry) },
//     //     { name: 'docNum', type: sql.Int, value: parseInt(docNum) },
//     //     { name: 'itemCode', type: sql.NVarChar, value: itemCode.trim() }
//     //   ];

//     //   try {
//     //     const batchResults = await queryDatabase(batchQuery, batchParams);
//     //     if (batchResults && batchResults.length > 0) {
//     //       vendorBatchNum = batchResults[0].VendorBatchNum || '';
//     //     }
//     //   } catch (batchError) {
//     //     console.log('Could not fetch batch number:', batchError.message);
//     //   }
//     // }
//     if (!vendorBatchNum) {
//   const batchQuery = `
//     SELECT TOP 1 ISNULL(T0.BatchNum, '') AS VendorBatchNum
//     FROM OIBT T0
//     WHERE T0.ItemCode = @itemCode
//     ORDER BY T0.InDate DESC
//   `;
  
//   const batchParams = [
//     { name: 'itemCode', type: sql.NVarChar, value: itemCode.trim() }
//   ];

//   const batchResults = await queryDatabase(batchQuery, batchParams);
//   if (batchResults && batchResults.length > 0) {
//     vendorBatchNum = batchResults[0].VendorBatchNum || '';
//   }
// }

//     console.log('Product data:', product);
//     console.log('Vendor Batch Number:', vendorBatchNum);

//     // Generate label image with batch number
//     const labelBuffer = await generateHorizontalLabelImage(product, vendorBatchNum);

//     // Set response headers for image download
//     res.setHeader('Content-Type', 'image/png');
//     res.setHeader('Content-Disposition', `attachment; filename="Label_${itemCode.replace(/[^a-zA-Z0-9]/g, '_')}.png"`);
//     res.setHeader('Content-Length', labelBuffer.length);

//     console.log('Label generated successfully for:', itemCode);
//     return res.send(labelBuffer);

//   } catch (error) {
//     console.error('Error generating label:', error);
//     return res.status(500).json({ 
//       message: 'Failed to generate label',
//       error: error.message 
//     });
//   }
// }

// async function generateHorizontalLabelImage(product, vendorBatchNum = '') {
//   // Horizontal layout matching the bottle label - wider than tall
//   const width = 800;
//   const height = 500;
//   const canvas = createCanvas(width, height);
//   const ctx = canvas.getContext('2d');

//   // Background - white
//   ctx.fillStyle = '#FFFFFF';
//   ctx.fillRect(0, 0, width, height);

//   // Blue header section (3ASenrise branding)
//   const headerHeight = 60;
//   ctx.fillStyle = '#1E5AA8'; // Blue color matching 3ASenrise
//   ctx.fillRect(0, 0, width, headerHeight);

//   // 3ASenrise brand text
//   ctx.fillStyle = '#FFFFFF';
//   ctx.font = 'bold 28px Arial';
//   ctx.textAlign = 'left';
//   ctx.fillText('3ASenrise', 20, 40);

//   // Website in header
//   ctx.font = '14px Arial';
//   ctx.textAlign = 'right';
//   ctx.fillText('www.3asenrise.com', width - 20, 40);

//   // Main content area starts after header
//   let yPos = headerHeight + 30;
//   ctx.fillStyle = '#000000';
//   ctx.textAlign = 'left';

//   // Extract item code without size and size separately
//   const fullItemCode = product.Cat_size_main || product.ItemCode || '';
//   const itemCodeParts = fullItemCode.split('-');
//   const itemCodeWithoutSize = itemCodeParts.slice(0, -1).join('-') || fullItemCode;
  
//   // Extract size (last part after hyphen or numbers+letters at end)
//   let size = '';
//   if (itemCodeParts.length > 1) {
//     size = itemCodeParts[itemCodeParts.length - 1];
//   } else {
//     const sizeMatch = fullItemCode.match(/(\d+[a-zA-Z]*g?)$/);
//     if (sizeMatch) {
//       size = sizeMatch[1];
//     }
//   }

//   // Line 1: Item code, size, and LOT number (horizontal layout)
//   ctx.font = 'bold 18px Arial';
//   ctx.fillText(itemCodeWithoutSize, 20, yPos);
//   ctx.fillText(size, 250, yPos);
//   const lotText = vendorBatchNum ? `LOT:${vendorBatchNum}` : 'LOT:';
//   ctx.fillText(lotText, 350, yPos);
//   yPos += 40;

//   // Line 2: Chemical description
//   const description = product.english || product.ItemName || '';
//   ctx.font = '16px Arial';
//   ctx.fillStyle = '#333333';
  
//   // Handle long descriptions by wrapping text
//   const maxCharsPerLine = 60;
//   if (description.length > maxCharsPerLine) {
//     const words = description.split(' ');
//     let currentLine = '';
//     let lines = [];
    
//     words.forEach(word => {
//       if ((currentLine + word).length <= maxCharsPerLine) {
//         currentLine += (currentLine ? ' ' : '') + word;
//       } else {
//         if (currentLine) lines.push(currentLine);
//         currentLine = word;
//       }
//     });
//     if (currentLine) lines.push(currentLine);
    
//     // Show first 2 lines
//     lines.slice(0, 2).forEach(line => {
//       ctx.fillText(line, 20, yPos);
//       yPos += 25;
//     });
//   } else {
//     ctx.fillText(description, 20, yPos);
//     yPos += 25;
//   }
//   yPos += 15;

//   // Line 3: Purity
//   ctx.fillStyle = '#000000';
//   ctx.font = 'bold 16px Arial';
//   if (product.U_Purity) {
//     ctx.fillText(product.U_Purity, 20, yPos);
//   }
//   yPos += 35;

//   // Line 4: CAS, Molecular Formula, FW (horizontal)
//   ctx.font = '14px Arial';
//   const casNumber = product.Cas || product.U_CasNo || '';
//   const molFormula = product.U_MolucularFormula || '';
//   const molWeight = product.U_MolucularWeight || '';
  
//   if (casNumber) {
//     ctx.fillText(`CAS ${casNumber}`, 20, yPos);
//   }
  
//   if (molFormula) {
//     ctx.fillText(molFormula, 200, yPos);
//   }
  
//   if (molWeight) {
//     ctx.fillText(`FW:${molWeight}`, 400, yPos);
//   }
//   yPos += 30;

//   // Line 5: Storage conditions
//   ctx.fillText('Store at RT', 20, yPos);
//   yPos += 30;

//   // Line 6: UN Number and Hazard Class
//   const unNumber = product.U_UNNumber || '';
//   ctx.fillText(`UN:${unNumber}`, 20, yPos);
//   ctx.fillText('Haz Class:-', 150, yPos);
//   yPos += 40;

//   // Address section
//   ctx.font = '12px Arial';
//   ctx.fillStyle = '#333333';
//   const addressLines = [
//     '101 Block A, Bobhli Empire, Kompally,',
//     'Hyderabad - 500014, Telangana, India Tel:',
//     '+91 9989991174'
//   ];

//   addressLines.forEach(line => {
//     ctx.fillText(line, 20, yPos);
//     yPos += 16;
//   });

//   // Warning text at bottom
//   yPos += 10;
//   ctx.fillStyle = '#FF0000';
//   ctx.font = 'bold 10px Arial';
//   ctx.fillText('For R&D use only, not for human use', 20, yPos);

//   // Hazard symbol (bottom right)
//   const symbolSize = 60;
//   const symbolX = width - symbolSize - 20;
//   const symbolY = height - 100;

//   // Diamond shape hazard symbol
//   ctx.strokeStyle = '#FF0000';
//   ctx.lineWidth = 2;
  
//   // Draw diamond
//   ctx.beginPath();
//   ctx.moveTo(symbolX + symbolSize/2, symbolY);
//   ctx.lineTo(symbolX + symbolSize, symbolY + symbolSize/2);
//   ctx.lineTo(symbolX + symbolSize/2, symbolY + symbolSize);
//   ctx.lineTo(symbolX, symbolY + symbolSize/2);
//   ctx.closePath();
//   ctx.stroke();
  
//   // Exclamation mark in diamond
//   ctx.fillStyle = '#FF0000';
//   ctx.font = 'bold 24px Arial';
//   ctx.textAlign = 'center';
//   ctx.fillText('!', symbolX + symbolSize/2, symbolY + symbolSize/2 + 8);

//   return canvas.toBuffer('image/png');
// }


// pages/api/labels/download/[itemCode].js
import { queryDatabase } from "../../../../lib/db";
import sql from "mssql";
import { createCanvas } from 'canvas';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { itemCode, batchNum, docEntry, docNum } = req.query;

  if (!itemCode || itemCode.trim() === '') {
    return res.status(400).json({ message: 'Item code is required' });
  }

  try {
    console.log('Fetching label data for item:', itemCode);

    // Step 1: Get Energy API token
    const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/energy/getAccessToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    let energyData = null;
    let token = null;

    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      token = tokenData.data;
      console.log('Energy API token obtained');

      // Step 2: Get detailed product info from Energy API
      const labelInfoResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/energy/getLabelInfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemNumber: itemCode.trim()
        }),
      });

      if (labelInfoResponse.ok) {
        const labelData = await labelInfoResponse.json();
        if (labelData.code === 200) {
          energyData = labelData.data;
          console.log('Energy API data obtained:', energyData);
        }
      }
    }

    // Step 3: Get basic product info from database (fallback)
    const productParams = [
      { name: "itemCode", type: sql.NVarChar, value: itemCode.trim() }
    ];

    const productQuery = `
      SELECT TOP 1
          T0.[ItemCode] AS Cat_size_main,
          T0.[ItemName] AS english,
          T0.[U_ALTCAT] AS Cat_No,
          T0.[U_CasNo] AS Cas,
          T0.[U_MolucularFormula],
          T0.[U_MolucularWeight],
          T0.[U_MSDS],
          T5.[U_COA],
          T0.[U_Purity],
          T0.[U_Smiles],
          T1.[ItmsGrpNam],
          T0.[U_WebsiteDisplay],
          T0.[U_CatUpdateTimeStamp],
          T0.[U_MeltingPoint],
          T0.[U_BoilingPoint],
          T0.[U_Appearance],
          T0.[U_UNNumber],
          T2.[OnHand] AS Stock_In_India,
          T0.[U_ChinaStock] As Stock_In_China,
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
      LEFT JOIN OBTN T5 
          ON T0.[ItemCode] = T5.[ItemCode]
      WHERE T0.[ItemCode] = @itemCode
    `;

    console.log('Executing SQL query for item:', itemCode);
    const products = await queryDatabase(productQuery, productParams);
    console.log('Query results:', products);

    if (!products || products.length === 0) {
      console.log('No product found for item code:', itemCode);
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = products[0];

    // Step 4: Get batch number
    let vendorBatchNum = batchNum || '';
    
    if (!vendorBatchNum) {
      const batchQuery = `
        SELECT TOP 1 ISNULL(T0.BatchNum, '') AS VendorBatchNum
        FROM OIBT T0
        WHERE T0.ItemCode = @itemCode
        ORDER BY T0.InDate DESC
      `;
      
      const batchParams = [
        { name: 'itemCode', type: sql.NVarChar, value: itemCode.trim() }
      ];

      const batchResults = await queryDatabase(batchQuery, batchParams);
      if (batchResults && batchResults.length > 0) {
        vendorBatchNum = batchResults[0].VendorBatchNum || '';
      }
    }

    console.log('Product data:', product);
    console.log('Energy data:', energyData);
    console.log('Vendor Batch Number:', vendorBatchNum);

    // Step 5: Generate enhanced label with Energy API data
    const labelBuffer = await generateEnhancedLabelImage(product, energyData, vendorBatchNum);

    // Set response headers for image download
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="Label_${itemCode.replace(/[^a-zA-Z0-9]/g, '_')}.png"`);
    res.setHeader('Content-Length', labelBuffer.length);

    console.log('Enhanced label generated successfully for:', itemCode);
    return res.send(labelBuffer);

  } catch (error) {
    console.error('Error generating label:', error);
    return res.status(500).json({ 
      message: 'Failed to generate label',
      error: error.message 
    });
  }
}

async function generateEnhancedLabelImage(product, energyData, vendorBatchNum = '') {
  // Convert mm to pixels at 300 DPI (11.8 pixels per mm)
  const mmToPixels = 11.8;
  const width = Math.round(80 * mmToPixels);  // 944 pixels
  const height = Math.round(40 * mmToPixels); // 472 pixels
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background - white
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Blue header section
  const headerHeight = Math.round(height * 0.15); // ~15% of height
  ctx.fillStyle = '#1E5AA8'; // Blue color matching 3ASenrise
  ctx.fillRect(0, 0, width, headerHeight);

  // 3ASenrise brand text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.round(height * 0.08)}px Arial`; // Responsive font size
  ctx.textAlign = 'left';
  ctx.fillText('3ASenrise', 15, headerHeight * 0.7);

  // Website in header
  ctx.font = `${Math.round(height * 0.045)}px Arial`;
  ctx.textAlign = 'right';
  ctx.fillText('www.3asenrise.com', width - 15, headerHeight * 0.7);

  // Main content area starts after header
  let yPos = headerHeight + Math.round(height * 0.08);
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';

  // Extract item code without size and size separately
  const fullItemCode = product.Cat_size_main || product.ItemCode || '';
  const itemCodeParts = fullItemCode.split('-');
  const itemCodeWithoutSize = itemCodeParts.slice(0, -1).join('-') || fullItemCode;
  
  // Extract size (last part after hyphen)
  let size = '';
  if (itemCodeParts.length > 1) {
    size = itemCodeParts[itemCodeParts.length - 1];
  } else {
    const sizeMatch = fullItemCode.match(/(\d+[a-zA-Z]*g?)$/);
    if (sizeMatch) {
      size = sizeMatch[1];
    }
  }

  // Line 1: Item code, size, LOT number, and Danger (horizontal layout)
  const mainFontSize = Math.round(height * 0.065);
  ctx.font = `bold ${mainFontSize}px Arial`;
  ctx.fillText(itemCodeWithoutSize, 15, yPos);
  
  const sizeX = Math.round(width * 0.28);
  ctx.fillText(size, sizeX, yPos);
  
  const lotX = Math.round(width * 0.42);
  const lotText = vendorBatchNum ? `Lot: ${vendorBatchNum}` : 'Lot:';
  ctx.fillText(lotText, lotX, yPos);
  
  // Danger text (right aligned)
  ctx.textAlign = 'right';
  ctx.fillText('Danger', width - 15, yPos);
  ctx.textAlign = 'left';
  
  yPos += Math.round(height * 0.13);

  // Line 2: Chemical name (use Energy API data if available)
  const chemicalName = energyData?.productName || product.english || product.ItemName || '';
  const descFontSize = Math.round(height * 0.055);
  ctx.font = `${descFontSize}px Arial`;
  ctx.fillStyle = '#333333';
  
  // Truncate if too long for the width
  const maxWidth = width - 30;
  let displayName = chemicalName;
  if (ctx.measureText(displayName).width > maxWidth) {
    while (ctx.measureText(displayName + '...').width > maxWidth && displayName.length > 0) {
      displayName = displayName.slice(0, -1);
    }
    displayName += '...';
  }
  
  ctx.fillText(displayName, 15, yPos);
  yPos += Math.round(height * 0.11);

  // Line 3: Purity (use Energy API data if available)
  ctx.fillStyle = '#000000';
  ctx.font = `bold ${Math.round(height * 0.055)}px Arial`;
  const purity = energyData?.purity || product.U_Purity || '';
  if (purity) {
    // Truncate purity if too long
    let displayPurity = purity;
    if (ctx.measureText(displayPurity).width > maxWidth) {
      while (ctx.measureText(displayPurity + '...').width > maxWidth && displayPurity.length > 0) {
        displayPurity = displayPurity.slice(0, -1);
      }
      displayPurity += '...';
    }
    ctx.fillText(displayPurity, 15, yPos);
  }
  yPos += Math.round(height * 0.11);

  // Line 4: CAS, Molecular Formula, FW (horizontal)
  const smallFontSize = Math.round(height * 0.045);
  ctx.font = `${smallFontSize}px Arial`;
  
  const casNumber = energyData?.cas || product.Cas || product.U_CasNo || '';
  const molFormula = energyData?.productMF || product.U_MolucularFormula || '';
  const molWeight = energyData?.productMW || product.U_MolucularWeight || '';
  
  let xPos = 15;
  if (casNumber) {
    ctx.fillText(`CAS: ${casNumber}`, xPos, yPos);
    xPos += Math.round(width * 0.25);
  }
  
  if (molFormula) {
    ctx.fillText(molFormula, xPos, yPos);
    xPos += Math.round(width * 0.25);
  }
  
  if (molWeight) {
    ctx.fillText(`FW: ${molWeight}`, xPos, yPos);
  }
  yPos += Math.round(height * 0.09);

  // Line 5: Storage conditions
  ctx.fillText('Store at -2-8°C', 15, yPos);
  yPos += Math.round(height * 0.09);

  // Line 6: UN Number and Hazard Class (use Energy API data if available)
  const unNumber = energyData?.UnNo || product.U_UNNumber || '';
  const hazClass = energyData?.GHSClass || '';
  ctx.fillText(`UN: ${unNumber}`, 15, yPos);
  ctx.fillText(`Haz Class: ${hazClass || '-'}`, Math.round(width * 0.25), yPos);
  yPos += Math.round(height * 0.09);

  // Address section
  const addressFontSize = Math.round(height * 0.035);
  ctx.font = `${addressFontSize}px Arial`;
  ctx.fillStyle = '#333333';
  
  // Updated address as requested
  const addressLine1 = '101, Block A, Bobbili Empire, Kompally,';
  const addressLine2 = 'Hyderabad - 500014, Telangana, India';
  const phoneNumber = 'Tel: +91-9989991174';

  ctx.fillText(addressLine1, 15, yPos);
  yPos += Math.round(height * 0.045);
  ctx.fillText(addressLine2, 15, yPos);
  yPos += Math.round(height * 0.045);
  ctx.fillText(phoneNumber, 15, yPos);

  // Hazard symbols (bottom right) - draw multiple if available from Energy API
  const symbolSize = Math.round(height * 0.15);
  const symbolY = height - symbolSize - 10;
  let symbolX = width - symbolSize - 15;

  // Draw up to 3 hazard symbols
  const maxSymbols = 3;
  let symbolCount = 0;

  if (energyData?.GHSImage && Array.isArray(energyData.GHSImage)) {
    // For now, just draw diamond placeholders since we can't load external images easily
    for (let i = 0; i < Math.min(energyData.GHSImage.length, maxSymbols); i++) {
      drawHazardSymbol(ctx, symbolX, symbolY, symbolSize);
      symbolX -= symbolSize + 5;
      symbolCount++;
    }
  }

  // If no symbols from API, draw default danger symbol
  if (symbolCount === 0) {
    drawHazardSymbol(ctx, symbolX, symbolY, symbolSize);
  }

  // Warning text at bottom left
  ctx.fillStyle = '#FF0000';
  ctx.font = `bold ${Math.round(height * 0.03)}px Arial`;
  ctx.fillText('For R&D use only. Safety datasheet is available.', 15, height - 10);

  return canvas.toBuffer('image/png');
}

function drawHazardSymbol(ctx, x, y, size) {
  // Diamond shape hazard symbol
  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = 2;
  
  // Draw diamond
  ctx.beginPath();
  ctx.moveTo(x + size/2, y);
  ctx.lineTo(x + size, y + size/2);
  ctx.lineTo(x + size/2, y + size);
  ctx.lineTo(x, y + size/2);
  ctx.closePath();
  ctx.stroke();
  
  // Exclamation mark or other symbol in diamond
  ctx.fillStyle = '#FF0000';
  ctx.font = `bold ${Math.round(size * 0.4)}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('!', x + size/2, y + size/2 + size * 0.1);
  ctx.textAlign = 'left'; // Reset alignment
}