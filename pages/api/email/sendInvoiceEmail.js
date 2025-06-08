// pages/api/email/sendInvoiceEmail.js
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";
import { formatDate } from "utils/formatDate";
import { formatNumberWithIndianCommas } from "utils/formatNumberWithIndianCommas";

export default async function handler(req, res) {
  const start = Date.now();

  if (req.method !== "POST") {
    console.error(`[sendInvoiceEmail] Invalid method: ${req.method}`);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { docEntry, docNum } = req.body;
  console.log(
    `[sendInvoiceEmail] Started for DocEntry=${docEntry}, DocNum=${docNum}`
  );

  try {
    // 0) Check if email already sent
    const statusRows = await queryDatabase(
      `SELECT U_EmailSentDT, U_EmailSentTM ,CardCode, CardName 
       FROM OINV 
       WHERE DocNum = @docNum
       
      `,
      [{ name: "docNum", type: sql.Int, value: docNum }]
    );

    const status = statusRows[0] || {};
    // Check if email is disabled based on CardCode
    if (status.CardCode === "C000021" || status.CardCode === "C000020") {
      console.warn(
        `[sendInvoiceEmail] Email sending disabled for: ${status.CardCode} (${status.CardName})`
      );
      return res.status(200).json({
        success: false,
        message: `Email disabled for ${status.CardName || "this customer"}`,
      });
    }
    if (status.U_EmailSentDT || status.U_EmailSentTM) {
      console.log(
        `[sendInvoiceEmail] Already sent at ${status.U_EmailSentDT} / ${status.U_EmailSentTM}`
      );
      return res.status(200).json({
        success: false,
        message: `Email already sent on ${new Date(status.U_EmailSentDT).toLocaleString()}`,
      });
    }

    // 1) Fetch invoice details
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
        SHP.TrnspName            AS TranspportName,
        T0.CardName              AS CustomerName,
        T0.CardCode              AS CustomerCode,
        T7.Name                  AS ContactPerson,
        T0.SlpCode               AS SalesPersonID,
        T5.SlpName               AS SalesPersonName,
        T5.Email                 AS SalesPersonEmail,
        T7.E_MailL               AS ContactPersonEmail,
        T6.PymntGroup            AS PaymentTerms,
        T0.NumAtCard             AS CustomerPONo,
        T1.ItemCode              AS ItemNo,
        T1.Dscription            AS ItemDescription,
        T1.U_CasNo               AS CasNo,
        T1.UnitMsr               AS Unit,
        T1.U_PackSize            AS PackSize,
        T1.Price                 AS UnitSalesPrice,
        T1.Quantity              AS Qty,
        T1.LineTotal             AS TotalSalesPrice,
        T9.E_Mail                AS CustomerEmail
      FROM OINV  T0
      LEFT JOIN OSHP SHP ON T0.TrnspCode = SHP.TrnspCode
      INNER JOIN INV1  T1 ON T1.DocEntry = T0.DocEntry
      LEFT JOIN DLN1  T2 ON T2.DocEntry = T1.BaseEntry AND T2.LineNum = T1.BaseLine AND T1.BaseType = 15
      LEFT JOIN ODLN  T3 ON T3.DocEntry = T2.DocEntry
      LEFT JOIN RDR1  T8 ON T8.DocEntry = T2.BaseEntry AND T8.LineNum = T2.BaseLine AND T2.BaseType = 17
      LEFT JOIN ORDR  T4 ON T4.DocEntry = T8.DocEntry
      INNER JOIN OCRD T9 ON T9.CardCode = T0.CardCode
      LEFT JOIN OCPR  T7 ON T0.CntctCode = T7.CntctCode
      INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      INNER JOIN OCTG T6 ON T0.GroupNum = T6.GroupNum
      WHERE T0.DocNum = @docNum
      ORDER BY T1.LineNum;
    `;

    const rows = await queryDatabase(detailQuery, [
      { name: "docNum", type: sql.Int, value: docNum },
    ]);

    if (!rows.length) {
      throw new Error("No details found for DocNum=" + docNum);
    }

    const {
      InvoiceNo,
      InvoiceDate,
      OrderNo,
      OrderDate,
      CustomerName,
      CustomerEmail,
      ShippingMethod,
      TranspportName,
      CustomerPONo,
      SalesPersonName,
      SalesPersonEmail,
      ContactPersonEmail,
      PaymentTerms,
      TrackingNumber,
      TrackingUpdatedDate,
      DeliveryDate,
    } = rows[0];

    console.log("Contac Person Email", ContactPersonEmail);
    console.log("Sales Person Email", SalesPersonEmail);

    // 2) Validate recipient
    if (!ContactPersonEmail || !ContactPersonEmail.trim()) {
      throw new Error(`Missing Contact Person Email for Invoice ${InvoiceNo}`);
    }

    // 3) Build HTML body
    const bulletsHtml = `
      <ul>
        <li><strong>Carrier name:</strong> ${TranspportName}</li>
        <li><strong>Tracking Number:</strong> ${TrackingNumber || "N/A"} – Dated # ${TrackingUpdatedDate ? formatDate(TrackingUpdatedDate) : "N/A"}</li>
        <li><strong>Estimated Delivery Date:</strong> ${DeliveryDate ? formatDate(DeliveryDate) : "N/A"}</li>
        <li><strong>Our Invoice Number:</strong> ${InvoiceNo}</li>
      </ul>
    `;

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
        <td style="border:1px solid #ccc; padding:4px; text-align:right;">${formatNumberWithIndianCommas(r.UnitSalesPrice)}</td>
        <td style="border:1px solid #ccc; padding:4px; text-align:center;">${r.Qty}</td>
        <td style="border:1px solid #ccc; padding:4px; text-align:right;">${formatNumberWithIndianCommas(r.TotalSalesPrice)}</td>
      </tr>
    `
      )
      .join("");

    const html = `
      <div style="font-family: Arial, sans-serif; line-height:1.4; color:#333;">
        <p>Dear Valued Customer,</p>
        <p>Your order <strong>${CustomerPONo}</strong> has been shipped.</p>
        <p><strong>Here are the tracking details:</strong></p>
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
          If you have any questions or need assistance, please don't hesitate to reach out to us at sales@densitypharmachem.com.
        </p>
        <p>Thank you for your purchase and support!</p>
        <strong>Website: www.densitypharmachem.com</strong><br/><br/>
        DENSITY PHARMACHEM PRIVATE LIMITED<br/>
        Sy No 615/A & 624/2/1, Pudur Village<br/>
        Medchal-Malkajgiri District,<br/>
        Hyderabad, Telangana, India-501401<br/>
      </div>
    `;

    // 4) Send email
    const subject = `Shipment tracking details # order no- ${CustomerPONo}`;
    const emailRes = await fetch(
      `${process.env.API_BASE_URL}/api/email/base_mail`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            from: "sales@densitypharmachem.com",
            to: [ContactPersonEmail],
            cc: [SalesPersonEmail],
        //   from: "prakash@densitypharmachem.com",
        //   to: "chandraprakashyadav1110@gmail.com",
          subject: subject,
          body: html,
        }),
      }
    );

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      throw new Error(`base_mail failed: ${errText}`);
    }

    // 5) Update sent timestamp
    const now = new Date();
    const totalMinutes = now.getHours() * 60 + now.getMinutes();

    await queryDatabase(
      `UPDATE OINV
       SET U_EmailSentDT = GETDATE(),
           U_EmailSentTM = @time
       WHERE DocNum = @docNum`,
      [
        { name: "time", type: sql.SmallInt, value: totalMinutes },
        { name: "docNum", type: sql.Int, value: docNum },
      ]
    );

    console.log(
      `[sendInvoiceEmail] Success for DocNum=${docNum} in ${Date.now() - start}ms`
    );
    return res.status(200).json({
      success: true,
      EmailSentDT: now.toISOString(),
      EmailSentTM: totalMinutes,
    });
  } catch (err) {
    console.error(
      `[sendInvoiceEmail] Uncaught error for DocNum=${docNum}:`,
      err.stack
    );
    return res.status(500).json({ success: false, error: err.message });
  }
}
