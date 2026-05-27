// pages/api/bluedart/cancel-waybill.js
// 1. Calls Blue Dart CancelWaybill API
// 2. On success → clears TrackNo and U_AirlineName in SAP OINV

import { verify } from "jsonwebtoken";
import { queryDatabase } from "../../../lib/db";
import { getBlueDartToken, getBlueDartBaseUrl, getBlueDartProfile } from "./jwt";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { awbNo, docEntry } = req.body;

  if (!awbNo) {
    return res.status(400).json({ error: "AWB number is required" });
  }

  try {
    const jwtToken = await getBlueDartToken();
    const baseUrl  = getBlueDartBaseUrl();

    // Step 1: Call Blue Dart cancel API
    const bdRes = await fetch(
      `${baseUrl}/in/transportation/waybill/v1/CancelWaybill`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          JWTToken: jwtToken,
        },
        body: JSON.stringify({
          Request: { AWBNo: String(awbNo) },
          Profile: getBlueDartProfile(),
        }),
      }
    );

    const bdData = await bdRes.json();
    const result = bdData?.CancelWaybillResult;

    if (!result) {
      return res.status(502).json({ error: "Invalid response from Blue Dart", raw: bdData });
    }

    if (result.IsError) {
      return res.status(400).json({
        error: result.Status?.[0]?.StatusInformation || "Cancellation failed",
        status: result.Status,
      });
    }

    // Step 2: Clear TrackNo in SAP if docEntry provided
    if (docEntry) {
      await queryDatabase(
        `UPDATE OINV SET TrackNo = NULL, U_AirlineName = NULL WHERE DocEntry = @docEntry`,
        [{ name: "docEntry", type: sql.Int, value: Number(docEntry) }]
      );
    } else {
      // Try to find by TrackNo and clear it
      await queryDatabase(
        `UPDATE OINV SET TrackNo = NULL, U_AirlineName = NULL WHERE TrackNo = @trackNo`,
        [{ name: "trackNo", type: sql.VarChar, value: String(awbNo) }]
      );
    }

    return res.status(200).json({
      success: true,
      AWBNo:             result.AWBNo,
      StatusCode:        result.Status?.[0]?.StatusCode,
      StatusInformation: result.Status?.[0]?.StatusInformation,
    });
  } catch (err) {
    console.error("Cancel waybill error:", err);
    return res.status(500).json({ error: err.message });
  }
}