// pages/api/bluedart/update-delivery-date.js
// Warehouse-driven manual backfill for OINV.U_DeliveryDate — almost nothing
// in this codebase ever sets it automatically (unlike U_DispatchDate, which
// generate-waybill.js stamps itself for Blue Dart shipments), so it's left
// empty for the vast majority of invoices unless someone fills it in by
// hand. The warehouse team uploads an Excel of {waybill number, delivery
// date}; UpdateDeliveryDate.js (the frontend) parses it and posts here.
//
// SAFETY — this is the part that actually matters. OINV.TrackNo (the
// waybill number) is NOT a stable per-shipment key: the same value is
// reused across hundreds of unrelated invoices spanning the whole history
// of the account (confirmed directly against production data — one value
// alone matched 2,411 invoices going back to Nov 2025). A plain
// `UPDATE OINV SET U_DeliveryDate = @date WHERE TrackNo = @waybillNo` would
// silently overwrite the correct, already-recorded delivery date on every
// past shipment that ever used that same waybill number.
//
// So every match here is additionally scoped to `U_DeliveryDate IS NULL` —
// only invoices that HAVE this waybill number but have never had a delivery
// date set. That is exactly (and only) the backlog this feature exists to
// fill in, and it makes the whole operation idempotent: re-uploading the
// same file, or a file that happens to reuse an old waybill number, only
// ever touches rows still sitting empty, never a row some earlier upload
// already filled in.
//
// Two-phase flow (commit: false | true) — the frontend always previews the
// exact set of invoices before actually writing, since one row here can
// touch many invoices at once.

import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from "../../../lib/db";

const MAX_ROWS = 2000;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { rows, commit } = req.body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: "rows array is required" });
  }
  if (rows.length > MAX_ROWS) {
    return res.status(400).json({ error: `Too many rows — max ${MAX_ROWS} per upload` });
  }

  const isCommit = commit === true;
  const results = [];

  // Sequential on purpose: this writes real invoice data off a spreadsheet a
  // person just uploaded — a predictable, one-row-at-a-time trace in the
  // logs is worth more here than the speed of a Promise.all fan-out.
  for (const row of rows) {
    const waybillNo = String(row?.waybillNo ?? "").trim();
    const dateStr = String(row?.date ?? "").trim();

    if (!waybillNo) {
      results.push({ waybillNo: row?.waybillNo ?? "", date: dateStr, status: "error", message: "Missing waybill number" });
      continue;
    }
    const dateMatch = ISO_DATE_RE.exec(dateStr);
    if (!dateMatch) {
      results.push({ waybillNo, date: dateStr, status: "error", message: "Invalid date" });
      continue;
    }
    // Built with Date.UTC, not `new Date(dateStr + "T00:00:00")` — that local
    // form is parsed in whatever timezone this Node process runs in, and the
    // mssql driver (useUTC) then serializes a Date by its UTC fields. On a
    // server set to IST (confirmed: this one is), that silently shifted every
    // write back by 5:30 into the previous day (e.g. 29-Jul became
    // 2026-07-28 18:30:00.000 in the DB). Date.UTC fixes the UTC fields
    // directly to midnight on the intended calendar date, so the stored
    // value is correct regardless of the server's local timezone.
    const [, y, mo, d] = dateMatch.map(Number);
    const dateValue = new Date(Date.UTC(y, mo - 1, d));
    // Date.UTC rolls over out-of-range fields (e.g. month 13 -> next Jan)
    // instead of failing, so confirm it round-trips to the same y/m/d rather
    // than just checking it's not NaN.
    const roundTrips =
      dateValue.getUTCFullYear() === y && dateValue.getUTCMonth() === mo - 1 && dateValue.getUTCDate() === d;
    if (Number.isNaN(dateValue.getTime()) || !roundTrips) {
      results.push({ waybillNo, date: dateStr, status: "error", message: "Invalid date" });
      continue;
    }

    try {
      const totalRows = await queryDatabase(
        `SELECT COUNT(*) AS c FROM OINV WHERE LTRIM(RTRIM(TrackNo)) = @waybillNo`,
        [{ name: "waybillNo", type: sql.NVarChar(30), value: waybillNo }]
      );
      const total = totalRows[0]?.c || 0;

      const pending = await queryDatabase(
        `SELECT DocEntry, DocNum FROM OINV
         WHERE LTRIM(RTRIM(TrackNo)) = @waybillNo AND U_DeliveryDate IS NULL
         ORDER BY DocEntry`,
        [{ name: "waybillNo", type: sql.NVarChar(30), value: waybillNo }]
      );

      if (total === 0) {
        results.push({ waybillNo, date: dateStr, status: "not_found", message: "No invoice found with this waybill number", matched: 0 });
        continue;
      }

      if (pending.length === 0) {
        results.push({
          waybillNo, date: dateStr, status: "already_set",
          message: `Found ${total} invoice(s) with this number, but all already have a Delivery Date — nothing to update`,
          matched: total, docNums: [],
        });
        continue;
      }

      if (isCommit) {
        await queryDatabase(
          `UPDATE OINV SET U_DeliveryDate = @date
           WHERE LTRIM(RTRIM(TrackNo)) = @waybillNo AND U_DeliveryDate IS NULL`,
          [
            { name: "date", type: sql.DateTime, value: dateValue },
            { name: "waybillNo", type: sql.NVarChar(30), value: waybillNo },
          ]
        );
      }

      results.push({
        waybillNo, date: dateStr,
        status: isCommit ? "updated" : "pending",
        message: isCommit
          ? `Updated ${pending.length} invoice(s)`
          : `Will update ${pending.length} invoice(s)`,
        matched: pending.length,
        docNums: pending.map((r) => r.DocNum),
      });
    } catch (err) {
      console.error(`[update-delivery-date] row failed for waybill ${waybillNo}:`, err.message);
      results.push({ waybillNo, date: dateStr, status: "error", message: "Database error while processing this row" });
    }
  }

  const summary = {
    total: results.length,
    updated: results.filter((r) => r.status === "updated" || r.status === "pending").length,
    alreadySet: results.filter((r) => r.status === "already_set").length,
    notFound: results.filter((r) => r.status === "not_found").length,
    failed: results.filter((r) => r.status === "error").length,
  };

  return res.status(200).json({ success: true, commit: isCommit, summary, results });
}
