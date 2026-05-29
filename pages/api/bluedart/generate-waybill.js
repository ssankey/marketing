// // pages/api/bluedart/generate-waybill.js
// // 1. Builds Blue Dart request from form payload
// // 2. Calls Blue Dart GenerateWayBill API
// // 3. On success → updates OINV.TrackNo + U_AirlineName in SAP

// import { verify }   from "jsonwebtoken";
// // import sql          from "mssql";             // uncomment when SAP update is re-enabled
// // import { queryDatabase } from "../../../lib/db"; // uncomment when SAP update is re-enabled
// import { getBlueDartToken, getBlueDartBaseUrl, getBlueDartProfile } from "./jwt";

// export default async function handler(req, res) {
//   if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

//   // ── Auth ────────────────────────────────────────────────────────────────
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith("Bearer "))
//     return res.status(401).json({ error: "Unauthorized" });
//   try { verify(authHeader.split(" ")[1], process.env.JWT_SECRET); }
//   catch { return res.status(401).json({ error: "Invalid token" }); }

//   const {
//     docEntry,
//     consignee,
//     shipper,
//     services,
//     dimensions,
//     commodity,
//     itemdtl,
//     returnAddr,
//   } = req.body;

//   if (!docEntry || !consignee || !services) {
//     return res.status(400).json({ error: "Missing required fields: docEntry, consignee, services" });
//   }

//   // ── Validate mandatory fields ────────────────────────────────────────────
//   if (!consignee.ConsigneeName)    return res.status(400).json({ error: "Consignee name is required" });
//   if (!consignee.ConsigneePincode) return res.status(400).json({ error: "Consignee pincode is required" });
//   if (!consignee.ConsigneeMobile)  return res.status(400).json({ error: "Consignee mobile is required" });
//   if (!services.ActualWeight)      return res.status(400).json({ error: "Actual weight is required" });
//   if (!services.DeclaredValue || parseFloat(services.DeclaredValue) <= 0)
//     return res.status(400).json({ error: "Declared value must be greater than 0" });

//   try {
//     // ── Step 1: Get JWT token ─────────────────────────────────────────────
//     const jwtToken = await getBlueDartToken();
//     const baseUrl  = getBlueDartBaseUrl();

