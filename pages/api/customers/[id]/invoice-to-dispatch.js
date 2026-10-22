// pages/api/customers/[id]/invoice-to-dispatch.js
// Invoice → Dispatch stage of the Order Fulfillment Lifecycle — see
// [id]/delivery-performance.js's header comment for the shared
// raw-row/client-side-bucketing architecture. U_DispatchDate is stamped
// automatically on OINV by pages/api/bluedart/generate-waybill.js for
// Blue Dart shipments, so this only ever includes invoices that have
// actually been dispatched (U_DispatchDate IS NOT NULL).
import { queryDatabase } from "../../../../lib/db";
import sql from 'mssql';

export default async function handler(req, res) {
  const { id, salesPerson, category, contactPerson } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Customer ID is required" });
  }

  try {
    const where = [
      `OINV.CardCode = @customerCode`,
      `OINV.CANCELED <> 'Y' AND OINV.CANCELED <> 'C'`,
      `OINV.U_DispatchDate IS NOT NULL`,
    ];
    const params = [{ name: 'customerCode', type: sql.NVarChar, value: id }];

    if (salesPerson) {
      where.push('OINV.SlpCode = @salesPersonCode');
      params.push({ name: 'salesPersonCode', type: sql.Int, value: parseInt(salesPerson, 10) });
    }
    if (category) {
      where.push('IB.ItmsGrpNam = @category');
      params.push({ name: 'category', type: sql.NVarChar, value: category });
    }
    if (contactPerson) {
      where.push('OINV.CntctCode = @cntctCode');
      params.push({ name: 'cntctCode', type: sql.NVarChar, value: contactPerson });
    }

    const query = `
      SELECT
        FORMAT(OINV.U_DispatchDate, 'MMM-yyyy') AS Month,
        OINV.DocNum AS InvoiceNo,
        OINV.DocDate AS InvoiceDate,
        OINV.U_DispatchDate AS DispatchDate,
        DATEDIFF(DAY, OINV.DocDate, OINV.U_DispatchDate) AS DayDiff,
        INV1.ItemCode AS ItemCode,
        INV1.Dscription AS ItemDescription
      FROM OINV
      INNER JOIN INV1 ON INV1.DocEntry = OINV.DocEntry
      LEFT JOIN OITM T2 ON INV1.ItemCode = T2.ItemCode
      LEFT JOIN OITB IB ON T2.ItmsGrpCod = IB.ItmsGrpCod
      WHERE ${where.join(' AND ')}
      ORDER BY OINV.U_DispatchDate DESC;
    `;

    const rows = await queryDatabase(query, params);

    const data = rows.map((r) => ({
      month: r.Month,
      invoiceNo: r.InvoiceNo,
      invoiceDate: r.InvoiceDate ? r.InvoiceDate.toISOString() : null,
      dispatchDate: r.DispatchDate ? r.DispatchDate.toISOString() : null,
      dayDiff: r.DayDiff,
      itemCode: r.ItemCode,
      itemDescription: r.ItemDescription,
    }));

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching invoice-to-dispatch data:", error);
    res.status(500).json({ error: "Failed to fetch invoice-to-dispatch data" });
  }
}
