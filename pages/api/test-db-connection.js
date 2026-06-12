

// // pages/api/sync/sync-mismatches.js
// import sql from "mssql";

// const baseConfig = {
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   server: process.env.DB_SERVER,
//   options: {
//     encrypt: true,
//     trustServerCertificate: true,
//   },
//   connectionTimeout: 15000,
//   requestTimeout: 60000,
// };

// const MISMATCH_QUERY =
//   "SELECT cd.cat_size_main " +
//   "FROM TEST_DENSITY.dbo.chemical_density cd " +
//   "INNER JOIN DENSITY_LIVE.dbo.OITM o ON cd.cat_size_main = o.ItemCode " +
//   "LEFT JOIN DENSITY_LIVE.dbo.OITW ow ON o.ItemCode = ow.ItemCode " +
//   "OUTER APPLY ( " +
//   "  SELECT TOP 1 pr.U_Price, pr.U_PriceUSD " +
//   "  FROM DENSITY_LIVE.dbo.[@PRICING_H] ph " +
//   "  INNER JOIN DENSITY_LIVE.dbo.[@PRICING_R] pr ON ph.DocEntry = pr.DocEntry " +
//   "  WHERE ph.U_Code = o.ItemCode AND pr.U_Price IS NOT NULL " +
//   "  ORDER BY ph.DocEntry DESC " +
//   ") valid_price " +
//   "WHERE " +
//   "  ISNULL(ow.OnHand, 0) != cd.stock " +
//   "  OR o.U_WebsiteDisplay != cd.u_website_display " +
//   "  OR ( " +
//   "    NOT ( " +
//   "      (valid_price.U_Price IS NULL OR valid_price.U_Price = 0) " +
//   "      AND (cd.price_in_inr IS NULL OR cd.price_in_inr = 0) " +
//   "    ) " +
//   "    AND ( " +
//   "      valid_price.U_Price IS NULL OR cd.price_in_inr IS NULL OR valid_price.U_Price != cd.price_in_inr " +
//   "    ) " +
//   "  ) " +
//   "  OR ( " +
//   "    NOT ( " +
//   "      (valid_price.U_PriceUSD IS NULL OR valid_price.U_PriceUSD = 0) " +
//   "      AND (cd.price_usd IS NULL OR cd.price_usd = 0) " +
//   "    ) " +
//   "    AND ( " +
//   "      valid_price.U_PriceUSD IS NULL OR cd.price_usd IS NULL OR valid_price.U_PriceUSD != cd.price_usd " +
//   "    ) " +
//   "  )";

// function buildUpdateQuery(inClause) {
//   return (
//     "UPDATE cd " +
//     "SET " +
//     "  cd.stock = ISNULL(ow.OnHand, 0), " +
//     "  cd.stock_in_india = ISNULL(ow.OnHand, 0), " +
//     "  cd.stock_in_china = CASE " +
//     "    WHEN o.U_ChinaStock IS NULL OR o.U_ChinaStock = '' THEN 0 " +
//     "    WHEN ISNUMERIC(o.U_ChinaStock) = 1 THEN CAST(o.U_ChinaStock AS DECIMAL(18,4)) " +
//     "    WHEN o.U_ChinaStock LIKE '>%' AND ISNUMERIC(SUBSTRING(o.U_ChinaStock, 2, LEN(o.U_ChinaStock)-1)) = 1 " +
//     "      THEN CAST(SUBSTRING(o.U_ChinaStock, 2, LEN(o.U_ChinaStock)-1) AS DECIMAL(18,4)) " +
//     "    ELSE 0 END, " +
//     "  cd.price_in_inr = latest_price.U_Price, " +
//     "  cd.price_usd = latest_price.U_PriceUSD, " +
//     "  cd.u_website_display = o.U_WebsiteDisplay, " +
//     "  cd.UpdatedDate = GETDATE() " +
//     "FROM TEST_DENSITY.dbo.chemical_density cd " +
//     "INNER JOIN DENSITY_LIVE.dbo.OITM o ON cd.cat_size_main = o.ItemCode " +
//     "LEFT JOIN DENSITY_LIVE.dbo.OITW ow ON o.ItemCode = ow.ItemCode " +
//     "OUTER APPLY ( " +
//     "  SELECT TOP 1 pr.U_Price, pr.U_PriceUSD " +
//     "  FROM DENSITY_LIVE.dbo.[@PRICING_H] ph " +
//     "  INNER JOIN DENSITY_LIVE.dbo.[@PRICING_R] pr ON ph.DocEntry = pr.DocEntry " +
//     "  WHERE ph.U_Code = o.ItemCode AND pr.U_Price IS NOT NULL " +
//     "  ORDER BY ph.DocEntry DESC " +
//     ") latest_price " +
//     "WHERE cd.cat_size_main IN (" + inClause + ")"
//   );
// }

