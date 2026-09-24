

// pages/api/coa/download/[coaFilename].js
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { execFile } from 'child_process';

const readFile = promisify(fs.readFile);
const execFilePromise = promisify(execFile);

export default async function handler(req, res) {
  const { coaFilename } = req.query;

  console.log('COA Download Request:', {
    method: req.method,
    coaFilename: coaFilename,
    query: req.query,
    headers: req.headers
  });

  // Validate request — also accept HEAD, used by the client to check COA
  // availability before showing the download button, without transferring the file.
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const isHead = req.method === 'HEAD';

  if (!coaFilename) {
    console.error('No COA filename provided');
    return res.status(400).json({ message: 'COA filename is required' });
  }

  try {
    // Configuration - use environment variable or default path
    const basePath = process.env.COA_BASE_PATH || '\\\\172.50.10.9\\SAP-Attachments\\Attachment';
    
    // Improved filename sanitization
    let safeFilename = decodeURIComponent(coaFilename);
    
    // Log the original and decoded filename
    console.log('Original filename:', coaFilename);
    console.log('Decoded filename:', safeFilename);
    
    // More comprehensive sanitization
    safeFilename = safeFilename
      .replace(/\.\.\//g, '') // Prevent directory traversal
      .replace(/\\/g, '') // Remove backslashes
      .replace(/[<>:"|?*]/g, '') // Remove invalid Windows filename characters
      .trim();
    
    console.log('Sanitized filename:', safeFilename);

    // Verify it's a PDF file early
    if (!safeFilename.toLowerCase().endsWith('.pdf')) {
      console.error('Not a PDF file:', safeFilename);
      return res.status(400).json({ 
        message: 'Requested file is not a PDF',
        filename: safeFilename
      });
    }

    let filePath;
    let fileData;

    // Check if we're on Windows or Linux/Unix
    const isWindows = process.platform === 'win32';
    console.log('Platform:', process.platform, 'isWindows:', isWindows);
    
    if (isWindows) {
      // Windows environment - use UNC path directly
      filePath = path.join(basePath, safeFilename);
      console.log(`Windows: Attempting to access COA file: ${filePath}`);
      
      try {
        // Check if file exists first
        const stats = await fs.promises.stat(filePath);
        console.log('File stats:', {
          size: stats.size,
          isFile: stats.isFile(),
          modified: stats.mtime
        });
        
        if (!stats.isFile()) {
          throw new Error('Path exists but is not a file');
        }
        
        // Check read permissions
        await fs.promises.access(filePath, fs.constants.R_OK);

        if (isHead) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Length', stats.size);
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD');
          return res.status(200).end();
        }

        fileData = await readFile(filePath);
        console.log('Successfully read file, size:', fileData.length);

      } catch (err) {
        console.error('Windows file access error:', {
          code: err.code,
          message: err.message,
          path: filePath
        });

        return res.status(404).json({
          message: 'This COA file is not available. Please contact customerservice@densitypharmachem.com for assistance.',
        });
      }
    } else {
      // Unix/Linux environment - try mounted path first, then smbclient
      const mountedPath = basePath.replace('\\\\', '/mnt/').replace(/\\/g, '/');
      filePath = path.join(mountedPath, safeFilename);
      
      console.log(`Unix: Attempting to access COA file: ${filePath}`);
      
      try {
        // First try mounted path
        const stats = await fs.promises.stat(filePath);
        console.log('Mounted path file stats:', {
          size: stats.size,
          isFile: stats.isFile(),
          modified: stats.mtime
        });
        
        await fs.promises.access(filePath, fs.constants.R_OK);

        if (isHead) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Length', stats.size);
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD');
          return res.status(200).end();
        }

        fileData = await readFile(filePath);
        console.log('Successfully read from mounted path, size:', fileData.length);

      } catch (err) {
        console.log('Mounted path failed:', err.message);

        if (isHead) {
          // Don't fall through to the smbclient download just to answer a HEAD
          // existence check — the mounted-path miss is enough to say "not found".
          return res.status(404).json({ message: 'COA file not found or not accessible' });
        }

        console.log('Trying smbclient approach');

        // Fallback to smbclient if available
        try {
          // Credentials come from the environment only — no hardcoded defaults.
          const username = process.env.NETWORK_USERNAME;
          const password = process.env.NETWORK_PASSWORD;
          if (!username || !password) {
            throw new Error('NETWORK_USERNAME / NETWORK_PASSWORD are not configured');
          }

          // safeFilename comes from the URL, so it's attacker-controlled. It ends up
          // inside smbclient's own -c command string, where ';' starts a new smbclient
          // command (including "!" shell escapes) — reject those characters outright.
          if (/[;$`"!\r\n]/.test(safeFilename)) {
            throw new Error('Filename contains characters not allowed for the SMB fallback');
          }

          const tempFilePath = `/tmp/coa_${Date.now()}_${path.basename(safeFilename)}`;

          console.log('Executing smbclient (credentials hidden)');

          // execFile passes arguments directly with no shell in between, so neither the
          // filename nor the password can be interpreted as shell syntax.
          const { stdout, stderr } = await execFilePromise('smbclient', [
            '//172.50.10.9/SAP-Attachments',
            '-U', `${username}%${password}`,
            '-c', `cd Attachment; get "${safeFilename}" "${tempFilePath}"`,
          ]);
          console.log('SMB stdout:', stdout);
          console.log('SMB stderr:', stderr);
          
          // Check if temp file was created
          const tempStats = await fs.promises.stat(tempFilePath);
          console.log('Temp file stats:', {
            size: tempStats.size,
            isFile: tempStats.isFile()
          });
          
          fileData = await readFile(tempFilePath);
          
          // Clean up temp file
          fs.unlinkSync(tempFilePath);
          
          console.log('Successfully read via smbclient, size:', fileData.length);
          
        } catch (smbErr) {
          console.error('SMB access error:', {
            mountedPathError: err.message,
            smbError: smbErr.message,
            code: smbErr.code
          });

          return res.status(404).json({
            message: 'This COA file is not available. Please contact customerservice@densitypharmachem.com for assistance.',
          });
        }
      }
    }

    // Validate file data
    if (!fileData || fileData.length === 0) {
      console.error('File data is empty or null');
      return res.status(500).json({
        message: 'File data is empty or corrupted',
        filename: safeFilename
      });
    }

    // Check if it's actually a PDF by looking at the file header
    const pdfHeader = fileData.slice(0, 4).toString();
    if (pdfHeader !== '%PDF') {
      console.error('File does not appear to be a valid PDF, header:', pdfHeader);
      return res.status(400).json({
        message: 'File does not appear to be a valid PDF',
        filename: safeFilename,
        header: pdfHeader
      });
    }

    console.log('Setting response headers for PDF download');

    // Set headers to force download in browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);
    res.setHeader('Content-Length', fileData.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD');

    console.log('Sending PDF file, size:', fileData.length);
    return res.send(fileData);

  } catch (error) {
    console.error('Server error:', {
      message: error.message,
      stack: error.stack,
      platform: process.platform
    });

    return res.status(500).json({
      message: 'Something went wrong while retrieving this COA. Please contact customerservice@densitypharmachem.com for assistance.',
    });
  }
}

export const config = {
  api: {
    responseLimit: '50mb',
    externalResolver: true
  }
}