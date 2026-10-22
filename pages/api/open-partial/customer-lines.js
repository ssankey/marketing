// pages/api/open-partial/customer-lines.js
// Line-level open order detail for one customer — backs the "Line Items"
// drill-down in the "Customer Wise" view of components/open-partial-chart/
// OpenClosedOrdersChartArray.js. All-time (no year/month), same scope as
// that view's own aggregate (customers.js): CANCELED='N', DocStatus='O',
// LineStatus='O'. Same join shape/columns as modal.js's line-level query,
// just keyed by cardCode instead of year/month.
import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from "../../../lib/db";

const getMulti = (query, key) => {
  const val = query[key];
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
};

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      return res.status(401).json({ error: "Missing Authorization header" });

    const token = authHeader.split(" ")[1];
    let decoded;
    try { decoded = verify(token, process.env.JWT_SECRET); }
    catch { return res.status(401).json({ error: "Token verification failed" }); }

    const isAdmin       = decoded.role === "admin";
    const tokenContacts = decoded.contactCodes || [];
    const tokenCards    = decoded.cardCodes    || [];

    const { cardCode } = req.query;
    if (!cardCode) return res.status(400).json({ error: "cardCode is required" });

    const slpCodes    = getMulti(req.query, "slpCode");
    const cntctCodes  = getMulti(req.query, "cntctCode");
    const itmsGrpNams = getMulti(req.query, "itmsGrpNam");
    const itemCodes   = getMulti(req.query, "itemCode");

    const where = ["T0.CANCELED = 'N'", "T0.DocStatus = 'O'", "T0.CardCode = @cardCode"];
    const params = [{ name: "cardCode", type: sql.NVarChar, value: cardCode }];

    if (!isAdmin) {
      if (tokenContacts.length)
        where.push(`T0.SlpCode IN (${tokenContacts.map(c => `'${c}'`).join(",")})`);
      else if (tokenCards.length)
        where.push(`T0.CardCode IN (${tokenCards.map(c => `'${c}'`).join(",")})`);
      else
        return res.status(403).json({ error: "No access codes in token" });
    }

    if (isAdmin && slpCodes.length)
      where.push(`T0.SlpCode IN (${slpCodes.map(c => `'${c}'`).join(",")})`);
    if (cntctCodes.length)
      where.push(`T0.CntctCode IN (${cntctCodes.map(c => `'${c}'`).join(",")})`);
    if (itmsGrpNams.length)
      where.push(`T4.ItmsGrpNam IN (${itmsGrpNams.map(n => `'${n.replace(/'/g, "''")}'`).join(",")})`);
    if (itemCodes.length)
      where.push(`T1.ItemCode IN (${itemCodes.map(c => `'${c.replace(/'/g, "''")}'`).join(",")})`);

    const W = `WHERE ${where.join(" AND ")}`;

    const query = `
      SELECT
        T5.SlpName                                       AS [Sales_Person],
        T0.CardName                                       AS [Customer],
        T0.CardCode                                       AS [CardCode],
        T0.NumAtCard                                      AS [CustomerRefNo],
        T6.Name                                           AS [Contact_Person],
        T0.DocNum                                         AS [SO_No],
        T0.DocDate                                        AS [SO_Date],
        T1.ItemCode                                       AS [ItemCode],
        T1.Dscription                                     AS [Item_Service_Description],
        T4.ItmsGrpNam                                     AS [Category],
        T1.Quantity                                       AS [Quantity],
        ROUND(T1.OpenQty, 2)                              AS [Open_Qty],
        T1.Price                                          AS [Unit_Price],
        ROUND(T1.OpenQty * T1.Price * T0.DocRate, 2)      AS [Open_Amount_INR],
        T1.LineTotal                                      AS [Line_Total_INR],
        T1.ShipDate                                       AS [Delivery_Date]
      FROM ORDR T0
      JOIN RDR1 T1   ON T0.DocEntry = T1.DocEntry AND T1.LineStatus = 'O'
      JOIN OSLP T5   ON T0.SlpCode  = T5.SlpCode
      LEFT JOIN OCPR T6 ON T0.CntctCode = T6.CntctCode
      LEFT JOIN OITM T3 ON T1.ItemCode  = T3.ItemCode
      LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
      ${W}
      ORDER BY T0.DocDate ASC, T0.DocNum, T1.LineNum;
    `;

    const results = await queryDatabase(query, params);
    return res.status(200).json(results || []);

  } catch (err) {
    console.error("[open-partial/customer-lines] Error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
