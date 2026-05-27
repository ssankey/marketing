// pages/api/bluedart/generate-waybill.js
// 1. Calls Blue Dart GenerateWayBill API
// 2. On success → updates OINV.TrackNo and OINV.U_AirlineName in SAP

import { verify } from "jsonwebtoken";
import { queryDatabase } from "../../../lib/db";
import { getBlueDartToken, getBlueDartBaseUrl, getBlueDartProfile } from "./jwt";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth check
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
    docEntry,        // SAP invoice DocEntry — to update TrackNo
    docNum,          // SAP invoice DocNum  — used as CreditReferenceNo
    // Consignee
    consigneeName,
    consigneeAddress1,
    consigneeAddress2 = "",
    consigneeAddress3 = "",
    consigneePincode,
    consigneeMobile,
    consigneeTelephone = "",
    consigneeEmail = "",
    consigneeGST = "",
    // Services
    productCode,     // A or E
    productType,     // 0=Docs, 1=NonDocs
    pieceCount,
    actualWeight,
    declaredValue,
    pickupDate,      // ISO date string e.g. "2026-05-27"
    pickupTime,      // HHMM e.g. "1000"
    subProductCode = "P",
    registerPickup = false,
    commodityDetail1 = "",
    specialInstruction = "",
    // Dimensions (optional)
    dimLength,
    dimBreadth,
    dimHeight,
  } = req.body;

  // Validate required fields
  if (
    !docEntry || !docNum || !consigneeName || !consigneeAddress1 ||
    !consigneePincode || !consigneeMobile || !productCode ||
    !pieceCount || !actualWeight || !declaredValue || !pickupDate
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Convert pickupDate to Blue Dart /Date(ms)/ format
  const pickupMs = new Date(pickupDate).getTime();
  const pickupDateFormatted = `/Date(${pickupMs})/`;

  // Build dimensions array
  const dimensions =
    dimLength && dimBreadth && dimHeight
      ? [{ Length: Number(dimLength), Breadth: Number(dimBreadth), Height: Number(dimHeight), Count: Number(pieceCount) }]
      : [];

  // Shipper fixed details from env
  const shipperCustomerCode = process.env.BLUEDART_CUSTOMER_CODE;
  const shipperOriginArea   = process.env.BLUEDART_ORIGIN_AREA;
  const shipperName         = process.env.BLUEDART_CUSTOMER_NAME;
  const shipperPincode      = process.env.BLUEDART_CUSTOMER_PINCODE;
  const shipperAddress      = process.env.BLUEDART_CUSTOMER_ADDRESS || "Warehouse Address";
  const shipperMobile       = process.env.BLUEDART_CUSTOMER_MOBILE || "";

  // CreditReferenceNo must be unique — use DocNum
  const creditRef = String(docNum).substring(0, 20);

  const requestBody = {
    Request: {
      Consignee: {
        ConsigneeName:      consigneeName,
        ConsigneeAddress1:  consigneeAddress1,
        ConsigneeAddress2:  consigneeAddress2,
        ConsigneeAddress3:  consigneeAddress3,
        ConsigneePincode:   String(consigneePincode),
        ConsigneeMobile:    String(consigneeMobile),
        ConsigneeTelephone: consigneeTelephone,
        ConsigneeEmailID:   consigneeEmail,
        ConsigneeGSTNumber: consigneeGST,
      },
      Services: {
        ProductCode:          productCode,
        ProductType:          Number(productType),
        PieceCount:           String(pieceCount),
        ActualWeight:         String(actualWeight),
        DeclaredValue:        Number(declaredValue),
        CreditReferenceNo:    creditRef,
        PickupDate:           pickupDateFormatted,
        PickupTime:           String(pickupTime),
        SubProductCode:       subProductCode,
        RegisterPickup:       registerPickup,
        PDFOutputNotRequired: true,
        SpecialInstruction:   specialInstruction,
        Commodity: {
          CommodityDetail1: commodityDetail1 || "GOODS",
        },
        Dimensions: dimensions,
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
    },
    Profile: getBlueDartProfile(),
  };

  try {
    // Step 1: Get JWT token
    const jwtToken = await getBlueDartToken();
    const baseUrl  = getBlueDartBaseUrl();

    // Step 2: Call Blue Dart API
    const bdRes = await fetch(
      `${baseUrl}/in/transportation/waybill/v1/GenerateWayBill`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          JWTToken: jwtToken,
        },
        body: JSON.stringify(requestBody),
      }
    );

    const bdData = await bdRes.json();
    const result = bdData?.GenerateWayBillResult;

    if (!result) {
      return res.status(502).json({ error: "Invalid response from Blue Dart", raw: bdData });
    }

    if (result.IsError) {
      return res.status(400).json({
        error: result.Status?.[0]?.StatusInformation || "Blue Dart returned error",
        status: result.Status,
      });
    }

    const awbNo = result.AWBNo;

    // Step 3: Update SAP OINV — set TrackNo and U_AirlineName
    const airlineName = productCode === "A" ? "BY AIR" : "BY ROAD";
    await queryDatabase(
      `UPDATE OINV SET TrackNo = @trackNo, U_AirlineName = @airline WHERE DocEntry = @docEntry`,
      [
        { name: "trackNo",  type: sql.VarChar, value: awbNo },
        { name: "airline",  type: sql.VarChar, value: airlineName },
        { name: "docEntry", type: sql.Int,     value: Number(docEntry) },
      ]
    );

    return res.status(200).json({
      success: true,
      AWBNo:               awbNo,
      DestinationArea:     result.DestinationArea,
      DestinationLocation: result.DestinationLocation,
      TokenNumber:         result.TokenNumber,
      StatusCode:          result.Status?.[0]?.StatusCode,
      StatusInformation:   result.Status?.[0]?.StatusInformation,
    });
  } catch (err) {
    console.error("Generate waybill error:", err);
    return res.status(500).json({ error: err.message });
  }
}