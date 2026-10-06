// pages/api/bluedart/cancel-waybill.js
// Cancels a Blue Dart waybill — no SAP update

import { verify } from "jsonwebtoken";
import { getBlueDartToken, getBlueDartBaseUrl, getBlueDartProfile } from "./jwt";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  try { verify(authHeader.split(" ")[1], process.env.JWT_SECRET); }
  catch { return res.status(401).json({ error: "Invalid token" }); }

  const { awbNo } = req.body;

  if (!awbNo) return res.status(400).json({ error: "AWB number is required" });

  try {
    const jwtToken = await getBlueDartToken();
    const baseUrl  = getBlueDartBaseUrl();

    const bdRes = await fetch(
      `${baseUrl}/in/transportation/waybill/v1/CancelWaybill`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", JWTToken: jwtToken },
        body: JSON.stringify({
          Request: { AWBNo: String(awbNo) },
          Profile: getBlueDartProfile(),
        }),
      }
    );

    const bdData = await bdRes.json();

    // Handle error-response format
    if (bdData?.["error-response"]) {
      const errResult = bdData["error-response"][0];
      return res.status(400).json({
        error:  errResult?.Status?.[0]?.StatusInformation || "Cancellation failed",
        status: errResult?.Status,
      });
    }

    const result = bdData?.CancelWaybillResult;

    if (!result) {
      return res.status(502).json({ error: "Invalid response from Blue Dart", raw: bdData });
    }

    if (result.IsError) {
      return res.status(400).json({
        error:  result.Status?.[0]?.StatusInformation || "Cancellation failed",
        status: result.Status,
      });
    }

    return res.status(200).json({
      success:           true,
      AWBNo:             result.AWBNo,
      StatusCode:        result.Status?.[0]?.StatusCode,
      StatusInformation: result.Status?.[0]?.StatusInformation,
    });

  } catch (err) {
    console.error("Cancel waybill error:", err);
    return res.status(500).json({ error: err.message });
  }
}