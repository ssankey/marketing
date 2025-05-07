// pages/api/email/setup-trigger.js

import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const triggerSQL = `
      CREATE OR ALTER TRIGGER trg_send_dispatch_email
      ON OINV
      AFTER UPDATE
      AS
      BEGIN
          IF UPDATE(TrackNo)
          BEGIN
              INSERT INTO TrackNoUpdateLog (
                  DocEntry, DocNum, CardCode, CardName, TrackNo, UpdatedAt, EmailSent
              )
              SELECT 
                  i.DocEntry, 
                  i.DocNum, 
                  i.CardCode, 
                  i.CardName, 
                  i.TrackNo, 
                  GETDATE(), 
                  0
              FROM inserted i;
          END
      END
    `;

    await queryDatabase(triggerSQL);

    return res
      .status(200)
      .json({
        success: true,
        message: "Trigger created or updated successfully.",
      });
  } catch (error) {
    console.error("Error creating trigger:", error);
    return res.status(500).json({ error: "Failed to create trigger." });
  }
}