// function renderHTML(success, title, message, mismatchCount, updatedCount, items, error) {
//   var icon = success ? (mismatchCount === 0 ? "✅" : "🔄") : "❌";
//   var timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST";

//   var statsHTML = "";
//   if (success && mismatchCount > 0) {
//     var badgesHTML = "";
//     for (var i = 0; i < items.length; i++) {
//       badgesHTML += '<span class="item-badge">' + items[i] + "</span>";
//     }
//     statsHTML =
//       '<div class="stat-row">' +
//       '  <div class="stat orange"><div class="number">' + mismatchCount + '</div><div class="label">Mismatches Found</div></div>' +
//       '  <div class="stat green"><div class="number">' + updatedCount + '</div><div class="label">Records Fixed</div></div>' +
//       "</div>" +
//       '<div class="items-section">' +
//       '  <h2>Updated Items</h2>' +
//       '  <div class="items-grid">' + badgesHTML + "</div>" +
//       "</div>";
//   }

//   var noMismatchHTML = "";
//   if (success && mismatchCount === 0) {
//     noMismatchHTML = '<div class="no-mismatch">✅ Everything is already up to date. No changes were needed.</div>';
//   }

//   var errorHTML = "";
//   if (!success && error) {
//     errorHTML = '<div class="error-box"><strong>Error:</strong> ' + error + "</div>";
//   }

//   return (
//     "<!DOCTYPE html>" +
//     "<html lang='en'>" +
//     "<head>" +
//     "<meta charset='UTF-8'/>" +
//     "<meta name='viewport' content='width=device-width, initial-scale=1.0'/>" +
//     "<title>Database Sync | Density</title>" +
//     "<style>" +
//     "* { box-sizing: border-box; margin: 0; padding: 0; }" +
//     "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f5; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; padding: 40px 16px; }" +
//     ".card { background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 40px; max-width: 680px; width: 100%; }" +
//     ".icon { font-size: 48px; margin-bottom: 16px; }" +
//     "h1 { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px; }" +
//     ".subtitle { font-size: 15px; color: #666; margin-bottom: 28px; }" +
//     ".stat-row { display: flex; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }" +
//     ".stat { flex: 1; min-width: 140px; background: #f8f9fb; border-radius: 8px; padding: 16px 20px; text-align: center; }" +
//     ".stat .number { font-size: 32px; font-weight: 700; color: #1a1a2e; }" +
//     ".stat .label { font-size: 13px; color: #888; margin-top: 4px; }" +
//     ".stat.green .number { color: #16a34a; }" +
//     ".stat.orange .number { color: #d97706; }" +
//     ".items-section h2 { font-size: 14px; font-weight: 600; color: #444; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }" +
//     ".items-grid { display: flex; flex-wrap: wrap; gap: 8px; max-height: 300px; overflow-y: auto; padding: 4px 0; }" +
//     ".item-badge { background: #eef2ff; color: #3730a3; border-radius: 6px; padding: 4px 10px; font-size: 13px; font-family: monospace; }" +
//     ".error-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px 20px; color: #b91c1c; font-size: 14px; word-break: break-all; }" +
//     ".timestamp { margin-top: 24px; font-size: 12px; color: #aaa; text-align: right; }" +
//     ".no-mismatch { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; color: #15803d; font-size: 15px; text-align: center; }" +
//     "</style>" +
//     "</head>" +
//     "<body>" +
//     "<div class='card'>" +
//     "<div class='icon'>" + icon + "</div>" +
//     "<h1>" + title + "</h1>" +
//     "<p class='subtitle'>" + message + "</p>" +
//     errorHTML +
//     noMismatchHTML +
//     statsHTML +
//     "<div class='timestamp'>Run at: " + timestamp + "</div>" +
//     "</div>" +
//     "</body>" +
//     "</html>"
//   );
// }

