// pages/api/invoices/check-coa-availability.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { itemCode, vendorBatchNum } = req.body;

  if (!itemCode || !vendorBatchNum) {
    return res.status(400).json({ error: 'ItemCode and VendorBatchNum are required' });
  }

  try {
    // Extract the base code (part before '-' if exists)
    const baseCode = itemCode.includes('-') ? itemCode.split('-')[0] : itemCode;
    const batch = vendorBatchNum.trim();
    
    if (!baseCode || !batch) {
      return res.status(200).json({ 
        available: false, 
        message: 'Invalid item code or batch number'
      });
    }

    // Construct COA URL
    const coaUrl = `https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/${baseCode}_${batch}.pdf`;
    
    try {
      // Check if COA exists by making a HEAD request
      const response = await fetch(coaUrl, { method: 'HEAD' });
      
      if (response.ok) {
        return res.status(200).json({ 
          available: true, 
          downloadUrl: coaUrl,
          fileName: `${baseCode}_${batch}.pdf`
        });
      } else {
        return res.status(200).json({ 
          available: false, 
          message: 'COA not found at the expected location'
        });
      }
    } catch (fetchError) {
      return res.status(200).json({ 
        available: false, 
        message: 'Unable to verify COA availability'
      });
    }
  } catch (error) {
    console.error('Error checking COA availability:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}