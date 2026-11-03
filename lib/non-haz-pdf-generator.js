// // lib/non-haz-pdf-generator.js
// // Generates "Shipper's Certification for Non-Hazardous Cargo" PDF

// import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
// import fs   from "fs";
// import path from "path";

// // WinAnsi (the standard PDF font encoding) can't render most Unicode
// // punctuation that shows up in pasted addresses/names (smart quotes, primes,
// // dashes, Greek mu, etc.). Map the common ones to ASCII/Latin-1 equivalents
// // and drop anything else it can't encode so PDF generation doesn't crash.
// const WINANSI_REPLACEMENTS = {
//   "‘": "'", "’": "'", "‚": "'",
//   "“": '"', "”": '"', "„": '"',
//   "′": "'", "″": '"',
//   "–": "-", "—": "-",
//   "…": "...",
//   "μ": "µ", // Greek small letter mu -> micro sign (WinAnsi 0xB5)
// };
// function sanitizeForWinAnsi(text) {
//   if (!text) return "";
//   return String(text)
//     .replace(/[‘’‚“”„′″–—…μ]/g, ch => WINANSI_REPLACEMENTS[ch])
//     .replace(/[\r\n\t]+/g, " ")
//     .replace(/[\x00-\x1F\x7F]/g, "") // strip remaining control chars — WinAnsi can't encode them
//     .replace(/[^\x00-\xFF]/g, "?");
// }

// // Wraps text to fit within maxWidth (in pt) for the given font/size, using
// // actual glyph widths rather than a guessed character count.
// function wrapByWidth(text, font, size, maxWidth) {
//   const clean = sanitizeForWinAnsi(text);
//   if (!clean) return [""];
//   const words = clean.split(" ");
//   const lines = [];
//   let current = "";
//   for (const word of words) {
//     const candidate = current ? `${current} ${word}` : word;
//     if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
//       lines.push(current);
//       current = word;
//     } else {
//       current = candidate;
//     }
//   }
//   if (current) lines.push(current);
//   return lines.length ? lines : [""];
// }

// // Right-aligns a line of text ending at `rightEdge`.
// function drawTextRight(page, text, rightEdge, yy, font, size, color) {
//   const clean = sanitizeForWinAnsi(text);
//   const lineWidth = font.widthOfTextAtSize(clean, size);
//   page.drawText(clean, { x: rightEdge - lineWidth, y: yy, size, font, color });
// }

// // Centers a line of text within [leftEdge, rightEdge].
// function drawTextCentered(page, text, leftEdge, rightEdge, yy, font, size, color) {
//   const clean = sanitizeForWinAnsi(text);
//   const lineWidth = font.widthOfTextAtSize(clean, size);
//   page.drawText(clean, { x: leftEdge + (rightEdge - leftEdge - lineWidth) / 2, y: yy, size, font, color });
// }

// const PAGE_SIZE   = [595.28, 841.89]; // A4
// const MARGIN      = 40;
// const TABLE_COL2  = MARGIN + 110;          // shared column line used by multiple boxes
// const GST_NUMBER  = "GST 36AAKCD9426G1ZE | CIN U20119TS2024PTC";
// const BLUE        = rgb(0.04, 0.32, 0.66);

// /**
//  * @param {Object} data
//  * @param {string} data.awbNo
//  * @param {string} data.originAirport
//  * @param {string} data.destAirport
//  * @param {string} data.shipperName
//  * @param {string} data.shipperAddress
//  * @param {string} data.consigneeName
//  * @param {string} data.consigneeAddress
//  * @param {Array}  data.items - [{ packages, description, netQty }]
//  * @param {string} data.fullName
//  * @param {string} data.designation
//  * @returns {Promise<Uint8Array>} PDF bytes
//  */
// export async function generateNonHazPdf({
//   awbNo, originAirport, destAirport,
//   shipperName, shipperAddress,
//   consigneeName, consigneeAddress,
//   items, fullName, designation,
// }) {
//   const doc  = await PDFDocument.create();
//   const font = await doc.embedFont(StandardFonts.Helvetica);
//   const bold = await doc.embedFont(StandardFonts.HelveticaBold);

