// pages/api/bluedart/download-waybill-pdf.js
// Serves the saved waybill PDF from the network path

import { verify } from "jsonwebtoken";
import fs   from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  try { verify(authHeader.split(" ")[1], process.env.JWT_SECRET); }
  catch { return res.status(401).json({ error: "Invalid token" }); }

  const { awbNo } = req.query;
  if (!awbNo) return res.status(400).json({ error: "AWB number is required" });

  // Sanitize — only allow alphanumeric AWB numbers
  const safeAwb = awbNo.replace(/[^a-zA-Z0-9]/g, "");
  if (!safeAwb) return res.status(400).json({ error: "Invalid AWB number" });

  const baseDir  = process.env.BLUEDART_WAYBILL_PDF_PATH;
  if (!baseDir) return res.status(500).json({ error: "PDF path not configured" });

  const filePath = path.join(baseDir, `${safeAwb}.pdf`);

  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "PDF not found for this waybill" });
    }

    const fileBuffer = fs.readFileSync(filePath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeAwb}.pdf"`);
    res.setHeader("Content-Length", fileBuffer.length);
    return res.status(200).send(fileBuffer);

  } catch (err) {
    console.error("Download waybill PDF error:", err);
    return res.status(500).json({ error: err.message });
  }
}