//     // ── Step 2: Build request body ────────────────────────────────────────
//     const requestBody = {
//       Request: {
//         Consignee: {
//           ConsigneeName:                consignee.ConsigneeName                || "",
//           ConsigneeAddress1:            consignee.ConsigneeAddress1            || "",
//           ConsigneeAddress2:            consignee.ConsigneeAddress2            || "",
//           ConsigneeAddress3:            consignee.ConsigneeAddress3            || "",
//           ConsigneePincode:             String(consignee.ConsigneePincode      || ""),
//           ConsigneeMobile:              String(consignee.ConsigneeMobile       || ""),
//           ConsigneeTelephone:           consignee.ConsigneeTelephone           || "",
//           ConsigneeEmailID:             consignee.ConsigneeEmailID             || "",
//           ConsigneeAttention:           consignee.ConsigneeAttention           || "",
//           ConsigneeGSTNumber:           consignee.ConsigneeGSTNumber           || "",
//           ConsigneeAddressType:         consignee.ConsigneeAddressType         || "",
//           ConsigneeAddressinfo:         consignee.ConsigneeAddressinfo         || "",
//           ConsigneeFullAddress:         consignee.ConsigneeFullAddress         || "",
//           ConsigneeLatitude:            consignee.ConsigneeLatitude            || "",
//           ConsigneeLongitude:           consignee.ConsigneeLongitude           || "",
//           ConsigneeMaskedContactNumber: consignee.ConsigneeMaskedContactNumber || "",
//           AvailableDays:                consignee.AvailableDays                || "",
//           AvailableTiming:              consignee.AvailableTiming              || "",
//         },
//         Shipper: {
//           CustomerName:        shipper.CustomerName        || "",
//           CustomerCode:        shipper.CustomerCode        || "",
//           OriginArea:          shipper.OriginArea          || "",
//           CustomerAddress1:    shipper.CustomerAddress1    || "",
//           CustomerAddress2:    shipper.CustomerAddress2    || "",
//           CustomerAddress3:    shipper.CustomerAddress3    || "",
//           CustomerPincode:     String(shipper.CustomerPincode || ""),
//           CustomerMobile:      String(shipper.CustomerMobile  || ""),
//           CustomerTelephone:   shipper.CustomerTelephone   || "",
//           CustomerEmailID:     shipper.CustomerEmailID     || "",
//           CustomerGSTNumber:   shipper.CustomerGSTNumber   || "",
//           Sender:              shipper.Sender              || "",
//           VendorCode:          shipper.VendorCode          || "",
//           IsToPayCustomer:     !!shipper.IsToPayCustomer,
//           CustomerAddressinfo: "",
//           CustomerLatitude:    "",
//           CustomerLongitude:   "",
//           CustomerMaskedContactNumber: "",
//         },
//         Services: {
//           ProductCode:                services.ProductCode                || "E",
//           ProductType:                parseInt(services.ProductType       || 2),
//           SubProductCode:             services.SubProductCode             || "",
//           PieceCount:                 String(services.PieceCount          || "1"),
//           ActualWeight:               String(services.ActualWeight        || ""),
//           DeclaredValue:              parseFloat(services.DeclaredValue   || 0),
//           CollectableAmount:          parseFloat(services.CollectableAmount || 0),
//           CreditReferenceNo:          String(services.CreditReferenceNo   || "").substring(0, 20),
//           CreditReferenceNo2:         services.CreditReferenceNo2         || "",
//           CreditReferenceNo3:         services.CreditReferenceNo3         || "",
//           PickupDate:                 services.PickupDate                 || "",  // already /Date(ms)/
//           PickupTime:                 String(services.PickupTime          || "1600"),
//           PickupMode:                 services.PickupMode                 || "",
//           PickupType:                 services.PickupType                 || "",
//           InvoiceNo:                  String(services.InvoiceNo           || "").substring(0, 10),
//           ItemCount: itemdtl?.length || 1,
//           AWBNo:                      services.AWBNo                      || "",
//           OTPBasedDelivery:           services.OTPBasedDelivery           || "0",
//           OTPCode:                    services.OTPCode                    || "",
//           PackType:                   services.PackType                   || "",
//           ParcelShopCode:             services.ParcelShopCode             || "",
//           DeliveryTimeSlot:           services.DeliveryTimeSlot           || "",
//           PreferredPickupTimeSlot:    services.PreferredPickupTimeSlot    || "",
//           Officecutofftime:           services.Officecutofftime           || "",
//           FavouringName:              services.FavouringName              || "",
//           PayableAt:                  services.PayableAt                  || "",
//           ForwardAWBNo:               services.ForwardAWBNo               || "",
//           ForwardLogisticCompName:    services.ForwardLogisticCompName    || "",
//           InsurancePaidBy:            services.InsurancePaidBy            || "",
//           IsChequeDD:                 services.IsChequeDD                 || "",
//           SpecialInstruction:         services.SpecialInstruction         || "",
//           noOfDCGiven:                parseInt(services.noOfDCGiven       || 0),
//           TotalCashPaytoCustomer:     parseFloat(services.TotalCashPaytoCustomer || 0),
//           DeferredDeliveryDays:       parseInt(services.DeferredDeliveryDays    || 0),
//           RegisterPickup:             !!services.RegisterPickup, // forced false — sandbox not authorized for pickup registration
//           PDFOutputNotRequired:       !!services.PDFOutputNotRequired,
//           IsDedicatedDeliveryNetwork: !!services.IsDedicatedDeliveryNetwork,
//           IsReversePickup:            !!services.IsReversePickup,
//           IsForcePickup:              !!services.IsForcePickup,
//           IsPartialPickup:            !!services.IsPartialPickup,
//           ProductFeature:             services.ProductFeature             || "",
//           // Commodity
//           Commodity: {
//             CommodityDetail1: commodity?.CommodityDetail1 || "",
//             CommodityDetail2: commodity?.CommodityDetail2 || "",
//             CommodityDetail3: commodity?.CommodityDetail3 || "",
//           },
//           // Dimensions — only include if filled
//           Dimensions: (dimensions || [])
//             .filter(d => d.Length && d.Breadth && d.Height)
//             .map(d => ({
//               Length:  parseFloat(d.Length  || 0),
//               Breadth: parseFloat(d.Breadth || 0),
//               Height:  parseFloat(d.Height  || 0),
//               Count:   parseInt(d.Count     || 1),
//             })),
//           // Item detail
//           itemdtl: (itemdtl || []).map(it => ({
//             ItemID:           it.ItemID           || "",
//             ItemName:         it.ItemName         || "",
//             ItemValue:        parseFloat(it.ItemValue    || 0),
//             TotalValue:       parseFloat(it.TotalValue   || 0),
//             Itemquantity:     parseInt(it.Itemquantity   || 1),
//             InvoiceNumber:    it.InvoiceNumber    || "",
//             InvoiceDate:      it.InvoiceDate      || "",  // already /Date(ms)/
//             SellerName:       it.SellerName        || "",
//             SellerGSTNNumber: it.SellerGSTNNumber  || "",
//             ProductDesc1:     it.ProductDesc1      || "",
//             ProductDesc2:     it.ProductDesc2      || "",
//             SKUNumber:        it.SKUNumber         || "",
//             PlaceofSupply:    it.PlaceofSupply      || "",
//             countryOfOrigin:  it.countryOfOrigin   || "IN",
//             HSCode:           it.HSCode            || "",
//             docType:          it.docType           || "INV",
//             supplyType:       it.supplyType        || "0",
//             subSupplyType:    parseInt(it.subSupplyType  || 1),
//             CGSTAmount:       parseFloat(it.CGSTAmount   || 0),
//             SGSTAmount:       parseFloat(it.SGSTAmount   || 0),
//             IGSTAmount:       parseFloat(it.IGSTAmount   || 0),
//             IGSTRate:         parseFloat(it.IGSTRate     || 0),
//             TaxableAmount:    parseFloat(it.TaxableAmount|| 0),
//             cessAmount:       String(it.cessAmount       || "0.0"),
//             Instruction:      it.Instruction       || "",
//             ReturnReason:     it.ReturnReason      || "",
//           })),
//         },
//         Returnadds: {
//           ReturnAddress1:              returnAddr?.ReturnAddress1              || "",
//           ReturnAddress2:              returnAddr?.ReturnAddress2              || "",
//           ReturnAddress3:              returnAddr?.ReturnAddress3              || "",
//           ReturnPincode:               String(returnAddr?.ReturnPincode        || ""),
//           ReturnContact:               returnAddr?.ReturnContact               || "",
//           ReturnMobile:                String(returnAddr?.ReturnMobile         || ""),
//           ReturnTelephone:             returnAddr?.ReturnTelephone             || "",
//           ReturnEmailID:               returnAddr?.ReturnEmailID               || "",
//           ManifestNumber:              returnAddr?.ManifestNumber              || "",
//           ReturnLatitude:              returnAddr?.ReturnLatitude              || "",
//           ReturnLongitude:             returnAddr?.ReturnLongitude             || "",
//           ReturnAddressinfo:           returnAddr?.ReturnAddressinfo           || "",
//           ReturnMaskedContactNumber:   returnAddr?.ReturnMaskedContactNumber   || "",
//         },
//       },
//       Profile: getBlueDartProfile(),
//     };

