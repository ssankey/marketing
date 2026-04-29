// pages/api/daily-invoice/modal-data-slim.js
import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from '../../../lib/db';
import { getCache, setCache } from "../../../lib/redis";

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { year, month, day, slpCode, itmsGrpCod, itemCode, cntctCode, cardCode } = req.query;

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      return res.status(401).json({ error: "Missing or malformed Authorization header" });

    let decoded;
    try {
      decoded = verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "Token verification failed" });
    }

    const isAdmin      = decoded.role === "admin";
    const contactCodes = decoded.contactCodes || [];
    const cardCodes    = decoded.cardCodes    || [];

    // Cache key
    const userIdentifier = isAdmin ? "admin" : contactCodes.length ? contactCodes.join("-") : cardCodes.join("-");
    const cacheKey = `daily-invoice-modal-slim:${userIdentifier}:${year}:${month}:${day}:${slpCode||"all"}:${cardCode||"all"}:${cntctCode||"all"}:${itmsGrpCod||"all"}:${itemCode||"all"}`;

    const cached = await getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    // WHERE clauses
    const whereClauses = ["H.CANCELED = 'N'", "H.[IssReason] <> '4'"];
    const params = [];

    if (!isAdmin) {
      if (contactCodes.length > 0)
        whereClauses.push(`H.SlpCode IN (${contactCodes.map(c => `'${c}'`).join(",")})`);
      else if (cardCodes.length > 0)
        whereClauses.push(`H.CardCode IN (${cardCodes.map(c => `'${c}'`).join(",")})`);
      else
        return res.status(403).json({ error: "No access" });
    }

    // Date filters (all three required for modal)
    whereClauses.push(`YEAR(H.DocDate)  = @year`);
    whereClauses.push(`MONTH(H.DocDate) = @month`);
    whereClauses.push(`DAY(H.DocDate)   = @day`);
    params.push(
      { name: "year",  type: sql.Int, value: parseInt(year)  },
      { name: "month", type: sql.Int, value: parseInt(month) },
      { name: "day",   type: sql.Int, value: parseInt(day)   }
    );

    // Optional filters
    if (slpCode)   { whereClauses.push(`H.SlpCode   = @slpCode`);   params.push({ name: "slpCode",   type: sql.Int,     value: parseInt(slpCode)   }); }
    if (cntctCode) { whereClauses.push(`H.CntctCode = @cntctCode`); params.push({ name: "cntctCode", type: sql.Int,     value: parseInt(cntctCode) }); }
    if (cardCode)  { whereClauses.push(`H.CardCode  = @cardCode`);  params.push({ name: "cardCode",  type: sql.VarChar, value: cardCode             }); }
    if (itemCode)  { whereClauses.push(`L.ItemCode  = @itemCode`);  params.push({ name: "itemCode",  type: sql.VarChar, value: itemCode             }); }

    if (itmsGrpCod) {
      // Subquery avoids adding OITM/OITB to the main join — keeps it lean
      whereClauses.push(`EXISTS (
        SELECT 1 FROM OITM I2
        INNER JOIN OITB B2 ON I2.ItmsGrpCod = B2.ItmsGrpCod
        WHERE I2.ItemCode = L.ItemCode
        AND I2.ItmsGrpCod = @itmsGrpCod
      )`);
      params.push({ name: "itmsGrpCod", type: sql.Int, value: parseInt(itmsGrpCod) });
    }

    const whereSQL = `WHERE ${whereClauses.join(" AND ")}`;

    // Lean query — 9 fields only.
    // Dropped vs full modal: DLN1/ODLN (delivery), RDR1/ORDR (SO), OCPR (contact via SO),
    //                        IBT1/OIBT (batch tracking), COA path logic.
    // Kept: OSLP (sales person), OITM+OITB (item + category), OCPR via invoice header (contact).
    // Contact person is read directly from the invoice header (H.CntctCode → OCPR)
    // which is simpler and faster than chasing it through the SO chain.
    const query = `
      SELECT
          H.DocNum                  AS [Inv#],
          H.CardName                AS [Customer],
          T5.SlpName                AS [Sales_Person],
          CP.Name                   AS [Contact Person],
          L.Dscription              AS [Item/Service Description],
          ITMGRP.ItmsGrpNam         AS [Category],
          L.Quantity                AS [Qty],
          L.PriceBefDi              AS [Unit Sales Price],
          L.LineTotal               AS [Total Sales Price/Open Value]
      FROM OINV H
      INNER JOIN INV1  L      ON H.DocEntry     = L.DocEntry
      LEFT  JOIN OSLP  T5     ON H.SlpCode      = T5.SlpCode
      LEFT  JOIN OCPR  CP     ON H.CntctCode    = CP.CntctCode
      LEFT  JOIN OITM  ITM    ON L.ItemCode     = ITM.ItemCode
      LEFT  JOIN OITB  ITMGRP ON ITM.ItmsGrpCod = ITMGRP.ItmsGrpCod
      ${whereSQL}
      ORDER BY H.DocDate ASC, H.DocNum DESC, L.LineNum;
    `;

    const results = await queryDatabase(query, params);
    await setCache(cacheKey, results || [], 1800);
    res.status(200).json(results || []);

  } catch (error) {
    console.error('Daily invoice slim modal error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}