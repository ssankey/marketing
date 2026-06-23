// pages/api/bluedart/non-haz-pdf.js
// Generates and serves the "Shipper's Certification for Non-Hazardous Cargo" PDF
// Fetches shipment + consignee data from SAP for the given AWB number

import { verify }        from "jsonwebtoken";
import { queryDatabase } from "../../../lib/db";
import { generateNonHazPdf } from "../../../lib/non-haz-pdf-generator";

const SHIPPER_NAME    = "Density Pharmachem Pvt Ltd.";
const SHIPPER_ADDRESS = "110, Block A, Bobbile Empire, Kompally, Hyderabad - 500014, Telangana, India";
const ORIGIN_AIRPORT  = "Hyderabad";
const SHIPPER_FULLNAME    = "Manikanth";
const SHIPPER_DESIGNATION = "Exu - Operations";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  try { verify(authHeader.split(" ")[1], process.env.JWT_SECRET); }
  catch { return res.status(401).json({ error: "Invalid token" }); }

  const { awbNo } = req.query;
  if (!awbNo) return res.status(400).json({ error: "AWB number is required" });

  const safeAwb = String(awbNo).replace(/[^a-zA-Z0-9]/g, "");
  if (!safeAwb) return res.status(400).json({ error: "Invalid AWB number" });

  try {
    // Fetch invoice(s) + consignee + line items for this AWB
    const query = `
      SELECT
        T0.DocNum                AS InvoiceNo,
        T0.CardName               AS CustomerName,
        T0.Address2               AS InvAddress2,
        T0.U_ShipAddr1            AS UShipAddr1,
        T3.City                   AS City,
        T3.State                  AS State,
        T3.ZipCode                AS Pincode,
        T1.Dscription              AS ItemName,
        T1.Quantity                AS Quantity,
        T1.LineNum                 AS LineNum
      FROM OINV T0
      INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      LEFT JOIN CRD1 T3
          ON T0.CardCode  = T3.CardCode
         AND T3.AdresType = 'S'
         AND T3.Address   = T0.ShipToCode
      WHERE T0.TrackNo = @awbNo
      ORDER BY T1.LineNum
    `;

    const rows = await queryDatabase(query, [{ name: "awbNo", type: require("mssql").VarChar, value: safeAwb }]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "No invoice found for this AWB number" });
    }

    const first = rows[0];

    // Build consignee address (full, no 30-char split needed here)
    const fullAddr = first.InvAddress2 || first.UShipAddr1 || "";
    const consigneeAddress = [fullAddr, first.City, first.State, first.Pincode]
      .filter(Boolean).join(", ");

    // Destination airport — use City from SAP (e.g. Thane)
    const destAirport = first.City || "—";

    // One row per invoice line item
    const items = rows.map(r => ({
      packages:    "1 Package",
      description: r.ItemName || "",
      netQty:      r.Quantity ? `1 X ${r.Quantity}` : "",
    }));

    const pdfBytes = await generateNonHazPdf({
      awbNo:            safeAwb,
      originAirport:    ORIGIN_AIRPORT,
      destAirport,
      shipperName:      SHIPPER_NAME,
      shipperAddress:   SHIPPER_ADDRESS,
      consigneeName:    first.CustomerName || "",
      consigneeAddress,
      items,
      fullName:         SHIPPER_FULLNAME,
      designation:      SHIPPER_DESIGNATION,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="NonHaz_${safeAwb}.pdf"`);
    return res.status(200).send(Buffer.from(pdfBytes));

  } catch (err) {
    console.error("Non-Haz PDF generation error:", err);
    return res.status(500).json({ error: err.message });
  }
}