// pages/api/top-outstanding/vendor-invoices.js
// Vendor AP invoice list, ported from VendorBalanceRepository's base query
// (findAllVendorBalancesForExport). Used by the invoice modal on the Top
// Outstanding Vendor page — filtered by vendorCode server-side (the original
// Spring app fetched the whole export and filtered by vendor name client-side;
// filtering here by vendorCode is the same result, just without pulling every
// AP invoice in the system over the wire for a single-vendor modal).

import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from "../../../lib/db";

const TOP_OUTSTANDING_PASSWORD = "Outstanding_Report_2026";

const BASE_QUERY = `
  WITH VendorInvoiceBase AS (
    SELECT
      H.DocNum        AS InvoiceNo,
      H.DocDate       AS InvoiceDate,
      H.CardCode      AS VendorCode,
      H.CardName      AS VendorName,
      H.DocTotal      AS InvoiceTotal,
      (H.DocTotal - H.PaidToDate) AS BalanceDue,
      DATEDIFF(DAY, H.DocDueDate, GETDATE()) AS OverdueDays,
      H.NumAtCard     AS VendorRefNo,
      H.TaxDate       AS SupplyDate,
      C.Country,
      T17.State,
      CASE
        WHEN ISNULL(C.Country, '') <> 'IN' THEN 'Overseas'
        WHEN T17.State IN ('AP', 'TE') THEN 'Central'
        WHEN T17.State IN ('KL', 'KT', 'TN', 'PC') THEN 'South'
        WHEN T17.State IN ('MH', 'GO', 'DN') THEN 'West 1'
        WHEN T17.State = 'GJ' THEN 'West 2'
        WHEN T17.State IN ('DL', 'HR', 'HP', 'PU', 'RJ', 'UP', 'UT', 'MP', 'CH') THEN 'North'
        WHEN T17.State IN ('WB', 'JH', 'AS', 'ME') THEN 'East'
        ELSE 'Unknown'
      END AS Region,
      TG.PymntGroup   AS PaymentTerms,
      SP.SlpName      AS SalesPerson,
      SP2.SlpName     AS MasterSalesPerson,
      CP.Name         AS ContactPerson,
      'Pending'       AS PaymentStatus,
      ROW_NUMBER() OVER (PARTITION BY H.DocNum ORDER BY H.DocDate DESC) AS rn
    FROM OPCH H
    JOIN OCRD C     ON C.CardCode = H.CardCode
    LEFT JOIN CRD1 T17  ON C.CardCode = T17.CardCode AND T17.AdresType = 'B'
    LEFT JOIN OCTG TG   ON TG.GroupNum = C.GroupNum
    LEFT JOIN OSLP SP   ON SP.SlpCode = H.SlpCode
    LEFT JOIN OSLP SP2  ON SP2.SlpCode = C.SlpCode
    LEFT JOIN OCPR CP   ON CP.CardCode = C.CardCode
    WHERE H.CANCELED = 'N'
      AND (H.DocTotal - H.PaidToDate) > 1
      AND C.CardType IN ('S', 'V')
  )
  SELECT * FROM VendorInvoiceBase WHERE rn = 1
`;

const SEARCH_FILTER = `
  AND (
    CAST(InvoiceNo AS VARCHAR) LIKE @searchLike
    OR VendorCode LIKE @searchLike
    OR VendorName LIKE @searchLike
    OR ContactPerson LIKE @searchLike
    OR VendorRefNo LIKE @searchLike
    OR Country LIKE @searchLike
    OR State LIKE @searchLike
    OR Region LIKE @searchLike
    OR PaymentTerms LIKE @searchLike
    OR SalesPerson LIKE @searchLike
    OR MasterSalesPerson LIKE @searchLike
    OR CAST(BalanceDue AS VARCHAR) LIKE @searchLike
    OR CAST(OverdueDays AS VARCHAR) LIKE @searchLike
  )
`;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  try { verify(authHeader.split(" ")[1], process.env.JWT_SECRET); }
  catch { return res.status(401).json({ error: "Invalid token" }); }

  const { password, search = "", vendorCode = "" } = req.query;
  if (password !== TOP_OUTSTANDING_PASSWORD) return res.status(403).json({ error: "Incorrect report password" });

  try {
    let query = BASE_QUERY;
    const params = [];

    if (vendorCode.trim()) {
      query += ` AND VendorCode = @vendorCode`;
      params.push({ name: "vendorCode", type: sql.NVarChar, value: vendorCode.trim() });
    }
    if (search.trim()) {
      query += SEARCH_FILTER;
      params.push({ name: "searchLike", type: sql.NVarChar, value: `%${search.trim()}%` });
    }
    query += ` ORDER BY InvoiceDate DESC;`;

    const rows = await queryDatabase(query, params);

    const invoices = rows.map((r) => ({
      invoiceNo: r.InvoiceNo,
      invoiceDate: r.InvoiceDate ? r.InvoiceDate.toISOString() : null,
      vendorRefNo: r.VendorRefNo,
      vendorCode: r.VendorCode,
      vendorName: r.VendorName,
      contactPerson: r.ContactPerson,
      invoiceTotal: parseFloat(r.InvoiceTotal) || 0,
      balanceDue: parseFloat(r.BalanceDue) || 0,
      country: r.Country,
      state: r.State,
      region: r.Region,
      overdueDays: r.OverdueDays,
      paymentTerms: r.PaymentTerms,
      supplyDate: r.SupplyDate ? r.SupplyDate.toISOString() : null,
      salesPerson: r.SalesPerson,
      masterSalesPerson: r.MasterSalesPerson,
      paymentStatus: r.PaymentStatus,
    }));

    return res.status(200).json(invoices);
  } catch (error) {
    console.error("Vendor invoices error:", error);
    return res.status(500).json({ error: "Failed to load vendor invoices", details: error.message });
  }
}
