// pages/api/msds/download/[itemCode].js
// Proxies an item's MSDS PDF so clicking the link in the dispatch email or
// the public /dispatch page forces a real download instead of the browser
// just navigating to (and possibly inline-rendering) an external URL —
// same reasoning as pages/api/coa/download-energy/[...params].js. Looks the
// source up fresh by itemCode rather than trusting anything passed in from
// the client, and never reveals internal lookups/paths to the browser on
// failure — this is a customer-facing route.
//
// Source order (lib/models/msds.js resolveMsds): the [3AProducts] OSS URL
// first, then the [MSDS] table (by CAS number) whose PDF lives on the
// SAP-Attachments share.

import { resolveMsds, THREE_A_CATEGORY_NAME } from "../../../../lib/models/msds";
import { readShareFile, MSDS_SHARE_PATH } from "../../../../lib/shareFiles";

const NOT_AVAILABLE = { message: "MSDS not available for this item." };

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
    // Category isn't known here, so let the 3AProducts lookup run for any
    // item — a non-3A item simply has no cat_size_main match and falls
    // through to the share.
    const source = await resolveMsds(itemCode, THREE_A_CATEGORY_NAME);
    if (!source) {
      return res.status(404).json(NOT_AVAILABLE);
    }

    let pdfData;

    if (source.type === "url") {
      if (isHead) {
        const headResponse = await fetch(source.url, { method: "HEAD" });
        if (!headResponse.ok) return res.status(404).json(NOT_AVAILABLE);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Cache-Control", "no-cache");
        return res.status(200).end();
      }

      const response = await fetch(source.url);
      if (!response.ok) {
        console.error(`[msds/download] upstream fetch failed for ${itemCode}: HTTP ${response.status}`);
        return res.status(404).json(NOT_AVAILABLE);
      }
      pdfData = Buffer.from(await response.arrayBuffer());
    } else {
      const file = await readShareFile(MSDS_SHARE_PATH, source.fileName);
      if (!file) {
        console.error(`[msds/download] share file not readable for ${itemCode}`);
        return res.status(404).json(NOT_AVAILABLE);
      }
      pdfData = file.buffer;
      if (isHead) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", pdfData.length);
        res.setHeader("Cache-Control", "no-cache");
        return res.status(200).end();
      }
    }

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
