
// lib/models/quotation.js

import { queryDatabase } from "../db";

export async function getQuotations() {
  const data = await queryDatabase(
    // "SELECT * FROM oqut t1 inner join qut1 t0 on t0.BaseRef = t1.Docnum "
    "SELECT * FROM oqut"
    // "SELECT * FROM qut1"
    // "SELECT t1.*, t0.ItemCode, t0.Dscription FROM oqut t1 LEFT JOIN qut1 t0 ON t1.DocNum = t0.BaseRef"
  );
  return data;
}

export async function getQuotationDetail(id) {
  const data = await queryDatabase(`SELECT * FROM qut1`);
  return data;
}