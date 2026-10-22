// pages/api/customers/[id]/delivery-performance.js
// Order → Invoice stage of the Order Fulfillment Lifecycle (one of three —
// see also invoice-to-dispatch.js and dispatch-to-delivery.js, and the
// `all-*` siblings of all three for the no-customerId variant). Returns raw
// per-invoice-line rows instead of pre-bucketed month counts: bucketing now
// happens client-side in components/CustomerCharts/ordertodelievery.js
// against a user-configurable set of day-range cutoffs, and the same raw
// rows back the click-through drill-down modal — so there's exactly one
// fetch per stage, not a second round-trip to populate the modal.
//
// Only rows that actually reached an invoice are meaningful here (there's
// no day-diff to bucket for an order that hasn't been invoiced yet), so the
// Delivery/Invoice joins are INNER, not LEFT as the old aggregate query used
// — a deliberate behavior change from the old SLA-percentage version, which
// counted not-yet-invoiced orders in its denominator.
import { queryDatabase } from "../../../../lib/db";
import sql from 'mssql';

export default async function handler(req, res) {
  const { id, salesPerson, category, contactPerson } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Customer ID is required" });
  }

  try {
    const where = [`T0.CardCode = @customerCode`];
    const params = [{ name: 'customerCode', type: sql.NVarChar, value: id }];

    if (salesPerson) {
      where.push('T0.SlpCode = @salesPersonCode');
      params.push({ name: 'salesPersonCode', type: sql.Int, value: parseInt(salesPerson, 10) });
    }
    if (category) {
      where.push('IB.ItmsGrpNam = @category');
      params.push({ name: 'category', type: sql.NVarChar, value: category });
    }
    if (contactPerson) {
      where.push('T0.CntctCode = @cntctCode');
      params.push({ name: 'cntctCode', type: sql.NVarChar, value: contactPerson });
    }

    const query = `
      SELECT
        FORMAT(OINV.DocDate, 'MMM-yyyy') AS Month,
        T0.DocNum AS OrderNo,
        T0.DocDate AS OrderDate,
        OINV.DocNum AS InvoiceNo,
        OINV.DocDate AS InvoiceDate,
        DATEDIFF(DAY, T0.DocDate, OINV.DocDate) AS DayDiff,
        T1.ItemCode AS ItemCode,
        T1.Dscription AS ItemDescription
      FROM ORDR T0
      INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
      INNER JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry AND T1.LineNum = DLN1.BaseLine AND DLN1.BaseType = 17
      INNER JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry AND DLN1.LineNum = INV1.BaseLine AND INV1.BaseType = 15
      INNER JOIN OINV ON INV1.DocEntry = OINV.DocEntry AND OINV.CANCELED <> 'Y' AND OINV.CANCELED <> 'C'
      LEFT JOIN OITM T2 ON T1.ItemCode = T2.ItemCode
      LEFT JOIN OITB IB ON T2.ItmsGrpCod = IB.ItmsGrpCod
      WHERE ${where.join(' AND ')}
      ORDER BY OINV.DocDate DESC;
    `;

    const rows = await queryDatabase(query, params);

    const data = rows.map((r) => ({
      month: r.Month,
      orderNo: r.OrderNo,
      orderDate: r.OrderDate ? r.OrderDate.toISOString() : null,
      invoiceNo: r.InvoiceNo,
      invoiceDate: r.InvoiceDate ? r.InvoiceDate.toISOString() : null,
      dayDiff: r.DayDiff,
      itemCode: r.ItemCode,
      itemDescription: r.ItemDescription,
    }));

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching delivery performance data:", error);
    res.status(500).json({ error: "Failed to fetch delivery performance data" });
  }
}