// var ACCESS_DENIED_HTML =
//   "<!DOCTYPE html>" +
//   "<html lang='en'><head><meta charset='UTF-8'/><title>Access Denied | Density</title>" +
//   "<style>" +
//   "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }" +
//   ".card { background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 48px 40px; text-align: center; max-width: 400px; width: 100%; }" +
//   ".icon { font-size: 48px; margin-bottom: 16px; }" +
//   "h1 { font-size: 20px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px; }" +
//   "p { font-size: 14px; color: #888; }" +
//   "</style></head>" +
//   "<body><div class='card'>" +
//   "<div class='icon'>🔒</div>" +
//   "<h1>Access Denied</h1>" +
//   "<p>Invalid or missing access key. Please use the correct link provided to you.</p>" +
//   "</div></body></html>";

// export default async function handler(req, res) {
//   if (req.method !== "GET") {
//     return res.status(405).json({ message: "Method Not Allowed." });
//   }

//   // ── Secret key check ──────────────────────────────────────────────────────
//   // Boss uses: /api/sync/sync-mismatches?key=density@sync123
//   var key = req.query.key;
//   if (!key || key !== process.env.SYNC_SECRET_KEY) {
//     res.setHeader("Content-Type", "text/html");
//     return res.status(403).send(ACCESS_DENIED_HTML);
//   }

//   var pool = new sql.ConnectionPool({
//     ...baseConfig,
//     database: "master",
//   });

//   try {
//     await pool.connect();

//     // ── Step 1: Find mismatches ───────────────────────────────────────────────
//     var mismatchResult = await pool.request().query(MISMATCH_QUERY);
//     var mismatchedItems = mismatchResult.recordset.map(function(r) { return r.cat_size_main; });

//     if (mismatchedItems.length === 0) {
//       res.setHeader("Content-Type", "text/html");
//       return res.status(200).send(
//         renderHTML(true, "Database Sync Complete", "Checked the database - everything is already in sync!", 0, 0, [])
//       );
//     }

//     // ── Step 2: Update mismatched rows ────────────────────────────────────────
//     var inClause = mismatchedItems
//       .map(function(item) { return "'" + item.replace(/'/g, "''") + "'"; })
//       .join(", ");

//     var updateResult = await pool.request().query(buildUpdateQuery(inClause));
//     var rowsAffected = updateResult.rowsAffected && updateResult.rowsAffected[0] ? updateResult.rowsAffected[0] : 0;

//     res.setHeader("Content-Type", "text/html");
//     return res.status(200).send(
//       renderHTML(
//         true,
//         "Database Sync Complete",
//         "Found " + mismatchedItems.length + " mismatched item(s) and fixed them all successfully.",
//         mismatchedItems.length,
//         rowsAffected,
//         mismatchedItems
//       )
//     );

