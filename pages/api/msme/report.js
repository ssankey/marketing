// pages/api/msme/report.js
// MSME vendor outstanding report for FY 2025-26 (1 Apr 2025 - 31 Mar 2026),
// restricted to vendors present in the uploaded msme_vendor list.

import { verify } from "jsonwebtoken";
import sql        from "mssql";
import { queryDatabase } from "../../../lib/db";

const MSME_PASSWORD = "msme2526report";
const FY_START = "2025-04-01";
const FY_END_EXCLUSIVE = "2026-04-01"; // up to and including 31 Mar 2026

const reportCte = `
WITH InvoiceSettlementLines AS (
    SELECT
        T.SrcObjAbs AS InvoiceDocEntry,
        R.ReconDate AS SettlementDate,
        T.ReconSum  AS AmountApplied
    FROM ITR1 T
    JOIN OITR R ON T.ReconNum = R.ReconNum
    WHERE T.SrcObjTyp = '18'
      AND T.IsCredit = 'C'
      AND R.Canceled = 'N'
),
InvoiceSettledBuckets AS (
    SELECT
        S.InvoiceDocEntry,
        H.DocDate AS InvoiceDate,
        SUM(CASE WHEN DATEDIFF(DAY, H.DocDate, S.SettlementDate) <= 45 THEN S.AmountApplied ELSE 0 END) AS PaidWithin45,
        SUM(CASE WHEN DATEDIFF(DAY, H.DocDate, S.SettlementDate) > 45  THEN S.AmountApplied ELSE 0 END) AS PaidAfter45,
        MAX(S.SettlementDate) AS LastPaymentDate,
        SUM(S.AmountApplied)  AS TotalSettled
    FROM InvoiceSettlementLines S
    JOIN OPCH H ON S.InvoiceDocEntry = H.DocEntry
    GROUP BY S.InvoiceDocEntry, H.DocDate
),
InvoiceStatus AS (
    SELECT
        H.DocEntry,
        H.DocNum,
        H.CardCode,
        H.CardName,
        V.msme_reg_no      AS MsmeRegNo,
        V.type_of_business AS TypeOfBusiness,
        G.GSTRegnNo        AS GSTNo,
        H.DocDate,
        H.DocTotal,
        H.PaidToDate,
        (H.DocTotal - H.PaidToDate) AS BalanceDue,
        B.LastPaymentDate,
        ISNULL(B.PaidWithin45, 0) AS PaidWithin45,
        ISNULL(B.PaidAfter45, 0)  AS PaidAfter45,
        DATEDIFF(DAY, H.DocDate, GETDATE()) AS DaysSincePosting
    FROM OPCH H
    JOIN OCRD C ON H.CardCode = C.CardCode
    INNER JOIN dbo.msme_vendor V
        ON LTRIM(RTRIM(UPPER(C.CardName))) = LTRIM(RTRIM(UPPER(V.vendor_name)))
    LEFT JOIN CRD1 G ON H.CardCode = G.CardCode AND G.AdresType = 'B'
    LEFT JOIN InvoiceSettledBuckets B ON H.DocEntry = B.InvoiceDocEntry
    WHERE H.CANCELED = 'N'
      AND C.CardType = 'S'
      AND H.DocDate >= @fyStart AND H.DocDate < @fyEnd
),
FinalReport AS (
    SELECT
        CardCode    AS VendorCode,
        CardName    AS VendorName,
        MsmeRegNo,
        TypeOfBusiness,
        GSTNo,
        DocNum      AS InvoiceNo,
        CAST(DocDate AS DATE) AS InvoiceDate,
        DocTotal    AS InvoiceAmount,
        BalanceDue,
        CAST(LastPaymentDate AS DATE) AS LastPaymentDate,
        PaidWithin45,
        PaidAfter45,
        CASE WHEN BalanceDue > 1 AND DaysSincePosting <= 45 THEN BalanceDue ELSE 0 END AS OutstandingWithin45,
        CASE WHEN BalanceDue > 1 AND DaysSincePosting > 45  THEN BalanceDue ELSE 0 END AS OutstandingAfter45
    FROM InvoiceStatus
)
`;

const searchFilter = `WHERE (@search = '' OR VendorName LIKE @searchLike OR MsmeRegNo LIKE @searchLike)`;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  try { verify(authHeader.split(" ")[1], process.env.JWT_SECRET); }
  catch { return res.status(401).json({ error: "Invalid token" }); }

  const { password, search = "", page = 1, pageSize = 20, all } = req.query;
  if (password !== MSME_PASSWORD) return res.status(403).json({ error: "Incorrect MSME report password" });

  try {
    let vendorCount = 0;
    try {
      const cntRows = await queryDatabase(`SELECT COUNT(*) AS cnt FROM dbo.msme_vendor`);
      vendorCount = cntRows?.[0]?.cnt || 0;
    } catch {
      vendorCount = 0; // table doesn't exist yet — no vendor list uploaded
    }

    if (vendorCount === 0) {
      return res.status(200).json({ hasVendorList: false, data: [], totalItems: 0 });
    }

    const trimmedSearch = String(search || "").trim();
    const baseParams = [
      { name: "fyStart",    type: sql.Date,    value: FY_START },
      { name: "fyEnd",      type: sql.Date,    value: FY_END_EXCLUSIVE },
      { name: "search",     type: sql.NVarChar, value: trimmedSearch },
      { name: "searchLike", type: sql.NVarChar, value: `%${trimmedSearch}%` },
    ];

    const countQuery = `${reportCte}\nSELECT COUNT(*) AS total FROM FinalReport ${searchFilter};`;
    const countRows = await queryDatabase(countQuery, baseParams);
    const totalItems = countRows?.[0]?.total || 0;

    let dataQuery;
    let dataParams = [...baseParams];

    if (all === "true") {
      dataQuery = `${reportCte}\nSELECT * FROM FinalReport ${searchFilter} ORDER BY VendorName, InvoiceDate DESC;`;
    } else {
      const pageNum  = Math.max(1, parseInt(page) || 1);
      const sizeNum  = Math.max(1, parseInt(pageSize) || 20);
      const offset   = (pageNum - 1) * sizeNum;
      dataQuery = `${reportCte}\nSELECT * FROM FinalReport ${searchFilter} ORDER BY VendorName, InvoiceDate DESC OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;`;
      dataParams.push(
        { name: "offset",   type: sql.Int, value: offset },
        { name: "pageSize", type: sql.Int, value: sizeNum }
      );
    }

    const data = await queryDatabase(dataQuery, dataParams);

    return res.status(200).json({ hasVendorList: true, data, totalItems });
  } catch (err) {
    console.error("MSME report error:", err);
    return res.status(500).json({ error: "Failed to load MSME report", details: err.message });
  }
}
