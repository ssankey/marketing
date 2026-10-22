

// pages/api/customers/[id]/aging.js
// Rebuilt to bucket from OINV directly (DocTotal - PaidToDate, aged off
// DocDueDate) instead of JDT1 (GL journal postings) — the same
// inconsistent-data-source bug already found and fixed for the main
// Customer Balance page's getCustomerBalance (lib/models/invoices.js).
// Bucketing from a different table than the rest of the app's outstanding
// figures meant this could disagree with both the Customer Outstanding
// section on this same page and the main Customer Balance page, for the
// same customer.
//
// Category/product filters use EXISTS subqueries rather than JOINs — a
// plain JOIN to INV1/OITM fans out one row per matching line, which would
// multiply (DocTotal - PaidToDate) by however many lines matched instead of
// counting each invoice once (the same duplication-bug class already found
// elsewhere in this codebase).
import sql from "mssql";
import { queryDatabase } from "lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    const { salesPerson, product, category } = req.query;

    if (!id) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const params = [{ name: "CardCode", type: sql.NVarChar, value: id }];

    let salesPersonFilter = "";
    if (salesPerson) {
      salesPersonFilter = "AND T13.SlpCode = @SlpCode";
      params.push({ name: "SlpCode", type: sql.Int, value: parseInt(salesPerson, 10) || salesPerson });
    }

    let categoryFilter = "";
    if (category) {
      categoryFilter = `
        AND EXISTS (
          SELECT 1 FROM INV1 L
          INNER JOIN OITM I ON I.ItemCode = L.ItemCode
          INNER JOIN OITB B ON B.ItmsGrpCod = I.ItmsGrpCod
          WHERE L.DocEntry = T13.DocEntry AND B.ItmsGrpNam = @Category
        )
      `;
      params.push({ name: "Category", type: sql.NVarChar, value: category });
    }

    let productFilter = "";
    if (product) {
      productFilter = `
        AND EXISTS (
          SELECT 1 FROM INV1 L WHERE L.DocEntry = T13.DocEntry AND L.ItemCode = @ItemCode
        )
      `;
      params.push({ name: "ItemCode", type: sql.NVarChar, value: product });
    }

    // Scoped to invoices already past due (DocDueDate <= today) so every
    // counted invoice lands in one of the 4 buckets below — otherwise
    // [Total Balance] (an unfiltered SUM) could exceed the 4 buckets' sum
    // by however much is outstanding but not yet due, which isn't an aging
    // figure at all. Same "overdue only" scope as the main Customer Balance
    // page's "Overdue Balances by Aging" chart.
    const query = `
      SELECT
        SUM(CASE WHEN DATEDIFF(DAY, T13.DocDueDate, GETDATE()) BETWEEN 0  AND 30 THEN (T13.DocTotal - T13.PaidToDate) ELSE 0 END) AS [0-30 Days],
        SUM(CASE WHEN DATEDIFF(DAY, T13.DocDueDate, GETDATE()) BETWEEN 31 AND 60 THEN (T13.DocTotal - T13.PaidToDate) ELSE 0 END) AS [31-60 Days],
        SUM(CASE WHEN DATEDIFF(DAY, T13.DocDueDate, GETDATE()) BETWEEN 61 AND 90 THEN (T13.DocTotal - T13.PaidToDate) ELSE 0 END) AS [61-90 Days],
        SUM(CASE WHEN DATEDIFF(DAY, T13.DocDueDate, GETDATE()) > 90             THEN (T13.DocTotal - T13.PaidToDate) ELSE 0 END) AS [91+ Days],
        SUM(T13.DocTotal - T13.PaidToDate) AS [Total Balance],
        COUNT(CASE WHEN DATEDIFF(DAY, T13.DocDueDate, GETDATE()) BETWEEN 0  AND 30 THEN 1 END) AS [0-30 Count],
        COUNT(CASE WHEN DATEDIFF(DAY, T13.DocDueDate, GETDATE()) BETWEEN 31 AND 60 THEN 1 END) AS [31-60 Count],
        COUNT(CASE WHEN DATEDIFF(DAY, T13.DocDueDate, GETDATE()) BETWEEN 61 AND 90 THEN 1 END) AS [61-90 Count],
        COUNT(CASE WHEN DATEDIFF(DAY, T13.DocDueDate, GETDATE()) > 90             THEN 1 END) AS [91+ Count],
        COUNT(*) AS [Total Count]
      FROM OINV T13
      WHERE T13.CardCode = @CardCode
        AND T13.CANCELED <> 'Y' AND T13.CANCELED <> 'C'
        AND (T13.DocTotal - T13.PaidToDate) > 1
        AND DATEDIFF(DAY, T13.DocDueDate, GETDATE()) >= 0
        ${salesPersonFilter}
        ${categoryFilter}
        ${productFilter}
    `;

    const data = await queryDatabase(query, params);

    const row = data?.[0] || {};
    res.status(200).json({
      "0-30 Days": parseFloat(row["0-30 Days"]) || 0,
      "31-60 Days": parseFloat(row["31-60 Days"]) || 0,
      "61-90 Days": parseFloat(row["61-90 Days"]) || 0,
      "91+ Days": parseFloat(row["91+ Days"]) || 0,
      "Total Balance": parseFloat(row["Total Balance"]) || 0,
      "0-30 Count": row["0-30 Count"] || 0,
      "31-60 Count": row["31-60 Count"] || 0,
      "61-90 Count": row["61-90 Count"] || 0,
      "91+ Count": row["91+ Count"] || 0,
      "Total Count": row["Total Count"] || 0,
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      message: "Failed to fetch customer aging data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}
