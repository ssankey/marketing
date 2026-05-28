// pages/api/invoices/search-for-waybill.js
import { verify } from "jsonwebtoken";
import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try { verify(authHeader.split(" ")[1], process.env.JWT_SECRET); }
  catch { return res.status(401).json({ error: "Invalid token" }); }

  const { invoiceNo } = req.query;
  if (!invoiceNo || !invoiceNo.trim()) {
    return res.status(400).json({ error: "Invoice number is required" });
  }

  const query = `
    SELECT
      -- Invoice header
      T0.DocEntry                     AS DocEntry,
      T0.DocNum                       AS InvoiceNo,
      T0.DocDate                      AS InvoiceDate,
      T0.NumAtCard                    AS CustomerRefNo,
      T0.DocTotal                     AS DocTotal,
      T0.TrackNo                      AS TrackNo,

      -- GST from INV12 (most accurate)
      B.BpGSTN                        AS ConsigneeGST,
      B.LocGSTN                       AS OurGST,
      B.BpStateCod                    AS BpStateCode,

      -- Customer
      T0.CardCode                     AS CustomerCode,
      T0.CardName                     AS CustomerName,
      T0.ShipToCode                   AS ShipToName,
      T0.Address2                     AS InvAddress2,

      -- U_ custom ship address fields (filled from SAP directly)
      T0.U_ShipAddr1                  AS UShipAddr1,
      T0.U_ShipAddr2                  AS UShipAddr2,
      T0.U_ShipPin                    AS UShipPin,
      T0.U_ShipLoc                    AS UShipLoc,
      T0.U_ShipStcd                   AS UShipState,

      -- Weight (can pre-fill actual weight)
      T0.U_Weight                     AS UWeight,

      -- Structured address from CRD1 (fallback)
      T3.ZipCode                      AS CustomerPincode,
      T3.City                         AS City,
      T3.State                        AS State,
      T3.Country                      AS Country,
      T3.Address                      AS ShipAddress1,
      T3.Address2                     AS ShipAddress2,

      -- Contact person
      T2.Name                         AS ContactPersonName,
      T2.Cellolar                     AS MobileNo,
      T2.Tel1                         AS Telephone,
      T2.E_MailL                      AS Email,

      -- Line items
      T1.ItemCode                     AS CatNo,
      T1.Dscription                   AS ItemName,
      T1.Quantity                     AS Quantity,
      T1.Price                        AS ItemValue,
      T1.LineTotal                    AS TotalValue,
      T1.LineNum                      AS LineNum

    FROM OINV T0
    INNER JOIN INV1 T1  ON T0.DocEntry = T1.DocEntry
    LEFT JOIN  (SELECT DISTINCT DocEntry, BpGSTN, LocGSTN, BpStateCod FROM INV12) B
                        ON T0.DocEntry = B.DocEntry
    LEFT JOIN  OCPR T2  ON T0.CntctCode = T2.CntctCode
    LEFT JOIN  CRD1 T3
        ON T0.CardCode  = T3.CardCode
       AND T3.AdresType = 'S'
       AND T3.Address   = T0.ShipToCode
    WHERE T0.DocNum   = '${invoiceNo.trim().replace(/'/g, "''")}'
      AND T0.CANCELED = 'N'
    ORDER BY T1.LineNum ASC
  `;

  try {
    const rows = await queryDatabase(query);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: `Invoice #${invoiceNo} not found` });
    }

    const first = rows[0];

    // Blue Dart max 30 chars per address line
    const fullAddr = first.InvAddress2 || first.UShipAddr1 || "";
    const addr1    = fullAddr.substring(0, 30).trim();
    const addr2    = fullAddr.length > 30 ? fullAddr.substring(30, 60).trim() : "";
    const addr3    = [first.City, first.State].filter(Boolean).join(", ");
    const pincode  = first.CustomerPincode || first.UShipPin || "";
    const city     = first.City            || first.UShipLoc || "";

    const invoice = {
      // Header
      DocEntry:          first.DocEntry,
      InvoiceNo:         first.InvoiceNo,
      InvoiceDate:       first.InvoiceDate ? first.InvoiceDate.toISOString() : null,
      CustomerRefNo:     first.CustomerRefNo    || "",
      DocTotal:          parseFloat(first.DocTotal || 0),
      TrackNo:           first.TrackNo           || "",

      // GST
      ConsigneeGST:      first.ConsigneeGST      || "",
      OurGST:            first.OurGST            || "",
      BpStateCode:       first.BpStateCode       || "",

      // Customer
      CustomerCode:      first.CustomerCode      || "",
      CustomerName:      first.CustomerName      || "",
      ShipToName:        first.ShipToName        || "",

      // Resolved address
      ShipAddress1:      addr1,
      ShipAddress2:      addr2,
      ShipAddress3:      addr3,
      CustomerPincode:   pincode,
      City:              city,
      State:             first.State  || "",
      Country:           first.Country|| "",

      // Weight — pre-fill ActualWeight if available
      UWeight:           first.UWeight           || "",

      // Contact
      ContactPersonName: first.ContactPersonName || "",
      MobileNo:          first.MobileNo          || "",
      Telephone:         first.Telephone         || "",
      Email:             first.Email             || "",

      // Line items
      lineItems: rows.map(r => ({
        LineNum:   r.LineNum,
        CatNo:     r.CatNo      || "",
        ItemName:  r.ItemName   || "",
        Quantity:  parseFloat(r.Quantity   || 0),
        ItemValue: parseFloat(r.ItemValue  || 0),
        TotalValue:parseFloat(r.TotalValue || 0),
      })),
    };

    return res.status(200).json({ invoice });
  } catch (err) {
    console.error("Search invoice error:", err);
    return res.status(500).json({ error: err.message });
  }
}