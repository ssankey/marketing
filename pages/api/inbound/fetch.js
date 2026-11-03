// api/inbound/fetch.js
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { boeSbNo } = req.query;

    if (!boeSbNo) {
      return res.status(400).json({ error: "BOE/SB No is required" });
    }

    // 🔹 Get main record
    const recordQuery = `
      SELECT *
      FROM ImportExportRecords
      WHERE BOESBNo = @boeSbNo
    `;
    const recordParams = [
      { name: "boeSbNo", type: sql.NVarChar(100), value: boeSbNo },
    ];
    const recordResult = await queryDatabase(recordQuery, recordParams);

    if (recordResult.length === 0) {
      return res.status(404).json({ error: "No record found" });
    }

    const record = recordResult[0];

    // 🔹 Get attachments
    const attachQuery = `
      SELECT AttachmentID, FieldKey, FileLink, UploadedAt
      FROM ImportExportAttachments
      WHERE BOESBNo = @boeSbNo
      ORDER BY FieldKey, AttachmentID
    `;
    const attachResult = await queryDatabase(attachQuery, recordParams);

    res.status(200).json({
      record,
      attachments: attachResult,
    });
  } catch (error) {
    console.error("Error fetching inbound record:", error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
}
