

import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from "../../lib/db";
import { getCache, setCache } from "../../lib/redis";

export default async function handler(req, res) {
  try {
    const { year, slpCode, itmsGrpCod, itemCode, cntctCode ,cardCode} = req.query;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Missing or malformed Authorization header",
        received: authHeader,
      });
    }

    const token = authHeader.split(" ")[1];
    let decoded;

    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return res.status(401).json({ error: "Token verification failed" });
    }

    const isAdmin = decoded.role === "admin";
    const contactCodes = decoded.contactCodes || [];
    const cardCodes = decoded.cardCodes || [];

    const userIdentifier = isAdmin
      ? "admin"
      : contactCodes.length
        ? contactCodes.join("-")
        : cardCodes.join("-");
    const cacheKey = `sales-data:${userIdentifier}:${year || "all"}:$${
      slpCode || "all"
    }:${cardCode || "all"}:${cntctCode || "all"}:${itmsGrpCod || "all"}:${itemCode || "all"}`;

    const cachedResult = await getCache(cacheKey);
    if (cachedResult) {
      return res.status(200).json(cachedResult);
    }

    const whereClauses = ["T0.CANCELED = 'N'"];
    const params = [];

    if (!isAdmin) {
      if (contactCodes.length > 0) {
        whereClauses.push(
          `T0.SlpCode IN (${contactCodes.map((code) => `'${code}'`).join(",")})`
        );
      } else if (cardCodes.length > 0) {
        whereClauses.push(
          `T0.CardCode IN (${cardCodes.map((code) => `'${code}'`).join(",")})`
        );
      } else {
        return res.status(403).json({
          error: "No access: cardCodes or contactCodes not provided",
        });
      }
    }

    


    if (year) {
      whereClauses.push(`YEAR(T0.DocDate) = @year`);
      params.push({ name: "year", type: sql.Int, value: parseInt(year) });
    }

    if (slpCode) {
      whereClauses.push(`T0.SlpCode = @slpCode`);
      params.push({ name: "slpCode", type: sql.Int, value: parseInt(slpCode) });
    }

    if (cntctCode) {
      whereClauses.push(`T0.CntctCode = @cntctCode`);
      params.push({ name: "cntctCode", type: sql.Int, value: parseInt(cntctCode) });
    }

    if (itmsGrpCod) {
      whereClauses.push(`T6.ItmsGrpNam = @itmsGrpCod`);
      params.push({ name: "itmsGrpCod", type: sql.VarChar, value: itmsGrpCod });
    }

    if (cardCode) {
    whereClauses.push(`T0.CardCode = @cardCode`);
    params.push({ name: "cardCode", type: sql.VarChar, value: cardCode });
  }

    if (itemCode) {
      whereClauses.push(`T5.ItemCode = @itemCode`);
      params.push({ name: "itemCode", type: sql.VarChar, value: itemCode });
    }

    const whereSQL =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const salesQuery = `
      SELECT 
        DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)),2) AS [Month-Year],
        YEAR(T0.DocDate) AS year,
        MONTH(T0.DocDate) AS monthNumber,
        SUM(T1.LineTotal) AS TotalSales,
        SUM(T1.GrossBuyPr * T1.Quantity) AS TotalCOGS,
        CASE 
          WHEN SUM(T1.LineTotal) = 0 THEN 0
          ELSE ROUND(((SUM(T1.LineTotal) - SUM(T1.GrossBuyPr * T1.Quantity)) * 100.0) / SUM(T1.LineTotal), 2)
        END AS GrossMarginPct
      FROM OINV T0
      JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
      JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
      ${whereSQL}
      GROUP BY DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)),2),
               YEAR(T0.DocDate), MONTH(T0.DocDate)
      ORDER BY YEAR(T0.DocDate), MONTH(T0.DocDate);
    `;

    const invoiceCountQuery = `
      SELECT 
        DATENAME(MONTH, H.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(H.DocDate)),2) AS [Month-Year],
        COUNT(*) AS InvoiceCount
      FROM INV1 L
      JOIN OINV H ON L.DocEntry = H.DocEntry
      JOIN OITM I ON L.ItemCode = I.ItemCode
      JOIN OITB B ON I.ItmsGrpCod = B.ItmsGrpCod
      ${whereSQL.replace(/T0/g, "H").replace(/T5/g, "I").replace(/T6/g, "B")}
      GROUP BY DATENAME(MONTH, H.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(H.DocDate)),2),
               YEAR(H.DocDate), MONTH(H.DocDate)
    `;

    const [salesResults, invoiceResults] = await Promise.all([
      queryDatabase(salesQuery, params),
      queryDatabase(invoiceCountQuery, params),
    ]);

    const invoiceMap = {};
    invoiceResults.forEach((row) => {
      invoiceMap[row["Month-Year"]] = parseInt(row.InvoiceCount) || 0;
    });

    const data = salesResults.map((row) => ({
      monthYear: row["Month-Year"],
      year: row.year,
      monthNumber: row.monthNumber,
      totalSales: parseFloat(row.TotalSales) || 0,
      totalCogs: parseFloat(row.TotalCOGS) || 0,
      grossMarginPct: parseFloat(row.GrossMarginPct) || 0,
      invoiceCount: invoiceMap[row["Month-Year"]] || 0,
    }));

    const yearsCacheKey = "sales-data:available-years";
    let availableYears = await getCache(yearsCacheKey);

    if (!availableYears) {
      const yearsQuery = `
        SELECT DISTINCT YEAR(DocDate) as year
        FROM OINV
        WHERE CANCELED = 'N'
        ORDER BY year DESC
      `;
      const yearsResult = await queryDatabase(yearsQuery);
      availableYears = yearsResult.map((row) => row.year);
      await setCache(yearsCacheKey, availableYears, 86400);
    }

    const responseData = { data, availableYears };
    await setCache(cacheKey, responseData, 1800);

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("API handler error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