//   } catch (err) {
//     console.error("Sync error:", err.message);
//     res.setHeader("Content-Type", "text/html");
//     return res.status(500).send(
//       renderHTML(
//         false,
//         "Sync Failed",
//         "Something went wrong while syncing the database. Please contact the technical team.",
//         0,
//         0,
//         [],
//         err.message
//       )
//     );
//   } finally {
//     try { await pool.close(); } catch (_) {}
//   }
// }

// pages/api/sync/sync-mismatches.js
import sql from "mssql";

const baseConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  connectionTimeout: 15000,
  requestTimeout: 60000,
};

const MISMATCH_QUERY =
  "SELECT cd.cat_size_main " +
  "FROM TEST_DENSITY.dbo.chemical_density cd " +
  "INNER JOIN DENSITY_LIVE.dbo.OITM o ON cd.cat_size_main = o.ItemCode " +
  "LEFT JOIN DENSITY_LIVE.dbo.OITW ow ON o.ItemCode = ow.ItemCode " +
  "LEFT JOIN DENSITY_LIVE.dbo.OCHP ch ON o.ChapterID = ch.AbsEntry " +
  "OUTER APPLY ( " +
  "  SELECT TOP 1 pr.U_Price, pr.U_PriceUSD " +
  "  FROM DENSITY_LIVE.dbo.[@PRICING_H] ph " +
  "  INNER JOIN DENSITY_LIVE.dbo.[@PRICING_R] pr ON ph.DocEntry = pr.DocEntry " +
  "  WHERE ph.U_Code = o.ItemCode AND pr.U_Price IS NOT NULL " +
  "  ORDER BY ph.DocEntry DESC " +
  ") valid_price " +
  "WHERE " +
  "  ISNULL(ow.OnHand, 0) != cd.stock " +
  "  OR o.U_WebsiteDisplay != cd.u_website_display " +
  "  OR ( " +
  "    NOT ( " +
  "      (valid_price.U_Price IS NULL OR valid_price.U_Price = 0) " +
  "      AND (cd.price_in_inr IS NULL OR cd.price_in_inr = 0) " +
  "    ) " +
  "    AND ( " +
  "      valid_price.U_Price IS NULL OR cd.price_in_inr IS NULL OR valid_price.U_Price != cd.price_in_inr " +
  "    ) " +
  "  ) " +
  "  OR ( " +
  "    NOT ( " +
  "      (valid_price.U_PriceUSD IS NULL OR valid_price.U_PriceUSD = 0) " +
  "      AND (cd.price_usd IS NULL OR cd.price_usd = 0) " +
  "    ) " +
  "    AND ( " +
  "      valid_price.U_PriceUSD IS NULL OR cd.price_usd IS NULL OR valid_price.U_PriceUSD != cd.price_usd " +
  "    ) " +
  "  ) " +
  "  OR ISNULL(cd.hsn, '') != ISNULL(ch.ChapterID, '')";

