// lib/models/salesHierarchy.js
//
// Some senior people sit above a salesperson and want to see/be notified of
// that salesperson's data too. This mapping is recorded on OHEM (SAP's
// Employee Master): OHEM.firstName matches the senior person's own
// OSLP.SlpName (they're also a real salesperson in their own right), and
// OHEM.salesPrson holds the SlpCode of the subordinate salesperson they're
// mapped to.
//
// Example (verified against live data): OSLP SlpCode 25 = "Gulam Khadar
// Khaise". OHEM has a row with firstName = "Gulam Khadar Khaise" and
// salesPrson = 18 ("Hemanth V"). So Gulam should also see/be CC'd on
// Hemanth's (SlpCode 18) data.
import { queryDatabase } from "../db";
import sql from "mssql";

// Login-time direction: given the SlpCode/SlpName of the person logging in
// via OSLP, returns their contactCodes array enriched with any subordinate
// SlpCode mapped to them in OHEM.salesPrson (or just [slpCode] if none).
export async function getEnrichedContactCodes(slpCode, slpName) {
  const codes = [String(slpCode)];
  if (!slpName) return codes;

  try {
    const rows = await queryDatabase(
      `
      SELECT TOP 1 salesPrson
      FROM OHEM
      WHERE firstName = @slpName
        AND salesPrson IS NOT NULL
        AND salesPrson <> 0
      `,
      [{ name: "slpName", type: sql.NVarChar, value: slpName }]
    );

    const mappedSlpCode = rows[0]?.salesPrson;
    if (mappedSlpCode && String(mappedSlpCode) !== String(slpCode)) {
      codes.push(String(mappedSlpCode));
    }
  } catch (err) {
    console.error("[salesHierarchy] Failed to enrich contactCodes:", err.message);
  }

  return codes;
}

// CC-time direction (the reverse lookup): given the SlpCode found on an
// order/invoice, checks whether that SlpCode is mapped as someone's
// subordinate in OHEM.salesPrson, and if that OHEM person is themselves a
// real OSLP salesperson (matched by name), returns their email so they can
// be CC'd alongside the direct salesperson. Returns null if no such mapping
// exists.
export async function getManagerEmailForSlpCode(slpCode) {
  if (slpCode === undefined || slpCode === null || slpCode === "") return null;
  const numericSlpCode = parseInt(slpCode, 10);
  if (Number.isNaN(numericSlpCode)) return null;

  try {
    const rows = await queryDatabase(
      `
      SELECT TOP 1 S.SlpCode, S.SlpName, S.Email
      FROM OHEM H
      INNER JOIN OSLP S ON S.SlpName = H.firstName
      WHERE H.salesPrson = @slpCode
      `,
      [{ name: "slpCode", type: sql.Int, value: numericSlpCode }]
    );

    const match = rows[0];
    if (!match || !match.Email || !match.Email.trim()) return null;

    return { slpCode: match.SlpCode, slpName: match.SlpName, email: match.Email.trim() };
  } catch (err) {
    console.error("[salesHierarchy] Failed to look up manager email:", err.message);
    return null;
  }
}
