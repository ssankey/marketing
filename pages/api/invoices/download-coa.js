// // pages/api/invoices/download-coa.js
// export default async function handler(req, res) {
//   const { url, filename } = req.query;

//   // Validate request
//   if (req.method !== 'GET') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   if (!url) {
//     return res.status(400).json({ message: 'URL parameter is required' });
//   }

//   try {
//     // Fetch the file from the external URL
//     const response = await fetch(decodeURIComponent(url));
    
//     if (!response.ok) {
//       return res.status(404).json({ message: 'COA file not found' });
//     }

//     // Get the file data
//     const fileData = await response.arrayBuffer();
//     const buffer = Buffer.from(fileData);

//     // Set headers for forced download
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Length', buffer.length);
//     res.setHeader('Content-Disposition', `attachment; filename="${filename || 'COA.pdf'}"`);
    
//     // Additional headers to prevent caching and ensure proper handling
//     res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
//     res.setHeader('Pragma', 'no-cache');
//     res.setHeader('Expires', '0');
    
//     return res.send(buffer);

//   } catch (error) {
//     console.error('COA download error:', error);
//     return res.status(500).json({ 
//       message: 'Error downloading COA',
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


// pages/api/invoices/download-coa.js
export default async function handler(req, res) {
  const { url, filename } = req.query;

  // Validate request method
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Validate required parameters
  if (!url) {
    return res.status(400).json({ message: 'URL parameter is required' });
  }

  try {
    console.log('🔄 Fetching COA from:', decodeURIComponent(url));

    // Fetch the PDF file from the external URL (Aliyun OSS)
    const response = await fetch(decodeURIComponent(url));
    
    if (!response.ok) {
      console.error('❌ COA fetch failed:', response.status, response.statusText);
      return res.status(404).json({ 
        message: 'COA file not found',
        status: response.status 
      });
    }

    // Get the file data as buffer
    const fileData = await response.arrayBuffer();
    const buffer = Buffer.from(fileData);

    console.log('✅ COA fetched successfully, size:', buffer.length, 'bytes');

    // Extract filename from URL if not provided
    let downloadFilename = filename;
    if (!downloadFilename) {
      const urlPath = decodeURIComponent(url);
      const urlParts = urlPath.split('/');
      downloadFilename = urlParts[urlParts.length - 1] || 'COA.pdf';
    }

    // Ensure filename has .pdf extension
    if (!downloadFilename.toLowerCase().endsWith('.pdf')) {
      downloadFilename += '.pdf';
    }

    // Set headers to force download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    
    // Additional headers to prevent caching and ensure proper download behavior
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    console.log('📤 Sending COA download:', downloadFilename);

    // Send the file buffer
    return res.send(buffer);

  } catch (error) {
    console.error('💥 COA download error:', error);
    return res.status(500).json({
      message: 'Error downloading COA',
      error: error.message
    });
  }
}

// Configure API to handle larger files and external requests
export const config = {
  api: {
    responseLimit: '50mb',
    externalResolver: true
  }
}