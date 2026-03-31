// pages/api/download-chemical-density.js
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

const FETCH_QUERY =
  "SELECT " +
  "  id, cat_size_main, english, cat_no, cas, molecular_formula, molecular_weight, " +
  "  specs_d, msds_d, purity, smiles, item_group, u_website_display, " +
  "  u_cat_update_time_stamp, melting_point, boiling_point, un_number, " +
  "  stock_in_india, u_quantity, uom, price_in_inr, cat_size, stock_in_china, " +
  "  stock, price_usd, item_brand, CreatedDate, UpdatedDate, Hazardous, StorageCondition " +
  "FROM TEST_DENSITY.dbo.chemical_density " +
  "ORDER BY id ASC";

// Convert rows to CSV string
function toCSV(rows) {
  if (!rows || rows.length === 0) return "";

  var headers = Object.keys(rows[0]);
  var lines = [];

  // Header row
  lines.push(headers.map(function(h) { return '"' + h + '"'; }).join(","));

  // Data rows
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var values = headers.map(function(h) {
      var val = row[h];
      if (val === null || val === undefined) return '""';
      var str = String(val);
      // Escape double quotes
      str = str.replace(/"/g, '""');
      return '"' + str + '"';
    });
    lines.push(values.join(","));
  }

  return lines.join("\r\n");
}

var PAGE_HTML =
  "<!DOCTYPE html>" +
  "<html lang='en'>" +
  "<head>" +
  "<meta charset='UTF-8'/>" +
  "<meta name='viewport' content='width=device-width, initial-scale=1.0'/>" +
  "<title>Download Chemical Density | Density</title>" +
  "<style>" +
  "* { box-sizing: border-box; margin: 0; padding: 0; }" +
  "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; }" +
  ".card { background: #fff; border-radius: 16px; box-shadow: 0 4px 32px rgba(0,0,0,0.10); padding: 48px 40px; max-width: 440px; width: 100%; text-align: center; }" +
  ".db-icon { font-size: 56px; margin-bottom: 20px; }" +
  "h1 { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px; }" +
  "p { font-size: 14px; color: #888; margin-bottom: 32px; line-height: 1.6; }" +
  ".btn { display: inline-flex; align-items: center; gap: 10px; background: #1d4ed8; color: #fff; border: none; border-radius: 10px; padding: 14px 28px; font-size: 15px; font-weight: 600; cursor: pointer; text-decoration: none; transition: background 0.2s; }" +
  ".btn:hover { background: #1e40af; }" +
  ".btn .icon { font-size: 18px; }" +
  ".meta { margin-top: 24px; font-size: 12px; color: #bbb; }" +
  "</style>" +
  "</head>" +
  "<body>" +
  "<div class='card'>" +
  "<div class='db-icon'>🧪</div>" +
  "<h1>Chemical Density Data</h1>" +
  "<p>Click the button below to download the complete Chemical Density table as a CSV file.</p>" +
  "<a class='btn' href='/api/download-chemical-density?download=true'>" +
  "<span class='icon'>⬇️</span> Download Chemical_Density" +
  "</a>" +
  "<div class='meta'>Source: TEST_DENSITY database</div>" +
  "</div>" +
  "</body>" +
  "</html>";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed." });
  }

  // If no ?download=true, just show the UI page
  if (!req.query.download) {
    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(PAGE_HTML);
  }

  // ?download=true — fetch data and stream CSV
  var pool = new sql.ConnectionPool({
    ...baseConfig,
    database: "master",
  });

  try {
    await pool.connect();

    var result = await pool.request().query(FETCH_QUERY);
    var rows = result.recordset;

    if (!rows || rows.length === 0) {
      res.setHeader("Content-Type", "text/html");
      return res.status(200).send(
        "<div style='font-family:sans-serif;text-align:center;padding:60px'>" +
        "<h2>⚠️ No data found in chemical_density table.</h2>" +
        "</div>"
      );
    }

    var csv = toCSV(rows);
    var filename = "Chemical_Density_" + new Date().toISOString().slice(0, 10) + ".csv";

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=" + filename);
    return res.status(200).send(csv);

  } catch (err) {
    console.error("Download error:", err.message);
    res.setHeader("Content-Type", "text/html");
    return res.status(500).send(
      "<div style='font-family:sans-serif;text-align:center;padding:60px;color:#b91c1c'>" +
      "<h2>❌ Failed to fetch data</h2>" +
      "<p>" + err.message + "</p>" +
      "</div>"
    );
  } finally {
    try { await pool.close(); } catch (_) {}
  }
}