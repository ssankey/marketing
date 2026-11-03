// pages/api/bluedart/track-waybill.js
// Fetches tracking/scan details for a Blue Dart AWB number

import { verify } from "jsonwebtoken";
import { getBlueDartToken, getBlueDartBaseUrl, getBlueDartProfile } from "./jwt";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  try { verify(authHeader.split(" ")[1], process.env.JWT_SECRET); }
  catch { return res.status(401).json({ error: "Invalid token" }); }

  const { awbNo } = req.query;
  if (!awbNo) return res.status(400).json({ error: "AWB number is required" });

  try {
    const jwtToken = await getBlueDartToken();
    const baseUrl  = getBlueDartBaseUrl();
    const profile  = getBlueDartProfile();

    const params = new URLSearchParams({
      handler:  "tnt",
      loginid:  profile.LoginID,
      numbers:  awbNo,
    //   lickey:   profile.LicenceKey,
      scan:     "1",
      action:   "custawbquery",
      verno:    "1",
      awb:      "awb",
    });

    console.log("Tracking params:", params.toString());
    console.log("Using loginid:", profile.LoginID);
    console.log("Using lickey:", profile.LicenceKey);

    const bdRes = await fetch(
      `${baseUrl}/in/transportation/tracking/v1/shipment?${params}`,
      {
        method:  "GET",
        headers: { JWTToken: jwtToken },
      }
    );

    const text = await bdRes.text();
    console.log("Tracking response status:", bdRes.status);
    console.log("Tracking raw response:", text.substring(0, 500));

    if (!bdRes.ok) {
      return res.status(400).json({ error: "Tracking failed", raw: text });
    }

    // Parse XML response
    const getTag    = (xml, tag) => xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`, "s"))?.[1]?.trim() || "";
    const getAllTags = (xml, tag) => [...xml.matchAll(new RegExp(`<${tag}>(.*?)</${tag}>`, "gs"))].map(m => m[1].trim());

    const waybillNo    = getTag(text, "WaybillNo");
    const status       = getTag(text, "Status");
    const statusType   = getTag(text, "StatusType");
    const statusDate   = getTag(text, "StatusDate");
    const statusTime   = getTag(text, "StatusTime");
    const origin       = getTag(text, "Origin");
    const destination  = getTag(text, "Destination");
    const weight       = getTag(text, "Weight");
    const service      = getTag(text, "Service");
    const pickupDate   = getTag(text, "PickUpDate");
    const senderName   = getTag(text, "SenderName");
    const toAttention  = getTag(text, "ToAttention");
    const receivedBy   = getTag(text, "ReceivedBy");
    const expectedDel  = getTag(text, "ExpectedDeliveryDate");

    // Parse all scan details
    const scanBlocks = [...text.matchAll(/<ScanDetail>(.*?)<\/ScanDetail>/gs)].map(m => m[1]);
    const scans = scanBlocks.map(block => ({
      scan:             getTag(block, "Scan"),
      scanCode:         getTag(block, "ScanCode"),
      scanType:         getTag(block, "ScanType"),
      scanDate:         getTag(block, "ScanDate"),
      scanTime:         getTag(block, "ScanTime"),
      scannedLocation:  getTag(block, "ScannedLocation"),
    }));

    return res.status(200).json({
      waybillNo, status, statusType, statusDate, statusTime,
      origin, destination, weight, service, pickupDate,
      senderName, toAttention, receivedBy, expectedDel,
      scans,
    });

  } catch (err) {
    console.error("Track waybill error:", err);
    return res.status(500).json({ error: err.message });
  }
}