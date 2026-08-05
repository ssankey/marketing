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
    const cardCodes    = decoded.cardCodes || [];

    const userIdentifier = isAdmin ? "admin" : contactCodes.length ? contactCodes.join("-") : cardCodes.join("-");
    const cacheKey = `daily-invoice-modal:${userIdentifier}:${year}:${month}:${day}:${slpCode||"all"}:${cardCode||"all"}:${cntctCode||"all"}:${itmsGrpCod||"all"}:${itemCode||"all"}`;

    const cached = await getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

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

    whereClauses.push(`YEAR(H.DocDate)  = @year`);
    whereClauses.push(`MONTH(H.DocDate) = @month`);
    whereClauses.push(`DAY(H.DocDate)   = @day`);
    params.push(
      { name: "year",  type: sql.Int, value: parseInt(year)  },
      { name: "month", type: sql.Int, value: parseInt(month) },
      { name: "day",   type: sql.Int, value: parseInt(day)   }
    );

    if (slpCode)    { whereClauses.push(`H.SlpCode    = @slpCode`);      params.push({ name: "slpCode",    type: sql.Int,     value: parseInt(slpCode)    }); }
    if (cntctCode)  { whereClauses.push(`H.CntctCode  = @cntctCode`);    params.push({ name: "cntctCode",  type: sql.Int,     value: parseInt(cntctCode)  }); }
    // if (itmsGrpCod) { whereClauses.push(`ITB.ItmsGrpCod = @itmsGrpCod`); params.push({ name: "itmsGrpCod", type: sql.Int,     value: parseInt(itmsGrpCod) }); }
    if (itmsGrpCod) {
        whereClauses.push(`EXISTS (
            SELECT 1 FROM OITM I2 
            INNER JOIN OITB B2 ON I2.ItmsGrpCod = B2.ItmsGrpCod
            WHERE I2.ItemCode = L.ItemCode 
            AND I2.ItmsGrpCod = @itmsGrpCod
        )`);
        params.push({ name: "itmsGrpCod", type: sql.Int, value: parseInt(itmsGrpCod) });
        }
    if (cardCode)   { whereClauses.push(`H.CardCode   = @cardCode`);     params.push({ name: "cardCode",   type: sql.VarChar, value: cardCode             }); }
    if (itemCode)   { whereClauses.push(`L.ItemCode   = @itemCode`);     params.push({ name: "itemCode",   type: sql.VarChar, value: itemCode             }); }

    const whereSQL = `WHERE ${whereClauses.join(" AND ")}`;

    const query = `
  SELECT
    T5.SlpName                                      AS [Sales_Person],
    ITMGRP.ItmsGrpNam                               AS [Category],
    COALESCE(T13.DocNum,    T13B.DocNum)             AS [SO No],
    COALESCE(T13.DocDate,   T13B.DocDate)            AS [SO Date],
    COALESCE(T13.NumAtCard, T13B.NumAtCard)          AS [SO Customer Ref. No],
    COALESCE(CP.Name,       CPB.Name)                AS [Contact Person],
    L.ItemCode                                      AS [Item No.],
    L.Dscription                                    AS [Item/Service Description],
    ISNULL(L.U_CasNo, ITM.U_CasNo)                 AS [Cas No],
    CASE
      WHEN T15.U_COA IS NOT NULL
        AND LTRIM(RTRIM(CAST(T15.U_COA AS NVARCHAR(MAX)))) <> ''
        THEN CAST(T15.U_COA AS NVARCHAR(MAX))
      WHEN ISNULL(T15.U_vendorbatchno, '') <> '' AND L.ItemCode <> ''
        THEN 'https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/' +
             LEFT(L.ItemCode, CHARINDEX('-', L.ItemCode + '-') - 1)
             + '_' + T15.U_vendorbatchno + '.pdf'
      ELSE ''
    END                                             AS [COA Filename],
    ITM.SuppCatNum                                  AS [Vendor Catalog No.],
    L.UnitMsr                                       AS [PKZ],
    CASE
      WHEN T4.Quantity IS NOT NULL THEN T4.Quantity
      ELSE L.Quantity
    END                                             AS [Qty],
    CASE
      WHEN H.DocStatus = 'O' THEN 'Open'
      WHEN H.CANCELED  = 'Y' THEN 'Cancelled'
      ELSE 'Closed'
    END                                             AS [STATUS],
    H.DocNum                                        AS [Inv#],
    H.DocDate                                       AS [Invoice Posting Dt.],
    T3.TrackNo                                      AS [Tracking Number],
    H.U_AirlineName                                 AS [Courier Service],
    H.U_DispatchDate                                AS [Dispatch Date],
    T3.DocDueDate                                   AS [DELIVER DATE],
    L.PriceBefDi                                    AS [Unit Sales Price],
    CASE
      WHEN L.InvQty = 0 THEN L.LineTotal
      WHEN T4.Quantity IS NULL THEN L.LineTotal
      WHEN L.InvQty <> 0 AND T4.Quantity IS NOT NULL
        THEN (L.LineTotal / L.InvQty) * T4.Quantity
      ELSE L.LineTotal
    END                                             AS [Total Sales Price/Open Value],
    ISNULL(T15.BatchNum, '')                        AS [BatchNum],
    ISNULL(T15.U_vendorbatchno, '')                 AS [U_vendorbatchno],
    L.U_mkt_feedback                                AS [Mkt_Feedback]
  FROM OINV H
  INNER JOIN INV1  L      ON H.DocEntry     = L.DocEntry
  LEFT  JOIN OITM  ITM    ON L.ItemCode     = ITM.ItemCode
  LEFT  JOIN OITB  ITMGRP ON ITM.ItmsGrpCod = ITMGRP.ItmsGrpCod
  LEFT  JOIN OSLP  T5     ON H.SlpCode      = T5.SlpCode

  -- PATH 1: Invoice → Delivery Note → Sales Order
  LEFT  JOIN DLN1  T2     ON T2.ItemCode  = L.ItemCode
                         AND T2.DocEntry  = L.BaseEntry
                         AND L.BaseType   = 15
                         AND L.BaseLine   = T2.LineNum
  LEFT  JOIN ODLN  T3     ON T3.DocEntry  = T2.DocEntry
  LEFT  JOIN RDR1  T12    ON T12.ItemCode = T2.ItemCode
                         AND T12.DocEntry = T2.BaseEntry
                         AND T2.BaseType  = 17
                         AND T2.BaseLine  = T12.LineNum
  LEFT  JOIN ORDR  T13    ON T13.DocEntry = T12.DocEntry
  LEFT  JOIN OCPR  CP     ON T13.CntctCode = CP.CntctCode

  -- PATH 2: Invoice → Sales Order directly (no delivery note)
  LEFT  JOIN RDR1  T12B   ON T12B.ItemCode = L.ItemCode
                         AND T12B.DocEntry = L.BaseEntry
                         AND L.BaseType    = 17
                         AND T12B.LineNum  = L.BaseLine
  LEFT  JOIN ORDR  T13B   ON T13B.DocEntry = T12B.DocEntry
  LEFT  JOIN OCPR  CPB    ON T13B.CntctCode = CPB.CntctCode

  -- Batch tracking via delivery (Path 1 only — batch comes from delivery)
  LEFT  JOIN IBT1  T4     ON T4.CardCode   = T3.CardCode
                         AND T4.ItemCode   = T2.ItemCode
                         AND T4.BaseNum    = T3.DocNum
                         AND T4.BaseEntry  = T3.DocEntry
                         AND T4.BaseType   = 15
                         AND T4.BaseLinNum = T2.LineNum
                         AND T4.Direction  = 1
  LEFT  JOIN OIBT  T15    ON T15.ItemCode  = T4.ItemCode
                         AND T15.BatchNum  = T4.BatchNum
  ${whereSQL}
  ORDER BY H.DocDate ASC, H.DocNum DESC, L.LineNum;
`;

    const results = await queryDatabase(query, params);
    await setCache(cacheKey, results || [], 1800);
    res.status(200).json(results || []);

  } catch (error) {
    console.error('Daily invoice modal-data error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
}