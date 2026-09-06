// lib/models/deliveryOrders.js
// Line-level Delivery Orders (ODLN/DLN1), for the "Open DO" table on the
// Open Orders page (pages/open-orders/index.js) — same shape/pagination
// pattern as getOrdersLineFromDatabase in lib/models/orders.js, built from
// the DO query supplied by the user: DO lines joined back to their
// originating Sales Order line (RDR1/ORDR) via BaseEntry/BaseLine/BaseType=17
// (LEFT JOIN — a DO line need not always trace back to a live SO row).
//
// Status here is Open/Closed/Canceled (no "All"), because unlike the Sales
// Order lines page this table defaults to "open" and is meant to always show
// one specific state at a time. LineStatus ('O'/'C') from DLN1 gives
// Open/Closed; ODLN.CANCELED (Y/N/C convention, same as ORIN/OINV elsewhere
// in this codebase) gives Canceled, and is excluded from the Open/Closed
// counts the same way the user's own query already excluded it
// (WHERE T0.CANCELED = 'N').

import { queryDatabase } from "../db";

const escapeLike = (s) => s.replace(/'/g, "''");

export async function getDeliveryOrdersLineFromDatabase({
  page = 1,
  search = "",
  status = "open",
  fromDate,
  toDate,
  sortField = "DeliveryDate",
  sortDir = "desc",
  itemsPerPage = 20,
  isAdmin = false,
  contactCodes = [],
  cardCodes = [],
  getAll = false,
}) {
  const offset = getAll ? 0 : (page - 1) * itemsPerPage;

  let whereClause = "1=1";

  // 1) Search filter
  if (search && search.trim()) {
    const searchTerm = escapeLike(search.trim());
    whereClause += ` AND (
      T0.DocNum LIKE '%${searchTerm}%' OR
      T0.CardCode LIKE '%${searchTerm}%' OR
      T0.CardName LIKE '%${searchTerm}%' OR
      SO.DocNum LIKE '%${searchTerm}%' OR
      SO.NumAtCard LIKE '%${searchTerm}%' OR
      T1.ItemCode LIKE '%${searchTerm}%' OR
      T1.Dscription LIKE '%${searchTerm}%'
    )`;
  }

  // 2) Status filter — Open / Closed / Canceled (no "all")
  if (status === "closed") {
    whereClause += " AND T1.LineStatus = 'C' AND T0.CANCELED = 'N'";
  } else if (status === "canceled") {
    whereClause += " AND T0.CANCELED <> 'N'";
  } else {
    // default: open
    whereClause += " AND T1.LineStatus = 'O' AND T0.CANCELED = 'N'";
  }

  // 3) Date filters (Delivery Date, i.e. T0.DocDate — populated from the
  // Month dropdown on the page, same convention as getOrdersLineFromDatabase)
  if (fromDate) {
    whereClause += ` AND T0.DocDate >= '${fromDate}'`;
  }
  if (toDate) {
    whereClause += ` AND T0.DocDate <= '${toDate}'`;
  }

  // 4) Role-based filtering — ODLN carries its own CardCode/SlpCode directly,
  // so this doesn't depend on the (LEFT JOIN, sometimes-absent) SO/RDR1 link.
  if (!isAdmin) {
    if (contactCodes.length > 0) {
      const numericContactCodes = contactCodes.filter((code) => !isNaN(code));
      if (numericContactCodes.length > 0) {
        whereClause += ` AND T0.SlpCode IN (${numericContactCodes.join(",")})`;
      }
    } else if (cardCodes.length > 0) {
      whereClause += ` AND T0.CardCode IN (${cardCodes.map((code) => `'${code}'`).join(",")})`;
    }
  }

  const validSortFields = ["DeliveryDate", "DeliveryNo", "SONo", "SODate", "CardName", "ItemName", "Quantity", "LineStatus"];
  const safeSortField = validSortFields.includes(sortField) ? sortField : "DeliveryDate";
  const safeSortDir = sortDir?.toLowerCase() === "asc" ? "ASC" : "DESC";

  const sortColumn =
    safeSortField === "DeliveryNo" ? "T0.DocNum" :
    safeSortField === "SONo" ? "SO.DocNum" :
    safeSortField === "SODate" ? "SO.DocDate" :
    safeSortField === "CardName" ? "T0.CardName" :
    safeSortField === "ItemName" ? "T1.Dscription" :
    safeSortField === "Quantity" ? "T1.Quantity" :
    safeSortField === "LineStatus" ? "T1.LineStatus" :
    "T0.DocDate";

  const fromJoin = `
    FROM ODLN T0
    INNER JOIN DLN1 T1 ON T0.DocEntry = T1.DocEntry
    LEFT JOIN RDR1 SO1 ON SO1.DocEntry = T1.BaseEntry AND SO1.LineNum = T1.BaseLine AND T1.BaseType = 17
    LEFT JOIN ORDR SO ON SO.DocEntry = SO1.DocEntry
    WHERE ${whereClause}
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    ${fromJoin};
  `;

  const dataQuery = `
    SELECT
      SO.DocNum AS SONo,
      SO.DocDate AS SODate,
      SO.NumAtCard AS CustomerRefNo,
      T0.CardCode AS CardCode,
      T0.CardName AS CardName,
      T0.DocEntry AS DocEntry,
      T0.DocNum AS DeliveryNo,
      T0.DocDate AS DeliveryDate,
      T1.LineNum AS LineNum,
      T1.ItemCode AS ItemCode,
      T1.Dscription AS ItemName,
      T1.Quantity AS Quantity,
      T1.UnitMsr AS UOM,
      CASE
        WHEN T0.CANCELED <> 'N' THEN 'Canceled'
        WHEN T1.LineStatus = 'C' THEN 'Closed'
        WHEN T1.LineStatus = 'O' THEN 'Open'
        ELSE 'NA'
      END AS LineStatus
    ${fromJoin}
    ORDER BY ${sortColumn} ${safeSortDir}
    ${getAll ? "" : `OFFSET ${offset} ROWS FETCH NEXT ${itemsPerPage} ROWS ONLY`};
  `;

  const [totalResult, rawRows] = await Promise.all([
    queryDatabase(countQuery),
    queryDatabase(dataQuery),
  ]);

  const totalItems = totalResult[0]?.total || 0;

  const deliveryOrdersLine = rawRows.map((row) => ({
    ...row,
    SODate: row.SODate ? row.SODate.toISOString() : null,
    DeliveryDate: row.DeliveryDate ? row.DeliveryDate.toISOString() : null,
    Quantity: parseFloat(row.Quantity || 0),
  }));

  return { deliveryOrdersLine, totalItems };
}
