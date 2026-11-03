// pages/api/invoices/download-pdf/[docNum].js
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

export default async function handler(req, res) {
  const { docNum } = req.query;

  // Validate request
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!docNum || isNaN(docNum)) {
    return res.status(400).json({ message: 'Invalid DocNum provided' });
  }

  try {
   

    const basePath = process.env.INVOICE_PDF_NETWORK_PATH;
const signedPath = path.join(basePath, docNum);

    // Internal path/server details are logged server-side only — this route
    // is linked directly from customer-facing dispatch emails, so its error
    // responses must never reveal internal network paths, IPs, filesystem
    // error text, or directory listings to the browser.
    console.log(`Attempting to access: ${signedPath}`);

    // Check if directory exists
    try {
      await readdir(signedPath);
    } catch (err) {
      console.error('Directory access error:', { docNum, signedPath, error: err.message });
      return res.status(404).json({
        message: 'This invoice PDF is not available yet. Please contact customerservice@densitypharmachem.com for assistance.',
      });
    }

    // Find the PDF file (flexible naming)
    const files = await readdir(signedPath);
    const pdfFile = files.find(file =>
      file.toLowerCase().includes(`invoice_${docNum.toLowerCase()}`) &&
      file.toLowerCase().endsWith('.pdf')
    );

    if (!pdfFile) {
      console.error('PDF file not found in folder:', { docNum, signedPath, fileCount: files.length });
      return res.status(404).json({
        message: 'This invoice PDF is not available yet. Please contact customerservice@densitypharmachem.com for assistance.',
      });
    }

    // Read and send the file
    const filePath = path.join(signedPath, pdfFile);
    const fileData = await readFile(filePath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice_${docNum}(Signed).pdf"`);
    return res.send(fileData);

  } catch (error) {
    console.error('Server error:', { docNum, error: error.message });
    return res.status(500).json({
      message: 'Something went wrong while retrieving this invoice PDF. Please contact customerservice@densitypharmachem.com for assistance.',
    });
  }
}

export const config = {
  api: {
    responseLimit: '50mb',
    externalResolver: true
  }
}