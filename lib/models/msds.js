// lib/models/msds.js
// MSDS/Specs lookup for 3A-chemical items — neither PDF is stored in the
// main SAP DB, they live in the TEST_DENSITY server's [3AProducts] table
// (msds_d / specs_d columns), keyed by that table's own cat_size_main, which
// carries a 3-character vendor-company prefix our own ItemCode doesn't have
// (e.g. the sample MSDS URL's own filename is prefixed "A01..."; the
// stock-sync job (pages/api/sync/stock-sync-3a.js) strips a specific "M40"
// prefix for a different field/table, but here it's always exactly the
// first 3 chars, confirmed by the user directly). One of each per ItemCode —
// no per-batch/lot variation like COA has.
//
// Confirmed against components/ProductsTable.js:217 — the real
// OITB.ItmsGrpNam string for this category is exactly "3A Chemicals".

import sql from "mssql";
import { queryTestDensity } from "../testDensityDb";
import { queryDatabase } from "../db";

export const THREE_A_CATEGORY_NAME = "3A Chemicals";

export const isThreeAChemical = (category) =>
  (category || "").trim().toLowerCase() === THREE_A_CATEGORY_NAME.toLowerCase();

const getThreeAProductsDocUrl = async (itemCode, column) => {
  if (!itemCode) return null;
  try {
    const rows = await queryTestDensity(
      `SELECT TOP 1 ${column} AS docUrl
       FROM [3AProducts]
       WHERE SUBSTRING(cat_size_main, 4, LEN(cat_size_main)) = @itemCode
         AND ${column} IS NOT NULL AND LTRIM(RTRIM(${column})) <> ''`,
      [{ name: "itemCode", type: sql.NVarChar, value: itemCode }]
    );
    return rows[0]?.docUrl?.trim() || null;
  } catch (err) {
    // Never let a lookup failure block the invoice email/page/product list —
    // just log it server-side and treat as "not available".
    console.error(`[3AProducts] ${column} lookup failed for ItemCode ${itemCode}:`, err.message);
    return null;
  }
};

export const getMsdsUrl = (itemCode) => getThreeAProductsDocUrl(itemCode, "msds_d");
export const getSpecsUrl = (itemCode) => getThreeAProductsDocUrl(itemCode, "specs_d");

// Fallback MSDS source for everything [3AProducts] doesn't cover (non-3A
// categories, or a 3A item whose msds_d is empty): the TEST_DENSITY [MSDS]
// table maps a CAS number (unique) to a PDF file name, and that file sits in
// the MSDS folder on the SAP-Attachments share (lib/shareFiles.js). A row in
// the table means the file is on the share.
const getCasNo = async (itemCode) => {
  const rows = await queryDatabase(
    `SELECT TOP 1 U_CasNo FROM OITM WHERE ItemCode = @itemCode`,
    [{ name: "itemCode", type: sql.NVarChar, value: itemCode }]
  );
  return rows[0]?.U_CasNo?.trim() || null;
};

export const getShareMsdsFileName = async (itemCode) => {
  if (!itemCode) return null;
  try {
    const casNo = await getCasNo(itemCode);
    if (!casNo) return null;
    const rows = await queryTestDensity(
      `SELECT TOP 1 msds_file_name
       FROM [MSDS]
       WHERE LTRIM(RTRIM(cas_no)) = @casNo
         AND ISNULL(isActive, 'Yes') <> 'No'
         AND msds_file_name IS NOT NULL AND LTRIM(RTRIM(msds_file_name)) <> ''
       ORDER BY id DESC`,
      [{ name: "casNo", type: sql.NVarChar, value: casNo }]
    );
    return rows[0]?.msds_file_name?.trim() || null;
  } catch (err) {
    console.error(`[MSDS table] lookup failed for ItemCode ${itemCode}:`, err.message);
    return null;
  }
};

// Resolution order: 3A category -> [3AProducts].msds_d (OSS URL); otherwise,
// or when that URL is missing -> [MSDS] table file on the network share.
// Returns { type: "url", url } | { type: "share", fileName } | null.
export const resolveMsds = async (itemCode, category) => {
  if (!itemCode) return null;
  if (isThreeAChemical(category)) {
    const url = await getMsdsUrl(itemCode);
    if (url) return { type: "url", url };
  }
  const fileName = await getShareMsdsFileName(itemCode);
  return fileName ? { type: "share", fileName } : null;
};

// Resolves MSDS availability for a batch of {ItemCode, Category} rows in
// parallel (once per distinct ItemCode). row.MsdsUrl is only used as a
// truthy "an MSDS exists" flag — the actual download always goes through
// /api/msds/download/[itemCode], which re-resolves server-side.
export const attachMsdsUrls = async (rows, getItemCode = (r) => r.ItemCode, getCategory = (r) => r.Category) => {
  const cache = new Map();
  await Promise.all(
    rows.map(async (row) => {
      const itemCode = getItemCode(row);
      if (!itemCode) {
        row.MsdsUrl = null;
        return;
      }
      if (!cache.has(itemCode)) {
        cache.set(itemCode, resolveMsds(itemCode, getCategory(row)));
      }
      const found = await cache.get(itemCode);
      row.MsdsUrl = found ? (found.url || found.fileName) : null;
    })
  );
  return rows;
};
