// pages/api/email/sendOrderConfirmation.js
import { getOrderDetails } from "../../../lib/models/orders";
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";
import nodemailer from "nodemailer";
import { formatCurrency } from "utils/formatCurrency";
import { formatDate } from "utils/formatDate";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {

        const ordersQuery = `
       SELECT o.DocEntry, o.DocNum, o.CntctCode, o.CreateDate, o.DocTime
  FROM ORDR o
  WHERE o.CANCELED = 'N'
  AND DATEADD(MINUTE, -100, GETDATE()) <= 
      DATEADD(MINUTE, o.DocTime % 100, 
          DATEADD(HOUR, o.DocTime / 100, CAST(o.CreateDate AS DATETIME)))
    `;

   
    const orders = await queryDatabase(ordersQuery);


    if (!orders.length) {
      return res.status(200).json({ message: "No new orders in the last 5 minutes." });
    }

    for (const order of orders) {
      const details = await getOrderDetails(order.DocEntry, order.DocNum);
      if (!details) continue;

      const toEmail = details.Email;
      const SalesPerson_Email = details.SalesPerson_Email
      if (!toEmail) {
        console.warn(`⚠️ No email found for contact: DocEntry=${order.DocEntry}`);
        continue;
      }

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
    <p>Dear ${details.ContactPerson},</p>
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
    <img
      src="http://marketing.densitypharmachem.com/assets/Density_LOGO.jpg"
      alt="Logo"
      style="height: 50px; width: auto; max-width: 200px; display: block; margin-bottom: 10px;"
    /><br/>
    <strong>Website: www.densitypharmachem.com</strong><br/><br/>
    DENSITY PHARMACHEM PRIVATE LIMITED<br/><br/>
    Sy No 615/A & 624/2/1, Pudur Village<br/>
    Medchal-Malkajgiri District,<br/>
    Hyderabad, Telangana, India-501401<br/>
    Mobile : +91-9029298654<br/><br/>
  </div>
`;

      const protocol = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers.host;

      const emailRes = await fetch(
        `${protocol}://${host}/api/email/base_mail`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "prakash@densitypharmachem.com",
            // //   to: toEmail,
            // to: "chandraprakashyadav1110@gmail.com",
            to: SalesPerson_Email,
            cc: ["rama@densitypharmachem.com", "satish@densitypharmachem.com"],
            subject: `Your order ref # ${details.CustomerPONo} our order ref # ${details.DocNum}`,
            body: html,
          }),
        }
      );

     
      const result = await emailRes.json();
      if (!emailRes.ok) throw new Error(result.message || "Failed to send email");

      console.log(`✅ Email sent to ${toEmail} for Order ${details.DocNum}`);
    }

    return res.status(200).json({ success: true, message: "Order confirmation emails sent." });
  } catch (error) {
    console.error("Send Order Mail Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}




{/* <h3>Order Summary</h3>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
      <tr><td style="background-color:#007BFF; color:white;">Order Number</td><td>${details.DocNum}</td></tr>
      <tr><td style="background-color:#007BFF; color:white;">Status</td><td>${details.DocStatusDisplay}</td></tr>
      <tr><td style="background-color:#007BFF; color:white;">Customer</td><td>${details.CardName}</td></tr>
      <tr><td style="background-color:#007BFF; color:white;">Order Date</td><td>${formatDate(details.DocDate)}</td></tr>
      <tr><td style="background-color:#007BFF; color:white;">Delivery Date</td><td>${formatDate(details.DocDueDate)}</td></tr>
      <tr><td style="background-color:#007BFF; color:white;">Total Amount</td><td>${formatCurrency(details.DocTotal)} ${details.DocCur}</td></tr>
      <tr><td style="background-color:#007BFF; color:white;">Sales Employee</td><td>${details.SalesEmployee || "N/A"}</td></tr>
      <tr><td style="background-color:#007BFF; color:white;">Contact Person</td><td>${details.ContactPerson || "N/A"}</td></tr>
    </table> */}