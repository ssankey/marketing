

// // // pages/api/coa/download/[coaFilename].js
// // import fs from 'fs';
// // import path from 'path';
// // import { promisify } from 'util';

// // const readFile = promisify(fs.readFile);
// // const stat = promisify(fs.stat);

// // export default async function handler(req, res) {
// //   const { coaFilename } = req.query;

// //   // Validate request
// //   if (req.method !== 'GET') {
// //     res.setHeader('Allow', ['GET']);
// //     return res.status(405).json({ message: 'Method not allowed' });
// //   }

// //   if (!coaFilename) {
// //     return res.status(400).json({ message: 'COA filename is required' });
// //   }

// //   try {
// //     // Configuration - use environment variable or default path
// //     const basePath = process.env.COA_BASE_PATH || '\\\\172.50.10.9\\SAP-Attachments\\Attachment';
    
// //     // Sanitize filename to prevent directory traversal
// //     const safeFilename = decodeURIComponent(coaFilename)
// //       .replace(/\.\.\//g, '') // Remove parent directory references
// //       .replace(/\\/g, ''); // Remove backslashes
    
// //     const filePath = path.join(basePath, safeFilename);

// //     console.log(`Attempting to access COA file: ${filePath}`);

// //     // Verify file exists and is accessible
// //     try {
// //       const fileStats = await stat(filePath);
// //       if (!fileStats.isFile()) {
// //         throw new Error('Path is not a file');
// //       }
// //     } catch (err) {
// //       console.error('File access error:', err);
// //       return res.status(404).json({ 
// //         message: 'COA file not found',
// //         path: filePath,
// //         error: err.message 
// //       });
// //     }

// //     // Verify it's a PDF file
// //     if (!filePath.toLowerCase().endsWith('.pdf')) {
// //       return res.status(400).json({ 
// //         message: 'Requested file is not a PDF',
// //         path: filePath
// //       });
// //     }

// //     // Read the file
// //     const fileData = await readFile(filePath);

// //     // Set headers to force download in browser
// //     res.setHeader('Content-Type', 'application/pdf');
// //     res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
// //     res.setHeader('Content-Length', fileData.length);
// //     res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
// //     res.setHeader('Pragma', 'no-cache');
// //     res.setHeader('Expires', '0');

// //     // Send the file
// //     return res.send(fileData);

// //   } catch (error) {
// //     console.error('Server error:', error);
// //     return res.status(500).json({ 
// //       message: 'Internal server error',
// //       error: error.message 
// //     });
// //   }
// // }

// // export const config = {
// //   api: {
// //     responseLimit: '50mb',
// //     bodyParser: false, // Disable body parsing for file downloads
// //   }
// // }

// // pages/api/coa/download/[coaFilename].js
// import fs from 'fs';
// import path from 'path';
// import { promisify } from 'util';

// const readdir = promisify(fs.readdir);
// const readFile = promisify(fs.readFile);

// export default async function handler(req, res) {
//   const { coaFilename } = req.query;

//   // Validate request
//   if (req.method !== 'GET') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   if (!coaFilename) {
//     return res.status(400).json({ message: 'COA filename is required' });
//   }

//   try {
//     // Configuration - use environment variable or default path
//     const basePath = process.env.COA_BASE_PATH || '\\\\172.50.10.9\\SAP-Attachments\\Attachment';
    
//     // Sanitize filename (similar to PDF endpoint but for COA files)
//     const safeFilename = decodeURIComponent(coaFilename)
//       .replace(/\.\.\//g, '') // Prevent directory traversal
//       .replace(/\\/g, ''); // Remove backslashes
    
//     const filePath = path.join(basePath, safeFilename);

//     console.log(`Attempting to access COA file: ${filePath}`);

//     // Verify file exists (direct file check instead of directory listing)
//     try {
//       await fs.promises.access(filePath, fs.constants.R_OK);
//     } catch (err) {
//       console.error('File access error:', err);
//       return res.status(404).json({ 
//         message: 'COA file not found',
//         path: filePath,
//         error: err.message 
//       });
//     }

