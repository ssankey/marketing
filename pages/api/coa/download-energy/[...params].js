// pages/api/coa/download-energy/[...params].js
// This handles Energy COA downloads by proxying the external URL

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { params } = req.query;
        
        if (!params || !Array.isArray(params)) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }

        // Reconstruct the Energy COA URL from parameters
        // Expected format: /api/coa/download-energy/ItemCode/BatchNumber
        const [itemCode, batchNumber] = params;
        
        if (!itemCode || !batchNumber) {
            return res.status(400).json({ error: 'Missing itemCode or batchNumber' });
        }

        // Construct the Energy COA URL
        const baseItemCode = itemCode.split('-')[0]; // Get the part before first dash
        const energyUrl = `https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/${baseItemCode}_${batchNumber}.pdf`;
        
        console.log(`Proxying Energy COA: ${energyUrl}`);

        // Fetch the PDF from Energy URL
        const response = await fetch(energyUrl);
        
        if (!response.ok) {
            if (response.status === 404) {
                return res.status(404).json({ error: 'COA not found' });
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Get the PDF content
        const pdfBuffer = await response.arrayBuffer();
        const pdfData = Buffer.from(pdfBuffer);

        // Generate filename
        const filename = `COA_${baseItemCode}_${batchNumber}.pdf`;

        // Set headers to force download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfData.length);
        res.setHeader('Cache-Control', 'no-cache');

        // Send the PDF data
        res.send(pdfData);

    } catch (error) {
        console.error('Energy COA download error:', error);
        
        if (error.name === 'FetchError' || error.message.includes('fetch')) {
            return res.status(502).json({ error: 'Unable to fetch COA from external source' });
        }
        
        return res.status(500).json({ error: 'Internal server error' });
    }
}