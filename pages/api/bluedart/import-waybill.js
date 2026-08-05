// pages/api/bluedart/import-waybill.js
// Generates multiple waybills in one call (Blue Dart ImportData API)
// Accepts array of shipment objects from frontend

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

  // shipments = array of { docEntry, docNum, consignee, services, shipper }
  const { shipments } = req.body;

  if (!shipments || !Array.isArray(shipments) || shipments.length === 0) {
    return res.status(400).json({ error: "shipments array is required" });
  }

  const shipperCustomerCode = process.env.BLUEDART_CUSTOMER_CODE;
  const shipperOriginArea   = process.env.BLUEDART_ORIGIN_AREA;
  const shipperName         = process.env.BLUEDART_CUSTOMER_NAME;
  const shipperPincode      = process.env.BLUEDART_CUSTOMER_PINCODE;
  const shipperAddress      = process.env.BLUEDART_CUSTOMER_ADDRESS || "Warehouse Address";
  const shipperMobile       = process.env.BLUEDART_CUSTOMER_MOBILE || "";

  // Build Blue Dart request array
  const requestArray = shipments.map((s) => ({
    Consignee: {
      ConsigneeName:     s.consigneeName,
      ConsigneeAddress1: s.consigneeAddress1,
      ConsigneeAddress2: s.consigneeAddress2 || "",
      ConsigneePincode:  String(s.consigneePincode),
      ConsigneeMobile:   String(s.consigneeMobile),
      ConsigneeEmailID:  s.consigneeEmail || "",
    },
    Services: {
      ProductCode:          s.productCode,
      ProductType:          Number(s.productType),
      PieceCount:           String(s.pieceCount),
      ActualWeight:         String(s.actualWeight),
      DeclaredValue:        Number(s.declaredValue),
      CreditReferenceNo:    String(s.docNum).substring(0, 20),
      PickupDate:           `/Date(${new Date(s.pickupDate).getTime()})/`,
      PickupTime:           String(s.pickupTime || "1000"),
      SubProductCode:       s.subProductCode || "P",
      RegisterPickup:       false,
      PDFOutputNotRequired: true,
      Commodity:            { CommodityDetail1: s.commodityDetail1 || "GOODS" },
      Dimensions:           s.dimLength ? [{
        Length: Number(s.dimLength),
        Breadth: Number(s.dimBreadth),
        Height: Number(s.dimHeight),
        Count: Number(s.pieceCount),
      }] : [],
      itemdtl: [],
    },
    Shipper: {
      CustomerCode:     shipperCustomerCode,
      OriginArea:       shipperOriginArea,
      CustomerName:     shipperName,
      CustomerAddress1: shipperAddress,
      CustomerPincode:  shipperPincode,
      CustomerMobile:   shipperMobile,
      IsToPayCustomer:  false,
      Sender:           shipperName.substring(0, 20),
    },
    Returnadds: {
      ReturnAddress1: shipperAddress,
      ReturnPincode:  shipperPincode,
      ReturnContact:  shipperName.substring(0, 20),
      ReturnMobile:   shipperMobile,
    },
  }));

  try {
    const jwtToken = await getBlueDartToken();
    const baseUrl  = getBlueDartBaseUrl();

    const bdRes = await fetch(
      `${baseUrl}/in/transportation/waybill/v1/ImportData`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          JWTToken: jwtToken,
        },
        body: JSON.stringify({
          Request: requestArray,
          Profile: getBlueDartProfile(),
        }),
      }
    );

    const bdData = await bdRes.json();

    // ImportData returns array of results
    const results = Array.isArray(bdData) ? bdData : [bdData];

    // Update SAP for each successful waybill
    const updatePromises = results.map(async (result, index) => {
      const waybillResult = result?.GenerateWayBillResult;
      if (!waybillResult || waybillResult.IsError) return { index, success: false, error: waybillResult?.Status?.[0]?.StatusInformation };

      const awbNo = waybillResult.AWBNo;
      const shipment = shipments[index];
      if (awbNo && shipment?.docEntry) {
        const airlineName = shipment.productCode === "A" ? "BY AIR" : "BY ROAD";
        await queryDatabase(
          `UPDATE OINV SET TrackNo = @trackNo, U_AirlineName = @airline WHERE DocEntry = @docEntry`,
          [
            { name: "trackNo",  type: sql.VarChar, value: awbNo },
            { name: "airline",  type: sql.VarChar, value: airlineName },
            { name: "docEntry", type: sql.Int,     value: Number(shipment.docEntry) },
          ]
        );
      }
      return { index, success: true, AWBNo: awbNo, docNum: shipment.docNum };
    });

    const updateResults = await Promise.all(updatePromises);
    const successful = updateResults.filter((r) => r.success).length;
    const failed     = updateResults.filter((r) => !r.success).length;

    return res.status(200).json({
      success: true,
      summary: { total: shipments.length, successful, failed },
      results: updateResults,
    });
  } catch (err) {
    console.error("Import waybill error:", err);
    return res.status(500).json({ error: err.message });
  }
}