//   const logoPath = path.join(process.cwd(), "public", "assets", "density_logo_new_trans.png");
//   let logoImage = null;
//   try {
//     if (fs.existsSync(logoPath)) {
//       logoImage = await doc.embedPng(fs.readFileSync(logoPath));
//     }
//   } catch (err) {
//     console.warn("Non-Haz PDF: could not embed logo:", err.message);
//   }

//   const width = PAGE_SIZE[0];
//   let page = doc.addPage(PAGE_SIZE);
//   let y;

//   const drawText = (text, x, yy, opts = {}) => {
//     page.drawText(sanitizeForWinAnsi(text), { x, y: yy, size: opts.size || 9, font: opts.bold ? bold : font, color: rgb(0, 0, 0) });
//   };

//   // Draws the company letterhead (logo on the left, address right-aligned) at the top of a page.
//   const drawLetterhead = () => {
//     const topY = PAGE_SIZE[1] - 55;
//     const rightEdge = width - MARGIN;

//     let logoHeight = 0;
//     if (logoImage) {
//       logoHeight = 58;
//       const logoWidth = logoImage.width * (logoHeight / logoImage.height);
//       page.drawImage(logoImage, { x: MARGIN, y: topY - logoHeight + 12, width: logoWidth, height: logoHeight });
//     }

//     const addressLines = [
//       { text: "Density Pharmachem Private Limited", size: 12, bold: true },
//       { text: "110, Block A, Bobbile Empire, Kompally",   size: 8,  bold: false },
//       { text: "Hyderabad - 500 014 India",                size: 8,  bold: false },
//       { text: "Phone: +91 9989991174",                    size: 8,  bold: false },
//       { text: "eMail: sales@densitypharmachem.com",       size: 8,  bold: false },
//     ];
//     const lineHeight = 12;
//     addressLines.forEach((line, i) => {
//       drawTextRight(page, line.text, rightEdge, topY - i * lineHeight, line.bold ? bold : font, line.size, rgb(0, 0, 0));
//     });
//     const addressBlockHeight = addressLines.length * lineHeight;

//     // extra gap below the letterhead before the title bar
//     return topY - Math.max(logoHeight, addressBlockHeight) - 25;
//   };

//   // Starts a fresh page and returns the y-coordinate to resume drawing from.
//   const startNewPage = () => {
//     page = doc.addPage(PAGE_SIZE);
//     return drawLetterhead();
//   };

//   y = drawLetterhead();

//   // Title
//   page.drawRectangle({ x: MARGIN, y: y - 9, width: width - MARGIN * 2, height: 28, borderColor: rgb(0, 0, 0), borderWidth: 1 });
//   drawTextCentered(page, "Shipper's Certification for Non - Hazardous Cargo", MARGIN, width - MARGIN, y, bold, 14, rgb(0, 0, 0));
//   y -= 40;

//   // AWB / Airport row
//   const col1 = MARGIN, col2 = MARGIN + 180, col3 = MARGIN + 360;
//   const rowH = 32;
//   page.drawRectangle({ x: MARGIN, y: y - rowH, width: width - MARGIN * 2, height: rowH, borderColor: rgb(0, 0, 0), borderWidth: 1 });
//   page.drawLine({ start: { x: col2, y }, end: { x: col2, y: y - rowH }, color: rgb(0, 0, 0), thickness: 1 });
//   page.drawLine({ start: { x: col3, y }, end: { x: col3, y: y - rowH }, color: rgb(0, 0, 0), thickness: 1 });

//   drawText("AWB no.", col1 + 4, y - 12, { bold: true, size: 8 });
//   drawText(awbNo, col1 + 4, y - 24, { size: 9 });
//   drawText("Airport of Dep.", col2 + 4, y - 12, { bold: true, size: 8 });
//   drawText(originAirport, col2 + 4, y - 24, { size: 9 });
//   drawText("Airport of Dest.", col3 + 4, y - 12, { bold: true, size: 8 });
//   drawText(destAirport, col3 + 4, y - 24, { size: 9 });
//   y -= rowH;