//     // ── Step 3: Call Blue Dart API ────────────────────────────────────────
//     const bdRes = await fetch(
//       `${baseUrl}/in/transportation/waybill/v1/GenerateWayBill`,
//       {
//         method:  "POST",
//         headers: { "Content-Type": "application/json", JWTToken: jwtToken },
//         body:    JSON.stringify(requestBody),
//       }
//     );

//     const bdData = await bdRes.json();
    
//     // Log full response for debugging
//     console.log("Blue Dart raw response:", JSON.stringify(bdData, null, 2));
//     console.log("Blue Dart status code:", bdRes.status);

//     // Handle error-response format (400 errors)
//     if (bdData?.["error-response"]) {
//       const errResult = bdData["error-response"][0];
//       return res.status(400).json({
//         error: errResult?.Status?.[0]?.StatusInformation || "Blue Dart request failed",
//         status: errResult?.Status,
//       });
//     }

//     const result = bdData?.GenerateWayBillResult;

//     if (!result) {
//       return res.status(502).json({ 
//         error: "Invalid response from Blue Dart", 
//         raw: bdData,
//         status: bdRes.status,
//       });
//     }

//     if (result.IsError) {
//       return res.status(400).json({
//         error:  result.Status?.[0]?.StatusInformation || "Blue Dart returned an error",
//         status: result.Status,
//       });
//     }

