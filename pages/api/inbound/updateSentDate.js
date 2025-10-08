// pages/api/inbound/updateSentDate.js
import { queryDatabase } from "lib/db";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
  try {
    const { boeSbNo, sentDate } = req.body;
    await queryDatabase(`
      UPDATE InboundShipments
      SET SentDate = @sentDate
      WHERE BOESBNo = @boeSbNo
    `, [
      { name: "sentDate", type: sql.DateTime, value: sentDate },
      { name: "boeSbNo", type: sql.NVarChar, value: boeSbNo }
    ]);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error updating sent date:", err);
    return res.status(500).json({ error: err.message });
  }
}
