
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";
import { formatNumberWithIndianCommas } from "utils/formatNumberWithIndianCommas";



export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // 1) Find invoices updated in the last 24–48 hours (adjust as needed)
    const recentInvoicesQuery = `
      SELECT 
        DocEntry,
        DocNum                         AS InvoiceNo,
        TrackNo                        AS TrackingNumber,
        U_TrackingNoUpdateDT           AS TrackingUpdatedDate,
        U_TrackingNoUpdateTM           AS TrackingUpdatedTime,
        U_DispatchDate                 AS DispatchDate,
        U_DeliveryDate                 AS DeliveryDate,
        U_EmailSentDT,
        U_EmailSentTM
      FROM OINV
      WHERE
        TrackNo IS NOT NULL
        AND U_TrackingNoUpdateDT IS NOT NULL
        -- If you truly mean “from midnight yesterday onward,” use -1 instead of -2:
        AND CAST(U_TrackingNoUpdateDT AS DATE) = CAST(GETDATE() AS DATE)
        AND U_EmailSentDT IS NULL
        AND U_EmailSentTM IS NULL;
    `;
    const invoices = await queryDatabase(recentInvoicesQuery);

    if (!invoices.length) {
      return res.status(200).json({ message: "No new shipments to notify." });
    }

    let success = 0, failure = 0;

    for (const inv of invoices) {
      const {
        DocEntry,
        InvoiceNo,
        TrackingNumber,
        TrackingUpdatedDate,
        DispatchDate,
        DeliveryDate
      } = inv;

      try {
        // 2) Load full detail for exactly that DocEntry
        // const detailQuery = `
        //   SELECT
        //     -- Header fields
        //     T0.DocNum                AS InvoiceNo,
        //     T0.DocDate               AS InvoiceDate,
        //     T4.DocNum                AS OrderNo,
        //     T4.DocDate               AS OrderDate,
        //     T0.TrackNo               AS TrackingNumber,
        //     T0.U_TrackingNoUpdateDT  AS TrackingUpdatedDate,
        //     T0.U_TrackingNoUpdateTM  AS TrackingUpdatedTime,
        //     T0.U_DispatchDate        AS DispatchDate,
        //     T0.U_DeliveryDate        AS DeliveryDate,
        //     T0.U_AirlineName         AS ShippingMethod,
        //     T0.CardName              AS CustomerName,
        //     T0.CardCode              AS CustomerCode,
        //     T7.Name                  AS ContactPerson,
        //     T0.SlpCode               AS SalesPersonID,
        //     T5.SlpName               AS SalesPersonName,
        //     T5.EMail               AS SalesPersonEmail,
        //     T6.PymntGroup            AS PaymentTerms,
        //     T0.NumAtCard             AS CustomerPONo,

        //     -- Line‐level fields
        //     T1.ItemCode              AS ItemNo,
        //     T1.Dscription            AS ItemDescription,
        //     T1.U_CasNo               AS CasNo,
        //     T1.UnitMsr               AS Unit,
        //     T1.U_PackSize            AS PackSize,
        //     T1.Price                 AS UnitSalesPrice,
        //     T1.Quantity              AS Qty,
        //     T1.LineTotal             AS TotalSalesPrice,

        //     -- Customer email (for “to:”)
        //     T3.EMail               AS CustomerEmail

        //   FROM OINV  T0
        //   INNER JOIN INV1  T1  ON T1.DocEntry   = T0.DocEntry
        //   LEFT JOIN ORDR   T4  ON T1.BaseEntry  = T4.DocEntry
        //   LEFT JOIN OCRD   T3  ON T3.CardCode   = T0.CardCode
        //   LEFT JOIN OCPR   T7  ON T0.CntctCode  = T7.CntctCode
        //   LEFT JOIN OSLP   T5  ON T0.SlpCode    = T5.SlpCode
        //   LEFT JOIN OCTG   T6  ON T0.GroupNum   = T6.GroupNum

        //   WHERE T0.DocEntry = @docEntry
        //   ORDER BY T1.LineNum;
        // `;
        const detailQuery = `
  SELECT
    T0.DocNum                AS InvoiceNo,
    T0.DocDate               AS InvoiceDate,
    T4.DocNum                AS OrderNo,
    T4.DocDate               AS OrderDate,
    T0.TrackNo               AS TrackingNumber,
    T0.U_TrackingNoUpdateDT  AS TrackingUpdatedDate,
    T0.U_DispatchDate        AS DispatchDate,
    T0.U_DeliveryDate        AS DeliveryDate,
    T0.U_AirlineName         AS ShippingMethod,
    T0.CardName              AS CustomerName,
    T0.CardCode              AS CustomerCode,
    T7.Name                  AS ContactPerson,
    T0.SlpCode               AS SalesPersonID,
    T5.SlpName               AS SalesPersonName,
    T5.Email                 AS SalesPersonEmail,   -- adjusted here
    T7.E_MailL               AS ContactPersonEmail,
    T6.PymntGroup            AS PaymentTerms,
    T0.NumAtCard             AS CustomerPONo,

    -- Line‐level fields
    T1.ItemCode              AS ItemNo,
    T1.Dscription            AS ItemDescription,
    T1.U_CasNo               AS CasNo,
    T1.UnitMsr               AS Unit,
    T1.U_PackSize            AS PackSize,
    T1.Price                 AS UnitSalesPrice,
    T1.Quantity              AS Qty,
    T1.LineTotal             AS TotalSalesPrice,

    -- Customer email (for “to:”)
    T3.E_Mail                AS CustomerEmail

  FROM OINV  T0
  INNER JOIN INV1  T1   ON T1.DocEntry   = T0.DocEntry
  LEFT JOIN ORDR   T4   ON T1.BaseEntry  = T4.DocEntry
  LEFT JOIN OCRD   T3   ON T3.CardCode   = T0.CardCode
  LEFT JOIN OCPR   T7   ON T0.CntctCode  = T7.CntctCode
  LEFT JOIN OSLP   T5   ON T0.SlpCode    = T5.SlpCode
  LEFT JOIN OCTG   T6   ON T0.GroupNum   = T6.GroupNum

  WHERE T0.DocEntry = @docEntry
  ORDER BY T1.LineNum;
`;

        const params = [{ name: "docEntry", type: sql.Int, value: DocEntry }];
        const rows = await queryDatabase(detailQuery, params);
        if (!rows.length) {
          throw new Error("No details found for DocEntry=" + DocEntry);
        }

        // 3) Destructure exactly the aliases we defined above
        const {
          InvoiceDate,
          OrderNo,
          OrderDate,
          CustomerName,
          CustomerEmail,
          ShippingMethod,
          CustomerPONo,
          SalesPersonName,
          SalesPersonEmail,
          ContactPersonEmail,
          PaymentTerms
        } = rows[0];

        // --- CONSOLE LOGS for debugging ---
        console.log(`Invoice ${InvoiceNo} → CustomerEmail:`, CustomerEmail);
        console.log(`Invoice ${InvoiceNo} → SalesPersonEmail:`, SalesPersonEmail);
        console.log(
          `Invoice ${InvoiceNo} -> Contact Person Email:`,
          ContactPersonEmail
        );

        // 4) Error‐out if no CustomerEmail is present
        // if (!CustomerEmail) {
        //   throw new Error(`Missing CustomerEmail for Invoice ${InvoiceNo}`);
        // }

        // 5) Build bullet‐list HTML
        const bulletsHtml = `
          <ul>
            <li><strong>Our Order Number:</strong> ${OrderNo} – Dated # ${formatDate(OrderDate)}</li>
            <li><strong>Shipping Method:</strong> ${ShippingMethod}</li>
            <li><strong>Tracking Number:</strong> ${TrackingNumber} – Dated # ${formatDate(TrackingUpdatedDate)}</li>
            <li><strong>Estimated Delivery Date:</strong> ${formatDate(DeliveryDate)}</li>
          </ul>
        `;

        // 6) Build the table‐rows HTML
        const htmlRows = rows
          .map(
            (r) => `
          <tr>
            <td style="border:1px solid #ccc; padding:4px;">${r.InvoiceNo}</td>
            <td style="border:1px solid #ccc; padding:4px;">${formatDate(r.InvoiceDate)}</td>
            <td style="border:1px solid #ccc; padding:4px;">${r.ItemNo}</td>
            <td style="border:1px solid #ccc; padding:4px;">${r.ItemDescription}</td>
            <td style="border:1px solid #ccc; padding:4px;">${r.CasNo || ""}</td>
            <td style="border:1px solid #ccc; padding:4px;">${r.Unit}</td>
            <td style="border:1px solid #ccc; padding:4px;">${r.PackSize || ""}</td>
            <td style="border:1px solid #ccc; padding:4px; text-align:right;">
              ${formatNumberWithIndianCommas(r.UnitSalesPrice)}
            </td>
            <td style="border:1px solid #ccc; padding:4px; text-align:center;">
              ${r.Qty}
            </td>
            <td style="border:1px solid #ccc; padding:4px; text-align:right;">
              ${formatNumberWithIndianCommas(r.TotalSalesPrice)}
            </td>
          </tr>
        `
          )
          .join("");

        // 7) Wrap the HTML email body
        const html = `
          <div style="font-family: Arial, sans-serif; line-height:1.4; color:#333;">
            <p>Dear Valued Customer,</p>

            <p>Your order <strong>${CustomerPONo}</strong> has been shipped.</p>

            <p><strong>Here are the details:</strong></p>
            ${bulletsHtml}

            <p><strong>Items Shipped:</strong></p>
            <table style="border-collapse:collapse; width:100%; margin-top:8px; margin-bottom:16px;">
              <thead>
                <tr style="background:#f7f7f7;">
                  <th style="border:1px solid #ccc; padding:6px; text-align:left;">Inv#</th>
                  <th style="border:1px solid #ccc; padding:6px; text-align:left;">INV Date</th>
                  <th style="border:1px solid #ccc; padding:6px; text-align:left;">Item No.</th>
                  <th style="border:1px solid #ccc; padding:6px; text-align:left;">Item/Service Description</th>
                  <th style="border:1px solid #ccc; padding:6px; text-align:left;">CAS No.</th>
                  <th style="border:1px solid #ccc; padding:6px; text-align:left;">Unit</th>
                  <th style="border:1px solid #ccc; padding:6px; text-align:left;">Packsize</th>
                  <th style="border:1px solid #ccc; padding:6px; text-align:right;">Unit Sales Price</th>
                  <th style="border:1px solid #ccc; padding:6px; text-align:center;">QTY</th>
                  <th style="border:1px solid #ccc; padding:6px; text-align:right;">Total Sales Price</th>
                </tr>
              </thead>
              <tbody>
                ${htmlRows}
              </tbody>
            </table>

            <p>
              If you have any questions or need assistance, please don’t hesitate to reach out to us at 
              <a href="mailto:sales@densitypharmachem.com">sales@densitypharmachem.com</a>.
            </p>

            <p>Thank you for your purchase and support!</p>

            <strong>Website: www.densitypharmachem.com</strong><br/><br/>
                        DENSITY PHARMACHEM PRIVATE LIMITED<br/>
                        Sy No 615/A & 624/2/1, Pudur Village<br/>
                        Medchal-Malkajgiri District,<br/>
                        Hyderabad, Telangana, India-501401<br/>
          </div>
        `;

        // 8) Send the email (to = CustomerEmail, cc = SalesPersonEmail)
        const subject = `Your Order has Shipped! Your Tracking Info- ${CustomerPONo}`;
        const sendRes = await fetch(
          `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}/api/email/base_mail`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              // from:    "prakash@densitypharmachem.com",
              // to:      ["chandraprakashyadav1110@gmail.com"],
              
              from: "sales@densitypharmachem.com",
              to: [SalesPersonEmail],
              cc: ["chandraprakashyadav1110@gmail.com"],
              subject: subject,
              body: html,
            }),
          }
        );
        if (!sendRes.ok) {
          const errText = await sendRes.text();
          throw new Error(`base_mail failed: ${errText}`);
        }

        // 9) Mark invoice as emailed
        const now = new Date();
        const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
        await queryDatabase(
          `
            UPDATE OINV
              SET U_EmailSentDT = GETDATE(),
                  U_EmailSentTM = @tm
            WHERE DocEntry = @docEntry
          `,
          [
            { name: "tm",       type: sql.SmallInt, value: minutesSinceMidnight },
            { name: "docEntry", type: sql.Int,       value: DocEntry }
          ]
        );

        success++;
      } catch (err) {
        console.error(`Invoice ${InvoiceNo} failed:`, err);
        failure++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Notified ${success} shipments, ${failure} failures.`
    });
  } catch (err) {
    console.error("sendShipmentNotification error:", err);
    return res.status(500).json({ error: err.message });
  }
}
