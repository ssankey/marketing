// lib/non-haz-pdf-generator.js
// Generates "Shipper's Certification for Non-Hazardous Cargo" PDF

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function wrapText(text, maxChars) {
  if (!text) return [""];
  const words = String(text).split(" ");
  const lines = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > maxChars) {
      lines.push(current.trim());
      current = w;
    } else {
      current = (current + " " + w).trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * @param {Object} data
 * @param {string} data.awbNo
 * @param {string} data.originAirport
 * @param {string} data.destAirport
 * @param {string} data.shipperName
 * @param {string} data.shipperAddress
 * @param {string} data.consigneeName
 * @param {string} data.consigneeAddress
 * @param {Array}  data.items - [{ packages, description, netQty }]
 * @param {string} data.fullName
 * @param {string} data.designation
 * @returns {Promise<Uint8Array>} PDF bytes
 */
export async function generateNonHazPdf({
  awbNo, originAirport, destAirport,
  shipperName, shipperAddress,
  consigneeName, consigneeAddress,
  items, fullName, designation,
}) {
  const doc  = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 40;
  let y = height - 50;

  const drawText = (text, x, yy, opts = {}) => {
    page.drawText(text || "", { x, y: yy, size: opts.size || 9, font: opts.bold ? bold : font, color: rgb(0, 0, 0) });
  };

  // Header
  drawText("Density Pharmachem Private Limited", margin, y, { bold: true, size: 13 });
  drawText("110, Block A, Bobbile Empire, Kompally, Hyderabad - 500014", margin, y - 14, { size: 8 });
  drawText("Telangana, India", margin, y - 25, { size: 8 });
  y -= 50;

  // Title
  page.drawRectangle({ x: margin, y: y - 5, width: width - margin * 2, height: 22, borderColor: rgb(0, 0, 0), borderWidth: 1 });
  drawText("Shipper's Certification for Non - Hazardous Cargo", margin + 100, y, { bold: true, size: 12 });
  y -= 35;

  // AWB / Airport row
  const col1 = margin, col2 = margin + 180, col3 = margin + 360;
  const rowH = 32;
  page.drawRectangle({ x: margin, y: y - rowH, width: width - margin * 2, height: rowH, borderColor: rgb(0, 0, 0), borderWidth: 1 });
  page.drawLine({ start: { x: col2, y }, end: { x: col2, y: y - rowH }, color: rgb(0, 0, 0), thickness: 1 });
  page.drawLine({ start: { x: col3, y }, end: { x: col3, y: y - rowH }, color: rgb(0, 0, 0), thickness: 1 });

  drawText("AWB no.", col1 + 4, y - 12, { bold: true, size: 8 });
  drawText(awbNo, col1 + 4, y - 24, { size: 9 });
  drawText("Airport of Dep.", col2 + 4, y - 12, { bold: true, size: 8 });
  drawText(originAirport, col2 + 4, y - 24, { size: 9 });
  drawText("Airport of Dest.", col3 + 4, y - 12, { bold: true, size: 8 });
  drawText(destAirport, col3 + 4, y - 24, { size: 9 });
  y -= rowH;

  // Declaration paragraph
  y -= 18;
  const declarationLines = [
    "This is to certify that the articles / substances of this shipment are properly described by name",
    "that they are not listed in the current edition of IATA / Dangerous Goods Regulations (DGR),",
    "Alphabetical List of Dangerous Goods, nor do they correspond to any of the hazard classes",
    "appearing in the DGR, Section 3, classification of Dangerous goods and that they are known not to be",
    "dangerous, I.e, not restricted.",
    "Furthermore the shipper confirms that the goods are in proper condition for transportation on",
    "passenger carrying aircraft (DGR, 8.1.23.) of International Air Transport Association (I A T A)",
  ];
  declarationLines.forEach((line, i) => drawText(line, margin, y - i * 12, { size: 8.5, bold: i < 5 }));
  y -= declarationLines.length * 12 + 10;

  // Goods table header
  const tableTop = y;
  const tCol1 = margin, tCol2 = margin + 110, tCol3 = width - margin - 110;
  const headerH = 28;
  page.drawRectangle({ x: margin, y: tableTop - headerH, width: width - margin * 2, height: headerH, borderColor: rgb(0, 0, 0), borderWidth: 1 });
  page.drawLine({ start: { x: tCol2, y: tableTop }, end: { x: tCol2, y: tableTop - headerH }, color: rgb(0, 0, 0) });
  page.drawLine({ start: { x: tCol3, y: tableTop }, end: { x: tCol3, y: tableTop - headerH }, color: rgb(0, 0, 0) });

  drawText("Marks and Number", tCol1 + 3, tableTop - 11, { size: 7.5, bold: true });
  drawText("of Packages", tCol1 + 3, tableTop - 21, { size: 7.5, bold: true });
  drawText("Proper description of goods / give technical name", tCol2 + 3, tableTop - 11, { size: 7.5, bold: true });
  drawText("(Trade Names not Permitted. Specify each article separately)", tCol2 + 3, tableTop - 21, { size: 7 });
  drawText("Net Quantity", tCol3 + 3, tableTop - 11, { size: 7.5, bold: true });
  drawText("per package", tCol3 + 3, tableTop - 21, { size: 7.5, bold: true });

  let rowY = tableTop - headerH;
  const dataRowH = 20;
  const totalRows = Math.max(items.length, 8);

  for (let i = 0; i < totalRows; i++) {
    page.drawRectangle({ x: margin, y: rowY - dataRowH, width: width - margin * 2, height: dataRowH, borderColor: rgb(0, 0, 0), borderWidth: 0.7 });
    page.drawLine({ start: { x: tCol2, y: rowY }, end: { x: tCol2, y: rowY - dataRowH }, color: rgb(0, 0, 0), thickness: 0.7 });
    page.drawLine({ start: { x: tCol3, y: rowY }, end: { x: tCol3, y: rowY - dataRowH }, color: rgb(0, 0, 0), thickness: 0.7 });
    if (items[i]) {
      drawText(items[i].packages, tCol1 + 3, rowY - 13, { size: 8.5 });
      drawText(items[i].description, tCol2 + 3, rowY - 13, { size: 8.5 });
      drawText(items[i].netQty, tCol3 + 3, rowY - 13, { size: 8.5 });
    }
    rowY -= dataRowH;
  }
  y = rowY - 10;

  // Shipper & Consignee address block
  const addrBoxH = 90;
  page.drawRectangle({ x: margin, y: y - addrBoxH, width: width - margin * 2, height: addrBoxH, borderColor: rgb(0, 0, 0), borderWidth: 1 });
  page.drawLine({ start: { x: tCol2, y }, end: { x: tCol2, y: y - addrBoxH }, color: rgb(0, 0, 0) });

  drawText("Shipper", margin + 3, y - 11, { size: 8, bold: true });
  drawText("&", margin + 3, y - 23, { size: 8, bold: true });
  drawText("Consignee", margin + 3, y - 35, { size: 8, bold: true });
  drawText("Address", margin + 3, y - 50, { size: 8, bold: true });
  drawText("on packages", margin + 3, y - 62, { size: 8, bold: true });

  drawText(shipperName, tCol2 + 5, y - 11, { size: 8, bold: true });
  const shipAddrLines = wrapText(shipperAddress, 75);
  shipAddrLines.forEach((line, i) => drawText(line, tCol2 + 5, y - 21 - i * 9, { size: 7.5 }));

  const consigneeY = y - 21 - shipAddrLines.length * 9 - 10;
  drawText(consigneeName, tCol2 + 5, consigneeY, { size: 8, bold: true });
  const consAddrLines = wrapText(consigneeAddress, 75);
  consAddrLines.forEach((line, i) => drawText(line, tCol2 + 5, consigneeY - 10 - i * 9, { size: 7.5 }));
  y -= addrBoxH;

  // Name & Address of Shipper / Signature block
  const sigBoxH = 90;
  page.drawRectangle({ x: margin, y: y - sigBoxH, width: width - margin * 2, height: sigBoxH, borderColor: rgb(0, 0, 0), borderWidth: 1 });
  page.drawLine({ start: { x: tCol2, y }, end: { x: tCol2, y: y - sigBoxH }, color: rgb(0, 0, 0) });
  page.drawLine({ start: { x: tCol2, y: y - 33 }, end: { x: width - margin, y: y - 33 }, color: rgb(0, 0, 0), thickness: 0.7 });

  drawText("Name & Address of Shipper", margin + 3, y - 11, { size: 8, bold: true });
  drawText(shipperName, margin + 3, y - 24, { size: 8 });
  const addrWrap = wrapText(shipperAddress, 38);
  addrWrap.forEach((line, i) => drawText(line, margin + 3, y - 34 - i * 9, { size: 7 }));

  drawText("FULL NAME", tCol2 + 5, y - 11, { size: 7.5, bold: true });
  drawText(fullName, tCol2 + 5, y - 22, { size: 9 });
  drawText("DESIGNATION", tCol2 + 5, y - 45, { size: 7.5, bold: true });
  drawText(designation, tCol2 + 5, y - 56, { size: 9 });
  drawText("SIGNATURE & COMPANY STAMP", tCol2 + 5, y - 80, { size: 7.5, bold: true });
  y -= sigBoxH + 15;

  // Footer notes
  const footerLines = [
    "To be completed in duplicate duly signed & stamped by shipper",
    "ONE COPY to be filed with the AWB copy at ORIGIN & ONE COPY to accompany DEST: AWB",
    "Attach Lab Analysis Report, Material Safety Data Sheet for Bulk-Drugs/ medicines/ Chemicals/ Cosmetics.",
    "pls certify that no hidden dangerous goods are stored or filled in any components or spare-parts.",
    "e.g. Plastic components /Transformer Spares / Elect & Electronic Appliances / for Plastic & Rubber (specify) PVC /etc",
    "Films ( non-nitro-cellulose base ) /",
    "Please note that MSDS is available at www.msdssearch.com",
  ];
  footerLines.forEach((line, i) => drawText(line, margin, y - i * 10, { size: 6.5 }));

  return await doc.save();
}