//     const awbNo = result.AWBNo;

//     // ── Step 4: Update SAP OINV ─────────────────────────────────────────
//     // TODO: Uncomment when ready to save AWB back to SAP
//     // const airlineName = services.ProductCode === "A" ? "BY AIR" : "BY ROAD";
//     // await queryDatabase(
//     //   `UPDATE OINV SET TrackNo = @trackNo, U_AirlineName = @airline WHERE DocEntry = @docEntry`,
//     //   [
//     //     { name: "trackNo",  type: sql.VarChar, value: awbNo            },
//     //     { name: "airline",  type: sql.VarChar, value: airlineName      },
//     //     { name: "docEntry", type: sql.Int,     value: Number(docEntry) },
//     //   ]
//     // );

//     // ── Step 5: Return success ────────────────────────────────────────────
//     return res.status(200).json({
//       success:             true,
//       sapUpdated:          false,   // ← becomes true when SAP update is uncommented
//       AWBNo:               awbNo,
//       DestinationArea:     result.DestinationArea,
//       DestinationLocation: result.DestinationLocation,
//       TokenNumber:         result.TokenNumber,
//       StatusCode:          result.Status?.[0]?.StatusCode,
//       StatusInformation:   result.Status?.[0]?.StatusInformation,
//       AWBPrintContent:     result.AWBPrintContent || null,
//     });

//   } catch (err) {
//     console.error("Generate waybill error:", err);
//     return res.status(500).json({ error: err.message });
//   }
// }

