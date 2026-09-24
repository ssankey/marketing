// pages/api/specs/download/[itemCode].js
// Proxies an item's Spec Sheet PDF (3AProducts.specs_d — same table/join/
// prefix-strip logic as MSDS in lib/models/msds.js, just a different
// column) so clicking the link forces a real download instead of the
// browser just navigating to the external OSS URL. Same shape as
// pages/api/msds/download/[itemCode].js — never reveals the internal
// test_density lookup to the browser on failure.

import { getSpecsUrl } from "../../../../lib/models/msds";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { itemCode } = req.query;
  if (!itemCode) {
    return res.status(400).json({ message: "Item code is required" });
  }

  const isHead = req.method === "HEAD";

  try {
    const specsUrl = await getSpecsUrl(itemCode);
    if (!specsUrl) {
      return res.status(404).json({ message: "Spec sheet not available for this item." });
    }

    if (isHead) {
      const headResponse = await fetch(specsUrl, { method: "HEAD" });
      if (!headResponse.ok) {
        return res.status(404).json({ message: "Spec sheet not available for this item." });
      }
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Cache-Control", "no-cache");
      return res.status(200).end();
    }

    const response = await fetch(specsUrl);
    if (!response.ok) {
      console.error(`[specs/download] upstream fetch failed for ${itemCode}: HTTP ${response.status}`);
      return res.status(404).json({ message: "Spec sheet not available for this item." });
    }

    const pdfBuffer = await response.arrayBuffer();
    const pdfData = Buffer.from(pdfBuffer);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Specs_${itemCode}.pdf"`);
    res.setHeader("Content-Length", pdfData.length);
    res.setHeader("Cache-Control", "no-cache");
    return res.send(pdfData);
  } catch (error) {
    console.error(`[specs/download] error for ${itemCode}:`, error.message);
    return res.status(500).json({ message: "Something went wrong while retrieving the spec sheet." });
  }
}

export const config = {
  api: {
    responseLimit: "50mb",
  },
};
