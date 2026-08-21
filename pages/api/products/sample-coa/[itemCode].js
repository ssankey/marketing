// pages/api/products/sample-coa/[itemCode].js
// A product can have many lots, each with its own COA — but not every lot's
// COA actually resolves (missing file on the share, missing Energy upload,
// etc.), same as what the product detail page's per-row availability check
// already surfaces. This tries every lot (best stock first, same order as
// the product detail page), same as generateCoaUrl()/checkCoaAvailability()
// there, and streams back the first one that actually downloads — so a
// single "Sample COA" button on Product Master always gets something
// instead of needing the user to hunt through lots themselves.
import { queryDatabase } from "../../../../lib/db";
import sql from "mssql";

function getBaseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host;
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { itemCode } = req.query;
  if (!itemCode || !itemCode.trim()) {
    return res.status(400).json({ message: "itemCode is required" });
  }
  const trimmedItemCode = itemCode.trim();

  try {
    const batches = await queryDatabase(
      `
      SELECT DISTINCT
        B.BatchNum                                        AS BatchNum,
        ISNULL(B.U_vendorbatchno, '')                     AS VendorBatchNum,
        B.Quantity                                         AS Quantity,
        EC.EffectiveCOA                                    AS LocalCOAFilename,
        CASE
            WHEN EC.EffectiveCOA IS NOT NULL THEN 'LOCAL'
            WHEN ISNULL(B.U_vendorbatchno, '') <> '' THEN 'ENERGY'
            ELSE 'NONE'
        END AS CoaSource
      FROM OIBT B
      -- Same batch number is sometimes only attached to the "-SPEC" item code
      -- instead of the specific pack-size item code — fall back to that.
      LEFT JOIN OIBT SPEC_B
        ON SPEC_B.ItemCode = LEFT(B.ItemCode, CHARINDEX('-', B.ItemCode + '-') - 1) + '-SPEC'
       AND SPEC_B.BatchNum = B.BatchNum
      CROSS APPLY (
        SELECT COALESCE(
          NULLIF(LTRIM(RTRIM(CAST(B.U_COA AS NVARCHAR(MAX)))), ''),
          NULLIF(LTRIM(RTRIM(CAST(SPEC_B.U_COA AS NVARCHAR(MAX)))), '')
        ) AS EffectiveCOA
      ) EC
      WHERE B.ItemCode = @itemCode
        AND (EC.EffectiveCOA IS NOT NULL OR ISNULL(B.U_vendorbatchno, '') <> '')
      ORDER BY B.Quantity DESC, VendorBatchNum
      `,
      [{ name: "itemCode", type: sql.NVarChar, value: trimmedItemCode }]
    );

    const baseUrl = getBaseUrl(req);

    for (const batch of batches) {
      let downloadUrl = null;

      if (batch.CoaSource === "LOCAL" && batch.LocalCOAFilename) {
        let filename = String(batch.LocalCOAFilename).trim();
        if (filename.includes("\\")) filename = filename.split("\\").pop();
        if (filename.includes("/")) filename = filename.split("/").pop();
        downloadUrl = `${baseUrl}/api/coa/download/${encodeURIComponent(filename)}`;
      } else if (batch.CoaSource === "ENERGY" && batch.VendorBatchNum) {
        downloadUrl = `${baseUrl}/api/coa/download-energy/${encodeURIComponent(trimmedItemCode)}/${encodeURIComponent(String(batch.VendorBatchNum).trim())}`;
      } else {
        continue;
      }

      try {
        // HEAD first — same cheap existence check the product detail page's
        // CoaCell does — before pulling the whole file through.
        const headRes = await fetch(downloadUrl, { method: "HEAD" });
        if (!headRes.ok) continue;

        const getRes = await fetch(downloadUrl, { method: "GET" });
        if (!getRes.ok) continue;

        const buf = Buffer.from(await getRes.arrayBuffer());
        if (buf.slice(0, 4).toString() !== "%PDF") continue;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${encodeURIComponent(trimmedItemCode)}_Sample_COA.pdf"`
        );
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        return res.send(buf);
      } catch (fetchErr) {
        console.error(`Sample COA: lot ${batch.BatchNum} failed`, fetchErr.message);
        continue;
      }
    }

    return res.status(404).json({ message: "No working COA found for this product across any lot." });
  } catch (err) {
    console.error("Sample COA error:", err);
    return res.status(500).json({ message: "Failed to fetch sample COA", error: err.message });
  }
}

export const config = {
  api: {
    responseLimit: "50mb",
  },
};
