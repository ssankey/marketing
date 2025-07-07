
//https://marketing.densitypharmachem.com/api/energy/getAccessToken.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      code: 500,
      message: 'Only POST method allowed',
      data: null,
    });
  }

  const username = 'product-label'; // Replace with actual username if different
  const password = '12Qw3er!@#'; // Replace with actual password if different

  try {
    const response = await fetch('YOUR_ACCESS_TOKEN_ENDPOINT_URL', { // Replace with actual endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ username, password }).toString(),
    });

    const result = await response.json();

    // Verify the response structure matches documentation
    if (result.code !== 200 || !result.data) {
      return res.status(500).json({
        code: 500,
        message: result.message || 'Failed to obtain token',
        data: null,
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Token fetch error:', error);
    return res.status(500).json({
      code: 500,
      message: 'Failed to fetch token',
      data: null,
    });
  }
}