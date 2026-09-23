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

// Resolves MSDS URLs for a batch of {ItemCode, Category} rows in parallel,
// skipping the cross-server round trip entirely for non-3A items.
export const attachMsdsUrls = async (rows, getItemCode = (r) => r.ItemCode, getCategory = (r) => r.Category) => {
  const msdsCache = new Map();
  await Promise.all(
    rows.map(async (row) => {
      const itemCode = getItemCode(row);
      if (!isThreeAChemical(getCategory(row)) || !itemCode) {
        row.MsdsUrl = null;
        return;
      }
      if (!msdsCache.has(itemCode)) {
        msdsCache.set(itemCode, getMsdsUrl(itemCode));
      }
      row.MsdsUrl = await msdsCache.get(itemCode);
    })
  );
  return rows;
};