//     // Verify it's a PDF file (same as PDF endpoint)
//     if (!filePath.toLowerCase().endsWith('.pdf')) {
//       return res.status(400).json({ 
//         message: 'Requested file is not a PDF',
//         path: filePath
//       });
//     }

//     // Read and send the file (same reliable approach)
//     const fileData = await readFile(filePath);

//     // Set headers to force download in browser
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
//     res.setHeader('Content-Length', fileData.length);
//     res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
//     res.setHeader('Pragma', 'no-cache');
//     res.setHeader('Expires', '0');

//     return res.send(fileData);

//   } catch (error) {
//     console.error('Server error:', error);
//     return res.status(500).json({ 
//       message: 'Internal server error',
//       error: error.message 
//     });
//   }
// }

// export const config = {
//   api: {
//     responseLimit: '50mb',
//     externalResolver: true
//   }
// }

// pages/api/coa/download/[coaFilename].js
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const readFile = promisify(fs.readFile);
const execPromise = promisify(exec);

export default async function handler(req, res) {
  const { coaFilename } = req.query;

  // Validate request
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!coaFilename) {
    return res.status(400).json({ message: 'COA filename is required' });
  }

  try {
    // Configuration - use environment variable or default path
    const basePath = process.env.COA_BASE_PATH || '\\\\172.50.10.9\\SAP-Attachments\\Attachment';
    
    // Sanitize filename
    const safeFilename = decodeURIComponent(coaFilename)
      .replace(/\.\.\//g, '') // Prevent directory traversal
      .replace(/\\/g, ''); // Remove backslashes
    
    let filePath;
    let fileData;

    // Check if we're on Windows or Linux/Unix
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      // Windows environment - use UNC path directly
      filePath = path.join(basePath, safeFilename);
      console.log(`Windows: Attempting to access COA file: ${filePath}`);
      
      try {
        await fs.promises.access(filePath, fs.constants.R_OK);
        fileData = await readFile(filePath);
      } catch (err) {
        console.error('Windows file access error:', err);
        return res.status(404).json({ 
          message: 'COA file not found',
          path: filePath,
          error: err.message 
        });
      }
    } else {
      // Unix/Linux environment - try mounted path first, then smbclient
      const mountedPath = basePath.replace('\\\\', '/mnt/').replace(/\\/g, '/');
      filePath = path.join(mountedPath, safeFilename);
      
      console.log(`Unix: Attempting to access COA file: ${filePath}`);
      
      try {
        // First try mounted path
        await fs.promises.access(filePath, fs.constants.R_OK);
        fileData = await readFile(filePath);
        console.log('Successfully read from mounted path');
      } catch (err) {
        console.log('Mounted path failed, trying smbclient approach');
        
        // Fallback to smbclient if available
        try {
          const networkPath = `//172.50.10.9/SAP-Attachments/Attachment/${safeFilename}`;
          const username = process.env.NETWORK_USERNAME || 'Densitypharma\\prakash';
          const password = process.env.NETWORK_PASSWORD || '1y2a3d4a5v.@Q';
          
          // Use smbclient to download the file
          const tempFilePath = `/tmp/coa_${Date.now()}_${safeFilename}`;
          const smbCommand = `smbclient "${networkPath}" -U "${username}%${password}" -c "get ${safeFilename} ${tempFilePath}"`;
          
          await execPromise(smbCommand);
          fileData = await readFile(tempFilePath);
          
          // Clean up temp file
          fs.unlinkSync(tempFilePath);
          
          console.log('Successfully read via smbclient');
        } catch (smbErr) {
          console.error('SMB access error:', smbErr);
          return res.status(404).json({ 
            message: 'COA file not found via any method',
            paths: [filePath, networkPath],
            errors: [err.message, smbErr.message]
          });
        }
      }
    }

    // Verify it's a PDF file
    if (!safeFilename.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ 
        message: 'Requested file is not a PDF',
        filename: safeFilename
      });
    }

    // Set headers to force download in browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Length', fileData.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.send(fileData);

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      platform: process.platform
    });
  }
}

export const config = {
  api: {
    responseLimit: '50mb',
    externalResolver: true
  }
}