function buildUpdateQuery(inClause) {
  return (
    "UPDATE cd " +
    "SET " +
    "  cd.stock = ISNULL(ow.OnHand, 0), " +
    "  cd.stock_in_india = ISNULL(ow.OnHand, 0), " +
    "  cd.stock_in_china = CASE " +
    "    WHEN o.U_ChinaStock IS NULL OR o.U_ChinaStock = '' THEN 0 " +
    "    WHEN ISNUMERIC(o.U_ChinaStock) = 1 THEN CAST(o.U_ChinaStock AS DECIMAL(18,4)) " +
    "    WHEN o.U_ChinaStock LIKE '>%' AND ISNUMERIC(SUBSTRING(o.U_ChinaStock, 2, LEN(o.U_ChinaStock)-1)) = 1 " +
    "      THEN CAST(SUBSTRING(o.U_ChinaStock, 2, LEN(o.U_ChinaStock)-1) AS DECIMAL(18,4)) " +
    "    ELSE 0 END, " +
    "  cd.price_in_inr = latest_price.U_Price, " +
    "  cd.price_usd = latest_price.U_PriceUSD, " +
    "  cd.u_website_display = o.U_WebsiteDisplay, " +
    "  cd.hsn = ch.ChapterID, " +
    "  cd.UpdatedDate = GETDATE() " +
    "FROM TEST_DENSITY.dbo.chemical_density cd " +
    "INNER JOIN DENSITY_LIVE.dbo.OITM o ON cd.cat_size_main = o.ItemCode " +
    "LEFT JOIN DENSITY_LIVE.dbo.OITW ow ON o.ItemCode = ow.ItemCode " +
    "LEFT JOIN DENSITY_LIVE.dbo.OCHP ch ON o.ChapterID = ch.AbsEntry " +
    "OUTER APPLY ( " +
    "  SELECT TOP 1 pr.U_Price, pr.U_PriceUSD " +
    "  FROM DENSITY_LIVE.dbo.[@PRICING_H] ph " +
    "  INNER JOIN DENSITY_LIVE.dbo.[@PRICING_R] pr ON ph.DocEntry = pr.DocEntry " +
    "  WHERE ph.U_Code = o.ItemCode AND pr.U_Price IS NOT NULL " +
    "  ORDER BY ph.DocEntry DESC " +
    ") latest_price " +
    "WHERE cd.cat_size_main IN (" + inClause + ")"
  );
}

function renderHTML(success, title, message, mismatchCount, updatedCount, items, error) {
  var icon = success ? (mismatchCount === 0 ? "✅" : "🔄") : "❌";
  var timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST";

  var statsHTML = "";
  if (success && mismatchCount > 0) {
    var badgesHTML = "";
    for (var i = 0; i < items.length; i++) {
      badgesHTML += '<span class="item-badge">' + items[i] + "</span>";
    }
    statsHTML =
      '<div class="stat-row">' +
      '  <div class="stat orange"><div class="number">' + mismatchCount + '</div><div class="label">Mismatches Found</div></div>' +
      '  <div class="stat green"><div class="number">' + updatedCount + '</div><div class="label">Records Fixed</div></div>' +
      "</div>" +
      '<div class="items-section">' +
      '  <h2>Updated Items (Stock, Price, Website Display, HSN)</h2>' +
      '  <div class="items-grid">' + badgesHTML + "</div>" +
      "</div>";
  }

  var noMismatchHTML = "";
  if (success && mismatchCount === 0) {
    noMismatchHTML = '<div class="no-mismatch">✅ Everything is already up to date. No changes were needed.</div>';
  }

  var errorHTML = "";
  if (!success && error) {
    errorHTML = '<div class="error-box"><strong>Error:</strong> ' + error + "</div>";
  }

  return (
    "<!DOCTYPE html>" +
    "<html lang='en'>" +
    "<head>" +
    "<meta charset='UTF-8'/>" +
    "<meta name='viewport' content='width=device-width, initial-scale=1.0'/>" +
    "<title>Database Sync | Density</title>" +
    "<style>" +
    "* { box-sizing: border-box; margin: 0; padding: 0; }" +
    "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f5; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; padding: 40px 16px; }" +
    ".card { background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 40px; max-width: 680px; width: 100%; }" +
    ".icon { font-size: 48px; margin-bottom: 16px; }" +
    "h1 { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px; }" +
    ".subtitle { font-size: 15px; color: #666; margin-bottom: 28px; }" +
    ".stat-row { display: flex; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }" +
    ".stat { flex: 1; min-width: 140px; background: #f8f9fb; border-radius: 8px; padding: 16px 20px; text-align: center; }" +
    ".stat .number { font-size: 32px; font-weight: 700; color: #1a1a2e; }" +
    ".stat .label { font-size: 13px; color: #888; margin-top: 4px; }" +
    ".stat.green .number { color: #16a34a; }" +
    ".stat.orange .number { color: #d97706; }" +
    ".items-section h2 { font-size: 14px; font-weight: 600; color: #444; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }" +
    ".items-grid { display: flex; flex-wrap: wrap; gap: 8px; max-height: 300px; overflow-y: auto; padding: 4px 0; }" +
    ".item-badge { background: #eef2ff; color: #3730a3; border-radius: 6px; padding: 4px 10px; font-size: 13px; font-family: monospace; }" +
    ".error-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px 20px; color: #b91c1c; font-size: 14px; word-break: break-all; }" +
    ".timestamp { margin-top: 24px; font-size: 12px; color: #aaa; text-align: right; }" +
    ".no-mismatch { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; color: #15803d; font-size: 15px; text-align: center; }" +
    "</style>" +
    "</head>" +
    "<body>" +
    "<div class='card'>" +
    "<div class='icon'>" + icon + "</div>" +
    "<h1>" + title + "</h1>" +
    "<p class='subtitle'>" + message + "</p>" +
    errorHTML +
    noMismatchHTML +
    statsHTML +
    "<div class='timestamp'>Run at: " + timestamp + "</div>" +
    "</div>" +
    "</body>" +
    "</html>"
  );
}

