// pages/api/customers/[id]/dispatch-to-delivery.js
// Dispatch → Delivery stage of the Order Fulfillment Lifecycle — see
// [id]/delivery-performance.js's header comment for the shared
// raw-row/client-side-bucketing architecture. U_DeliveryDate is only set by
// a manual warehouse backfill (pages/api/bluedart/update-delivery-date.js)
// — it is NOT populated automatically the way U_DispatchDate is, so this
// stage will return far fewer rows than the other two until more invoices
// get a delivery date recorded. That's expected, not a bug.
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
      `OINV.U_DeliveryDate IS NOT NULL`,
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
        FORMAT(OINV.U_DeliveryDate, 'MMM-yyyy') AS Month,
        OINV.DocNum AS InvoiceNo,
        OINV.U_DispatchDate AS DispatchDate,
        OINV.U_DeliveryDate AS DeliveryDate,
        DATEDIFF(DAY, OINV.U_DispatchDate, OINV.U_DeliveryDate) AS DayDiff,
        INV1.ItemCode AS ItemCode,
        INV1.Dscription AS ItemDescription,
        IB.ItmsGrpNam AS Category,
        SP.SlpName AS SalesPerson,
        OINV.CardName AS Customer,
        CP.Name AS ContactPerson
      FROM OINV
      INNER JOIN INV1 ON INV1.DocEntry = OINV.DocEntry
      LEFT JOIN OITM T2 ON INV1.ItemCode = T2.ItemCode
      LEFT JOIN OITB IB ON T2.ItmsGrpCod = IB.ItmsGrpCod
      LEFT JOIN OSLP SP ON SP.SlpCode = OINV.SlpCode
      LEFT JOIN OCPR CP ON CP.CntctCode = OINV.CntctCode AND CP.CardCode = OINV.CardCode
      WHERE ${where.join(' AND ')}
      ORDER BY OINV.U_DeliveryDate DESC;
    `;

    const rows = await queryDatabase(query, params);

    const data = rows.map((r) => ({
      month: r.Month,
      invoiceNo: r.InvoiceNo,
      dispatchDate: r.DispatchDate ? r.DispatchDate.toISOString() : null,
      deliveryDate: r.DeliveryDate ? r.DeliveryDate.toISOString() : null,
      dayDiff: r.DayDiff,
      itemCode: r.ItemCode,
      itemDescription: r.ItemDescription,
      category: r.Category,
      salesPerson: r.SalesPerson,
      customer: r.Customer,
      contactPerson: r.ContactPerson,
    }));

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching dispatch-to-delivery data:", error);
    res.status(500).json({ error: "Failed to fetch dispatch-to-delivery data" });
  }
}
