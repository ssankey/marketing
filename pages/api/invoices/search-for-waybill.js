

// pages/api/invoices/search-for-waybill.js
import { verify } from "jsonwebtoken";
import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try { verify(authHeader.split(" ")[1], process.env.JWT_SECRET); }
  catch { return res.status(401).json({ error: "Invalid token" }); }

  // Supports single invoiceNo or comma-separated invoiceNos for multi-invoice mode
  const { invoiceNo, invoiceNos } = req.query;

  // Build list of invoice numbers to fetch
  const numbers = invoiceNos
    ? invoiceNos.split(",").map(n => n.trim()).filter(Boolean)
    : invoiceNo
    ? [invoiceNo.trim()]
    : [];

  if (numbers.length === 0) {
    return res.status(400).json({ error: "Invoice number is required" });
  }

  const inClause = numbers.map(n => `'${n.replace(/'/g, "''")}'`).join(",");

  const query = `
    SELECT
      T0.DocEntry                     AS DocEntry,
      T0.DocNum                       AS InvoiceNo,
      T0.DocDate                      AS InvoiceDate,
      T0.NumAtCard                    AS CustomerRefNo,
      T0.DocTotal                     AS DocTotal,
      T0.TrackNo                      AS TrackNo,
      B.BpGSTN                        AS ConsigneeGST,
      B.LocGSTN                       AS OurGST,
      B.BpStateCod                    AS BpStateCode,
      T0.CardCode                     AS CustomerCode,
      T0.CardName                     AS CustomerName,
      T0.ShipToCode                   AS ShipToName,
      T0.Address2                     AS InvAddress2,
      T0.U_ShipAddr1                  AS UShipAddr1,
      T0.U_ShipAddr2                  AS UShipAddr2,
      T0.U_ShipPin                    AS UShipPin,
      T0.U_ShipLoc                    AS UShipLoc,
      T0.U_ShipStcd                   AS UShipState,
      T0.U_Weight                     AS UWeight,
      T3.ZipCode                      AS CustomerPincode,
      T3.City                         AS City,
      T3.State                        AS State,
      T3.Country                      AS Country,
      T3.Address                      AS ShipAddress1,
      T3.Address2                     AS ShipAddress2,
      T2.Name                         AS ContactPersonName,
      T2.Cellolar                     AS MobileNo,
      T2.Tel1                         AS Telephone,
      T2.E_MailL                      AS Email,
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
    WHERE T0.DocNum IN (${inClause})
      AND T0.CANCELED = 'N'
    ORDER BY T0.DocNum ASC, T1.LineNum ASC
  `;

  try {
    const rows = await queryDatabase(query);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: `No invoices found` });
    }

    // Group rows by DocEntry
    const invoiceMap = new Map();
    for (const r of rows) {
      if (!invoiceMap.has(r.DocEntry)) {
        // Address resolution
        const fullAddr = r.InvAddress2 || r.UShipAddr1 || "";
        const addr1    = fullAddr.substring(0, 30).trim();
        const addr2    = fullAddr.length > 30 ? fullAddr.substring(30, 60).trim() : "";
        const addr3    = [r.City, r.State].filter(Boolean).join(", ");
        const pincode  = r.CustomerPincode || r.UShipPin || "";
        const city     = r.City            || r.UShipLoc || "";

        invoiceMap.set(r.DocEntry, {
          DocEntry:          r.DocEntry,
          InvoiceNo:         r.InvoiceNo,
          InvoiceDate:       r.InvoiceDate ? r.InvoiceDate.toISOString() : null,
          CustomerRefNo:     r.CustomerRefNo    || "",
          DocTotal:          parseFloat(r.DocTotal || 0),
          TrackNo:           r.TrackNo           || "",
          ConsigneeGST:      r.ConsigneeGST      || "",
          OurGST:            r.OurGST            || "",
          CustomerCode:      r.CustomerCode      || "",
          CustomerName:      r.CustomerName      || "",
          ShipToName:        r.ShipToName        || "",
          ShipAddress1:      addr1,
          ShipAddress2:      addr2,
          ShipAddress3:      addr3,
          CustomerPincode:   pincode,
          City:              city,
          State:             r.State             || "",
          Country:           r.Country           || "",
          UWeight:           r.UWeight           || "",
          ContactPersonName: r.ContactPersonName || "",
          MobileNo:          r.MobileNo          || "",
          Telephone:         r.Telephone         || "",
          Email:             r.Email             || "",
          lineItems: [],
        });
      }
      invoiceMap.get(r.DocEntry).lineItems.push({
        LineNum:   r.LineNum,
        CatNo:     r.CatNo      || "",
        ItemName:  r.ItemName   || "",
        Quantity:  parseFloat(r.Quantity   || 0),
        ItemValue: parseFloat(r.ItemValue  || 0),
        TotalValue:parseFloat(r.TotalValue || 0),
        InvoiceNo: r.InvoiceNo,  // keep track of which invoice this item belongs to
      });
    }

    const invoices = Array.from(invoiceMap.values());

    // If single invoice — return as before
    if (numbers.length === 1) {
      return res.status(200).json({ invoice: invoices[0] });
    }

    // If multiple — also return merged data
    const first = invoices[0];
    const merged = {
      // Use first invoice for consignee details
      DocEntries:        invoices.map(i => i.DocEntry),
      InvoiceNos:        invoices.map(i => i.InvoiceNo),
      CustomerRefNo:     first.CustomerRefNo || String(first.InvoiceNo),
      DocTotal:          invoices.reduce((s, i) => s + i.DocTotal, 0),
      CustomerName:      first.CustomerName,
      ShipAddress1:      first.ShipAddress1,
      ShipAddress2:      first.ShipAddress2,
      ShipAddress3:      first.ShipAddress3,
      CustomerPincode:   first.CustomerPincode,
      City:              first.City,
      State:             first.State,
      ConsigneeGST:      first.ConsigneeGST,
      MobileNo:          first.MobileNo,
      Telephone:         first.Telephone,
      Email:             first.Email,
      ContactPersonName: first.ContactPersonName,
      UWeight:           first.UWeight,
      // All line items from all invoices
      lineItems: invoices.flatMap(inv =>
        inv.lineItems.map(item => ({ ...item, InvoiceNo: inv.InvoiceNo, InvoiceDate: inv.InvoiceDate }))
      ),
      invoices, // individual invoice details
    };

    return res.status(200).json({ invoice: merged, isMulti: true });
  } catch (err) {
    console.error("Search invoice error:", err);
    return res.status(500).json({ error: err.message });
  }
}