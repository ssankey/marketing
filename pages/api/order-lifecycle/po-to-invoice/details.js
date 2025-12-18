// pages/api/order-lifecycle/po-to-invoice/details.js
import { queryDatabase } from "../../../../lib/db";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { month, bucket, salesPerson, customer, contactPerson, category } = req.query;

    if (!month || !bucket) {
      return res.status(400).json({ error: "Month and bucket are required" });
    }

    // Parse bucket to get min and max days
    const bucketMatch = bucket.match(/(\d+)-(\d+)|(\d+)\+/);
    let minDays, maxDays;
    
    if (bucketMatch) {
      if (bucketMatch[3]) {
        minDays = parseInt(bucketMatch[3]);
        maxDays = 999;
      } else {
        minDays = parseInt(bucketMatch[1]);
        maxDays = parseInt(bucketMatch[2]);
      }
    } else {
      return res.status(400).json({ error: "Invalid bucket format" });
    }

    // Filters on PO table - tracking PO Date to Invoice Date
    const whereParts = [
      "OINV.CANCELED = 'N'",
      "FORMAT(PO.DocDate, 'yyyy-MM') = @month",
      `DATEDIFF(DAY, PO.DocDate, OINV.DocDate) BETWEEN @minDays AND @maxDays`
    ];
    
    const params = [
      { name: "month", type: sql.VarChar, value: month },
      { name: "minDays", type: sql.Int, value: minDays },
      { name: "maxDays", type: sql.Int, value: maxDays }
    ];

    if (salesPerson) {
      whereParts.push("T5.SlpName = @salesPerson");
      params.push({ name: "salesPerson", type: sql.VarChar, value: salesPerson });
    }
    if (customer) {
      whereParts.push("C.CardName = @customer");
      params.push({ name: "customer", type: sql.VarChar, value: customer });
    }
    if (contactPerson) {
      whereParts.push("CP.Name = @contactPerson");
      params.push({ name: "contactPerson", type: sql.VarChar, value: contactPerson });
    }
    if (category) {
      whereParts.push("ITB.ItmsGrpNam = @category");
      params.push({ name: "category", type: sql.VarChar, value: category });
    }

    const whereSQL = whereParts.join(" AND ");

    const query = `
      SELECT 
        PO.DocDate AS PODate,
        OPDN.DocDate AS GRNDate,
        OINV.DocDate AS InvoiceDate,
        DATEDIFF(DAY, PO.DocDate, OINV.DocDate) AS DaysDiff,
        R1.ItemCode,
        ITM.ItemName,
        C.CardName AS CustomerName,
        T5.SlpName AS SalesPerson,
        ITB.ItmsGrpNam AS Category,
        PO.DocNum AS PONumber,
        OPDN.DocNum AS GRNNumber,
        OINV.DocNum AS InvoiceNumber
      FROM OPOR PO
      JOIN POR1 R1 ON PO.DocEntry = R1.DocEntry
      JOIN PDN1 D1 ON R1.DocEntry = D1.BaseEntry AND R1.LineNum = D1.BaseLine
      JOIN OPDN ON D1.DocEntry = OPDN.DocEntry
      JOIN INV1 I1 ON D1.DocEntry = I1.BaseEntry AND D1.LineNum = I1.BaseLine
      JOIN OINV ON I1.DocEntry = OINV.DocEntry
      INNER JOIN OCRD C ON PO.CardCode = C.CardCode
      LEFT JOIN OCPR CP ON PO.CntctCode = CP.CntctCode
      LEFT JOIN OSLP T5 ON PO.SlpCode = T5.SlpCode
      LEFT JOIN OITM ITM ON R1.ItemCode = ITM.ItemCode
      LEFT JOIN OITB ITB ON ITM.ItmsGrpCod = ITB.ItmsGrpCod
      WHERE ${whereSQL}
      ORDER BY PO.DocDate DESC, DaysDiff DESC
    `;

    const results = await queryDatabase(query, params);

    res.status(200).json({
      success: true,
      data: results || [],
      meta: {
        month,
        bucket,
        recordCount: results?.length || 0
      }
    });
  } catch (error) {
    console.error("Error fetching PO to Invoice details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch details",
      message: error.message
    });
  }
}