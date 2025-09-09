
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

    // Extract base item code (remove size suffix) for Energy API call
    const baseItemCode = itemCode.trim().split('-')[0]; // Get A040341 from A040341-500g
    console.log('Base item code for Energy API:', baseItemCode);

    // Step 1: Get Energy API token
    const tokenResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/api/energy/getAccessToken`, {
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

      // Step 2: Get detailed product info from Energy API using base item code
      const labelInfoResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/api/energy/getLabelInfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemNumber: baseItemCode // Use base item code without size
        }),
      });

      // Log raw response for debugging
      const rawText = await labelInfoResponse.text();
      console.log('Raw Energy API response:', rawText);

      let labelData;
      try {
        labelData = JSON.parse(rawText);
        console.log('Parsed Energy API JSON:', labelData);
      } catch (err) {
        console.error('Failed to parse Energy API response as JSON:', err.message);
        labelData = null;
      }

      if (labelData && labelData.code === 200) {
        energyData = labelData.data;
        console.log('✅ Energy API data obtained:', energyData);
      } else {
        console.warn('⚠️ Energy API returned no data or error');
      }
    } else {
      console.error('Failed to get token:', await tokenResponse.text());
    }

    // If no Energy API data, we cannot proceed as we depend on it for product info
    if (!energyData) {
      console.log('No Energy API data available for item code:', itemCode);
      return res.status(404).json({ message: 'Product data not found in Energy API' });
    }

    // Step 3: Get batch number from database
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

      try {
        const batchResults = await queryDatabase(batchQuery, batchParams);
        if (batchResults && batchResults.length > 0) {
          vendorBatchNum = batchResults[0].VendorBatchNum || '';
        }
      } catch (error) {
        console.warn('Could not fetch batch number:', error.message);
        // Continue without batch number
      }
    }

    console.log('Energy data:', energyData);
    console.log('Vendor Batch Number:', vendorBatchNum);

    // Step 4: Generate enhanced label with Energy API data
    const labelBuffer = await generateEnhancedLabelImage(itemCode, energyData, vendorBatchNum);

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

async function generateEnhancedLabelImage(fullItemCode, energyData, vendorBatchNum = '') {
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

  // Line 2: Chemical name (from Energy API)
  const chemicalName = energyData?.productName || '';
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

  // Line 3: Purity (extract only up to % sign from Energy API)
  ctx.fillStyle = '#000000';
  ctx.font = `bold ${Math.round(height * 0.055)}px Arial`;
  let purity = energyData?.purity || '';
  
  // Extract purity up to % sign
  if (purity) {
    const purityMatch = purity.match(/^([^%]+%)/);
    if (purityMatch) {
      purity = purityMatch[1];
    }
    
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

  // Line 4: CAS, Molecular Formula, FW (horizontal) - from Energy API
  const smallFontSize = Math.round(height * 0.045);
  ctx.font = `${smallFontSize}px Arial`;
  
  const casNumber = energyData?.cas || '';
  const molFormula = energyData?.productMF || '';
  const molWeight = energyData?.productMW || '';
  
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

  // Line 6: UN Number and Hazard Class (from Energy API)
  const unNumber = energyData?.UnNo || '';
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

  // Hazard symbols (bottom right) - handle GHSImage array from Energy API
  const symbolSize = Math.round(height * 0.15);
  const symbolY = height - symbolSize - 10;
  let symbolX = width - symbolSize - 15;

  // Draw up to 3 hazard symbols if GHSImage is array and not empty
  const maxSymbols = 3;
  let symbolCount = 0;

  if (energyData?.GHSImage && Array.isArray(energyData.GHSImage) && energyData.GHSImage.length > 0) {
    // Draw hazard symbols for each image URL
    for (let i = 0; i < Math.min(energyData.GHSImage.length, maxSymbols); i++) {
      drawHazardSymbol(ctx, symbolX, symbolY, symbolSize);
      symbolX -= symbolSize + 5;
      symbolCount++;
    }
  }
  // If GHSImage is empty string or not an array, don't draw any symbols

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