
// pages/api/email/sendOrderEmail.js

import { getOrderDetails } from "../../../lib/models/orders";
import { queryDatabase }    from "../../../lib/db";
import sql                   from "mssql";

import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";

export default async function handler(req, res) {

  const start = Date.now();

  if (req.method !== "POST") {
    console.error(`[sendOrderEmail] Invalid method: ${req.method}`);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { docEntry, docNum } = req.body;
  console.log(`[sendOrderEmail] Started for DocEntry=${docEntry}, DocNum=${docNum}`);

  try {
    // 0) Check existing send timestamp
    const statusRows = await queryDatabase(
      `SELECT U_EmailSentDT, U_EmailSentTM 
         FROM ORDR 
        WHERE DocEntry = @docEntry`,
      [{ name: "docEntry", type: sql.Int, value: docEntry }]
    );

    const status = statusRows[0] || {};
    if (status.U_EmailSentDT != null || status.U_EmailSentTM != null) {
      console.log(
        `[sendOrderEmail] Already sent at ${status.U_EmailSentDT} / ${status.U_EmailSentTM}`
      );
      return res.status(200).json({
        success: false,
        message: `Email already sent on ${new Date(status.U_EmailSentDT).toLocaleString()}`,
      });
    }
    
    // 1) Fetch order details
    const details = await getOrderDetails(docEntry, docNum);
    if (!details) {
      console.error(`[sendOrderEmail] Order not found: DocEntry=${docEntry}`);
      return res.status(404).json({ error: "Order not found" });
    }

    // 2) Validate recipient
    const toEmail = details.Email;
    if (!toEmail) {
      console.warn(
        `[sendOrderEmail] No email address for DocEntry=${docEntry}`
      );
      return res.status(400).json({ error: "No email for this order" });
    }

    // 3) Build HTML body (same as before)…
    const lineItems = details.LineItems.map(
      (item) => `
      <tr>
        <td>${item.ItemCode}</td>
        <td>${item.Description}</td>
        <td>${item.U_CasNo || "N/A"}</td>
        <td>${item.Quantity}</td>
        <td>${item.UnitMsr}</td>
        <td>${formatCurrency(item.Price)}</td>
        <td>${formatCurrency(item.LineTotal)}</td>
        <td>${item.StockStatus}</td>
        <td>${formatDate(item.ShipDate)}</td>
      </tr>
    `
    ).join("");

    const html = `
              <div style="font-family: Arial, sans-serif;">
                <p>Dear Valued Customer,</p>
                <p>We are pleased to confirm your order <strong>${details.CustomerPONo}</strong> placed on <strong>${formatDate(details.DocDate)}</strong> our order ref# ${details.DocNum} dated ${formatDate(details.DocDate)}</p>
                <p><strong>Order Summary:</strong></p>
                <table border="1" cellpadding="6" cellspacing="0"  style="border-collapse: collapse;">
                  <thead style="background-color: #007BFF; color: white;">
                    <tr>
                      <th>Item Code</th><th>Description</th><th>CAS No.</th><th>Qty</th><th>Unit</th>
                      <th>Price</th><th>Line Total</th><th>Stock</th><th>Delivery Date</th>
                    </tr>
                  </thead>
                  <tbody>${lineItems}</tbody>
                </table>
                <br/>
                <p><strong>Billing Address:</strong> ${details.BillToAddress || "N/A"}</p>
    
                <p><strong>Payment Terms:</strong> ${details.PaymentTerms || "N/A"}</p>
    
                <p>Should you have any inquiries or require further assistance, please do not hesitate to contact our customer service team at sales@densitypharmachem.com<br/><br>
    
                Thank you for your patronage. We greatly appreciate your business and look forward to serving you again.</p><br/>
    
                <p><Strong>Yours Sincerely,<br/></Strong></p>
                <p>${details.SalesEmployee}</p>
                
                <strong>Website: www.densitypharmachem.com</strong><br/><br/>
                DENSITY PHARMACHEM PRIVATE LIMITED<br/><br/>
                Sy No 615/A & 624/2/1, Pudur Village<br/>
                Medchal-Malkajgiri District,<br/>
                Hyderabad, Telangana, India-501401<br/>
                
              </div>
          `;

    // 4) Send via base_mail
    let emailResult;
    try {
      const emailRes = await fetch(
        `${process.env.API_BASE_URL}/api/email/base_mail`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // from:    "sales@densitypharmachem.com",
            // to:      [details.SalesPerson_Email],
            from: "prakash@densitypharmachem.com",
            to: ["chandraprakashyadav1110@gmail.com"],

            subject: `Your order ref # ${details.CustomerPONo} our order ref # ${details.DocNum}`,
            body: html,
          }),
        }
      );
      const text = await emailRes.text();
      if (!emailRes.ok) {
        console.error(
          `[sendOrderEmail] base_mail FAILED ${emailRes.status}: ${text}`
        );
        throw new Error(`base_mail error ${emailRes.status}`);
      }
      emailResult = JSON.parse(text);
    } catch (fetchErr) {
      console.error(
        `[sendOrderEmail] fetch to base_mail error for DocEntry=${docEntry}:`,
        fetchErr.stack
      );
      return res.status(502).json({ error: "Failed to send email" });
    }

    // 5) Update the ORDR table
    const now = new Date();
    const totalMinutes = now.getHours() * 60 + now.getMinutes();
    const updateSQL = `
      UPDATE ORDR
         SET U_EmailSentDT = GETDATE(),
             U_EmailSentTM = @time
       WHERE DocEntry     = @docEntry
    `;
    console.log(`[sendOrderEmail] Running SQL:\n${updateSQL}`);

    await queryDatabase(updateSQL, [
      { name: "time", type: sql.SmallInt, value: totalMinutes },
      { name: "docEntry", type: sql.Int, value: docEntry },
    ]);

    console.log(
      `[sendOrderEmail] Success for DocEntry=${docEntry} in ${Date.now() - start}ms`
    );
    return res.status(200).json({
      success: true,
      EmailSentDT: now.toISOString(),
      EmailSentTM: totalMinutes,
    });
  } catch (err) {
    console.error(`[sendOrderEmail] Uncaught error for DocEntry=${docEntry}:`, err.stack);
    return res.status(500).json({ success: false, error: err.message });
  }
}
