// pages/api/daily-report/modal-data-slim.js
import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      year,
      month,
      day,
      slpCode,
      itmsGrpCod,
      itemCode,
      cntctCode,
      cardCode
    } = req.query;

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or malformed Authorization header" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;

    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (verifyError) {
      return res.status(401).json({ error: "Token verification failed" });
    }

    const isAdmin = decoded.role === "admin";
    const contactCodes = decoded.contactCodes || [];
    const cardCodes = decoded.cardCodes || [];

    // WHERE clauses
    const whereClauses = ["T0.CANCELED = 'N'"];
    const params = [];

    // Role-based filtering
    if (!isAdmin) {
      if (contactCodes.length > 0) {
        whereClauses.push(`T0.SlpCode IN (${contactCodes.map(c => `'${c}'`).join(",")})`);
      } else if (cardCodes.length > 0) {
        whereClauses.push(`T0.CardCode IN (${cardCodes.map(c => `'${c}'`).join(",")})`);
      } else {
        return res.status(403).json({ error: "No access: cardCodes or contactCodes not provided" });
      }
    }

    // Date filters
    whereClauses.push(`YEAR(T0.DocDate) = @year`);
    whereClauses.push(`MONTH(T0.DocDate) = @month`);
    whereClauses.push(`DAY(T0.DocDate) = @day`);
    params.push(
      { name: "year",  type: sql.Int, value: parseInt(year) },
      { name: "month", type: sql.Int, value: parseInt(month) },
      { name: "day",   type: sql.Int, value: parseInt(day) }
    );

    // Optional filters
    if (slpCode) {
      whereClauses.push(`T0.SlpCode = @slpCode`);
      params.push({ name: "slpCode", type: sql.Int, value: parseInt(slpCode) });
    }
    if (cntctCode) {
      whereClauses.push(`T0.CntctCode = @cntctCode`);
      params.push({ name: "cntctCode", type: sql.Int, value: parseInt(cntctCode) });
    }
    if (itmsGrpCod) {
      whereClauses.push(`T4.ItmsGrpCod = @itmsGrpCod`);
      params.push({ name: "itmsGrpCod", type: sql.Int, value: parseInt(itmsGrpCod) });
    }
    if (cardCode) {
      whereClauses.push(`T0.CardCode = @cardCode`);
      params.push({ name: "cardCode", type: sql.VarChar, value: cardCode });
    }
    if (itemCode) {
      whereClauses.push(`T1.ItemCode = @itemCode`);
      params.push({ name: "itemCode", type: sql.VarChar, value: itemCode });
    }

    const whereSQL = `WHERE ${whereClauses.join(" AND ")}`;

    const query = `
      SELECT
          T0.DocNum           AS [SO_No],
          T5.SlpName          AS [Sales_Person],
          T0.CardName         AS [Customer],
          T6.Name             AS [Contact_Person],
          T1.Dscription       AS [Item_Service_Description],
          T1.ItemCode         AS [ItemCode],
          T4.ItmsGrpNam       AS [Category],
          T1.Quantity         AS [Quantity],
          T1.Price            AS [Unit_Price],
          T1.LineTotal        AS [Total_Price]
      FROM ORDR T0
      INNER JOIN RDR1 T1  ON T0.DocEntry  = T1.DocEntry
      INNER JOIN OSLP T5  ON T0.SlpCode   = T5.SlpCode
      INNER JOIN OCPR T6  ON T0.CntctCode = T6.CntctCode
      LEFT  JOIN OITM T3  ON T1.ItemCode  = T3.ItemCode
      LEFT  JOIN OITB T4  ON T3.ItmsGrpCod = T4.ItmsGrpCod
      ${whereSQL}
      ORDER BY T0.DocDate ASC, T0.DocNum DESC, T1.LineNum;
    `;

    const results = await queryDatabase(query, params);

    res.status(200).json(results || []);

  } catch (error) {
    console.error('Daily report slim modal API error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}