// pages/api/bluedart/jwt.js
// Generates and caches a Blue Dart JWT token (valid 24 hours)

const tokenCache = {
  token: null,
  expiresAt: null,
};

function getBlueDartConfig() {
  const env = process.env.BLUEDART_ENV || "sandbox";
  if (env === "production") {
    return {
      baseUrl: process.env.BLUEDART_PROD_BASE_URL,
      clientId: process.env.BLUEDART_PROD_CLIENT_ID,
      clientSecret: process.env.BLUEDART_PROD_CLIENT_SECRET,
      loginId: process.env.BLUEDART_PROD_LOGIN_ID,
      licenceKey: process.env.BLUEDART_PROD_LICENCE_KEY,
    };
  }
  return {
    baseUrl: process.env.BLUEDART_SANDBOX_BASE_URL,
    clientId: process.env.BLUEDART_SANDBOX_CLIENT_ID,
    clientSecret: process.env.BLUEDART_SANDBOX_CLIENT_SECRET,
    loginId: process.env.BLUEDART_SANDBOX_LOGIN_ID,
    licenceKey: process.env.BLUEDART_SANDBOX_LICENCE_KEY,
  };
}

export function getBlueDartProfile() {
  const config = getBlueDartConfig();
  return {
    LoginID: config.loginId,
    LicenceKey: config.licenceKey,
    Api_type: "S",
  };
}

export async function getBlueDartToken() {
  // Return cached token if still valid (with 5 min buffer)
  if (
    tokenCache.token &&
    tokenCache.expiresAt &&
    Date.now() < tokenCache.expiresAt - 5 * 60 * 1000
  ) {
    return tokenCache.token;
  }

  const config = getBlueDartConfig();
  const res = await fetch(
    `${config.baseUrl}/in/transportation/token/v1/login`,
    {
      method: "GET",
      headers: {
        ClientID: config.clientId,
        clientSecret: config.clientSecret,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Blue Dart auth failed: ${res.status}`);
  }

  const data = await res.json();
  if (!data.JWTToken) {
    throw new Error("No JWTToken in Blue Dart response");
  }

  // Cache for 23 hours (token valid 24 hrs)
  tokenCache.token = data.JWTToken;
  tokenCache.expiresAt = Date.now() + 23 * 60 * 60 * 1000;

  return tokenCache.token;
}

export function getBlueDartBaseUrl() {
  return getBlueDartConfig().baseUrl;
}

// API route to expose token status (for debugging)
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const token = await getBlueDartToken();
    return res.status(200).json({
      success: true,
      tokenPreview: token.substring(0, 30) + "...",
      env: process.env.BLUEDART_ENV || "sandbox",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}