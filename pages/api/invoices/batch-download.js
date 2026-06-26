// pages/api/invoices/batch-download.js
import fs from "fs";
import path from "path";
import { promisify } from "util";

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { docNums } = req.body; // expect array
  if (!Array.isArray(docNums) || docNums.length === 0) {
    return res.status(400).json({ message: "docNums array is required" });
  }

  const basePath = process.env.INVOICE_PDF_NETWORK_PATH;
  const downloadDir = "C:\\Users\\prakash\\invoice-downloaded";

  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  const results = [];

  for (const docNum of docNums) {
    try {
      const signedPath = path.join(basePath, String(docNum));
      const files = await readdir(signedPath);

      const pdfFile = files.find(
        (file) =>
          file.toLowerCase().includes(`invoice_${docNum.toString().toLowerCase()}`) &&
          file.toLowerCase().endsWith(".pdf")
      );

      if (!pdfFile) {
        results.push({ docNum, status: "failed", reason: "PDF not found" });
        continue;
      }

      const filePath = path.join(signedPath, pdfFile);
      const fileData = await readFile(filePath);

      // Save to local download folder
      const destPath = path.join(downloadDir, `Invoice_${docNum}.pdf`);
      await writeFile(destPath, fileData);

      results.push({ docNum, status: "success", savedTo: destPath });
    } catch (err) {
      results.push({ docNum, status: "failed", reason: err.message });
    }
  }

  return res.status(200).json({
    message: "Batch download complete",
    results,
  });
}

export const config = {
  api: {
    responseLimit: "100mb",
    externalResolver: true,
  },
};