//   // Declaration paragraph
//   y -= 18;
//   const declarationLines = [
//     "This is to certify that the articles / substances of this shipment are properly described by name",
//     "that they are not listed in the current edition of IATA / Dangerous Goods Regulations (DGR),",
//     "Alphabetical List of Dangerous Goods, nor do they correspond to any of the hazard classes",
//     "appearing in the DGR, Section 3, classification of Dangerous goods and that they are known not to be",
//     "dangerous, I.e, not restricted.",
//     "Furthermore the shipper confirms that the goods are in proper condition for transportation on",
//     "passenger carrying aircraft (DGR, 8.1.23.) of International Air Transport Association (I A T A)",
//   ];
//   declarationLines.forEach((line, i) => drawText(line, MARGIN, y - i * 12, { size: 8.5, bold: i < 5 }));
//   y -= declarationLines.length * 12 + 10;

//   // ── Goods table ───────────────────────────────────────────────────────────
//   const tCol1 = MARGIN, tCol2 = TABLE_COL2, tCol3 = width - MARGIN - 110;
//   const descColWidth = tCol3 - tCol2 - 6;
//   const headerH = 28;
//   const footerReserve = 290; // space needed below the table for the address/signature blocks + footer notes

//   const drawTableHeader = () => {
//     const top = y;
//     page.drawRectangle({ x: MARGIN, y: top - headerH, width: width - MARGIN * 2, height: headerH, borderColor: rgb(0, 0, 0), borderWidth: 1 });
//     page.drawLine({ start: { x: tCol2, y: top }, end: { x: tCol2, y: top - headerH }, color: rgb(0, 0, 0) });
//     page.drawLine({ start: { x: tCol3, y: top }, end: { x: tCol3, y: top - headerH }, color: rgb(0, 0, 0) });

//     drawText("Marks and Number", tCol1 + 3, top - 11, { size: 7.5, bold: true });
//     drawText("of Packages", tCol1 + 3, top - 21, { size: 7.5, bold: true });
//     drawText("Proper description of goods / give technical name", tCol2 + 3, top - 11, { size: 7.5, bold: true });
//     drawText("(Trade Names not Permitted. Specify each article separately)", tCol2 + 3, top - 21, { size: 7 });
//     drawText("Net Quantity", tCol3 + 3, top - 11, { size: 7.5, bold: true });
//     drawText("per package", tCol3 + 3, top - 21, { size: 7.5, bold: true });

//     return top - headerH;
//   };

//   let rowY = drawTableHeader();

//   for (let i = 0; i < items.length; i++) {
//     const item = items[i];
//     const descLines = wrapByWidth(item.description, font, 8.5, descColWidth);
//     const dataRowH = Math.max(20, descLines.length * 10 + 8);

//     // Page break: keep the goods table together, and leave room for the
//     // address/signature blocks that always follow it.
//     if (rowY - dataRowH < MARGIN + footerReserve) {
//       y = startNewPage();
//       rowY = drawTableHeader();
//     }

//     page.drawRectangle({ x: MARGIN, y: rowY - dataRowH, width: width - MARGIN * 2, height: dataRowH, borderColor: rgb(0, 0, 0), borderWidth: 0.7 });
//     page.drawLine({ start: { x: tCol2, y: rowY }, end: { x: tCol2, y: rowY - dataRowH }, color: rgb(0, 0, 0), thickness: 0.7 });
//     page.drawLine({ start: { x: tCol3, y: rowY }, end: { x: tCol3, y: rowY - dataRowH }, color: rgb(0, 0, 0), thickness: 0.7 });

//     drawText(item.packages, tCol1 + 3, rowY - 13, { size: 8.5 });
//     descLines.forEach((line, li) => drawText(line, tCol2 + 3, rowY - 13 - li * 10, { size: 8.5 }));
//     drawText(item.netQty, tCol3 + 3, rowY - 13, { size: 8.5 });
//     rowY -= dataRowH;
//   }
//   y = rowY - 10;

//   // The table loop's footerReserve already guarantees enough room below the
//   // table for the address/signature/footer blocks (~261pt) on the current
//   // page — no extra page-break check needed here.

