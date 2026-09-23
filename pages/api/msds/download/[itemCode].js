// pages/api/msds/download/[itemCode].js
// Proxies an item's MSDS PDF so clicking the link in the dispatch email or
// the public /dispatch page forces a real download instead of the browser
// just navigating to (and possibly inline-rendering) the external OSS URL —
// same reasoning as pages/api/coa/download-energy/[...params].js. Looks the
// URL up fresh by itemCode rather than trusting a URL passed in from the
// client, and never reveals the internal test_density lookup to the browser
// on failure — this is a customer-facing route.

import { getMsdsUrl } from "../../../../lib/models/msds";

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
    const msdsUrl = await getMsdsUrl(itemCode);
    if (!msdsUrl) {
      return res.status(404).json({ message: "MSDS not available for this item." });
    }

    if (isHead) {
      const headResponse = await fetch(msdsUrl, { method: "HEAD" });
      if (!headResponse.ok) {
        return res.status(404).json({ message: "MSDS not available for this item." });
      }
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Cache-Control", "no-cache");
      return res.status(200).end();
    }

    const response = await fetch(msdsUrl);
    if (!response.ok) {
      console.error(`[msds/download] upstream fetch failed for ${itemCode}: HTTP ${response.status}`);
      return res.status(404).json({ message: "MSDS not available for this item." });
    }

    const pdfBuffer = await response.arrayBuffer();
    const pdfData = Buffer.from(pdfBuffer);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="MSDS_${itemCode}.pdf"`);
    res.setHeader("Content-Length", pdfData.length);
    res.setHeader("Cache-Control", "no-cache");
    return res.send(pdfData);
  } catch (error) {
    console.error(`[msds/download] error for ${itemCode}:`, error.message);
    return res.status(500).json({ message: "Something went wrong while retrieving the MSDS." });
  }
}

export const config = {
  api: {
    responseLimit: "50mb",
  },
};