var ACCESS_DENIED_HTML =
  "<!DOCTYPE html>" +
  "<html lang='en'><head><meta charset='UTF-8'/><title>Access Denied | Density</title>" +
  "<style>" +
  "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }" +
  ".card { background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 48px 40px; text-align: center; max-width: 400px; width: 100%; }" +
  ".icon { font-size: 48px; margin-bottom: 16px; }" +
  "h1 { font-size: 20px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px; }" +
  "p { font-size: 14px; color: #888; }" +
  "</style></head>" +
  "<body><div class='card'>" +
  "<div class='icon'>🔒</div>" +
  "<h1>Access Denied</h1>" +
  "<p>Invalid or missing access key. Please use the correct link provided to you.</p>" +
  "</div></body></html>";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed." });
  }

  // ── Secret key check ──────────────────────────────────────────────────────
  // Boss uses: /api/sync/sync-mismatches?key=density@sync123
  var key = req.query.key;
  if (!key || key !== process.env.SYNC_SECRET_KEY) {
    res.setHeader("Content-Type", "text/html");
    return res.status(403).send(ACCESS_DENIED_HTML);
  }

  var pool = new sql.ConnectionPool({
    ...baseConfig,
    database: "master",
  });

  try {
    await pool.connect();

    // ── Step 1: Find mismatches ───────────────────────────────────────────────
    var mismatchResult = await pool.request().query(MISMATCH_QUERY);
    var mismatchedItems = mismatchResult.recordset.map(function(r) { return r.cat_size_main; });

    if (mismatchedItems.length === 0) {
      res.setHeader("Content-Type", "text/html");
      return res.status(200).send(
        renderHTML(true, "Database Sync Complete", "Checked the database - everything is already in sync!", 0, 0, [])
      );
    }

    // ── Step 2: Update mismatched rows ────────────────────────────────────────
    var inClause = mismatchedItems
      .map(function(item) { return "'" + item.replace(/'/g, "''") + "'"; })
      .join(", ");

    var updateResult = await pool.request().query(buildUpdateQuery(inClause));
    var rowsAffected = updateResult.rowsAffected && updateResult.rowsAffected[0] ? updateResult.rowsAffected[0] : 0;

    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(
      renderHTML(
        true,
        "Database Sync Complete",
        "Found " + mismatchedItems.length + " mismatched item(s) and fixed them all successfully.",
        mismatchedItems.length,
        rowsAffected,
        mismatchedItems
      )
    );

  } catch (err) {
    console.error("Sync error:", err.message);
    res.setHeader("Content-Type", "text/html");
    return res.status(500).send(
      renderHTML(
        false,
        "Sync Failed",
        "Something went wrong while syncing the database. Please contact the technical team.",
        0,
        0,
        [],
        err.message
      )
    );
  } finally {
    try { await pool.close(); } catch (_) {}
  }
}