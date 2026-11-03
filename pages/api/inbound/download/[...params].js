// pages/api/inbound/download/[...params].js
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const access = promisify(fs.access);

export default async function handler(req, res) {
  const { params } = req.query; // [...params] gives us an array

  // Validate request
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!params || params.length < 2) {
    return res.status(400).json({ 
      message: 'Invalid parameters. Expected: /api/inbound/download/[boeNo]/[filename]' 
    });
  }

  const [boeNo, ...filenameParts] = params;
  const filename = filenameParts.join('/'); // In case filename has slashes

  if (!boeNo || !filename) {
    return res.status(400).json({ message: 'BOE number and filename are required' });
  }

  try {
    const basePath = process.env.IMPORT_EXPORT_NETWORK_PATH; // \\172.50.10.9\SAP-Attachments\Import-Export-Documentation
    const folderPath = path.join(basePath, boeNo);
    const filePath = path.join(folderPath, filename);

    console.log(`Attempting to download file: ${filePath}`);

    // Check if file exists
    try {
      await access(filePath);
    } catch (err) {
      console.error('File access error:', err);
      return res.status(404).json({ 
        message: 'File not found',
        path: filePath,
        error: err.message 
      });
    }

    // Read the file
    const fileData = await readFile(filePath);

    // Set appropriate headers based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream'; // default
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.doc':
        contentType = 'application/msword';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case '.xls':
        contentType = 'application/vnd.ms-excel';
        break;
      case '.xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      default:
        contentType = 'application/octet-stream';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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