// pages/api/bluedart/generate-waybill.js
import { verify } from "jsonwebtoken";
// import sql               from "mssql";
// import { queryDatabase } from "../../../lib/db";
import { getBlueDartToken, getBlueDartBaseUrl, getBlueDartProfile } from "./jwt";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  try { verify(authHeader.split(" ")[1], process.env.JWT_SECRET); }
  catch { return res.status(401).json({ error: "Invalid token" }); }

  const {
    docEntry,    // single invoice
    docEntries,  // multi invoice — array
    consignee, shipper, services, dimensions, commodity, itemdtl, returnAddr,
  } = req.body;

  if (!consignee || !services)
    return res.status(400).json({ error: "Missing required fields" });
  if (!consignee.ConsigneeName)    return res.status(400).json({ error: "Consignee name is required" });
  if (!consignee.ConsigneePincode) return res.status(400).json({ error: "Consignee pincode is required" });
  if (!consignee.ConsigneeMobile)  return res.status(400).json({ error: "Consignee mobile is required" });
  if (!services.ActualWeight)      return res.status(400).json({ error: "Actual weight is required" });
  if (!services.DeclaredValue || parseFloat(services.DeclaredValue) <= 0)
    return res.status(400).json({ error: "Declared value must be greater than 0" });

  try {
    const jwtToken = await getBlueDartToken();
    const baseUrl  = getBlueDartBaseUrl();

    const requestBody = {
      Request: {
        Consignee: {
          ConsigneeName:                consignee.ConsigneeName                || "",
          ConsigneeAddress1:            consignee.ConsigneeAddress1            || "",
          ConsigneeAddress2:            consignee.ConsigneeAddress2            || "",
          ConsigneeAddress3:            consignee.ConsigneeAddress3            || "",
          ConsigneePincode:             String(consignee.ConsigneePincode      || ""),
          ConsigneeMobile:              String(consignee.ConsigneeMobile       || ""),
          ConsigneeTelephone:           consignee.ConsigneeTelephone           || "",
          ConsigneeEmailID:             consignee.ConsigneeEmailID             || "",
          ConsigneeAttention:           consignee.ConsigneeAttention           || "",
          ConsigneeGSTNumber:           consignee.ConsigneeGSTNumber           || "",
          ConsigneeAddressType:         consignee.ConsigneeAddressType         || "",
          ConsigneeAddressinfo:         consignee.ConsigneeAddressinfo         || "",
          ConsigneeFullAddress:         consignee.ConsigneeFullAddress         || "",
          ConsigneeLatitude:            consignee.ConsigneeLatitude            || "",
          ConsigneeLongitude:           consignee.ConsigneeLongitude           || "",
          ConsigneeMaskedContactNumber: consignee.ConsigneeMaskedContactNumber || "",
          AvailableDays:                consignee.AvailableDays                || "",
          AvailableTiming:              consignee.AvailableTiming              || "",
        },
        Shipper: {
          CustomerName:        shipper.CustomerName     || "",
          CustomerCode:        shipper.CustomerCode     || "",
          OriginArea:          shipper.OriginArea       || "",
          CustomerAddress1:    shipper.CustomerAddress1 || "",
          CustomerAddress2:    shipper.CustomerAddress2 || "",
          CustomerAddress3:    shipper.CustomerAddress3 || "",
          CustomerPincode:     String(shipper.CustomerPincode || ""),
          CustomerMobile:      String(shipper.CustomerMobile  || ""),
          CustomerTelephone:   shipper.CustomerTelephone  || "",
          CustomerEmailID:     shipper.CustomerEmailID    || "",
          CustomerGSTNumber:   shipper.CustomerGSTNumber  || "",
          Sender:              shipper.Sender             || "",
          VendorCode:          shipper.VendorCode         || "",
          IsToPayCustomer:     !!shipper.IsToPayCustomer,
          CustomerAddressinfo: "",
          CustomerLatitude:    "",
          CustomerLongitude:   "",
          CustomerMaskedContactNumber: "",
        },
        Services: {
          ProductCode:                services.ProductCode             || "E",
          ProductType:                parseInt(services.ProductType    || 2),
          SubProductCode:             services.SubProductCode          || "",
          PieceCount:                 String(services.PieceCount       || "1"),
          ActualWeight:               String(services.ActualWeight     || ""),
          DeclaredValue:              parseFloat(services.DeclaredValue|| 0),
          CollectableAmount:          parseFloat(services.CollectableAmount || 0),
          CreditReferenceNo:          String(services.CreditReferenceNo|| "").substring(0, 20),
          CreditReferenceNo2:         services.CreditReferenceNo2      || "",
          CreditReferenceNo3:         services.CreditReferenceNo3      || "",
          PickupDate:                 services.PickupDate              || "",
          PickupTime:                 String(services.PickupTime       || "1600"),
          PickupMode:                 services.PickupMode              || "",
          PickupType:                 services.PickupType              || "",
          InvoiceNo:                  String(services.InvoiceNo        || "").substring(0, 10),
          ItemCount:                  itemdtl?.length || 1,
          AWBNo:                      services.AWBNo                   || "",
          OTPBasedDelivery:           services.OTPBasedDelivery        || "0",
          OTPCode:                    services.OTPCode                 || "",
          PackType:                   services.PackType                || "",
          ParcelShopCode:             services.ParcelShopCode          || "",
          DeliveryTimeSlot:           services.DeliveryTimeSlot        || "",
          PreferredPickupTimeSlot:    services.PreferredPickupTimeSlot || "",
          Officecutofftime:           services.Officecutofftime        || "",
          FavouringName:              services.FavouringName           || "",
          PayableAt:                  services.PayableAt               || "",
          ForwardAWBNo:               services.ForwardAWBNo            || "",
          ForwardLogisticCompName:    services.ForwardLogisticCompName || "",
          InsurancePaidBy:            services.InsurancePaidBy         || "",
          IsChequeDD:                 services.IsChequeDD              || "",
          SpecialInstruction:         services.SpecialInstruction      || "",
          noOfDCGiven:                parseInt(services.noOfDCGiven    || 0),
          TotalCashPaytoCustomer:     parseFloat(services.TotalCashPaytoCustomer || 0),
          DeferredDeliveryDays:       parseInt(services.DeferredDeliveryDays    || 0),
          RegisterPickup:             !!services.RegisterPickup,
          PDFOutputNotRequired:       !!services.PDFOutputNotRequired,
          IsDedicatedDeliveryNetwork: !!services.IsDedicatedDeliveryNetwork,
          IsReversePickup:            !!services.IsReversePickup,
          IsForcePickup:              !!services.IsForcePickup,
          IsPartialPickup:            !!services.IsPartialPickup,
          ProductFeature:             services.ProductFeature          || "",
          Commodity: {
            CommodityDetail1: commodity?.CommodityDetail1 || "",
            CommodityDetail2: commodity?.CommodityDetail2 || "",
            CommodityDetail3: commodity?.CommodityDetail3 || "",
          },
          Dimensions: (dimensions || [])
            .filter(d => d.Length && d.Breadth && d.Height)
            .map(d => ({ Length: parseFloat(d.Length), Breadth: parseFloat(d.Breadth), Height: parseFloat(d.Height), Count: parseInt(d.Count || 1) })),
          itemdtl: (itemdtl || []).map(it => ({
            ItemID: it.ItemID || "", ItemName: it.ItemName || "",
            ItemValue: parseFloat(it.ItemValue || 0), TotalValue: parseFloat(it.TotalValue || 0),
            Itemquantity: parseInt(it.Itemquantity || 1),
            InvoiceNumber: it.InvoiceNumber || "", InvoiceDate: it.InvoiceDate || "",
            SellerName: it.SellerName || "", SellerGSTNNumber: it.SellerGSTNNumber || "",
            ProductDesc1: it.ProductDesc1 || "", ProductDesc2: it.ProductDesc2 || "",
            SKUNumber: it.SKUNumber || "", PlaceofSupply: it.PlaceofSupply || "",
            countryOfOrigin: it.countryOfOrigin || "IN", HSCode: it.HSCode || "",
            docType: it.docType || "INV", supplyType: it.supplyType || "0",
            subSupplyType: parseInt(it.subSupplyType || 1),
            CGSTAmount: parseFloat(it.CGSTAmount || 0), SGSTAmount: parseFloat(it.SGSTAmount || 0),
            IGSTAmount: parseFloat(it.IGSTAmount || 0), IGSTRate: parseFloat(it.IGSTRate || 0),
            TaxableAmount: parseFloat(it.TaxableAmount || 0), cessAmount: String(it.cessAmount || "0.0"),
            Instruction: it.Instruction || "", ReturnReason: it.ReturnReason || "",
          })),
        },
        Returnadds: {
          ReturnAddress1:            returnAddr?.ReturnAddress1            || "",
          ReturnAddress2:            returnAddr?.ReturnAddress2            || "",
          ReturnAddress3:            returnAddr?.ReturnAddress3            || "",
          ReturnPincode:             String(returnAddr?.ReturnPincode      || ""),
          ReturnContact:             returnAddr?.ReturnContact             || "",
          ReturnMobile:              String(returnAddr?.ReturnMobile       || ""),
          ReturnTelephone:           returnAddr?.ReturnTelephone           || "",
          ReturnEmailID:             returnAddr?.ReturnEmailID             || "",
          ManifestNumber:            returnAddr?.ManifestNumber            || "",
          ReturnLatitude:            returnAddr?.ReturnLatitude            || "",
          ReturnLongitude:           returnAddr?.ReturnLongitude           || "",
          ReturnAddressinfo:         returnAddr?.ReturnAddressinfo         || "",
          ReturnMaskedContactNumber: returnAddr?.ReturnMaskedContactNumber || "",
        },
      },
      Profile: getBlueDartProfile(),
    };

    const bdRes = await fetch(
      `${baseUrl}/in/transportation/waybill/v1/GenerateWayBill`,
      { method: "POST", headers: { "Content-Type": "application/json", JWTToken: jwtToken }, body: JSON.stringify(requestBody) }
    );

    const bdData = await bdRes.json();

    if (bdData?.["error-response"]) {
      const e = bdData["error-response"][0];
      return res.status(400).json({ error: e?.Status?.[0]?.StatusInformation || "Blue Dart request failed", status: e?.Status });
    }

    const result = bdData?.GenerateWayBillResult;
    if (!result) return res.status(502).json({ error: "Invalid response from Blue Dart", raw: bdData });
    if (result.IsError) return res.status(400).json({ error: result.Status?.[0]?.StatusInformation || "Blue Dart error", status: result.Status });

    const awbNo = result.AWBNo;

    // ══════════════════════════════════════════════════════════════
    // SAP UPDATE — uncomment when ready to write back to SAP
    // ══════════════════════════════════════════════════════════════
    // const airlineName = services.ProductCode === "A" ? "BY AIR" : "BY ROAD";
    //
    // SINGLE INVOICE:
    // if (docEntry) {
    //   await queryDatabase(
    //     `UPDATE OINV SET TrackNo = @trackNo, U_AirlineName = @airline WHERE DocEntry = @docEntry`,
    //     [
    //       { name: "trackNo",  type: sql.VarChar, value: awbNo            },
    //       { name: "airline",  type: sql.VarChar, value: airlineName      },
    //       { name: "docEntry", type: sql.Int,     value: Number(docEntry) },
    //     ]
    //   );
    // }
    //
    // MULTIPLE INVOICES — update all selected invoices with same AWB:
    // if (docEntries?.length > 0) {
    //   for (const de of docEntries) {
    //     await queryDatabase(
    //       `UPDATE OINV SET TrackNo = @trackNo, U_AirlineName = @airline WHERE DocEntry = @docEntry`,
    //       [
    //         { name: "trackNo",  type: sql.VarChar, value: awbNo         },
    //         { name: "airline",  type: sql.VarChar, value: airlineName   },
    //         { name: "docEntry", type: sql.Int,     value: Number(de)    },
    //       ]
    //     );
    //   }
    // }
    // ══════════════════════════════════════════════════════════════

    return res.status(200).json({
      success: true, sapUpdated: false, AWBNo: awbNo,
      DestinationArea: result.DestinationArea, DestinationLocation: result.DestinationLocation,
      TokenNumber: result.TokenNumber,
      StatusCode: result.Status?.[0]?.StatusCode,
      StatusInformation: result.Status?.[0]?.StatusInformation,
      AWBPrintContent: result.AWBPrintContent || null,
    });

  } catch (err) {
    console.error("Generate waybill error:", err);
    return res.status(500).json({ error: err.message });
  }
}