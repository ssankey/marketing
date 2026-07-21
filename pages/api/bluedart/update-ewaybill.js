// pages/api/bluedart/update-ewaybill.js
// Links a GST e-waybill number to a Blue Dart waybill

import { verify } from "jsonwebtoken";
import { getBlueDartToken, getBlueDartBaseUrl, getBlueDartProfile } from "./jwt";

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

  const {
    awbNo,
    eWaybillNumber,
    invoiceNumber,
    invoiceDate,
    eWaybillDate,
    sellerGSTNo,
    totalValue = "",
  } = req.body;

  if (!awbNo || !eWaybillNumber || !invoiceNumber || !invoiceDate || !eWaybillDate || !sellerGSTNo) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Convert dates to /Date(ms)/ format
  const toDateMs = (d) => `/Date(${new Date(d).getTime()})/`;

  try {
    const jwtToken = await getBlueDartToken();
    const baseUrl  = getBlueDartBaseUrl();

    const bdRes = await fetch(
      `${baseUrl}/in/transportation/waybill/v1/UpdateEwayBill`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          JWTToken: jwtToken,
        },
        body: JSON.stringify({
          ERequest: {
            Waybillnumber:  String(awbNo),
            eWaybillNumber: String(eWaybillNumber),
            InvoiceNumber:  String(invoiceNumber),
            InvoiceDate:    toDateMs(invoiceDate),
            eWaybillDate:   toDateMs(eWaybillDate),
            SellerGSTNo:    sellerGSTNo,
            totalValue:     String(totalValue),
            Currency:       "INR",
            refDocNumber:   String(invoiceNumber),
          },
          Profile: getBlueDartProfile(),
        }),
      }
    );

    const bdData = await bdRes.json();

    // Log for debugging
    console.log("Update ewaybill response:", JSON.stringify(bdData, null, 2));

    // Handle error-response format
    if (bdData?.["error-response"]) {
      const errResult = bdData["error-response"][0];
      return res.status(400).json({
        error:  errResult?.Status?.[0]?.StatusInformation || "Update e-waybill failed",
        status: errResult?.Status,
      });
    }

    const result = bdData?.UpdateEwayBillResult;

    if (!result) {
      return res.status(502).json({ error: "Invalid response from Blue Dart", raw: bdData });
    }

    if (result.IsError) {
      return res.status(400).json({
        error: result.Status?.[0]?.StatusInformation || "Update failed",
        status: result.Status,
      });
    }

    return res.status(200).json({
      success: true,
      StatusCode:        result.Status?.[0]?.StatusCode,
      StatusInformation: result.Status?.[0]?.StatusInformation,
    });
  } catch (err) {
    console.error("Update e-waybill error:", err);
    return res.status(500).json({ error: err.message });
  }
}