
// //pages/api/energy/getLabelInfo.js
// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     return res.status(405).json({
//       code: 500,
//       message: "Only POST method allowed",
//       data: null,
//     });
//   }

//   const { itemNumber } = req.body;

//   if (!itemNumber) {
//     return res.status(400).json({
//       code: 500,
//       message: "itemNumber is required",
//       data: null,
//     });
//   }

//   try {
//     // 1. First get the access token from our own API
//     const tokenResponse = await fetch(
//       'http://localhost:3000/api/energy/getAccessToken',
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         }
//       }
//     );

//     const tokenData = await tokenResponse.json();
    
//     // Verify token response
//     if (tokenData.code !== 200 || !tokenData.data) {
//       throw new Error(tokenData.message || "Failed to get access token");
//     }

//     const token = tokenData.data;

//     // 2. Now call the external label info API
//     const labelResponse = await fetch(
//       "https://testapi.energy-chemical.com/console/api/PlatformInterfaces/external/v1/getLabelInfo.json",
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded",
//         },
//         body: new URLSearchParams({
//           token: token,
//           jsonStr: JSON.stringify({ itemNumber }),
//         }).toString(),
//       }
//     );

//     const result = await labelResponse.json();

//     // Handle token expiration case (code 302)
//     if (result.code === 302) {
//       return res.status(401).json({
//         code: 500,
//         message: "Token expired, please try again",
//         data: null,
//       });
//     }

//     // Forward the API response directly
//     return res.status(result.code === 200 ? 200 : 500).json(result);
    
//   } catch (error) {
//     console.error("Label info fetch error:", error);
//     return res.status(500).json({
//       code: 500,
//       message: "Failed to fetch label info: " + error.message,
//       data: null,
//     });
//   }
// }

// pages/api/energy/getLabelInfo.js
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
    // Use environment variable for base URL
    const baseUrl = process.env.API_BASE_URL;
    
    if (!baseUrl) {
      throw new Error("API_BASE_URL environment variable is not set");
    }

    console.log("Using API base URL:", baseUrl);

    // 1. First get the access token from our own API
    const tokenResponse = await fetch(
      `${baseUrl}/api/energy/getAccessToken`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      }
    );

    // Check if token response is successful
    if (!tokenResponse.ok) {
      throw new Error(`Token API responded with status: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    
    // Verify token response
    if (tokenData.code !== 200 || !tokenData.data) {
      throw new Error(tokenData.message || "Failed to get access token");
    }

    const token = tokenData.data;

    // 2. Now call the external label info API
    const labelResponse = await fetch(
      "https://testapi.energy-chemical.com/console/api/PlatformInterfaces/external/v1/getLabelInfo.json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          token: token,
          jsonStr: JSON.stringify({ itemNumber }),
        }).toString(),
      }
    );

    const result = await labelResponse.json();

    // Handle token expiration case (code 302)
    if (result.code === 302) {
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