//   // Shipper & Consignee address block
//   const addrBoxH = 90;
//   page.drawRectangle({ x: MARGIN, y: y - addrBoxH, width: width - MARGIN * 2, height: addrBoxH, borderColor: rgb(0, 0, 0), borderWidth: 1 });
//   page.drawLine({ start: { x: tCol2, y }, end: { x: tCol2, y: y - addrBoxH }, color: rgb(0, 0, 0) });

//   drawText("Shipper", MARGIN + 3, y - 11, { size: 8, bold: true });
//   drawText("&", MARGIN + 3, y - 23, { size: 8, bold: true });
//   drawText("Consignee", MARGIN + 3, y - 35, { size: 8, bold: true });
//   drawText("Address", MARGIN + 3, y - 50, { size: 8, bold: true });
//   drawText("on packages", MARGIN + 3, y - 62, { size: 8, bold: true });

//   drawText(shipperName, tCol2 + 5, y - 11, { size: 8, bold: true });
//   const shipAddrLines = wrapByWidth(shipperAddress, font, 7.5, width - MARGIN - tCol2 - 10);
//   shipAddrLines.forEach((line, i) => drawText(line, tCol2 + 5, y - 21 - i * 9, { size: 7.5 }));

//   const consigneeY = y - 21 - shipAddrLines.length * 9 - 10;
//   drawText(consigneeName, tCol2 + 5, consigneeY, { size: 8, bold: true });
//   const consAddrLines = wrapByWidth(consigneeAddress, font, 7.5, width - MARGIN - tCol2 - 10);
//   consAddrLines.forEach((line, i) => drawText(line, tCol2 + 5, consigneeY - 10 - i * 9, { size: 7.5 }));
//   y -= addrBoxH;

//   // Name & Address of Shipper / Signature block
//   const sigBoxH = 90;
//   page.drawRectangle({ x: MARGIN, y: y - sigBoxH, width: width - MARGIN * 2, height: sigBoxH, borderColor: rgb(0, 0, 0), borderWidth: 1 });
//   page.drawLine({ start: { x: tCol2, y }, end: { x: tCol2, y: y - sigBoxH }, color: rgb(0, 0, 0) });
//   page.drawLine({ start: { x: tCol2, y: y - 33 }, end: { x: width - MARGIN, y: y - 33 }, color: rgb(0, 0, 0), thickness: 0.7 });

//   drawText("Name & Address of Shipper", MARGIN + 3, y - 11, { size: 8, bold: true });
//   drawText(shipperName, MARGIN + 3, y - 24, { size: 8 });
//   const addrWrap = wrapByWidth(shipperAddress, font, 7, tCol2 - MARGIN - 10);
//   addrWrap.forEach((line, i) => drawText(line, MARGIN + 3, y - 34 - i * 9, { size: 7 }));

//   drawText("FULL NAME", tCol2 + 5, y - 11, { size: 7.5, bold: true });
//   drawText(fullName, tCol2 + 5, y - 22, { size: 9 });
//   drawText("DESIGNATION", tCol2 + 5, y - 45, { size: 7.5, bold: true });
//   drawText(designation, tCol2 + 5, y - 56, { size: 9 });
//   drawTextCentered(page, "SIGNATURE & COMPANY STAMP", tCol2, width - MARGIN, y - 80, bold, 7.5, rgb(0, 0, 0));
//   y -= sigBoxH + 15;

//   // Footer notes
//   const footerLines = [
//     "To be completed in duplicate duly signed & stamped by shipper",
//     "ONE COPY to be filed with the AWB copy at ORIGIN & ONE COPY to accompany DEST: AWB",
//     "Attach Lab Analysis Report, Material Safety Data Sheet for Bulk-Drugs/ medicines/ Chemicals/ Cosmetics.",
//     "pls certify that no hidden dangerous goods are stored or filled in any components or spare-parts.",
//     "e.g. Plastic components /Transformer Spares / Elect & Electronic Appliances / for Plastic & Rubber (specify) PVC /etc",
//     "Films ( non-nitro-cellulose base ) /",
//   ];
//   footerLines.forEach((line, i) => drawText(line, MARGIN, y - i * 10, { size: 6.5 }));
//   y -= footerLines.length * 10 + 6;
//   drawText("Please note that MSDS is available at www.msdssearch.com", MARGIN, y, { size: 9, bold: true });

