// https://marketing.densitypharmachem.com/api/energy/getAccessToken

// File: pages/api/energy/getAccessToken.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      code: 500,
      message: 'Only POST method allowed',
      data: null,
    });
  }

  const username = 'prakash_434';
  const password = '1y2a3d4a5v.@Q';

  try {
    const response = await fetch('https://external-api.example.com/getAccessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ username, password }).toString(),
    });

    const result = await response.json();

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
