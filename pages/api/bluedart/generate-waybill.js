
// pages/api/bluedart/generate-waybill.js
import { verify }        from "jsonwebtoken";
import fs                from "fs";
import path              from "path";
import { promisify }     from "util";
import { PDFDocument }   from "pdf-lib";
import sql               from "mssql";
import { queryDatabase } from "../../../lib/db";
import { getBlueDartToken, getBlueDartBaseUrl, getBlueDartProfile } from "./jwt";

const mkdir     = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const access    = promisify(fs.access);

// Duplicates first page — returns 2-page PDF as byte array
async function duplicatePdfPage(byteArray) {
  try {
    const pdfBytes    = Buffer.from(byteArray);
    const srcDoc      = await PDFDocument.load(pdfBytes);
    const newDoc      = await PDFDocument.create();
    const [page1]     = await newDoc.copyPages(srcDoc, [0]);
    const [page1copy] = await newDoc.copyPages(srcDoc, [0]);
    newDoc.addPage(page1);
    newDoc.addPage(page1copy);
    const doubledBytes = await newDoc.save();
    return Array.from(doubledBytes);
  } catch (err) {
    console.error("Failed to duplicate PDF page:", err.message);
    return byteArray; // fallback — return original single page
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  try { verify(authHeader.split(" ")[1], process.env.JWT_SECRET); }
  catch { return res.status(401).json({ error: "Invalid token" }); }

  const {
    docEntry,    // single invoice — number
    docEntries,  // multi invoice  — array of numbers
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

    // ── Call Blue Dart API ────────────────────────────────────────────────
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

    try {
  await queryDatabase(
    `MERGE bluedart_waybill AS target
     USING (SELECT @waybillNo AS waybill_no) AS src
     ON target.waybill_no = src.waybill_no
     WHEN MATCHED THEN
       UPDATE SET piece_count = @pieceCount, is_bluedart = 'Y'
     WHEN NOT MATCHED THEN
       INSERT (waybill_no, piece_count, is_bluedart)
       VALUES (@waybillNo, @pieceCount, 'Y');`,
    [
      { name: "waybillNo",  type: sql.VarChar, value: awbNo },
      { name: "pieceCount", type: sql.Int,      value: parseInt(services.PieceCount || 1) },
    ]
  );
  console.log(`Piece count saved for AWB ${awbNo}: ${services.PieceCount}`);
} catch (pcErr) {
  // Never block waybill success because of this
  console.error("Failed to save piece count:", pcErr.message);
}
 


    // ── Duplicate PDF page (1 copy → 2 copies in one PDF) ────────────────
    let finalPdfContent = result.AWBPrintContent || null;
    if (finalPdfContent && Array.isArray(finalPdfContent)) {
      finalPdfContent = await duplicatePdfPage(finalPdfContent);
      console.log(`PDF duplicated — 2 pages, ${finalPdfContent.length} bytes`);
    }

    // ── Save 2-page PDF to network path ───────────────────────────────────
    let pdfSaved    = false;
    let pdfFilePath = null;

    if (finalPdfContent && Array.isArray(finalPdfContent)) {
      try {
        const baseDir = process.env.BLUEDART_WAYBILL_PDF_PATH;
        if (baseDir) {
          try { await access(baseDir); } catch { await mkdir(baseDir, { recursive: true }); }
          const fileName  = `${awbNo}.pdf`;
          pdfFilePath     = path.join(baseDir, fileName);
          const pdfBuffer = Buffer.from(finalPdfContent);
          await writeFile(pdfFilePath, pdfBuffer);
          pdfSaved = true;
          console.log(`Waybill PDF saved (2 pages): ${pdfFilePath}`);
        }
      } catch (pdfErr) {
        console.error("Failed to save waybill PDF:", pdfErr.message);
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    // SAP UPDATE — updates OINV only
    // Fields: TrackNo, U_AirlineName, U_TrackingNoUpdateDT,
    //         U_DispatchDate, TrnspCode
    // Note: U_TrackingNoUpdateDT triggers the dispatch email cron job
    // ══════════════════════════════════════════════════════════════════════
    const airlineName = services.ProductCode === "A" ? "BY AIR (APEX)" : "BY ROAD";
    let sapUpdated    = false;

    const sapUpdateQuery = `
      UPDATE OINV
      SET TrackNo              = @trackNo,
          U_AirlineName        = @airline,
          U_TrackingNoUpdateDT = GETDATE(),
          U_DispatchDate       = GETDATE(),
          TrnspCode            = 1
      WHERE DocEntry = @docEntry
    `;

    // SINGLE INVOICE
    if (docEntry) {
      await queryDatabase(sapUpdateQuery, [
        { name: "trackNo",  type: sql.VarChar, value: awbNo            },
        { name: "airline",  type: sql.VarChar, value: airlineName      },
        { name: "docEntry", type: sql.Int,     value: Number(docEntry) },
      ]);
      sapUpdated = true;
      console.log(`SAP updated — DocEntry: ${docEntry}, AWB: ${awbNo}`);
    }

    // MULTIPLE INVOICES — same AWB written to all selected invoices
    if (docEntries?.length > 0) {
      for (const de of docEntries) {
        await queryDatabase(sapUpdateQuery, [
          { name: "trackNo",  type: sql.VarChar, value: awbNo      },
          { name: "airline",  type: sql.VarChar, value: airlineName },
          { name: "docEntry", type: sql.Int,     value: Number(de)  },
        ]);
        console.log(`SAP updated — DocEntry: ${de}, AWB: ${awbNo}`);
      }
      sapUpdated = true;
    }
    // ══════════════════════════════════════════════════════════════════════

    return res.status(200).json({
      success:             true,
      sapUpdated,
      AWBNo:               awbNo,
      DestinationArea:     result.DestinationArea,
      DestinationLocation: result.DestinationLocation,
      TokenNumber:         result.TokenNumber,
      StatusCode:          result.Status?.[0]?.StatusCode,
      StatusInformation:   result.Status?.[0]?.StatusInformation,
      AWBPrintContent:     finalPdfContent,  // 2-page PDF byte array
      pdfSaved,
      pdfFilePath,
    });

  } catch (err) {
    console.error("Generate waybill error:", err);
    return res.status(500).json({ error: err.message });
  }
}