// pages/api/delivery-orders/download-pickslip/[docNum].js
// Fetches a Delivery Order's Pick Slip PDF from the shared network path.
// Filenames follow "Pick_Slip_<DeliveryDocNum>_<YYYYMMDD>_<HHMMSS>.pdf" —
// the trailing date/time is the moment the pick slip was generated, which
// isn't stored anywhere queryable, so (same as
// pages/api/invoices/download-pdf/[docNum].js's signed-PDF lookup) this
// lists the folder and matches on the "Pick_Slip_<docNum>_" prefix rather
// than requiring the exact filename. Shared by both the Open DO page
// (components/openDO/openDOColumns.js) and the All Line Orders page
// (components/ordersLine/ordersLineColumns.js) via components/shared/PickSlipButton.js.

import fs from "fs";
import path from "path";
import { promisify } from "util";

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

export default async function handler(req, res) {
  const { docNum } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (!docNum || isNaN(docNum)) {
    return res.status(400).json({ message: "Invalid DocNum provided" });
  }

  try {
    const basePath = process.env.PICK_SLIP_NETWORK_PATH;

    let files;
    try {
      files = await readdir(basePath);
    } catch (err) {
      console.error("Pick Slip folder access error:", err);
      return res.status(404).json({ message: "Pick Slip folder not found", path: basePath, error: err.message });
    }

    const prefix = `pick_slip_${docNum}_`.toLowerCase();
    const pickSlipFile = files.find(
      (file) => file.toLowerCase().startsWith(prefix) && file.toLowerCase().endsWith(".pdf")
    );

    if (!pickSlipFile) {
      return res.status(404).json({ message: "Pick Slip PDF not found for this delivery", availableFiles: files });
    }

    const filePath = path.join(basePath, pickSlipFile);
    const fileData = await readFile(filePath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Pick_Slip_${docNum}.pdf"`);
    return res.send(fileData);
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

export const config = {
  api: {
    responseLimit: "50mb",
    externalResolver: true,
  },
};
