// pages/api/customers/new-vs-old-order-lines.js
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { cardCode, startDate, endDate } = req.query;

    if (!cardCode) return res.status(400).json({ error: "cardCode is required" });

    const params = [
      { name: "cardCode",  type: sql.VarChar, value: cardCode  },
      { name: "startDate", type: sql.VarChar, value: startDate },
      { name: "endDate",   type: sql.VarChar, value: endDate   },
    ];

    // FIX: "LineNo" is a reserved keyword in SQL Server — must be wrapped in brackets [LineNo]
    const query = `
      SELECT
        T0.DocNum                              AS SONo,
        T0.DocDate                             AS SODate,
        T0.NumAtCard                           AS CustomerRef,
        T1.LineNum                             AS [LineNo],
        T1.ItemCode                            AS ItemCode,
        T1.Dscription                          AS ItemName,
        ISNULL(T1.U_CasNo, IM.U_CasNo)        AS CasNo,
        IB.ItmsGrpNam                          AS Category,
        T1.Quantity,
        T1.UnitMsr                             AS UOM,
        ROUND(T1.Price, 3)                     AS UnitPrice,
        ROUND(T1.LineTotal, 2)                 AS LineValue,
        T0.DocCur                              AS Currency,
        CASE
          WHEN T1.LineStatus = 'O' THEN 'Open'
          WHEN T1.LineStatus = 'C' THEN 'Closed'
          ELSE 'NA'
        END                                    AS LineStatus
      FROM ORDR T0
      JOIN  RDR1 T1  ON T0.DocEntry  = T1.DocEntry
      LEFT JOIN OITM IM ON T1.ItemCode   = IM.ItemCode
      LEFT JOIN OITB IB ON IM.ItmsGrpCod = IB.ItmsGrpCod
      WHERE T0.CardCode  = @cardCode
        AND T0.CANCELED  = 'N'
        AND T0.DocDate  >= CONVERT(DATE, @startDate, 23)
        AND T0.DocDate  <= CONVERT(DATE, @endDate,   23)
      ORDER BY T0.DocDate DESC, T0.DocNum DESC, T1.LineNum ASC;
    `;

    const rows = await queryDatabase(query, params);
    return res.status(200).json({ data: rows });

  } catch (err) {
    console.error("new-vs-old-order-lines API error:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
}