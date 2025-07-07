//https://marketing.densitypharmachem.com/api/energy/getLabelInfo
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      code: 500,
      message: "Only POST method allowed",
      data: null,
    });
  }

  const { itemNumber } = req.body;

  if (!itemNumber) {
    return res.status(400).json({
      code: 500,
      message: "itemNumber is required",
      data: null,
    });
  }

  try {
    // 1. First get the access token
    const tokenResponse = await fetch(
      'https://marketing.densitypharmachem.com/api/energy/getAccessToken',
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: 'product-label',
          password: '12Qw3er!@#'
        }).toString(),
      }
    );

    const tokenData = await tokenResponse.json();
    
    // Verify token response
    if (tokenData.code !== 200 || !tokenData.data) {
      throw new Error(tokenData.message || "Failed to get access token");
    }

    const token = tokenData.data; // Note: token is directly in data field

    // 2. Now call the label info API
    const labelResponse = await fetch(
      "YOUR_LABEL_INFO_ENDPOINT_URL", // Replace with actual endpoint
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          OnlineToken: token,
        },
        body: new URLSearchParams({
          jsonStr: JSON.stringify({ itemNumber }),
        }).toString(),
      }
    );

    const result = await labelResponse.json();

    // Handle token expiration case (code 302)
    if (result.code === 302) {
      // You might want to implement token refresh logic here
      return res.status(401).json({
        code: 500,
        message: "Token expired, please try again",
        data: null,
      });
    }

    // Forward the API response directly
    return res.status(result.code === 200 ? 200 : 500).json(result);
    
  } catch (error) {
    console.error("Label info fetch error:", error);
    return res.status(500).json({
      code: 500,
      message: "Failed to fetch label info: " + error.message,
      data: null,
    });
  }
}