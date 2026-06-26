

import sql from "mssql";
import { queryDatabase } from "../../db";

function buildWhereClause(alias, { startDate, endDate, contactCodes }) {
  const conditions = [];
  console.log("Building WHERE clause with dates:", { startDate, endDate });

  // Date range filter - handle dates more flexibly
  if (startDate || endDate) {
    if (startDate && !endDate) {
      conditions.push(`CONVERT(DATE, ${alias}.DocDate) >= '${startDate}'`);
    } else if (!startDate && endDate) {
      conditions.push(`CONVERT(DATE, ${alias}.DocDate) <= '${endDate}'`);
    } else {
      conditions.push(
        `CONVERT(DATE, ${alias}.DocDate) BETWEEN '${startDate}' AND '${endDate}'`
      );
    }
  } else {
    // Default to today if no dates provided
    conditions.push(
      `CONVERT(DATE, ${alias}.DocDate) = CONVERT(DATE, GETDATE())`
    );
  }

  // If contact codes are provided, filter by them
  if (contactCodes && contactCodes.length) {
    const codeList = contactCodes.map((c) => `'${c}'`).join(", ");
    conditions.push(`${alias}.CardCode IN (${codeList})`);
  }

  return conditions.join(" AND ");
}

export default buildWhereClause;
