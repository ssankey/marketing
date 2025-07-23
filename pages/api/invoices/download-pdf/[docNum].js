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
    // Configuration
    // const sharePath = process.env.SHARE_BASE_PATH || '\\\\172.50.10.9\\SAP-Attachments';
    // const signedPath = path.join(sharePath, 'Digital Signature New', 'Signed', docNum);

    const basePath = process.env.INVOICE_PDF_NETWORK_PATH;
const signedPath = path.join(basePath, docNum);

    console.log(`Attempting to access: ${signedPath}`);

    // Check if directory exists
    try {
      await readdir(signedPath);
    } catch (err) {
      console.error('Directory access error:', err);
      return res.status(404).json({ 
        message: 'Invoice folder not found',
        path: signedPath,
        error: err.message 
      });
    }

    // Find the PDF file (flexible naming)
    const files = await readdir(signedPath);
    const pdfFile = files.find(file => 
      file.toLowerCase().includes(`invoice_${docNum.toLowerCase()}`) && 
      file.toLowerCase().endsWith('.pdf')
    );

    if (!pdfFile) {
      return res.status(404).json({ 
        message: 'PDF file not found in folder',
        availableFiles: files 
      });
    }

    // Read and send the file
    const filePath = path.join(signedPath, pdfFile);
    const fileData = await readFile(filePath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice_${docNum}(Signed).pdf"`);
    return res.send(fileData);

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}

export const config = {
  api: {
    responseLimit: '50mb',
    externalResolver: true
  }
}