//   // Footer GST/CIN + page numbers on every page
//   const pages = doc.getPages();
//   const totalPages = pages.length;
//   pages.forEach((p, idx) => {
//     const label = `${GST_NUMBER}   |   Page ${idx + 1} of ${totalPages}`;
//     drawTextRight(p, label, width - MARGIN, 20, font, 8, BLUE);
//   });

//   return await doc.save();
// }


// lib/non-haz-pdf-generator.js
// Generates "Shipper's Certification for Non-Hazardous Cargo" PDF

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs   from "fs";
import path from "path";

// WinAnsi (the standard PDF font encoding) can't render most Unicode
// punctuation that shows up in pasted addresses/names (smart quotes, primes,
// dashes, Greek mu, etc.). Map the common ones to ASCII/Latin-1 equivalents
// and drop anything else it can't encode so PDF generation doesn't crash.
const WINANSI_REPLACEMENTS = {
  "\u2018": "'", "\u2019": "'", "\u201A": "'",
  "\u201C": '"', "\u201D": '"', "\u201E": '"',
  "\u2032": "'", "\u2033": '"',
  "\u2013": "-", "\u2014": "-",
  "\u2026": "...",
  "\u03BC": "\u00B5", // Greek small letter mu -> micro sign (WinAnsi 0xB5)
};

function sanitizeForWinAnsi(text) {
  if (!text) return "";
  return String(text)
    .replace(/[\u2018\u2019\u201A\u201C\u201D\u201E\u2032\u2033\u2013\u2014\u2026\u03BC]/g, ch => WINANSI_REPLACEMENTS[ch])
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[\x00-\x1F\x7F]/g, "") // strip remaining control chars — WinAnsi can't encode them
    .replace(/[^\x00-\xFF]/g, "?");
}

