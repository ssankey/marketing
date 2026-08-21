// pages/api/invoices/check-pdf-availability.js
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { docNum } = req.body;

  if (!docNum) {
    return res.status(400).json({ error: 'DocNum is required' });
  }

  try {
    const basePath = process.env.INVOICE_PDF_NETWORK_PATH;
    const signedPath = path.join(basePath, docNum.toString());

    // Check if directory exists
    try {
      const files = await readdir(signedPath);
      
      // Find the PDF file (flexible naming)
      const pdfFile = files.find(file => 
        file.toLowerCase().includes(`invoice_${docNum.toString().toLowerCase()}`) && 
        file.toLowerCase().endsWith('.pdf')
      );

      if (pdfFile) {
        return res.status(200).json({ 
          available: true, 
          filename: pdfFile,
          downloadUrl: `/api/invoices/download-pdf/${docNum}`
        });
      } else {
        return res.status(200).json({ 
          available: false, 
          message: 'PDF file not found in folder'
        });
      }
    } catch (err) {
      return res.status(200).json({ 
        available: false, 
        message: 'Invoice folder not found'
      });
    }
  } catch (error) {
    console.error('Error checking PDF availability:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      available: false 
    });
  }
}