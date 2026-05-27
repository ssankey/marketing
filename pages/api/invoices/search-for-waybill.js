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
      T0.DocEntry                     AS DocEntry,
      T0.DocNum                       AS InvoiceNo,
      T0.DocDate                      AS InvoiceDate,
      T0.NumAtCard                    AS CustomerRefNo,
      T0.DocTotal                     AS DocTotal,
      T0.TrackNo                      AS TrackNo,
      T0.CardCode                     AS CustomerCode,
      T0.CardName                     AS CustomerName,
      T0.ShipToCode                   AS ShipToName,
      T0.Address2                     AS CustomerAddress,
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

    const invoice = {
      DocEntry:          first.DocEntry,
      InvoiceNo:         first.InvoiceNo,
      InvoiceDate:       first.InvoiceDate ? first.InvoiceDate.toISOString() : null,
      CustomerRefNo:     first.CustomerRefNo   || "",
      DocTotal:          parseFloat(first.DocTotal || 0),
      TrackNo:           first.TrackNo          || "",
      CustomerCode:      first.CustomerCode     || "",
      CustomerName:      first.CustomerName     || "",
      ShipToName:        first.ShipToName       || "",
      CustomerAddress:   first.CustomerAddress  || "",
      ShipAddress1:      first.ShipAddress1     || "",
      ShipAddress2:      first.ShipAddress2     || "",
      CustomerPincode:   first.CustomerPincode  || "",
      City:              first.City             || "",
      State:             first.State            || "",
      Country:           first.Country          || "",
      ContactPersonName: first.ContactPersonName|| "",
      MobileNo:          first.MobileNo         || "",
      Telephone:         first.Telephone        || "",
      Email:             first.Email            || "",
      lineItems: rows.map(r => ({
        LineNum:   r.LineNum,
        CatNo:     r.CatNo     || "",
        ItemName:  r.ItemName  || "",
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