// Wraps text to fit within maxWidth (in pt) for the given font/size, using
// actual glyph widths rather than a guessed character count.
function wrapByWidth(text, font, size, maxWidth) {
  const clean = sanitizeForWinAnsi(text);
  if (!clean) return [""];
  const words = clean.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

// Right-aligns a line of text ending at `rightEdge`.
function drawTextRight(page, text, rightEdge, yy, font, size, color) {
  const clean = sanitizeForWinAnsi(text);
  const lineWidth = font.widthOfTextAtSize(clean, size);
  page.drawText(clean, { x: rightEdge - lineWidth, y: yy, size, font, color });
}

// Centers a line of text within [leftEdge, rightEdge].
function drawTextCentered(page, text, leftEdge, rightEdge, yy, font, size, color) {
  const clean = sanitizeForWinAnsi(text);
  const lineWidth = font.widthOfTextAtSize(clean, size);
  page.drawText(clean, { x: leftEdge + (rightEdge - leftEdge - lineWidth) / 2, y: yy, size, font, color });
}

const PAGE_SIZE   = [595.28, 841.89]; // A4
const MARGIN      = 40;
const TABLE_COL2  = MARGIN + 110;          // shared column line used by multiple boxes
const GST_NUMBER  = "GST 36AAKCD9426G1ZE | CIN U20119TS2024PTC";
const BLUE        = rgb(0.04, 0.32, 0.66);

/**
 * @param {Object} data
 * @param {string} data.awbNo
 * @param {string} data.originAirport
 * @param {string} data.destAirport
 * @param {string} data.shipperName
 * @param {string} data.shipperAddress
 * @param {string} data.consigneeName
 * @param {string} data.consigneeAddress
 * @param {string} data.packageLabel - e.g. "3 Packages", shown once in the first table row
 * @param {Array}  data.items - [{ description, netQty }]
 * @param {string} data.fullName
 * @param {string} data.designation
 * @returns {Promise<Uint8Array>} PDF bytes
 */
export async function generateNonHazPdf({
  awbNo, originAirport, destAirport,
  shipperName, shipperAddress,
  consigneeName, consigneeAddress,
  packageLabel, items, fullName, designation,
}) {
  const doc  = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const logoPath = path.join(process.cwd(), "public", "assets", "density_logo_new_trans.png");
  let logoImage = null;
  try {
    if (fs.existsSync(logoPath)) {
      logoImage = await doc.embedPng(fs.readFileSync(logoPath));
    }
  } catch (err) {
    console.warn("Non-Haz PDF: could not embed logo:", err.message);
  }

  const width = PAGE_SIZE[0];
  let page = doc.addPage(PAGE_SIZE);
  let y;

  const drawText = (text, x, yy, opts = {}) => {
    page.drawText(sanitizeForWinAnsi(text), { x, y: yy, size: opts.size || 9, font: opts.bold ? bold : font, color: rgb(0, 0, 0) });
  };

  // Draws the company letterhead (logo on the left, address right-aligned) at the top of a page.
  const drawLetterhead = () => {
    const topY = PAGE_SIZE[1] - 55;
    const rightEdge = width - MARGIN;

    let logoHeight = 0;
    if (logoImage) {
      logoHeight = 58;
      const logoWidth = logoImage.width * (logoHeight / logoImage.height);
      page.drawImage(logoImage, { x: MARGIN, y: topY - logoHeight + 12, width: logoWidth, height: logoHeight });
    }

    const addressLines = [
      { text: "Density Pharmachem Private Limited", size: 12, bold: true },
      { text: "110, Block A, Bobbile Empire, Kompally",   size: 8,  bold: false },
      { text: "Hyderabad - 500 014 India",                size: 8,  bold: false },
      { text: "Phone: +91 9989991174",                    size: 8,  bold: false },
      { text: "eMail: sales@densitypharmachem.com",       size: 8,  bold: false },
    ];
    const lineHeight = 12;
    addressLines.forEach((line, i) => {
      drawTextRight(page, line.text, rightEdge, topY - i * lineHeight, line.bold ? bold : font, line.size, rgb(0, 0, 0));
    });
    const addressBlockHeight = addressLines.length * lineHeight;

    // extra gap below the letterhead before the title bar
    return topY - Math.max(logoHeight, addressBlockHeight) - 25;
  };

  // Starts a fresh page and returns the y-coordinate to resume drawing from.
  const startNewPage = () => {
    page = doc.addPage(PAGE_SIZE);
    return drawLetterhead();
  };

  y = drawLetterhead();

  // Title
  page.drawRectangle({ x: MARGIN, y: y - 9, width: width - MARGIN * 2, height: 28, borderColor: rgb(0, 0, 0), borderWidth: 1 });
  drawTextCentered(page, "Shipper's Certification for Non - Hazardous Cargo", MARGIN, width - MARGIN, y, bold, 14, rgb(0, 0, 0));
  y -= 40;

  // AWB / Airport row
  const col1 = MARGIN, col2 = MARGIN + 180, col3 = MARGIN + 360;
  const rowH = 32;
  page.drawRectangle({ x: MARGIN, y: y - rowH, width: width - MARGIN * 2, height: rowH, borderColor: rgb(0, 0, 0), borderWidth: 1 });
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
  declarationLines.forEach((line, i) => drawText(line, MARGIN, y - i * 12, { size: 8.5, bold: i < 5 }));
  y -= declarationLines.length * 12 + 10;

  // ── Goods table ───────────────────────────────────────────────────────────
  const tCol1 = MARGIN, tCol2 = TABLE_COL2, tCol3 = width - MARGIN - 110;
  const descColWidth = tCol3 - tCol2 - 6;
  const headerH = 28;
  // Space the address/signature/footer blocks need below the table (90 + 90+15 + 66 + 12).
  const footerBlockHeight = 273;

  const drawTableHeader = () => {
    const top = y;
    page.drawRectangle({ x: MARGIN, y: top - headerH, width: width - MARGIN * 2, height: headerH, borderColor: rgb(0, 0, 0), borderWidth: 1 });
    page.drawLine({ start: { x: tCol2, y: top }, end: { x: tCol2, y: top - headerH }, color: rgb(0, 0, 0) });
    page.drawLine({ start: { x: tCol3, y: top }, end: { x: tCol3, y: top - headerH }, color: rgb(0, 0, 0) });

    drawText("Marks and Number", tCol1 + 3, top - 11, { size: 7.5, bold: true });
    drawText("of Packages", tCol1 + 3, top - 21, { size: 7.5, bold: true });
    drawText("Proper description of goods / give technical name", tCol2 + 3, top - 11, { size: 7.5, bold: true });
    drawText("(Trade Names not Permitted. Specify each article separately)", tCol2 + 3, top - 21, { size: 7 });
    drawText("Net Quantity", tCol3 + 3, top - 11, { size: 7.5, bold: true });
    drawText("per package", tCol3 + 3, top - 21, { size: 7.5, bold: true });

    return top - headerH;
  };

  let rowY = drawTableHeader();
  let colStartY = rowY;  // top of the "Marks and Number" column for the current page segment
  let colPage = page;    // page that colStartY belongs to (changes across page breaks)
  let isFirstRowOnFirstPage = true; // packageLabel is only drawn once, on the very first data row overall

  // Marks and Number of Packages is a single shipment-wide value, so that
  // column gets one border box per page (no per-row lines) instead of a
  // line under every row.
  const closeCol1Box = (bottomY) => {
    colPage.drawRectangle({ x: MARGIN, y: bottomY, width: tCol2 - MARGIN, height: colStartY - bottomY, borderColor: rgb(0, 0, 0), borderWidth: 0.7 });
  };

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const descLines = wrapByWidth(item.description, font, 8.5, descColWidth);
    const dataRowH = Math.max(20, descLines.length * 10 + 8);

    // Page break: only when a row genuinely doesn't fit — let the table use
    // all the remaining room on the page rather than reserving footer space
    // it might not need yet (the footer gets its own fit-check after the loop).
    if (rowY - dataRowH < MARGIN) {
      closeCol1Box(rowY);
      y = startNewPage();
      rowY = drawTableHeader();
      colStartY = rowY;
      colPage = page;
    }

    page.drawRectangle({ x: tCol2, y: rowY - dataRowH, width: (width - MARGIN) - tCol2, height: dataRowH, borderColor: rgb(0, 0, 0), borderWidth: 0.7 });
    page.drawLine({ start: { x: tCol3, y: rowY }, end: { x: tCol3, y: rowY - dataRowH }, color: rgb(0, 0, 0), thickness: 0.7 });

    // Package count is a single shipment-wide value — only draw it once,
    // in the first data row's "Marks and Number" cell. Every other row
    // (including rows after a page break) leaves that cell blank.
    if (isFirstRowOnFirstPage) {
      drawText(packageLabel, tCol1 + 3, rowY - 13, { size: 8.5 });
      isFirstRowOnFirstPage = false;
    }
    descLines.forEach((line, li) => drawText(line, tCol2 + 3, rowY - 13 - li * 10, { size: 8.5 }));
    drawText(item.netQty, tCol3 + 3, rowY - 13, { size: 8.5 });
    rowY -= dataRowH;
  }
  closeCol1Box(rowY);
  y = rowY - 10;

  // If the address/signature/footer blocks don't fit below the table on
  // this page, push only that block to a new page — the table itself
  // already used all the room it could on this one.
  if (y - footerBlockHeight < MARGIN) {
    y = startNewPage();
  }

  // Shipper & Consignee address block
  const addrBoxH = 90;
  page.drawRectangle({ x: MARGIN, y: y - addrBoxH, width: width - MARGIN * 2, height: addrBoxH, borderColor: rgb(0, 0, 0), borderWidth: 1 });
  page.drawLine({ start: { x: tCol2, y }, end: { x: tCol2, y: y - addrBoxH }, color: rgb(0, 0, 0) });

  drawText("Shipper", MARGIN + 3, y - 11, { size: 8, bold: true });
  drawText("&", MARGIN + 3, y - 23, { size: 8, bold: true });
  drawText("Consignee", MARGIN + 3, y - 35, { size: 8, bold: true });
  drawText("Address", MARGIN + 3, y - 50, { size: 8, bold: true });
  drawText("on packages", MARGIN + 3, y - 62, { size: 8, bold: true });

  drawText(shipperName, tCol2 + 5, y - 11, { size: 8, bold: true });
  const shipAddrLines = wrapByWidth(shipperAddress, font, 7.5, width - MARGIN - tCol2 - 10);
  shipAddrLines.forEach((line, i) => drawText(line, tCol2 + 5, y - 21 - i * 9, { size: 7.5 }));

  const consigneeY = y - 21 - shipAddrLines.length * 9 - 10;
  drawText(consigneeName, tCol2 + 5, consigneeY, { size: 8, bold: true });
  const consAddrLines = wrapByWidth(consigneeAddress, font, 7.5, width - MARGIN - tCol2 - 10);
  consAddrLines.forEach((line, i) => drawText(line, tCol2 + 5, consigneeY - 10 - i * 9, { size: 7.5 }));
  y -= addrBoxH;

  // Name & Address of Shipper / Signature block
  const sigBoxH = 90;
  page.drawRectangle({ x: MARGIN, y: y - sigBoxH, width: width - MARGIN * 2, height: sigBoxH, borderColor: rgb(0, 0, 0), borderWidth: 1 });
  page.drawLine({ start: { x: tCol2, y }, end: { x: tCol2, y: y - sigBoxH }, color: rgb(0, 0, 0) });
  page.drawLine({ start: { x: tCol2, y: y - 33 }, end: { x: width - MARGIN, y: y - 33 }, color: rgb(0, 0, 0), thickness: 0.7 });

  drawText("Name & Address of Shipper", MARGIN + 3, y - 11, { size: 8, bold: true });
  drawText(shipperName, MARGIN + 3, y - 24, { size: 8 });
  const addrWrap = wrapByWidth(shipperAddress, font, 7, tCol2 - MARGIN - 10);
  addrWrap.forEach((line, i) => drawText(line, MARGIN + 3, y - 34 - i * 9, { size: 7 }));

  drawText("FULL NAME", tCol2 + 5, y - 11, { size: 7.5, bold: true });
  drawText(fullName, tCol2 + 5, y - 22, { size: 9 });
  drawText("DESIGNATION", tCol2 + 5, y - 45, { size: 7.5, bold: true });
  drawText(designation, tCol2 + 5, y - 56, { size: 9 });
  drawTextCentered(page, "SIGNATURE & COMPANY STAMP", tCol2, width - MARGIN, y - 80, bold, 7.5, rgb(0, 0, 0));
  y -= sigBoxH + 15;

  // Footer notes
  const footerLines = [
    "To be completed in duplicate duly signed & stamped by shipper",
    "ONE COPY to be filed with the AWB copy at ORIGIN & ONE COPY to accompany DEST: AWB",
    "Attach Lab Analysis Report, Material Safety Data Sheet for Bulk-Drugs/ medicines/ Chemicals/ Cosmetics.",
    "pls certify that no hidden dangerous goods are stored or filled in any components or spare-parts.",
    "e.g. Plastic components /Transformer Spares / Elect & Electronic Appliances / for Plastic & Rubber (specify) PVC /etc",
    "Films ( non-nitro-cellulose base ) /",
  ];
  footerLines.forEach((line, i) => drawText(line, MARGIN, y - i * 10, { size: 6.5 }));
  y -= footerLines.length * 10 + 6;
  drawText("Please note that MSDS is available at www.msdssearch.com", MARGIN, y, { size: 9, bold: true });

  // Footer GST/CIN + page numbers on every page
  const pages = doc.getPages();
  const totalPages = pages.length;
  pages.forEach((p, idx) => {
    const label = `${GST_NUMBER}   |   Page ${idx + 1} of ${totalPages}`;
    drawTextRight(p, label, width - MARGIN, 20, font, 8, BLUE);
  });

  return await doc.save();
}